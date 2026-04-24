// ============================================================
// Edge Function: mp-webhook
// ============================================================
// Recebe notificações do Mercado Pago e atualiza o status do
// pedido no banco. Princípios:
//
//   1) Valida assinatura HMAC antes de qualquer ação (anti-spoofing).
//   2) NUNCA confia no payload do webhook como "verdade" — sempre
//      busca o pagamento na API do MP usando o id recebido.
//   3) Salva o payload bruto em orders.payment_payload para auditoria.
//   4) Idempotente: receber a mesma notificação duas vezes não
//      duplica nada.
//
// Tipos de notificação suportados:
//   • payment        (mais comum, dispara em cada mudança de status)
//   • merchant_order (resumo agregado de uma preferência)
// ============================================================
import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { adminClient } from '../_shared/auth.ts';
import { fetchPayment, getMode, mapPaymentStatus, verifyWebhookSignature } from '../_shared/mercadopago.ts';
import { sendOrderPaidEmail } from '../_shared/email.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  // MP às vezes faz GET de health check; responder 200 evita retries.
  if (req.method === 'GET') return jsonResponse({ ok: true });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  // Lê o corpo (mesmo que vazio) e os parâmetros de query.
  // MP envia tanto via body quanto via query: ?type=payment&data.id=12345
  const url = new URL(req.url);
  const queryType = url.searchParams.get('type') || url.searchParams.get('topic');
  const queryDataId = url.searchParams.get('data.id') || url.searchParams.get('id');

  let bodyJson: Record<string, unknown> = {};
  try { bodyJson = await req.json(); } catch { /* body opcional */ }

  const type = (bodyJson.type as string) || queryType;
  const bodyDataId = ((bodyJson.data as { id?: string } | undefined)?.id);
  // Para assinatura, MP usa o data.id da URL. Para buscar o payment, qualquer
  // um serve (devem ser iguais).
  const dataId = bodyDataId || queryDataId;
  const dataIdForSignature = queryDataId || bodyDataId;

  console.log('[mp-webhook] recebido', {
    method: req.method,
    url_path: url.pathname + url.search,
    queryType, queryDataId,
    bodyType: bodyJson.type, bodyDataId,
  });

  if (!dataId) {
    return jsonResponse({ error: 'data.id ausente' }, 400);
  }

  // Ignora tipos que não processamos (merchant_order usa IPN legado sem
  // assinatura; topics antigos idem). Retorna 200 para o MP não retentar.
  // Assinatura só é exigida em notificações 'payment' do webhook moderno.
  if (type !== 'payment') {
    console.log('[mp-webhook] type ignorado (sem validacao de assinatura)', { type, dataId });
    return jsonResponse({ ok: true, ignored: true, type });
  }

  // Validação de assinatura (anti-spoofing) — somente para payment.
  // Em MP_MODE=test aceita mesmo sem assinatura válida (sandbox = dinheiro
  // falso; facilita debug). Em MP_MODE=production exigência é estrita.
  const valid = await verifyWebhookSignature(req, String(dataIdForSignature));
  if (!valid) {
    if (getMode() === 'test') {
      console.warn('[mp-webhook] assinatura invalida em test mode — prosseguindo');
    } else {
      return jsonResponse({ error: 'Assinatura inválida' }, 401);
    }
  }

  let payment;
  try {
    payment = await fetchPayment(String(dataId));
  } catch (e) {
    const msg = (e as Error).message || '';
    // 404 = payment não existe (simulator com ID fake, ou payment deletado).
    // Retornamos 200 pro MP não ficar retentando indefinidamente.
    if (msg.includes('(404)') || msg.toLowerCase().includes('not found')) {
      console.log('[mp-webhook] payment nao encontrado, ignorando', { dataId, msg });
      return jsonResponse({ ok: true, ignored: true, reason: 'payment_not_found', dataId });
    }
    console.error('[mp-webhook] falha ao buscar pagamento', e);
    return jsonResponse({ error: msg }, 500);
  }

  const orderId = payment.external_reference;
  if (!orderId) {
    console.warn('mp-webhook: payment sem external_reference, payment_id=', dataId);
    return jsonResponse({ ok: true, warning: 'sem external_reference' });
  }

  const db = adminClient();

  const { data: order, error: oErr } = await db
    .from('orders')
    .select('id, status, total_cents')
    .eq('id', orderId)
    .maybeSingle();
  if (oErr) return jsonResponse({ error: oErr.message }, 500);
  if (!order) return jsonResponse({ error: 'order não encontrado' }, 404);

  const newStatus = mapPaymentStatus(payment.status);

  // Idempotência: se já está no status alvo e o payment_external_id bate, não faz nada.
  if (order.status === newStatus) {
    return jsonResponse({ ok: true, noop: true, status: newStatus });
  }

  // Sanity check: valor do MP precisa bater com o total esperado.
  // Tolerância de 1 centavo para diferenças de arredondamento.
  const expectedReais = order.total_cents / 100;
  if (Math.abs(payment.transaction_amount - expectedReais) > 0.01 && newStatus === 'paid') {
    console.error(`mp-webhook: VALOR DIVERGENTE — esperado ${expectedReais} recebido ${payment.transaction_amount} (order ${orderId})`);
    // Marca como pending + admin_notes para investigação manual em vez de aceitar.
    await db
      .from('orders')
      .update({
        admin_notes: `[ALERTA] valor divergente do MP: esperado R$${expectedReais.toFixed(2)}, recebido R$${payment.transaction_amount.toFixed(2)}, payment_id=${payment.id}`,
        payment_payload: payment,
      })
      .eq('id', orderId);
    return jsonResponse({ ok: false, error: 'valor divergente' }, 400);
  }

  const update: Record<string, unknown> = {
    status: newStatus,
    payment_provider: 'mercadopago',
    payment_external_id: String(payment.id),
    payment_method: payment.payment_type_id,
    payment_payload: payment,
  };

  const { error: uErr } = await db.from('orders').update(update).eq('id', orderId);
  if (uErr) return jsonResponse({ error: uErr.message }, 500);

  // Dispara email de confirmação quando passa de algo-nao-pago → paid.
  // Fire-and-forget: não bloqueia a resposta ao MP nem falha o webhook
  // se o email não puder ser enviado (Resend fora do ar, etc.).
  if (newStatus === 'paid' && order.status !== 'paid') {
    sendPaidEmailFor(db, orderId).catch((e) => {
      console.error('[mp-webhook] email falhou (nao-fatal)', e);
    });
  }

  return jsonResponse({
    ok: true,
    order_id: orderId,
    new_status: newStatus,
    payment_id: payment.id,
  });
});

// ------------------------------------------------------------
// Email de confirmação após status=paid.
// Busca pedido completo + user email e dispara via Resend.
// ------------------------------------------------------------
async function sendPaidEmailFor(
  db: ReturnType<typeof adminClient>,
  orderId: string,
): Promise<void> {
  const { data: full, error } = await db
    .from('orders')
    .select('id, order_number, user_id, total_cents, currency, payment_method, paid_at, shipping_address')
    .eq('id', orderId)
    .maybeSingle();
  if (error || !full) {
    console.warn('[mp-webhook email] pedido nao encontrado', { orderId, error });
    return;
  }

  const { data: items } = await db
    .from('order_items')
    .select('product_name, product_unit, qty, unit_price_cents, line_total_cents')
    .eq('order_id', orderId);

  // Email do cliente: pega de auth.users via admin API (RLS não permite
  // SELECT em auth.users direto, usamos o admin SDK).
  const { data: userRes, error: userErr } = await db.auth.admin.getUserById(full.user_id);
  if (userErr || !userRes?.user?.email) {
    console.warn('[mp-webhook email] user sem email', { userId: full.user_id, userErr });
    return;
  }

  // Nome do cliente do user_profiles (fallback: shipping_address.name)
  const { data: profile } = await db
    .from('user_profiles')
    .select('display_name')
    .eq('id', full.user_id)
    .maybeSingle();
  const addr = full.shipping_address as Record<string, string> | null;
  const customerName = profile?.display_name || addr?.name || null;

  await sendOrderPaidEmail({
    to: userRes.user.email,
    order_number: full.order_number || full.id,
    customer_name: customerName,
    total_cents: full.total_cents,
    currency: full.currency || 'BRL',
    payment_method: full.payment_method,
    paid_at: full.paid_at,
    items: items || [],
    shipping_address: addr,
  });
}

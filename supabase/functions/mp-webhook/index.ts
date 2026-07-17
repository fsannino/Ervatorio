// ============================================================
// Edge Function: mp-webhook
// ============================================================
// Recebe notificações do Mercado Pago e atualiza o status do
// pedido no banco. Princípios:
//
//   1) Valida assinatura HMAC antes de qualquer ação (anti-spoofing).
//      O body é capturado BRUTO (await req.text()) antes de qualquer
//      parse, para que a verificação possa testar a hipótese de
//      assinatura sobre os bytes exatos (WEBHOOK_SIGNATURE_DEBT.md).
//      Modo estrito (padrão em produção, ou MP_WEBHOOK_STRICT=true):
//      assinatura inválida → 401 e nada é processado.
//   2) NUNCA confia no payload do webhook como "verdade" — sempre
//      busca o pagamento na API do MP usando o id recebido.
//   3) Salva o payload bruto em orders.payment_payload para auditoria.
//   4) Idempotente: receber a mesma notificação duas vezes não
//      duplica nada.
//
// Diagnóstico de assinatura: via logs estruturados da função
// (console). A antiga tabela de debug mp_webhook_log foi removida
// (Onda 1.4) — ela gravava headers/body de requisições NÃO
// autenticadas no banco (vetor de write-amplification).
//
// Tipos de notificação suportados:
//   • payment        (mais comum, dispara em cada mudança de status)
//   • merchant_order (resumo agregado de uma preferência)
// ============================================================
import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { adminClient } from '../_shared/auth.ts';
import {
  fetchPayment,
  isStrictSignatureMode,
  mapPaymentStatus,
  verifyWebhookSignature,
} from '../_shared/mercadopago.ts';
import { sendOrderPaidEmail } from '../_shared/email.ts';
import { clientIp, rateLimitAllow, tooManyRequests } from '../_shared/ratelimit.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  // MP às vezes faz GET de health check; responder 200 evita retries.
  if (req.method === 'GET') return jsonResponse({ ok: true });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  // Anti-abuso volumétrico: endpoint é público (verify_jwt=false).
  // Limite folgado para não derrubar rajadas legítimas de retry do MP.
  if (!(await rateLimitAllow(`mp-webhook:${clientIp(req)}`, { windowSeconds: 60, max: 120 }))) {
    return tooManyRequests();
  }

  const url = new URL(req.url);
  const queryType = url.searchParams.get('type') || url.searchParams.get('topic');
  const queryDataId = url.searchParams.get('data.id') || url.searchParams.get('id');

  // Body BRUTO primeiro (bytes exatos para o HMAC), parse depois.
  let rawBody = '';
  try { rawBody = await req.text(); } catch { /* body opcional */ }

  let bodyJson: Record<string, unknown> = {};
  if (rawBody) {
    try { bodyJson = JSON.parse(rawBody); } catch { /* body não-JSON */ }
  }

  const type = (bodyJson.type as string) || queryType;
  const bodyDataId = ((bodyJson.data as { id?: string } | undefined)?.id);
  const dataId = bodyDataId || queryDataId;
  const dataIdForSignature = queryDataId || bodyDataId;

  console.log('[mp-webhook] recebido', {
    method: req.method, url: url.pathname + url.search,
    queryType, queryDataId, bodyType: bodyJson.type, bodyDataId,
    rawBodyLen: rawBody.length,
  });

  if (!dataId) return jsonResponse({ error: 'data.id ausente' }, 400);

  // Ignora tipos que não processamos (merchant_order usa IPN legado sem
  // assinatura). Retorna 200 para o MP não retentar.
  if (type !== 'payment') {
    console.log('[mp-webhook] type ignorado', { type, dataId });
    return jsonResponse({ ok: true, ignored: true, type });
  }

  // ── Validação de assinatura ─────────────────────────────────
  const sigResult = await verifyWebhookSignature(req, String(dataIdForSignature), rawBody);

  if (!sigResult.valid) {
    if (isStrictSignatureMode()) {
      console.warn('[mp-webhook] assinatura invalida em modo estrito → 401', {
        secret_configured: sigResult.secret_configured,
        request_id: sigResult.request_id,
      });
      return jsonResponse({ error: 'Assinatura inválida' }, 401);
    }
    // Modo relaxado (test): prossegue, protegido pelas camadas 2–4
    // (fetchPayment autenticado, external_reference, sanity de valor,
    // idempotência). Ver WEBHOOK_SIGNATURE_DEBT.md.
    console.warn('[mp-webhook] assinatura invalida em modo relaxado — prosseguindo');
  }

  let payment;
  try {
    payment = await fetchPayment(String(dataId));
  } catch (e) {
    const msg = (e as Error).message || '';
    if (msg.includes('(404)') || msg.toLowerCase().includes('not found')) {
      console.log('[mp-webhook] payment nao encontrado, ignorando', { dataId, msg });
      return jsonResponse({ ok: true, ignored: true, reason: 'payment_not_found', dataId });
    }
    console.error('[mp-webhook] falha ao buscar pagamento', e);
    return jsonResponse({ error: msg }, 500);
  }

  const orderId = payment.external_reference;
  if (!orderId) {
    console.warn('[mp-webhook] payment sem external_reference', { payment_id: dataId });
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

  if (order.status === newStatus) {
    return jsonResponse({ ok: true, noop: true, status: newStatus });
  }

  const expectedReais = order.total_cents / 100;
  if (Math.abs(payment.transaction_amount - expectedReais) > 0.01 && newStatus === 'paid') {
    console.error(`[mp-webhook] VALOR DIVERGENTE — esperado ${expectedReais} recebido ${payment.transaction_amount}`);
    await db
      .from('orders')
      .update({
        admin_notes: `[ALERTA] valor divergente: esperado R$${expectedReais.toFixed(2)}, recebido R$${payment.transaction_amount.toFixed(2)}, payment_id=${payment.id}`,
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

  if (newStatus === 'paid' && order.status !== 'paid') {
    sendPaidEmailFor(db, orderId).catch((e) => {
      console.error('[mp-webhook] email falhou (nao-fatal)', e);
    });
  }

  return jsonResponse({ ok: true, order_id: orderId, new_status: newStatus, payment_id: payment.id });
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
    .select('id, order_number, user_id, guest_email, total_cents, currency, payment_method, paid_at, shipping_address')
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

  const addr = full.shipping_address as Record<string, string> | null;
  let toEmail: string | null = null;
  let customerName: string | null = addr?.name || null;

  if (full.user_id) {
    // Pedido de conta: email vem de auth.users via admin SDK.
    const { data: userRes, error: userErr } = await db.auth.admin.getUserById(full.user_id);
    if (userErr || !userRes?.user?.email) {
      console.warn('[mp-webhook email] user sem email', { userId: full.user_id, userErr });
      return;
    }
    toEmail = userRes.user.email;
    const { data: profile } = await db
      .from('user_profiles')
      .select('display_name')
      .eq('id', full.user_id)
      .maybeSingle();
    customerName = profile?.display_name || customerName;
  } else {
    // Pedido guest (Onda 6.3): email informado no checkout.
    toEmail = full.guest_email || null;
  }
  if (!toEmail) {
    console.warn('[mp-webhook email] pedido sem destinatario', { orderId });
    return;
  }

  await sendOrderPaidEmail({
    to: toEmail,
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

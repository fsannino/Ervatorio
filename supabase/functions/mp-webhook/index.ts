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

  const url = new URL(req.url);
  const queryType = url.searchParams.get('type') || url.searchParams.get('topic');
  const queryDataId = url.searchParams.get('data.id') || url.searchParams.get('id');

  // Lê headers em um objeto plain para logging.
  const headersObj: Record<string, string> = {};
  req.headers.forEach((v, k) => { headersObj[k] = v; });

  let bodyJson: Record<string, unknown> = {};
  try { bodyJson = await req.json(); } catch { /* body opcional */ }

  const type = (bodyJson.type as string) || queryType;
  const bodyDataId = ((bodyJson.data as { id?: string } | undefined)?.id);
  const dataId = bodyDataId || queryDataId;
  const dataIdForSignature = queryDataId || bodyDataId;

  // ── Registro no log de debug (tabela mp_webhook_log) ─────
  // Usado para diagnosticar diferenças de assinatura HMAC.
  // Acessível apenas para admin via RLS.
  const dbgDb = adminClient();
  const logId = crypto.randomUUID();
  const logBase = {
    id: logId,
    method: req.method,
    url: url.pathname + url.search,
    query_type: queryType,
    data_id: dataId,
    headers: headersObj,
    body: bodyJson,
  };

  console.log('[mp-webhook] recebido', {
    method: req.method, url: url.pathname + url.search,
    queryType, queryDataId, bodyType: bodyJson.type, bodyDataId,
  });

  if (!dataId) {
    await logWebhook(dbgDb, { ...logBase, response_status: 400, response_body: { error: 'data.id ausente' } });
    return jsonResponse({ error: 'data.id ausente' }, 400);
  }

  // Ignora tipos que não processamos (merchant_order usa IPN legado sem
  // assinatura). Retorna 200 para o MP não retentar.
  if (type !== 'payment') {
    console.log('[mp-webhook] type ignorado', { type, dataId });
    await logWebhook(dbgDb, {
      ...logBase,
      response_status: 200,
      response_body: { ok: true, ignored: true, type },
    });
    return jsonResponse({ ok: true, ignored: true, type });
  }

  // Validação de assinatura — coleta diagnóstico completo.
  const sigResult = await verifyWebhookSignature(req, String(dataIdForSignature));
  const sigLog = {
    signature_received: sigResult.signature_header,
    request_id: sigResult.request_id,
    ts_received: sigResult.ts,
    v1_received: sigResult.v1,
    secret_configured: sigResult.secret_configured,
    secret_length: sigResult.secret_length,
    secret_is_hex: sigResult.secret_is_hex,
    manifests_tested: sigResult.manifests_tested,
    hashes_computed: sigResult.hashes_computed,
    signature_valid: sigResult.valid,
  };

  if (!sigResult.valid) {
    if (getMode() === 'test') {
      console.warn('[mp-webhook] assinatura invalida em test mode — prosseguindo');
    } else {
      await logWebhook(dbgDb, {
        ...logBase, ...sigLog,
        response_status: 401, response_body: { error: 'Assinatura inválida' },
      });
      return jsonResponse({ error: 'Assinatura inválida' }, 401);
    }
  }

  let payment;
  try {
    payment = await fetchPayment(String(dataId));
  } catch (e) {
    const msg = (e as Error).message || '';
    if (msg.includes('(404)') || msg.toLowerCase().includes('not found')) {
      console.log('[mp-webhook] payment nao encontrado, ignorando', { dataId, msg });
      await logWebhook(dbgDb, { ...logBase, ...sigLog, response_status: 200, response_body: { ok: true, reason: 'payment_not_found' } });
      return jsonResponse({ ok: true, ignored: true, reason: 'payment_not_found', dataId });
    }
    console.error('[mp-webhook] falha ao buscar pagamento', e);
    await logWebhook(dbgDb, { ...logBase, ...sigLog, response_status: 500, response_body: { error: msg } });
    return jsonResponse({ error: msg }, 500);
  }

  const orderId = payment.external_reference;
  if (!orderId) {
    console.warn('[mp-webhook] payment sem external_reference', { payment_id: dataId });
    await logWebhook(dbgDb, { ...logBase, ...sigLog, response_status: 200, response_body: { warning: 'sem external_reference' } });
    return jsonResponse({ ok: true, warning: 'sem external_reference' });
  }

  const db = adminClient();
  const logBaseWithOrder = { ...logBase, ...sigLog, order_id: orderId };

  const { data: order, error: oErr } = await db
    .from('orders')
    .select('id, status, total_cents')
    .eq('id', orderId)
    .maybeSingle();
  if (oErr) {
    await logWebhook(dbgDb, { ...logBaseWithOrder, response_status: 500, response_body: { error: oErr.message } });
    return jsonResponse({ error: oErr.message }, 500);
  }
  if (!order) {
    await logWebhook(dbgDb, { ...logBaseWithOrder, response_status: 404, response_body: { error: 'order não encontrado' } });
    return jsonResponse({ error: 'order não encontrado' }, 404);
  }

  const newStatus = mapPaymentStatus(payment.status);

  if (order.status === newStatus) {
    await logWebhook(dbgDb, { ...logBaseWithOrder, response_status: 200, response_body: { ok: true, noop: true, status: newStatus } });
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
    await logWebhook(dbgDb, { ...logBaseWithOrder, response_status: 400, response_body: { error: 'valor divergente' } });
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
  if (uErr) {
    await logWebhook(dbgDb, { ...logBaseWithOrder, response_status: 500, response_body: { error: uErr.message } });
    return jsonResponse({ error: uErr.message }, 500);
  }

  if (newStatus === 'paid' && order.status !== 'paid') {
    sendPaidEmailFor(db, orderId).catch((e) => {
      console.error('[mp-webhook] email falhou (nao-fatal)', e);
    });
  }

  const responseBody = { ok: true, order_id: orderId, new_status: newStatus, payment_id: payment.id };
  await logWebhook(dbgDb, { ...logBaseWithOrder, response_status: 200, response_body: responseBody });
  return jsonResponse(responseBody);
});

// ------------------------------------------------------------
// Log de cada invocação para diagnosticar assinatura HMAC.
// Falhas de insert são não-fatais — só logam warning.
// ------------------------------------------------------------
async function logWebhook(
  db: ReturnType<typeof adminClient>,
  row: Record<string, unknown>,
): Promise<void> {
  try {
    const { error } = await db.from('mp_webhook_log').insert(row);
    if (error) console.warn('[mp-webhook] falha ao gravar log', error.message);
  } catch (e) {
    console.warn('[mp-webhook] exception ao gravar log', e);
  }
}

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

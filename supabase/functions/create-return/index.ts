// Solicitação de troca/devolução (Onda 8.2).
// O SERVIDOR é a autoridade: valida posse do pedido, status retornável e
// o prazo de 7 dias do CDC (a partir da entrega). O cliente logado só
// dispara a intenção — nunca escreve direto em order_returns (RLS bloqueia).
import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { getUserFromRequest, adminClient } from '../_shared/auth.ts';
import { rateLimitAllow, tooManyRequests } from '../_shared/ratelimit.ts';

// Pedido precisa ter sido pago para permitir troca/devolução.
const RETURNABLE_STATUS = ['paid', 'processing', 'shipped', 'delivered'];
const CDC_WINDOW_DAYS = 7;
// Uma solicitação já "viva" bloqueia abrir outra para o mesmo pedido.
const ACTIVE_RETURN_STATUS = ['solicitada', 'em_analise', 'aprovada'];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ReturnPayload {
  action: 'create' | 'cancel';
  order_id?: string;
  tipo?: 'devolucao' | 'troca';
  motivo?: string;
  return_id?: string;
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const caller = await getUserFromRequest(req);
  if (!caller) return jsonResponse({ error: 'Unauthorized' }, 401);

  if (!(await rateLimitAllow(`create-return:${caller.id}`, { windowSeconds: 60, max: 10 }))) {
    return tooManyRequests();
  }

  let body: ReturnPayload;
  try { body = await req.json(); }
  catch { return jsonResponse({ error: 'Invalid JSON body' }, 400); }

  const db = adminClient();

  if (body.action === 'cancel') return cancelReturn(db, caller.id, body.return_id);
  if (body.action === 'create') return createReturn(db, caller.id, body);
  return jsonResponse({ error: 'Ação inválida' }, 400);
});

async function createReturn(db: ReturnType<typeof adminClient>, userId: string, body: ReturnPayload) {
  if (!UUID_RE.test(String(body.order_id ?? ''))) {
    return jsonResponse({ error: 'Pedido inválido' }, 400);
  }
  if (body.tipo !== 'devolucao' && body.tipo !== 'troca') {
    return jsonResponse({ error: 'Informe o tipo (devolução ou troca)' }, 400);
  }
  const motivo = String(body.motivo ?? '').trim();
  if (motivo.length < 5 || motivo.length > 1000) {
    return jsonResponse({ error: 'Descreva o motivo (5 a 1000 caracteres)' }, 400);
  }

  const { data: order, error: oErr } = await db
    .from('orders')
    .select('id, user_id, status, delivered_at')
    .eq('id', body.order_id)
    .maybeSingle();
  if (oErr) return jsonResponse({ error: oErr.message }, 500);
  if (!order || order.user_id !== userId) return jsonResponse({ error: 'Pedido não encontrado' }, 404);

  if (!RETURNABLE_STATUS.includes(order.status)) {
    return jsonResponse({ error: 'Este pedido não está elegível para troca/devolução.' }, 400);
  }
  // Prazo CDC: 7 dias a partir da entrega. Sem data de entrega (ainda a
  // caminho), a solicitação é permitida.
  if (order.delivered_at) {
    const deadline = new Date(order.delivered_at).getTime() + CDC_WINDOW_DAYS * 86400000;
    if (Date.now() > deadline) {
      return jsonResponse({ error: `Prazo de ${CDC_WINDOW_DAYS} dias para solicitação expirado.` }, 400);
    }
  }

  const { data: existing, error: eErr } = await db
    .from('order_returns')
    .select('id, status')
    .eq('order_id', body.order_id)
    .in('status', ACTIVE_RETURN_STATUS)
    .maybeSingle();
  if (eErr) return jsonResponse({ error: eErr.message }, 500);
  if (existing) return jsonResponse({ error: 'Já existe uma solicitação em andamento para este pedido.' }, 409);

  const { data: created, error: cErr } = await db
    .from('order_returns')
    .insert({ order_id: body.order_id, user_id: userId, tipo: body.tipo, motivo })
    .select('id, status')
    .single();
  if (cErr) return jsonResponse({ error: cErr.message }, 500);

  return jsonResponse({ ok: true, return_id: created.id, status: created.status });
}

async function cancelReturn(db: ReturnType<typeof adminClient>, userId: string, returnId?: string) {
  if (!UUID_RE.test(String(returnId ?? ''))) return jsonResponse({ error: 'Solicitação inválida' }, 400);

  const { data: ret, error } = await db
    .from('order_returns')
    .select('id, user_id, status')
    .eq('id', returnId)
    .maybeSingle();
  if (error) return jsonResponse({ error: error.message }, 500);
  if (!ret || ret.user_id !== userId) return jsonResponse({ error: 'Solicitação não encontrada' }, 404);
  if (ret.status !== 'solicitada' && ret.status !== 'em_analise') {
    return jsonResponse({ error: 'Esta solicitação não pode mais ser cancelada.' }, 400);
  }

  const { error: uErr } = await db
    .from('order_returns')
    .update({ status: 'cancelada' })
    .eq('id', returnId);
  if (uErr) return jsonResponse({ error: uErr.message }, 500);

  return jsonResponse({ ok: true, status: 'cancelada' });
}

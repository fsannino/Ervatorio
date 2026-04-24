// Cria um pedido a partir do carrinho do cliente.
// O SERVIDOR é a autoridade de preço: nunca confiar no total enviado pelo
// cliente. Esta função recalcula tudo olhando admin_products, aplica regras
// de estoque e retorna o pedido com status 'pending'. O pagamento é iniciado
// em um segundo passo (ex.: função separada que chama Mercado Pago).
import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { getUserFromRequest, adminClient } from '../_shared/auth.ts';

interface CartItem { product_id: string; qty: number; }
interface OrderPayload {
  items: CartItem[];
  shipping_address: {
    name: string;
    phone?: string;
    zip: string;
    street: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city: string;
    state: string;
    country?: string;
  };
  notes?: string;
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const caller = await getUserFromRequest(req);
  if (!caller) return jsonResponse({ error: 'Unauthorized' }, 401);

  let body: OrderPayload;
  try { body = await req.json(); }
  catch { return jsonResponse({ error: 'Invalid JSON body' }, 400); }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return jsonResponse({ error: 'Carrinho vazio' }, 400);
  }
  const addr = body.shipping_address;
  if (!addr?.name || !addr?.zip || !addr?.street || !addr?.city || !addr?.state) {
    return jsonResponse({ error: 'Endereço de entrega incompleto' }, 400);
  }

  const db = adminClient();

  const productIds = [...new Set(body.items.map((i) => i.product_id))];
  const { data: products, error: pErr } = await db
    .from('admin_products')
    .select('id, name, price, unit, stock, active')
    .in('id', productIds);
  if (pErr) return jsonResponse({ error: pErr.message }, 500);

  const byId = new Map((products || []).map((p) => [p.id, p]));
  const lines: Array<Record<string, unknown>> = [];
  let subtotalCents = 0;

  for (const item of body.items) {
    const p = byId.get(item.product_id);
    if (!p || !p.active) {
      return jsonResponse({ error: `Produto indisponível: ${item.product_id}` }, 400);
    }
    if (p.stock === 'out') {
      return jsonResponse({ error: `Produto esgotado: ${p.name}` }, 400);
    }
    const qty = Math.max(1, Math.min(999, Math.floor(Number(item.qty) || 0)));
    const unitCents = Math.round(Number(p.price) * 100);
    const lineTotal = unitCents * qty;
    subtotalCents += lineTotal;
    lines.push({
      product_id: p.id,
      product_name: p.name,
      product_unit: p.unit,
      qty,
      unit_price_cents: unitCents,
      line_total_cents: lineTotal,
    });
  }

  // Frete ainda será calculado em uma função separada (Correios / Melhor Envio).
  const shippingCents = 0;
  const totalCents = subtotalCents + shippingCents;

  const { data: order, error: oErr } = await db
    .from('orders')
    .insert({
      user_id: caller.id,
      status: 'pending',
      subtotal_cents: subtotalCents,
      shipping_cents: shippingCents,
      total_cents: totalCents,
      currency: 'BRL',
      shipping_address: addr,
      notes: body.notes || null,
    })
    .select('id')
    .single();
  if (oErr) return jsonResponse({ error: oErr.message }, 500);

  const itemsWithOrderId = lines.map((l) => ({ ...l, order_id: order.id }));
  const { error: iErr } = await db.from('order_items').insert(itemsWithOrderId);
  if (iErr) return jsonResponse({ error: iErr.message }, 500);

  return jsonResponse({
    ok: true,
    order_id: order.id,
    subtotal_cents: subtotalCents,
    shipping_cents: shippingCents,
    total_cents: totalCents,
    currency: 'BRL',
  });
});

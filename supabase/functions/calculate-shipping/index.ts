// Cotação de frete para o carrinho (Onda 6.4).
// Público (verify_jwt=false): é só uma cotação, sem dado sensível.
// O SERVIDOR resolve peso e preço a partir de admin_products — o cliente
// manda apenas product_id + qty + CEP. Rate-limit por IP contra abuso.
import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { adminClient } from '../_shared/auth.ts';
import { clientIp, rateLimitAllow, tooManyRequests } from '../_shared/ratelimit.ts';
import { isValidCep, shippingOptions, type ShipmentItem } from '../_shared/shipping.ts';

interface QuoteItem { product_id: string; qty: number; }
interface QuotePayload { items: QuoteItem[]; zip: string; }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  // Kill-switch: sem o cálculo ligado, o cliente mantém o comportamento antigo.
  if ((Deno.env.get('SHIPPING_ENABLED') || 'false').toLowerCase() !== 'true') {
    return jsonResponse({ enabled: false, options: [] });
  }

  if (!(await rateLimitAllow(`calc-shipping:ip:${clientIp(req)}`, { windowSeconds: 60, max: 30 }))) {
    return tooManyRequests();
  }

  let body: QuotePayload;
  try { body = await req.json(); }
  catch { return jsonResponse({ error: 'Invalid JSON body' }, 400); }

  if (!isValidCep(body.zip)) return jsonResponse({ error: 'CEP inválido' }, 400);
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return jsonResponse({ error: 'Carrinho vazio' }, 400);
  }

  const ids = [...new Set(body.items.map((i) => String(i.product_id ?? '')))];
  if (ids.some((id) => !UUID_RE.test(id))) {
    return jsonResponse({ error: 'Produto inválido no carrinho' }, 400);
  }

  const db = adminClient();
  const { data: products, error } = await db
    .from('admin_products')
    .select('id, price, weight_grams, active')
    .in('id', ids);
  if (error) return jsonResponse({ error: error.message }, 500);

  const byId = new Map((products || []).map((p) => [p.id, p]));
  const items: ShipmentItem[] = [];
  for (const it of body.items) {
    const p = byId.get(it.product_id);
    if (!p || !p.active) continue; // ignora item indisponível para a cotação
    items.push({
      weightGrams: Number(p.weight_grams) || 100,
      qty: Math.max(1, Math.min(999, Math.floor(Number(it.qty) || 0))),
      priceCents: Math.round(Number(p.price) * 100),
    });
  }
  if (items.length === 0) return jsonResponse({ enabled: true, options: [] });

  const options = await shippingOptions(
    body.zip,
    items,
    (k) => Deno.env.get(k),
    (e) => console.warn('[calculate-shipping] provider fallback:', String(e)),
  );

  return jsonResponse({ enabled: true, options });
});

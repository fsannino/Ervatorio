// Cabeçalhos CORS compartilhados por todas as Edge Functions do Ervatório.
//
// Origem permitida vem do secret ALLOWED_ORIGIN (ex.:
// https://ervatorio.com.br). Sem ele configurado, mantém '*'
// (compatibilidade com previews) — configure em produção.
// Nota: nenhuma function usa cookies/credenciais; o CORS aqui é
// defesa em profundidade, a autorização real é o JWT + RLS.
const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || '*';

export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
  ...(ALLOWED_ORIGIN !== '*' ? { 'Vary': 'Origin' } : {}),
};

export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  return null;
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

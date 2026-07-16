// ============================================================
// Rate limiting básico para Edge Functions (Onda 1.5, backlog #69)
// ============================================================
// Janela fixa por chave (user id ou IP), contada no Postgres via
// RPC rate_limit_hit (migration 20260716120400). Fail-open: se o
// contador estiver indisponível, a request passa com warning —
// rate limit é proteção anti-abuso, não controle de acesso.
// ============================================================
import { adminClient } from './auth.ts';

export interface RateLimitOptions {
  windowSeconds?: number; // janela (default 60s)
  max?: number;           // requisições permitidas na janela (default 30)
}

/** true = permitido; false = estourou o limite (responda 429). */
export async function rateLimitAllow(key: string, opts: RateLimitOptions = {}): Promise<boolean> {
  const windowSeconds = opts.windowSeconds ?? 60;
  const max = opts.max ?? 30;
  try {
    const db = adminClient();
    const { data, error } = await db.rpc('rate_limit_hit', {
      p_key: key,
      p_window_seconds: windowSeconds,
      p_max: max,
    });
    if (error) {
      console.warn('[ratelimit] contador indisponível — fail-open', error.message);
      return true;
    }
    return data === true;
  } catch (e) {
    console.warn('[ratelimit] exception — fail-open', e);
    return true;
  }
}

/** Melhor esforço de IP do cliente atrás do gateway. */
export function clientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('cf-connecting-ip') ||
    'unknown'
  );
}

export function tooManyRequests(): Response {
  return new Response(JSON.stringify({ error: 'Muitas requisições. Tente novamente em instantes.' }), {
    status: 429,
    headers: { 'Content-Type': 'application/json', 'Retry-After': '60' },
  });
}

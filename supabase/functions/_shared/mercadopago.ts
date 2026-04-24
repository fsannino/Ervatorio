// ============================================================
// Helper compartilhado — Mercado Pago
// ============================================================
// Centraliza:
//   • Escolha de credencial (TEST ou PROD) baseada em MP_MODE
//   • Chamadas à API REST do Mercado Pago
//   • Validação de assinatura de webhook (HMAC SHA256)
//
// Variáveis de ambiente esperadas no projeto Supabase:
//   MP_MODE                 = 'test' | 'production'   (default: 'test')
//   MP_ACCESS_TOKEN_TEST    = TEST-...                 (sandbox)
//   MP_ACCESS_TOKEN_PROD    = APP_USR-...              (produção)
//   MP_WEBHOOK_SECRET       = secret de assinatura do webhook MP
//   MP_NOTIFICATION_URL     = URL pública da função mp-webhook
//   MP_RETURN_URL_BASE      = ex.: https://ervatorio.com.br
// ============================================================

export type MPMode = 'test' | 'production';

export function getMode(): MPMode {
  const m = (Deno.env.get('MP_MODE') || 'test').toLowerCase();
  return m === 'production' ? 'production' : 'test';
}

export function getAccessToken(): string {
  const mode = getMode();
  const key = mode === 'production' ? 'MP_ACCESS_TOKEN_PROD' : 'MP_ACCESS_TOKEN_TEST';
  const token = Deno.env.get(key);
  if (!token) {
    throw new Error(`${key} não configurado nas Edge Functions secrets`);
  }
  return token;
}

const MP_API = 'https://api.mercadopago.com';

export interface MPPreferenceItem {
  id?: string;
  title: string;
  description?: string;
  quantity: number;
  unit_price: number;            // em REAIS, não centavos (API do MP usa reais)
  currency_id?: string;
}

export interface MPCreatePreferenceInput {
  external_reference: string;     // nosso order_id
  items: MPPreferenceItem[];
  payer?: {
    name?: string;
    email?: string;
    phone?: { area_code?: string; number?: string };
    address?: {
      zip_code?: string;
      street_name?: string;
      street_number?: string;
    };
  };
  back_urls: {
    success: string;
    failure: string;
    pending: string;
  };
  notification_url: string;
  statement_descriptor?: string;
  metadata?: Record<string, unknown>;
}

export interface MPPreferenceResponse {
  id: string;
  init_point: string;             // URL de checkout (prod)
  sandbox_init_point: string;     // URL de checkout (test)
  client_id?: string;
  collector_id?: number;
  date_created?: string;
}

export async function createPreference(input: MPCreatePreferenceInput): Promise<MPPreferenceResponse> {
  const token = getAccessToken();
  const res = await fetch(`${MP_API}/checkout/preferences`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(`MP createPreference falhou (${res.status}): ${JSON.stringify(body)}`);
  }
  return body as MPPreferenceResponse;
}

export interface MPPayment {
  id: number;
  status: 'pending' | 'approved' | 'authorized' | 'in_process' | 'in_mediation' | 'rejected' | 'cancelled' | 'refunded' | 'charged_back';
  status_detail: string;
  external_reference: string | null;
  payment_method_id: string;
  payment_type_id: string;
  transaction_amount: number;
  date_approved: string | null;
  date_created: string;
  payer: { email?: string; identification?: { type: string; number: string } };
  metadata?: Record<string, unknown>;
}

export async function fetchPayment(paymentId: string | number): Promise<MPPayment> {
  const token = getAccessToken();
  const res = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(`MP fetchPayment falhou (${res.status}): ${JSON.stringify(body)}`);
  }
  return body as MPPayment;
}

// Mapeia status MP → status do nosso schema (order_status enum)
export function mapPaymentStatus(mpStatus: MPPayment['status']): string {
  switch (mpStatus) {
    case 'approved':
    case 'authorized':
      return 'paid';
    case 'pending':
    case 'in_process':
    case 'in_mediation':
      return 'pending';
    case 'rejected':
    case 'cancelled':
      return 'failed';
    case 'refunded':
    case 'charged_back':
      return 'refunded';
    default:
      return 'pending';
  }
}

// ============================================================
// Validação de assinatura do webhook
// ----------------------------------------------------------------
// MP envia headers: x-signature (com ts e v1) + x-request-id
// Documentação: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
// Manifest assinado: id:<data.id>;request-id:<x-request-id>;ts:<ts>;
// HMAC SHA256 com MP_WEBHOOK_SECRET, comparado com o valor "v1=..."
// ============================================================
export async function verifyWebhookSignature(
  req: Request,
  dataId: string,
): Promise<boolean> {
  const secret = Deno.env.get('MP_WEBHOOK_SECRET');
  if (!secret) {
    // Em ambiente de teste sem secret configurado, deixa passar mas avisa.
    console.warn('MP_WEBHOOK_SECRET não configurado — assinatura NÃO validada');
    return true;
  }

  const signatureHeader = req.headers.get('x-signature');
  const requestId = req.headers.get('x-request-id');
  if (!signatureHeader || !requestId) return false;

  // x-signature: "ts=1234567890,v1=hexhash"
  const parts = Object.fromEntries(
    signatureHeader.split(',').map((p) => {
      const [k, v] = p.trim().split('=');
      return [k, v];
    }),
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(manifest));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Comparação constante para evitar timing attack
  if (hex.length !== v1.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ v1.charCodeAt(i);
  return diff === 0;
}

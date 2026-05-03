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
  auto_return?: 'approved' | 'all';
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
export interface SignatureVerifyResult {
  valid: boolean;
  secret_configured: boolean;
  secret_length: number;
  secret_is_hex: boolean;
  signature_header: string | null;
  request_id: string | null;
  ts: string | null;
  v1: string | null;
  data_id_used: string;
  manifests_tested: string[];
  hashes_computed: Array<{ manifest: string; variant: string; hash: string }>;
  matched_variant?: string;
  matched_manifest?: string;
}

export async function verifyWebhookSignature(
  req: Request,
  dataId: string,
): Promise<SignatureVerifyResult> {
  const secret = Deno.env.get('MP_WEBHOOK_SECRET');
  const signatureHeader = req.headers.get('x-signature');
  const requestId = req.headers.get('x-request-id');

  const base: SignatureVerifyResult = {
    valid: false,
    secret_configured: !!secret,
    secret_length: secret?.length || 0,
    secret_is_hex: !!secret && /^[0-9a-f]+$/i.test(secret) && secret.length % 2 === 0,
    signature_header: signatureHeader,
    request_id: requestId,
    ts: null,
    v1: null,
    data_id_used: String(dataId),
    manifests_tested: [],
    hashes_computed: [],
  };

  if (!secret) {
    console.warn('MP_WEBHOOK_SECRET não configurado — assinatura NÃO validada');
    base.valid = true; // retorna valid=true mas marca secret_configured=false pro log
    return base;
  }

  if (!signatureHeader || !requestId) {
    console.warn('[mp-signature] headers ausentes', { signatureHeader, requestId });
    return base;
  }

  // x-signature: "ts=1234567890,v1=hexhash"
  const parts = Object.fromEntries(
    signatureHeader.split(',').map((p) => {
      const [k, v] = p.trim().split('=');
      return [k, v];
    }),
  );
  base.ts = parts.ts || null;
  base.v1 = parts.v1 || null;

  if (!base.ts || !base.v1) {
    console.warn('[mp-signature] ts/v1 ausente', { parts });
    return base;
  }

  // Testa várias combinações de manifest (formato) × secret (encoding).
  const dataIdLower = String(dataId).toLowerCase();
  const dataIdOriginal = String(dataId);
  const manifests = [
    `id:${dataIdLower};request-id:${requestId};ts:${base.ts};`,
    `id:${dataIdOriginal};request-id:${requestId};ts:${base.ts};`,
    `id:${dataIdLower};request-id:${requestId};ts:${base.ts}`,      // sem ; final
    `id:${dataIdOriginal};request-id:${requestId};ts:${base.ts}`,
  ];
  base.manifests_tested = manifests;

  const enc = new TextEncoder();
  const secretVariants: Array<{ name: string; bytes: Uint8Array }> = [
    { name: 'utf8', bytes: enc.encode(secret) },
  ];
  if (base.secret_is_hex) {
    const hexBytes = new Uint8Array(secret.length / 2);
    for (let i = 0; i < hexBytes.length; i++) {
      hexBytes[i] = parseInt(secret.substr(i * 2, 2), 16);
    }
    secretVariants.push({ name: 'hex-decoded', bytes: hexBytes });
  }

  for (const sv of secretVariants) {
    const key = await crypto.subtle.importKey(
      'raw', sv.bytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
    );
    for (const manifest of manifests) {
      const sig = await crypto.subtle.sign('HMAC', key, enc.encode(manifest));
      const hash = Array.from(new Uint8Array(sig))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      base.hashes_computed.push({ manifest, variant: sv.name, hash });
      if (hash === base.v1) {
        base.valid = true;
        base.matched_variant = sv.name;
        base.matched_manifest = manifest;
        console.log('[mp-signature] ok', { variant: sv.name });
        return base;
      }
    }
  }

  console.warn('[mp-signature] NAO BATEU', {
    secret_len: base.secret_length,
    is_hex: base.secret_is_hex,
    data_id: base.data_id_used,
    request_id: base.request_id,
    ts: base.ts,
    v1_prefix: base.v1?.slice(0, 12) + '...',
    testedN: base.hashes_computed.length,
  });
  return base;
}

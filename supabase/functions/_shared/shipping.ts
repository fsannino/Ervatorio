// ============================================================
// Cotação de frete — fonte única (Onda 6.4)
// ------------------------------------------------------------
// Usada por DUAS funções: `calculate-shipping` (mostra opções ao
// cliente) e `create-order` (revalida a opção escolhida no servidor).
// Regra de ouro: o PREÇO do frete é sempre recalculado aqui, no
// servidor — o cliente só devolve a CHAVE da opção que viu.
//
// Fase atual: tabela fixa por região × faixa de peso (liga sem
// dependência externa). Melhor Envio fica pronto atrás de flag
// (SHIPPING_PROVIDER=melhor_envio), para ativar quando a conta e o
// token existirem.
// ============================================================

export interface ShipmentItem {
  weightGrams: number;
  qty: number;
  priceCents: number; // valor unitário — usado para seguro (Melhor Envio) e frete grátis
}

export interface ShippingOption {
  key: string; // identificador estável que o cliente devolve na criação do pedido
  carrier: string; // ex.: "Correios", "Jadlog", "Ervatório"
  service: string; // ex.: "PAC", "SEDEX", "Padrão"
  priceCents: number;
  etaDays: number; // prazo estimado (dias úteis), limite superior
}

// ── Regiões de destino (aproximação pelo 1º dígito do CEP) ──────────
// Não é um mapa UF-perfeito, mas suficiente para uma tabela fixa. O
// Melhor Envio substitui por cotação real quando ativado.
type Region = 'SE' | 'S' | 'CO' | 'NE' | 'N';

const REGION_BY_FIRST_DIGIT: Record<string, Region> = {
  '0': 'SE', '1': 'SE', '2': 'SE', '3': 'SE',
  '4': 'NE', '5': 'NE',
  '6': 'N',
  '7': 'CO',
  '8': 'S', '9': 'S',
};

const REGION_LABEL: Record<Region, string> = {
  SE: 'Sudeste', S: 'Sul', CO: 'Centro-Oeste', NE: 'Nordeste', N: 'Norte',
};

// ── Faixas de peso (gramas). Índice usado na tabela de preços. ──────
const WEIGHT_TIERS_GRAMS = [500, 1000, 2000, 5000, Number.POSITIVE_INFINITY];

// ── Tabela fixa: preço (centavos) por região × faixa de peso + prazo.
// Valores são um ponto de partida razoável; ajuste conforme a
// operação real (ou ative o Melhor Envio para cotação exata).
const FIXED_TABLE: Record<Region, { etaDays: number; pricesCents: number[] }> = {
  SE: { etaDays: 5, pricesCents: [1990, 2490, 2990, 3990, 5490] },
  S: { etaDays: 7, pricesCents: [2490, 2990, 3490, 4490, 5990] },
  CO: { etaDays: 8, pricesCents: [2990, 3490, 3990, 4990, 6490] },
  NE: { etaDays: 10, pricesCents: [3490, 3990, 4490, 5490, 6990] },
  N: { etaDays: 12, pricesCents: [3990, 4490, 4990, 5990, 7490] },
};

export function normalizeCep(zip: string): string {
  return String(zip || '').replace(/\D/g, '');
}

export function isValidCep(zip: string): boolean {
  return normalizeCep(zip).length === 8;
}

function regionFromCep(zip: string): Region {
  return REGION_BY_FIRST_DIGIT[normalizeCep(zip)[0]] ?? 'SE';
}

function weightTierIndex(totalGrams: number): number {
  return WEIGHT_TIERS_GRAMS.findIndex((limit) => totalGrams <= limit);
}

export function totalWeightGrams(items: ShipmentItem[]): number {
  return items.reduce((sum, i) => sum + i.weightGrams * i.qty, 0);
}

function subtotalCents(items: ShipmentItem[]): number {
  return items.reduce((sum, i) => sum + i.priceCents * i.qty, 0);
}

// ── Frete grátis acima de um limite (opcional, desligado por default) ──
function freeShippingThresholdCents(env: EnvReader): number {
  return Math.max(0, Number(env('SHIPPING_FREE_ABOVE_CENTS') || 0));
}

function freeOption(): ShippingOption {
  return { key: 'free', carrier: 'Ervatório', service: 'Frete grátis', priceCents: 0, etaDays: 7 };
}

// ── Fase 1: tabela fixa ─────────────────────────────────────────────
function fixedOptions(zip: string, items: ShipmentItem[]): ShippingOption[] {
  const region = regionFromCep(zip);
  const tier = weightTierIndex(totalWeightGrams(items));
  const { etaDays, pricesCents } = FIXED_TABLE[region];
  return [{
    key: `fixed:${region}:${tier}`,
    carrier: 'Correios',
    service: `Padrão (${REGION_LABEL[region]})`,
    priceCents: pricesCents[tier],
    etaDays,
  }];
}

// ── Fase 2: Melhor Envio (atrás de flag) ────────────────────────────
// Dimensões: só temos peso, então usamos dimensões-padrão mínimas de
// pacote. O Melhor Envio devolve várias transportadoras; normalizamos.
const DEFAULT_BOX_CM = { width: 16, height: 4, length: 20 };
const ME_PROD_URL = 'https://melhorenvio.com.br/api/v2/me/shipment/calculate';
const ME_SANDBOX_URL = 'https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate';

async function melhorEnvioOptions(
  zip: string,
  items: ShipmentItem[],
  env: EnvReader,
): Promise<ShippingOption[]> {
  const token = env('MELHOR_ENVIO_TOKEN');
  const origin = normalizeCep(env('SHIPPING_ORIGIN_CEP') || '');
  if (!token || origin.length !== 8) {
    throw new Error('Melhor Envio não configurado (MELHOR_ENVIO_TOKEN / SHIPPING_ORIGIN_CEP)');
  }
  const url = (env('MELHOR_ENVIO_SANDBOX') || 'false').toLowerCase() === 'true'
    ? ME_SANDBOX_URL : ME_PROD_URL;

  const products = items.map((i, idx) => ({
    id: String(idx),
    width: DEFAULT_BOX_CM.width,
    height: DEFAULT_BOX_CM.height,
    length: DEFAULT_BOX_CM.length,
    weight: +(i.weightGrams / 1000).toFixed(3), // kg
    insurance_value: +(i.priceCents / 100).toFixed(2),
    quantity: i.qty,
  }));

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Ervatorio (contato@ervatorio.com.br)',
    },
    body: JSON.stringify({ from: { postal_code: origin }, to: { postal_code: normalizeCep(zip) }, products }),
  });
  if (!resp.ok) throw new Error(`Melhor Envio HTTP ${resp.status}`);

  const data = await resp.json() as MelhorEnvioService[];
  return (Array.isArray(data) ? data : [])
    .filter((s) => !s.error && s.price)
    .map((s) => ({
      key: `me:${s.id}`,
      carrier: s.company?.name || 'Transportadora',
      service: s.name,
      priceCents: Math.round(Number(s.price) * 100),
      etaDays: Number(s.delivery_time) || 0,
    }));
}

interface MelhorEnvioService {
  id: number | string;
  name: string;
  price?: string | number;
  delivery_time?: number;
  error?: string;
  company?: { name?: string };
}

// ── Dispatcher público ──────────────────────────────────────────────
export interface EnvReader { (key: string): string | undefined }

// Retorna as opções de frete para o carrinho + CEP. Aplica frete grátis
// quando o limite é atingido. Nunca lança para o cliente: se o Melhor
// Envio falhar, cai para a tabela fixa (registrado no log do chamador).
export async function shippingOptions(
  zip: string,
  items: ShipmentItem[],
  env: EnvReader,
  onProviderError?: (e: unknown) => void,
): Promise<ShippingOption[]> {
  if (!isValidCep(zip) || items.length === 0) return [];

  if (subtotalCents(items) >= freeShippingThresholdCents(env) && freeShippingThresholdCents(env) > 0) {
    return [freeOption()];
  }

  const provider = (env('SHIPPING_PROVIDER') || 'fixed').toLowerCase();
  if (provider === 'melhor_envio') {
    try {
      const opts = await melhorEnvioOptions(zip, items, env);
      if (opts.length > 0) return opts;
    } catch (e) {
      onProviderError?.(e); // fallback silencioso para tabela fixa
    }
  }
  return fixedOptions(zip, items);
}

// Revalida no servidor a opção escolhida pelo cliente e devolve o preço
// AUTORITATIVO. Retorna null se a chave não corresponder a nenhuma opção
// válida para aquele carrinho/CEP (cliente adulterou ou expirou).
export async function resolveChosenOption(
  zip: string,
  items: ShipmentItem[],
  chosenKey: string,
  env: EnvReader,
  onProviderError?: (e: unknown) => void,
): Promise<ShippingOption | null> {
  const opts = await shippingOptions(zip, items, env, onProviderError);
  return opts.find((o) => o.key === chosenKey) ?? null;
}

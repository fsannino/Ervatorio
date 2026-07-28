// ============================================================
// ERVATÓRIO — Configuração central
// ============================================================
// Fonte única para URL + chave publicável do Supabase.
// A "publishable key" (sb_publishable_...) É projetada para
// ficar exposta no frontend — a segurança real vem das RLS
// policies do banco. Nunca cole uma chave service_role aqui.
//
// Para rotacionar a chave: troque o valor abaixo e redeploy.
// Para usar por ambiente, injete via CI antes do deploy:
//   sed -i "s|__SUPABASE_URL__|$URL|" js/config.js
// ============================================================

window.ERVATORIO_CONFIG = Object.freeze({
  SUPABASE_URL: 'https://ejarqinmjlgbqzurctsf.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_8Qq-srtpqZgEYwaXsthHfQ_MhIJKYcj',
  // Base das Edge Functions. Em produção aponta para o mesmo projeto.
  FUNCTIONS_URL: 'https://ejarqinmjlgbqzurctsf.supabase.co/functions/v1',
  // Feature flag: false esconde o botao de checkout e mostra aviso de
  // manutencao no carrinho. Virar para true quando o Mercado Pago liberar
  // a conta de producao (chamado aberto em XX/XX/2026).
  PAYMENTS_ENABLED: false,
  PAYMENTS_DISABLED_MSG: 'Pagamentos em manutenção — voltaremos em breve',
  // Feature flag (Onda 1.6): exige segundo fator TOTP para acessar o
  // painel admin. Requer MFA/TOTP habilitado em Supabase Auth.
  // false = rollback de emergência (só login+senha, como antes).
  ADMIN_MFA_REQUIRED: true,
  // Onda 6.1: produtos is_test na vitrine pública. false em produção;
  // true apenas em staging/QA para conferir dados de teste.
  SHOW_TEST_PRODUCTS: false,
  // Onda 6.3: checkout como convidado (sem conta). false = volta a
  // exigir login (kill-switch; espelhado no secret GUEST_CHECKOUT
  // das Edge Functions).
  GUEST_CHECKOUT: true,
  // Onda 6.4: cálculo de frete no checkout. Default false = mantém o
  // comportamento de piloto ("frete grátis"). Virar true DEPOIS de
  // configurar os secrets da Edge Function (SHIPPING_ENABLED=true e,
  // se for usar cotação real, SHIPPING_PROVIDER/ORIGIN_CEP/token).
  // O servidor tem o seu próprio SHIPPING_ENABLED — ambos precisam
  // estar ligados para o frete valer. Ver docs/runbooks/frete.md.
  SHIPPING_ENABLED: false,
  // Onda 3: IDs de medição. VAZIO = tracking desligado (no-op).
  // Preencher ao criar as contas; js/analytics.js só carrega os
  // scripts após consentimento (js/consent.js / Consent Mode v2).
  ANALYTICS: {
    GTM_ID: '',        // ex.: 'GTM-XXXXXXX' (preferido — gerencia GA4/Pixel por dentro)
    GA4_ID: '',        // ex.: 'G-XXXXXXXXXX' (usado só se GTM_ID vazio)
    CLARITY_ID: '',    // ex.: 'abcdefghij'
    META_PIXEL_ID: '', // ex.: '1234567890' (requer consentimento de marketing)
  },
});

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
  SUPABASE_URL: 'https://lwzrzztzpklzbmxbqcrx.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_bZGiaIhD7KqZ5QffyrHwRA_g7fmRT25',
  // Base das Edge Functions. Em produção aponta para o mesmo projeto.
  FUNCTIONS_URL: 'https://lwzrzztzpklzbmxbqcrx.supabase.co/functions/v1',
  // Feature flag: false esconde o botao de checkout e mostra aviso de
  // manutencao no carrinho. Virar para true quando o Mercado Pago liberar
  // a conta de producao (chamado aberto em XX/XX/2026).
  PAYMENTS_ENABLED: false,
  PAYMENTS_DISABLED_MSG: 'Pagamentos em manutenção — voltaremos em breve',
});

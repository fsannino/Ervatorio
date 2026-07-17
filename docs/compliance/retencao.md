# Política de Retenção de Dados — Ervatório (Onda 2.3)

Referência operacional interna. A versão pública resumida está em `privacidade.html` (seção 6). Revisar com o(a) advogado(a) junto com as páginas legais.

## Tabela de retenção

| Dado | Onde vive | Retenção | Ao fim do prazo / exclusão de conta |
|---|---|---|---|
| Conta Auth (e-mail, login) | `auth.users` | Enquanto a conta existir | Excluído via `user-data-rights` (delete) |
| Perfil (nome, telefone, cidade, perfil de chá) | `user_profiles` | Enquanto a conta existir | CASCADE na exclusão da conta |
| Preferências, favoritos, inventário, diário, blends | `user_preferences`, `user_favorites`, `user_inventory`, `tea_wheel_history`, `tasting_journal`, `saved_recipes` | Enquanto a conta existir | CASCADE na exclusão da conta |
| Endereços salvos | `user_addresses` | Enquanto a conta existir | CASCADE na exclusão da conta |
| Pedidos (valores, itens, status) | `orders`, `order_items` | **5 anos** após o exercício fiscal (obrigação fiscal/CDC) | Mantidos **anonimizados**: `user_id → NULL`, snapshot de endereço reduzido a cidade/UF/país, nome → `[excluído a pedido do titular]` |
| Payload de pagamento (auditoria) | `orders.payment_payload` | Igual ao pedido | Mantido (não contém dados além do processado pelo MP) — revisar na virada de produção |
| Consentimento LGPD do cadastro | `user_profiles.lgpd_accepted_at` | Enquanto a conta existir | CASCADE; o registro de consentimento de pedidos antigos permanece implícito no pedido anonimizado |
| Escolha de cookies | `localStorage` do navegador (`erv_consent_v1`) | Até o usuário limpar/alterar | Controlado pelo próprio titular (banner) |
| Newsletter (opt-in) | `user_profiles.newsletter_optin` (provedor externo na Onda 10) | Até revogação | Remoção imediata no descadastro |
| Logs de Edge Functions | Supabase Logs | Retenção da plataforma (curta) | Automática |
| Contadores de rate limit | `edge_rate_limits` | ~1 dia (higiene automática) | Automática |
| Backups do banco | Supabase Backups/PITR | Janela do plano (dias) | Expiram automaticamente; dados excluídos desaparecem dos backups ao fim da janela |

## Caminhos de exclusão

1. **Autoatendimento**: menu do perfil → "Excluir minha conta" → Edge Function `user-data-rights` (anonimiza pedidos → deleta Auth user → CASCADE).
2. **Via encarregado (DPO)**: solicitação pelo canal da Política de Privacidade → admin executa a mesma function (ou `admin-delete-user` após anonimização) em até 15 dias.
3. **Backups**: a exclusão não remove o dado de backups já existentes; ele expira com a janela de retenção do backup. Em caso de solicitação expressa, documentar essa janela na resposta ao titular.

## Princípios

- **Minimização**: não coletamos dados que não usamos (auditar novos campos a cada feature).
- **Anonimização > exclusão** quando houver obrigação legal de guarda (fiscal).
- Alterações nesta política acompanham migration/PR — nunca ajuste manual sem versionamento.

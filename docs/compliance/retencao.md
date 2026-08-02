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
| Newsletter anônima (e-mail da landing) | `newsletter_subscribers` | **24 meses** sem interação, ou até revogação | `active = false` no descadastro; purga da linha após 24 meses inativos |
| Logs de Edge Functions | Supabase Logs | Retenção da plataforma (curta) | Automática |
| Contadores de rate limit | `edge_rate_limits` | ~1 dia (higiene automática) | Automática |
| Backups do banco | Supabase Backups/PITR | Janela do plano (dias) | Expiram automaticamente; dados excluídos desaparecem dos backups ao fim da janela |

## Caminhos de exclusão

1. **Autoatendimento**: menu do perfil → "Excluir minha conta" → Edge Function `user-data-rights` (anonimiza pedidos → deleta Auth user → CASCADE).
2. **Via encarregado (DPO)**: solicitação pelo canal da Política de Privacidade → admin executa a mesma function (ou `admin-delete-user` após anonimização) em até 15 dias.
3. **Backups**: a exclusão não remove o dado de backups já existentes; ele expira com a janela de retenção do backup. Em caso de solicitação expressa, documentar essa janela na resposta ao titular.
4. **Newsletter anônima** (`newsletter_subscribers`): **hoje é processo manual**. O inscrito não tem conta, e nenhuma policy permite que ele mesmo se descadastre — só admin. Ao receber o pedido pelo canal da Política de Privacidade, executar como `service_role`:

   ```sql
   delete from public.newsletter_subscribers where email = '<e-mail do titular>';
   ```

   Prazo: 15 dias, igual aos demais. **Isto continua sendo uma lacuna conhecida.** A Edge Function `newsletter-subscribe` já existe, mas ela cobriu a captação, não o descadastro — o link com token ficou para a etapa 3. Enquanto não existir, todo e-mail de campanha precisa trazer o endereço do encarregado em vez de um link de unsubscribe.

### Prova de consentimento (`consent_at`)

Até a Edge Function, `consent_at` era **escrivível pelo cliente**: a policy `newsletter_public_insert` tinha `WITH CHECK (true)`, então quem enviava o formulário podia mandar qualquer data. Evidência de consentimento que o próprio interessado pode forjar não sustenta a base legal.

Agora quem grava é o servidor: a function aceita só `email`, `source` e `locale`, e `consent_at` vem do `DEFAULT NOW()` da tabela. A policy pública de INSERT foi removida (migration `20260802040000`).

Vale ser exato sobre o que essa data prova: **o momento em que o formulário foi enviado, não a confirmação do titular.** Sem double opt-in, ninguém garante que o dono do endereço foi quem digitou. Para uma inscrição contestada, a defesa é fraca. O double opt-in fecha isso e está na etapa 3.

Reinscrição não ressuscita quem saiu: a function usa `ignoreDuplicates`, então reenviar o formulário com um e-mail que está `active = false` **não** o reativa.

## Princípios

- **Minimização**: não coletamos dados que não usamos (auditar novos campos a cada feature).
- **Anonimização > exclusão** quando houver obrigação legal de guarda (fiscal).
- Alterações nesta política acompanham migration/PR — nunca ajuste manual sem versionamento.

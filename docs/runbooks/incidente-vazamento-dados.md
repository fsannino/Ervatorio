# Runbook — Resposta a incidente de vazamento de dados (LGPD / ANPD)

**Quando usar:** confirmação ou suspeita fundada de acesso não autorizado a dados pessoais (ex.: exploração das falhas C-1/C-2 da auditoria, vazamento de banco, chave service_role comprometida).

## 1. Contenção (primeira hora)

1. **Feche o vetor**: aplique a correção (migration de RLS/policy, revogação de grant) ou, se não for possível de imediato, revogue o acesso do papel exposto:
   ```sql
   REVOKE SELECT ON public.<objeto_vazando> FROM authenticated, anon;
   ```
2. **Rotacione credenciais** possivelmente comprometidas (runbook de rotação de chaves).
3. **Preserve evidências**: exporte logs relevantes ANTES que expirem (Supabase → Logs → API/Postgres; Vercel → Runtime Logs). Salve em local restrito.
4. Se o incidente permite escrita maliciosa (ex.: escalonamento a admin), audite alterações:
   ```sql
   SELECT id, display_name, email, is_admin, updated_at
   FROM public.user_profiles WHERE is_admin = TRUE;
   -- confira também order_status_history e admin_products por mudanças anômalas
   ```

## 2. Avaliação (mesmo dia)

1. Determine: **quais dados** (nome, e-mail, endereço, pedidos?), **quantos titulares**, **janela de exposição**, **evidência de acesso real** (logs) vs. exposição teórica.
2. Classifique o risco ao titular (LGPD art. 48: o dever de comunicação é para incidentes que possam acarretar **risco ou dano relevante**).
3. Documente tudo em um relatório de incidente (`docs/security/incidentes/AAAA-MM-DD-<slug>.md`): linha do tempo, causa raiz, dados afetados, ações.

## 3. Notificação (prazo ANPD: em prazo razoável — referência de 3 dias úteis)

Se houver risco/dano relevante aos titulares:

1. **ANPD**: formulário de comunicação de incidente no site da ANPD (gov.br/anpd). Inclua: natureza dos dados, titulares afetados, medidas de contenção, riscos, contato do encarregado.
2. **Titulares**: comunique os afetados (e-mail) em linguagem clara: o que vazou, quando, o que foi feito, o que a pessoa deve fazer (ex.: trocar senha), canal de contato.
3. Registre quem foi notificado e quando.

## 4. Erradicação e lições

1. Causa raiz corrigida por migration/PR versionado (não por ajuste manual no painel).
2. Rode a auditoria completa de RLS (`docs/security/rls-audit.md`).
3. Post-mortem sem culpados: o que detectaria isso antes? (alerta, teste, review). Crie os itens de backlog.

## Contatos

- Encarregado (DPO): definir e manter atualizado aqui e na Política de Privacidade (Onda 2).
- ANPD: https://www.gov.br/anpd

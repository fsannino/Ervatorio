# Handoff — Newsletter Cultura da Pausa no Supabase

## Objetivo

Ativar a captação real de e-mails do formulário existente em `/pausa.html`, usando o projeto Supabase já configurado pelo Ervatório, sem alterar o design ou os fluxos atuais.

## Contexto confirmado

- Projeto Supabase: `ejarqinmjlgbqzurctsf`
- URL pública já configurada em `js/config.js`
- A chave publishable/anon já é consumida pelo frontend em `js/config.js`
- Formulário: `pausa.html`, elemento `#pausaForm`
- Campo: `#pausaEmail`
- Tabela esperada pelo frontend: `public.newsletter_subscribers`
- Migration pronta: `supabase/migrations/20260726120000_newsletter_pausa.sql`
- O formulário já normaliza o e-mail, envia `source`, `locale` e `consent`, trata duplicidade `23505` como sucesso e preserva a UX em erros.

## Regra principal

Não mudar IDs, classes, scripts, integração de autenticação, design ou comportamento existente. A tarefa é aplicar e validar o banco. Nunca inserir `service_role` no frontend.

## Passo 1 — conferir o projeto conectado

```bash
supabase projects list
supabase link --project-ref ejarqinmjlgbqzurctsf
```

Se o repositório já estiver vinculado ao projeto correto, não refazer o link.

## Passo 2 — aplicar a migration

Preferência:

```bash
supabase db push
```

Alternativa, caso o histórico remoto esteja divergente: executar exatamente o conteúdo de:

```text
supabase/migrations/20260726120000_newsletter_pausa.sql
```

A migration é idempotente para tabela, índices e policies e contém:

- tabela `newsletter_subscribers`;
- normalização e validação de e-mail;
- consentimento LGPD obrigatório;
- RLS habilitada;
- `INSERT` para visitantes `anon` e usuários autenticados;
- leitura e gestão somente para usuários cujo `user_profiles.is_admin = true`;
- grants mínimos para tabela e sequence.

## Passo 3 — validar schema e RLS

Executar no banco:

```sql
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'newsletter_subscribers'
order by ordinal_position;

select policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'newsletter_subscribers'
order by policyname;
```

Resultado esperado:

- policies `newsletter_public_insert` e `newsletter_admin_all`;
- RLS ativa;
- nenhum `SELECT` público;
- administrador autenticado consegue consultar e gerenciar.

## Passo 4 — testar como visitante

No navegador, abrir `/pausa.html` e cadastrar um e-mail de teste único.

Validar:

1. o botão muda para `Enviando…`;
2. aparece a confirmação de sucesso;
3. a linha é persistida com `source = 'pausa'`, `consent = true` e locale válido;
4. repetir o mesmo e-mail continua exibindo sucesso sem criar duplicata;
5. um visitante não consegue listar registros via REST/Supabase JS.

Consulta administrativa de confirmação:

```sql
select id, email, source, locale, consent, active, created_at
from public.newsletter_subscribers
order by created_at desc
limit 20;
```

Após validar, remover o registro de teste:

```sql
delete from public.newsletter_subscribers
where email = 'SUBSTITUIR_PELO_EMAIL_DE_TESTE';
```

## Passo 5 — validar administrador

Entrar com um usuário realmente administrativo e confirmar:

```sql
select id, email, is_admin
from public.user_profiles
where id = auth.uid();
```

O usuário com `is_admin = true` deve conseguir `SELECT`, `UPDATE` e `DELETE`. Usuário autenticado comum não deve conseguir ler a lista.

## Passo 6 — verificação de segurança

Confirmar obrigatoriamente:

- nenhuma `service_role` em HTML ou JavaScript público;
- nenhum `SELECT` concedido a `anon`;
- e-mail inválido, sem consentimento ou fora do formato normalizado é rejeitado;
- `source` aceita apenas `pausa`, `landing` ou `rodape`;
- `locale` aceita apenas `pt` ou `en`;
- tabela `user_profiles` e coluna `is_admin` existem antes da criação da policy administrativa.

## Possível divergência de histórico

Se `supabase db push` informar migration remota ausente ou histórico divergente:

1. não apagar migrations antigas;
2. comparar `supabase migration list`;
3. aplicar somente o reparo necessário com `supabase migration repair`;
4. executar novamente `supabase db push`;
5. registrar no commit qual versão foi reparada.

## Critérios de aceite

- migration aplicada no projeto `ejarqinmjlgbqzurctsf`;
- cadastro real persiste no banco;
- duplicidade não quebra a UX;
- RLS impede leitura pública;
- somente admin acessa a lista;
- nenhum arquivo visual ou funcional é alterado sem necessidade;
- teste usado na validação é removido.

## Arquivos relacionados

- `supabase/migrations/20260726120000_newsletter_pausa.sql`
- `pausa.html`
- `js/config.js`
- `js/admin.js`
- `admin.html`

## Observação sobre o painel administrativo

A migration ativa o banco e o formulário público. Não criar uma nova seção no painel sem solicitação explícita. Caso seja desejada depois, implementar uma seção “Newsletter” em `admin.html`/`js/admin.js`, reutilizando a sessão atual e deixando a RLS validar `is_admin`, com busca, filtro por ativo, exportação CSV e descadastro por `active = false`.

-- ============================================================
-- Correções no controle de estoque (20260730060000_stock_control)
-- ============================================================
-- A migration anterior afirma, em comentário e no runbook:
--
--   "Não existe mais o estado incoerente de qty = 0 com stock = 'in'."
--
-- Era falso. O trigger foi criado como:
--
--   BEFORE INSERT OR UPDATE OF stock_qty
--
-- e o painel admin escreve `stock` diretamente (js/admin.js, campo
-- pfStock) sem tocar em stock_qty. Um UPDATE que muda só a flag não
-- dispara o trigger, então um produto com stock_qty = 0 podia ficar
-- marcado como 'in' e voltar para a vitrine como disponível — que é
-- exatamente a venda a descoberto que a migration existia para
-- impedir.
--
-- Aqui o trigger passa a disparar também em UPDATE OF stock. Para
-- produto controlado (stock_qty NOT NULL) a flag vira derivada de
-- verdade: escrever nela na mão é sobrescrito pelo valor calculado.
-- Para produto não controlado (stock_qty NULL) nada muda — a função
-- retorna NEW intocado e a flag continua manual, como hoje.
--
-- Consequência de interface: para esgotar um produto controlado,
-- zera-se a quantidade, não a flag. O painel passa a desabilitar o
-- seletor de flag quando há quantidade preenchida, para que a regra
-- fique visível em vez de virar "o sistema desfez o que eu escolhi".
--
-- ── Correção de documentação: o REVOKE que não revogou ──
-- A migration anterior tem esta linha, com o comentário "A coluna de
-- quantidade não entra no GRANT de UPDATE do cliente":
--
--   REVOKE UPDATE (stock_qty) ON public.admin_products
--     FROM anon, authenticated;
--
-- Ela é um NO-OP. O Postgres não subtrai privilégio de coluna de um
-- grant de tabela: com UPDATE concedido no nível da tabela (que é o
-- default do Supabase), revogar a coluna não remove nada e o comando
-- passa em silêncio. Verificado em information_schema.column_privileges:
-- `authenticated` continua com UPDATE em stock_qty, nível tabela E
-- nível coluna.
--
-- Isso NÃO é brecha. Quem autoriza escrita em admin_products é a
-- policy `products_admin_all` (ALL, USING is_admin(), WITH CHECK
-- is_admin()) — a mesma que já protege `price`, que é campo mais
-- sensível que quantidade. O grant é grosso de propósito; a RLS é o
-- portão. O que estava errado era só o comentário, afirmando uma
-- camada de defesa inexistente.
--
-- Mantenho o REVOKE lá (inofensivo, e vira efetivo se alguém um dia
-- trocar o grant de tabela por grants por coluna) e registro aqui a
-- verdade, já que migration aplicada não se reescreve.
--
-- ── Fora de escopo, de propósito ──
-- reserve_stock() e release_stock() continuam como estão: o revoke
-- de EXECUTE em anon/authenticated ali é real e foi testado (aquele
-- é revoke de FUNÇÃO, que não tem o problema de subtração acima).
--
-- Como testar: ver docs/runbooks/estoque.md
-- Rollback:
--   DROP TRIGGER IF EXISTS sync_stock_flag ON public.admin_products;
--   CREATE TRIGGER sync_stock_flag
--     BEFORE INSERT OR UPDATE OF stock_qty ON public.admin_products
--     FOR EACH ROW EXECUTE FUNCTION public.sync_stock_flag();
-- Volta a permitir flag manual divergente da quantidade.
-- ============================================================

DROP TRIGGER IF EXISTS sync_stock_flag ON public.admin_products;
CREATE TRIGGER sync_stock_flag
  BEFORE INSERT OR UPDATE OF stock_qty, stock ON public.admin_products
  FOR EACH ROW EXECUTE FUNCTION public.sync_stock_flag();

COMMENT ON COLUMN public.admin_products.stock IS
  'Flag lida pela vitrine: in | low | out. DERIVADA de stock_qty pelo '
  'trigger sync_stock_flag quando stock_qty NOT NULL — escrever nela '
  'na mão nesse caso é sobrescrito. Só é editável à mão em produto '
  'com stock_qty NULL (estoque não controlado).';

-- ------------------------------------------------------------
-- Reconcilia o que já estiver incoerente
-- ------------------------------------------------------------
-- Hoje os 41 produtos estão com stock_qty NULL, então este UPDATE
-- não deve tocar em nenhuma linha. Fica aqui porque a migration é
-- idempotente e pode ser aplicada em base onde alguém já preencheu
-- quantidade e depois mexeu na flag pelo painel antigo.
UPDATE public.admin_products
   SET stock_qty = stock_qty          -- dispara o trigger
 WHERE stock_qty IS NOT NULL
   AND stock IS DISTINCT FROM CASE
         WHEN stock_qty = 0  THEN 'out'
         WHEN stock_qty <= 5 THEN 'low'
         ELSE 'in'
       END;

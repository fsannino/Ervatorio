-- ============================================================
-- Controle de estoque com quantidade e baixa transacional
-- ============================================================
-- Antes desta migration, admin_products.stock era só um texto com
-- 'in' | 'low' | 'out', e NENHUM lugar do código dava baixa —
-- create-order apenas conferia `if (p.stock === 'out')` e seguia.
-- Consequência: a loja vendia a mesma unidade indefinidamente até
-- um admin virar a chave para 'out' na mão. Para produto físico,
-- isso é venda a descoberto.
--
-- ── Decisão: stock_qty NULL = não controlado ──
-- Os 41 produtos existentes ficam com stock_qty NULL, e a reserva
-- os ignora. Eu poderia ter preenchido um número qualquer para
-- "ligar" a proteção de imediato, mas isso seria inventar
-- inventário — o banco passaria a afirmar uma quantidade que
-- ninguém contou, e decisão de reposição sairia de dado falso.
--
-- Então a proteção passa a existir e vale por produto, a partir do
-- momento em que alguém digita a quantidade real no painel. Até
-- lá, o comportamento é o de hoje: só a flag `stock` protege.
-- Isto é uma limitação consciente, não um esquecimento.
--
-- ── Quando a baixa acontece ──
-- Na CRIAÇÃO do pedido, não no pagamento. Se fosse no pagamento,
-- duas pessoas poderiam pagar pela última unidade. O custo é que
-- checkout abandonado segura estoque — release_stock() devolve
-- quando o pedido vira failed/cancelled, e pedido pending esquecido
-- precisa de limpeza (ver docs/runbooks/estoque.md).
--
-- ── Por que uma função e não UPDATE no cliente ──
-- reserve_stock() decrementa todas as linhas ou nenhuma, com
-- FOR UPDATE, dentro de uma transação. Dois pedidos simultâneos
-- pela última unidade: um passa, o outro recebe exceção. UPDATE
-- solto do cliente perderia a corrida.
--
-- Como testar: ver docs/runbooks/estoque.md
-- Rollback:
--   drop function if exists public.reserve_stock(jsonb);
--   drop function if exists public.release_stock(uuid);
--   drop trigger if exists sync_stock_flag on public.admin_products;
--   drop function if exists public.sync_stock_flag();
--   alter table public.admin_products drop column if exists stock_qty;
-- A coluna `stock` volta a ser o único controle, como era antes.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Quantidade
-- ------------------------------------------------------------
ALTER TABLE public.admin_products
  ADD COLUMN IF NOT EXISTS stock_qty INTEGER;

ALTER TABLE public.admin_products
  DROP CONSTRAINT IF EXISTS admin_products_stock_qty_check;
ALTER TABLE public.admin_products
  ADD CONSTRAINT admin_products_stock_qty_check
  CHECK (stock_qty IS NULL OR stock_qty >= 0);

COMMENT ON COLUMN public.admin_products.stock_qty IS
  'Unidades disponíveis. NULL = estoque não controlado (a reserva ignora '
  'o produto e só a flag `stock` protege). Preencher no painel para ativar '
  'a proteção contra venda a descoberto.';

-- ------------------------------------------------------------
-- 2) A flag textual passa a ser derivada
-- ------------------------------------------------------------
-- A vitrine e os filtros já leem `stock` ('in'|'low'|'out'), então
-- mantemos a coluna e a alimentamos a partir de stock_qty. Assim
-- nada no cliente precisa mudar, e não existe o estado incoerente
-- de qty = 0 com stock = 'in'.
CREATE OR REPLACE FUNCTION public.sync_stock_flag()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.stock_qty IS NOT NULL THEN
    NEW.stock := CASE
      WHEN NEW.stock_qty = 0 THEN 'out'
      WHEN NEW.stock_qty <= 5 THEN 'low'
      ELSE 'in'
    END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_stock_flag ON public.admin_products;
CREATE TRIGGER sync_stock_flag
  BEFORE INSERT OR UPDATE OF stock_qty ON public.admin_products
  FOR EACH ROW EXECUTE FUNCTION public.sync_stock_flag();

-- ------------------------------------------------------------
-- 3) Reserva atômica
-- ------------------------------------------------------------
-- Recebe [{"product_id": uuid, "qty": int}, ...]. Decrementa todas
-- as linhas ou levanta exceção — a transação da Edge Function
-- desfaz o pedido inteiro se qualquer item faltar.
--
-- SECURITY DEFINER porque só service_role a chama (create-order),
-- e o EXECUTE é revogado de anon/authenticated logo abaixo: um
-- cliente não pode mexer no estoque nem indiretamente.
CREATE OR REPLACE FUNCTION public.reserve_stock(p_items jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  item      jsonb;
  v_id      uuid;
  v_qty     integer;
  v_atual   integer;
  v_nome    text;
BEGIN
  -- Ordena por id para que dois pedidos concorrentes travem as
  -- linhas na mesma sequência. Sem isso, dois pedidos com os mesmos
  -- dois produtos em ordem inversa podem se bloquear mutuamente.
  FOR item IN
    SELECT value FROM jsonb_array_elements(p_items)
    ORDER BY (value->>'product_id')
  LOOP
    v_id  := (item->>'product_id')::uuid;
    v_qty := GREATEST(1, (item->>'qty')::integer);

    SELECT stock_qty, name INTO v_atual, v_nome
      FROM public.admin_products
     WHERE id = v_id
       FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Produto não encontrado: %', v_id
        USING ERRCODE = 'no_data_found';
    END IF;

    -- NULL = não controlado: nada a reservar.
    CONTINUE WHEN v_atual IS NULL;

    IF v_atual < v_qty THEN
      RAISE EXCEPTION 'Estoque insuficiente para "%": % disponível(is), % pedida(s)',
        v_nome, v_atual, v_qty
        USING ERRCODE = 'check_violation';
    END IF;

    UPDATE public.admin_products
       SET stock_qty = stock_qty - v_qty
     WHERE id = v_id;
  END LOOP;
END;
$$;

-- ------------------------------------------------------------
-- 4) Devolução ao estoque
-- ------------------------------------------------------------
-- Chamada quando o pedido não vira venda (failed/cancelled). É
-- idempotente por design de uso: o webhook só chama na TRANSIÇÃO
-- de status, nunca em notificação repetida do mesmo estado.
CREATE OR REPLACE FUNCTION public.release_stock(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.admin_products p
     SET stock_qty = p.stock_qty + i.qty
    FROM public.order_items i
   WHERE i.order_id = p_order_id
     AND i.product_id = p.id
     AND p.stock_qty IS NOT NULL;
END;
$$;

-- ------------------------------------------------------------
-- 5) Só service_role mexe em estoque
-- ------------------------------------------------------------
REVOKE ALL ON FUNCTION public.reserve_stock(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.release_stock(uuid)  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reserve_stock(jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_stock(uuid)  TO service_role;

-- A coluna de quantidade não entra no GRANT de UPDATE do cliente.
-- admin_products só é editável por admin (products_admin_all), mas
-- deixo explícito para o caso de alguém afrouxar a policy depois.
REVOKE UPDATE (stock_qty) ON public.admin_products FROM anon, authenticated;

-- ------------------------------------------------------------
-- 6) REVOKE explícito de anon e authenticated
-- ------------------------------------------------------------
-- O bloco acima usa REVOKE ALL ... FROM PUBLIC, e isso NÃO é
-- suficiente: o Supabase concede EXECUTE direto a anon e
-- authenticated por default privileges, e um grant direto sobrevive
-- ao revoke em PUBLIC.
--
-- Descobri isso testando: com apenas o revoke de PUBLIC, um
-- `set local role authenticated` conseguia chamar reserve_stock().
-- Como a função é SECURITY DEFINER, ela rodaria com privilégio de
-- dono — ou seja, qualquer usuário logado poderia drenar o estoque
-- da loja por /rest/v1/rpc/reserve_stock.
REVOKE EXECUTE ON FUNCTION public.reserve_stock(jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.release_stock(uuid)  FROM anon, authenticated;

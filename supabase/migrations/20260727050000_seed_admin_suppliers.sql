-- ============================================================
-- Seed de fornecedores fictícios — admin_suppliers
-- ============================================================
-- A tabela nasceu vazia no projeto novo. Enquanto ela tem zero
-- linhas, js/ervaria.js:396 mantém a lista estática do bundle
-- (const SUPPLIERS em js/app.js) — o hydrate só acontece quando
-- a resposta vem populada:
--
--     if (supRes.data?.length) this._hydrateSuppliers(supRes.data);
--
-- É tudo ou nada: assim que esta migration rodar, os 6 nomes do
-- bundle somem da vitrine e ficam valendo apenas os 10 abaixo,
-- que passam a ser editáveis pelo painel admin.
--
-- Estes 10 registros são FICTÍCIOS, criados a pedido para popular
-- o painel e a vitrine antes de haver fornecedor real.
--
-- Nota sobre o campo `certification`: os valores aqui descrevem o
-- modo de produção declarado ("Cultivo próprio", "Manejo
-- agroflorestal"), e não certificações de terceiros. Não inventei
-- selos regulatórios — IBD, Demeter, ANVISA, SIF — porque o site
-- é público e atribuir esses selos a empresas inexistentes seria
-- afirmação de credencial falsa ao consumidor (CDC art. 37).
-- Quando entrar fornecedor real com certificado real, o valor do
-- certificado vai junto, pelo painel.
--
-- `cnpj` fica NULL de propósito: qualquer número plausível que eu
-- gerasse poderia bater com o de uma empresa real.
--
-- Idempotente: só insere se a tabela estiver vazia. Reaplicar não
-- duplica nem sobrescreve edição feita depois pelo admin.
--
-- Como testar:
--   set local role anon;
--   select count(*) from public.admin_suppliers where active;  -- 10
-- Abrir a vitrine: os fornecedores listados são os 10 daqui.
--
-- Rollback:
--   delete from public.admin_suppliers where created_by is null
--     and cnpj is null;
-- A vitrine volta sozinha para a lista estática do bundle.
-- ============================================================

DO $seed$
BEGIN
IF (SELECT count(*) FROM public.admin_suppliers) > 0 THEN
  RAISE NOTICE 'admin_suppliers já populada — seed ignorado';
  RETURN;
END IF;

INSERT INTO public.admin_suppliers
  (name, type, city, since, certification, shipping, min_order, herbs, categories, color, active)
VALUES
  ('Ervas do Vale',
   'Cooperativa familiar', 'Campinas, SP', '2011',
   'Cultivo próprio', 'Sudeste', 'R$ 70',
   ARRAY['Camomila','Melissa','Erva-cidreira','Hortelã','Capim-limão'],
   ARRAY['calmantes','digestivos'], '#2d5a3a', true),

  ('Raiz Serrana',
   'Produtor de altitude', 'Campos do Jordão, SP', '2016',
   'Cultivo próprio', 'Sudeste e Sul', 'R$ 90',
   ARRAY['Alecrim','Lavanda','Sálvia','Tomilho','Manjerona'],
   ARRAY['aromaticas','calmantes'], '#3a5a2a', true),

  ('Casa Guaraná',
   'Extrativista amazônico', 'Manaus, AM', '2009',
   'Manejo extrativista', 'Todo Brasil', 'R$ 110',
   ARRAY['Guaraná','Copaíba','Unha-de-gato','Jatobá','Sacaca'],
   ARRAY['energeticos','amazonicos'], '#1e4a3a', true),

  ('Horto do Pampa',
   'Produtor regional', 'Bagé, RS', '2013',
   'Cultivo próprio', 'Sul', 'R$ 60',
   ARRAY['Marcela','Carqueja','Macela-do-campo','Losna','Poejo'],
   ARRAY['digestivos','amargos'], '#4a5a2a', true),

  ('Sertão Verde',
   'Cooperativa de agricultura familiar', 'Petrolina, PE', '2014',
   'Agricultura familiar', 'Nordeste', 'R$ 55',
   ARRAY['Aroeira','Umbuzeiro','Juazeiro','Mastruz','Malva'],
   ARRAY['regionais','respiratorios'], '#5a4a1a', true),

  ('Folha & Flor',
   'Ervateiro tradicional', 'Curitiba, PR', '1998',
   'Beneficiamento artesanal', 'Sul e Sudeste', 'R$ 50',
   ARRAY['Erva-mate','Espinheira-santa','Guaco','Hortelã-pimenta','Anis'],
   ARRAY['tradicionais','digestivos'], '#2a4a2a', true),

  ('Terra Cheirosa',
   'Casa de ervas', 'Salvador, BA', '2007',
   'Beneficiamento artesanal', 'Nordeste e Sudeste', 'R$ 65',
   ARRAY['Alfazema','Manjericão','Arruda','Vassourinha','Alecrim-do-campo'],
   ARRAY['aromaticas','rituais'], '#4a3a1a', true),

  ('Cerrado Nativo',
   'Produtor regional', 'Brasília, DF', '2017',
   'Manejo agroflorestal', 'Centro-Oeste', 'R$ 80',
   ARRAY['Barbatimão','Sucupira','Pau-terra','Arnica-do-cerrado','Pequi'],
   ARRAY['regionais','cicatrizantes'], '#5a5a2a', true),

  ('Mata Atlântica Ervas',
   'Produtor agroflorestal', 'Blumenau, SC', '2012',
   'Manejo agroflorestal', 'Sul e Sudeste', 'R$ 75',
   ARRAY['Cavalinha','Chapéu-de-couro','Quebra-pedra','Pata-de-vaca','Sete-sangrias'],
   ARRAY['diureticos','metabolicos'], '#2a5a4a', true),

  ('Alecrim do Norte',
   'Distribuidor regional', 'Belém, PA', '2019',
   'Beneficiamento próprio', 'Norte e Nordeste', 'R$ 95',
   ARRAY['Priprioca','Cumaru','Andiroba','Catuaba','Marapuama'],
   ARRAY['amazonicos','aromaticas'], '#1a4a4a', true);

RAISE NOTICE '10 fornecedores fictícios inseridos';
END $seed$;

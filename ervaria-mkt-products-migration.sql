-- ============================================================
-- ERVARIA — Seed Produtos Premium (MKT_PRODUCTS)
-- Data: 2026-04-24
-- ============================================================
-- Popula admin_products com os 30 itens do catalogo premium
-- (Chazeria Marketplace) que estao em js/app.js MKT_PRODUCTS.
--
-- Nomes precisam bater EXATAMENTE com os do MKT_PRODUCTS — o
-- match em ervaria.js._hydrateProducts() e feito por nome para
-- injetar dbId nos produtos do catalogo premium.
--
-- Idempotente: usa WHERE NOT EXISTS para nao duplicar.
-- ============================================================

-- INFUSOES PREMIUM (101-108)
INSERT INTO public.admin_products (name, icon, category, price, unit, supplier, stock, description, is_test)
SELECT * FROM (VALUES
  ('Gyokuro Uji Premium','🍵','Infusões',189.90,'30g','TeaImport','in','Chá verde japonês cultivado à sombra. Sabor umami intenso, baixo amargor. Colheita First Flush 2024.',true),
  ('Ali Shan Oolong High Mountain','☁️','Infusões',245.00,'50g','TeaImport','in','Cultivado a 2200m. Floral e cremoso. Um dos oolongs mais apreciados do mundo.',true),
  ('Bai Hao Yinzhen — Agulha de Prata','🤍','Infusões',320.00,'25g','TeaImport','in','Chá branco mais nobre. Brotos cobertos por pelos brancos. Fujian, China.',true),
  ('Menghai Pu-erh Sheng 2018','🟤','Infusões',185.00,'100g','TeaImport','in','Pu-erh cru com 6 anos de envelhecimento. Terroso, mineral, complexo. Melhor com o tempo.',true),
  ('Blend Noite Serena','🌙','Infusões',45.90,'60g','Ervas & Raízes','in','Camomila + Maracujá + Melissa + Alfazema. Blend para sono profundo e noites tranquilas.',true),
  ('Masala Chai Original','🌶','Infusões',38.90,'80g','Verde Vivo','in','Chá preto Assam + gengibre + cardamomo + canela + cravo + pimenta. Receita indiana tradicional.',true),
  ('Blend Imunidade Verde','🛡','Infusões',52.00,'70g','Ervas & Raízes','in','Equinácea + Cúrcuma + Gengibre + Tomilho. Fortalecedor de defesas para o inverno.',true),
  ('Rooibos Baunilha & Laranja','🍊','Infusões',42.00,'80g','TeaImport','in','Rooibos orgânico da África do Sul com baunilha natural e raspas de laranja. Sem cafeína.',true)
) AS v(name, icon, category, price, unit, supplier, stock, description, is_test)
WHERE NOT EXISTS (SELECT 1 FROM public.admin_products WHERE admin_products.name = v.name);

-- EQUIPAMENTOS (201-208)
INSERT INTO public.admin_products (name, icon, category, price, unit, supplier, stock, description, is_test)
SELECT * FROM (VALUES
  ('Bule Yixing Zisha Autêntico','🫖','Equipamentos',485.00,'150ml','TeaImport','in','Argila Zisha genuína de Yixing. Artesanal. Poroso: absorve o sabor e melhora com o uso. Ideal para oolongs.',true),
  ('Tetsubin Japonês — Ferro Fundido','🔵','Equipamentos',680.00,'600ml','TeaImport','in','Bule de ferro fundido japonês. Mantém temperatura por horas. Não enferrujar em uso regular.',true),
  ('Kit Matcha Completo','🍵','Equipamentos',220.00,'kit','TeaImport','in','Chawan (tigela), Chasen (batedor 80 fios), Chashaku (colher) e suporte. Tudo para iniciar o ritual.',true),
  ('Infusor Gooseneck Elétrico','⚡','Equipamentos',340.00,'1L','PhytoFarm','in','Controle de temperatura preciso (60-100°C). Pescoço de cisne para fluxo suave. Essencial para chás premium.',true),
  ('Tabuleiro de Bambu Gongfu','🎋','Equipamentos',175.00,'35x20cm','TeaImport','in','Tabuleiro de bambu com reservatório integrado. Inclui 4 xícaras de argilite. Cerimônia completa.',true),
  ('Lata Washi Paper — set 3','📦','Equipamentos',95.00,'set 3 latas','Ervas & Raízes','in','Latas vedadas com papel washi japonês. Protegem da luz e umidade. Capacidade 50-100g cada.',true),
  ('Termômetro Digital para Chá','🌡','Equipamentos',85.00,'1 unid','PhytoFarm','in','Leitura instantânea. Essencial para chás brancos e verdes que exigem temperatura precisa.',true),
  ('Balança de Precisão 0.1g','⚖️','Equipamentos',120.00,'1 unid','PhytoFarm','in','Precisão de 0.1g. Para dosagem exata — especialmente para Pu-erh e matcha.',true)
) AS v(name, icon, category, price, unit, supplier, stock, description, is_test)
WHERE NOT EXISTS (SELECT 1 FROM public.admin_products WHERE admin_products.name = v.name);

-- VIVENCIAS (301-305)
INSERT INTO public.admin_products (name, icon, category, price, unit, supplier, stock, description, is_test)
SELECT * FROM (VALUES
  ('Cerimônia Chanoyu — São Paulo','🎋','Vivências',180.00,'por pessoa','Instituto Brasil-Japão','in','Workshop de 3h com mestre certificado. Inclui degustação de matcha e wagashi. Turmas de 8 pessoas.',true),
  ('Gongfu Cha — 4 aulas','🐉','Vivências',420.00,'4 sessões','Chá Verde Studio','in','Aprenda a cerimônia chinesa do zero. Inclui bule Gaiwan para praticar em casa. Certificado de conclusão.',true),
  ('Oolong Journey — Degustação','☁️','Vivências',150.00,'por pessoa','TeaImport','in','Degustação guiada de 6 oolongs de Taiwan e Fujian. Do mais leve ao mais torrado. 2 horas.',true),
  ('Pu-erh Vertical Tasting','🟤','Vivências',280.00,'por pessoa','TeaImport','in','Degustação vertical de Pu-erh de 2015 a 2005. Aprenda a perceber o envelhecimento. Para entusiastas.',true),
  ('Retiro do Chá — Serra da Cantareira','🌿','Vivências',890.00,'fim de semana','Chá Verde Studio','in','Retiro de 2 dias em sítio. Cerimônia ao amanhecer, blending, meditação com chá. 12 participantes máx.',true)
) AS v(name, icon, category, price, unit, supplier, stock, description, is_test)
WHERE NOT EXISTS (SELECT 1 FROM public.admin_products WHERE admin_products.name = v.name);

-- VIAGENS (401-405)
INSERT INTO public.admin_products (name, icon, category, price, unit, supplier, stock, description)
SELECT * FROM (VALUES
  ('Japão — Rota do Chá Kyoto-Uji','🗾','Viagens',12500.00,'7 dias/pessoa','Tea Travels','in','Visita às plantações de Uji, cerimônia Urasenke, mercado Nishiki, chashitsu histórico. Guia especializado.'),
  ('Taiwan — High Mountain Oolongs','🏔','Viagens',8900.00,'5 dias/pessoa','Tea Travels','in','Ali Shan, Li Shan, Pinglin. Visitas a produtores independentes. Degustação de altitude. 8 pessoas máx.'),
  ('Darjeeling — Colheita First Flush','🌱','Viagens',9800.00,'6 dias/pessoa','Tea Travels','in','Participação na colheita em fazenda histórica. Processamento artesanal. Degustação de 15 lotes diferentes.'),
  ('Yunnan — Rota do Pu-erh','🐉','Viagens',11200.00,'8 dias/pessoa','Tea Travels','in','Xishuangbanna, árvores centenárias, produtores tradicionais, aldeias Dai. A rota mais completa para o Pu-erh.'),
  ('Fujian — Oolongs e Wuyishan','⛰','Viagens',9200.00,'6 dias/pessoa','Tea Travels','in','Anxi (Tie Guan Yin), Wuyi (Da Hong Pao), Fujian coastline. Inclui visita a fábrica artesanal centenária.')
) AS v(name, icon, category, price, unit, supplier, stock, description)
WHERE NOT EXISTS (SELECT 1 FROM public.admin_products WHERE admin_products.name = v.name);

-- Verificacao: conte quantos produtos MKT estao presentes
SELECT count(*) AS produtos_mkt_presentes
FROM public.admin_products
WHERE category IN ('Infusões','Equipamentos','Vivências','Viagens');

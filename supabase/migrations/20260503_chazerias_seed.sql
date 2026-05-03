-- Seed inicial de Chazerias — Ervatório
-- Curadoria de 16 locais entre Brasil e Mundo
-- Rodar no Supabase SQL Editor (após o migration 20260503_chazerias.sql)

INSERT INTO public.chazerias (name, address, city, country, continent, lat, lng, type, description, quote, quote_author, opening_hours, payment, style, website, active) VALUES

-- ═══════════════════════════════════════════════════
-- BRASIL
-- ═══════════════════════════════════════════════════

(
  'Mercado Ver-o-Peso',
  'Boulevard Castilhos França, s/n — Campina',
  'Belém', 'Brasil', 'América do Sul',
  -1.4523, -48.5028, 'mercado',
  'O maior mercado de ervas amazônicas do mundo. As erveiras de Ver-o-Peso vendem cascas, raízes, óleos e banhos rituais com saberes transmitidos por gerações. É a Amazônia em forma de farmácia viva.',
  'Aqui o que se vende é fé: cada erva tem nome, dono e história.',
  'Folha de S.Paulo',
  'Diariamente 4h–18h',
  'Dinheiro · cartão em algumas barracas',
  'Mercado de ervas e essências amazônicas',
  NULL, true
),
(
  'Mercado Municipal de São Paulo',
  'R. da Cantareira, 306 — Centro',
  'São Paulo', 'Brasil', 'América do Sul',
  -23.5417, -46.6291, 'mercado',
  'Os ervateiros tradicionais do Mercadão guardam um pedaço da memória paulistana — boldo do Chile, espinheira-santa, quebra-pedra, e blends caseiros embalados em sacos de papel pardo.',
  'É no Mercadão que São Paulo aprendeu a falar com as plantas.',
  'Revista VEJA SP',
  'Seg–Sáb 6h–18h · Dom 6h–16h',
  'Cartão · PIX · dinheiro',
  'Mercado coberto · ervas, frutas e iguarias',
  'https://oportaldomercadao.com.br', true
),
(
  'Mercado Central de Belo Horizonte',
  'Av. Augusto de Lima, 744 — Centro',
  'Belo Horizonte', 'Brasil', 'América do Sul',
  -19.9243, -43.9377, 'mercado',
  'Mais de 400 lojas, e algumas das melhores ervateiras de Minas. Aqui se compra alecrim do campo, carqueja, jurubeba e a famosa pacová em raiz, sempre com a indicação de uso.',
  'Cada saco de ervas vem com uma receita oral.',
  'Estado de Minas',
  'Seg–Sáb 7h–18h · Dom 7h–13h',
  'Cartão · PIX · dinheiro',
  'Mercado tradicional mineiro',
  'https://mercadocentral.com.br', true
),
(
  'Casa Santa Luzia',
  'Al. Lorena, 1471 — Jardins',
  'São Paulo', 'Brasil', 'América do Sul',
  -23.5572, -46.6664, 'chazeria',
  'A seção de chás finos da Casa Santa Luzia é uma das mais completas do Brasil — Mariage Frères, Kusmi, Twinings e seleção de matchas japoneses cerimoniais ao lado das ervas frescas.',
  'O empório que ensinou São Paulo a beber chá de verdade.',
  'Folha de S.Paulo',
  'Seg–Sáb 8h30–20h30',
  'Cartão · PIX · dinheiro',
  'Empório gourmet · seção de chás finos',
  'https://santaluzia.com.br', true
),
(
  'Mr. Cha',
  'R. Galvão Bueno, 374 — Liberdade',
  'São Paulo', 'Brasil', 'América do Sul',
  -23.5586, -46.6354, 'chazeria',
  'Templo dos chás orientais em plena Liberdade. Bubble teas, matchas cerimoniais, oolongs envelhecidos e taiwaneses raros. O dono trouxe a cultura do chá direto da família, em Taiwan.',
  'Aqui o chá é levado a sério — e isso é raro no Brasil.',
  'Time Out São Paulo',
  'Ter–Dom 11h–20h',
  'Cartão · PIX',
  'Chá oriental · bubble tea · matcha',
  NULL, true
),
(
  'Mercado Modelo',
  'Praça Cayru, s/n — Comércio',
  'Salvador', 'Brasil', 'América do Sul',
  -12.9737, -38.5114, 'mercado',
  'No coração da Bahia, as erveiras do Mercado Modelo vendem ervas para os banhos de cheiro e os preparos da tradição afro-brasileira: vassourinha, catinga-de-mulata, manjericão roxo, alecrim do tabuleiro.',
  'Cada banho é uma reza, cada erva uma história do candomblé.',
  'Pierre Verger (notas de campo)',
  'Seg–Sáb 9h–19h · Dom 9h–14h',
  'Dinheiro · cartão em algumas lojas',
  'Mercado afro-brasileiro · ervas rituais',
  NULL, true
),
(
  'Tea Connection Vila Madalena',
  'R. Harmonia, 124 — Vila Madalena',
  'São Paulo', 'Brasil', 'América do Sul',
  -23.5556, -46.6932, 'chazeria',
  'A unidade mais charmosa da rede argentina em São Paulo. Mais de 60 blends próprios, brunch farto, e uma carta de chás gelados que define o verão paulistano.',
  'Levou para São Paulo a ideia de que chá pode ser ritual cotidiano.',
  'O Globo',
  'Seg–Dom 8h–22h',
  'Cartão · PIX',
  'Chá + brunch + comida natural',
  'https://teaconnection.com.br', true
),

-- ═══════════════════════════════════════════════════
-- EUROPA
-- ═══════════════════════════════════════════════════

(
  'Fortnum & Mason',
  '181 Piccadilly',
  'Londres', 'Reino Unido', 'Europa',
  51.5081, -0.1382, 'chazeria',
  'A chazeria mais lendária do mundo. Desde 1707 vendendo chá para a coroa britânica. O Diamond Jubilee Tea Salon serve afternoon teas que são patrimônio inglês — e a loja vende blends que viajam o mundo.',
  'Se o chá inglês tem uma capital, ela fica em Piccadilly.',
  'The Telegraph',
  'Seg–Sáb 10h–20h · Dom 11h30–18h',
  'Todos os cartões',
  'Loja histórica + salão de chá',
  'https://fortnumandmason.com', true
),
(
  'Postcard Teas',
  '9 Dering St',
  'Londres', 'Reino Unido', 'Europa',
  51.5128, -0.1442, 'chazeria',
  'Pequena chazeria de chás raros, com origem sempre rastreável até a fazenda. Tim d''Offay viaja pessoalmente cada safra. O lugar é minúsculo mas é referência mundial em chás de origem.',
  'O melhor chá artesanal de Londres, sem competição.',
  'Financial Times',
  'Seg–Sáb 10h30–18h30',
  'Cartão · contactless',
  'Chás raros de origem · vendas e degustação',
  'https://postcardteas.com', true
),
(
  'Mariage Frères',
  '30 Rue du Bourg-Tibourg',
  'Paris', 'França', 'Europa',
  48.8568, 2.3553, 'chazeria',
  'Desde 1854, a casa francesa que reinventou o chá como objeto de luxo. A loja-mãe no Marais tem um museu interno e um salão onde 600 blends podem ser degustados. Latas pretas com etiquetas douradas tornaram-se ícone.',
  'Mariage não vende chá — vende uma forma de viver com chá.',
  'Le Monde',
  'Diariamente 10h30–19h30',
  'Todos os cartões',
  'Casa de chá histórica · museu · loja',
  'https://mariagefreres.com', true
),

-- ═══════════════════════════════════════════════════
-- ÁSIA
-- ═══════════════════════════════════════════════════

(
  'Ippodo Tea',
  '52 Tokiwagi-cho, Kamigyō',
  'Quioto', 'Japão', 'Ásia',
  35.0157, 135.7615, 'chazeria',
  'Desde 1717, a referência absoluta em matcha cerimonial e sencha. A casa-mãe em Quioto tem o salão Kaboku, onde se aprende a preparar matcha do jeito certo, com pedras Uji e tigela de Raku.',
  'Se você só pode beber chá em um lugar do mundo, escolha Ippodo.',
  'Eric Gower',
  'Diariamente 10h–18h · Salão até 17h',
  'Cartão · dinheiro',
  'Chá japonês cerimonial · sencha · matcha',
  'https://global.ippodo-tea.co.jp', true
),
(
  'Lock Cha Tea House',
  'K.S. Lo Gallery, Hong Kong Park',
  'Hong Kong', 'China', 'Ásia',
  22.2780, 114.1620, 'chazeria',
  'Dentro do Hong Kong Park, esta chazeria recria a atmosfera de uma casa de chá tradicional chinesa. Pu-erhs envelhecidos, oolongs taiwaneses raros e dim sum vegetariano servidos com cerimônia kung fu cha.',
  'O melhor lugar de Hong Kong para entender por que chinês não bebe chá em sachê.',
  'South China Morning Post',
  'Diariamente 10h–20h',
  'Cartão · dinheiro · Octopus',
  'Chá chinês cerimonial · dim sum vegetariano',
  'https://lockcha.com', true
),
(
  'Aap Ki Pasand',
  '15 Netaji Subhash Marg, Daryaganj',
  'Nova Delhi', 'Índia', 'Ásia',
  28.6403, 77.2378, 'chazeria',
  'A chazeria mais antiga e respeitada da Índia. Fundada por Sanjay Kapur em 1981, vende Darjeelings premiados, Assam de safra única e chás de Nilgiri direto dos produtores.',
  'O homem que ensinou a Índia moderna a respeitar seu próprio chá.',
  'The Hindu',
  'Seg–Sáb 11h–19h',
  'Cartão · UPI · dinheiro',
  'Chá indiano de origem · degustação',
  'https://aapkipasand.com', true
),

-- ═══════════════════════════════════════════════════
-- AMÉRICAS
-- ═══════════════════════════════════════════════════

(
  'Bellocq Tea Atelier',
  '104 West St',
  'Brooklyn (NY)', 'Estados Unidos', 'América do Norte',
  40.7242, -73.9525, 'chazeria',
  'No coração de Greenpoint, este atelier-boutique blenda chás manualmente em pequenos lotes, com receitas que misturam botânica e perfumaria. As latas verde-musgo viraram referência estética da nova onda do chá nos EUA.',
  'O Mariage Frères de Brooklyn — só que mais radical.',
  'The New York Times',
  'Qua–Dom 12h–18h',
  'Cartão',
  'Atelier de chás autorais · loja boutique',
  'https://bellocq.com', true
),
(
  'Tea Connection Recoleta',
  'Av. Quintana 552',
  'Buenos Aires', 'Argentina', 'América do Sul',
  -34.5876, -58.3936, 'chazeria',
  'A unidade que deu origem à rede em 2008. Conceito de "tea by design" — blends próprios em mais de 50 sabores, café da manhã o dia todo, ambiente leve e luminoso. Inspirou todas as chazerias contemporâneas da América Latina.',
  'A Argentina ensinou a América Latina a beber chá com glamour.',
  'Clarín',
  'Seg–Dom 8h–22h',
  'Cartão · efectivo',
  'Chá + brunch + comida natural',
  'https://teaconnection.com.ar', true
),

-- ═══════════════════════════════════════════════════
-- ORIENTE MÉDIO / NORTE DA ÁFRICA
-- ═══════════════════════════════════════════════════

(
  'Café des Épices',
  'Place Rahba Lakdima',
  'Marrakech', 'Marrocos', 'Oriente Médio',
  31.6306, -7.9877, 'chazeria',
  'No coração do souk das especiarias, este café terraço serve o lendário chá de menta marroquino — verde gunpowder com hortelã fresca, açucarado e despejado de altura. Vista privilegiada da praça das ervas medicinais.',
  'Beber chá em Marrakech é estar onde a rota das especiarias começou.',
  'Lonely Planet',
  'Diariamente 9h–22h',
  'Dinheiro · cartão',
  'Chá de menta · vista da medina',
  NULL, true
);

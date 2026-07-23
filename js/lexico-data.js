// ============================================================
// ERVATÓRIO — Léxico da Chazeria (Onda 2.1 / trilha editorial)
// ============================================================
// Glossário botânico-cultural do chá. Fonte de dados única, lida
// tanto pelo prerender (scripts/prerender.mjs → páginas estáticas
// /lexico/<slug>/) quanto, no futuro, pela visão in-app.
//
// Campos por termo:
//   slug        — identificador na URL (kebab-case, sem acento)
//   termo       — nome de exibição
//   categoria   — metodo-preparo | utensilio | botanica | cultural-br | cultural-global | sensorial
//   def         — definição curta (1–3 frases), sem alegação médica
//   pron        — pronúncia aproximada (opcional)
//   origem      — idioma/etimologia (opcional)
//   trad        — tradução literal (opcional)
//   rel         — slugs de termos relacionados (linkagem interna)
//   ervas       — slugs de fichas relacionadas (o prerender só linka as que existem)
//
// Regras: sem posicionamento Brasil-only (a linha brasileira é
// diferencial premium, não restrição) e sem alegação terapêutica.
// ============================================================

var LEXICO_CATEGORIAS = {
  'metodo-preparo': 'Métodos de preparo',
  'utensilio': 'Utensílios',
  'botanica': 'Botânica & processo',
  'cultural-br': 'Cultura brasileira',
  'cultural-global': 'Cultura global',
  'sensorial': 'Sensorial & degustação',
};

var LEXICO_TERMOS = [
  // ── Métodos de preparo ──────────────────────────────────────
  { slug: 'gongfu-cha', termo: 'Gongfu Cha', categoria: 'metodo-preparo', pron: 'góng-fu chá', origem: 'chinês 工夫茶', trad: 'chá feito com habilidade',
    def: 'Método chinês de preparo com bule pequeno (gaiwan ou Yixing), alta proporção de folhas e várias infusões curtas e sucessivas — cada uma revela uma faceta diferente do chá.', rel: ['gaiwan', 'yixing', 'chahai', 'bowl-brewing'], ervas: [] },
  { slug: 'chanoyu', termo: 'Chanoyu', categoria: 'metodo-preparo', pron: 'chá-no-iú', origem: 'japonês 茶の湯', trad: 'água quente para chá',
    def: 'A cerimônia japonesa do chá: preparo ritualizado de matcha batido com chasen, regido por estética e atenção plena (wabi-sabi).', rel: ['chasen', 'chawan', 'chashaku', 'umami'], ervas: [] },
  { slug: 'samovar', termo: 'Samovar', categoria: 'metodo-preparo', origem: 'russo самовар', trad: 'que ferve por si',
    def: 'Recipiente metálico russo que mantém água quente e um concentrado de chá (zavarka) diluído a gosto na xícara — base da cultura de chá do leste europeu e Oriente Médio.', rel: ['cay', 'kettle'], ervas: [] },
  { slug: 'cay', termo: 'Çay', categoria: 'metodo-preparo', pron: 'tchái', origem: 'turco',
    def: 'Chá preto turco preparado em bule duplo (çaydanlık): concentrado no bule de cima, água no de baixo, servido em copos-tulipa.', rel: ['samovar'], ervas: [] },
  { slug: 'atay', termo: 'Atay', categoria: 'metodo-preparo', origem: 'árabe magrebino',
    def: 'Chá verde à moda do Magrebe, fervido com muita hortelã e açúcar e servido de altura para formar espuma — ritual de hospitalidade.', rel: ['ocidental'], ervas: ['hortela'] },
  { slug: 'chimarrao', termo: 'Chimarrão', categoria: 'metodo-preparo', origem: 'espanhol platino cimarrón',
    def: 'Infusão quente de erva-mate na cuia, sorvida pela bomba e recarregada em rodadas — ritual comunitário do sul da América do Sul.', rel: ['cuia', 'bombilha', 'terere-gaucho', 'mate-de-cuia'], ervas: ['erva-mate'] },
  { slug: 'terere', termo: 'Tereré', categoria: 'metodo-preparo', origem: 'guarani',
    def: 'Versão gelada do mate, com água fria ou suco na cuia — típico do Paraguai e do Centro-Oeste brasileiro, refresco dos dias quentes.', rel: ['chimarrao', 'cuia', 'bombilha'], ervas: ['erva-mate'] },
  { slug: 'cold-brew', termo: 'Cold Brew', categoria: 'metodo-preparo', origem: 'inglês', trad: 'infusão a frio',
    def: 'Infusão longa (6–12 h) em água fria: extrai doçura e aroma com pouquíssimo amargor e menos cafeína que a infusão quente.', rel: ['ice-brew', 'grandpa-style'], ervas: [] },
  { slug: 'ice-brew', termo: 'Ice Brew', categoria: 'metodo-preparo', origem: 'inglês', trad: 'infusão no gelo',
    def: 'Preparo em que gelo derrete lentamente sobre as folhas, extraindo um licor concentrado, doce e delicado — comum com chás verdes finos.', rel: ['cold-brew'], ervas: [] },
  { slug: 'grandpa-style', termo: 'Grandpa Style', categoria: 'metodo-preparo', origem: 'inglês', trad: 'estilo do vovô',
    def: 'Folhas soltas direto no copo, recarregado com água conforme se bebe — o jeito informal e cotidiano de tomar chá na China.', rel: ['bowl-brewing', 'cold-brew'], ervas: [] },
  { slug: 'bowl-brewing', termo: 'Bowl Brewing', categoria: 'metodo-preparo', origem: 'inglês', trad: 'infusão na tigela',
    def: 'Infusão livre das folhas numa tigela larga, bebida direto dela — método antigo, hoje reencontrado no chá artesanal.', rel: ['grandpa-style', 'chawan'], ervas: [] },
  { slug: 'ocidental', termo: 'Preparo Ocidental', categoria: 'metodo-preparo',
    def: 'A forma difundida no Ocidente: pouca folha, muito volume, uma única infusão mais longa — simples e prático.', rel: ['gongfu-cha', 'infusor'], ervas: [] },

  // ── Utensílios ──────────────────────────────────────────────
  { slug: 'gaiwan', termo: 'Gaiwan', categoria: 'utensilio', pron: 'gái-uan', origem: 'chinês 蓋碗', trad: 'tigela com tampa',
    def: 'Tigela chinesa com tampa e pires, versátil para infundir e servir; a tampa segura as folhas ao verter.', rel: ['gongfu-cha', 'chahai', 'chazhong'], ervas: [] },
  { slug: 'yixing', termo: 'Yixing', categoria: 'utensilio', pron: 'i-shing', origem: 'chinês 宜興',
    def: 'Bule de argila roxa não vitrificada de Yixing que, com o uso, absorve e devolve aroma — tradicionalmente dedicado a um único tipo de chá.', rel: ['gongfu-cha', 'gaiwan'], ervas: ['pu-erh'] },
  { slug: 'chasen', termo: 'Chasen', categoria: 'utensilio', pron: 'chá-sen', origem: 'japonês 茶筅',
    def: 'Batedor de bambu esculpido em finas hastes, usado para bater o matcha até formar espuma cremosa.', rel: ['chanoyu', 'chawan', 'chashaku'], ervas: ['matcha'] },
  { slug: 'chashaku', termo: 'Chashaku', categoria: 'utensilio', pron: 'chá-shá-ku', origem: 'japonês 茶杓',
    def: 'Colher fina de bambu para dosar o matcha em pó no chawan.', rel: ['chanoyu', 'chasen'], ervas: ['matcha'] },
  { slug: 'chawan', termo: 'Chawan', categoria: 'utensilio', pron: 'chá-uan', origem: 'japonês 茶碗', trad: 'tigela de chá',
    def: 'Tigela larga em que o matcha é batido e bebido; sua forma muda com a estação.', rel: ['chanoyu', 'chasen', 'hagi'], ervas: ['matcha'] },
  { slug: 'chahai', termo: 'Chahai', categoria: 'utensilio', pron: 'chá-rái', origem: 'chinês 茶海', trad: 'mar de chá',
    def: 'Jarra de equalização (também gongdaobei) que recebe o licor antes de servir, uniformizando a força entre as xícaras.', rel: ['gongfu-cha', 'gaiwan'], ervas: [] },
  { slug: 'kyusu', termo: 'Kyusu', categoria: 'utensilio', pron: 'kiú-su', origem: 'japonês 急須',
    def: 'Bule japonês, muitas vezes com alça lateral e filtro interno de cerâmica, ideal para chás verdes como sencha.', rel: ['tetsubin', 'sieve'], ervas: [] },
  { slug: 'hagi', termo: 'Hagi', categoria: 'utensilio', origem: 'japonês 萩焼',
    def: 'Cerâmica japonesa porosa e clara que se transforma com o uso (as trincas se tingem de chá) — muito valorizada no chanoyu.', rel: ['chawan'], ervas: [] },
  { slug: 'tetsubin', termo: 'Tetsubin', categoria: 'utensilio', pron: 'te-tsú-bin', origem: 'japonês 鉄瓶',
    def: 'Chaleira japonesa de ferro fundido que aquece a água de forma estável e, dizem, arredonda seu sabor.', rel: ['kettle', 'kyusu'], ervas: [] },
  { slug: 'cuia', termo: 'Cuia', categoria: 'utensilio', origem: 'guarani/tupi',
    def: 'Recipiente do mate, feito do porongo (cabaça) curado, onde se enche a erva para o chimarrão ou tereré.', rel: ['chimarrao', 'bombilha', 'terere'], ervas: ['erva-mate'] },
  { slug: 'bombilha', termo: 'Bombilha', categoria: 'utensilio', origem: 'espanhol platino',
    def: 'Canudo metálico com filtro na ponta que separa a erva do líquido ao sorver o mate.', rel: ['cuia', 'chimarrao'], ervas: ['erva-mate'] },
  { slug: 'infusor', termo: 'Infusor', categoria: 'utensilio',
    def: 'Cesto ou bola perfurada que segura as folhas soltas dentro da xícara ou bule — prático, mas limita a expansão da folha.', rel: ['sieve', 'ocidental'], ervas: [] },
  { slug: 'chazhong', termo: 'Chazhong', categoria: 'utensilio', origem: 'chinês 茶盅',
    def: 'Outro nome para o conjunto tigela-com-tampa próximo do gaiwan, usado para infundir e beber.', rel: ['gaiwan'], ervas: [] },
  { slug: 'sieve', termo: 'Coador (sieve)', categoria: 'utensilio', origem: 'inglês',
    def: 'Peneira fina colocada sobre a xícara para reter partículas ao verter o licor — essencial em chás quebrados.', rel: ['infusor', 'chahai'], ervas: [] },
  { slug: 'kettle', termo: 'Chaleira (kettle)', categoria: 'utensilio', origem: 'inglês',
    def: 'A chaleira; em chás finos, o controle de temperatura da água é tão importante quanto a folha.', rel: ['tetsubin', 'samovar'], ervas: [] },

  // ── Botânica & processo ─────────────────────────────────────
  { slug: 'camellia-sinensis', termo: 'Camellia sinensis', categoria: 'botanica', origem: 'latim botânico',
    def: 'A planta do chá verdadeiro: branco, verde, amarelo, oolong, preto e pu-erh vêm todos dela — o que muda é o processamento da folha.', rel: ['oxidacao', 'orthodox', 'terroir'], ervas: [] },
  { slug: 'terroir', termo: 'Terroir', categoria: 'botanica', origem: 'francês',
    def: 'Conjunto de solo, altitude, clima e manejo que imprime caráter único ao chá de cada lugar — como no vinho.', rel: ['single-estate', 'single-origin', 'gushu'], ervas: [] },
  { slug: 'sapecagem', termo: 'Sapecagem', categoria: 'botanica', origem: 'tupi (sapek)',
    def: 'Passagem rápida das folhas pelo calor/fogo que interrompe a oxidação — no mate, define o verde e o sabor característicos.', rel: ['fixing', 'sapecagem-do-mate', 'defumacao'], ervas: ['erva-mate'] },
  { slug: 'oxidacao', termo: 'Oxidação', categoria: 'botanica',
    def: 'Reação enzimática (com o oxigênio) que escurece a folha rompida e cria os aromas: pouca no verde, total no preto, parcial no oolong.', rel: ['fermentacao', 'rolling', 'fixing'], ervas: [] },
  { slug: 'fermentacao', termo: 'Fermentação', categoria: 'botanica',
    def: 'Transformação por micro-organismos — no pu-erh maduro (shou), diferente da oxidação enzimática, com a qual é frequentemente confundida.', rel: ['oxidacao'], ervas: ['pu-erh'] },
  { slug: 'withering', termo: 'Withering (murchamento)', categoria: 'botanica', origem: 'inglês',
    def: 'Primeira etapa após a colheita: as folhas perdem umidade e ficam maleáveis, preparando-se para o enrolamento.', rel: ['rolling', 'drying'], ervas: [] },
  { slug: 'rolling', termo: 'Rolling (enrolamento)', categoria: 'botanica', origem: 'inglês',
    def: 'Amassar/enrolar as folhas para romper células e liberar sucos — controla o grau de oxidação e a forma final.', rel: ['oxidacao', 'withering', 'orthodox'], ervas: [] },
  { slug: 'fixing', termo: 'Fixing (fixação)', categoria: 'botanica', origem: 'inglês',
    def: 'Aplicação de calor (kill-green) que desativa as enzimas e "trava" o chá no ponto desejado de oxidação.', rel: ['oxidacao', 'sapecagem'], ervas: [] },
  { slug: 'drying', termo: 'Drying (secagem)', categoria: 'botanica', origem: 'inglês',
    def: 'Etapa final que reduz a umidade para conservação e fixa o aroma — pode ser em forno, ao sol ou sobre brasa.', rel: ['withering', 'defumacao'], ervas: [] },
  { slug: 'shade-grown', termo: 'Shade-grown (cultivo à sombra)', categoria: 'botanica', origem: 'inglês',
    def: 'Sombrear a planta semanas antes da colheita eleva clorofila e L-teanina — técnica do gyokuro e do matcha, que ganham cor viva e umami.', rel: ['umami', 'camellia-sinensis'], ervas: ['matcha'] },
  { slug: 'gushu', termo: 'Gushu', categoria: 'botanica', origem: 'chinês 古樹', trad: 'árvore antiga',
    def: 'Chá de árvores centenárias (sobretudo pu-erh), de raízes profundas e sabor complexo e persistente.', rel: ['terroir', 'fermentacao'], ervas: ['pu-erh'] },
  { slug: 'tippy', termo: 'Tippy', categoria: 'botanica', origem: 'inglês',
    def: 'Chá rico em brotos (tips) com penugem dourada — sinal de colheita fina e sabor mais aveludado.', rel: ['orthodox', 'single-estate'], ervas: [] },
  { slug: 'single-estate', termo: 'Single Estate', categoria: 'botanica', origem: 'inglês', trad: 'fazenda única',
    def: 'Chá proveniente de uma só propriedade, preservando a identidade daquele lugar em vez de misturar origens.', rel: ['single-origin', 'terroir', 'blend'], ervas: [] },
  { slug: 'blend', termo: 'Blend', categoria: 'botanica', origem: 'inglês', trad: 'mistura',
    def: 'Combinação de chás e/ou ervas para criar um perfil consistente ou autoral — a arte de compor sabores.', rel: ['single-origin', 'single-estate'], ervas: [] },
  { slug: 'single-origin', termo: 'Single Origin', categoria: 'botanica', origem: 'inglês', trad: 'origem única',
    def: 'Chá de uma única região ou safra, sem mistura — valoriza a rastreabilidade e o caráter do terroir.', rel: ['single-estate', 'terroir', 'blend'], ervas: [] },
  { slug: 'orthodox', termo: 'Orthodox', categoria: 'botanica', origem: 'inglês',
    def: 'Processamento artesanal que mantém a folha inteira e enrolada, preservando complexidade — o oposto do CTC.', rel: ['ctc', 'rolling', 'tippy'], ervas: [] },
  { slug: 'ctc', termo: 'CTC', categoria: 'botanica', origem: 'inglês', trad: 'Crush, Tear, Curl',
    def: 'Método industrial que tritura a folha em grânulos para infusão rápida e forte — base de muitos chás de saquinho e do masala chai.', rel: ['orthodox', 'masala-chai'], ervas: [] },
  { slug: 'defumacao', termo: 'Defumação', categoria: 'botanica',
    def: 'Secagem sobre fumaça que confere notas amadeiradas — do lapsang souchong chinês às ervas defumadas de tradições ameríndias.', rel: ['drying', 'defumacao-amazonica'], ervas: [] },

  // ── Cultura brasileira ──────────────────────────────────────
  { slug: 'chazeria', termo: 'Chazeria', categoria: 'cultural-br',
    def: 'Casa dedicada ao chá — espaço de degustação, curadoria e encontro. No Ervatório, também o nome da cultura de chá que celebramos.', rel: ['chazeiro'], ervas: [] },
  { slug: 'chazeiro', termo: 'Chazeiro(a)', categoria: 'cultural-br',
    def: 'Quem cultiva o gosto e o saber do chá — do apreciador curioso ao especialista. É a persona do público do Ervatório.', rel: ['chazeria'], ervas: [] },
  { slug: 'garrafada', termo: 'Garrafada', categoria: 'cultural-br',
    def: 'Preparação tradicional brasileira de raízes, cascas e folhas maceradas em líquido, engarrafada — patrimônio da medicina popular. (Uso cultural; não é prescrição.)', rel: ['comercio-de-ervas', 'benzedeira'], ervas: [] },
  { slug: 'banho-de-assento', termo: 'Banho de assento', categoria: 'cultural-br',
    def: 'Prática popular de imersão em infusão morna de ervas — presente na cultura de cuidado tradicional. (Contexto cultural, sem finalidade terapêutica afirmada.)', rel: ['garrafada'], ervas: [] },
  { slug: 'simpatia', termo: 'Simpatia', categoria: 'cultural-br',
    def: 'Pequeno ritual da cultura popular brasileira, muitas vezes com ervas e gestos simbólicos — expressão de fé e tradição oral.', rel: ['benzedeira', 'defumacao-amazonica'], ervas: [] },
  { slug: 'defumacao-amazonica', termo: 'Defumação amazônica', categoria: 'cultural-br',
    def: 'Uso ritual da fumaça de cascas, resinas e ervas (como breu e ervas de banho) em tradições da Amazônia — o Ver-o-Peso é seu maior mercado.', rel: ['defumacao', 'comercio-de-ervas', 'simpatia'], ervas: [] },
  { slug: 'mate-de-cuia', termo: 'Mate de cuia', categoria: 'cultural-br',
    def: 'O mate bebido na cuia com bomba — nome genérico do chimarrão e do tereré, âncora da sociabilidade sulista e centro-oestina.', rel: ['chimarrao', 'terere', 'cuia'], ervas: ['erva-mate'] },
  { slug: 'terere-gaucho', termo: 'Tereré / roda de mate', categoria: 'cultural-br',
    def: 'A roda de mate como prática social: a cuia circula entre pessoas, cada rodada um gesto de pertencimento e conversa.', rel: ['chimarrao', 'terere', 'mate-de-cuia'], ervas: ['erva-mate'] },
  { slug: 'sapecagem-do-mate', termo: 'Sapecagem do mate', categoria: 'cultural-br',
    def: 'A sapecagem aplicada à erva-mate: o fogo rápido logo após a colheita fixa a cor verde e o sabor antes da secagem e moagem.', rel: ['sapecagem', 'fixing'], ervas: ['erva-mate'] },
  { slug: 'comercio-de-ervas', termo: 'Comércio de ervas', categoria: 'cultural-br',
    def: 'A rede de erveiros e mercados (como o Ver-o-Peso, em Belém) que mantém vivo o saber botânico popular do Brasil.', rel: ['defumacao-amazonica', 'garrafada'], ervas: [] },
  { slug: 'benzedeira', termo: 'Benzedeira(o)', categoria: 'cultural-br',
    def: 'Figura da tradição popular que usa ervas, rezas e gestos em rituais de cuidado — patrimônio imaterial da cultura brasileira.', rel: ['simpatia', 'garrafada'], ervas: [] },
  { slug: 'mate-cocido', termo: 'Mate cocido', categoria: 'cultural-br', origem: 'espanhol platino',
    def: 'Erva-mate fervida e coada, servida como chá quente (às vezes com leite) — comum no Paraguai, Argentina e sul do Brasil.', rel: ['chimarrao', 'mate-de-cuia'], ervas: ['erva-mate'] },

  // ── Cultura global ──────────────────────────────────────────
  { slug: 'afternoon-tea', termo: 'Afternoon Tea', categoria: 'cultural-global', origem: 'inglês',
    def: 'O chá da tarde britânico (por volta das 16h) com chá, sanduíches, scones e doces — criado no século XIX como refeição leve.', rel: ['high-tea', 'low-tea', 'cha-das-cinco'], ervas: [] },
  { slug: 'high-tea', termo: 'High Tea', categoria: 'cultural-global', origem: 'inglês',
    def: 'Apesar do nome sugerir sofisticação, era a refeição substancial do fim do dia da classe trabalhadora, feita à mesa alta.', rel: ['afternoon-tea', 'low-tea'], ervas: [] },
  { slug: 'low-tea', termo: 'Low Tea', categoria: 'cultural-global', origem: 'inglês',
    def: 'Sinônimo do afternoon tea: servido em mesas baixas de sala de estar — o "chá elegante" da aristocracia.', rel: ['afternoon-tea', 'high-tea'], ervas: [] },
  { slug: 'tiffin', termo: 'Tiffin', categoria: 'cultural-global', origem: 'anglo-indiano',
    def: 'Refeição leve indiana entre as principais, muitas vezes acompanhada de chai — e a marmita empilhável de mesmo nome.', rel: ['masala-chai', 'chai-wallah'], ervas: [] },
  { slug: 'masala-chai', termo: 'Masala Chai', categoria: 'cultural-global', origem: 'hindi मसाला चाय', trad: 'chá temperado',
    def: 'Chá preto fervido com leite, açúcar e especiarias (cardamomo, gengibre, canela, cravo) — bebida cotidiana da Índia.', rel: ['chai-wallah', 'ctc', 'tiffin'], ervas: ['gengibre', 'canela'] },
  { slug: 'chai-wallah', termo: 'Chai Wallah', categoria: 'cultural-global', origem: 'hindi',
    def: 'O vendedor de chai das ruas e estações da Índia, que prepara e serve o chá em grande volume — instituição social.', rel: ['masala-chai', 'tiffin'], ervas: [] },
  { slug: 'dim-sum', termo: 'Dim Sum', categoria: 'cultural-global', origem: 'cantonês 點心',
    def: 'Pequenos pratos cantoneses servidos com chá (yum cha, "beber chá") — o chá corta a gordura e limpa o paladar entre bocados.', rel: ['yancha'], ervas: [] },
  { slug: 'yerba', termo: 'Yerba', categoria: 'cultural-global', origem: 'espanhol', trad: 'erva',
    def: 'Nome hispano-americano da erva-mate; "yerba mate" é a grafia difundida internacionalmente.', rel: ['mate-cocido', 'mate-de-cuia'], ervas: ['erva-mate'] },
  { slug: 'mukuna', termo: 'Mukuna', categoria: 'cultural-global',
    def: 'Termo associado a preparos e sementes de tradições africanas e ameríndias — exemplo da diversidade de "chás" fora do eixo asiático.', rel: ['comercio-de-ervas'], ervas: [] },
  { slug: 'plantacao', termo: 'Plantação (jardim de chá)', categoria: 'cultural-global',
    def: 'Os "tea gardens" — de Darjeeling a Uji — onde altitude e microclima definem safras nomeadas (flushes) e reputações.', rel: ['terroir', 'single-estate', 'pre-qingming'], ervas: [] },
  { slug: 'cha-das-cinco', termo: 'Chá das cinco', categoria: 'cultural-global',
    def: 'Expressão popularizada em português para o ritual do chá da tarde — pausa social em torno da xícara.', rel: ['afternoon-tea'], ervas: [] },

  // ── Sensorial & degustação ──────────────────────────────────
  { slug: 'hui-gan', termo: 'Hui Gan', categoria: 'sensorial', pron: 'ruêi-gan', origem: 'chinês 回甘', trad: 'doçura que retorna',
    def: 'A doçura que ressurge na garganta após um gole amargo — marca de qualidade em oolongs e pu-erhs.', rel: ['finish', 'astringencia'], ervas: [] },
  { slug: 'mao-cha', termo: 'Mao Cha', categoria: 'sensorial', origem: 'chinês 毛茶', trad: 'chá bruto',
    def: 'Chá semiacabado (sobretudo o pu-erh antes de prensar/envelhecer) — o material de base do produto final.', rel: ['fermentacao', 'gushu'], ervas: ['pu-erh'] },
  { slug: 'tea-drunk', termo: 'Tea Drunk (cha zui)', categoria: 'sensorial', origem: 'chinês 茶醉',
    def: 'Estado leve de euforia e relaxamento após beber muito chá potente de estômago vazio — sensação descrita por apreciadores.', rel: ['gushu', 'yancha'], ervas: [] },
  { slug: 'yancha', termo: 'Yancha', categoria: 'sensorial', origem: 'chinês 岩茶', trad: 'chá de rocha',
    def: 'Oolongs de Wuyi cultivados entre penhascos, com o mineral "yan yun" (charme rochoso) no sabor.', rel: ['terroir', 'hui-gan'], ervas: [] },
  { slug: 'zairai', termo: 'Zairai', categoria: 'sensorial', origem: 'japonês 在来',
    def: 'Chá japonês de sementes nativas (não clonado), de perfil irregular e caráter rústico e autêntico.', rel: ['single-origin'], ervas: [] },
  { slug: 'kuradashi', termo: 'Kuradashi', categoria: 'sensorial', origem: 'japonês 蔵出し', trad: 'saído do armazém',
    def: 'Chá japonês envelhecido alguns anos em armazém frio antes de sair — ganha corpo e suavidade.', rel: ['finish', 'body'], ervas: [] },
  { slug: 'pre-qingming', termo: 'Pré-Qingming', categoria: 'sensorial', origem: 'chinês 明前',
    def: 'Chás verdes colhidos antes do festival Qingming (início de abril): brotos tenros, doçura e altíssima estima.', rel: ['tippy', 'plantacao'], ervas: [] },
  { slug: 'umami', termo: 'Umami', categoria: 'sensorial', origem: 'japonês 旨味', trad: 'saborosidade',
    def: 'O quinto sabor, salivante e "brothy", marcante em chás verdes cultivados à sombra como gyokuro e matcha.', rel: ['shade-grown', 'body'], ervas: ['matcha'] },
  { slug: 'astringencia', termo: 'Adstringência', categoria: 'sensorial',
    def: 'Sensação tátil de secura e aperto na boca, causada pelos taninos — desejável em equilíbrio, desagradável em excesso.', rel: ['body', 'hui-gan'], ervas: [] },
  { slug: 'body', termo: 'Corpo (body)', categoria: 'sensorial', origem: 'inglês',
    def: 'A "densidade" do licor na boca — de aquoso a encorpado e aveludado; parte central da textura do chá.', rel: ['finish', 'astringencia', 'umami'], ervas: [] },
  { slug: 'finish', termo: 'Final (finish)', categoria: 'sensorial', origem: 'inglês',
    def: 'O rastro de sabor que permanece após engolir — curto e simples ou longo e evolutivo, indica a qualidade do chá.', rel: ['hui-gan', 'body'], ervas: [] },
];

// Exporta para o browser (visão in-app futura) e para o Node (prerender).
if (typeof window !== 'undefined') { window.LEXICO_TERMOS = LEXICO_TERMOS; window.LEXICO_CATEGORIAS = LEXICO_CATEGORIAS; }
if (typeof module !== 'undefined' && module.exports) { module.exports = { LEXICO_TERMOS, LEXICO_CATEGORIAS }; }

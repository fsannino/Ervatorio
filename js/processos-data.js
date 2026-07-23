// ============================================================
// ERVATÓRIO — Série "Como se faz" (Onda 2.3 / trilha editorial)
// ============================================================
// 7 artigos sobre as etapas de processamento de chá e ervas.
// Fonte de dados única, lida pelo prerender (scripts/prerender.mjs)
// para gerar páginas estáticas indexáveis em /como-se-faz/<slug>/.
//
// Campos:
//   slug, ordem, titulo, subtitulo, tldr, tempo_min
//   secoes: [{ h: 'subtítulo', p: ['parágrafo', ...] }]
//   rel_lexico: slugs de termos do Léxico (o prerender só linka os que existem)
//   rel_ervas:  slugs de fichas (idem)
//   referencias: [{ titulo, autor, ano }]
//
// Regras: conteúdo cultural/técnico, factual, sem alegação terapêutica.
// ============================================================

var PROCESSOS = [
  {
    slug: 'colheita', ordem: 1, titulo: 'Colheita', subtitulo: 'O que faz a folha certa', tempo_min: 6,
    tldr: 'Nem toda folha vira bom chá. O ponto de colheita — quais folhas, em que época e como — define o teto de qualidade de tudo que vem depois.',
    secoes: [
      { h: 'Duas folhas e um broto', p: [
        'A colheita fina do chá segue uma regra antiga: colher o broto ainda fechado e as duas folhas mais novas logo abaixo dele. Essa porção concentra os compostos mais delicados da planta — aminoácidos como a L-teanina, açúcares e a penugem prateada dos brotos (os "tips") que assinam os chás mais valorizados.',
        'Quanto mais para baixo no ramo, mais fibrosa e madura é a folha, com mais taninos e menos doçura. Colheitas mecânicas rápidas pegam tudo de uma vez; a colheita manual escolhe folha por folha. É por isso que um chá "tippy" custa o que custa: ele exige mãos e tempo.',
      ] },
      { h: 'A época importa mais que a técnica', p: [
        'O momento do ano muda o chá de forma tão marcante que as safras ganham nome próprio. Em Darjeeling, o "first flush" da primavera é floral e leve; o "second flush" do verão é encorpado e amoscatelado. Chás verdes chineses colhidos antes do festival Qingming, no início de abril, são os mais doces e caros do ano.',
        'No Brasil, a erva-mate tem sua própria lógica de safra: a colheita principal (a "safra") ocorre no inverno, quando a planta acumula reservas — período que muitos ervateiros consideram o de melhor sabor.',
      ] },
      { h: 'O relógio começa a correr', p: [
        'No instante em que a folha é destacada do ramo, ela deixa de receber água e começa a se transformar. A partir daí, tudo é uma corrida controlada: o processador tem horas, não dias, para conduzir o murchamento antes que a folha se estrague. Uma colheita perfeita pode ser arruinada por um transporte quente e demorado até a fábrica.',
      ] },
    ],
    rel_lexico: ['tippy', 'pre-qingming', 'plantacao', 'terroir'], rel_ervas: ['erva-mate'],
    referencias: [
      { titulo: 'Tea: History, Terroirs, Varieties', autor: 'Kevin Gascoyne et al.', ano: 2018 },
    ],
  },
  {
    slug: 'murchamento', ordem: 2, titulo: 'Murchamento', subtitulo: 'A folha que respira', tempo_min: 6,
    tldr: 'Antes de qualquer transformação de sabor, a folha precisa perder água. O murchamento (withering) a deixa maleável e liga o motor químico do chá.',
    secoes: [
      { h: 'Perder água para ganhar sabor', p: [
        'A folha recém-colhida é rígida e cheia de água — cerca de 75% do seu peso. Se você tentasse enrolá-la nesse estado, ela quebraria. O murchamento resolve isso: espalhada em esteiras ou tapetes por horas, a folha perde parte da umidade e fica flexível como couro macio.',
        'Mas o murchamento não é só desidratação mecânica. Enquanto a água evapora, enzimas dentro da célula começam a agir e precursores de aroma se acumulam. É a primeira etapa em que o sabor do chá começa, de fato, a nascer.',
      ] },
      { h: 'Murchamento físico e químico', p: [
        'Os processadores falam em dois murchamentos simultâneos. O "físico" é a perda de água que deixa a folha maleável. O "químico" é a quebra lenta de proteínas e clorofila, que gera aminoácidos, açúcares simples e compostos aromáticos — a matéria-prima do que virá na oxidação.',
        'Controlar temperatura, umidade e circulação de ar é uma arte. Ar frio e úmido demais atrasa tudo; ar quente demais "cozinha" a folha e mata as enzimas cedo. Chás brancos, os menos processados de todos, são essencialmente folha murchada e seca — por isso o murchamento define quase todo o seu caráter.',
      ] },
    ],
    rel_lexico: ['withering', 'oxidacao', 'rolling'], rel_ervas: [],
    referencias: [
      { titulo: 'The Story of Tea', autor: 'Mary Lou Heiss & Robert J. Heiss', ano: 2007 },
    ],
  },
  {
    slug: 'enrolamento', ordem: 3, titulo: 'Enrolamento', subtitulo: 'Fricção e suco', tempo_min: 6,
    tldr: 'Enrolar a folha rompe suas células e libera os sucos onde o oxigênio vai agir. É aqui que se decide entre a folha inteira artesanal e o grânulo industrial.',
    secoes: [
      { h: 'Por que amassar a folha', p: [
        'Depois de murcha, a folha é enrolada, torcida e amassada. O objetivo não é estético: a fricção rompe as paredes das células e faz vazar os sucos e enzimas que estavam presos. É esse contato entre suco e oxigênio que dispara a oxidação — sem enrolamento, não há chá preto ou oolong.',
        'O grau de amassamento também molda a folha final: uma torção suave preserva folhas longas e inteiras; um amassamento intenso cria bolinhas apertadas, como no oolong estilo Tieguanyin, que se abrem lentamente na água.',
      ] },
      { h: 'Orthodox versus CTC', p: [
        'Há dois mundos aqui. O método "orthodox" mantém a folha inteira e enrolada, preservando complexidade e permitindo várias infusões — é o chá artesanal. O método CTC (Crush, Tear, Curl — esmaga, rasga, enrola) passa a folha por rolos dentados que a transformam em grânulos uniformes.',
        'O CTC nasceu para a escala industrial: infunde rápido, forte e barato, ideal para chá de saquinho e para o masala chai indiano, que precisa aguentar leite e especiarias. Não é "pior" — é uma escolha para um propósito diferente. Mas sacrifica a nuance da folha inteira.',
      ] },
    ],
    rel_lexico: ['rolling', 'orthodox', 'ctc', 'oxidacao', 'masala-chai'], rel_ervas: [],
    referencias: [
      { titulo: 'Tea: History, Terroirs, Varieties', autor: 'Kevin Gascoyne et al.', ano: 2018 },
    ],
  },
  {
    slug: 'oxidacao', ordem: 4, titulo: 'Oxidação', subtitulo: 'O tempo do oxigênio', tempo_min: 8,
    tldr: 'Oxidação NÃO é fermentação. É uma reação enzimática, controlada, e é ela que decide se sua folha vira chá verde, oolong ou preto.',
    secoes: [
      { h: 'Por que confundem oxidação e fermentação', p: [
        'Por décadas o chá preto foi chamado de "fermentado", e o erro pegou. Mas oxidação e fermentação são coisas diferentes. A oxidação do chá é uma reação enzimática: as enzimas liberadas no enrolamento reagem com o oxigênio do ar e transformam os compostos claros da folha em pigmentos escuros e aromas novos — o mesmo princípio de uma maçã cortada que escurece.',
        'Fermentação, no sentido correto, envolve micro-organismos. No mundo do chá, ela só aparece de verdade no pu-erh maduro (shou), onde bactérias e fungos agem sobre a folha ao longo do tempo. Chamar chá preto de fermentado é, tecnicamente, um engano histórico.',
      ] },
      { h: 'O espectro verde → preto', p: [
        'Todos os chás verdadeiros vêm da mesma planta, a Camellia sinensis. O que os separa é quanto de oxidação se permite antes de "travar" a folha com calor. Chá verde: oxidação interrompida quase no zero, mantém a cor e o frescor vegetal. Chá preto: oxidação levada ao máximo, cor escura e sabor maltado.',
        'O oolong vive no meio: oxidação parcial, de 10% a 80%, o que abre um leque enorme — de oolongs verdes e florais a oolongs escuros e tostados. É por isso que o oolong é considerado a categoria mais técnica: o processador segura o oxigênio no ponto exato e o congela ali.',
      ] },
      { h: 'A decisão irreversível', p: [
        'A oxidação é a etapa mais sensível e a mais irreversível. Alguns graus a mais de temperatura, alguns minutos a mais de espera, e o chá muda de identidade. Não há como voltar atrás: uma folha superoxidada nunca mais será um chá verde. Por isso o processador vigia cor, aroma e textura o tempo todo, esperando o instante de passar para a fixação.',
      ] },
    ],
    rel_lexico: ['oxidacao', 'fermentacao', 'camellia-sinensis', 'fixing', 'yancha'], rel_ervas: ['pu-erh'],
    referencias: [
      { titulo: 'The Story of Tea', autor: 'Mary Lou Heiss & Robert J. Heiss', ano: 2007 },
      { titulo: 'Tea: A Nerd’s Eye View', autor: 'Virginia Utermohlen Lovelace', ano: 2019 },
    ],
  },
  {
    slug: 'fixacao', ordem: 5, titulo: 'Fixação', subtitulo: 'Parar o tempo', tempo_min: 7,
    tldr: 'A fixação usa calor para desligar as enzimas e "travar" o chá no ponto de oxidação desejado. Cada tradição tem seu jeito — e o Brasil tem a sapecagem.',
    secoes: [
      { h: 'Desligar o motor com calor', p: [
        'Depois que a oxidação chega ao ponto certo, é preciso pará-la de imediato. A fixação (em inglês, "kill-green" ou "fixing") aplica calor suficiente para desnaturar as enzimas — sem elas, a oxidação simplesmente para. A partir daí o chá está estável e pode ser seco e guardado.',
        'O timing é tudo: fixar cedo demais deixa o chá cru e vegetal; tarde demais e ele passou do ponto. A fixação é o freio que define, em definitivo, o tipo de chá.',
      ] },
      { h: 'Três escolas, um objetivo', p: [
        'Na China, a forma clássica é o "pan-firing": as folhas são reviradas em grandes woks aquecidos, o que fixa o verde e ainda adiciona notas tostadas — pense num chá verde chinês como o Longjing. No Japão, prefere-se o vapor ("steaming"): rápido e intenso, preserva a cor verde vibrante e o umami dos sencha e gyokuro.',
        'No Brasil, a tradição tem nome próprio: a sapecagem. A palavra vem do tupi e descreve a passagem rápida das folhas pelo calor ou pela chama. Na erva-mate, a sapecagem logo após a colheita fixa o verde e o sabor característicos antes da secagem e da moagem — um gesto técnico que é também herança cultural.',
      ] },
    ],
    rel_lexico: ['fixing', 'sapecagem', 'sapecagem-do-mate', 'oxidacao'], rel_ervas: ['erva-mate'],
    referencias: [
      { titulo: 'The Story of Tea', autor: 'Mary Lou Heiss & Robert J. Heiss', ano: 2007 },
    ],
  },
  {
    slug: 'secagem', ordem: 6, titulo: 'Secagem', subtitulo: 'O último beijo', tempo_min: 6,
    tldr: 'A secagem tira a umidade final para o chá durar — e, bem feita, é também um último toque de sabor, do forno suave à brasa que perfuma.',
    secoes: [
      { h: 'Umidade sob controle', p: [
        'Mesmo depois da fixação, a folha ainda guarda água demais para ser conservada. A secagem final reduz a umidade a cerca de 3% — o suficiente para impedir mofo e estabilizar o chá por meses ou anos. Sem essa etapa, nenhum chá chegaria intacto à sua xícara.',
        'Mas secar não é só remover água. A temperatura e a forma da secagem imprimem caráter: um calor baixo e lento preserva delicadeza; um calor mais alto desenvolve notas tostadas, de nozes e caramelo. O "roasting" de certos oolongs é, no fundo, uma secagem prolongada e intencional.',
      ] },
      { h: 'Fornos, sol e brasa', p: [
        'Os métodos variam com a tradição. Fornos de ar quente dão controle preciso e são o padrão industrial. A secagem ao sol, mais antiga, é essencial no pu-erh cru, cujo material precisa manter micro-organismos vivos para envelhecer bem. E há a secagem sobre brasa, que empresta ao chá um leve aroma de fumaça — a fronteira entre secar e defumar.',
        'Depois de seco, o chá enfim descansa, é classificado e embalado. O que era uma folha viva no galho virou algo estável, aromático e pronto para reencontrar a água quente meses depois — do outro lado do mundo, se for o caso.',
      ] },
    ],
    rel_lexico: ['drying', 'defumacao', 'kuradashi', 'gushu'], rel_ervas: ['pu-erh'],
    referencias: [
      { titulo: 'Tea: History, Terroirs, Varieties', autor: 'Kevin Gascoyne et al.', ano: 2018 },
    ],
  },
  {
    slug: 'defumacao', ordem: 7, titulo: 'Defumação', subtitulo: 'O ritual amazônico', tempo_min: 7,
    tldr: 'Defumar ervas na fumaça de cascas e resinas é técnica ancestral — e, no Brasil, um saber vivo da Amazônia que quase nenhum guia global registra.',
    secoes: [
      { h: 'Fumaça como método', p: [
        'A defumação usa a fumaça de madeiras, cascas e resinas para secar e aromatizar. No chá, o exemplo mais famoso é o lapsang souchong chinês, seco sobre pinho e inconfundível pelo aroma amadeirado. Mas a lógica — conservar e perfumar com fumaça — é uma das mais antigas da humanidade, presente em quase todas as culturas.',
      ] },
      { h: 'O saber amazônico', p: [
        'No Brasil, a defumação de ervas é um patrimônio cultural vivo, sobretudo na Amazônia. Cascas, resinas como o breu e ervas de banho são queimadas em rituais de limpeza e ambientação que atravessam gerações. O mercado do Ver-o-Peso, em Belém, é a maior vitrine desse conhecimento: erveiras que dominam combinações transmitidas oralmente.',
        'Esse é um território que os grandes guias internacionais de chá simplesmente ignoram — e é justamente por isso que ele importa. Registrar a defumação amazônica com respeito, ouvindo mateiros, defumadores e benzedeiras, é preservar um saber que não existe em nenhum outro lugar. No Ervatório, tratamos isso como diferencial cultural, não como folclore exótico.',
      ] },
      { h: 'Uma nota de respeito', p: [
        'Falar dessas práticas é falar de cultura e de tradição — não de prescrição. A defumação aqui é apresentada pelo seu valor histórico, sensorial e simbólico. Qualquer uso de ervas com finalidade de saúde deve passar por profissional qualificado.',
      ] },
    ],
    rel_lexico: ['defumacao', 'defumacao-amazonica', 'comercio-de-ervas', 'benzedeira', 'simpatia'], rel_ervas: [],
    referencias: [
      { titulo: 'Plantas medicinais na Amazônia e a cultura do Ver-o-Peso', autor: 'diversos (etnobotânica)', ano: 2015 },
    ],
  },
];

if (typeof window !== 'undefined') { window.PROCESSOS = PROCESSOS; }
if (typeof module !== 'undefined' && module.exports) { module.exports = { PROCESSOS }; }

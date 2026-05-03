// js/quiz.js — Quiz "Qual chá brasileiro é você?" · Ervatório
// Depende de: HERBS (app.js), goPage, esc, toast, openHerbModal

(function () {
  // ════════════════════════════════════════════════════════════════
  // 12 ERVAS-PERSONAGEM
  // ════════════════════════════════════════════════════════════════
  var PERSONAGENS = [
    { slug: 'camomila',         id: 1,  arquetipo: 'A presença reconfortante',     subtitulo: 'Quem entra na sala e a temperatura abaixa um pouco',                                  cor: '#e6c96e', frase: 'Você é desses que sabem quando alguém precisa de silêncio. E ficam ali, em silêncio, junto.', combina: ['Tardes sem pressa','Conversas em voz baixa','Velas e cobertores'] },
    { slug: 'maracuja',         id: 3,  arquetipo: 'A delicadeza profunda',        subtitulo: 'Quem sente tudo demais, e por isso ama com tudo',                                      cor: '#a08fb5', frase: 'Sua sensibilidade não é fraqueza — é vocabulário. Você lê a sala como ninguém.',          combina: ['Música que dói gostoso','Janelas abertas à noite','Pessoas que te entendem em silêncio'] },
    { slug: 'melissa',          id: 4,  arquetipo: 'A calma cítrica',              subtitulo: 'Quem traz limão no chá e leveza na conversa',                                          cor: '#80c890', frase: 'Você equilibra o doce e o ácido. Calma sem moleza, energia sem alvoroço.',                 combina: ['Manhãs preguiçosas','Chá com mel e limão','Risadas com gente querida'] },
    { slug: 'gengibre',         id: 5,  arquetipo: 'O fogo vivaz',                 subtitulo: 'Quem ativa o ambiente sem pedir licença',                                              cor: '#e09060', frase: 'Você tem fogo na alma — mas é fogo que cura, que aquece, que move. Não é fogo que queima.',  combina: ['Manhãs frias com chá quente','Trabalho que pede coragem','Caminhadas longas'] },
    { slug: 'hibisco',          id: 7,  arquetipo: 'A intensidade vibrante',       subtitulo: 'Quem chega chegando, em rubi e exclamação',                                            cor: '#c84050', frase: 'Você não passa despercebido. E também não passa por cima de ninguém — só ocupa o seu espaço com cor.', combina: ['Vermelho profundo','Festas com pessoas que importam','Vitalidade pulsante'] },
    { slug: 'hortela',          id: 9,  arquetipo: 'A franqueza fresca',           subtitulo: 'Quem corta o gelo e a confusão com humor',                                             cor: '#7ec890', frase: 'Você tem o dom raro de dizer a verdade sem machucar. Sua honestidade é refrescante — literalmente.', combina: ['Conversas francas','Frio gostoso','Pessoas que riem com facilidade'] },
    { slug: 'alfazema',         id: 13, arquetipo: 'A delicadeza floral',          subtitulo: 'Quem perfuma a vida com pequenos gestos',                                              cor: '#a888c8', frase: 'Você sabe que o detalhe importa. Uma vela acesa, um bilhete escrito à mão, um cheiro bom no travesseiro.', combina: ['Lavanda no banho','Cartas escritas à mão','Anoiteceres lentos'] },
    { slug: 'boldo',            id: 14, arquetipo: 'A rabugice doce',              subtitulo: 'Quem fala a verdade mesmo que doa, mas sempre por amor',                               cor: '#a07050', frase: 'Você não tem paciência pra rodeio. Mas o que parece grosseria é, no fundo, cuidado direto.',     combina: ['Cafés amargos','Conversas longas no telefone','Famílias barulhentas'] },
    { slug: 'capim-limao',      id: 17, arquetipo: 'A doçura tropical',            subtitulo: 'Quem traz o sol num dia nublado',                                                      cor: '#d4c060', frase: 'Sua presença é dourada. Não brilha por brilhar — brilha porque é gerosa, é alegre, é vital.',     combina: ['Limonada gelada','Risadas altas','Música brasileira'] },
    { slug: 'erva-cidreira',    id: 19, arquetipo: 'A leveza serena',              subtitulo: 'Quem faz chá pra todo mundo da casa',                                                  cor: '#9ec8a0', frase: 'Você é desses que entram numa sala e a temperatura abaixa um pouco. Não pelo frio — pela paz que respira ao seu lado.', combina: ['Tardes sem pressa','Conversas em voz baixa','Janela aberta com vento de fim de dia'] },
    { slug: 'espinheira-santa', id: 20, arquetipo: 'A sabedoria antiga',           subtitulo: 'Quem ouve antes de aconselhar, e aconselha como benzedeira',                            cor: '#5a7a5a', frase: 'Você tem cabelo branco mesmo aos vinte — sabedoria precoce. As pessoas vão até você quando estão perdidas.',         combina: ['Bibliotecas','Avó na cozinha','Plantas em vaso de barro'] },
    { slug: 'guarana',          id: 27, arquetipo: 'A potência sul-americana',     subtitulo: 'Quem acorda o quarto, a rua, o bairro inteiro',                                        cor: '#d49040', frase: 'Você é energia condensada — não em pico de açúcar, mas em força sustentada. Quem está com você, anda mais.',   combina: ['Madrugadas produtivas','Música alta','Projetos ambiciosos'] },
    { slug: 'erva-mate',        id: 39, arquetipo: 'A força tranquila',            subtitulo: 'Quem sustenta a roda sem precisar liderar',                                            cor: '#5a7a4a', frase: 'Você tem a energia que dura. Sua presença é a infusão que continua quente na cuia que passa de mão em mão.', combina: ['Roda de amigos','Frio do Sul','Conversas que duram horas'] }
  ];

  // ════════════════════════════════════════════════════════════════
  // 8 PERGUNTAS — cada opção dá pontos a 1-3 ervas
  // ════════════════════════════════════════════════════════════════
  var PERGUNTAS = [
    {
      texto: 'Como você costuma começar o dia?',
      opcoes: [
        { texto: 'Acordo cedo, em silêncio, observando o mundo despertar.',     pts: { 'espinheira-santa': 2, 'camomila': 1, 'erva-mate': 1 } },
        { texto: 'Pulo da cama com música alta e cafeína no corpo.',            pts: { 'guarana': 3, 'gengibre': 1 } },
        { texto: 'Demoro pra acordar — preciso de um chá forte primeiro.',      pts: { 'boldo': 2, 'erva-mate': 1 } },
        { texto: 'Faço chá pra todo mundo da casa, rego as plantas, mando bom dia.', pts: { 'erva-cidreira': 2, 'capim-limao': 2, 'melissa': 1 } }
      ]
    },
    {
      texto: 'Numa reunião difícil, você é o tipo que…',
      opcoes: [
        { texto: 'Escuta atentamente antes de falar.',                          pts: { 'camomila': 2, 'espinheira-santa': 2 } },
        { texto: 'Acalma os ânimos com uma piada bem colocada.',                 pts: { 'hortela': 3, 'capim-limao': 1 } },
        { texto: 'Encara de frente, fala o que pensa, sem rodeio.',              pts: { 'boldo': 3, 'hibisco': 1 } },
        { texto: 'Fica nervoso, conta os minutos pra acabar.',                    pts: { 'maracuja': 3, 'melissa': 1 } }
      ]
    },
    {
      texto: 'Sua ideia de descanso perfeito é…',
      opcoes: [
        { texto: 'Cama quente, livro, chá e silêncio.',                          pts: { 'camomila': 2, 'alfazema': 2, 'erva-cidreira': 1 } },
        { texto: 'Festa lotada com amigos próximos.',                            pts: { 'hibisco': 3, 'capim-limao': 1 } },
        { texto: 'Trilha numa cachoeira, pés na terra.',                          pts: { 'hortela': 2, 'espinheira-santa': 1, 'gengibre': 1 } },
        { texto: 'Maratona de série na rede, debaixo do edredom.',               pts: { 'maracuja': 2, 'guarana': 1 } }
      ]
    },
    {
      texto: 'Quando alguém te conta um problema, você…',
      opcoes: [
        { texto: 'Escuta com atenção, dá conselho ponderado.',                    pts: { 'espinheira-santa': 3, 'camomila': 1 } },
        { texto: 'Faz piada pra desanuviar, depois ouve a sério.',                pts: { 'hortela': 2, 'capim-limao': 2 } },
        { texto: 'Sente junto, abraça apertado.',                                  pts: { 'erva-cidreira': 2, 'melissa': 2, 'maracuja': 1 } },
        { texto: 'Aponta o caminho prático: faça isso, isso e isso.',              pts: { 'boldo': 3, 'gengibre': 1 } }
      ]
    },
    {
      texto: 'Seu lugar favorito no mundo seria…',
      opcoes: [
        { texto: 'Praia ao amanhecer, com o sol entrando devagar.',                pts: { 'capim-limao': 2, 'hibisco': 1, 'melissa': 1 } },
        { texto: 'Floresta densa, cheiro de terra molhada.',                       pts: { 'espinheira-santa': 3, 'boldo': 1 } },
        { texto: 'Café aconchegante de inverno, vidro embaçado.',                  pts: { 'camomila': 2, 'alfazema': 2, 'erva-cidreira': 1 } },
        { texto: 'Festival ou show com multidão pulando junto.',                   pts: { 'guarana': 3, 'hibisco': 1 } }
      ]
    },
    {
      texto: 'O que mais te define, no fundo?',
      opcoes: [
        { texto: 'Sou quem segura a barra de todo mundo, sem reclamar.',           pts: { 'erva-mate': 3, 'espinheira-santa': 1 } },
        { texto: 'Sou o que faz a galera rir nos momentos pesados.',               pts: { 'hortela': 3, 'capim-limao': 1 } },
        { texto: 'Sou intenso — vivo no extremo, ou nada.',                         pts: { 'hibisco': 3, 'guarana': 1 } },
        { texto: 'Sou sensível, sinto demais, choro com filme.',                    pts: { 'maracuja': 3, 'melissa': 1, 'alfazema': 1 } }
      ]
    },
    {
      texto: 'Sua chave pra um bom dia é…',
      opcoes: [
        { texto: 'Acordar cedo, fazer exercício, suar.',                            pts: { 'gengibre': 2, 'guarana': 2, 'erva-mate': 1 } },
        { texto: 'Ter pelo menos uma conversa profunda.',                           pts: { 'espinheira-santa': 2, 'camomila': 1, 'maracuja': 1 } },
        { texto: 'Estar com quem amo — em pessoa ou no telefone.',                  pts: { 'erva-cidreira': 2, 'capim-limao': 2, 'melissa': 1 } },
        { texto: 'Conquistar alguma coisa concreta — riscar da lista.',             pts: { 'boldo': 2, 'hibisco': 1, 'guarana': 1 } }
      ]
    },
    {
      texto: 'Se fosse uma cor, seria…',
      opcoes: [
        { texto: 'Verde profundo da mata fechada.',                                 pts: { 'espinheira-santa': 2, 'erva-mate': 2, 'boldo': 1 } },
        { texto: 'Amarelo do mel, do sol, do mate.',                                pts: { 'camomila': 2, 'capim-limao': 2 } },
        { texto: 'Rubi, vermelho intenso, vinho velho.',                            pts: { 'hibisco': 3, 'guarana': 1 } },
        { texto: 'Lilás do entardecer, lavanda em flor.',                           pts: { 'alfazema': 3, 'maracuja': 1, 'melissa': 1 } }
      ]
    }
  ];

  // ════════════════════════════════════════════════════════════════
  // ESTADO E PERSISTÊNCIA
  // ════════════════════════════════════════════════════════════════
  var _state = { idx: 0, escolhas: [], pontos: {} };

  function inicializar() {
    _state = { idx: 0, escolhas: [], pontos: {} };
    PERSONAGENS.forEach(function (p) { _state.pontos[p.slug] = 0; });
  }

  function calcularResultado() {
    var maxSlug = null, maxVal = -1;
    Object.keys(_state.pontos).forEach(function (slug) {
      if (_state.pontos[slug] > maxVal) { maxVal = _state.pontos[slug]; maxSlug = slug; }
    });
    return maxSlug;
  }

  function salvarResultado(slug) {
    try { localStorage.setItem('erb_quiz_qual_cha', JSON.stringify({ slug: slug, at: Date.now() })); } catch (e) {}
  }

  function carregarResultadoSalvo() {
    try {
      var raw = localStorage.getItem('erb_quiz_qual_cha');
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  // ════════════════════════════════════════════════════════════════
  // RENDERIZAÇÃO
  // ════════════════════════════════════════════════════════════════
  function renderIntro() {
    var p = document.getElementById('page-quiz');
    if (!p) return;
    var salvo = carregarResultadoSalvo();
    var pers = salvo ? PERSONAGENS.find(function (x) { return x.slug === salvo.slug; }) : null;
    p.innerHTML = ''
      + '<div class="quiz-intro">'
      +   '<div class="quiz-eyebrow">QUIZ DE PERSONALIDADE</div>'
      +   '<h1 class="quiz-title">Qual chá brasileiro é você?</h1>'
      +   '<p class="quiz-lead">Oito perguntas e você descobre qual das doze ervas brasileiras tem mais a ver com o seu jeito de estar no mundo.</p>'
      +   '<div class="quiz-meta">8 perguntas · ~2 min · 12 resultados possíveis</div>'
      +   '<button class="quiz-start-btn" onclick="quizStart()">Começar</button>'
      +   (pers ? '<button class="quiz-resume-btn" onclick="goPage(\'quiz\',null,\'resultado/' + pers.slug + '\')">Ver meu último resultado: ' + esc(pers.arquetipo) + ' →</button>' : '')
      + '</div>';
  }

  function renderPergunta() {
    var p = document.getElementById('page-quiz');
    if (!p) return;
    var q = PERGUNTAS[_state.idx];
    var pct = Math.round((_state.idx / PERGUNTAS.length) * 100);
    var opcoesHtml = q.opcoes.map(function (o, i) {
      return '<button class="quiz-opcao" onclick="quizResponder(' + i + ')">' + esc(o.texto) + '</button>';
    }).join('');
    p.innerHTML = ''
      + '<div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:' + pct + '%"></div></div>'
      + '<div class="quiz-eyebrow">PERGUNTA ' + (_state.idx + 1) + ' DE ' + PERGUNTAS.length + '</div>'
      + '<h2 class="quiz-pergunta">' + esc(q.texto) + '</h2>'
      + '<div class="quiz-opcoes">' + opcoesHtml + '</div>'
      + (_state.idx > 0 ? '<button class="quiz-back-btn" onclick="quizVoltar()">← Voltar</button>' : '');
  }

  function renderResultado(slug) {
    if (typeof trackAction === 'function') trackAction('quiz-complete');
    var p = document.getElementById('page-quiz');
    if (!p) return;
    var pers = PERSONAGENS.find(function (x) { return x.slug === slug; });
    if (!pers) { renderIntro(); return; }
    var herb = HERBS.find(function (h) { return h.id === pers.id; });
    var img = herb && herb.img ? herb.img : null;

    p.innerHTML = ''
      + '<div class="quiz-resultado">'
      +   '<div class="quiz-eyebrow">VOCÊ É</div>'
      +   '<div class="quiz-result-visual" style="background:linear-gradient(135deg,' + pers.cor + '22,' + pers.cor + '08)">'
      +     (img ? '<img class="quiz-result-img" src="' + img + '" alt="' + esc(herb.n) + '" onerror="this.outerHTML=\'<div class=&quot;quiz-result-icon&quot;>' + (herb ? herb.icon : '🌿') + '</div>\'">' : '<div class="quiz-result-icon">' + (herb ? herb.icon : '🌿') + '</div>')
      +   '</div>'
      +   '<h1 class="quiz-result-name">' + esc(herb ? herb.n : pers.slug) + '</h1>'
      +   (herb ? '<div class="quiz-result-lat">' + esc(herb.lat) + '</div>' : '')
      +   '<div class="quiz-result-arquetipo">' + esc(pers.arquetipo) + '</div>'
      +   '<div class="quiz-result-subtitulo">' + esc(pers.subtitulo) + '</div>'
      +   '<blockquote class="quiz-result-frase">"' + esc(pers.frase) + '"</blockquote>'
      +   '<div class="quiz-result-section">'
      +     '<div class="quiz-result-section-title">TRÊS COISAS QUE COMBINAM COM VOCÊ</div>'
      +     '<ul class="quiz-result-lista">' + pers.combina.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') + '</ul>'
      +   '</div>'
      +   '<div class="quiz-result-actions">'
      +     '<button class="quiz-action-btn primary" onclick="quizCompartilhar(\'' + pers.slug + '\')">📤 Compartilhar</button>'
      +     (herb ? '<button class="quiz-action-btn" onclick="openHerbModal(' + herb.id + ')">🌿 Ver ficha</button>' : '')
      +     '<button class="quiz-action-btn" onclick="quizRefazer()">↻ Refazer</button>'
      +   '</div>'
      + '</div>';
  }

  // ════════════════════════════════════════════════════════════════
  // CARD DE COMPARTILHAMENTO (SVG → PNG)
  // ════════════════════════════════════════════════════════════════
  function gerarCardSVG(pers, herb) {
    var nome = herb ? herb.n : pers.slug;
    var lat = herb ? herb.lat : '';
    return '<svg xmlns="http://www.w3.org/2000/svg" width="540" height="960" viewBox="0 0 540 960">'
      + '<defs>'
      +   '<linearGradient id="g" x1="0" y1="0" x2="0" y2="1">'
      +     '<stop offset="0%" stop-color="#1f4a32"/>'
      +     '<stop offset="100%" stop-color="#152f22"/>'
      +   '</linearGradient>'
      + '</defs>'
      + '<rect width="540" height="960" fill="url(#g)"/>'
      + '<text x="270" y="80" font-family="Jost,sans-serif" font-size="13" font-weight="500" fill="#c8a84b" text-anchor="middle" letter-spacing="4">ERVATÓRIO</text>'
      + '<text x="270" y="160" font-family="Jost,sans-serif" font-size="14" fill="#8a9a8e" text-anchor="middle" letter-spacing="3">EU SOU</text>'
      + '<circle cx="270" cy="380" r="170" fill="' + pers.cor + '" fill-opacity="0.18" stroke="' + pers.cor + '" stroke-opacity="0.5" stroke-width="2"/>'
      + '<text x="270" y="400" font-family="Cormorant Garamond,serif" font-size="120" fill="#f5ede0" text-anchor="middle">' + (herb ? herb.icon : '🌿') + '</text>'
      + '<text x="270" y="600" font-family="Cormorant Garamond,serif" font-size="56" font-weight="300" fill="#e6c96e" text-anchor="middle">' + escapeXML(nome) + '</text>'
      + '<text x="270" y="640" font-family="EB Garamond,serif" font-size="20" font-style="italic" fill="#8a9a8e" text-anchor="middle">' + escapeXML(lat) + '</text>'
      + '<text x="270" y="720" font-family="Cormorant Garamond,serif" font-size="28" fill="#d4cbb8" text-anchor="middle">' + escapeXML(pers.arquetipo) + '</text>'
      + foreignObjectText(60, 760, 420, 100, pers.frase, '#d4cbb8', 18)
      + '<text x="270" y="900" font-family="Jost,sans-serif" font-size="12" fill="#8a9a8e" text-anchor="middle" letter-spacing="2">DESCUBRA QUAL CHÁ É VOCÊ</text>'
      + '<text x="270" y="924" font-family="Jost,sans-serif" font-size="12" fill="#c8a84b" text-anchor="middle" letter-spacing="2">ervatorio.com.br/#quiz</text>'
      + '</svg>';
  }

  function escapeXML(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }

  function foreignObjectText(x, y, w, h, text, color, fontSize) {
    return '<foreignObject x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '">'
      + '<div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Cormorant Garamond,serif;font-size:' + fontSize + 'px;font-style:italic;color:' + color + ';text-align:center;line-height:1.5">' + escapeXML(text) + '</div>'
      + '</foreignObject>';
  }

  function svgParaPNG(svg) {
    return new Promise(function (resolve, reject) {
      var blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var img = new Image();
      img.onload = function () {
        var canvas = document.createElement('canvas');
        canvas.width = 540; canvas.height = 960;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#1f4a32';
        ctx.fillRect(0, 0, 540, 960);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(function (b) {
          URL.revokeObjectURL(url);
          if (b) resolve(b); else reject(new Error('toBlob falhou'));
        }, 'image/png', 0.95);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Falha ao carregar SVG')); };
      img.src = url;
    });
  }

  window.quizCompartilhar = async function (slug) {
    var pers = PERSONAGENS.find(function (x) { return x.slug === slug; });
    if (!pers) return;
    var herb = HERBS.find(function (h) { return h.id === pers.id; });
    var svg = gerarCardSVG(pers, herb);
    try {
      var blob = await svgParaPNG(svg);
      var file = new File([blob], 'ervatorio-' + slug + '.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Sou ' + (herb ? herb.n : slug) + ' no Ervatório',
          text: pers.arquetipo + ' — descubra qual chá brasileiro é você.',
          url: 'https://ervatorio.com.br/#quiz',
          files: [file]
        });
      } else {
        // Fallback: download direto
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'ervatorio-' + slug + '.png';
        document.body.appendChild(a); a.click(); a.remove();
        toast('Card baixado — agora é só compartilhar!');
      }
    } catch (e) {
      console.error(e);
      // Fallback final: copia link
      try {
        await navigator.clipboard.writeText('Eu sou ' + (herb ? herb.n : slug) + ' no Ervatório — ' + pers.arquetipo + '. ' + 'https://ervatorio.com.br/#quiz');
        toast('Texto copiado para a área de transferência');
      } catch (_) { toast('Não foi possível compartilhar'); }
    }
  };

  // ════════════════════════════════════════════════════════════════
  // FLUXO
  // ════════════════════════════════════════════════════════════════
  window.quizStart = function () {
    inicializar();
    renderPergunta();
  };

  window.quizResponder = function (i) {
    var q = PERGUNTAS[_state.idx];
    var opcao = q.opcoes[i];
    _state.escolhas[_state.idx] = i;
    Object.keys(opcao.pts).forEach(function (slug) {
      _state.pontos[slug] = (_state.pontos[slug] || 0) + opcao.pts[slug];
    });
    _state.idx++;
    if (_state.idx >= PERGUNTAS.length) {
      var slug = calcularResultado();
      salvarResultado(slug);
      goPage('quiz', null, 'resultado/' + slug);
    } else {
      renderPergunta();
    }
  };

  window.quizVoltar = function () {
    if (_state.idx === 0) return;
    _state.idx--;
    // desfaz pontuação da resposta anterior
    var escolhaIdx = _state.escolhas[_state.idx];
    if (escolhaIdx != null) {
      var opcao = PERGUNTAS[_state.idx].opcoes[escolhaIdx];
      Object.keys(opcao.pts).forEach(function (slug) {
        _state.pontos[slug] -= opcao.pts[slug];
      });
    }
    renderPergunta();
  };

  window.quizRefazer = function () {
    inicializar();
    goPage('quiz');
  };

  // ════════════════════════════════════════════════════════════════
  // ENTRY
  // ════════════════════════════════════════════════════════════════
  window.initQuiz = function (slug) {
    if (!slug) {
      renderIntro();
      return;
    }
    if (slug.indexOf('resultado/') === 0) {
      var personagemSlug = slug.replace('resultado/', '');
      renderResultado(personagemSlug);
    } else {
      renderIntro();
    }
  };
})();

// ════════════════════════════════════════
// SEO — Ervatório
// Dynamic meta tags per page × language
// ════════════════════════════════════════

const SEO_META = {
  search: {
    pt: { title:'Ervatório — Curadoria Botânica do Brasil e do Mundo', desc:'Explore mais de 40 ervas medicinais brasileiras, chás tradicionais, receitas e ferramentas de preparo. Curadoria botânica com base científica.' },
    en: { title:'Ervatório — Brazilian Botanical Curation', desc:'Explore over 40 Brazilian medicinal herbs, traditional teas, recipes and brewing tools. Science-based botanical curation.' },
    es: { title:'Ervatório — Curación Botánica de Brasil y del Mundo', desc:'Explora más de 40 hierbas medicinales brasileñas, tés tradicionales, recetas y herramientas de preparación.' },
    ja: { title:'Ervatório — ブラジルのボタニカルキュレーション', desc:'40種類以上のブラジル薬草、伝統茶、レシピ、醸造ツールを探索。科学的根拠に基づくボタニカルキュレーション。' },
    de: { title:'Ervatório — Botanische Kuration aus Brasilien', desc:'Entdecke über 40 brasilianische Heilkräuter, traditionelle Tees, Rezepte und Brüh-Werkzeuge. Wissenschaftsbasierte botanische Kuration.' },
    fr: { title:'Ervatório — Curation Botanique du Brésil', desc:'Explorez plus de 40 herbes médicinales brésiliennes, thés traditionnels, recettes et outils de préparation.' },
  },
  chas: {
    pt: { title:'Chás Tradicionais — Ervatório', desc:'Os seis tipos de Camellia sinensis: branco, verde, amarelo, oolong, preto e pu-erh. História, preparo, variedades e harmonização.' },
    en: { title:'Traditional Teas — Ervatório', desc:'The six types of Camellia sinensis: white, green, yellow, oolong, black and pu-erh. History, brewing, varieties and food pairings.' },
    es: { title:'Tés Tradicionales — Ervatório', desc:'Los seis tipos de Camellia sinensis: blanco, verde, amarillo, oolong, negro y pu-erh. Historia, preparación, variedades y maridaje.' },
    ja: { title:'伝統茶 — Ervatório', desc:'カメリアシネンシスの6種類：白茶、緑茶、黄茶、ウーロン茶、紅茶、プーアール茶。歴史、淹れ方、品種。' },
    de: { title:'Traditionelle Tees — Ervatório', desc:'Die sechs Typen von Camellia sinensis: Weißtee, Grüntee, Gelbtee, Oolong, Schwarztee und Pu-erh. Geschichte, Zubereitung und Sorten.' },
    fr: { title:'Thés Traditionnels — Ervatório', desc:'Les six types de Camellia sinensis : blanc, vert, jaune, oolong, noir et pu-erh. Histoire, préparation, variétés et accords.' },
  },
  mundo: {
    pt: { title:'Chás do Mundo — Ervatório', desc:'Da China ao Brasil: cultura do chá em 15 países. Mapas, ervas locais, tradições e conexões com o Brasil.' },
    en: { title:'World Teas — Ervatório', desc:'From China to Brazil: tea culture in 15 countries. Maps, local herbs, traditions and connections to Brazil.' },
    es: { title:'Tés del Mundo — Ervatório', desc:'De China a Brasil: cultura del té en 15 países. Mapas, hierbas locales, tradiciones y conexiones con Brasil.' },
    ja: { title:'世界のお茶 — Ervatório', desc:'中国からブラジルまで：15カ国のお茶文化。地図、地元の薬草、伝統、ブラジルとの繋がり。' },
    de: { title:'Welttees — Ervatório', desc:'Von China bis Brasilien: Teekultur in 15 Ländern. Karten, lokale Kräuter, Traditionen und Verbindungen zu Brasilien.' },
    fr: { title:'Thés du Monde — Ervatório', desc:'De la Chine au Brésil : culture du thé dans 15 pays. Cartes, herbes locales, traditions et liens avec le Brésil.' },
  },
  receitas: {
    pt: { title:'Receitas com Ervas — Ervatório', desc:'Mais de 20 receitas: chás quentes, drinks gelados, mocktails, medicinais, culinárias e rituais com ervas brasileiras.' },
    en: { title:'Herb Recipes — Ervatório', desc:'Over 20 recipes: hot teas, cold drinks, mocktails, medicinal, culinary and ritual blends with Brazilian herbs.' },
    es: { title:'Recetas con Hierbas — Ervatório', desc:'Más de 20 recetas: tés calientes, bebidas frías, mocktails, medicinales, culinarios y rituales con hierbas brasileñas.' },
    ja: { title:'ハーブレシピ — Ervatório', desc:'20以上のレシピ：ホットティー、コールドドリンク、モクテル、薬用、料理、儀式用のブラジルハーブブレンド。' },
    de: { title:'Kräuterrezepte — Ervatório', desc:'Über 20 Rezepte: heiße Tees, Kaltgetränke, Mocktails, Heilmittel, Kulinarisches und Rituale mit brasilianischen Kräutern.' },
    fr: { title:'Recettes aux Herbes — Ervatório', desc:'Plus de 20 recettes : thés chauds, boissons froides, mocktails, médicinaux, culinaires et rituels aux herbes brésiliennes.' },
  },
  jogo: {
    pt: { title:'Jogo Botânico — Ervatório', desc:'Teste seus conhecimentos sobre ervas medicinais brasileiras. Identifique plantas a partir de pistas e ganhe pontos.' },
    en: { title:'Botanical Game — Ervatório', desc:'Test your knowledge of Brazilian medicinal herbs. Identify plants from clues and earn points.' },
    es: { title:'Juego Botánico — Ervatório', desc:'Pon a prueba tus conocimientos de hierbas medicinales brasileñas. Identifica plantas a partir de pistas.' },
    ja: { title:'植物ゲーム — Ervatório', desc:'ブラジルの薬草の知識をテストしましょう。ヒントから植物を識別してポイントを獲得。' },
    de: { title:'Botanisches Spiel — Ervatório', desc:'Teste dein Wissen über brasilianische Heilkräuter. Identifiziere Pflanzen anhand von Hinweisen und sammle Punkte.' },
    fr: { title:'Jeu Botanique — Ervatório', desc:'Testez vos connaissances sur les herbes médicinales brésiliennes. Identifiez les plantes à partir d\'indices.' },
  },
  chazerias: {
    pt: { title:'Chazerias do Mundo — Ervatório', desc:'Guia curado de casas de chá em Brasil, Europa, Ásia e Américas. Mais de 16 espaços com endereço, horários e descrição.' },
    en: { title:'World Tea Houses — Ervatório', desc:'Curated guide to tea houses in Brazil, Europe, Asia and the Americas. 16+ venues with addresses, hours and descriptions.' },
    es: { title:'Casas de Té del Mundo — Ervatório', desc:'Guía curada de casas de té en Brasil, Europa, Asia y las Américas. Más de 16 espacios.' },
    ja: { title:'世界の茶屋 — Ervatório', desc:'ブラジル、ヨーロッパ、アジア、南北アメリカの厳選茶屋ガイド。16以上の場所。' },
    de: { title:'Teehäuser der Welt — Ervatório', desc:'Kuratierter Leitfaden zu Teehäusern in Brasilien, Europa, Asien und Amerika. Über 16 Orte.' },
    fr: { title:'Maisons de Thé du Monde — Ervatório', desc:'Guide curé des maisons de thé au Brésil, en Europe, en Asie et dans les Amériques. Plus de 16 lieux.' },
  },
  ferramentas: {
    pt: { title:'Ferramentas de Chá — Ervatório', desc:'Calculadora de infusão, timer, monitor de cafeína, famílias botânicas. Ferramentas para preparar o chá perfeito.' },
    en: { title:'Tea Tools — Ervatório', desc:'Infusion calculator, timer, caffeine monitor, botanical families. Tools for brewing the perfect tea.' },
    es: { title:'Herramientas de Té — Ervatório', desc:'Calculadora de infusión, temporizador, monitor de cafeína, familias botánicas. Herramientas para preparar el té perfecto.' },
    ja: { title:'お茶ツール — Ervatório', desc:'抽出計算機、タイマー、カフェインモニター、植物ファミリー。完璧なお茶を淹れるためのツール。' },
    de: { title:'Tee-Werkzeuge — Ervatório', desc:'Aufguss-Kalkulator, Timer, Koffein-Monitor, botanische Familien. Werkzeuge für den perfekten Tee.' },
    fr: { title:'Outils à Thé — Ervatório', desc:'Calculateur d\'infusion, minuteur, moniteur de caféine, familles botaniques. Outils pour préparer le thé parfait.' },
  },
  quiz: {
    pt: { title:'Quiz — Qual chá brasileiro é você? | Ervatório', desc:'Descubra qual erva ou chá brasileiro combina com a sua personalidade neste quiz interativo do Ervatório.' },
    en: { title:'Quiz — Which Brazilian tea are you? | Ervatório', desc:'Discover which Brazilian herb or tea matches your personality in this interactive Ervatório quiz.' },
    es: { title:'Quiz — ¿Cuál té brasileño eres tú? | Ervatório', desc:'Descubre qué hierba o té brasileño combina con tu personalidad en este quiz interactivo.' },
    ja: { title:'クイズ — あなたはどのブラジルのお茶？ | Ervatório', desc:'このインタラクティブクイズで、あなたの個性に合うブラジルのハーブやお茶を発見しましょう。' },
    de: { title:'Quiz — Welcher brasilianische Tee bist du? | Ervatório', desc:'Entdecke, welches brasilianische Kraut oder welcher Tee zu deiner Persönlichkeit passt.' },
    fr: { title:'Quiz — Quel thé brésilien êtes-vous ? | Ervatório', desc:'Découvrez quelle herbe ou quel thé brésilien correspond à votre personnalité dans ce quiz interactif.' },
  },
  blends: {
    pt: { title:'Blends de Ervas — Ervatório', desc:'Crie, salve e compartilhe blends personalizados de ervas brasileiras. Assistente inteligente e modo manual.' },
    en: { title:'Herb Blends — Ervatório', desc:'Create, save and share personalized Brazilian herb blends. Smart assistant and manual mode.' },
    es: { title:'Mezclas de Hierbas — Ervatório', desc:'Crea, guarda y comparte mezclas personalizadas de hierbas brasileñas. Asistente inteligente y modo manual.' },
    ja: { title:'ハーブブレンド — Ervatório', desc:'ブラジルのハーブのカスタムブレンドを作成、保存、共有。スマートアシスタントと手動モード。' },
    de: { title:'Kräutermischungen — Ervatório', desc:'Erstelle, speichere und teile personalisierte brasilianische Kräutermischungen. Intelligenter Assistent und manueller Modus.' },
    fr: { title:'Mélanges d\'Herbes — Ervatório', desc:'Créez, enregistrez et partagez des mélanges d\'herbes brésiliennes personnalisés. Assistant intelligent et mode manuel.' },
  },
  ervatorio: {
    pt: { title:'Ervopedia — Catálogo Botânico | Ervatório', desc:'Enciclopédia completa de ervas medicinais brasileiras: origem, efeitos, preparo, contra-indicações e fichas detalhadas.' },
    en: { title:'Ervopedia — Botanical Catalogue | Ervatório', desc:'Complete encyclopaedia of Brazilian medicinal herbs: origin, effects, preparation, contraindications and detailed profiles.' },
    es: { title:'Ervopedia — Catálogo Botánico | Ervatório', desc:'Enciclopedia completa de hierbas medicinales brasileñas: origen, efectos, preparación, contraindicaciones.' },
    ja: { title:'エルボペディア — 植物カタログ | Ervatório', desc:'ブラジル薬草の完全な百科事典：起源、効果、調製、禁忌、詳細なプロファイル。' },
    de: { title:'Ervopedia — Botanischer Katalog | Ervatório', desc:'Vollständige Enzyklopädie brasilianischer Heilkräuter: Herkunft, Wirkung, Zubereitung, Kontraindikationen.' },
    fr: { title:'Ervopédia — Catalogue Botanique | Ervatório', desc:'Encyclopédie complète des herbes médicinales brésiliennes : origine, effets, préparation, contre-indications.' },
  },
  caminho: {
    pt: { title:'Caminho do Chazeiro — Selos e Conquistas | Ervatório', desc:'Acompanhe sua jornada no Ervatório: badges conquistados, nível de conhecimento e progresso botânico.' },
    en: { title:'Chazeiro\'s Path — Badges & Achievements | Ervatório', desc:'Track your Ervatório journey: earned badges, knowledge level and botanical progress.' },
    es: { title:'Camino del Chazeiro — Sellos y Logros | Ervatório', desc:'Sigue tu camino en el Ervatório: badges conquistados, nivel y progreso botánico.' },
    ja: { title:'チャゼイロの道 — バッジと実績 | Ervatório', desc:'エルバトリオの旅を追跡：獲得したバッジ、知識レベル、植物の進歩。' },
    de: { title:'Pfad des Chazeiro — Abzeichen & Errungenschaften | Ervatório', desc:'Verfolge deine Ervatório-Reise: verdiente Abzeichen, Wissensstufe und botanischen Fortschritt.' },
    fr: { title:'Parcours du Chazeiro — Badges & Accomplissements | Ervatório', desc:'Suivez votre parcours Ervatório : badges gagnés, niveau de connaissance et progrès botanique.' },
  },
};

const SEO_DEFAULT = {
  pt: { title:'Ervatório — Curadoria Botânica', desc:'Curadoria de ervas medicinais, chás e rituais do Brasil e do mundo.' },
  en: { title:'Ervatório — Botanical Curation', desc:'Curation of medicinal herbs, teas and rituals from Brazil and the world.' },
  es: { title:'Ervatório — Curación Botánica', desc:'Curación de hierbas medicinales, tés y rituales de Brasil y del mundo.' },
  ja: { title:'Ervatório — ボタニカルキュレーション', desc:'ブラジルと世界の薬草、お茶、儀式のキュレーション。' },
  de: { title:'Ervatório — Botanische Kuration', desc:'Kuration von Heilkräutern, Tees und Ritualen aus Brasilien und der Welt.' },
  fr: { title:'Ervatório — Curation Botanique', desc:'Curation de plantes médicinales, thés et rituels du Brésil et du monde.' },
};

function updateSEO(pageId) {
  const lang = (window._lang || 'pt');
  const map  = SEO_META[pageId] || SEO_DEFAULT;
  const data = (map[lang] || map.pt) || SEO_DEFAULT.pt;

  document.title = data.title;

  const setMeta = (sel, val) => {
    let el = document.querySelector(sel);
    if (el) el.setAttribute('content', val);
  };
  setMeta('meta[name="description"]',         data.desc);
  setMeta('meta[property="og:title"]',        data.title);
  setMeta('meta[property="og:description"]',  data.desc);
  setMeta('meta[name="twitter:title"]',       data.title);
  setMeta('meta[name="twitter:description"]', data.desc);

  // Canonical lang alternate (basic)
  document.documentElement.lang = {pt:'pt-BR',en:'en',es:'es',ja:'ja',de:'de',fr:'fr'}[lang] || 'pt-BR';
}

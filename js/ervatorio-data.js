// js/ervatorio-data.js
// Camada de acesso aos dados editoriais Ervatorio v1.1 via Supabase
// Porta unica — nenhum outro arquivo deve fazer .from('admin_herb_fichas') direto

const ErvatorioData = (function() {
  function getClient() {
    if (typeof ervaria === 'undefined' || !ervaria.client) {
      throw new Error('Supabase client nao inicializado (ervaria.client)');
    }
    return ervaria.client;
  }

  // Cache em memoria para evitar refetch de dados estaveis
  const cache = new Map();
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  async function cached(key, fn) {
    const now = Date.now();
    if (cache.has(key)) {
      const entry = cache.get(key);
      if (now - entry.timestamp < CACHE_TTL) return entry.value;
    }
    const value = await fn();
    cache.set(key, { value, timestamp: now });
    return value;
  }

  return {
    // === FICHAS ===
    async getAllFichas() {
      return cached('fichas:all', async () => {
        const { data, error } = await getClient()
          .from('admin_herb_fichas')
          .select('slug, herb_latin_name, ficha, updated_at')
          .eq('schema_version', '1.1')
          .eq('active', true)
          .eq('status', 'published');
        if (error) throw error;
        return data;
      });
    },

    async getFichaBySlug(slug) {
      // Delega a ervaria.loadFichaBySlug que ja tem cache local + offline
      return cached('ficha:' + slug, async () => {
        if (typeof ervaria !== 'undefined' && ervaria.loadFichaBySlug) {
          var ficha = await ervaria.loadFichaBySlug(slug);
          if (!ficha) return null;
          return { slug: slug, ficha: ficha };
        }
        // Fallback direto caso ervaria nao tenha o metodo
        var res = await getClient()
          .from('admin_herb_fichas')
          .select('slug, herb_latin_name, ficha, updated_at')
          .eq('slug', slug)
          .eq('schema_version', '1.1')
          .eq('active', true)
          .eq('status', 'published')
          .limit(1);
        if (res.error) throw res.error;
        var row = Array.isArray(res.data) ? res.data[0] : res.data;
        return row || null;
      });
    },

    // === BLENDS ===
    async getAllBlends() {
      return cached('blends:all', async () => {
        const { data, error } = await getClient()
          .from('admin_blends')
          .select('*')
          .eq('active', true)
          .eq('status', 'published')
          .order('blend_id');
        if (error) throw error;
        return data;
      });
    },

    async getBlendBySlug(slug) {
      return cached('blend:' + slug, async () => {
        const { data, error } = await getClient()
          .from('admin_blends')
          .select('*')
          .eq('slug', slug)
          .eq('active', true)
          .limit(1);
        if (error) throw error;
        const row = Array.isArray(data) ? data[0] : data;
        return row || null;
      });
    },

    async getBlendsByFichaSlug(fichaSlug) {
      return cached('blends:ficha:' + fichaSlug, async () => {
        const { data, error } = await getClient()
          .from('admin_blends')
          .select('slug, nome, proposito, ervas_referenciadas')
          .contains('ervas_referenciadas', [fichaSlug])
          .eq('active', true);
        if (error) throw error;
        return data;
      });
    },

    // === PRODUTOS ===
    async getProdutosByFichaSlug(fichaSlug) {
      return cached('produtos:ficha:' + fichaSlug, async () => {
        const { data, error } = await getClient()
          .from('admin_products')
          .select('*')
          .eq('slug_ficha', fichaSlug)
          .eq('active', true);
        if (error) throw error;
        return data;
      });
    },

    async getAllProdutosCurated() {
      return cached('produtos:curated', async () => {
        const { data, error } = await getClient()
          .from('admin_products')
          .select('*')
          .eq('source', 'curated_v1')
          .eq('active', true);
        if (error) throw error;
        return data;
      });
    },

    // === FORNECEDORES ===
    async getFornecedorByRefId(refId) {
      return cached('fornecedor:' + refId, async () => {
        const { data, error } = await getClient()
          .from('admin_suppliers')
          .select('*')
          .eq('supplier_ref_id', refId)
          .eq('active', true)
          .limit(1);
        if (error) throw error;
        const row = Array.isArray(data) ? data[0] : data;
        return row || null;
      });
    },

    // === RODA DOS CHAS (via funcao SQL) ===
    async recomendar(vetoresDesejados, restricoes) {
      restricoes = restricoes || {};
      const { data, error } = await getClient().rpc('recomendar_chas', {
        vetores_desejados: vetoresDesejados,
        is_gestante: restricoes.gestante || false,
        is_lactante: restricoes.lactante || false,
        has_crianca: restricoes.crianca || false,
        evitar_alertas: restricoes.evitar_alertas || false,
        limite: restricoes.limite || 5
      });
      if (error) throw error;
      return data;
    },

    // === VIEWS ===
    async getCatalogoCompleto() {
      return cached('catalogo:completo', async () => {
        const { data, error } = await getClient()
          .from('v_catalogo_completo')
          .select('*');
        if (error) throw error;
        return data;
      });
    },

    async getFichasComProdutos() {
      return cached('catalogo:com_produtos', async () => {
        const { data, error } = await getClient()
          .from('v_fichas_com_produtos')
          .select('*')
          .gt('total_produtos', 0);
        if (error) throw error;
        return data;
      });
    },

    // === VETORES (para Roda Funcional) ===
    async getVetoresDisponiveis() {
      return cached('vetores:all', async () => {
        var { data, error } = await getClient()
          .from('admin_recommendation_vectors')
          .select('vetor')
          .limit(200);
        if (error) throw error;
        var unique = [];
        var seen = {};
        (data || []).forEach(function(r) {
          if (r.vetor && !seen[r.vetor]) {
            seen[r.vetor] = true;
            unique.push(r.vetor);
          }
        });
        return unique.sort();
      });
    },

    // === UTILITIES ===
    clearCache() {
      cache.clear();
    }
  };
})();

window.ErvatorioData = ErvatorioData;

// js/chazerias.js — Guia Global de Chazerias · Ervatório
(function () {
  var _map = null;
  var _markers = [];
  var _leafletReady = false;

  function loadLeaflet() {
    if (_leafletReady || window.L) { _leafletReady = true; return Promise.resolve(); }
    return new Promise(function (resolve) {
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
      var script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = function () { _leafletReady = true; resolve(); };
      document.head.appendChild(script);
    });
  }

  async function fetchChazerias() {
    if (!window.supabase || !window.ERVATORIO_CONFIG) return [];
    try {
      var sb = window.supabase.createClient(
        window.ERVATORIO_CONFIG.SUPABASE_URL,
        window.ERVATORIO_CONFIG.SUPABASE_PUBLISHABLE_KEY
      );
      var res = await sb.from('chazerias').select('*').eq('active', true).order('continent').order('country').order('city');
      return res.data || [];
    } catch (e) { console.error('[Chazerias]', e); return []; }
  }

  function initMap(data) {
    var mapEl = document.getElementById('chaz-map');
    if (!mapEl || !window.L) return;
    if (_map) { _map.remove(); _map = null; _markers = []; }

    _map = L.map('chaz-map', { zoomControl: true, attributionControl: true });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd', maxZoom: 19
    }).addTo(_map);

    var chazIcon = L.divIcon({ className: '', html: '<div class="chaz-marker">🍵</div>', iconSize: [30, 30], iconAnchor: [15, 15] });

    var withCoords = data.filter(function (c) { return c.lat && c.lng; });
    withCoords.forEach(function (c) {
      var m = L.marker([c.lat, c.lng], { icon: chazIcon }).addTo(_map);
      m.bindPopup('<strong>' + (c.name || '') + '</strong><br>' + (c.city || '') + ', ' + (c.country || '') + '<br><em>' + (c.type || 'Chazeria') + '</em>');
      m.on('click', function () {
        var card = document.getElementById('chaz-card-' + c.id);
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      _markers.push(m);
    });

    if (withCoords.length === 1) {
      _map.setView([withCoords[0].lat, withCoords[0].lng], 13);
    } else if (_markers.length > 1) {
      _map.fitBounds(L.featureGroup(_markers).getBounds().pad(0.2));
    } else {
      _map.setView([0, 20], 2);
    }
  }

  var TYPE_LABEL = {
    chazeria: 'Chazeria', ervateiro: 'Ervateiro', mercado: 'Mercado de Ervas',
    spa: 'Spa & Bem-estar', restaurante: 'Restaurante', hotel: 'Hotel', outro: 'Outro'
  };

  function renderCards(data) {
    var container = document.getElementById('chaz-cards');
    if (!container) return;

    if (!data.length) {
      container.innerHTML = '<div class="chaz-empty"><div style="font-size:2rem;opacity:.2;margin-bottom:.75rem">🗺</div><div>Em breve — um guia curado de chazerias ao redor do mundo.</div><div style="font-size:.78rem;margin-top:.5rem;color:var(--faint)">Use o painel Admin para adicionar os primeiros locais.</div></div>';
      return;
    }

    var byContinent = {};
    data.forEach(function (c) {
      var cont = c.continent || 'Outros'; var country = c.country;
      if (!byContinent[cont]) byContinent[cont] = {};
      if (!byContinent[cont][country]) byContinent[cont][country] = [];
      byContinent[cont][country].push(c);
    });

    var html = '';
    Object.keys(byContinent).sort().forEach(function (cont) {
      html += '<div class="chaz-continent"><div class="chaz-continent-title">' + cont + '</div>';
      var countries = byContinent[cont];
      Object.keys(countries).sort().forEach(function (country) {
        html += '<div class="chaz-country"><div class="chaz-country-title">' + country + '</div><div class="chaz-country-grid">';
        countries[country].forEach(function (c) {
          var typeLabel = TYPE_LABEL[c.type] || c.type || 'Chazeria';
          html += '<div class="chaz-card" id="chaz-card-' + c.id + '">';
          html += '<div class="chaz-card-header">';
          html += '<div class="chaz-card-name">' + (c.name || '') + '</div>';
          html += '<span class="chaz-type-badge chaz-type-' + (c.type || 'chazeria') + '">' + typeLabel + '</span>';
          html += '</div>';
          html += '<div class="chaz-card-city">' + (c.city || '') + (c.address ? ' · ' + c.address : '') + '</div>';
          if (c.description) html += '<div class="chaz-card-desc">' + c.description + '</div>';
          if (c.quote) html += '<blockquote class="chaz-card-quote">“' + c.quote + '”' + (c.quote_author ? '<cite>— ' + c.quote_author + '</cite>' : '') + '</blockquote>';
          var meta = [];
          if (c.opening_hours) meta.push('<span>🕐 ' + c.opening_hours + '</span>');
          if (c.payment) meta.push('<span>💳 ' + c.payment + '</span>');
          if (c.style) meta.push('<span>☕ ' + c.style + '</span>');
          if (c.phone) meta.push('<span>📞 ' + c.phone + '</span>');
          if (c.website) meta.push('<a href="' + c.website + '" target="_blank" rel="noopener" class="chaz-website">🔗 Site</a>');
          if (meta.length) html += '<div class="chaz-card-meta">' + meta.join('') + '</div>';
          if (c.lat && c.lng) {
            html += '<button class="chaz-map-btn" onclick="chazFlyTo(' + c.lat + ',' + c.lng + ',' + c.id + ')">📍 Ver no mapa</button>';
          }
          html += '</div>';
        });
        html += '</div></div>';
      });
      html += '</div>';
    });
    container.innerHTML = html;
  }

  window.chazFlyTo = function (lat, lng, id) {
    if (!_map) return;
    _map.flyTo([lat, lng], 15, { duration: 1.2 });
    var marker = _markers.find(function (m) {
      var ll = m.getLatLng();
      return Math.abs(ll.lat - lat) < 0.0001 && Math.abs(ll.lng - lng) < 0.0001;
    });
    if (marker) setTimeout(function () { marker.openPopup(); }, 1300);
    document.getElementById('chaz-map').scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  window.initChazerias = async function () {
    var cards = document.getElementById('chaz-cards');
    if (!cards) return;
    cards.innerHTML = '<div class="chaz-empty">Carregando...</div>';
    await loadLeaflet();
    var data = await fetchChazerias();
    initMap(data);
    renderCards(data);
  };
})();

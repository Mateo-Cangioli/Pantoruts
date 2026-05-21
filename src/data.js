// ── TORTUS Display · data.js ──
var TortusDB = (function () {
  var KEY = 'tortus_v2';
  var DEFAULTS = {
    user: 'admin',
    pass: '1234',
    cfg: {
      name: 'Mi Local',
      tagline: 'Bienvenidos',
      currency: '$',
      accent: '#E8622A',
      footer: 'Precios en pesos · IVA incluido',
      orientation: 'landscape' // 'landscape' | 'portrait'
    },
    blocks: [
      // Each block: { id, type:'menu'|'image'|'promo', x, y, w, h, data:{} }
      {
        id: 1, type: 'menu', x: 0, y: 0, w: 6, h: 8,
        data: {
          items: [
            { id: 1, name: 'Empanadas (6 u.)', price: 1800, cat: 'Entradas' },
            { id: 2, name: 'Milanesa napolitana', price: 3200, cat: 'Principales' },
            { id: 3, name: 'Pollo al limón', price: 2900, cat: 'Principales' },
            { id: 4, name: 'Tiramisú', price: 1400, cat: 'Postres' },
            { id: 5, name: 'Agua mineral', price: 600, cat: 'Bebidas' },
          ]
        }
      },
      {
        id: 2, type: 'promo', x: 6, y: 0, w: 6, h: 4,
        data: {
          promos: [
            { id: 1, title: 'Menú del día', desc: 'Entrada + principal + postre', badge: '$4.500' },
            { id: 2, title: 'Happy Hour', desc: '18 a 20 hs', badge: '2×1 en tragos' }
          ]
        }
      },
      {
        id: 3, type: 'image', x: 6, y: 4, w: 6, h: 4,
        data: { url: '', fit: 'cover', caption: '' }
      }
    ],
    nextId: 10,
    nextItemId: 20
  };

  function load() {
    try { var r = localStorage.getItem(KEY); if (r) return JSON.parse(r); } catch(e) {}
    return JSON.parse(JSON.stringify(DEFAULTS));
  }
  function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch(e) {} }

  var data = load();
  return {
    get: function() { return data; },
    save: function() { save(data); },
    reset: function() { data = JSON.parse(JSON.stringify(DEFAULTS)); save(data); }
  };
})();

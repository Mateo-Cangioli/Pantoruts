// ── TORTUS Display · admin.js ──
(function () {
  var db = TortusDB.get();
  var selectedBlockId = null;
  var COLS = 12;
  var ROWS = 8;

  // ── AUTH ──
  document.getElementById('btn-login').addEventListener('click', doLogin);
  document.getElementById('inp-pass').addEventListener('keydown', function(e){ if(e.key==='Enter') doLogin(); });
  document.getElementById('btn-logout').addEventListener('click', function(){ showScreen('login'); });

  function doLogin() {
    var u = document.getElementById('inp-user').value.trim();
    var p = document.getElementById('inp-pass').value;
    if (u === db.user && p === db.pass) {
      document.getElementById('login-err').textContent = '';
      showScreen('admin');
      initAdmin();
    } else {
      document.getElementById('login-err').textContent = 'Usuario o contraseña incorrectos.';
      document.getElementById('inp-pass').value = '';
    }
  }

  function showScreen(name) {
    document.querySelectorAll('.screen').forEach(function(s){ s.classList.remove('active'); });
    document.getElementById('screen-'+name).classList.add('active');
  }

  // ── TABS ──
  document.querySelectorAll('.nav-item').forEach(function(btn){
    btn.addEventListener('click', function(){
      document.querySelectorAll('.nav-item').forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      var tab = btn.dataset.tab;
      document.querySelectorAll('.tab-panel').forEach(function(p){ p.classList.remove('active'); });
      document.querySelector('[data-panel="'+tab+'"]').classList.add('active');
      if (tab === 'config') loadConfig();
    });
  });

  // ── INIT ──
  function initAdmin() {
    renderCanvas();
    document.getElementById('tv-url-display').textContent = window.location.origin + '/tv.html';
    selectBlock(null);
  }

  // ── CANVAS ──
  function renderCanvas() {
    var canvas = document.getElementById('layout-canvas');
    var preview = document.getElementById('layout-preview');
    var orient = db.cfg.orientation || 'landscape';
    preview.className = 'layout-preview ' + orient;
    document.getElementById('orient-label').textContent = orient === 'landscape' ? '(Horizontal)' : '(Vertical)';

    canvas.innerHTML = '';
    db.blocks.forEach(function(block){
      var el = document.createElement('div');
      el.className = 'preview-block' + (block.id === selectedBlockId ? ' selected' : '');
      el.dataset.id = block.id;

      // Position as percentage of 12-col / 8-row grid
      el.style.left   = (block.x / COLS * 100) + '%';
      el.style.top    = (block.y / ROWS * 100) + '%';
      el.style.width  = (block.w / COLS * 100) + '%';
      el.style.height = (block.h / ROWS * 100) + '%';

      var colors = { menu: '#1D4ED8', promo: '#92400E', image: '#065F46' };
      var labels = { menu: '☰ MENÚ', promo: '★ PROMO', image: '🖼 IMAGEN' };
      el.style.background = block.type === 'image' && block.data.url
        ? 'url('+block.data.url+') center/cover no-repeat'
        : (block.type === 'menu' ? '#1e2d4a' : block.type === 'promo' ? '#2d1e0a' : '#0a2d1e');

      el.innerHTML = '<div class="block-label">' + labels[block.type] + '</div><div class="resize-handle" data-resize="'+block.id+'"></div>';

      // Click to select
      el.addEventListener('mousedown', function(e){
        if (e.target.dataset.resize) return;
        e.preventDefault();
        selectBlock(block.id);
        startDrag(e, block, canvas, preview);
      });

      // Resize
      el.querySelector('.resize-handle').addEventListener('mousedown', function(e){
        e.preventDefault();
        e.stopPropagation();
        startResize(e, block, canvas, preview);
      });

      canvas.appendChild(el);
    });
  }

  function startDrag(e, block, canvas, preview) {
    var rect = canvas.getBoundingClientRect();
    var cellW = rect.width / COLS;
    var cellH = rect.height / ROWS;
    var startX = e.clientX;
    var startY = e.clientY;
    var origX = block.x;
    var origY = block.y;

    function onMove(e) {
      var dx = Math.round((e.clientX - startX) / cellW);
      var dy = Math.round((e.clientY - startY) / cellH);
      block.x = Math.max(0, Math.min(COLS - block.w, origX + dx));
      block.y = Math.max(0, Math.min(ROWS - block.h, origY + dy));
      renderCanvas();
    }
    function onUp() {
      TortusDB.save();
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  function startResize(e, block, canvas, preview) {
    var rect = canvas.getBoundingClientRect();
    var cellW = rect.width / COLS;
    var cellH = rect.height / ROWS;
    var startX = e.clientX;
    var startY = e.clientY;
    var origW = block.w;
    var origH = block.h;

    function onMove(e) {
      var dw = Math.round((e.clientX - startX) / cellW);
      var dh = Math.round((e.clientY - startY) / cellH);
      block.w = Math.max(2, Math.min(COLS - block.x, origW + dw));
      block.h = Math.max(1, Math.min(ROWS - block.y, origH + dh));
      renderCanvas();
    }
    function onUp() {
      TortusDB.save();
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  function selectBlock(id) {
    selectedBlockId = id;
    renderCanvas();
    var editor = document.getElementById('block-editor');
    var delBtn = document.getElementById('btn-delete-block');
    var info = document.getElementById('grid-info');

    document.getElementById('editor-menu').style.display = 'none';
    document.getElementById('editor-promo').style.display = 'none';
    document.getElementById('editor-image').style.display = 'none';

    if (!id) {
      editor.style.display = 'none';
      delBtn.style.display = 'none';
      info.textContent = 'Seleccioná un bloque para editarlo';
      return;
    }

    var block = db.blocks.find(function(b){ return b.id === id; });
    if (!block) return;

    editor.style.display = 'block';
    delBtn.style.display = 'inline-flex';
    info.textContent = 'Bloque seleccionado: ' + block.type.toUpperCase() + ' — arrastralo para moverlo, el triángulo para redimensionar';

    document.getElementById('editor-'+block.type).style.display = 'block';

    if (block.type === 'menu') renderMenuEditor(block);
    if (block.type === 'promo') renderPromoEditor(block);
    if (block.type === 'image') renderImageEditor(block);
  }

  // ── DELETE BLOCK ──
  document.getElementById('btn-delete-block').addEventListener('click', function(){
    if (!selectedBlockId) return;
    if (!confirm('¿Eliminás este bloque?')) return;
    db.blocks = db.blocks.filter(function(b){ return b.id !== selectedBlockId; });
    TortusDB.save();
    selectBlock(null);
    toast('Bloque eliminado');
  });

  // ── ADD BLOCK ──
  document.getElementById('btn-add-block').addEventListener('click', function(){
    document.getElementById('add-block-modal').style.display = 'flex';
  });
  window.closeModal = function() {
    document.getElementById('add-block-modal').style.display = 'none';
  };
  window.addBlock = function(type) {
    closeModal();
    var defaultData = {
      menu: { items: [] },
      promo: { promos: [] },
      image: { url: '', fit: 'cover', caption: '' }
    };
    var block = { id: db.nextId++, type: type, x: 0, y: 0, w: 6, h: 4, data: defaultData[type] };
    db.blocks.push(block);
    TortusDB.save();
    renderCanvas();
    selectBlock(block.id);
    toast('Bloque agregado — arrastralo para posicionarlo');
  };

  // ── MENU EDITOR ──
  function renderMenuEditor(block) {
    var cats = {};
    (block.data.items || []).forEach(function(item){
      if (!cats[item.cat]) cats[item.cat] = [];
      cats[item.cat].push(item);
    });
    var html = '';
    Object.keys(cats).forEach(function(cat){
      html += '<div class="cat-label">'+cat+'</div>';
      cats[cat].forEach(function(item){
        html += '<div class="item-row"><span class="item-name">'+esc(item.name)+'</span>';
        html += '<span class="item-price">'+db.cfg.currency+' '+item.price.toLocaleString('es-AR')+'</span>';
        html += '<button class="btn-icon" onclick="window._delItem('+block.id+','+item.id+')">✕</button></div>';
      });
    });
    if (!html) html = '<p style="color:var(--text3);font-size:13px;padding:8px 0;">Sin ítems. Agregá el primero.</p>';
    document.getElementById('menu-item-list').innerHTML = html;
  }

  document.getElementById('btn-open-add-item').addEventListener('click', function(){
    var f = document.getElementById('form-add-item');
    f.style.display = f.style.display === 'none' ? 'block' : 'none';
  });
  document.getElementById('btn-cancel-item').addEventListener('click', function(){
    document.getElementById('form-add-item').style.display = 'none';
  });
  document.getElementById('btn-save-item').addEventListener('click', function(){
    var block = db.blocks.find(function(b){ return b.id === selectedBlockId; });
    if (!block) return;
    var name = document.getElementById('new-name').value.trim();
    var price = parseFloat(document.getElementById('new-price').value);
    var cat = document.getElementById('new-cat').value;
    if (!name || isNaN(price)) return;
    if (!block.data.items) block.data.items = [];
    block.data.items.push({ id: db.nextItemId++, name: name, price: price, cat: cat });
    TortusDB.save();
    document.getElementById('new-name').value = '';
    document.getElementById('new-price').value = '';
    document.getElementById('form-add-item').style.display = 'none';
    renderMenuEditor(block);
    renderCanvas();
    toast('Ítem guardado');
  });
  window._delItem = function(blockId, itemId) {
    var block = db.blocks.find(function(b){ return b.id === blockId; });
    if (!block) return;
    block.data.items = block.data.items.filter(function(i){ return i.id !== itemId; });
    TortusDB.save();
    renderMenuEditor(block);
  };

  // ── PROMO EDITOR ──
  function renderPromoEditor(block) {
    var html = '';
    (block.data.promos || []).forEach(function(p){
      html += '<div class="promo-card">';
      html += '<button class="promo-del" onclick="window._delPromo('+block.id+','+p.id+')">✕</button>';
      html += '<div class="promo-card-title">'+esc(p.title)+'</div>';
      html += '<div class="promo-card-desc">'+esc(p.desc)+'</div>';
      if (p.badge) html += '<span class="promo-card-badge">'+esc(p.badge)+'</span>';
      html += '</div>';
    });
    if (!html) html = '<p style="color:var(--text3);font-size:13px;">Sin promos todavía.</p>';
    document.getElementById('promo-list').innerHTML = html;
  }

  document.getElementById('btn-open-add-promo').addEventListener('click', function(){
    var f = document.getElementById('form-add-promo');
    f.style.display = f.style.display === 'none' ? 'block' : 'none';
  });
  document.getElementById('btn-cancel-promo').addEventListener('click', function(){
    document.getElementById('form-add-promo').style.display = 'none';
  });
  document.getElementById('btn-save-promo').addEventListener('click', function(){
    var block = db.blocks.find(function(b){ return b.id === selectedBlockId; });
    if (!block) return;
    var title = document.getElementById('new-promo-title').value.trim();
    var desc = document.getElementById('new-promo-desc').value.trim();
    var badge = document.getElementById('new-promo-badge').value.trim();
    if (!title) return;
    if (!block.data.promos) block.data.promos = [];
    block.data.promos.push({ id: db.nextItemId++, title: title, desc: desc, badge: badge });
    TortusDB.save();
    document.getElementById('new-promo-title').value = '';
    document.getElementById('new-promo-desc').value = '';
    document.getElementById('new-promo-badge').value = '';
    document.getElementById('form-add-promo').style.display = 'none';
    renderPromoEditor(block);
    toast('Promo guardada');
  });
  window._delPromo = function(blockId, promoId) {
    var block = db.blocks.find(function(b){ return b.id === blockId; });
    if (!block) return;
    block.data.promos = block.data.promos.filter(function(p){ return p.id !== promoId; });
    TortusDB.save();
    renderPromoEditor(block);
  };

  // ── IMAGE EDITOR ──
  document.querySelectorAll('.image-tab').forEach(function(tab){
    tab.addEventListener('click', function(){
      document.querySelectorAll('.image-tab').forEach(function(t){ t.classList.remove('active'); });
      tab.classList.add('active');
      document.getElementById('img-tab-url').style.display = tab.dataset.imgTab === 'url' ? 'block' : 'none';
      document.getElementById('img-tab-upload').style.display = tab.dataset.imgTab === 'upload' ? 'block' : 'none';
    });
  });

  function renderImageEditor(block) {
    document.getElementById('img-url').value = block.data.url || '';
    document.getElementById('img-caption').value = block.data.caption || '';
    document.getElementById('img-fit').value = block.data.fit || 'cover';
    updateImgPreview(block.data.url);
  }

  function updateImgPreview(url) {
    var prev = document.getElementById('img-preview');
    if (url) {
      prev.innerHTML = '<img src="'+esc(url)+'" style="width:100%;height:100%;object-fit:cover;" />';
    } else {
      prev.innerHTML = '<span>Sin imagen</span>';
    }
  }

  document.getElementById('btn-apply-url').addEventListener('click', function(){
    var url = document.getElementById('img-url').value.trim();
    updateImgPreview(url);
  });

  document.getElementById('img-file').addEventListener('change', function(e){
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev){
      document.getElementById('img-url').value = ev.target.result;
      updateImgPreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('btn-save-image').addEventListener('click', function(){
    var block = db.blocks.find(function(b){ return b.id === selectedBlockId; });
    if (!block) return;
    block.data.url = document.getElementById('img-url').value.trim();
    block.data.caption = document.getElementById('img-caption').value.trim();
    block.data.fit = document.getElementById('img-fit').value;
    TortusDB.save();
    renderCanvas();
    toast('Imagen guardada');
  });

  // ── CONFIG ──
  function loadConfig() {
    var c = db.cfg;
    document.getElementById('cfg-name').value = c.name || '';
    document.getElementById('cfg-tagline').value = c.tagline || '';
    document.getElementById('cfg-currency').value = c.currency || '$';
    document.getElementById('cfg-footer').value = c.footer || '';
    document.querySelectorAll('input[name="accent"]').forEach(function(r){ r.checked = r.value === c.accent; });
    document.querySelectorAll('input[name="orient"]').forEach(function(r){ r.checked = r.value === c.orientation; });
    document.querySelectorAll('.orient-opt').forEach(function(o){
      o.classList.toggle('selected', o.querySelector('input').value === c.orientation);
    });
    document.querySelectorAll('input[name="orient"]').forEach(function(r){
      r.addEventListener('change', function(){
        document.querySelectorAll('.orient-opt').forEach(function(o){
          o.classList.toggle('selected', o.querySelector('input').value === r.value);
        });
      });
    });
  }

  document.getElementById('btn-save-config').addEventListener('click', function(){
    db.cfg.name = document.getElementById('cfg-name').value.trim();
    db.cfg.tagline = document.getElementById('cfg-tagline').value.trim();
    db.cfg.currency = document.getElementById('cfg-currency').value;
    db.cfg.footer = document.getElementById('cfg-footer').value.trim();
    var ac = document.querySelector('input[name="accent"]:checked');
    if (ac) db.cfg.accent = ac.value;
    var or = document.querySelector('input[name="orient"]:checked');
    if (or) db.cfg.orientation = or.value;
    TortusDB.save();
    renderCanvas();
    toast('Configuración guardada ✓');
  });

  document.getElementById('btn-change-pass').addEventListener('click', function(){
    var p1 = document.getElementById('new-pass').value;
    var p2 = document.getElementById('new-pass2').value;
    var msg = document.getElementById('pass-msg');
    if (!p1) { msg.textContent = 'Ingresá una nueva contraseña.'; return; }
    if (p1 !== p2) { msg.textContent = 'Las contraseñas no coinciden.'; return; }
    if (p1.length < 4) { msg.textContent = 'Mínimo 4 caracteres.'; return; }
    db.pass = p1;
    TortusDB.save();
    document.getElementById('new-pass').value = '';
    document.getElementById('new-pass2').value = '';
    msg.textContent = '';
    toast('Contraseña actualizada ✓');
  });

  // ── HELPERS ──
  function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  var toastTimer;
  function toast(msg) {
    var el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ el.classList.remove('show'); }, 2500);
  }

})();

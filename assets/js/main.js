/* =========================================================
   ABP Academic — main.js
   ========================================================= */

(function () {
  'use strict';

  /* ---------------- Utilitas ---------------- */

  function $(id) { return document.getElementById(id); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) { n.className = cls; }
    if (html != null) { n.innerHTML = html; }
    return n;
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function status(msg) { var e = $('status'); if (e) { e.textContent = msg; } }

  function getJSON(url, fallback) {
    if (typeof fetch !== 'function') { return Promise.resolve(fallback); }
    return fetch(url)
      .then(function (r) { if (!r.ok) { throw new Error(r.status); } return r.json(); })
      .catch(function () { return fallback; });
  }

  /* Sorot hasil pencarian tanpa merusak markup */
  function hl(text, q) {
    var t = esc(text == null ? '' : text);
    if (!q) { return t; }
    var needle = esc(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return t.replace(new RegExp('(' + needle + ')', 'gi'), '<mark>$1</mark>');
  }

  /* ---------------- Kunci ---------------- */

  var PW_SHA = '0714665e2b862ebc0c7d9927a8ecdf49bf126dfc145b2915b2568cb826b0d4c4';
  var PW_DJB = 445639743;

  function djb2(s) {
    var h = 5381;
    for (var i = 0; i < s.length; i++) { h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; }
    return h;
  }
  function sha256hex(s) {
    if (!(window.crypto && crypto.subtle && crypto.subtle.digest)) { return Promise.resolve(null); }
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
      .then(function (buf) {
        return Array.prototype.map.call(new Uint8Array(buf), function (b) {
          return ('0' + b.toString(16)).slice(-2);
        }).join('');
      })
      .catch(function () { return null; });
  }
  function checkPassword(pw) {
    return sha256hex(pw).then(function (hex) {
      if (hex) { return hex === PW_SHA; }
      return djb2(pw) === PW_DJB;
    });
  }

  /* ---------------- Data ---------------- */

  var DATA = { profile: {}, pubs: [], cv: {} };

  var TABS = [
    { id: 'beranda',     label: 'Beranda' },
    { id: 'pendidikan',  label: 'Pendidikan' },
    { id: 'pekerjaan',   label: 'Pekerjaan' },
    { id: 'publikasi',   label: 'Publikasi Ilmiah' },
    { id: 'populer',     label: 'Tulisan Populer' },
    { id: 'seminar',     label: 'Seminar' },
    { id: 'sertifikasi', label: 'Sertifikasi' },
    { id: 'pengabdian',  label: 'Pengabdian' },
    { id: 'proyek',      label: 'Proyek & Tautan' },
    { id: 'kontak',      label: 'Kontak' }
  ];

  var state = { tab: 'beranda', query: '', media: '', sort: {}, expanded: false, anim: true };

  /* ---------------- Tabel ---------------- */

  function sortRows(rows, key, dir) {
    var out = rows.slice();
    out.sort(function (a, b) {
      var x = (a[key] == null ? '' : String(a[key]));
      var y = (b[key] == null ? '' : String(b[key]));
      if (x === '' && y !== '') { return 1; }
      if (y === '' && x !== '') { return -1; }
      var r = x.localeCompare(y, 'id', { numeric: true, sensitivity: 'base' });
      return dir === 'desc' ? -r : r;
    });
    return out;
  }

  function buildTable(tableId, cols, rows, opts) {
    opts = opts || {};
    var table = $(tableId);
    if (!table) { return 0; }

    var q = state.query;
    var data = rows.filter(function (r) {
      if (opts.mediaKey && state.media && r[opts.mediaKey] !== state.media) { return false; }
      if (!q) { return true; }
      return cols.some(function (c) {
        return String(r[c.key] == null ? '' : r[c.key]).toLowerCase().indexOf(q.toLowerCase()) > -1;
      });
    });

    var s = state.sort[tableId];
    if (s) { data = sortRows(data, s.key, s.dir); }

    table.innerHTML = '';

    var thead = el('thead');
    var htr = el('tr');
    htr.appendChild(el('th', 'num', '#'));
    cols.forEach(function (c) {
      var th = el('th', (c.cls || '') + (c.sortable === false ? '' : ' sortable'), esc(c.label));
      if (c.sortable !== false) {
        if (s && s.key === c.key) { th.className += ' ' + s.dir; }
        th.addEventListener('click', function () {
          var cur = state.sort[tableId];
          var dir = (cur && cur.key === c.key && cur.dir === 'asc') ? 'desc' : 'asc';
          state.sort[tableId] = { key: c.key, dir: dir };
          render();
          status('Diurutkan menurut ' + c.label + ' (' + (dir === 'asc' ? 'naik' : 'turun') + ')');
        });
      }
      htr.appendChild(th);
    });
    thead.appendChild(htr);
    table.appendChild(thead);

    var tbody = el('tbody');
    if (!data.length) {
      var tr0 = el('tr');
      var td0 = el('td', '', '<span class="gray">Tidak ada data yang cocok.</span>');
      td0.colSpan = cols.length + 1;
      tr0.appendChild(td0);
      tbody.appendChild(tr0);
    }
    data.forEach(function (r, i) {
      var tr = el('tr');
      tr.appendChild(el('td', 'num', String(i + 1)));
      cols.forEach(function (c) {
        tr.appendChild(el('td', c.cls || '', c.render ? c.render(r, q) : hl(r[c.key], q)));
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    var cnt = $('c-' + tableId.replace('t-', ''));
    if (cnt) {
      cnt.textContent = q || state.media
        ? data.length + ' dari ' + rows.length + ' entri'
        : rows.length + ' entri';
    }
    return data.length;
  }

  function extLink(url, label, q) {
    if (!url) { return hl(label, q); }
    return '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + hl(label, q) + '</a>';
  }

  /* ---------------- Render tiap bagian ---------------- */

  function renderBeranda() {
    var p = DATA.profile;
    var first = (p.name || 'Ananda Bintang').split(' ').slice(0, 2).join(' ');
    var h = $('hero-name');
    if (h) { h.textContent = first; h.setAttribute('data-text', first); }
    if ($('hero-tagline')) { $('hero-tagline').textContent = String(p.title || '').replace(/\s*\|\s*/g, ' · '); }
    if ($('hero-interests')) { $('hero-interests').textContent = (p.interests || []).join(' · '); }
    if ($('bio')) { $('bio').textContent = p.bio || ''; }

    var idn = $('identity');
    if (idn) {
      idn.innerHTML = '';
      [['Nama', p.name], ['Jenis kelamin', p.gender], ['Tempat, tanggal lahir', p.birth],
       ['Minat riset', (p.interests || []).join(', ')]].forEach(function (row) {
        if (!row[1]) { return; }
        var d = el('div');
        d.appendChild(el('dt', '', esc(row[0])));
        d.appendChild(el('dd', '', esc(row[1])));
        idn.appendChild(d);
      });
    }

    var st = $('stats');
    if (st) {
      var cv = DATA.cv;
      st.innerHTML = '';
      [['Publikasi ilmiah', (DATA.pubs || []).length],
       ['Tulisan populer', (cv.popular || []).length],
       ['Seminar & pembicara', (cv.seminars || []).length],
       ['Sertifikasi', (cv.certifications || []).length],
       ['Pengabdian masyarakat', (cv.service || []).length]].forEach(function (row) {
        var d = el('div');
        d.appendChild(el('dt', '', esc(row[0])));
        d.appendChild(el('dd', '', '<b>' + row[1] + '</b>'));
        st.appendChild(d);
      });
    }

    var qk = $('quicklinks');
    if (qk) {
      qk.innerHTML = '';
      (DATA.cv.links || []).filter(function (l) {
        return l.group === 'Proyek Web' || l.group === 'Humaniora Digital';
      }).slice(0, 6).forEach(function (l) { qk.appendChild(linkCard(l)); });
    }
  }

  function linkCard(l) {
    var b = el('button', 'linkcard' + (l.lock ? ' locked' : ''));
    b.type = 'button';
    b.innerHTML = '<span class="ic"></span><span class="grow"><b>' + esc(l.label) + '</b>' +
      '<span>' + esc(l.note || '') + '</span>' +
      '<code>' + esc(l.url.replace(/^https?:\/\//, '').slice(0, 58)) + '</code></span>';
    b.addEventListener('click', function () {
      if (l.lock) {
        askPassword('Tautan "' + l.label + '" dilindungi kata sandi.', function () {
          window.open(l.url, '_blank', 'noopener');
          status('Membuka ' + l.label);
        });
      } else {
        window.open(l.url, '_blank', 'noopener');
        status('Membuka ' + l.label);
      }
    });
    b.addEventListener('mouseenter', function () { status(l.url); });
    b.addEventListener('mouseleave', function () { status('Selesai'); });
    return b;
  }

  function renderProyek() {
    var box = $('linkgroups');
    if (!box) { return 0; }
    var q = state.query.toLowerCase();
    var links = (DATA.cv.links || []).filter(function (l) {
      if (!q) { return true; }
      return (l.label + ' ' + (l.note || '') + ' ' + l.url).toLowerCase().indexOf(q) > -1;
    });

    box.innerHTML = '';
    var groups = [];
    links.forEach(function (l) { if (groups.indexOf(l.group) < 0) { groups.push(l.group); } });
    groups.forEach(function (g) {
      box.appendChild(el('h3', '', esc(g)));
      var grid = el('div', 'linkgrid');
      links.filter(function (l) { return l.group === g; }).forEach(function (l) { grid.appendChild(linkCard(l)); });
      box.appendChild(grid);
    });
    if (!links.length) { box.appendChild(el('p', 'gray', 'Tidak ada tautan yang cocok.')); }

    var c = $('c-proyek');
    if (c) { c.textContent = links.length + ' dari ' + (DATA.cv.links || []).length + ' tautan'; }
    return links.length;
  }

  function renderKontak() {
    var p = DATA.profile;
    var box = $('contact');
    if (!box) { return; }
    box.innerHTML = '';
    var rows = [
      ['Surel', p.email ? '<a href="mailto:' + esc(p.email) + '">' + esc(p.email) + '</a>' : ''],
      ['Telepon', p.phone ? '<a href="tel:' + esc(p.phone.replace(/\s/g, '')) + '">' + esc(p.phone) + '</a>' : ''],
      ['Google Scholar', p.scholar ? '<a href="' + esc(p.scholar) + '" target="_blank" rel="noopener">Profil Scholar</a>' : ''],
      ['Linktree', p.linktree ? '<a href="' + esc(p.linktree) + '" target="_blank" rel="noopener">' + esc(p.linktree.replace(/^https?:\/\//, '')) + '</a>' : '']
    ];
    rows.forEach(function (r) {
      if (!r[1]) { return; }
      var d = el('div');
      d.appendChild(el('dt', '', esc(r[0])));
      d.appendChild(el('dd', '', r[1]));
      box.appendChild(d);
    });
  }

  function renderMediaFilter() {
    var box = $('mediafilter');
    if (!box) { return; }
    var list = [];
    (DATA.cv.popular || []).forEach(function (r) { if (list.indexOf(r.media) < 0) { list.push(r.media); } });
    list.sort();
    box.innerHTML = '';
    [''].concat(list).forEach(function (m) {
      var b = el('button', 'small');
      b.type = 'button';
      b.textContent = m || 'Semua';
      if (state.media === m) { b.style.fontWeight = 'bold'; b.style.background = '#000080'; b.style.color = '#fff'; }
      b.addEventListener('click', function () {
        state.media = (state.media === m) ? '' : m;
        render();
        status(state.media ? 'Menyaring media: ' + state.media : 'Filter media dibersihkan');
      });
      box.appendChild(b);
    });
  }

  /* ---------------- Render utama ---------------- */

  function render() {
    var q = state.query;
    var counts = {};

    renderBeranda();
    renderMediaFilter();
    renderKontak();

    counts.pendidikan = buildTable('t-pendidikan', [
      { key: 'level', label: 'Jenjang', cls: 'yr' },
      { key: 'school', label: 'Perguruan Tinggi' },
      { key: 'field', label: 'Bidang Ilmu' },
      { key: 'year', label: 'Lulus', cls: 'yr' }
    ], DATA.cv.education || []);

    counts.pekerjaan = buildTable('t-pekerjaan', [
      { key: 'org', label: 'Organisasi' },
      { key: 'role', label: 'Posisi' },
      { key: 'year', label: 'Periode', cls: 'yr' }
    ], DATA.cv.work || []);

    counts.publikasi = buildTable('t-publikasi', [
      { key: 'year', label: 'Tahun', cls: 'yr' },
      {
        key: 'title', label: 'Judul & Jurnal',
        render: function (r, qq) {
          var s = '<b>' + extLink(r.url, r.title, qq) + '</b>';
          if (r.journal) { s += '<br><em class="muted">' + hl(r.journal, qq) + '</em>'; }
          if (r.rank) { s += '<span class="chip">' + esc(r.rank) + '</span>'; }
          return s;
        }
      }
    ], DATA.pubs || []);

    counts.populer = buildTable('t-populer', [
      { key: 'year', label: 'Tahun', cls: 'yr', render: function (r) { return r.year || '<span class="gray">—</span>'; } },
      { key: 'title', label: 'Judul', render: function (r, qq) { return '<b>' + extLink(r.url, r.title, qq) + '</b>'; } },
      { key: 'media', label: 'Media', render: function (r, qq) { return hl(r.media, qq); } }
    ], DATA.cv.popular || [], { mediaKey: 'media' });

    counts.seminar = buildTable('t-seminar', [
      { key: 'year', label: 'Tahun', cls: 'yr' },
      {
        key: 'event', label: 'Kegiatan',
        render: function (r, qq) {
          return '<b>' + hl(r.event, qq) + '</b><span class="chip role">' + esc(r.role) + '</span>';
        }
      },
      { key: 'host', label: 'Penyelenggara', render: function (r, qq) { return '<span class="muted">' + hl(r.host, qq) + '</span>'; } }
    ], DATA.cv.seminars || []);

    counts.sertifikasi = buildTable('t-sertifikasi', [
      { key: 'year', label: 'Tahun', cls: 'yr' },
      { key: 'title', label: 'Nama Sertifikasi' },
      { key: 'issuer', label: 'Penyelenggara', render: function (r, qq) { return r.issuer ? '<span class="muted">' + hl(r.issuer, qq) + '</span>' : '<span class="gray">—</span>'; } }
    ], DATA.cv.certifications || []);

    counts.pengabdian = buildTable('t-pengabdian', [
      { key: 'year', label: 'Tahun', cls: 'yr' },
      { key: 'title', label: 'Nama Kegiatan' }
    ], DATA.cv.service || []);

    counts.proyek = renderProyek();

    if (q) {
      var total = 0;
      Object.keys(counts).forEach(function (k) { total += counts[k] || 0; });
      $('findresult').textContent = total + ' hasil ditemukan';
      $('findresult').title = Object.keys(counts).map(function (k) { return k + ': ' + counts[k]; }).join(', ');
    } else {
      $('findresult').textContent = '';
    }
  }

  /* ---------------- Tab & riwayat ---------------- */

  function buildTabs() {
    var strip = $('tabstrip');
    strip.innerHTML = '';
    TABS.forEach(function (t) {
      var b = el('button', '', esc(t.label));
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.dataset.tab = t.id;
      b.addEventListener('click', function () { goTab(t.id); });
      strip.appendChild(b);
    });

    var goto = $('menu-goto');
    goto.innerHTML = '';
    TABS.forEach(function (t) {
      var li = el('li');
      var b = el('button', '', esc(t.label));
      b.type = 'button';
      b.addEventListener('click', function () { closeMenus(); goTab(t.id); });
      li.appendChild(b);
      goto.appendChild(li);
    });
  }

  function goTab(id) {
    if (location.hash.replace('#', '') === id) { showTab(id); return; }
    location.hash = id;                 /* masuk riwayat → Kembali/Maju berfungsi */
  }

  function showTab(id) {
    if (!TABS.some(function (t) { return t.id === id; })) { id = 'beranda'; }
    state.tab = id;
    state.expanded = false;

    $$('.tabpane').forEach(function (p) { p.hidden = (p.id !== 'pane-' + id); });
    $$('#tabstrip button').forEach(function (b) {
      b.setAttribute('aria-selected', b.dataset.tab === id ? 'true' : 'false');
    });

    var label = (TABS.filter(function (t) { return t.id === id; })[0] || {}).label || '';
    $('urlbar').textContent = 'http://anandabintangp.github.io/index.html#' + id;
    $('taskitem').textContent = 'ABP Academic — ' + label;
    document.title = (DATA.profile.name || 'ABP Academic') + ' — ' + label;
    var tb = document.querySelector('.tb-text');
    if (tb) { tb.textContent = 'ABP Academic — [' + label + ']'; }
    status('Selesai');
    updateNav();
  }

  function updateNav() {
    var i = TABS.map(function (t) { return t.id; }).indexOf(state.tab);
    var fwd = document.querySelector('[data-act="forward"]');
    if (fwd) { fwd.title = 'Maju (tab berikutnya: ' + (TABS[i + 1] ? TABS[i + 1].label : '—') + ')'; }
  }

  /* ---------------- Menu ---------------- */

  function closeMenus() {
    $$('.menu').forEach(function (m) { m.classList.remove('open'); });
    $('startmenu').classList.remove('open');
  }

  function setupMenus() {
    $$('.menu').forEach(function (m) {
      var btn = m.querySelector('button');
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var wasOpen = m.classList.contains('open');
        closeMenus();
        if (!wasOpen) { m.classList.add('open'); }
      });
      m.addEventListener('mouseenter', function () {
        if ($$('.menu.open').length) { closeMenus(); m.classList.add('open'); }
      });
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.menu') && !e.target.closest('#startmenu') && e.target.id !== 'startbtn') {
        closeMenus();
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeMenus(); closeDialogs(); }
    });
  }

  function buildLinkMenus() {
    var links = DATA.cv.links || [];

    var ml = $('menu-links');
    ml.innerHTML = '';
    links.forEach(function (l) {
      var li = el('li');
      var b = el('button', '', esc(l.label) + (l.lock ? ' 🔒' : ''));
      b.type = 'button';
      b.addEventListener('click', function () {
        closeMenus();
        if (l.lock) {
          askPassword('Tautan "' + l.label + '" dilindungi kata sandi.', function () {
            window.open(l.url, '_blank', 'noopener');
          });
        } else { window.open(l.url, '_blank', 'noopener'); }
      });
      li.appendChild(b);
      ml.appendChild(li);
    });

    var sl = $('startlist');
    sl.innerHTML = '';
    TABS.forEach(function (t) {
      var li = el('li');
      var b = el('button', '', esc(t.label));
      b.type = 'button';
      b.addEventListener('click', function () { closeMenus(); goTab(t.id); });
      li.appendChild(b);
      sl.appendChild(li);
    });
    sl.appendChild(el('li', 'sep'));
    var liCv = el('li');
    liCv.innerHTML = '<a href="assets/CV-Ananda-Bintang-Purwaramdhona.pdf" target="_blank" rel="noopener">Buka CV (PDF)</a>';
    sl.appendChild(liCv);
    var liAd = el('li');
    var bAd = el('button', '', 'Panel Admin…');
    bAd.type = 'button';
    bAd.addEventListener('click', function () { closeMenus(); openAdmin(); });
    liAd.appendChild(bAd);
    sl.appendChild(liAd);
  }

  /* ---------------- Dialog ---------------- */

  var pwCallback = null;

  function askPassword(msg, cb) {
    pwCallback = cb;
    $('pw-msg').textContent = msg;
    $('pw').value = '';
    $('pw-err').textContent = '';
    $('pwdlg').classList.add('open');
    setTimeout(function () { $('pw').focus(); }, 30);
  }

  function submitPassword() {
    var v = $('pw').value;
    $('pw-err').textContent = 'Memeriksa…';
    checkPassword(v).then(function (ok) {
      if (ok) {
        $('pwdlg').classList.remove('open');
        $('pw-err').textContent = '';
        var cb = pwCallback; pwCallback = null;
        if (cb) { cb(); }
      } else {
        $('pw-err').textContent = 'Kata sandi salah. Coba lagi.';
        $('pw').value = '';
        $('pw').focus();
      }
    });
  }

  function closeDialogs() {
    $('pwdlg').classList.remove('open');
    $('infodlg').classList.remove('open');
    pwCallback = null;
  }

  function showInfo(title, html) {
    $('info-title').textContent = title;
    $('info-body').innerHTML = html;
    $('infodlg').classList.add('open');
  }

  function openAdmin() {
    askPassword('Panel Admin dilindungi. Masukkan kata sandi untuk melanjutkan.', function () {
      status('Membuka Panel Admin…');
      location.href = 'edit.html#unlock=' + PW_SHA;
    });
  }

  /* ---------------- Asisten ---------------- */

  var TIPS = [
    'Tekan tombol <b>Kembali</b> dan <b>Maju</b> di baris alat — keduanya menelusuri riwayat tab yang sudah kamu buka.',
    'Klik judul kolom di tabel mana pun untuk mengurutkan naik atau turun.',
    'Tombol <b>Cari</b> menyaring seluruh bagian sekaligus, bukan cuma tab yang sedang terbuka.',
    'Di tab <b>Tulisan Populer</b> ada penyaring media: klik Mojok, Pena Budaya, Tempo, dan seterusnya.',
    'Semua judul publikasi bisa diklik langsung menuju naskah atau profil Google Scholar.',
    'Menu <b>Penanda</b> berisi seluruh tautan proyek. Yang bergambar gembok butuh kata sandi.',
    'Tombol <b>Mulai</b> di pojok kiri bawah membuka daftar seluruh bagian situs.',
    'Menu <b>Berkas &rsaquo; Unduh CV</b> menyimpan berkas PDF versi lengkap.',
    'Menu <b>Tampilan &rsaquo; Buka semua bagian</b> menampilkan seluruh isi sekaligus — enak untuk dicetak.',
    'Tombol <b>?</b> di pojok kanan atas menampilkan keterangan situs ini.'
  ];
  var tipIndex = -1;

  function clippyTip(text) {
    var box = $('clippy');
    box.classList.add('show');
    $('clippy-tab').classList.remove('show');
    if (text) { $('clippy-text').innerHTML = text; return; }
    tipIndex = (tipIndex + 1) % TIPS.length;
    $('clippy-text').innerHTML = TIPS[tipIndex];
  }
  function clippyHide() {
    $('clippy').classList.remove('show');
    $('clippy-tab').classList.add('show');
  }

  /* ---------------- Aksi ---------------- */

  var ACTIONS = {
    back: function () { history.back(); status('Kembali…'); },
    forward: function () { history.forward(); status('Maju…'); },
    home: function () { goTab('beranda'); },
    reload: function () { location.reload(); },
    stop: function () {
      state.anim = false;
      document.documentElement.style.setProperty('animation-play-state', 'paused');
      $$('.brandmark').forEach(function (b) { b.classList.remove('busy'); });
      if (window.stop) { try { window.stop(); } catch (e) {} }
      status('Dihentikan.');
    },
    print: function () { window.print(); },
    cv: function () { window.open('assets/CV-Ananda-Bintang-Purwaramdhona.pdf', '_blank', 'noopener'); },
    mail: function () {
      var m = DATA.profile.email || '';
      location.href = 'mailto:' + m;
      status('Membuka aplikasi surel…');
    },
    admin: openAdmin,
    find: function () {
      var f = $('findbar');
      f.classList.add('open');
      $('q').focus();
      status('Ketik kata kunci untuk mencari di seluruh bagian.');
    },
    'find-close': function () {
      $('findbar').classList.remove('open');
      $('q').value = ''; state.query = ''; render();
    },
    'find-clear': function () { $('q').value = ''; state.query = ''; render(); $('q').focus(); },
    maxi: function () { zoom(1); },
    mini: function () { zoom(-1); },
    'zoom-reset': function () { zoom(0); },
    expand: function () {
      state.expanded = !state.expanded;
      $$('.tabpane').forEach(function (p) { p.hidden = state.expanded ? false : (p.id !== 'pane-' + state.tab); });
      status(state.expanded ? 'Semua bagian dibuka.' : 'Kembali ke satu bagian.');
    },
    'copy-email': function () { copyText(DATA.profile.email || '', 'Alamat surel disalin.'); },
    'copy-url': function () { copyText(location.href, 'Alamat situs disalin.'); },
    'clippy-tip': function () { clippyTip(); },
    'clippy-hide': clippyHide,
    'clippy-show': function () { clippyTip(); },
    'clippy-toggle': function () {
      if ($('clippy').classList.contains('show')) { clippyHide(); } else { clippyTip(); }
    },
    'anim-toggle': function () {
      state.anim = !state.anim;
      document.body.style.setProperty('--anim', state.anim ? 'running' : 'paused');
      $$('#clippy .guy, .brandmark').forEach(function (n) {
        n.style.animationPlayState = state.anim ? 'running' : 'paused';
      });
      status(state.anim ? 'Animasi dihidupkan.' : 'Animasi dimatikan.');
    },
    about: function () {
      var p = DATA.profile;
      showInfo('Tentang situs ini',
        '<p><b>' + esc(p.name || '') + '</b><br>' + esc(String(p.title || '').replace(/\s*\|\s*/g, ' · ')) + '</p>' +
        '<p>Situs ini memuat riwayat pendidikan, pekerjaan, publikasi ilmiah dan populer, seminar, sertifikasi, ' +
        'pengabdian masyarakat, serta tautan proyek. Seluruh isi dibaca dari berkas JSON di folder <code>data/</code> ' +
        'dan dapat disunting lewat Panel Admin.</p>' +
        '<p class="small gray">Tampilan bergaya antarmuka desktop era 2000.</p>');
    },
    'pw-ok': submitPassword,
    'pw-cancel': closeDialogs,
    'info-close': closeDialogs
  };

  function copyText(t, okMsg) {
    if (!t) { return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(t).then(function () { status(okMsg); },
        function () { status('Gagal menyalin: ' + t); });
    } else { status(t); }
  }

  var zoomLevel = 0;
  function zoom(dir) {
    zoomLevel = dir === 0 ? 0 : Math.max(-2, Math.min(4, zoomLevel + dir));
    document.documentElement.style.setProperty('--zoom', (16 + zoomLevel * 1.5) + 'px');
    status('Ukuran teks: ' + (16 + zoomLevel * 1.5) + 'px');
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]');
    if (!t) { return; }
    var act = t.dataset.act;
    if (ACTIONS[act]) {
      e.preventDefault();
      closeMenus();
      ACTIONS[act]();
    }
  });

  /* ---------------- Taskbar ---------------- */

  function tick() {
    var d = new Date();
    $('clock').textContent = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }

  /* ---------------- Mulai ---------------- */

  status('Menghubungkan…');
  $('brandmark').classList.add('busy');

  buildTabs();
  setupMenus();
  tick();
  setInterval(tick, 20000);

  $('startbtn').addEventListener('click', function (e) {
    e.stopPropagation();
    var m = $('startmenu');
    var open = m.classList.contains('open');
    closeMenus();
    if (!open) { m.classList.add('open'); }
  });

  $('q').addEventListener('input', function () {
    state.query = this.value.trim();
    render();
    if (state.query) { status('Mencari "' + state.query + '"…'); }
  });

  $('pw').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); submitPassword(); }
  });

  $$('.overlay').forEach(function (o) {
    o.addEventListener('click', function (e) { if (e.target === o) { closeDialogs(); } });
  });

  window.addEventListener('hashchange', function () {
    showTab(location.hash.replace('#', ''));
  });

  document.addEventListener('mouseover', function (e) {
    var a = e.target.closest('a[href]');
    if (a) { status(a.href); }
  });
  document.addEventListener('mouseout', function (e) {
    if (e.target.closest('a[href]')) { status('Selesai'); }
  });

  Promise.all([
    getJSON('data/profile.json', {}),
    getJSON('data/publications.json', []),
    getJSON('data/cv.json', {})
  ]).then(function (res) {
    DATA.profile = res[0] || {};
    DATA.pubs = res[1] || [];
    DATA.cv = res[2] || {};

    buildLinkMenus();
    render();

    if (!location.hash) { history.replaceState(null, '', '#beranda'); }
    showTab(location.hash.replace('#', '') || 'beranda');

    $('brandmark').classList.remove('busy');
    status('Selesai');
    setTimeout(function () {
      if (window.innerWidth >= 780) {
        clippyTip('Halo! Saya asisten situs ini. Klik saya kapan saja untuk tips memakai halaman ini.');
      } else {
        $('clippy-tab').classList.add('show');   /* layar kecil: cukup tombol kecil */
      }
    }, 900);
  });
})();

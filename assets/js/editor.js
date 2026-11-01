/* =========================================================
   ABP Academic — editor.js (Panel Admin)

   Masuk  : token akun GitHub. GitHub sendiri yang memeriksa, jadi tidak ada
            kata sandi atau hash di kode ini.
   Simpan : satu commit langsung ke repositori lewat API GitHub.
   ========================================================= */

(function () {
  'use strict';

  var OWNER = 'Anandabintangp';
  var REPO = 'anandabintangp.github.io';
  var API = 'https://api.github.com';
  var TOKEN_KEY = 'abp-admin-token';

  var FILES = [
    { k: 'profile', path: 'data/profile.json' },
    { k: 'pubs',    path: 'data/publications.json' },
    { k: 'cv',      path: 'data/cv.json' }
  ];

  var token = '';
  var branch = 'main';
  var snap = null;        /* isi yang sama persis dengan repositori */
  var busy = false;
  var dirty = false;

  function $(id) { return document.getElementById(id); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function el(t, c, h) { var n = document.createElement(t); if (c) { n.className = c; } if (h != null) { n.innerHTML = h; } return n; }
  function status(m) { var e = $('status'); if (e) { e.textContent = m; } }

  /* ---------------- Penyimpanan token ---------------- */

  function storeGet() {
    try {
      var l = localStorage.getItem(TOKEN_KEY);
      if (l) { return { t: l, remember: true }; }
      var s = sessionStorage.getItem(TOKEN_KEY);
      if (s) { return { t: s, remember: false }; }
    } catch (e) {}
    return null;
  }
  function storeClear() {
    try { localStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(TOKEN_KEY); } catch (e) {}
  }
  function storeSet(t, remember) {
    storeClear();
    try { (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, t); } catch (e) {}
  }

  /* ---------------- API GitHub ---------------- */

  function errText(res, body) {
    var m = (body && body.message) || ('Kesalahan ' + res.status);
    if (res.status === 401) { return 'Token tidak valid atau sudah kedaluwarsa.'; }
    if (res.status === 403) { return 'Token tidak punya izin untuk repositori ini (' + m + ').'; }
    if (res.status === 404) { return 'Repositori tidak ditemukan, atau token belum diberi akses ke repositori ini.'; }
    if (res.status === 422) { return 'Isi repositori berubah di tempat lain. Muat ulang halaman, lalu ulangi.'; }
    return m;
  }

  function headers(accept, json) {
    var h = {
      'Authorization': 'Bearer ' + token,
      'Accept': accept || 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    };
    if (json) { h['Content-Type'] = 'application/json'; }
    return h;
  }

  function netFail(e) {
    if (e && e.status) { throw e; }
    throw new Error('Tidak bisa terhubung ke GitHub. Periksa koneksi internet.');
  }

  function gh(path, method, payload) {
    var opts = { method: method || 'GET', headers: headers(null, !!payload), cache: 'no-store' };
    if (payload) { opts.body = JSON.stringify(payload); }
    return fetch(API + path, opts).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (body) {
        if (!res.ok) { var e = new Error(errText(res, body)); e.status = res.status; throw e; }
        return body;
      });
    }).catch(netFail);
  }

  function ghRaw(path) {
    return fetch(API + path, { headers: headers('application/vnd.github.raw+json'), cache: 'no-store' })
      .then(function (res) {
        if (res.status === 404) { return null; }
        if (!res.ok) {
          return res.json().catch(function () { return {}; }).then(function (body) {
            var e = new Error(errText(res, body)); e.status = res.status; throw e;
          });
        }
        return res.text();
      }).catch(netFail);
  }

  /* ---------------- Skema bagian ---------------- */

  var SECTIONS = [
    { id: 'publications', target: 'pubs', label: 'Publikasi Ilmiah', defYear: true, fields: [
      { k: 'year', l: 'Tahun', w: '78px' }, { k: 'title', l: 'Judul', w: 'minmax(180px,2fr)' },
      { k: 'journal', l: 'Jurnal', w: 'minmax(120px,1fr)' }, { k: 'rank', l: 'Sinta', w: '78px' },
      { k: 'url', l: 'Tautan', w: 'minmax(140px,1fr)', url: true } ] },
    { id: 'education', target: 'cv', label: 'Pendidikan', fields: [
      { k: 'level', l: 'Jenjang', w: '80px' }, { k: 'school', l: 'Perguruan Tinggi', w: 'minmax(140px,1fr)' },
      { k: 'field', l: 'Bidang Ilmu', w: 'minmax(120px,1fr)' }, { k: 'year', l: 'Lulus', w: '80px' } ] },
    { id: 'work', target: 'cv', label: 'Pekerjaan', fields: [
      { k: 'org', l: 'Organisasi', w: 'minmax(130px,1fr)' }, { k: 'role', l: 'Posisi', w: 'minmax(180px,2fr)' },
      { k: 'year', l: 'Periode', w: 'minmax(110px,1fr)' } ] },
    { id: 'popular', target: 'cv', label: 'Tulisan Populer', defYear: true, fields: [
      { k: 'year', l: 'Tahun', w: '78px' }, { k: 'title', l: 'Judul', w: 'minmax(180px,2fr)' },
      { k: 'media', l: 'Media', w: 'minmax(110px,1fr)' }, { k: 'url', l: 'Tautan', w: 'minmax(140px,1fr)', url: true } ] },
    { id: 'seminars', target: 'cv', label: 'Seminar & Pembicara', defYear: true, fields: [
      { k: 'year', l: 'Tahun', w: '78px' }, { k: 'event', l: 'Kegiatan', w: 'minmax(160px,2fr)' },
      { k: 'host', l: 'Penyelenggara', w: 'minmax(150px,2fr)' }, { k: 'role', l: 'Status', w: '110px' } ] },
    { id: 'certifications', target: 'cv', label: 'Sertifikasi', defYear: true, fields: [
      { k: 'year', l: 'Tahun', w: '78px' }, { k: 'title', l: 'Nama Sertifikasi', w: 'minmax(200px,2fr)' },
      { k: 'issuer', l: 'Penyelenggara', w: 'minmax(140px,1fr)' } ] },
    { id: 'service', target: 'cv', label: 'Pengabdian Masyarakat', defYear: true, fields: [
      { k: 'year', l: 'Tahun', w: '78px' }, { k: 'title', l: 'Nama Kegiatan', w: 'minmax(240px,3fr)' } ] },
    { id: 'links', target: 'cv', label: 'Proyek & Tautan', fields: [
      { k: 'group', l: 'Kelompok', w: 'minmax(110px,1fr)' }, { k: 'label', l: 'Nama', w: 'minmax(140px,1fr)' },
      { k: 'url', l: 'URL', w: 'minmax(170px,2fr)', url: true }, { k: 'note', l: 'Keterangan', w: 'minmax(120px,1fr)' },
      { k: 'lock', l: 'Gembok', w: '76px', type: 'check' } ] }
  ];

  /* ---------------- Baris ---------------- */

  function cols(sec) { return sec.fields.map(function (f) { return f.w; }).join(' ') + ' 96px'; }

  function addRow(sec, data, atTop) {
    data = data || {};
    var wrap = $('rows-' + sec.id);
    var row = el('div', 'row-grid');
    row.style.gridTemplateColumns = cols(sec);

    sec.fields.forEach(function (f) {
      if (f.type === 'check') {
        var box = el('div');
        box.style.cssText = 'display:flex;align-items:center;height:28px';
        var cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.className = 'f-' + f.k;
        cb.title = f.l;
        cb.style.cssText = 'width:auto;box-shadow:none;padding:0';
        cb.checked = !!data[f.k];
        box.appendChild(cb);
        row.appendChild(box);
      } else {
        var inp = document.createElement('input');
        inp.type = 'text';
        inp.className = 'f-' + f.k;
        inp.placeholder = f.l;
        inp.setAttribute('aria-label', f.l);
        inp.value = data[f.k] == null ? '' : data[f.k];
        row.appendChild(inp);
      }
    });

    var act = el('div', 'row-act');
    var up = el('button', 'ico-btn', '▲'); up.type = 'button'; up.title = 'Naikkan';
    var dn = el('button', 'ico-btn', '▼'); dn.type = 'button'; dn.title = 'Turunkan';
    var del = el('button', 'ico-btn del', '✕'); del.type = 'button'; del.title = 'Hapus baris';

    up.addEventListener('click', function () {
      var prev = row.previousElementSibling;
      if (prev) { wrap.insertBefore(row, prev); touch(); }
    });
    dn.addEventListener('click', function () {
      var next = row.nextElementSibling;
      if (next) { wrap.insertBefore(next, row); touch(); }
    });
    del.addEventListener('click', function () {
      wrap.removeChild(row);
      updateCount(sec);
      touch();
      status('Baris dihapus dari ' + sec.label + '. Belum tersimpan.');
    });
    act.appendChild(up); act.appendChild(dn); act.appendChild(del);
    row.appendChild(act);

    if (atTop && wrap.firstChild) { wrap.insertBefore(row, wrap.firstChild); } else { wrap.appendChild(row); }
    updateCount(sec);
    return row;
  }

  function updateCount(sec) {
    var c = $('count-' + sec.id);
    if (c) { c.textContent = $$('#rows-' + sec.id + ' .row-grid').length + ' baris'; }
  }

  function collect(sec) {
    return $$('#rows-' + sec.id + ' .row-grid').map(function (row) {
      var o = {};
      var any = false;
      sec.fields.forEach(function (f) {
        if (f.type === 'check') {
          o[f.k] = row.querySelector('.f-' + f.k).checked;
        } else {
          var v = row.querySelector('.f-' + f.k).value.trim();
          o[f.k] = v;
          if (v) { any = true; }
        }
      });
      return any ? o : null;
    }).filter(Boolean);
  }

  function buildSections() {
    var host = $('sections');
    host.innerHTML = '';
    SECTIONS.forEach(function (sec) {
      var fs = el('fieldset');
      fs.id = 'sec-' + sec.id;
      fs.appendChild(el('legend', null, sec.label.replace(/&/g, '&amp;') + ' <span class="gray" id="count-' + sec.id + '"></span>'));

      var head = el('div', 'rowhead');
      head.style.gridTemplateColumns = cols(sec);
      sec.fields.forEach(function (f) { head.appendChild(el('div', null, f.l)); });
      head.appendChild(el('div', null, '&nbsp;'));
      fs.appendChild(head);

      var rows = el('div');
      rows.id = 'rows-' + sec.id;
      fs.appendChild(rows);

      var bar = el('div', 'btnrow');
      var add = el('button', 'small', '+ Tambah baris');
      add.type = 'button';
      add.addEventListener('click', function () {
        var d = {};
        if (sec.defYear) { d.year = String(new Date().getFullYear()); }
        var r = addRow(sec, d, true);
        var target = r.querySelector('.f-title, .f-event, .f-label, .f-org, .f-school') || r.querySelector('input[type=text]');
        if (target) { target.focus(); }
        touch();
        status('Baris baru ditambahkan di bagian atas ' + sec.label + '. Belum tersimpan.');
      });
      bar.appendChild(add);
      fs.appendChild(bar);

      host.appendChild(fs);
    });
  }

  /* ---------------- Data <-> formulir ---------------- */

  function v(id) { return $(id).value.trim(); }

  function buildProfile() {
    return {
      name: v('f-name'), title: v('f-title'), bio: v('f-bio'), email: v('f-email'),
      interests: v('f-interests').split(',').map(function (s) { return s.trim(); }).filter(Boolean),
      scholar: v('f-scholar'), linktree: v('f-linktree')
    };
  }

  function pretty(o) { return JSON.stringify(o, null, 2) + '\n'; }

  function serializeAll() {
    var cv = {};
    var pubs = [];
    SECTIONS.forEach(function (sec) {
      var rows = collect(sec);
      if (sec.target === 'pubs') { pubs = rows; } else { cv[sec.id] = rows; }
    });
    return { profile: pretty(buildProfile()), pubs: pretty(pubs), cv: pretty(cv) };
  }

  function populate(p, pubs, cv) {
    p = p || {}; pubs = pubs || []; cv = cv || {};
    $('f-name').value = p.name || '';
    $('f-title').value = p.title || '';
    $('f-bio').value = p.bio || '';
    $('f-email').value = p.email || '';
    $('f-interests').value = (p.interests || []).join(', ');
    $('f-scholar').value = p.scholar || '';
    $('f-linktree').value = p.linktree || '';

    SECTIONS.forEach(function (sec) {
      $('rows-' + sec.id).innerHTML = '';
      var rows = sec.target === 'pubs' ? pubs : (cv[sec.id] || []);
      rows.forEach(function (r) { addRow(sec, r); });
      updateCount(sec);
    });
  }

  /* ---------------- Perubahan & simpan ---------------- */

  var touchTimer = null;
  function touch() {
    clearTimeout(touchTimer);
    touchTimer = setTimeout(refreshSavebar, 120);
  }

  function changedKeys() {
    if (!snap) { return []; }
    var cur = serializeAll();
    return FILES.filter(function (f) { return cur[f.k] !== snap[f.k]; });
  }

  function refreshSavebar() {
    dirty = changedKeys().length > 0;
    var m = $('save-msg');
    m.textContent = dirty ? 'Ada perubahan yang belum disimpan.' : 'Belum ada perubahan.';
    m.className = 'msg' + (dirty ? ' dirty' : '');
  }

  function validate() {
    var re = /^https?:\/\//i;
    var p = buildProfile();
    if (p.scholar && !re.test(p.scholar)) { return 'Profil: tautan Google Scholar harus diawali http:// atau https://'; }
    if (p.linktree && !re.test(p.linktree)) { return 'Profil: tautan Linktree harus diawali http:// atau https://'; }
    for (var i = 0; i < SECTIONS.length; i++) {
      var sec = SECTIONS[i];
      var rows = $$('#rows-' + sec.id + ' .row-grid');
      for (var j = 0; j < rows.length; j++) {
        for (var k = 0; k < sec.fields.length; k++) {
          var f = sec.fields[k];
          if (!f.url) { continue; }
          var val = rows[j].querySelector('.f-' + f.k).value.trim();
          if (val && !re.test(val)) {
            return sec.label + ', baris ' + (j + 1) + ': tautan harus diawali http:// atau https://';
          }
        }
      }
    }
    return '';
  }

  function setBusy(b) {
    busy = b;
    $('btn-save').disabled = b;
    $('btn-save').innerHTML = b ? 'Menyimpan…' : '<b>Simpan ke situs</b>';
  }

  function save() {
    if (busy || !snap) { return; }
    var problem = validate();
    if (problem) { status(problem); alert(problem); return; }

    var cur = serializeAll();
    var changed = FILES.filter(function (f) { return cur[f.k] !== snap[f.k]; });
    if (!changed.length) { status('Tidak ada perubahan untuk disimpan.'); return; }

    setBusy(true);
    status('Menyimpan ke GitHub…');
    var base = '/repos/' + OWNER + '/' + REPO;
    var headSha;

    gh(base + '/git/ref/heads/' + encodeURIComponent(branch)).then(function (ref) {
      headSha = ref.object.sha;
      return gh(base + '/git/commits/' + headSha);
    }).then(function (commit) {
      return gh(base + '/git/trees', 'POST', {
        base_tree: commit.tree.sha,
        tree: changed.map(function (f) {
          return { path: f.path, mode: '100644', type: 'blob', content: cur[f.k] };
        })
      });
    }).then(function (tree) {
      var names = changed.map(function (f) { return f.path.replace('data/', ''); }).join(', ');
      return gh(base + '/git/commits', 'POST', {
        message: 'Panel Admin: perbarui ' + names,
        tree: tree.sha,
        parents: [headSha]
      });
    }).then(function (commit) {
      return gh(base + '/git/refs/heads/' + encodeURIComponent(branch), 'PATCH', { sha: commit.sha });
    }).then(function () {
      snap = cur;
      setBusy(false);
      refreshSavebar();
      $('save-msg').textContent = 'Tersimpan. Situs akan menampilkan perubahan sekitar satu menit lagi.';
      status('Tersimpan di GitHub (' + changed.length + ' berkas).');
    }).catch(function (e) {
      setBusy(false);
      status('Gagal menyimpan: ' + e.message);
      alert('Gagal menyimpan: ' + e.message);
    });
  }

  /* ---------------- Cadangan ---------------- */

  function download(name, text) {
    var url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    var a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function backup() {
    var cur = serializeAll();
    FILES.forEach(function (f, i) {
      setTimeout(function () { download(f.path.replace('data/', ''), cur[f.k]); }, i * 350);
    });
    status('Mengunduh cadangan ketiga berkas JSON.');
  }

  /* ---------------- Menu & aksi ---------------- */

  function closeMenus() {
    $$('.menu').forEach(function (m) { m.classList.remove('open'); });
    $('startmenu').classList.remove('open');
  }

  function setupMenus() {
    $$('.menu').forEach(function (m) {
      m.querySelector('button').addEventListener('click', function (e) {
        e.stopPropagation();
        var was = m.classList.contains('open');
        closeMenus();
        if (!was) { m.classList.add('open'); }
      });
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.menu') && !e.target.closest('#startmenu') && e.target.id !== 'startbtn') { closeMenus(); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeMenus(); $('infodlg').classList.remove('open'); }
    });

    [$('menu-goto'), $('startlist')].forEach(function (ul) {
      if (!ul) { return; }
      ul.innerHTML = '';
      var items = [{ id: 'profil', l: 'Profil' }]
        .concat(SECTIONS.map(function (s) { return { id: 'sec-' + s.id, l: s.label }; }))
        .concat([{ id: 'savebar', l: 'Simpan' }]);
      items.forEach(function (it) {
        var li = el('li');
        var b = el('button', null, it.l.replace(/&/g, '&amp;'));
        b.type = 'button';
        b.addEventListener('click', function () {
          closeMenus();
          var t = $(it.id);
          if (t) { t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        });
        li.appendChild(b);
        ul.appendChild(li);
      });
      if (ul.id === 'startlist') {
        ul.appendChild(el('li', 'sep'));
        var li2 = el('li');
        li2.innerHTML = '<a href="index.html">Kembali ke situs</a>';
        ul.appendChild(li2);
      }
    });
  }

  var zoomLevel = 0;
  function zoom(d) {
    zoomLevel = d === 0 ? 0 : Math.max(-2, Math.min(4, zoomLevel + d));
    document.documentElement.style.setProperty('--zoom', (16 + zoomLevel * 1.5) + 'px');
  }

  function leave(url) {
    if (dirty && !confirm('Ada perubahan yang belum disimpan. Tetap keluar dari halaman ini?')) { return; }
    window.removeEventListener('beforeunload', warnUnload);
    location.href = url;
  }

  function logout() {
    if (dirty && !confirm('Ada perubahan yang belum disimpan. Tetap keluar?')) { return; }
    storeClear();
    window.removeEventListener('beforeunload', warnUnload);
    location.reload();
  }

  var ACTIONS = {
    home: function () { leave('index.html'); },
    close: function () { leave('index.html'); },
    reload: function () {
      if (dirty && !confirm('Ada perubahan yang belum disimpan. Muat ulang dan buang perubahan?')) { return; }
      window.removeEventListener('beforeunload', warnUnload);
      location.reload();
    },
    save: save,
    backup: backup,
    logout: logout,
    maxi: function () { zoom(1); },
    mini: function () { zoom(-1); },
    'zoom-reset': function () { zoom(0); },
    'gate-ok': submitGate,
    'info-close': function () { $('infodlg').classList.remove('open'); },
    about: function () {
      $('info-title').textContent = 'Cara masuk & menyimpan';
      $('info-body').innerHTML =
        '<p><b>Masuk.</b> Halaman ini memakai token akun GitHub, bukan kata sandi di dalam situs. ' +
        'Buat sekali di GitHub (Settings &rsaquo; Developer settings &rsaquo; Fine-grained tokens): pilih repositori ' +
        '<code>anandabintangp.github.io</code> dan beri izin <b>Contents: Read and write</b>.</p>' +
        '<p><b>Menyimpan.</b> Tombol <b>Simpan ke situs</b> membuat satu commit di repositori. ' +
        'GitHub Pages memperbarui situs sekitar satu menit kemudian.</p>' +
        '<p class="small gray">Token disimpan hanya di peramban ini (dihapus saat <b>Keluar</b>). ' +
        'Jangan memasukkannya di komputer umum tanpa mencabut tanda &ldquo;Ingat di peramban ini&rdquo;.</p>';
      $('infodlg').classList.add('open');
    }
  };

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]');
    if (!t) { return; }
    var fn = ACTIONS[t.dataset.act];
    if (fn) { e.preventDefault(); closeMenus(); fn(); }
  });

  /* ---------------- Masuk ---------------- */

  function gateMsg(m) { $('gate-err').textContent = m || ''; }

  function unlock(name) {
    $('gate').style.display = 'none';
    $('adminapp').style.display = 'block';
    $('who').textContent = name ? 'Masuk sebagai @' + name + '.' : 'Masuk.';
    status('Memuat data…');
    loadData();
  }

  function login(t, remember) {
    token = (t || '').trim();
    if (!token) { gateMsg('Isi token terlebih dahulu.'); return Promise.resolve(); }
    gateMsg('Memeriksa…');
    return gh('/repos/' + OWNER + '/' + REPO).then(function (r) {
      if (!r.permissions || !r.permissions.push) {
        throw new Error('Token ini hanya bisa membaca. Beri izin Contents: Read and write.');
      }
      branch = r.default_branch || 'main';
      storeSet(token, remember);
      return gh('/user').then(function (u) { return u.login || ''; }, function () { return ''; });
    }).then(function (name) {
      gateMsg('');
      $('gate-token').value = '';
      unlock(name);
    }).catch(function (e) {
      token = '';
      if (e.status === 401) { storeClear(); }
      gateMsg(e.message);
      status('Gagal masuk.');
    });
  }

  function submitGate() { login($('gate-token').value, $('gate-remember').checked); }

  /* ---------------- Muat data ---------------- */

  function loadData() {
    var base = '/repos/' + OWNER + '/' + REPO + '/contents/';
    Promise.all(FILES.map(function (f) {
      return ghRaw(base + f.path + '?ref=' + encodeURIComponent(branch)).then(function (txt) {
        return txt == null ? null : JSON.parse(txt);
      });
    })).then(function (res) {
      populate(res[0], res[1], res[2]);
      snap = serializeAll();
      refreshSavebar();
      status('Selesai. Data siap disunting.');
    }).catch(function (e) {
      status('Gagal memuat data: ' + e.message);
      alert('Gagal memuat data: ' + e.message);
    });
  }

  function warnUnload(e) {
    if (dirty) { e.preventDefault(); e.returnValue = ''; return ''; }
  }

  /* ---------------- Mulai ---------------- */

  buildSections();
  setupMenus();

  var y = $('year');
  if (y) { y.textContent = new Date().getFullYear(); }

  function tick() {
    var d = new Date();
    $('clock').textContent = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }
  tick();
  setInterval(tick, 20000);

  $('startbtn').addEventListener('click', function (e) {
    e.stopPropagation();
    var m = $('startmenu');
    var was = m.classList.contains('open');
    closeMenus();
    if (!was) { m.classList.add('open'); }
  });

  $('gate-token').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); submitGate(); }
  });
  $('infodlg').addEventListener('click', function (e) {
    if (e.target === $('infodlg')) { $('infodlg').classList.remove('open'); }
  });

  $('adminapp').addEventListener('input', touch);
  $('adminapp').addEventListener('change', touch);
  window.addEventListener('beforeunload', warnUnload);

  var saved = storeGet();
  if (saved) {
    gateMsg('Masuk otomatis…');
    login(saved.t, saved.remember);
  } else {
    setTimeout(function () { $('gate-token').focus(); }, 60);
  }
})();

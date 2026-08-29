/* =========================================================
   ABP Academic — editor.js (Panel Admin)
   ========================================================= */

(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function el(t, c, h) { var n = document.createElement(t); if (c) { n.className = c; } if (h != null) { n.innerHTML = h; } return n; }
  function status(m) { var e = $('status'); if (e) { e.textContent = m; } }

  function getJSON(url, fb) {
    if (typeof fetch !== 'function') { return Promise.resolve(fb); }
    return fetch(url).then(function (r) { if (!r.ok) { throw new Error(r.status); } return r.json(); })
      .catch(function () { return fb; });
  }

  /* ---------------- Kunci ---------------- */

  var PW_SHA = '0714665e2b862ebc0c7d9927a8ecdf49bf126dfc145b2915b2568cb826b0d4c4';
  var PW_DJB = 445639743;

  function djb2(s) { var h = 5381; for (var i = 0; i < s.length; i++) { h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; } return h; }
  function sha256hex(s) {
    if (!(window.crypto && crypto.subtle && crypto.subtle.digest)) { return Promise.resolve(null); }
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)).then(function (b) {
      return Array.prototype.map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
    }).catch(function () { return null; });
  }
  function checkPassword(pw) {
    return sha256hex(pw).then(function (hex) { return hex ? hex === PW_SHA : djb2(pw) === PW_DJB; });
  }

  /* ---------------- Skema bagian ---------------- */

  var SECTIONS = [
    { id: 'publications', target: 'pubs', label: 'Publikasi Ilmiah — data/publications.json', fields: [
      { k: 'year', l: 'Tahun', w: '78px' }, { k: 'title', l: 'Judul', w: 'minmax(180px,2fr)' },
      { k: 'journal', l: 'Jurnal', w: 'minmax(120px,1fr)' }, { k: 'rank', l: 'Sinta', w: '78px' },
      { k: 'url', l: 'Tautan', w: 'minmax(140px,1fr)' } ] },
    { id: 'education', target: 'cv', label: 'Pendidikan', fields: [
      { k: 'level', l: 'Jenjang', w: '80px' }, { k: 'school', l: 'Perguruan Tinggi', w: 'minmax(140px,1fr)' },
      { k: 'field', l: 'Bidang Ilmu', w: 'minmax(120px,1fr)' }, { k: 'year', l: 'Lulus', w: '80px' } ] },
    { id: 'work', target: 'cv', label: 'Pekerjaan', fields: [
      { k: 'org', l: 'Organisasi', w: 'minmax(130px,1fr)' }, { k: 'role', l: 'Posisi', w: 'minmax(180px,2fr)' },
      { k: 'year', l: 'Periode', w: 'minmax(110px,1fr)' } ] },
    { id: 'popular', target: 'cv', label: 'Tulisan Populer', fields: [
      { k: 'year', l: 'Tahun', w: '78px' }, { k: 'title', l: 'Judul', w: 'minmax(180px,2fr)' },
      { k: 'media', l: 'Media', w: 'minmax(110px,1fr)' }, { k: 'url', l: 'Tautan', w: 'minmax(140px,1fr)' } ] },
    { id: 'seminars', target: 'cv', label: 'Seminar & Pembicara', fields: [
      { k: 'year', l: 'Tahun', w: '78px' }, { k: 'event', l: 'Kegiatan', w: 'minmax(160px,2fr)' },
      { k: 'host', l: 'Penyelenggara', w: 'minmax(150px,2fr)' }, { k: 'role', l: 'Status', w: '110px' } ] },
    { id: 'certifications', target: 'cv', label: 'Sertifikasi', fields: [
      { k: 'year', l: 'Tahun', w: '78px' }, { k: 'title', l: 'Nama Sertifikasi', w: 'minmax(200px,2fr)' },
      { k: 'issuer', l: 'Penyelenggara', w: 'minmax(140px,1fr)' } ] },
    { id: 'service', target: 'cv', label: 'Pengabdian Masyarakat', fields: [
      { k: 'year', l: 'Tahun', w: '78px' }, { k: 'title', l: 'Nama Kegiatan', w: 'minmax(240px,3fr)' } ] },
    { id: 'links', target: 'cv', label: 'Proyek & Tautan', fields: [
      { k: 'group', l: 'Kelompok', w: 'minmax(110px,1fr)' }, { k: 'label', l: 'Nama', w: 'minmax(140px,1fr)' },
      { k: 'url', l: 'URL', w: 'minmax(170px,2fr)' }, { k: 'note', l: 'Keterangan', w: 'minmax(120px,1fr)' },
      { k: 'lock', l: 'Gembok', w: '76px', type: 'check' } ] }
  ];

  /* ---------------- Baris ---------------- */

  function cols(sec) { return sec.fields.map(function (f) { return f.w; }).join(' ') + ' 34px'; }

  function addRow(sec, data) {
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
        cb.style.cssText = 'width:auto;box-shadow:none;padding:0';
        cb.checked = !!data[f.k];
        box.appendChild(cb);
        row.appendChild(box);
      } else {
        var inp = document.createElement('input');
        inp.type = 'text';
        inp.className = 'f-' + f.k;
        inp.placeholder = f.l;
        inp.value = data[f.k] == null ? '' : data[f.k];
        row.appendChild(inp);
      }
    });

    var del = el('button', 'del', '✕');
    del.type = 'button';
    del.title = 'Hapus baris';
    del.addEventListener('click', function () {
      wrap.removeChild(row);
      updateCount(sec);
      status('Baris dihapus dari ' + sec.label + '.');
    });
    row.appendChild(del);

    wrap.appendChild(row);
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
      var lg = el('legend', null, sec.label + ' <span class="gray" id="count-' + sec.id + '"></span>');
      fs.appendChild(lg);

      var head = el('div', 'rowhead');
      head.style.gridTemplateColumns = cols(sec);
      sec.fields.forEach(function (f) { head.appendChild(el('div', null, f.l)); });
      head.appendChild(el('div', null, '&nbsp;'));
      fs.appendChild(head);

      fs.appendChild(el('div', null, '')).id = 'rows-' + sec.id;

      var bar = el('div', 'btnrow');
      var add = el('button', 'small', '+ Tambah baris');
      add.type = 'button';
      add.addEventListener('click', function () {
        var r = addRow(sec);
        var first = r.querySelector('input[type=text]');
        if (first) { first.focus(); }
        status('Baris ditambahkan ke ' + sec.label + '.');
      });
      bar.appendChild(add);
      fs.appendChild(bar);

      host.appendChild(fs);
    });
  }

  /* ---------------- Hasil ---------------- */

  function buildProfile() {
    var v = function (id) { return $(id).value.trim(); };
    return {
      name: v('f-name'), title: v('f-title'), bio: v('f-bio'),
      email: v('f-email'), gender: v('f-gender'), birth: v('f-birth'),
      phone: v('f-phone'),
      interests: v('f-interests').split(',').map(function (s) { return s.trim(); }).filter(Boolean),
      scholar: v('f-scholar'), linktree: v('f-linktree')
    };
  }

  function generate() {
    var cv = {};
    var pubs = [];
    SECTIONS.forEach(function (sec) {
      var rows = collect(sec);
      if (sec.target === 'pubs') { pubs = rows; } else { cv[sec.id] = rows; }
    });
    $('out-profile').value = JSON.stringify(buildProfile(), null, 2);
    $('out-pubs').value = JSON.stringify(pubs, null, 2);
    $('out-cv').value = JSON.stringify(cv, null, 2);
    status('JSON dibuat. Salin atau unduh, lalu timpa berkas di folder data/ dan commit.');
  }

  function copyFrom(id) {
    var ta = $(id);
    if (!ta.value) { generate(); }
    ta.removeAttribute('readonly');
    ta.select();
    ta.setSelectionRange(0, ta.value.length);
    var done = function () { status('Tersalin.'); ta.setAttribute('readonly', 'readonly'); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(ta.value).then(done, function () {
        try { document.execCommand('copy'); done(); } catch (e) { status('Teks sudah diseleksi, tekan Ctrl+C.'); }
      });
    } else {
      try { document.execCommand('copy'); done(); } catch (e) { status('Teks sudah diseleksi, tekan Ctrl+C.'); }
    }
  }

  function download(id, filename) {
    var ta = $(id);
    if (!ta.value) { generate(); }
    var url = URL.createObjectURL(new Blob([ta.value], { type: 'application/json' }));
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    status('Mengunduh ' + filename);
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

    var lists = [$('menu-goto'), $('startlist')];
    lists.forEach(function (ul) {
      if (!ul) { return; }
      ul.innerHTML = '';
      var items = [{ id: 'profil', l: 'Profil' }]
        .concat(SECTIONS.map(function (s) { return { id: 'sec-' + s.id, l: s.label.split(' — ')[0] }; }))
        .concat([{ id: 'hasil', l: 'Hasil JSON' }]);
      items.forEach(function (it) {
        var li = el('li');
        var b = el('button', null, it.l);
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

  var ACTIONS = {
    back: function () { history.back(); },
    forward: function () { history.forward(); },
    home: function () { location.href = 'index.html'; },
    close: function () { location.href = 'index.html'; },
    reload: function () { location.reload(); },
    print: function () { window.print(); },
    gen: generate,
    'dl-all': function () {
      generate();
      download('out-profile', 'profile.json');
      setTimeout(function () { download('out-pubs', 'publications.json'); }, 350);
      setTimeout(function () { download('out-cv', 'cv.json'); }, 700);
    },
    maxi: function () { zoom(1); },
    mini: function () { zoom(-1); },
    'zoom-reset': function () { zoom(0); },
    'gate-ok': submitGate,
    'info-close': function () { $('infodlg').classList.remove('open'); },
    about: function () {
      $('info-title').textContent = 'Cara menyimpan';
      $('info-body').innerHTML =
        '<p>Panel ini menyunting tiga berkas data:</p>' +
        '<ul class="ball"><li><code>data/profile.json</code></li><li><code>data/publications.json</code></li>' +
        '<li><code>data/cv.json</code></li></ul>' +
        '<p>Setelah menekan <b>Buat semua JSON</b>, salin atau unduh isinya, timpa berkas yang sama di ' +
        'repositori, lalu commit dan push. Halaman depan akan langsung memakai data yang baru.</p>' +
        '<p class="small gray">Kunci di halaman ini hanya menyembunyikan formulir di sisi peramban, bukan ' +
        'pengamanan server. Jangan menaruh data rahasia di berkas JSON.</p>';
      $('infodlg').classList.add('open');
    }
  };

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act],[data-copy],[data-dl]');
    if (!t) { return; }
    if (t.dataset.copy) { e.preventDefault(); copyFrom(t.dataset.copy); return; }
    if (t.dataset.dl) {
      e.preventDefault();
      var p = t.dataset.dl.split('|');
      download(p[0], p[1]);
      return;
    }
    if (ACTIONS[t.dataset.act]) { e.preventDefault(); closeMenus(); ACTIONS[t.dataset.act](); }
  });

  /* ---------------- Gerbang ---------------- */

  function unlock() {
    $('gate').style.display = 'none';
    $('adminapp').style.display = 'block';
    status('Memuat data…');
    loadData();
  }

  function submitGate() {
    var v = $('gate-pw').value;
    $('gate-err').textContent = 'Memeriksa…';
    checkPassword(v).then(function (ok) {
      if (ok) { $('gate-err').textContent = ''; unlock(); }
      else {
        $('gate-err').textContent = 'Kata sandi salah. Coba lagi.';
        $('gate-pw').value = '';
        $('gate-pw').focus();
      }
    });
  }

  /* ---------------- Muat data ---------------- */

  function loadData() {
    Promise.all([
      getJSON('data/profile.json', {}),
      getJSON('data/publications.json', []),
      getJSON('data/cv.json', {})
    ]).then(function (res) {
      var p = res[0] || {}, pubs = res[1] || [], cv = res[2] || {};

      $('f-name').value = p.name || '';
      $('f-title').value = p.title || '';
      $('f-bio').value = p.bio || '';
      $('f-gender').value = p.gender || '';
      $('f-birth').value = p.birth || '';
      $('f-email').value = p.email || '';
      $('f-phone').value = p.phone || '';
      $('f-interests').value = (p.interests || []).join(', ');
      $('f-scholar').value = p.scholar || '';
      $('f-linktree').value = p.linktree || '';

      SECTIONS.forEach(function (sec) {
        var rows = sec.target === 'pubs' ? pubs : (cv[sec.id] || []);
        if (!rows.length) { rows = [{}]; }
        rows.forEach(function (r) { addRow(sec, r); });
      });

      generate();
      status('Selesai. Data siap disunting.');
    });
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

  $('gate-pw').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); submitGate(); }
  });

  $('infodlg').addEventListener('click', function (e) {
    if (e.target === $('infodlg')) { $('infodlg').classList.remove('open'); }
  });

  /* Sudah lolos kunci di halaman depan */
  if (location.hash.indexOf('unlock=') > -1 && location.hash.split('unlock=')[1] === PW_SHA) {
    history.replaceState(null, '', location.pathname);
    unlock();
  } else {
    setTimeout(function () { $('gate-pw').focus(); }, 60);
  }
})();

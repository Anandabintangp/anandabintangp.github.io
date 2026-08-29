/* =========================================================
   ABP Academic - editor.js
   Panel Admin
   ========================================================= */

(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  function status(msg) {
    var el = $('status');
    if (el) { el.textContent = msg; }
  }

  function getJSON(url, fallback) {
    if (typeof fetch !== 'function') { return Promise.resolve(fallback); }
    return fetch(url)
      .then(function (r) {
        if (!r.ok) { throw new Error('HTTP ' + r.status); }
        return r.json();
      })
      .catch(function () { return fallback; });
  }

  /* ---------- Baris publikasi ---------- */
  function addRow(data) {
    data = data || {};
    var wrap = $('pubrows');
    var row = document.createElement('div');
    row.className = 'pubrow';

    var year = document.createElement('input');
    year.type = 'text';
    year.className = 'p-year';
    year.placeholder = '2026';
    year.value = data.year || '';

    var title = document.createElement('input');
    title.type = 'text';
    title.className = 'p-title';
    title.placeholder = 'Judul artikel';
    title.value = data.title || '';

    var journal = document.createElement('input');
    journal.type = 'text';
    journal.className = 'p-journal';
    journal.placeholder = 'Nama jurnal';
    journal.value = data.journal || '';

    var del = document.createElement('button');
    del.type = 'button';
    del.className = 'del';
    del.textContent = 'X';
    del.title = 'Hapus baris ini';
    del.onclick = function () {
      wrap.removeChild(row);
      status('Baris dihapus.');
    };

    row.appendChild(year);
    row.appendChild(title);
    row.appendChild(journal);
    row.appendChild(del);
    wrap.appendChild(row);
    return row;
  }

  /* ---------- Kumpulkan data dari form ---------- */
  function collectProfile() {
    return {
      name: $('name').value.trim(),
      title: $('title').value.trim(),
      bio: $('bio').value.trim(),
      email: $('email').value.trim()
    };
  }

  function collectPubs() {
    var out = [];
    var rows = document.querySelectorAll('#pubrows .pubrow');
    for (var i = 0; i < rows.length; i++) {
      var y = rows[i].querySelector('.p-year').value.trim();
      var t = rows[i].querySelector('.p-title').value.trim();
      var j = rows[i].querySelector('.p-journal').value.trim();
      if (y || t || j) { out.push({ year: y, title: t, journal: j }); }
    }
    return out;
  }

  function generate() {
    $('out-profile').value = JSON.stringify(collectProfile(), null, 2);
    $('out-pubs').value = JSON.stringify(collectPubs(), null, 2);
    status('JSON dibuat. Salin atau unduh, lalu commit ke repositori.');
  }

  /* ---------- Salin & unduh ---------- */
  function copyFrom(id) {
    var ta = $(id);
    if (!ta.value) { generate(); }
    ta.removeAttribute('readonly');
    ta.select();
    ta.setSelectionRange(0, ta.value.length);

    var done = function () {
      status('Tersalin.');
      ta.setAttribute('readonly', 'readonly');
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(ta.value).then(done, function () {
        try { document.execCommand('copy'); done(); }
        catch (e) { status('Teks sudah diseleksi, tekan Ctrl+C.'); }
      });
    } else {
      try { document.execCommand('copy'); done(); }
      catch (e) { status('Teks sudah diseleksi, tekan Ctrl+C.'); }
    }
  }

  function download(id, filename) {
    var ta = $(id);
    if (!ta.value) { generate(); }
    var blob = new Blob([ta.value], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    status('Mengunduh ' + filename);
  }

  /* ---------- Boot ---------- */
  status('Memuat...');

  var y = $('year');
  if (y) { y.textContent = new Date().getFullYear(); }

  $('btn-add').onclick = function () { addRow(); status('Baris ditambahkan.'); };
  $('btn-gen').onclick = generate;
  $('btn-copy-profile').onclick = function () { copyFrom('out-profile'); };
  $('btn-copy-pubs').onclick = function () { copyFrom('out-pubs'); };
  $('btn-dl-profile').onclick = function () { download('out-profile', 'profile.json'); };
  $('btn-dl-pubs').onclick = function () { download('out-pubs', 'publications.json'); };

  Promise.all([
    getJSON('data/profile.json', {
      name: 'Ananda Bintang Purwaramdhona',
      title: 'Lecturer | Researcher | Writer',
      bio: 'Humaniora Digital, Puisi Kontemporer, dan Kajian Budaya',
      email: 'Contact.anandabintang@gmail.com'
    }),
    getJSON('data/publications.json', [])
  ]).then(function (res) {
    var p = res[0] || {};
    $('name').value = p.name || '';
    $('title').value = p.title || '';
    $('bio').value = p.bio || '';
    $('email').value = p.email || '';

    var pubs = res[1] && res[1].length ? res[1] : [{}];
    for (var i = 0; i < pubs.length; i++) { addRow(pubs[i]); }

    generate();
    status('Selesai');
  });

  document.addEventListener('mouseover', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (a && a.getAttribute('href')) { status(a.href); }
  });
})();

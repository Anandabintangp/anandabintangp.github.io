/* =========================================================
   ABP Academic - main.js
   ========================================================= */

(function () {
  'use strict';

  /* Cadangan supaya halaman tetap tampil saat dibuka langsung
     lewat file:// (fetch JSON diblokir browser modern). */
  var FALLBACK_PROFILE = {
    name: 'Ananda Bintang Purwaramdhona',
    title: 'Lecturer | Researcher | Writer',
    bio: 'Humaniora Digital, Puisi Kontemporer, dan Kajian Budaya',
    email: 'Contact.anandabintang@gmail.com'
  };

  var FALLBACK_PUBS = [
    {
      year: '2026',
      title: 'Antara Persona dan Karya: Jejaring Pertarungan Wacana tentang Tere Liye di Platform Media Sosial X',
      journal: 'Indonesian Language Education and Literature Journal'
    },
    {
      year: '2025',
      title: 'Penggunaan analisis korpus melalui aplikasi AntConc dalam penelitian karya sastra',
      journal: 'Diglosia'
    }
  ];

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

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

  /* ---------- Profil ---------- */
  function renderProfile(d) {
    if (!d || typeof d !== 'object') { d = FALLBACK_PROFILE; }

    var tagline = d.title ? String(d.title).replace(/\s*\|\s*/g, ' · ') : '';

    if ($('site-title') && d.name) { $('site-title').textContent = d.name; }
    if ($('site-tagline') && tagline) { $('site-tagline').textContent = tagline; }
    if ($('bio')) { $('bio').textContent = d.bio || ''; }

    if ($('email') && d.email) {
      $('email').innerHTML = '<a href="mailto:' + esc(d.email) + '">' + esc(d.email) + '</a>';
    }

    if ($('marquee-text')) {
      $('marquee-text').textContent =
        [d.name, tagline, d.bio].filter(Boolean).join('   —   ');
    }

    if (d.name) {
      document.title = d.name;
      var tb = document.querySelector('.tb-text');
      if (tb) { tb.textContent = 'ABP Academic — [' + d.name + ']'; }
    }
  }

  /* ---------- Publikasi ---------- */
  function renderPublications(list) {
    var box = $('pub');
    if (!box) { return; }
    if (!list || !list.length) { list = FALLBACK_PUBS; }

    var rows = list.map(function (x, i) {
      var isNew = i === 0 ? ' <span class="newtag blink">BARU</span>' : '';
      return '<tr>' +
        '<td class="yr">' + esc(x.year) + '</td>' +
        '<td><b>' + esc(x.title) + '</b>' + isNew +
        '<br><span class="jr">' + esc(x.journal) + '</span></td>' +
        '</tr>';
    }).join('');

    box.innerHTML =
      '<table class="pubs">' +
        '<tr><th>TAHUN</th><th>JUDUL &amp; JURNAL</th></tr>' +
        rows +
      '</table>';

    if ($('pub-count')) { $('pub-count').textContent = list.length; }
  }

  /* ---------- Penghitung pengunjung ---------- */
  function renderCounter() {
    var box = $('counter');
    if (!box) { return; }
    var days = Math.floor((Date.now() - Date.UTC(2000, 0, 1)) / 86400000);
    var hits = 1024 + days * 3;
    var digits = String(hits).slice(-6);
    while (digits.length < 6) { digits = '0' + digits; }

    box.innerHTML = '';
    for (var i = 0; i < digits.length; i++) {
      var b = document.createElement('b');
      b.textContent = digits.charAt(i);
      box.appendChild(b);
    }
  }

  /* ---------- Tanggal ---------- */
  function renderDates() {
    var lm = $('lastmod');
    if (lm) {
      var d = new Date(document.lastModified);
      lm.textContent = isNaN(d.getTime())
        ? '—'
        : (('0' + d.getDate()).slice(-2) + '-' +
           ('0' + (d.getMonth() + 1)).slice(-2) + '-' + d.getFullYear());
    }
    var y = $('year');
    if (y) { y.textContent = new Date().getFullYear(); }
  }

  /* ---------- Mulai ---------- */
  status('Menghubungkan...');

  renderCounter();
  renderDates();

  Promise.all([
    getJSON('data/profile.json', FALLBACK_PROFILE),
    getJSON('data/publications.json', FALLBACK_PUBS)
  ]).then(function (res) {
    renderProfile(res[0]);
    renderPublications(res[1]);
    setTimeout(function () { status('Selesai'); }, 300);
  });

  /* Baris status ikut menampilkan alamat pranala saat disorot */
  document.addEventListener('mouseover', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (a && a.getAttribute('href')) { status(a.href); }
  });
  document.addEventListener('mouseout', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (a) { status('Selesai'); }
  });
})();

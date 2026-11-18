/* =========================================================
   app.js — router (hash), sidebar, render, service worker
   ========================================================= */
(function (w, d) {
  'use strict';
  var K = w.KK, E = K.esc;

  K.NAV = [
    { g: 'Utama' },
    { id: 'dashboard', t: 'Dashboard', i: 'home' },
    { id: 'transaksi', t: 'Transaksi', i: 'list' },
    { id: 'anggaran', t: 'Anggaran', i: 'pie' },
    { id: 'laporan', t: 'Laporan', i: 'chart' },
    { g: 'Kebutuhan Kost' },
    { id: 'tagihan', t: 'Tagihan Kost', i: 'receipt' },
    { id: 'belanja', t: 'Daftar Belanja', i: 'cart' },
    { id: 'tabungan', t: 'Tabungan', i: 'target' },
    { id: 'hutang', t: 'Hutang & Patungan', i: 'users' },
    { g: 'Personal' },
    { id: 'tema', t: 'Tema & Tampilan', i: 'palette' },
    { id: 'profil', t: 'Profil Saya', i: 'user' },
    { id: 'pengaturan', t: 'Pengaturan', i: 'settings' }
  ];
  var ORDER = K.NAV.filter(function (n) { return n.id; }).map(function (n) { return n.id; });
  K.route = null;

  /* ---------- bangun navigasi ---------- */
  function bangunNav() {
    var h = '<i class="nav-ind" id="navInd"></i>';
    K.NAV.forEach(function (n) {
      if (n.g) h += '<div class="nav-title">' + E(n.g) + '</div>';
      else h += '<a href="#/' + n.id + '" data-r="' + n.id + '">' + K.ik(n.i) + '<span>' + E(n.t) + '</span></a>';
    });
    K.$('#nav').innerHTML = h;
    K.$('#bottomnav').innerHTML =
      '<a class="bn" href="#/dashboard" data-r="dashboard">' + K.ik('home') + '<span>Beranda</span></a>' +
      '<a class="bn" href="#/transaksi" data-r="transaksi">' + K.ik('list') + '<span>Transaksi</span></a><span class="bn-gap"></span>' +
      '<a class="bn" href="#/laporan" data-r="laporan">' + K.ik('chart') + '<span>Laporan</span></a>' +
      '<button class="bn" type="button" data-act="menu">' + K.ik('dots4') + '<span>Menu</span></button>';
    K.$('#menuBtn').innerHTML = K.ik('dots4');
  }
  function geserIndikator(anim) {
    var a = K.$('#nav a.on'), ind = K.$('#navInd'); if (!a || !ind) return;
    if (!anim) ind.style.transition = 'none';
    ind.style.height = a.offsetHeight + 'px';
    ind.style.transform = 'translateY(' + a.offsetTop + 'px)';
    if (!anim) { void ind.offsetWidth; ind.style.transition = ''; }
  }
  K.segarkanProfil = function () {
    var p = K.state.profil;
    K.$('#topAvatar').innerHTML = K.avatar();
    K.$('#sideMe').innerHTML = '<span class="av">' + K.avatar() + '</span><span class="me-t"><b>' + E(p.nama || 'Anak Kost') + '</b><small>' + E(p.kost || p.kampus || 'Atur profilmu') + '</small></span>';
    ikonMode();
  };
  function ikonMode() { K.$('#modeBtn').innerHTML = K.ik(K.tema.gelap() ? 'sun' : 'moon'); K.$('#modeBtn').setAttribute('aria-label', K.tema.gelap() ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'); }

  /* ---------- sidebar (mobile) ---------- */
  function sidebar(buka) {
    K.$('#sidebar').classList.toggle('open', buka);
    K.$('#sideScrim').classList.toggle('show', buka);
    d.body.classList.toggle('noscroll', buka);
  }
  K.aksi['menu'] = function () { sidebar(!K.$('#sidebar').classList.contains('open')); };
  K.aksi['mode'] = function () { K.tema.set({ mode: K.tema.gelap() ? 'terang' : 'gelap' }); ikonMode(); var s = K.$('.seg[data-seg="mode"]'); if (s) { K.$$('button', s).forEach(function (b) { b.classList.toggle('on', b.dataset.v === K.state.tema.mode); }); s._place(true); } };

  /* ---------- render halaman ---------- */
  K.render = function (o) {
    o = o || {};
    var h = K.halaman[K.route], v = K.$('#view'), y = w.pageYOffset, html;
    try { html = h.render(); }
    catch (err) { console.error(err); html = '<div class="card empty"><div class="big">😵</div><h4>Halaman gagal dimuat</h4><p>Coba muat ulang aplikasi.</p></div>'; }
    v.innerHTML = html;
    v.classList.toggle('soft', !!o.soft);
    if (!o.soft) {
      v.classList.remove('enter-r', 'enter-l', 'enter-up'); void v.offsetWidth;
      v.classList.add('enter-' + (o.dir || 'up')); w.scrollTo(0, 0);
    } else w.scrollTo(0, y);
    K.$$('.reveal', v).forEach(function (e, i) { e.style.setProperty('--i', Math.min(i, 14)); });
    K.initSegs(v); K.countUp(v, !!o.soft);
    if (h.bind) { try { h.bind(v); } catch (e2) { console.error(e2); } }
    if (!o.soft || o.judul) {
      var t = K.$('#pageTitle'), s = K.$('#pageSub');
      t.textContent = h.judul; s.textContent = h.sub ? h.sub() : '';
      t.classList.remove('swap'); void t.offsetWidth; t.classList.add('swap');
      d.title = h.judul + ' · KostKu';
    }
    K.$$('[data-r]').forEach(function (a) { a.classList.toggle('on', a.dataset.r === K.route); });
    d.body.classList.toggle('fab-off', h.fab === false);
    geserIndikator(!!o.anim);
    if (K.flash) {
      var f = K.$('[data-id="' + K.flash + '"]', v); K.flash = null;
      if (f) { f.classList.add('flash'); setTimeout(function () { f.classList.remove('flash'); }, 1600); }
    }
  };
  function url() { var r = (w.location.hash || '').replace(/^#\/?/, '').split('?')[0]; return K.halaman[r] ? r : 'dashboard'; }
  function pindah() {
    var r = url(), prev = K.route; K.route = r; sidebar(false);
    K.render({ dir: prev ? (ORDER.indexOf(r) >= ORDER.indexOf(prev) ? 'r' : 'l') : 'up', anim: !!prev, judul: true });
  }

  /* ---------- delegasi klik ---------- */
  d.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]');
    if (!t) return;
    var f = K.aksi[t.dataset.act];
    if (f) f(t, e);
  });
  d.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[data-act][role="button"]')) { e.preventDefault(); e.target.click(); }
    if (e.key === 'Escape') {
      if (K.modals.length) K.modals[K.modals.length - 1].close();
      else if (K.$('#sidebar').classList.contains('open')) sidebar(false);
    }
  });

  /* ---------- status online ---------- */
  function net() {
    var on = navigator.onLine, n = K.$('#net');
    n.classList.toggle('off', !on); n.querySelector('span').textContent = on ? 'Online' : 'Offline';
  }
  w.addEventListener('online', function () { net(); K.toast('Kembali online', 'ok'); });
  w.addEventListener('offline', function () { net(); K.toast('Kamu offline — aplikasi tetap bisa dipakai', 'info', { ms: 4200 }); });
  w.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); K.promptInstal = e; var b = K.$('#btnInstal'); if (b) { b.textContent = 'Instal'; b.classList.replace('btn-ghost', 'btn-primary'); } });
  w.addEventListener('appinstalled', function () { K.promptInstal = null; K.toast('Aplikasi terpasang 🎉', 'ok'); });
  w.addEventListener('resize', function () { geserIndikator(false); });

  /* ---------- service worker (offline) ---------- */
  function daftarSW() {
    if (!('serviceWorker' in navigator)) { K.swStatus = 'tidak'; return; }
    if (!(location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) { K.swStatus = 'tidak'; return; }
    var punyaKontrol = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('sw.js').then(function (reg) {
      K.swStatus = punyaKontrol ? 'siap' : 'mem';
      if (K.route === 'pengaturan') K.render({ soft: true });
      navigator.serviceWorker.ready.then(function () {
        var baru = K.swStatus !== 'siap'; K.swStatus = 'siap';
        var el = K.$('#swTxt'); if (el) el.textContent = 'Siap dipakai offline ✅';
        if (baru) K.toast('Siap dipakai offline ✅', 'ok');
      });
      reg.addEventListener('updatefound', function () {
        var nw = reg.installing;
        if (nw) nw.addEventListener('statechange', function () {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) K.toast('Versi baru tersedia', 'info', { aksi: 'Muat ulang', ms: 9000, fn: function () { location.reload(); } });
        });
      });
    }).catch(function () { K.swStatus = 'tidak'; });
  }

  /* ---------- mulai ---------- */
  function mulai() {
    bangunNav(); K.tema.applyBg(); K.segarkanProfil(); net();
    K.$('#sideScrim').addEventListener('click', function () { sidebar(false); });
    w.addEventListener('hashchange', pindah);
    pindah();
    daftarSW();
    if (!K.state.siap) setTimeout(K.onboarding, 500);
    var ld = K.$('#loader'); if (ld) { ld.classList.add('hide'); setTimeout(function () { ld.remove(); }, 600); }
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', mulai); else mulai();
})(window, document);

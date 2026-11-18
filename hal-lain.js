/* =========================================================
   hal-lain.js — Tema & Tampilan, Profil, Pengaturan, Onboarding
   ========================================================= */
(function (w, d) {
  'use strict';
  var K = w.KK, E = K.esc, T = K.tema;

  /* =========================================================
     TEMA & TAMPILAN
     ========================================================= */
  function tandai(root) {
    var t = K.state.tema;
    K.$$('.sw', root).forEach(function (e) { e.classList.toggle('on', e.dataset.id === t.preset); });
    K.$$('.bgt', root).forEach(function (e) { e.classList.toggle('on', e.dataset.id === t.bg); });
  }
  K.halaman.tema = {
    judul: 'Tema & Tampilan', sub: function () { return 'Ubah warna & latar sesuka hati'; }, fab: false,
    render: function () {
      var t = K.state.tema;
      var sw = T.PRESET.map(function (p) {
        return '<button class="sw rip' + (t.preset === p.id ? ' on' : '') + '" data-act="tema-preset" data-id="' + p.id + '" style="--p:' + p.primary + ';--a:' + p.accent + ';--k:' + p.accent2 + ';--b:' + p.bg + '"><span class="sw-prev"><i class="i1"></i><i class="i2"></i><i class="i3"></i></span><b>' + E(p.nama) + '</b></button>';
      }).join('');
      var bg = T.BG.map(function (b) {
        return '<button class="bgt rip' + (t.bg === b.id ? ' on' : '') + '" data-act="tema-bg" data-id="' + b.id + '"><span class="bgt-prev bp-' + b.id + '"></span><b>' + E(b.nama) + '</b></button>';
      }).join('');
      return '<section class="card reveal"><div class="card-head"><h3>Mode tampilan</h3></div>' +
        K.seg('mode', [{ v: 'terang', l: '☀️ Terang' }, { v: 'gelap', l: '🌙 Gelap' }, { v: 'auto', l: '🖥️ Otomatis' }], t.mode, 'full') + '</section>' +
        '<section class="card reveal"><div class="card-head"><h3>Warna tema</h3><button class="btn btn-soft btn-sm" data-act="tema-acak">' + K.ik('dice') + ' Acak</button></div><div class="swatches">' + sw + '</div>' +
        '<div class="custom-col"><div class="cc"><label for="cPrimary">Warna utama</label><input type="color" id="cPrimary" value="' + t.kustom.primary + '"></div>' +
        '<div class="cc"><label for="cAccent">Warna aksen</label><input type="color" id="cAccent" value="' + t.kustom.accent + '"></div><p class="muted">Pilih warna sendiri — langsung berubah saat kamu geser.</p></div></section>' +
        '<section class="card reveal"><div class="card-head"><h3>Latar belakang</h3></div><div class="bgts">' + bg + '</div>' +
        '<div class="btn-row"><button class="btn btn-soft btn-sm" data-act="foto-bg">' + K.ik('image') + ' Pilih foto latar</button>' + (K.getFoto() ? '<button class="btn btn-ghost btn-sm" data-act="foto-hapus">Hapus foto</button>' : '') + '<input type="file" id="fotoBg" accept="image/*" hidden></div></section>' +
        '<section class="card reveal"><div class="card-head"><h3>Tampilan lain</h3></div><div class="opts">' +
        '<div class="opt"><div><b>Animasi</b><small>Transisi halaman, efek gerak & latar bergerak</small></div><label class="switch"><input type="checkbox" id="swAnim"' + (t.anim !== false ? ' checked' : '') + '><i></i></label></div>' +
        '<div class="opt"><div><b>Sudut kartu</b><small>Seberapa membulat tampilannya</small></div>' + K.seg('radius', [{ v: 'bulat', l: 'Bulat' }, { v: 'sedang', l: 'Sedang' }, { v: 'tegas', l: 'Tegas' }], t.radius) + '</div>' +
        '<div class="opt"><div><b>Ukuran teks</b><small>Biar nyaman dibaca</small></div>' + K.seg('teks', [{ v: 's', l: 'Kecil' }, { v: 'm', l: 'Normal' }, { v: 'l', l: 'Besar' }], t.teks) + '</div></div></section>';
    },
    bind: function (v) {
      K.$$('.seg', v).forEach(function (s) {
        var n = s.dataset.seg;
        s._on = function (val) { var p = {}; p[n] = val; T.set(p); };
      });
      var cp = K.$('#cPrimary', v), ca = K.$('#cAccent', v);
      function kustom() { var t = K.state.tema; t.kustom = { primary: cp.value, accent: ca.value }; t.preset = 'kustom'; K.save(); T.apply(false); tandai(v); }
      cp.addEventListener('input', kustom); ca.addEventListener('input', kustom);
      K.$('#swAnim', v).addEventListener('change', function (e) { T.set({ anim: e.target.checked }); });
      K.$('#fotoBg', v).addEventListener('change', function (e) {
        var f = e.target.files && e.target.files[0]; if (!f) return;
        K.resizeImg(f, 1400, .72, false, function (data) {
          if (!data) { K.toast('Gagal membaca gambar', 'bad'); return; }
          if (!K.setFoto(data)) { K.toast('Penyimpanan penuh, coba foto lebih kecil', 'bad'); K.setFoto(''); return; }
          T.set({ bg: 'foto' }); K.render({ soft: true }); K.toast('Foto latar dipasang', 'ok');
        });
      });
    }
  };
  K.aksi['tema-preset'] = function (el) { T.set({ preset: el.dataset.id }); tandai(d); };
  K.aksi['tema-bg'] = function (el) {
    if (el.dataset.id === 'foto' && !K.getFoto()) { K.toast('Pilih foto dulu ya', 'info'); K.aksi['foto-bg'](); return; }
    T.set({ bg: el.dataset.id }); tandai(d);
  };
  K.aksi['tema-acak'] = function () { T.acak(); tandai(d); };
  K.aksi['foto-bg'] = function () { var i = K.$('#fotoBg'); if (i) i.click(); };
  K.aksi['foto-hapus'] = function () { K.setFoto(''); if (K.state.tema.bg === 'foto') T.set({ bg: 'bulat' }); K.render({ soft: true }); };

  /* =========================================================
     PROFIL
     ========================================================= */
  var AVATARS = ['😎', '🧑‍💻', '👩‍🎓', '👨‍🎓', '🦊', '🐱', '🐼', '🐥', '🦄', '🌵', '🍜', '🎧', '☕', '🚀', '⭐', '🌈'];
  K.halaman.profil = {
    judul: 'Profil Saya', sub: function () { return 'Data diri & pengaturan uang bulanan'; }, fab: false,
    render: function () {
      var p = K.state.profil, kir = K.kiriman();
      var av = AVATARS.map(function (a) { return '<button type="button" class="av-opt' + (p.avatar === a ? ' on' : '') + '" data-act="avatar" data-v="' + a + '" aria-label="Avatar ' + a + '">' + a + '</button>'; }).join('');
      return '<section class="profile-grid"><div class="card prof-card reveal"><div class="deco" aria-hidden="true"><i class="c c-w"></i><i class="c c-y"></i><i class="c c-p"></i></div>' +
        '<div class="big-av" id="bigAv">' + K.avatar() + '</div><h2>' + E(p.nama || 'Anak Kost') + '</h2><p class="muted">' + E([p.kampus, p.kost].filter(Boolean).join(' · ') || 'Lengkapi profilmu') + '</p>' +
        '<div class="mini-stats"><div><small>Transaksi</small><b>' + K.state.trx.length + '</b></div><div><small>Streak</small><b>' + K.streak() + ' 🔥</b></div><div><small>Kiriman berikut</small><b>' + kir.sisa + ' hari</b></div></div></div>' +
        '<div class="card reveal"><div class="card-head"><h3>Foto / avatar</h3></div><div class="av-grid">' + av + '</div><div class="btn-row"><button class="btn btn-soft btn-sm" data-act="avatar-foto">' + K.ik('upload') + ' Unggah foto</button><input type="file" id="avFile" accept="image/*" hidden></div></div></section>' +
        '<section class="card reveal"><div class="card-head"><h3>Data diri & keuangan</h3></div><form class="form" id="fProfil" autocomplete="off">' +
        '<div class="field half"><label class="lb" for="p_nama">Nama</label><input class="inp" id="p_nama" name="nama" maxlength="30" value="' + E(p.nama) + '" placeholder="Nama panggilan"></div>' +
        '<div class="field half"><label class="lb" for="p_kampus">Kampus / jurusan</label><input class="inp" id="p_kampus" name="kampus" maxlength="40" value="' + E(p.kampus) + '" placeholder="mis. Sistem Informasi"></div>' +
        '<div class="field"><label class="lb" for="p_kost">Nama kost / kota</label><input class="inp" id="p_kost" name="kost" maxlength="40" value="' + E(p.kost) + '" placeholder="mis. Kost Melati, Yogyakarta"></div>' +
        '<div class="field half"><label class="lb" for="p_kir">Uang kiriman / bulan</label><div class="money-wrap"><em>Rp</em><input class="inp" id="p_kir" name="kiriman" data-money inputmode="numeric" value="' + K.fmtInput(p.kiriman) + '"></div></div>' +
        '<div class="field half"><label class="lb" for="p_tgl">Tanggal kiriman</label><input class="inp" id="p_tgl" name="tgl" type="number" min="1" max="28" inputmode="numeric" value="' + (p.tglKiriman || 1) + '"><small class="hint">Dipakai menghitung jatah harian</small></div>' +
        '<div class="field"><label class="lb" for="p_awal">Saldo awal</label><div class="money-wrap"><em>Rp</em><input class="inp" id="p_awal" name="awal" data-money inputmode="numeric" value="' + K.fmtInput(p.saldoAwal) + '"></div><small class="hint">Uang yang kamu pegang sebelum mulai mencatat</small></div>' +
        '<div class="form-actions"><button class="btn btn-primary grow" type="submit">' + K.ik('save') + ' Simpan profil</button></div></form></section>';
    },
    bind: function (v) {
      K.$('#fProfil', v).addEventListener('submit', function (e) {
        e.preventDefault(); var f = e.target, p = K.state.profil;
        p.nama = f.nama.value.trim(); p.kampus = f.kampus.value.trim(); p.kost = f.kost.value.trim();
        p.kiriman = K.num(f.kiriman.value); p.tglKiriman = Math.min(28, Math.max(1, parseInt(f.tgl.value, 10) || 1)); p.saldoAwal = K.num(f.awal.value);
        K.save(); K.render({ soft: true }); K.segarkanProfil(); K.toast('Profil disimpan', 'ok');
      });
      K.$('#avFile', v).addEventListener('change', function (e) {
        var f = e.target.files && e.target.files[0]; if (!f) return;
        K.resizeImg(f, 220, .8, true, function (data) {
          if (!data) { K.toast('Gagal membaca gambar', 'bad'); return; }
          K.state.profil.avatar = data; K.save(); K.render({ soft: true }); K.segarkanProfil(); K.toast('Foto profil diperbarui', 'ok');
        });
      });
    }
  };
  K.aksi['avatar'] = function (el) { K.state.profil.avatar = el.dataset.v; K.save(); K.$$('.av-opt').forEach(function (b) { b.classList.toggle('on', b === el); }); K.$('#bigAv').innerHTML = K.avatar(); K.segarkanProfil(); };
  K.aksi['avatar-foto'] = function () { K.$('#avFile').click(); };

  /* =========================================================
     PENGATURAN
     ========================================================= */
  K.halaman.pengaturan = {
    judul: 'Pengaturan', sub: function () { return 'Offline, cadangan data & lainnya'; }, fab: false,
    render: function () {
      var sw = K.swStatus || 'cek', online = navigator.onLine;
      var swTxt = { siap: 'Siap dipakai offline ✅', mem: 'Sedang menyiapkan mode offline…', tidak: 'Mode offline butuh dibuka lewat https (GitHub Pages) atau localhost', cek: 'Memeriksa…' }[sw] || sw;
      return '<section class="card reveal"><div class="card-head"><h3>Offline & instal</h3></div><div class="opts">' +
        '<div class="opt"><div><b>Status koneksi</b><small>' + (online ? 'Terhubung ke internet' : 'Sedang offline — data tetap tersimpan di perangkat') + '</small></div><span class="pill ' + (online ? 'in' : 'out') + '">' + (online ? 'Online' : 'Offline') + '</span></div>' +
        '<div class="opt"><div><b>Mode offline</b><small id="swTxt">' + swTxt + '</small></div></div>' +
        '<div class="opt"><div><b>Pasang di layar utama</b><small>Jadi seperti aplikasi, tanpa Play Store</small></div><button class="btn btn-primary btn-sm" data-act="instal" id="btnInstal">Instal</button></div></div></section>' +
        '<section class="card reveal"><div class="card-head"><h3>Cadangan data</h3></div><p class="muted">Semua data tersimpan di browser perangkat ini. Buat cadangan berkala agar aman kalau ganti HP atau membersihkan browser.</p>' +
        '<div class="btn-row"><button class="btn btn-primary btn-sm" data-act="ekspor">' + K.ik('download') + ' Unduh cadangan (.json)</button><button class="btn btn-soft btn-sm" data-act="impor">' + K.ik('upload') + ' Pulihkan dari file</button><button class="btn btn-ghost btn-sm" data-act="csv">Ekspor CSV</button><input type="file" id="fileImpor" accept="application/json,.json" hidden></div></section>' +
        '<section class="card reveal"><div class="card-head"><h3>Data</h3></div><div class="opts">' +
        '<div class="opt"><div><b>Isi data contoh</b><small>Coba semua fitur dengan data simulasi (menimpa data sekarang)</small></div><button class="btn btn-soft btn-sm" data-act="contoh">Isi contoh</button></div>' +
        '<div class="opt"><div><b>Hapus semua data</b><small>Kembali ke awal, tidak bisa dibatalkan</small></div><button class="btn btn-danger-soft btn-sm" data-act="reset">Hapus semua</button></div></div></section>' +
        '<section class="card reveal about"><h3>Dill.Kost<small>v1.0</small></h3><p class="muted">Aplikasi pencatat keuangan untuk anak kost. Berjalan 100% di browser, tanpa server dan tanpa akun — datamu tidak dikirim ke mana pun.</p></section>';
    },
    bind: function (v) {
      var b = K.$('#btnInstal', v); if (b && !K.promptInstal) { b.textContent = 'Lewat menu browser'; b.classList.replace('btn-primary', 'btn-ghost'); }
      K.$('#fileImpor', v).addEventListener('change', function (e) {
        var f = e.target.files && e.target.files[0]; if (!f) return;
        var fr = new FileReader();
        fr.onload = function () {
          try { K.impor(JSON.parse(fr.result)); K.tema.apply(true); K.tema.applyBg(); K.segarkanProfil(); K.render({ soft: true }); K.toast('Data berhasil dipulihkan', 'ok'); }
          catch (er) { K.toast('File cadangan tidak valid', 'bad'); }
        };
        fr.readAsText(f);
      });
    }
  };
  K.aksi['ekspor'] = function () { K.unduh('dill.kost-cadangan-' + K.hari() + '.json', JSON.stringify(K.state, null, 1), 'application/json'); K.toast('Cadangan diunduh', 'ok'); };
  K.aksi['impor'] = function () { K.$('#fileImpor').click(); };
  K.aksi['instal'] = function () {
    if (K.promptInstal) { K.promptInstal.prompt(); K.promptInstal = null; }
    else K.toast('Buka menu browser lalu pilih "Tambahkan ke layar utama" / "Instal aplikasi"', 'info', { ms: 5000 });
  };
  K.aksi['contoh'] = function () {
    K.confirm({ judul: 'Isi data contoh?', teks: 'Data kamu saat ini akan diganti dengan data simulasi.', ya: 'Isi contoh' }).then(function (ok) {
      if (ok) { K.isiContoh(); K.segarkanProfil(); K.render({ soft: true }); K.toast('Data contoh dimuat', 'ok'); }
    });
  };
  K.aksi['reset'] = function () {
    K.confirm({ judul: 'Hapus semua data?', teks: 'Semua transaksi, anggaran, tabungan, dan pengaturan akan dihapus permanen dari perangkat ini.', ya: 'Ya, hapus semua', bahaya: true }).then(function (ok) {
      if (ok) { K.resetSemua(); location.reload(); }
    });
  };

  /* =========================================================
     ONBOARDING (pertama kali buka)
     ========================================================= */
  K.onboarding = function () {
    var selesai = false;
    K.modal({
      judul: 'Selamat datang di Dill.Kost👋',
      body: '<p class="muted conf-txt">Isi sedikit data supaya aku bisa menghitung jatah jajan harianmu. Semua bisa diubah nanti di Profil.</p>' +
        '<form class="form" id="fOnb" autocomplete="off"><div class="field"><label class="lb" for="o_nama">Nama panggilan</label><input class="inp" id="o_nama" name="nama" maxlength="30" placeholder="mis. Alicaa"></div>' +
        '<div class="field half"><label class="lb" for="o_kir">Uang kiriman / bulan</label><div class="money-wrap"><em>Rp</em><input class="inp" id="o_kir" name="kiriman" data-money inputmode="numeric" placeholder="1.500.000"></div></div>' +
        '<div class="field half"><label class="lb" for="o_tgl">Tanggal kiriman</label><input class="inp" id="o_tgl" name="tgl" type="number" min="1" max="28" value="1" inputmode="numeric"></div>' +
        '<div class="field"><label class="lb" for="o_awal">Saldo / uang di tangan sekarang</label><div class="money-wrap"><em>Rp</em><input class="inp" id="o_awal" name="awal" data-money inputmode="numeric" placeholder="0"></div></div>' +
        '<div class="form-actions col"><button class="btn btn-primary btn-block" type="submit">Mulai mencatat</button><button class="btn btn-ghost btn-block" type="button" data-contoh>Lihat dulu dengan data contoh</button></div></form>',
      onOpen: function (api) {
        var f = K.$('#fOnb', api.el);
        f.addEventListener('submit', function (e) {
          e.preventDefault(); var p = K.state.profil;
          p.nama = f.nama.value.trim(); p.kiriman = K.num(f.kiriman.value); p.tglKiriman = Math.min(28, Math.max(1, parseInt(f.tgl.value, 10) || 1)); p.saldoAwal = K.num(f.awal.value);
          K.state.siap = true; K.state.dibuat = K.hari(); K.save(); selesai = true; api.close(); K.segarkanProfil(); K.render({ soft: true });
          K.toast('Siap! Tekan tombol + untuk mencatat transaksi pertama', 'ok', { ms: 4500 });
        });
        K.$('[data-contoh]', api.el).addEventListener('click', function () { K.isiContoh(); selesai = true; api.close(); K.segarkanProfil(); K.render({ soft: true }); K.toast('Data contoh dimuat — silakan jelajahi!', 'ok'); });
      },
      onClose: function () { if (!selesai) { K.state.siap = true; K.state.dibuat = K.hari(); K.save(); } }
    });
  };
})(window, document);

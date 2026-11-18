(function (w, d) {
  'use strict';
  var K = w.KK, E = K.esc;

  K.halaman.dashboard = {
    judul: 'Dashboard',
    sub: function () { return K.labelTglPanjang(K.hari()); },
    render: function () {
      var s = K.state, p = s.profil, ym = K.ym(), tot = K.total(ym), saldo = K.saldo();
      var kir = K.kiriman(), harian = K.harian(), pk = K.perKat(ym), totAng = K.totalAnggaran();
      var nama = p.nama ? E(p.nama.split(' ')[0]) : 'Anak Kost';

      var dasar = totAng || +p.kiriman || tot.masuk || 0;
      var pct = dasar > 0 ? Math.min(100, Math.round(tot.keluar / dasar * 100)) : 0;
      var dasarLbl = totAng ? 'dari total anggaran' : (p.kiriman ? 'dari uang kiriman' : 'dari pemasukan');

      /* --- hero + jatah harian --- */
      var hero =
        '<section class="hero-grid">' +
        '<div class="hero reveal"><div class="deco" aria-hidden="true"><i class="c c-w"></i><i class="c c-y"></i><i class="c c-p"></i><i class="c c-k"></i></div>' +
        '<div class="hero-in"><p class="hero-hi">Halo, ' + nama + '! <span class="wave">👋</span></p>' +
        '<p class="hero-lbl">Saldo kamu saat ini</p>' +
        '<div class="saldo' + (saldo < 0 ? ' neg' : '') + '" data-count="' + saldo + '" data-fmt="rp">' + K.rp(saldo) + '</div>' +
        '<div class="pills"><span class="pill in">' + K.ik('up') + ' Masuk ' + K.rp(tot.masuk) + '</span><span class="pill out">' + K.ik('down') + ' Keluar ' + K.rp(tot.keluar) + '</span></div>' +
        '<div class="hero-act"><button class="btn btn-primary" data-act="trx-baru" data-tipe="out">' + K.ik('minus') + ' Pengeluaran</button>' +
        '<button class="btn btn-white" data-act="trx-baru" data-tipe="in">' + K.ik('plus') + ' Pemasukan</button></div></div></div>' +

        '<div class="jatah reveal"><div class="deco" aria-hidden="true"><i class="c c-w"></i><i class="c c-y"></i></div>' +
        '<div class="jatah-top"><div><p class="lbl">Jatah jajan per hari</p>' +
        '<div class="big" data-count="' + Math.round(harian) + '" data-fmt="rp">' + K.rp(harian) + '</div></div>' + K.chart.ring(pct) + '</div>' +
        '<p class="jatah-note">' + (saldo < 0 ? 'Saldo lagi minus, rem dulu jajannya 😅' : 'Cukup untuk <b>' + kir.sisa + ' hari</b> sampai kiriman berikutnya (' + K.labelTglPendek(K.hari(kir.tgl)) + ').') + '</p>' +
        '<div class="mini-stats"><div><small>Terpakai bulan ini</small><b>' + pct + '%</b><em>' + dasarLbl + '</em></div>' +
        '<div><small>Sisa hari</small><b>' + kir.sisa + ' hari</b><em>menuju kiriman</em></div></div></div>' +
        '</section>';

      /* --- kategori (chip bulat) --- */
      var list = K.KAT_OUT.map(function (k) { return { k: k, v: pk[k.id] || 0 }; }).filter(function (x) { return x.v > 0; }).sort(function (a, b) { return b.v - a.v; });
      var cats = list.length ? list.map(function (x, i) {
        return '<button class="cat rip' + (i === 0 ? ' on' : '') + '" data-act="lihat-kat" data-id="' + x.k.id + '"><span class="emo">' + x.k.emo + '</span><b>' + E(x.k.nama.split(' ')[0]) + '</b><small>' + K.short(x.v) + '</small></button>';
      }).join('') : K.KAT_OUT.slice(0, 6).map(function (k) {
        return '<button class="cat rip" data-act="trx-baru" data-tipe="out" data-kat="' + k.id + '"><span class="emo">' + k.emo + '</span><b>' + E(k.nama.split(' ')[0]) + '</b><small>Rp 0</small></button>';
      }).join('');
      var kategori = '<section class="reveal"><div class="sec-h"><h3>Kategori bulan ini</h3><a href="#/laporan" class="link">Lihat laporan</a></div><div class="cats">' + cats + '</div></section>';

      
      var hariBerjalan = new Date().getDate();
      var rata = tot.keluar / Math.max(hariBerjalan, 1);
      var stat = '<section class="stat-row">' +
        '<div class="stat reveal"><span class="s-ic">🔥</span><div><b data-count="' + K.streak() + '" data-suf=" hari">' + K.streak() + ' hari</b><small>Rutin mencatat</small></div></div>' +
        '<div class="stat reveal"><span class="s-ic">📉</span><div><b data-count="' + Math.round(rata) + '" data-fmt="short">' + K.short(rata) + '</b><small>Rata-rata keluar / hari</small></div></div>' +
        '<div class="stat reveal"><span class="s-ic">🐖</span><div><b data-count="' + K.totalTabungan() + '" data-fmt="short">' + K.short(K.totalTabungan()) + '</b><small>Total tabungan</small></div></div>' +
        '</section>';

      
      var h7 = K.hari7(), total7 = h7.reduce(function (a, x) { return a + x.v; }, 0);
      var top = list.slice(0, 5), lain = list.slice(5).reduce(function (a, x) { return a + x.v; }, 0);
      var dn = top.map(function (x) { return { l: x.k.nama, v: x.v, c: x.k.warna }; });
      if (lain > 0) dn.push({ l: 'Lainnya', v: lain, c: '#9aa0b8' });
      var legend = dn.map(function (x) { return '<li><i style="background:' + x.c + '"></i><span>' + E(x.l) + '</span><b>' + Math.round(x.v / tot.keluar * 100) + '%</b></li>'; }).join('');
      var grafik = '<section class="grid-2">' +
        '<div class="card reveal"><div class="card-head"><h3>7 hari terakhir</h3><span class="muted">' + K.rp(total7) + '</span></div>' + K.chart.bars(h7) + '</div>' +
        '<div class="card reveal"><div class="card-head"><h3>Pengeluaran per kategori</h3></div>' +
        (tot.keluar > 0 ? '<div class="donut-wrap"><div class="donut-box">' + K.chart.donut(dn) + '<div class="donut-c"><small>Total</small><b>' + K.short(tot.keluar) + '</b></div></div><ul class="legend">' + legend + '</ul></div>' : K.kosong('🍃', 'Belum ada pengeluaran', 'Catat pengeluaran pertama bulan ini.')) + '</div></section>';

      
      var ang = K.KAT_OUT.map(function (k) { var lim = +s.anggaran[k.id] || 0, u = pk[k.id] || 0; return { k: k, lim: lim, u: u, p: lim ? u / lim * 100 : 0 }; })
        .filter(function (x) { return x.lim > 0; }).sort(function (a, b) { return b.p - a.p; }).slice(0, 4);
      var angHtml = ang.length ? ang.map(function (x) {
        return '<div class="ang"><div class="ang-h"><span class="emo sm">' + x.k.emo + '</span><b>' + E(x.k.nama) + '</b><small>' + K.short(x.u) + ' / ' + K.short(x.lim) + '</small></div>' + K.chart.prog(x.p, x.k.warna) + '</div>';
      }).join('') : K.kosong('🎯', 'Belum ada anggaran', 'Atur batas pengeluaran tiap kategori.', '<a class="btn btn-soft btn-sm" href="#/anggaran">Atur anggaran</a>');

      var tag = s.tagihan.map(function (t) { return { t: t, i: K.infoTagihan(t) }; }).filter(function (x) { return !x.i.lunas; }).sort(function (a, b) { return a.i.sisa - b.i.sisa; }).slice(0, 3);
      var tagHtml = tag.length ? tag.map(function (x, i) {
        var k = K.kat('out', x.t.kat), ket = x.i.terlambat ? 'Terlambat ' + (-x.i.sisa) + ' hari' : x.i.sisa === 0 ? 'Jatuh tempo hari ini' : x.i.sisa + ' hari lagi';
        return '<div class="row' + (i === 0 ? ' hl has-act' : '') + '"><span class="emo" style="--c:' + k.warna + '">' + k.emo + '</span><div class="row-main"><b>' + E(x.t.nama) + '</b><small class="' + (x.i.terlambat ? 'late' : '') + '">' + K.rp(x.t.jumlah) + ' · ' + ket + '</small></div>' +
          '<button class="tab rip" data-act="tagihan-bayar" data-id="' + x.t.id + '">Bayar</button></div>';
      }).join('') : K.kosong(s.tagihan.length ? '🎉' : '🧾', s.tagihan.length ? 'Semua tagihan lunas' : 'Belum ada tagihan', s.tagihan.length ? 'Aman, tidak ada yang tertunda bulan ini.' : 'Tambahkan tagihan kost, wifi, listrik.', '<a class="btn btn-soft btn-sm" href="#/tagihan">Buka tagihan</a>');
      var duo = '<section class="grid-2">' +
        '<div class="card reveal"><div class="card-head"><h3>Anggaran bulan ini</h3><a class="link" href="#/anggaran">Semua</a></div><div class="stack">' + angHtml + '</div></div>' +
        '<div class="card reveal"><div class="card-head"><h3>Tagihan mendatang</h3><a class="link" href="#/tagihan">Semua</a></div><div class="stack">' + tagHtml + '</div></div></section>';

      
      var rec = K.urut(s.trx).slice(0, 5);
      var terbaru = '<section class="card reveal"><div class="card-head"><h3>Transaksi terbaru</h3><a class="link" href="#/transaksi">Lihat semua</a></div><div class="stack">' +
        (rec.length ? rec.map(K.trxRow).join('') : K.kosong('📝', 'Belum ada transaksi', 'Tekan tombol + untuk mencatat pemasukan atau pengeluaran.')) + '</div></section>';

      return hero + kategori + stat + grafik + duo + terbaru;
    }
  };

  K.aksi['lihat-kat'] = function (el) {
    K.ui.trx = K.ui.trx || {};
    K.ui.trx = { bulan: K.ym(), tipe: 'out', q: '', kat: el.dataset.id };
    w.location.hash = '#/transaksi';
  };
})(window, document);

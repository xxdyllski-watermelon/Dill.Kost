/* =========================================================
   hal-transaksi.js — Transaksi, Anggaran, Laporan + form catat transaksi
   ========================================================= */
(function (w, d) {
  'use strict';
  var K = w.KK, E = K.esc;
  K.ui.trx = { bulan: K.ym(), tipe: 'all', q: '', kat: '' };

  /* ---------- Form catat / ubah transaksi ---------- */
  function cekAnggaran(t) {
    if (t.tipe !== 'out') return;
    var lim = +K.state.anggaran[t.kat]; if (!lim) return;
    var used = K.perKat(t.tgl.slice(0, 7))[t.kat] || 0, k = K.kat('out', t.kat);
    if (used > lim) K.toast('Anggaran ' + k.nama + ' lewat ' + K.rp(used - lim), 'bad');
    else if (used >= lim * .8) K.toast('Anggaran ' + k.nama + ' tinggal ' + K.rp(lim - used), 'warn');
  }
  function katGrid(tipe, aktif) {
    var L = tipe === 'in' ? K.KAT_IN : K.KAT_OUT;
    return L.map(function (k, i) {
      return '<label class="cat-opt" style="--i:' + i + '"><input type="radio" name="kat" value="' + k.id + '"' + (k.id === aktif ? ' checked' : '') + '><span class="emo" style="--c:' + k.warna + '">' + k.emo + '</span><small>' + E(k.nama) + '</small></label>';
    }).join('');
  }
  function formTrx(opt) {
    opt = opt || {};
    var t = opt.id ? K.state.trx.filter(function (x) { return x.id === opt.id; })[0] : null;
    var tipe = t ? t.tipe : (opt.tipe || 'out');
    var h = '<form class="form trx-form" autocomplete="off" novalidate>' +
      K.seg('tipe', [{ v: 'out', l: 'Pengeluaran' }, { v: 'in', l: 'Pemasukan' }], tipe, 'full') +
      '<div class="field"><label class="lb" for="f_jumlah">Jumlah</label><div class="money-wrap"><em>Rp</em><input class="inp inp-lg" id="f_jumlah" name="jumlah" inputmode="numeric" data-money placeholder="0" value="' + (t ? K.fmtInput(t.jumlah) : '') + '"></div>' +
      '<div class="quick">' + [5000, 10000, 20000, 50000, 100000].map(function (v) { return '<button type="button" class="chip rip" data-add="' + v + '">+' + K.short(v) + '</button>'; }).join('') + '</div></div>' +
      '<div class="field"><span class="lb">Kategori</span><div class="cat-grid" id="catGrid">' + katGrid(tipe, t ? t.kat : (opt.kat || (tipe === 'in' ? 'kiriman' : 'makan'))) + '</div></div>' +
      '<div class="field half"><label class="lb" for="f_tgl">Tanggal</label><input class="inp" type="date" id="f_tgl" name="tgl" value="' + (t ? t.tgl : K.hari()) + '"></div>' +
      '<div class="field half"><label class="lb" for="f_cat">Catatan</label><input class="inp" id="f_cat" name="catatan" maxlength="60" placeholder="mis. Nasi goreng" value="' + E(t ? t.catatan : '') + '"></div>' +
      '<div class="form-actions">' + (t ? '<button type="button" class="btn btn-danger-soft" data-del>' + K.ik('trash') + ' Hapus</button>' : '') + '<button class="btn btn-primary grow" type="submit">' + (t ? 'Simpan perubahan' : 'Simpan') + '</button></div></form>';
    K.modal({
      judul: t ? 'Ubah transaksi' : 'Catat transaksi', body: h,
      onOpen: function (api) {
        var f = api.el.querySelector('form'), seg = f.querySelector('.seg');
        seg._on = function (v) { f.querySelector('#catGrid').innerHTML = katGrid(v, v === 'in' ? 'kiriman' : 'makan'); };
        f.addEventListener('click', function (e) {
          var b = e.target.closest('[data-add]');
          if (b) { var inp = f.elements.jumlah; inp.value = K.fmtInput(K.num(inp.value) + (+b.dataset.add)); K.goyang(inp.closest('.money-wrap')); }
        });
        f.addEventListener('submit', function (e) {
          e.preventDefault();
          var jml = K.num(f.elements.jumlah.value), kat = f.querySelector('input[name="kat"]:checked');
          if (!jml) { K.goyang(f.elements.jumlah.closest('.field')); f.elements.jumlah.focus(); K.toast('Isi jumlahnya dulu ya', 'warn'); return; }
          if (!kat) { K.goyang(f.querySelector('#catGrid')); K.toast('Pilih kategori', 'warn'); return; }
          var tp = seg.dataset.val || tipe, tgl = f.elements.tgl.value || K.hari(), res;
          if (t) { t.tipe = tp; t.jumlah = jml; t.kat = kat.value; t.tgl = tgl; t.catatan = f.elements.catatan.value.trim(); K.save(); res = t; K.toast('Perubahan disimpan', 'ok'); }
          else { res = K.tambahTrx({ tipe: tp, jumlah: jml, kat: kat.value, tgl: tgl, catatan: f.elements.catatan.value }); K.toast((tp === 'in' ? 'Pemasukan ' : 'Pengeluaran ') + K.rp(jml) + ' dicatat', 'ok'); }
          K.flash = res.id; api.close(); K.render({ soft: true }); cekAnggaran(res);
        });
        var del = f.querySelector('[data-del]');
        if (del) del.addEventListener('click', function () {
          K.confirm({ judul: 'Hapus transaksi?', teks: 'Transaksi ini akan dihapus dan saldo dihitung ulang.', ya: 'Hapus', bahaya: true }).then(function (ok) {
            if (ok) { K.hapusTrx(t.id); api.close(); K.render({ soft: true }); K.toast('Transaksi dihapus', 'info'); }
          });
        });
      }
    });
  }
  K.formTrx = formTrx;
  K.aksi['trx-baru'] = function (el) { formTrx({ tipe: el.dataset.tipe || 'out', kat: el.dataset.kat }); };
  K.aksi['trx-edit'] = function (el) { formTrx({ id: el.dataset.id }); };

  /* =========================================================
     TRANSAKSI
     ========================================================= */
  function filtered() {
    var u = K.ui.trx, q = (u.q || '').toLowerCase();
    return K.urut(K.trxBulan(u.bulan)).filter(function (t) {
      if (u.tipe !== 'all' && t.tipe !== u.tipe) return false;
      if (u.kat && t.kat !== u.kat) return false;
      if (q) { var k = K.kat(t.tipe, t.kat); if ((t.catatan + ' ' + k.nama).toLowerCase().indexOf(q) < 0) return false; }
      return true;
    });
  }
  function ringkas(list) {
    var m = 0, k = 0; list.forEach(function (t) { if (t.tipe === 'in') m += t.jumlah; else k += t.jumlah; });
    return '<div><small>Masuk</small><b class="in">' + K.rp(m) + '</b></div><div><small>Keluar</small><b class="out">' + K.rp(k) + '</b></div><div><small>Selisih</small><b>' + K.rp(m - k) + '</b></div>';
  }
  function listHtml(list) {
    if (!list.length) return K.kosong('🔍', 'Tidak ada transaksi', 'Coba ganti bulan atau filter, atau catat transaksi baru.', '<button class="btn btn-primary btn-sm" data-act="trx-baru">' + K.ik('plus') + ' Catat sekarang</button>');
    var grup = {}, urut = [];
    list.forEach(function (t) { if (!grup[t.tgl]) { grup[t.tgl] = []; urut.push(t.tgl); } grup[t.tgl].push(t); });
    return urut.map(function (tg) {
      var sum = 0; grup[tg].forEach(function (t) { sum += t.tipe === 'in' ? t.jumlah : -t.jumlah; });
      return '<div class="day reveal"><div class="day-h"><b>' + K.labelHari(tg) + '</b><span class="' + (sum >= 0 ? 'in' : 'out') + '">' + (sum >= 0 ? '+' : '−') + K.rp(Math.abs(sum)) + '</span></div><div class="stack">' + grup[tg].map(K.trxRow).join('') + '</div></div>';
    }).join('');
  }
  function refreshList() {
    var list = filtered(), box = K.$('#trxList'), sm = K.$('#trxSum');
    if (!box) return;
    box.innerHTML = listHtml(list); sm.innerHTML = ringkas(list);
    K.$$('.reveal', box).forEach(function (e, i) { e.style.setProperty('--i', Math.min(i, 10)); });
  }
  K.halaman.transaksi = {
    judul: 'Transaksi', sub: function () { return 'Semua pemasukan & pengeluaran'; },
    render: function () {
      var u = K.ui.trx, list = filtered();
      var opts = '<option value="">Semua kategori</option>' + K.KAT_OUT.map(function (k) { return '<option value="' + k.id + '"' + (u.kat === k.id ? ' selected' : '') + '>' + k.emo + ' ' + E(k.nama) + '</option>'; }).join('') +
        K.KAT_IN.filter(function (k) { return k.id !== 'tarik' || true; }).map(function (k) { return '<option value="' + k.id + '"' + (u.kat === k.id ? ' selected' : '') + '>' + k.emo + ' ' + E(k.nama) + ' (masuk)</option>'; }).join('');
      return '<section class="card reveal"><div class="month-nav"><button class="icon-btn sm" data-act="trx-bulan" data-n="-1" aria-label="Bulan sebelumnya">' + K.ik('chev-l') + '</button><h3>' + K.labelBulan(u.bulan) + '</h3><button class="icon-btn sm" data-act="trx-bulan" data-n="1" aria-label="Bulan berikutnya">' + K.ik('chev-r') + '</button></div>' +
        '<div class="sum3" id="trxSum">' + ringkas(list) + '</div></section>' +
        '<section class="filters reveal">' + K.seg('tipe', [{ v: 'all', l: 'Semua' }, { v: 'out', l: 'Keluar' }, { v: 'in', l: 'Masuk' }], u.tipe) +
        '<div class="search">' + K.ik('search') + '<input class="inp" id="trxQ" type="search" placeholder="Cari catatan…" value="' + E(u.q) + '" aria-label="Cari transaksi"></div>' +
        '<select class="inp" id="trxKat" aria-label="Filter kategori">' + opts + '</select></section>' +
        '<div id="trxList">' + listHtml(list) + '</div>';
    },
    bind: function (v) {
      var seg = K.$('.seg', v);
      seg._on = function (val) { K.ui.trx.tipe = val; refreshList(); };
      K.$('#trxQ', v).addEventListener('input', function (e) { K.ui.trx.q = e.target.value; refreshList(); });
      K.$('#trxKat', v).addEventListener('change', function (e) { K.ui.trx.kat = e.target.value; refreshList(); });
    }
  };
  K.aksi['trx-bulan'] = function (el) { K.ui.trx.bulan = K.geserBulan(K.ui.trx.bulan, +el.dataset.n); K.render({ soft: true }); };

  /* =========================================================
     ANGGARAN
     ========================================================= */
  K.halaman.anggaran = {
    judul: 'Anggaran', sub: function () { return 'Batas pengeluaran ' + K.labelBulan(K.ym()); },
    render: function () {
      var ym = K.ym(), pk = K.perKat(ym), tot = K.totalAnggaran(), pakai = 0;
      K.KAT_OUT.forEach(function (k) { if (+K.state.anggaran[k.id]) pakai += pk[k.id] || 0; });
      var persen = tot ? pakai / tot * 100 : 0, sisa = tot - pakai;
      var head = '<section class="card hero-mini reveal"><div class="hm-l"><p class="lbl">Total anggaran bulan ini</p><div class="big" data-count="' + tot + '" data-fmt="rp">' + K.rp(tot) + '</div>' +
        '<p class="muted">' + (tot ? (sisa >= 0 ? 'Sisa <b>' + K.rp(sisa) + '</b> dari anggaran' : '<b class="out">Lewat ' + K.rp(-sisa) + '</b> dari anggaran') : 'Belum ada anggaran. Coba saran otomatis!') + '</p>' +
        '<div class="btn-row"><button class="btn btn-primary btn-sm" data-act="ang-saran">' + K.ik('wand') + ' Saran otomatis</button>' + (tot ? '<button class="btn btn-ghost btn-sm" data-act="ang-reset">Kosongkan</button>' : '') + '</div></div>' + K.chart.ring(persen) + '</section>';
      var rows = K.KAT_OUT.map(function (k, i) {
        var lim = +K.state.anggaran[k.id] || 0, u = pk[k.id] || 0, p = lim ? u / lim * 100 : 0;
        return '<div class="ang-row rip" data-act="ang-edit" data-id="' + k.id + '" tabindex="0" role="button"><span class="emo" style="--c:' + k.warna + '">' + k.emo + '</span><div class="ang-main"><div class="ang-t"><b>' + E(k.nama) + '</b><span class="muted">' + (lim ? K.rp(u) + ' / ' + K.rp(lim) : (u ? K.rp(u) + ' · tanpa batas' : 'Belum diatur')) + '</span></div>' +
          (lim ? K.chart.prog(p, k.warna) : '<div class="prog empty-p"><i></i></div>') + '</div><span class="ang-edit">' + K.ik('edit') + '</span></div>';
      }).join('');
      return head + '<section class="card reveal"><div class="card-head"><h3>Per kategori</h3><span class="muted">Ketuk untuk mengatur batas</span></div><div class="stack">' + rows + '</div></section>';
    }
  };
  K.aksi['ang-edit'] = function (el) {
    var k = K.kat('out', el.dataset.id), lim = +K.state.anggaran[k.id] || 0;
    K.formModal({
      judul: k.emo + ' Anggaran ' + k.nama,
      fields: [{ n: 'lim', l: 'Batas per bulan', t: 'money', v: lim, hint: 'Kosongkan / 0 untuk menghapus batas' }],
      hapus: lim ? function (api) { delete K.state.anggaran[k.id]; K.save(); api.close(); K.render({ soft: true }); K.toast('Batas dihapus', 'info'); } : null,
      onSubmit: function (v, api) {
        if (v.lim > 0) K.state.anggaran[k.id] = v.lim; else delete K.state.anggaran[k.id];
        K.save(); api.close(); K.render({ soft: true }); K.toast('Anggaran disimpan', 'ok');
      }
    });
  };
  K.aksi['ang-saran'] = function () {
    K.formModal({
      judul: 'Saran anggaran otomatis',
      fields: [{ n: 'dasar', l: 'Uang bulanan kamu', t: 'money', v: K.state.profil.kiriman || K.total(K.ym()).masuk || '', req: true, hint: 'Dibagi ke kategori: kost 30%, makan 25%, belanja 8%, transport 7%, dll.' }],
      ok: 'Terapkan saran',
      onSubmit: function (v, api) { K.terapkanSaran(v.dasar); api.close(); K.render({ soft: true }); K.toast('Anggaran dibuat dari ' + K.rp(v.dasar), 'ok'); }
    });
  };
  K.aksi['ang-reset'] = function () {
    K.confirm({ judul: 'Kosongkan anggaran?', teks: 'Semua batas kategori akan dihapus.', ya: 'Kosongkan', bahaya: true }).then(function (ok) { if (ok) { K.state.anggaran = {}; K.save(); K.render({ soft: true }); } });
  };

  /* =========================================================
     LAPORAN
     ========================================================= */
  K.ui.lap = K.ym();
  K.halaman.laporan = {
    judul: 'Laporan', sub: function () { return 'Ringkasan keuangan bulanan'; },
    render: function () {
      var ym = K.ui.lap, tot = K.total(ym), pk = K.perKat(ym), prev = K.total(K.geserBulan(ym, -1));
      var list = K.KAT_OUT.map(function (k) { return { k: k, v: pk[k.id] || 0 }; }).filter(function (x) { return x.v > 0; }).sort(function (a, b) { return b.v - a.v; });
      var dn = list.map(function (x) { return { l: x.k.nama, v: x.v, c: x.k.warna }; });
      var selisih = tot.masuk - tot.keluar, tren = prev.keluar ? Math.round((tot.keluar - prev.keluar) / prev.keluar * 100) : null;
      var now = K.ym() === ym, hari = now ? new Date().getDate() : K.hariDalamBulan(+ym.slice(0, 4), +ym.slice(5) - 1);
      var insight = [];
      if (list.length) insight.push('💸 Pengeluaran terbesar: <b>' + E(list[0].k.nama) + '</b> (' + Math.round(list[0].v / tot.keluar * 100) + '% dari total).');
      if (tot.keluar) insight.push('📅 Rata-rata keluar per hari: <b>' + K.rp(tot.keluar / hari) + '</b>.');
      if (tren !== null) insight.push((tren > 0 ? '📈 Naik ' : '📉 Turun ') + '<b>' + Math.abs(tren) + '%</b> dibanding bulan lalu' + (tren > 0 ? ' — hati-hati ya.' : ' — mantap, terus hemat!'));
      if (tot.masuk && tot.keluar) insight.push('🏦 Kamu menyisihkan <b>' + Math.max(0, Math.round(selisih / tot.masuk * 100)) + '%</b> dari pemasukan bulan ini.');
      var ranking = list.map(function (x) { return '<div class="rank"><span class="emo sm" style="--c:' + x.k.warna + '">' + x.k.emo + '</span><div class="rank-m"><div class="ang-t"><b>' + E(x.k.nama) + '</b><span>' + K.rp(x.v) + ' · ' + Math.round(x.v / tot.keluar * 100) + '%</span></div>' + K.chart.prog(x.v / list[0].v * 100, x.k.warna).replace(' bad', '').replace(' warn', '') + '</div></div>'; }).join('');
      return '<section class="card reveal"><div class="month-nav"><button class="icon-btn sm" data-act="lap-bulan" data-n="-1" aria-label="Bulan sebelumnya">' + K.ik('chev-l') + '</button><h3>' + K.labelBulan(ym) + '</h3><button class="icon-btn sm" data-act="lap-bulan" data-n="1" aria-label="Bulan berikutnya">' + K.ik('chev-r') + '</button></div>' +
        '<div class="sum3"><div><small>Pemasukan</small><b class="in">' + K.rp(tot.masuk) + '</b></div><div><small>Pengeluaran</small><b class="out">' + K.rp(tot.keluar) + '</b></div><div><small>Selisih</small><b>' + K.rp(selisih) + '</b></div></div></section>' +
        '<section class="grid-2"><div class="card reveal"><div class="card-head"><h3>Komposisi pengeluaran</h3></div>' +
        (tot.keluar ? '<div class="donut-wrap"><div class="donut-box">' + K.chart.donut(dn) + '<div class="donut-c"><small>Total</small><b>' + K.short(tot.keluar) + '</b></div></div></div>' : K.kosong('🍃', 'Belum ada data', 'Tidak ada pengeluaran di bulan ini.')) + '</div>' +
        '<div class="card reveal"><div class="card-head"><h3>Insight</h3></div>' + (insight.length ? '<ul class="insight">' + insight.map(function (i) { return '<li>' + i + '</li>'; }).join('') + '</ul>' : '<p class="muted">Catat transaksi agar muncul insight.</p>') + '</div></section>' +
        '<section class="card reveal"><div class="card-head"><h3>6 bulan terakhir</h3><div class="legend-h"><span><i class="lm"></i>Masuk</span><span><i class="lk"></i>Keluar</span></div></div>' + K.chart.grup(K.bulan6(ym)) + '</section>' +
        '<section class="card reveal"><div class="card-head"><h3>Peringkat kategori</h3><button class="btn btn-soft btn-sm" data-act="csv">' + K.ik('download') + ' Ekspor CSV</button></div><div class="stack">' + (ranking || '<p class="muted">Belum ada data.</p>') + '</div></section>';
    }
  };
  K.aksi['lap-bulan'] = function (el) { K.ui.lap = K.geserBulan(K.ui.lap, +el.dataset.n); K.render({ soft: true }); };
  K.aksi['csv'] = function () {
    var rows = [['Tanggal', 'Jenis', 'Kategori', 'Catatan', 'Jumlah']];
    K.urut(K.state.trx).reverse().forEach(function (t) { rows.push([t.tgl, t.tipe === 'in' ? 'Pemasukan' : 'Pengeluaran', K.kat(t.tipe, t.kat).nama, t.catatan, t.jumlah]); });
    var csv = rows.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(','); }).join('\r\n');
    K.unduh('kostku-transaksi-' + K.hari() + '.csv', '﻿' + csv, 'text/csv;charset=utf-8');
    K.toast('File CSV diunduh', 'ok');
  };
})(window, document);

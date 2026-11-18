/* =========================================================
   hal-kost.js — Tagihan Kost, Daftar Belanja, Tabungan, Hutang & Patungan
   ========================================================= */
(function (w, d) {
  'use strict';
  var K = w.KK, E = K.esc;
  var KAT_TAGIHAN = ['kost', 'listrik', 'pulsa', 'laundry', 'hiburan', 'kuliah', 'lain'];
  function katOpts() { return KAT_TAGIHAN.map(function (id) { var k = K.kat('out', id); return { v: id, l: k.emo + ' ' + k.nama }; }); }

  /* =========================================================
     TAGIHAN
     ========================================================= */
  K.halaman.tagihan = {
    judul: 'Tagihan Kost', sub: function () { return 'Tagihan rutin tiap bulan'; },
    render: function () {
      var data = K.state.tagihan.map(function (t) { return { t: t, i: K.infoTagihan(t) }; });
      var total = 0, lunas = 0;
      data.forEach(function (x) { total += +x.t.jumlah; if (x.i.lunas) lunas += +x.t.jumlah; });
      var pct = total ? lunas / total * 100 : 0;
      data.sort(function (a, b) { return (a.i.lunas - b.i.lunas) || (a.i.sisa - b.i.sisa); });
      var head = '<section class="card hero-mini reveal"><div class="hm-l"><p class="lbl">Belum dibayar bulan ini</p><div class="big" data-count="' + (total - lunas) + '" data-fmt="rp">' + K.rp(total - lunas) + '</div>' +
        '<p class="muted">Total tagihan ' + K.rp(total) + ' · lunas ' + K.rp(lunas) + '</p><div class="btn-row"><button class="btn btn-primary btn-sm" data-act="tagihan-baru">' + K.ik('plus') + ' Tambah tagihan</button></div></div>' + K.chart.ring(pct) + '</section>';
      var rows = data.length ? data.map(function (x) {
        var t = x.t, i = x.i, k = K.kat('out', t.kat);
        var ket = i.lunas ? 'Lunas bulan ini ✓' : i.terlambat ? 'Terlambat ' + (-i.sisa) + ' hari' : i.sisa === 0 ? 'Jatuh tempo hari ini' : i.sisa + ' hari lagi';
        return '<div class="row bill' + (i.lunas ? ' done' : '') + (i.terlambat ? ' late-row' : '') + '"><span class="emo" style="--c:' + k.warna + '">' + k.emo + '</span>' +
          '<div class="row-main" data-act="tagihan-edit" data-id="' + t.id + '" tabindex="0" role="button"><b>' + E(t.nama) + '</b><small class="' + (i.terlambat ? 'late' : '') + '">Tiap tgl ' + t.tgl + ' · ' + ket + '</small></div>' +
          '<div class="amt">' + K.rp(t.jumlah) + '</div>' +
          (i.lunas ? '<button class="btn btn-ghost btn-sm" data-act="tagihan-batal" data-id="' + t.id + '">Batal</button>' : '<button class="btn btn-accent btn-sm" data-act="tagihan-bayar" data-id="' + t.id + '">Bayar</button>') + '</div>';
      }).join('') : K.kosong('🧾', 'Belum ada tagihan', 'Tambahkan sewa kost, wifi, listrik, atau langganan lain agar tidak lupa bayar.');
      return head + '<section class="card reveal"><div class="card-head"><h3>Daftar tagihan</h3></div><div class="stack">' + rows + '</div></section>';
    }
  };
  function formTagihan(id) {
    var t = id ? K.state.tagihan.filter(function (x) { return x.id === id; })[0] : null;
    K.formModal({
      judul: t ? 'Ubah tagihan' : 'Tagihan baru',
      fields: [
        { n: 'nama', l: 'Nama tagihan', ph: 'mis. Sewa kost', v: t && t.nama, req: true },
        { n: 'jumlah', l: 'Jumlah per bulan', t: 'money', v: t && t.jumlah, req: true },
        { n: 'tgl', l: 'Tanggal jatuh tempo', t: 'num', min: 1, max: 31, v: t ? t.tgl : 1, half: true, req: true },
        { n: 'kat', l: 'Kategori', t: 'select', opts: katOpts(), v: t ? t.kat : 'kost', half: true }
      ],
      hapus: t ? function (api) { K.state.tagihan = K.state.tagihan.filter(function (x) { return x.id !== t.id; }); K.save(); api.close(); K.render({ soft: true }); K.toast('Tagihan dihapus', 'info'); } : null,
      onSubmit: function (v, api) {
        if (t) { t.nama = v.nama; t.jumlah = v.jumlah; t.tgl = v.tgl; t.kat = v.kat; K.flash = t.id; }
        else { var n = { id: K.uid(), nama: v.nama, jumlah: v.jumlah, tgl: v.tgl, kat: v.kat, lunas: {} }; K.state.tagihan.push(n); K.flash = n.id; }
        K.save(); api.close(); K.render({ soft: true }); K.toast('Tagihan disimpan', 'ok');
      }
    });
  }
  K.aksi['tagihan-baru'] = function () { formTagihan(); };
  K.aksi['tagihan-edit'] = function (el) { formTagihan(el.dataset.id); };
  K.aksi['tagihan-bayar'] = function (el) {
    var t = K.state.tagihan.filter(function (x) { return x.id === el.dataset.id; })[0]; if (!t) return;
    var ym = K.ym(), trx = K.tambahTrx({ tipe: 'out', kat: t.kat, jumlah: t.jumlah, catatan: 'Bayar ' + t.nama });
    t.lunas = t.lunas || {}; t.lunas[ym] = trx.id; K.save(); K.flash = t.id; K.render({ soft: true });
    K.toast(t.nama + ' lunas — ' + K.rp(t.jumlah), 'ok', { aksi: 'Batalkan', fn: function () { K.aksi['tagihan-batal']({ dataset: { id: t.id } }); } });
  };
  K.aksi['tagihan-batal'] = function (el) {
    var t = K.state.tagihan.filter(function (x) { return x.id === el.dataset.id; })[0]; if (!t || !t.lunas) return;
    var ym = K.ym(), id = t.lunas[ym]; if (id) K.hapusTrx(id);
    delete t.lunas[ym]; K.save(); K.render({ soft: true }); K.toast('Pembayaran dibatalkan', 'info');
  };

  /* =========================================================
     DAFTAR BELANJA
     ========================================================= */
  function totalBl(onlyDone) {
    return K.state.belanja.reduce(function (s, b) { return s + ((!onlyDone || b.done) ? (+b.harga || 0) * (+b.qty || 1) : 0); }, 0);
  }
  function blHtml() {
    var L = K.state.belanja.slice().sort(function (a, b) { return (a.done - b.done); });
    if (!L.length) return K.kosong('🛒', 'Daftar belanja kosong', 'Tulis kebutuhan harian di atas, centang saat sudah dibeli.');
    return L.map(function (b) {
      var sub = (+b.harga || 0) * (+b.qty || 1);
      return '<div class="row bl' + (b.done ? ' done' : '') + '" data-id="' + b.id + '"><button class="chk' + (b.done ? ' on' : '') + '" data-act="bl-cek" data-id="' + b.id + '" aria-pressed="' + !!b.done + '" aria-label="Tandai sudah dibeli"><svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></button>' +
        '<div class="row-main" data-act="bl-edit" data-id="' + b.id + '" tabindex="0" role="button"><b>' + E(b.nama) + '</b><small>' + (b.qty || 1) + ' × ' + (b.harga ? K.rp(b.harga) : 'tanpa harga') + '</small></div>' +
        '<div class="amt">' + (sub ? K.rp(sub) : '') + '</div><button class="icon-btn sm ghost" data-act="bl-hapus" data-id="' + b.id + '" aria-label="Hapus ' + E(b.nama) + '">' + K.ik('x') + '</button></div>';
    }).join('');
  }
  function blRefresh() {
    var box = K.$('#blList'), sm = K.$('#blSum'); if (!box) return;
    box.innerHTML = blHtml();
    var done = K.state.belanja.filter(function (b) { return b.done; }).length;
    sm.innerHTML = '<div><small>Estimasi total</small><b>' + K.rp(totalBl(false)) + '</b></div><div><small>Sudah dibeli (' + done + ')</small><b class="in">' + K.rp(totalBl(true)) + '</b></div>';
    var btn = K.$('#blDone'); if (btn) btn.disabled = !done;
  }
  K.halaman.belanja = {
    judul: 'Daftar Belanja', sub: function () { return 'Catat kebutuhan harian, centang saat dibeli'; },
    render: function () {
      var done = K.state.belanja.filter(function (b) { return b.done; }).length;
      return '<section class="card reveal"><form class="bl-add" id="blForm" autocomplete="off"><input class="inp" name="nama" placeholder="Beli apa hari ini? mis. Telur" maxlength="40" aria-label="Nama barang">' +
        '<input class="inp qty" name="qty" type="number" min="1" max="99" value="1" inputmode="numeric" aria-label="Jumlah"><div class="money-wrap"><em>Rp</em><input class="inp" name="harga" data-money inputmode="numeric" placeholder="Harga" aria-label="Harga satuan"></div>' +
        '<button class="btn btn-primary" type="submit">' + K.ik('plus') + '<span class="hide-s"> Tambah</span></button></form></section>' +
        '<section class="card reveal"><div class="sum3 two" id="blSum"><div><small>Estimasi total</small><b>' + K.rp(totalBl(false)) + '</b></div><div><small>Sudah dibeli (' + done + ')</small><b class="in">' + K.rp(totalBl(true)) + '</b></div></div>' +
        '<button class="btn btn-accent btn-block" id="blDone" data-act="bl-selesai"' + (done ? '' : ' disabled') + '>' + K.ik('check') + ' Selesai belanja — catat pengeluaran</button></section>' +
        '<section class="card reveal"><div class="card-head"><h3>Daftar</h3><button class="btn btn-ghost btn-sm" data-act="bl-bersih">Hapus yang dicentang</button></div><div class="stack" id="blList">' + blHtml() + '</div></section>';
    },
    bind: function (v) {
      var f = K.$('#blForm', v);
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var nama = f.elements.nama.value.trim();
        if (!nama) { K.goyang(f.elements.nama); f.elements.nama.focus(); return; }
        K.state.belanja.push({ id: K.uid(), nama: nama, qty: Math.max(1, parseInt(f.elements.qty.value, 10) || 1), harga: K.num(f.elements.harga.value), done: false });
        K.save(); f.reset(); f.elements.qty.value = 1; blRefresh(); f.elements.nama.focus();
        var last = K.$('#blList .row:last-child'); if (last) { last.classList.add('flash'); }
      });
    }
  };
  K.aksi['bl-cek'] = function (el) {
    var b = K.state.belanja.filter(function (x) { return x.id === el.dataset.id; })[0]; if (!b) return;
    b.done = !b.done; K.save(); el.classList.toggle('on', b.done); el.setAttribute('aria-pressed', b.done);
    var row = el.closest('.row'); row.classList.toggle('done', b.done);
    setTimeout(blRefresh, K.motion() ? 380 : 0);
  };
  K.aksi['bl-hapus'] = function (el) {
    var row = el.closest('.row'), id = el.dataset.id;
    function hapus() { K.state.belanja = K.state.belanja.filter(function (x) { return x.id !== id; }); K.save(); blRefresh(); }
    if (K.motion()) { row.classList.add('bye'); setTimeout(hapus, 320); } else hapus();
  };
  K.aksi['bl-edit'] = function (el) {
    var b = K.state.belanja.filter(function (x) { return x.id === el.dataset.id; })[0]; if (!b) return;
    K.formModal({
      judul: 'Ubah barang',
      fields: [{ n: 'nama', l: 'Nama barang', v: b.nama, req: true }, { n: 'qty', l: 'Jumlah', t: 'num', min: 1, max: 99, v: b.qty || 1, half: true, req: true }, { n: 'harga', l: 'Harga satuan', t: 'money', v: b.harga, half: true }],
      onSubmit: function (v, api) { b.nama = v.nama; b.qty = v.qty; b.harga = v.harga; K.save(); api.close(); blRefresh(); }
    });
  };
  K.aksi['bl-bersih'] = function () {
    var n = K.state.belanja.filter(function (b) { return b.done; }).length;
    if (!n) { K.toast('Belum ada barang yang dicentang', 'info'); return; }
    K.state.belanja = K.state.belanja.filter(function (b) { return !b.done; }); K.save(); blRefresh(); K.toast(n + ' barang dibersihkan', 'ok');
  };
  K.aksi['bl-selesai'] = function () {
    var dn = K.state.belanja.filter(function (b) { return b.done; }); if (!dn.length) return;
    var nm = dn.map(function (b) { return b.nama; }).join(', ');
    K.formModal({
      judul: 'Catat belanja',
      fields: [{ n: 'jumlah', l: 'Total yang dibayar', t: 'money', v: totalBl(true), req: true, hint: 'Sesuaikan dengan struk kalau harganya beda' },
        { n: 'tgl', l: 'Tanggal', t: 'date', v: K.hari(), half: true }, { n: 'catatan', l: 'Catatan', v: ('Belanja: ' + nm).slice(0, 60), half: true }],
      ok: 'Catat pengeluaran',
      onSubmit: function (v, api) {
        K.tambahTrx({ tipe: 'out', kat: 'belanja', jumlah: v.jumlah, tgl: v.tgl || K.hari(), catatan: v.catatan });
        K.state.belanja = K.state.belanja.filter(function (b) { return !b.done; }); K.save(); api.close(); K.render({ soft: true }); K.toast('Belanja ' + K.rp(v.jumlah) + ' tercatat', 'ok');
      }
    });
  };

  /* =========================================================
     TABUNGAN
     ========================================================= */
  var EMO_GOAL = ['💻', '📱', '🚆', '🎓', '🏍️', '🎧', '✈️', '🎁', '🏠', '💍', '📷', '🐖'];
  K.halaman.tabungan = {
    judul: 'Tabungan', sub: function () { return 'Kumpulkan target impianmu'; },
    render: function () {
      var G = K.state.tabungan, tot = K.totalTabungan();
      var head = '<section class="card hero-mini reveal"><div class="hm-l"><p class="lbl">Total tabungan</p><div class="big" data-count="' + tot + '" data-fmt="rp">' + K.rp(tot) + '</div><p class="muted">' + G.length + ' target aktif</p>' +
        '<div class="btn-row"><button class="btn btn-primary btn-sm" data-act="goal-baru">' + K.ik('plus') + ' Target baru</button></div></div><div class="piggy" aria-hidden="true">🐖</div></section>';
      var cards = G.map(function (g, i) {
        var p = g.target ? Math.min(100, g.terkumpul / g.target * 100) : 0, sisa = Math.max(0, g.target - g.terkumpul);
        return '<div class="goal reveal ' + (i % 2 ? 'alt' : '') + '" data-id="' + g.id + '"><div class="deco" aria-hidden="true"><i class="c c-w"></i><i class="c c-y"></i><i class="c c-p"></i></div>' +
          '<div class="goal-top"><span class="goal-emo">' + E(g.emo || '🐖') + '</span><button class="icon-btn sm ghost" data-act="goal-edit" data-id="' + g.id + '" aria-label="Ubah ' + E(g.nama) + '">' + K.ik('more') + '</button></div>' +
          '<h4>' + E(g.nama) + '</h4><p class="goal-amt"><b>' + K.rp(g.terkumpul) + '</b> <span>dari ' + K.rp(g.target) + '</span></p>' + K.chart.prog(p).replace(' bad', '').replace(' warn', '') +
          '<p class="goal-note">' + (p >= 100 ? '🎉 Target tercapai!' : Math.round(p) + '% · butuh ' + K.rp(sisa) + ' lagi') + '</p>' +
          '<div class="goal-act"><button class="btn btn-primary btn-sm" data-act="goal-setor" data-id="' + g.id + '">' + K.ik('plus') + ' Setor</button><button class="btn btn-white btn-sm" data-act="goal-tarik" data-id="' + g.id + '">Tarik</button></div></div>';
      }).join('');
      return head + (G.length ? '<section class="goals">' + cards + '</section>' : '<section class="card reveal">' + K.kosong('🎯', 'Belum ada target', 'Buat target tabungan: laptop, mudik, atau dana darurat.') + '</section>');
    }
  };
  function goal(id) { return K.state.tabungan.filter(function (g) { return g.id === id; })[0]; }
  K.aksi['goal-baru'] = function () {
    K.formModal({
      judul: 'Target tabungan baru',
      fields: [{ n: 'nama', l: 'Nama target', ph: 'mis. Laptop baru', req: true }, { n: 'target', l: 'Nominal target', t: 'money', req: true }, { n: 'emo', l: 'Ikon', t: 'pick', opts: EMO_GOAL, v: '💻' }],
      onSubmit: function (v, api) { var g = { id: K.uid(), nama: v.nama, emo: v.emo || '🐖', target: v.target, terkumpul: 0 }; K.state.tabungan.push(g); K.save(); K.flash = g.id; api.close(); K.render({ soft: true }); K.toast('Target dibuat. Semangat nabung!', 'ok'); }
    });
  };
  K.aksi['goal-edit'] = function (el) {
    var g = goal(el.dataset.id); if (!g) return;
    K.formModal({
      judul: 'Ubah target',
      fields: [{ n: 'nama', l: 'Nama target', v: g.nama, req: true }, { n: 'target', l: 'Nominal target', t: 'money', v: g.target, req: true }, { n: 'emo', l: 'Ikon', t: 'pick', opts: EMO_GOAL, v: g.emo }],
      hapus: function (api) { K.confirm({ judul: 'Hapus target?', teks: 'Target "' + g.nama + '" dihapus. Saldo utama tidak berubah.', ya: 'Hapus', bahaya: true }).then(function (ok) { if (ok) { K.state.tabungan = K.state.tabungan.filter(function (x) { return x.id !== g.id; }); K.save(); api.close(); K.render({ soft: true }); } }); },
      onSubmit: function (v, api) { g.nama = v.nama; g.target = v.target; g.emo = v.emo || g.emo; K.save(); api.close(); K.render({ soft: true }); }
    });
  };
  K.aksi['goal-setor'] = function (el) {
    var g = goal(el.dataset.id); if (!g) return;
    K.formModal({
      judul: g.emo + ' Setor ke ' + g.nama,
      fields: [{ n: 'jumlah', l: 'Jumlah setoran', t: 'money', req: true, hint: 'Setoran dicatat sebagai pengeluaran "Tabungan" dan mengurangi saldo.' }],
      ok: 'Setor sekarang',
      onSubmit: function (v, api) {
        var sudah = g.terkumpul >= g.target;
        g.terkumpul += v.jumlah; K.tambahTrx({ tipe: 'out', kat: 'tabungan', jumlah: v.jumlah, catatan: 'Setor: ' + g.nama });
        K.save(); K.flash = g.id; api.close(); K.render({ soft: true });
        if (!sudah && g.terkumpul >= g.target) { K.konfeti(); K.toast('Target "' + g.nama + '" tercapai! 🎉', 'ok'); } else K.toast('Berhasil menabung ' + K.rp(v.jumlah), 'ok');
      }
    });
  };
  K.aksi['goal-tarik'] = function (el) {
    var g = goal(el.dataset.id); if (!g) return;
    if (g.terkumpul <= 0) { K.toast('Tabungan ini masih kosong', 'info'); return; }
    K.formModal({
      judul: 'Tarik dari ' + g.nama,
      fields: [{ n: 'jumlah', l: 'Jumlah penarikan', t: 'money', req: true, hint: 'Maksimal ' + K.rp(g.terkumpul) + '. Dicatat sebagai pemasukan.' }],
      ok: 'Tarik',
      onSubmit: function (v, api) {
        if (v.jumlah > g.terkumpul) { K.toast('Melebihi isi tabungan', 'warn'); return; }
        g.terkumpul -= v.jumlah; K.tambahTrx({ tipe: 'in', kat: 'tarik', jumlah: v.jumlah, catatan: 'Tarik: ' + g.nama });
        K.save(); K.flash = g.id; api.close(); K.render({ soft: true }); K.toast('Ditarik ' + K.rp(v.jumlah), 'ok');
      }
    });
  };

  /* =========================================================
     HUTANG & PATUNGAN
     ========================================================= */
  K.ui.hutang = 'hutang';
  K.halaman.hutang = {
    judul: 'Hutang & Patungan', sub: function () { return 'Catatan terpisah, tidak mengubah saldo'; },
    render: function () {
      var H = K.state.hutang, tab = K.ui.hutang, h = 0, p = 0;
      H.forEach(function (x) { if (!x.lunas) { if (x.tipe === 'hutang') h += x.jumlah; else p += x.jumlah; } });
      var list = H.filter(function (x) { return x.tipe === tab; }).sort(function (a, b) { return (a.lunas - b.lunas) || (a.tgl < b.tgl ? 1 : -1); });
      var rows = list.length ? list.map(function (x) {
        return '<div class="row' + (x.lunas ? ' done' : '') + '"><button class="chk' + (x.lunas ? ' on' : '') + '" data-act="ht-lunas" data-id="' + x.id + '" aria-pressed="' + !!x.lunas + '" aria-label="Tandai lunas"><svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></button>' +
          '<div class="row-main" data-act="ht-edit" data-id="' + x.id + '" tabindex="0" role="button"><b>' + E(x.nama) + '</b><small>' + E(x.catatan || (x.tipe === 'hutang' ? 'Pinjaman' : 'Patungan')) + ' · ' + K.labelTglPendek(x.tgl) + (x.lunas ? ' · lunas' : '') + '</small></div><div class="amt ' + (x.tipe === 'hutang' ? 'out' : 'in') + '">' + K.rp(x.jumlah) + '</div></div>';
      }).join('') : K.kosong(tab === 'hutang' ? '🙏' : '🤝', tab === 'hutang' ? 'Tidak ada hutang' : 'Tidak ada piutang', tab === 'hutang' ? 'Bagus! Kamu tidak punya pinjaman yang belum lunas.' : 'Teman yang berhutang atau patungan akan muncul di sini.');
      return '<section class="grid-2 reveal"><div class="stat big-s"><span class="s-ic">🙏</span><div><b class="out" data-count="' + h + '" data-fmt="rp">' + K.rp(h) + '</b><small>Hutang saya (belum lunas)</small></div></div>' +
        '<div class="stat big-s"><span class="s-ic">🤝</span><div><b class="in" data-count="' + p + '" data-fmt="rp">' + K.rp(p) + '</b><small>Teman berhutang ke saya</small></div></div></section>' +
        '<section class="card reveal"><div class="card-head wrap-h">' + K.seg('tab', [{ v: 'hutang', l: 'Hutang saya' }, { v: 'piutang', l: 'Piutang' }], tab) + '<button class="btn btn-primary btn-sm" data-act="ht-baru">' + K.ik('plus') + ' Catat</button></div><div class="stack">' + rows + '</div></section>';
    },
    bind: function (v) { K.$('.seg', v)._on = function (val) { K.ui.hutang = val; K.render({ soft: true }); }; }
  };
  function formHutang(id) {
    var x = id ? K.state.hutang.filter(function (h) { return h.id === id; })[0] : null;
    K.formModal({
      judul: x ? 'Ubah catatan' : 'Catat hutang / patungan',
      fields: [
        { n: 'tipe', l: 'Jenis', t: 'select', opts: [{ v: 'hutang', l: 'Saya berhutang ke teman' }, { v: 'piutang', l: 'Teman berhutang ke saya' }], v: x ? x.tipe : K.ui.hutang },
        { n: 'nama', l: 'Nama teman', ph: 'mis. Rafi', v: x && x.nama, req: true },
        { n: 'jumlah', l: 'Jumlah', t: 'money', v: x && x.jumlah, req: true, half: true },
        { n: 'tgl', l: 'Tanggal', t: 'date', v: x ? x.tgl : K.hari(), half: true },
        { n: 'catatan', l: 'Catatan', ph: 'mis. Patungan makan', v: x && x.catatan }
      ],
      hapus: x ? function (api) { K.state.hutang = K.state.hutang.filter(function (h) { return h.id !== x.id; }); K.save(); api.close(); K.render({ soft: true }); K.toast('Catatan dihapus', 'info'); } : null,
      onSubmit: function (v, api) {
        if (x) { x.tipe = v.tipe; x.nama = v.nama; x.jumlah = v.jumlah; x.tgl = v.tgl || K.hari(); x.catatan = v.catatan; }
        else K.state.hutang.push({ id: K.uid(), tipe: v.tipe, nama: v.nama, jumlah: v.jumlah, tgl: v.tgl || K.hari(), catatan: v.catatan, lunas: false });
        K.ui.hutang = v.tipe; K.save(); api.close(); K.render({ soft: true }); K.toast('Tersimpan', 'ok');
      }
    });
  }
  K.aksi['ht-baru'] = function () { formHutang(); };
  K.aksi['ht-edit'] = function (el) { formHutang(el.dataset.id); };
  K.aksi['ht-lunas'] = function (el) {
    var x = K.state.hutang.filter(function (h) { return h.id === el.dataset.id; })[0]; if (!x) return;
    x.lunas = !x.lunas; K.save(); el.classList.toggle('on', x.lunas);
    if (x.lunas) K.toast(x.nama + ' — lunas 🎉', 'ok');
    setTimeout(function () { K.render({ soft: true }); }, K.motion() ? 420 : 0);
  };
})(window, document);

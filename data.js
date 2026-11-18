/* =========================================================
   data.js — penyimpanan data (localStorage) & fungsi hitung
   Dimuat paling awal. Semua modul berbagi objek global KK.
   ========================================================= */
(function (w) {
  'use strict';
  var KEY = 'dill.kost.v1';
  var KEY_FOTO = 'kostku.foto';
  var K = (w.KK = w.KK || {});
  K.halaman = {}; // diisi oleh hal-*.js
  K.aksi = {};    // handler data-act
  K.ui = {};      // state tampilan sementara (filter, tab)

  /* ---------- Kategori ---------- */
  K.KAT_OUT = [
    { id: 'makan', nama: 'Makan & Minum', emo: '🍜', warna: '#ff8a5b' },
    { id: 'belanja', nama: 'Belanja Harian', emo: '🛒', warna: '#2fbf94' },
    { id: 'kost', nama: 'Sewa Kost', emo: '🏠', warna: '#6c63ff' },
    { id: 'listrik', nama: 'Listrik, Air & Wifi', emo: '💡', warna: '#f2b705' },
    { id: 'transport', nama: 'Transport', emo: '🚌', warna: '#3fa7f5' },
    { id: 'kuliah', nama: 'Kuliah & Tugas', emo: '📚', warna: '#b57bee' },
    { id: 'pulsa', nama: 'Pulsa & Data', emo: '📱', warna: '#ff6fa5' },
    { id: 'laundry', nama: 'Laundry', emo: '🧺', warna: '#4cc9e0' },
    { id: 'hiburan', nama: 'Hiburan & Nongkrong', emo: '🎮', warna: '#ff9f40' },
    { id: 'kesehatan', nama: 'Kesehatan', emo: '💊', warna: '#ef5b6b' },
    { id: 'tabungan', nama: 'Tabungan', emo: '🐖', warna: '#7bc96f' },
    { id: 'lain', nama: 'Lainnya', emo: '📦', warna: '#9aa0b8' }
  ];
  K.KAT_IN = [
    { id: 'kiriman', nama: 'Kiriman Ortu', emo: '💌', warna: '#6c63ff' },
    { id: 'beasiswa', nama: 'Beasiswa', emo: '🎓', warna: '#3fa7f5' },
    { id: 'kerja', nama: 'Kerja / Freelance', emo: '💼', warna: '#2fbf94' },
    { id: 'tarik', nama: 'Tarik Tabungan', emo: '🐖', warna: '#7bc96f' },
    { id: 'lain_in', nama: 'Lainnya', emo: '✨', warna: '#f2b705' }
  ];
  K.kat = function (tipe, id) {
    var L = tipe === 'in' ? K.KAT_IN : K.KAT_OUT;
    for (var i = 0; i < L.length; i++) if (L[i].id === id) return L[i];
    return L[L.length - 1];
  };

  /* ---------- State awal ---------- */
  K.defaultState = function () {
    return {
      v: 1,
      siap: false,
      dibuat: '',
      profil: { nama: '', kampus: '', kost: '', avatar: '😎', kiriman: 0, tglKiriman: 1, saldoAwal: 0 },
      tema: {
        preset: 'indigo', mode: 'terang', bg: 'bulat',
        kustom: { primary: '#4F46BE', accent: '#FFD97A' },
        anim: true, radius: 'bulat', teks: 'm', foto: false
      },
      trx: [], anggaran: {}, tabungan: [], tagihan: [], belanja: [], hutang: []
    };
  };

  /* ---------- Penyimpanan aman (fallback ke memori) ---------- */
  var mem = {};
  function baca(k) { try { return w.localStorage.getItem(k); } catch (e) { return mem[k] || null; } }
  function tulis(k, v) { try { w.localStorage.setItem(k, v); return true; } catch (e) { mem[k] = v; return false; } }
  function hapusKey(k) { try { w.localStorage.removeItem(k); } catch (e) {} delete mem[k]; }

  function gabung(base, src) {
    if (!src || typeof src !== 'object') return base;
    if (Object.keys(base).length === 0 && !Array.isArray(base)) return src;
    for (var k in base) {
      if (!Object.prototype.hasOwnProperty.call(src, k)) continue;
      var b = base[k], s = src[k];
      if (b && typeof b === 'object' && !Array.isArray(b) && s && typeof s === 'object' && !Array.isArray(s)) base[k] = gabung(b, s);
      else if (Array.isArray(b)) base[k] = Array.isArray(s) ? s : b;
      else base[k] = s;
    }
    return base;
  }
  function muat() {
    var st = K.defaultState();
    try {
      var raw = baca(KEY);
      if (raw) st = gabung(st, JSON.parse(raw));
    } catch (e) { console.warn('Data rusak, memakai data baru', e); }
    return st;
  }
  K.state = muat();
  K.save = function () { return tulis(KEY, JSON.stringify(K.state)); };
  K.getFoto = function () { return baca(KEY_FOTO) || ''; };
  K.setFoto = function (s) { if (!s) { hapusKey(KEY_FOTO); return true; } return tulis(KEY_FOTO, s); };
  K.resetSemua = function () { hapusKey(KEY); hapusKey(KEY_FOTO); };
  K.impor = function (obj) {
    if (!obj || typeof obj !== 'object' || !Array.isArray(obj.trx)) throw new Error('Format file tidak dikenali');
    K.state = gabung(K.defaultState(), obj);
    K.state.siap = true;
    K.save();
  };

  K.uid = function () { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); };

  /* ---------- Tanggal ---------- */
  K.BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  K.BULAN_S = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  K.HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  K.HARI_S = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  K.pad = function (n) { return (n < 10 ? '0' : '') + n; };
  K.hari = function (d) { d = d || new Date(); return d.getFullYear() + '-' + K.pad(d.getMonth() + 1) + '-' + K.pad(d.getDate()); };
  K.parse = function (s) { var p = String(s).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); };
  K.ym = function (d) { d = d || new Date(); return d.getFullYear() + '-' + K.pad(d.getMonth() + 1); };
  K.geserBulan = function (ym, n) { var p = ym.split('-'); var d = new Date(+p[0], +p[1] - 1 + n, 1); return K.ym(d); };
  K.labelBulan = function (ym) { var p = ym.split('-'); return K.BULAN[+p[1] - 1] + ' ' + p[0]; };
  K.labelTglPendek = function (s) { var d = K.parse(s); return d.getDate() + ' ' + K.BULAN_S[d.getMonth()]; };
  K.labelTglPanjang = function (s) { var d = K.parse(s); return K.HARI[d.getDay()] + ', ' + d.getDate() + ' ' + K.BULAN[d.getMonth()] + ' ' + d.getFullYear(); };
  K.labelHari = function (s) {
    var h = K.hari(), k = K.hari(new Date(Date.now() - 864e5));
    var d = K.parse(s);
    var t = K.HARI[d.getDay()] + ', ' + d.getDate() + ' ' + K.BULAN_S[d.getMonth()];
    return s === h ? 'Hari ini · ' + t : s === k ? 'Kemarin · ' + t : t;
  };
  K.hariDalamBulan = function (y, m) { return new Date(y, m + 1, 0).getDate(); };

  /* ---------- Format uang ---------- */
  K.rp = function (n) {
    n = Math.round(n || 0);
    var s = Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (n < 0 ? '-' : '') + 'Rp ' + s;
  };
  K.short = function (n) {
    var a = Math.abs(n), s;
    if (a >= 1e9) s = (a / 1e9).toFixed(1).replace('.', ',').replace(',0', '') + ' M';
    else if (a >= 1e6) s = (a / 1e6).toFixed(1).replace('.', ',').replace(',0', '') + ' jt';
    else if (a >= 1e3) s = Math.round(a / 1e3) + ' rb';
    else s = String(Math.round(a));
    return (n < 0 ? '-' : '') + s;
  };

  /* ---------- Query data ---------- */
  K.urut = function (arr) {
    return arr.slice().sort(function (x, y) {
      return x.tgl < y.tgl ? 1 : x.tgl > y.tgl ? -1 : (y.ts || 0) - (x.ts || 0);
    });
  };
  K.trxBulan = function (ym) { return K.state.trx.filter(function (t) { return t.tgl.slice(0, 7) === ym; }); };
  K.total = function (ym) {
    var i = 0, o = 0;
    K.trxBulan(ym).forEach(function (t) { if (t.tipe === 'in') i += t.jumlah; else o += t.jumlah; });
    return { masuk: i, keluar: o };
  };
  K.saldo = function () {
    var s = +K.state.profil.saldoAwal || 0;
    K.state.trx.forEach(function (t) { s += t.tipe === 'in' ? t.jumlah : -t.jumlah; });
    return s;
  };
  K.perKat = function (ym) {
    var m = {};
    K.trxBulan(ym).forEach(function (t) { if (t.tipe === 'out') m[t.kat] = (m[t.kat] || 0) + t.jumlah; });
    return m;
  };
  K.hari7 = function () {
    var out = [], now = new Date(), m = {};
    K.state.trx.forEach(function (t) { if (t.tipe === 'out') m[t.tgl] = (m[t.tgl] || 0) + t.jumlah; });
    for (var i = 6; i >= 0; i--) {
      var dt = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i), k = K.hari(dt);
      out.push({ l: K.HARI_S[dt.getDay()], v: m[k] || 0, hl: i === 0, tgl: k });
    }
    return out;
  };
  K.bulan6 = function (ym) {
    var out = [];
    for (var i = 5; i >= 0; i--) {
      var k = K.geserBulan(ym, -i), t = K.total(k);
      out.push({ k: k, l: K.BULAN_S[+k.slice(5) - 1], masuk: t.masuk, keluar: t.keluar });
    }
    return out;
  };
  K.streak = function () {
    var set = {}, d = new Date(), n = 0;
    K.state.trx.forEach(function (t) { set[t.tgl] = 1; });
    if (!set[K.hari(d)]) d.setDate(d.getDate() - 1);
    while (set[K.hari(d)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  };
  K.totalAnggaran = function () {
    var a = K.state.anggaran, t = 0;
    for (var k in a) t += +a[k] || 0;
    return t;
  };
  K.totalTabungan = function () {
    return K.state.tabungan.reduce(function (s, g) { return s + (+g.terkumpul || 0); }, 0);
  };
  /* kiriman berikutnya & jatah harian */
  K.kiriman = function () {
    var p = K.state.profil, now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var tgl = Math.min(Math.max(+p.tglKiriman || 1, 1), 28);
    var d = new Date(now.getFullYear(), now.getMonth(), tgl);
    if (d <= today) d = new Date(now.getFullYear(), now.getMonth() + 1, tgl);
    return { tgl: d, sisa: Math.max(1, Math.round((d - today) / 864e5)) };
  };
  K.harian = function () { return Math.max(K.saldo(), 0) / K.kiriman().sisa; };
  /* status tagihan bulan ini */
  K.infoTagihan = function (t) {
    var now = new Date(), ym = K.ym(now);
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var tgl = Math.min(Math.max(+t.tgl || 1, 1), K.hariDalamBulan(now.getFullYear(), now.getMonth()));
    var due = new Date(now.getFullYear(), now.getMonth(), tgl);
    var sisa = Math.round((due - today) / 864e5);
    var lunas = !!(t.lunas && t.lunas[ym]);
    return { lunas: lunas, sisa: sisa, due: due, terlambat: !lunas && sisa < 0, ym: ym };
  };

  /* ---------- Transaksi ---------- */
  K.tambahTrx = function (o) {
    var t = {
      id: K.uid(), ts: Date.now(), tipe: o.tipe, kat: o.kat, jumlah: Math.round(+o.jumlah || 0),
      tgl: o.tgl || K.hari(), catatan: (o.catatan || '').trim()
    };
    K.state.trx.push(t);
    K.save();
    return t;
  };
  K.hapusTrx = function (id) {
    K.state.trx = K.state.trx.filter(function (t) { return t.id !== id; });
    K.save();
  };

  /* ---------- Anggaran saran (persen dari uang kiriman) ---------- */
  K.SARAN = { kost: 30, makan: 25, belanja: 8, listrik: 5, transport: 7, kuliah: 6, pulsa: 3, laundry: 3, hiburan: 4, kesehatan: 2, tabungan: 5, lain: 2 };
  K.terapkanSaran = function (dasar) {
    var a = {};
    for (var k in K.SARAN) a[k] = Math.round(dasar * K.SARAN[k] / 100 / 1000) * 1000;
    K.state.anggaran = a;
    K.save();
  };

  /* ---------- Data contoh ---------- */
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  K.isiContoh = function () {
    var old = K.state, s = K.defaultState(), r = rng(2026), now = new Date();
    var ymNow = K.ym(now);
    s.siap = true; s.dibuat = old.dibuat || K.hari();
    s.tema = old.tema;
    s.profil = {
      nama: old.profil.nama || 'Rani', kampus: 'Sistem Informasi', kost: 'Kost Melati',
      avatar: old.profil.avatar || '😎', kiriman: 2000000, tglKiriman: 1, saldoAwal: 0
    };
    function pick(a) { return a[Math.floor(r() * a.length)]; }
    function rb(a, b) { return Math.round((a + r() * (b - a)) / 1000) * 1000; }
    function add(tgl, tipe, kat, jml, cat) {
      s.trx.push({ id: K.uid(), ts: Date.parse(tgl + 'T12:00:00') + s.trx.length, tipe: tipe, kat: kat, jumlah: jml, tgl: tgl, catatan: cat });
    }
    var makan = [['Nasi ayam geprek', 16, 24], ['Warteg', 12, 18], ['Bakso', 13, 17], ['Kopi susu', 12, 20], ['Mie ayam', 12, 16], ['Gado-gado', 12, 15], ['Nasi goreng', 13, 18]];
    var belanja = [['Indomaret: sabun & mie', 35, 80], ['Beli telur & beras', 40, 90], ['Sayur & lauk pasar', 25, 50], ['Galon & gas', 25, 45]];
    var kost0 = null;
    for (var d = new Date(now.getFullYear(), now.getMonth() - 2, 1); d <= now; d.setDate(d.getDate() + 1)) {
      var tgl = K.hari(d), dd = d.getDate(), bulanIni = K.ym(d) === ymNow;
      if (dd === 1) add(tgl, 'in', 'kiriman', 2000000, 'Kiriman bulanan');
      if (dd === 2) add(tgl, 'out', 'kost', 650000, 'Bayar kost');
      if (dd === 5) add(tgl, 'out', 'pulsa', 50000, 'Paket data');
      if (dd === 15 && !bulanIni) add(tgl, 'in', 'kerja', 350000, 'Freelance desain poster');
      if (dd === 25) add(tgl, 'out', 'listrik', 50000, 'Wifi patungan');
      if (dd === 28) add(tgl, 'out', 'listrik', 45000, 'Token listrik');
      var n = r() < .85 ? (r() < .55 ? 2 : 1) : 0;
      for (var i = 0; i < n; i++) { var m = pick(makan); add(tgl, 'out', 'makan', rb(m[1] * 1000, m[2] * 1000), m[0]); }
      if (dd % 5 === 0) { var b = pick(belanja); add(tgl, 'out', 'belanja', rb(b[1] * 1000, b[2] * 1000), b[0]); }
      if (r() < .45) { if (r() < .6) add(tgl, 'out', 'transport', rb(12000, 22000), 'Ojol ke kampus'); else add(tgl, 'out', 'transport', rb(20000, 35000), 'Bensin'); }
      if (dd % 11 === 3) add(tgl, 'out', 'laundry', rb(25000, 40000), 'Laundry kiloan');
      if (dd % 9 === 4) add(tgl, 'out', 'hiburan', rb(30000, 65000), pick(['Nongkrong cafe', 'Nonton bioskop']));
      if (dd % 9 === 6) add(tgl, 'out', 'kuliah', rb(6000, 20000), pick(['Fotokopi modul', 'Print tugas']));
      if (bulanIni && dd === 2) kost0 = s.trx[s.trx.length - 1];
      if (bulanIni && dd === 2 && !kost0) kost0 = null;
    }
    var net = 0; s.trx.forEach(function (t) { net += t.tipe === 'in' ? t.jumlah : -t.jumlah; });
    s.profil.saldoAwal = Math.max(0, 750000 - net);
    var lunasKost = {}; var kt = s.trx.filter(function (t) { return t.kat === 'kost' && t.tgl.slice(0, 7) === ymNow; })[0];
    if (kt) lunasKost[ymNow] = kt.id;
    s.tagihan = [
      { id: K.uid(), nama: 'Sewa kost', jumlah: 650000, tgl: 2, kat: 'kost', lunas: lunasKost },
      { id: K.uid(), nama: 'Wifi patungan', jumlah: 50000, tgl: 25, kat: 'listrik', lunas: {} },
      { id: K.uid(), nama: 'Token listrik', jumlah: 45000, tgl: 28, kat: 'listrik', lunas: {} },
      { id: K.uid(), nama: 'Spotify patungan', jumlah: 20000, tgl: 21, kat: 'hiburan', lunas: {} }
    ];
    s.belanja = [
      { id: K.uid(), nama: 'Beras 5 kg', qty: 1, harga: 70000, done: true },
      { id: K.uid(), nama: 'Telur', qty: 1, harga: 30000, done: true },
      { id: K.uid(), nama: 'Mie instan', qty: 5, harga: 3500, done: false },
      { id: K.uid(), nama: 'Sabun mandi', qty: 1, harga: 12000, done: false },
      { id: K.uid(), nama: 'Minyak goreng', qty: 1, harga: 18000, done: false }
    ];
    s.tabungan = [
      { id: K.uid(), nama: 'Laptop baru', emo: '💻', target: 5000000, terkumpul: 1450000 },
      { id: K.uid(), nama: 'Mudik lebaran', emo: '🚆', target: 1500000, terkumpul: 400000 }
    ];
    s.hutang = [
      { id: K.uid(), tipe: 'hutang', nama: 'Rafi', jumlah: 50000, tgl: K.hari(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 4)), catatan: 'Pinjam buat fotokopi', lunas: false },
      { id: K.uid(), tipe: 'piutang', nama: 'Dina', jumlah: 35000, tgl: K.hari(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2)), catatan: 'Patungan makan malam', lunas: false }
    ];
    K.state = s;
    K.terapkanSaran(2000000);
    K.save();
  };
})(window);

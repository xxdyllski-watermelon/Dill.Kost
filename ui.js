/* =========================================================
   ui.js — komponen UI bersama: toast, modal, form, grafik SVG, animasi angka
   ========================================================= */
(function (w, d) {
  'use strict';
  var K = w.KK;
  var E = (K.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  });
  K.$ = function (s, r) { return (r || d).querySelector(s); };
  K.$$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  K.num = function (v) { return parseInt(String(v == null ? '' : v).replace(/\D/g, ''), 10) || 0; };
  K.fmtInput = function (n) { n = Math.round(+n || 0); return n ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''; };
  K.motion = function () {
    return K.state.tema.anim !== false && !(w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches);
  };

  /* ---------- Toast ---------- */
  K.toast = function (msg, tipe, opt) {
    opt = opt || {};
    var root = d.getElementById('toastRoot'), t = d.createElement('div');
    var ic = { ok: '✅', warn: '⚠️', bad: '⛔', info: '💡' }[tipe || 'info'];
    t.className = 'toast ' + (tipe || 'info');
    t.innerHTML = '<span class="t-ic">' + ic + '</span><span class="t-msg">' + E(msg) + '</span>' +
      (opt.aksi ? '<button class="t-act" type="button">' + E(opt.aksi) + '</button>' : '');
    root.appendChild(t);
    var tm = setTimeout(tutup, opt.ms || 3400);
    function tutup() { clearTimeout(tm); t.classList.add('out'); setTimeout(function () { t.remove(); }, 380); }
    t.addEventListener('click', function (e) {
      if (e.target.closest('.t-act') && opt.fn) opt.fn();
      tutup();
    });
  };

  /* ---------- Modal / bottom-sheet ---------- */
  K.modals = [];
  K.modal = function (o) {
    var wrap = d.createElement('div'), closed = false;
    wrap.className = 'modal-wrap';
    wrap.innerHTML = '<div class="scrim"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="' + E(o.judul || '') + '">' +
      '<div class="sheet-head"><h3>' + E(o.judul || '') + '</h3><button class="icon-btn sm" type="button" data-close aria-label="Tutup">' + K.ik('x') + '</button></div>' +
      '<div class="sheet-body">' + o.body + '</div></div>';
    d.getElementById('modalRoot').appendChild(wrap);
    d.body.classList.add('noscroll');
    var api = {
      el: wrap.querySelector('.sheet-body'),
      close: function (v) {
        if (closed) return; closed = true;
        K.modals = K.modals.filter(function (m) { return m !== api; });
        wrap.classList.add('closing');
        setTimeout(function () {
          wrap.remove();
          if (!d.querySelector('.modal-wrap')) d.body.classList.remove('noscroll');
          if (o.onClose) o.onClose(v);
        }, K.motion() ? 260 : 0);
      }
    };
    K.modals.push(api);
    wrap.addEventListener('click', function (e) {
      if (e.target.classList.contains('scrim') || e.target.closest('[data-close]')) api.close();
    });
    K.initSegs(api.el);
    if (o.onOpen) o.onOpen(api);
    var f = api.el.querySelector('[autofocus],input:not([type=hidden]):not([type=radio]),select');
    if (f && w.innerWidth > 700) setTimeout(function () { try { f.focus({ preventScroll: true }); } catch (e) {} }, 350);
    return api;
  };
  K.confirm = function (o) {
    return new Promise(function (res) {
      var ok = false;
      K.modal({
        judul: o.judul || 'Yakin?',
        body: '<p class="muted conf-txt">' + E(o.teks || '') + '</p><div class="form-actions"><button class="btn btn-ghost" type="button" data-close>Batal</button><button class="btn ' + (o.bahaya ? 'btn-danger' : 'btn-primary') + '" type="button" data-ok>' + E(o.ya || 'Ya') + '</button></div>',
        onOpen: function (a) { a.el.querySelector('[data-ok]').addEventListener('click', function () { ok = true; res(true); a.close(); }); },
        onClose: function () { if (!ok) res(false); }
      });
    });
  };

  /* ---------- Form modal generik ---------- */
  K.formModal = function (o) {
    var h = '<form class="form" autocomplete="off" novalidate>';
    o.fields.forEach(function (f) {
      var v = f.v == null ? '' : f.v, id = 'f_' + f.n, inp = '';
      if (f.t === 'money') inp = '<div class="money-wrap"><em>Rp</em><input class="inp" id="' + id + '" name="' + f.n + '" inputmode="numeric" data-money placeholder="0" value="' + K.fmtInput(v) + '"></div>';
      else if (f.t === 'select') inp = '<select class="inp" id="' + id + '" name="' + f.n + '">' + f.opts.map(function (x) { return '<option value="' + E(x.v) + '"' + (String(x.v) === String(v) ? ' selected' : '') + '>' + E(x.l) + '</option>'; }).join('') + '</select>';
      else if (f.t === 'pick') inp = '<div class="pick">' + f.opts.map(function (x) { return '<label class="pk"><input type="radio" name="' + f.n + '" value="' + E(x) + '"' + (String(x) === String(v) ? ' checked' : '') + '><span>' + E(x) + '</span></label>'; }).join('') + '</div>';
      else if (f.t === 'num') inp = '<input class="inp" id="' + id + '" name="' + f.n + '" type="number" inputmode="numeric" min="' + (f.min == null ? 1 : f.min) + '" max="' + (f.max == null ? 999 : f.max) + '" value="' + E(v) + '">';
      else if (f.t === 'date') inp = '<input class="inp" id="' + id + '" name="' + f.n + '" type="date" value="' + E(v) + '">';
      else inp = '<input class="inp" id="' + id + '" name="' + f.n + '" type="text" maxlength="' + (f.max || 60) + '" placeholder="' + E(f.ph || '') + '" value="' + E(v) + '">';
      h += '<div class="field' + (f.half ? ' half' : '') + '"><label class="lb" for="' + id + '">' + E(f.l) + '</label>' + inp + (f.hint ? '<small class="hint">' + E(f.hint) + '</small>' : '') + '</div>';
    });
    h += '<div class="form-actions">' + (o.hapus ? '<button type="button" class="btn btn-danger-soft" data-del>' + K.ik('trash') + ' Hapus</button>' : '') + '<button class="btn btn-primary grow" type="submit">' + E(o.ok || 'Simpan') + '</button></div></form>';
    return K.modal({
      judul: o.judul, body: h,
      onOpen: function (api) {
        var form = api.el.querySelector('form');
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var vals = {}, bad = null;
          o.fields.forEach(function (f) {
            var el = form.elements[f.n], val;
            if (f.t === 'pick') { var c = form.querySelector('input[name="' + f.n + '"]:checked'); val = c ? c.value : ''; }
            else if (f.t === 'money') val = K.num(el.value);
            else if (f.t === 'num') val = parseInt(el.value, 10) || 0;
            else val = (el.value || '').trim();
            vals[f.n] = val;
            if (f.req && !bad && (!val || (f.t === 'num' && (val < (f.min == null ? 1 : f.min) || val > (f.max == null ? 999 : f.max))))) bad = el;
          });
          if (bad) { K.goyang(bad.closest('.field')); try { bad.focus(); } catch (er) {} K.toast('Lengkapi data yang wajib diisi', 'warn'); return; }
          o.onSubmit(vals, api);
        });
        var del = form.querySelector('[data-del]');
        if (del) del.addEventListener('click', function () { o.hapus(api); });
        if (o.onOpen) o.onOpen(api, form);
      }
    });
  };
  K.goyang = function (el) { if (!el) return; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); };

  /* ---------- Segmented control dengan indikator bergeser ---------- */
  K.initSegs = function (root) {
    K.$$('.seg', root || d).forEach(function (s) {
      if (s._init) return; s._init = true;
      var ind = s.querySelector('.seg-ind');
      if (!ind) { ind = d.createElement('i'); ind.className = 'seg-ind'; s.appendChild(ind); }
      function place(anim) {
        var on = s.querySelector('button.on') || s.querySelector('button');
        if (!on) return;
        if (!anim) ind.style.transition = 'none';
        ind.style.width = on.offsetWidth + 'px';
        ind.style.transform = 'translateX(' + on.offsetLeft + 'px)';
        if (!anim) { void ind.offsetWidth; ind.style.transition = ''; }
      }
      s._place = place; place(false);
      s.addEventListener('click', function (e) {
        var b = e.target.closest('button');
        if (!b || !s.contains(b) || b.classList.contains('on')) return;
        K.$$('button', s).forEach(function (x) { x.classList.toggle('on', x === b); });
        s.dataset.val = b.dataset.v; place(true);
        if (s._on) s._on(b.dataset.v);
      });
      var cur = s.querySelector('button.on'); s.dataset.val = cur ? cur.dataset.v : '';
    });
  };
  w.addEventListener('resize', function () { K.$$('.seg').forEach(function (s) { if (s._place) s._place(false); }); });
  K.seg = function (nama, opts, aktif, cls) {
    return '<div class="seg ' + (cls || '') + '" data-seg="' + nama + '">' + opts.map(function (o) {
      return '<button type="button" data-v="' + E(o.v) + '" class="' + (String(o.v) === String(aktif) ? 'on' : '') + '">' + E(o.l) + '</button>';
    }).join('') + '<i class="seg-ind"></i></div>';
  };

  /* ---------- Hitung naik angka ---------- */
  K.countUp = function (root, soft) {
    K.$$('[data-count]', root).forEach(function (el) {
      var to = +el.dataset.count || 0, f = el.dataset.fmt;
      var fmt = function (v) { return f === 'rp' ? K.rp(v) : f === 'short' ? K.short(v) : Math.round(v) + (el.dataset.suf || ''); };
      if (soft || !K.motion() || to === 0) { el.textContent = fmt(to); return; }
      var t0 = null, dur = 950;
      function step(t) {
        if (!t0) t0 = t;
        var p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 4);
        el.textContent = fmt(to * e);
        if (p < 1) requestAnimationFrame(step);
      }
      el.textContent = fmt(0);
      requestAnimationFrame(step);
    });
  };

  /* ---------- Efek riak pada tombol ---------- */
  d.addEventListener('pointerdown', function (e) {
    var b = e.target.closest && e.target.closest('.btn,.rip');
    if (!b || !K.motion()) return;
    var r = b.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2, sp = d.createElement('span');
    sp.className = 'ripple';
    sp.style.cssText = 'width:' + s + 'px;height:' + s + 'px;left:' + (e.clientX - r.left - s / 2) + 'px;top:' + (e.clientY - r.top - s / 2) + 'px';
    b.appendChild(sp);
    setTimeout(function () { sp.remove(); }, 700);
  });

  /* ---------- Input uang: otomatis titik ribuan ---------- */
  d.addEventListener('input', function (e) {
    var el = e.target;
    if (el && el.matches && el.matches('[data-money]')) {
      var n = K.num(el.value);
      el.value = n ? K.fmtInput(n) : '';
    }
  });

  /* ---------- Avatar & gambar ---------- */
  K.avatar = function () {
    var a = K.state.profil.avatar || '😎';
    return a.indexOf('data:') === 0 ? '<img src="' + a + '" alt="Foto profil">' : '<span>' + E(a) + '</span>';
  };
  K.resizeImg = function (file, max, q, kotak, cb) {
    var fr = new FileReader();
    fr.onload = function () {
      var im = new Image();
      im.onload = function () {
        var c = d.createElement('canvas'), sx = 0, sy = 0, sw = im.width, sh = im.height;
        if (kotak) { var m = Math.min(sw, sh); sx = (sw - m) / 2; sy = (sh - m) / 2; sw = sh = m; }
        var sc = Math.min(1, max / Math.max(sw, sh));
        c.width = Math.round(sw * sc); c.height = Math.round(sh * sc);
        c.getContext('2d').drawImage(im, sx, sy, sw, sh, 0, 0, c.width, c.height);
        cb(c.toDataURL('image/jpeg', q));
      };
      im.onerror = function () { cb(null); };
      im.src = fr.result;
    };
    fr.onerror = function () { cb(null); };
    fr.readAsDataURL(file);
  };
  K.unduh = function (nama, isi, mime) {
    var blob = new Blob([isi], { type: mime || 'text/plain' }), a = d.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = nama; d.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };

  /* ---------- Baris transaksi (dipakai di beberapa halaman) ---------- */
  K.trxRow = function (t) {
    var k = K.kat(t.tipe, t.kat);
    return '<div class="row" data-act="trx-edit" data-id="' + t.id + '" tabindex="0" role="button">' +
      '<span class="emo" style="--c:' + k.warna + '">' + k.emo + '</span>' +
      '<div class="row-main"><b>' + E(t.catatan || k.nama) + '</b><small>' + E(k.nama) + ' · ' + K.labelTglPendek(t.tgl) + '</small></div>' +
      '<div class="amt ' + t.tipe + '">' + (t.tipe === 'in' ? '+' : '−') + K.rp(t.jumlah) + '</div></div>';
  };
  K.kosong = function (emo, judul, teks, tombol) {
    return '<div class="empty"><div class="big">' + emo + '</div><h4>' + E(judul) + '</h4><p>' + E(teks) + '</p>' + (tombol || '') + '</div>';
  };

  /* ---------- Konfeti kecil ---------- */
  K.konfeti = function () {
    if (!K.motion()) return;
    var em = ['🎉', '✨', '💰', '⭐', '🎊'], wrap = d.createElement('div');
    wrap.className = 'confetti';
    for (var i = 0; i < 26; i++) {
      var s = d.createElement('span');
      s.textContent = em[i % em.length];
      s.style.cssText = '--x:' + (Math.random() * 100) + 'vw;--dx:' + ((Math.random() - .5) * 160) + 'px;--d:' + (Math.random() * .6) + 's;--t:' + (1.6 + Math.random() * 1.4) + 's;--s:' + (.9 + Math.random() * 1.1) + 'rem';
      wrap.appendChild(s);
    }
    d.body.appendChild(wrap);
    setTimeout(function () { wrap.remove(); }, 3400);
  };

  /* =========================================================
     Grafik SVG ringan (tanpa library, jalan offline)
     ========================================================= */
  var C = (K.chart = {});
  C.bars = function (data) {
    var n = data.length, slot = 46, W = n * slot, base = 150, top = 24, H = 176;
    var max = Math.max.apply(null, data.map(function (x) { return x.v; }).concat([1]));
    var s = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Grafik batang pengeluaran">';
    for (var g = 0; g < 3; g++) { var y = base - (base - top) * g / 2; s += '<line class="grid" x1="0" x2="' + W + '" y1="' + y + '" y2="' + y + '"/>'; }
    data.forEach(function (x, i) {
      var h = x.v > 0 ? Math.max(x.v / max * (base - top), 5) : 3, bx = i * slot + 9, by = base - h;
      s += '<g class="bc' + (x.hl ? ' hl' : '') + '" style="--i:' + i + '"><rect x="' + bx + '" y="' + by + '" width="' + (slot - 18) + '" height="' + h + '" rx="9"><title>' + E(x.l) + ': ' + K.rp(x.v) + '</title></rect>' +
        '<text class="val" x="' + (bx + (slot - 18) / 2) + '" y="' + (by - 7) + '" text-anchor="middle">' + (x.v ? K.short(x.v) : '') + '</text>' +
        '<text class="lbl" x="' + (bx + (slot - 18) / 2) + '" y="' + (H - 6) + '" text-anchor="middle">' + E(x.l) + '</text></g>';
    });
    return s + '</svg>';
  };
  C.grup = function (data) {
    var n = data.length, slot = 62, W = n * slot, base = 150, top = 20, H = 176;
    var max = Math.max.apply(null, data.reduce(function (a, x) { return a.concat([x.masuk, x.keluar]); }, [1]));
    var s = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Grafik pemasukan dan pengeluaran 6 bulan">';
    for (var g = 0; g < 3; g++) { var y = base - (base - top) * g / 2; s += '<line class="grid" x1="0" x2="' + W + '" y1="' + y + '" y2="' + y + '"/>'; }
    data.forEach(function (x, i) {
      var hm = x.masuk > 0 ? Math.max(x.masuk / max * (base - top), 4) : 3, hk = x.keluar > 0 ? Math.max(x.keluar / max * (base - top), 4) : 3, bx = i * slot + 10;
      s += '<g class="bc g" style="--i:' + i + '"><rect class="m" x="' + bx + '" y="' + (base - hm) + '" width="20" height="' + hm + '" rx="7"><title>Masuk ' + E(x.l) + ': ' + K.rp(x.masuk) + '</title></rect>' +
        '<rect class="k" x="' + (bx + 23) + '" y="' + (base - hk) + '" width="20" height="' + hk + '" rx="7"><title>Keluar ' + E(x.l) + ': ' + K.rp(x.keluar) + '</title></rect>' +
        '<text class="lbl" x="' + (bx + 21.5) + '" y="' + (H - 6) + '" text-anchor="middle">' + E(x.l) + '</text></g>';
    });
    return s + '</svg>';
  };
  C.donut = function (items) {
    var tot = items.reduce(function (a, x) { return a + x.v; }, 0), r = 15.915, off = 0;
    var s = '<svg class="donut" viewBox="0 0 42 42" role="img" aria-label="Diagram donat kategori"><circle class="rg-bg" cx="21" cy="21" r="' + r + '"/>';
    if (tot > 0) items.forEach(function (x, i) {
      var len = x.v / tot * 100, gap = items.length > 1 ? .9 : 0, L = Math.max(len - gap, .3);
      s += '<circle class="dn" cx="21" cy="21" r="' + r + '" pathLength="100" stroke="' + x.c + '" stroke-dasharray="' + L + ' ' + (100 - L) + '" stroke-dashoffset="' + (-off) + '" transform="rotate(-90 21 21)" style="--i:' + i + '"><title>' + E(x.l) + ': ' + K.rp(x.v) + '</title></circle>';
      off += len;
    });
    return s + '</svg>';
  };
  C.ring = function (pct, label) {
    pct = Math.max(0, Math.min(100, pct || 0));
    var r = 15.915, cls = pct >= 100 ? ' bad' : pct >= 80 ? ' warn' : '';
    return '<div class="ring' + cls + '"><svg viewBox="0 0 42 42" aria-hidden="true"><circle class="rg-bg" cx="21" cy="21" r="' + r + '"/>' +
      (pct > 0 ? '<circle class="rg-fg" cx="21" cy="21" r="' + r + '" pathLength="100" stroke-dasharray="' + pct + ' 100" transform="rotate(-90 21 21)"/>' : '') +
      '</svg><span>' + (label || Math.round(pct) + '%') + '</span></div>';
  };
  C.prog = function (pct, warna) {
    pct = Math.max(0, Math.min(100, pct || 0));
    return '<div class="prog' + (pct >= 100 ? ' bad' : pct >= 80 ? ' warn' : '') + '"><i style="--w:' + pct + '%' + (warna ? ';--c:' + warna : '') + '"></i></div>';
  };
})(window, document);

/* =========================================================
   tema.js — mesin tema: warna, mode terang/gelap, latar belakang
   Dimuat di <head> supaya tema langsung terpasang (tanpa kedip).
   ========================================================= */
(function (w, d) {
  'use strict';
  var K = w.KK;
  var T = (K.tema = {});

  T.PRESET = [
    { id: 'indigo', nama: 'Indigo Pastel', primary: '#4F46BE', accent: '#FFD97A', accent2: '#FF8FB1', warm: '#FFE7CC', bg: '#E3E4FF' },
    { id: 'mint', nama: 'Mint Segar', primary: '#12907A', accent: '#FFD27A', accent2: '#FF9C8A', warm: '#D9F5E9', bg: '#DDF5EC' },
    { id: 'sunset', nama: 'Sunset', primary: '#E4572E', accent: '#FFC857', accent2: '#7C5CFF', warm: '#FFE3D3', bg: '#FFEBDF' },
    { id: 'rose', nama: 'Rose Candy', primary: '#C2358A', accent: '#FFD6A5', accent2: '#6C63FF', warm: '#FFDFEE', bg: '#FBE5F1' },
    { id: 'ocean', nama: 'Ocean', primary: '#1D70D6', accent: '#7DE3D0', accent2: '#FFB86B', warm: '#D9EDFF', bg: '#DDEBFF' },
    { id: 'forest', nama: 'Hutan', primary: '#2F6B3A', accent: '#F2D16B', accent2: '#E98A6B', warm: '#EBF2D3', bg: '#E4EFDA' },
    { id: 'grape', nama: 'Anggur', primary: '#7A3FD1', accent: '#FFC4E1', accent2: '#4CC9A0', warm: '#EEDFFF', bg: '#EDE4FB' },
    { id: 'mocha', nama: 'Mocha', primary: '#7A4E36', accent: '#F4C58B', accent2: '#8FB996', warm: '#F6E6D6', bg: '#F1E7DD' },
    { id: 'mono', nama: 'Monokrom', primary: '#2B2B3A', accent: '#FFD43B', accent2: '#FF6B6B', warm: '#EFEBE3', bg: '#EDEDF0' }
  ];
  T.BG = [
    { id: 'bulat', nama: 'Bulatan' },
    { id: 'gradien', nama: 'Gradien' },
    { id: 'aurora', nama: 'Aurora' },
    { id: 'gelombang', nama: 'Gelombang' },
    { id: 'titik', nama: 'Titik-titik' },
    { id: 'polos', nama: 'Polos' },
    { id: 'foto', nama: 'Foto sendiri' }
  ];

  /* ---------- util warna ---------- */
  function rgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.replace(/(.)/g, '$1$1'); var n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function hex(c) { return '#' + c.map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }).join(''); }
  function mix(a, b, t) { var x = rgb(a), y = rgb(b); return hex([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]); }
  function rgba(h, a) { var c = rgb(h); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function lum(h) { var c = rgb(h).map(function (v) { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; }
  T.mix = mix; T.rgba = rgba;

  T.paletAktif = function () {
    var t = K.state.tema, p;
    if (t.preset === 'kustom') {
      var c = t.kustom;
      p = { primary: c.primary, accent: c.accent, accent2: mix(c.accent, '#ff5c8a', .55), warm: mix(c.accent, '#ffffff', .72), bg: mix(c.primary, '#ffffff', .87) };
    } else {
      p = T.PRESET.filter(function (x) { return x.id === t.preset; })[0] || T.PRESET[0];
    }
    return p;
  };
  T.gelap = function () {
    var m = K.state.tema.mode;
    return m === 'gelap' || (m === 'auto' && w.matchMedia && w.matchMedia('(prefers-color-scheme: dark)').matches);
  };

  /* ---------- terapkan ke CSS variables ---------- */
  T.apply = function (animasi) {
    var t = K.state.tema, p = T.paletAktif(), dark = T.gelap(), root = d.documentElement, v = {};
    if (animasi && t.anim !== false) {
      root.classList.add('theme-anim');
      clearTimeout(T._tm);
      T._tm = setTimeout(function () { root.classList.remove('theme-anim'); }, 800);
    }
    v['--primary'] = p.primary;
    v['--primary-d'] = mix(p.primary, '#000000', .2);
    v['--on-primary'] = lum(p.primary) > .55 ? '#1b1a2e' : '#ffffff';
    v['--accent'] = p.accent;
    v['--accent2'] = p.accent2;
    v['--on-accent'] = '#2a2540';
    if (!dark) {
      v['--bg'] = p.bg;
      v['--surface'] = '#ffffff';
      v['--surface2'] = mix(p.primary, '#ffffff', .94);
      v['--primary-soft'] = mix(p.primary, '#ffffff', .86);
      v['--primary-ink'] = p.primary;
      v['--warm'] = p.warm;
      v['--on-warm'] = '#2a2540';
      v['--text'] = mix(p.primary, '#0d0b1e', .82);
      v['--muted'] = mix('#76738f', p.primary, .18);
      v['--line'] = rgba(p.primary, .12);
      v['--shadow'] = '0 14px 34px -16px ' + rgba(p.primary, .45);
      v['--blob1'] = mix(p.primary, '#ffffff', .80);
      v['--blob2'] = mix(p.accent, '#ffffff', .50);
      v['--blob3'] = mix(p.accent2, '#ffffff', .62);
      v['--bg-a'] = rgba(p.bg, .35);
    } else {
      v['--bg'] = mix(p.primary, '#08080f', .10);
      v['--surface'] = mix(p.primary, '#11111d', .14);
      v['--surface2'] = mix(p.primary, '#11111d', .24);
      v['--primary-soft'] = mix(p.primary, '#11111d', .32);
      v['--primary-ink'] = mix(p.primary, '#ffffff', .5);
      v['--warm'] = mix(p.accent, '#14131f', .80);
      v['--on-warm'] = '#f6efe2';
      v['--text'] = '#efedfb';
      v['--muted'] = '#a09db9';
      v['--line'] = 'rgba(255,255,255,.09)';
      v['--shadow'] = '0 14px 34px -16px rgba(0,0,0,.7)';
      v['--blob1'] = mix(p.primary, '#08080f', .55);
      v['--blob2'] = mix(p.accent, '#08080f', .82);
      v['--blob3'] = mix(p.accent2, '#08080f', .84);
      v['--bg-a'] = 'rgba(8,8,15,.55)';
    }
    v['--aur1'] = p.primary; v['--aur2'] = p.accent; v['--aur3'] = p.accent2;
    var rad = { bulat: [28, 18], sedang: [20, 13], tegas: [10, 7] }[t.radius] || [28, 18];
    v['--r'] = rad[0] + 'px'; v['--r-s'] = rad[1] + 'px';
    for (var k in v) root.style.setProperty(k, v[k]);
    root.setAttribute('data-mode', dark ? 'dark' : 'light');
    root.setAttribute('data-teks', t.teks || 'm');
    root.setAttribute('data-anim', t.anim === false ? 'off' : 'on');
    root.style.colorScheme = dark ? 'dark' : 'light';
    var meta = d.getElementById('metaTheme');
    if (meta) meta.setAttribute('content', v['--bg']);
  };

  /* ---------- latar belakang (butuh DOM) ---------- */
  T.applyBg = function () {
    var t = K.state.tema, bg = d.getElementById('bg');
    d.documentElement.setAttribute('data-bg', t.bg || 'bulat');
    if (!bg) return;
    var foto = bg.querySelector('.bg-foto');
    var src = t.bg === 'foto' ? K.getFoto() : '';
    foto.style.backgroundImage = src ? 'url("' + src + '")' : 'none';
    foto.classList.toggle('ada', !!src);
  };
  T.set = function (patch, animasi) {
    var t = K.state.tema;
    for (var k in patch) t[k] = patch[k];
    K.save();
    T.apply(animasi !== false);
    T.applyBg();
  };
  T.acak = function () {
    var p = T.PRESET[Math.floor(Math.random() * T.PRESET.length)];
    var bgs = T.BG.filter(function (b) { return b.id !== 'foto'; });
    T.set({ preset: p.id, bg: bgs[Math.floor(Math.random() * bgs.length)].id });
  };

  T.apply(false);
  if (w.matchMedia) {
    var mq = w.matchMedia('(prefers-color-scheme: dark)');
    var f = function () { if (K.state.tema.mode === 'auto') T.apply(true); };
    if (mq.addEventListener) mq.addEventListener('change', f); else if (mq.addListener) mq.addListener(f);
  }
})(window, document);

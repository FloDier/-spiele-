'use strict';
/* Spiele für Kinder (4–7 Jahre): ohne Lesen spielbar, große Flächen, Sprachausgabe, kein Verlieren */
const KID = (() => {
  let ac;
  function ctx() {
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; } }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  function tone(f, d = 0.15, type = 'sine', when = 0, vol = 0.2) {
    const a = ctx(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain(), t = a.currentTime + when;
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + d + 0.02);
  }
  const sfx = {
    ok() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.2, 'triangle', i * 0.08)); },
    no() { tone(260, 0.18, 'sine', 0, 0.15); tone(200, 0.25, 'sine', 0.12, 0.15); },
    tap() { tone(700, 0.07, 'triangle', 0, 0.12); },
    pop() {
      const a = ctx(); if (!a) return;
      const n = Math.floor(a.sampleRate * 0.12), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
      const s = a.createBufferSource(), g = a.createGain(); s.buffer = b; g.gain.value = 0.5;
      s.connect(g).connect(a.destination); s.start();
    },
  };
  function speak(t) {
    try {
      const s = window.speechSynthesis; if (!s) return;
      s.cancel();
      const u = new SpeechSynthesisUtterance(t);
      u.lang = 'de-DE'; u.rate = 0.95; u.pitch = 1.15;
      const v = s.getVoices().find(v => v.lang && v.lang.toLowerCase().startsWith('de'));
      if (v) u.voice = v;
      s.speak(u);
    } catch {}
  }
  function hush() { try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch {} }
  function confetti() {
    const E = ['🎉', '⭐', '🌟', '🎈', '💖', '✨'];
    for (let i = 0; i < 26; i++) {
      const s = h('span', { class: 'confetti', style: { left: Math.random() * 96 + 'vw', animationDelay: Math.random() * 0.5 + 's', fontSize: 22 + Math.random() * 26 + 'px' } }, E[i % E.length]);
      document.body.append(s); setTimeout(() => s.remove(), 3000);
    }
  }
  function wiggle(el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
  const PRAISE = ['Super!', 'Toll gemacht!', 'Klasse!', 'Prima!', 'Wunderbar!', 'Juhu!', 'Spitze!'];
  const praise = () => PRAISE[Math.floor(Math.random() * PRAISE.length)];
  const NUM = ['null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn'];
  const ITEMS = [['🐶', 'Hund'], ['🐱', 'Katze'], ['🐭', 'Maus'], ['🐰', 'Hase'], ['🦊', 'Fuchs'], ['🐻', 'Bär'], ['🐼', 'Panda'], ['🐸', 'Frosch'],
    ['🐵', 'Affe'], ['🐔', 'Huhn'], ['🐧', 'Pinguin'], ['🦁', 'Löwe'], ['🐮', 'Kuh'], ['🐷', 'Schwein'], ['🐘', 'Elefant'], ['🦒', 'Giraffe'],
    ['🐢', 'Schildkröte'], ['🐟', 'Fisch'], ['🦋', 'Schmetterling'], ['🐞', 'Marienkäfer'], ['🍎', 'Apfel'], ['🍌', 'Banane'], ['🍓', 'Erdbeere'],
    ['🚗', 'Auto'], ['🚂', 'Zug'], ['✈️', 'Flugzeug'], ['⚽', 'Ball'], ['🌻', 'Blume'], ['⭐', 'Stern'], ['🦄', 'Einhorn'], ['🐳', 'Wal'], ['🦕', 'Dino']];
  const pickItems = n => shuffle(ITEMS.slice()).slice(0, n);
  return { sfx, tone, speak, hush, confetti, wiggle, praise, NUM, ITEMS, pickItems };
})();

/* ---------- Memory ---------- */
registerGame({
  id: 'k-memory', kids: true, timed: false, name: 'Memory', icon: '🐶', desc: 'Finde die Bilderpaare',
  mount(view, api) {
    let pairs = Store.get('k.mem', 3), cards, open = [], lock = false, found = 0, timers = [];
    const root = h('div', { class: 'kid' }); view.append(root);
    const later = (f, ms) => timers.push(setTimeout(f, ms));

    function actions() {
      api.setActions([
        { label: '🐣 Leicht', on: pairs === 3, onclick: () => setLvl(3) },
        { label: '🐥 Mittel', on: pairs === 6, onclick: () => setLvl(6) },
        { label: '🦁 Schwer', on: pairs === 8, onclick: () => setLvl(8) },
        { label: '🔊', onclick: () => KID.speak('Finde zwei gleiche Bilder!') },
      ]);
    }
    function setLvl(p) { pairs = p; Store.set('k.mem', p); start(); }
    function start() {
      timers.forEach(clearTimeout); timers = [];
      const pick = KID.pickItems(pairs);
      cards = shuffle(pick.concat(pick).map(it => ({ it, up: false, done: false })));
      open = []; found = 0; lock = false; actions(); render();
      KID.speak('Finde zwei gleiche Bilder!');
    }
    function render() {
      root.innerHTML = '';
      const cols = pairs === 3 ? 3 : 4;
      const grid = h('div', { class: 'mem-grid', style: { gridTemplateColumns: `repeat(${cols},1fr)`, maxWidth: Math.min(view.clientWidth - 24, (view.clientHeight - 30) * cols / Math.ceil(cards.length / cols)) + 'px' } });
      cards.forEach((c, i) => grid.append(h('button', { class: 'mem-card' + (c.up || c.done ? ' up' : '') + (c.done ? ' done' : ''), onclick: () => flip(i) },
        c.up || c.done ? c.it[0] : '')));
      root.append(grid);
      api.setStatus(`⭐ ${found} / ${pairs}`);
    }
    function flip(i) {
      const c = cards[i];
      if (lock || c.up || c.done) return;
      c.up = true; open.push(i); KID.sfx.tap(); render();
      if (open.length < 2) return;
      const [a, b] = open; open = [];
      if (cards[a].it === cards[b].it) {
        cards[a].done = cards[b].done = true; found++;
        later(() => { KID.sfx.ok(); KID.speak(cards[a].it[1] + '!'); render(); }, 250);
        if (found === pairs) {
          recordGame('k-memory', true);
          later(() => { KID.confetti(); KID.speak(KID.praise() + ' Alle Paare gefunden!'); }, 1100);
          later(() => root.append(h('button', { class: 'kid-big', onclick: start }, '🔄 Nochmal')), 1600);
        }
      } else {
        lock = true;
        later(() => { cards[a].up = cards[b].up = false; lock = false; render(); }, 1200);
      }
    }
    const onResize = () => render();
    window.addEventListener('resize', onResize);
    start();
    return () => { timers.forEach(clearTimeout); KID.hush(); window.removeEventListener('resize', onResize); };
  },
});

/* ---------- Zählen ---------- */
registerGame({
  id: 'k-zaehlen', kids: true, timed: false, name: 'Zählen', icon: '🔢', desc: 'Wie viele Tiere siehst du?',
  mount(view, api) {
    let max = Store.get('k.count', 5), n, item, counted, stars = 0, busy = false, timers = [];
    const root = h('div', { class: 'kid' }); view.append(root);
    const later = (f, ms) => timers.push(setTimeout(f, ms));
    function actions() {
      api.setActions([
        { label: '🐣 Bis 5', on: max === 5, onclick: () => { max = 5; Store.set('k.count', 5); actions(); round(); } },
        { label: '🦁 Bis 10', on: max === 10, onclick: () => { max = 10; Store.set('k.count', 10); actions(); round(); } },
        { label: '🔊', onclick: () => KID.speak('Wie viele siehst du? Tipp sie an zum Zählen!') },
      ]);
    }
    function round() {
      timers.forEach(clearTimeout); timers = []; busy = false;
      let nn; do { nn = 1 + Math.floor(Math.random() * max); } while (nn === n);
      n = nn; item = KID.ITEMS[Math.floor(Math.random() * 20)]; counted = new Set();
      const opts = new Set([n]);
      while (opts.size < 3) { const o = 1 + Math.floor(Math.random() * Math.max(max, 4)); opts.add(o); }
      render(shuffle([...opts]));
      KID.speak('Wie viele siehst du?');
    }
    function render(opts) {
      root.innerHTML = '';
      const cells = shuffle([...Array(20).keys()]).slice(0, n);
      const field = h('div', { class: 'count-field' });
      for (let k = 0; k < 20; k++) {
        if (!cells.includes(k)) { field.append(h('div')); continue; }
        const el = h('button', { class: 'count-item', onclick: () => {
          if (counted.has(k)) return;
          counted.add(k); el.classList.add('counted'); el.dataset.n = counted.size; KID.sfx.tap(); KID.speak(KID.NUM[counted.size]);
        } }, item[0]);
        field.append(el);
      }
      const ans = h('div', { class: 'kid-answers' }, opts.map(o => {
        const b = h('button', { class: 'kid-ans', onclick: () => answer(o, b) }, h('b', null, o), h('small', null, '●'.repeat(o)));
        return b;
      }));
      root.append(field, ans);
      api.setStatus('⭐ ' + stars);
    }
    function answer(o, b) {
      if (busy) return;
      if (o === n) {
        busy = true; stars++; b.classList.add('right'); KID.sfx.ok();
        KID.speak(`${KID.praise()} ${KID.NUM[n]}!`); api.setStatus('⭐ ' + stars);
        if (stars % 5 === 0) { KID.confetti(); recordGame('k-zaehlen', true); }
        later(round, 1800);
      } else { KID.sfx.no(); KID.wiggle(b); b.disabled = true; KID.speak('Zähl nochmal!'); }
    }
    actions(); round();
    return () => { timers.forEach(clearTimeout); KID.hush(); };
  },
});

/* ---------- Schatten-Rätsel ---------- */
registerGame({
  id: 'k-schatten', kids: true, timed: false, name: 'Schatten', icon: '👤', desc: 'Wer versteckt sich im Schatten?',
  mount(view, api) {
    let k = Store.get('k.shadow', 3), target, stars = 0, busy = false, timers = [];
    const root = h('div', { class: 'kid' }); view.append(root);
    const later = (f, ms) => timers.push(setTimeout(f, ms));
    function actions() {
      api.setActions([
        { label: '🐣 3 Bilder', on: k === 3, onclick: () => { k = 3; Store.set('k.shadow', 3); actions(); round(); } },
        { label: '🦁 4 Bilder', on: k === 4, onclick: () => { k = 4; Store.set('k.shadow', 4); actions(); round(); } },
        { label: '🔊', onclick: () => KID.speak('Wer versteckt sich hier?') },
      ]);
    }
    function round() {
      timers.forEach(clearTimeout); timers = []; busy = false;
      const opts = KID.pickItems(k); target = opts[Math.floor(Math.random() * k)];
      root.innerHTML = '';
      const sh = h('div', { class: 'shadow-box' }, h('span', { class: 'shadow' }, target[0]));
      const ans = h('div', { class: 'kid-answers' }, opts.map(o => {
        const b = h('button', { class: 'kid-ans pic', onclick: () => {
          if (busy) return;
          if (o === target) {
            busy = true; stars++; b.classList.add('right'); sh.firstChild.classList.add('shown'); KID.sfx.ok();
            KID.speak(`${target[1]}! ${KID.praise()}`); api.setStatus('⭐ ' + stars);
            if (stars % 5 === 0) { KID.confetti(); recordGame('k-schatten', true); }
            later(round, 1900);
          } else { KID.sfx.no(); KID.wiggle(b); b.disabled = true; KID.speak(o[1] + '? Nein. Probier nochmal!'); }
        } }, o[0]);
        return b;
      }));
      root.append(sh, ans);
      api.setStatus('⭐ ' + stars);
      KID.speak('Wer versteckt sich hier?');
    }
    actions(); round();
    return () => { timers.forEach(clearTimeout); KID.hush(); };
  },
});

/* ---------- Malen ---------- */
registerGame({
  id: 'k-malen', kids: true, timed: false, name: 'Malen', icon: '🎨', desc: 'Malen mit Farben und Stempeln',
  mount(view, api) {
    const COLORS = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa', '#ec407a', '#6d4c41', '#111111'];
    const STAMPS = ['⭐', '❤️', '🌸', '☀️', '🐶', '🦋', '🌈', '🐞'];
    let color = COLORS[4], size = 14, stamp = null, eraser = false;
    const root = h('div', { class: 'paint' });
    const cv = h('canvas', { class: 'paint-cv' });
    const bar = h('div', { class: 'paint-bar' });
    root.append(cv, bar); view.append(root);
    const g = cv.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function fit() {
      root.style.height = view.clientHeight + 'px';
      const r = cv.getBoundingClientRect();
      const old = document.createElement('canvas'); old.width = cv.width; old.height = cv.height;
      if (cv.width) old.getContext('2d').drawImage(cv, 0, 0);
      cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
      g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height);
      if (old.width) g.drawImage(old, 0, 0);
    }
    function renderBar() {
      bar.innerHTML = '';
      bar.append(h('div', { class: 'paint-row' },
        COLORS.map(c => h('button', { class: 'dot' + (!stamp && !eraser && c === color ? ' on' : ''), style: { background: c }, onclick: () => { color = c; stamp = null; eraser = false; KID.sfx.tap(); renderBar(); } }))),
        h('div', { class: 'paint-row' },
          h('button', { class: 'tool' + (size === 8 ? ' on' : ''), onclick: () => { size = 8; renderBar(); } }, h('span', { class: 'sz', style: { width: '8px', height: '8px' } })),
          h('button', { class: 'tool' + (size === 22 ? ' on' : ''), onclick: () => { size = 22; renderBar(); } }, h('span', { class: 'sz', style: { width: '20px', height: '20px' } })),
          h('button', { class: 'tool' + (eraser ? ' on' : ''), onclick: () => { eraser = true; stamp = null; renderBar(); } }, '🧽'),
          STAMPS.map(s => h('button', { class: 'tool' + (stamp === s ? ' on' : ''), onclick: () => { stamp = s; eraser = false; KID.sfx.tap(); renderBar(); } }, s)),
          h('button', { class: 'tool', onclick: clearAll }, '🗑️')));
    }
    async function clearAll() {
      const r = await modal('Alles wegwischen?', null, [{ label: '❌ Nein' }, { label: '✅ Ja', primary: true }]);
      if (r === 1) { g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height); KID.sfx.pop(); }
    }
    const pts = new Map();
    const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * dpr, (e.clientY - r.top) * dpr]; };
    cv.addEventListener('pointerdown', e => {
      e.preventDefault();
      const [x, y] = pos(e);
      if (stamp) {
        const s = 70 * dpr; g.font = `${s}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(stamp, x, y); KID.sfx.pop(); return;
      }
      pts.set(e.pointerId, [x, y]); cv.setPointerCapture(e.pointerId);
      g.fillStyle = eraser ? '#fff' : color; g.beginPath(); g.arc(x, y, (eraser ? 26 : size) * dpr / 2, 0, Math.PI * 2); g.fill();
    });
    cv.addEventListener('pointermove', e => {
      const p = pts.get(e.pointerId); if (!p) return;
      const [x, y] = pos(e);
      g.strokeStyle = eraser ? '#fff' : color; g.lineWidth = (eraser ? 26 : size) * dpr; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(x, y); g.stroke();
      pts.set(e.pointerId, [x, y]);
    });
    const end = e => pts.delete(e.pointerId);
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);

    renderBar();
    requestAnimationFrame(fit);
    const onResize = () => fit();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  },
});

/* ---------- Luftballons ---------- */
registerGame({
  id: 'k-ballons', kids: true, timed: false, name: 'Luftballons', icon: '🎈', desc: 'Lass die Ballons platzen',
  mount(view, api) {
    const COLORS = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa', '#ec407a'];
    const area = h('div', { class: 'balloons' }); view.append(area);
    let list = [], count = 0, raf = 0, last = 0, spawnT = 0, alive = true;
    area.style.height = view.clientHeight + 'px';

    function spawn() {
      const W = area.clientWidth, size = 70 + Math.random() * 30;
      const gold = Math.random() < 0.08;
      const el = h('div', { class: 'balloon' + (gold ? ' gold' : ''), style: { width: size + 'px', height: size * 1.2 + 'px', background: gold ? '' : COLORS[Math.floor(Math.random() * COLORS.length)] } }, gold ? '⭐' : '');
      const b = { el, x: Math.random() * (W - size), y: area.clientHeight + 10, v: 50 + Math.random() * 50 + Math.min(count, 40), sway: Math.random() * 6.28, gold };
      el.addEventListener('pointerdown', e => { e.preventDefault(); pop(b); });
      area.append(el); list.push(b);
    }
    function pop(b) {
      if (b.popped) return; b.popped = true;
      count++; KID.sfx.pop();
      const boom = h('div', { class: 'boom', style: { left: b.x + 'px', top: b.y + 'px' } }, '💥');
      area.append(boom); setTimeout(() => boom.remove(), 400);
      b.el.remove(); list = list.filter(x => x !== b);
      api.setStatus('🎈 ' + count);
      if (b.gold) { KID.confetti(); KID.speak('Goldener Stern! ' + KID.praise()); }
      else if (count % 10 === 0) { KID.speak(count + ' Ballons! ' + KID.praise()); if (count % 20 === 0) recordGame('k-ballons', true); }
    }
    function tick(t) {
      if (!alive) return;
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0; last = t;
      spawnT -= dt;
      if (spawnT <= 0) { spawn(); spawnT = 0.6 + Math.random() * 0.6; }
      for (const b of list.slice()) {
        b.y -= b.v * dt; b.sway += dt * 2;
        b.el.style.transform = `translate(${b.x + Math.sin(b.sway) * 12}px, ${b.y}px)`;
        if (b.y < -160) { b.el.remove(); list = list.filter(x => x !== b); }
      }
      raf = requestAnimationFrame(tick);
    }
    api.setActions([{ label: '🔄 Neu', onclick: () => { count = 0; api.setStatus('🎈 0'); } }]);
    api.setStatus('🎈 0');
    KID.speak('Tipp auf die Luftballons!');
    raf = requestAnimationFrame(tick);
    const onResize = () => { area.style.height = view.clientHeight + 'px'; };
    window.addEventListener('resize', onResize);
    return () => { alive = false; cancelAnimationFrame(raf); KID.hush(); window.removeEventListener('resize', onResize); };
  },
});

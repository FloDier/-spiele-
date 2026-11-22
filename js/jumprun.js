'use strict';
/* Jump & Run: „Waldläufer“ (Plattformer mit Leveln) und „Hüpf-Lauf“ (Kinder, ein Knopf) */
const JR = (() => {
  const TAU = Math.PI * 2;
  function rng(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  /* Eichhörnchen „Flinki“: x,y = Mitte unten (Füße), s = Größe */
  function squirrel(g, x, y, s, face, t, moving, air) {
    g.save(); g.translate(x, y); g.scale(face, 1);
    const ph = t * 16, bob = moving && !air ? Math.abs(Math.sin(ph)) * s * 0.05 : 0;
    const tailWag = Math.sin(t * 5) * 0.12 + (air ? -0.3 : 0);
    // Schwanz
    g.save(); g.translate(-s * 0.2, -s * 0.3 - bob); g.rotate(-0.5 + tailWag);
    g.fillStyle = '#a85a24'; g.beginPath(); g.ellipse(-s * 0.12, -s * 0.32, s * 0.24, s * 0.42, 0, 0, TAU); g.fill();
    g.fillStyle = '#d98a4a'; g.beginPath(); g.ellipse(-s * 0.1, -s * 0.36, s * 0.12, s * 0.28, 0, 0, TAU); g.fill();
    g.restore();
    // Beine
    const lp = moving && !air ? Math.sin(ph) * s * 0.12 : (air ? s * 0.06 : 0);
    g.fillStyle = '#7a3e17';
    g.beginPath(); g.ellipse(-s * 0.08 + lp, -s * 0.05, s * 0.1, s * 0.06, 0, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(s * 0.1 - lp, -s * 0.05, s * 0.1, s * 0.06, 0, 0, TAU); g.fill();
    // Körper
    g.fillStyle = '#c8742f'; g.beginPath(); g.ellipse(0, -s * 0.33 - bob, s * 0.24, s * 0.26, 0, 0, TAU); g.fill();
    g.fillStyle = '#f6dcb4'; g.beginPath(); g.ellipse(s * 0.07, -s * 0.3 - bob, s * 0.12, s * 0.17, 0, 0, TAU); g.fill();
    // Arm
    g.fillStyle = '#a85a24'; g.beginPath(); g.ellipse(s * 0.16, -s * 0.36 - bob + (air ? -s * 0.08 : 0), s * 0.06, s * 0.1, 0.6, 0, TAU); g.fill();
    // Kopf
    const hy = -s * 0.68 - bob;
    g.fillStyle = '#c8742f'; g.beginPath(); g.arc(s * 0.1, hy, s * 0.21, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(-s * 0.02, hy - s * 0.12); g.lineTo(s * 0.02, hy - s * 0.32); g.lineTo(s * 0.12, hy - s * 0.16); g.fill();
    g.fillStyle = '#f6dcb4'; g.beginPath(); g.ellipse(s * 0.22, hy + s * 0.06, s * 0.1, s * 0.08, 0, 0, TAU); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(s * 0.17, hy - s * 0.04, s * 0.075, 0, TAU); g.fill();
    g.fillStyle = '#1b1b1b'; g.beginPath(); g.arc(s * 0.2, hy - s * 0.04, s * 0.04, 0, TAU); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(s * 0.21, hy - s * 0.055, s * 0.013, 0, TAU); g.fill();
    g.fillStyle = '#3d1c0b'; g.beginPath(); g.arc(s * 0.31, hy + s * 0.03, s * 0.035, 0, TAU); g.fill();
    g.restore();
  }
  function acorn(g, x, y, r, t) {
    const b = Math.sin(t * 4 + x * 0.05) * r * 0.15;
    g.fillStyle = '#d9a35a'; g.beginPath(); g.ellipse(x, y + r * 0.25 + b, r * 0.62, r * 0.75, 0, 0, TAU); g.fill();
    g.fillStyle = '#7a4a22'; g.beginPath(); g.ellipse(x, y - r * 0.25 + b, r * 0.75, r * 0.4, 0, 0, TAU); g.fill();
    g.fillRect(x - r * 0.08, y - r * 0.8 + b, r * 0.16, r * 0.35);
    g.fillStyle = 'rgba(255,255,255,.45)'; g.beginPath(); g.arc(x - r * 0.2, y + r * 0.1 + b, r * 0.15, 0, TAU); g.fill();
  }
  function backdrop(g, W, H, camX, horizon) {
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#6ec3f2'); sky.addColorStop(1, '#d6f1fb');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    g.fillStyle = '#fff6c2'; g.beginPath(); g.arc(W * 0.82, H * 0.14, Math.min(W, H) * 0.06, 0, TAU); g.fill();
    // Wolken
    g.fillStyle = 'rgba(255,255,255,.85)';
    for (let i = 0; i < 6; i++) {
      const span = W + 300, cx = ((i * 337 - camX * 0.1) % span + span) % span - 150, cy = H * (0.1 + (i % 3) * 0.08);
      g.beginPath(); g.arc(cx, cy, 22, 0, TAU); g.arc(cx + 26, cy - 10, 28, 0, TAU); g.arc(cx + 56, cy, 22, 0, TAU); g.fill();
    }
    const hill = (f, base, amp, col, wl) => {
      g.fillStyle = col; g.beginPath(); g.moveTo(0, H);
      for (let x = 0; x <= W + 20; x += 20) g.lineTo(x, base - amp * (0.5 + 0.5 * Math.sin((x + camX * f) / wl)) - amp * 0.3 * Math.sin((x + camX * f) / (wl * 0.37)));
      g.lineTo(W, H); g.fill();
    };
    hill(0.2, horizon, 70, '#9fd8a4', 160);
    hill(0.45, horizon + 30, 50, '#6fbf78', 110);
  }
  function canvasIn(view, extraClass) {
    const wrap = h('div', { class: 'jr ' + (extraClass || '') });
    const cv = h('canvas');
    wrap.append(cv); view.append(wrap);
    const g = cv.getContext('2d');
    const dims = { W: 0, H: 0, dpr: 1 };
    function fit() {
      wrap.style.height = view.clientHeight + 'px';
      dims.dpr = Math.min(window.devicePixelRatio || 1, 2);
      dims.W = wrap.clientWidth; dims.H = wrap.clientHeight;
      cv.width = Math.round(dims.W * dims.dpr); cv.height = Math.round(dims.H * dims.dpr);
    }
    fit();
    return { wrap, cv, g, dims, fit };
  }
  const snd = {
    jump() { KID.tone(420, 0.09, 'square', 0, 0.06); KID.tone(640, 0.1, 'square', 0.05, 0.06); },
    coin() { KID.tone(988, 0.06, 'square', 0, 0.06); KID.tone(1319, 0.12, 'square', 0.06, 0.06); },
    stomp() { KID.tone(300, 0.08, 'triangle', 0, 0.15); KID.tone(200, 0.1, 'triangle', 0.05, 0.12); },
    hurt() { KID.tone(330, 0.12, 'sawtooth', 0, 0.08); KID.tone(220, 0.2, 'sawtooth', 0.1, 0.08); },
    win() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => KID.tone(f, 0.16, 'square', i * 0.11, 0.06)); },
    life() { [660, 880, 1100].forEach((f, i) => KID.tone(f, 0.12, 'triangle', i * 0.08, 0.12)); },
  };
  return { rng, squirrel, acorn, backdrop, canvasIn, snd, TAU };
})();

/* ================= Waldläufer ================= */
registerGame({
  id: 'jumprun', name: 'Waldläufer', icon: '🐿️', desc: 'Jump & Run – endlose Level im Wald', timed: false,
  mount(view, api) {
    const T = 32, ROWS = 14;
    const G = 2000, JV = 760, SPEED = 230, ACC = 1900, FRIC = 2400, MAXFALL = 900;
    const SOLID = { '#': 1, 'B': 1, '?': 1, 'X': 1 };
    const C = JR.canvasIn(view);
    const { g, dims } = C;
    let level = Store.get('jr.level', 1), maxLevel = Store.get('jr.max', 1);
    let lives = 3, hearts = 3, acorns = 0, nextLife = 50;
    let L, P, camX = 0, state = 'play', stateT = 0, time = 0, pops = [], alive = true, raf = 0, last = 0, acc = 0, lastStatus = '';
    const input = { left: false, right: false, jumpHeld: false, jumpBuf: 0 };

    /* ---- Level-Generator ---- */
    function gen(lvl) {
      const rnd = JR.rng(lvl * 7919 + 13);
      const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
      const len = 90 + lvl * 14, diff = Math.min(lvl, 8);
      const grid = Array.from({ length: ROWS }, () => []);
      const set = (r, c, ch) => { if (r >= 0 && r < ROWS) grid[r][c] = ch; };
      const enemies = [], items = [], cps = [];
      let c = 0, gy = 10, cpDone = false;
      const ground = n => { for (let k = 0; k < n; k++, c++) for (let r = gy; r < ROWS; r++) set(r, c, '#'); };
      const coin = (cc, rr) => items.push({ x: cc * T + T / 2, y: rr * T + T / 2, got: false });
      ground(10);
      const start = { c: 3, gy };
      while (c < len) {
        if (!cpDone && c >= len / 2) { ground(2); cps.push({ c, gy, on: false }); ground(3); cpDone = true; continue; }
        const t = rnd();
        if (t < 0.2) { // Abgrund
          const w = ri(2, Math.min(3, 1 + Math.ceil(diff / 2)));
          for (let k = 0; k < w; k++) coin(c + k, gy - 3 - (k > 0 && k < w - 1 ? 1 : 0));
          c += w; ground(ri(3, 5));
        } else if (t < 0.33) { // Stufe
          gy = Math.max(7, Math.min(11, gy + (rnd() < 0.5 ? -1 : 1) * ri(1, 2))); ground(ri(4, 7));
        } else if (t < 0.48) { // schwebende Plattform
          const w = ri(3, 5), pr = gy - 3, pit = rnd() < 0.25 + diff * 0.06;
          for (let k = 0; k < w + 2; k++) if (!pit || k === 0 || k === w + 1) for (let r = gy; r < ROWS; r++) set(r, c + k, '#');
          for (let k = 1; k <= w; k++) { set(pr, c + k, 'B'); coin(c + k, pr - 1); }
          c += w + 2; ground(2);
        } else if (t < 0.6) { // Bonusblöcke
          const n = ri(1, 3), st = c + 2; ground(n + 4);
          for (let k = 0; k < n; k++) set(gy - 4, st + k, rnd() < 0.65 ? '?' : 'B');
        } else if (t < 0.72) { // Stacheln
          ground(2); const n = ri(1, diff > 3 ? 2 : 1);
          for (let k = 0; k < n; k++) set(gy - 1, c + k, 's');
          ground(n + 2);
        } else if (t < 0.83) { // Säule
          ground(2); const hh = ri(1, 2);
          for (let r = gy - hh; r < gy; r++) set(r, c, 'B');
          coin(c, gy - hh - 1); ground(1); ground(3);
        } else { // Gegner
          const n = ri(6, 9), st = c; ground(n);
          const bee = lvl >= 3 && rnd() < 0.35;
          enemies.push({ type: bee ? 'bee' : 'snail', x: (st + ri(3, n - 2)) * T, y: gy * T - (bee ? 64 : 18), x0: (st + n / 2) * T, y0: gy * T - 64, vx: -45 - lvl * 3, t: rnd() * 6, dead: 0 });
          for (let k = 1; k < 4; k++) coin(st + k, gy - 1);
        }
        if (diff >= 4 && rnd() < 0.12 * (diff - 3)) { // zusätzliche Schnecke
          const st = c; ground(5);
          enemies.push({ type: 'snail', x: (st + 3) * T, y: gy * T - 18, vx: -45 - lvl * 3, t: 0, dead: 0 });
        }
      }
      ground(4); const flag = { c: c + 2, gy }; ground(12);
      return { grid, w: c, start, cps, flag, enemies, items };
    }
    const tile = (c, r) => { if (c < 0) return '#'; if (r < 0 || r >= ROWS) return ''; return L.grid[r][c] || ''; };
    const solid = (c, r) => !!SOLID[tile(c, r)];

    function startLevel(keep) {
      L = gen(level);
      if (!keep) { lives = 3; acorns = 0; nextLife = 50; }
      hearts = 3; pops = []; spawn(L.start);
      camX = 0; state = 'play';
      Store.set('jr.level', level);
      actions();
    }
    function spawn(at) {
      P = { x: at.c * T + 6, y: at.gy * T - 28, w: 20, h: 28, vx: 0, vy: 0, on: false, face: 1, coyote: 0, inv: 1.2 };
      hearts = 3;
    }

    /* ---- Physik ---- */
    function overl(x, y, w, hh, fn) {
      for (let r = Math.floor(y / T); r <= Math.floor((y + hh - 0.01) / T); r++)
        for (let c = Math.floor(x / T); c <= Math.floor((x + w - 0.01) / T); c++) if (fn(c, r)) return [c, r];
      return null;
    }
    function moveX(o, dx) {
      o.x += dx;
      const hit = overl(o.x, o.y, o.w, o.h, solid);
      if (hit) { if (dx > 0) o.x = hit[0] * T - o.w; else o.x = (hit[0] + 1) * T; o.vx = 0; return true; }
      return false;
    }
    function moveY(o, dy, isPlayer) {
      o.y += dy; o.on = false;
      const hit = overl(o.x, o.y, o.w, o.h, solid);
      if (!hit) return;
      if (dy > 0) { o.y = hit[1] * T - o.h; o.on = true; }
      else {
        o.y = (hit[1] + 1) * T;
        if (isPlayer) {
          // Block über dem Kopf (den mit größter Überdeckung) anstoßen
          const cMid = Math.floor((o.x + o.w / 2) / T), r = hit[1];
          const cc = solid(cMid, r) ? cMid : hit[0];
          if (tile(cc, r) === '?') { L.grid[r][cc] = 'X'; addAcorn(); pops.push({ x: cc * T + T / 2, y: r * T - 10, t: 0 }); }
          else KID.tone(150, 0.05, 'square', 0, 0.05);
        }
      }
      o.vy = 0;
    }
    function addAcorn() {
      acorns++; JR.snd.coin();
      if (acorns >= nextLife) { nextLife += 50; lives++; JR.snd.life(); toast('🐿️ Extraleben!'); }
    }
    function hurt(fromX) {
      if (P.inv > 0 || state !== 'play') return;
      hearts--; JR.snd.hurt();
      if (hearts <= 0) return die();
      P.inv = 1.3; P.vy = -420; P.vx = (P.x < fromX ? -1 : 1) * 260;
    }
    function die() {
      if (state !== 'play') return;
      state = 'dying'; stateT = 0; lives--; P.vy = -600; P.vx = 0; JR.snd.hurt();
    }

    function step(dt) {
      time += dt;
      for (const p of pops) p.t += dt;
      pops = pops.filter(p => p.t < 0.6);
      if (state === 'dying') {
        stateT += dt; P.vy += G * dt; P.y += P.vy * dt;
        if (stateT > 1.3) {
          if (lives <= 0) { state = 'over'; gameOver(); }
          else { const cp = [...L.cps].reverse().find(c => c.on); spawn(cp || L.start); state = 'play'; camX = Math.max(0, P.x - 120); }
        }
        return;
      }
      if (state !== 'play') return;
      const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      if (dir) { P.face = dir; const a = Math.sign(dir * SPEED - P.vx) * ACC * dt; P.vx = Math.abs(dir * SPEED - P.vx) < Math.abs(a) ? dir * SPEED : P.vx + a; }
      else { const f = FRIC * dt; P.vx = Math.abs(P.vx) < f ? 0 : P.vx - Math.sign(P.vx) * f; }
      P.coyote = P.on ? 0.1 : P.coyote - dt;
      input.jumpBuf -= dt;
      if (input.jumpBuf > 0 && P.coyote > 0) { P.vy = -JV; input.jumpBuf = 0; P.coyote = 0; JR.snd.jump(); }
      if (!input.jumpHeld && P.vy < 0) P.vy += G * dt * 1.6;
      P.vy = Math.min(P.vy + G * dt, MAXFALL);
      P.inv -= dt;
      moveX(P, P.vx * dt); moveY(P, P.vy * dt, true);
      if (P.y > ROWS * T + 40) return die();
      // Stacheln
      if (overl(P.x + 3, P.y, P.w - 6, P.h, (c, r) => tile(c, r) === 's' && P.y + P.h > r * T + T * 0.5)) hurt(P.x - P.face);
      // Eicheln
      for (const it of L.items) if (!it.got && Math.abs(it.x - (P.x + P.w / 2)) < 20 && Math.abs(it.y - (P.y + P.h / 2)) < 24) { it.got = true; addAcorn(); }
      // Kontrollpunkt
      for (const cp of L.cps) if (!cp.on && P.x > cp.c * T) { cp.on = true; JR.snd.life(); toast('🚩 Kontrollpunkt'); }
      // Ziel
      if (P.x + P.w > L.flag.c * T + 8) return win();
      // Gegner
      for (const e of L.enemies) {
        if (e.dead) { e.dead += dt; continue; }
        if (Math.abs(e.x - P.x) > 900) continue;
        e.t += dt;
        if (e.type === 'snail') {
          e.w = 26; e.h = 18;
          e.vy = Math.min((e.vy || 0) + G * dt, MAXFALL);
          let v = e.vx;
          if (moveX(e, v * dt)) v = -v;
          moveY(e, e.vy * dt, false);
          if (e.on) {
            const fc = Math.floor((e.x + (v > 0 ? e.w + 1 : -1)) / T), fr = Math.floor((e.y + e.h + 1) / T);
            if (!solid(fc, fr)) v = -v;
          }
          e.vx = v;
          if (e.y > ROWS * T) e.dead = 1;
        } else {
          e.w = 24; e.h = 20;
          const nx = e.x0 + Math.sin(e.t * 1.1) * 3 * T;
          e.face = nx > e.x ? 1 : -1; e.x = nx; e.y = e.y0 + Math.sin(e.t * 4) * 16;
        }
        if (P.x < e.x + e.w && P.x + P.w > e.x && P.y < e.y + e.h && P.y + P.h > e.y) {
          const prevBottom = P.y + P.h - P.vy * dt;
          if (P.vy > 0 && prevBottom <= e.y + 8) { e.dead = 0.001; P.vy = input.jumpHeld ? -JV * 0.9 : -JV * 0.55; JR.snd.stomp(); addAcorn(); }
          else hurt(e.x + e.w / 2);
        }
      }
    }

    async function win() {
      state = 'win'; JR.snd.win(); KID.confetti();
      maxLevel = Math.max(maxLevel, level + 1); Store.set('jr.max', maxLevel);
      recordGame('jumprun', true);
      const r = await modal(`🏁 Level ${level} geschafft!`, `🌰 ${acorns} Eicheln · 🐿️ ${lives} Leben`, [{ label: 'Weiter ▶', primary: true }]);
      if (!alive) return;
      level++; startLevel(true);
    }
    async function gameOver() {
      recordGame('jumprun', false);
      await modal('Game Over', `Du bist bis Level ${level} gekommen. Nochmal versuchen?`, [{ label: '🔄 Nochmal', primary: true }]);
      if (!alive) return;
      startLevel(false);
    }

    /* ---- Zeichnen ---- */
    function draw() {
      const { W, H, dpr } = dims;
      const portrait = H > W;
      const scale = Math.min(H / (ROWS * T), W / ((portrait ? 10 : 11) * T));
      // Boden (Zeile 11) oberhalb der Touch-Steuerung halten
      const oy = Math.min(H - ROWS * T * scale, H - (portrait ? 120 : 40) - 11 * T * scale);
      const visW = W / scale;
      const target = Math.max(0, Math.min(L.w * T - visW, P.x - visW * 0.38));
      camX += (target - camX) * 0.12;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      JR.backdrop(g, W, H, camX * scale, oy + 8 * T * scale);
      const bottom = oy + ROWS * T * scale;
      if (bottom < H) { g.fillStyle = '#5e3a1a'; g.fillRect(0, bottom - 1, W, H - bottom + 1); }
      g.translate(0, oy); g.scale(scale, scale); g.translate(-Math.round(camX), 0);
      const c0 = Math.floor(camX / T) - 1, c1 = c0 + Math.ceil(visW / T) + 2;
      for (let r = 0; r < ROWS; r++) for (let c = c0; c <= c1; c++) {
        const ch = tile(c, r); if (!ch || c < 0) continue;
        const x = c * T, y = r * T;
        if (ch === '#') {
          g.fillStyle = '#8d5a2b'; g.fillRect(x, y, T + 0.5, T + 0.5);
          g.fillStyle = '#7a4b22'; if ((c * 7 + r * 3) % 5 === 0) g.fillRect(x + 8, y + 14, 5, 4);
          if (!solid(c, r - 1)) { g.fillStyle = '#5cb85c'; g.fillRect(x, y, T + 0.5, 9); g.fillStyle = '#3f9a43'; g.fillRect(x, y + 9, T + 0.5, 3); }
        } else if (ch === 'B') {
          g.fillStyle = '#a3a3a3'; g.fillRect(x, y, T, T); g.strokeStyle = '#6b6b6b'; g.lineWidth = 2; g.strokeRect(x + 1, y + 1, T - 2, T - 2);
          g.beginPath(); g.moveTo(x, y + T / 2); g.lineTo(x + T, y + T / 2); g.moveTo(x + T / 2, y); g.lineTo(x + T / 2, y + T / 2); g.stroke();
        } else if (ch === '?' || ch === 'X') {
          g.fillStyle = ch === '?' ? '#f5c451' : '#a1887f'; g.fillRect(x, y, T, T);
          g.strokeStyle = ch === '?' ? '#b8861b' : '#6d5a52'; g.lineWidth = 2; g.strokeRect(x + 1, y + 1, T - 2, T - 2);
          if (ch === '?') { g.fillStyle = '#7a4a10'; g.font = 'bold 22px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', x + T / 2, y + T / 2 + 1 + Math.sin(time * 4) * 1.5); }
        } else if (ch === 's') {
          g.fillStyle = '#cfd8dc'; g.strokeStyle = '#607d8b'; g.lineWidth = 1.5;
          for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(x + k * T / 3, y + T); g.lineTo(x + k * T / 3 + T / 6, y + T * 0.45); g.lineTo(x + (k + 1) * T / 3, y + T); g.fill(); g.stroke(); }
        }
      }
      // Kontrollpunkte & Ziel
      for (const cp of L.cps) {
        const x = cp.c * T + T / 2, y = cp.gy * T;
        g.fillStyle = '#5d4037'; g.fillRect(x - 2, y - 56, 4, 56);
        g.fillStyle = cp.on ? '#43a047' : '#9e9e9e'; g.beginPath(); g.moveTo(x + 2, y - 56); g.lineTo(x + 26, y - 48); g.lineTo(x + 2, y - 40); g.fill();
      }
      { const x = L.flag.c * T + T / 2, y = L.flag.gy * T;
        g.fillStyle = '#eee'; g.fillRect(x - 3, y - 150, 6, 150);
        g.fillStyle = '#f5c451'; g.beginPath(); g.arc(x, y - 152, 7, 0, JR.TAU); g.fill();
        const wv = Math.sin(time * 6) * 4;
        g.fillStyle = '#e53935'; g.beginPath(); g.moveTo(x + 3, y - 145); g.quadraticCurveTo(x + 24, y - 140 + wv, x + 46, y - 132); g.quadraticCurveTo(x + 24, y - 124 - wv, x + 3, y - 117); g.fill(); }
      // Eicheln
      for (const it of L.items) if (!it.got && it.x > camX - T && it.x < camX + visW + T) JR.acorn(g, it.x, it.y, 10, time);
      for (const p of pops) JR.acorn(g, p.x, p.y - p.t * 60, 10, 0);
      // Gegner
      for (const e of L.enemies) {
        if (e.dead > 0.4 || e.x < camX - 64 || e.x > camX + visW + 64) continue;
        if (e.type === 'snail') {
          const sq = e.dead ? 0.35 : 1, x = e.x, y = e.y + 18 * (1 - sq);
          g.save(); g.translate(x + 13, y + 18 * sq); g.scale(e.vx > 0 ? -1 : 1, sq);
          g.fillStyle = '#e8d27a'; g.beginPath(); g.ellipse(-2, -4, 15, 5, 0, 0, JR.TAU); g.fill();
          g.beginPath(); g.ellipse(-14, -9, 4, 7, -0.3, 0, JR.TAU); g.fill();
          g.strokeStyle = '#e8d27a'; g.lineWidth = 2; g.beginPath(); g.moveTo(-15, -14); g.lineTo(-18, -22); g.moveTo(-13, -14); g.lineTo(-12, -22); g.stroke();
          g.fillStyle = '#222'; g.beginPath(); g.arc(-18, -22, 2, 0, JR.TAU); g.arc(-12, -22, 2, 0, JR.TAU); g.fill();
          g.fillStyle = '#9c4dcc'; g.beginPath(); g.arc(3, -12, 10, 0, JR.TAU); g.fill();
          g.strokeStyle = '#6a1b9a'; g.lineWidth = 2; g.beginPath(); g.arc(3, -12, 5, 0, JR.TAU * 0.8); g.stroke();
          g.restore();
        } else {
          g.save(); g.translate(e.x + 12, e.y + 10); g.scale(e.face || 1, e.dead ? 0.4 : 1);
          g.fillStyle = 'rgba(255,255,255,.8)'; const fl = Math.sin(time * 40) * 3;
          g.beginPath(); g.ellipse(-3, -10 - fl, 6, 9, -0.4, 0, JR.TAU); g.ellipse(5, -10 + fl, 6, 9, 0.4, 0, JR.TAU); g.fill();
          g.fillStyle = '#fdd835'; g.beginPath(); g.ellipse(0, 0, 12, 9, 0, 0, JR.TAU); g.fill();
          g.fillStyle = '#222'; g.fillRect(-4, -8, 3, 16); g.fillRect(2, -8, 3, 16);
          g.beginPath(); g.arc(9, -2, 2, 0, JR.TAU); g.fill();
          g.beginPath(); g.moveTo(-12, 0); g.lineTo(-17, -2); g.lineTo(-12, 3); g.fill();
          g.restore();
        }
      }
      // Spieler
      if (!(P.inv > 0 && state === 'play' && Math.floor(time * 12) % 2)) {
        g.save();
        if (state === 'dying') { g.translate(P.x + P.w / 2, P.y + P.h); g.rotate(stateT * 6); g.translate(-(P.x + P.w / 2), -(P.y + P.h)); }
        JR.squirrel(g, P.x + P.w / 2, P.y + P.h, 40, P.face, time, Math.abs(P.vx) > 20, !P.on);
        g.restore();
      }
      const st = `Level ${level} · 🌰 ${acorns} · ${'❤️'.repeat(Math.max(0, hearts))}${'🤍'.repeat(3 - Math.max(0, hearts))} · 🐿️×${lives}`;
      if (st !== lastStatus) { api.setStatus(st); lastStatus = st; }
    }

    function frame(t) {
      if (!alive) return;
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0; last = t;
      acc += dt;
      while (acc >= 1 / 120) { step(1 / 120); acc -= 1 / 120; }
      draw();
      raf = requestAnimationFrame(frame);
    }

    /* ---- Steuerung ---- */
    const pad = h('div', { class: 'jr-pad' }, h('span', null, '◀'), h('span', null, '▶'));
    const jumpBtn = h('div', { class: 'jr-jump' }, '⤒');
    C.wrap.append(pad, jumpBtn);
    const padPtr = new Map();
    const padUpd = () => { input.left = [...padPtr.values()].includes('L'); input.right = [...padPtr.values()].includes('R'); pad.dataset.s = input.left ? 'L' : input.right ? 'R' : ''; };
    const padSide = e => { const r = pad.getBoundingClientRect(); return e.clientX < r.left + r.width / 2 ? 'L' : 'R'; };
    pad.addEventListener('pointerdown', e => { e.preventDefault(); pad.setPointerCapture(e.pointerId); padPtr.set(e.pointerId, padSide(e)); padUpd(); });
    pad.addEventListener('pointermove', e => { if (padPtr.has(e.pointerId)) { padPtr.set(e.pointerId, padSide(e)); padUpd(); } });
    const padEnd = e => { padPtr.delete(e.pointerId); padUpd(); };
    pad.addEventListener('pointerup', padEnd); pad.addEventListener('pointercancel', padEnd);
    jumpBtn.addEventListener('pointerdown', e => { e.preventDefault(); jumpBtn.setPointerCapture(e.pointerId); input.jumpHeld = true; input.jumpBuf = 0.13; jumpBtn.classList.add('on'); });
    const jEnd = () => { input.jumpHeld = false; jumpBtn.classList.remove('on'); };
    jumpBtn.addEventListener('pointerup', jEnd); jumpBtn.addEventListener('pointercancel', jEnd);
    const KEYS = { ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right' };
    function key(e, down) {
      if (document.querySelector('.modal-bg')) return;
      if (KEYS[e.key]) { input[KEYS[e.key]] = down; e.preventDefault(); }
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') {
        if (down && !input.jumpHeld) input.jumpBuf = 0.13;
        input.jumpHeld = down; e.preventDefault();
      }
    }
    const kd = e => key(e, true), ku = e => key(e, false);
    document.addEventListener('keydown', kd); document.addEventListener('keyup', ku);

    function actions() {
      api.setActions([
        { label: '🔄 Level neu', onclick: () => startLevel(false) },
        { label: '🗺️ Level wählen', onclick: async () => {
          const n = Math.min(maxLevel, 12), from = Math.max(1, maxLevel - 11);
          const btns = []; for (let i = from; i <= maxLevel; i++) btns.push({ label: String(i), value: i, primary: i === level });
          const r = await modal('Level wählen', null, btns.concat([{ label: 'Abbrechen', value: 0 }]));
          if (r) { level = r; startLevel(false); }
        } },
        { label: '❓ Steuerung', onclick: () => modal('Steuerung', '◀ ▶ laufen, ⤒ springen (länger drücken = höher). Gegner von oben anspringen! Sammle Eicheln – 50 geben ein Extraleben. Tastatur: Pfeiltasten + Leertaste.') },
      ]);
    }

    const onResize = () => C.fit();
    window.addEventListener('resize', onResize);
    startLevel(false);
    raf = requestAnimationFrame(frame);
    return () => {
      alive = false; cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('keydown', kd); document.removeEventListener('keyup', ku);
    };
  },
});

/* ================= Hüpf-Lauf (Kinder) ================= */
registerGame({
  id: 'k-huepf', kids: true, timed: false, name: 'Hüpf-Lauf', icon: '🏃', desc: 'Tippen zum Springen',
  mount(view, api) {
    const C = JR.canvasIn(view, 'tap');
    const { g, dims } = C;
    const G = 2300, JV = 820;
    let P = { y: 0, vy: 0, on: true, jumps: 0, inv: 0 }, speed = 210, dist = 0, obs = [], coins = [], acorns = 0, nextObs = 500, nextCoin = 250, time = 0;
    let alive = true, raf = 0, last = 0, lastStatus = '';
    const groundY = () => dims.H * 0.8;

    function jump() {
      if (P.on) { P.vy = -JV; P.on = false; P.jumps = 1; JR.snd.jump(); }
      else if (P.jumps < 2) { P.vy = -JV * 0.85; P.jumps = 2; JR.snd.jump(); }
    }
    C.cv.addEventListener('pointerdown', e => { e.preventDefault(); jump(); });
    const kd = e => { if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); jump(); } };
    document.addEventListener('keydown', kd);

    function step(dt) {
      time += dt;
      const s = Math.min(dims.H / 420, 1.3);
      speed = Math.min(400, speed + dt * 4);
      const dx = speed * s * dt; dist += dx;
      P.vy += G * dt; P.y += P.vy * dt * s;
      if (P.y >= 0) { P.y = 0; P.vy = 0; P.on = true; P.jumps = 0; }
      P.inv -= dt;
      nextObs -= dx; nextCoin -= dx;
      const W = dims.W;
      if (nextObs <= 0) {
        const type = Math.random() < 0.5 ? 'stump' : 'rock';
        obs.push({ x: W + 40, type, w: (type === 'stump' ? 30 : 42) * s, h: (type === 'stump' ? 36 : 24) * s, hit: false });
        nextObs = (300 + Math.random() * 320) * s * (speed / 260);
      }
      if (nextCoin <= 0) {
        const high = Math.random() < 0.5;
        for (let k = 0; k < 3; k++) coins.push({ x: W + 40 + k * 34 * s, y: (high ? 110 : 30) * s, got: false });
        nextCoin = (260 + Math.random() * 300) * s;
      }
      const px = W * 0.2, pw = 26 * s, ph = 34 * s, py = groundY() + P.y * 1;
      for (const o of obs) {
        o.x -= dx;
        if (!o.hit && P.inv <= 0 && px + pw / 2 > o.x + 4 && px - pw / 2 < o.x + o.w - 4 && py > groundY() - o.h + 4) {
          o.hit = true; P.inv = 1.4; speed = 210; JR.snd.hurt();
        }
      }
      for (const c of coins) {
        c.x -= dx;
        if (!c.got && Math.abs(c.x - px) < 24 * s && Math.abs((groundY() - c.y) - (py - ph / 2)) < 34 * s) {
          c.got = true; acorns++; JR.snd.coin();
          if (acorns % 10 === 0) { KID.confetti(); KID.speak(acorns + ' Eicheln! ' + KID.praise()); if (acorns % 20 === 0) recordGame('k-huepf', true); }
        }
      }
      obs = obs.filter(o => o.x > -80); coins = coins.filter(c => c.x > -40 && !c.got);
    }

    function draw() {
      const { W, H, dpr } = dims, gy = groundY(), s = Math.min(H / 420, 1.3);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      JR.backdrop(g, W, H, dist, gy - 10);
      g.fillStyle = '#5cb85c'; g.fillRect(0, gy, W, 14 * s);
      g.fillStyle = '#8d5a2b'; g.fillRect(0, gy + 14 * s, W, H - gy);
      g.fillStyle = '#7a4b22';
      for (let i = 0; i < W / 40 + 2; i++) { const x = ((i * 40 - dist) % (W + 80) + W + 80) % (W + 80) - 40; g.fillRect(x, gy + 30 * s, 8, 5); }
      for (const o of obs) {
        if (o.type === 'stump') {
          g.fillStyle = '#795548'; g.fillRect(o.x, gy - o.h, o.w, o.h);
          g.fillStyle = '#d7b98e'; g.beginPath(); g.ellipse(o.x + o.w / 2, gy - o.h, o.w / 2, 5 * s, 0, 0, JR.TAU); g.fill();
          g.strokeStyle = '#a1887f'; g.beginPath(); g.ellipse(o.x + o.w / 2, gy - o.h, o.w / 4, 2.5 * s, 0, 0, JR.TAU); g.stroke();
        } else {
          g.fillStyle = '#9e9e9e'; g.beginPath(); g.ellipse(o.x + o.w / 2, gy - o.h / 2 + 2, o.w / 2, o.h / 2 + 2, 0, Math.PI, 0); g.lineTo(o.x + o.w, gy); g.lineTo(o.x, gy); g.fill();
          g.fillStyle = '#bdbdbd'; g.beginPath(); g.ellipse(o.x + o.w * 0.35, gy - o.h * 0.6, o.w * 0.15, o.h * 0.15, 0, 0, JR.TAU); g.fill();
        }
      }
      for (const c of coins) JR.acorn(g, c.x, gy - c.y, 11 * s, time);
      if (!(P.inv > 0 && Math.floor(time * 10) % 2)) JR.squirrel(g, W * 0.2, gy + P.y, 52 * s, 1, time, true, !P.on);
      const st = '🌰 ' + acorns;
      if (st !== lastStatus) { api.setStatus(st); lastStatus = st; }
    }

    function frame(t) {
      if (!alive) return;
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0; last = t;
      step(dt); draw();
      raf = requestAnimationFrame(frame);
    }
    api.setActions([{ label: '🔊', onclick: () => KID.speak('Tipp auf den Bildschirm, um zu springen! Zweimal tippen springt höher.') }]);
    KID.speak('Tipp, um zu springen!');
    const onResize = () => C.fit();
    window.addEventListener('resize', onResize);
    raf = requestAnimationFrame(frame);
    return () => { alive = false; cancelAnimationFrame(raf); KID.hush(); window.removeEventListener('resize', onResize); document.removeEventListener('keydown', kd); };
  },
});

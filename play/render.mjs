// Original vector art drawn in code. No text is drawn on the canvas.
import { C, gateBoxes } from "./engine.mjs";

const W = C.width, H = C.height;
const MAX_PARTICLES = 72;
const COLORS = {
  sky: ["#091B26", "#153D4B", "#41666E"], far: "#183D49", mid: "#275665",
  outline: "#13343B", core: "#FFD189", highlight: "#FFF1CF",
  gateEdge: "#72E7CC", gateGlass: "#214C58", ground: "#0C222B", lamp: "#FFD189"
};

function makeCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function lcg(seed) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(1664525, s) + 1013904223) >>> 0) / 4294967296);
}

function buildSky() {
  const c = makeCanvas(W, H);
  const g = c.getContext("2d");
  const grad = g.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, COLORS.sky[0]);
  grad.addColorStop(0.55, COLORS.sky[1]);
  grad.addColorStop(0.9, COLORS.sky[2]);
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);
  const rnd = lcg(7);
  for (let i = 0; i < 46; i++) {
    const x = rnd() * W, y = 60 + rnd() * 330, r = 0.6 + rnd() * 1.1;
    g.globalAlpha = 0.25 + rnd() * 0.55;
    g.fillStyle = i % 7 === 0 ? COLORS.highlight : "#CFE9EA";
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  // Soft moon glow
  g.globalAlpha = 1;
  const moon = g.createRadialGradient(330, 150, 4, 330, 150, 90);
  moon.addColorStop(0, "rgba(255,241,207,0.55)");
  moon.addColorStop(0.2, "rgba(255,209,137,0.18)");
  moon.addColorStop(1, "rgba(255,209,137,0)");
  g.fillStyle = moon;
  g.fillRect(200, 40, 260, 230);
  g.fillStyle = "#FFF1CF";
  g.beginPath();
  g.arc(330, 150, 13, 0, Math.PI * 2);
  g.fill();
  // Horizon haze
  for (let i = 0; i < 6; i++) {
    g.fillStyle = `rgba(114,231,204,${0.025 + i * 0.006})`;
    g.fillRect(0, 520 + i * 26, W, 26);
  }
  return c;
}

// Far layer: quiet ridge with a twilight city and a few warm windows (tileable 432 wide).
function buildFar() {
  const c = makeCanvas(W, 300);
  const g = c.getContext("2d");
  const rnd = lcg(21);
  g.fillStyle = COLORS.far;
  g.beginPath();
  g.moveTo(0, 300);
  g.lineTo(0, 150);
  const ridge = [150, 120, 138, 96, 128, 110, 146, 118, 150];
  for (let i = 1; i < ridge.length; i++) g.lineTo((i / (ridge.length - 1)) * W, ridge[i]);
  g.lineTo(W, 300);
  g.closePath();
  g.fill();
  let x = 0;
  const bars = [];
  while (x < W) {
    const w = 18 + Math.floor(rnd() * 22);
    const h = 40 + Math.floor(rnd() * 90);
    bars.push([x, w, h]);
    x += w + 2;
  }
  g.fillStyle = "#1B4654";
  for (const [bx, w, h] of bars) g.fillRect(bx, 300 - h - 40, Math.min(w, W - bx), h + 40);
  for (const [bx, w, h] of bars) {
    for (let wy = 300 - h - 30; wy < 280; wy += 12) {
      for (let wx = bx + 4; wx < bx + w - 4 && wx < W - 4; wx += 8) {
        if (rnd() < 0.13) {
          g.fillStyle = rnd() < 0.7 ? "rgba(255,209,137,0.75)" : "rgba(114,231,204,0.55)";
          g.fillRect(wx, wy, 3, 4);
        }
      }
    }
  }
  return c;
}

// Mid layer: floating islands and thin clouds (tileable).
function buildMid() {
  const c = makeCanvas(W, 260);
  const g = c.getContext("2d");
  g.fillStyle = COLORS.mid;
  g.beginPath();
  g.moveTo(0, 260);
  g.lineTo(0, 200);
  g.bezierCurveTo(60, 180, 110, 214, 170, 196);
  g.bezierCurveTo(230, 178, 300, 210, 360, 190);
  g.bezierCurveTo(390, 182, 415, 194, W, 200);
  g.lineTo(W, 260);
  g.closePath();
  g.fill();
  const island = (x, y, s) => {
    g.fillStyle = COLORS.mid;
    g.beginPath();
    g.ellipse(x, y, 34 * s, 7 * s, 0, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.moveTo(x - 30 * s, y);
    g.quadraticCurveTo(x, y + 34 * s, x + 30 * s, y);
    g.fill();
    g.fillStyle = "rgba(255,209,137,0.8)";
    g.fillRect(x - 3 * s, y - 9 * s, 6 * s, 5 * s);
  };
  island(90, 70, 1);
  island(300, 40, 0.75);
  g.fillStyle = "rgba(207,233,234,0.08)";
  for (const [x, y, w] of [[40, 120, 120], [250, 140, 150], [180, 20, 90]]) {
    g.beginPath();
    g.ellipse(x + w / 2, y, w / 2, 8, 0, 0, Math.PI * 2);
    g.fill();
  }
  return c;
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext("2d", { alpha: false });
  const sky = buildSky(), far = buildFar(), mid = buildMid();
  // Particle pool: preallocated typed arrays, no per-frame allocation.
  const px = new Float32Array(MAX_PARTICLES), py = new Float32Array(MAX_PARTICLES);
  const pvx = new Float32Array(MAX_PARTICLES), pvy = new Float32Array(MAX_PARTICLES);
  const plife = new Float32Array(MAX_PARTICLES), pmax = new Float32Array(MAX_PARTICLES);
  const pkind = new Uint8Array(MAX_PARTICLES);
  let cursor = 0, angle = 0, shake = 0, wingPhase = 0, flapBoost = 0;

  function resize(backingWidth, backingHeight) {
    if (canvas.width !== backingWidth) canvas.width = backingWidth;
    if (canvas.height !== backingHeight) canvas.height = backingHeight;
    ctx.setTransform(backingWidth / W, 0, 0, backingHeight / H, 0, 0);
  }

  function emit(kind, x, y, count) {
    for (let i = 0; i < count; i++) {
      const k = cursor;
      cursor = (cursor + 1) % MAX_PARTICLES;
      const a = Math.random() * Math.PI * 2;
      const sp = kind === 2 ? 80 + Math.random() * 140 : kind === 1 ? 50 + Math.random() * 70 : 20 + Math.random() * 30;
      px[k] = x; py[k] = y;
      pvx[k] = Math.cos(a) * sp - (kind === 0 ? 60 : 0);
      pvy[k] = Math.sin(a) * sp + (kind === 0 ? 40 : 0);
      pmax[k] = plife[k] = 0.25 + Math.random() * 0.25;
      pkind[k] = kind;
    }
  }

  return {
    resize,
    reset() { plife.fill(0); shake = 0; flapBoost = 0; },
    liveParticles() { let n = 0; for (let i = 0; i < MAX_PARTICLES; i++) if (plife[i] > 0) n++; return n; },
    event(type, y, reduced) {
      if (type === "flap") flapBoost = 1;
      if (reduced) return;
      if (type === "flap") emit(0, C.birdX - 12, y + 6, 3);
      else if (type === "score") emit(1, C.birdX, y, 8);
      else if (type === "hit") { emit(2, C.birdX, y, 16); shake = 0.12; }
    },
    // dt in seconds of foreground visual time (frozen while paused)
    update(dt, reduced) {
      wingPhase += dt * (10 + flapBoost * 18);
      flapBoost = Math.max(0, flapBoost - dt * 4);
      shake = Math.max(0, shake - dt);
      for (let i = 0; i < MAX_PARTICLES; i++) {
        if (plife[i] <= 0) continue;
        plife[i] -= dt;
        px[i] += pvx[i] * dt;
        py[i] += pvy[i] * dt;
        pvy[i] += 220 * dt;
      }
      if (reduced) { plife.fill(0); shake = 0; }
    },
    // view: { y, vy, gates (with interpolated x), distance, bob, reduced, time }
    draw(v) {
      ctx.save();
      if (shake > 0 && !v.reduced) ctx.translate((Math.random() * 2 - 1) * 3, (Math.random() * 2 - 1) * 3);
      ctx.drawImage(sky, 0, 0, W, H);
      const farOff = v.reduced ? 0 : (v.distance * 0.08) % W;
      const midOff = v.reduced ? 0 : (v.distance * 0.18) % W;
      ctx.drawImage(far, -farOff, 404); ctx.drawImage(far, W - farOff, 404);
      ctx.drawImage(mid, -midOff, 446); ctx.drawImage(mid, W - midOff, 446);

      // Ceiling band (the top boundary is solid)
      ctx.fillStyle = "rgba(9,27,38,0.55)";
      ctx.fillRect(0, 0, W, C.ceiling);
      ctx.fillStyle = "rgba(114,231,204,0.35)";
      ctx.fillRect(0, C.ceiling - 2, W, 2);

      for (const g of v.gates) drawGate(g);
      drawGround(v.distance, v.reduced);
      drawParticles();
      drawCourier(v);
      ctx.restore();
    }
  };

  function drawGate(g) {
    for (const [i, b] of gateBoxes(g).entries()) {
      if (b.h <= 0) continue;
      const grad = ctx.createLinearGradient(b.x, 0, b.x + b.w, 0);
      grad.addColorStop(0, "#1A3F4A");
      grad.addColorStop(0.45, COLORS.gateGlass);
      grad.addColorStop(1, "#173842");
      ctx.fillStyle = grad;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      // Inner glass streak
      ctx.fillStyle = "rgba(114,231,204,0.10)";
      ctx.fillRect(b.x + 12, b.y, 8, b.h);
      // Lit lip at the gap edge (inside the solid box)
      const lipY = i === 0 ? b.y + b.h - 14 : b.y;
      ctx.fillStyle = "rgba(114,231,204,0.28)";
      ctx.fillRect(b.x, lipY, b.w, 14);
      // Solid straight edge, aligned with the collision rectangle
      ctx.strokeStyle = COLORS.gateEdge;
      ctx.lineWidth = 3;
      ctx.strokeRect(b.x + 1.5, b.y + 1.5, b.w - 3, b.h - 3);
      // Gold node lights on the lip
      ctx.fillStyle = COLORS.lamp;
      const ly = i === 0 ? b.y + b.h - 7 : b.y + 7;
      ctx.fillRect(b.x + 16, ly - 1.5, 4, 3);
      ctx.fillRect(b.x + b.w - 20, ly - 1.5, 4, 3);
    }
  }

  function drawGround(distance, reduced) {
    ctx.fillStyle = COLORS.ground;
    ctx.fillRect(0, C.floor, W, H - C.floor);
    ctx.fillStyle = "#72E7CC";
    ctx.fillRect(0, C.floor, W, 2);
    ctx.fillStyle = "#16343F";
    ctx.fillRect(0, C.floor + 22, W, 3);
    const off = distance % 48;
    for (let x = -off; x < W + 48; x += 48) {
      ctx.fillStyle = "rgba(255,209,137,0.18)";
      ctx.beginPath();
      ctx.arc(x + 24, C.floor + 12, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COLORS.lamp;
      ctx.fillRect(x + 22, C.floor + 10, 4, 4);
    }
  }

  function drawParticles() {
    for (let i = 0; i < MAX_PARTICLES; i++) {
      if (plife[i] <= 0) continue;
      ctx.globalAlpha = Math.max(0, plife[i] / pmax[i]);
      ctx.fillStyle = pkind[i] === 1 ? COLORS.gateEdge : COLORS.core;
      const s = pkind[i] === 2 ? 3 : 2.2;
      ctx.fillRect(px[i] - s / 2, py[i] - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
  }

  function drawCourier(v) {
    const target = Math.max(-0.35, Math.min(0.8, (v.vy / C.terminalVelocity) * 0.8));
    angle += (target - angle) * 0.25;
    const x = C.birdX, y = v.y + (v.bob || 0);
    // Warm halo (decorative, no collision)
    const halo = ctx.createRadialGradient(x, y, 4, x, y, 38);
    halo.addColorStop(0, "rgba(255,209,137,0.45)");
    halo.addColorStop(1, "rgba(255,209,137,0)");
    ctx.fillStyle = halo;
    ctx.fillRect(x - 38, y - 38, 76, 76);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    // Two short leaf wings behind the body
    const flap = v.reduced ? 0.2 : Math.sin(wingPhase) * 0.55;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(-4, side * 2);
      ctx.rotate(side * (0.5 + flap) - 0.2);
      ctx.fillStyle = side < 0 ? "#3FA593" : "#2E7F74";
      ctx.strokeStyle = COLORS.outline;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-10, side * -16, -24, side * -9);
      ctx.quadraticCurveTo(-12, side * -2, 0, 0);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    // Lantern core (radius 14 = collision radius)
    const core = ctx.createRadialGradient(-4, -5, 1, 0, 0, 14);
    core.addColorStop(0, COLORS.highlight);
    core.addColorStop(0.55, COLORS.core);
    core.addColorStop(1, "#E9A85A");
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLORS.outline;
    ctx.lineWidth = 2;
    ctx.stroke();
    // Little envelope emblem
    ctx.strokeStyle = "rgba(19,52,59,0.75)";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-5, 1, 10, 7);
    ctx.beginPath();
    ctx.moveTo(-5, 1); ctx.lineTo(0, 5); ctx.lineTo(5, 1);
    ctx.stroke();
    // Eye
    ctx.fillStyle = COLORS.outline;
    ctx.beginPath();
    ctx.arc(6, -4, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

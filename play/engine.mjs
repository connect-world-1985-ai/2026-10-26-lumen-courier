// Pure flight model: no DOM, clock, storage or audio access.
export const C = Object.freeze({
  width: 432, height: 768, ceiling: 56, floor: 704,
  birdX: 108, startY: 344, radius: 14,
  gravity: 1500, flapVelocity: -430, terminalVelocity: 620,
  gateWidth: 76, firstGateX: 612, step: 1 / 120
});

export function difficulty(n) {
  const d = Math.max(0, Math.min(1, (n - 3) / 27));
  return { gap: 198 - 36 * d, speed: 162 + 48 * d, spacing: 260 - 20 * d };
}

export function makeRandom(seed) {
  let state = seed >>> 0;
  return () => ((state = (Math.imul(1664525, state) + 1013904223) >>> 0) / 4294967296);
}

export function circleRect(x, y, r, box) {
  const qx = Math.max(box.x, Math.min(x, box.x + box.w));
  const qy = Math.max(box.y, Math.min(y, box.y + box.h));
  return (x - qx) ** 2 + (y - qy) ** 2 <= r * r;
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function spawnGate(run, x) {
  const d = difficulty(run.spawnIndex);
  const center = run.spawnIndex === 0
    ? C.startY
    : clamp(run.previousCenter + (run.rng() * 2 - 1) * 70, 170, 534);
  run.previousCenter = center;
  run.gates.push({ id: run.spawnIndex, x, center, gap: d.gap, passed: false });
  run.spawnIndex++;
}

export function createRun(seed) {
  const run = {
    y: C.startY, vy: 0, score: 0, dead: false, elapsed: 0, distance: 0,
    spawnIndex: 0, previousCenter: C.startY, gates: [], rng: makeRandom(seed), seed: seed >>> 0
  };
  spawnGate(run, C.firstGateX);
  return run;
}

export function newSeed() {
  return Math.floor(Math.random() * 4294967296);
}

export function gateBoxes(g) {
  const top = g.center - g.gap / 2;
  const bottom = g.center + g.gap / 2;
  return [
    { x: g.x, y: 0, w: C.gateWidth, h: top },
    { x: g.x, y: bottom, w: C.gateWidth, h: C.floor - bottom }
  ];
}

export function collides(run) {
  const r = C.radius;
  if (run.y - r <= C.ceiling || run.y + r >= C.floor) return true;
  for (const g of run.gates) {
    if (g.x > C.birdX + r || g.x + C.gateWidth < C.birdX - r) continue;
    const [a, b] = gateBoxes(g);
    if (circleRect(C.birdX, run.y, r, a) || circleRect(C.birdX, run.y, r, b)) return true;
  }
  return false;
}

// Advances exactly one fixed 1/120 s step and returns the events it produced.
export function step(run, flapRequested) {
  const events = [];
  if (run.dead) return events;
  const dt = C.step;
  if (flapRequested) {
    run.vy = C.flapVelocity;
    events.push({ type: "flap" });
  }
  run.vy = Math.min(C.terminalVelocity, run.vy + C.gravity * dt);
  run.y += run.vy * dt;
  run.elapsed += dt;

  const speed = difficulty(run.score).speed;
  run.distance += speed * dt;
  for (const g of run.gates) g.x -= speed * dt;

  for (let guard = 0; guard < 4; guard++) {
    const last = run.gates[run.gates.length - 1];
    const next = difficulty(run.spawnIndex);
    if (last.x <= C.width - next.spacing) spawnGate(run, last.x + next.spacing);
    else break;
  }

  if (collides(run)) {
    run.dead = true;
    events.push({ type: "hit" });
    return events;
  }
  for (const g of run.gates) {
    if (!g.passed && g.x + C.gateWidth < C.birdX - C.radius) {
      g.passed = true;
      run.score++;
      events.push({ type: "score", score: run.score });
    }
  }
  while (run.gates.length && run.gates[0].x + C.gateWidth < -20) run.gates.shift();
  return events;
}

// Fixed-step accumulator shared by the game loop and the tests.
export function createStepper() {
  return { previousTime: undefined, accumulator: 0 };
}
export function resetStepper(s) {
  s.previousTime = undefined;
  s.accumulator = 0;
}
// Returns -1 when the frame gap is too long (caller must pause), otherwise the steps run.
export function advance(s, timestamp, runStep, isPlaying = () => true) {
  const delta = s.previousTime === undefined ? 0 : (timestamp - s.previousTime) / 1000;
  s.previousTime = timestamp;
  if (delta > 0.100) {
    s.accumulator = 0;
    return -1;
  }
  s.accumulator += Math.max(0, delta);
  let steps = 0;
  while (s.accumulator >= C.step && isPlaying() && steps < 12) {
    s.accumulator -= C.step;
    steps++;
    runStep();
  }
  return steps;
}

export function medalKey(score) {
  if (score >= 30) return "medal30";
  if (score >= 15) return "medal15";
  if (score >= 5) return "medal5";
  return "medalNone";
}

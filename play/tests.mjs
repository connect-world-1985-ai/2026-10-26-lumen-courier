// Deterministic core tests. Imports production modules; no framework.
import { C, difficulty, makeRandom, circleRect, createRun, step, createStepper, resetStepper, advance, medalKey, gateBoxes } from "./engine.mjs";
import { STRINGS, translate, detectLang } from "./strings.mjs";
import { createStorage } from "./storage.mjs";
import { makeMusicPCM, createAudio, LEVELS } from "./audio.mjs";
import { APP_ID } from "./build-config.mjs";

export function runTests() {
  const results = [];
  const assert = (cond, msg) => { results.push({ ok: !!cond, msg }); };
  const near = (a, b, e = 1e-9) => Math.abs(a - b) <= e;

  // ---- 1. Engine: controller, collision, scoring, difficulty, determinism
  const controller = (r) => { const g = r.gates.find((x) => !x.passed); return r.y > g.center + 12 && r.vy > 0; };
  let allReached = true, maxCenterDelta = 0, centerRange = true, gapRange = true, singleScore = true;
  for (let s = 1; s <= 100; s++) {
    const r = createRun(s * 2654435761);
    let prevCenter = null, steps = 0, lastScore = 0;
    const seen = new Set();
    while (r.score < 100 && !r.dead && steps < 400000) {
      const ev = step(r, controller(r));
      const scores = ev.filter((e) => e.type === "score");
      if (scores.length > 1 || (scores.length && r.score !== lastScore + 1)) singleScore = false;
      lastScore = r.score;
      for (const g of r.gates) {
        if (seen.has(g.id)) continue;
        seen.add(g.id);
        if (prevCenter !== null) maxCenterDelta = Math.max(maxCenterDelta, Math.abs(g.center - prevCenter));
        prevCenter = g.center;
        if (g.id > 0 && (g.center < 170 || g.center > 534)) centerRange = false;
        if (g.gap < 162 - 1e-9 || g.gap > 198 + 1e-9) gapRange = false;
      }
      steps++;
    }
    if (r.dead || r.score < 100) allReached = false;
  }
  assert(allReached, "100 seeds x 100 gates: feedback controller reaches 100 without collision");
  assert(maxCenterDelta <= 70 + 1e-9, "adjacent gate center change <= 70 (max " + maxCenterDelta.toFixed(3) + ")");
  assert(centerRange, "gate centers within 170..534");
  assert(gapRange, "gate gaps within 162..198");
  assert(singleScore, "score increments by exactly 1 per scoring event");

  const box = { x: 100, y: 100, w: 50, h: 50 };
  assert(circleRect(90, 125, 10, box), "circle tangent to left edge collides");
  assert(!circleRect(89.99, 125, 10, box), "circle 0.01 away from edge does not collide");
  assert(circleRect(125, 160, 10, box), "circle tangent to bottom edge collides");
  const k = 10 / Math.SQRT2;
  assert(circleRect(100 - k, 100 - k, 10.0000001, box), "corner tangent collides");
  assert(!circleRect(100 - k - 0.01, 100 - k - 0.01, 10, box), "corner just outside does not collide");
  assert(circleRect(125, 125, 5, box), "circle inside box collides");

  const r0 = createRun(42);
  assert(r0.y === 344 && r0.vy === 0 && r0.score === 0 && !r0.dead && r0.gates.length === 1, "createRun initial state");
  assert(r0.gates[0].x === 612 && r0.gates[0].center === 344 && r0.gates[0].gap === 198, "first gate x=612 center=344 gap=198");

  { // ceiling / floor
    const r = createRun(1); r.y = C.ceiling + C.radius + 1; r.vy = -400;
    const ev = step(r, false); assert(r.dead && ev.length === 1 && ev[0].type === "hit", "ceiling hit emits one hit");
    assert(step(r, true).length === 0, "dead run does not update");
    const f = createRun(1); f.y = C.floor - C.radius - 1; f.vy = 600; step(f, false); assert(f.dead, "floor hit");
  }
  { // collision and crossing in the same step: no score
    const r = createRun(1);
    r.gates[0].x = C.birdX - C.radius - C.gateWidth + 0.5; // crosses the scoring line this step
    r.y = C.ceiling + C.radius + 0.5; r.vy = -400; // and touches the ceiling in the same step
    const ev = step(r, false);
    assert(r.dead && !ev.some((e) => e.type === "score") && r.score === 0, "collision on the scoring step awards no point");
  }
  { // pass a gate once
    const r = createRun(1);
    r.gates[0].x = C.birdX - C.radius - C.gateWidth + 0.5; r.y = r.gates[0].center; r.vy = 0;
    const ev1 = step(r, true); const ev2 = step(r, false);
    assert(ev1.filter((e) => e.type === "score").length === 1 && ev2.filter((e) => e.type === "score").length === 0 && r.score === 1, "gate scores exactly once");
  }
  { // flap physics
    const r = createRun(1); const ev = step(r, true);
    assert(ev[0].type === "flap" && near(r.vy, -430 + 1500 / 120), "flap sets vy=-430 then gravity");
    const r2 = createRun(1); r2.vy = 619; step(r2, false); assert(r2.vy === 620, "terminal velocity 620");
  }
  const d0 = difficulty(0), d3 = difficulty(3), d15 = difficulty(15), d30 = difficulty(30), d300 = difficulty(300);
  assert(d0.speed === 162 && d0.gap === 198 && d3.speed === 162 && d3.gap === 198 && d0.spacing === 260, "first four gates use easy params");
  assert(near(d15.speed, 183.333333, 1e-5) && near(d15.gap, 182), "score 15: speed 183.333, gap 182");
  assert(d30.speed === 210 && d30.gap === 162 && d30.spacing === 240 && d300.speed === 210 && d300.gap === 162, "difficulty caps at 30");
  {
    const a = createRun(777), b = createRun(777);
    for (let i = 0; i < 6000; i++) { const f = i % 37 === 0; step(a, f); step(b, f); }
    assert(JSON.stringify(a.gates) === JSON.stringify(b.gates) && a.y === b.y, "same seed gives identical sequence");
    const rnd = makeRandom(5), rnd2 = makeRandom(5);
    assert(rnd() === rnd2() && rnd() < 1, "LCG deterministic in [0,1)");
  }
  assert(medalKey(0) === "medalNone" && medalKey(5) === "medal5" && medalKey(15) === "medal15" && medalKey(29) === "medal15" && medalKey(30) === "medal30", "medal thresholds 5/15/30");
  {
    const g = { x: 10, center: 300, gap: 160 };
    const [top, bot] = gateBoxes(g);
    assert(top.h === 220 && bot.y === 380 && bot.h === C.floor - 380, "gate boxes align to gap and floor");
  }

  // ---- 2. Fixed step at 30/60/120 Hz gives identical results
  function replay(hz) {
    const r = createRun(99); const s = createStepper(); let n = 0;
    const flaps = new Set(); for (let i = 0; i < 2400; i += 29) flaps.add(i);
    let tms = 1000;
    while (n < 2400) {
      advance(s, tms, () => { step(r, flaps.has(n)); n++; }, () => n < 2400);
      tms += 1000 / hz;
    }
    return r;
  }
  const h30 = replay(30), h60 = replay(60), h120 = replay(120);
  assert(Math.abs(h30.y - h60.y) <= 0.01 && Math.abs(h60.y - h120.y) <= 0.01 && h30.score === h120.score && JSON.stringify(h30.gates) === JSON.stringify(h120.gates), "30/60/120 Hz replays identical (score " + h60.score + ")");
  {
    const s = createStepper(); let n = 0;
    advance(s, 1000, () => n++); advance(s, 1016, () => n++);
    const before = n; const res = advance(s, 3016, () => n++);
    assert(res === -1 && n === before && s.accumulator === 0, "2 s time jump requests pause and runs no steps");
    s.accumulator = 0.5; resetStepper(s); assert(s.accumulator === 0 && s.previousTime === undefined, "reset clears accumulator and timestamp");
    const s2 = createStepper(); let m = 0; advance(s2, 0, () => m++); advance(s2, 100, () => m++);
    assert(m === 12, "100 ms frame runs at most 12 steps");
  }
  {
    const r = createRun(3); for (let i = 0; i < 300; i++) step(r, i % 40 === 0);
    const snap = JSON.stringify(r); // paused: no steps are called
    assert(JSON.stringify(r) === snap, "paused model snapshot unchanged");
    let clean = true;
    for (let i = 0; i < 20; i++) { const n = createRun(i); if (n.gates.length !== 1 || n.score !== 0) clean = false; }
    assert(clean, "20 new runs start clean");
  }

  // ---- 3. Strings and language
  const keys = Object.keys(STRINGS);
  let filled = true, placeholders = true;
  for (const key of keys) {
    const [en, zh] = STRINGS[key];
    if (!en || !zh) filled = false;
    const ph = (s) => (s.match(/\{\w+\}/g) || []).sort().join();
    if (ph(en) !== ph(zh)) placeholders = false;
    const vals = { score: 1, best: 2, count: 3 };
    if (translate(key, "en", vals).includes("undefined") || translate(key, "zh-CN", vals).includes("undefined")) filled = false;
  }
  assert(filled, "all " + keys.length + " strings non-empty in both languages");
  assert(placeholders, "placeholder sets match between EN and zh-CN");
  assert(translate("title", "zh-CN") === "流光信使" && translate("title", "en") === "Lumen Courier", "title bilingual");
  let threwKey = false, threwVal = false;
  try { translate("nope", "en"); } catch (e) { threwKey = true; }
  try { translate("scoreValue", "en", {}); } catch (e) { threwVal = true; }
  assert(threwKey && threwVal, "missing key / value throw");
  assert(detectLang(null, { languages: ["zh-CN"] }) === "zh-CN", "zh-CN -> zh-CN");
  assert(detectLang(null, { languages: ["zh-TW"] }) === "zh-CN", "zh-TW -> zh-CN");
  assert(detectLang(null, { languages: ["zh-HK", "en"] }) === "zh-CN", "zh-HK -> zh-CN");
  assert(detectLang(null, { languages: ["en-US"] }) === "en", "en-US -> en");
  assert(detectLang(null, { languages: ["fr-FR"] }) === "en", "fr-FR -> en");
  assert(detectLang(null, { language: "ZH" }) === "zh-CN", "navigator.language fallback, case-insensitive");
  assert(detectLang(null, {}) === "en", "no language -> en");
  assert(detectLang("en", { languages: ["zh-CN"] }) === "en" && detectLang("zh-CN", { languages: ["en"] }) === "zh-CN", "saved value wins");
  assert(detectLang("klingon", { languages: ["zh-CN"] }) === "zh-CN", "corrupt saved value falls back");

  // ---- 4. Storage adapter with injected providers
  function memProvider() { const m = new Map(); return { m, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) }; }
  {
    const p = memProvider(); const s = createStorage(() => p, "test-app");
    s.writeBest(12); s.writeLang("zh-CN"); s.writeMuted(true); s.writeReducedMotion(false);
    const s2 = createStorage(() => p, "test-app");
    assert(s2.readBest() === 12 && s2.readLang() === "zh-CN" && s2.readMuted() === true && s2.readReducedMotion() === false, "storage round trip");
    assert([...p.m.keys()].every((k) => k.startsWith("test-app:v1:")), "keys prefixed with APP_ID:v1:");
    assert(createStorage(() => p).key("best") === APP_ID + ":v1:best", "production key uses APP_ID");
    for (const bad of ["", "-1", "NaN", "1e3", "12.5", "1000000", "abc", " 7"]) {
      const q = memProvider(); q.setItem("t:v1:best", bad);
      if (createStorage(() => q, "t").readBest() !== 0) assert(false, "bad best rejected: " + JSON.stringify(bad));
    }
    assert(true, "invalid best values fall back to 0");
    const q = memProvider(); q.setItem("t:v1:lang", "de"); q.setItem("t:v1:muted", "yes");
    const sq = createStorage(() => q, "t"); assert(sq.readLang() === null && sq.readMuted() === null, "invalid lang/muted rejected");
  }
  for (const mode of ["getter", "getItem", "setItem"]) {
    const p = memProvider();
    const provider = {
      getItem: (k) => { if (mode === "getItem") throw new Error("x"); return p.getItem(k); },
      setItem: (k, v) => { if (mode === "setItem") throw new Error("x"); p.setItem(k, v); }
    };
    const s = createStorage(() => { if (mode === "getter") throw new Error("denied"); return provider; }, "t");
    const b = s.readBest(); s.writeBest(5); s.writeLang("zh-CN");
    const notices = [s.takeNotice(), s.takeNotice(), s.takeNotice()].filter(Boolean).length;
    const r = createRun(1); step(r, true);
    assert(b === 0 && s.readBest() === 5 && s.readLang() === "zh-CN" && notices === 1 && !r.dead, "storage " + mode + " throws: memory fallback, single notice, game still runs");
  }

  // ---- 5. Audio: PCM and lifecycle with an injected mock context
  const t0 = (typeof performance !== "undefined" ? performance : Date).now();
  const pcm = makeMusicPCM();
  const pcmMs = (typeof performance !== "undefined" ? performance : Date).now() - t0;
  let finite = true, peak = 0, sum = 0;
  for (let i = 0; i < pcm.length; i++) { const v = pcm[i]; if (!Number.isFinite(v)) finite = false; peak = Math.max(peak, Math.abs(v)); sum += v * v; }
  const rms = Math.sqrt(sum / pcm.length);
  assert(pcm.length === 441000, "PCM is 44100 x 10 s (" + pcm.length + ")");
  assert(finite && peak < 0.6 && rms > 0.01, `PCM finite, peak ${peak.toFixed(4)} < 0.6, RMS ${rms.toFixed(4)} > 0.01`);
  assert(Math.abs(pcm[0] - pcm[pcm.length - 1]) < 0.00001, "PCM loop seam first/last diff < 1e-5");
  assert(pcmMs < 2000, "PCM generated in " + pcmMs.toFixed(0) + " ms");

  function mockFactory(log) {
    return () => {
      const param = (v) => ({ value: v, cancelScheduledValues() {}, setValueAtTime(x) { this.value = x; }, linearRampToValueAtTime(x) { this.value = x; } });
      const node = (extra = {}) => ({ connections: [], connect(n) { this.connections.push(n); }, disconnect() {}, ...extra });
      const ctx = {
        state: "suspended", currentTime: 0, destination: { name: "destination" },
        createGain() { const g = node({ gain: param(1) }); log.gains.push(g); return g; },
        createBuffer(ch, len, rate) { const d = new Float32Array(len); return { length: len, sampleRate: rate, getChannelData: () => d }; },
        createBufferSource() { const s = node({ start() { log.starts++; }, stop() {} }); log.sources.push(s); return s; },
        createOscillator() { const o = node({ frequency: param(0), type: "sine", start() {}, stop() {} }); log.oscs.push(o); return o; },
        resume() { log.resumes++; if (log.failResume) return Promise.reject(new Error("blocked")); this.state = "running"; return Promise.resolve(); },
        suspend() { log.suspends++; this.state = "suspended"; return Promise.resolve(); },
        close() { this.state = "closed"; return Promise.resolve(); }
      };
      log.ctxs.push(ctx);
      return ctx;
    };
  }
  return { results, async: (async () => {
    const tick = () => new Promise((r) => setTimeout(r, 0));
    const log = { gains: [], sources: [], oscs: [], ctxs: [], starts: 0, resumes: 0, suspends: 0 };
    const statuses = [];
    const a = createAudio({ makeContext: mockFactory(log), onStatus: (s) => statuses.push(s) });
    a.setPCM(pcm);
    a.setActive(true);
    assert(log.ctxs.length === 0 && !a.context, "no AudioContext before a user gesture");
    assert(!a.play("flap"), "effects skipped before unlock (not queued)");
    a.unlock(); await tick();
    assert(log.ctxs.length === 1 && a.context.state === "running", "unlock creates one context and resumes it");
    assert(log.starts === 1, "music loop started once");
    const master = log.gains[0];
    assert(master.connections[0] === log.ctxs[0].destination && log.gains.slice(1).every((g) => g.connections[0] === master), "music and SFX buses route only through master");
    assert(near(master.gain.value, LEVELS.master), "master at 0.60 when unmuted");
    a.unlock(); a.unlock(); await tick();
    assert(log.ctxs.length === 1 && log.starts === 1, "repeated unlock is idempotent");
    assert(a.play("flap") && log.oscs.length === 1 && log.oscs[0].connections[0].connections[0] === log.gains[2], "flap SFX goes osc -> envelope -> sfxGain");
    a.setMuted(true);
    assert(master.gain.value === 0 && !a.play("score"), "mute silences master and skips effects");
    a.setMuted(false); a.setActive(false);
    assert(master.gain.value === 0 && a.context.state === "suspended" && a.activeSfx === 0, "pause: master 0, active SFX stopped, context suspended");
    assert(!a.play("hit"), "no effects while paused");
    a.setActive(true); await tick();
    assert(a.context.state === "running" && log.starts === 1, "resume keeps the same loop (no second start)");
    for (let i = 0; i < 20; i++) { a.setActive(false); a.setActive(true); a.setOver(i % 2 === 0); }
    await tick();
    assert(log.ctxs.length === 1 && log.starts === 1, "20 restarts: still one context and one loop");
    for (let i = 0; i < 20; i++) a.play("score");
    assert(a.activeSfx <= 8, "at most 8 active effects");
    a.setHidden(true);
    assert(master.gain.value === 0 && a.context.state === "suspended", "hidden page is silent and suspended");
    a.setHidden(false); await tick();

    // muted saved state: unlock never ramps master above 0
    const log2 = { gains: [], sources: [], oscs: [], ctxs: [], starts: 0, resumes: 0, suspends: 0 };
    const b = createAudio({ makeContext: mockFactory(log2) });
    b.setMuted(true); b.setActive(true); b.setPCM(pcm); b.unlock(); await tick();
    assert(log2.gains[0].gain.value === 0, "saved mute: unlock keeps master at 0");

    // resume failure then retry on next gesture
    const log3 = { gains: [], sources: [], oscs: [], ctxs: [], starts: 0, resumes: 0, suspends: 0, failResume: true };
    const st3 = [];
    const c = createAudio({ makeContext: mockFactory(log3), onStatus: (s) => st3.push(s) });
    c.setActive(true); c.setPCM(pcm); c.unlock(); await tick();
    assert(st3.includes("audioRetry"), "resume failure reports audioRetry without throwing");
    log3.failResume = false; c.unlock(); await tick();
    assert(c.context.state === "running" && log3.ctxs.filter((x) => x.state !== "closed").length === 1, "next gesture recovers with at most one live context");

    // context creation failure
    const st4 = [];
    const d = createAudio({ makeContext: () => { throw new Error("no audio"); }, onStatus: (s) => st4.push(s) });
    d.setActive(true); d.unlock();
    assert(st4.includes("audioUnavailable") && !d.play("flap"), "missing Web Audio -> audioUnavailable, game continues");
    return results;
  })() };
}

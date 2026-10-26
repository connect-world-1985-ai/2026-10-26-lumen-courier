// Original music and sound, synthesized entirely in code (no audio files).
export function makeMusicPCM(rate = 44100) {
  const beat = 60 / 96;
  const length = Math.round(16 * beat * rate);
  const data = new Float32Array(length);
  const melody = [
    74,78,81,78,76,78,69,0, 71,74,78,74,73,76,69,0,
    67,71,74,71,69,71,66,0, 69,73,76,73,74,73,69,0
  ];
  const roots = [50,47,43,45];
  const chords = [[62,66,69],[59,62,66],[55,59,62],[57,61,64]];
  function note(midi, start, duration, amplitude, harmonic = 0) {
    if (!midi) return; // 0 是休止符，不是频率
    const frequency = 440 * 2 ** ((midi - 69) / 12);
    const offset = Math.round(start * rate);
    const count = Math.min(Math.round(duration * rate), length - offset);
    for (let i = 0; i < count; i++) {
      const t = i / rate;
      const envelope = Math.max(0, Math.min(1, t / 0.012, (duration - t) / 0.06));
      data[offset + i] += amplitude * envelope *
        (Math.sin(2 * Math.PI * frequency * t) + harmonic * Math.sin(4 * Math.PI * frequency * t));
    }
  }
  melody.forEach((m, i) => note(m, i * beat / 2, beat * 0.42, 0.10, 0.18));
  roots.forEach((m, bar) => {
    for (let j = 0; j < 4; j++) note(m, (bar * 4 + j) * beat, beat * 0.8, 0.12);
    chords[bar].forEach(n => note(n, bar * 4 * beat, beat * 3.8, 0.025));
  });
  return data;
}

export const MUSIC_RATE = 44100;
export const LEVELS = Object.freeze({ master: 0.60, music: 0.30, musicOver: 0.18, sfx: 0.55 });
const MAX_SFX = 8;

const SFX = {
  flap: [{ type: "sine", from: 620, to: 900, at: 0, dur: 0.10, slide: 0.09, gain: 0.10 }],
  score: [
    { type: "sine", from: 880, to: 880, at: 0, dur: 0.07, gain: 0.10 },
    { type: "sine", from: 1174.66, to: 1174.66, at: 0.055, dur: 0.09, gain: 0.10 }
  ],
  hit: [{ type: "triangle", from: 180, to: 70, at: 0, dur: 0.17, slide: 0.16, gain: 0.16 }],
  best: [
    { type: "sine", from: 587.33, to: 587.33, at: 0, dur: 0.12, gain: 0.08 },
    { type: "sine", from: 739.99, to: 739.99, at: 0.09, dur: 0.12, gain: 0.08 },
    { type: "sine", from: 880, to: 880, at: 0.18, dur: 0.12, gain: 0.08 }
  ]
};

function defaultContext() {
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) throw new Error("Web Audio unavailable");
  return new Ctor();
}

// One AudioContext -> masterGain -> destination; music and every effect route through master.
// makeContext is injectable so the lifecycle can be tested without real sound.
export function createAudio({ makeContext = defaultContext, onStatus = () => {} } = {}) {
  let ctx = null, master = null, musicGain = null, sfxGain = null, source = null;
  let pcm = null, unlocked = false, muted = false, desiredActive = false, hidden = false, over = false;
  let epoch = 0, failedResume = false;
  const active = new Set();
  const stats = { contexts: 0, sourcesStarted: 0, resumes: 0, suspends: 0, sfxPlayed: 0, sfxSkipped: 0 };

  const shouldPlay = () => unlocked && desiredActive && !hidden;

  function setNow(param, value) {
    const t = ctx.currentTime;
    param.cancelScheduledValues(t);
    param.setValueAtTime(value, t);
  }
  function ramp(param, target) {
    const t = ctx.currentTime;
    param.cancelScheduledValues(t);
    param.setValueAtTime(param.value, t);
    param.linearRampToValueAtTime(target, t + 0.02);
  }

  function build() {
    ctx = makeContext();
    stats.contexts++;
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = LEVELS.music;
    musicGain.connect(master);
    sfxGain = ctx.createGain();
    sfxGain.gain.value = LEVELS.sfx;
    sfxGain.connect(master);
    source = null;
    if (typeof ctx.addEventListener === "function") {
      ctx.addEventListener("statechange", () => reconcile(false));
    }
  }

  function teardown() {
    stopSfx();
    try { if (source) { source.stop(); source.disconnect(); } } catch (e) { /* already stopped */ }
    source = null;
    const old = ctx;
    ctx = null;
    try { const p = old && old.close(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* ignore */ }
  }

  function ensureLoop() {
    if (source || !ctx || !pcm || !shouldPlay()) return;
    const buffer = ctx.createBuffer(1, pcm.length, MUSIC_RATE);
    buffer.getChannelData(0).set(pcm);
    const s = ctx.createBufferSource();
    s.buffer = buffer;
    s.loop = true;
    s.connect(musicGain);
    s.start();
    source = s;
    stats.sourcesStarted++;
  }

  function stopSfx() {
    for (const node of active) {
      try { node.stop(); node.disconnect(); } catch (e) { /* ended */ }
    }
    active.clear();
  }

  function resume() {
    const mine = ++epoch;
    stats.resumes++;
    let p;
    try { p = ctx.resume(); } catch (e) { p = Promise.reject(e); }
    Promise.resolve(p).then(() => {
      if (mine !== epoch || !ctx) return;
      failedResume = false;
      reconcile(false);
    }, () => {
      if (mine !== epoch) return;
      failedResume = true;
      onStatus("audioRetry");
    });
  }

  // Bring the graph in line with the latest desired state. Never changes game state.
  function reconcile(allowResume = true) {
    if (!ctx) return;
    if (shouldPlay()) {
      if (ctx.state !== "running" && allowResume) resume();
      ensureLoop();
      ramp(master.gain, muted ? 0 : LEVELS.master);
      ramp(musicGain.gain, over ? LEVELS.musicOver : LEVELS.music);
    } else {
      setNow(master.gain, 0);
      stopSfx();
      if (ctx.state === "running") {
        ++epoch;
        stats.suspends++;
        try { const p = ctx.suspend(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* ignore */ }
      }
    }
  }

  return {
    stats,
    get context() { return ctx; },
    get activeSfx() { return active.size; },
    get unlocked() { return unlocked; },
    setPCM(data) { pcm = data; reconcile(false); },
    // Idempotent; call synchronously from trusted gesture handlers before any await.
    unlock() {
      try {
        if (ctx && (ctx.state === "closed" || (failedResume && ctx.state !== "running"))) teardown();
        if (!ctx) build();
      } catch (e) {
        ctx = null;
        onStatus("audioUnavailable");
        return;
      }
      unlocked = true;
      if (shouldPlay() && ctx.state !== "running") resume();
      reconcile(false);
    },
    setMuted(value) { muted = !!value; reconcile(); },
    setActive(value) { desiredActive = !!value; reconcile(); },
    setHidden(value) { hidden = !!value; reconcile(!hidden); },
    setOver(value) { over = !!value; reconcile(false); },
    play(name) {
      const spec = SFX[name];
      if (!spec || !ctx || ctx.state !== "running" || muted || !shouldPlay() || active.size >= MAX_SFX) {
        stats.sfxSkipped++;
        return false;
      }
      const t0 = ctx.currentTime + 0.005;
      for (const v of spec) {
        if (active.size >= MAX_SFX) break;
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        const start = t0 + v.at;
        osc.type = v.type;
        osc.frequency.setValueAtTime(v.from, start);
        if (v.to !== v.from) osc.frequency.linearRampToValueAtTime(v.to, start + (v.slide || v.dur));
        env.gain.setValueAtTime(0, start);
        env.gain.linearRampToValueAtTime(v.gain, start + 0.005);
        env.gain.linearRampToValueAtTime(0, start + v.dur);
        osc.connect(env);
        env.connect(sfxGain);
        osc.onended = () => { active.delete(osc); try { osc.disconnect(); env.disconnect(); } catch (e) { /* ignore */ } };
        osc.start(start);
        osc.stop(start + v.dur + 0.01);
        active.add(osc);
      }
      stats.sfxPlayed++;
      return true;
    }
  };
}

// Single entry point: state machine, input, DOM, time loop.
import { translate, detectLang } from "./strings.mjs";
import { createStorage } from "./storage.mjs";
import { C, createRun, step, newSeed, createStepper, resetStepper, advance, medalKey } from "./engine.mjs";
import { createRenderer } from "./render.mjs";
import { createAudio, makeMusicPCM } from "./audio.mjs";

const $ = (id) => document.getElementById(id);
const canvas = $("scene");
const stage = $("stage");
const slot = $("slot");
const storage = createStorage();

let lang = detectLang(storage.readLang(), navigator);
let best = storage.readBest();
let muted = storage.readMuted() === true;
const motionQuery = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
let reducedSaved = storage.readReducedMotion();
let reduced = reducedSaved === null ? !!(motionQuery && motionQuery.matches) : reducedSaved;
const coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;

let state = "BOOT";
let settingsOpen = false;
let run = createRun(1);
let prevY = run.y, prevDistance = run.distance;
let pendingFlap = false;
let rafId = null;
const stepper = createStepper();
let visualTime = 0, lastVisual;
let dyingLeft = 0, overLockUntil = 0;
let pausedHintKey = "pausedHint";
let lastScoreKey = null, newBestThisRun = false, runStartBest = 0;
let notice = null;
let tipKey = null;

const t = (key, values) => translate(key, lang, values);

const audio = createAudio({ onStatus: (key) => showNotice(key) });

let renderer;
try {
  if (!canvas.getContext || !canvas.getContext("2d")) throw new Error("no canvas");
  renderer = createRenderer(canvas);
} catch (e) {
  renderer = null;
}

// ---------- i18n ----------
function applyLanguage() {
  document.documentElement.lang = lang;
  document.title = t("title");
  document.querySelector('meta[name="description"]').setAttribute("content", t("metaDescription"));
  for (const el of document.querySelectorAll("[data-i18n]")) el.textContent = t(el.dataset.i18n);
  for (const el of document.querySelectorAll("[data-i18n-aria]")) el.setAttribute("aria-label", t(el.dataset.i18nAria));
  const switchLabel = lang === "zh-CN" ? t("switchToEnglish") : t("switchToChinese");
  $("langBtn").setAttribute("aria-label", switchLabel);
  $("setLang").setAttribute("aria-label", switchLabel);
  $("hintLine").textContent = coarse ? t("touchHint") : t("desktopHint");
  refreshDynamic();
}

function refreshDynamic() {
  $("score").textContent = String(run.score);
  $("score").setAttribute("aria-label", t("scoreValue", { score: run.score }));
  $("bestHud").textContent = t("bestValue", { best });
  const soundText = muted ? t("soundOff") : t("soundOn");
  const soundAction = muted ? t("unmuteAction") : t("muteAction");
  for (const b of [$("soundBtn"), $("setSound")]) {
    b.textContent = soundText;
    b.setAttribute("aria-label", soundAction);
    b.setAttribute("aria-pressed", String(!muted));
  }
  $("soundLabel").textContent = soundText;
  $("setMotion").textContent = reduced ? t("motionOn") : t("motionOff");
  $("setMotion").setAttribute("aria-pressed", String(reduced));
  $("pausedHint").textContent = t(pausedHintKey);
  $("overScore").textContent = t("overScore", { score: run.score });
  $("overBest").textContent = t("bestValue", { best });
  $("medal").textContent = t(medalKey(run.score));
  $("overTip").textContent = t(run.score < 5 ? "earlyTip" : "nextTip");
  $("tip").textContent = tipKey ? t(tipKey) : "";
  if (notice) $("notice").textContent = t(notice);
  if (lastScoreKey) $("toast").textContent = t("milestone", { count: lastScoreKey });
}

function showNotice(key) {
  notice = key;
  $("notice").hidden = false;
  $("notice").textContent = t(key);
}

function announce(key, values) {
  $("live").textContent = t(key, values);
}

// ---------- state machine (single entry point) ----------
const cards = ["boot", "ready", "paused", "over", "settings", "unsupported"];
function showCard(name) {
  for (const c of cards) $("card-" + c).hidden = c !== name;
}

function audioWanted() {
  return state === "READY" || state === "PLAYING" || state === "DYING" || state === "OVER";
}

function setState(next, opts = {}) {
  state = next;
  settingsOpen = false;
  pendingFlap = false;
  resetStepper(stepper);
  lastVisual = undefined;
  $("pauseBtn").hidden = !(next === "PLAYING" || next === "PAUSED");
  $("pauseBtn").disabled = next !== "PLAYING";
  document.body.dataset.state = next;
  $("tip").hidden = !(next === "PLAYING" && run.score < 3 && tipKey);
  switch (next) {
    case "READY":
      run = createRun(1);
      syncPrev();
      renderer && renderer.reset();
      showCard("ready");
      announce("stateReady");
      tipKey = null;
      break;
    case "PLAYING":
      showCard(null);
      if (opts.focus !== false) canvas.focus({ preventScroll: true });
      break;
    case "PAUSED":
      pausedHintKey = opts.hint || "pausedHint";
      showCard("paused");
      announce("statePaused");
      $("resumeBtn").focus({ preventScroll: true });
      break;
    case "DYING":
      dyingLeft = 0.45;
      showCard(null);
      break;
    case "OVER": {
      showCard("over");
      overLockUntil = visualTime + 0.45;
      $("againBtn").setAttribute("aria-disabled", "true");
      $("newBest").hidden = !newBestThisRun;
      announce("stateOver", { score: run.score, best });
      $("againBtn").focus({ preventScroll: true });
      if (newBestThisRun) audio.play("best");
      break;
    }
  }
  audio.setOver(next === "OVER");
  audio.setActive(audioWanted());
  refreshDynamic();
}

function syncPrev() {
  prevY = run.y;
  prevDistance = run.distance;
}

function startRun() {
  run = createRun(newSeed());
  syncPrev();
  renderer && renderer.reset();
  newBestThisRun = false;
  runStartBest = best;
  lastScoreKey = null;
  tipKey = "readyHint";
  $("tip").classList.remove("hide");
  setState("PLAYING");
  $("tip").hidden = false;
  pendingFlap = true; // the same gesture that starts also flaps once
  announce("statePlaying");
}

function pause(hint) {
  if (state !== "PLAYING") return;
  setState("PAUSED", { hint });
}

function resume() {
  if (state !== "PAUSED") return;
  syncPrev();
  setState("PLAYING");
  announce("stateResumed");
}

function goHome() {
  setState("READY");
  $("playBtn").focus({ preventScroll: true });
}

function openSettings() {
  if (state === "PLAYING") pause();
  if (!(state === "READY" || state === "OVER" || state === "PAUSED")) return;
  settingsOpen = true;
  showCard("settings");
  $("closeSettings").focus({ preventScroll: true });
}

function closeSettings() {
  if (!settingsOpen) return;
  settingsOpen = false;
  showCard(state === "READY" ? "ready" : state === "OVER" ? "over" : "paused");
  const back = { READY: "playBtn", OVER: "againBtn", PAUSED: "resumeBtn" }[state];
  if (back) $(back).focus({ preventScroll: true });
}

function canStartFromOver() {
  return state === "OVER" && visualTime >= overLockUntil && !settingsOpen;
}

// Primary action: flap / start / restart.
function primaryAction() {
  if (settingsOpen) return;
  if (state === "READY") startRun();
  else if (state === "PLAYING") pendingFlap = true;
  else if (canStartFromOver()) startRun();
}

function toggleSound() {
  muted = !muted;
  storage.writeMuted(muted);
  audio.setMuted(muted);
  refreshDynamic();
  checkStorageNotice();
}

function toggleLang() {
  lang = lang === "zh-CN" ? "en" : "zh-CN";
  storage.writeLang(lang);
  applyLanguage();
  checkStorageNotice();
}

function toggleMotion() {
  reduced = !reduced;
  storage.writeReducedMotion(reduced);
  refreshDynamic();
  checkStorageNotice();
}

function checkStorageNotice() {
  if (storage.takeNotice()) showNotice("storageUnavailable");
}

// ---------- game events ----------
function applyEvents(events) {
  for (const e of events) {
    renderer && renderer.event(e.type, run.y, reduced);
    if (e.type === "flap") audio.play("flap");
    else if (e.type === "score") {
      audio.play("score");
      $("score").textContent = String(run.score);
      if (run.score > best) {
        best = run.score;
        newBestThisRun = best > runStartBest;
        storage.writeBest(best);
        checkStorageNotice();
      }
      if (run.score === 3) $("tip").classList.add("hide");
      if (run.score === 5 || run.score === 15 || run.score === 30) milestone(run.score);
      refreshDynamic();
    } else if (e.type === "hit") {
      audio.play("hit");
      setState("DYING");
    }
  }
}

let toastTimer = 0;
function milestone(n) {
  lastScoreKey = n;
  $("toast").textContent = t("milestone", { count: n });
  $("toast").classList.add("show");
  toastTimer = 0.6;
  announce("milestone", { count: n });
}

// ---------- loop ----------
function frame(timestamp) {
  rafId = null;
  if (document.hidden) return;
  const vdt = lastVisual === undefined ? 0 : Math.min(Math.max((timestamp - lastVisual) / 1000, 0), 0.05);
  lastVisual = timestamp;
  if (state === "PLAYING") {
    const steps = advance(stepper, timestamp, () => {
      prevY = run.y;
      prevDistance = run.distance;
      const events = step(run, pendingFlap);
      pendingFlap = false;
      applyEvents(events);
    }, () => state === "PLAYING");
    if (steps < 0) pause("stalledHint");
    else visualTime += vdt;
  } else if (state !== "PAUSED") {
    visualTime += vdt;
    if (state === "DYING") {
      dyingLeft -= vdt;
      if (dyingLeft <= 0) setState("OVER");
    }
  }
  if (state === "OVER" && visualTime >= overLockUntil && $("againBtn").getAttribute("aria-disabled") === "true") $("againBtn").setAttribute("aria-disabled", "false");
  if (toastTimer > 0 && state !== "PAUSED") {
    toastTimer -= vdt;
    if (toastTimer <= 0) $("toast").classList.remove("show");
  }
  draw();
  rafId = requestAnimationFrame(frame);
}

function draw() {
  if (!renderer) return;
  const frozen = state !== "PLAYING";
  const alpha = frozen ? 1 : Math.max(0, Math.min(1, stepper.accumulator / C.step));
  if (state !== "PAUSED") renderer.update(lastVisualDt(), reduced);
  const shift = (run.distance - prevDistance) * (1 - alpha);
  const gates = run.gates.map((g) => ({ x: g.x + shift, center: g.center, gap: g.gap }));
  renderer.draw({
    y: frozen ? run.y : prevY + (run.y - prevY) * alpha,
    vy: run.vy,
    gates,
    distance: run.distance - shift + (state === "READY" && !reduced ? visualTime * 40 : 0),
    bob: state === "READY" && !reduced ? Math.sin(visualTime * 3) * 4 : 0,
    reduced
  });
}

let prevVisualForParticles = 0;
function lastVisualDt() {
  const d = visualTime - prevVisualForParticles;
  prevVisualForParticles = visualTime;
  return Math.max(0, Math.min(0.05, d));
}

function schedule() {
  if (rafId === null && !document.hidden) rafId = requestAnimationFrame(frame);
}

// ---------- layout ----------
let lastStage = null;
function layout() {
  const w = slot.clientWidth, h = slot.clientHeight;
  if (!w || !h) return;
  const scale = Math.min(w / C.width, h / C.height);
  const cssW = Math.max(1, Math.floor(C.width * scale)), cssH = Math.max(1, Math.floor(C.height * scale));
  if (lastStage && cssW === lastStage.w && cssH === lastStage.h) return;
  const changed = lastStage && (Math.abs(cssW - lastStage.w) / lastStage.w > 0.05 || Math.abs(cssH - lastStage.h) / lastStage.h > 0.05);
  lastStage = { w: cssW, h: cssH };
  stage.style.width = cssW + "px";
  stage.style.height = cssH + "px";
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderer && renderer.resize(Math.round(cssW * dpr), Math.round(cssH * dpr));
  resetStepper(stepper);
  if (changed && state === "PLAYING") pause("resizedHint");
  draw();
}
let layoutQueued = false;
function queueLayout() {
  if (layoutQueued) return;
  layoutQueued = true;
  requestAnimationFrame(() => { layoutQueued = false; layout(); });
}

// ---------- input (installed once) ----------
function installInput() {
  const unlock = (e) => { if (e.isTrusted) audio.unlock(); };
  document.addEventListener("pointerdown", unlock, { capture: true });
  document.addEventListener("keydown", unlock, { capture: true });
  document.addEventListener("pointerup", unlock, { capture: true });
  document.addEventListener("click", unlock, { capture: true });

  canvas.addEventListener("pointerdown", (e) => {
    if (!e.isPrimary || e.button !== 0) return;
    if (e.target.closest("button,a,input,select,textarea")) return;
    e.preventDefault();
    if (state === "BOOT") return;
    if (document.activeElement !== canvas && state !== "PAUSED") canvas.focus({ preventScroll: true });
    primaryAction();
  }, { passive: false });
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.altKey || e.metaKey || e.repeat) return;
    const el = e.target;
    if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
    const onButton = el && el.tagName === "BUTTON";
    const k = e.code;
    if (k === "Space" || k === "ArrowUp") {
      if (onButton && (k === "Space")) return; // native button activation
      if (state === "BOOT") return;
      e.preventDefault();
      if (state === "PAUSED") return;
      if (state !== "PLAYING" && !settingsOpen && (state === "READY" || canStartFromOver())) {
        canvas.focus({ preventScroll: true });
      }
      primaryAction();
    } else if (k === "KeyP" || k === "Escape") {
      if (settingsOpen) { e.preventDefault(); closeSettings(); return; }
      if (state === "PLAYING") { e.preventDefault(); pause(); }
      else if (state === "PAUSED") { e.preventDefault(); resume(); }
    } else if (k === "KeyM") {
      e.preventDefault();
      toggleSound();
    }
  });

  $("playBtn").addEventListener("click", () => { if (state === "READY") startRun(); });
  $("againBtn").addEventListener("click", () => { if (canStartFromOver()) startRun(); });
  $("resumeBtn").addEventListener("click", () => { audio.unlock(); resume(); });
  $("restartBtn").addEventListener("click", () => { if (state === "PAUSED") startRun(); });
  $("homeBtnP").addEventListener("click", goHome);
  $("homeBtnO").addEventListener("click", () => { if (state === "OVER") goHome(); });
  $("pauseBtn").addEventListener("click", () => pause());
  $("soundBtn").addEventListener("click", toggleSound);
  $("setSound").addEventListener("click", toggleSound);
  $("langBtn").addEventListener("click", toggleLang);
  $("setLang").addEventListener("click", toggleLang);
  $("setMotion").addEventListener("click", toggleMotion);
  $("settingsBtn").addEventListener("click", openSettings);
  $("closeSettings").addEventListener("click", closeSettings);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (state === "PLAYING") setState("PAUSED", { hint: "awayHint" });
      else if (state === "DYING") setState("OVER");
      audio.setHidden(true);
      if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
    } else {
      resetStepper(stepper);
      lastVisual = undefined;
      audio.setHidden(false);
      schedule();
    }
  });
  window.addEventListener("blur", () => { if (state === "PLAYING") pause("awayHint"); });

  if (window.ResizeObserver) new ResizeObserver(queueLayout).observe(slot);
  window.addEventListener("resize", queueLayout);
  if (window.visualViewport) window.visualViewport.addEventListener("resize", queueLayout);
  if (motionQuery && motionQuery.addEventListener) {
    motionQuery.addEventListener("change", (e) => {
      if (storage.readReducedMotion() === null) { reduced = e.matches; refreshDynamic(); }
    });
  }
}

// ---------- boot ----------
function boot() {
  applyLanguage();
  showCard("boot");
  checkStorageNotice();
  if (!renderer) {
    showCard("unsupported");
    return;
  }
  audio.setMuted(muted);
  installInput();
  layout();
  // Let the loading card paint once, then synthesize the music before Play is available.
  requestAnimationFrame(() => setTimeout(() => {
    const t0 = performance.now();
    const pcm = makeMusicPCM();
    window.__lumen = { pcmMs: performance.now() - t0 };
    audio.setPCM(pcm);
    setState("READY");
    $("playBtn").focus({ preventScroll: true });
    schedule();
  }, 0));
}

// Read-only diagnostics hook for QA (no controls, no cheats).
Object.defineProperty(window, "__lumenState", {
  get: () => ({
    state, score: run.score, y: run.y, vy: run.vy, best, lang, muted, reduced, settingsOpen,
    ctx: audio.context ? audio.context.state : null, audio: { ...audio.stats }, activeSfx: audio.activeSfx,
    gates: run.gates.length,
    nextCenter: (run.gates.find((g) => !g.passed) || {}).center
  })
});

boot();

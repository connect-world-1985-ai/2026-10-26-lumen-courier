import { APP_ID } from "./build-config.mjs";

const MAX_BEST = 999999;

// Safe localStorage adapter. Every access (including the getter) is guarded;
// on failure values live in an in-memory Map for this visit.
export function createStorage(getProvider = () => window.localStorage, appId = APP_ID) {
  const memory = new Map();
  let failed = false;
  let noticed = false;
  const fullKey = (k) => `${appId}:v1:${k}`;
  function provider() {
    try {
      const p = getProvider();
      if (!p) throw new Error("no storage");
      return p;
    } catch (e) {
      failed = true;
      return null;
    }
  }
  function get(k) {
    const key = fullKey(k);
    if (memory.has(key)) return memory.get(key);
    const p = provider();
    if (!p) return null;
    try {
      const v = p.getItem(key);
      return typeof v === "string" ? v : null;
    } catch (e) {
      failed = true;
      return null;
    }
  }
  function set(k, value) {
    const key = fullKey(k);
    memory.set(key, value);
    const p = provider();
    if (!p) return;
    try {
      p.setItem(key, value);
    } catch (e) {
      failed = true;
    }
  }
  return {
    key: fullKey,
    readLang() {
      const v = get("lang");
      return v === "en" || v === "zh-CN" ? v : null;
    },
    writeLang(v) { if (v === "en" || v === "zh-CN") set("lang", v); },
    readBest() {
      const v = get("best");
      if (typeof v !== "string" || !/^[0-9]+$/.test(v)) return 0;
      const n = Number(v);
      return Number.isSafeInteger(n) && n >= 0 && n <= MAX_BEST ? n : 0;
    },
    writeBest(n) {
      if (Number.isSafeInteger(n) && n >= 0 && n <= MAX_BEST) set("best", String(n));
    },
    readMuted() {
      const v = get("muted");
      return v === "true" ? true : v === "false" ? false : null;
    },
    writeMuted(b) { set("muted", b ? "true" : "false"); },
    readReducedMotion() {
      const v = get("reducedMotion");
      return v === "true" ? true : v === "false" ? false : null;
    },
    writeReducedMotion(b) { set("reducedMotion", b ? "true" : "false"); },
    // True exactly once after the first storage failure.
    takeNotice() {
      if (failed && !noticed) {
        noticed = true;
        return true;
      }
      return false;
    },
    get failed() { return failed; }
  };
}

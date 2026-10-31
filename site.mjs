// Official website: bilingual copy from one table; shares the game's language preference.
// Hero = the cinematic trailer (muted autoplay unless reduced motion or Save-Data);
// posters and stills open in a native <dialog> lightbox.
import { detectLang } from "./play/strings.mjs";
import { createStorage } from "./play/storage.mjs";

const S = {
  name: ["Lumen Courier", "流光信使"],
  docTitle: ["Lumen Courier · An original twilight flying game", "流光信使 · 原创暮色飞行小游戏"],
  metaDescription: ["Lumen Courier is a free, original one-button flying game with code-generated music. Play in your browser on phone or desktop.", "《流光信使》是一款免费的原创单键飞行小游戏，配有代码生成的原创音乐，手机和电脑浏览器即可畅玩。"],
  navLabel: ["Site sections", "网站导航"],
  navTrailer: ["Trailer", "预告片"],
  navPosters: ["Posters", "海报"],
  navGameplay: ["Gameplay", "实机"],
  navHow: ["How to play", "玩法"],
  switchToChinese: ["Switch to Simplified Chinese", "切换为简体中文"],
  switchToEnglish: ["Switch to English", "切换为英语"],
  tagline: ["Carry a little light through the twilight.", "带着微光，穿过暮色。"],
  playNow: ["Play now", "立即游玩"],
  watchTrailer: ["Watch the trailer", "观看预告片"],
  freeNote: ["No download, no account, no ads. Works on phone and desktop.", "无需下载、无需注册、没有广告，手机和电脑均可游玩。"],
  trailerText: ["The original gameplay cut: real play, captioned in English and 中文, with the game's own code-generated music.", "原版实机预告：全部为真实游戏画面，配中英字幕，配乐即游戏内由代码生成的原创音乐。"],
  nowPlaying: ["Now Playing", "现已上线"],
  playTrailer: ["▶ Play trailer", "▶ 播放预告片"],
  soundOff: ["Sound off · tap to unmute", "声音已关 · 轻点开启"],
  soundOn: ["Sound on", "声音已开"],
  altHeroVideo: ["Cinematic launch trailer for Lumen Courier", "《流光信使》电影感上线预告片"],
  kickerPosters: ["The posters", "官方海报"],
  postersTitle: ["Posters", "海报"],
  capKeyArt: ["Key art", "主视觉"],
  capCourier: ["The Courier", "信使"],
  capNowPlaying: ["Now Playing", "现已上线"],
  capStill02: ["City of windows", "万家灯火"],
  capStill03: ["The gates", "光门"],
  capStill05: ["The squeeze", "险隙"],
  capStill06: ["Aurora ascent", "极光飞升"],
  altPoster1: ["Key art poster: the lantern courier rising through a zig-zag of glowing gates", "主视觉海报：灯芯信使穿过层层发光光门向上飞去"],
  altPoster2: ["Character poster: the courier in front of a full moon", "角色海报：满月前的信使"],
  altPoster3: ["Now Playing poster: the courier flying under the aurora", "上线海报：信使在极光下飞翔"],
  altStill02: ["Still: the courier over a city of lit windows", "剧照：信使飞过万家灯火的城市"],
  altStill03: ["Still: tall glass gates in the night sky", "剧照：夜空中高耸的玻璃光门"],
  altStill05: ["Still: the courier squeezing through a narrow gap", "剧照：信使从狭窄的缝隙中穿过"],
  altStill06: ["Still: rising into the aurora", "剧照：向极光飞升"],
  altStill07: ["Still: the courier arriving home at a floating island", "剧照：信使抵达漂浮的小岛"],
  lightboxLabel: ["Image viewer", "图片查看器"],
  prev: ["Previous image", "上一张"],
  next: ["Next image", "下一张"],
  close: ["Close", "关闭"],
  download: ["Download", "下载"],
  kickerGameplay: ["Real gameplay", "真实画面"],
  gameplayTitle: ["Gameplay trailer", "实机预告"],
  cineLinkText: ["The cinematic launch trailer above is also available as a letterboxed 2.39:1 film with sound:", "页首的电影感预告片也提供带遮幅（2.39:1）的有声版本："],
  cineLink: ["cinematic-trailer.mp4 (40 s, 720p)", "cinematic-trailer.mp4（40 秒，720p）"],
  kickerFeatures: ["Features", "游戏特色"],
  featuresTitle: ["Features", "游戏特色"],
  f1t: ["One-button flight", "单键飞行"],
  f1d: ["Tap, click, Space or ↑ to flap. Easy to learn, hard to put down.", "轻点、点击、空格或↑即可振翅，一学就会，欲罢不能。"],
  f2t: ["Original music in code", "代码生成的原创音乐"],
  f2d: ["A ten-second looping melody synthesized live with Web Audio. No audio files.", "十秒循环旋律由 Web Audio 实时合成，不含任何音频文件。"],
  f3t: ["English & 中文", "中英双语"],
  f3d: ["Follows your browser language, with an EN / 中文 switch that remembers your choice.", "自动跟随浏览器语言，也可随时用 EN / 中文 切换并记住选择。"],
  f4t: ["Phone and desktop", "手机电脑通用"],
  f4d: ["Responsive layout, touch, mouse and keyboard, smooth fixed-step physics.", "自适应布局，支持触屏、鼠标与键盘，固定步长物理流畅稳定。"],
  f5t: ["Pause, mute, reduced motion", "暂停、静音、减少动态"],
  f5d: ["Pauses itself when you switch tabs. Your best score stays on your device.", "切换标签页时自动暂停，最高分只保存在你的设备上。"],
  f6t: ["Open source, MIT", "开源，MIT 许可"],
  f6d: ["Every pixel and note is original and free to reuse under the MIT licence.", "每一个像素和音符都是原创，可按 MIT 许可自由使用。"],
  kickerHow: ["How to play", "玩法说明"],
  howTitle: ["How to play", "怎么玩"],
  how1: ["Press Play, tap the sky, or press Space to take off.", "点击“开始飞行”、轻点天空或按空格起飞。"],
  how2: ["Each tap gives a small lift; gravity does the rest.", "每次轻点获得一次上升，其余交给重力。"],
  how3: ["Fly through the gaps in the light gates. Each gate is one point.", "从光门的缺口中穿过，每穿过一道得 1 分。"],
  how4: ["Touching a gate, the ceiling or the ground ends the flight. Try again and beat your best.", "碰到光门、顶部或地面就会结束本次飞行，再来一次，挑战最高分。"],
  keysCaption: ["Controls", "操作方式"],
  kFlap: ["Flap", "振翅"],
  kFlapKeys: ["Tap / click the sky · Space · ↑", "轻点或点击天空 · 空格 · ↑"],
  kPause: ["Pause / resume", "暂停 / 继续"],
  kPauseKeys: ["Pause button · P · Esc", "暂停按钮 · P · Esc"],
  kSound: ["Sound on / off", "声音开 / 关"],
  kSoundKeys: ["Sound button · M", "声音按钮 · M"],
  footCredits: ["Lumen Courier · 流光信使 — original art, music and code · © 2026 connect-world-1985-ai", "流光信使 · Lumen Courier — 原创美术、音乐与代码 · © 2026 connect-world-1985-ai"],
  license: ["MIT License", "MIT 许可证"],
  fontsCredit: ["Fonts: Cinzel and Noto Serif SC, SIL Open Font License 1.1", "字体：Cinzel 与 Noto Serif SC，SIL 开源字体许可 1.1"],
  privacy: ["No analytics, no tracking, no accounts.", "无统计、无追踪、无账号。"]
};

const GALLERY = [
  ["media/posters/poster-01-key-art", "capKeyArt", "altPoster1"],
  ["media/posters/poster-02-character", "capCourier", "altPoster2"],
  ["media/posters/poster-03-now-playing", "capNowPlaying", "altPoster3"],
  ["media/launch/still-02-city-of-windows", "capStill02", "altStill02"],
  ["media/launch/still-03-the-gates", "capStill03", "altStill03"],
  ["media/launch/still-05-the-squeeze", "capStill05", "altStill05"],
  ["media/launch/still-06-aurora-ascent", "capStill06", "altStill06"]
];

const storage = createStorage();
let lang = detectLang(storage.readLang(), navigator);
const $ = (id) => document.getElementById(id);

function t(key) {
  const row = S[key];
  if (!row) throw new Error("Missing string: " + key);
  return row[lang === "zh-CN" ? 1 : 0];
}

function bilingual(el, key) {
  const [en, zh] = S[key];
  const a = document.createElement("span"); a.className = "h-en"; a.lang = "en"; a.textContent = en;
  const b = document.createElement("span"); b.className = "h-zh"; b.lang = "zh-CN"; b.textContent = zh;
  el.replaceChildren(a, " ", b);
}

// ---- Hero video ----
const hero = $("heroVideo");
const soundBtn = $("soundBtn");
const heroPlay = $("heroPlay");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
const conn = navigator.connection;
const saveData = !!(conn && (conn.saveData || /(^|-)2g$/.test(conn.effectiveType || "")));
let heroFailed = false;

function syncSound() {
  const on = !hero.muted && !hero.paused;
  soundBtn.setAttribute("aria-pressed", on ? "true" : "false");
  $("soundLabel").dataset.i18n = on ? "soundOn" : "soundOff";
  $("soundLabel").textContent = t(on ? "soundOn" : "soundOff");
  soundBtn.querySelector(".sound-ico").textContent = on ? "🔊" : "🔈";
  heroPlay.hidden = !hero.paused || heroFailed;
}

function playHero() {
  const p = hero.play();
  if (p && p.catch) p.catch(() => syncSound());
}

if (saveData) hero.preload = "none";
if (!reduceMotion.matches && !saveData) {
  hero.autoplay = true;
  playHero();
}
hero.addEventListener("play", syncSound);
hero.addEventListener("pause", syncSound);
hero.addEventListener("volumechange", syncSound);
hero.addEventListener("error", () => { heroFailed = true; syncSound(); }, true);
heroPlay.addEventListener("click", () => playHero());
soundBtn.addEventListener("click", () => {
  if (hero.muted || hero.paused) { hero.muted = false; playHero(); }
  else hero.muted = true;
  syncSound();
});
$("watchBtn").addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: reduceMotion.matches ? "auto" : "smooth" });
  hero.currentTime = 0;
  hero.muted = false;
  playHero();
  syncSound();
});

// ---- Top bar ----
const bar = $("topbar");
const onScroll = () => bar.classList.toggle("scrolled", window.scrollY > 40);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// ---- Lightbox ----
const dlg = $("lightbox");
let current = 0;
let opener = null;

function show(i) {
  current = (i + GALLERY.length) % GALLERY.length;
  const [base, cap, alt] = GALLERY[current];
  $("lbSource").srcset = "./" + base + ".webp";
  const img = $("lbImg");
  img.src = "./" + base + ".jpg";
  img.alt = t(alt);
  $("lbCap").textContent = t(cap) + "  ·  " + (current + 1) + " / " + GALLERY.length;
  const dl = $("lbDl");
  dl.href = "./" + base + ".jpg";
  dl.setAttribute("download", base.split("/").pop() + ".jpg");
}

for (const tile of document.querySelectorAll(".tile[data-index]")) {
  tile.addEventListener("click", () => {
    opener = tile;
    show(Number(tile.dataset.index));
    dlg.showModal();
    $("lbClose").focus();
  });
}
$("lbPrev").addEventListener("click", () => show(current - 1));
$("lbNext").addEventListener("click", () => show(current + 1));
$("lbClose").addEventListener("click", () => dlg.close());
dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
dlg.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") { e.preventDefault(); show(current - 1); }
  else if (e.key === "ArrowRight") { e.preventDefault(); show(current + 1); }
});
dlg.addEventListener("close", () => { if (opener) opener.focus(); opener = null; });

// ---- Language ----
function apply() {
  document.documentElement.lang = lang;
  document.title = t("docTitle");
  document.querySelector('meta[name="description"]').setAttribute("content", t("metaDescription"));
  for (const el of document.querySelectorAll("[data-i18n]")) el.textContent = t(el.dataset.i18n);
  for (const el of document.querySelectorAll("[data-i18n-alt]")) el.setAttribute("alt", t(el.dataset.i18nAlt));
  for (const el of document.querySelectorAll("[data-i18n-aria]")) el.setAttribute("aria-label", t(el.dataset.i18nAria));
  for (const el of document.querySelectorAll("[data-bi]")) bilingual(el, el.dataset.bi);
  $("langBtn").setAttribute("aria-label", lang === "zh-CN" ? t("switchToEnglish") : t("switchToChinese"));
  syncSound();
  if (dlg.open) show(current);
  document.body.dataset.ready = "1";
}

$("langBtn").addEventListener("click", () => {
  lang = lang === "zh-CN" ? "en" : "zh-CN";
  storage.writeLang(lang);
  apply();
});

window.__siteStrings = S;
apply();

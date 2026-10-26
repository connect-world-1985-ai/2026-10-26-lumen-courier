// Official website: bilingual copy from one table; shares the game's language preference.
import { detectLang } from "./play/strings.mjs";
import { createStorage } from "./play/storage.mjs";

const S = {
  name: ["Lumen Courier", "流光信使"],
  docTitle: ["Lumen Courier · An original twilight flying game", "流光信使 · 原创暮色飞行小游戏"],
  metaDescription: ["Lumen Courier is a free, original one-button flying game with code-generated music. Play in your browser on phone or desktop.", "《流光信使》是一款免费的原创单键飞行小游戏，配有代码生成的原创音乐，手机和电脑浏览器即可畅玩。"],
  navLabel: ["Site sections", "网站导航"],
  navTrailer: ["Trailer", "预告片"],
  navScreens: ["Screenshots", "截图"],
  navHow: ["How to play", "玩法"],
  switchToChinese: ["Switch to Simplified Chinese", "切换为简体中文"],
  switchToEnglish: ["Switch to English", "切换为英语"],
  eyebrow: ["A free browser game", "免费网页小游戏"],
  tagline: ["Carry a little light through the twilight.", "带着微光，穿过暮色。"],
  lede: ["Guide a tiny lantern courier through glowing gates above a sleeping city. One button, honest physics, original art and music — all made in code.", "操纵一只提着灯芯的小小信使，穿过沉睡城市上空的发光光门。单键操作、手感扎实，原创美术与音乐全部由代码生成。"],
  playNow: ["Play now", "立即开玩"],
  watchTrailer: ["Watch the trailer", "观看预告片"],
  freeNote: ["No download, no account, no ads. Works on phone and desktop.", "无需下载、无需注册、没有广告，手机和电脑均可游玩。"],
  trailerTitle: ["Launch trailer", "上线预告片"],
  trailerText: ["Real gameplay, with the game's own code-generated music.", "全部为真实游戏画面，配乐即游戏内由代码生成的原创音乐。"],
  screensTitle: ["Screenshots", "游戏截图"],
  capReady: ["Ready to fly (中文)", "准备起飞（中文界面）"],
  capPlay: ["Five gates in", "穿过第五道光门"],
  capPlayZh: ["Touch play on a phone", "手机触屏游玩"],
  capOver: ["New personal best", "刷新个人纪录"],
  altReady: ["Title card in Simplified Chinese over a twilight city", "暮色城市上方的中文开始界面"],
  altPlay: ["The lantern courier flying past glowing gates with a score of 5", "灯芯信使飞过发光光门，得分 5"],
  altPlayZh: ["Gameplay with the Chinese interface", "中文界面下的游戏画面"],
  altOver: ["Game over card showing 12 gates and a new best", "结算卡片显示穿过 12 道光门并刷新纪录"],
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
  privacy: ["No analytics, no tracking, no accounts.", "无统计、无追踪、无账号。"]
};

const storage = createStorage();
let lang = detectLang(storage.readLang(), navigator);

function t(key) {
  const row = S[key];
  if (!row) throw new Error("Missing string: " + key);
  return row[lang === "zh-CN" ? 1 : 0];
}

function apply() {
  document.documentElement.lang = lang;
  document.title = t("docTitle");
  document.querySelector('meta[name="description"]').setAttribute("content", t("metaDescription"));
  for (const el of document.querySelectorAll("[data-i18n]")) el.textContent = t(el.dataset.i18n);
  for (const el of document.querySelectorAll("[data-i18n-alt]")) el.setAttribute("alt", t(el.dataset.i18nAlt));
  for (const el of document.querySelectorAll("[data-i18n-aria]")) el.setAttribute("aria-label", t(el.dataset.i18nAria));
  document.getElementById("langBtn").setAttribute("aria-label", lang === "zh-CN" ? t("switchToEnglish") : t("switchToChinese"));
  document.body.dataset.ready = "1";
}

document.getElementById("langBtn").addEventListener("click", () => {
  lang = lang === "zh-CN" ? "en" : "zh-CN";
  storage.writeLang(lang);
  apply();
});

window.__siteStrings = S;
apply();

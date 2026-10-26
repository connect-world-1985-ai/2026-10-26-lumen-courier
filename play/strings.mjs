export const STRINGS = {
  title: ["Lumen Courier", "流光信使"],
  tagline: ["Carry a little light through the twilight.", "带着微光，穿过暮色。"],
  loading: ["Preparing your flight…", "正在准备起飞…"],
  start: ["Play", "开始飞行"],
  readyTitle: ["A little light. A long way home.", "一盏微光，一路向前。"],
  readyHint: ["Tap or press Space to rise. Fly through the light gates.", "轻点屏幕或按空格上升，穿过一道道光门。"],
  desktopHint: ["Space / ↑: flap · P / Esc: pause · M: sound", "空格 / ↑：振翅 · P / Esc：暂停 · M：声音"],
  touchHint: ["Tap the sky to flap. Use Pause to take a break.", "轻点天空振翅，点击暂停稍作休息。"],
  scoreLabel: ["Score", "得分"],
  bestLabel: ["Best", "最高分"],
  scoreValue: ["Score {score}", "得分 {score}"],
  bestValue: ["Best {best}", "最高分 {best}"],
  pause: ["Pause", "暂停"],
  pausedTitle: ["Flight paused", "飞行已暂停"],
  pausedHint: ["Take your time. Your flight is waiting.", "慢慢来，你的旅程还在这里。"],
  awayHint: ["Paused while you were away. Resume when ready.", "离开页面时已暂停，准备好后继续。"],
  resizedHint: ["Layout changed. Resume when ready.", "画面布局已调整，准备好后继续。"],
  stalledHint: ["Flight paused after a delay. Resume when ready.", "检测到运行延迟，已暂停。准备好后继续。"],
  resume: ["Resume", "继续飞行"],
  restart: ["Restart", "重新开始"],
  home: ["Back to title", "返回首页"],
  overTitle: ["Flight complete", "本次飞行结束"],
  overScore: ["You passed {score} gates.", "你穿过了 {score} 道光门。"],
  newBest: ["New personal best!", "刷新个人纪录！"],
  tryAgain: ["Fly again", "再飞一次"],
  earlyTip: ["Small, steady taps go a long way.", "轻点、稳住，慢慢飞得更远。"],
  nextTip: ["Find your rhythm between the gates.", "在光门之间，找到自己的节奏。"],
  medalNone: ["Every journey starts with a spark.", "每段旅程，都从一点微光开始。"],
  medal5: ["Spark · 5 gates", "初光 · 5 道光门"],
  medal15: ["Glow · 15 gates", "流萤 · 15 道光门"],
  medal30: ["Aurora · 30 gates", "极光 · 30 道光门"],
  milestone: ["{count} gates!", "已穿过 {count} 道光门！"],
  settings: ["Settings", "设置"],
  closeSettings: ["Back", "返回"],
  soundOn: ["Sound on", "声音开"],
  soundOff: ["Sound off", "声音关"],
  muteAction: ["Mute music and effects", "关闭音乐与音效"],
  unmuteAction: ["Unmute music and effects", "开启音乐与音效"],
  musicHint: ["Original music starts after your first tap or keypress.", "原创音乐将在首次轻点或按键后播放。"],
  audioRetry: ["Tap Sound to restore audio.", "轻点声音按钮以恢复音频。"],
  audioUnavailable: ["Audio is unavailable. You can still play.", "音频暂不可用，仍可继续游戏。"],
  language: ["Language", "语言"],
  languageToggle: ["EN / 中文", "EN / 中文"],
  switchToChinese: ["Switch to Simplified Chinese", "切换为简体中文"],
  switchToEnglish: ["Switch to English", "切换为英语"],
  reducedMotion: ["Reduced motion", "减少动态效果"],
  motionOn: ["On", "开"],
  motionOff: ["Off", "关"],
  motionHint: ["Reduces scenery motion, particles and shake.", "减少背景移动、粒子和震动效果。"],
  localOnly: ["Scores and preferences stay on this device.", "分数与偏好仅保存在此设备。"],
  storageUnavailable: ["Saving is unavailable. Progress lasts for this visit.", "暂时无法保存，本次访问期间仍会保留进度。"],
  canvasLabel: ["Flight area. Tap, click, Space or Arrow Up to flap.", "飞行区域。轻点、点击、空格或向上方向键振翅。"],
  controlsLabel: ["Game controls", "游戏控制"],
  stateReady: ["Ready to fly.", "准备起飞。"],
  statePlaying: ["Flight started.", "飞行开始。"],
  statePaused: ["Flight paused.", "飞行已暂停。"],
  stateResumed: ["Flight resumed.", "飞行已继续。"],
  stateOver: ["Flight complete. Score {score}. Best {best}.", "飞行结束。得分 {score}，最高分 {best}。"],
  unsupported: ["This browser cannot run the game. Open it in a current browser.", "此浏览器无法运行游戏，请使用当前版本的浏览器打开。"],
  credits: ["Original art, music and code · MIT", "原创美术、音乐与代码 · MIT"],
  license: ["License", "许可证"],
  metaDescription: ["An original one-button twilight flying game with music.", "一款带原创音乐的暮色单键飞行小游戏。"]
};

export function translate(key, lang, values = {}) {
  const row = STRINGS[key];
  if (!row) throw new Error("Missing string: " + key);
  return row[lang === "zh-CN" ? 1 : 0].replace(/\{(\w+)\}/g, (_, name) => {
    if (!(name in values)) throw new Error("Missing value: " + name);
    return String(values[name]);
  });
}

export const LANGS = ["en", "zh-CN"];

// Saved choice wins; otherwise any zh* browser language maps to Simplified Chinese, everything else to English.
export function detectLang(saved, nav) {
  if (saved === "en" || saved === "zh-CN") return saved;
  const first = ((nav && nav.languages && nav.languages[0]) || (nav && nav.language) || "en").toLowerCase();
  return first.startsWith("zh") ? "zh-CN" : "en";
}

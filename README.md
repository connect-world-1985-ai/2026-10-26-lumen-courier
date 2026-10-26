# Lumen Courier · 流光信使

An original one-button twilight flying game for the browser, with bilingual English / 简体中文 UI and music synthesized in code.
一款原创的暮色单键飞行网页小游戏：中英双语界面，配乐全部由代码生成。

- **Website / 官网:** https://connect-world-1985-ai.github.io/2026-10-26-lumen-courier/
- **Play / 游玩:** https://connect-world-1985-ai.github.io/2026-10-26-lumen-courier/play/
- **Cinematic trailer / 电影感预告片:** https://connect-world-1985-ai.github.io/2026-10-26-lumen-courier/media/cinematic-trailer.mp4
- **Gameplay trailer / 实机预告:** https://connect-world-1985-ai.github.io/2026-10-26-lumen-courier/media/trailer.mp4

## What is where / 目录说明

| Path | What it is |
|---|---|
| `/index.html`, `site.css`, `site.mjs` | Official launch website: cinematic-trailer hero, posters + stills with a lightbox, gameplay trailer, brand band, features, how to play. 官网 |
| `/play/` | The full game (static ES modules + Canvas 2D + Web Audio). 完整游戏 |
| `/play/tests.html`, `tests.mjs` | Developer test page (core assertions + performance run). Not linked from the game. 开发测试页 |
| `/media/cinematic-trailer.mp4` | 40.0 s cinematic launch trailer (1280×720 H.264 High 30 fps + AAC 44.1 kHz stereo, faststart, 2.39:1 letterbox until 0:35), cut on the beat of the game's own music, ending on the logo and Play now · 立即游玩. 电影感预告片 |
| `/media/cinematic-trailer-hero.mp4` | The same 40 s edit and score, **textless and without the letterbox**, used as the muted looping background of the website hero (the page already shows the wordmark and the buttons on top). 官网首屏背景版 |
| `/media/cinematic-trailer-poster.jpg` | Poster frame for the cinematic trailer (still 02, 1280×720). 封面 |
| `/media/posters/` | The three launch posters (Key art, The Courier, Now Playing), 1200×1800, WebP + JPG. 海报 |
| `/media/launch/` | Launch stills 01, 02, 03, 05, 06, 07 (1920×1080, WebP + JPG), the wordmark SVG and the 1200×630 social card `og-image.jpg`. 剧照、字标与分享图 |
| `/fonts/` | Bundled web-font subsets and their licences (see *Fonts* below). 字体 |
| `/media/trailer.mp4`, `trailer-poster.jpg` | 42.5 s gameplay trailer (1280×720 H.264 + AAC) cut from real gameplay, with burned-in EN/中文 captions, and its poster. 预告片与封面 |
| `/media/screenshot-*.jpg` | Gameplay screenshots from the first release (kept; no longer shown on the website). 截图 |
| `preview.py` | Local preview server that serves the repo under `/<repo-name>/`, like GitHub Pages. 本地预览 |
| `verify.py` | Static release check (file list, size budget, no network APIs, no external or absolute URLs). 发布前静态检查 |
| `ASSETS.md` | Where every asset comes from (all original, MIT). 资产来源 |
| `QA.md` | Test results and what has not been tested yet. 测试记录 |

## Controls / 操作

| Action | Keyboard | Mouse / touch |
|---|---|---|
| Flap / start / fly again | Space, ↑ | Click or tap the sky |
| Pause / resume | P, Esc | Pause / Resume buttons |
| Sound on/off (music + effects) | M | Sound button |

Settings: sound, EN / 中文, reduced motion. The language follows the browser (any `zh*` locale → 简体中文, otherwise English) until you pick one; your choice, best score, mute and motion settings are saved in `localStorage` on this device only, under keys prefixed `2026-10-26-lumen-courier:v1:`.

## How it plays / 机制

Fixed 120 Hz simulation with interpolated rendering in a 432×768 world. Gravity 1500, flap velocity −430, terminal velocity 620, courier radius 14, gate width 76. Difficulty ramps from score 3 to score 30: gap 198 → 162, speed 162 → 210, spacing 260 → 240, after which it stays constant. Circle-vs-rectangle collision; touching counts as a hit. The game pauses itself when the tab is hidden, the window loses focus, the layout changes size, or a frame takes longer than 100 ms. It never resumes on its own.

Music: an original 10-second, 96 BPM loop (D–Bm–G–A) rendered once to PCM at load and looped by one `AudioBufferSourceNode`. It starts only after your first tap or keypress. Effects are oscillator envelopes. Everything goes through one master gain, so mute silences both.

## Run locally / 本地运行

```bash
python3 -B preview.py          # then open the printed URL; the game is at .../play/
python3 -B verify.py           # static checks
# open .../play/tests.html for the core tests
```

No build step, no npm, no dependencies.

## Accessibility & privacy / 无障碍与隐私

All controls are native buttons, at least 44×44 CSS px, with a visible gold focus ring. State changes and the final score are announced to screen readers. It is still a visual reflex game, so it does not offer a non-visual equivalent. The site makes no network requests beyond its own files: no analytics, no tracking, no accounts, no font services or CDNs (the two fonts are bundled files). GitHub Pages itself may keep standard access logs.

## Fonts / 字体

The website's display type uses two bundled subsets, loaded from `fonts/` with `@font-face` (no font services, no external requests). Body and UI text use the system font.

| File | Face | Use | Licence |
|---|---|---|---|
| `fonts/Cinzel-latin.woff2` (34 KB) | Cinzel, variable 400–900, Latin subset | English display: caps headings, the pill, the tagline | SIL OFL 1.1, © 2020 The Cinzel Project Authors, `fonts/OFL-Cinzel.txt` |
| `fonts/NotoSerifSC-lumen-subset.woff2` (198 KB) | Noto Serif SC, variable 200–900, 354-character subset (the site's and the art's 中文 display characters only) | 中文 display: headings, the pill, the tagline, the brand | SIL OFL 1.1, © 2012 Google Inc., `fonts/OFL-NotoSerifSC.txt` |

Characters outside the subset fall back to the system serif. The wordmark, posters, stills and trailer cards already have their type drawn in, so they do not depend on these files.

## Licence / 许可

MIT, © 2026 connect-world-1985-ai, except the bundled fonts, which stay under the SIL Open Font License 1.1 (see *Fonts*). See `LICENSE` and `ASSETS.md`. The gameplay-trailer captions were rendered with the system Noto Sans CJK SC font (SIL OFL). That font is not included in this repository.

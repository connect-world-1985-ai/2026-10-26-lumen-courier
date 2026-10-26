# Lumen Courier · 流光信使

An original one-button twilight flying game for the browser, with bilingual English / 简体中文 UI and music synthesized in code.
一款原创的暮色单键飞行网页小游戏：中英双语界面，配乐全部由代码生成。

- **Website / 官网:** https://connect-world-1985-ai.github.io/2026-10-26-lumen-courier/
- **Play / 游玩:** https://connect-world-1985-ai.github.io/2026-10-26-lumen-courier/play/
- **Trailer / 预告片:** https://connect-world-1985-ai.github.io/2026-10-26-lumen-courier/media/trailer.mp4

## What is where / 目录说明

| Path | What it is |
|---|---|
| `/index.html`, `site.css`, `site.mjs` | Official website (hero, trailer, screenshots, features, how to play). 官网 |
| `/play/` | The full game (static ES modules + Canvas 2D + Web Audio). 完整游戏 |
| `/play/tests.html`, `tests.mjs` | Developer test page (core assertions + performance run). Not linked from the game. 开发测试页 |
| `/media/trailer.mp4`, `trailer-poster.jpg` | 42.5 s launch trailer (1280×720 H.264 + AAC) cut from real gameplay, with burned-in EN/中文 captions, and its poster. 预告片与封面 |
| `/media/screenshot-*.jpg` | Gameplay screenshots used on the website. 截图 |
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

All controls are native buttons, at least 44×44 CSS px, with a visible gold focus ring. State changes and the final score are announced to screen readers. It is still a visual reflex game, so it does not offer a non-visual equivalent. The site makes no network requests beyond its own files: no analytics, no tracking, no accounts, no fonts or CDNs. GitHub Pages itself may keep standard access logs.

## Licence / 许可

MIT, © 2026 connect-world-1985-ai. See `LICENSE` and `ASSETS.md`. The trailer captions were rendered with the system Noto Sans CJK SC font (SIL OFL). That font is not included in this repository.

# Assets / 资产记录

Every image, video and sound in this repository is original and was produced by this project's own code or tooling. The only third-party files are the two bundled OFL fonts.
Author: `connect-world-1985-ai` · Date: 2026-10-26 · Licence: MIT (see `LICENSE`); fonts: SIL OFL 1.1.
Third-party runtime dependencies: **0**. Nothing is downloaded from another origin at runtime.

| Asset | Where | How it is produced |
|---|---|---|
| Twilight sky, stars, moon glow, horizon haze | `play/render.mjs` `buildSky()` | Canvas 2D gradients and arcs, cached once in a 432×768 canvas |
| Far ridge and city silhouette with windows | `play/render.mjs` `buildFar()` | Canvas paths/rectangles from a seeded LCG, tileable 432 px strip, parallax 0.08 |
| Mid-layer floating islands and clouds | `play/render.mjs` `buildMid()` | Canvas Bézier paths and ellipses, tileable, parallax 0.18 |
| Light gates | `play/render.mjs` `drawGate()` | Rectangles aligned exactly with the collision boxes, 3 px `#72E7CC` edge |
| Lantern courier (core, leaf wings, envelope emblem) | `play/render.mjs` `drawCourier()` | Canvas arcs/quadratic curves; core radius matches the 14-unit collision radius |
| Ground lamps | `play/render.mjs` `drawGround()` | Canvas rectangles/arcs scrolled with world distance |
| Particles | `play/render.mjs` | Preallocated pool of 72 typed-array particles |
| Favicon | `play/favicon.svg` | Hand-written SVG (diamond lantern + two wings) |
| Background music | `play/audio.mjs` `makeMusicPCM()` | Original 96 BPM, 4-bar D–Bm–G–A melody synthesized to 10 s of 44.1 kHz PCM, looped with Web Audio |
| Sound effects (flap, score, hit, new best) | `play/audio.mjs` | OscillatorNode + gain envelopes, parameters from the plan |
| Launch trailer `media/trailer.mp4` | recorded locally | Real gameplay captured from this game in headless Chrome (CDP screencast; autopilot only presses Space via dispatched key events), composited with ffmpeg; bilingual captions burned in with the system Noto Sans CJK SC font (font not shipped); soundtrack is the game's own `makeMusicPCM()` output |
| Trailer poster and screenshots `media/*.jpg` | recorded locally | Frames of the same gameplay recordings |

## Launch art and website relaunch (phase 2)

| Asset | Where | How it is produced |
|---|---|---|
| Posters `media/posters/poster-0{1,2,3}-*.{webp,jpg}` | launch-art pack (project UI/UX designer) | Background plates made with the built-in image tool, using only this game's own screenshots as style references; the courier is **never** AI-generated: it is the exact SVG port of `drawCourier()` composited on top; all type set in code with Cinzel and Noto Serif SC. Web copies only; the PNG masters are kept outside the repo, so the lightbox "Download" link serves the JPG |
| Stills `media/launch/still-0{1,2,3,5,6,7}-*.{webp,jpg}` | launch-art pack | Same method as the posters, 1920×1080 |
| Wordmark `media/launch/lumen-courier-wordmark-combo.svg` | launch-art pack | Outlined vector paths (no font dependency) |
| Social card `media/launch/og-image.jpg` | composed for this repo | still 04 + the wordmark PNG from the pack, 1200×630 |
| Cinematic trailer `media/cinematic-trailer.mp4` (and the textless hero cut `media/cinematic-trailer-hero.mp4`) | built locally with Python + ffmpeg | Edit follows the pack's shot list (ART.md §6): Ken Burns moves on the stills (zoom never above 120 %), the pack's title cards and end card, and **real gameplay** from this game. Gameplay capture: real-time CDP screencast of the real game page in headless Chrome, autopilot only dispatching Space key events, no speed changes; one run reached 32 gates (Aurora · 极光 medal). 16:9 shots are a window that follows the courier (smoothed, τ 0.3 s) inside a 1102×1960 capture, scaled to 1280×720; the two portrait panels come from a 494×880 capture of the 中文 UI. Cuts sit on the 96 BPM beat grid (frame counts from the cumulative edit time, 1200 frames = 40.0 s) |
| Cinematic-trailer score (inside both MP4s) | built locally | The game's own `makeMusicPCM()` melody, chords and bass and its SFX table, ported note for note to Python/numpy and arranged to 16 bars = 40.0 s (pad → bass → melody → octave climax, one silent beat at 0:26.875, D-major hold from 0:35, score pings on the real gate passes). No third-party audio; MIT |
| Poster frame `media/cinematic-trailer-poster.jpg` | launch-art pack | still 02 resized to 1280×720 |
| `fonts/Cinzel-latin.woff2`, `fonts/OFL-Cinzel.txt` | Cinzel (The Cinzel Project Authors) via the launch-art pack | Latin web subset; SIL Open Font License 1.1 |
| `fonts/NotoSerifSC-lumen-subset.woff2`, `fonts/OFL-NotoSerifSC.txt` | Noto Serif SC (Google) via the launch-art pack | 354-glyph web subset; SIL Open Font License 1.1 |

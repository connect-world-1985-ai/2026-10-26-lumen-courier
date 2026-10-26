# Assets / 资产记录

Every asset in this repository is original and produced by this project's own code or tooling.
Author: `connect-world-1985-ai` · Date: 2026-10-26 · Licence: MIT (see `LICENSE`).
External assets: **0**. Third-party runtime dependencies: **0**. No fonts, images or audio files are downloaded at runtime.

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

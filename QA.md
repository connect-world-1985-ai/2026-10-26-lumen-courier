# QA record / 测试记录

Tested on 2026-10-26 (Asia/Shanghai). Tester: Fullstack Engineer 3 (automated, headless).
Environment: Linux, Google Chrome 156.0.8078.47 headless (Playwright 1.64.0), desktop viewport 1440×900 and Chrome phone emulation (Playwright `Pixel 7`, touch + mobile). Python 3.13.5, Node 20.19.2 (Node is used only to run the same test module from the command line).

## Automated
| Check | Result |
|---|---|
| `play/tests.html` core assertions (engine, 100 seeds × 100 gates, collision, scoring, difficulty caps, 30/60/120 Hz replay, stall pause, strings/placeholders, locale mapping zh-CN/zh-TW/zh-HK/en-US/fr-FR, storage failure injection, PCM stats, audio lifecycle with injected mock) | 77 / 77 pass (Chrome and Node) |
| `python3 -B verify.py` | PASS |
| Performance (tests page, controller drives production engine + renderer, 30 s, headless Chrome) | 60.0 fps, p95 frame interval 16.8 ms, p95 update+draw 0.20 ms, 0 % frames > 50 ms, ≤ 3 gates, ≤ 72 particles |

## Browser checklist (plan Q01–Q21)
Legend: ✅ passed in Chrome desktop + Chrome phone emulation · ⏳ not run (needs a real device or browser)

| ID | Status | Notes |
|---|---|---|
| Q01 | ✅ | READY, score 0, no AudioContext before the first gesture |
| Q02 | ✅ (Chrome) | Space and mouse start → flap → game over → restart. Right-click is ignored by the code path (button 0 only) |
| Q03 | ✅ emulation | Tap the sky to start and flap. UI buttons never flap. Multi-touch not exercised |
| Q04 | ✅ | Collision/score rules covered by unit tests. Real runs end in game over and the score matches the engine |
| Q05 | ✅ | Medal and new-best logic tested in unit tests. The game-over card is shown in screenshots |
| Q06 | ✅ | Pause freezes y/score; AudioContext suspended; Resume continues |
| Q07–Q08 | ⏳ partial | Logic implemented; visibility/rotation not exercised on real devices |
| Q09–Q10 | ✅ | en-US → English, zh-CN → 简体中文; toggle + reload persists; zh-TW covered by unit test |
| Q11 | ✅ | Best persists across reload; storage failure injection unit-tested |
| Q12–Q14 | ✅ control flow / ⏳ listening | One context, one loop start, resume/suspend counts verified. Not listened to on real speakers or on iPhone Safari |
| Q15 | ✅ partial | 1440×900 and Pixel 7 in both languages, no horizontal overflow. Other sizes not run |
| Q16–Q17 | ⏳ | Native buttons and focus management implemented; no screen-reader pass |
| Q18 | ✅ partial | 30 s headless run (see above), not 120 s on real hardware |
| Q19 | ✅ | Only same-origin requests; no 4xx; no external URLs (verify.py + Playwright request log) |
| Q20 | ✅ | gitleaks clean; only game/site/media/test files; no plan files or personal data |
| Q21 | ⏳ | Human first-time playtest not done (automated play only) |

Not tested: desktop Safari, Firefox, Edge; real iPhone Safari; real Android Chrome.

## Live verification (GitHub Pages), source commit 10c6b6de37364a668620e73de879188410e03571
| Check | Result |
|---|---|
| `/`, `/play/`, every game module, `/media/trailer.mp4`, poster, screenshots, `/LICENSE` | HTTP 200, JS served as `text/javascript`, MP4 as `video/mp4` |
| Game at `/play/`: desktop 1440×900 and Chrome `Pixel 7` emulation, en-US and zh-CN | Starts on click, Space or tap; courier flaps; score goes up; game over; restart works. Pause freezes; language toggle persists; no console errors or failed requests. AudioContext is created only after the first gesture, with exactly 1 context and 1 music source |
| Website: same four configurations | Correct language on load; EN/中文 toggle works and persists (shared with the game); no horizontal overflow; "Play now" opens `./play/` |
| Trailer in page | `video.play()` OK, currentTime advanced about 2.4 s in 2.5 s, no media error, 1280×720, 42.5 s |
| Trailer file | H.264 High 1280×720 + AAC LC 44.1 kHz, 42.5 s, 3,224,739 bytes, moov before mdat (faststart) |
| External references in the served site | None (only the SVG XML namespace identifier) |
| Tests page on Pages | 77 / 77 pass; perf 20 s: 60.0 fps, p95 interval 16.7 ms |

## Phase 2 — launch relaunch, LOCAL verification only (not yet published)
Run on 2026-10-26 against the local preview (`python3 -B preview.py`, `http://127.0.0.1:4173/2026-10-26-lumen-courier/`), Chrome 156 headless via Playwright 1.64. The live GitHub Pages site was **not** checked in this phase (no contact with GitHub was allowed); it still shows the first release until this commit is pushed.

| Check | Result |
|---|---|
| `python3 -B verify.py` | PASS: 56 required files, 33 local references resolve, game runtime 57,256 bytes, no network APIs, no external or absolute URLs |
| `play/tests.html` | 77 / 77 pass (the game under `/play/` is unchanged) |
| HTTP | 200 for `/`, `/play/`, both cinematic MP4s, the poster frame, `media/trailer.mp4` and its poster, all 6 poster files, all 14 `media/launch/` files, both fonts and both licences, `/LICENSE` |
| `media/cinematic-trailer.mp4` | 40.000 s, 1200 frames, H.264 High 1280×720 30 fps + AAC LC 44.1 kHz stereo, moov before mdat, 6,062,909 bytes (v5, re-issued end card); −15.0 LUFS integrated, −1.9 dBFS peak |
| `media/cinematic-trailer-hero.mp4` | same edit, textless, no letterbox; 40.000 s, 1200 frames, same codecs, faststart, 7,069,471 bytes |
| Hero video (desktop 1440×900 and `Pixel 7`, en-US and zh-CN) | Autoplays muted, looped, inline; currentTime advanced about 2.5 s in 2.5 s; no media error; 1280×720, 40 s. Also autoplays with Chrome's default autoplay policy. Sound toggle unmutes (label switches to "Sound on / 声音已开", `aria-pressed=true`) and mutes again. On phones `object-position` is 68 % 50 % |
| Reduced motion (`prefers-reduced-motion: reduce`) | No autoplay (paused at 0 s); "▶ Play trailer" shown; clicking it plays the video and hides the button |
| Gallery | All 12 page images have `naturalWidth > 0` after scrolling (lazy loading). Poster and still tiles open the native `<dialog>`; focus goes to Close; ‹ / › and ← / → change images; Esc and Close shut it; focus returns to the opening tile; Download points at the JPG |
| Gameplay trailer section | `media/trailer.mp4` plays (currentTime ≈ 1.9 s after 2 s), 1280×720, 42.5 s, no error |
| Languages | en-US → English, zh-CN → 简体中文 (title, pill 现已上线, tagline, CTA **立即游玩**, sound label, captions, alt text); EN / 中文 toggle works and persists across reload; "Play now" opens `./play/` in the same language |
| Fonts | Cinzel and Lumen Serif SC (Noto Serif SC subset) load from `fonts/` |
| Console / network | No console errors, no failed requests, **no requests outside the site's own origin**, no horizontal overflow, in all four configurations |

Not tested in phase 2: the live Pages deployment, Safari, Firefox, real phones, screen readers, slow or Save-Data connections (handled in code: `preload="none"` and no autoplay).

| Further phase-2 checks | Result |
|---|---|
| gitleaks 8.30.1, `gitleaks git` (all commits) and `gitleaks dir` (working tree) | no leaks found |
| Personal-data scan of text and binary files | nothing found; the only author identity is the project account |
| Trailer review | 8 frames from `media/cinematic-trailer.mp4` checked by eye (cold open, 中文 ready panel, TC1, gameplay, TC2, near miss, 极光 game-over card, end card) |

## Phase 2 follow-up (21:42–22:45): no URLs, no account name in shipped media
| Check | Result |
|---|---|
| Re-issued launch art | poster-01 and poster-03 (WebP + JPG, newest export 21:45) copied; poster-02, stills and wordmark unchanged; `og-image.jpg` and `cinematic-trailer-poster.jpg` are built from still 04 / still 02 + the wordmark, so they did not need rebuilding |
| `media/cinematic-trailer.mp4` (v5) | rebuilt with the URL-free end card: 40.000 s, 1200 frames, H.264 High 1280×720 30 fps + AAC LC 44.1 kHz stereo, faststart, 6,062,909 bytes |
| `media/cinematic-trailer-hero.mp4` | textless (no cards), so unchanged |
| `media/trailer.mp4` (gameplay trailer) | its last caption was the Pages URL; re-rendered with that line replaced by "Play now · 立即游玩" (same video and audio otherwise): 42.5 s, H.264 High 1280×720 + AAC, faststart, 3,211,104 bytes |
| Site footer | "© 2026 · An original game" / "© 2026 · 一款原创游戏" (no account name); `LICENSE` unchanged |
| URL / account-name audit | OCR (tesseract) of trailer frames every 0.5 s, hero frames every 1 s, gameplay-trailer frames every 0.5 s, all shipped JPGs, plus a visual check of the end card, title cards, posters and og-image: no URL, domain or account name left. `verify.py` now fails on `github.io` or `connect-world` in the site files |

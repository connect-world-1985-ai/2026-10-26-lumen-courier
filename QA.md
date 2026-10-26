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

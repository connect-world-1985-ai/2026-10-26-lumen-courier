from pathlib import Path
import re

# Static release check (from the plan's step 8, adapted to the approved layout:
# website at the repo root, game under play/, trailer and screenshots under media/).
ROOT = Path(__file__).resolve().parent
FILES = """index.html site.css site.mjs
play/index.html play/styles.css play/build-config.mjs play/strings.mjs play/storage.mjs play/engine.mjs
play/render.mjs play/audio.mjs play/app.mjs play/favicon.svg play/tests.html play/tests.mjs
media/trailer.mp4 media/trailer-poster.jpg media/screenshot-play-en.jpg media/screenshot-over-en.jpg
media/screenshot-ready-zh.jpg media/screenshot-play-zh.jpg
media/cinematic-trailer.mp4 media/cinematic-trailer-hero.mp4 media/cinematic-trailer-poster.jpg
media/posters/poster-01-key-art.jpg media/posters/poster-01-key-art.webp
media/posters/poster-02-character.jpg media/posters/poster-02-character.webp
media/posters/poster-03-now-playing.jpg media/posters/poster-03-now-playing.webp
media/launch/lumen-courier-wordmark-combo.svg media/launch/og-image.jpg
media/launch/still-01-cold-open-sky.jpg media/launch/still-01-cold-open-sky.webp
media/launch/still-02-city-of-windows.jpg media/launch/still-02-city-of-windows.webp
media/launch/still-03-the-gates.jpg media/launch/still-03-the-gates.webp
media/launch/still-05-the-squeeze.jpg media/launch/still-05-the-squeeze.webp
media/launch/still-06-aurora-ascent.jpg media/launch/still-06-aurora-ascent.webp
media/launch/still-07-homecoming-island.jpg media/launch/still-07-homecoming-island.webp
fonts/Cinzel-latin.woff2 fonts/NotoSerifSC-lumen-subset.woff2 fonts/OFL-Cinzel.txt fonts/OFL-NotoSerifSC.txt
preview.py verify.py README.md ASSETS.md QA.md LICENSE .gitignore .nojekyll""".split()
for name in FILES:
    p = ROOT / name
    assert p.is_file() and not p.is_symlink(), "Missing/linked: " + name
    if name != ".nojekyll":
        assert p.stat().st_size > 0, "Empty: " + name
runtime = ["play/" + n for n in ["index.html", "styles.css", "build-config.mjs", "strings.mjs", "storage.mjs",
           "engine.mjs", "render.mjs", "audio.mjs", "app.mjs", "favicon.svg"]]
size = sum((ROOT / name).stat().st_size for name in runtime)
assert size <= 150 * 1024, f"Game runtime too large: {size} bytes"
site = ["index.html", "site.css", "site.mjs", "media/launch/lumen-courier-wordmark-combo.svg"]
for name in runtime + site + ["play/tests.html", "play/tests.mjs"]:
    text = (ROOT / name).read_text(encoding="utf-8")
    if name.endswith(".mjs"):
        assert not re.search(r"\b(fetch|XMLHttpRequest|WebSocket|sendBeacon)\b", text), "Network API: " + name
        assert not re.search(r"\bimport\s*\(", text), "Unneeded dynamic import: " + name
    # SVG namespace is an identifier, not a runtime request.
    text = text.replace('http://www.w3.org/2000/svg', '')
    assert not re.search(r"https?://|//cdn|url\(\s*[\"']?/", text), "External/absolute asset: " + name
    if name.endswith(".html"):
        assert not re.search(r'(?:src|href|poster)\s*=\s*[\"\']/', text), "Root asset path: " + name
        assert "2026-10-26-lumen-courier/" not in text, "Host-specific path: " + name
mp4 = (ROOT / "media/trailer.mp4").stat().st_size
assert mp4 <= 15 * 1024 * 1024, f"Trailer too large: {mp4}"
cine = (ROOT / "media/cinematic-trailer.mp4").stat().st_size
assert cine <= 20 * 1024 * 1024, f"Cinematic trailer too large: {cine}"
hero = (ROOT / "media/cinematic-trailer-hero.mp4").stat().st_size
assert hero <= 20 * 1024 * 1024, f"Hero cut too large: {hero}"
# Every local asset referenced by the site must exist in the repo.
html = (ROOT / "index.html").read_text(encoding="utf-8") + (ROOT / "site.css").read_text(encoding="utf-8")
refs = set(re.findall(r'(?:src|href|poster|srcset)="\./([^"#?]+)"', html)) | set(re.findall(r'url\(\./([^)]+)\)', html))
refs |= {m + ext for m in re.findall(r'"(media/[a-z0-9/-]+)"', (ROOT / "site.mjs").read_text(encoding="utf-8")) for ext in (".jpg", ".webp")}
for r in sorted(refs):
    if r.endswith("/"):
        r += "index.html"
    assert (ROOT / r).is_file(), "Broken local reference: " + r
assert (ROOT / ".nojekyll").stat().st_size == 0
print(f"PASS: {len(FILES)} required files; {len(refs)} local references resolve; game runtime {size} bytes; "
      f"trailer {mp4} bytes; cinematic trailer {cine} bytes; static audit clean")

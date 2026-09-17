"""Stamp css/js links in the HTML with a version, so browsers fetch changed files
instead of serving a cached copy. Run after editing CSS or JS:

    python tools/bump.py
"""
import re, time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VERSION = time.strftime("%Y%m%d%H%M%S")

pattern = re.compile(r'((?:href|src)=")((?:css|js)/[\w.-]+\.(?:css|js))(?:\?v=\d+)?(")')
for page in sorted(ROOT.glob("*.html")):
    text = page.read_text(encoding="utf-8")
    new = pattern.sub(lambda m: f"{m.group(1)}{m.group(2)}?v={VERSION}{m.group(3)}", text)
    if new != text:
        page.write_text(new, encoding="utf-8")
        print(f"{page.name}: stamped v={VERSION}")

"""Build the new root mobile app; leave elevation untouched."""
from pathlib import Path
import shutil
import subprocess
import sys
root = Path(__file__).resolve().parents[1]
source = root / "mobile-source"
out = source / "dist"
out.mkdir(parents=True, exist_ok=True)
for name in ("icon-180.png", "icon-512.png"):
    shutil.copy2(root / name, out / name)
subprocess.run([sys.executable, str(source / "scripts" / "build.py")], check=True)
html = (out / "index.html").read_text(encoding="utf-8")
html = html.replace("?v=1", "?v=mobile-rulers-20261013")
assert "indexedDB.open('sc-mobile-cab',1)" in html
(out / "index.html").write_text(html, encoding="utf-8")
for name in ("index.html", "logo.svg", "manifest.webmanifest", "icon-180.png", "icon-512.png"):
    shutil.copy2(out / name, root / name)
print("Updated root mobile app; elevation unchanged.")

"""Rebuild /elevation/ from the maintained mobile source; preserve old browser data."""
from pathlib import Path
import shutil
import subprocess
import sys

root = Path(__file__).resolve().parents[1]
public = root / "elevation"
source = public / "source"
out = source / "dist"
out.mkdir(parents=True, exist_ok=True)
for name in ("icon-180.png", "icon-512.png"):
    shutil.copy2(public / name, out / name)
subprocess.run([sys.executable, str(source / "scripts" / "build.py")], check=True)
html = (out / "index.html").read_text(encoding="utf-8")
html = html.replace("indexedDB.open('sc-mobile-cab',1)", "indexedDB.open('sc-cab',1)")
html = html.replace("'sc-mobile-", "'sc-cab-")
html = html.replace("?v=1", "?v=mobile-rulers-20261013")
assert "indexedDB.open('sc-cab',1)" in html and "sc-cab-cab" not in html
(out / "index.html").write_text(html, encoding="utf-8")
for name in ("index.html", "logo.svg", "manifest.webmanifest", "icon-180.png", "icon-512.png"):
    shutil.copy2(out / name, public / name)
print("Updated elevation/index.html; original sc-cab browser storage retained.")

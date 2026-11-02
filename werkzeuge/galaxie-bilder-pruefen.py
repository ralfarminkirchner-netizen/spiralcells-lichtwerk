"""Prüft den Bilder-Knopf der Galaxie im Browser, nur lesend: Taste m, dann den Knopf einmal und zweimal drücken, je ein Standbild.

    /usr/bin/python3 werkzeuge/galaxie-bilder-pruefen.py <adresse> <zielordner> [breite hoehe]
"""
import os
import sys
import time

from playwright.sync_api import sync_playwright

adresse, ziel = sys.argv[1], sys.argv[2]
b = int(sys.argv[3]) if len(sys.argv) > 3 else 1440
h = int(sys.argv[4]) if len(sys.argv) > 4 else 900
os.makedirs(ziel, exist_ok=True)
meld = []
with sync_playwright() as p:
    br = p.chromium.launch(channel="chrome", headless=True, args=["--enable-unsafe-webgpu", "--use-angle=metal", "--ignore-gpu-blocklist"])
    s = br.new_page(viewport={"width": b, "height": h}, device_scale_factor=1 if b > 500 else 2)
    s.on("console", lambda m: meld.append("%s: %s" % (m.type, m.text[:200])) if m.type in ("error", "warning") else None)
    s.on("pageerror", lambda e: meld.append("Seitenfehler: %s" % str(e)[:200]))
    s.on("response", lambda r: meld.append("404: %s" % r.url[-70:]) if r.status == 404 else None)
    s.goto(adresse.rstrip("/") + "/welten.html", wait_until="load")
    for _ in range(90):   # die Seite braucht, bis das Dorf steht
        time.sleep(2)
        if "entsteht" not in s.evaluate("document.body.innerText"):
            break
    time.sleep(2)
    s.keyboard.press("m")
    time.sleep(8)
    s.screenshot(path=os.path.join(ziel, "bilder-0-aus-%d.jpg" % b), type="jpeg", quality=85)
    knopf = s.locator("#bildknopf")
    meld.append("Knopf sichtbar: %s" % knopf.is_visible())
    for stufe, name in ((1, "auf-planeten-und-sonnen"), (2, "erst-nah")):
        if knopf.is_visible():
            knopf.click()
            time.sleep(3)
            meld.append("Stufe %d: %s" % (stufe, knopf.inner_text()))
        s.screenshot(path=os.path.join(ziel, "bilder-%d-%s-%d.jpg" % (stufe, name, b)), type="jpeg", quality=85)
    # Stufe 2 aus der Nähe: an die Sonne FASKA heranzoomen (Rad über der Sonne)
    if knopf.is_visible():
        s.mouse.move(b * 0.60, h * 0.65)
        for _ in range(14):
            s.mouse.wheel(0, -300)
            time.sleep(0.25)
        time.sleep(3)
        s.screenshot(path=os.path.join(ziel, "bilder-2-erst-nah-herangefahren-%d.jpg" % b), type="jpeg", quality=85)
        knopf.click()
        knopf.click()   # zurück auf Stufe 1 zum Vergleich in derselben Nähe
        time.sleep(3)
        s.screenshot(path=os.path.join(ziel, "bilder-1-herangefahren-%d.jpg" % b), type="jpeg", quality=85)
    br.close()
open(os.path.join(ziel, "bilder-pruefen.konsole.txt"), "w").write("\n".join(meld) + "\n")
print("\n".join(meld[:12]) or "keine Meldungen")

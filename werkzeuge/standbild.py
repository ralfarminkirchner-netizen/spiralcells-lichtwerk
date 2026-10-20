"""Standbilder mit kopflosem Chrome (Playwright), nur lesend.

    /usr/bin/python3 werkzeuge/standbild.py <adresse> <ziel.jpg> [breite] [höhe] [--reduziert] [--warten SEK]

Öffnet die Seite, wartet, macht ein Bild und schreibt die Konsolenmeldungen nach <ziel>.konsole.txt.
Klickt nichts, tippt nichts, schreibt nichts in einen Bestand.
"""
import sys
import time

from playwright.sync_api import sync_playwright


def main(argv):
    adresse, ziel = argv[0], argv[1]
    zahlen = [int(x) for x in argv[2:4] if x.isdigit()]
    breite, hoehe = (zahlen + [1440, 900][len(zahlen):])[:2]
    reduziert = "--reduziert" in argv
    warten = float(argv[argv.index("--warten") + 1]) if "--warten" in argv else 4.0
    meldungen = []
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        seite = browser.new_page(viewport={"width": breite, "height": hoehe},
                                 device_scale_factor=2 if breite <= 430 else 1,
                                 reduced_motion="reduce" if reduziert else "no-preference")
        seite.on("console", lambda m: meldungen.append("%s: %s" % (m.type, m.text)))
        seite.on("pageerror", lambda e: meldungen.append("Seitenfehler: %s" % e))
        seite.goto(adresse, wait_until="load")
        time.sleep(warten)
        seite.screenshot(path=ziel, type="jpeg", quality=82)
        quer = seite.evaluate("document.documentElement.scrollWidth > window.innerWidth")
        meldungen.append("waagerechtes Rollen: %s" % ("ja" if quer else "nein"))
        meldungen.append("Adresse am Ende: %s" % seite.url)
        browser.close()
    with open(ziel + ".konsole.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(meldungen) + "\n")
    print(ziel, "·", len(meldungen), "Meldungen")


if __name__ == "__main__":
    main(sys.argv[1:])

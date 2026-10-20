"""Standbilder und Bedienprobe für Formen, nur an der eigenen Testkette (8419 → 8418).

    /usr/bin/python3 werkzeuge/formen-ansehen.py <adresse> <bildordner> [--behalten]

Öffnet eine Textausprägung, tippt „Formen“, wählt Karten, wechselt über den Fassungsfaden zum
Schaubild und zum Original, je bei 1440 und 375 px und mit reduzierter Bewegung. Mit --behalten hält es
„Behalten“ einmal 0,5 s (Abbruch) und dann ganz, an der Testkette. Schreibt ein Protokoll als JSON.
"""
import json
import re
import sys
import time

from playwright.sync_api import sync_playwright

ADRESSE, ORDNER = sys.argv[1].rstrip("/"), sys.argv[2]
BEHALTEN = "--behalten" in sys.argv
MOND = "Émile Durkheim"
UUID = re.compile(r"\b[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\b", re.I)
protokoll = {"adresse": ADRESSE, "schritte": []}


def warte(seite, funktion, sekunden=20):
    """Wie wait_for_function, aber ohne eval im Seitenkontext: die CSP des Lichtwerks verbietet unsafe-eval."""
    ende = time.time() + sekunden
    while time.time() < ende:
        if seite.evaluate(funktion):
            return
        time.sleep(0.2)
    zustand = seite.evaluate("() => ({adresse: location.href, spiral: !!window.__spiral, ruht: !!(window.__spiral && window.__spiral.W.ruht), text: document.body.innerText.slice(0, 200)})")
    raise TimeoutError("%s · %s" % (funktion, json.dumps(zustand, ensure_ascii=False)))


def notiz(**k):
    protokoll["schritte"].append(k)
    print(json.dumps(k, ensure_ascii=False)[:300])


def bild(seite, name):
    seite.screenshot(path="%s/%s.jpg" % (ORDNER, name), type="jpeg", quality=82)
    sichtbar = seite.evaluate("document.body.innerText")
    notiz(bild=name, kennung_sichtbar=bool(UUID.search(sichtbar)), adresse_mit_kennung=bool(UUID.search(seite.url)),
          quer=seite.evaluate("document.documentElement.scrollWidth > window.innerWidth"))


def oeffne_text(seite):
    seite.goto(ADRESSE + "/?werkstatt", wait_until="load")
    warte(seite, "() => !!(window.__spiral && window.__spiral.W.B)", 20)
    seite.evaluate("""m => { const s = window.__spiral; s.oeffne(m, {ohneAufzug: true}); s.sofort();
        const Z = s.W.Z; const i = Z.m.samen.findIndex(x => (x.fassung.content || '').length > 800 && !/^[\\[{]/.test(x.fassung.content.trim()));
        if(i >= 0) s.waehle(i, 2); else s.waehle('keim', 2); s.laufe(0.5); }""", MOND)
    seite.wait_for_selector("#lese:not([hidden]) .formen-griff", timeout=10000)


def lichttisch(seite, schmal):
    seite.click(".formen-griff")
    seite.wait_for_selector(".faecher-knopf", timeout=10000)
    time.sleep(0.4)
    bild(seite, "formen-faecher" + schmal)
    seite.click(".faecher-knopf:has-text('Karten')")
    warte(seite, "() => document.querySelector('.formen-blatt') && document.querySelector('.formen-blatt').srcdoc.length > 500", 20)
    time.sleep(1.2)
    notiz(satz=seite.inner_text(".formen-satz"), richtung="karten")
    bild(seite, "formen-karten" + schmal)
    seite.click(".perle[data-key='schaubild']")
    warte(seite, "() => document.querySelector('.perle.gewaehlt')?.dataset.key === 'schaubild' && !/gesetzt …$/.test(document.querySelector('.formen-satz').textContent)", 20)
    time.sleep(0.8)
    notiz(satz=seite.inner_text(".formen-satz"), richtung="schaubild")
    bild(seite, "formen-schaubild" + schmal)
    seite.click(".perle[data-key='original']")
    time.sleep(0.5)
    bild(seite, "formen-original" + schmal)
    if schmal:
        seite.click(".perle[data-key='spiel']")
        warte(seite, "() => !/gesetzt …$/.test(document.querySelector('.formen-satz').textContent)", 20)
        time.sleep(0.8)
        notiz(satz=seite.inner_text(".formen-satz"), leise=seite.inner_text(".formen-leise"), richtung="spiel")
        bild(seite, "formen-spiel" + schmal)


def halten(seite, sekunden):
    knopf = seite.locator(".formen-tun .halten")
    kasten = knopf.bounding_box()
    seite.mouse.move(kasten["x"] + kasten["width"] / 2, kasten["y"] + kasten["height"] / 2)
    seite.mouse.down()
    time.sleep(sekunden)
    seite.mouse.up()


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        for breite, hoehe, schmal, rm in ((1440, 900, "", "no-preference"), (375, 812, "-375", "no-preference"), (1440, 900, "-ruhig", "reduce")):
            kontext = browser.new_context(viewport={"width": breite, "height": hoehe}, device_scale_factor=2 if schmal == "-375" else 1,
                                          reduced_motion=rm, has_touch=schmal == "-375", is_mobile=schmal == "-375")
            seite = kontext.new_page()
            fehler = []
            seite.on("console", lambda m: fehler.append(m.text) if m.type == "error" else None)
            seite.on("pageerror", lambda e: fehler.append("Seitenfehler: %s" % e))
            oeffne_text(seite)
            bild(seite, "formen-lese" + schmal)
            if rm == "reduce":
                seite.click(".formen-griff")
                seite.wait_for_selector(".faecher-knopf", timeout=10000)
                seite.click(".faecher-knopf:has-text('Plakat')")
                warte(seite, "() => document.querySelector('.formen-blatt').srcdoc.length > 300", 20)
                time.sleep(0.6)
                notiz(satz=seite.inner_text(".formen-satz"), richtung="plakat")
                bild(seite, "formen-plakat-ruhig")
            else:
                lichttisch(seite, schmal)
            if BEHALTEN and not schmal and rm != "reduce":
                seite.click(".perle[data-key='karten']")
                seite.wait_for_selector(".formen-tun .halten", timeout=15000)
                halten(seite, 0.5)
                time.sleep(1.0)
                notiz(abbruch_nach=0.5, satz=seite.inner_text(".formen-satz"))
                halten(seite, 1.8)
                # Beim ersten Mal fragt das Siegel nach Ralfs Eintrag; an der Testkette halten wir es
                try:
                    seite.wait_for_selector("#siegel:not([hidden]) .halten", timeout=4000)
                    bild(seite, "formen-ralf-eintrag")
                    k = seite.locator("#siegel .halten").bounding_box()
                    seite.mouse.move(k["x"] + k["width"] / 2, k["y"] + k["height"] / 2)
                    seite.mouse.down(); time.sleep(1.8); seite.mouse.up()
                except Exception:
                    pass
                seite.wait_for_selector("#formen[hidden]", state="attached", timeout=20000)
                time.sleep(2.5)
                notiz(behalten=True, zeile=seite.inner_text("#line"))
                bild(seite, "formen-behalten")
                seite.evaluate("""() => { const s = window.__spiral, Z = s.W.Z; const i = Z.m.samen.findIndex(x => x.form); if(i >= 0){ s.waehle(i, 2); s.laufe(0.4); } return i; }""")
                time.sleep(0.6)
                bild(seite, "formen-korn")
            notiz(breite=breite, reduziert=rm, konsolenfehler=fehler[:8])
            kontext.close()
        browser.close()
    with open("%s/formen-protokoll.json" % ORDNER, "w", encoding="utf-8") as f:
        json.dump(protokoll, f, ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()

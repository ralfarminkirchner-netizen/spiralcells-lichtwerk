"""Bedienprobe an der eigenen Testkette (8419 → 8418): Lichttisch nach der Kritikrunde, Wiederkommen, lesbarer Link.

    /usr/bin/python3 werkzeuge/pruefe-lichttisch-und-wege.py <adresse> <bildordner>

1. Lichttisch: Tab erreicht nichts dahinter; ein Tippen in die Form lässt Esc wirken; das erste Behalten ohne Eintrag
   „Ralf“ zeigt das Siegel über dem Tisch, Esc schließt das Siegel und nicht den Tisch, und es wird nichts geschrieben.
2. Wiederkommen: ohne Merker still; mit Merker vor den jüngsten Einträgen ein Satz, Einflug, Ring im Netz; Merker danach gesetzt.
3. Link: /#mond=emile-durkheim&von=sternwerft führt in die Zelle, oben links „Zurück zur Sternwerft“, keine Kennung.
Schreibt ein Protokoll als JSON.
"""
import json
import re
import sys
import time
import urllib.request

from playwright.sync_api import sync_playwright

ADRESSE, ORDNER = sys.argv[1].rstrip("/"), sys.argv[2]
UUID = re.compile(r"\b[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\b", re.I)
protokoll = {"adresse": ADRESSE, "schritte": []}


def notiz(**k):
    protokoll["schritte"].append(k)
    print(json.dumps(k, ensure_ascii=False)[:400])


def zaehle():
    with urllib.request.urlopen(ADRESSE + "/api/graph", timeout=20) as r:
        g = json.load(r)
    return {"variants": len(g["variants"]), "edges": len(g["edges"]), "agents": len(g["agents"])}


def warte(seite, funktion, sekunden=20):
    ende = time.time() + sekunden
    while time.time() < ende:
        if seite.evaluate(funktion):
            return True
        time.sleep(0.2)
    raise TimeoutError(funktion)


def bild(seite, name):
    seite.screenshot(path="%s/%s.jpg" % (ORDNER, name), type="jpeg", quality=82)
    notiz(bild=name, kennung=bool(UUID.search(seite.evaluate("document.body.innerText") + seite.url)),
          quer=seite.evaluate("document.documentElement.scrollWidth > window.innerWidth"), adresse=seite.url.replace(ADRESSE, ""))


def lichttisch(seite):
    seite.goto(ADRESSE + "/?werkstatt", wait_until="load")
    warte(seite, "() => !!(window.__spiral && window.__spiral.W.B)")
    seite.evaluate("""() => { const s = window.__spiral; s.oeffne('Émile Durkheim', {ohneAufzug: true}); s.sofort();
        const Z = s.W.Z; const i = Z.m.samen.findIndex(x => (x.fassung.content || '').length > 800 && !/^[\\[{]/.test(x.fassung.content.trim()));
        s.waehle(i, 2); s.laufe(0.4); }""")
    seite.wait_for_selector("#lese:not([hidden]) .formen-griff", timeout=10000)
    seite.click(".formen-griff")
    seite.wait_for_selector(".faecher-knopf", timeout=10000)
    seite.click(".faecher-knopf:has-text('Karten')")
    warte(seite, "() => document.querySelector('.formen-blatt').srcdoc.length > 500")
    time.sleep(0.8)
    # Tab 40-mal: der Fokus bleibt im Tisch (oder in seiner Form)
    draussen = []
    for _ in range(40):
        seite.keyboard.press("Tab")
        wo = seite.evaluate("""() => { const a = document.activeElement; return a === document.body ? 'body' : a.closest('#formen') ? 'tisch' : (a.id || a.className || a.tagName); }""")
        if wo not in ("tisch", "body"):
            draussen.append(wo)
    notiz(pruefung="Tab bleibt im Lichttisch", draussen=sorted(set(draussen)))
    lese_sichtbar = seite.evaluate("getComputedStyle(document.querySelector('#lese')).visibility")
    inert = seite.evaluate("['#lese','#gl','#snd','#seite','#netzknopf','#zurueck'].map(q => document.querySelector(q).inert)")
    notiz(pruefung="Hintergrund", lese_visibility=lese_sichtbar, inert=inert)
    bild(seite, "nachher-lichttisch-karten")
    # In die Form tippen, dann Esc: der Tisch schließt
    kasten = seite.locator(".formen-blatt").bounding_box()
    seite.mouse.click(kasten["x"] + kasten["width"] / 2, kasten["y"] + kasten["height"] / 2)
    time.sleep(0.4)
    seite.keyboard.press("Escape")
    time.sleep(0.4)
    notiz(pruefung="Esc nach Tippen in die Form", tisch_zu=seite.evaluate("document.querySelector('#formen').hidden"),
          zeile=seite.inner_text("#line"), fokus=seite.evaluate("document.activeElement.className"))
    # Erstes Behalten ohne Eintrag „Ralf“: Siegel über dem Tisch; Esc gilt dem Siegel; nichts geschrieben
    vorher = zaehle()
    seite.click(".formen-griff") if seite.evaluate("document.querySelector('.faecher').hidden") else None
    seite.click(".faecher-knopf:has-text('Lesetuch')")
    seite.wait_for_selector(".formen-tun .halten", timeout=20000)
    b = seite.locator(".formen-tun .halten").bounding_box()
    seite.mouse.move(b["x"] + b["width"] / 2, b["y"] + b["height"] / 2)
    seite.mouse.down(); time.sleep(1.8); seite.mouse.up()
    seite.wait_for_selector("#siegel:not([hidden])", timeout=8000)
    bild(seite, "nachher-siegel-ueber-tisch")
    seite.keyboard.press("Escape")
    time.sleep(0.6)
    notiz(pruefung="Esc beim Siegel über dem Tisch", siegel_zu=seite.evaluate("document.querySelector('#siegel').hidden"),
          tisch_offen=not seite.evaluate("document.querySelector('#formen').hidden"), satz=seite.inner_text(".formen-satz"),
          geschrieben=zaehle() != vorher)
    seite.keyboard.press("Escape")


def wiederkommen(seite, kontext, zusatz=""):
    seite.goto(ADRESSE + "/", wait_until="load")
    seite.evaluate("() => { try{ localStorage.removeItem('spiralcells-lichtwerk-zuletzt'); }catch(e){} }")
    seite.reload(wait_until="load")
    time.sleep(3)
    merker = seite.evaluate("() => localStorage.getItem('spiralcells-lichtwerk-zuletzt')")
    notiz(pruefung="Erster Besuch ohne Merker", zeile=seite.inner_text("#line"), merker_gesetzt=bool(merker))
    # Merker auf die Zeit vor den jüngsten Einträgen
    with urllib.request.urlopen(ADRESSE + "/api/graph", timeout=20) as r:
        g = json.load(r)
    zeiten = sorted(v["created_at"] for v in g["variants"])
    vor = zeiten[-4]
    seite.evaluate("t => localStorage.setItem('spiralcells-lichtwerk-zuletzt', String(Date.parse(t) - 1000))", vor)
    seite.reload(wait_until="load")
    time.sleep(1.6)
    notiz(pruefung="Wiederkommen mit Ankünften", zeile=seite.inner_text("#line"), adresse=seite.url.replace(ADRESSE, ""))
    bild(seite, "nachher-wiederkommen-zelle" + zusatz)
    time.sleep(4)
    seite.keyboard.press("n")
    time.sleep(2.5)
    bild(seite, "nachher-wiederkommen-netz" + zusatz)
    merker = seite.evaluate("() => Number(localStorage.getItem('spiralcells-lichtwerk-zuletzt'))")
    notiz(pruefung="Merker nach der Ankunft", merker_nach_vor=merker > 0)
    seite.reload(wait_until="load")
    time.sleep(1.5)
    notiz(pruefung="Gleich danach noch einmal", zeile=seite.inner_text("#line"))


def link(seite, zusatz=""):
    seite.goto("about:blank")
    seite.set_content('<a id="weg" href="%s/#mond=emile-durkheim&von=sternwerft">Am Werk anlegen</a>' % ADRESSE)
    t0 = time.time()
    seite.click("#weg")
    seite.wait_for_load_state("load")
    time.sleep(0.4)
    bild(seite, "nachher-link-fahrt" + zusatz)
    warte(seite, "() => document.querySelector('#zurueck') && !document.querySelector('#zurueck').hidden", 10)
    time.sleep(1.2)
    notiz(pruefung="Link in die Zelle", ort=seite.inner_text("#zurueck"), adresse=seite.url.replace(ADRESSE, ""),
          zeile=seite.inner_text("#line"), sekunden=round(time.time() - t0, 1))
    bild(seite, "nachher-link-zelle" + zusatz)
    # Rückweg oben links: feste Adresse der Sternwerft (Leseeingang), nie eine aus dem Link
    seite.click("#zurueck")
    seite.wait_for_load_state("load")
    time.sleep(1.5)
    notiz(pruefung="Rückweg zur Sternwerft", adresse=seite.url, titel=seite.title())
    seite.goto(ADRESSE + "/#mond=gibt-es-nicht&von=kinos", wait_until="load")
    time.sleep(2)
    notiz(pruefung="Unbekannter Name", zeile=seite.inner_text("#line"), adresse=seite.url.replace(ADRESSE, ""))


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        for breite, hoehe, mobil, rm in ((1440, 900, False, "no-preference"), (375, 812, True, "no-preference"), (1440, 900, False, "reduce")):
            kontext = browser.new_context(viewport={"width": breite, "height": hoehe}, is_mobile=mobil, has_touch=mobil,
                                          device_scale_factor=2 if mobil else 1, reduced_motion=rm)
            seite = kontext.new_page()
            fehler = []
            seite.on("console", lambda m: fehler.append(m.text) if m.type == "error" else None)
            seite.on("pageerror", lambda e: fehler.append("Seitenfehler: %s" % e))
            if not mobil and rm != "reduce":
                lichttisch(seite)
            wiederkommen(seite, kontext, "-375" if mobil else "-ruhig" if rm == "reduce" else "")
            link(seite, "-375" if mobil else "-ruhig" if rm == "reduce" else "")
            notiz(breite=breite, reduziert=rm, konsolenfehler=fehler[:8])
            kontext.close()
        browser.close()
    with open("%s/pruefung-protokoll.json" % ORDNER, "w", encoding="utf-8") as f:
        json.dump(protokoll, f, ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()

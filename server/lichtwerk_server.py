"""SPiRALCELLS-Lichtwerk — kleiner Server: liefert die Oberfläche und leitet
API-Aufrufe serverseitig an SPiRALCELLS (mooncells, Port 8401) weiter.

Linse, kein Träger (ADR-0006): Der Server hält keinen eigenen Bestand.
Lesen geht durch. Schreiben nur über die vorgesehenen Wege und standardmäßig als Ralf:

    POST /api/variant-branches     Einwurf → Ausprägung, immer mit request_id
    POST /api/variants/{id}/status Kristallisieren und andere Statuswechsel
    POST /api/edges                zwei Ausprägungen verbinden (ohne Dopplung)
    POST /api/agents               einmalig Ralfs eigener Eintrag (human)

Alles andere wird abgewiesen. Nur Standardbibliothek, nur 127.0.0.1.
Mit --autorenprofile dürfen Fassungen unter vorhandenen Urheberprofilen abgelegt
werden. Das benennt die Urheberschaft des Materials und führt kein Modell aus.

Mit --leseeingang 8420 öffnet derselbe Prozess einen zweiten Eingang, der nur liest.
Skizzen und Werkraum laufen im Betrieb dort; 8411 leitet sie dorthin um. So kann
keine fremde Seite durch die Schleuse schreiben, denn _schutz kennt nur Host, Port
und Origin, nicht die Seite.

Start:  python3 server/lichtwerk_server.py --port 8411 --leseeingang 8420
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import html
import json
import os
import re
import socket
import sys
import threading
import time
import unicodedata
import urllib.error
import urllib.request
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlsplit

HIER = os.path.dirname(os.path.abspath(__file__))
WURZEL = os.path.dirname(HIER)
APP = os.path.join(WURZEL, "app")
STANDBILDER = os.path.join(WURZEL, "standbilder")
ORDNUNG = os.path.join(WURZEL, "ordnung.json")   # Mitte, Dächer, Bereiche: belegt aus Ralfs Quellen, von ihm zu bestätigen
SKIZZEN = os.path.join(os.path.dirname(WURZEL), "kin-os-sichten-codex")   # Codex' echter Ordner, nicht die Hardlinks
SKIZZEN_WEG = "/kin-os-sichten-codex/"

STATUS = {"entwurf", "geprüft", "grundformation", "verworfen"}
KANTEN = {"verweist-auf", "erweitert", "widerspricht"}
EINWURF_FELDER = {"work_id", "worktree_id", "new_worktree", "derived_from", "source_variant_id",
                  "request_id", "label", "content", "notes", "author_id", "contribution"}
KANTEN_FELDER = {"edge_type", "from_variant_id", "to_variant_id", "note", "author_id"}
LESEN = {"/api/graph", "/api/health", "/api/agents"}
UMGEBUNG = [  # nur Lebenszeichen; TiSCH (9030) wird nie angefragt, er kostet Geld
    {"name": "KiN OS", "satz": "KiN OS · der Fork der Zentrale", "port": 8895, "pfad": "/api/aios/runtime"},
    {"name": "Zentrale", "satz": "Zentrale · KREATiVTRAGWERK", "port": 8894, "pfad": "/"},
    {"name": "KiNFORMER", "satz": "KiNFORMER · die Formwerkstatt", "port": 9062, "pfad": "/"},
    {"name": "KiN", "satz": "KiNTEGRiTY · das Gedächtnis", "port": 9040, "pfad": "/api/health"},
]
TYPEN = {".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
         ".css": "text/css; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml",
         ".png": "image/png", ".jpg": "image/jpeg", ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8"}
CSP = ("default-src 'self'; img-src 'self' data:; connect-src 'self'; style-src 'self' 'unsafe-inline'; "
       "script-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'")


class Fehler(Exception):
    def __init__(self, status: int, satz: str):
        super().__init__(satz)
        self.status, self.satz = status, satz


ID = r"[A-Za-z0-9-]{1,80}"
_stand = {"t": 0.0, "stand": None}
_stand_lock = threading.Lock()


# ------------------------------------------------------------------ Menschlich
# Wie menschlich() und kurz() in app/js/daten.js. Ein Test vergleicht beide an denselben
# Beispielen (tests/menschlich-beispiele.json). ASCII-Grenzen wie \b in JavaScript ohne u,
# Leerraum genau wie \s und trim() in JavaScript, Längen in Codepunkten wie dort mit [...s].
_LEER = "\t\n\v\f\r \u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff"
_LEER_ZEICHEN = "\t\n\v\f\r \u00a0\u1680" + "".join(chr(c) for c in range(0x2000, 0x200b)) + "\u2028\u2029\u202f\u205f\u3000\ufeff"
_VERWEIS = re.compile(r"\[([^\]\n]{1,200})\]\((?:[^)%s]{1,600})\)" % _LEER)
_UUID = re.compile(r"\b[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\b", re.I | re.A)
_SUMME = re.compile(r"\b[0-9a-f]{40,64}\b", re.I | re.A)
_KURZSUMME = re.compile(r"\b(?=[0-9a-f]*\d)(?=[0-9a-f]*[a-f])[0-9a-f]{7,39}\b", re.I | re.A)
_PFAD = re.compile(r"(?:file://)?/(?:Users|Volumes|home|private|tmp|opt)/[^%s<>\"'`)\]]+" % _LEER)
_HEIMPFAD = re.compile(r"(?:~|\$HOME)/[^%s<>\"'`)\]]+" % _LEER)
_KODIERT = re.compile(r"(^|[^A-Za-z0-9])-(?:Users|Volumes)-[A-Za-z0-9._-]+")   # Ordnernamen wie -Users-name-Documents-…


def _pfadname(m) -> str:
    n = re.sub(r"/+$", "", m.group(0)).split("/")[-1]
    return n if n and len(n) <= 60 else "[lokaler Speicherort]"


def menschlich(text) -> str:
    s = "" if text is None else str(text)
    s = _VERWEIS.sub(r"\1", s)
    s = _UUID.sub("[technische Kennung]", s)
    s = _SUMME.sub("[Prüfsumme]", s)
    s = _KURZSUMME.sub("[Prüfsumme]", s)
    s = _PFAD.sub(_pfadname, s)
    s = _HEIMPFAD.sub(_pfadname, s)
    return _KODIERT.sub(r"\1[lokaler Speicherort]", s)


def kurz(text, n: int) -> str:
    s = re.sub("[%s]+" % _LEER, " ", menschlich(text)).strip(_LEER_ZEICHEN)
    return s[:n - 1].rstrip(_LEER_ZEICHEN) + "…" if len(s) > n else s


# -------------------------------------------------------------------- Formen
# Der KiNFORMER rechnet, vom Server aus und ohne Origin; er schreibt nirgends hin (Bauplan
# Etappe 2, B2). Die Vorschau liest nur den Graphen. Unter jede Form setzt das Lichtwerk
# einen ehrlichen Herkunftssatz statt „Der Wortlaut ist unverändert übernommen“.
FORM_GRENZE = 100_000
FORM_NOTIZ = "Form ohne Modell · KiNFORMER"
HERKUNFT = re.compile(r'<p class="herkunft">.*?</p>', re.S)
_schreib_lock = threading.Lock()   # Behalten und Einwurf nacheinander: Nachsehen und Ablegen bleiben ein Schritt
UNKLAR = "Ob die Form angekommen ist, ist gerade unklar. Noch einmal halten legt sie höchstens einmal ab."
_formen = {"t": 0.0, "richtungen": None, "ergebnisse": {}}
_formen_lock = threading.Lock()


def original_einer_form(g: dict, v: dict):
    """Ist v ein Form-Korn, das Original; sonst None. Wie istForm in app/js/daten.js: Notiz, Urheber Ralf,
    Seitenanfang und Faden zum Original. Fehlt der Faden nach einem Abbruch, gilt das Gesehene."""
    a = next((a for a in g.get("agents", []) if a.get("id") == v.get("author_id")), {})
    if a.get("agent_type") != "human" or a.get("handle") != "Ralf" or not str(v.get("notes") or "").startswith(FORM_NOTIZ) \
            or not str(v.get("content") or "").lstrip().lower().startswith("<!doctype html>"):
        return None
    for e in g.get("edges", []):
        if e.get("edge_type") == "verweist-auf" and e.get("from_variant_id") == v.get("id") and e.get("author_id") == a.get("id"):
            return e.get("to_variant_id")
    gesehen = (v.get("contribution") or {}).get("seen_variant_ids") or []
    return gesehen[0] if gesehen else None


def ist_app_zustand(inhalt: str) -> bool:
    t = (inhalt or "").strip()
    if not t or t[0] not in "{[":
        return False
    try:
        json.loads(t)
        return True
    except ValueError:
        return False


def fuer_formen(text: str, richtung: str) -> str:
    """Den Text so bereinigen, wie ihn die Lesefläche zeigt: ohne Kennungen, ohne Auszeichnungszeichen."""
    t = menschlich(text).replace("\r\n", "\n").replace("\r", "\n")
    t = re.sub(r"\*\*(.+?)\*\*", r"\1", t)
    t = re.sub(r"`([^`\n]+)`", r"\1", t)
    zeilen = []
    for z in t.split("\n"):
        if re.fullmatch(r"\s*([-*_])\1{2,}\s*", z):
            zeilen.append("")
            continue
        z = re.sub(r"^\s*>\s?", "", z)
        kopf = re.match(r"^\s{0,3}#{1,6}\s+(.*)$", z)
        if kopf and richtung != "schaubild":    # das Schaubild liest die Gliederung selbst aus den Überschriften
            zeilen += ["", kopf.group(1).strip(), ""]
            continue
        zeilen.append(z)
    return re.sub(r"\n{3,}", "\n\n", "\n".join(zeilen)).strip()


def marken_fallen_weg(text: str, bis: int | None = None) -> bool:
    """Wie saetze() in formformer/formen_http.py: Stehen Aufzählungszeichen oder Nummern am Satzanfang?
    Mit `bis` nur in den ersten Sätzen, die eine Form zeigt (Plakat drei, Spiel höchstens 24)."""
    t = re.sub(r"[ \t]+", " ", text).strip()
    teile = [x.strip() for x in re.split(r"(?<=[.!?…])\s+|\n{2,}|\n(?=[-–•*]\s)", t) if x.strip()]
    return any(re.match(r"(?:[-–•*]|\d+[.)])\s+", x) for x in teile[:bis])


def schaubild_verliert_fliesstext(text: str) -> bool:
    """Wie gliederung() in formformer/formen_http.py: Steht in einem Block Fließtext neben einer Aufzählung,
    nimmt das Schaubild nur die Aufzählung."""
    for block in re.split(r"\n{2,}", str(text).replace("\r", "")):
        zeilen = [z.rstrip() for z in block.split("\n") if z.strip()]
        if zeilen and re.match(r"\s*#{1,6}\s*(.+)", zeilen[0]):
            zeilen = zeilen[1:]
        punkte = [z for z in zeilen if re.match(r"\s*(?:[-–•*]|\d+[.)])\s+", z)]
        fliess = " ".join(z for z in zeilen if not re.match(r"\s*(?:[-–•*]|\d+[.)])\s+", z)).strip()
        if punkte and fliess:
            return True
    return False


# Die Sätze im Fächer: was die Richtung tatsächlich tut, ohne Sinnverstehen zu behaupten
FAECHER = {
    "plakat": "Die ersten drei Sätze, groß gesetzt.",
    "lesetuch": "Jeder Satz neu gesetzt, zum Vorlesen.",
    "karten": "Jeder Satz eine Karte.",
    "schaubild": "Jeder Absatz ein Zweig, seine weiteren Sätze als Blätter.",
    "spiel": "Karten zum Umdrehen und Ordnen.",
}


def was_blieb(richtung: str, ergebnis: dict, n: int | None, text: str) -> str:
    """Ein ehrlicher Satz, was von den Sätzen des Originals in dieser Form steht."""
    bis = None
    if richtung == "plakat":
        bis = 3
        if n is None:
            satz = "Der Anfang, groß gesetzt."
        elif n <= 1:
            satz = "Der eine Satz, groß gesetzt."
        elif n == 2:
            satz = "Beide Sätze, groß gesetzt."
        elif n == 3:
            satz = "Alle drei Sätze, groß gesetzt."
        else:
            satz = "Die ersten drei von %d Sätzen, groß gesetzt." % n
    elif richtung == "lesetuch":
        satz = "Der eine Satz, neu gesetzt." if n == 1 else "Alle %d Sätze, neu gesetzt." % n if n else "Alle Sätze, neu gesetzt."
    elif richtung == "karten":
        satz = "Eine Karte für den einen Satz." if n == 1 else "%d Karten, jeder Satz eine." % n if n else "Jeder Satz eine Karte."
    elif richtung == "schaubild":
        satz = "Jeder Absatz ein Zweig, seine weiteren Sätze als Blätter."
        if schaubild_verliert_fliesstext(text):
            satz += " Steht Fließtext neben einer Aufzählung, zeigt das Bild nur die Aufzählung."
        if re.search(r"… und \d+ weitere|\s…</tspan>", ergebnis.get("html", "")):
            satz += " Längeres ist gekürzt und mit „…“ markiert."
        return satz
    elif richtung == "spiel":   # die Zahlen nennt der KiNFORMER; der Satz kommt von hier, mit richtiger Einzahl
        m = re.match(r"(\d+) Karten? zum Umdrehen und Ordnen\.(?: Die ersten (\d+) von (\d+) Sätzen\.)?", str(ergebnis.get("satz") or ""))
        if m:
            k = int(m.group(1))
            bis = k
            satz = "Eine Karte zum Umdrehen." if k == 1 else "%d Karten zum Umdrehen und Ordnen." % k
            if m.group(2):
                satz += " Die ersten %s von %s Sätzen." % (m.group(2), m.group(3))
        else:
            satz = str(ergebnis.get("satz") or "").strip() or "Neu gesetzt."
    else:       # künftige Richtungen: der KiNFORMER nennt seine Kürzung selbst
        satz = str(ergebnis.get("satz") or "").strip() or "Neu gesetzt."
    if marken_fallen_weg(text, bis):
        satz += " Aufzählungszeichen und Nummern am Satzanfang fallen weg."
    return satz


# ------------------------------------------------------------ Links und Neues
# Wie app/js/link.js und app/js/ankunft.js; Tests vergleichen beide an denselben Beispielen.
MONAT = ["jan", "feb", "maerz", "apr", "mai", "juni", "juli", "aug", "sep", "okt", "nov", "dez"]
STIMMEN = [("Claude", r"^claude"), ("Codex", r"^codex"), ("Hermes", r"^hermes"), ("Antigravity", r"^anti-?\s?gravity"), ("Kimi", r"^kimi")]
UEBERNAHME_AB = 12
try:
    from zoneinfo import ZoneInfo
    BERLIN = ZoneInfo("Europe/Berlin")
except Exception:   # ohne Zeitzonendaten: Ortszeit des Macs
    BERLIN = None


def _ms(wert) -> float:
    try:
        from datetime import datetime
        return datetime.fromisoformat(str(wert).replace("Z", "+00:00")).timestamp() * 1000
    except (ValueError, TypeError):
        return 0.0


def grundname(titel) -> str:
    s = str(titel or "").lower().replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss")
    s = "".join(c for c in unicodedata.normalize("NFKD", s) if not unicodedata.combining(c))
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s[:60].rstrip("-") or "mond"


def _tag_und_zeit(ms: float):
    from datetime import datetime, timezone
    d = datetime.fromtimestamp(ms / 1000, tz=timezone.utc).astimezone(BERLIN) if BERLIN else datetime.fromtimestamp(ms / 1000)
    return "%d-%s" % (d.day, MONAT[d.month - 1]), "%02d%02d" % (d.hour, d.minute)


def mond_namen(works: list) -> dict:
    """Lesbare Namen je Mond: der älteste behält den kurzen, spätere bekommen ihren Eingangstag."""
    folge = sorted(range(len(works)), key=lambda i: (_ms(works[i].get("created_at")), i))
    vergeben, aus = set(), {}
    for i in folge:
        w = works[i]
        name = grundname(w.get("title"))
        if name in vergeben:
            tag, zeit = _tag_und_zeit(_ms(w.get("created_at")))
            name = "%s-%s" % (grundname(w.get("title")), tag)
            if name in vergeben:
                name = "%s-%s" % (name, zeit)
            basis, k = name, 2
            while name in vergeben:
                name, k = "%s-%d" % (basis, k), k + 1
        vergeben.add(name)
        aus[w.get("id")] = name
    return aus


def stimme_von(agent) -> str | int:
    if not agent:
        return "quelle"
    if agent.get("agent_type") == "human":
        return "mensch"
    for i, (_, muster) in enumerate(STIMMEN):
        if re.match(muster, str(agent.get("handle") or ""), re.I):
            return i
    return "quelle"


def neu_seit(g: dict, seit: float) -> dict:
    """Was nach `seit` (ms, UTC) eingetragen wurde; Ralfs eigene Einträge und Formen nie."""
    agenten = {a.get("id"): a for a in g.get("agents", [])}
    baeume = {t.get("id"): t for t in g.get("worktrees", [])}
    ralf = next((a for a in g.get("agents", []) if a.get("agent_type") == "human"), None)
    pro, uebernahmen, monde, juengster, jt, zahl = {}, 0, set(), None, 0.0, 0
    for v in g.get("variants", []):
        t = _ms(v.get("created_at"))
        if t <= seit or original_einer_form(g, v):
            continue
        st = stimme_von(agenten.get(v.get("author_id")))
        if st == "mensch":
            continue
        werk = (baeume.get(v.get("worktree_id")) or {}).get("work_id")
        if not werk:
            continue
        zahl += 1
        monde.add(werk)
        if st == "quelle":
            uebernahmen += 1
        else:
            pro[st] = pro.get(st, 0) + 1
        if t > jt:
            jt, juengster = t, werk
    rid = ralf.get("id") if ralf else None
    faeden = sum(1 for e in g.get("edges", []) if _ms(e.get("created_at")) > seit and e.get("author_id") != rid)
    befunde = sum(1 for f in g.get("findings", []) if _ms(f.get("created_at")) > seit and f.get("author_id") != rid)
    stimmen = [[STIMMEN[i][0], k] for i, k in sorted(pro.items(), key=lambda x: (-x[1], x[0]))]
    return {"zahl": zahl, "stimmen": stimmen, "uebernahmen": uebernahmen, "faeden": faeden, "befunde": befunde,
            "monde": len(monde), "juengster": juengster}


ZULETZT = 5
MONATSKURZ = ["Jan.", "Feb.", "März", "Apr.", "Mai", "Juni", "Juli", "Aug.", "Sep.", "Okt.", "Nov.", "Dez."]


def zuletzt_eintraege(g: dict, n: int = ZULETZT) -> list:
    """Die jüngsten Einträge, ganz gleich seit wann; ohne Ralfs eigene und ohne Formen (wie letzte() in app/js/ankunft.js)."""
    agenten = {a.get("id"): a for a in g.get("agents", [])}
    baeume = {t.get("id"): t for t in g.get("worktrees", [])}
    werke = {w.get("id"): w for w in g.get("works", [])}
    namen = mond_namen(g.get("works", []))
    liste = []
    for v in g.get("variants", []):
        st = stimme_von(agenten.get(v.get("author_id")))
        werk = (baeume.get(v.get("worktree_id")) or {}).get("work_id")
        if st == "mensch" or not werk or original_einer_form(g, v):
            continue
        liste.append((_ms(v.get("created_at")), v, st, werk))
    liste.sort(key=lambda x: -x[0])
    return [{"mond": namen.get(werk), "titel": kurz((werke.get(werk) or {}).get("title") or "Unbenannter Mond", 80),
             "label": kurz(v.get("label") or "Unbenannte Ausprägung", 80),
             "stimme": STIMMEN[st][0] if isinstance(st, int) else None, "wann": v.get("created_at")}
            for t, v, st, werk in liste[:n]]


def wann_menschlich(wert) -> str:
    """Wie datum() in app/js/daten.js: „20. Okt., 18:30“, in Ralfs Ortszeit."""
    from datetime import datetime, timezone
    ms = _ms(wert)
    if not ms:
        return "ohne Datum"
    d = datetime.fromtimestamp(ms / 1000, tz=timezone.utc).astimezone(BERLIN) if BERLIN else datetime.fromtimestamp(ms / 1000)
    return "%d. %s, %02d:%02d" % (d.day, MONATSKURZ[d.month - 1], d.hour, d.minute)


def zuletzt_satz(e) -> str:
    """Wie zuletztSatzAus() in app/js/ankunft.js: ein Satz zum jüngsten Eintrag."""
    if not e:
        return ""
    von = "von %s" % e["stimme"] if e.get("stimme") else "aus einer Quelle"
    return "Zuletzt eingetragen: „%s“ %s in „%s“, %s." % (e["label"], von, e["titel"], wann_menschlich(e.get("wann")))


_ZAHL = ["keine", "eine", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn", "elf", "zwölf"]


def _zahl(k: int, eins: str = "eine") -> str:
    return eins if k == 1 else _ZAHL[k] if 0 <= k < len(_ZAHL) else str(k)


def _aufzaehlen(teile: list) -> str:
    return "".join(teile) if len(teile) <= 1 else ", ".join(teile[:-1]) + " und " + teile[-1]


def satz_aus(z: dict) -> str:
    """Wie satzAus() in app/js/ankunft.js."""
    teile = []
    for i, (name, k) in enumerate(z["stimmen"]):
        teile.append("%s %s von %s" % (_zahl(k), "Ausprägung" if k == 1 else "Ausprägungen", name) if i == 0
                     else "%s von %s" % (_zahl(k), name))
    u = z["uebernahmen"]
    if u:
        wort = "" if teile else (" Ausprägung" if u == 1 else " Ausprägungen")
        teile.append("%d%s aus einer technischen Übernahme" % (u, wort) if u > UEBERNAHME_AB else "%s%s aus Quellen" % (_zahl(u), wort))
    extra = []
    if z["faeden"]:
        extra.append("%s %s" % (_zahl(z["faeden"], "ein"), "neuer Faden" if z["faeden"] == 1 else "neue Fäden"))
    if z["befunde"]:
        extra.append("%s %s" % (_zahl(z["befunde"], "ein"), "Befund" if z["befunde"] == 1 else "Befunde"))
    if not teile and not extra:
        return "Seit deinem letzten Besuch ist nichts dazugekommen."
    satz = "Seit deinem letzten Besuch eingetragen: %s" % _aufzaehlen(teile) if teile else "Seit deinem letzten Besuch eingetragen"
    if teile and z["monde"] > 1:
        satz += ", in %s Monden" % _zahl(z["monde"], "einem")
    satz += "." if teile else ": "
    if extra:
        satz += (" Dazu " if teile else "") + _aufzaehlen(extra) + "."
    return satz


class Lichtwerk(BaseHTTPRequestHandler):
    server_version = "SPiRALCELLS-Lichtwerk"
    sys_version = ""
    upstream = "http://127.0.0.1:8401"
    werkstatt = False
    autorenprofile = False
    port = 8411
    leseeingang = None   # Port des nur lesenden Eingangs; ist er an, gehen fremde Seiten dorthin
    kinformer = "http://127.0.0.1:9062"
    behalten = False     # Formen behalten (Etappe 3): im Betrieb erst nach der Kritikrunde an der Testkette
    timeout = 10

    # ------------------------------------------------------------ Grundlagen
    def log_message(self, fmt, *args):  # knapp, ohne Inhalte
        sys.stdout.write("%s %s\n" % (time.strftime("%H:%M:%S"), fmt % args))
        sys.stdout.flush()   # sofort ins Protokoll, damit es belegt, was gerade geschah

    def _eigene_adresse(self, wert: str, *, origin: bool = False) -> bool:
        try:
            a = urlsplit(wert if origin else "http://" + wert)
            ok = a.hostname in ("127.0.0.1", "localhost") and (a.port or 80) == self.port and not a.username
            if origin:
                ok = ok and a.scheme == "http" and a.path in ("", "/") and not a.query
            return bool(ok)
        except ValueError:
            return False

    def _schutz(self, schreibend: bool) -> None:
        if not self._eigene_adresse(self.headers.get("Host", "")):
            raise Fehler(403, "Diese Adresse ist für das Lichtwerk nicht zugelassen.")
        site = self.headers.get("Sec-Fetch-Site")
        if schreibend:
            origin = self.headers.get("Origin")
            if origin is None or not self._eigene_adresse(origin, origin=True):
                raise Fehler(403, "Schreiben geht nur aus dem Lichtwerk selbst.")
            if site not in (None, "same-origin"):
                raise Fehler(403, "Schreiben geht nur aus dem Lichtwerk selbst.")
            if not (self.headers.get("Content-Type", "").split(";")[0].strip() == "application/json"):
                raise Fehler(415, "Erwartet wird ein Eintrag im JSON-Format.")
        elif site == "cross-site" and self.headers.get("Sec-Fetch-Mode") != "navigate":
            raise Fehler(403, "Fremde Seiten dürfen hier nicht lesen.")

    def _senden(self, status: int, daten: bytes, typ: str = "application/json", extra: dict | None = None):
        self.send_response(status)
        self.send_header("Content-Type", typ)
        self.send_header("Content-Length", str(len(daten)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        if typ.startswith("text/html"):
            self.send_header("Content-Security-Policy", CSP)
        for k, v in (extra or {}).items():
            self.send_header(k, v)
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(daten)

    def _json(self, status: int, obj) -> None:
        self._senden(status, json.dumps(obj, ensure_ascii=False).encode("utf-8"))

    def _umleiten(self, ziel: str) -> None:
        self.send_response(302)
        self.send_header("Location", ziel)
        self.send_header("Content-Length", "0")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Referrer-Policy", "no-referrer")
        self.end_headers()

    def _zum_leseeingang(self, teile) -> None:
        self._umleiten("http://127.0.0.1:%d%s%s" % (self.leseeingang, teile.path, "?" + teile.query if teile.query else ""))

    @staticmethod
    def _fremde_seite(ziel: str) -> bool:
        """Eine Datei, die als Seite laufen kann und nicht das Lichtwerk ist (Werkraum, Skizzen, jedes andere HTML oder SVG)."""
        if ziel == os.path.realpath(os.path.join(APP, "index.html")):
            return False
        return TYPEN.get(os.path.splitext(ziel)[1].lower(), "").startswith(("text/html", "image/svg"))

    def _body(self, grenze: int = 4_000_000):
        try:
            n = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            raise Fehler(400, "Der Eintrag ist nicht lesbar.")
        if n < 0:
            raise Fehler(400, "Der Eintrag ist nicht lesbar.")
        if n > grenze:
            raise Fehler(413, "Das ist zu groß zum Ablegen.")
        roh = self.rfile.read(n) if n else b""
        try:
            return json.loads(roh.decode("utf-8") or "null")
        except (UnicodeDecodeError, json.JSONDecodeError):
            raise Fehler(400, "Der Eintrag ist nicht lesbar.")

    # ------------------------------------------------------ SPiRALCELLS-Weg
    def _oben(self, methode: str, pfad: str, obj=None, zeit: float = 8.0):
        daten = None if obj is None else json.dumps(obj, ensure_ascii=False).encode("utf-8")
        req = urllib.request.Request(self.upstream + pfad, data=daten, method=methode,
                                     headers={"Content-Type": "application/json", "Accept": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=zeit) as r:
                return r.status, r.read()
        except urllib.error.HTTPError as e:
            return e.code, e.read()
        except (urllib.error.URLError, socket.timeout, ConnectionError, OSError):
            raise Fehler(503, "SPiRALCELLS ruht gerade.")

    def _oben_json(self, methode: str, pfad: str, obj=None):
        status, roh = self._oben(methode, pfad, obj)
        try:
            return status, json.loads(roh.decode("utf-8") or "null")
        except (UnicodeDecodeError, json.JSONDecodeError):
            return status, None

    def _ist_mensch(self, agent_id) -> bool:
        """Nur Ralfs eigener Eintrag: Mensch und genau dieser Name."""
        if not isinstance(agent_id, str) or not re.fullmatch(ID, agent_id):
            return False
        status, a = self._oben_json("GET", "/api/agents/" + agent_id)
        return status == 200 and isinstance(a, dict) and a.get("agent_type") == "human" and a.get("handle") == "Ralf"

    def _ist_autorprofil(self, agent_id) -> bool:
        """Ein bereits vorhandenes Profil, keine Registrierung oder Modellausführung."""
        if not isinstance(agent_id, str) or not re.fullmatch(ID, agent_id):
            return False
        status, a = self._oben_json("GET", "/api/agents/" + agent_id)
        return status == 200 and isinstance(a, dict) and a.get("id") == agent_id

    def _weiter(self, status: int, roh: bytes) -> None:
        self._senden(status, roh)

    # ---------------------------------------------------------------- GET
    def do_HEAD(self):
        self.do_GET()

    def do_GET(self):
        try:
            self._schutz(False)
            teile = urlsplit(self.path)
            pfad = teile.path
            if not pfad.startswith("/"):
                raise Fehler(404, "Hier liegt nichts.")
            if self.leseeingang and (pfad + "/").startswith(SKIZZEN_WEG):   # Skizzen lesen nur, auf dem Leseeingang
                self._zum_leseeingang(teile)
                return
            if pfad == "/api/health":
                status, roh = self._oben("GET", pfad)
                if status != 200:
                    self._weiter(status, roh)
                else:
                    try:
                        health = json.loads(roh)
                    except (UnicodeDecodeError, json.JSONDecodeError):
                        raise Fehler(503, "SPiRALCELLS ruht gerade.")
                    if not isinstance(health, dict):
                        raise Fehler(503, "SPiRALCELLS ruht gerade.")
                    self._json(200, {**health, "lichtwerk": {
                        "capabilities": {"authorSelection": bool(self.autorenprofile)}
                    }})
            elif pfad in LESEN:
                self._weiter(*self._oben("GET", pfad))
            elif pfad == "/lichtwerk/graph":   # Graph und sein Stand aus derselben Antwort
                status, roh = self._oben("GET", "/api/graph")
                if status != 200:
                    raise Fehler(503, "SPiRALCELLS ruht gerade.")
                stand = hashlib.sha256(roh).hexdigest()
                with _stand_lock:
                    _stand.update(t=time.time(), stand=stand)
                self._senden(200, roh, extra={"X-Stand": stand})
            elif pfad == "/lichtwerk/stand":   # kurz zwischengespeichert, damit mehrere Fenster nicht je 6 MB hashen
                with _stand_lock:
                    frisch = time.time() - _stand["t"] < 2.5 and _stand["stand"]
                if not frisch:
                    status, roh = self._oben("GET", "/api/graph")
                    if status != 200:
                        raise Fehler(503, "SPiRALCELLS ruht gerade.")
                    with _stand_lock:
                        _stand.update(t=time.time(), stand=hashlib.sha256(roh).hexdigest())
                self._json(200, {"wach": True, "stand": _stand["stand"]})
            elif pfad == "/lichtwerk/umgebung":
                tueren = [{"name": u["name"], "satz": u["satz"], "wach": self._lebt(u),
                           "adresse": "http://127.0.0.1:%d/" % u["port"]} for u in UMGEBUNG]
                if self.leseeingang:   # Codex' Werkraum, nur lesend über den Leseeingang
                    werkraum = {"port": self.leseeingang, "pfad": "/werkraum.html"}
                    tueren.append({"name": "Werkraum", "satz": "Werkraum · Codex, nur lesend", "wach": self._lebt(werkraum),
                                   "adresse": "http://127.0.0.1:%d/werkraum.html" % self.leseeingang})
                self._json(200, tueren + [{"name": "TiSCH", "satz": "DER TiSCH", "wach": None, "adresse": None}])
            elif pfad == "/lichtwerk/formen/richtungen":
                self._json(200, {"richtungen": self._richtungen()})
            elif pfad == "/lichtwerk/monde":
                self._json(200, self._monde())
            elif pfad == "/lichtwerk/ordnung":   # nur lesen; fehlt die Datei, ist alles „ohne Dach“
                try:
                    with open(ORDNUNG, "rb") as f:
                        self._senden(200, f.read())
                except FileNotFoundError:
                    self._json(200, {"daecher": [], "bestaetigt": False})
            elif pfad == "/lichtwerk/neu":
                self._neu(parse_qs(teile.query).get("seit", [""])[0])
            elif pfad in ("/", "/index.html"):
                self._datei(os.path.join(APP, "index.html"))
            else:
                ziel = os.path.realpath(os.path.join(APP, pfad.lstrip("/")))
                if not ziel.startswith(os.path.realpath(APP) + os.sep) or not os.path.isfile(ziel):
                    raise Fehler(404, "Hier liegt nichts.")
                if self.leseeingang and self._fremde_seite(ziel):   # der Werkraum läuft im Betrieb nur lesend
                    self._zum_leseeingang(teile)
                    return
                self._datei(ziel)
        except Fehler as f:
            self._json(f.status, {"satz": f.satz})

    def _lebt(self, u) -> bool:
        try:
            with urllib.request.urlopen("http://127.0.0.1:%d%s" % (u["port"], u["pfad"]), timeout=0.8) as r:
                return 200 <= r.status < 500
        except urllib.error.HTTPError as e:
            return e.code < 500
        except Exception:
            return False

    def _datei(self, ziel: str) -> None:
        with open(ziel, "rb") as f:
            daten = f.read()
        self._senden(200, daten, TYPEN.get(os.path.splitext(ziel)[1].lower(), "application/octet-stream"))

    # ---------------------------------------------------------------- POST
    def do_POST(self):
        try:
            self._schutz(True)
            pfad = urlsplit(self.path).path
            if pfad == "/api/variant-branches":
                body = self._body()
                with _schreib_lock:
                    self._einwurf(body)
            elif re.fullmatch(r"/api/variants/" + ID + r"/status", pfad):
                body = self._body(10_000)
                if not isinstance(body, dict) or set(body) != {"status"} or body["status"] not in STATUS:
                    raise Fehler(400, "Unbekannter Status.")
                self._weiter(*self._oben("POST", pfad, body))
            elif pfad == "/api/edges":
                self._kante(self._body(20_000))
            elif pfad == "/api/agents":
                self._ralf(self._body(10_000))
            elif pfad == "/lichtwerk/formen/vorschau":
                self._vorschau(self._body(10_000))
            elif pfad == "/lichtwerk/formen/behalten" and self.behalten:
                body = self._body(10_000)
                with _schreib_lock:
                    self._behalten(body)
            elif pfad == "/werkstatt/standbild" and self.werkstatt:
                self._standbild()
            else:
                raise Fehler(403, "Dieser Weg ist im Lichtwerk nicht vorgesehen.")
        except Fehler as f:
            self._json(f.status, {"satz": f.satz})

    def do_PUT(self):
        self._nicht()

    do_DELETE = do_PATCH = do_PUT

    def _nicht(self):
        self._json(403, {"satz": "Dieser Weg ist im Lichtwerk nicht vorgesehen."})

    def _einwurf(self, body) -> None:
        if not isinstance(body, dict) or not set(body) <= EINWURF_FELDER:
            raise Fehler(400, "Dieser Einwurf hat Teile, die das Lichtwerk nicht schreibt.")
        rid = body.get("request_id")
        if not isinstance(rid, str) or not re.fullmatch(r"lichtwerk-[A-Za-z0-9-]{8,80}", rid):
            raise Fehler(400, "Ein Einwurf braucht seine feste Wiederholungskennung.")
        if rid.startswith("lichtwerk-form-") or str(body.get("notes") or "").lstrip().startswith(FORM_NOTIZ):
            raise Fehler(400, "Formen legt nur der Weg „Behalten“ ab.")
        if not isinstance(body.get("content"), str) or not body["content"].strip():
            raise Fehler(400, "Ein leerer Einwurf wird nicht abgelegt.")
        if self.autorenprofile:
            if not self._ist_autorprofil(body.get("author_id")):
                raise Fehler(403, "Das ausgewählte Urheberprofil ist nicht vorhanden.")
        elif not self._ist_mensch(body.get("author_id")):
            raise Fehler(403, "Das Lichtwerk schreibt nur in Ralfs eigenem Namen.")
        c = body.get("contribution")
        if c is not None and (not isinstance(c, dict) or not set(c) <= {"mode", "seen_variant_ids"}
                              or c.get("mode") not in ("continuation", "review")
                              or not isinstance(c.get("seen_variant_ids", []), list)):
            raise Fehler(400, "Diese Entstehungsangabe schreibt das Lichtwerk nicht.")
        if body.get("worktree_id"):   # der Zweig muss zum ausgewählten Profil gehören
            status, g = self._oben_json("GET", "/api/graph")
            if status != 200 or not isinstance(g, dict):
                raise Fehler(503, "SPiRALCELLS ruht gerade.")
            baum = next((t for t in g.get("worktrees", []) if t.get("id") == body["worktree_id"]), None)
            if not baum or baum.get("author_id") != body["author_id"]:
                raise Fehler(403, "Der Zweig gehört nicht zum ausgewählten Urheberprofil.")
        self._weiter(*self._oben("POST", "/api/variant-branches", body, zeit=15))

    def _kante(self, body) -> None:
        if not isinstance(body, dict) or not set(body) <= KANTEN_FELDER or body.get("edge_type") not in KANTEN:
            raise Fehler(400, "Diese Verbindung kennt das Lichtwerk nicht.")
        if body.get("from_variant_id") == body.get("to_variant_id"):
            raise Fehler(400, "Eine Ausprägung verbindet sich nicht mit sich selbst.")
        if not self._ist_mensch(body.get("author_id")):
            raise Fehler(403, "Das Lichtwerk schreibt nur in Ralfs eigenem Namen.")
        status, g = self._oben_json("GET", "/api/graph")
        if status != 200 or not isinstance(g, dict):
            raise Fehler(503, "SPiRALCELLS ruht gerade.")
        for e in g.get("edges", []):
            if all(e.get(k) == body.get(k) for k in ("edge_type", "from_variant_id", "to_variant_id", "author_id")):
                self._json(200, {**e, "schon_vorhanden": True})
                return
        self._weiter(*self._oben("POST", "/api/edges", body))

    def _ralf(self, body) -> None:
        if not isinstance(body, dict) or body.get("handle") != "Ralf" or body.get("agent_type") != "human" \
                or not set(body) <= {"handle", "agent_type", "description"}:
            raise Fehler(403, "Das Lichtwerk legt nur Ralfs eigenen Eintrag an.")
        status, agents = self._oben_json("GET", "/api/agents")
        if status != 200 or not isinstance(agents, list):
            raise Fehler(503, "SPiRALCELLS ruht gerade.")
        vorhanden = [a for a in agents if a.get("agent_type") == "human"]
        if vorhanden:
            self._json(200, {**vorhanden[0], "schon_vorhanden": True})
            return
        self._weiter(*self._oben("POST", "/api/agents", body))

    # ------------------------------------------------------------- KiNFORMER
    def _kinformer_ruf(self, methode: str, pfad: str, obj=None, zeit: float = 12.0):
        """Vom Server aus und ohne Origin: so lässt der KiNFORMER den Aufruf zu, einen Browser nie."""
        daten = None if obj is None else json.dumps(obj, ensure_ascii=False).encode("utf-8")
        req = urllib.request.Request(self.kinformer + pfad, data=daten, method=methode,
                                     headers={"Content-Type": "application/json", "Accept": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=zeit) as r:
                status, roh = r.status, r.read()
        except urllib.error.HTTPError as e:
            status, roh = e.code, e.read()
        except (urllib.error.URLError, socket.timeout, ConnectionError, OSError):
            raise Fehler(503, "Der KiNFORMER ruht gerade. Formen geht, sobald er wach ist.")
        try:
            return status, json.loads(roh.decode("utf-8") or "null")
        except (UnicodeDecodeError, json.JSONDecodeError):
            return status, None

    def _richtungen(self) -> list:
        """Nur, was der KiNFORMER gerade meldet; kurz gemerkt."""
        with _formen_lock:
            if _formen["richtungen"] is not None and time.time() - _formen["t"] < 60:
                return _formen["richtungen"]
        status, d = self._kinformer_ruf("GET", "/api/formen/richtungen", zeit=4)
        if status != 200 or not isinstance(d, dict) or not isinstance(d.get("richtungen"), list):
            raise Fehler(503, "Der KiNFORMER ruht gerade. Formen geht, sobald er wach ist.")
        liste = [{"key": r["key"], "name": kurz(r.get("name") or r["key"], 40),
                  "satz": FAECHER.get(r["key"]) or kurz(r.get("satz") or "", 120), "kommt": bool(r.get("kommt"))}
                 for r in d["richtungen"] if isinstance(r, dict) and re.fullmatch(r"[a-z]{1,24}", str(r.get("key", "")))]
        with _formen_lock:
            _formen.update(t=time.time(), richtungen=liste)
        return liste

    def _ausformen(self, titel: str, text: str, richtung: str) -> dict:
        """Gleicher Stoff ergibt beim KiNFORMER immer dieselbe Form; das Ergebnis wird darum kurz gemerkt."""
        schluessel = hashlib.sha256(json.dumps([titel, text, richtung], ensure_ascii=False).encode("utf-8")).hexdigest()
        with _formen_lock:
            if schluessel in _formen["ergebnisse"]:
                return _formen["ergebnisse"][schluessel]
        status, d = self._kinformer_ruf("POST", "/api/formen/ausformen", {"titel": titel, "text": text, "richtung": richtung})
        if status != 200 or not isinstance(d, dict) or not isinstance(d.get("html"), str):
            raise Fehler(502, "Der KiNFORMER hat diese Form gerade nicht gesetzt.")
        with _formen_lock:
            e = _formen["ergebnisse"]
            if len(e) >= 48:
                e.pop(next(iter(e)))
            e[schluessel] = d
        return d

    def _formquelle(self, body) -> dict:
        """Ausprägung und Richtung prüfen; den Text holt der Server selbst aus dem Graphen."""
        if not isinstance(body, dict) or set(body) != {"auspraegung", "richtung"} \
                or not isinstance(body["auspraegung"], str) or not re.fullmatch(ID, body["auspraegung"]) \
                or not isinstance(body["richtung"], str):
            raise Fehler(400, "Formen braucht eine Ausprägung und eine Richtung.")
        r = next((r for r in self._richtungen() if r["key"] == body["richtung"]), None)
        if not r or r["kommt"]:
            raise Fehler(400, "Diese Form gibt es gerade nicht.")
        status, g = self._oben_json("GET", "/api/graph")
        if status != 200 or not isinstance(g, dict):
            raise Fehler(503, "SPiRALCELLS ruht gerade.")
        v = next((x for x in g.get("variants", []) if x.get("id") == body["auspraegung"]), None)
        if not v:
            raise Fehler(404, "Diese Ausprägung ist gerade nicht da.")
        original = original_einer_form(g, v)   # an einem Form-Korn formt „Formen“ immer das Original
        if original:
            v = next((x for x in g.get("variants", []) if x.get("id") == original), None)
            if not v:
                raise Fehler(404, "Das Original dieser Form ist gerade nicht da.")
        baum = next((t for t in g.get("worktrees", []) if t.get("id") == v.get("worktree_id")), {})
        werk = next((w for w in g.get("works", []) if w.get("id") == baum.get("work_id")), {})
        inhalt = v.get("content") or ""
        text = fuer_formen(inhalt, r["key"])
        satz = None
        if ist_app_zustand(inhalt):
            satz = "Das ist ein gespeicherter App-Zustand. Formen gibt es für Texte."
        elif werk.get("work_type") != "text":
            satz = "Das gehört zu einer App. Formen gibt es für Texte."
        elif not text:
            satz = "Diese Ausprägung hat keinen Text zum Formen."
        elif len(text) > FORM_GRENZE:
            satz = "Dieser Text ist länger als 100.000 Zeichen. Formen geht bis dahin; still gekürzt wird nichts."
        titel = kurz(v.get("label") or werk.get("title") or "Unbenannte Ausprägung", 200)
        return {"v": v, "werk": werk, "graph": g, "richtung": r, "text": text, "titel": titel, "satz": satz,
                "ersetzt": menschlich(inhalt) != inhalt}

    def _form(self, q: dict) -> dict:
        """Formen mit ehrlichem Herkunftssatz (B2). Sagt der KiNFORMER selbst, was blieb (Feld `blieb`, seit dem
        20.10. abends), gilt sein Satz; ein älterer KiNFORMER bekommt den Satz vom Lichtwerk. Beide Wege setzen den
        Absatz gleich, so ergibt derselbe Stoff dieselbe Seite, vor und nach einem Neustart des KiNFORMER."""
        richtung, titel, text = q["richtung"]["key"], q["titel"], q["text"]
        e = self._ausformen(titel, text, richtung)
        if isinstance(e.get("blieb"), str) and e["blieb"].strip():
            blieb = re.sub(r"\s+", " ", e["blieb"]).strip()
        else:
            n = None
            if richtung in ("plakat", "lesetuch", "karten"):   # die Satzzahl liefert der KiNFORMER selbst
                quelle = self._ausformen(titel, text, "lesetuch") if richtung == "plakat" else e
                m = re.match(r"(\d+) (?:Sätze|Karten)", str(quelle.get("satz", "")))
                n = int(m.group(1)) if m else None
            blieb = was_blieb(richtung, e, n, text)
        name = kurz(e.get("name") or q["richtung"]["name"], 40)
        herkunft = "Geformt von KiNFORMER als %s aus „%s“. %s" % (name, titel, blieb)
        ehrlich = len(HERKUNFT.findall(e["html"])) == 1 and e["html"].lstrip().lower().startswith("<!doctype html>") \
            and len(e["html"]) <= 2_000_000
        # Escapen wie der KiNFORMER selbst (html.escape mit Anführungszeichen): bei ihm ändert das kein Zeichen
        seite = HERKUNFT.sub(lambda _m: '<p class="herkunft">%s</p>' % html.escape(herkunft), e["html"]) \
            if ehrlich else e["html"]
        if not ehrlich:
            blieb = "Diese Form bleibt eine Vorschau: ihr Herkunftssatz ließ sich nicht ehrlich setzen."
        return {"geht": True, "richtung": richtung, "name": name, "titel": kurz(e.get("titel") or name, 220),
                "satz": blieb, "herkunft": herkunft, "html": seite, "ehrlich": ehrlich, "ersetzt": q["ersetzt"],
                "behalten": bool(self.behalten and ehrlich)}

    def _vorschau(self, body) -> None:
        """Formen ansehen: liest den Graphen, ruft den KiNFORMER, schreibt nichts."""
        q = self._formquelle(body)
        if q["satz"]:
            self._json(200, {"geht": False, "satz": q["satz"]})
            return
        self._json(200, self._form(q))

    def _behalten(self, body) -> None:
        """Ralfs Halten auf „Behalten“ (B3): erst nachsehen, dann die Form in Ralfs Zweig, dann der Faden.
        Kein source_variant_id und keine source_variant_ids: das erste zöge „erweitert“ nach sich, das zweite
        „remixt-aus“, und SPiRALCELLS zählte die Form als Wiederverwendung."""
        q = self._formquelle(body)
        if q["satz"]:
            raise Fehler(422, q["satz"])
        f = self._form(q)
        if not f["ehrlich"]:
            raise Fehler(409, f["satz"])
        g, original, werk_id = q["graph"], q["v"], q["werk"].get("id")
        ralf = next((a for a in g.get("agents", []) if a.get("agent_type") == "human" and a.get("handle") == "Ralf"), None)
        if not ralf:
            raise Fehler(409, "Für dich gibt es in SPiRALCELLS noch keinen eigenen Eintrag.")
        baeume = [t for t in g.get("worktrees", []) if t.get("work_id") == werk_id]
        im_werk = {t.get("id") for t in baeume}
        inhalt = f["html"]
        # Erst nachsehen: liegt genau diese Form schon in Ralfs Zweig dieses Monds, auch wenn er sich seitdem bewegt hat?
        schon = next((v for v in g.get("variants", []) if v.get("worktree_id") in im_werk
                      and v.get("author_id") == ralf["id"] and v.get("content") == inhalt), None)
        if schon:
            neu = schon["id"]
        else:
            notiz = "%s · %s. %s%s" % (FORM_NOTIZ, f["name"], f["satz"],
                                       " Kennungen wie in der Lesefläche ersetzt." if f["ersetzt"] else "")
            rid = "lichtwerk-form-" + hashlib.sha256(
                "\n".join([original["id"], f["richtung"], inhalt]).encode("utf-8")).hexdigest()[:48]
            koerper = {"work_id": werk_id, "request_id": rid, "label": kurz(f["titel"], 200), "content": inhalt,
                       "notes": notiz, "author_id": ralf["id"]}
            eigene = sorted((t for t in baeume if t.get("author_id") == ralf["id"]), key=lambda t: t.get("created_at") or "")
            if eigene:   # Weiterarbeit in Ralfs Zweig, das Original als gesehen
                baum = eigene[-1]
                fs = sorted((v for v in g.get("variants", []) if v.get("worktree_id") == baum.get("id")),
                            key=lambda v: v.get("created_at") or "")
                koerper.update(worktree_id=baum["id"], contribution={"mode": "continuation", "seen_variant_ids": [original["id"]]})
                if fs:
                    koerper["derived_from"] = fs[-1]["id"]
            else:        # ohne Quelle verlangt SPiRALCELLS die Angabe der Entstehung
                koerper.update(new_worktree=True, contribution={"mode": "review", "seen_variant_ids": [original["id"]]})
            try:
                status, roh = self._oben("POST", "/api/variant-branches", koerper, zeit=15)
            except Fehler:
                raise Fehler(503, UNKLAR)
            try:
                antwort = json.loads(roh.decode("utf-8") or "null")
            except (UnicodeDecodeError, json.JSONDecodeError):
                antwort = None
            if status not in (200, 201) or not isinstance(antwort, dict) or not (antwort.get("variant") or {}).get("id"):
                raise Fehler(502 if status >= 500 else 422, "SPiRALCELLS hat die Form nicht angenommen. Nichts behalten.")
            neu = antwort["variant"]["id"]
        # Der Faden: „verweist auf“ das Original, in Ralfs Namen, ohne Dopplung; fehlt er nach einem Abbruch, kommt er jetzt
        faden = any(e.get("edge_type") == "verweist-auf" and e.get("from_variant_id") == neu
                    and e.get("to_variant_id") == original["id"] and e.get("author_id") == ralf["id"] for e in g.get("edges", []))
        if not faden:
            try:
                status, _ = self._oben_json("POST", "/api/edges", {"edge_type": "verweist-auf", "from_variant_id": neu,
                                                               "to_variant_id": original["id"], "author_id": ralf["id"],
                                                               "note": "Form ohne Modell, von Ralf behalten."})
            except Fehler:
                raise Fehler(503, "Die Form liegt; ob der Faden zum Original angekommen ist, ist unklar. Noch einmal halten zieht ihn nach.")
            if status not in (200, 201):
                raise Fehler(502, "Die Form liegt, der Faden zum Original fehlt noch. Noch einmal halten zieht ihn nach.")
        self._json(200 if schon else 201, {"behalten": True, "schon": bool(schon), "faden_neu": not faden})

    # ------------------------------------------------------- Links und Neues
    def _graph(self) -> dict:
        status, g = self._oben_json("GET", "/api/graph")
        if status != 200 or not isinstance(g, dict):
            raise Fehler(503, "SPiRALCELLS ruht gerade.")
        return g

    def _monde(self) -> list:
        """Lesbare Namen und Titel aller Monde, für Links ohne Kennung (Sternwerft, KiN OS)."""
        g = self._graph()
        namen = mond_namen(g.get("works", []))
        return [{"name": namen[w.get("id")], "titel": kurz(w.get("title") or "Unbenannter Mond", 200)} for w in g.get("works", [])]

    def _neu(self, seit_roh: str) -> None:
        """Was seit `seit` (Millisekunden oder ISO-Zeit, UTC) eingetragen wurde, als ein Satz und Zahlen."""
        seit = None
        if re.fullmatch(r"\d{10,16}", seit_roh or ""):
            seit = float(seit_roh)
        elif seit_roh:
            seit = _ms(seit_roh) or None
        if seit_roh and seit is None:
            raise Fehler(400, "Diesen Zeitpunkt kann das Lichtwerk nicht lesen.")
        g = self._graph()
        z = neu_seit(g, seit) if seit else {"zahl": 0, "stimmen": [], "uebernahmen": 0, "faeden": 0, "befunde": 0, "monde": 0, "juengster": None}
        juengster = z.pop("juengster")
        zuletzt = zuletzt_eintraege(g)   # immer dabei, auch wenn seitdem nichts kam: der Leistenpunkt ist nie leer
        self._json(200, {"satz": satz_aus(z), **z, "mond": mond_namen(g.get("works", [])).get(juengster) if juengster else None,
                         "zuletzt": zuletzt, "zuletzt_satz": zuletzt_satz(zuletzt[0] if zuletzt else None)})

    def _standbild(self) -> None:
        name = parse_qs(urlsplit(self.path).query).get("name", [""])[0]
        if not re.fullmatch(r"[a-z0-9-]{1,60}", name):
            raise Fehler(400, "Ungültiger Bildname.")
        body = self._body(40_000_000)
        m = re.fullmatch(r"data:image/(png|jpeg);base64,([A-Za-z0-9+/=]+)", body.get("bild", "") if isinstance(body, dict) else "")
        if not m:
            raise Fehler(400, "Kein Bild.")
        os.makedirs(STANDBILDER, exist_ok=True)
        ziel = os.path.join(STANDBILDER, "%s.%s" % (name, "png" if m.group(1) == "png" else "jpg"))
        with open(ziel, "wb") as f:
            f.write(base64.b64decode(m.group(2)))
        self._json(201, {"gespeichert": os.path.basename(ziel)})


class Leseeingang(Lichtwerk):
    """Zweiter Eingang im selben Prozess, der nur liest (Bauplan B1).

    Jede Seite, die ein Eingang ausliefert, darf dort schreiben, denn _schutz vergleicht nur
    Host, Port und Origin. Darum laufen Skizzen und Werkraum im Betrieb hier, wo es keinen
    Schreibweg gibt. Eine eigene Klasse, weil _eigene_adresse mit dem Klassenattribut port
    vergleicht: ein geteilter Handler wiese alles ab oder bräche das Schreiben auf 8411.
    """
    port = 8420
    schreibport = 8411          # wohin "/" führt: ins Lichtwerk selbst
    werkstatt = False
    autorenprofile = False
    behalten = False
    leseeingang = None
    DURCH = {"/api/graph", "/api/agents", "/lichtwerk/graph", "/lichtwerk/stand", "/lichtwerk/monde", "/lichtwerk/neu", "/lichtwerk/ordnung"}
    SATZ = "Hier wird nur gelesen. Schreiben geht im Lichtwerk selbst, mit Halten."

    def do_GET(self):
        try:
            self._schutz(False)
            teile = urlsplit(self.path)
            pfad = teile.path
            if not pfad.startswith("/"):
                raise Fehler(404, "Hier liegt nichts.")
            if pfad in ("/", "/index.html"):
                self._umleiten("http://127.0.0.1:%d/" % self.schreibport)
            elif pfad == "/api/health":
                status, roh = self._oben("GET", pfad)
                if status != 200:
                    self._weiter(status, roh)
                    return
                try:
                    health = json.loads(roh)
                except (UnicodeDecodeError, json.JSONDecodeError):
                    raise Fehler(503, "SPiRALCELLS ruht gerade.")
                if not isinstance(health, dict):
                    raise Fehler(503, "SPiRALCELLS ruht gerade.")
                self._json(200, {**health, "lichtwerk": {
                    "capabilities": {"authorSelection": False, "schreiben": False},
                    "eingang": "nur lesen",
                }})
            elif pfad in self.DURCH:
                Lichtwerk.do_GET(self)
            elif pfad.startswith(("/api/", "/lichtwerk/", "/werkstatt/")):
                raise Fehler(404, "Hier wird nur gelesen.")
            elif pfad == SKIZZEN_WEG.rstrip("/"):
                self._umleiten(SKIZZEN_WEG)
            elif pfad.startswith(SKIZZEN_WEG):
                name = pfad[len(SKIZZEN_WEG):] or "index.html"   # nur die Dateien oben im Ordner, keine Prüfordner
                if not re.fullmatch(r"[A-Za-z0-9_-]{1,80}\.(html|js|css|svg|png|jpg)", name):
                    raise Fehler(404, "Hier liegt nichts.")
                ziel = os.path.realpath(os.path.join(SKIZZEN, name))
                if not ziel.startswith(os.path.realpath(SKIZZEN) + os.sep) or not os.path.isfile(ziel):
                    raise Fehler(404, "Hier liegt nichts.")
                self._datei(ziel)
            else:
                ziel = os.path.realpath(os.path.join(APP, pfad.lstrip("/")))
                if not ziel.startswith(os.path.realpath(APP) + os.sep) or not os.path.isfile(ziel):
                    raise Fehler(404, "Hier liegt nichts.")
                self._datei(ziel)
        except Fehler as f:
            self._json(f.status, {"satz": f.satz})

    def do_POST(self):
        self._json(403, {"satz": self.SATZ})

    do_PUT = do_DELETE = do_PATCH = do_POST


def main(argv=None):
    p = argparse.ArgumentParser(description="SPiRALCELLS-Lichtwerk")
    p.add_argument("--port", type=int, default=8411)
    p.add_argument("--spiralcells", default="http://127.0.0.1:8401")
    p.add_argument("--werkstatt", action="store_true", help="Standbilder aus dem Browser speichern erlauben")
    p.add_argument("--autorenprofile", action="store_true",
                   help="Fassungen unter vorhandenen Urheberprofilen ablegen erlauben; keine Modellaufrufe")
    p.add_argument("--kinformer", default="http://127.0.0.1:9062", help="Formwerkstatt; Tests geben einen Stellvertreter an")
    p.add_argument("--behalten", action="store_true", help="Formen behalten erlauben (erst nach der Prüfung an der Testkette)")
    p.add_argument("--leseeingang", type=int, default=None,
                   help="zweiter Port, der nur liest; Skizzen und Werkraum laufen dann dort")
    a = p.parse_args(argv)
    verbund = (8894, 8895, 9062, 9040, 9030, 9031, 9084, 8401, 8400)
    if a.port in verbund or a.leseeingang in verbund:
        sys.exit("Dieser Port gehört einem anderen Teil des Verbunds.")
    if a.leseeingang is not None and a.leseeingang == a.port:
        sys.exit("Der Leseeingang braucht einen eigenen Port.")
    Lichtwerk.upstream, Lichtwerk.port, Lichtwerk.werkstatt = a.spiralcells.rstrip("/"), a.port, a.werkstatt
    Lichtwerk.autorenprofile = a.autorenprofile
    Lichtwerk.leseeingang = a.leseeingang
    Lichtwerk.kinformer = a.kinformer.rstrip("/")
    Lichtwerk.behalten = a.behalten
    srv = ThreadingHTTPServer(("127.0.0.1", a.port), Lichtwerk)
    srv.daemon_threads = True
    if a.leseeingang is not None:
        Leseeingang.port, Leseeingang.schreibport = a.leseeingang, a.port
        lese = ThreadingHTTPServer(("127.0.0.1", a.leseeingang), Leseeingang)
        lese.daemon_threads = True
        threading.Thread(target=lese.serve_forever, name="leseeingang", daemon=True).start()
    print("SPiRALCELLS-Lichtwerk auf http://127.0.0.1:%d  ·  SPiRALCELLS: %s%s%s"
          % (a.port, Lichtwerk.upstream, "  ·  Werkstatt an" if a.werkstatt else "",
             "  ·  nur lesend auf %d" % a.leseeingang if a.leseeingang is not None else ""), flush=True)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()

"""Lesendes Organ „SPiRALCELLS“ für den KiN-OS-Fork der Zentrale (Vorlage aus dem Lichtwerk, 20.10.2026).

Gehört in den Fork als Leser in `read_organ` (aios_organs.py), etwa `"spiralcells": lambda: read_spiralcells(seit)`.
Es liest nur, vom Server des Forks aus, nie aus dem Browser (die CSP des Lichtwerks erlaubt nur 'self'):

    GET <Lichtwerk>/lichtwerk/neu?seit=<ms>   ein Satz und Zahlen zu den Ankünften (Zeiten als UTC verglichen)

`seit` ist der Zeitpunkt „zuletzt in KiN OS“, den der Browser des Forks sich merkt (nur den Zeitpunkt). Nennt der Satz
eine Ankunft, führt der Link in den Mond der jüngsten Ankunft, mit `von=kinos`; sonst ins Netz. Ist seitdem nichts
gekommen oder fehlt `seit`, steht der jüngste Eintrag da (`zuletzt_satz`): Der Punkt ist nie leer (Ralf, 20.10.).
Keine Kennung in Satz oder Link. Ruht das Lichtwerk, ein ruhiger Satz.
"""
from __future__ import annotations

import json
import os
import re
import urllib.error
import urllib.request

LICHTWERK = os.environ.get("KINOS_LICHTWERK", "http://127.0.0.1:8411").rstrip("/")
NAME = re.compile(r"[a-z0-9-]{1,90}")


def _lies(pfad: str, zeit: float = 3.0):
    req = urllib.request.Request(LICHTWERK + pfad, headers={"Accept": "application/json"}, method="GET")
    with urllib.request.urlopen(req, timeout=zeit) as antwort:
        return json.loads(antwort.read().decode("utf-8"))


def read_spiralcells(seit: float | None = None) -> dict:
    netz = LICHTWERK + "/#von=kinos"
    try:
        d = _lies("/lichtwerk/neu" + ("?seit=%d" % int(seit) if seit else ""))
    except (urllib.error.URLError, OSError, ValueError):
        return {"key": "spiralcells", "status": "ruht", "satz": "SPiRALCELLS ruht gerade.", "link": netz, "zahl": 0}
    zahl = int(d.get("zahl") or 0) if seit else 0
    zuletzt = str(d.get("zuletzt_satz") or "").strip()
    satz = str(d.get("satz") or "SPiRALCELLS") if zahl else zuletzt or (str(d.get("satz") or "") if seit else "") or "SPiRALCELLS"
    mond = d.get("mond")
    link = LICHTWERK + "/#mond=%s&von=kinos" % mond if zahl and isinstance(mond, str) and NAME.fullmatch(mond) else netz
    return {"key": "spiralcells", "status": "ready", "satz": satz, "link": link, "zahl": zahl}

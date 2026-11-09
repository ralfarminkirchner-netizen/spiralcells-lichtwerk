"""Welche App im Spiralbaum sich öffnen lässt (Ralf, 09.11.2026: „Adressen für mehr Apps“).

    /usr/bin/python3 -I werkzeuge/stufen-apps.py <graph.json oder http://…/api/graph> [--ohne-pruefung]

Eine App bekommt eine Adresse nur mit Beleg. Zwei Belege gelten:
  1. Code: Die Fassungen der App lesen Dateien aus einer Arbeitskopie (moonfingers.app-source.v1, „locator“). Deren
     GitHub-Repo ist dasselbe, aus dem ein Railway-Dienst baut oder aus dem GitHub Pages veröffentlicht.
  2. Name: Der Name der App ist buchstabengleich (ohne Groß/klein, Leer- und Satzzeichen) mit einem Railway-Dienst,
     einem Railway-Projekt oder einer schon belegten Adresse (app/stufen-apps.json, Spalte „auch“ eingeschlossen).
Ein bloß ähnlicher Name ist kein Beleg. Quellen: Railway (über die angemeldete railway-CLI, nur lesen), GitHub
(über gh, nur lesen), die vorhandene Momentaufnahme. Jede gewählte Adresse wird einmal angefragt (GET, 12 s):
Status und ob Einbetten erlaubt ist. Geschrieben wird app/stufen-apps.json; die Werk-Kennung bleibt in den Daten.
"""
import json
import os
import re
import ssl
import subprocess
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

HIER = Path(__file__).resolve().parent.parent
ZIEL = HIER / "app" / "stufen-apps.json"
KONTO = "ralfarminkirchner-netizen"
PRUEFEN = "--ohne-pruefung" not in sys.argv
norm = lambda s: re.sub(r"[^a-z0-9äöüß]", "", str(s or "").lower())


def lade_graph(quelle):
    if quelle.startswith("http"):
        with urllib.request.urlopen(quelle, timeout=60) as r:
            return json.load(r)
    with open(quelle, encoding="utf-8") as f:
        return json.load(f)


def railway():
    tok = json.load(open(os.path.expanduser("~/.railway/config.json")))["user"]["accessToken"]
    def gq(q, v=None):
        req = urllib.request.Request("https://backboard.railway.com/graphql/v2", data=json.dumps({"query": q, "variables": v or {}}).encode(),
                                     headers={"Authorization": "Bearer " + tok, "Content-Type": "application/json", "User-Agent": "lichtwerk-spiralbaum"})
        with urllib.request.urlopen(req, timeout=40) as r:
            return json.load(r)
    aus = []
    for ws in gq("query { me { workspaces { id } } }")["data"]["me"]["workspaces"]:
        d = gq("""query($w:String){ projects(first:100, workspaceId:$w) { edges { node { name services { edges { node { name serviceInstances { edges { node {
              rootDirectory source { repo } domains { serviceDomains { domain } customDomains { domain } } latestDeployment { status } } } } } } } } } } }""", {"w": ws["id"]})
        for p in (d.get("data") or {}).get("projects", {}).get("edges", []):
            p = p["node"]
            for s in p["services"]["edges"]:
                s = s["node"]
                for i in s["serviceInstances"]["edges"]:
                    i = i["node"]
                    doms = [x["domain"] for x in i["domains"]["customDomains"]] + [x["domain"] for x in i["domains"]["serviceDomains"]]
                    for dm in doms:
                        aus.append({"projekt": p["name"], "dienst": s["name"], "repo": ((i.get("source") or {}).get("repo") or "").lower(), "wurzel": (i.get("rootDirectory") or "").strip("/"),
                                    "url": f"https://{dm}/", "erfolg": (i.get("latestDeployment") or {}).get("status") == "SUCCESS"})
    return aus


def pages():
    r = subprocess.run(["gh", "api", "--paginate", f"users/{KONTO}/repos?per_page=100", "--jq", ".[] | select(.has_pages) | .name"],
                       capture_output=True, text=True, timeout=120)
    return {f"{KONTO}/{n}".lower(): f"https://{KONTO}.github.io/{n}/" for n in r.stdout.split()}


def repos_der_werke(g):
    zweig = {t["id"]: t["work_id"] for t in g.get("worktrees", [])}
    je, remote, ordner = {}, {}, {}
    for v in g.get("variants", []):
        t = (v.get("content") or "").strip()
        if not t.startswith("{"):
            continue
        try:
            j = json.loads(t)
        except ValueError:
            continue
        for s in j.get("sections", []) if isinstance(j, dict) else []:
            d = os.path.dirname(str(s.get("locator") or ""))
            while d not in ("/", "") and not os.path.exists(os.path.join(d, ".git")):
                d = os.path.dirname(d)
            if d in ("/", ""):
                continue
            if d not in remote:
                u = subprocess.run(["git", "-C", d, "remote", "get-url", "origin"], capture_output=True, text=True).stdout.strip()
                m = re.search(r"github\.com[/:]([^/]+)/([^/]+?)(?:\.git)?$", u)
                remote[d] = f"{m.group(1)}/{m.group(2)}".lower() if m else None
            if remote[d]:
                w = zweig.get(v.get("worktree_id"))
                je.setdefault(w, set()).add(remote[d])
                rel = os.path.relpath(os.path.dirname(str(s.get("locator"))), d)
                ordner.setdefault((w, remote[d]), set()).add("" if rel == "." else rel)
    return je, ordner


def pruefe(url):
    ctx = ssl.create_default_context()
    t0 = time.time()
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "lichtwerk-spiralbaum"})
        with urllib.request.urlopen(req, timeout=12, context=ctx) as r:
            xfo = (r.headers.get("X-Frame-Options") or "").lower()
            csp = (r.headers.get("Content-Security-Policy") or "").lower()
            fa = re.search(r"frame-ancestors([^;]*)", csp)
            ein = not xfo and (not fa or "*" in fa.group(1) or "http:" in fa.group(1))
            return {"status": r.status, "einbetten": ein, "ms": int((time.time() - t0) * 1000)}
    except urllib.error.HTTPError as e:
        return {"status": e.code, "einbetten": False}
    except Exception:
        return {"status": None, "einbetten": False}


def main():
    g = lade_graph(sys.argv[1])
    alt = json.load(open(ZIEL, encoding="utf-8")) if ZIEL.exists() else {"apps": []}
    bekannt = [a for a in alt.get("apps", []) if a.get("quelle", "").split(" · ")[0] != "Railway-Konto"] if "werke" not in alt else alt.get("bekannt", [])
    rw, pg, (rep, ordner) = railway(), pages(), repos_der_werke(g)
    # Kandidaten: (url, quelle, namen, repo)
    kand = [{"url": r["url"], "quelle": f"Railway-Konto · {r['projekt']} · {r['dienst']}", "namen": {norm(r["dienst"]), norm(r["projekt"])}, "repo": r["repo"], "wurzel": r["wurzel"], "gut": r["erfolg"]} for r in rw]
    kand += [{"url": u, "quelle": f"GitHub Pages · {rp}", "namen": {norm(rp.split('/')[1])}, "repo": rp, "gut": True} for rp, u in pg.items()]
    kand += [{"url": a["url"], "quelle": a.get("quelle", ""), "namen": {norm(a["name"]), *map(norm, a.get("auch", []))}, "repo": "", "gut": True} for a in bekannt]
    # ein Repo, hinter dem Apps verschiedenen Namens stehen (ein Sammelrepo), belegt keine bestimmte App
    W = {w["id"]: w for w in g.get("works", [])}
    stamm = lambda wid: norm(str((W.get(wid) or {}).get("title") or "").split(" · ")[0])
    je_repo = {}
    for wid, rs in rep.items():
        for r in rs:
            je_repo.setdefault(r, set()).add(stamm(wid))
    # … außer der Dienst baut aus einem Unterordner, und die Fassungen der App lesen genau dort (Railway „rootDirectory“)
    im_ordner = lambda wid, k: bool(k.get("wurzel")) and any(o == k["wurzel"] or o.startswith(k["wurzel"] + "/") for o in ordner.get((wid, k["repo"]), ()))
    eindeutig = {wid: {r for r in rs if len(je_repo[r]) == 1} for wid, rs in rep.items()}
    werke = []
    for w in g.get("works", []):
        # nur Apps und ihre Dächer; ein Text über eine App ist nicht die App
        if str(w.get("work_type") or "").lower() not in ("app", "app-variante", "app-development", "oberdach", "bereich", "tragwerk", "sammlung"):
            continue
        n, wr = norm(w.get("title")), rep.get(w["id"], set())
        treffer = [(k, "Code") for k in kand if k["repo"] and k["repo"] in wr and (im_ordner(w["id"], k) or (not k.get("wurzel") and k["repo"] in eindeutig.get(w["id"], set())))]
        treffer += [(k, "Name") for k in kand if n and n in k["namen"]]
        if not treffer:
            continue
        # vorne: Beleg über den Code, dann ein erfolgreicher Stand, dann der Dienst, der wie sein Projekt heißt, dann die kürzeste Adresse
        treffer.sort(key=lambda t: (t[1] != "Code", not t[0]["gut"], len(t[0]["namen"]) > 1, len(t[0]["url"])))
        k, beleg = treffer[0]
        weitere = sorted({t[0]["url"] for t in treffer} - {k["url"]})
        werke.append({"werk": w["id"], "name": w.get("title"), "url": k["url"], "quelle": k["quelle"], "beleg": beleg, "weitere": weitere})
    if PRUEFEN:
        with ThreadPoolExecutor(12) as ex:
            for w, p in zip(werke, ex.map(lambda w: pruefe(w["url"]), werke)):
                w.update(p, am=time.strftime("%Y-%m-%dT%H:%M:%S%z"))
    aus = {"stand": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
           "satz": "Adressen der Apps im Spiralbaum, je mit Beleg (Code oder gleicher Name) und Quelle; einmal angefragt zur angegebenen Zeit.",
           "werke": werke, "bekannt": bekannt}
    ZIEL.write_text(json.dumps(aus, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{len(werke)} Werke mit Adresse, davon Beleg Code {sum(w['beleg'] == 'Code' for w in werke)}, "
          f"erreichbar {sum(w.get('status') == 200 for w in werke)}, einbettbar {sum(bool(w.get('einbetten')) for w in werke)}")


if __name__ == "__main__":
    main()

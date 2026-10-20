# Wunsch an Codex: den mooncells-Stand sichern

Von Claude (Lichtwerk-Spur), 20.10.2026. Nur ein Wunsch, kein Auftrag. Entscheiden wird Ralf.

## Befund (gelesen um 20:56, nichts verändert)

- Zweig `codex/mooncells-worktrees-lesbar-20261012` in `/Volumes/ThunderBolt4_2TB/Development/Projects/mooncells`.
- `git diff --stat`: 5 Dateien geändert, 1.073 Zeilen dazu (vor allem `server/store.py` mit 577 Zeilen),
  dazu 14 unversionierte Dateien (darunter `server/static/workspace.js`, `spiral-room.*` und neun Testdateien).
- Die Rückmeldung `runde2` aus dem gemeinsamen Auftrag fehlt noch.

## Wunsch

1. Den Zweig einchecken (mit Ralfs Wort), damit der Stand, gegen den Lichtwerk, Werkraum und KiN-Brücke laufen,
   wiederherstellbar ist.
2. `runde2` nachliefern.
3. **Form-Körner in der Materialansicht von 8401 als Seite zeigen**, nicht als Rohtext: Ihr Inhalt ist eine fertige
   HTML-Seite ohne Skripte. Bitte in einer abgeschlossenen Fläche (`iframe` mit `srcdoc` und `sandbox` ohne
   `allow-scripts`), nie mit `innerHTML`. Erkennen lassen sie sich an der Notiz „Form ohne Modell · KiNFORMER“,
   Urheber Ralf, Seitenanfang `<!doctype html>` und dem Faden `verweist-auf` zum Original.

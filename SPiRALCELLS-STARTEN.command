#!/bin/zsh
# SPiRALCELLS · Lichtwerk starten.
# Weckt SPiRALCELLS (mooncells, 127.0.0.1:8401), falls es ruht – vorher wird state.json gesichert –,
# startet das Lichtwerk (127.0.0.1:8411) und öffnet es im Browser. Beendet nichts, kostet nichts.

HIER="${0:A:h}"
MOONCELLS="/Volumes/ThunderBolt4_2TB/Development/Projects/mooncells"
DATEN="/Volumes/ThunderBolt4_2TB/Development/AppData/mooncells/state.json"
PY="/usr/bin/python3"
ADRESSE="http://127.0.0.1:8411/"
cd "$HIER" || exit 1
mkdir -p "$HIER/sicherung" "$HIER/protokolle"

echo ""
echo "  SPiRALCELLS · Lichtwerk"
echo ""

if [[ ! -d /Volumes/ThunderBolt4_2TB/Development ]]; then
  echo "  Die Thunderbolt-Platte ist nicht da. Bitte anschließen und noch einmal öffnen."
  read -k1 "?  Taste drücken zum Schließen." ; exit 1
fi

if [[ -x "$HOME/.config/external-development/bin/extern-dev" ]]; then
  STAND="$("$HOME/.config/external-development/bin/extern-dev" status 2>/dev/null)"
  if print -r -- "$STAND" | grep -q "gesperrt"; then
    echo "  Der Speicherschutz meldet gerade erhöhten Speicherdruck:"
    print -r -- "$STAND" | sed 's/^/    /'
    echo ""
    read -k1 "?  Trotzdem starten? Das Lichtwerk braucht nur wenig Speicher. (j/n) " ANTWORT; echo ""
    [[ "$ANTWORT" == [jJyY] ]] || { echo "  Nichts gestartet."; sleep 2; exit 0; }
  fi
fi

lebt() { curl -s -m 1 -o /dev/null -w "%{http_code}" "$1" 2>/dev/null | grep -q "^[234]"; }
belegt() { lsof -nP -iTCP:$1 -sTCP:LISTEN >/dev/null 2>&1; }

# 1 · SPiRALCELLS (8401)
if lebt "http://127.0.0.1:8401/api/health"; then
  echo "  SPiRALCELLS ist wach."
elif belegt 8401; then
  echo "  Auf 8401 läuft etwas anderes als SPiRALCELLS. Ich starte nichts darüber."
  read -k1 "?  Taste drücken zum Schließen." ; exit 1
else
  if [[ -f "$DATEN" ]]; then
    ZIEL="$HIER/sicherung/state-$(date +%Y%m%d-%H%M%S).json"
    cp -p "$DATEN" "$ZIEL" && echo "  Bestand gesichert: sicherung/${ZIEL:t}"
  fi
  echo "  Wecke SPiRALCELLS …"
  ( cd "$MOONCELLS" && PYTHONDONTWRITEBYTECODE=1 nohup "$PY" -m server.app --host 127.0.0.1 --port 8401 --data "$DATEN" \
      > "$HIER/protokolle/spiralcells-8401.log" 2>&1 & echo $! > "$HIER/protokolle/spiralcells-8401.pid" )
  for i in {1..40}; do lebt "http://127.0.0.1:8401/api/health" && break; sleep 0.25; done
  lebt "http://127.0.0.1:8401/api/health" && echo "  SPiRALCELLS ist wach." || echo "  SPiRALCELLS antwortet noch nicht. Das Lichtwerk zeigt dann ein ruhendes Bild und wartet."
fi

# 2 · Lichtwerk (8411)
if lebt "$ADRESSE"; then
  echo "  Das Lichtwerk läuft schon."
elif belegt 8411; then
  echo "  Auf 8411 läuft etwas anderes. Ich starte das Lichtwerk nicht darüber."
  read -k1 "?  Taste drücken zum Schließen." ; exit 1
elif belegt 8420; then
  echo "  Auf 8420 läuft etwas anderes. Dort liest das Lichtwerk Skizzen und Werkraum; ich starte nicht darüber."
  read -k1 "?  Taste drücken zum Schließen." ; exit 1
else
  # 8420 ist der Leseeingang: Skizzen und Werkraum laufen dort und können nichts ablegen.
  # --behalten: eine Form des KiNFORMER wird durch dein Halten eine Fassung unter deinem Namen (Ja vom 20.10., 20:18).
  PYTHONDONTWRITEBYTECODE=1 nohup "$PY" "$HIER/server/lichtwerk_server.py" --port 8411 --leseeingang 8420 --behalten \
    > "$HIER/protokolle/lichtwerk-8411.log" 2>&1 & echo $! > "$HIER/protokolle/lichtwerk-8411.pid"
  for i in {1..20}; do lebt "$ADRESSE" && break; sleep 0.25; done
  lebt "$ADRESSE" && echo "  Das Lichtwerk ist bereit." || { echo "  Das Lichtwerk startet nicht. Näheres in protokolle/lichtwerk-8411.log"; read -k1 "?  Taste drücken." ; exit 1; }
fi

echo ""
echo "  Öffne $ADRESSE"
open "$ADRESSE"
echo ""
echo "  Tippen entfaltet · Ziehen dreht · Halten verbindet · ⌘V legt ab · S Seite · N Netz · Esc zurück"
echo "  Dieses Fenster darf zu. Anhalten: SPiRALCELLS-ANHALTEN.command"
sleep 4

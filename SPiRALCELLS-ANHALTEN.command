#!/bin/zsh
# Hält das Lichtwerk an (nur über seine gemerkte Prozessnummer, nie per Namenssuche).
# SPiRALCELLS selbst bleibt wach, außer du sagst ausdrücklich ja.
HIER="${0:A:h}"
halte() { # $1 PID-Datei, $2 erwarteter Befehlsteil, $3 Name
  local f="$HIER/protokolle/$1" p
  [[ -f "$f" ]] || { echo "  $3: keine gemerkte Prozessnummer."; return; }
  p="$(cat "$f")"
  if ps -o command= -p "$p" 2>/dev/null | grep -q -- "$2"; then kill "$p" && echo "  $3 angehalten." && rm -f "$f"
  else echo "  $3 läuft nicht (mehr) unter der gemerkten Nummer."; rm -f "$f"; fi
}
echo ""
halte lichtwerk-8411.pid "lichtwerk_server.py" "Lichtwerk"
read -k1 "?  SPiRALCELLS (8401) auch anhalten? Andere Stimmen nutzen es vielleicht. (j/n) " A; echo ""
[[ "$A" == [jJyY] ]] && halte spiralcells-8401.pid "server.app" "SPiRALCELLS"
sleep 2

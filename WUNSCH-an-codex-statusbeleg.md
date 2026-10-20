# Wunsch an Codex: ein Beleg für jeden Statuswechsel

Von Claude (Lichtwerk-Spur), 20.10.2026. Nur ein Wunsch, kein Auftrag. Ob er umgesetzt wird, entscheidet Ralf.

## Worum es geht

`POST /api/variants/{id}/status` überschreibt heute nur das Feld `status`. Dabei gehen zwei Dinge verloren:

- **wann** kristallisiert (oder geprüft, verworfen) wurde,
- **wer** es getan hat. Kristallisieren ist laut konzept.md §3.6 ein sozialer Akt und steht nur Ralf zu.

Im Lichtwerk liegt der goldene Jahresring darum heute auf der Höhe der *Entstehung* der Ausprägung und nicht auf der Höhe von Ralfs Entscheidung. ABBILDUNG.md benennt das offen.

## Vorschlag (additiv, ohne Migration)

- Eine neue, nur anwachsende Sammlung `status_events`: `{id, variant_id, status, previous_status, author_id?, created_at}`. Sie wird beim Statuswechsel mitgeschrieben, atomar mit dem Feld.
- `StatusUpdate` bekommt optional `author_id`. Fehlt es, bleibt alles wie heute.
- `GET /api/graph` liefert `status_events` mit, oder eine eigene Leseroute.
- Föderation: Die Ereignisse verbreiten sich wie Varianten (UUID-Dedupe, first write wins).

## Was das Lichtwerk dann tut

- Der goldene Jahresring sitzt im Kelch auf der Höhe von Ralfs Entscheidung.
- Die Lesefläche sagt: „Von Ralf kristallisiert am 20. Okt., 18:05.“
- Beim Öffnen eines Monds läuft das Einrasten in der Geschichte an der richtigen Stelle ab und nicht erst am Ende.

## Was sich nicht ändern soll

Die bestehenden Verträge: `/api/graph`, `/api/variant-branches` mit `request_id`, `/api/variants/{id}/status` (ohne `author_id` weiter gültig), `/api/edges`, `/api/agents`.

## Nachtrag, 20.10.2026 abends

- **`/api/changes` soll Statusereignisse mitliefern**, sobald es sie gibt. Heute liefert `/api/changes?since=` nur
  Neueinfügungen und vergleicht die Zeit als Text. Das Lichtwerk rechnet „Was ist neu?“ darum selbst aus dem Graphen
  (Leseweg `GET /lichtwerk/neu?seit=…`, Zeiten als UTC verglichen) und lässt Statuswechsel unsichtbar, bis es den
  Beleg gibt. Mit Beleg könnte es sagen: „Seit deinem letzten Besuch hat Codex zwei Ausprägungen geprüft.“
- Formen, die Ralf behält, setzen keinen Status. Bekommt ein Form-Korn anderswo einen Status, übergeht ihn das
  Lichtwerk, damit eine Form nie einen Mond reifer oder kristallisiert aussehen lässt.

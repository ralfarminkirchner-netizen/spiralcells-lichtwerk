# Der KiNFORMER sagt selbst, was er kürzt – und was das für die Zentrale heißt

20.10.2026, 22:20. Von Claude (Lichtwerk-Spur), auf Ralfs Ja („1. ja“, weitergereicht von der obersten Sitzung).
Geschrieben, **bevor** `wirktragwerk` angefasst wird.

## 1 · Was sich im KiNFORMER ändert (`formformer/formen_http.py`)

- Der Absatz `<p class="herkunft">` sagt künftig selbst, was vom Original blieb, statt „Der Wortlaut ist unverändert
  übernommen und nur neu gesetzt.“ Vorlage sind die Sätze, die das Lichtwerk seit heute Abend selbst einsetzt (B2):
  - Plakat: „Die ersten drei von 11 Sätzen, groß gesetzt.“ (bei 1–3 Sätzen: „Der eine Satz …“, „Beide Sätze …“, „Alle drei Sätze …“)
  - Lesetuch: „Alle 11 Sätze, neu gesetzt.“
  - Karten: „11 Karten, jeder Satz eine.“
  - Spiel: „11 Karten zum Umdrehen und Ordnen.“ und bei mehr als 24 Sätzen „Die ersten 24 von 30 Sätzen.“
  - Schaubild: „Jeder Absatz ein Zweig, seine weiteren Sätze als Blätter.“, dazu bei Bedarf „Steht Fließtext neben einer
    Aufzählung, zeigt das Bild nur die Aufzählung.“ und „Längeres ist gekürzt und mit „…“ markiert.“
  - Wo Aufzählungszeichen oder Nummern am Satzanfang wegfallen (bei Plakat und Spiel nur in den gezeigten Sätzen):
    „Aufzählungszeichen und Nummern am Satzanfang fallen weg.“
- Die Antwort von `/api/formen/ausformen` bekommt dazu ein neues Feld `blieb` mit genau diesem Satz. Das Feld `satz`
  bleibt, wie es ist („11 Karten.“), weil die Zentrale es in ihre Werkliste schreibt und Tests es prüfen.
- Die Sätze der Richtungen (`/api/formen/richtungen`, in der Zentrale als „Wesen“ gezeigt) behaupten kein Sinnverstehen
  mehr: „Die ersten drei Sätze, groß gesetzt.“, „Jeder Satz neu gesetzt, zum Vorlesen.“, „Jeder Satz eine Karte.“,
  „Jeder Absatz ein Zweig, seine weiteren Sätze als Blätter.“, „Karten zum Umdrehen und Ordnen.“
- Weiter deterministisch, ohne Modell, ohne Netz, ohne Speicher. Gilt erst nach einem Neustart von 9062 (LaunchAgent
  `formformer-fundus`), und den gibt es nur nach Ralfs ausdrücklichem Ja.

## 2 · Die Folge für die Zentrale (die 409-Frage)

- `aios_formen.weiterformen()` legt jede Form in KiN mit
  `"request_id": "kinformer-" + sha256(werk + richtung + text)[:32]` ab, im Körper aber die **Seite** (`text = form["html"]`).
- KiN prüft jede `request_id` mit `once()` (`kintegrity/kin/core.py`, ab Z.297): gleiche Kennung mit anderem Körper ergibt
  **409** „Diese request_id bezeichnet bereits einen anderen Auftrag“.
- Nach der Änderung im KiNFORMER sieht die Seite für denselben Stoff anders aus (anderer Herkunftssatz). Wer in der
  Zentrale eine schon einmal geformte Richtung desselben Materials erneut formt, bekäme 409 statt der Form.
- KiN selbst legt Quellen schon inhaltlich ab: `src_` = Prüfsumme aus Text, Verweis und Art (`core.py` Z.335); gibt es die
  Quelle schon, kommt sie zurück, ohne Fehler.

## 3 · Der kleinste saubere Weg

Die Kennung folgt dem Inhalt, wie KiNs eigene Quellenkennung:

```python
"request_id": "kinformer-" + hashlib.sha256((werk + richtung + text + form["html"]).encode()).hexdigest()[:32],
```

- Eine Zeile in `aios_formen.py`, keine Änderung an KiN, keine Umbenennung alter Einträge.
- Gleiche Seite → gleiche Kennung → KiN antwortet wie bisher mit derselben Quelle (kein Doppel in der Werkliste, sie
  vergleicht `gespeichert["id"]`).
- Neue Seite (neuer KiNFORMER) → neue Kennung → neue Quelle → im Raum Formen eine neue Fassung dieser Richtung; die alte
  bleibt und lässt sich wie jede Form zurücknehmen. Kein 409, auch nicht bei der nächsten Änderung am KiNFORMER.
- Verworfen: ein Fassungszeichen („-f2“), das der KiNFORMER mitliefert. Es braucht Änderungen auf beiden Seiten und
  bricht bei der nächsten Änderung wieder.
- Ein Test in `wirktragwerk/tests/test_aios_formen.py`: zweimal Weiterformen mit derselben Seite ergibt dieselbe Kennung,
  mit geänderter Seite eine andere.

## 4 · Fork und Reihenfolge

- **KiN-OS-Fork** (Sitzung „kin-os-kleinsten-fork-an“): dieselbe Zeile mit eigenem Präfix
  `"kinos-form-" + sha256(werk + richtung + text + form["html"])[:32]` (B6 verlangt `kinos-form-` statt `kinformer-`).
  Das Lichtwerk sagt der Fork-Sitzung Bescheid; geändert wird die Fork-Kopie nur von ihr.
- **Reihenfolge:**
  1. `formen_http.py` ändern und gegen eine eigene KiNFORMER-Instanz auf freiem Port prüfen, nicht gegen 9062.
  2. Die Zeile in `aios_formen.py` ändern und testen. Sie ist mit dem alten wie dem neuen KiNFORMER richtig und wirkt erst
     nach einem Neustart von 8894.
  3. Ralf fragen, ob 9062 und 8894 neu starten dürfen. Erst dann sagt der KiNFORMER es überall selbst.
- **Lichtwerk** (B2): Liefert der KiNFORMER `blieb`, übernimmt das Lichtwerk seinen Satz und seine Seite unverändert.
  Fehlt `blieb` (alter KiNFORMER), ersetzt es den Absatz wie bisher selbst. Beide Wege ergeben dieselbe Seite; eine vor dem
  Neustart behaltene Form gilt danach weiter als „schon behalten“.

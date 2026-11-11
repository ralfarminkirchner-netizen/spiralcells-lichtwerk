# Werkansichten · Bauvorgabe für eine Ansicht

Ein Inhalt, neun Ansichten (Claude-Variante, 11.11.2026). Seite: `app/werkansichten.html`, Code: `app/werkansichten/`.
Lokale Vorschau: `http://localhost:8487/werkansichten.html#<ansicht>` (Server läuft; nicht beenden, nicht neu starten).
Kopie im eigenen Tab prüfen, z. B. `?still#garten`. Module werden nicht gecacht (`no-store`), aber ein Wechsel nur des
`#` lädt nicht neu: nach Änderungen `location.reload()`.

## Regeln von Ralf (verbindlich)

1. Keine technischen Kennungen in der Oberfläche (keine IDs, Schlüssel, Pfade, Ordnernamen als Titel; auch nicht in
   `title`, `aria-label`, Fehlermeldungen). Nur `k.name` und menschliche Wörter. Siehe
   `/Volumes/ThunderBolt4_2TB/Development/GRUNDMANIFEST-MENSCHLICHE-OBERFLAECHEN.md`.
2. Nur echte Bilder. Fehlt ein Bild, ehrlich „ohne Bild“ zeigen (Hilfe: `bildEl(K, null)` oder `papier()`), nie Farbkacheln
   als Ersatz, nie erfundene Inhalte.
3. Nichts weglassen: der ganze Bestand bleibt erreichbar (Verdichten erlaubt, wenn sichtbar und auflösbar).
4. Unterscheiden: belegte Beziehung · berechnete Nähe · gestalterische Anordnung · offene Zuordnung. Größe, Lage, Nähe
   dürfen nichts behaupten, was nicht belegt ist. Unbelegte Zeit bleibt als solche erkennbar (`k.von == null`).
5. 1440 px und 390 px sind beide eigene Kompositionen. Trefferflächen ≥ 40 px am Handy, sichtbarer Fokus,
   `prefers-reduced-motion` beachten. Nichts nur über Hover.
6. Keine Abhängigkeiten von außen (CSP `script-src 'self'`). Kein Framework. Keine generierten Bilder.
7. Gestaltung: erwachsen, präzise, lebendig. Keine generischen Kartenraster als Hauptgestalt, keine dekorativen Partikel,
   kein Glas, keine Leuchtnebel, keine großen leeren Kulissen, keine winzigen Beschriftungen (≥ 12 px).
   Gemeinsame Sprache: Papier `#f3eee3`, Tinte `#221d17`, Antiqua (`SERIF`) für Namen, Grotesk (`SANS`) für Bedienung,
   Farbe gehört den Orten (`farbe(k)` → `{f, d, h}`: Fläche, dunkel für Schrift, hell für Grund). Auswahl: `#c2410c`.

## Schnittstelle

```js
export const legende = '<p>…</p>';            // „So liest man es“ (statisches HTML, keine Daten einsetzen)
export function starte(flaeche, K){            // flaeche: leeres, absolut gefülltes div in der Bühne
  stil('meineansicht');                         // lädt app/werkansichten/meineansicht.css (aus gemein.js)
  …
  return {
    zeige(k, sofort, vonAnsicht){ … },          // k wurde gewählt; vonAnsicht=true, wenn die Wahl aus dieser Ansicht kam
    suche(s){ … },                              // aktive Suche geändert: s.q, s.treffer (Set von Schlüsseln) oder null
    groesse(){ … },                             // Blatt auf/zu: neu ausmessen
    ende(){ … }                                 // aufräumen (Listener, Canvas, Timer)
  };
}
```

`K` (Kontext der Hülle):
- `K.inhalt` = `{wurzel, alle, nachSchluessel, von, bis}`; Knoten `k`: `art` ∈ wurzel|ort|bereich|app|werk|fassung|gespraech,
  `name`, `eltern`, `kinder` (nur Nicht-Blätter), `schluessel` (gleich für dasselbe Werk an mehreren Orten),
  `fassungen`, `gespraeche`, `bildzahl`, `blaetter`, `von`/`bis` (ms oder null), `bild` (Titelbild oder null),
  Fassungen: `bilder` (Array `{pfad, text}`), `stimme`, `urteil`, `zeichen`, `werk`. Werke/Apps: `gebiete` (berechnete
  Themen), `auch` (weitere Orte).
- `K.bezug.von(k)` → Beziehungen `{andere, art, belegt, aus, satz}`; `K.bezug.zwischenBehaeltern()` →
  `[{a, b, belegt, berechnet, arten}]`; `BELEGT`/`BERECHNET` in `bezug.js` erklären die Arten.
- `K.gewaehlt()`, `K.waehle(k, {vonAnsicht: true})`, `K.oeffne(k)` (Fassung/Gespräch → Lesen), `K.wechsle(id, k)`.
- `K.bildUrl(b, breite)` (240 oder 960), `K.istTreffer(k)` (Suche), `K.suche`, `K.schmal()` (< 760 px), `K.still`
  (ohne Anfangsbewegung), `K.sage(text)` (kurzer Hinweis), `K.rand()`.
- Das Blatt rechts (Handy: unten) zeigt das Gewählte mit allen Details und Handlungen. Die Ansicht muss es nicht
  wiederholen.

Hilfen: `gemein.js` (`el`, `knopf`, `farbe`, `titelBild`, `bildEl`, `fassungenUnter`, `bilderUnter`, `tagWort`, `n`,
`papier`, `bildRahmen`, `platzhalter`, `kuerze`, `stil`, `SERIF`, `SANS`), `buehne.js` (Canvas-Fläche mit Ziehen/Zoomen,
`bildlager`), `buehnenhilfe.js` (`zoomKnoepfe`, `tasten`, `trefferliste`, `schild`). Muster: `baum.js` (Canvas),
`zelle.js` (DOM).

Bedienung in jeder Ansicht gleich: Tipp/Klick wählt; zweiter Tipp auf eine gewählte Fassung öffnet sie (`K.oeffne`);
Tastatur erreicht alles (DOM-Knöpfe mit sichtbarem Fokus, oder `tasten()` bei Canvas); Esc geht eine Stufe zurück
(macht die Hülle). Die Wahl kommt beim Ansichtswechsel mit: `zeige(k, true)` muss das Gewählte in dieser Ansicht
sichtbar machen (hinscrollen/hinzoomen, markieren).

## Prüfen

`node --check datei.js`. Im eigenen Browser-Tab: 1440×900 und 390×844, Konsole ohne Fehler, Wahl über Wechsel
hinweg, Werk mit vielen Fassungen (FASKA Varianten · Vergleich, 197), Werk ohne Bild, Fassung ohne Zeit, lange Namen.
Nicht `app/werkansichten/haupt.js`, `stil.css`, `gemein.js` oder andere Ansichten ändern — Wünsche dazu im Bericht nennen.

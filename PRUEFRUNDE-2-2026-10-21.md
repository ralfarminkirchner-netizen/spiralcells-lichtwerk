# Zweite Prüfrunde Lichtwerk (Zweig gewebe, Stand 35c59bc) · 21.10.2026

Nur gelesen, nichts geändert. Jeder Befund wurde von einem eigenen Gegenprüfer zu widerlegen versucht.
Bestätigt heißt: der Gegenprüfer hielt ihn für echt. Eingearbeitet ist davon noch **nichts**.

**Noch ohne Gegenprüfung beim Schreiben dieser Datei:** gegen:bruch:2, gegen:bruch:4, gegen:bruch:6, gegen:bruch:7, gegen:bruch:8

## Bestätigt (41)

### bild-netz 1 · Kurze Bündel zwischen Nachbarbezirken brennen als weiße Haken aus und überstrahlen die Mitte
- **datei:** app/js/netz.js
- **zeile:** 211
- **schwere:** schwer
- **befund:** Im Überblick sind die hellsten Dinge weder die Mitte noch die Werke. Am hellsten sind drei weiße, ausgebrannte Haken oder Sicheln zwischen benachbarten Bezirken: FASKA→SEiN, Text und Reim→KiNTEGRiTY und Mitte→KiNTEGRiTY. Sie sehen aus wie zusätzliche Monde, liegen zwischen zwei Dächern und gehören sichtbar zu keinem. Das stört Ruhe und Rangordnung. Ursache: Die Punktzahl eines Bündels wird aus dem Abstand der Bezirksmitten berechnet (n = clamp(d·3, 20, 120)). Gezeichnet wird aber nur das Stück von Rand zu Rand. Bei Nachbarn ist dieses Stück etwa 2 Welteinheiten lang und bekommt trotzdem 69 bis 116 additive Punkte der Größe 0,38 bis 0,49. Damit ist Befund 18 (Fäden unsichtbar) überkorrigiert. Befund 11 ist nur teilweise behoben: Der Behälternebel ist weg, aber das Licht kommt jetzt von den Fäden statt von den Werken.
- **beleg:** gewebe2-01: Haken bei (430,480) zwischen FASKA und SEiN, max 255, 7 px ≥240. Bei (480,175) zwischen Text und Reim und KiNTEGRiTY max 253. Bei (465,262) zwischen Mitte und KiNTEGRiTY ein Haken mit Ring. Zum Vergleich: Kern der Mitte (380–420, 280–310) max 230, Werke in SEiN (310–360, 500–530) max 110, in Spiele und Welten max 126. gewebe2-12 (Handy): weiße Flecken bei (280,352) und (243,538), max 255, 13 bzw. 16 px ≥240. Rechnung (Node, kette-gewebe, Kamera S=58 wie bei 800x600): FASKA→SEiN hat 2,0 Einheiten von Rand zu Rand, 116 Punkte im Abstand 0,03 bei Punktgröße 0,42, also 15-fache Überdeckung und summiertes Alpha um 6. Text und Reim→KiNTEGRiTY 10,7-fach, Mitte→KiNTEGRiTY 12,2-fach. Die langen Bündel liegen bei 1,1- bis 3-fach. Skript: /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/dichte.mjs
- **vorschlag:** In netz.js Z. 211 die Punktzahl aus der Bogenlänge von Rand zu Rand bestimmen, etwa n = clamp(Bogenlänge / (0,7·dicke), 6, 120). Das Alpha je Punkt mit Punktabstand/dicke normieren, damit ein Bündel als Linie nie heller als etwa 0,5 wird. Bündel zwischen Nachbarn (unter etwa 4 Einheiten von Rand zu Rand) als kleinen, stillen Knoten am gemeinsamen Rand zeigen statt als Bogen. Als Regel festhalten: Der Kern der Mitte bleibt das Hellste im Überblick.
- **Gegenprüfung:** echt, Schwere mittel: Ich konnte den Befund nicht widerlegen. Der Fehler ist im Code klar zu sehen und die Rechnung passt genau zu den Bildern. Nur „überstrahlen die Mitte“ ist zu stark gesagt, darum stufe ich ihn von schwer auf mittel herunter.

Code: Der Bündelteil in app/js/netz.js ist neu in 35c59bc (Z. 206–216 und bogen() Z. 249–253). In Z. 210 wird die Punktzahl n = clamp(d·3, 20, 120) aus dem Abstand der Bezirksmitten d berechnet. bogen() zeichnet aber nur das Stück von Rand zu Rand. Weil gapDach 2.0 ist, liegen Nachbarbezirke immer etwa 2 Einheiten auseinander. Dort fallen 69 bis 116 Punkte auf einen Bogen von etwa 2,8 Welteinheiten. Gemischt wird additiv (licht.js Z. 210, blendFunc ONE, ONE). Dazu kommt: STIL.a ist von 0,07 auf 0,3 bis 0,5 gestiegen.

Rechnung: Skript /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/widerlegung-haken/haken.mjs, mit bogen() wörtlich nachgebaut. Die Kamera ist wie in regie.js eingestellt (S 58, yaw 0,35, Neigung 50°, Blickwinkel 40°), die Punktgröße in Pixeln wie im Shader.
- 800x600: FASKA→SEiN 116 Punkte auf 14 px Bogen, Punktabstand 0,12 px bei 2,6 px Punktgröße, also etwa 21-fache Überdeckung und summiertes Alpha um 8,4. Mitte→KiNTEGRiTY 20,5-fach, etwa 7,4. Text und Reim→KiNTEGRiTY 17,9-fach, etwa 8,3. Die langen Bündel liegen bei 1,3- bis 4,3-fach (Alpha 0,5 bis 1,5).
- Handy 375x812: die drei kurzen Bündel 49- bis 55-fach, Alpha 19 bis 23.
- kette-claude ergibt dieselben Werte.

Bildstellen: Mit dyaw 0,1, also gut 8 Sekunden Drehung über netZeit, liegen die berechneten Bündelknoten auf wenige Pixel genau auf den Haken in gewebe2-01. Gerechnet (434,478), (463,263), (482,175); im Bild (431,479), (464,262), (481,174). Die Haken sind also nachweislich die drei kurzen Bündel.

Helligkeit gemessen:
- gewebe2-01: Haken max 255, 253 und 247. Der Kern der Mitte max 247, und das warm, nicht weiß. Werke in SEiN max 111, in Spiele und Welten max 130.
- gewebe2-12 (Handy): drei weiße Flecken mit max 255 und 13 bis 16 px ≥240. Der Bereich der Mitte hat max 246 und nur 3 px ≥240. Werke haben max 111 bis 201.

Damit sind die Bündel zwischen Nachbarn im Überblick am Handy das Hellste überhaupt. Am Mac stehen sie gleichauf mit dem Kern der Mitte.

Folge: Der Kopf von netz.js verspricht „Das Licht kommt von den Werken“, und Z. 206 sagt „Stärke nach Zahl der Kanten“. Tatsächlich hängt die Helligkeit vom Abstand der Bezirke ab, nicht von der Zahl der Kanten. Mitte→KiNTEGRiTY hat 1 Kante und ist ein greller Haken. SEiN→Mitte hat 2 Kanten und ist eine schwache Linie. Das Bild sagt also etwas Falsches über das Gewicht der Verbindungen. Weil gapDach fest ist, kommt das bei jedem Nachbarpaar vor, auch im echten Bestand. Weder ein Test noch ein späterer Commit behebt es.

Warum nur mittel: Die Mitte bleibt als großer warmer Schein klar die Mitte. Ihre Fläche wird nicht überstrahlt. Stellenweise ist sie nur gleich hell oder knapp schwächer. Funktion und harte Regeln sind nicht verletzt. Es bleibt ein sichtbarer Fehler im Hauptbild, aber kein schwerer. Der Vorschlag passt: Punktzahl aus der Bogenlänge von Rand zu Rand berechnen und das Alpha je Punkt mit Punktabstand/Dicke normieren.

### bild-netz 2 · Handy: Netz füllt nur ein Viertel der Höhe, Fäden und Ringe sind dreimal so dick wie Werke, die Mitte wird wieder zum Knäuel
- **datei:** app/js/regie.js
- **zeile:** 29
- **schwere:** mittel
- **befund:** Befunde 9 und 25 sind nur teilweise behoben. Der Anschnitt rechts ist weg, aber das Netz ist am Handy kleiner geworden. Es füllt nur noch etwa ein Viertel der Höhe, vorher war es gut ein Drittel. Drei Viertel des Schirms bleiben leer. Zugleich hängen die Größen von Bündeln, Knoten und Ringen an CAM.S, der halben Bildhöhe. Die Werkpunkte bleiben in Weltmaß und fallen unter die Mindestpunktgröße, dadurch werden sie gedimmt. Im Hochformat werden Fäden und Ringe so im Verhältnis zu den Werken rund dreimal so dick wie am Mac. Die Mitte liest sich am Handy wieder als Knäuel aus weißen Ringen und Linien, und die Werke sind blasser als die Fäden. Befunde 12 und 19 sind damit am Handy nicht behoben.
- **beleg:** gewebe2-12: Inhalt nur zwischen y=340 und 576 von 974 (24 %), gewebe-10 vorher 251 bis 607 (37 %). An der Mitte (130–270, 375–445) liegen fünf weiße Knotenringe und sechs Linien. Faden links max 236, Haken unten max 249, Werke links (60–130, 410–445) max 111. Rechnung (Node, netzMass wie regie.js Z. 49–53, Neigung 50°, kette-gewebe): Bei 375x812 ist S 137 bis 154, die Füllung beträgt 33–35 % der Höhe und 91 % der Breite. Ein Bündelpunkt misst dort 0,82 bis 0,93 Welteinheiten, ein Werkpunkt 0,32 (Verhältnis 2,8 bis 3,2). Bei 800x600 ist S 49 bis 58 und das Verhältnis 1,0 bis 1,2. Code: netz.js Z. 186 (fz = CAM.S·0,004), Z. 207 (bz = CAM.S·0,006), licht.js Z. 72 (Ringpunkt 0,0035·CAM.S), licht.js Z. 86 (uMin dimmt kleine Punkte). Skript: /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/kamera.mjs
- **vorschlag:** regie.js Z. 29: Im Hochformat steiler auf das Netz blicken (etwa 75 bis 85° statt 50°), damit die Scheibe nicht auf etwa 0,77 verkürzt wird, und netzMass in Z. 23 mit demselben Winkel rechnen. In netz.js die Größen von Fäden, Knoten und Ringen an die kürzere Bildhälfte koppeln (CAM.S·min(1, asp)) statt an die Höhe. Knotenringe im Überblick am Handy weglassen und nur als Punkte zeigen.
- **Gegenprüfung:** echt, Schwere mittel: Der Befund hält im Kern, aber nur mit seinem zweiten Teil: Am Handy kippen die Größenverhältnisse. Der erste Teil, das Netz fülle nur ein Viertel der Höhe, trägt nicht als eigener Fehler.

**Nachgerechnet** mit dem echten Code, ohne WebGL: regie() → setCamera() → baueNetz() auf kette-gewebe. Danach habe ich jeden Punkt aus PD projiziert und die Punktgröße wie im Shader bestimmt (px = s·uPx/w, Dimmung e = (px/uMin)² mit uMin = 1,6·DPR). kette-claude liefert dieselben Werte. Skripte: /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/widerlegung-handy/sim.mjs und …/widerlegung-handy/ausdehnung.mjs (alt gegen neu, alter Stand aus git archive 26356a7).

**1) Größen am Handy: bestätigt und folgenreich.**
- Die Kopplung an CAM.S ist neu in 35c59bc. Die alte Fassung zeichnete Fäden mit fester Größe 0,035.
- Jetzt koppeln netz.js Z. 186 (fz = max(0,11; CAM.S·0,004)) und Z. 207 (bz = max(0,16; CAM.S·0,006)) die Größen an CAM.S. Dazu kommt der Knotenring über screenRing (licht.js Z. 72, Ringpunkt 0,0035·CAM.S, Radius dicke·2,4).
- Ein Werkpunkt bleibt dagegen in Weltmaß: 0,17·max(0,7; rM), netz.js Z. 168.
- Weil der Maßstab am Handy an der Breite hängt, steigt S auf 154 (Mac 800×600: 58).

| | Handy 375×812 | Mac 800×600 | Mac 1440×900 |
|---|---|---|---|
| Werkpunkt | 0,62 css px | 1,13 px | 1,69 px |
| Dimmung durch uMin (licht.js Z. 86) | e = 0,15, also 15 % Helligkeit | e = 0,50 | e = 1,0 |
| Bündellinie | 2,66 px, ungedimmt | 1,93 px | – |
| Verhältnis Linie zu Werkpunkt | 4,3 | 1,7 | 1,7 |
| Radius Knotenring | 6,4–10,5 px | 4,8–7,8 px | – |
| Radius eines Werks (rM ≈ 1,9) | 5,0 px | 9,8 px | – |

- Am Handy sind die Knotenringe also größer als die Werke, am Mac kleiner. Das kehrt den Grundsatz um, den netz.js Z. 5 und Z. 113 selbst nennen: Das Licht kommt von den Werken, die Werke sind das Hellste.
- Im Bild sieht man es deutlich. In gewebe2-12, vergrößert (Bereich x 40–340, y 320–560), sind die Bündel durchgezogene, dicke weiße Striche mit hellen Ringen. Die Werke daneben sind blasse graue Tupfer.
- In gewebe2-01 sind dieselben Bündel feine Punktlinien mit kleinen Ringen, und die warme Zentrale trägt das Bild.
- Am Handy ist die Hierarchie aus den Befunden 12 und 19 damit nicht erreicht.

**2) „Füllt nur ein Viertel der Höhe“: weitgehend widerlegt.**
- Die 24 % sind an den hellen Inhalten gemessen. Die Bezirkskreise samt Hüllen reichen bei 375×812 über 28–35 % der Höhe, je nach Drehung (netZeit 0/30/60), und über 84–93 % der Breite. Der Rand ist frei.
- Der alte Stand kam auf 34–42 % nur deshalb, weil er rechts über den Rand lief: x bis 397–399 bei 375 px Breite.
- Ein breites Netz unter 50° Neigung kann im Hochformat nicht mehr Höhe füllen. Die Drehung hochkant (regie.js Z. 56–58) wird geprüft und hier zu Recht nicht gewählt, yaw bleibt 0,35.
- Der Rest ist eine Gestaltungsfrage, etwa ein steilerer Blick, aber kein Fehler. Befund 9 und Befund 25 sind in ihrem Kern behoben, das Netz liegt ganz im Bild.

**Schwere:** mittel. Betroffen ist nur die Übersicht am Handy, die Funktion bleibt heil. Die Umkehr der Lichtordnung fällt aber auf den ersten Blick auf, und sie betrifft die Stelle, die die letzte Kritikrunde beruhigen wollte.

**Abhilfe**, wie im Vorschlag: fz, bz und den Ringpunkt an die kürzere Bildhälfte koppeln, also CAM.S·min(1; asp), oder an den Weltmaßstab der Werke. Den Teil mit 75–85° Neigung braucht es dafür nicht.

### bild-netz 4 · „ohne Dach“ steht nicht mehr außen, sondern wie ein zehntes Dach direkt neben Spiele und Welten
- **datei:** app/js/ordnung.js
- **zeile:** 81
- **schwere:** mittel
- **befund:** „Ohne Dach“ ist jetzt der letzte Bezirk im Kranz. Es hat denselben Abstand wie zwei Dächer untereinander und liegt näher an der Mitte als Phänomenatlas. Seine Gestalt, die es laut Kommentar absetzen soll, ist ein gestrichelter Staubring mit Alpha 0,22 und Punktgröße 0,07. Das ist genau die Art Ring, die Befund 3 als unsichtbar belegt hat. Auch die Dachhüllen sind im Überblick fast unsichtbar geworden. Zugehörigkeit zeigt sich also nur noch über Nähe. Im Bild stehen die Werke ohne Dach als Sternhäufchen unmittelbar über „Spiele und Welten“ und lesen sich wie ein weiteres Dach oder wie ein Teil von Spiele und Welten. Ralf hat die Ordnung mit „ohne Dach“ deutlich außen bestätigt; der Bericht sagt „Außen liegen die neun Werke, die noch ohne Dach sind“.
- **beleg:** gewebe2-01, Ausschnitt (100–300) × (160–260): „ohne Dach“ bei (170,191) mit drei, vier Lichtern, 50 px darunter „Spiele und Welten“ (218,241). Kein eigener Ring ist zu sehen. Im bestätigten Bild gewebe-netz-ordnung-vorschlag.jpg steht „ohne Dach“ allein oben rechts außerhalb aller Dächer. Code: ordnung.js Z. 81–87 („ohne“ als letzter im Kranz, gleicher gapD), netz.js Z. 152 (Ring 0,22·vis, Größe 0,07, Lücke 3), netz.js Z. 146 (Dachhülle im Überblick nur Fresnel-Saum). Rechnung kette-gewebe (lage.mjs): Mitte von „ohne Dach“ bei 53,6, Phänomenatlas bei 56,3. Lücke zu Spiele und Welten 2,15, kleinster Abstand zwischen zwei Dächern 2,02.
- **vorschlag:** Mit Ralf klären, ob „ohne Dach“ im Kranz stehen darf. Wenn nicht, gibt es zwei Wege. Erstens: wieder außen hinter allen Dächern, und die Handy-Kamera zielt auf den Schwerpunkt der Bezirke statt auf den Ursprung. Zweitens: im Kranz, aber mit mindestens doppeltem Abstand (2·gapD) und einer sichtbaren eigenen Form, etwa einem durchgehenden Staubring mit Alpha ab 0,4 und Punktgröße wie ein Dachrand (0,11).
- **Gegenprüfung:** echt, Schwere mittel: Ich konnte den Befund nicht widerlegen. Der Kern ist belegt und hat Folgen. Nur die Aussage „liest sich wie ein Teil von Spiele und Welten“ ist am Desktop überzogen, solange der Name „ohne Dach“ zu sehen ist.

**Code, gleich in 35c59bc und im Arbeitsstand**
- ordnung.js Z. 80–84 und 94 hängen „ohne“ als letzten Bezirk in den Dachkranz. Dort gilt dasselbe gapD wie zwischen zwei Dächern.
- Im Netz-Kopf (netz.js Z. 8) stand vorher „liegt ehrlich außen ‚ohne Dach‘“. Das Wort „außen“ ist gestrichen.
- BERICHT.md Z. 17 („Außen liegen die neun Werke …“) und WEITERMACHEN Z. 23 („‚ohne Dach‘ außen“) wurden nicht nachgezogen. Sie beschreiben Ralf jetzt ein Bild, das es nicht mehr gibt.
- Ralf hat die Ordnung mit gewebe-netz-ordnung-vorschlag.jpg bestätigt. Darauf steht „ohne Dach“ allein oben rechts außerhalb aller Dächer.
- Keiner der 27 Bildkritik-Befunde verlangt diese Verlegung. Befund 25 beschreibt die Außenlage nur als Ursache der Schieflage am Handy. Sein Verdikt warnt sogar davor, die bestätigte Bildidee anzutasten.

**Rechnung: Lage der Bezirke**
Skript: /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/widerlegung-ohnedach/lage-vergleich.mjs, gerechnet auf kette-gewebe; kette-claude gibt dieselben Werte.
- Neu liegt „ohne Dach“ bei 53,61 vom Ursprung. Damit liegt es näher an der Mitte als ADHS OS (54,87) und Phänomenatlas (56,27).
- Die Lücke zu Spiele und Welten ist 2,15. Die kleinste Lücke zwischen zwei Dächern ist 2,02.
- Alt lag es bei 61,04, ganz außen. Bis zum nächsten Dach waren es mindestens 16,4 (Text und Reim).

**Rechnung: Wie hell ist der eigene Ring?**
Skript: /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/widerlegung-ohnedach/ring-licht.mjs
- Laut Kommentar soll „ohne Dach“ sich durch seine Gestalt absetzen. Diese Gestalt ist der Ring aus netz.js Z. 152.
- Bei 800×600 und der Drehlage von gewebe2-01 trifft auf eine Welteinheit 4,76 px. Ein Ringpunkt (0,07) ist dann 0,33 px groß.
- licht.js Z. 86 hebt ihn auf 1,6 px und dämpft ihn dabei mit (px/s)². Die wirksame Helligkeit ist 0,0095.
- Zum Vergleich: ein Werkpunkt hat 0,22, ein Saumpunkt der Dachhülle 0,15, der alte Dachring 0,045.
- Der Ring ist also unsichtbar. Das passt zum Bild: Auch dreifach aufgehellt ist um das Häufchen bei (155–185, 205–215) kein Ring zu sehen (Ausschnitte ohne-ausschnitt*.png im selben Ordner).
- Die Dächer haben im Überblick keinen Bodenring mehr (Z. 145 nur bei an/drin). Ihre Hülle leuchtet nur noch am Saum, ohne Grundlicht. Ein Dach und „ohne Dach“ unterscheidet am Bild also nur noch das Wort.

**Konkretes Fehlbild**
Skript: /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/widerlegung-ohnedach/namen-drehung.mjs. Es rechnet die Namen nach haupt.js Z. 487–500 und trifft gewebe2-01 auf insgesamt 31 px genau.
- Der Name „ohne Dach“ kommt in der Reihenfolge zuletzt. Bei 375×812 schweigt er in 195 von 720 Drehlagen, 175-mal verdrängt vom Namen „Spiele und Welten“.
- Dann liegen die neun Werke ohne Namen und ohne sichtbaren Ring 2,15 Einheiten vor dem Rand von Spiele und Welten. Sie lesen sich als Teil dieses Dachs.
- Das widerspricht dem Grundsatz in ordnung.js Z. 7–8 („bleibt sichtbar ‚ohne Dach‘, nie in einem geratenen“).

**Einschränkungen**
- Am Desktop ist der Name fast immer sichtbar: Spiele und Welten verdrängt ihn nur in 4 von 720 Lagen. Er steht direkt über dem Häufchen. Wer der Regel „Name über seinen Lichtern“ folgt, ordnet richtig zu.
- Auch alt schwieg der Name am Handy in 22 % der Lagen. Damals blieb das Häufchen aber durch Ferne abgesetzt.
- Der Ring war schon alt unsichtbar (0,2).
- Ralfs Ja galt wörtlich der Zuordnung. Es fiel aber am Bild mit „ohne Dach“ außen.

**Zum Vorschlag**
- Außen in der neuen Lage hieße: Mitte bei etwa 65,70 + 2,2 + 4,77 = 72,7. Die Ausdehnung wüchse um etwa 18 %.
- netzMass in regie.js misst „ohne Dach“ schon über N.kreise mit. Die Kamera würde eine Außenlage also ohne weiteren Eingriff einrahmen.

**Schwere mittel:** Ralfs bestätigtes Bild ändert sich ohne sein Wort, der Bericht sagt das Gegenteil, und am Handy fällt bei jeder vierten Drehlage die Grenze zwischen „ohne Dach“ und einem Dach weg.

### bild-netz 5 · Fäden und Bündel laufen quer durch fremde Bezirke und Bereiche
- **datei:** app/js/netz.js
- **zeile:** 240
- **schwere:** mittel
- **befund:** Bündel und Einzelfäden treten am eigenen und am fremden Rand aus und ein, weichen aber anderen Bezirken und Bereichen nicht aus. Im Überblick läuft das Bündel Mitte→ohne Dach samt Einzelfaden quer durch Spiele und Welten, als hinge Spiele und Welten an dieser Verbindung. Im Dach FASKA läuft der Faden FASKA Eigenraum→MOONFiNGERS gerade durch den Bereich FLOW · Lernspiele und durch das Licht von „flow“. Punkt 2 von Befund 18 (nicht gerade durch fremde Hüllen) ist damit nur auf Dachebene erfüllt.
- **beleg:** gewebe2-01, Ausschnitt (90–400) × (120–330): zwei weiße Bögen über „Spiele und Welten“. gewebe2-02, Ausschnitt (90–400) × (270–420): Eine punktierte Linie läuft vom linken Bildrand durch den FLOW-Ring und das flow-Licht (etwa 195,340) zu Eigenraum. Rechnung (Node, bogen() nachgebaut, kette-gewebe): Das Bündel Mitte→ohne Dach dringt 1,9 Welteinheiten tief in Spiele und Welten ein (R 17,7). Alle anderen Bündel bleiben frei (buendel.mjs im Prüfordner). Code: netz.js Z. 240–245 (fadenWeg setzt Stützpunkte nur an den Dachrändern), Z. 250 ff. (bogen ohne Kollisionsprüfung).
- **vorschlag:** In bogen() und fadenWeg() gegen alle Bezirkskreise prüfen, im Dach auch gegen die Bereichskreise. Bei einem Schnitt die Ausbuchtung (quer) zur freien Seite drehen oder einen Stützpunkt außen am fremden Kreis mit Abstand setzen. Im Dach den Faden erst zum Rand des eigenen Bereichs führen, dann zum Dachrand.
- **Gegenprüfung:** echt, Schwere mittel: Ich habe versucht, den Befund zu widerlegen. Das ist mir nicht gelungen. Er ist belegt, in einem Punkt muss ich ihn aber abschwächen.

Code (app/js/netz.js, Stand 35c59bc = HEAD, nicht behoben):
- fadenWeg (Z. 240–245) setzt die Bezier-Stützpunkte nur auf die Ränder von Quell- und Zielbezirk.
- bogen (Z. 249–252) biegt immer um 12 % nach links.
- Keine der beiden Funktionen prüft dritte Bezirke, Bereiche oder Werke.
- Vorher (26356a7, Z. 153) war der Weg eine Gerade. Umgesetzt ist also nur der wörtliche Vorschlag aus Befund 18 („Stützpunkte auf beiden Dachringen“). Dessen Ziel („nicht gerade durch fremde Hüllen“) ist nicht erreicht.
- tests/netz.test.mjs prüft das nicht.

Rechnung: bogen() und fadenWeg() habe ich nachgebaut und mit der echten Netz-Klasse lesend gerechnet. Die Skripte liegen in /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/widerlegung-quer/quer.mjs und flow.mjs. Mit kette-gewebe und kette-claude kommt dasselbe heraus.
- Bündel Zentrale→ohne Dach: Es dringt 1,87 tief in „Spiele und Welten“ ein (R 17,7), 63 % seiner Stützstellen liegen im Kreis. Die übrigen fünf Bündel bleiben frei. Die Zahl des Prüfers stimmt also. Die genannte buendel.mjs im Prüfordner rechnet allerdings etwas anderes.
- Faden FASKA Eigenraum→MOONFiNGERS: 18,6 % seiner Länge liegen im Bereich FLOW · Lernspiele (1,67 tief bei R 4,96). Im Zieldach SEiN läuft er 3,42 tief durch den Bereich EiN SEiN (R 4,89) und am Boden 0,29 an „Einsein“ vorbei (rM 1,27).
- Ein Inhalt→Genealogical Spiral: 5,28 tief durch „Spiele und Welten“ und 0,32 an „spiel maerchendorf“ vorbei.
- Ein Inhalt→KiNTEGRiTY · Gemeinsamer Variant: 4,23 tief durch den Bereich Gesprächskapitel (R 6,1).

Bild:
- gewebe2-02 (Ausschnitt aufgehellt): Die gepunktete Linie läuft von Eigenraum durch den FLOW-Ring und genau über die Lichter von „flow“ und „montessori flow“ zum linken Rand. Man liest eine Verbindung von Eigenraum zu flow, die es in den Daten nicht gibt.
- Am Boden liegt der Faden 3,3 bzw. 4,0 von den beiden flow-Werken entfernt. Über ihnen liegt er erst durch den Hub (lift = d·0,16+0,4, dort 6,6–7,7). Eine Kollisionsprüfung nur am Boden würde das also nicht beheben. Hub und Projektion müssen mitbedacht werden.

Abschwächung: Für den Überblick ist der Befund schwächer.
- Ohne Wahl zeichnet der Überblick nur das Bündel, und das streift „Spiele und Welten“ nur am Rand (11 % des R).
- Der Einzelfaden erscheint in gewebe2-01 nur, weil „Ein Inhalt“ gewählt oder beteiligt ist. Erkennbar ist das an den Knotenringen und daran, dass zwei Bögen von „ohne Dach“ ausgehen.
- Auf dem Schirm laufen beide Bögen über dem Namen „Spiele und Welten“ und enden sichtbar bei „ohne Dach“. Die Lesart „Spiele und Welten hängt daran“ ist dort nur mäßig stark.

Schwere: mittel. Systematisch und folgenreich ist der Fehler in den Dachsichten. Dort führt jeder Faden über Dachgrenzen durch fremde Bereiche und über fremde Werklichter (FLOW, EiN SEiN, Gesprächskapitel). Das ist eine falsche Aussage über Ralfs Beziehungen, also genau die Wirrnis, die Befund 18 vermeiden sollte. Daten oder Schreibwege sind nicht betroffen, daher nicht schwer.

### bild-netz 6 · Türen der Zentrale liegen im Dach KiNTEGRiTY
- **datei:** app/js/netz.js
- **zeile:** 90
- **schwere:** mittel
- **befund:** Die Türen sind Organe der Mitte, liegen aber bei Rm·1,3. Das sind in der Testkette 4,3 Welteinheiten außerhalb des Mitte-Rands. Ein Dach darf schon 2,0 nach dem Rand beginnen (gapDach). Liegt ein Dach in Türrichtung (fest −π/2) an der Mitte, stehen Türen in diesem Dach. In der Testkette steht die Tür „KiN“ 1,6 Einheiten tief in KiNTEGRiTY, zwischen dessen Werken. Gibt es zusätzlich den Werkraum (fünf Türen), stehen zwei Türen darin. Mitte und Dach vermischen sich damit genau an der Stelle, die die Ordnung trennen soll.
- **beleg:** gewebe2-03 (Mitte innen), oben rechts: Die Tür „KiN“ mit Ring bei (655,105) steht zwischen den beiden blauen KiNTEGRiTY-Lichtern (655,80) und (720,75), und der Faden zu KiNTEGRiTY läuft durch die Tür. Code: netz.js Z. 90 (tuerPos: Radius Rm·1,3, Richtung −π/2 ± 0,2·i), netz.js Z. 53 (lage mit gapDach 2,0), ordnung.js Z. 87 (Dächer ab Rm + R + gapD). Rechnung kette-gewebe (kamera.mjs): Rm = 14,35. Tür 4 von 4 steht bei (5,5; −17,8) und liegt 1,57 innerhalb des KiNTEGRiTY-Rands; bei fünf Türen 0,65 und 2,14.
- **vorschlag:** Den Türradius an die Lücke koppeln (höchstens Rm + 0,5·gapD). Alternativ den Türbogen in lage() als eigenen Kreis an der Mitte einplanen, bevor die Dächer gesetzt werden, und ihn in die größte freie Lücke zwischen den Dächern legen statt fest nach −π/2.
- **Gegenprüfung:** echt, Schwere mittel: Ich konnte den Befund nicht widerlegen. Er stimmt im Code, in der Rechnung und im Bild, und der Fehler ist mit 35c59bc neu entstanden.

Code:
- In 26356a7 lagen die Türen innerhalb der Mitte (tuerPos: Rm·0,82, Höhe Rm·0,55).
- 35c59bc legt sie nach außen (app/js/netz.js Z. 90–91: Radius Rm·1,3, Winkel −π/2 ± 0,2·i).
- Gleichzeitig wächst Rm auf mindestens 0,7 × den größten Dachradius (app/js/ordnung.js Z. 79).
- Der Abstand zwischen Mitte und Dächern bleibt aber gapDach 2,0 (netz.js Z. 53, ordnung.js Z. 86/88).
- Die Türen stehen also 0,3·Rm = 4,30 Einheiten vor dem Mitte-Rand, die Dächer beginnen schon 2,00 danach.
- Das drittgrößte Dach liegt im goldenen Winkel immer bei 2·GOLD + 0,4 ≈ −62°, also direkt neben dem Türbogen bei −90°. In der Testkette ist das KiNTEGRiTY (Mittelpunkt (15,5; −29,2), R 16,8). Es berührt die Mitte mit genau 2,00 Abstand.

Rechnung (/private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/widerlegung-tuer/tuer-ketten.mjs):
- kette-gewebe, kette-claude und testdaten/state.json liefern dasselbe Ergebnis: Rm = 14,35.
- Bei vier Türen steht „KiN“ bei (5,5; −17,8), 1,57 tief in KiNTEGRiTY und nur 0,18 neben dem Werk „Die Wörter bleiben. Der Vortrag wird gesucht.“.
- Bei fünf Türen stehen zwei Türen darin: „KiN“ 0,65 tief und „Werkraum“ 2,14 tief.
- Die fünfte Tür gibt es wirklich. Der Server hängt den Werkraum an, sobald der Leseeingang läuft (server/lichtwerk_server.py Z. 605–608), und laut Bericht läuft er auf 8420.

Bild:
- Mein Kameranachbau (/private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/widerlegung-tuer/tuer-im-dach.mjs) setzt „KiN“ bei 800×600 in der Mitte auf (656,106). Im Bild gewebe2-03 steht sie bei (655,105), das passt genau.
- Im vergrößerten Ausschnitt (/private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/widerlegung-tuer/g03-oben-rechts.png) steht der Türring „KiN“ zwischen den beiden blauen KiNTEGRiTY-Lichtern. Der Faden nach KiNTEGRiTY streift den Ring.

Folge für die Bedienung, über den Befund hinaus:
- treffer() in app/js/bedienung.js Z. 324–330 nimmt das Nächstliegende, Türen und Werke mit je 30 px.
- Im Überblick liegt die Tür „KiN“ 5 px (800×600), 6 px (1200×800) und 3 px (Handy 375×812) neben dem Bildpunkt des KiNTEGRiTY-Werks.
- Am Handy fallen im Überblick sogar alle vier Türen in den 30-px-Tippkreis dieses Werks.
- Wer dieses Werk antippt, wählt also oft eine Tür.

Warum mittel und nicht schwer:
- Geöffnet wird eine Tür erst beim zweiten Tippen, und sie führt nur zu einer anderen lokalen Anwendung. Es geht nichts verloren, und es wird nichts geschrieben.
- Dass „KiN“ (Satz „KiNTEGRiTY · das Gedächtnis“) gerade in KiNTEGRiTY landet, ist Zufall, keine Absicht. Beim Werkraum passt es inhaltlich gar nicht.
- Echt ist der Befund trotzdem: Ein Rückschritt aus dem neuen Commit vermischt Organe der Mitte und ein Dach genau an der Grenze, die Ralfs bestätigte Ordnung zieht. Am Handy macht er ein Werk im Überblick schwer antippbar.
- Der Vorschlag trifft die Ursache: den Türradius an gapDach koppeln (höchstens Rm + 0,5·gapD) oder den Türbogen in lage() einplanen bzw. in die größte freie Lücke legen.

### bild-netz 7 · Dach FASKA: Namen wechseln die Seite, Bereichsnamen stehen zwischen Werk und Werkname, am Handy fehlen wieder zwei Namen
- **datei:** app/js/haupt.js
- **zeile:** 52
- **schwere:** mittel
- **befund:** Befunde 3, 15 und 24 sind teilweise behoben. Das Hüllraster ist weg, die Bereichsringe sind sichtbar, und am Mac tragen alle 14 FASKA-Werke einen Namen. Neu ist aber: Werknamen weichen wahlweise unter, über oder neben ihr Licht aus. Bereichsnamen werden zuerst gesetzt und nur gegen andere Namen geprüft, nicht gegen Lichter. So steht ein Bereichsname zwischen einem Werk und seinem Namen, Werknamen stehen auf halbem Weg zwischen zwei Lichtern, und ein Bereichsname liegt auf einem Werklicht. Dach → Bereich → Werk ist an diesen Stellen nicht mehr ablesbar. Am Handy stapeln sich Namen aus zwei Bereichen untereinander, und „montessori flow“ und „Klangspiele“ sind wieder namenlos.
- **beleg:** gewebe2-02, Ausschnitt (280–600) × (90–400): „Varianten · Jahreskreise (Net…“ (395,195) steht über „Schuldokumentation“ (412,211). Die zugehörige Sichel kommt erst darunter (360,230), direkt unter ihr steht „Lernpfad · Codex-Linie“, so liest sich die Sichel als Lernpfad. „Lernpfade“ (355,287) steht zwischen zwei Lichtern, „Lernlandschaft“ seitlich. „MUSiC · Klangwelten“ (490,121) liegt auf dem Licht bei (528,128), direkt darüber steht „Let the Music Play · Jugend“. gewebe2-13: Stapel aus „Let the Music Play“ (MUSiC), „Varianten · Jahreskreise (Net…“, „Schuldokumentation“ und „Lernlandschaft“; die Sichel liegt auf „Schuldokumentation“. Nur 12 von 14 Namen sind zu sehen. Code: haupt.js Z. 50 (Bereich: [[0,4],[0,20]]), Z. 52 (Werk: unter, über, rechts, links), Z. 42 (frei() prüft nur Namensrechtecke). „(Net…“ entsteht aus dem Titel „FASKA Varianten · Jahreskreise (Netz) · Vergleich“ durch kurz(…, 30).
- **vorschlag:** Eine Regel: Der Werkname steht immer unter seinem Licht. Ist der Platz belegt, wird der Name kleiner oder erscheint erst beim Darauf-Zeigen, statt die Seite zu wechseln. Bereichsnamen außen über ihren Ring setzen, nicht innen zwischen die Werke. In frei() auch Werklichter (U.monde mit Bildradius) als belegt führen. Titel an einer Wortgrenze kürzen, etwa zu „Varianten · Jahreskreise“.
- **Gegenprüfung:** echt, Schwere mittel: Widerlegen ließ sich der Befund nicht. Er stimmt im Bild und im Code. Ein Teil davon ist eine messbare Verschlechterung gegenüber 26356a7. Nur der Teil über das Handy ist schwächer, als er klingt.

**Code (Stand 35c59bc)**
- `haupt.js` Z. 38/40: Die Bereichs-Spans stehen vor den Werk-Spans, die Bereichsnamen werden also zuerst gesetzt.
- Z. 50: Lagen `[[0,4],[0,20]]` am Anker `amRing(b.mitte,b.R,false,0.08)` (`netz.js` Z. 149), also innen am oberen Ringrand.
- Z. 52: Werknamen weichen in der Reihenfolge unter, über, rechts, links aus.
- Z. 42: `frei()` prüft nur das Feld `belegt`, und darin stehen nur Namensrechtecke, keine Lichter.
- `stil.css` Z. 62: Nur `opacity` hat eine Transition. Ein Lagewechsel ist deshalb ein Sprung.

**Bild gewebe2-02 (vergrößert) und Nachrechnung**
Die Nachrechnung nutzt regie, setCamera und baueNetz auf `kette-gewebe/state.json`. Gerechnet ist mit 1200×900, im Bild ×0,667. Sie trifft das Standbild bei netZeit ≈ 15 s:
- „Lernpfad · Codex-Linie“ (Licht 426/266) steht über seinem Licht, auf y 241. Das ist direkt unter der Sichel von „Varianten · Jahreskreise“ (Licht 404/225).
- Deren eigener Name ist über „Schuldokumentation“ ausgewichen (y 193 gegen 205).
- „Lernpfade“ steht über seinem Licht. Es ist 19 px vom Licht „Lernlandschaft“ entfernt und 21 px vom eigenen.
- „Lernlandschaft“ steht rechts von seinem Licht, genau unter dem Licht von Codex-Linie.
- Liest man „Name unter Licht“, dann tragen drei Lichter der Schuldokumentation den falschen Namen.
- „MUSiC · Klangwelten“ endet etwa 6 px über dem Licht von „Jugend“. „Liegt auf“ ist am Mac leicht übertrieben.

**gewebe2-13**
Das Bild entspricht der Nachrechnung bei 375×812 mit t ≈ 10:
- „montessori flow“ und „Klangspiele“ schweigen, 12 von 14 Namen sind zu sehen.
- „Let the Music Play“ steht links von seinem Licht, also über „Varianten · Jahreskreise“, das wiederum über „Schuldokumentation“ steht.
- Die Sichel liegt im Rechteck des Bereichsnamens.

**Ein ganzer Kameraumlauf (131 Bilder, alt gegen neu)**
| Messung | Mac alt | Mac neu | Handy alt | Handy neu |
|---|---|---|---|---|
| Bereichsname auf Werklicht | in 0 Bildern | in 30 Bildern | 0,73 je Bild (68 Bilder) | 2,28 je Bild (121 Bilder) |
| fremder Name direkt unter einem Licht | 0,80 je Bild (62 Bilder) | 1,36 je Bild (89 Bilder) | 5,37 je Bild | 5,95 je Bild |
| schweigende Namen im Mittel | 2,8 | 0,1 | 7,6 | 4,5 |

Am Handy liegen also in 92 % der Bilder Bereichsnamen auf Werken. Am häufigsten sind „FLOW · Lernspiele“ auf „montessori flow“ und „MUSiC · Klangwelten“ auf „Jugend“, je in 47 Bildern.

Dazu kommt: Die Kamera dreht im Dach mit 0,012 rad/s weiter (`regie.js` Z. 22). Deshalb springen die Namen von Lage zu Lage. „Lernpfade“ zum Beispiel wechselt etwa alle 20–30 s zwischen unter und über, ein Sprung von rund 60 px.

**Was nicht trägt**
- „Am Handy fehlen wieder zwei Namen“ ist keine Verschlechterung. Im Mittel schweigen jetzt 4,5 statt 7,6 Namen. Das Schweigen ist die vorgesehene Rückfallregel.
- Dass Namen bloß der Nähe nach falsch zuzuordnen sind, gab es im dichten Cluster auch vorher.

**Ergebnis**
Echt und folgenreich sind zwei Dinge, und beide hat erst die Umsetzung von Befund 24 gebracht:
1. Die Bereichsnamen innen stehen ungeprüft auf den Lichtern.
2. Die Ausweichlagen der Werknamen lassen sich nach der Regel „Name unter Licht“ falsch lesen.

Beides trifft Dach → Bereich → Werk im FASKA-Dach. Die Bedienung bricht nicht, darum bleibt die Schwere mittel.

Die Skripte liegen hier:
- /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/widerlegung-namenseite/namen.mjs
- /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/widerlegung-namenseite/regel.mjs
- /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/widerlegung-namenseite/bereich-deckt.mjs
- /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/widerlegung-namenseite/umlauf.mjs

### bild-stoff 1 · Faden-Marke verspricht eine Stelle, die es nicht gibt
- **datei:** app/js/bedienung.js
- **zeile:** 94
- **schwere:** mittel
- **befund:** Die Marke sagt „tippen liest die Stelle“, sobald die Verwendung ein to_part hat. Ob verorte() den Teil im Wortlaut findet, prüft sie nicht. Genau der Faden in gewebe2-11 (Émile Durkheim → Alfred Radcliffe-Brown) hat für beide Verwendungen keinen Fund. Tippen öffnet den Leseraum dann oben am Textanfang. Die erklärende Verwendung liegt zugeklappt ganz am Ende unter „ohne Fundstelle im Wortlaut“. Der ehrliche Satz „Den genannten Teil gibt es so nicht im Wortlaut.“ (haupt.js:211) ist im offenen Leseraum unsichtbar, siehe den Befund zur Bildzeile. Bild 2-10 zeigt einen anderen Faden (Genealogical Spiral), den einzigen der Testkette, der eindeutig landet. Die Folge 2-11 → 2-10 legt also einen Weg nahe, den der gezeigte Faden nicht hat. Befund 20 der ersten Kritik ist damit nur teilweise behoben: Leseraum, Teilnennung und Rückweg sind da, aber das Versprechen stimmt nicht.
- **beleg:** Bild gewebe2-11, Marke: „Verbindung 1 von 3 · ←/→ wählt · „Arbeitsteilung: …“ → „Strukturfunktionalismus: Institutionen und Stabil…“ … tippen liest die Stelle“. Rechnung /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/leseraum/faeden-ziel.mjs gegen testdaten/kette-gewebe/state.json, 5 werkübergreifende Fäden mit Verwendung, jeweils erste Kante: Durkheim→Radcliffe-Brown NICHT im Wortlaut (Kante 2 ebenso), Ein Inhalt→Durkheim (prüft) NICHT im Wortlaut, →KiNTEGRiTY „Grundfassung“ ×2 und →gedankenspirale ×4 (beide nur „ungefähr hier“), nur →Genealogical Spiral eindeutig. Im Quelltext von Radcliffe-Brown kommt „Institutionen und Stabilität“ nicht vor. Code: bedienung.js:94 `u && u.to_part ? 'tippen liest die Stelle' : 'tippen folgt'`, verortet wird erst beim Folgen in haupt.js:207–211.
- **vorschlag:** In markeFuer verorte(u.to_part, materialParagraphs(ziel.content)) einmal je Kante zwischenspeichern und den Fund ehrlich benennen. „tippen liest die Stelle“ nur bei eindeutigem Fund, „tippen liest ungefähr dort“ bei mehrfachem Fund oder nur Abschnitt, sonst „der Teil steht so nicht im Wortlaut · tippen öffnet die Fassung“. In netz.js:75 die Kanten eines Bündels nach Fundgüte sortieren (eindeutig > ungefähr > ohne Fund > ohne Verwendung). Bei Ankunft ohne Fund die zugehörige Verwendung oben im Leseraum als leise Zeile zeigen. 2-10 und 2-11 mit demselben Faden neu aufnehmen.
- **Gegenprüfung:** echt, Schwere mittel: Ich konnte den Befund nicht widerlegen. Code, Rechnung und Bild stimmen überein.

Code (Stand 35c59bc):
- bedienung.js:94 setzt `u && u.to_part ? 'tippen liest die Stelle' : 'tippen folgt'`. Die Marke fragt also nur, ob ein to_part vorhanden ist, nicht ob verorte() ihn findet.
- Verortet wird erst beim Folgen, in haupt.js:207. Ohne Fund ruft haupt.js:209 `stoff.oeffne` mit `stelle: null` auf. stoff.js `springe(null)` setzt dann `scrollTop = 0`: Der Leseraum öffnet oben, und keine Passage ist markiert.
- Der ehrliche Satz in haupt.js:211 („Den genannten Teil gibt es so nicht im Wortlaut.“) läuft über `B.zeile` in `#line`. stil.css:270 blendet `.im-stoff #line` mit `visibility:hidden` aus.
  - Ohne reduzierte Bewegung erscheint die Zeile nach 420 ms, und der Leseraum öffnet nach 1300 ms. Der Satz steht also knapp 0,9 s während des Flugs da.
  - Mit W.RM laufen beide Timeouts mit 0 ms. `lesen` ist zuerst registriert, also ist `im-stoff` schon gesetzt, bevor der Text kommt: Der Satz ist nie zu sehen.
  - Zusätzlich überschreibt `stoff.oeffne` die Ansage mit „Material: … Escape führt zurück“.
- Die passende Verwendung landet in stoff.js baueLesen unter `lose`, also zugeklappt nach „Das Material endet hier.“ in „N Verwendungen ohne Fundstelle im Wortlaut“.

Rechnung: verorte() habe ich mit der echten Fassung aus stoff.js:49 nachgerechnet, gegen testdaten/kette-gewebe/state.json. Für testdaten/kette-claude/state.json kommt dasselbe heraus.
- Durkheim→Radcliffe-Brown: Kante 1 („Strukturfunktionalismus: Institutionen und Stabilität“) und Kante 2 („Institutionen und ihr Beitrag zur Stabilisierung sozialer Struktur“) haben keinen Fund. Kante 3 hat keine Verwendung.
- Die Zielfassung „Quellfassung“ hat 21 Passagen und keine Überschriften. „Institution…“ und „Stabil…“ kommen nur verstreut vor. Der to_part ist eine Paraphrase und kein Zitat.
- Bei „Ein Inhalt → Durkheim (prüft)“ haben beide Kanten keinen Fund.
- Nur „→ Genealogical Spiral“ landet eindeutig (Passage 1, ×1).
- „KiNTEGRiTY“ (×2) und „gedankenspirale“ (×4) landen nur „ungefähr hier“. Dort benennt die Ankunft die Unschärfe immerhin über `.passage.ungefaehr .nr::after`.
- Skript: /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/widerlegung-fadenmarke/ziel.mjs

Bild:
- gewebe2-11 zeigt genau diesen Faden: „Verbindung 1 von 3“, „Arbeitsteilung: mechanische und organische Solida…“ → „Strukturfunktionalismus: Institutionen und Stabil…“ und am Ende „tippen liest die Stelle“.
- gewebe2-10 zeigt dagegen den einzigen eindeutig landenden Faden (Belegte gehostete Fassung in Genealogical Spiral, Passage 1 markiert). Die Bildfolge belegt also einen Weg, den der gezeigte Faden nicht hat.

Folge: Die Marke verspricht eine Präzision, die der Code nicht prüft. Das widerspricht dem eigenen Grundsatz in stoff.js:47 („Keine erfundene Präzision“). Betroffen sind zwei von fünf werkübergreifenden Fäden mit Verwendung, darunter der abgebildete. Befund 20 der ersten Kritik hatte nur den nicht wörtlichen Fund bedacht („ungefähr hier“). Für den Fall „gar kein Fund“ fehlt die Ankunft noch immer: Man landet ohne Hinweis am Textanfang einer 21-Passagen-Fassung.

Warum nicht schwer: Keine harte Projektregel ist verletzt. Die richtige Fassung öffnet sich, und der Rückweg zum Faden funktioniert. Es geht um eine irreführende Zusage und einen unsichtbaren Hinweis, nicht um Datenverlust oder Bruch.

Belegstellen: app/js/bedienung.js:94, app/js/haupt.js:207-211, app/js/stoff.js:49-58, app/js/stoff.js:330-342, app/js/stoff.js:437, app/stil.css:270.

### bild-stoff 2 · Meldungen im Leseraum gehen in die verborgene Bildzeile
- **datei:** app/stil.css
- **zeile:** 270
- **schwere:** mittel
- **befund:** Im Leseraum ist #line mit `.im-stoff #line{…visibility:hidden}` ausgeblendet. Leseraum und Faden-Weg melden sich aber über hilfe.zeile bzw. B.zeile genau dorthin. Das hat drei Folgen:
(a) Ankunft über einen Faden ohne Fund: „Den genannten Teil gibt es so nicht im Wortlaut.“ wird nach 1,3 s vom Leseraum verdeckt. Bei reduzierter Bewegung erscheint der Satz nie, weil setTimeout(lesen, 0) vor dem Zeilen-Timeout feuert.
(b) Ein Tipp auf eine Passagennummer überschreibt still die Zwischenablage. Die Bestätigung „Stelle gemerkt. Der Absatz liegt in der Zwischenablage.“ sieht niemand.
(c) „Vergleichen“ ohne möglichen Partner: Der Hinweis „Für diese Fassung gibt es noch keine zweite zum Vergleichen.“ bleibt unsichtbar, der Knopf scheint nichts zu tun.
Auch ein Bildschirmleser bekommt nichts angesagt, weil die Live-Region per visibility:hidden versteckt ist.
- **beleg:** stil.css:270 (`.im-stoff #line … visibility:hidden`). stoff.js:264 (Passagennummer → clipboard.writeText + hilfe.zeile), stoff.js:201 (Vergleichen ohne Vorschlag → hilfe.zeile). haupt.js:210–211 (setTimeout(lesen, W.RM ? 0 : 1300), danach B.zeile). bedienung.js:28–32 (zeile() schreibt nach 420 ms bzw. 0 ms in #line). In gewebe2-08 und gewebe2-10 steht unten nur die ⌘V-Fußzeile, eine Bildzeile ist nicht zu sehen.
- **vorschlag:** Im Leseraum eine eigene leise Meldezeile mit aria-live einrichten, z. B. in .stoff-fuss oder unter .stoff-her, und hilfe.zeile bei offenem Leseraum dorthin leiten. Die Faden-Ankunft ohne Fund zusätzlich als bleibende Zeile über dem Text zeigen: „Der Faden nennt „…“; das steht so nicht im Wortlaut.“
- **Gegenprüfung:** echt, Schwere mittel: Widerlegung gescheitert. Der Befund hält, vor allem Teil (a), und der ist mit diesem Commit neu entstanden.

Code-Beleg
- stil.css:270 setzt bei `.im-stoff` #line auf `visibility:hidden`.
- #line ist die einzige Live-Region dieser Meldungen (index.html:20, `aria-live="polite"`). Was per visibility versteckt ist, fällt aus dem Barrierebaum, ein Bildschirmleser sagt es also nicht an. Die Stoff-Ansage über #ansage (stoff.js:86) nennt nur „Material: … Escape führt zurück“.

(a) Faden-Ankunft ohne Fund, neu in 35c59bc
- folgeFaden (haupt.js:201–212) gab es in 26356a7 nicht. In haupt.js:210 wird `setTimeout(lesen, W.RM ? 0 : 1300)` geplant, danach in haupt.js:211 `B.zeile(…)`. bedienung.js:28–32 setzt den Text nach 420 ms bzw. 0 ms.
- Ohne reduzierte Bewegung erscheint der Satz bei 420 ms. Er blendet über 1,2 s ein und ist dabei bis 1 s unscharf (stil.css:39). Bei 1300 ms öffnet der Leseraum und versteckt ihn sofort. Der Satz steht also unter 0,9 s halb eingeblendet und unscharf da.
- Bei W.RM laufen beide Timeouts mit 0 ms, und zwar in der Reihenfolge, in der sie geplant wurden: lesen öffnet den Leseraum zuerst, der Satz wird danach ins verborgene #line geschrieben. Er ist nie zu sehen.
- Die Bedingung `U.netT > 0.5` blockiert das nicht, weil oeffneMond in haupt.js:115 `U.netT = 0` setzt. Danach überschreibt nichts die Zeile: titelBis greift bei `U.lese` nicht (haupt.js:460).

Rechnung (Skripte in /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/kanten-liste.mjs und /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/faeden-ohne-fund.mjs)
- testdaten/kette-gewebe hat 7 werkübergreifende Faden-Kanten mit to_part. Bei 4 davon findet verorte() den genannten Teil nicht.
- Darunter ist genau der Faden aus gewebe2-11: Émile Durkheim → Alfred Radcliffe-Brown, „Strukturfunktionalismus: Institutionen und Stabilität“.
- Die Marke dort verspricht „tippen liest die Stelle“ (bedienung.js:93; das gilt für jede Kante mit to_part, ob der Teil gefunden wird oder nicht). Tatsächlich öffnet der Leseraum oben ohne Lesestelle, und die einzige Erklärung bleibt unsichtbar.

Abmilderung
- baueLesen führt die Verwendung am Ende in zugeklappten Details: „N Verwendungen ohne Fundstelle im Wortlaut“. Die Information geht also nicht ganz verloren.
- Sie erklärt aber weder die Ankunft noch das gebrochene Versprechen.

(b) und (c) bestehen schon seit 26356a7
- Die alten Stellen sind stoff.js:122 und :172 sowie stil.css:267 in 26356a7. Die Ursache ist dieselbe, und sie sind im heutigen Stand weiterhin echt.
- Zu (b): Ein Tipp auf die Nummer überschreibt still die Zwischenablage. Sehende bekommen nur die Markierung angezeigt, nicht den Hinweis auf die Zwischenablage. Ein danach erwartetes ⌘V-Einwerfen bringt dann den eigenen Absatz.
- Zu (c): Ist vorschlag() null, baut baue() denselben Lesezustand neu auf. Der Knopf wirkt wirkungslos.

Schwere bleibt mittel: Es geht um Orientierung und Barrierefreiheit, Daten gehen nicht verloren, und der Weg zurück funktioniert.

### bild-stoff 3 · Der einzige Rückweg verblasst beim Lesen auf etwa 1,8 : 1
- **datei:** app/stil.css
- **zeile:** 34
- **schwere:** mittel
- **befund:** „← zur Zelle“ bzw. „← zurück zum Faden im Netz“ im Leseraum hat die Klasse .ort und fällt damit unter `.dim .ort{opacity:.45}`. uiFrame setzt dim nach 3,2 s ohne activity(). Im Leseraum ruft aber nichts activity() auf: Bei offenem Leseraum kehrt der Tastendruck vor activity() zurück. Zeiger- und Rad-Ereignisse hängen am Canvas, das der Leseraum überdeckt, und Rollen in .stoff-flaeche zählt nicht. Wer liest, sieht den Rückweg nach drei Sekunden nur noch als Schatten. Das trifft auch den neuen Weg vom Faden in die Passage, auf dem „zurück zum Faden im Netz“ die Orientierung trägt. Rechnung: ink-soft .5 × .45 ergibt Alpha .225, auf ≈#050409 sind das ≈1,8 : 1 (ohne Dimmen 5,0 : 1). Das ist derselbe Wert, den die erste Kritik als unlesbar bestätigt hat.
- **beleg:** Hellste Pixel der Rückweg-Zeile, in Graustufen gemessen: gewebe2-08 120 (fast wie die ink-soft-Zeile darunter mit 133), gewebe2-09 54, gewebe2-10 65, gewebe2-14 54, also auf etwa 45 % gedimmt. Code: stil.css:34, index.html:72 (`class="stoff-zurueck ort"`), bedienung.js:431 (`if(stoff.offen()){ … stoff.taste(e); return; }` steht vor activity() in Z. 461), bedienung.js:552 (dim nach 3,2 s).
- **vorschlag:** `.dim .ort:not(.stoff-zurueck)` schreiben oder `.im-stoff .stoff-zurueck{opacity:1}` ergänzen. Zusätzlich Zeiger und Rollen im #stoff als activity() zählen.
- **Gegenprüfung:** echt, Schwere mittel: Ich habe versucht, den Befund zu widerlegen. Es ist mir nicht gelungen: Er stimmt im Code, in der Rechnung und im Bild.

Code (Arbeitskopie spiralcells-lichtwerk-gewebe, Stand 35c59bc):
- Der Rückweg im Leseraum ist `<button class="stoff-zurueck ort">` (app/index.html:72). Damit greift `.dim .ort{opacity:.45}` (app/stil.css:34).
- Eine Ausnahme gibt es nur für die Formen: `.dim .formen-zurueck{opacity:1}` (stil.css:191). Für `.stoff-zurueck` fehlt sie. `.im-stoff` blendet viel aus (stil.css:270), hebt das Dimmen des Rückwegs aber nicht auf.
- uiFrame setzt `dim` nach 3,2 s ohne activity() (bedienung.js:552). uiFrame läuft auch bei offenem Leseraum in jedem Bild weiter (haupt.js:512).
- Im Leseraum ruft nichts activity() auf:
  - Bei offenem Leseraum gibt der keydown-Handler die Taste an stoff.taste weiter und kehrt sofort zurück (bedienung.js:431). Das activity() in Z. 461 wird nie erreicht.
  - Zeiger, Rad und Pointermove hängen nur am Canvas (bedienung.js:390–423). Der Leseraum liegt als `.stoff{position:fixed;inset:0;z-index:25}` darüber.
  - stoff.js importiert activity nicht. Der scroll-Handler beimRollen (stoff.js:438) merkt sich nur die Lesestelle. Die Knöpfe im Leseraum hören nur auf click, ohne activity.
- Hover und Fokus ändern nur die Farbe (`.ort:hover,.ort:focus-visible{color:var(--ink)}`), die Deckung bleibt bei .45. Auch mit Hover kommt der Rückweg also nur auf etwa 3 : 1.

Rechnung (/private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/kontrast-rueckweg.mjs):
- Die Farbe ist ink-soft, rgba(255,246,224,.5).
- Auf #050409 bzw. --void #04030a ergibt das ohne Dimmen 5,0 : 1.
- Mit dem Faktor .45 sind es 1,81 bis 1,82 : 1. Auf etwas hellerem Grund (12,10,18) sind es 1,90 : 1.
- Das liegt klar unter 3 : 1 für Bedienelemente und 4,5 : 1 für Text. Die erste Kritik hat 1,8 : 1 schon als „kaum lesbar“ bestätigt.

Bild:
- gewebe2-08 ist offenbar kurz nach dem Öffnen aufgenommen, noch ohne Dimmen. Dort ist „← zur Zelle“ etwa so hell wie die ink-soft-Zeile „in ‚Ein Inhalt, viele Verwendungen‘“.
- In gewebe2-09, gewebe2-10 und gewebe2-14 (Handy) ist der Rückweg sichtlich schwächer als genau diese ink-soft-Zeile.
- Am deutlichsten ist gewebe2-10: „← zurück zum Faden im Netz“ ist neben „Ausgangsfrage · 12. Okt.“ nur noch ein Schatten.
- Dass das Dimmen von der Zeit abhängt, passt genau zum Mechanismus.

Einschränkung:
- Der Fehler ist nicht neu. stil.css:34 und die Klasse `stoff-zurueck ort` gab es schon in 26356a7 (dort stil.css:34 und index.html:71).
- Mit 35c59bc ist der Weg vom Faden in die Passage dazugekommen. Dort sagt der Text des Rückwegs („zurück zum Faden im Netz“, haupt.js:161/175), wohin man zurückkehrt. Gerade dieser Text verblasst.
- Am Handy gibt es keine Escape-Taste. Dort ist dieser Knopf der einzige sichtbare Weg zurück, und auch Tippen im Leseraum hebt das Dimmen nicht auf.
- Bedienbar bleibt der Knopf: Die Deckung ändert nichts an pointer-events, und Escape funktioniert am Rechner. Deshalb setze ich nicht „schwer“ an, sondern bleibe bei „mittel“.

Behebung:
- Am kleinsten ist `.dim .stoff-zurueck{opacity:1}`, analog zu stil.css:191.
- Alternativ kann der Leseraum Zeiger und Rollen als activity() zählen.

### bild-stoff 4 · Bündel-Verbindungen nur per Pfeiltaste: am Handy falsche Anweisung und kein Weg
- **datei:** app/js/bedienung.js
- **zeile:** 91
- **schwere:** mittel
- **befund:** Die Marke zeigt „Verbindung 1 von 3 · ←/→ wählt“ auch am Touchgerät, es gibt keinen W.touch-Zweig. Das ist derselbe Fehlertyp wie die ⌘V-Zeile am Handy aus der ersten Kritik. U.fadenK ändert sich nur im keydown-Zweig. Am Handy führt Tippen daher immer in Verbindung 1, Verbindung 2 bis n sind vom Netz aus nicht erreichbar. Ein Tipp auf die Marke selbst, die „tippen liest die Stelle“ verspricht, wählt nur erneut (`waehle(s, 2)`) und folgt nicht. Zurück aus dem Leseraum steht die Marke wieder auf „Verbindung 1“: Der Rückweg merkt sich die gewählte Verbindung nicht, und waehle() setzt fadenK auf 0. Befund 20 ist damit nur für die Tastatur behoben.
- **beleg:** bedienung.js:91 (`' · ←/→ wählt'` ohne Touch-Prüfung). bedienung.js:444–445 sind die einzige Stelle, die U.fadenK ändert (ArrowLeft/ArrowRight). bedienung.js:364 (Tippen folgt mit U.fadenK || 0). bedienung.js:485 (Klick auf die Marke → waehle(s, 2)). haupt.js:204 (`dahin` speichert k nicht). haupt.js:147 zusammen mit bedienung.js:279 (U.fadenK = 0 beim Zurückwählen). Bild gewebe2-11 zeigt den Markentext.
- **vorschlag:** Am Touchgerät „←/→ wählt“ weglassen und eine Geste anbieten: Ein Tipp auf „Verbindung 1 von 3“ in der Marke schaltet weiter, ein Tipp auf den übrigen Markentext folgt wie der Knoten. Die gewählte Verbindung im Rückweg speichern (`dahin.k`) und beim Zurückwählen wieder setzen.
- **Gegenprüfung:** echt, Schwere mittel: Ich konnte den Befund nicht widerlegen. Alle Belege stimmen am Stand 35c59bc, und der Fehler kommt mit diesem Commit neu hinzu (siehe git diff 26356a7 35c59bc -- app/js/bedienung.js).

1. Die Anweisung „←/→ wählt“ erscheint auch am Handy. In app/js/bedienung.js:91 steht `' · ←/→ wählt'` ohne Abfrage von W.touch. W.touch gibt es (haupt.js:585/588: matchMedia('(pointer: coarse)')), und bedienung.js:224 nutzt es schon für den ⌘V-Ersatz. Das ist derselbe Fehlertyp wie bei den Befunden 9 und 14 der ersten Kritik, die dort als „mittel“ bestätigt wurden. Bild gewebe2-11 zeigt den Text „Verbindung 1 von 3 · ←/→ wählt“; das Bild stammt vom Desktop, der Code zeigt denselben Text am Handy.

2. Am Handy gibt es keinen Weg zu den Verbindungen 2 bis n. U.fadenK wird nur an zwei Stellen gesetzt: im keydown-Zweig bei bedienung.js:444–445 hochgezählt und in waehle() bei Z. 279 auf 0 gesetzt. Jeder Faden hat genau ein Trefferziel (bedienung.js:329, ein Knoten je Faden). Das Tippen bei Z. 364 folgt deshalb immer mit k = 0. Ein Klick auf die Marke (Z. 485) landet für einen Faden im else-Zweig `waehle(s, 2)`. waehle() öffnet für einen Faden keinen Leseraum (Z. 288 gilt nur für same/keim), der Klick wählt also nur erneut und folgt nicht. Dabei ist die Marke mit cursor:pointer als anklickbar gestaltet (stil.css:54).

Nachgerechnet mit /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/buendel-kanten.mjs, das die Bündelung aus netz.js:69–75 nachbaut. Kette-gewebe und kette-claude ergeben dasselbe: Von 30 Fäden haben 6 mehr als eine Kante, zusammen 13 Kanten. 7 davon erreicht man vom Netz aus nur mit der Tastatur. Zwei Fälle wiegen schwerer, weil dort eine Verwendung mit Fundstelle verloren geht: „Émile Durkheim → Alfred Radcliffe-Brown“ (3 Kanten, 2 mit usage) und „Ein Inhalt, viele Verwendungen → Émile Durkheim“ (testet, 2 Kanten, beide mit usage). Die jeweils zweite Passage ist am Handy vom Faden aus nicht erreichbar. Damit gilt Befund 20 („bis in die Passage, mehrere Kanten wählbar“) am Touchgerät nur für die erste Kante.

3. Der Rückweg merkt sich die gewählte Verbindung nicht. Das Objekt `dahin` in haupt.js:204 speichert kein k. Beim Zurückgehen ruft zurueck() bei haupt.js:146 zuerst zumNetz() auf, und das wählt den Mond (Z. 138). Danach wählt Z. 147 den Faden. In waehle() ist U.sel dann kein Faden, deshalb setzt Z. 279 U.fadenK auf 0, und die Marke zeigt wieder „Verbindung 1“. Das ist richtig beobachtet, wiegt aber leicht, weil es auch an der Tastatur nur einen erneuten Tastendruck kostet.

Warum nur „mittel“: Die anderen Kanten sind nicht ganz verloren. Im Leseraum der Fassung tauchen sie weiter als Gegenüber und als Verwendungen auf (stoff.js:157–162 kandidaten()). Es fehlt der direkte Weg vom Netz aus, und am Handy steht eine Anweisung, die man dort nicht ausführen kann. Keine harte Projektregel wird verletzt. Der Kern des Vorschlags lässt sich ohne Formular umsetzen: am Handy „←/→ wählt“ ausblenden und dafür eine Tippgeste anbieten (Tipp auf „Verbindung k von n“ schaltet weiter), dazu `dahin.k` speichern und beim Zurückgehen wieder setzen.

### bild-stoff 5 · Am Handy stehen wieder Beziehungen vor dem Material
- **datei:** app/stil.css
- **zeile:** 392
- **schwere:** mittel
- **befund:** Am Mac ist Befund 8/14 behoben: Der Text kommt zuerst, Verwendungen ohne Fundstelle stehen zugeklappt am Ende, die Ziffern sind weg, die ⌘V-Zeile ist am Touch aus, und die Ränder fließen neben den Text. Am Handy rutscht der Rand aber unter die Passage, weil randFliessen bei zwei Spalten absichtlich nicht greift. Ist die erste Passage nur eine Überschrift, stehen zwei volle Notizkarten von je 5–6 Zeilen zwischen Überschrift und erstem Absatz. Der Fließtext beginnt dann erst bei etwa 72 % des ersten Bildschirms, später als die 60 %, die Befund 8/14 bemängelt hatten. Beide Notizen hängen nur wegen des Wortes „Befund“ in der Überschrift an Passage 1 (from_part „Befund“).
- **beleg:** gewebe2-14 (225×487): Überschrift „Befund der Systemleitung (18.10., 14:20)“ bei y≈152, zwei Karten „verweist auf …“ bei y≈170–345, erster Absatz „Die bestehende Lebens- und Zeitspirale …“ ab y≈352 (72 %). Code: stil.css:392 (`.stoff-text .rand{grid-column:2}` unter 900 px), stoff.js:274 (Rand direkt nach dem Körper), stoff.js:282 (randFliessen bricht bei weniger als 3 Spalten ab). Verortung nachgerechnet mit anker.mjs (gleicher Ordner): from_part „Befund“ → Passage 1, wörtlich, einmal.
- **vorschlag:** Unter 900 px die Notizen einer Passage zu einer leisen aufklappbaren Zeile „2 Verwendungen an dieser Stelle ▸“ zusammenfassen. Ist die Passage nur eine Überschrift oder kürzer als etwa eine Zeile, diese Zeile hinter die nächste Textpassage setzen.
- **Gegenprüfung:** echt, Schwere mittel: Ich konnte den Befund im Kern nicht widerlegen. Er ist belegt und reicht sogar weiter, als der Prüfer schreibt. Zwei Punkte sind ungenau, am Urteil ändern sie nichts.

Code (Stand 35c59bc, alle Stellen nachgesehen):
- stil.css:392 setzt unter 900 px `.stoff-text .rand{grid-column:2}`. Bei den Spalten `30px minmax(0,1fr)` (Z. 391) rutscht der Rand deshalb in eine eigene Zeile unter den Körper der Passage.
- stoff.js:274 hängt alle Notizen ohne Obergrenze in diesen Rand.
- stoff.js:282 bricht randFliessen ab, wenn das Raster weniger als drei Spalten hat. Am Handy fließt also nichts neben den Text, die Notizen stehen zwischen Passage 1 und Passage 2.

Bild gewebe2-14 (225×487): Ich habe die Helligkeit Zeile für Zeile gemessen.
- Die Titelzeile „Befund der Systemleitung (18.10., 14:20)“ steht bei y≈148–155.
- Die zwei Karten „verweist auf …“ liegen bei y≈165–340, das sind rund 36 % des Schirms.
- Die erste Zeile Fließtext beginnt bei y≈348, also bei 71 %. Die Zahl des Prüfers stimmt.

Verortung nachgerechnet (widerlegung-handyrand/anker.mjs, Logik wörtlich aus stoff.js:49–58): Beide Verwendungen mit dem Teil „Befund“ landen auf Passage 0, wörtlich, einmal.

Es ist kein Einzelfall. haeufig.mjs (gleicher Ordner) zählt in kette-gewebe und kette-claude dasselbe:
- 21 Fassungen tragen Randnotizen.
- Bei 16 davon hängen sie an einer kurzen Passage unter 80 Zeichen, auf die noch Text folgt.
- Bei 13 ist das die Titelzeile, also Passage 1.

Der schwerste Fall ist die Wurzel des Werks, „Bauauftrag · Aufteilung im Verbund“:
- Alle zehn eingehenden Verwendungen mit dem Teil „Aufteilung“ hängen an der Titelzeile „Ein Inhalt, viele Verwendungen — Aufteilung im Verbund“.
- Am Bild gemessen braucht eine Karte samt Abstand etwa 146 CSS-px (292 px für zwei).
- Zehn Karten ergeben damit rund 1.300–1.450 CSS-px. Bei 812 px Höhe abzüglich etwa 235 px Kopf und Faden sind das mehr als zwei volle Bildschirme Notizen vor dem ersten Satz.

Das ist genau der bestätigte Kern von Befund 8/14: Beziehungen und Kartenstapel stehen vor dem Material. Das Urteil zu Befund 14 nannte ausdrücklich die Randnotizen von Passage 1 als Ursache. Die Commit-Nachricht sagt „Leseraum: Text zuerst“, behoben ist das aber nur ab 900 px. 375 px ist eine harte Zielgröße des Projekts. Deshalb ist der Befund weder Geschmack noch unerheblich.

Zwei Korrekturen:
- „wieder“ ist falsch, es ist kein Rückschritt. Die Regel unter 900 px stand schon in 26356a7 (dort stil.css:347). Damals stand am Handy zusätzlich der lose Block vor dem Text, der alte Stand war also schlechter. Richtig ist: Die Behebung ist am Handy unvollständig.
- Die 60 % aus Befund 8/14 stammen vom Mac-Bild (gewebe-07). Der Vergleich mit 72 % am Handy mischt also zwei Geräte. Am Mac begann der Fließtext damals sogar erst bei etwa 96 %.

Schwere: mittel. Der Fehler trifft systematisch die meisten Fassungen mit Rand. An der Wurzel des Werks verdrängt er den Text um mehr als zwei Bildschirme.

Der Vorschlag des Prüfers ist sinnvoll. Unter 900 px sollten die Notizen einer Passage als leise, zugeklappte Zeile stehen. Steht sie an einer Titelzeile, gehört sie hinter die erste Textpassage. Ich habe keine Datei im Projekt geändert. Die beiden Rechenskripte liegen unter /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/widerlegung-handyrand/.

### bild-zelle 1 · FASKA Varianten bleibt eine Sichel mit Kettenstrahl und Klumpen (Befund 16 nur teilweise behoben)
- **datei:** app/js/wuchs.js
- **zeile:** 109
- **schwere:** mittel
- **befund:** Der Ausbrenner ist behoben: Der Klumpen oben rechts ist jetzt körnig (höchstens 151/255, vorher 212). Die Gestalt ist aber dieselbe wie in gewebe-06: ein Bogen von etwa 270°, oben rechts abgesetzt ein dichter Klumpen auf einem Punktstrahl vom Keim und unter dem Keim ein heller Strich. Die Ursache aus dem Verdikt zu 16 ist unverändert. Alle 96 Glieder der Kette „Hauptarbeitsraum“ stehen auf genau einem Winkel (254,1°) und tragen 1209 von 2546 Körnern, also 47 %. Geöffnet wurde nur der Netzkopie-Fächer: MAXF = 360° (wuchs.js:109) und reihenLage greifen dort, die Kette erbt aber weiter th1 = c. Von 36 Zehn-Grad-Fächern tragen 20 weniger als 1 % der Körner. Der neue Test „füllt das Feld statt einer Sichel“ (tests/wuchs.test.mjs:58–62) misst nur die th1-Spanne dieses Fächers, nicht die Körner, und ist deshalb grün, obwohl das Bild eine Sichel zeigt. Der helle Strich unter dem Keim (238/255) entsteht aus den 98 übereinanderliegenden Reihen-Stielen zur gemeinsamen freien Wurzel. Die Bildzeile „Material ohne Stimmen. Ein ruhiges Feld.“ widerspricht dem Bild weiterhin.
- **beleg:** gewebe2-07: Klumpen bei (465,170) mit Punktstrahl vom Keim, Lücke zwischen 12 und 2 Uhr, heller Strich bei (386,343) mit 238/255; gewebe-06 zeigt dieselbe Form, runde2-traumfeld eine volle Scheibe. Rechnung: /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/faska.mjs und faska2.mjs (gleicher Ordner) gegen testdaten/kette-gewebe: 10°-Fächer 270° = 1148 Kettenkörner, 300–360° fast leer. Das Nachbild faska-vergleich.png im selben Ordner deckt sich mit dem Standbild.
- **vorschlag:** Wie im Verdikt zu 16 vorgeschlagen: Für stimmlose Werke Rangradius mit Hash-Winkel wie in runde2 statt der Baumwinkel aus wuchs(), oder wenigstens eine Reihe-Kette über die Fläche verteilen, statt jedes Glied auf th1 = c der Eltern festzulegen. Den Test auf die Körnerverteilung umstellen, etwa: kein 10°-Fächer trägt mehr als 15 % der Körner.
- **Gegenprüfung:** echt, Schwere mittel: Ich habe versucht, den Befund zu widerlegen. Es ist nicht gelungen: Er ist belegt und hat Folgen.

Code: Der Commit 35c59bc ändert für stimmlose Werke nur MAXF (wuchs.js:109). Außerdem legt reihenLage (wuchs.js:124–135) große Reihen-Fächer nach Familien an. Die Kette aus Einzelkindern erbt aber weiter th1 = c (wuchs.js:144). Bei knoten.length == 1 fällt der Rand weg (wuchs.js:142), deshalb behält jedes Glied die Spanne der Wurzel.

Unter den drei Wurzeln im Sektor „quelle“ (338°) bekommt der Fächer 97 nach faecherLage das Gewicht 98^0,75 ≈ 31. Die Kettenwurzel 0 bekommt das Gewicht 1 und damit nur etwa 10°. In zelle.js:119 wird die Blattbreite auf bogen = 0,5·spann·R begrenzt. So drängen sich die 1209 Kettenkörner auf den äußeren Rangradien in einen schmalen Strahl. Den Mechanismus hatte das Verdikt zu Befund 16 schon benannt, und er ist unverändert.

Nachgerechnet habe ich mit faska.mjs, faska2.mjs und dem eigenen traumfelder.mjs. Die Kopie in neu/js ist byte-gleich mit 35c59bc. Ergebnisse:
- 96 Glieder stehen auf th1 = 254,10° und tragen 1209 von 2546 Körnern (47 %).
- In den 10°-Fächern 280–300° liegen 472 + 708 = 1180 Körner, also 46 % auf 20°.
- 20 der 36 Fächer tragen weniger als 1 %.
- Der alte Stand 26356a7 hatte 1184 Körner (46,5 %) in denselben 20°. Dort lagen nur 17 Fächer unter 1 %. Die Konzentration ist also praktisch gleich, die leeren Fächer sind sogar mehr geworden.
- Gegen testdaten/kette-claude, also die Daten des Tests, kommt dasselbe heraus: 46 % auf 20°, 20 Fächer unter 1 %.

Der Test in tests/wuchs.test.mjs:58–61 misst nur die th1-Spanne der 98 Fächerkinder (−55° bis 235°, also 290° > 200°). Er ist grün, während das Bild weiter die Sichel zeigt.

Bild (Helligkeit 0–255, mit PIL gemessen):
- gewebe2-07: Klumpen bei (430–505, 145–195) mit Höchstwert 150, in gewebe-06 waren es 208. Der Ausbrenner ist also wirklich behoben.
- Der Strich unter dem Keim (370–400, 330–360) hat einen Höchstwert von 235, gewebe-06 hatte 246.
- Zwischen 12 und 2 Uhr bleibt eine Lücke, über die nur der Punktstrahl zum Klumpen läuft.
- Die Gestalt ist dieselbe wie in gewebe-06: Bogen, Strahl, Klumpen, heller Strich. Die Bildzeile „Material ohne Stimmen. Ein ruhiges Feld.“ widerspricht dem Bild.

Folgen:
- Die Commit-Nachricht behauptet „Übernahmen füllen das Feld“, und der Test bestätigt das scheinbar. Der eigentliche Grund von Befund 16 ist aber nicht angegangen.
- Am Rand: Der Rest des Vorschlags aus dem Verdikt (Hash-Winkel für stimmlose Werke) fehlt. Auch etwa 40 stimmlose Werke mit nur einer Ausprägung, dazu „FASKA Varianten · Jahreskreise“, bleiben deshalb Halbscheiben mit 18–19 von 36 Fächern unter 1 %. Ursache ist quer ≤ π/2 in zelle.js:120. Das trägt den Befund nicht, zeigt aber, dass das Muster über FASKA hinausreicht.

Schwere mittel: Der Ausbrenner ist weg, die Sichel mit Klumpen bleibt, und ein irreführend grüner Test verdeckt das.

Skript: /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/widerlegung-faska/traumfelder.mjs

### bild-zelle 2 · Familiennamen stehen weit weg und benennen den falschen Bogen (Befund 21 teilweise)
- **datei:** app/js/haupt.js
- **zeile:** 74
- **schwere:** mittel
- **befund:** familienNamen() setzt jeden Namen nur in die Richtung des äußersten Familienglieds. Als Abstand dient der Radius des ganzen Feldes (feld + 14 px, Z. 70/74), und das äußerste Korn ist der Kettenklumpen bei 1,04 R. Darum stehen die Namen am Rand und nicht an ihrer Familie:
- „Invaria 2“ (11 Glieder, Mitten bei 0,32 bis 0,35 R) steht rund 100 px entfernt in leerer Fläche.
- „Sonnenjahr“ hat nur 2 Glieder, steht aber links neben dem größten Bogen. Der besteht zwischen 150° und 240° zu etwa 90 % aus Fassungen ohne Familie (rund 300 Körner, etwa „Lerngarten (fastka-lernpfade)“ und die faska-app-bau-Fassungen). Man liest „Sonnenjahr“ deshalb als Namen des Hauptbogens.
- 47 von 98 Fächerkindern haben keinen Namen, weil familieVon (wuchs.js:105) nur den Text vor „ · “ oder „ (“ nimmt.
- „FASKA Lernpfade“ (3, GitHub) steht getrennt von den 8 Fassungen „(fastka-lernpfade)“.
- „FASKA Lernpfade“ und „Google Anti-Gravity“ werden wegen Überdeckung verschwiegen.
- Die Kette „Hauptarbeitsraum“ (der Klumpen, fast die Hälfte des Lichts) bekommt gar keinen Namen.
Die Orientierung, die Befund 21 verlangt hat, ist damit teilweise falsch.
- **beleg:** gewebe2-07: „Sonnenjahr“ bei (190,287) neben dem linken Bogen bei x≈280; „Invaria 2“ bei (530,443), die nächsten Körner liegen um (465,330); „FASKA-EINE-APP“ bei (443,472) unterhalb des Feldes; nur 4 der 6 Familien sind benannt. Rechnung: /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/faska2.mjs (Körner je 30° nach Familie) und faska3.mjs (Familien nach Ordner).
- **vorschlag:** Den Namen an die eigene Familie setzen: Radius aus dem äußersten Glied der Familie plus Abstand, nicht aus dem ganzen Feld. familieVon zusätzlich aus dem Ordner in Klammern ableiten (fastka-lernpfade, faska-app-bau), damit der Hauptbogen einen Namen trägt. Den Zweig „Hauptarbeitsraum“ und die Netzkopie benennen. Familien mit sehr kleinem Anteil nicht vor großen namenlosen Bögen nennen.
- **Gegenprüfung:** echt, Schwere mittel: Ich konnte den Befund nicht widerlegen. Der Kern stimmt im Code, in der Nachrechnung und im Bild. Die Familiennamen täuschen im einzigen Fall, für den Befund 21 sie verlangt hat, eine falsche Zuordnung vor.

CODE (Stand 35c59bc, app/js/haupt.js:69–75): Die Richtung kommt von der äußersten Blattmitte der Familie (mittePos). Der Abstand ist aber der Radius des ganzen Feldes: `x = c[0] + ux * (feld + 14)`. `feld` ist das Maximum über jedes 7. Korn aller Körner (Z. 70). Der eigene Radius der Familie geht nicht ein.

NACHRECHNUNG mit den Modulen von 35c59bc gegen testdaten/kette-gewebe/state.json, Werk „FASKA Varianten · Vergleich“, in Draufsicht:
- Das Feld reicht bis 1,035 R. Das äußerste Korn gehört zur Kette „Hauptarbeitsraum“ (Index 95, art reihe, „TXTLAXY Astra-Korpus-Spirale …“).
- Die Blattmitten der Familien liegen bei 0,32–0,37 R (Invaria 2 mit 11 Gliedern bei 0,32–0,35 R, FASKA-EINE-APP, FASKA Lernpfade) bzw. bei 0,55–0,57 R (Astra, Google Anti-Gravity, Sonnenjahr).
- Abstand vom Namen zum nächsten eigenen Korn, bei feld ≈ 160 px gerechnet: Invaria 2 etwa 120 px, FASKA-EINE-APP 117 px, Lernpfade 108 px, Sonnenjahr 84 px. Im Umkreis von 0,35 R um jede Namensstelle liegt kein einziges Korn.
- Im Keil ±12° um die Richtung von „Sonnenjahr“ liegen 92 Körner von Fassungen ohne Familie und nur 5 von Sonnenjahr. Sonnenjahr hat 2 Glieder und 40 Körner. Im Bogen von 150° bis 210° stehen 299 Körner ohne Familie gegen 19 Sonnenjahr-Körner.
- Von den 98 Fächerkindern haben 47 keine Familie. familieVon (wuchs.js:105) nimmt nur den Text vor „ · “ oder „ (“. Damit wird jede „X (fastka-lernpfade)“- und „X (faska-app-bau)“-Fassung eine Einzelfassung und bleibt ohne Namen.
- Die Kette „Hauptarbeitsraum“ hat 1206 von 2546 Körnern (47 %) und keinen Namen. familienNamen benennt nur Blöcke aus W.familie, und die setzt allein reihenLage im Fächer.
- Befund 21 hatte ausdrücklich verlangt, die beiden Zweige zu benennen. Das ist nicht umgesetzt.
- Rechnung: /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/widerlegung-fam/lage.mjs und strahl.mjs.

BILD gewebe2-07:
- „Sonnenjahr“ steht bei x 163–220, y 287 links neben dem großen linken Bogen (x ≈ 280). Dieser Bogen besteht der Rechnung nach fast ganz aus Fassungen ohne Familie.
- „Invaria 2“ (507,443) und „FASKA-EINE-APP“ (443,472) stehen in leerer Fläche unter dem Feld, gut 100 px von den nächsten Körnern.
- Sichtbar sind 4 von 6 Namen. Google Anti-Gravity (6 Glieder, 121 Körner) und FASKA Lernpfade fehlen.

Die Bildzeile lautet „Material ohne Stimmen. Ein ruhiges Feld.“. Es handelt sich also nicht um einen Zwischenzustand.

EINSCHRÄNKUNGEN:
- Dass sich Überdeckendes schweigt, ist gewollt (Kommentar Z. 59–60). Für sich genommen wäre das kein Fehler. Es folgt hier aber daraus, dass alle Namen auf demselben äußeren Ring bei 63°, 77° und 100° stehen.
- „FASKA Lernpfade (GitHub)“ und „(fastka-lernpfade)“ sind verschieden geschrieben. Ob sie zusammengehören, bleibt offen.
- Ein locator steht in den Client-Samen nicht zur Verfügung. Der Ordner steht aber im Label in Klammern.

FOLGE: Ein Name am falschen Bogen ist schlechter als kein Name, denn Ralf liest „Sonnenjahr“ als Namen des Hauptbogens. Die Commit-Nachricht sagt „Familien geordnet und benannt“, das trifft für dieses Werk nur zum Teil zu. Die Marke beim Überfahren nennt die Familie richtig (bedienung.js:114–115). Kaputt ist also nichts, doch die Orientierung im Bild ist falsch. Die Schwere bleibt mittel.

### bild-zelle 4 · Kelch: die Hülle öffnet sich jetzt, die Schale bleibt einseitig (Befund 13 teilweise; 6 und 23 weitgehend behoben)
- **datei:** app/js/zelle.js
- **zeile:** 192
- **schwere:** leicht
- **befund:** Behoben:
- Von der Seite folgt der Radius der Zeit. Der größte Radius je Höhenband wächst gleichmäßig von 0,26 R auf 1,0 R.
- Es gibt zwei lesbare Tagesmarken („18. Okt.“ am Keim, „19. Okt.“ oben, 11 px ink-soft). Sie stimmen mit den Daten: 69 von 71 Ausprägungen stammen vom 18. Okt.
- Köpfe, Schweife und Stiele treten zurück.
Bleibt: Der Winkel ist weiter die Abstammung (Z. 192). Darum belegt jede Höhenschicht nur einen Keil:
- Die Bänder 0 bis 5 decken je 20° bis 100° ab, Band 7 nur 190° und Band 8 (761 Körner, fast nur Codex) nur 70°. Nur Band 6 deckt 290° ab.
- Von der Seite steht deshalb keine Schale. Man sieht einen Stiel aus zwei dünnen Strängen und darauf flache, einseitige Platten, die nach rechts bis x≈530 reichen und nach links nur bis x≈313.
runde2-kelch zeigt dagegen geschlossene Ringe in jeder Schicht. Die Silhouette dreht sich mit dem Kameraschwenk, die Einseitigkeit bleibt.
- **beleg:** gewebe2-06: Keim bei (400,393); Platten blau bei (437–527, 225–250) und (397–493, 255–270), grün bei (313–447, 270–290); links davon nur die Köpfe. Zum Vergleich runde2-kelch. Rechnung: /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/kelch.mjs (Winkelbedeckung je Höhenband, Nachbild kelch-vergleich.png) und hoehe.mjs.
- **vorschlag:** Im Kelch auch den Winkel weich mischen: th = mix(Abstammungswinkel, Hash-Winkel nach Zeitrang, k·kelchK) mit k um 0,5 bis 0,65, wie die Radiusmischung im Original. Dann liegt jede Schicht ringsum, und die Stimmfarbe bleibt grob nach Richtung erkennbar. Am Standbild prüfen.
- **Gegenprüfung:** echt, Schwere mittel: Ich konnte den Befund nicht widerlegen. Er stimmt im Code, in der Rechnung und am Bild. Mit eigener Nachrechnung reicht er weiter als gemeldet: Er gilt nicht nur für „Ein Inhalt“, sondern für jedes Werk der Testkette.

**Code.** In zelle.js Z. 192, kornPos, im Stand 35c59bc wird von der Seite nur der Radius gemischt: `R = mix(gR, gRzeit, kelchK)`. Der Winkel `th = gTh + gDt + curl·gU·TURN + rot` bleibt der Abstammungswinkel, also ein Keil je Stimme. Der Kommentar Z. 189 sagt das ausdrücklich: „der Winkel bleibt die Abstammung“. Im Original-Lichtwerk (spiralcells-lichtwerk/app/js/zelle.js Z. 157) lief der Winkel dagegen als Spirale über den Bahnrang: `phi = phiHead − (kTop − gK)·alpha`. Mit alpha zwischen 144° und dem goldenen Winkel wandert jede Bahn dabei rundum.

**Nachrechnung.** Ich habe kelch.mjs und hoehe.mjs des Prüfers nachgefahren. Seine Kopien neu/ und alt/ sind byte-gleich mit 35c59bc bzw. 26356a7. Seine Zahlen stimmen:
- Die Bedeckung je Höhenband für „Ein Inhalt“ liegt bei 80, 60, 20, 20, 40, 100, 290, 190, 70 und 20°.
- Der größte Radius wächst von 0,26 R auf 1,00 R.
- 69 von 71 Ausprägungen stammen vom 18. Okt.
- Band 8 ist fast nur Codex (Stimme 1).

**Eigene Prüfung (scratchpad/pruefung2/widerlegung-kelch/orig.mjs und alle.mjs).** Das unveränderte Original-Lichtwerk, nur gelesen, schließt bei derselben Testkette und demselben Werk jede Schicht. Die Bänder decken dort 280 bis 360° ab, im Mittel 358°, Exzentrizität 0,00. Über alle 16 Werke der kette-gewebe:
- **Neu:** Im Kelch liegt die mittlere Bedeckung nur zwischen 62 und 212°. Zentrale (5 Stimmen) 148°, FASKA Vergleich 107°, KiN OS Sichten 92° bei Exzentrizität 0,89.
- **Original:** Bei 13 der 16 Werke liegt sie zwischen 317 und 358°.

Die Einseitigkeit ist also systematisch und kein Sonderfall eines einstimmigen Vorlaufs.

**Bild.** gewebe2-06 zeigt den Keim bei (400,393). Daneben steht ein dünner oranger Strang (Claude, Bänder 0–4) nach links oben und ein zarter heller Strang nach rechts. Darüber liegen flache blaue und grüne Plattenstücke bei etwa (437–527, 225–250), (397–493, 255–270) und (313–447, 270–290). Ringe oder Ellipsen gibt es nicht. Neben runde2-kelch, mit geschlossenen Schalen in jeder Schicht, ist das kein Kelch. Die neuen Tagesringe (Alpha 0,06) sind im Standbild nicht zu sehen und schließen die Form auch nicht. Am 18. Okt. entfällt der Ring sogar ganz, weil R < 0,03.

**Warum folgenreich.** BERICHT.md Z. 78 verspricht „von der Seite: ein Kelch“, ABBILDUNG.md Z. 33 „damit ein Kelch entsteht“. Dort steht zudem noch „65 %“, der Code mischt bei kelchK = 1 aber voll. Die Lesart „unten alt, oben jung“ mit Tagesmarken hält jetzt. Die Kelchgestalt fehlt aber bei allen Werken.

**Gegenargument.** Befund 13 hatte selbst vorgeschlagen, den Winkel bei der Abstammung zu lassen. Die Umsetzung folgt also einem bestätigten Vorschlag. Dessen Annahme „mit der alten Mischung wäre auch Ein Inhalt ein Kegel“ galt aber nur zusammen mit dem alten Spiralwinkel. Das macht den Befund nicht hinfällig, es erklärt nur, warum der Rest offen blieb.

**Schwere.** Ich setze sie höher als „leicht“ auf „mittel“, weil der Mangel jede Seitenansicht betrifft und ein dokumentiertes Versprechen bricht. Funktion und Sicherheit sind nicht berührt.

**Zum Vorschlag.** Die Winkelmischung (k etwa 0,5–0,65) ist plausibel. Näher am Original wäre statt eines Hash-Winkels ein Spiralwinkel nach Zeitrang (Rang·GOLD), damit die Schichten nicht verrauschen. Am Standbild prüfen.

### bruch 3 · Im Dach fehlt bei Fensterhöhen unter etwa 745 px der eigene Name
- **datei:** app/js/haupt.js
- **zeile:** 498
- **schwere:** leicht
- **befund:** setze() verwirft jetzt jeden Namen mit y0 < 60 („nie unter dem Titel“). Im Bezirk steht dessen Name über dem oberen Ringpunkt (netz.js:150, Maßstab dz.R·1,08). Dieser Punkt liegt bei jeder Fensterhöhe bei etwa 12 % der Höhe. Unterhalb von etwa 745 px Höhe verschwindet deshalb der eigene Name in jedem der 11 Bezirke (Dächer, Mitte, „ohne Dach“). Das betrifft z. B. 1280×720, 1366×700, das iPad quer und das Handy quer. Genau diese Orientierung soll das Dach geben. Der Name steht waagerecht in der Mitte und kollidiert dort gar nicht mit dem Titel oben links. Der alte Stand prüfte nur die Überdeckung.
- **beleg:** Rechnung …/pruefung2/eigenname.mjs: y0 = 55 bei 1280×700, 57 bei 1280×720, 43 bei 800×600, 16 bei 812×375, jeweils für alle 11 Bezirke. Bei 1440×790 und 1200×800 steht der Name. Code: haupt.js:497–498 mit der Grenze y0 < 60; netz.js:150 amRing(d.mitte, d.R·1,04) als oberster Ringpunkt.
- **vorschlag:** Den eigenen Bezirksnamen nur gegen das tatsächliche Rechteck des Titels (.mark) prüfen. Oder ihn innen unter den oberen Rand setzen, wie die Bereichsnamen, statt ihn zu verschweigen.
- **Gegenprüfung:** echt, Schwere mittel: Der Befund stimmt. Ich konnte ihn nicht widerlegen.

Code: In haupt.js:497–498 verwirft setze() jeden Namen mit y0 < 60. Im Bezirk ist y0 = p[1] − 30. Dabei ist p der oberste Ringpunkt aus amRing(…, R·1,04, false, 0). So steht es in netz.js:140 für die Mitte, in netz.js:150 für die Dächer und in netz.js:153 für „ohne Dach“. Die Kamera rahmt im Bezirk mit dz.R·1,08 (regie.js:23). Der Ring ist mit R·1,04 an dasselbe R gebunden. Deshalb liegt der Punkt maßstabsunabhängig immer bei 12,1 % der Höhe, in jedem Bezirk gleich.

Eigene Rechnung: /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/widerlegung-eigenname/schwelle.mjs, gegen kette-gewebe und kette-claude mit identischem Ergebnis.
- Grenze: Bei 1280×745 ist y0 = 60, der Name steht. Bei 1280×740 schweigt er.
- Ebenfalls stumm sind 1024×700 (y0 = 55), 1366×650 (49) und 812×375 (16), jeweils in allen 11 Bezirken.
- Hochkant ist alles in Ordnung: 375×812 ergibt y0 = 172, 768×1024 ergibt 161. Bei fit = 2 liegt der Ring tiefer.

Keine echte Kollision: Der Name steht waagerecht nahe der Mitte, bei x ≈ 0,45·Breite (z. B. x = 579 bei 1280). Der Titel .mark steht oben links (stil.css:25, left 22 px). #line und #hint stehen unten (stil.css:36 und :48). Oben in der Mitte liegt nichts. Die Grenze 60 schützt dort also nichts.

Rückschritt: Der alte Stand (26356a7, haupt.js:447) prüfte nur frei(rr). Da .mark nie in „belegt“ steht, erschien der Name dort bei 1280×720.

Bild: gewebe2-02 zeigt „FASKA“ oben mittig bei etwa 12 % der Höhe. Das widerspricht dem Befund nicht. Die Bilder sind skalierte Fotos der Browserfläche (BERICHT.md:117), das echte Fenster war also mindestens 745 px hoch. Das Handybild gewebe2-13 ist hochkant und darum nicht betroffen.

Folgen: Beim Eintritt über insDach (haupt.js:128–132) nennt die Zeile unten den Namen noch („FASKA: n Werke in …“). Kommt man aber über zumNetz aus einer Zelle in den Bezirk zurück (haupt.js:138–140), zeigt die Zeile nur den allgemeinen Netzsatz. Das zeigt auch gewebe2-02. Dann steht der Name des Bezirks nirgends. Der Zurück-Knopf .ort ist im Netz verborgen (haupt.js:158–159).

Betroffen sind gängige Fenster: Laptops mit 1280×800 oder 1366×768 im Browser, das iPad quer und das Handy quer. Darum stufe ich ihn als „mittel“ ein, nicht als „leicht“.

Abhilfe wie vorgeschlagen: Den Namen gegen das echte Rechteck von .mark prüfen, etwa wie markeRaum mit getBoundingClientRect in „belegt“. Oder ihn innen unter den oberen Rand setzen statt ihn zu verschweigen.

### wege 1 · Nach dem Bündel liegt der Knoten des gewählten Fadens meist außerhalb des Bilds
- **datei:** app/js/bedienung.js
- **zeile:** 372
- **schwere:** schwer
- **befund:** buendelHinein() fährt in den Herkunftsbezirk (insDach(x.von)) und wählt dessen ersten Faden. Die Kamera rahmt im Dach nur den Bezirkskreis (regie.js:24, dz.R*1.08). Der Fadenknoten liegt aber bei pt(0.5) des Bezirk-zu-Bezirk-Wegs (netz.js:240-248, 203-205), also meist im Zwischenraum außerhalb des Bilds. setzeMarke klemmt die Marke dann an den Bildrand (bedienung.js:550, 63). Dort steht „tippen folgt“ bzw. „tippen liest die Stelle“, doch auf dem Schirm gibt es nichts, was man ein zweites Mal antippen könnte. Dasselbe Bild entsteht auf dem Rückweg „zurück zum Faden im Netz“ (haupt.js:146-147: U.dach = w.dach, Faden gewählt).
- **beleg:** Node (/private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/drehung.mjs, wege2.mjs) gegen testdaten/kette-gewebe bei 800x600, über alle Drehlagen des Netzes: Bündel Text und Reim→KiNTEGRiTY 36/36 außerhalb, Zentrale→ohne Dach 36/36, SEiN→Zentrale 34/36, Zentrale→MiNDLAXY 31/36. Im Dach „Text und Reim“ liegen alle 4 Fadenknoten außerhalb. Bei 375x812 ist Zentrale→ohne Dach in 31/36 Drehlagen außerhalb. Beispiel bei Drehlage 0: Faden 4 (REiMWERK→„Die Wörter bleiben…“) hat seinen Knoten bei 702,832, die Marke wird auf y=460 geklemmt.
- **vorschlag:** Nach buendelHinein und beim Rückweg an den Faden die Kamera so rahmen, dass der Knoten im Bild liegt: Ziel und Maßstab zwischen Dachmitte und Knoten mitteln oder den Knoten als Bildziel nehmen. Ersatzweise den Knoten im Dach auf den eigenen Bezirksrand legen (P1) statt auf pt(0.5).
- **Gegenprüfung:** echt, Schwere mittel: Der Befund lässt sich nicht widerlegen. Code und Rechnung bestätigen ihn, und es kommt noch eine Verschärfung hinzu. Die Schwere setze ich auf mittel, weil es Auswege gibt und keine harte Regel verletzt ist.

Code:
- buendelHinein (app/js/bedienung.js:372) ruft api.insDach(x.von) auf und wählt dann x.faeden[0].
- regie.js:24 rahmt im Dach nur dz.R*1.08. Die Auswahl spielt für die Kamera keine Rolle.
- Der Fadenknoten ist pt(0.5) der Bézierkurve aus fadenWeg (netz.js:240ff., Knoten in netz.js:203). Er liegt bei (A+3·P1+3·P2+Bp)/8, also in der Passage zwischen zwei Bezirken. P1 und P2 sind die Randpunkte der beiden Bezirke.
- Antippbar ist der Knoten nur über U.knoten, also über seine Lage auf dem Schirm (bedienung.js:329).
- setzeMarke klemmt die Marke an den Rand (bedienung.js:63, y auf höchstens H-140).

Verschärfung: Auch die sichtbare Marke hilft nicht weiter. Ihr Klick-Handler (bedienung.js:483-485) kennt keinen Fall 'faden' und landet bei waehle(s, 2). Damit wird nur die Marke neu gezeigt; folgeFaden wird nicht aufgerufen. Wer am Handy die Marke mit „tippen folgt“ antippt, erlebt also, dass nichts geschieht.

Unabhängige Nachrechnung: Skript /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/widerlegung/knoten-abstand.mjs. Es baut den Knoten selbst nach und stimmt mit baueNetz überein. Abstand des Knotens von der Dachmitte, in Dachradien:
- FASKA→SEiN 1,09
- Zentrale→KiNTEGRiTY 1,18
- Zentrale→MiNDLAXY 1,42
- SEiN→Zentrale 1,50
- Text und Reim→KiNTEGRiTY 1,56 (alle vier Fäden)
- Zentrale→ohne Dach 2,10

Bei 800x600 liegt der Knoten in so vielen von 36 Drehlagen außerhalb des Bilds: 8, 12, 31, 34, 36 und 36, in derselben Reihenfolge. Bei 375x812 sind es 12, 14, 20, 21, 24 und 31. Das deckt sich genau mit den Zahlen des Prüfers. Mit kette-claude kommt dasselbe heraus. Bei reduzierter Bewegung dreht sich das Netz nicht; dann gilt nur die eine feste Drehlage.

Warum mittel und nicht schwer:
1. Es gibt Auswege. Ganz aufgezogen (Pinch, U.zoom bis 2,6, bedienung.js:498) liegen alle Knoten im Bild, in 0 von 36 Drehlagen außerhalb. Am Rechner folgt Enter dem Faden (bedienung.js:452). Während der Einfahrt (dachK 0,5) ist der Knoten meist noch sichtbar und rutscht erst danach hinaus.
2. Keine Daten werden berührt, keine harte Regel ist verletzt.

Folgenreich ist es trotzdem: Für die Berührung ist der neue Weg Bündel → Faden → folgen in diesem Commit faktisch eine Sackgasse. Die Marke am Rand verspricht „tippen folgt“ bzw. „tippen liest die Stelle“, und weder auf der Leinwand noch auf der Marke lässt sich das einlösen.

Rückweg (haupt.js:146-147): Der Befund gilt nur, wenn der Faden aus einem Dach heraus verfolgt wurde (w.dach ist dann nicht null). Weil zumNetz zoom und yawOff zurücksetzt, liegt der Knoten danach erneut außerhalb. Wer aus dem Überblick gefolgt ist, landet im Überblick, und dort ist der Knoten sichtbar.

Die Standbilder zeigen diesen Zustand nicht. gewebe2-11 ist der Überblick mit sichtbarem Knoten. Der Beleg ist daher die Rechnung.

### wege 2 · Die Marke sagt „tippen …“, ein Tipp auf sie führt aber Faden, Bündel, Mitte und „ohne Dach“ nicht aus
- **datei:** app/js/bedienung.js
- **zeile:** 483
- **schwere:** mittel
- **befund:** Die Marke ist anklickbar (stil.css:54, pointer-events:auto, cursor:pointer). Der Klick-Handler behandelt aber nur mond, tuer, dach und kopf. Für faden, buendel, mitte und ohne fällt er auf waehle(s, 2) zurück und wählt nur noch einmal. Die Marke selbst verspricht „tippen folgt“, „tippen liest die Stelle“, „tippen fährt in …“ bzw. „tippen fährt hinein“ (markeFuer, Z. 81-98). Zusammen mit dem ersten Befund wird die Marke am Bildrand das einzige Sichtbare des Fadens, und ein Tipp darauf bewirkt nichts.
- **beleg:** bedienung.js:483-485, `else waehle(s, 2)` für alle übrigen Arten. Gegenstück in tippen() (Z. 363-365): Dort führen gleich(U.sel,t) zu folgeFaden, buendelHinein und insDach(t.art). Am Mac: mit der Maus über einen Bündelknoten fahren, die Hover-Marke erscheint, ein Klick auf die Marke wählt das Bündel nur, ein zweiter Klick ebenso.
- **vorschlag:** Im Marken-Klick dieselben Zweige wie in tippen() nehmen: faden → waehle(null); api.folgeFaden(s.i, U.fadenK||0), buendel → buendelHinein, mitte/ohne → api.insDach(s.art).
- **Gegenprüfung:** echt, Schwere mittel: Ich konnte den Befund nicht widerlegen. Am Handy wiegt er sogar schwerer als gemeldet.

1. Code bei 35c59bc: Der Marken-Klick in app/js/bedienung.js:483-485 kennt nur mond, tuer, dach und kopf. Alles andere läuft in `else waehle(s, 2)`. Für faden, buendel, mitte und ohne zeigt waehle() (Z. 277-289) dann nur dieselbe Marke noch einmal. Bei Stufe 2 öffnet sich die Lesefläche nur für same und keim (Z. 287), sonst passiert nichts. Dieselbe Marke verspricht aber „tippen folgt“, „tippen liest die Stelle“, „tippen fährt in …“ und „tippen fährt hinein“ (Z. 81, 82, 96, 100). Die Marke ist als Tippziel gebaut: stil.css:54 setzt `pointer-events:auto; cursor:pointer; min-height:44px`.

2. Der Commit hat zwei der drei Wege nachgezogen, den dritten nicht. In tippen() (Z. 363-365) und bei Enter (Diff Z. ~452/453) führen faden zu folgeFaden und buendel zu buendelHinein. Der Marken-Klick blieb unverändert. Neu ist, dass das Bündel jetzt eine Hover-Marke hat (Z. 533) und eine eigene Marke mit „tippen fährt in …“. Für mitte, ohne und faden fehlte der Zweig schon vorher, sie stehen aber im selben geänderten Ablauf.

3. Warum es am Handy schwerer wiegt: Ich habe setzeMarke() (Z. 60-65) nachgerechnet, mit dem Skript /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/marke-deckt.mjs. Bei 375 px und voller Markenbreite (72vw = 270 px) liegt die Marke in 43 von 68 waagerechten Lagen über ihrem eigenen Knoten, auch in der Bildmitte (sx = 185), wo die Zentrale sitzt. Bei 220 px Breite sind es 23 von 68. Grund: Ab sx > 65 springt die Marke nach links und wird auf x = 12 geklemmt. Sie reicht dann von 12 bis 282 px und beginnt 16 px über dem Knoten. Faden-, Bündel- und Mitte-Texte brechen um und erreichen die volle Breite. Ein zweites Tippen auf den Knoten, wie die Marke es verlangt, trifft also oft die Marke statt die Leinwand. Am Handy gibt es kein Enter. Zentrale, „ohne Dach“, Bündel und Faden sind dann nur noch über einen Rand des Trefferkreises erreichbar, der nicht unter der Marke liegt. Am Mac (800x600) deckt die Marke den Knoten nie; dort bleibt es der gemeldete stumme Klick auf die Marke.

4. Bild: standbilder/gewebe2-11-faden-marke.jpg zeigt eine Faden-Marke von etwa 280x100 px direkt neben dem Knoten, mit „tippen liest die Stelle“. Das ist eine große Fläche, die Tippen abfängt.

Zur Schwere: mittel, nicht schwer. Ein Tipp auf den Knoten selbst und Enter funktionieren weiter, und es geht nichts kaputt. Aber die einzige sichtbare Anweisung führt ins Leere. Bei Mond, Dach und Tür klappt der Klick auf die Marke, bei den vier übrigen Arten nicht. Und gerade die Mitte ist am Handy oft verdeckt. Der Vorschlag passt: Den Marken-Klick an tippen() und Enter angleichen, also faden: waehle(null) und api.folgeFaden(s.i, U.fadenK||0); buendel: buendelHinein(s.i); mitte und ohne: api.insDach(s.art). Zusätzlich sollte die Marke am Handy ihren Knoten nicht überdecken.

### wege 3 · Werke über 60 Fassungen: der größte Teil des sichtbaren Lichts ist weder antippbar noch haltbar
- **datei:** app/js/bedienung.js
- **zeile:** 299
- **schwere:** mittel
- **befund:** Der neue Zweig von trefferSame für mehr als 60 Fassungen rastet nur auf Blattmitten ein, im Radius 25,6 px (beim Halten 22,4 px). Lange Übernahmeblätter („reihe“) reichen aber bis über 200 px von ihrer Mitte weg. Ein Tipp auf ihre Körner gilt dann als Tipp ins Leere: Er schließt eine offene Lesefläche bzw. hebt die Auswahl auf (tippen, Z. 352-355). Ein Halten darauf setzt pressSeed = -1, wird also bloßes Halten statt Verbinden (Z. 396, haupt.js:423-425). Beim Ziehen findet U.bind dort kein Ziel, das Ergebnis ist „Nichts verbunden“.
- **beleg:** Node (/private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/zelle60.mjs, zelle60b.mjs). Kamera am Standbild geprüft: Für „FASKA Varianten · Vergleich“ liegen die Körner bei x 272–488 und y 142–425, das deckt sich mit gewebe2-07. Ein Tipp genau auf ein sichtbares Korn trifft in „FASKA Varianten · Jahreskreise (Netz) · Vergleich“ bei 1755 von 2580 Körnern nichts (68 %, am Handy 56 %). Das Blatt „Zusammenhänge im Raum (neu, drei Spalten)“ hat 48 Körner, 39 davon liegen über 25,6 px von seiner Mitte, das fernste 217 px. Der alte Korn-für-Korn-Weg traf jedes Korn.
- **vorschlag:** Für die Wahl Korn und Blattmitte verbinden: zuerst das nächste geborene Korn (wie bisher), und nur wenn mehrere Blätter in Reichweite liegen, auf die nächste Blattmitte dieser Kandidaten einrasten. Sonst den Radius je Blatt aus seiner Ausdehnung (sRc/Länge) ableiten.
- **Gegenprüfung:** echt, Schwere mittel: Den Befund konnte ich nicht widerlegen. Der Mechanismus stimmt, und er kam mit diesem Commit neu hinein. Nur die Überschrift ist zu breit.

Code: Der Zweig `if(Z.m.samen.length > 60)` in app/js/bedienung.js:299 wurde in 35c59bc neu eingefügt. Er prüft nur die Blattmitten (`mittePos`), und zwar im festen Radius 16·1,6 = 25,6 px. Beim Drücken (Z. 396, maxPx 14) sind es 22,4 px, beim Ziehen zum Verbinden (Z. 408) 25,6 px. Liegt keine Mitte so nah, gilt der Tipp als Tipp ins Leere (Z. 352–355): Im Aufzug springt die Zelle sofort ans Ende (`Z.sofort()`), sonst schließt der Tipp die Lesefläche (`schliesseLese(true)`) oder hebt die Auswahl auf. Ein Halten wird mit `pressSeed = -1` zum bloßen Halten statt zum Verbinden (haupt.js:423–425). Ein Ziehen auf so ein Korn endet mit „Nichts verbunden.“ (bedienung.js:417f). Vorher (26356a7) wurde Korn für Korn gesucht, jedes sichtbare Korn traf also sein eigenes Blatt.

Nachrechnung mit eigenem Skript (widerlegung/blatt60.mjs, blatt60b.mjs, blatt60karte.mjs im Scratchpad pruefung2). Gerechnet ist der fertige Stand von oben, mit der Kamera aus `regie`. Sie stimmt mit gewebe2-07 überein: „FASKA Varianten · Vergleich“ liegt bei x 273–493 und y 145–426, das deckt sich mit dem Bild.

Gemessen wurde, welcher Anteil der Körner bei einem Tipp genau auf das Korn nichts trifft (Tippen bzw. Halten):

| Werk | 800x600 | 375x812 |
|---|---|---|
| „FASKA Varianten · Jahreskreise (Netz) · Vergleich“ (98 Fassungen, 97 davon „reihe“) | 68 % / 72 % | 56 % |
| „FASKA Varianten · Vergleich“ (196) | 10 % | 5 % |
| „Ein Inhalt, viele Verwendungen“ (71) | 7 % | 1 % |

Von der Seite (Kelch) sind es 58 %, 6 % und 0 %. Beide Testbestände (kette-gewebe und kette-claude) ergeben dieselben Zahlen.

Die Blattgrößen stimmen ebenfalls. In „Jahreskreise“ ist „Zusammenhänge im Raum (neu, drei Spalten)“ 48 Körner groß, 39 davon liegen über 25,6 px von der Mitte entfernt, das fernste 218 px. 65 Blätter reichen weiter als 60 px. Zusammen haben sie 2378 der 2580 Körner. Alle 98 Mitten drängen sich bei x 286–400 und y 304–421, das Licht reicht aber über x 229–523 und y 187–469. Die Karte (jahreskreise-karte.png) zeigt nur einen schmalen Bogen um die Mitten als antippbar. Der ganze innere und äußere Teil der Fächer ist tot, auch für Hover und Marke.

Einschränkungen: Die Überschrift „der größte Teil des sichtbaren Lichts“ gilt nur für eines der drei Werke über 60 Fassungen, bei den anderen beiden sind es 1–10 %. Jedes Blatt bleibt über seine eigene Mitte erreichbar (98/98, 196/196, 71/71), außerdem über die Pfeiltasten. Nichts wird zerstört. Dass ein Tipp ein fremdes Blatt wählt (27–85 %), ist die gewollte Einrastung und gehört nicht zum Befund.

Folgen: In einem echten Werk aus Ralfs Bestand ist der größte Teil des Lichts nicht antippbar. Ein Tipp aufs Licht schließt dort eine offene Lesefläche, ein Halten verbindet nicht. Gegenüber dem Vorstand ist das eine Verschlechterung. Deshalb bleibt die Schwere bei mittel.

### wege 5 · Nach einem Faden ohne Teil führt der selbst geöffnete Leseraum ins Netz statt zur Lesefläche
- **datei:** app/js/haupt.js
- **zeile:** 204
- **schwere:** mittel
- **befund:** folgeFaden legt den Rückweg immer mit ausStoff:true an, auch wenn der Faden keinen to_part hat (30 von 37 Kanten in der Testkette) und nur die Lesefläche öffnet. Öffnet Ralf dort selbst „Ganz lesen“, springt Escape oder der Rückweg im Leseraum über zurueckAusStoff → w.ausStoff → zurueck() direkt ins Netz (Z. 177-178). Die Lesefläche, von der er kam, wird übersprungen, ihre Auswahl geht verloren. Überall sonst führt der Leseraum zurück zur Lesefläche (Z. 179-182). Dasselbe gilt für jeden späteren Leseraum in diesem Werk, etwa an einem anderen Korn.
- **beleg:** haupt.js:204 `const dahin = {netz: true, faden: fi, dach: U.dach, ausStoff: true};` gilt unabhängig von mitTeil (Z. 202). rueckSatz (Z. 175) zeigt dann im Leseraum „zurück zum Faden im Netz“. Weg: Netz, Faden 3 (MOONFiNGERS → Mooncells, ohne Verwendung), zweimal tippen, Lesefläche, „Ganz lesen“, Escape: Netz statt Lesefläche.
- **vorschlag:** ausStoff nur bei mitTeil setzen ({netz:true, faden, dach, ausStoff: mitTeil}). Dann führt ein selbst geöffneter Leseraum zur Lesefläche, und erst der nächste Escape geht an den Faden zurück.
- **Gegenprüfung:** echt, Schwere mittel: Ich konnte den Befund nicht widerlegen. Er steht im Code und ist neu in 35c59bc: folgeFaden kommt erst mit diesem Commit hinzu (git diff 26356a7 35c59bc -- app/js/haupt.js).

Der Weg im Code, Stand 35c59bc:
1. haupt.js:204 legt `dahin = {netz: true, faden: fi, dach: U.dach, ausStoff: true}` an, ohne mitTeil (Z. 202) zu beachten.
2. Z. 205 ruft oeffneMond ohne behalteWeg auf. Dadurch wird U.weg geleert (Z. 107), danach wird dahin angehängt. U.weg ist also [dahin], und die Lesefläche ist offen (stufe 2).
3. „Ganz lesen“ ist der erste Knopf der Lesefläche (bedienung.js:219). Er ruft oeffneStoff auf (Z. 174), und das legt nichts auf U.weg.
4. Escape im Leseraum führt über stoff.js:446 zu zurueckAusStoff. Weil w.ausStoff gesetzt ist, geht es nach Z. 178 sofort weiter zu zurueck(). Dort ist das oberste Element ein Netz-Eintrag (Z. 146-147), also folgt zumNetz.
5. Damit fallen drei Stufen auf einmal weg: Lesefläche, Auswahl und Zelle. Ohne den Leseraum braucht derselbe Rückweg drei Escape-Schritte (bedienung.js:503-511: zuerst schliesseLese, dann waehle(null), dann api.zurueck). Aus der tieferen Ebene ist der Weg also kürzer als aus der höheren. Das ist widersprüchlich.

Gegen die Projektregel spricht auch ein Vergleich. Kommt man über folge (Z. 248-250) in einer Lesefläche an, wird kein ausStoff gesetzt, und Escape im Leseraum führt dort zur Lesefläche zurück. ausStoff ist nur für die Fälle gedacht, in denen der Leseraum selbst aufgeht (folgeStoff Z. 188, folgeFaden mit Teil).

Dazu kommt ein Widerspruch für den Screenreader. stoff.js:86 sagt bei jedem Öffnen „Escape führt zurück in die Zelle.“, tatsächlich geht es aber ins Netz. Der sichtbare Knopf im Leseraum sagt dagegen ehrlich „zurück zum Faden im Netz“ (rueckSatz Z. 175).

Auch „jeder spätere Leseraum in diesem Werk“ stimmt. U.weg wird nur in Z. 107, 205 und 250 beschrieben. Wählt Ralf ein anderes Korn, bleibt dahin oben liegen.

Nachgerechnet mit /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/faeden.mjs gegen kette-claude und kette-gewebe:
- 30 Fäden mit 37 Kanten, davon nur 7 mit to_part. Bei 25 von 30 Fäden hat die erste Kante keinen Teil. Das ist also der häufigste Faden-Weg.
- Faden 3 ist MOONFiNGERS nach Mooncells, ohne Verwendung, so wie der Befund es beschreibt.

Zur Schwere: Es gehen keine Daten verloren, und der sichtbare Knopf nennt das Ziel richtig. Deshalb nicht schwer. Es ist aber mittel und nicht leicht: Der Weg ist häufig, Escape wirft ungefragt aus dem Werk (mit Flug ins Netz und Verlust der Auswahl), und die Screenreader-Ansage stimmt nicht.

Der Vorschlag `ausStoff: mitTeil` passt zu folge und folgeStoff. ortAktualisieren zeigt dann weiter „zurück zum Faden im Netz“, weil es w.netz prüft und nicht ausStoff. Eine Lücke bleibt: Bricht Ralf das automatische Öffnen bei einem Faden mit Teil innerhalb der 1300 ms ab, landet er ebenfalls in der Lesefläche mit ausStoff. Diesen Fall deckt der Vorschlag nicht ab.

### wege 6 · Doppelklick auf Bündel oder Dach öffnet ein fremdes Werk
- **datei:** app/js/bedienung.js
- **zeile:** 427
- **schwere:** mittel
- **befund:** Am Mac ist „zweimal tippen“ ein Doppelklick. Der zweite Klick fährt per tippen() ins Dach (buendelHinein bzw. insDach) und setzt U.dach. Gleich danach prüft das dblclick-Ereignis treffer() noch einmal. Mit gesetztem U.dach sind Bündel und Dächer dort keine Ziele mehr (Z. 330-331). Liegt ein Werk innerhalb von 30 px, öffnet oeffneMond es, und der eben betretene Bezirk ist verlassen. Für Dächer bestand das schon vorher (gleiche Trefferpunkte), für die neuen Bündel ist es neu.
- **beleg:** Node (/private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/doppel.mjs), 800x600, 12 Drehlagen. Doppelklick auf den Bündelknoten Zentrale→ohne Dach öffnet in 9/12 Drehlagen z. B. „spiral mind writer frontend“. Text und Reim→KiNTEGRiTY öffnet in 8/12 REiMWERK oder RAKi. FASKA→SEiN öffnet in 8/12 „montessori flow“. Doppelklick auf den Dachkörper öffnet in 12/12 ein Werk des Dachs (FASKA: „FASKA Lernpfad · Codex-Linie“ u. a.).
- **vorschlag:** Im dblclick-Handler nur handeln, wenn der vorausgehende Klick nicht schon eine Fahrt ausgelöst hat (z. B. Zeitstempel in tippen setzen und dblclick binnen 400 ms danach ignorieren), oder dblclick nur auf eine Auswahl anwenden, die schon vor dem Doppelklick ein Mond war.
- **Gegenprüfung:** echt, Schwere mittel: Ich konnte den Befund nicht widerlegen. Die Kette im Code stimmt.

**Der Ablauf am Mac**
- Ein schneller Doppelklick löst zweimal pointerup aus (bedienung.js:419-420). Bei der Dauer von unter 420 ms wird jedes Mal tippen() aufgerufen.
- Der erste Klick markiert das Bündel (waehle). Der zweite trifft dasselbe Bündel, gleich() ist wahr (Z. 363), also läuft buendelHinein (Z. 368). Es ruft api.insDach(x.von) auf.
- insDach setzt U.dach sofort (haupt.js:128). U.netK bleibt 1.
- Direkt danach, ohne ein neues Bild dazwischen, kommt das dblclick (Z. 427). Es ruft treffer() mit den Bildschirmlagen des letzten Bilds auf. Wegen U.dach != null fallen Bündel, Dächer, Mitte und „ohne Dach“ als Ziele weg (Z. 330-331). U.monde enthält im Überblick alle Werke (netz.js:157-182). Liegt eines innerhalb von 30 px, öffnet oeffneMond es. Damit fährt das Bild in eine Zelle statt in den Bezirk.

**Was die Widerlegung nicht trägt**
- Die Marke steht 22 px seitlich versetzt (setzeMarke, Z. 60-64) und verdeckt den Knoten nicht.
- waehle bewegt die Kamera nicht (Z. 278ff).
- Das Namensfeld liegt 14-30 px über dem Dachpunkt. Es fängt nur Klicks genau auf dem Namen ab.
- Die Bündel-Ziele sind neu: 26356a7 hat in bedienung.js keine Fundstelle für „buendel“.
- WEITERMACHEN Z. 24 nennt „Tippen zweimal“ selbst als Weg hinein. Die dokumentierte Geste löst den Fehler also aus.

**Nachrechnung**
Skript: /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/widerlegung-doppel/doppel-flaeche.mjs

Es baut treffer() einschließlich Türen, Köpfen (0,6) und einer Näherung der Namensfelder nach. Gezählt wird die Fläche, auf der der erste Klick das Ziel wählt, über 12 Drehlagen, Daten aus testdaten/kette-gewebe.

Anteil dieser Fläche, auf dem das folgende dblclick ein Werk öffnet:

| Bündel | 800x600 | 1440x900 | Ergebnis |
|---|---|---|---|
| Zentrale→ohne Dach | 47 % | 21 % | öffnet „spiel maerchendorf“ oder „Einhorn 64“, beide aus „ohne Dach“, also nicht aus der Zentrale, die betreten werden sollte |
| Text und Reim→KiNTEGRiTY | 33 % | 15 % | |
| FASKA→SEiN | 30 % | 11 % | „montessori flow“ |
| Zentrale→KiNTEGRiTY | 27 % | 6 % | |

Bei Dächern sind es etwa 22-29 % der Fläche. Das Werk liegt dort immer im eben betretenen Dach. Das gab es schon vor diesem Commit.

**Wo der Prüfer übertreibt**
Seine Zahlen wie 9/12 messen nur den Knotenmittelpunkt. Sie unterschlagen, dass in manchen Drehlagen schon der erste Klick nicht das Bündel trifft. Für Text und Reim ist das nur in 6 von 12 Lagen am Mittelpunkt wählbar. Über die Fläche gerechnet ist die Fehlerquote geringer, aber deutlich.

**Schwere: mittel**
Der Fehler trifft eine dokumentierte Hauptgeste auf dem Hauptgerät. Bei Bündeln landet man in einem fremden Bezirk. Nebenbei überschreibt oeffneMond das gemerkte Werk (localStorage) und die Adresszeile. Mit Escape kommt man zurück, und nichts wird in den Bestand geschrieben. Deshalb nicht schwer.

### bild-netz 3 · Überblick zeigt dieselbe Verbindung doppelt: Einzelfaden des zuletzt geöffneten Werks plus Bündel
- **datei:** app/js/netz.js
- **zeile:** 189
- **schwere:** mittel
- **befund:** Im Überblick zeichnet baueNetz alle Einzelfäden des zuletzt geöffneten Werks, weil `aktiv` als beteiligt gilt. Zusätzlich zeichnet es das Bündel, das genau diese Fäden enthält. Dieselbe Verbindung läuft dann zweimal nebeneinander: einmal von Werk zu Werk, einmal von Rand zu Rand, jeweils mit eigenem Knoten und Ring. Der übliche Weg (Zelle → N, man landet im Bezirk → Escape in den Überblick) lässt W.aktiv stehen, also tritt das fast immer auf. Es macht das Bild unruhig und zeigt Verbindungen doppelt so zahlreich, wie sie sind.
- **beleg:** gewebe2-01, Ausschnitt (90–400) × (120–330): Zwei Linien laufen nebeneinander von der Mitte zu „ohne Dach“. Eine endet am Rand, eine an einem Werk. Zur blauen Ausprägung in KiNTEGRiTY (535,205) führt ein Einzelfaden, daneben steht der Bündelhaken bei (465,262). Code: netz.js Z. 189–190 (beteiligt = aktiv === f.von …, gilt auch im Überblick), Z. 207–217 (Bündel werden ohne Rücksicht auf gezeigte Einzelfäden gezeichnet), haupt.js Z. 133 (ausDach lässt W.aktiv stehen), Z. 439 (baueNetz bekommt W.aktiv). Rechnung kette-gewebe: Die Bündel Mitte→KiNTEGRiTY, Mitte→MiNDLAXY und Mitte→ohne Dach bestehen nur aus den Fäden 26, 27 und 28 von „Ein Inhalt, viele Verwendungen“ (faeden.mjs im Prüfordner).
- **vorschlag:** Im Überblick `aktiv` nicht als beteiligt werten, sondern nur eine ausdrückliche Wahl (selM). Oder ein Bündel auslassen bzw. auf etwa 0,15 dimmen, solange einer seiner Fäden einzeln gezeigt wird.
- **Gegenprüfung:** echt, Schwere leicht: Der Befund lässt sich nicht widerlegen. Er stimmt aber nur für einen Teil der Werke und ist leichter als gemeldet.

Code (35c59bc):
- netz.js Z. 189: `beteiligt` zählt `aktiv === f.von || aktiv === f.nach` mit, auch wenn kein Dach betreten ist (imDach == null). Z. 190 zeigt den Faden dann einzeln.
- Z. 207–217 zeichnen im Überblick alle Bündel. Gedimmt wird nur über `wahl = selM >= 0` (Z. 186, 210). `aktiv` dimmt nichts.
- haupt.js Z. 133: ausDach setzt die Wahl auf Dach, Mitte oder „ohne“, W.aktiv bleibt stehen. Z. 439 übergibt W.aktiv an baueNetz.
- start() (Z. 566–577) öffnet immer erst eine Zelle. Damit ist W.aktiv im Netz praktisch immer gesetzt.
- Der Kommentar in Z. 184 sagt selbst „Einzeln nur im Bezirk oder an der Wahl, sonst gebündelt“. Das zuletzt geöffnete Werk ist aber keine Wahl.

Nachgerechnet gegen kette-gewebe, 800×600, vier Drehlagen (Skripte doppelt.mjs und zahl.mjs in pruefung2/widerlegung-doppelfaden/):
- Der Testbestand hat 30 Fäden und 6 Bündel.
- Ist „Ein Inhalt, viele Verwendungen“ aktiv (71 Ausprägungen, in der Zentrale), werden die Fäden 26, 27, 28 und 29 einzeln gezeigt.
- Die Bündel Zentrale→KiNTEGRiTY, Zentrale→MiNDLAXY und Zentrale→ohne Dach bestehen jeweils nur aus einem dieser Fäden. Sie laufen also vollständig doppelt.
- Faden- und Bündelknoten liegen 4–30 px auseinander. Getroffen wird im Radius 26 bzw. 28 px (bedienung.js Z. 329–330). Ob ein Tipp den Faden oder das Bündel wählt, hängt an wenigen Pixeln. Beim zweiten Tippen verhalten sich beide verschieden: der Faden folgt ins andere Werk oder liest die Stelle, das Bündel fährt in die Zentrale.

Bild gewebe2-01 (Ausschnitt aufgehellt angesehen):
- Zur MiNDLAXY-Seite laufen ein Werkfaden mit Knoten bei etwa (346,210) und daneben der Bündelbogen mit Ring bei etwa (355,226).
- Zu „ohne Dach“ laufen zwei Linien zu fast deckungsgleichen Knoten bei etwa (265,215).
- Zu KiNTEGRiTY führt ein Einzelfaden zum blauen Werk, der Bündelhaken steht bei etwa (463,263).

Einschränkung:
- „fast immer“ ist übertrieben. Nur 11 von 87 Werken haben einen Faden über eine Bezirksgrenze.
- Ohne Merker startet die Kette auf „Émile Durkheim“, und dort tritt nichts doppelt auf. Die Zentrale selbst hat 0 Fäden.

Folge: Im Überblick erscheint dieselbe Verbindung zweimal, mit zwei fast deckungsgleichen, verschieden wirkenden Knoten. Das widerspricht der eigenen Regel des Commits. Kein Daten- oder Regelverstoß, die Marke benennt jeweils, was gewählt ist. Deshalb echt, aber nur leicht.

Vorschlag: `aktiv` nur bei `imDach != null` als beteiligt werten. Oder ein Bündel dimmen bzw. auslassen, solange einer seiner Fäden einzeln gezeigt wird.

### bild-netz 8 · Der Name „Zentrale“ wird vom Bündel SEiN→Mitte durchkreuzt
- **datei:** app/js/haupt.js
- **zeile:** 497
- **schwere:** leicht
- **befund:** Befunde 1, 12 und 19 sind am Mac weitgehend behoben. Die Mitte ist so groß wie 0,7 × FASKA, ihr warmer Kern trägt, die Türen haben im Überblick weder Ring noch Namen, die Köpfe kreisen am Rand, und der Name steht unter dem Rand. Rest: Der Name steht genau am untersten Randpunkt. Dort treten die Bündel zu Bezirken aus, die vor der Mitte liegen. Im Standbild schneidet das Bündel SEiN→Mitte mitten durch „Zentrale“. Die Platzprüfung der Namen kennt nur andere Namen, keine Linien.
- **beleg:** gewebe2-01, Ausschnitt (280–560) × (150–420), dreifach vergrößert: Die weiße Linie von (385,360) nach (365,440) kreuzt „Zentrale“ (358–427, y≈378) zwischen „n“ und „t“. Code: netz.js Z. 140 (mitteSchirm ist der unterste Randpunkt), haupt.js Z. 497 (Name 10 px darunter), netz.js Z. 211 und 250 ff. (das Bündel beginnt am Rand in Richtung Ziel).
- **vorschlag:** Die Randstelle unter dem Mitte-Namen als Sperrzone für Bündelanfänge behandeln und den Start seitlich am Namen vorbeiführen. Oder den Namen an die unterste Randstelle setzen, an der gerade kein Bündel austritt.
- **Gegenprüfung:** echt, Schwere leicht: Ich konnte den Befund nicht widerlegen. Er ist belegt und hängt am Aufbau, nicht an einem Zufallsbild. Folgenreich ist er nur leicht, weil der Name lesbar bleibt.

Bild: Ich habe gewebe2-01 im Bereich x 330–470, y 320–450 vierfach vergrößert. Eine helle Linie läuft vom unteren Rand der Mitte senkrecht durch „Zentrale“, genau zwischen „n“ und „t“, und weiter nach unten Richtung SEiN.

Code (Stand 35c59bc):
- netz.js Z. 140: U.mitteSchirm ist im Überblick der unterste Bildpunkt des Bodenrings bei 1,02·R.
- haupt.js Z. 497: Der Name steht 10 px darunter.
- netz.js Z. 208 ff. und bogen() Z. 250: Ein Bündel beginnt am Rand der Mitte in Richtung seines Ziels. Jedes Bündel zu einem Bezirk, der von der Kamera aus vor der Mitte liegt, tritt also genau an der Stelle des Namens aus.
- haupt.js Z. 491: Die Platzprüfung frei() kennt nur die Liste belegt, also Namen und Marke, keine Linien.

Rechnung (pruefung2/widerlegung-zentralename/kreuzung.mjs und fenster.mjs; Testkette kette-gewebe, Netz und Kamera wie in der App über regie() und baueNetz()):
- Vier der sechs Bündel hängen an der Mitte: SEiN→Mitte, Mitte→KiNTEGRiTY, Mitte→MiNDLAXY und Mitte→ohne Dach.
- Die Kamera dreht sich mit 0,012 rad/s, eine ganze Drehung dauert etwa 524 s. Bei 800×600 kreuzt ein Bündel den Namen in 26 % dieser Zeit, am Handy (375×812) in 33 %. Es sind wechselnd SEiN, MiNDLAXY und ohne Dach.
- U.netZeit beginnt beim Laden der Seite bei 0. Im Startbild kreuzt SEiN→Mitte den Namen: am Mac bei etwa (400, 385), etwa 20 s lang; am Handy bei etwa (184, 419), etwa 31 s lang.
- Bei reduzierter Bewegung (prefers-reduced-motion) steht die Drehung still (regie.js Z. 22, „RM ? 0“). Dann bleibt das Startbild stehen, und die Linie liegt dauerhaft auf „Zentrale“.

Warum nur leicht: Die Linie ist dünn und läuft meist durch einen Buchstabenzwischenraum, der Name bleibt lesbar. Es ist ein Rest der behobenen Befunde 1, 12 und 19, keine neue Wirrnis. Es ist aber kein Geschmack. Der Kommentar in Z. 497 („unter ihrem Rand, nicht auf ihrem Inhalt“) und die Platzprüfung wollen Überdeckung ja gerade vermeiden. Der Vorschlag passt: Die Randstelle unter dem Namen als Sperrzone für den Bündelanfang behandeln, oder den Namen an einen Randpunkt setzen, an dem kein Bündel austritt.

### bild-netz 11 · Befund 5 teilweise: Die Jahreskreise-Sichel brennt weiter aus, am Vergleich-Werk sitzt ein neuer weißer Strich
- **datei:** app/js/netz.js
- **zeile:** 165
- **schwere:** leicht
- **befund:** Der Klumpen „Varianten · Vergleich“ brennt nicht mehr aus. Die Sichel von „Varianten · Jahreskreise“ ist aber weiterhin am Anschlag. Direkt neben dem Vergleich-Werk sitzt ein neuer weißer Strich, ebenfalls ausgebrannt. Er liegt dort, wo der innere Faden Eigenraum→Vergleich mündet. Die Ursache des Strichs ist ohne Browser nicht sicher zu bestimmen. Die neue Dämpfung richtet sich nach der Punktzahl k, nicht nach der Dichte auf der Fläche.
- **beleg:** gewebe2-02: Sichel (340–385, 220–240) max 251, 7 px ≥240; in gewebe-02 waren es max 254 und 34 px. Vergleich-Klumpen (310–350, 335–375) max 223, 0 px ≥240; vorher 46 px. Strich (345–370, 340–358) max 250, 16 px ≥240. Code: netz.js Z. 165 (lit · (16/k)^0,7).
- **vorschlag:** Die Helligkeit je Punkt nach der Punktdichte dämpfen (k / rM²) statt nach k. Für Übernahmereihen höchstens etwa 40 Punkte zeichnen. Den Strich am Vergleich-Werk im Dach gezielt nachmessen; Mündung und Wanderlicht des Fadens Eigenraum→Vergleich liegen dort.
- **Gegenprüfung:** echt, Schwere leicht: Ein Kern bleibt stehen. Zwei Teile des Befunds sind aber falsch gelesen, und die Sichel brennt nicht mehr im strengen Sinn aus. Schwere: leicht.

**Was falsch gelesen ist**

1. **Der Strich ist nicht neu.** Er steht schon in gewebe-02 bei (353–382, 274–296): 18 px ≥240 und 11 px ≥250 (Luminanz). Die erste Kritik nennt ihn ausdrücklich als „dritten hellen Balken über faska invaria 2“.
2. **Er kommt nicht vom Faden Eigenraum→Vergleich.** Ich habe das Dachbild in Node nachgebaut: kette-gewebe, Dach FASKA, Kamera über regie, Punkte wie im Shader aufaddiert, nach Herkunft getrennt. Die hellste Stelle des ganzen Bildes liegt bei (358,345), genau im gemeldeten Kasten. Ihr Szenenwert ist 2,86, davon stammen 2,85 aus den eigenen Werkpunkten von „FASKA Varianten · Vergleich“. Fäden und Ringe tragen dort nichts bei. Ursache: 46 der 99 Miniaturpunkte dieses Werks (193 von 196 Ausprägungen sind Übernahmereihe) fallen in ein Fenster von 12×8 px. Im alten Stand lag dieselbe Stelle bei (367,286) mit Szenenwert 9,6.
3. **Die Sichel ist kein Ausbrenner mehr im Sinn von Clipping.** Ihr Szenenwert fiel von 9,81 auf 2,75. ACES klemmt erst ab etwa 7,2, 2,75 ergibt ungefähr 249/255. Gemessen in gewebe2-02 (340–390, 215–245): 3 px ≥250 statt 21, 12 px ≥240 statt 34, Höchstwert 252,8. Der Vergleich-Klumpen liegt jetzt bei 244.

**Der wahre Kern**

Beide Gestalten bleiben mit großem Abstand das Hellste im Dach. Im Bild stehen sie bei etwa 250, alle anderen Werke höchstens bei 206 (Eigenraum, GOLD, MUSiC). Im Nachbau ist ihr Szenenwert gut doppelt so hoch wie beim nächsthellen Werk (2,75–2,85 gegen 1,26). Beide lesen sich als massive weiße Formen ohne Körnung.

Damit verfehlt die Änderung ihr eigenes Ziel. Der Kommentar in netz.js Z. 164 verspricht „groß heißt weit, nicht grell“, Befund 5 forderte „glühen, nicht clippen“. Die Dämpfung `lit · (16/k)^0,7` in Z. 165 senkt jeden Punkt nur um etwa den Faktor 3,5. Die Helligkeit entsteht aber dadurch, dass 46 bzw. 62 Punkte in 12×8 px übereinanderliegen. Bei der Jahreskreise-Sichel liegen 62 von 98 Punkten so dicht. Die erste Prüfung hatte schon gesagt, dass die Sichel eine eigene Ursache in der Lage der Reihe hat.

**Zum Vorschlag**

Den Vorschlag k/rM² halte ich für wirkungslos. rM liegt bei allen betroffenen Werken bei etwa 2, und die Punkte ballen sich auf einem kurzen Bogen, nicht auf der Fläche. Wirksam wären zwei Wege:
- Übernahmereihen in der Miniatur ausdünnen (etwa 40 Punkte).
- Nach der tatsächlichen Häufung dämpfen, zum Beispiel nach Punkten je Bogenlänge.

Auf dem Handy (gewebe2-13) brennt nichts aus, der Höchstwert ist 232.

**Belege**

- Code: app/js/netz.js Z. 164–169 und miniWuchs Z. 23–36.
- Skripte im Scratchpad:
  - /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/widerlegung-sichelstrich/render.mjs
  - /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/widerlegung-sichelstrich/strich.mjs
  - /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/widerlegung-sichelstrich/hist.py

### bild-netz 12 · Namen stoßen an Titel und Bildzeile: „Spiele und Welten“ wird am Handy zur dritten Titelzeile, „ADHS OS“ liegt auf der Zeile
- **datei:** app/js/haupt.js
- **zeile:** 498
- **schwere:** leicht
- **befund:** Die Dach- und Werknamen halten nur feste Abstände ein: oben 60 bzw. 56 px, unten 64 bzw. 70 px. Der Titelblock reicht aber bis etwa 55 px. Die Bildzeile steht 9vh über dem Boden und ist am Handy drei Zeilen hoch. Am Handy steht „Spiele und Welten“ dadurch direkt unter „ehemals MiNDCEL“ und liest sich als dritte Titelzeile; ein Schein liegt zusätzlich auf der Unterzeile. Am Mac liegt „ADHS OS“ auf der Bildzeile.
- **beleg:** gewebe2-13, Ausschnitt (0–263) × (0–120): „Spiele und Welten“ bei y≈44 im Bild (≈63 css) unmittelbar unter „ehemals MiNDCEL“, darauf ein blauer Schein. gewebe2-01, Ausschnitt (0–800) × (470–600): „ADHS OS“ (500–560, 541) liegt auf der Zeile „… neun Werke noch ohne Dach.“ (y≈538). Code: haupt.js Z. 498 (y0 < 60 || y0 > cssH − 64), Z. 46 (y < 56 || y > cssH − 70); stil.css Z. 25–27 (.mark), Z. 36 (#line bei bottom 9vh).
- **vorschlag:** Die tatsächlichen Rechtecke von .mark und #line (wenn sie sichtbar sind) in die Liste „belegt“ aufnehmen, so wie markeRaum() es für die Marke schon tut.
- **Gegenprüfung:** echt, Schwere leicht: Der Befund ist echt. Ich konnte ihn nicht widerlegen. Code, Rechnung und Bild sagen dasselbe.

**Code (Stand 35c59bc)**
- haupt.js Z. 498: Ein Dachname wird nur verworfen, wenn `y0 < 60 || y0 > cssH − 64`. Der Kommentar dazu verspricht „nie unter dem Titel oder der Zeile“.
- haupt.js Z. 46: Für Werknamen gilt `y < 56 || y > cssH − 70`.
- Die Liste „belegt“ enthält nur die Marke (`markeRaum`). `.mark` und `#line` fehlen darin.
- In 26356a7 gab es für Dachnamen gar keine Grenze. Die Grenze ist also neu, aber zu knapp bemessen.

**Rechnung** (widerlegung-titelzeile/band.mjs im Scratchpad pruefung2)
- `#line` steht bei `bottom: 9vh` mit Schrift `clamp(15px, .9vw + 10px, 21px)` und Zeilenhöhe 1,5 (stil.css Z. 36–39). Die Grenze von 64 bzw. 70 px deckt das bei keiner Fenstergröße ab.
- Dachnamen, deren Oberkante in diesem Band liegt, sitzen auf der Bildzeile:

| Fenster | Bildzeile (y) | Band für Dachnamen |
|---|---|---|
| 800×600 | 520–546 | 504–536 (32 px) |
| 1440×900 | 787–819 | 772–836 (65 px) |
| 1920×1080 | 951–983 | 935–1016 (81 px) |
| 375×812, drei Zeilen | 671–739 | 655–748 (93 px) |

- Für Werknamen ist das Band ähnlich breit.
- Im Überblick ist die Bildzeile der bleibende Satz „Die Zentrale in der Mitte, neun Dächer darum, …“ (bedienung.js Z. 51). `zeile()` blendet ihn nicht von selbst aus.
- `netzMass` füllt das Bild bis etwa 91 % der halben Höhe (regie.js, Faktor 1,1). Deshalb landen die unteren Dachnamen regelmäßig genau in diesem Band.
- Das Netz dreht sich langsam (0,012 rad/s). Ein Name kann also zeitweise auf der Zeile liegen. Bei reduzierter Bewegung dreht es sich nicht, und die Überdeckung bleibt stehen.

**Bild**
- gewebe2-01, Ausschnitt y 470–600 aufgehellt: „ADHS OS“ (x 500–560, y≈541) liegt auf der Bildzeile (y≈538) über „neun Werke“. Das stimmt mit der Rechnung überein: y0≈533 ist noch erlaubt (≤ 536), die Zeile beginnt bei 520.
- In der Aufnahme blendet die Zeile gerade erst ein und ist noch blass. In Ruhe hat sie volle Deckkraft, dann stoßen beide Texte voll aufeinander.
- gewebe2-13, Helligkeit Zeile für Zeile gemessen (Maßstab 0,701):
  - „SPiRALCELLS“: css 21–31
  - „ehemals MiNDCEL“: css ≈ 41–50
  - „Spiele und Welten“: css ≈ 57–66, linker Rand bei ≈ 12–16 px, die Marke beginnt bei 22 px
- Der Titelblock endet bei ≈ 52 px. Die Grenze 60 lässt also nur ≈ 8 px Abstand. Der gedimmte Dachname (Deckkraft 0,25 × 0,85) hat einen ähnlichen Ton wie die Unterzeile und liest sich als dritte Titelzeile.

**Einschränkungen**
- Der blaue Schein auf „ehemals MiNDCEL“ ist WebGL-Inhalt hinter dem Titel und hat mit der Platzierung der Namen nichts zu tun. Dieser Teil des Befunds trägt nicht.
- Die Folge ist nur eine Lesbarkeitskollision. Bedienung und Daten sind nicht betroffen, daher bleibt die Schwere „leicht“.

**Vorschlag**
- Die echten Rechtecke von `.mark` und (wenn `.on`) `#line` per `getBoundingClientRect` in „belegt“ aufnehmen, wie `markeRaum()` es schon tut.
- Statt der festen 60/64/56/70 px die Grenzen aus diesen Rechtecken ableiten.

### bild-netz 13 · Im Bezirk sagt die Bildzeile den Überblickssatz
- **datei:** app/js/haupt.js
- **zeile:** 140
- **schwere:** leicht
- **befund:** Wer aus einer Zelle mit N ins Netz geht, landet im Bezirk dieses Werks. Die Bildzeile sagt trotzdem den Satz des Überblicks. Im Dach FASKA und in der Mitte steht so „Die Zentrale in der Mitte, neun Dächer darum, neun Werke noch ohne Dach.“, statt etwa „FASKA: 14 Werke in 3 Bereichen.“. Ebene und Satz passen nicht zusammen. Das ist nicht neu, steht aber in drei der fünf neuen Bilder.
- **beleg:** gewebe2-02 unten (y≈535), gewebe2-03 unten (y≈535) und gewebe2-13 unten (y≈480–512). Code: haupt.js Z. 138 (U.dach = Bezirk des Werks), Z. 140 (B.zeile(B.netzSatz(W.B))). Der passende Satz steht in insDach, Z. 130–132.
- **vorschlag:** In zumNetz den Satz des Bezirks verwenden, sobald U.dach gesetzt wird, in derselben Formulierung wie in insDach.
- **Gegenprüfung:** echt, Schwere leicht: Der Befund ist belegt, auch wenn er klein bleibt. Ich konnte ihn nicht widerlegen.

Code (app/js/haupt.js, Stand 35c59bc):
- Z. 138 setzt in zumNetz() `U.dach = W.N.bezirk(W.aktiv)`. Wer aus einer Zelle ins Netz geht, landet also im Bezirk dieses Werks.
- Z. 140 setzt danach `B.zeile(B.netzSatz(W.B))`. Laut bedienung.js Z. 48–51 ergibt das immer den Satz des Überblicks: „Die Zentrale in der Mitte, neun Dächer darum, neun Werke noch ohne Dach.“
- insDach() (Z. 128–132) führt in genau denselben Zustand (U.dach = j). Dort stehen aber der Satz des Bezirks und die Ansage „Pfeile wählen ein Werk, Escape führt hinaus.“
- Zwei Wege in denselben Zustand ergeben also zwei verschiedene Bildzeilen. Sonst schreibt keine Stelle die Zeile nach zumNetz um. Das zeigt die Liste aller zeile()-Aufrufe.
- Der Rückweg über den Faden (Z. 146) erbt dasselbe Muster.

Bilder:
- gewebe2-02: oben „FASKA“, die übrigen Dächer gedimmt, unten der Satz des Überblicks.
- gewebe2-03: die Mitte von innen, gleicher Satz.
- gewebe2-13: das Handy im Dach FASKA, gleicher Satz.
- Diese Bilder entstehen über ?szene=netz (haupt.js Z. 599–600: oeffneMond, dann zumNetz). Das ist genau der Weg, den auch Ralf geht (Escape oder Netz aus der Zelle). Es ist also kein Artefakt der Aufnahme.

Warum das zählt und nicht nur Geschmack ist:
- Laut der ersten Bildkritik soll die Bildzeile den Zustand in einem einzigen Satz ehrlich erklären. Im Bezirk beschreibt der Satz aber den Überblick („neun Dächer darum“), und gerade der ist nicht zu sehen: Die anderen Dächer stehen auf 0,25.
- Für Tastatur und Vorlesen wiegt es schwerer. schritt() (bedienung.js Z. 519) schränkt die Pfeile nach zumNetz auf die Werke des Bezirks ein. Weder die Zeile noch die Ansage sagt aber, dass man in einem Bezirk ist und dass Escape hinausführt. Die Ansage nennt nur die Marke des Werks (markeFuer, Z. 76–79).

Warum nur leicht:
- Sehende sehen oben den Dachnamen und finden sich zurecht.
- Der Satz ist über das ganze System nicht falsch.
- Der Fehler ist nicht neu: In 26356a7 sind die Zeilen 105–112 gleich. Die Änderung hat ihn also nicht verursacht.

Hinweis zum Vorschlag: Den Satz nur in zumNetz zu ersetzen genügt nicht. Z. 146 überschreibt U.dach direkt nach zumNetz() mit w.dach. Ist w.dach null, stünde dann im Überblick der Satz des Bezirks. Besser zieht man den Satz aus insDach in eine eigene Funktion (etwa dachSatz(j)) und ruft sie auf, nachdem U.dach endgültig gesetzt ist: in zumNetz und nach Z. 146. Ist U.dach null, bleibt es bei netzSatz. Mit dem Satz sollte auch die Ansage aus insDach mitgehen.

### bild-stoff 6 · Perlenfaden: gewähltes Gegenüber halb außerhalb, die übrigen Perlen stumm
- **datei:** app/js/stoff.js
- **zeile:** 250
- **schwere:** leicht
- **befund:** Befund 27 ist teilweise behoben: Die Einblendung ist da, mit ruhiger Variante bei reduzierter Bewegung, und „hier“ samt Nachbarn trägt Kurztitel. Offen sind drei Dinge. Erstens rollt der Faden nur „hier“ in die Mitte, im Vergleich liegt das Gegenüber oft außerhalb. In gewebe2-09 ist das vorgeschlagene Gegenüber „Antwort · Claude auf Hermes' Gegenbefunde“ (Nr. 14 von 20) am rechten Rand halb abgeschnitten, vom Kurztitel ist nur „Antwort ·“ zu lesen. Zweitens ist die Bildlaufleiste ausgeblendet, und kein Verlauf zeigt, dass der Faden weitergeht. Drittens haben 17 von 20 Perlen keinen sichtbaren Titel, und Überfahren oder Fokus vergrößert sie nur. Wohin eine Perle führt, sieht man erst nach dem Klick.
- **beleg:** gewebe2-09 bei x≈760–800, y≈112–135: Ring der Gegenüber-Perle und „Antwort ·“ am Bildrand abgeschnitten. gewebe2-08: Perlen ab x≈571 ohne Titel bis zur rechten Kante. Code: stoff.js:250–251 (nur `.perle.hier` wird zentriert), stoff.js:231 (Titel nur bei |j−hier| ≤ 1 oder für das Gegenüber), stil.css:296–297 (overflow-x:auto, Bildlaufleiste ausgeblendet), stil.css:311 (Hover nur scale). Rechnung vergleich.mjs (gleicher Ordner): Antwort ist Nr. 14 im Zweig, der Befund Nr. 7.
- **vorschlag:** Im Vergleich so rollen, dass „hier“ und das Gegenüber beide sichtbar sind, etwa auf die Mitte zwischen beiden oder mit scrollIntoView({inline:'nearest'}) für das Gegenüber. An den Rändern einen leisen Verlauf als Zeichen für mehr zeigen. Den Kurztitel jeder Perle bei :hover und :focus-visible einblenden: den Span immer anlegen und sonst unsichtbar lassen.
- **Gegenprüfung:** echt, Schwere leicht: Ich konnte den Befund nicht widerlegen. Alle drei Teile sind in Bild, Code und Daten belegt. Er bleibt aber leicht, denn verloren geht keine Information, es fehlt nur Orientierung in der Auswahl.

1) Das Gegenüber liegt am Rand. Das Skript /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/widerlegung-perlen/zweig.mjs rechnet gegen kette-gewebe. Ergebnis: Mond „Ein Inhalt, viele Verwendungen“, keine Herkunft, Zweig mit 20 Fassungen. „Befund · Zeitspirale …“ ist Nr. 7, „Antwort · Claude auf Hermes' Gegenbefunde …“ ist Nr. 14. Im Ausschnitt rechts09.png (gewebe2-09, x 540–800, y 85–145) sitzt die Perle mit dem Gegenüber-Ring bei x≈796 und ist vom Bildrand halb abgeschnitten. Lesbar ist nur „Antwort ·“. Die Perlen 15 bis 20 liegen ganz außerhalb. Ursache ist stoff.js:249–251: Das requestAnimationFrame holt nur `.perle.hier` in die Mitte. Für das Gegenüber gibt es kein Rollen.

Dazu kommt ein schärferes Fehlbild, das der Prüfer nicht nennt. Ein Klick wählt im Vergleich ein fernes Gegenüber, etwa Nr. 19. Dann ruft waehle() (Z. 254) baue() auf, und baueFaden baut den Faden neu (innerHTML = '', scrollLeft fällt auf 0). Danach rückt der Faden wieder „hier“ in die Mitte. Das gerade Gewählte verschwindet so aus dem Blick. fokus(k) setzt den Tastaturfokus mit preventScroll:true (Z. 107) auf diese unsichtbare Perle. Bei 375 px sind nur „hier“ und je zwei Nachbarn zu sehen (gewebe2-14), dort trifft es fast jede Wahl.

2) Kein Zeichen, dass der Faden weitergeht: stil.css:296–297 hat overflow-x:auto, scrollbar-width:none und ::-webkit-scrollbar{display:none}. Weder stil.css noch stoff.js enthalten eine Maske, einen Verlauf oder scroll-snap; grep findet nichts. Wer am Schreibtisch nur ein Mausrad hat, erreicht die Perlen 15 bis 20 im Vergleich nur über Umschalt+Rad oder Tab. Im Vergleich stellt ein Klick „hier“ nicht neu, also hilft auch kein schrittweises Weiterklicken.

3) Titel fehlen: stoff.js:231 vergibt einen sichtbaren Kurztitel nur bei |j−hierK| ≤ 1 oder für das Gegenüber. Im Vergleich sind das 3 von 20 Perlen, im Lesen 3 von 20 (gewebe2-08). stil.css:311 vergrößert die Perle bei :hover und :focus-visible nur (scale 1.25), es gibt kein title und keinen eingeblendeten Span. Der Code-Kommentar (Z. 214–216) nennt das zwar Absicht. Der bestätigte Befund 27 verlangte aber ausdrücklich „Perlen bei Fokus oder Hover mit Kurztitel und Datum“ und benannte das Fehlbild „Wohin eine Perle führt, sieht man erst nach dem Klick“. Genau das gilt weiter für 17 der 20 Perlen. Damit ist es keine Geschmacksfrage, sondern ein offener Teil eines bestätigten Befunds.

Das spricht für „leicht“: Das Gegenüber steht in der Spaltenkopfzeile mit vollem Titel (gewebe2-09, y≈213–247). Der Kopf sagt „7. von 20 im Zweig“. Die aria-labels tragen Titel und Datum, und die Reihe „weitere“ ist betitelt. Es geht nichts verloren und es wird nichts falsch geschrieben, es fehlt nur Orientierung in der Auswahl. Die Vorschläge sind stimmig: Im Vergleich so rollen, dass „hier“ und das Gegenüber beide sichtbar sind. Leise Verläufe an den Rändern. Ein Kurztitel-Span für jede Perle, eingeblendet bei :hover und :focus-visible.

### bild-stoff 8 · Reste von Kleinst- und Schattenschrift, „ungefähr hier“ zu breit für seine Spalte
- **datei:** app/stil.css
- **zeile:** 423
- **schwere:** leicht
- **befund:** Befund 8 ist teilweise behoben: Die dort genannten Klassen stehen jetzt auf ink-soft und 11 px. Übrig sind:
- Passagennummern in ink-faint 11 px. Sie sind Knöpfe, die die Stelle merken und den Absatz kopieren.
- „Das Material endet hier.“ in ink-faint.
- Die Etiketten „Passage N“ und „gegenüber N“ im Wortvergleich in 10 px ink-faint.
- .vergleich-kopf .klein und .grob in 10 px.
Vor allem „ungefähr hier“, die Ehrlichkeitsmarke bei der Ankunft über 2 der 5 Fäden, steht in 9 px und bricht nicht um. Es ist geschätzt ≈77 px breit (13 Zeichen SF Mono 9 px plus .06em Sperrung) und steht in einer Nummernspalte von 44 px, am Handy 30 px, mit 6 px Knopfrand. Am Mac läuft es damit ≈17 px in die Textspalte, am Handy ≈40 px; in Firefox würde es abgeschnitten. Kein Bild zeigt diesen Fall, das ist nur gerechnet.
- **beleg:** stil.css:319 (.nr ink-faint), 348 (.stoff-ende ink-faint), 381 (.nr-klein 10 px ink-faint), 356 (.vergleich-kopf .klein 10 px), 423 („ungefähr hier“ 9 px, nowrap), 424 (.grob 10 px), 317 und 391 (Spaltenbreite 44 px bzw. 30 px). Bildstellen: gewebe2-08, Passagennummern 1–3 bei x≈45, hellstes Pixel 51 gegen 133 bei der ink-soft-Zeile. gewebe2-10, „Das Material endet hier.“ bei y≈530, hellstes Pixel 63. Ungefähr-Fälle aus faeden-ziel.mjs: KiNTEGRiTY ×2, gedankenspirale ×4.
- **vorschlag:** Passagennummer, Ende-Zeile und .nr-klein auf ink-soft heben. „ungefähr hier“ mindestens 11 px groß setzen und nicht unter die Nummer stellen, sondern als eigene Zeile über den Passagentext oder in den Rand.
- **Gegenprüfung:** echt, Schwere leicht: Der Kern des Befunds lässt sich nicht widerlegen: „ungefähr hier“ läuft aus seiner Spalte in den Lesetext. Die übrigen Punkte zur Kleinschrift sind dagegen eher Geschmack.

1) „ungefähr hier“ (stil.css:423 bei 35c59bc) ist belegt.
- Die Regel `.passage.ungefaehr .nr::after{content:" ungefähr hier";display:block;font-size:9px;letter-spacing:.06em;white-space:nowrap}` erbt die Schrift von .nr, also var(--f-measure) (stil.css:13, 319).
- Ich habe die Breite mit CoreText nachgemessen (Skript: /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/widerlegung-kleinschrift/mess.swift). Für 13 Zeichen bei 9 px und 0,54 px Sperrung ergibt SFNSMono 79,3 px und Menlo 77,5 px. „SF Mono“ und „IBM Plex Mono“ sind auf dem Mac nicht als Familie installiert, deshalb gilt einer dieser beiden Werte. Die Schätzung „≈77 px“ stimmt also.
- Die Nummernspalte ist am Mac 44 px breit, die Lücke 22 px (stil.css:317). Der Knopf hat keinen eigenen Rand links und rechts, also gilt der Browser-Rand von 6 px; eine globale Rücksetzung gibt es nicht, nur `button{font:inherit;color:inherit}` in Z. 23.
- Breite Zeilen laufen in LTR auch bei text-align:right nach rechts über. So machen es WebKit und Blink, und so steht es in CSS Text 3.
- Rechnung Mac: Das Etikett reicht von x=6 bis ≈83–85. Der Text beginnt bei 66, das ergibt ≈17–19 px Überlappung.
- Rechnung 375 px: Die Spalte ist 30 px breit, die Lücke 10 px (Z. 391). Wegen min-width:36px ist der Knopf 36 px breit. Das Etikett reicht von 6 bis ≈85, der Text beginnt bei 40, das ergibt ≈44 px Überlappung.
- Senkrecht liegt das Etikett bei y≈19–30. Das ist unter dem Padding von 6 px und der 13 px hohen Nummernzeile, also genau im Unterlängenbereich der ersten Textzeile (18 px × 1,68). Bei einer Überschrift am Passagenbeginn trifft es deren obere Glyphen.
- Der Fall ist erreichbar. Neu in 35c59bc ist haupt.js:209 (folgeFaden): Gibt es den Fund mehrfach, wird ungefaehr gesetzt. Schon vorher gab es den Weg über stoff.js:325 (folge aus einer Randnotiz).
- Ich habe faeden-ziel.mjs gegen kette-gewebe und kette-claude laufen lassen. Beide liefern „Grundfassung“ (Passage 4, ×2) und „gedankenspirale“ (Passage 1, ×4). Die Ankunft markiert dann nur .ungefaehr, nicht .stelle (stoff.js:432–434), damit ist das ::after sichtbar.
- Die Regel stand schon in 26356a7 (stil.css:372). Das ist also keine Regression, aber ein Fehler, der im geprüften Stand weiter besteht. Der Faden-Weg in 35c59bc macht ihn häufiger.
- Fehlbild: Gerade die Ehrlichkeitsmarke liegt quer unter den ersten Wörtern der Passage, am Handy unter dem ersten Wort oder den ersten beiden.

2) Die ink-faint-Reste sind nicht folgenreich.
- Gemeint sind die Passagennummern (Z. 319), „Das Material endet hier.“ (Z. 348) und .nr-klein (Z. 381).
- In gewebe2-10 sind die Nummern 2–5 und die Ende-Zeile blass, aber erkennbar.
- Die Nummern werden bei Hover und Fokus heller (Z. 321). Die Ende-Zeile ist nur eine Schlussmarke.
- .vergleich-kopf .klein (Z. 356) und .grob (Z. 424) stehen bereits auf ink-soft. Bei ihnen bleibt nur die Größe von 10 px.
- Das Anheben dieser Stellen ist Gestaltungswunsch, kein belegter Fehler.

Schwere bleibt leicht:
- Es geht kosmetisch um 9-px-Text im Unterlängenbereich.
- Die Funktion ist nicht betroffen.
- Kein Standbild zeigt den Fall, es ist gerechnet.
- Ob Firefox den Text abschneidet, ist nicht geprüft.

Vorschlag: Das Etikett als eigene Zeile über den Text in Spalte 2 setzen, oder white-space:normal mit mindestens 11 px. Allein „größer“ würde das Überlaufen verschlimmern: bei 11 px misst es ≈95–97 px.

### bild-zelle 5 · Raster bleibt sichtbar, bei Kimi und Hermes sogar regelmäßiger als vorher
- **datei:** app/js/zelle.js
- **zeile:** 130
- **schwere:** leicht
- **befund:** Die Ausbrenner aus Befund 10 sind behoben: Die Blätter der Zentrale kommen höchstens auf 152 bis 203/255, es gibt keine weißen Ovale mehr. Der Kommentar verspricht aber „damit kein Raster entsteht“, und das hält nicht:
- Das rosa Blatt (Kimi) steht als gleichmäßiges Punktgitter, Hermes ebenso.
- Im violetten Blatt (Antigravity) laufen senkrechte Striche wie Moiré.
- In „Ein Inhalt“ liegt Claudes Fächer in Kammstrichen.
Nachgerechnet über die Streuung der Nachbarabstände (Variationskoeffizient; ein Gitter liegt bei etwa 0,1 bis 0,2, Zufall bei 0,52):
- Kimi: vorher 0,38, jetzt 0,30. Hermes: vorher 0,43, jetzt 0,31. Beide sind also regelmäßiger geworden.
- Antigravity: 39 % der Körner haben einen Nachbarn näher als 0,3 Kornabstände, daraus entstehen die Striche.
Ursache: Der radiale Versatz 2,2·(hi−lo)/c (Z. 130) beträgt etwa einen Rangschritt. Er ist viel kleiner als der Reihenabstand des Goldschnitt-Gitters. Auch der Querversatz 1,4/√c (Z. 128) bleibt klein.
- **beleg:** gewebe2-04: rosa Blatt bei (345–435, 160–270) als Gitter, violettes Blatt mit senkrechten Strichen bei (315–352, 395–415); gewebe2-05: oranger Fächer bei (400–480, 290–340) in Kammstrichen. Rechnung: /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/raster.mjs (alt gegen neu, Zentrale).
- **vorschlag:** Die Querlage nicht aus der Goldschnittfolge nehmen, sondern als Streuung mit Mindestabstand (Hash mit Abstoßung). Den radialen Versatz am Reihenabstand bemessen (etwa √c Rangschritte), nicht an einem Rangschritt.
- **Gegenprüfung:** echt, Schwere leicht: Im Kern stimmt der Befund: Die Reihen sind nicht gebrochen, und die Ursache liegt in Z. 130. Mehrere Teilbehauptungen sind aber falsch und müssen gestrichen werden.

**Was stimmt**
- **Code.** Z. 129 verspricht, die Körner „radial um etwa einen Kornabstand“ zu verwackeln. Z. 130 verwackelt aber nur um ±1,1·(hi−lo)/c, also ±1,1 Rangschritte. Nachgerechnet gegen den mittleren Nachbarabstand im eigenen Blatt (kette-gewebe, Zentrale, Blätter 0, 1, 2, 4, 5) sind das nur ±0,12 bis 0,16 Kornabstände. Quer (Z. 128) sind es ±0,41, das passt zu „halben Kornabstand“. Radial ist der Versatz damit viel kleiner als der Reihenabstand des Goldschnitt-Gitters.
- **Draufsicht.** Ich habe die Kornlagen alt und neu als Bild ausgegeben: widerlegung-raster/neu-zentrale-flip.png und alt-zentrale-flip.png. Aus dem scharfen 2D-Gitter von vorher sind gebogene Querreihen geworden, wie Rillen. Am deutlichsten ist das bei Kimi und Antigravity, schwächer bei Codex und Claude. Die Querverwacklung schiebt die Körner nur innerhalb ihrer Reihe hin und her.
- **Standbild.** In gewebe2-04 entsprechen dem die senkrechten Striche im violetten Blatt bei etwa (315–352, 395–415), in 9-facher Vergrößerung gut zu sehen, und die Reihen im rosa Blatt.
- **Gitterordnung, gemessen.** Ich habe die Bragg-Spitze des Strukturfaktors in Fenstern zu 60 Körnern berechnet (fenster.mjs). Neu liegt sie bei 18 bis 24. Gleichverteilte Querlage ergibt 7 bis 9, die reine Goldfolge ohne Verwackeln 28 bis 36. Die Verwacklung nimmt also nur etwa ein Drittel der Ordnung weg. Der Kommentar „damit kein Raster entsteht“ hält nicht.

**Was falsch ist**
1. **„Kimi und Hermes regelmäßiger als vorher“.** Der Variationskoeffizient der Nachbarabstände misst, wie gleichmäßig die Abstände sind, nicht ob ein Raster entsteht. Gerade die vorgeschlagene Streuung mit Mindestabstand läge ebenfalls bei 0,1 bis 0,2. Im Bild war das alte rosa Blatt (gewebe-03) ein scharfes Schraffurgitter, das neue ist sichtbar lockerer. Auch die Fenstermessung fällt: Kimi von 26,6 auf 21,8, Hermes von 20,1 auf 18,1. Richtig ist: Das Gitter ist zu Streifen geworden, nicht regelmäßiger.
2. **Hermes „ebenso“ ein Gitter.** Das grüne Blatt in gewebe2-04 wirkt gestreut, das hält am Bild nicht.
3. **Antigravity, 39 % der Körner mit Nachbar unter 0,3·d0.** Das belegt kein Raster. Eine Zufallsverteilung gleicher Dichte ergibt schon 1−exp(−0,283·Dichte), also 25 bis 38 %.
4. **„Kammstriche“ in „Ein Inhalt“.** Das sind die Finger des Fächers aus einzelnen Claude-Blättern (Draufsicht neu-ein.png). Das ist die gewollte Fächergestalt, kein Raster.

**Schwere: leicht.** Der Mangel betrifft nur die Textur. Die erste Kritik hat den Rasterteil schon „eher Geschmack“ genannt. Echt bleibt er, weil der Commit genau diesen Teil von Befund 10 zu beheben verspricht (Kommentare Z. 127 und 129) und das radial nicht leistet.

**Zum Vorschlag.** Den radialen Versatz am Reihenabstand bemessen ist richtig, also mehrere Rangschritte statt einem. Den Erfolg sollte man aber an der Bragg-Spitze und am Bild prüfen, nicht am Variationskoeffizienten.

Rechnungen und Bilder liegen in /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/widerlegung-raster/: ordnung.mjs, fenster.mjs, draufsicht.mjs und die Bildausschnitte z04_*.jpg und z03alt_kimi.jpg.

### bruch 1 · Tippen während des Aufzugs wählt noch unsichtbare Fassungen (Werke mit mehr als 60 Ausprägungen)
- **datei:** app/js/bedienung.js
- **zeile:** 299
- **schwere:** mittel
- **befund:** Der neue Zweig in trefferSame für Monde mit mehr als 60 Ausprägungen rastet auf die Blattmitte (mittePos) ein. Er prüft aber nicht, ob die Ausprägung schon geboren ist; der alte Kornzweig überspringt dagegen gBorn === -1 (Z. 304). Betroffen sind „Ein Inhalt, viele Verwendungen“ (71), „FASKA Varianten · Vergleich“ (196) und „… Jahreskreise (Netz) · Vergleich“ (98). Werden sie aus dem Netz geöffnet (api.oeffneMond(i, {})), läuft der Aufzug 13 s. Ein Tippen in die Scheibe gibt in dieser Zeit fast immer eine noch unsichtbare Fassung zurück. Dadurch erreicht tippen() den Zweig „!t → Z.sofort()“ nicht mehr (Z. 352–353), und Tippen kürzt den Aufzug nicht ab. Stattdessen erscheint die Marke einer Fassung an einer leeren Stelle, und ein zweites Tippen öffnet ihre Lesefläche. Ebenso greifen am Mac die Hover-Marke und beim Halten das Verbinden (pressSeed, Z. 396) auf ungeborene Fassungen.
- **beleg:** Rechnung /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/aufzug-treffer.mjs (kette-gewebe, 1200×800, Zelle mit Aufzug, Tippraster 13 px im Feld ±260 px). „Ein Inhalt“: nach 1 s sind 0/71 geboren, und alle 34 Treffer sind ungeboren; nach 6 s sind 136 von 298 Treffern ungeboren. „FASKA Varianten · Vergleich“: nach 1 s sind alle 98 Treffer ungeboren, nach 6 s 210 von 291. Code: bedienung.js:299–302 ohne gBorn-Prüfung, im Gegensatz zu 304.
- **vorschlag:** Im Zweig für mehr als 60 Ausprägungen nur geborene Fassungen zulassen, z. B. überspringen, wenn Z.gBorn[Z.seedCore[i]] === -1. Dann kürzt Tippen ins Leere den Aufzug wieder ab, und Hover und Verbinden zielen nur auf Sichtbares.
- **Gegenprüfung:** echt, Schwere leicht: Der Kern des Befunds stimmt, er ist aber deutlich überzeichnet.

Was stimmt:
- In app/js/bedienung.js:299–302 (Zweig für Monde mit mehr als 60 Ausprägungen) fehlt die Prüfung auf gBorn. Der Kornzweig in Z. 304 überspringt dagegen `gBorn === -1`. Diese Prüfung bringt erst 35c59bc mit; vorher lief jede Zelle über den Kornzweig mit dieser Prüfung. Es ist also ein Rückschritt.
- Ungeborene Körner werden nicht gezeichnet (zelle.js:412). Auch ihre Stiele fehlen (zelle.js:542). mittePos (zelle.js:204–208) liefert aber schon die endgültige Blattmitte.
- Die drei genannten Monde gibt es in kette-gewebe mit 71, 98 und 196 Ausprägungen. Der Aufzug dauert dort D = clamp(3.5 + 0.55·n, 6, 13) = 13 s (zelle.js:170). Er startet, wenn ein Mond aus dem Netz mit {} geöffnet wird (haupt.js:113), aber nicht bei reduzierter Bewegung (zelle.js:56).
- Die Marke erscheint an der leeren Blattmitte (bedienung.js:540). Ein zweites Tippen in der Nähe öffnet über den 28-px-Vorrang (Z. 345–346) die Lesefläche. Ebenso greifen die Hover-Marke (hoverPruefen) und pressSeed (Z. 396, haupt.js:424) auf ungeborene Fassungen.

Was nicht stimmt:
- „Fast immer“ und „Tippen kürzt den Aufzug nicht ab“ sind falsch. Das zeigen schon die eigenen Zahlen des Prüfers: Nach 1 s treffen nur 34 von 1681 Tipps etwas, also schneiden 98 % den Aufzug weiter ab. Nach 6 s schneiden 1383 von 1681 ab.
- Meine Nachrechnung über ein 12-px-Raster auf dem ganzen Schirm, jeweils nur Tipps innerhalb des sichtbaren Kreises der geborenen Körner:
  - Mac (1200×800): Tipps auf eine ungeborene Fassung machen 0–13 % aus, den Höchstwert hat „FASKA Varianten · Vergleich“ bei 6 s. Bei „Jahreskreise“ sind es fast immer 0 %.
  - Handy (375×812): höchstens 27 % („FASKA Vergleich“ bei 6 s), 15 % bei „Ein Inhalt“ (4 s).
- Mehrfach gibt der neue Code sogar öfter „leer“ zurück als der alte Kornzweig, zum Beispiel bei „Jahreskreise“ nach 8 s: 2158 gegenüber 1317 Tipps. Das Abkürzen wird also oft eher leichter.

Folge: Etwa jedes zehnte, am Handy bis jedes vierte Tippen in die wachsende Zelle zeigt die Marke einer noch unsichtbaren Fassung, statt abzukürzen. Ein zweites Tippen öffnet deren Lesefläche. Das ist ein echter, sichtbarer Fehlgriff, aber:
- er dauert höchstens etwa 14 s,
- er betrifft nur drei Monde und nicht die reduzierte Bewegung,
- es entstehen keine falschen Daten: Die Fassung gibt es wirklich, und Verbinden fragt nach (kanteFragen).

Daher ist der Befund echt, aber leicht, nicht mittel. Der Vorschlag ist richtig und vollständig: im Zweig für mehr als 60 Ausprägungen `if(Z.gBorn[Z.seedCore[i]] === -1) continue;` ergänzen.

Beleg: /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/widerlegung-aufzugtreffer/nach.mjs (Aufruf mit dem Argument 1200x800 bzw. 375x812).

### bruch 5 · Nach einem Faden springt Escape im selbst geöffneten Leseraum ins Netz statt zurück in die Lesefläche
- **datei:** app/js/haupt.js
- **zeile:** 204
- **schwere:** leicht
- **befund:** folgeFaden legt {netz: true, ausStoff: true} auf den Weg. Das passiert auch dann, wenn der Faden keinen Teil nennt und nur die Lesefläche aufgeht (Z. 206). Öffnet Ralf danach in diesem Werk selbst „Ganz lesen“, an derselben oder einer anderen Ausprägung, führt Escape oder „zurück“ über zurueckAusStoff (Z. 177–178) wegen w.ausStoff sofort zu zurueck() → zumNetz (Z. 146). Er landet im Netz statt wieder in der Lesefläche. Die Ansage beim Öffnen des Leseraums sagt dabei „Escape führt zurück in die Zelle.“ (stoff.js:86). Das gilt, solange der Netz-Eintrag oben auf dem Weg liegt, also für den ganzen Besuch des Werks.
- **beleg:** haupt.js:204 (dahin mit ausStoff: true), 206 (ohne Teil nur ortAktualisieren), 175 (rueckSatz → „zurück zum Faden im Netz“), 177–178, 146; stoff.js:86 (Ansage). Nachgegangener Weg: ein Faden ohne Verwendung, z. B. „FASKA Eigenraum → MOONFiNGERS“ (2 Verbindungen, keine mit Verwendung, laut faden-kanten.mjs) → Lesefläche → „Ganz lesen“ → Escape → Netz.
- **vorschlag:** ausStoff nur setzen, wenn folgeFaden den Leseraum selbst öffnet (mitTeil). Sonst den Netz-Eintrag erst nach Lesefläche und Abwahl wirken lassen. Die Ansage im Leseraum aus rueckSatz() ableiten.
- **Gegenprüfung:** echt, Schwere leicht: Der Befund stimmt. Ich habe den Code gelesen und den Weg nachgerechnet; widerlegen ließ er sich nicht.

**Der Weg im Code (Stand 35c59bc; folgeFaden ist in diesem Commit neu):**
- haupt.js:204–205: `oeffneMond(i, {waehle: ziel, stufe: 2})` läuft ohne `behalteWeg`. Damit leert Z. 107 den Weg (`U.weg = []`). Danach liegt `{netz: true, faden, dach, ausStoff: true}` allein oben auf dem Weg, ganz gleich, ob `mitTeil` gilt.
- Z. 206: Ohne Teil endet folgeFaden nach `ortAktualisieren()`. Offen ist dann nur die Lesefläche, der Leseraum öffnet nicht.
- Danach drückt Ralf „Ganz lesen“ (bedienung.js:219, `api.oeffneStoff(sel)`). Das legt nichts auf den Weg (haupt.js:174).
- Escape im Leseraum läuft über bedienung.js:432 und stoff.js:446 zu `zurueckAusStoff()` (haupt.js:177). Dort ist `w.ausStoff` wahr, also folgt `zurueck()`. In Z. 146 liegt oben ein Netz-Eintrag, also folgen `pop` und `zumNetz()`. Ralf landet im Netz, die Zelle ist zu, die Lesefläche weg.
- Ohne diesen Eintrag führt derselbe Leseraum zurück in die Lesefläche (Z. 179–182). Auch die Lesefläche selbst geht Schritt für Schritt zurück: Lesefläche zu, Auswahl weg, erst dann ins Netz (bedienung.js:507–511). Nur der selbst geöffnete Leseraum überspringt diese drei Stufen.
- Im Netz holt ihn ein weiteres Escape nicht in die Zelle zurück. Es hebt zuerst die Auswahl des Fadens auf, dann führt `ausDach()` aus dem Dach (Z. 145). Der Netz-Eintrag ist da schon vom Weg genommen.

**Wie oft das vorkommt:** Nachgerechnet mit pruefung2/faden-ohne-teil-zaehlen.mjs gegen kette-gewebe und kette-claude. In beiden Ketten hat bei 25 von 30 Fäden die erste Kante keinen `to_part`. Der Fall ohne Teil ist also der übliche Weg, kein Randfall. Beispiel: „FASKA Eigenraum → MOONFiNGERS“ mit 2 Verbindungen.

**Ansage:** stoff.js:86 sagt bei jedem Öffnen „Escape führt zurück in die Zelle.“. In diesem Fall ist das falsch. Dasselbe gilt im neuen Fall mit Teil, wo Escape ebenfalls ins Netz führt.

**Warum nur leicht:** Wer sieht, wird nicht getäuscht. Der Rück-Knopf im Leseraum trägt über `rueckSatz()` (haupt.js:175, stoff.js:197) ehrlich „zurück zum Faden im Netz“. Es geht nichts verloren und nichts wird geschrieben. Ralf muss nur das Werk und die Fassung neu anwählen.

**Warum es trotzdem ein Fehler ist:** `ausStoff` wird nur von `rueckSatz` und `zurueckAusStoff` gelesen. In folgeStoff bedeutet die Marke: „Den Leseraum hat der Sprung selbst geöffnet.“ Ohne Teil öffnet der Sprung keinen Leseraum. Die Marke ist dort also falsch gesetzt. Dazu kommt, dass die gesprochene Ansage dem Verhalten widerspricht.

### ehrlich 1 · Faden-Marke verspricht „tippen liest die Stelle“, obwohl der Teil im Wortlaut gar nicht steht
- **datei:** app/js/bedienung.js
- **zeile:** 94
- **schwere:** mittel
- **befund:** Die Marke eines Fadens schreibt „tippen liest die Stelle“, sobald usage.to_part gesetzt ist. Ob dieser Teil in der Zielfassung überhaupt vorkommt, wird nicht geprüft (verorte wird erst in folgeFaden aufgerufen). In der Testkopie gilt das für alle 7 Kanten mit beschriebener Verwendung an Netz-Fäden. Nur eine davon (F28, Genealogical Spiral) trifft eine eindeutige wörtliche Stelle. Bei vieren liefert verorte gar nichts (F0 k0 und k1: Durkheim → Radcliffe-Brown; F29 k0 und k1: Prüfbefund → Durkheim), bei zweien nur „ungefähr“. Erst nach dem Tippen kommt die Zeile „Den genannten Teil gibt es so nicht im Wortlaut.“. Die Marke stellt also eine Fundstelle in Aussicht, die es in den Daten nicht gibt. Dazu kommt: from_part wird nie gesucht. Bei F29 stünde der Teil der Ausgangsseite („Tatsächlich ausgeführt und konkrete Grenze“) als Abschnitt in der Prüfbefund-Fassung, gesprungen wird aber auf die Seite, deren Teil fehlt.
- **beleg:** Bild standbilder/gewebe2-11-faden-marke.jpg, Marke in der Bildmitte: „„Émile Durkheim“ verweist auf „Alfred Radcliffe-Brown“ · Verbindung 1 von 3 · „Arbeitsteilung …“ → „Strukturfunktionalismus: Institutionen und Stabil…“ · … · tippen liest die Stelle“. Nachgerechnet mit scratchpad/pruefung2/faeden.mjs auf testdaten/kette-gewebe: F0 k0 verortet(to)=null, F0 k1 verortet(to)=null, F29 k0/k1 verortet(to)=null (verortet(from)={index:2, art:'abschnitt'}), F26 {art:'wörtlich', mehrfach:2}, F27 {art:'wörtlich', mehrfach:4}, F28 {art:'wörtlich', mehrfach:1}.
- **vorschlag:** In markeFuer für die gewählte Kante vorab verorte(u.to_part, materialParagraphs(Zielfassung)) rechnen. Nur bei einem eindeutigen wörtlichen Fund „tippen liest die Stelle“ schreiben, bei mehrfachem oder Abschnittsfund „tippen liest ungefähr dort“, sonst „tippen folgt · der genannte Teil steht nicht im Wortlaut“. In folgeFaden auf from_part und die from-Fassung ausweichen, wenn nur dieser Teil gefunden wird.
- **Gegenprüfung:** echt, Schwere leicht: Ich konnte den Befund nicht widerlegen. Er ist belegt, aber die Folge ist kleiner als „mittel“.

Code: Die Stelle app/js/bedienung.js:94 kam erst in diesem Commit dazu. Im Diff wird aus „tippen folgt“ jetzt `u && u.to_part ? 'tippen liest die Stelle' : 'tippen folgt'`. Die Marke prüft also nur, ob to_part gesetzt ist. verorte wird erst nach dem Tippen aufgerufen, in folgeFaden (app/js/haupt.js:207). Findet verorte nichts, schreibt haupt.js:211 „Den genannten Teil gibt es so nicht im Wortlaut.“, und der Leseraum öffnet mit stelle=null am Anfang.

Nachgerechnet habe ich mit /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/widerlegung/faden-marke.mjs. Das Skript baut die Fäden genau wie netz.js:69–75 und nutzt dieselbe verorte-Logik wie stoff.js:49. Die Zahlen des Prüfers stimmen in kette-gewebe und in kette-claude:
- 7 Kanten an Netz-Fäden haben ein to_part.
- Nur F28 („Genealogical Spiral“) trifft eine eindeutige wörtliche Stelle.
- F26 (mehrfach 2) und F27 (mehrfach 4) treffen nur ungefähr.
- F0 k0, F0 k1, F29 k0 und F29 k1 ergeben null.

Mit inhalt.mjs habe ich nachgesehen, warum. In der Radcliffe-Brown-Fassung gibt es zwar die Überschrift „2. Der Strukturfunktionalismus“, aber nicht die Wendung „Strukturfunktionalismus: Institutionen und Stabilität“. Die Abschnittsregel in verorte greift dabei nicht. In keiner der beiden Durkheim-Fassungen kommt „Gespeicherte Fassung im Browser“ vor.

Bild: standbilder/gewebe2-11-faden-marke.jpg zeigt in der Bildmitte genau den Standardfall F0, Verbindung 1 von 3, „Arbeitsteilung …“ → „Strukturfunktionalismus …“. Die Marke endet dort mit „tippen liest die Stelle“, obwohl es diese Stelle nachweislich nicht gibt. Die Marke verspricht also in 4 von 7 Fällen etwas, das nicht eingelöst wird, auch im dokumentierten Vorzeigebild. Damit verstößt sie gegen den eigenen Grundsatz in stoff.js:48: „Keine erfundene Präzision.“ In den 2 Fällen, die nur ungefähr treffen, verspricht sie mehr Genauigkeit, als der Leseraum („ungefähr hier“) dann zeigt.

Warum nur leicht: Der Fehler führt an keine falsche Passage. Gleich nach dem Tippen korrigiert die Statuszeile ehrlich, und der Leseraum öffnet am Anfang, nicht an einer erfundenen Stelle. Daten nehmen keinen Schaden, und keine harte Regel wird verletzt.

Den Nebenpunkt zu from_part (F29: der Teil findet sich als Abschnitt in der Ausgangsfassung) halte ich für einen Gestaltungsvorschlag, nicht für einen Fehler.

Die Behebung ist billig: verorte schon in markeFuer für die gewählte Kante rechnen und den Text danach abstufen.

### ehrlich 3 · Im Überblick verschwindet der Ring eines der letzten fünf Einträge („die letzten paar immer“)
- **datei:** app/js/netz.js
- **zeile:** 180
- **schwere:** mittel
- **befund:** Neu trägt im Überblick je Bezirk nur das „zuletzt bewegte“ Werk (N.juengst, gewählt nach zeitspanne[1]) seine Ringe. Davon hängt jetzt auch der Zuletzt-Ring ab, den Ralf ausdrücklich für die fünf jüngsten Einträge immer wollte. Liegen zwei der fünf Einträge im selben Bezirk, verliert das ältere Werk seinen Ring. In der Testkopie trifft das gerade „Zentrale · Material bekommt Form“, das Werk, das beim Öffnen zuerst gezeigt wird: Es hat einen der letzten fünf Einträge, ist aber nicht juengst der Mitte (das ist „KiN OS · Sichten“), und hat darum im Netz-Überblick keinen Ring. BERICHT.md behauptet weiter: „Die fünf jüngsten Einträge tragen einen leisen Ring, im Netz am Mond“. Dazu kommt: juengst rechnet mit zeitspanne[1], also auch mit Ralfs eigenen Einträgen und behaltenen Formen. ankunft.letzte schließt genau diese aus. Ein Behalten Ralfs kann den Ring also auf ein Werk ohne Zuletzt-Eintrag schieben. Mit derselben Bedingung (netz.js:173/177) verschwindet im Überblick auch der goldene Phasenring eines kristallisierten Werks, wenn es nicht das jüngste seines Bezirks ist.
- **beleg:** netz.js:64–67 (juengst nach zeitspanne[1]), netz.js:173 `ringe = imDach != null ? bz === imDach : N.juengst.has(n)`, netz.js:180 Zuletzt-Ring nur bei `ringe || self || hov`. Rechnung scratchpad/pruefung2/netz.mjs (kette-gewebe): ZULETZT = 4× „KiN OS · Sichten“, 1× „Zentrale · Material bekommt Form“ (19.10., 20:54 UTC); „Zentrale · Material bekommt Form“ Bezirk Zentrale, juengst? false.
- **vorschlag:** Die Zuletzt-Ringe (höchstens fünf) von juengst abkoppeln und im Überblick immer zeigen. Nur die Phasenringe ausdünnen, den goldenen Ring eines kanonischen Werks ausgenommen. Falls juengst bleibt, mit ankunft.letzte bzw. ohne Ralfs Einträge und Formen rechnen statt mit zeitspanne[1].
- **Gegenprüfung:** echt, Schwere leicht: Der Kern des Befunds stimmt. Ein Teil der Begründung ist falsch, und die Folgen sind kleiner als gemeldet.

Belegt:
- Rückschritt gegenüber 26356a7: Dort zeichnete netz.js:140 den Zuletzt-Ring an jedem Werk mit einem der fünf jüngsten Einträge, ohne weitere Bedingung („else if(N.zuletzt && N.zuletzt.has(m.id))“). Seit 35c59bc braucht er im Überblick `ringe || self || hov`, also N.juengst (netz.js:173/180).
- juengst wird nach zeitspanne[1] gewählt (netz.js:64–67). In zeitspanne stecken alle Fassungen eines Werks (daten.js:115/194), also auch Ralfs eigene Einträge und behaltene Formen. ankunft.letzte schließt genau diese aus (ankunft.js:76–77). Die beiden Mengen sind also verschieden berechnet.
- Nachgerechnet mit scratchpad/pruefung2/widerlegung/zuletzt-ring.mjs. Bei kette-gewebe und kette-claude gilt gleich: ZULETZT = 4× „KiN OS · Sichten“ und 1× „Zentrale · Material bekommt Form“, beide Werke in der Mitte. juengst der Mitte ist nur „KiN OS · Sichten“, „Material bekommt Form“ trägt im Überblick also keinen Zuletzt-Ring.
- Schärfer, mit scratchpad/pruefung2/widerlegung/ralf-eintrag.mjs, nur im Speicher: Ein einziger Eintrag von Ralf in „Ein Inhalt, viele Verwendungen“ macht dieses Werk zum juengst der Mitte. Danach hat keines der beiden Zuletzt-Werke im Überblick noch einen Ring, obwohl letzte() unverändert bleibt. Ist Ralf gerade in diesem Werk (aktiv), zeigt der ganze Überblick keinen einzigen Zuletzt-Ring mehr. Das widerspricht Ralfs „die letzten paar immer“ (ankunft.js:70) und dem unveränderten Satz in BERICHT.md:54 („im Netz am Mond“).

Widerlegt oder überzeichnet:
- „Das Werk, das beim Öffnen zuerst gezeigt wird“ trifft auf die Testkopien nicht zu. Ohne Merker startet kette-gewebe in „Émile Durkheim“ (haupt.js:575f., nach zeitspanne[1]) und kette-claude in „KiN OS · Sichten“. Wäre „Material bekommt Form“ das offene Werk, hätte es über `self` (aktiv) seinen Ring ohnehin.
- Der übliche Weg hinaus führt nicht in den Überblick, sondern in den Bezirk des offenen Werks: zumNetz setzt U.dach = bezirk(W.aktiv) (haupt.js:138). Dort gilt ringe = (bz === imDach), und alle Zuletzt-Werke der Mitte tragen ihren Ring. Er fehlt erst nach einem weiteren Schritt hinaus, im ganzen Überblick.
- Auch in der Zelle bleiben die Zuletzt-Körner markiert (zelle.js:447), und der Satz zum jüngsten Eintrag steht beim Start. Das Bild ist also nicht leer.
- Goldener Phasenring: Die Ausdünnung im Überblick ist gewollt (Bildkritik: Ringknoten in der Mitte). Das Gold bleibt in den Punkten erhalten, denn miniWuchs mischt GOLDC bei grundformation ein (netz.js:30/31). In den Testdaten gibt es kein kanonisches Werk. Das ist kein eigener Fehler.

Urteil: Die Ausdünnung bricht im Überblick die Zusage „die letzten fünf immer“, und Ralfs eigener Eintrag kann dort alle Zuletzt-Ringe löschen. Der Befund ist echt, wiegt aber leicht: Es geht um eine leise Markierung in einer Ansicht, die man erst nach einem zweiten Schritt hinaus sieht, und ein Werkbeispiel des Prüfers ist falsch.

Abhilfe: Zuletzt-Ringe (höchstens fünf, ankunft.letzte) von juengst lösen. Nur die Phasenringe ausdünnen.

### ehrlich 4 · Bündel zeigt nur den häufigsten Typ: ein Widerspruch oder eine Übernahme darin verschwindet
- **datei:** app/js/netz.js
- **zeile:** 83
- **schwere:** leicht
- **befund:** Ein Bündel wird ganz im Stil seines häufigsten Kantentyps gezeichnet (x.typ). Typen in der Minderheit sind im Überblick unsichtbar: Ein „widerspricht“ verliert seine Unterbrechung, ein „remixt-aus“ seinen Materialfluss. Bei Gleichstand gewinnt der zuerst eingefügte Typ. Die Marke des Bündels („A → B · n Fäden · k Verbindungen“, bedienung.js:98) nennt keinen Typ, auch dort erfährt man es nicht. Der Pfeil bedeutet je nach Typ etwas anderes (Material fließt von, verweist auf, gehört zu). In der Testkopie sind derzeit alle sechs Bündel reine „verweist-auf“-Bündel, der Fehler zeigt sich dort also noch nicht.
- **beleg:** Simulation nur im Speicher (scratchpad/pruefung2/buendel.mjs): eine Kante REiMWERK „widerspricht“ „Die Wörter bleiben …“ zur Testkopie hinzugefügt → Bündel Text und Reim → KiNTEGRiTY: typ 'verweist-auf', typen [[verweist-auf,4],[widerspricht,1]], 5 Kanten. Gezeichnet wird es mit STIL['verweist-auf'] (ohne Lücke), die Marke lautet „Text und Reim → KiNTEGRiTY · 5 Fäden · 5 Verbindungen“.
- **vorschlag:** Bei gemischten Bündeln die Typen in der Marke nennen (etwa „4 verweisen · 1 widerspricht“). Im Bild einen Widerspruch nie überdecken, etwa mit eigener Lücke oder einem Aschepunkt im Bündel, sobald x.typen 'widerspricht' enthält, und Materialfluss zeigen, sobald es eine Übernahme gibt.
- **Gegenprüfung:** echt, Schwere leicht: Ich konnte den Befund nicht widerlegen. Er ist echt, bleibt aber leicht, weil er in den heutigen Daten nicht auftritt und man die Fäden einen Schritt tiefer wiederfindet.

Code: Die Bündel kommen erst mit 35c59bc. In 26356a7 zeichnete der Überblick jeden Faden einzeln mit seinem eigenen STIL[f.typ]. app/js/netz.js Z. 82 zählt die Typen je Bündel in x.typen. Z. 83 nimmt davon nur den häufigsten als x.typ. Bei Gleichstand gewinnt der zuerst eingefügte Typ, weil sort stabil ist. Z. 208–217 zeichnen den Bogen nur mit STIL[x.typ]. Die Lücke für „widerspricht“ (luecke, ASCHE) und das Fließlicht für „remixt-aus“/„erweitert“ (fluss: 'material') hängen allein daran. Typen in der Minderheit hinterlassen keine Spur. Die Marke in bedienung.js Z. 95–98 nennt nur „A → B“, die Zahl der Fäden, die Zahl der Verbindungen und die Verwendung, aber keinen Typ. Der Bericht verspricht dagegen „Fäden zwischen Werken zeigen Typ und Richtung“ und „unterbrochen bei ‚trägt nicht‘“ (BERICHT.md Z. 28 und 80). Ein Widerspruch soll also sichtbar bleiben.

Nachgerechnet (scratchpad/pruefung2/widerlegung/buendel-typen.mjs, nur gelesen): In kette-gewebe und kette-claude gibt es je 30 Fäden und 6 Bündel. Alle Bündel sind reine „verweist-auf“-Bündel. Die einzige „widerspricht“-Kante liegt innerhalb eines Werks und wird gar kein Faden. Die vier „remixt-aus“-Kanten liegen innerhalb eines Werks oder Bezirks. Heute sieht man den Fehler also nicht, das gibt der Prüfer selbst an. Seine Simulation (buendel.mjs) habe ich nachgefahren. Sie liefert „Bündel 7 -> 2 typ verweist-auf [[verweist-auf,4],[widerspricht,1]] kanten 5“. Sobald eine Übernahme oder ein Widerspruch über eine Bezirksgrenze hinzukommt, zeigt der Überblick ihn nicht. Das ist ein naheliegender Fall, wenn der Bestand wächst.

Warum nur leicht:
- Im Bezirk zeichnet Z. 190–192 jeden Faden mit seinem eigenen Stil.
- Zweimal auf das Bündel tippen ruft buendelHinein (bedienung.js Z. 372f.) auf, und dann führt F durch die übrigen Fäden.
- Ein gewähltes Werk zeigt seine Fäden einzeln (beteiligt).

Die Auskunft geht also nicht verloren. Nur der Überblick gibt den Inhalt eines gemischten Bündels unehrlich wieder. Der Vorschlag ist billig und passt dazu: die Typen in der Bündelmarke nennen, Widerspruch und Materialfluss im Bogen nie überdecken.

### ehrlich 5 · Teile-Pfeil läuft bei „übernimmt Material aus“ gegen die Flussrichtung
- **datei:** app/js/bedienung.js
- **zeile:** 92
- **schwere:** leicht
- **befund:** Die Faden-Marke setzt die Teile immer als „from_part → to_part“. Bei „remixt-aus“ lautet der Satz „„B“ übernimmt Material aus „A““ (bedienung.js:87, B = Werk der from-Fassung), und im Bild wandern die Lichter von A nach B. from_part liegt aber in B (so ordnet es stoff.js verwendungen() zu: raus → teil = from_part). Der Pfeil zeigt also vom übernehmenden Teil zum Quellteil, gegen Satz und Bild. Der Kommentar verspricht „welcher Teil wohin geht“. In der Testkopie gibt es noch kein „remixt-aus“ mit Verwendung (4 ohne usage), der Fehler ist also noch nicht sichtbar.
- **beleg:** bedienung.js:87 Satz mit Bm = monde[f.nach] = Werk der from-Fassung; bedienung.js:92 `[from_part, to_part].join(' → ')`; netz.js:87 `von = fliesst ? b : a` (b = Werk der to-Fassung); stoff.js verwendungen(): from_part gehört zur from-Fassung. Kantenzählung kette-gewebe: ('remixt-aus', usage) = 0, ('remixt-aus', ohne) = 4.
- **vorschlag:** Bei fließenden Typen (remixt-aus) die Reihenfolge umdrehen: „to_part → from_part“, also vom Quellteil zum übernehmenden Teil. Oder die Teile ohne Pfeil als „aus „…“ · in „…““ benennen.
- **Gegenprüfung:** echt, Schwere leicht: Der Befund lässt sich nicht widerlegen. Die Lesart, dass from_part in der übernehmenden Fassung liegt, bestätigt die Quelle selbst, nicht nur stoff.js.

Code: netz.js:71-72 setzt bei fließenden Typen von = b (Werk der to-Fassung) und nach = a (Werk der from-Fassung). netz.js:197-201 lässt das Licht von f.von nach f.nach laufen; der Kommentar dort sagt „Material fließt sichtbar zur neuen Fassung“. bedienung.js:87 bildet den Satz „Bm (= from-Werk) übernimmt Material aus A (= to-Werk)“. Beides ist richtig. bedienung.js:92 schreibt dagegen fest `[from_part, to_part].join(' → ')`. Der Pfeil zeigt also vom übernehmenden Teil zum Quellteil und läuft gegen das Licht.

Beleg aus SPiRALCELLS (nur gelesen): /Volumes/ThunderBolt4_2TB/Development/Projects/mooncells/server/store.py, etwa Zeile 484-488, legt beim Weiterverwenden eine Kante „remixt-aus“ an, mit from_variant_id = neue Fassung, to_variant_id = Quelle und der Verwendung daran. /Volumes/ThunderBolt4_2TB/Development/Projects/mooncells/server/static/workspace.js:761-762 füllt dazu from_part = „Gesamte neue Fassung“ und to_part = den Quellteil. Das ist genau der Weg, auf dem Ralf im Materialraum Material weiterverwendet.

Konkretes Fehlbild, sobald so eine Kante im Bestand liegt: Die Marke zeigt „„Neu“ übernimmt Material aus „Quelle“ · „Gesamte neue Fassung“ → „<Abschnitt der Quelle>““. Gelesen heißt das: die neue Fassung geht in den Quellabschnitt. Satz und Licht sagen das Gegenteil. Die eigene Oberfläche von SPiRALCELLS vermeidet diese Falle; sie setzt keinen Pfeil, sondern „Hier/Dort“ (workspace.js:443-444, 452).

In den Testdaten noch nicht sichtbar. Nachgezählt mit /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/teilpfeil.mjs: in kette-gewebe, kette-claude und testdaten/state.json ist ('remixt-aus', usage) = 0 und ('remixt-aus', ohne) = 4.

Nebenbefunde:
- Die eine „erweitert“-Kante mit Verwendung zeigt dieselbe Reihenfolge, also B-Teil → A-Teil gegen das Licht. Bei „B erweitert A“ ist das aber vertretbar lesbar und kein klarer Fehler. Ein Umdrehen sollte deshalb nur „remixt-aus“ betreffen, nicht pauschal alle fließenden Typen.
- Das Datenfeld usage.direction (Werte from-to, to-from, both laut mooncells/server/models.py:185) wird ganz übergangen.

Schwere leicht: Es geht nur um den Marken-Text. Es gehen keine Daten verloren, und „tippen liest die Stelle“ führt richtig zur to-Fassung und zu to_part (haupt.js:202-207). Vorschlag: bei „remixt-aus“ die Teile als „to_part → from_part“ setzen, oder ohne Pfeil als „aus „…“ · in „…““.

### ehrlich 7 · Die Mitte zählt Lesematerial als Werke, die Dächer nicht
- **datei:** app/js/bedienung.js
- **zeile:** 81
- **schwere:** leicht
- **befund:** Die Marke der Mitte sagt „die Mitte · 9 Werke · 9 Dächer darum“. werkeIn('mitte') hängt aber das Lesematerial an (Durkheim, Radcliffe-Brown), und laut ordnung.js „ist Lesematerial kein Werk“. Es sind 7 Werke und 2 Lesematerialien. Die Zeile selbst ist alt, aber die neue Dach-Marke zählt richtig ohne Lesematerial (Summe der Bereichswerke, knospenIn filtert material). So zählen Mitte und Dächer jetzt nach verschiedenen Regeln. Für „ohne Dach“ gilt dasselbe, sobald dort Material hängt.
- **beleg:** Rechnung scratchpad/pruefung2/mitte.mjs (kette-gewebe): werkeIn(mitte) = 9: 7 Werke + „Émile Durkheim [Lesematerial]“ + „Alfred Radcliffe-Brown [Lesematerial]“. Bildzeile in gewebe2-03-mitte-innen.jpg zeigt beide als „· Lesematerial“ beschriftet.
- **vorschlag:** In der Mitte-Marke baum.mitte.werke.length zählen und Lesematerial getrennt nennen („7 Werke · 2 Lesematerial“), ebenso bei „ohne Dach“.
- **Gegenprüfung:** echt, Schwere leicht: Der Befund lässt sich nicht widerlegen. Die Zahl ist falsch und für Ralf sichtbar. An einer Stelle ist er allerdings ungenau.

**Code**
- app/js/bedienung.js:81 setzt n = W.N.werkeIn('mitte').length und schreibt daraus „die Mitte · n Werke · … Dächer darum“.
- werkeIn steht in app/js/netz.js:98–99. Es hängt mit `[...eigen, ...mat]` ausdrücklich das Lesematerial des Bezirks an. Der eigene Kommentar dazu lautet „erst die eigenen, dann das Lesematerial an ihnen“.
- In app/ordnung.json stehen unter mitte.werke 7 Werke. Unter material hängen Émile Durkheim und Alfred Radcliffe-Brown, beide an „Mooncells“, also im Bezirk der Mitte.
- Die Kopfzeile von ordnung.js:4 sagt: „Lesematerial … ist kein Werk unter Werken“.

**Nachgerechnet**
Mit scratchpad/pruefung2/mitte.mjs auf testdaten/kette-gewebe kommt werkeIn(mitte) auf 9. Das sind 7 Werke und 2 Lesematerialien. Die Marke zeigt also „9 Werke“, belegt sind 7 Werke und 2 Lesematerialien.

**Dieselbe falsche Zahl an zweiter Stelle**
Das hat der Prüfer nicht genannt: app/js/haupt.js:129–130 (insDach) bildet die Bildzeile und die Ansage beim Hineinfahren ebenfalls aus werkeIn(j).length. Dort steht dann „Zentrale: 9 Werke in der Mitte.“ Dazu kommt ein Zufall, der die Sache verschärft. Neben „9 Dächer darum“ und der Übersichtszeile „neun Werke noch ohne Dach“ (bedienung.js:51, in gewebe2-03 sichtbar) erscheint eine dritte, falsche Neun. Sie widerspricht genau der Korrektur, die Ralf ausdrücklich bestätigt hat: Durkheim ist ein Leseauszug, kein Werk.

**Folgen**
Die Abweichung ist klein, aber sie macht eine falsche Angabe über Ralfs bestätigte Ordnung. Für den Blick „ehrlich“ ist sie damit nicht unerheblich.

**Ungenau im Befund**
- Mitte und Dächer zählen nicht erst „jetzt“ nach verschiedenen Regeln. Die Dach-Marke zählte schon in 26356a7 mit `d.bereiche.reduce(... x.werke.length)`, also ohne Lesematerial. Die Zeile der Mitte und werkeIn sind im Diff unverändert. Neu ist nur knospenIn (netz.js:102), das Lesematerial herausfiltert. Der Fehler ist also schon da gewesen und wurde nicht neu eingeführt. Der Commit hat die Dach-Marke ehrlich nachbeschriftet und die Mitte daneben übersehen.
- Für „ohne Dach“ gilt der Befund heute nicht: werkeIn('ohne') = 9 = baum.ohne.length, dort hängt kein Material. Er gilt erst, wenn Material an ein Werk ohne Dach gehängt wird.
- Dasselbe Problem hätte insDach für ein Dach, an dem Lesematerial hängt (`{dach: name}`). In der aktuellen ordnung.json gibt es so ein Dach nicht.

**Schwere: leicht**
Nichts bricht, und die Marke der Mitte erscheint nur beim Zeigen oder Wählen. Die Zahl ist aber eine sachlich falsche Angabe in der Oberfläche.

**Vorschlag**
- Die Werke getrennt vom Lesematerial zählen, für die Mitte über baum.mitte.werke.length und allgemein über werkeIn(b) gefiltert mit !baum.material.has(i). Das Lesematerial getrennt nennen, etwa „7 Werke · 2 Lesematerial“.
- Die Zählung in bedienung.js:81 und haupt.js:129 gleich machen, und bei „ohne“ ebenso.

### regeln 2 · Familiennamen kommen ungefiltert und ungekürzt aus dem Label
- **datei:** app/js/haupt.js
- **zeile:** 67
- **schwere:** leicht
- **befund:** familieVon (wuchs.js:105) nimmt aus dem Rohlabel nur den Teil vor „ · “ oder „ (“. Dieser Name erscheint als sichtbarer Text am Bogen (#familien, haupt.js:67: s.textContent = b.f) und in der Marke (herkunftSatz, bedienung.js:115: `${fam} · k von n`). An beiden Stellen läuft er weder durch menschlich() noch durch kurz(). Alle anderen Namen im Bild laufen durch kurz(), das menschlich() enthält, etwa Werknamen mit kurz(…, 30). Fängt das Label einer großen Übernahme mit einem lokalen Pfad, einer Kennung oder einem langen Satz an, steht das wörtlich und in voller Länge am Fächer. Das ist heute noch nicht ausgelöst.
- **beleg:** Rechnung mit /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/familien-roh.mjs auf kette-gewebe und kette-claude. Nur „FASKA Varianten · Vergleich“ löst reihenLage aus. Seine Namen (Invaria 2, FASKA-EINE-APP, FASKA Lernpfade, Google Anti-Gravity, Astra, Sonnenjahr) sind harmlos, und menschlich() würde heute an keinem Namensanfang etwas ändern. Der längste Namensanfang im Bestand hat aber 68 Zeichen und wäre ungekürzt. Code: wuchs.js:105, wuchs.js:133, haupt.js:67, bedienung.js:115. Bild standbilder/gewebe2-07-faska-varianten-familien.jpg: Die Namen sind dort korrekt, der Befund ist also latent.
- **vorschlag:** Den Namen beim Anzeigen durch den Filter führen: haupt.js:67 s.textContent = kurz(b.f, 28), bedienung.js:115 kurz(fam, 28). Oder schon in familieVon menschlich() anwenden; daten.js ist in wuchs.js bereits importiert.
- **Gegenprüfung:** echt, Schwere leicht: Ich konnte den Befund nicht widerlegen. Die Lücke ist neu in 35c59bc und belegt, wird aber vom heutigen Bestand nicht ausgelöst.

Code: daten.js:131 übernimmt v.label ungefiltert, nur mit dem Ersatz 'Unbenannte Fassung'. familieVon (wuchs.js:105) schneidet daraus den Teil vor „ · “ oder „ (“ ab. reihenLage (wuchs.js:133) legt ihn in familie[k] ab. Von dort geht er ohne menschlich() und ohne kurz() an vier Stellen in Text, den Menschen sehen oder hören:
1. #familien-Span, haupt.js:67 (s.textContent = b.f)
2. Satz der Marke, bedienung.js:115 → markeFuer → zeigeMarke, textContent
3. Ansage, bedienung.js:286/528 und weitere Stellen mit ansage(t + '. ' + s); das ist der Text für Sprachausgabe, die Regel deckt Accessibility-Texte ausdrücklich ab
4. Herkunftszeile der Lesefläche, stoff.js:195 (.stoff-her)
Der Prüfer hat damit zwei Stellen genannt, betroffen sind vier. Für dieselbe Fassung läuft der Titel durch kurz(s.label, 96) (bedienung.js:73) bzw. kurz(v.label, 220) (stoff.js:192), der Namensanfang daneben aber nicht. Das ist ein echter Widerspruch zum Schutz, den daten.js:28 beschreibt.

Auch der Server schützt hier nicht. Er filtert Labels nur dort, wo er selbst schreibt (lichtwerk_server.py:895, kurz(f["titel"], 200)). Labels aus fremden Übernahmen kommen roh an.

Nachgerechnet mit familien-roh.mjs und widerlegung/familien-label.mjs auf kette-gewebe:
- menschlich() ändert kein einziges Label im ganzen Bestand (0).
- Nur ein Fächer löst reihenLage aus, der in „FASKA Varianten · Vergleich“. Seine sechs Familien sind Invaria 2, FASKA-EINE-APP, FASKA Lernpfade, Google Anti-Gravity, Astra und Sonnenjahr; der längste Name hat 19 Zeichen.
- Der Namensanfang mit 68 Zeichen liegt in keinem solchen Fächer.
- Bild gewebe2-07 stimmt.

Fehlbild, wenn es ausgelöst wird: Eine Übernahme mit mehr als 20 Reihen-Kindern hat mindestens zwei Labels, deren Anfang einen lokalen Pfad oder einen Hash enthält, etwa „/Users/…/x.md · Teil 1“ und „/Users/…/x.md · Teil 2“. Dann stehen Pfad oder Hash wörtlich am Bogen, in der Marke und in der Ansage. Ein langer Namensanfang wird außerdem nie gekürzt (nowrap). Ist er breiter als CAM.cssW − 16, liefert clamp(x, 8, negativ) einen negativen Wert (licht.js:6), und der Name ragt links aus dem Bild. Waagerecht rollen lässt sich die Seite trotzdem nicht, weil #familien position:fixed ist.

Schwere leicht: heute tritt es nicht auf, und es bricht nichts. Es verletzt aber latent eine harte Regel, bei fremden Daten, für die menschlich() gerade da ist. Behebung in einer Zeile: menschlich() schon in familieVon anwenden, dann sind alle vier Stellen auf einmal geschützt; zusätzlich kurz(…, 28) beim Anzeigen.

### wege 4 · Im Aufzug sind ungeborene Fassungen wählbar, und Tippen überspringt den Aufzug nicht mehr
- **datei:** app/js/bedienung.js
- **zeile:** 300
- **schwere:** mittel
- **befund:** Der Zweig für mehr als 60 Fassungen prüft Z.gBorn nicht, der alte Kornweg tat das (Z. 304). Während der Geschichte, bei 196 Fassungen bis 13 s lang, liefert ein Tipp auf leere Fläche daher eine noch unsichtbare Ausprägung. Die Marke steht dann an einer leeren Stelle, ein zweiter Tipp öffnet die Lesefläche zu etwas, das noch nicht im Bild ist. Bisher führte derselbe Tipp über `!t` zu Z.sofort() (Z. 353). Auch Hover-Marken und das Halten zum Verbinden greifen auf ungeborene Blätter. Dazu kommt: familienNamen (haupt.js:63) prüft den Aufzug nicht. Die Familiennamen stehen also schon an den Endlagen, während das Feld noch leer ist.
- **beleg:** Node zelle60.mjs, „FASKA Varianten · Vergleich“ 3 s nach dem Öffnen aus dem Netz (oeffneMond ohne ohneAufzug): 24 von 196 geboren. Ein 10-px-Raster über das Bild trifft an 347 Punkten etwas, an 232 davon eine ungeborene Ausprägung. Mit dem alten Weg wären alle 232 leer gewesen, der Tipp hätte den Aufzug übersprungen. Bei „Ein Inhalt, viele Verwendungen“ sind es 167 von 328.
- **vorschlag:** Im >60-Zweig nur Blätter berücksichtigen, deren erstes Korn geboren ist (Z.gBorn[Z.seedFirst[i]] !== -1 und Geburtszeit ≤ S.clock). familienNamen erst nach dem Aufzug zeigen (!Z.S.aufzug).
- **Gegenprüfung:** echt, Schwere leicht: Der Befund stimmt im Kern. Ich konnte ihn nicht widerlegen. Er ist aber zeitlich eng begrenzt, und der Titel übertreibt.

CODE (35c59bc):
- app/js/bedienung.js:299–303: Der neue Zweig für mehr als 60 Fassungen nimmt Z.mittePos(i) für alle Fassungen und prüft weder gBorn noch die Sichtbarkeit. mittePos (zelle.js:204–208) rechnet die Endlage aus sTh/sR/seedY, auch für noch ungeborene Blätter.
- Der alte Kornweg (Z. 304–306) überspringt gBorn === -1.
- Gezeichnet wird ein Korn nur, wenn es geboren ist (zelle.js:412–413). Stiele brauchen gSicht (Z. 542, 546), Fäden brauchen bornA/bornB (Z. 577). Ein ungeborenes Blatt ist also völlig unsichtbar, kann aber gewählt werden.
- Daraus folgt in tippen() (Z. 352–353): Trifft die Suche ein ungeborenes Blatt, ist t nicht leer. Der Zweig Z.sofort() wird dann nicht erreicht, stattdessen läuft waehle(t, 1). Die Marke steht im Leeren, ein zweiter Tipp öffnet die Lesefläche.
- Dasselbe gilt für hoverPruefen (Z. 531–534, Marke beim Überfahren am Mac) und für pressSeed (Z. 396 mit haupt.js:424): Halten beginnt dann „Verbinden“ an einem unsichtbaren Blatt. Geschrieben wird dabei nichts, denn kanteFragen verlangt das Siegel.
- familienNamen (haupt.js:62–80) ist neu in diesem Commit und prüft den Aufzug nicht. `feld` misst alle Körner, ob geboren oder nicht, und die Lage kommt aus mittePos aller Glieder.

WANN DER AUFZUG LÄUFT:
- Beim Öffnen aus dem Netz, also oeffneMond(t.i, {}) in bedienung.js:360.
- Beim Hineinzoomen per Rad.
- Beim App-Start ohne neue Monde (haupt.js:577).
- Dauer D = 13 s bei mehr als 17 Fassungen, dazu 1,2 s Nachlauf. Bei reduzierter Bewegung gibt es keinen Aufzug (zelle.js:56).

NACHGERECHNET mit eigenem Skript (widerlegung-aufzug/aufzug-fluss.mjs). Es läuft Bild für Bild wie haupt.advance: netK fällt von 1 mit τ 1,5 s, die Kamera kommt über regie mit dem echten Netz. Gezählt sind Punkte eines 10-px-Rasters auf „FASKA Varianten · Vergleich“ (196 Fassungen), an denen der neue Weg eine unsichtbare Fassung wählt und der alte leer gewesen wäre, der Tipp den Aufzug also übersprungen hätte:

| Ansicht | 3 s | 5 s | 8 s | 11 s |
|---|---|---|---|---|
| 800×600 (3920 Punkte) | 146 | 319 | 139 | 45 |
| 375×812 (2627 Punkte) | 369 (14 %) | 214 | 85 | 21 |

Bei „Ein Inhalt, viele Verwendungen“ (71) sind es bei 800×600 nach 2 s 301 Punkte und nach 5 s 425. Die Zahlen des Prüfers (24 von 196 geboren nach 3 s, 232 Punkte) reproduziere ich mit seinem zelle60.mjs.

FAMILIENNAMEN (widerlegung-aufzug/familien-aufzug.mjs, 800×600, Breite 60 px angenommen): Bei FASKA Vergleich stehen nach 6 s alle fünf Familiennamen (Invaria 2, FASKA-EINE-APP, Google Anti-Gravity, Astra, Sonnenjahr) am Rand. Zu dieser Zeit ist noch keine einzige Fassung dieser Familien sichtbar, denn der Netzkopie-Zweig wird zuletzt geboren. Nach 9 s haben drei Namen noch keine sichtbare Fassung.

KORREKTUR AM BEFUND: „Tippen überspringt den Aufzug nicht mehr“ stimmt nur innerhalb der Zelle. Ein Tipp außerhalb überspringt weiter. Selbst im ungünstigsten Moment überspringen am Handy noch 2154 von 2627 Rasterpunkten.

SCHWERE leicht statt mittel:
- Der Fehler tritt nur in den höchstens rund 14 s des Aufzugs auf.
- Er betrifft nur Monde mit mehr als 60 Fassungen, in der Testkette drei.
- Wer reduzierte Bewegung eingestellt hat, ist nicht betroffen.
- Es geht nichts verloren, und ohne Siegel wird nichts geschrieben.
- Die gewählte Fassung erscheint nach Sekunden an der markierten Stelle.

Echt bleibt er trotzdem. Es ist ein neuer Rückschritt dieses Commits:
- Das Überspringen fällt genau dort aus, wo man hintippt, nämlich in die wachsende Zelle.
- Marke, Hover und Familiennamen zeigen Fassungen, die das Bild noch nicht zeigt. Das widerspricht dem Sinn des Aufzugs, der die Fassungen in ihrer echten Reihenfolge erscheinen lässt.

Der Vorschlag des Prüfers ist sinnvoll: im Zweig für mehr als 60 Fassungen nur sichtbare Blätter zulassen (Z.gBorn[Z.seedFirst[i]] !== -1 und Geburtszeit ≤ S.clock), und familienNamen erst zeigen, wenn !Z.S.aufzug gilt.

Beide Skripte liegen in /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/widerlegung-aufzug/.

### wege 7 · Am Handy sind weitere Verbindungen eines Fadens und ein deckungsgleicher Gegenfaden unerreichbar
- **datei:** app/js/bedienung.js
- **zeile:** 91
- **schwere:** leicht
- **befund:** Die Marke sagt auch am Handy „Verbindung 1 von 3 · ←/→ wählt“. Durch die Verbindungen schalten aber nur die Pfeiltasten (Z. 444-445), eine Geste dafür gibt es nicht. Zwei Fäden zwischen demselben Werkpaar haben außerdem exakt dieselbe Knotenlage (fadenWeg ist richtungssymmetrisch). treffer() liefert dann immer den mit kleinerem Index, der andere ist nur mit F erreichbar, also nie am Handy.
- **beleg:** Node wege3.mjs/wege2.mjs. Faden 0 (Durkheim verweist auf Radcliffe-Brown) hat 3 Kanten, 2 davon mit to_part. Faden 29 hat 2 Kanten, beide mit to_part. Am Handy führt jeweils nur Kante 1 „bis in die Passage“. Faden 25 (remixt-aus, Radcliffe-Brown ↔ Durkheim) liegt deckungsgleich unter Faden 0: Ein Tipp auf seinen Knoten trifft Faden 0. Standbild gewebe2-11, Marke Mitte: „Verbindung 1 von 3 · ←/→ wählt“.
- **vorschlag:** Bei W.touch statt „←/→ wählt“ einen zweiten Tipp auf die Marke bzw. Wischen durch die Verbindungen schalten lassen. Bei gleichem Werkpaar die Knoten der Fäden seitlich versetzen (wie bogen() es für Bündel tut).
- **Gegenprüfung:** echt, Schwere leicht: Der Kern hält, aber der Befund ist zu breit gefasst. Was bleibt, ist ein kleiner, belegter Fehler, den dieser Commit neu eingeführt hat.

Belegt und neu in 35c59bc:
- app/js/bedienung.js:91 hängt an jeden gewählten Faden mit mehr als einer Kante „ · ←/→ wählt“ an. Ob das Gerät eine Tastatur hat, wird nicht geprüft.
- U.fadenK ändert sich nur an Z. 444-445 (keydown ArrowLeft/ArrowRight). tippen() an Z. 364 nimmt immer U.fadenK, am Handy also immer 0. Der Klick auf die Marke (Z. 483-485) ruft für einen Faden nur waehle(s, 2) auf und schaltet nicht weiter.
- Die Marke zeigt am Handy also eine Anweisung, die man dort nicht ausführen kann. Die neue Auswahl einzelner Verbindungen fehlt am Handy ganz.
- Vor dem Commit stand an dieser Stelle „3 Verbindungen · tippen folgt“, ohne Tastenhinweis (git diff 26356a7 35c59bc, Z. 87-89 alt).
- Das Projekt unterscheidet sonst sehr wohl: W.touch ist gesetzt (haupt.js:585/588) und wird an bedienung.js:224 für den Hinweis zu ⌘V genutzt. Gestützt wird die Lage nur durch den Code, nicht durch ein Bild: gewebe2-11 ist das Desktopbild 800x600, wo die Pfeiltasten stimmen. Ein Handybild der Fadenmarke gibt es nicht.

Zu stark behauptet:
1. „Unerreichbar“ trifft nur für das Weiterschalten in der Netzmarke zu. Die Verbindungen selbst erreicht man am Handy über den Leseraum (stoff.js:65-70 verwendungen, randNotiz/satzNotiz Z. 288-319, folge Z. 321-326 springt bis in die Stelle). Gerechnet in widerlegung/kanten-ziele.mjs gegen kette-gewebe und kette-claude:
   - Faden 0, Kante 2 hat dieselbe Zielfassung wie Kante 1 („Quellfassung“ in Radcliffe-Brown). Wer am Handy Kante 1 folgt, landet in genau dem Leseraum, in dem Kante 2 als Randnotiz an ihrer Stelle steht.
   - Faden 0, Kante 3 hat keine Verwendung und dieselbe Ausgangsfassung wie Kante 1.
   - Faden 29, Kante 2 (Ziel „Quellfassung“ in Durkheim) steht im Leseraum der Ausgangsfassung „Prüfbefund …“ und im Leseraum der Durkheim-Quellfassung als Notiz, die bis in die Stelle führt. Das ist ein Umweg, aber erreichbar.
   - Die Fäden 1, 2, 3 und 25 haben keine Verwendung. Ihre Kanten stehen in der Lesefläche der Fassungen (bedienung.js:180-196, m.faeden plus m.aussen).
2. Der deckungsgleiche Gegenfaden 25 unter Faden 0 kommt nicht aus diesem Commit. Schon in 26356a7 lag der Knoten bei pt(0.5) mit einer richtungssymmetrischen Mischung plus sin-Hub (alte netz.js etwa Z. 147-161). Das betrifft auch die Maus am Desktop, nicht nur das Handy. Dass er nur mit F erreichbar ist, stimmt, ist aber eine ältere Last.

Fehlbild: Ralf wählt am Handy den Faden „Émile Durkheim verweist auf Alfred Radcliffe-Brown“ und liest „Verbindung 1 von 3 · ←/→ wählt“. Pfeiltasten hat er nicht, Tippen auf die Marke schaltet nicht weiter. Ein zweites Tippen führt immer in die Stelle von Verbindung 1. Verbindung 2 von Faden 29 findet er nur über Werk, Fassung und Leseraum.

Schwere leicht: Es geht nichts verloren und keine harte Regel bricht. Es ist ein falscher Bedienhinweis plus ein fehlender Touchweg für die neue Funktion. Abhilfe: bei W.touch den Hinweis „←/→ wählt“ weglassen oder durch eine Tippgeste auf die Marke ersetzen, die weiterschaltet. Den versetzten Gegenfaden sollte man getrennt als älteren Befund behandeln.

### wege 8 · Rückweg an den Faden vergisst, welcher Verbindung gefolgt wurde
- **datei:** app/js/haupt.js
- **zeile:** 147
- **schwere:** leicht
- **befund:** Der Rückweg-Eintrag speichert nur den Faden, nicht die gewählte Verbindung k. Beim Zurückkehren setzt waehle({art:'faden'}) U.fadenK auf 0, weil U.sel nach zumNetz ein Mond ist (bedienung.js:279). Die Marke zeigt dann Teile und Zweck von Verbindung 1, und ein erneutes Eingabe/Tippen folgt einer anderen Stelle als der gelesenen.
- **beleg:** haupt.js:204 `{netz: true, faden: fi, dach: U.dach, ausStoff: true}` ohne k. Z. 147: `B.waehle({art: 'faden', i: w.faden}, 1)`. Weg: Faden 29 (2 Kanten mit to_part), → auf Verbindung 2, Eingabe, Leseraum, Escape. Die Marke zeigt „Verbindung 1 von 2“ mit den Teilen der ersten Kante.
- **vorschlag:** k im Eintrag mitführen ({…, k}) und nach dem waehle U.fadenK = w.k setzen, dann die Marke neu bauen.
- **Gegenprüfung:** echt, Schwere leicht: Ich konnte den Befund nicht widerlegen. Er stimmt, er betrifft neuen Code aus diesem Diff (fadenK, ←/→ und folgeFaden(fi, k) kamen erst mit 35c59bc), und die Folge ist klein.

Code (Stand 35c59bc):
- haupt.js:204 legt den Rückweg-Eintrag ohne die gewählte Verbindung an: `{netz: true, faden: fi, dach: U.dach, ausStoff: true}`. Das k aus folgeFaden(fi, k) geht dabei verloren.
- Der Weg zurück: Escape im Leseraum (stoff.js:446) ruft zurueckAusStoff. Weil w.ausStoff gesetzt ist, geht es weiter nach zurueck() und dort in den Netz-Zweig (haupt.js:146–147).
- zumNetz ruft zuerst B.waehle(null) auf, das setzt U.fadenK = 0. Danach wählt es den Mond, aus dem man kam (haupt.js:139). Der folgende waehle({art:'faden', i}) findet U.sel.art === 'mond' vor, also setzt bedienung.js:279 U.fadenK erneut auf 0.
- markeFuer (bedienung.js:90–92) zeigt darum „Verbindung 1 von 2 · ←/→ wählt“ mit from_part → to_part und Zweck der ersten Kante. Dieselbe Angabe hört der Screenreader nach „Zurück im Netz.“ (haupt.js:147).
- Eingabe oder Tippen (bedienung.js:364 und 452) folgt dann mit k = 0 der ersten Kante.

Nachgerechnet mit /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/faden-k.mjs auf kette-claude und kette-gewebe (beide gleich):
- 6 von 30 Fäden haben mehr als eine Kante, und bei allen sechs führen die Kanten an verschiedene Ziele.
- Faden 29 hat 2 Kanten, beide mit to_part, mit verschiedenen Zielfassungen. Faden 0 hat 3 Kanten, davon 2 mit to_part.

Das Fehlbild ist damit belegt: Man liest Verbindung 2. Nach Escape beschreibt die Marke eine andere Stelle als die gelesene, und ein erneutes Eingabe öffnet die Fassung der ersten Kante.

Warum nur leicht:
- Man landet am richtigen Faden, und mit → kommt man sofort zurück zur gelesenen Verbindung.
- Es betrifft nur Fäden mit mehr als einer Kante, und nur wenn man dort nicht der ersten Verbindung gefolgt war.
- Keine harte Projektregel ist verletzt: kein Formular, keine Kennung, kein Gold, nichts Folgenreiches.

Der vorgeschlagene Weg ist richtig: k im Eintrag mitführen, nach dem waehle U.fadenK = w.k setzen (begrenzt auf die Zahl der Kanten), dann Marke und Ansage aus markeFuer neu bauen.

### wege 9 · Ansagen auf dem Fadenweg: der Dachsatz geht verloren, der Leseraum sagt den falschen Rückweg
- **datei:** app/js/bedienung.js
- **zeile:** 373
- **schwere:** leicht
- **befund:** buendelHinein ruft drei Ansagen im selben Takt auf: insDach (Dachsatz mit „Pfeile wählen ein Werk, Escape führt hinaus“), waehle(faden) und die eigene Ansage. ansage() leert und setzt nach 30 ms neu (Z. 262), so bleibt nur die letzte. Dass man jetzt im Dach steht und wie man hinauskommt, wird nicht angesagt. Nach folgeFaden mit Teil folgen zwei Ansagen kurz hintereinander: „… Lesefläche offen, Escape schließt.“ (oeffneLese) und 1,3 s später „Material: … Escape führt zurück in die Zelle.“ (stoff.js:86). Escape führt dort aber ins Netz an den Faden.
- **beleg:** bedienung.js:372-373 zusammen mit haupt.js:132 (B.ansage im insDach) und bedienung.js:286 (ansage in waehle bei Stufe 1). stoff.js:86 fester Satz „Escape führt zurück in die Zelle.“ bei sichtbarem Rückweg „zurück zum Faden im Netz“ (Standbild gewebe2-10, oben links).
- **vorschlag:** In buendelHinein eine einzige Ansage aus Dachsatz und Faden bauen (insDach mit Option „still“). Im Leseraum den Escape-Satz aus hilfe.rueckSatz() bilden statt fest „zurück in die Zelle“.
- **Gegenprüfung:** echt, Schwere leicht: Der Befund stimmt nur zur Hälfte. Die zweite Hälfte ist belegt.

1) Bündel, „der Dachsatz geht verloren“: widerlegt beziehungsweise unerheblich.
- In buendelHinein (bedienung.js:372-373) ruft insDach (haupt.js:128-132) zuerst B.zeile(satz) auf. zeile() schreibt den Satz nach 420 ms (bei W.RM sofort) in #line (bedienung.js:28-32). #line ist selbst eine Live-Region: index.html:20 `<p id="line" aria-live="polite">`. Laut CSS ist #line nur auf opacity:0 gesetzt und nicht verborgen (stil.css:39); visibility:hidden gilt erst im Leseraum (stil.css:270).
- Ein Screenreader hört also „FASKA: n Werke in m Bereichen.“ trotzdem, nach dem Faden-Satz aus #ansage. Dass man im Dach steht, wird angesagt. Verloren geht nur der Tastenhinweis „Pfeile wählen ein Werk, Escape führt hinaus.“
- Dieser Hinweis wäre in diesem Zustand ohnehin teils falsch. Ist ein Faden gewählt und hat er mehr als eine Kante, schalten die Pfeile durch die Kanten (bedienung.js:444), nicht durch die Werke. Escape hebt zuerst nur die Wahl auf (bedienung.js:508).
- Mit der Tastatur erreicht man ein Bündel außerdem gar nicht: schritt() (Z. 513-521) und F (Z. 455) wählen nie {art:'buendel'}. Gewählt wird es nur durch Tippen.
- Der Vorschlag, beide Ansagen zu verbinden, würde also eine falsche Pfeilanweisung ansagen.

2) Leseraum nach folgeFaden mit Teil: echt.
- stoff.js:86 sagt fest „Material: … Escape führt zurück in die Zelle.“ an.
- In folgeFaden (haupt.js:201-213, neu in diesem Commit) liegt danach auf U.weg nur dahin = {netz:true, ausStoff:true}. Den Weg leert oeffneMond vorher (haupt.js:107).
- Escape im Leseraum läuft so: stoff.taste → hilfe.zurueckAusStoff (stoff.js:446) → w.ausStoff → zurueck() (haupt.js:177-178). Dort gilt U.netT=0, weil oeffneMond es setzt. Weil der oberste Wegpunkt netz ist, folgen zumNetz() und die Ansage „Zurück im Netz. …“ (haupt.js:146-147).
- Escape führt also ins Netz an den Faden und nicht in die Zelle.
- Der sichtbare Rückweg ist richtig: rueckSatz() (haupt.js:175), dessen Netz-Fall in diesem Commit dazukam, liefert „zurück zum Faden im Netz“. So steht es auch im Standbild gewebe2-10 oben links.
- Gesprochener und sichtbarer Rückweg widersprechen sich also genau im neuen Fadenweg. Dieselbe feste Zeile war schon vorher beim älteren folgeStoff-Weg falsch: Dort führt Escape in den Leseraum der vorigen Fassung zurück.
- Fehlbild: Ein Screenreader-Nutzer kommt mit F und Eingabe über einen Faden an eine Stelle. Er hört, Escape führe in die Zelle, drückt Escape und steht unerwartet wieder im Netz.
- Die Folgen sind gering: Danach kommt die korrigierende Ansage „Zurück im Netz“, und Eingabe auf dem Faden führt wieder hin. Deshalb leicht.
- Ein Wortlaut aus hilfe.rueckSatz() statt der festen Zeile behebt das, denn hilfe.rueckSatz ist in stoff.init schon übergeben (bedienung.js:390).

### wege 10 · Zurück im Dach steht der Satz des Überblicks
- **datei:** app/js/haupt.js
- **zeile:** 140
- **schwere:** leicht
- **befund:** zumNetz() setzt U.dach auf den Bezirk des Werks und schreibt trotzdem netzSatz in die Zeile („Die Zentrale in der Mitte, neun Dächer darum …“). Der neue Rückweg an den Faden nutzt genau diesen Weg (haupt.js:146: zumNetz(); U.dach = w.dach). Man steht dann in einem Dach, und die Zeile beschreibt das ganze Netz statt „FASKA: 23 Werke in 4 Bereichen.“.
- **beleg:** Standbild gewebe2-02-dach-faska.jpg, untere Bildzeile: „Die Zentrale in der Mitte, neun Dächer darum, neun Werke noch ohne Dach.“, obwohl FASKA betreten ist. Ebenso gewebe2-13-handy-dach-faska.jpg, unten.
- **vorschlag:** In zumNetz bzw. im Rückweg an den Faden bei gesetztem U.dach den Satz von insDach verwenden (gemeinsame Funktion dachSatz(j)).
- **Gegenprüfung:** echt, Schwere leicht: Ich konnte den Befund nicht widerlegen. Code und Bild bestätigen ihn. Er ist aber älter als der geprüfte Commit und bleibt leicht.

**Code**
- `app/js/haupt.js:138` in `zumNetz()`: `U.dach` wird auf `W.N.bezirk(W.aktiv)` gesetzt. Kommt man aus einem FASKA-Werk, steht man danach im Dach FASKA.
- `app/js/haupt.js:140` in derselben Funktion: Danach steht unbedingt `B.zeile(B.netzSatz(W.B))`.
- `netzSatz` (`app/js/bedienung.js:48-51`) beschreibt immer das ganze Netz: „Die Zentrale in der Mitte, neun Dächer darum, neun Werke noch ohne Dach.“
- Eine andere Stelle überschreibt die Zeile nicht. `B.waehle` (`bedienung.js:278-288`) ruft `zeile()` gar nicht auf, sondern nur `zeigeMarke` und `ansage`.
- Den Satz zum Dach erzeugt allein `insDach()` (`haupt.js:129-132`). Er erscheint also nur, wenn man vom Überblick aus ins Dach geht.

Alle anderen Wege führen über `zumNetz` und landen mit dem Satz des Überblicks im Dach:
- Taste N (`bedienung.js:442`)
- Netzknopf (`bedienung.js:481`)
- Auszoomen (`bedienung.js:497`)
- gewöhnlicher Rückweg (`haupt.js:154`)
- neuer Rückweg an den Faden (`haupt.js:146`, `zumNetz(); U.dach = w.dach`)

Beim Faden-Rückweg trifft das nur zu, wenn der Faden aus einem Dach heraus begonnen wurde (`w.dach != null`). Kam er aus dem Überblick, wird `U.dach` wieder `null`, und der Satz passt.

**Bild**
- `gewebe2-02-dach-faska.jpg`: Oben steht „FASKA“, die Werke stehen ohne den Dachnamen und die Bereichsringe sind zu sehen. Unten steht trotzdem der Satz über das ganze Netz.
- `gewebe2-13-handy-dach-faska.jpg`: dasselbe am Handy.

Die Werkstattszene `netz` ruft genau `oeffneMond` und dann `zumNetz` auf (`haupt.js:600-601`). Das Bild zeigt also den echten Weg und keinen Sonderzustand.

**Einordnung**
- **Älter als der Commit:** `zumNetz` war in 26356a7 schon gleich gebaut (`git show 26356a7:app/js/haupt.js`, Z. 109-111). Das alte Bild `gewebe-02-dach-faska.jpg` zeigt denselben Satz in FASKA.
- **Was der Commit hinzufügt:** Mit dem Rückweg an den Faden kommt nur ein weiterer Weg in diesen Zustand dazu.
- **In der ersten Bildkritik nicht enthalten:** Dort wird weder `netzSatz` noch `zumNetz` erwähnt.

**Warum echt, aber leicht**
- Die Zeile ist die große Erklärung im Bild. Über die häufigsten Wege steht sie in einem Dach falsch: Sie beschreibt den Überblick, während man in FASKA steht.
- Dazu fehlt beim Vorlesen die Ansage aus `insDach`, dass man in einem Dach ist und „Escape führt hinaus“. `zumNetz` sagt nur die Marke des Monds an.
- Falsch ist der Satz inhaltlich nicht, er beschreibt nur den falschen Ort. Gegen eine harte Regel verstößt er nicht. Das hält die Schwere bei leicht.

**Vorschlag:** Den Satz aus `insDach` in eine Funktion `dachSatz(j)` herausziehen. `zumNetz` (Z. 140) und der Rückweg an den Faden (nach Z. 146, nachdem `U.dach = w.dach` gesetzt ist) schreiben dann bei gesetztem `U.dach` diesen Satz statt `netzSatz`.

Nicht nachgerechnet habe ich den Wortlaut „FASKA: 23 Werke in 4 Bereichen.“ Für den Befund ist er unerheblich.

## Verworfen oder ungeprüft (18)

### leistung 1 · Leseraum: kandidaten() rechnet bei buchlangen Fassungen bis zu 26 volle Passagenabgleiche in einem Klick
- **datei:** app/js/stoff.js
- **zeile:** 173
- **schwere:** leicht
- **befund:** Neu in 35c59bc: kandidaten() ruft teilenWortlaut() für bis zu 24 Kandidaten auf (stoff.js:173) und zusätzlich für Herkunft und Vorgängerin (stoff.js:168, 170). Jeder Aufruf, der die Schwelle wortAnteil ≥ 0,1 überschreitet, rechnet materialParagraphs zweimal, alignParagraphs und abgleich() mit Wort-LCS (stoff.js:145). baueRuhig() ruft danach teilenWortlaut() über ALLE Kandidaten auf, ohne die Grenze von 24 und ohne nach 4 Treffern abzubrechen: erst filter(), dann slice(0, 4) (stoff.js:414). Der Speicher hängt an den Fassungsobjekten (stoff.js:141) und ist nach jedem Auffrischen leer. Der Aufwand je Paar wächst mit n·m Passagen bis zur Grenze von alignParagraphs bei n·m = 100 000 (materialraum.js:84), also bis etwa 316 × 316 Passagen. Mit dem heutigen Bestand liegt nichts über der Grenze. Buchlange Fassungen mit wenigen Verbindungen blockieren den Hauptfaden aber für eine halbe bis mehrere Sekunden.
- **beleg:** Gemessen mit Node gegen testdaten/kette-gewebe. Mit dem heutigen Bestand dauert der teuerste Klick auf „Vergleichen“ (kalter Speicher) 27 ms: „Zentrale · Material bekommt Form / Gegenlese Antigravity · Runde 2“, kandidaten 21,9 ms plus Paarabgleich 5,5 ms. Höchstens 5 Kandidaten, größte Fassung 64 Passagen (Skript /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/messe-lese.mjs). Hochrechnung aus echtem Prosa-Wortlaut der Kette (Skript .../pruefung2/messe-buch.mjs, eine überarbeitete Fassung, jeder dritte Absatz geändert): ein teilenWortlaut-Paar kostet bei 64 Passagen 12,3 ms, bei 150 Passagen 30,6 ms und bei 300 Passagen 98,7 ms (davon alignParagraphs 85,8 ms). Ein Kapitel mit 300 Passagen und 5 verbundenen Fassungen kostet damit 5 × 99 ms plus 99 ms Paarabgleich, also etwa 0,6 s. Beim vollen Satz von 24 + 2 Kandidaten sind es 26 × 99 ms, also etwa 2,6 s, auf diesem Mac und ohne DOM; am Handy mehrfach länger. Zum Vergleich liegen alle Bildschleifen unter den Grenzen. Netz bei U.dach = null, 'mitte' und jedem Dach: höchstens 15 903 Punkte (9,9 % von MAXP), CPU im Median 0,9 bis 2,9 ms, p90 höchstens 5,0 ms. Übergang Zelle→Netz: höchstens 22 791 Punkte bei 1,9 ms. Zelle mit kelchK 0 und 1: höchstens 7 394 Punkte bei rund 1 ms. Die Rechnungen in familienNamen, trefferSame, amRing, netzMass und fadenWeg liegen bei höchstens 0,2 ms. randFliessen trifft höchstens 2 Passagen mit Rand je Fassung, das sind 2 erzwungene Layouts je resize. Der Neubau von Netz nach dem Auffrischen dauert 1,2 ms (messe-netz.mjs, messe-zelle.mjs, messe-rand.mjs, messe-bau.mjs im selben Ordner).
- **vorschlag:** Die Prüfung teuer nur für wenige Kandidaten rechnen. In kandidaten() teilenWortlaut nur für die ersten 4 bis 6 Kandidaten, die schon nach wortAnteil sortiert sind, statt für 24. In baueRuhig() eine Schleife statt filter(): nach 4 Treffern abbrechen und nur Kandidaten prüfen, die schon im Speicher liegen. Für große Paare (zum Beispiel ab Passagen(a) · Passagen(b) > 4000) nur wortAnteil als Vorblick nehmen oder die Rechnung stückweise über requestIdleCallback verteilen. Den Speicher geteilt/woerterVon intern nach Fassungskennung und Inhaltslänge führen statt nach Objekt, damit er das Auffrischen übersteht. Die Kennung bleibt dabei unsichtbar, nur als Schlüssel einer Map.
- **Gegenprüfung:** verworfen, Schwere leicht: Der Mechanismus stimmt, eine Folge zeigt sich aber nirgends. Heute ist der Befund unerheblich, und die Hochrechnung baut auf einem Bestand, den es nicht gibt.

Was zutrifft:
- kandidaten() ruft teilenWortlaut für bis zu 24 Kandidaten auf (stoff.js:173), dazu für Herkunft und Vorgängerin (stoff.js:168 und 170).
- baueRuhig filtert über alle Kandidaten und schneidet erst danach auf 4 ab (stoff.js:414).
- Vor 35c59bc kostete vorschlag() fast nichts. Den einen Paarabgleich in baueVergleich gab es schon vorher (26356a7 stoff.js:252).
- Die Schwelle wortAnteil ≥ 0,1 sortiert bei langen Texten nichts aus. Nachgerechnet mit fremden echten Absätzen der Kette: bei 64 gegen 64 Passagen liegt der Anteil bei 0,25, bei 150 gegen 150 bei 0,32. Skript: /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/widerlegung/schwelle.mjs.
- Die Kosten je Paar habe ich nachgemessen: etwa 120 ms bei 300 gegen 300 Passagen.

Was den Befund widerlegt:
1. Im Bestand gibt es keine solche Fassung. In kette-gewebe und kette-claude hat keine Fassung mehr als 64 Passagen, keine über 100. Höchstens 14 Kanten und 5 gelesene je Fassung, zusammen also höchstens 19 Kandidaten. Die Grenze von 24 und der Fall „mehr als 24“ in baueRuhig werden darum nie erreicht. Skript: /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/widerlegung/verteilung.mjs.
2. Der teuerste Klick kostet heute 27 ms. Das hat der Prüfer selbst gemessen, und er schreibt selbst, dass nichts über der Grenze liegt.
3. Die 2,6 s sind ausgedacht. Dafür bräuchte es 26 buchlange Fassungen, alle mit derselben verbunden und alle mit etwa 300 Passagen. Teuer ist nur lang gegen lang. Eine kurze Gegenlese gegen ein Kapitel mit 300 Passagen kostet 10 ms. Denkbar ist ein Kapitel mit zwei oder drei langen Überarbeitungen. Das wären einmalig etwa 0,3 s am Mac, gemerkt bis zum nächsten Auffrischen. Das ist ein spürbares Stocken, aber nichts geht kaputt.
4. Dass der Speicher nach jedem Auffrischen leer ist, hat keine praktische Folge. Wer den Leseraum öffnet, setzt über B.waehle(sel, 2) und oeffneLese auch U.lese = true (haupt.js:174, bedienung.js:201). Solange das gilt, wartet das Auffrischen aus dem Hintergrund (haupt.js:261 und 277). Während des Lesens bleibt der Speicher also erhalten.

Der Vorschlag ist eine sinnvolle Vorsorge für buchlange Texte, etwa nur 4 bis 6 Kandidaten prüfen. Mit dem heutigen Stand ist der Befund aber weder folgenreich, noch hat er ein konkretes Fehlbild.

### ehrlich 2 · „An der Stelle, die der Faden nennt“, obwohl der Leseraum nur „ungefähr hier“ markiert
- **datei:** app/js/haupt.js
- **zeile:** 211
- **schwere:** mittel
- **befund:** folgeFaden öffnet den Leseraum bei einem mehrdeutigen oder nur über die Überschrift gefundenen Teil richtig mit ungefaehr=true, sodass an der Passage „ungefähr hier“ steht. Die Bildzeile darunter sagt aber in jedem Fund-Fall „In „…“, an der Stelle, die der Faden nennt.“. Sie behauptet damit eine Genauigkeit, die der Leseraum selbst zurücknimmt. Das widerspricht dem Grundsatz „keine erfundene Präzision“ (Kommentar zu verorte in stoff.js). Betroffen sind zwei der drei Bündel-Fäden aus der Zentrale: „Ein Inhalt“ → „KiNTEGRiTY · Gemeinsamer Variantenraum“ (to_part „Grundfassung“ zweimal im Text) und „Ein Inhalt“ → „gedankenspirale“ (to_part „gedankenspirale“ viermal).
- **beleg:** haupt.js:209 setzt ungefaehr: !!wo && (wo.art !== 'wörtlich' || wo.mehrfach > 1), haupt.js:211 prüft nur `wo ?`. Rechnung (faeden.mjs, kette-gewebe): F26 verortet(to)={index:3, art:'wörtlich', mehrfach:2}, F27 {index:0, art:'wörtlich', mehrfach:4}. Beide führen also zum Satz „an der Stelle, die der Faden nennt“ und zugleich zu „ungefähr hier“ (stil.css:423).
- **vorschlag:** Den Satz nach derselben Bedingung wählen wie ungefaehr: eindeutig wörtlich → „an der Stelle, die der Faden nennt“; mehrfach oder Abschnitt → „ungefähr an der Stelle, die der Faden nennt (der Teil steht N-mal im Text)“; ohne Fund wie bisher.
- **Gegenprüfung:** verworfen, Schwere leicht: Die Beobachtung im Code stimmt, folgenreich ist sie aber nicht. Darum echt=false.

Was stimmt: haupt.js:209 setzt ungefaehr, wenn die Fundart nicht wörtlich ist oder der Teil mehrfach vorkommt. haupt.js:211 wählt den Satz der Bildzeile dagegen nur danach, ob es überhaupt einen Fund gibt. Nachgerechnet habe ich mit /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/ungefaehr/zeile.mjs. Es baut die Netzfäden wie netz.js:69-75 und wendet das echte verorte aus stoff.js auf beide Testketten an. Ergebnis: 7 Kanten nennen einen Teil der Zielfassung. 1 davon wird eindeutig gefunden (F28 Genealogical Spiral), 2 nur ungefähr (F26 „Grundfassung“ zweimal, F27 „gedankenspirale“ viermal), 4 gar nicht. Bei F26 und F27 kommen also der Satz „an der Stelle, die der Faden nennt“ und die Marke „ungefähr hier“ zusammen. So weit hat der Prüfer recht.

Warum das ohne Folgen bleibt:
1. Man sieht beides nicht gleichzeitig. Der Satz erscheint 420 ms nach dem Aufruf (bedienung.js:28-32). Der Leseraum öffnet nach 1300 ms (haupt.js:210). Beim Öffnen setzt stoff.js:83 die Klasse im-stoff, und stil.css:270 blendet #line dann mit visibility:hidden aus. Der Satz steht also nur rund 0,9 s während des Flugs da und ist weg, bevor die Passage mit „ungefähr hier“ auftaucht. Bei reduzierter Bewegung (W.RM) läuft der Timer zum Lesen vor dem der Bildzeile. Der Satz landet dann schon in einer verborgenen Zeile und ist gar nicht zu sehen.
2. Der Leseraum sagt es zweimal selbst ehrlich. Erstens markiert stil.css:423 die Passage mit „ungefähr hier“. Zweitens zeigt die Randnotiz für die eingehende Verwendung „steht 2-mal im Wortlaut, hier die erste passende Stelle“. Das kommt aus stoff.js:69 (Teil = to_part) und stoff.js:298. Keine erfundene Präzision bleibt also stehen.
3. Der Satz ist nicht falsch. Die angesteuerte Passage enthält den genannten Teil wörtlich. Bei F26 ist das Absatz 3 mit „Grundfassung“. Es ist eine Stelle, die der Faden nennt, nur nicht die einzige. Unscharf ist bloß der bestimmte Artikel, und das korrigiert der Leseraum sofort.

Was bleibt, ist eine sprachliche Glättung. Den Satz nach derselben Bedingung zu wählen wie ungefaehr wäre sauber, ist aber kaum mehr als Geschmack. Ein Fehlbild, das Ralf in die Irre führt, entsteht nicht. Dass der Satz stehen bleibt, wenn der Flug abgebrochen wird und kein Leseraum aufgeht, ist eine andere Frage. Sie trifft auch den eindeutigen Fall und gehört nicht zu diesem Befund.

### ehrlich 6 · „Verbindungen darin“ zählt nur Kanten zwischen verschiedenen Werken des Dachs
- **datei:** app/js/bedienung.js
- **zeile:** 85
- **schwere:** leicht
- **befund:** Die Dach-Marke sagt „N Verbindungen darin“. N kommt aus N.innen, und das zählt nur Fäden zwischen zwei verschiedenen Werken desselben Bezirks (netz.js:79), weil this.faeden Kanten innerhalb eines Werks ausschließt. Kanten innerhalb der Werke eines Dachs fehlen. Bei FASKA steht „2 Verbindungen darin“, tatsächlich liegen 5 Kanten im Dach. Phänomenatlas zeigt gar keine Angabe, obwohl es 1 Kante im Dach gibt.
- **beleg:** Rechnung scratchpad/pruefung2/innen.mjs (kette-gewebe): alle Kanten im Bezirk FASKA 5, Phänomenatlas 1, KiNTEGRiTY 18; davon zwischen Werken FASKA 2, KiNTEGRiTY 17 (= N.innen).
- **vorschlag:** Die Zeile genau benennen, etwa „2 Fäden zwischen seinen Werken“, oder beide Zahlen nennen.
- **Gegenprüfung:** verworfen, Schwere leicht: Die Zahlen des Prüfers stimmen, aber er misst eine andere Ebene als die Marke. Die Marke ist richtig gezählt und hat kein Fehlbild.

**Nachgerechnet** mit `/private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/widerlegung/innen-zaehlung.mjs` gegen kette-gewebe, Stand HEAD 35c59bc:

| Bezirk | Kanten insgesamt | davon zwischen Werken | davon in einem Werk | N.innen |
|---|---|---|---|---|
| FASKA | 5 | 2 | 3 (alle „erweitert“) | 2 |
| Phänomenatlas | 1 | 0 | 1 („testet“) | 0 |
| KiNTEGRiTY | 18 | 17 | 1 | 17 |

**Warum es kein Fehler ist:**
1. **Netzebene heißt „über Werkgrenzen“.** netz.js:69 sagt das ausdrücklich: „Fäden über Werkgrenzen“. Die Bündel-Marke zählt ihre Verbindungen genauso (bedienung.js:96). Die Dach-Marke zählt Werke, nicht Ausprägungen. Folgerichtig zählt sie auch nur die Verbindungen zwischen diesen Werken.
2. **Die Zahl passt zum Bild im Dach.** Die Marke endet mit „tippen fährt hinein“. Im Dach zeichnet netz.js:190 genau die Fäden mit bzVon oder bzNach gleich imDach. Bei FASKA sieht man also genau die 2 inneren Fäden, die die Marke ankündigt. Der Kommentar netz.js:76 sagt dazu: „was in einem Bezirk bleibt, zeigt sich erst darin“.
3. **Kanten in einem Werk gehören zur Zelle.** Sie landen in m.faeden (daten.js:152). Daraus baut wuchs.js:41 den Wuchs, und zelle.js:574 zeichnet sie in der Zelle. Bei FASKA sind es drei „erweitert“, also Fortsetzungen in einem Werk, keine Verbindungen zwischen Werken.
4. **Folgerichtigkeit.** Würde die Marke diese Kanten mitzählen, müsste die Zentrale-Ebene 80 Kanten aus ihren Werken nennen, 58 davon „verweist-auf“. Das wäre die Ebene der Ausprägungen, und die Dach-Marke nennt Ausprägungen sonst nicht.
5. **Phänomenatlas ohne Angabe ist keine falsche Aussage.** Es gibt dort keine Verbindung zwischen Werken. Die eine „testet“-Kante sieht man erst in der Zelle des Werks.

**Was bleibt:** Im Leseraum heißen alle Kanten einer Fassung „weitere Verbindungen“ (bedienung.js:196), auch die im selben Werk. Das Wort ist also nicht ganz trennscharf. Wer möchte, kann die Zeile im Dach genauer fassen, etwa „2 Verbindungen zwischen seinen Werken“. Das ist eine Frage des Wortlauts, kein belegter, folgenreicher Fehler.

### regeln 1 · Der Kranz der Stimmköpfe im Netz läuft bei reduzierter Bewegung ungebremst und mit Spur
- **datei:** app/js/netz.js
- **zeile:** 107
- **schwere:** mittel
- **befund:** bigHead() rechnet Winkel und Wippen direkt aus der Wanduhr: th = t·TAU/16, bp = t·TAU·0,3. U.RM wird dabei nicht beachtet. baueNetz zeichnet je Kopf zusätzlich 30 Spurpunkte (netz.js:225–229), ebenfalls ohne Rücksicht auf U.RM. Da W.wall immer weiterläuft (haupt.js:413), kreisen die fünf Köpfe bei reduzierter Bewegung genauso schnell wie sonst. In der Zelle dagegen drosselt der Code die Köpfe auf 15 % (zelle.js:17 OM0_RM, zelle.js:286). Der Diff hat den Kranz an den Rand der Mitte verlegt, Radius 1,06·R. Dadurch läuft er beim Blick in die Mitte genau am Bildrand entlang.
- **beleg:** Code: netz.js:107 (bigHead ohne U.RM), netz.js:225–229 (Spurschleife über wall − k·0,018), haupt.js:413 (W.wall += rdt, unbedingt). Zum Vergleich zelle.js:17/286 (OM0_RM = 0,15·OM0). Rechnung mit /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/kranz-rm.mjs auf kette-gewebe (Mitte R = 14,35): Im Überblick 800×600 läuft ein Kopf mit etwa 31 px/s, bei 375×812 mit etwa 32 px/s. In der Mitte (S = 1,08·R) sind es etwa 116 px/s, ein Umlauf dauert 16 s, die Spur ist 0,54 s lang, alles unabhängig von RM. Bild: standbilder/gewebe2-03-mitte-innen.jpg, links von x≈90 bis 310 und y≈70 bis 410. Dort stehen die fünf Köpfe (rot, violett, grün, blau, orange) mit Schweifen am Rand der Mitte.
- **vorschlag:** In baueNetz die Zeit für den Kranz unter U.RM drosseln, wie in der Zelle, z. B. const tk = U.RM ? wall * 0.15 : wall, und bigHead(N, i, tk …) aufrufen. Unter U.RM die Spurschleife (k < 30) weglassen und nur den Kopf zeichnen. Den Kopf in U.bigHeads für trefferKopf weiter setzen.
- **Gegenprüfung:** verworfen, Schwere leicht: Widerlegt. Der Code ist richtig zitiert: bigHead (netz.js:107) und die Spurschleife (netz.js:226–229) fragen U.RM nicht ab, und W.wall läuft immer weiter (haupt.js:413). Es fehlt aber die Folge. Der Vergleich mit der Zelle verkehrt sich beim Nachrechnen ins Gegenteil.

1) Tempo. Der Kranz dreht sich fest mit TAU/16 = 0,393 rad/s. Die Zellköpfe laufen normal mit TAU/T bei T = [2,1; 2,7; 1,3; 3,4; 4,2] (zelle.js:15), also mit 2,99 / 2,33 / 4,83 / 1,85 / 1,50 rad/s. Unter RM sind es 15 % davon: 0,45 / 0,35 / 0,72 / 0,28 / 0,22 rad/s, die Kopplung liegt bei 0,39 rad/s (zelle.js:17, 286). BERICHT.md:115 nennt als gewolltes RM-Bild „0,43 statt 2,6 rad/s“. Der Netz-Kranz läuft also schon ohne RM im Drosseltempo, das das Projekt selbst für Köpfe unter reduzierter Bewegung festgelegt hat. Mit der Zelle verglichen ist er nicht ungebremst.

2) Schirmtempo. Beim Blick in die Mitte (S = 1,08·R, Kranz bei 1,06·R) kommt der Kopf auf etwa 116 px/s. Die Zellköpfe liegen unter RM bei 800×600 auf einem Radius von etwa 189 px (Sc = memR·1,32, memR ≥ 1,2·orbitR, zelle.js:174/184/185) und laufen 42 bis 137 px/s. Der Kranz liegt in derselben Spanne. Im Überblick sind es etwa 31 px/s, also langsamer als jeder Zellkopf unter RM. Das Wippen (bp) hat in der Mitte nur etwa 5 px Ausschlag.

3) Spur. Die Zelle zeichnet ihre Kopfspuren auch unter RM, bis zu rund 200 Stützpunkte, ohne RM-Abfrage (zelle.js:487–497). Dass der Kranz 30 Punkte Spur trägt, entspricht also der Projektregel und verstößt nicht gegen sie.

4) Herkunft. Das Verhalten stammt nicht aus dem Diff. In 26356a7 hatte bigHead dasselbe Tempo und 90 Spurpunkte, ebenfalls ohne RM. Der Diff hat den Kranz nach außen gelegt, auf 1,06·R statt 0,62·R. Das macht ihn auf dem Schirm etwa 1,7-mal schneller, aber nicht schneller als die Zelle unter RM. Die Spur hat der Diff auf 30 Punkte verkürzt.

Das Bild gewebe2-03-mitte-innen.jpg zeigt den Kranz links außerhalb des punktierten Rings, etwa bei x ≈ 90 bis 310. Es ist ohne RM aufgenommen und belegt deshalb nur die Lage, nicht das Verhalten unter RM.

Rechnung: /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/widerlegung/kranz-vs-zelle-rm.mjs

Randbemerkung, nicht Teil dieses Befunds: Die Leertaste setzt U.paused (bedienung.js:438). Das hält die Zelle an, aber nicht den Netz-Kranz, weil bigHead an W.wall hängt. Wenn überhaupt, wäre das der tragfähigere Ansatz, und er wäre eigens zu prüfen.

### regeln 3 · Die neue Faden-Marke filtert Verwendungstexte schwächer als der Leseraum
- **datei:** app/js/bedienung.js
- **zeile:** 92
- **schwere:** leicht
- **befund:** markeFuer zeigt für einen Faden jetzt usage.from_part, to_part und purpose. Das läuft nur durch kurz(menschlich(…)). Der Leseraum zeigt dieselben Felder über zeige() (stoff.js:61–63). zeige() übersetzt zusätzlich Runden-Kennungen wie „systemleitung-tragwerk-20261018“ in „Runde vom 18. Okt.“. menschlich() fängt sie nicht ab, weil „20261018“ nur aus Ziffern besteht und die Hash-Regel einen Buchstaben a–f verlangt. Der Text der Marke geht außerdem über ansage() ins aria-live: bei ←/→ (bedienung.js, Pfeil-Zweig für Fäden), in buendelHinein und im Rückweg haupt.js zurueck(). Verbindet eine Kante mit beschriebener Verwendung zwei Werke und nennt sie eine Runde, steht die Kennung sichtbar in der Marke und wird vorgelesen.
- **beleg:** Rechnung mit /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/marke-kennungen.mjs. In beiden Testketten (je 30 Fäden) findet es heute keinen Treffer. Im Bestand stehen aber schon zwei Zwecke mit Runden-Kennung: „Gegenlese in der Runde systemleitung-verwendung-20261018“ und „…-tragwerk-20261018“. Beide liegen noch innerhalb von „Ein Inhalt, viele Verwendungen“ und sind deshalb kein Faden. Bild standbilder/gewebe2-11-faden-marke.jpg: Die Marke zeigt dort Teile und Zweck ungefiltert, im Moment ohne Kennung. Der Befund ist latent.
- **vorschlag:** zeige aus stoff.js exportieren oder die Runden-Regel in menschlich() (daten.js) aufnehmen. Dann in markeFuer an bedienung.js:92 (q und purpose) zeige statt menschlich verwenden.
- **Gegenprüfung:** verworfen, Schwere leicht: Der Code-Unterschied besteht, aber er ist heute nicht folgenreich. Es gibt kein Fehlbild, nur eine Härtung für künftige Daten.

Was stimmt: Der Diff 26356a7..35c59bc führt in bedienung.js:92 die Anzeige von usage.from_part, to_part und purpose in der Faden-Marke ein, gefiltert nur über kurz(menschlich(…)). Der Leseraum filtert dieselben Felder über zeige() (stoff.js:60–63). zeige() übersetzt zusätzlich Runden-Schlüssel der Form wort-wort-JJJJMMTT und relative „Mobile Documents/…“-Pfade. menschlich() (daten.js:33–42) fängt beides nicht ab: In „20261018“ steht kein a–f, also greift die Hash-Regel nicht. Der Text geht auch über ansage() ins aria-live (haupt.js:147).

Warum er nicht trägt:
1. Fäden entstehen nur über Werkgrenzen. netz.js:70 überspringt Kanten mit a === b. Die einzigen beiden Runden-Schlüssel im Bestand liegen auf inneren Kanten von „Ein Inhalt, viele Verwendungen“. Das sind „Gegenlese in der Runde systemleitung-verwendung-20261018“ und „…-tragwerk-20261018“. Sie können also nie in einer Faden-Marke erscheinen.
2. Nachgerechnet habe ich mit /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/zeige-vs-menschlich.mjs und …/pruefung2/runden-usage.mjs, gegen testdaten/kette-gewebe/state.json (Stand 21.10. 09:09). Ergebnis: 66 Kanten mit usage, davon 7 über Werkgrenzen. Bei diesen 7 liefern zeige() und menschlich() auf from_part, to_part und purpose ein identisches Ergebnis, 0 Unterschiede. Die beiden Unterschiede liegen nur auf inneren Kanten. kette-claude und testdaten/state.json ergeben dasselbe. Auch …/pruefung2/marke-kennungen.mjs findet in beiden Ketten (je 30 Fäden) keinen Treffer.
3. Bild standbilder/gewebe2-11-faden-marke.jpg: In der Marke („Émile Durkheim“ verweist auf „Alfred Radcliffe-Brown“) stehen Teile und Zweck ohne jede Kennung.

Der Prüfer nennt den Befund selbst latent. Ein sichtbares oder vorgelesenes Fehlbild entsteht erst, wenn künftig eine Kante über Werkgrenzen einen Runden-Schlüssel oder einen relativen Cloud-Pfad in ihren usage-Texten trägt. Als Härtung bleibt der Hinweis sinnvoll: eine gemeinsame Filterfunktion für Marke und Leseraum. Nebenbei fällt auf, dass zeige() selbst „Gegenlese in der Runde Runde vom 18. Okt.“ erzeugt, also „Runde“ doppelt. Wer zeige() einfach in die Marke übernimmt, holt diese Dopplung mit hinein.

### wege 11 · „Ungefähr hier“ wird nach Neuladen und auf dem Rückweg zur genauen Stelle
- **datei:** app/js/stoff.js
- **zeile:** 31
- **schwere:** leicht
- **befund:** zustand() gibt ungefaehr nicht mit. merkeOrt schreibt nur stelle in Adresse und Tab-Speicher. ortWiederholen (haupt.js:230-231) und stoffZurueck (haupt.js:183-184) öffnen den Leseraum deshalb ohne ungefaehr, und markiere() kennzeichnet die Passage als genaue Stelle. Folgt man einem Faden mit uneindeutigem Fund, lädt neu oder kehrt über eine Verwendung zurück, wird aus „ungefähr hier“ eine behauptete genaue Fundstelle.
- **beleg:** Node stelle.mjs. Faden 27 („Ein Inhalt …“ → „gedankenspirale“, Ausgangsfrage): Teil „gedankenspirale“ steht 4-mal im Wortlaut, folgeFaden markiert also ungefähr. Die Adresse wird danach #mond=gedankenspirale&frage=1&lesen=1&stelle=1, nach dem Neuladen ist Absatz 0 als genaue Stelle markiert. Ebenso Faden 26 („Grundfassung“, mehrfach 2).
- **vorschlag:** ungefaehr in zustand(), im Tab-Speicher und als lesbaren Schalter in der Adresse mitführen (etwa &ungefaehr=1) und beim Wiederherstellen an stoff.oeffne übergeben.
- **Gegenprüfung:** verworfen, Schwere leicht: Die Mechanik stimmt, das behauptete Fehlbild nicht.

Was stimmt: zustand() (stoff.js:31) gibt ungefaehr nicht mit. merkeOrt (haupt.js:215-223) legt im Tab-Speicher und in der Adresse nur die Stelle ab. ortWiederholen (haupt.js:231/233/241) und stoffZurueck (haupt.js:184) rufen oeffne ohne ungefaehr auf. markiere() (stoff.js:432-434) setzt danach .stelle statt .ungefaehr. Nachgerechnet mit stelle.mjs: Faden 27 führt zu „gedankenspirale“ (Ausgangsfrage), wörtlich Absatz 0, 4-mal. Faden 26 führt zu „Grundfassung“, 2-mal. Die Adresse lautet #…&frage=1&lesen=1&stelle=1 (link.js:52-53). Nach dem Neuladen geht es über start() → ortWiederholen in den Zweig frage+lesen, und Absatz 0 bekommt .stelle. Neu ist das übrigens nicht: zustand() und ungefaehr standen schon in 26356a7 genau so da (stoff.js:24/71 dort). Der Commit fügt nur den Fadenweg hinzu.

Warum es trotzdem kein echter Befund ist:

1. Der Hinweis auf die ungenaue Fundstelle geht nicht verloren. Er hängt nicht nur am Zustand, er steht auch in den Daten an derselben Passage. baueLesen() hängt jede Verwendung der Zielfassung als Randnotiz an die verortete Passage (stoff.js:328-334). randNotiz() schreibt dort ausdrücklich „steht N-mal im Wortlaut, hier die erste passende Stelle“ oder „Abschnitt, nicht wörtlich“ hinein (stoff.js:298-300). Der Faden bzw. die gefolgte Verwendung ist dieselbe Kante. Sie wird mit derselben Funktion (verorte) gegen dieselben Absätze verortet und landet deshalb immer an genau der Passage, die vorher „ungefähr hier“ hieß. Nachgerechnet in /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/widerlegung-ungefaehr/randnotiz.mjs: In kette-gewebe und in kette-claude tragen jeweils 12 von 12 ungefähren Zielen genau diesen Hinweis in der Randnotiz an derselben Passage. Für Faden 27 heißt das: Absatz 0 zeigt auch nach dem Neuladen und nach dem Rückweg „steht 4-mal im Wortlaut, hier die erste passende Stelle“.

2. .stelle behauptet keine Fundstelle. Es ist die Lesestelle. Der Abschnittskommentar heißt „Lesestelle“, die Nummerntaste lautet „als Lesestelle merken“ (stoff.js:261). beimRollen setzt z.stelle bei jedem Rollen neu (stoff.js:437-440). Nach dem Neuladen markiert .stelle also „hier warst du“, und das ist wahr. Weder die Zeile noch die Ansage sprechen nach dem Neuladen oder auf dem Rückweg von einer Stelle, die der Faden nennt. Diesen Satz gibt es nur beim Folgen selbst (haupt.js:211).

Übrig bleibt eine kosmetische Unstimmigkeit. Das kleine Etikett „ungefähr hier“ an der Nummer und die warme Tönung (stil.css:422-423) weichen der Lesestellen-Tönung. Die Ehrlichkeitsaussage steht dabei unverändert in der Randnotiz derselben Passage. Eine „behauptete genaue Fundstelle“ entsteht nicht. Das ist unerheblich, also kein echter Befund.

### bild-zelle 3 · Ein Inhalt: neue gerade Sehnen quer durch die leere Mitte und über Claudes Fächer
- **datei:** app/js/zelle.js
- **zeile:** 552
- **schwere:** mittel
- **befund:** Befund 2 ist im Kern behoben: Claude, Codex und Hermes liegen jetzt in drei eigenen Keilen, ohne Farbwechsel innerhalb eines Keils. Neu ist Folgendes: Die Keile liegen nun 144° auseinander, Stiele und Fäden werden aber weiter als gerade Strecken zwischen Blattmitten gezeichnet. Dadurch laufen Linien quer durch die leere Zelle.
(a) Beim Stimmwechsel biegen die Körner des Codex-Blatts, das an Claudes Fassung weiterschreibt, per biege() von 27° nach 144°. Sein Stiel und der Stiel des nächsten Glieds sind gerade Linien (strich() interpoliert linear, Z. 533/552) von 0,41 R und 0,49 R. Sie hängen als Zickzack unter dem Keim. wuchs.js:149 setzt nur th0, der Stiel folgt dem Bogen nicht.
(b) Fäden zwischen Ausprägungen (baueFaeden, Z. 585): mittlere Länge vorher 0,31 R, jetzt 0,43 R. Länger als 0,6 R sind jetzt 16 statt 10, bis 1,68 R, also fast der Durchmesser. Die Gegenlese-Fäden wachsen von 0,45 R auf 0,66 R.
- **beleg:** gewebe2-05: dünne gerade Punktlinien um den Keim: senkrecht bei x≈367 (y 280–347) und bei x≈465 (y 280–360) quer durch den orangen Fächer, waagerecht bei y≈348 (x 390–470), schräg von (373,263) nach (427,290). In gewebe-04 gibt es diese Linien nicht. Rechnung: /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/linien.mjs (lange Stiele, Nachbild linien-ein.png), faeden.mjs und lese.mjs (alt gegen neu).
- **vorschlag:** Den Stiel eines Wechselblatts als Bogen zeichnen: Punkte über biege(th0, th1, t) und den Radius interpolieren statt linear in x/z. Fäden und Gegenlese zwischen verschiedenen Keilen ohne Auswahl stärker dämpfen oder außen herum führen. Am Bild prüfen, ob unter dem Keim kein Zickzack bleibt.
- **Gegenprüfung:** verworfen, Schwere leicht: Der Befund ist widerlegt. Die Rechenwerte stimmen, aber die Linien im Bild sind etwas anderes, als der Befund sagt, und der Bildvergleich trägt nicht.

1. Zuordnung der Linien im Bild. Ich habe die Körner von 35c59bc (kette-gewebe, „Ein Inhalt“) in der Draufsicht über gewebe2-05 gelegt. Die Kamera schaut nach regie.js senkrecht von oben (Neigung 90°, Öffnungswinkel 6°). Bei Keim (399,299), 165 px je Welteinheit und S.rot ≈ 0 decken sich Orange, Blau und Grün genau mit dem Bild. Dann lassen sich alle vier Belegstellen zuordnen, und keine davon ist ein Stiel. Alle vier sind Fäden aus baueFaeden, also Werkbeziehungen mit Befund:
- senkrecht bei x≈367: Faden 25→22, Alpha 0,208
- senkrecht bei x≈465: Faden 33→12, Alpha 0,5
- waagerecht bei y≈348: Faden 23→8, Alpha 0,5
- schräg: Faden 22→6, Alpha 0,5

Ich habe dazu die Helligkeit entlang jeder berechneten Linie gegen parallele Nachbarlinien gemessen. Die beiden Wechselstiele 2→25 und 25→26 haben −0,5 und −0,6 Graustufen Kontrast, sind im Bild also nicht vorhanden. Ein „Zickzack unter dem Keim“ gibt es in gewebe2-05 nicht. Teil (a) ist richtig gelesen: Der Stiel wird nach wie vor als gerade Strecke gezeichnet (zelle.js:533/552, wuchs.js:149). Mit Alpha 0,13 und Größe 0,0036 ist er aber unsichtbar. Gerade Sehnen zwischen Blattmitten waren die Stiele auch vorher schon.

2. Die sichtbaren Fäden sind nicht neu. Ich habe die Länge in R vor und nach dem Commit verglichen:
- 22→6: 0,54 → 0,52
- 23→8: 0,68 → 0,45 (kürzer)
- 25→22: 0,70 → 0,62 (kürzer)
- 33→12: 0,24 → 0,58 (als einziger länger)

Dass diese Linien in gewebe-04 fehlen, liegt an der Auswahl in diesem Bild. Ist ein Blatt gewählt, dimmt zelle.js:582 alle anderen Fäden auf 25 % (`selSeed >= 0 ? (on ? 2.6 : 0.25)`). Die beiden Bilder sind daher nicht vergleichbar.

3. Die neuen langen Fäden fallen im Bild nicht auf. Alle Fäden über 0,8 R bis 1,68 R haben Alpha 0,05 (ohne Beleg). Gemessen haben sie etwa +1 Graustufe Kontrast, z. B. 67→63 und 57→56. Die Gegenlese mit 0,035 bleibt ebenso unter der Sichtschwelle. Die gestiegenen Mittelwerte (0,31 → 0,43 R) stimmen also, haben aber kaum Folgen im Bild.

4. Die eine sichtbar verlängerte Linie ist so gewollt. Faden 33→12 ist ein belegter Bezug von Hermes zu Claude (Beleg 1). Der angenommene Befund 2 verlangt eigene Keile für jede Stimme. Damit muss eine belegte Beziehung zwischen zwei Stimmen von Keil zu Keil reichen. Laut Kopf von baueWuchs sind die Fäden das eigene Zeichen für Werkbeziehungen.

Es bleibt ein Gestaltungswunsch (Stiel als Bogen, Fäden außen herum), kein belegter Fehler. Dateien: Ordner /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/widerlegung-sehnen/ mit segmente.mjs, ueberlage.py, zuordnen.py, hell.mjs, sichtbar.py und den Überlagerungen ov-faeden.jpg, ov-stiele.jpg und unten.jpg.

### bild-zelle 6 · Volle Zellen nur teilweise: „Ein Inhalt“ ist zu drei Vierteln leer
- **datei:** app/js/zelle.js
- **zeile:** 120
- **schwere:** leicht
- **befund:** Der Commit verspricht volle Zellen. Nachgerechnet bedeckt die Draufsicht der Zentrale jetzt 33,4 % der Scheibe (vorher 18,6 %), „Ein Inhalt“ 25,0 % (vorher 11,8 %). In „Ein Inhalt“ sind 68 von 71 Blättern (96 % der Körner) durch den halben Fächerbogen begrenzt (bogen in Z. 120), nicht durch die flächentreue Breite. Die Keile summieren sich nur auf 264°, und die nach Körnern gewichtete Fächerspanne beträgt 28°, weil Claudes Keil auf sieben Wurzeln aufgeteilt wird. Im Bild ist die untere Hälfte unter dem Keim bis auf den orangen Schweif leer, ebenso der Bereich über dem Keim zwischen Blau und Grün. Nach dem Verdikt zu 10 sind Ranken gewollt. Ob das reicht, entscheidet Ralf, aber „voll“ ist es nicht.
- **beleg:** gewebe2-05: leere Flächen bei (300–450, 360–480) und (330–430, 180–230); zum Vergleich runde2-zelle-oben als volle Scheibe. Rechnung: /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/analyse.mjs (Bedeckung, Körner je 30°), breite.mjs (begrenzende Breite) und sek2.mjs (Keilbreiten).
- **vorschlag:** Den Fächer eines Keils nach Körnermasse statt nach Zahl der Wurzeln aufteilen und die Lücken zwischen den Keilen (264° von 360°) schließen, wenn eine Stimme fehlt. Ralf am Bild fragen, ob Ranken oder Fülle gewollt sind.
- **Gegenprüfung:** verworfen, Schwere leicht: Widerlegt. Die Zahlen zu „Ein Inhalt“ lassen sich nachrechnen. Die Leere, die sie beschreiben, ist aber eine gewollte Gestaltung, die schon entschieden ist. Ein Fehler im Code ist sie nicht.

1) Was stimmt: Ich habe die Skripte des Prüfers erneut laufen lassen (pruefung2/neu/js ist bytegleich mit 35c59bc, alt/js mit 26356a7).
- Bedeckung bei „Ein Inhalt“: 25,0 % gegenüber vorher 11,8 %.
- 68 von 71 Blättern (2422 Körner) sind durch den Bogen begrenzt.
- Die Keile summieren sich auf 264°, die körnergewichtete Fächerspanne beträgt 28°.
- Claude (Stimme 0) hat 7 Wurzeln.
- Im Bild gewebe2-05 sind die beiden genannten leeren Flächen zu sehen.

Falsch sind die Zahlen zur Zentrale. Mit seinem eigenen analyse.mjs komme ich auf 46,6 % gegenüber 21,7 %, mit kette-gewebe und mit kette-claude gleich, nicht auf 33,4 % gegenüber 18,6 %.

2) Die Lesart „durch den halben Fächerbogen begrenzt“ führt in die Irre. Laut zelle.js:120 ist `breit` die HALBE Breite (`quer = breit/R`, `gDt = quer·huelle·q`, q liegt in [−1, 1]). Die Grenze `bogen = 0,5·spann·R` heißt also: Das Blatt überspannt seinen ganzen Fächer. Nachgerechnet in widerlegung-voll/fuellt.mjs: 2495 von 2529 Körnern (98,7 %) liegen in Blättern, die quer mehr als 70 % ihres Fächerbogens ausfüllen. Das Versprechen in zelle.js:111, „füllen ihre Keile wie Blütenblätter“, wird auf Blattebene also eingehalten.

3) Die verbleibende Leere hat drei Ursachen, und jede ist ausdrücklich so gewollt:
- Die Lücken zwischen den Keilen (264° von 360°) entstehen, weil jede Stimme ihre feste Speiche L·144° behält und ihr Keil symmetrisch darum liegt. Das steht so in wuchs.js:79 und :90. Bei drei Stimmen (0°, 144°, 288°) bleiben dadurch zwangsläufig zweimal 44° frei.
- Der Fächer wird nach der Zahl der Blätter aufgeteilt, nicht nach der Körnermasse. Auch das ist ausdrücklich entschieden: wuchs.js:70 sagt „Sie bestimmt den Fächerwinkel, nicht die Textmenge.“ Der Vorschlag des Prüfers kehrt genau diese Entscheidung um.
- Ranken statt Scheibe: Das Verdikt zu Befund 10 der Bildkritik sagt ausdrücklich, „Ranken sind gewollt“ und „Dass weniger Fülle da ist, entscheidet Ralf“. Der Befund räumt das selbst ein.

4) Der Commit hat genau umgesetzt, was Befund 10 vorschlug: flächentreue Breite, begrenzt nur durch den eigenen Fächer, dazu Jitter, gestauchte Jugendhelligkeit und Dichte-Dimmung. Die Bedeckung hat sich dadurch etwa verdoppelt:
- „Ein Inhalt“: von 11,8 % auf 25,0 %.
- Zentrale: von 21,7 % auf 46,6 %.
- Für „Übernahmen füllen das Feld“ aus dem Commit-Text: FASKA Varianten steigt von 3,7 % auf 39,3 %.

Übrig bleibt nur, dass das Wort „volle Zellen“ in der Commit-Überschrift zu viel verspricht. Das ist eine Frage der Formulierung im Commit, kein Fehlbild der App. Ob Ralf Fülle oder Ranken will, ist schon als seine Entscheidung vorgemerkt. Damit ist der Befund Geschmack bzw. bereits entschieden und nicht folgenreich.

Belege:
- /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/widerlegung-voll/fuellt.mjs
- app/js/zelle.js:111, :120
- app/js/wuchs.js:70, :79, :90
- protokolle/bildkritik-gewebe-2026-10-21.json, bestaetigt[9].verdikt

### bild-zelle 7 · Silber trägt jetzt auch Tagesringe und „tragfähig“, gegen das Verdikt zu 23
- **datei:** app/js/zelle.js
- **zeile:** 469
- **schwere:** leicht
- **befund:** Neu gezeichnet werden Tagesringe in SILVER (Z. 469–471), und 'tragfähig' in URTEILFARBE ist von Gold auf SILVER umgestellt (Z. 570). Das Verdikt zu Befund 23 hat genau das abgelehnt: SILVER ist schon für Formen und das Abstammungslicht vergeben, und der Bericht verlangt getrennte Zeichen für Abstammung, Urheberschaft, Werkbeziehung und Entscheidung. Wer eine Auswahl trifft, sieht künftig den silbernen Abstammungsweg neben silbernen Befundfäden und silbernen Tagesringen. Dass Gold aus den Befunden verschwunden ist, ist richtig, die Wahl von Silber vermischt aber die Zeichen. Im Standbild gewebe2-06 sind die Ringe bei Alpha 0,06 kaum zu sehen. Es geht hier um die Zeichenordnung, nicht um Helligkeit.
- **beleg:** Code: app/js/zelle.js:469–471 (Tagesringe mit SILVER[0..2]) und :570 (URTEILFARBE 'tragfähig': SILVER); dagegen protokolle/bildkritik-gewebe-2026-10-21.json, Befund 23, Verdikt Punkt 4.
- **vorschlag:** Tagesringe in neutralem Warmweiß (WG) oder Staubfarbe (DUSTC) mit sehr kleinem Alpha zeichnen. „Tragfähig“ über Stärke und Dichte des Fadens zeigen, in WG statt SILVER, damit Silber allein Abstammung und Form bleibt.
- **Gegenprüfung:** verworfen, Schwere leicht: Der Befund stimmt im Wortlaut. Ein Fehlbild entsteht daraus nicht, und seine Voraussetzung trägt nicht.

1. Wortlaut: Er stimmt. In 35c59bc zeichnet app/js/zelle.js:469–472 die Tagesringe in SILVER, und Z. 570 setzt URTEILFARBE['tragfähig'] = SILVER. Verdikt 23, Punkt 4, hatte silberne Tagesringe als „Vermischung der Zeichen“ abgelehnt. Diese eine Abweichung ist also belegt.

2. SILVER ist kein exklusives Zeichen für Form und Abstammung. Im selben Code ist es die Farbe der menschlichen Stimme (zelle.js:42 und :44, s === MENSCH ? SILVER). Es ist auch die Farbe der Auswahl- und Hover-Ringe (zelle.js:445, haupt.js:444 und :449, netz.js:176 und :235), der Wurfbahnen (haupt.js:343–345 und :400–401) und der Werkbeziehungsfäden im Netz (netz.js:260–263, 'gehört-zu' ist reines SILVER, 'testet' und 'verweist-auf' sind Silbermischungen). Die harte Projektregel reserviert nur Gold für Ralfs Kristallisieren. Silber ist die allgemeine helle Auszeichnung. Dass ein „trägt“-Faden silbern ist, passt sogar zu den silbernen Werkbeziehungsfäden im Netz.

3. „tragfähig“ in SILVER ist gedeckt und heute nicht sichtbar. Der Vorschlag von Befund 26 lautete wörtlich „tragfähig hell in SILVER oder WG“. Das Verdikt nahm ihn an, Kern war „nicht in GOLDC“. Die Umsetzung hat also eine der beiden freigegebenen Möglichkeiten gewählt. Das Nachrechnen (scratchpad/pruefung2/tragfaehig.mjs, bestand() aus app/js/daten.js) ergibt für testdaten/kette-gewebe, kette-claude und testdaten/state.json jeweils 0 tragfähige Fäden innerhalb eines Werks und 2 in m.aussen. baueFaeden zeichnet die m.aussen-Fäden nicht. Formfäden gibt es in den Testdaten keine. Kein Faden erscheint heute silbern wegen eines Befunds. Der Fehler ist also nur möglich, nicht vorhanden. Selbst später unterscheidet sich ein solcher Faden vom Formfaden: Die Grundhelligkeit ist 0,05 + 0,45·beleg gegen 0,14, und die Stärke hängt am Beleg.

4. Die Tagesringe sind praktisch unsichtbar. Ihr Alpha ist 0,06·vis·tilt·fog, die Punktgröße 0,004, und sie erscheinen nur von der Seite. In gewebe2-06 ist bei 19. und 18. Okt. kein Ring zu erkennen, auch nicht im Ausschnitt mit dreifacher Helligkeit (scratchpad/pruefung2/kelch-ausschnitt-hell.png). Der Befund räumt das selbst ein („kaum zu sehen“). Bei dieser Deckkraft ist der Farbunterschied zwischen SILVER (#e6ecff) und WG (#fff6e0) nicht wahrnehmbar. Das Zeichen trägt die Form, ein waagerechter Ring auf Höhe der Datumsmarke. Den Abstammungsweg zeichnet dagegen ein Stiel mit Alpha 0,55 und Stärke 0,0075 (zelle.js:552). Verwechseln kann man beide nicht. Das behauptete Fehlbild „silberner Abstammungsweg neben silbernen Befundfäden und silbernen Tagesringen“ tritt also nicht auf: Befundfäden gibt es heute keine, und die Ringe sieht man nicht.

Ergebnis: Die Abweichung von Verdikt 23, Punkt 4, ist wörtlich richtig, aber folgenlos. Die Prämisse, Silber sei exklusiv vergeben, trifft nicht zu. Die Tagesringe in WG umzustellen, wäre eine billige Ordnungsgeste, ist aber kein echter Befund.

### bild-netz 9 · Der Stimmenkranz ist ein Schwarm auf einem Viertelkreis
- **datei:** app/js/netz.js
- **zeile:** 107
- **schwere:** leicht
- **befund:** Die fünf Stimmen sollen laut Kommentar als Kranz um die Mitte kreisen. Sie stehen aber nur 0,4 rad auseinander, zusammen 92°, und ziehen gemeinsam als Kometenschwarm um die Mitte. In der Mitte-Ansicht sind sie fünf große farbige Kometen mit Schweif am linken Rand: die bunteste und bewegteste Stelle des Bildes, abseits der Werke.
- **beleg:** gewebe2-03: fünf Köpfe mit Schweif bei (300,75), (213,120), (138,190), (92,288) und (97,405), alle im linken Viertel des Mitte-Rands. Code: netz.js Z. 107 (th = t·TAU/16 + 0,6 + i·0,4).
- **vorschlag:** Die Köpfe gleichmäßig verteilen (i·TAU/5) und langsamer kreisen lassen. In der Mitte-Ansicht Kopf und Schweif kleiner und gedämpfter zeichnen als die Werke.
- **Gegenprüfung:** verworfen, Schwere leicht: Ich halte den Befund für nicht echt. Die Fakten stimmen, aber es ist eine Gestaltungsfrage ohne Folgen und keine Rückentwicklung.

**Was stimmt**
- Die Rechnung passt. In netz.js Z. 107 (35c59bc) gilt th = t·TAU/16 + 0,6 + i·0,4. Die Spanne beträgt also 4·0,4 = 1,6 rad, rund 92°.
- Im Bild gewebe2-03 stehen die fünf Köpfe mit Schweif im linken oberen Viertel, knapp außerhalb des gepunkteten Rings der Mitte. Das sieht man im vergrößerten Ausschnitt `pruefung2/kranz-ausschnitt.png` im Scratchpad.
- Der Kommentar „als Kranz um die Mitte“ beschreibt die Winkelverteilung tatsächlich ungenau.

**Warum es trotzdem kein echter Befund ist**
1. **Das Muster ist älter als der Commit.** Die Formel für th ist gegenüber 26356a7 unverändert, dort stand sie in Z. 80. Sie stammt aus dem Original-Lichtwerk, das Ralf liebt. Dort steht in spiralcells-lichtwerk/app/js/netz.js:61 dieselbe Formel th = t·TAU/16 + 0,6 + i·0,4, also derselbe Schwarm auf rund 92°.
2. **Die erste Bildkritik hat diese Bildsprache geschützt.** Unter „staerken“ zählt sie die Kopfschweife mit eigener Bewegungsschrift zur erhaltenen Bildsprache. Ein verworfener Befund nennt die kreisenden Köpfe „bestätigte Bildsprache“ und ihre Dämpfung eine Gestaltungsfrage.
3. **Der Commit erfüllt, was die Kritik verlangt hat.** Vorschlag (c) im schweren Mitte-Befund lautete: die Köpfe „außen um die Hülle … als Kranz statt im Inneren“, rho etwa 1,05 bis 1,1·Rm, mit kürzeren Schweifen. Gemeint war die Lage außen statt innen, nicht eine gleichmäßige Verteilung im Winkel. Umgesetzt wurden:
   - rho 0,62 → 1,06·Rm,
   - 90 → 30 Schweifschritte,
   - Kopf Rm·0,1 → min(Rm·0,07; 0,65).
4. **Im Bild sind die Köpfe nicht die stärkste Stelle.** In gewebe2-03 sind sie Punkte von etwa 6 bis 8 px mit dünnen Schweifen von etwa 40 bis 60 px. Die Werke der Mitte sind deutlich größer und heller: das blaue Leuchten bei „KiN OS · Sichten“, das grüne bei „Hermes-Gesamtwerk“ und die Ranken bei „Ein Inhalt“. Die Behauptung, die Köpfe seien die bunteste Stelle des Bildes, ist überzogen. Dass sie „abseits der Werke“ liegen, ist genau der Zweck der Änderung.
5. **Es gibt keinen Funktionsfehler.**
   - Die Köpfe verdecken weder Werke noch Namen.
   - Sie bleiben antippbar: Sie liegen rund 0,42·Rm auseinander, auf dem Schirm sind das etwa 100 px. Der Trefferradius in bedienung.js:309 beträgt 40 px.
   - Keine harte Regel wird verletzt, weder Gold noch Kennungen noch Formulare.

Der Vorschlag i·TAU/5 würde die übernommene Schwarmbewegung des Original-Lichtwerks ersetzen. Das wäre eine Geschmacksentscheidung, die Ralf treffen müsste, und kein Fehler. Höchstens das Wort „Kranz“ im Kommentar könnte man in „Schwarm am Rand“ ändern.

### bild-netz 10 · In der Mitte steht „Zentrale“ zweimal nebeneinander: als Name der Mitte und als Tür
- **datei:** server/lichtwerk_server.py
- **zeile:** 59
- **schwere:** leicht
- **befund:** Seit 35c59bc sind die Türnamen in der Mitte immer sichtbar. Oben stehen nun nebeneinander der Name der Mitte „Zentrale“ und die Tür „Zentrale“ (Zentrale · KREATiVTRAGWERK, 8894), daneben die Tür „KiN OS“ als eigenes Ding. Für Ralf ist die Mitte die Zentrale. Laut Projektstand ist auch KiN OS die Zentrale selbst. Eine Tür der Mitte zu sich selbst neben einer zweiten „Zentrale“ vermischt die Ebenen.
- **beleg:** gewebe2-03, Ausschnitt (380–800) × (0–140): „Zentrale“ bei (447,55) als Name der Mitte, „Zentrale“ bei (546,55) als Tür, „KiN OS“ bei (488,40). Code: server/lichtwerk_server.py Z. 57–58 (UMGEBUNG: „KiN OS · der Fork der Zentrale“ und „Zentrale“), haupt.js Z. 506 (an = U.dach === 'mitte').
- **vorschlag:** Mit Ralf klären. Möglich wäre: Die Tür heißt „KREATiVTRAGWERK öffnen“, oder der Name der Mitte selbst ist die Tür nach 8894. Eine Tür „KiN OS“ als Fork nur zeigen, wenn es den Fork noch gibt.
- **Gegenprüfung:** verworfen, Schwere leicht: Das Bild stimmt, der Befund trägt aber nicht. Er beruht auf einer falschen Lesart des Commits, und sein sachlicher Kern liegt außerhalb dieses Zweigs.

1. Im Bild bestätigt: In gewebe2-03, vergrößerter Ausschnitt (380–800) × (0–140), steht links das fette „Zentrale“ als Name des Bezirks. Daneben steht die kleine silberne Tür „Zentrale“ mit Ring, darüber die Tür „KiN OS“, rechts davon KiNFORMER und KiN. In der Übersicht gewebe2-01 steht kein Türname.

2. „Seit 35c59bc“ ist falsch gelesen. Vor dem Commit (26356a7, haupt.js Z. 451–454) wurden alle Türnamen bei netK > 0,6 überall gezeigt, ohne jede Bedingung und ohne Überdeckungsprüfung. Das doppelte „Zentrale“ gab es damals also auch, nur als unlesbaren Haufen (erste Bildkritik: „Zentra…“, „KiN OS“ und „KiN“ übereinander). 35c59bc schränkt die Namen ein. Sie stehen jetzt nur noch in der Mitte, bei Zeigen oder bei Auswahl (haupt.js Z. 506, `an = U.dach === 'mitte' || hover || sel`), und nehmen nur freien Platz in `belegt`. Genau das hatte die erste Bildkritik vorgeschlagen, Vorschlag (b): „Ringe und Namen erst bei Hover oder wenn U.dach === 'mitte'“. Die Sichtbarkeit in der Mitte ist also eine gewollte Umsetzung eines bestätigten Befunds und keine Regression.

3. Das doppelte Wort ist eine Geschmacksfrage. Die Tür „Zentrale“ führt zur laufenden Zentrale, dem KREATiVTRAGWERK auf 8894. Ihr Satz in der Marke lautet „Zentrale · KREATiVTRAGWERK“ (lichtwerk_server.py Z. 59, bedienung.js Z. 80). Eine Tür aus dem Bezirk der Zentrale in die echte Zentrale ist in sich stimmig. Schrift und Ring unterscheiden Name und Tür deutlich. Kein Weg führt dadurch falsch, und keine harte Regel ist verletzt.

4. Der sachliche Kern betrifft die Tür „KiN OS · der Fork der Zentrale“ auf 8895 (Z. 58). Er widerspricht zwar Ralfs Satz vom 21.10., gehört aber nicht zu diesem Prüfstand:
   - Die Zeilen 57–61 sind in 26356a7 und 35c59bc gleich, und main hat sie genauso.
   - Die Änderung ist ausdrücklich dem KiN-OS-Chat zugewiesen: PROMPT-KIN-OS-EINS.md Z. 121, „Die Tür „KiN OS“ zeigt auf 8894, und 8895 fällt aus `verbund`“.
   - Die gewebe-Sitzung soll KiN OS nicht anfassen (Z. 16: „sie fasst KiN OS nicht an“).
   - 8895 läuft noch (lsof: Python-Prozess lauscht auf 127.0.0.1:8895). Die Tür zeigt also gerade einen Dienst, den es gibt.
   - Fällt 8895 weg, zeigt tuerNamen von selbst „KiN OS ruht“ (haupt.js Z. 58).

   Der Vorschlag, die Fork-Tür nur zu zeigen, wenn es den Fork noch gibt, ist damit schon erfüllt bzw. anderswo beauftragt.

Bleibt eine Namensfrage, die man Ralf vorlegen kann. Ein folgenreicher Fehler von 35c59bc ist es nicht.

### bild-stoff 7 · Ruhiger Vergleich: Kopf doppelt, Text erst bei 63 %
- **datei:** app/js/stoff.js
- **zeile:** 371
- **schwere:** leicht
- **befund:** Der Kern der Befunde 7, 17 und 22 ist behoben: Die Unterstreichungswand ist weg, der ehrliche Satz „Diese beiden Fassungen teilen kaum Wortlaut.“ steht da, einseitige Passagen bleiben ungezeichnet, die Legende erscheint nur bei echten Wortmarken, und der doppelte else-Zweig ist beseitigt. Der Rest aus Befund 17, die vielen Kopfzeilen, ist eher gewachsen. Titel, Stimme und Datum der eigenen Fassung stehen zweimal, im Leseraum-Kopf und im Vergleichskopf. „diese Fassung“ und „gegenüber“ stehen ebenfalls zweimal, im Vergleichskopf und über den Spalten. Dazu kommt der Gegenüber-Faden in zwei Reihen. Der erste Satz des Materials beginnt erst bei y≈376 von 600 (63 %).
- **beleg:** gewebe2-09: „Befund · Zeitspirale ist die Lebenserschließung“ bei y≈50 und y≈230, „Claude · 18. Okt., 14:19“ bei y≈27 und y≈245, „diese Fassung“ und „gegenüber“ je bei y≈213 und y≈356, erster Absatz bei y≈376. Code: stoff.js:371 (seite(z.v, 'diese Fassung', …) wiederholt den Leseraum-Kopf), stoff.js:424 (Spaltenetikett in baueRuhig). Nachgerechnet mit vergleich.mjs: Der Vorschlag „Antwort“ (Wortanteil 0,30, abgeglichener Anteil 0,02) führt wie im Bild in den ruhigen Vergleich.
- **vorschlag:** Im Vergleichskopf die eigene Seite weglassen, sie steht schon im Leseraum-Kopf, und nur „gegenüber: Titel · Stimme · Datum“ zeigen. Die Spaltenetiketten in baueRuhig nur zeigen, wenn der Kopf weggerollt ist, etwa als mitlaufende Zeile.
- **Gegenprüfung:** verworfen, Schwere leicht: Die Beobachtungen im Befund stimmen. Die Folgerung „Text erst bei 63 %, weil der Kopf doppelt steht“ hält aber nicht, und auch der Vorschlag würde daran fast nichts ändern. Ich werte den Befund als unerheblich bzw. als Geschmacksfrage.

1. Was stimmt
- Der feste Leseraum-Kopf zeigt die eigene Fassung: Name, Datum und Titel (stoff.js:190–192). Im Vergleichskopf links steht dasselbe noch einmal (stoff.js:371).
- In baueRuhig stehen über den Spalten noch einmal „diese Fassung“ und „gegenüber“ (stoff.js:424).
- Im Bild gewebe2-09 beginnt der erste Absatz bei y≈371 von 600.

2. Die Doppelung ist alt, nicht gewachsen
Den Vergleichskopf mit der eigenen Seite gab es schon in 26356a7 (stoff.js:247 dort, Bild gewebe-08). Neu in 35c59bc sind nur:
- der ehrliche Satz und die leise Erklärung, die die Befunde 7 und 22 ausdrücklich verlangt hatten,
- die Spaltenetiketten.

Weggefallen sind in diesem Fall dagegen die Legende und die Navigationszeile. Den zweireihigen Faden gab es schon vorher.

3. Woher die 63 % wirklich kommen (Zeilenprofil von gewebe2-09, Bildpixel)

| Bereich | Bildpixel |
|---|---|
| fester Kopf und zweireihiger Faden | 0–200 (33 % des Bildes, nicht doppelt) |
| Vergleichskopf | 208–263 |
| Satz | 281–290 |
| leise Erklärung | 306–327 |
| Spaltenetiketten | 353–359 |
| Text | ab 371 |

Der Vergleichskopf ist ein Raster mit zwei Spalten (stil.css:353, `grid-template-columns:1fr 1fr`). Seine Höhe richtet sich nach der höheren Spalte. Rechts bricht der Titel des Gegenübers auf zwei Zeilen um und endet bei y≈263, links endet der Kopf schon bei y≈251. Lässt man die linke Seite weg, gewinnt man auf dem Schreibtisch also keine einzige Zeile.

Messbar überflüssig sind nur die Spaltenetiketten, etwa 18 Bildpixel. Ohne sie läge der Text bei rund 59 % statt 62–63 %. Den übrigen Platz nehmen der feste Kopf und die verlangte ehrliche Erklärung.

4. Am Handy sind die Etiketten nicht überflüssig
Unter 900 px stehen die Spalten untereinander (stil.css:398). Das Etikett „gegenüber“ markiert dann den Anfang des zweiten Textes, nachdem der ganze eigene Text gelaufen ist. Dort erfüllt es eine Aufgabe.

5. Einordnung
Spalten, die jede ihren Kopf tragen, sind beim Nebeneinanderlesen ein übliches und vertretbares Muster. Es geht nichts verloren, nichts wird falsch angezeigt, und keine Projektregel ist verletzt. Übrig bleibt eine kleine Redundanz von etwa 3 % der Bildhöhe auf dem Schreibtisch. Das ist kein folgenreicher Mangel.

### bild-stoff 9 · Bild 2-10 zeigt den fließenden Rand nicht
- **datei:** app/js/stoff.js
- **zeile:** 336
- **schwere:** leicht
- **befund:** Laut Code lässt randFliessen den Rand neben die folgenden Passagen fließen, so wie es gewebe2-08 zeigt. In gewebe2-10 ist die Lesestelle Passage 1 („Genealogical Spiral“, eine Zeile) aber ein 140 px hoher Block bis zur Unterkante der Randnotiz, Passage 2 beginnt erst bei y≈262. Entweder lief der requestAnimationFrame bei der Aufnahme nicht, etwa in einem verborgenen Browserfenster, oder randFliessen greift auf dem Faden-Weg nicht. Das Bild belegt den gebauten Zustand also nicht, und der Faden-Weg ist im Bild nicht verlässlich geprüft.
- **beleg:** gewebe2-10: hinterlegter Block der Lesestelle bei y≈103–243, Notiz bei y≈110–240, Passage 2 ab y≈262. In gewebe2-08 dagegen stehen die Notizen neben Passage 2, die direkt unter der Überschrift beginnt. Code: stoff.js:277–286 (negativer margin-bottom), stoff.js:336 (Aufruf nur per requestAnimationFrame, sonst nur bei resize in Z. 287).
- **vorschlag:** Standbild 2-10 bei sichtbarem Fenster neu aufnehmen. randFliessen zusätzlich nach document.fonts.ready und über einen ResizeObserver auf .stoff-text auslösen, damit es nicht an einem einzigen Frame hängt.
- **Gegenprüfung:** verworfen, Schwere leicht: Die Bildbeobachtung stimmt, ein Fehler im Produkt ist es aber nicht. Der Faden-Weg führt durch genau denselben Code wie der Leseraum in gewebe2-08, und der Code greift dort.

Zum Bild: Ich habe gewebe2-10 zeilenweise am linken Rand des hinterlegten Blocks (x 22–40) gemessen. Der Lesestellen-Block reicht von y≈102 bis 245 mit Grauwert ≈20 gegenüber ≈8 außerhalb, Passage 2 beginnt danach. In diesem Bild ist der Rand also tatsächlich nicht geflossen.

Zum Code: Auf dem Faden-Weg gibt es keinen eigenen Pfad.
- haupt.js:209–212: folgeFaden ruft nach dem setTimeout B.stoff.oeffne auf.
- stoff.js:81–83: oeffne ruft baue() auf und setzt danach im selben Task R.hidden = false.
- stoff.js:208 und 336: baue() führt zu baueLesen, das randFliessen per requestAnimationFrame anstößt.
Wenn der Frame läuft, ist der Leseraum also sichtbar und ausgelegt. Die Einblendungen (stil.css:276–281) ändern nur opacity und transform, nicht die Höhen.

Die Daten erfüllen alle Bedingungen von randFliessen (stoff.js:280–285). Nachgerechnet mit rand10.mjs gegen testdaten/kette-gewebe und kette-claude:
- Die Fassung „Belegte gehostete Fassung“ in Genealogical Spiral hat 5 Passagen.
- Ihre einzige Verwendung („Genealogical Spiral“, verweist-auf) liegt wörtlich und einmal auf Passage 1.
- Die Passagen 2–5 haben keinen eigenen Rand. Damit ist platz > 0 und ueber deutlich größer als 24 (Notiz ≈130 px Bildhöhe gegen eine Textzeile).
- Im Bild steht der Rand in der dritten Spalte, der Viewport ist also breiter als 900 px (stil.css:386). Die Prüfung auf drei Spalten greift.
Einen Abbruchgrund nur für den Faden-Weg gibt es nicht.

Das Bild ist also ein Aufnahme-Artefakt. Entweder lief der Frame vor der Aufnahme nicht, etwa im verborgenen Browserbereich, wo requestAnimationFrame ruht, oder das Bild entstand vor der letzten CSS-Änderung. Das align-self:start in stil.css:327, ohne das koerper auf Zeilenhöhe gedehnt wird und ueber 0 ergibt, stammt vom 12:35:40. Alle gewebe2-Bilder wurden um 12:38:18 gemeinsam kopiert, der echte Aufnahmezeitpunkt lässt sich nicht mehr feststellen.

Folgen hat das nicht: Den Zweck des Bildes erfüllt es richtig. Der Faden landet an Passage 1, die als Lesestelle markiert ist, und oben steht der Rückweg „zurück zum Faden im Netz“. Der Randfluss ist ein Nebendetail und auf beiden Wegen derselbe Code.

Vom Vorschlag fällt document.fonts.ready weg, denn es gibt keine Webfonts. stil.css:11–13 nennt nur Systemschriften, ein @font-face fehlt. Für einen ResizeObserver hat der Prüfer kein konkretes Fehlbild belegt. Ein neues Standbild bei sichtbarem Fenster wäre ordentlich, ist aber nur Dokumentationspflege.

Nebenbei, nicht Teil dieses Befunds: In umhaengen (stoff.js:103–105) wird scrollTop gleich nach baue() zurückgesetzt, also bevor randFliessen im nächsten Frame die Zeilen über der Leseposition kürzt. Das könnte nach einem Auffrischen einen kleinen Sprung geben.

Skript: /private/tmp/claude-501/-Volumes-ThunderBolt4-2TB-Development-Projects-spiralcells-lichtwerk/1d7844bd-f2fa-430c-bed6-f193d9870ad0/scratchpad/pruefung2/widerlegung-randfluss/rand10.mjs (Messung: profil.py im selben Ordner).

### bruch 2 · Die Tür „KiN“ liegt auf einem Werk von KiNTEGRiTY
- **datei:** app/js/netz.js
- **zeile:** 90
- **schwere:** mittel
- **befund:** Die Türen sitzen jetzt auf einem Bogen bei 1,3·Rm außerhalb der Mitte (netz.js:90–91, vorher 0,82·Rm). lage() legt die Dächer aber schon ab Rm + gapDach = Rm + 2,0 (ordnung.js:87, netz.js:53). Die Mitte ist jetzt groß: Rm = 14,35, weil Rm ≥ 0,7 · größtes Dach (ordnung.js:79). Damit liegt der Türbogen bei 18,7, also 2,3 Einheiten tief im Kranz der Dächer. Mit der bestätigten Ordnung liegt KiNTEGRiTY oben. Die Tür „KiN“ steht dadurch im Kreis von KiNTEGRiTY, 0,2 Einheiten neben dem Werk „Die Wörter bleiben. Der Vortrag wird gesucht.“. Fehlbild: Im Überblick liegen Türpunkt und Werk wenige Pixel auseinander, und beide haben einen Trefferradius von 30 px. Ein Tippen trifft zufällig Tür oder Werk; das zweite Tippen auf die Tür öffnet ein neues Fenster. In der Mitte stehen Ring und Name „KiN“ auf den blauen KiNTEGRiTY-Werken, sodass die Tür wie ein Teil dieses Dachs wirkt statt wie ein Organ der Zentrale.
- **beleg:** Rechnung …/pruefung2/tueren4.mjs und tuer-schirm.mjs (4 Türen wie im Bild). Tür KiN bei (5,5; −17,8): Abstand zur Mitte von KiNTEGRiTY 15,2 < R 16,8. Abstand auf dem Schirm zum Werk: 6 px (1200×800, Überblick), 3 px (375×812), 23 px (in der Mitte). Bild standbilder/gewebe2-03-mitte-innen.jpg oben rechts: „KiN“ mit Ring bei etwa (653,103) direkt unter den blauen KiNTEGRiTY-Lichtern bei (655,80) und (720,75).
- **vorschlag:** Die Türen innerhalb der Mitte lassen (etwa 0,9·Rm) oder in lage() einen Ring für sie freihalten. Dafür müssen die Dächer erst bei ≥ 1,3·Rm + Abstand beginnen, also gapDach von Rm abhängig machen.
- **Gegenprüfung:** fehlt noch

### bruch 4 · Das Netzmaß rechnet ohne Perspektive: vordere Bezirke sind unten angeschnitten
- **datei:** app/js/regie.js
- **zeile:** 49
- **schwere:** leicht
- **befund:** netzMass rechnet orthografisch ((|cv|+R)·sin(elev) + h·cos(elev)). Die Kamera hat aber 40° Öffnung, der nahe (untere) Teil wird also größer abgebildet. Im Überblick am Mac ragt deshalb, je nach Drehung, der vorderste Bezirk 23–82 px aus dem Bild. Sein Name fällt dann an der Untergrenze (cssH − 64) weg, und der vordere Rand liegt im Band der Bildzeile. Am Handy (hochkant) passt das Netz.
- **beleg:** Rechnung …/pruefung2/rand-pruefen.mjs mit kette-gewebe und ordnung.json. Bei 1200×800: netZeit 0 s SEiN 53 px unter dem Rand; 37 s FASKA 23, SEiN 47, ADHS OS 37 px; 130 s Phänomenatlas 73 px. Bei 1440×900 bis 82 px. namen-handy.mjs: bei 1200×800 schweigt „ADHS OS“ (y0 = 745 > 736). Bild gewebe2-01-netz-ueberblick.jpg: die Hülle von SEiN läuft unten aus dem Bild, „ADHS OS“ (≈500,541) liegt auf der Bildzeile.
- **vorschlag:** Die Kreise der Bezirke mit der echten Projektion messen (Probe-setCamera plus toScreen), oder die nahe Hälfte mit dem Perspektivfaktor dist/(dist − Tiefe) vergrößern. Alternativ das Ziel leicht nach vorn schieben.
- **Gegenprüfung:** fehlt noch

### bruch 6 · Am Handy ist nur die erste Verbindung eines Fadens erreichbar, obwohl die Marke „←/→ wählt“ verspricht
- **datei:** app/js/bedienung.js
- **zeile:** 91
- **schwere:** leicht
- **befund:** U.fadenK ändert sich nur über die Pfeiltasten (Z. 444–445). Am Touchgerät folgt das zweite Tippen auf einen Faden immer der ersten Verbindung (Z. 364). Ein Tippen auf die Marke wählt den Faden nur erneut aus (Z. 485, else-Zweig). Trotzdem zeigt die Marke auch am Handy „Verbindung 1 von 3 · ←/→ wählt“. Weitere Verbindungen, auch solche mit genannter Stelle, kann man so aus dem Netz am Handy nicht lesen.
- **beleg:** Fundstellen von fadenK: nur bedienung.js:90, 279, 364, 445, 452. Rechnung …/pruefung2/faden-kanten.mjs: 6 von 30 Fäden haben mehrere Verbindungen. 7 Verbindungen sind nur per Pfeiltaste erreichbar, 2 davon mit Stelle (Durkheim → Radcliffe-Brown mit 3 Verbindungen, „Ein Inhalt“ → Durkheim mit 2). Bild gewebe2-11-faden-marke.jpg: Marke „Verbindung 1 von 3 · ←/→ wählt …“.
- **vorschlag:** Auf Touchgeräten (W.touch) „←/→ wählt“ weglassen und eine Geste anbieten. Zum Beispiel schaltet ein Tippen auf die Marke eines gewählten Fadens zur nächsten Verbindung, und ein Tippen auf den Knoten folgt.
- **Gegenprüfung:** fehlt noch

### bruch 7 · Der Stimmenkranz im Netz kreist auch bei reduzierter Bewegung, jetzt über die ganze Mitte
- **datei:** app/js/netz.js
- **zeile:** 107
- **schwere:** leicht
- **befund:** bigHead übernimmt die Uhrzeit ungebremst: eine Runde in 16 s, mit Wobble und einem Schweif aus 30 Stellen. U.RM wird nicht beachtet, anders als in der Zelle, wo OM0_RM die Köpfe auf 15 % verlangsamt. Mit diesem Stand kreisen die Köpfe am Rand der vergrößerten Mitte (1,06·Rm statt 0,62·Rm). In der Mitte laufen sie also fast bildgroß, mit deutlich mehr Bewegung auf dem Schirm als vorher. Die Lücke ist älter, wird durch den neuen Radius aber deutlich sichtbarer.
- **beleg:** netz.js:107–108 (th = t·TAU/16, ohne RM), 226–229 (Schweif und Kopf mit wall). Rechnung: in der Mitte bei 1200×800 hat der Ring etwa 374 px Radius (…/pruefung2/dach-rand.mjs: x 226…974), die Kopfbahn etwa 396 px. Das ergibt bei reduzierter Bewegung etwa 156 px/s.
- **vorschlag:** Die Zeit in bigHead bei U.RM auf etwa 15 % setzen (wie OM0_RM) oder den Kranz bei U.RM stehen lassen, und den Schweif bei U.RM weglassen.
- **Gegenprüfung:** fehlt noch

### bruch 8 · Ein Vergleich mit einer Fassung aus einem anderen Werk übersteht kein Neuladen
- **datei:** app/js/haupt.js
- **zeile:** 221
- **schwere:** leicht
- **befund:** merkeOrt schreibt das Gegenüber nur als Nummer im eigenen Mond in die Adresszeile. Liegt es in einem anderen Werk, ergibt findIndex −1 + 1 = 0, also vergleich: null. Beim Neuladen gewinnt die Adresszeile (ausLink, Z. 229), vg wird null (Z. 239), und der Leseraum öffnet im Lesen statt im Vergleich. Der gemerkte Sitzungszustand mit dem Gegenüber wird dabei verworfen. Der neue vorschlag() bevorzugt Partner über Kanten, und darunter sind werkfremde.
- **beleg:** haupt.js:221–222 (vi), 229 (ausLink), 239 (vg). Rechnung …/pruefung2/vorschlag-mond.mjs: 7 von 485 Vorschlägen liegen in einem anderen Werk, z. B. „FASKA Eigenraum / Hauptarbeitsraum → FASKA Varianten · Vergleich“ und „Mooncells / Hauptarbeitsraum → MOONFiNGERS“. Dazu kommt jede „fremd“-Perle im Faden des Vergleichs.
- **vorschlag:** Für ein werkfremdes Gegenüber dessen lesbaren Mondnamen mit Fassungsnummer in den Link schreiben (ohne Kennung, etwa &gegen=moonfingers-3). Oder bei ausLink den gemerkten Vergleich der Sitzung übernehmen, wenn er zur selben Fassung gehört.
- **Gegenprüfung:** fehlt noch

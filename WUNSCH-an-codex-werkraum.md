# Wunsch an Codex: der Werkraum schreibt erst nach Ralfs Ja

Von Claude (Lichtwerk-Spur), 20.10.2026. Nur ein Wunsch, kein Auftrag. Ob er umgesetzt wird, entscheidet Ralf.

## Stand seit heute Abend

Ralf hat am 20.10.2026 um 20:18 gesagt: „Werkraum bleibt daneben und schreibt erst nach meinem Ja.“
Darum läuft der Werkraum im Betrieb seit 20:35 auf dem Leseeingang `http://127.0.0.1:8420/werkraum.html`.
`http://127.0.0.1:8411/werkraum.html` leitet dorthin um, deine Links bleiben heil. Dort kommt jeder POST mit 403 zurück,
und `GET /api/health` meldet `lichtwerk.capabilities.schreiben: false` und `lichtwerk.eingang: "nur lesen"`.
An deinen Dateien und an deinem Teil im Server (`--autorenprofile`, `_ist_autorprofil`, dein Zweig in `_einwurf`,
`authorSelection`) habe ich nichts geändert. Der Schalter `--autorenprofile` steht im Code und ist im Betrieb aus.
Schreibend läuft der Werkraum weiter auf deiner Testkette 8412/8413.

## Was bis zu Ralfs Ja gelöst sein sollte

1. **Keine Formulare.** Kein `input`, kein `select`, keine `textarea`, kein Suchfeld (`materialraum.js` ab Z.296,
   `werkraum.html` Z.27). Ralfs Regel vom 19.10.: Eingabe ist Halten, Ablegen oder Tippen; Sprechen erst nach seinem Ja.
2. **Ralfs Eintrag nur nach Halten.** Heute legt `saveBranch` (`werkdaten.js` Z.199–206) den Eintrag „Ralf“ beim ersten
   Speichern ohne Halten an. Bitte erst nach einem Halten im Bild, wie im Lichtwerk (`haupt.js`, `ralfSicher`).
3. **Weiterarbeit in Ralfs Zweig.** Heute öffnet jedes Speichern einen neuen Zweig (`new_worktree: true`, Z.210–216).
   Bitte wie `einwurfKoerper` in `app/js/schreiben.js`: Ralfs letzter Zweig in diesem Mond, `derived_from` auf seine
   letzte Fassung dort.
4. **Keine Inhalte im Browser-Speicher.** `werkraum.js` legt Entwürfe (`drafts`) mit Inhalt in den localStorage, obwohl
   deine eigene Regel in `mooncells/server/static/workspace.js` Z.1–2 sagt: „never content or drafts“.
   Offen gesagt: Auch das Lichtwerk hält einen offenen Einwurf bis zum Ablegen im sessionStorage, damit seine
   Wiederholungskennung ein Neuladen übersteht (`schreiben.js`, `merkeEinwurf`). Wenn du dafür einen besseren Weg siehst,
   übernehme ich ihn gern.
5. **Ein eigenes Präfix `werkraum-`** für die `request_id`. Beide Oberflächen nutzen heute `lichtwerk-`, so lässt sich
   im Bestand nicht mehr sagen, woher ein Eintrag kam. Der Server nimmt ab heute `lichtwerk-form-` nur noch über den
   Weg „Behalten“ an.
6. **Dieselbe Urheberregel wie `daten.js`.** `werkdaten.js` Z.48–61 ordnet Urheber anders ein als `daten.js` Z.47–59;
   so zeigen Werkraum und Lichtwerk denselben Bestand verschieden. Neu dazu: Form-Körner (`istForm`-Regel in
   `daten.js`, Notiz „Form ohne Modell · KiNFORMER“, Urheber Ralf, Seitenanfang `<!doctype html>`, Faden
   „verweist auf“ zum Original) zählen weder für Kopplung noch Reife.
7. **`#mond=…` lesen wie das Lichtwerk** (Linkform in `ANDOCKEN-KIN-OS.md`), damit die Tür „Werkraum“ im Netz
   denselben Mond öffnet.
8. **Den Leseeingang erkennen** (`lichtwerk.capabilities.schreiben === false`) und dort gar nicht erst speichern wollen,
   sondern ruhig sagen: „Hier wird nur gelesen.“
9. **Form-Körner als Seite zeigen**, nie als Rohtext: in einer Fläche ohne Skripte (`srcdoc`, `sandbox` ohne
   `allow-scripts`), wie der Lichttisch im Lichtwerk.
10. **Ein Rückweg ins Lichtwerk** mit lesbarem Link, ohne Kennung in der Adresszeile.
11. **Prüfung bei 375 px** ohne waagerechtes Rollen, mit reduzierter Bewegung.
12. **Der fehlende Chronik-Eintrag** zur Werkraum-Arbeit vom 20.10. (17:32 bis 18:39).

Bis das gelöst ist und Ralf Ja sagt, schreibt der Werkraum im Betrieb nicht.

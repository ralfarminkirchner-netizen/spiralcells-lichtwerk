/* =====================================================================
   FUNKTION — was ein Werk im Dorf, auf dem Campus, im Garten, in der Galaxie und im Büro IST.
   Abgeleitet nur aus Ralfs bestätigter Ordnung (Dach, Bereich) und dem Titel des Werks. Das ist eine Lesart, kein Beleg:
   Ralf korrigiert sie hier, an einer Stelle. Die Daten selbst werden nicht verändert. Läuft im Browser und in Node.
   ===================================================================== */
export const FUNKTIONEN = {
  rathaus:     {name: 'Rathaus',        campus: 'Verwaltung',     garten: 'Hofbaum',       galaxie: 'Doppelring',   buero: 'Leitung'},
  saal:        {name: 'Gemeindesaal',   campus: 'Forum',          garten: 'Laube',         galaxie: 'Ring',         buero: 'Konferenz'},
  druckerei:   {name: 'Druckerei',      campus: 'Verlag',         garten: 'Rankgerüst',    galaxie: 'Streifen',     buero: 'Redaktion'},
  post:        {name: 'Postamt',        campus: 'Poststelle',     garten: 'Heckenweg',     galaxie: 'Mond',         buero: 'Poststelle'},
  aussicht:    {name: 'Aussichtsturm',  campus: 'Leitwarte',      garten: 'Hochstamm',     galaxie: 'Mond',         buero: 'Leitwarte'},
  schule:      {name: 'Schule',         campus: 'Lehrgebäude',    garten: 'Schulgarten',   galaxie: 'Erdartig',     buero: 'Schulbüro'},
  schularchiv: {name: 'Schularchiv',    campus: 'Archivbau',      garten: 'Obstreihe',     galaxie: 'Erdartig',     buero: 'Archiv'},
  spielhof:    {name: 'Spielhof',       campus: 'Spielhaus',      garten: 'Spielwiese',    galaxie: 'Bunt',         buero: 'Spielzimmer'},
  musik:       {name: 'Musikhaus',      campus: 'Konzerthalle',   garten: 'Klanggarten',   galaxie: 'Ring',         buero: 'Tonstudio'},
  museum:      {name: 'Museum',         campus: 'Sammlung',       garten: 'Herbarium',     galaxie: 'Gestein',      buero: 'Sammlung'},
  heilhaus:    {name: 'Heilhaus',       campus: 'Klinik',         garten: 'Kräutergarten', galaxie: 'Wasser',       buero: 'Praxis'},
  bibliothek:  {name: 'Bibliothek',     campus: 'Bibliothek',     garten: 'Baumhain',      galaxie: 'Gestein',      buero: 'Bibliothek'},
  klause:      {name: 'Klause',         campus: 'Denkzelle',      garten: 'Einzelbaum',    galaxie: 'Fels',         buero: 'Einzelzimmer'},
  kaffeehaus:  {name: 'Kaffeehaus',     campus: 'Café',           garten: 'Sitzplatz',     galaxie: 'Mond',         buero: 'Teeküche'},
  werkstatt:   {name: 'Werkstatt',      campus: 'Labor',          garten: 'Beetkasten',    galaxie: 'Rost',         buero: 'Technik'},
  sternwarte:  {name: 'Sternwarte',     campus: 'Observatorium',  garten: 'Sonnenuhr',     galaxie: 'Eis',          buero: 'Planung'},
  schreibstube:{name: 'Schreibstube',   campus: 'Schreibwerkstatt', garten: 'Rankbogen',   galaxie: 'Streifen',     buero: 'Schreibbüro'},
  kapelle:     {name: 'Kapelle',        campus: 'Raum der Stille', garten: 'Stillebeet',   galaxie: 'Eis',          buero: 'Stilleraum'},
  garage:      {name: 'Garage',         campus: 'Teststrecke',    garten: 'Laufbahn',      galaxie: 'Rost',         buero: 'Fuhrpark'},
  maerchen:    {name: 'Märchenhaus',    campus: 'Kinderhaus',     garten: 'Zaubergarten',  galaxie: 'Bunt',         buero: 'Kinderzimmer'},
  bastel:      {name: 'Bastelladen',    campus: 'Materiallager',  garten: 'Bauerngarten',  galaxie: 'Bunt',         buero: 'Materialraum'},
  turnhalle:   {name: 'Turnhalle',      campus: 'Sporthalle',     garten: 'Bewegungswiese', galaxie: 'Wasser',      buero: 'Bewegungsraum'},
  bildstock:   {name: 'Bildstock',      campus: 'Merktafel',      garten: 'Wegblume',      galaxie: 'Staub',        buero: 'Zettelkasten'},
  speicher:    {name: 'Speicher',       campus: 'Depot',          garten: 'Kompost',       galaxie: 'Staub',        buero: 'Depot'},
};
/* Titel vor Bereich vor Dach; das erste Passende gilt */
export const NACH_TITEL = [[/^Zentrale/, 'rathaus'], [/Integrationstisch|tisch monorepo/, 'saal'], [/^Mooncells$/, 'saal'], [/Ein Inhalt, viele/, 'druckerei'], [/Hermes-Gesamtwerk/, 'post'], [/KiN OS/, 'aussicht'],
  [/Varianten/, 'schularchiv'], [/Atlas der Gegenwart|SPiRALMiNDS/, 'sternwarte'], [/MOONFiNGERS/, 'sternwarte'], [/PARALLAX/, 'museum'], [/Neuro Atlas|TRAUMAATLAS/, 'heilhaus'], [/Spiel$/, 'spielhof'],
  [/^Stelle aus/, 'bildstock'], [/Pilates|ATEMWELTEN/, 'turnhalle'], [/ANWESENHEiT|BEWUSSTSEiNSFOKUSSiERUNG/, 'kapelle'], [/ZEiTBLiND/, 'aussicht'], [/FASKA Lernwege/, 'schule'], [/deutsch party/, 'spielhof'], [/Wildwerkstatt|Hermes3D/, 'werkstatt'], [/Durkheim|Radcliffe/, 'bibliothek'], [/Musik und Mehrstimmigkeit/, 'musik'], [/Genealogical|Spiralwellen/, 'sternwarte'], [/RAiNBOW|hoerni/, 'maerchen']];
export const NACH_BEREICH = {'Schuldokumentation': 'schule', 'FLOW · Lernspiele': 'spielhof', 'MUSiC · Klangwelten': 'musik', 'Atlas': 'museum', 'Neuroatlas': 'heilhaus', 'TRAUMAATLAS': 'heilhaus', 'Kapitel und Denkräume': 'klause', 'Gesprächskapitel': 'kaffeehaus', 'Apps': 'werkstatt', 'Atlas und Steuerung': 'sternwarte', 'Spiralen und Schreiben': 'schreibstube', 'EiN SEiN': 'kapelle', 'DEiN SEiN Astra': 'kapelle', 'Rennspiele': 'garage', 'RAiNBOW LiGHT und Hörni': 'maerchen', 'Märchen und Einhorn': 'maerchen', 'KlebensFroh': 'bastel', 'Text und Reim': 'schreibstube', 'ADHS OS': 'werkstatt'};
export function funktionVon(N, n){ const m = N.B.monde[n]; if(N.baum.material.has(n)) return 'speicher';
  for(const [re, f] of NACH_TITEL) if(re.test(m.titel)) return f;
  const bz = N.bezirk(n); if(typeof bz === 'number') for(const b of N.daecher[bz].bereiche) if(b.werke.includes(n) && NACH_BEREICH[b.name]) return NACH_BEREICH[b.name];
  return m.samen.length && /app/i.test(m.art || m.work_type || '') ? 'werkstatt' : 'schreibstube'; }

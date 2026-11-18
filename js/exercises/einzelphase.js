// rahmen für eine einzelne phase auf einer eigenen folie
//
// config:
//   phase: 'lexik', 'syntax', 'semantik', 'codegen' oder 'laufzeit' (pflicht)
//   schrittweise: optional, true: der knopf "schritt vormachen" steht immer da, sonst erst nach falschen zügen
//   alle übrigen angaben gehen an die phase:
//     lexik: code, werkzeuge, schluesselwoerter, literalwoerter, hinweisKategorien
//     syntax: programm (tokenliste { text, cat }), ablage, regelnHtml
//     semantik: baum (funktion mit den bausteinen aus compiler-weg-semantik-regeln), typen, fehler, symboltabelle, bereiche, regelnHtml
//     codegen: baum (wie bei semantik), quelltext, start, hindernisse, sichtbar
//     laufzeit: baum, start, hindernisse, sichtbar, fehlerIstZiel

import { render as renderLexik } from './compiler-weg-lexik.js';
import { render as renderSyntax } from './compiler-weg-syntax.js';
import { render as renderSemantik } from './compiler-weg-semantik.js';
import { render as renderCodegen } from './compiler-weg-codegen.js';
import { erzeugeMuster } from './compiler-weg-codegen-muster.js';
import { render as renderLaufzeitFaecher, ladeProgramm } from './compiler-weg-laufzeit-faecher.js';
import { MEM_FIRST } from './maschine.js';
import { hilfeFuerPhase, AUFGABE } from './phasen-hilfe.js';
import { meldeUebung, meldeGeloest, meldeHilfe, meldeBreite } from '../uebung.js';
import { SCHRITT_IMMER } from '../bau-info.js';

// phasen, die die volle folienbreite nutzen
const VOLLE_BREITE = new Set(['syntax', 'semantik']);

// nach wie vielen falschen zügen hintereinander "schritt vormachen" erscheint
// in der codegenerierung zählt nur ein vollständig gesetztes, aber falsches programm bei "überprüfen", dort reicht ein fehler
export const FEHLER_BIS_SCHRITT = { lexik: 3, syntax: 3, semantik: 3, codegen: 1 };

// musterlösung zum baum aus der lektion
function muster(config) {
  return erzeugeMuster(config.baum(), config.quelltext ?? '');
}

// je phase: baut die übung in host auf und gibt ihre cleanup-funktion zurück
// fertig() meldet, dass die übung gelöst ist (die lektion zählt erst dann als abgeschlossen)
const PHASEN = {
  lexik: (host, config, schrittBereit, fertig, zaehler) => renderLexik(host, {
    code: config.code,
    werkzeuge: config.werkzeuge,
    schluesselwoerter: config.schluesselwoerter,
    literalwoerter: config.literalwoerter,
    hinweisKategorien: config.hinweisKategorien,
    schrittBereit,
    ...zaehler,
    beiEnde: fertig,
  }),
  syntax: (host, config, schrittBereit, fertig, zaehler) => renderSyntax(host, {
    programm: config.programm,
    ablage: config.ablage,
    regelnHtml: config.regelnHtml,
    schrittBereit,
    ...zaehler,
    beiEnde: fertig,
  }),
  semantik: (host, config, schrittBereit, fertig, zaehler) => renderSemantik(host, {
    baum: config.baum,
    typen: config.typen,
    fehler: config.fehler,
    symboltabelle: config.symboltabelle,
    bereiche: config.bereiche,
    regelnHtml: config.regelnHtml,
    schrittBereit,
    ...zaehler,
    beiEnde: fertig,
  }),
  // relative adressen, eine datenzelle pro variable
  codegen: (host, config, schrittBereit, fertig, zaehler) => {
    const m = muster(config);
    return renderCodegen(host, {
      quelltext: config.quelltext,
      bausteine: m.bausteine,
      muster: m.muster,
      datenAdressen: { start: MEM_FIRST, anzahl: ladeProgramm(m.muster).variablen.length },
      start: config.start,
      hindernisse: config.hindernisse,
      sichtbar: config.sichtbar,
      schrittBereit,
      ...zaehler,
      beiEnde: fertig,
    });
  },
  laufzeit: (host, config, schrittBereit, fertig) => renderLaufzeitFaecher(host, {
    programm: muster(config).muster,
    start: config.start,
    hindernisse: config.hindernisse,
    sichtbar: config.sichtbar,
    fehlerIstZiel: config.fehlerIstZiel,
    beiEnde: fertig,
  }),
};

export function render(container, config) {
  const baue = PHASEN[config.phase];
  if (!baue) throw new Error(`einzelphase.js: unbekannte Phase „${config.phase}“`);

  let cleanup = null;
  let schrittFn = null;   // schritt der laufenden übung (config.schrittBereit der phase)
  let falsch = 0;         // falsche züge seit dem letzten richtigen zug oder "schritt vormachen"

  // gleiche klassen wie in 6.2, damit die phase genauso aussieht
  // "schritt vormachen" steht links von "zurücksetzen", das so immer ganz rechts bleibt, auch wenn der knopf erst später erscheint
  container.className = 'cw-app';
  container.innerHTML = `
    <div class="robot-ue-phases">
      <p class="cw-aufgabe">${AUFGABE[config.phase]}</p>
      <button class="lex-btn-reset cw-schritt-btn" type="button" hidden>Schritt vormachen</button>
      <button class="lex-btn-reset cw-reset-btn" type="button">Zurücksetzen</button>
    </div>
    <div class="cw-host"></div>
  `;
  const host = container.querySelector('.cw-host');
  const resetEl = container.querySelector('.cw-reset-btn');
  const hilfeEl = container.querySelector('.cw-schritt-btn');

  // "schritt vormachen" erscheint, wenn der spieler nicht weiterkommt: nach FEHLER_BIS_SCHRITT falschen zügen hintereinander (jeder richtige zug setzt den zähler zurück)
  // die laufzeit hat ihre eigene steuerung und keinen solchen knopf
  // mit config.schrittweise (und in der prüferversion, SCHRITT_IMMER) steht er immer da
  function zeigeSchritt() {
    if (config.phase === 'laufzeit') { hilfeEl.hidden = true; return; }
    const nachFehlern = falsch >= FEHLER_BIS_SCHRITT[config.phase];
    hilfeEl.hidden = !(config.schrittweise || SCHRITT_IMMER || nachFehlern);
  }
  // die phasen melden, wann etwas falsch oder richtig war (config.beiFalsch/beiRichtig)
  const zaehler = {
    beiFalsch: () => { falsch++; zeigeSchritt(); },
    beiRichtig: () => { falsch = 0; zeigeSchritt(); },
  };

  function aufbauen() {
    if (cleanup) { cleanup(); cleanup = null; }
    schrittFn = null;
    falsch = 0;
    host.textContent = '';
    cleanup = baue(host, config, (fn) => { schrittFn = fn; }, () => meldeGeloest(container), zaehler);
    zeigeSchritt();
  }

  resetEl.onclick = aufbauen;
  hilfeEl.onclick = () => {
    if (schrittFn) schrittFn();
    falsch = 0;
    zeigeSchritt();
  };

  meldeUebung(container);
  // die hilfe erklärt "schritt vormachen" auch hier (die zeile gibt es nur für die phasen mit dem knopf) und sagt, wann er erscheint
  meldeHilfe(container, hilfeFuerPhase(config.phase, { ...config, schrittweise: true, nachFehler: !config.schrittweise && !SCHRITT_IMMER }));
  // die bäume (syntax, semantik) wachsen mit dem fenster, lexik, codegen und laufzeit passen sich ihrem inhalt an
  if (VOLLE_BREITE.has(config.phase)) meldeBreite(container);
  aufbauen();

  return () => { if (cleanup) cleanup(); };
}

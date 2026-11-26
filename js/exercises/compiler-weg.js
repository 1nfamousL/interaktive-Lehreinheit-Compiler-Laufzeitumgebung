/* 
übung "der gesamte weg" (lektion 6.2)

config:
  beispiel: optional, beispiel-quellcode (platzhalter im eingabefeld, per knopf einfügbar)
  maxZeichen: optional, standard 200, der scanner liest zeichen für zeichen, deshalb ist der quellcode begrenzt
  schluesselwoerter, literalwoerter, werkzeuge, hinweisKategorien: für die lexikalische analyse
  ablage, regelnHtml: für die syntaxanalyse
  regelnSemantik, typen, fehler: für die semantische analyse, typen und fehler sind die knöpfe (standard alle)
  start: optional, startfeld des roboters { c, r } (standard 3/3)
  hindernisse: optional, felder { c, r }, auf die der roboter nicht fahren darf
*/


import { render as renderLexik } from './compiler-weg-lexik.js';
import { render as renderSyntax } from './compiler-weg-syntax.js';
import { render as renderSemantik } from './compiler-weg-semantik.js';
import { render as renderCodegen } from './compiler-weg-codegen.js';
import { erzeugeMuster } from './compiler-weg-codegen-muster.js';
import { render as renderLaufzeitFaecher, ladeProgramm, baueSpielfeld } from './compiler-weg-laufzeit-faecher.js';
import { MEM_FIRST } from './maschine.js';
import { baueAst } from './compiler-weg-ast.js';
import { meldeHilfe, meldeBreite } from '../uebung.js';
import { hilfeFuerPhase, hilfeQuelltext } from './phasen-hilfe.js';
import { FEHLER_BIS_SCHRITT } from './einzelphase.js';
import { SCHRITT_IMMER } from '../bau-info.js';

// namen der phasen für die hilfe, nach der nummer der phase (1 ist der quellcode)
const PHASEN_HILFE = [null, null, 'lexik', 'syntax', 'semantik', 'codegen', 'laufzeit'];

// startfeld des roboters (3/3 im 6×6-raster), wenn config.start fehlt
const START_FELD = { c: 3, r: 3 };

const GLIEDERUNG = { '(': 'open', ')': 'close', ';': 'semi', '{': 'lbrace', '}': 'rbrace' };

// tokenliste der lexikalischen analyse in das format der syntaxanalyse
function tokensFuerParser(tokens) {
  return tokens.map((t) => {
    let cat;
    if (t.type === 'keyword') cat = 'kw';
    else if (t.type === 'identifier') cat = 'id';
    else if (t.type === 'literal') cat = 'lit';
    else if (t.type === 'operator') cat = 'op';
    else cat = GLIEDERUNG[t.text] || 'dot';
    return { text: t.text, cat };
  });
}

// eingabe bereinigen: einheitliche zeilenumbrüche, tabulatoren zu leerzeichen, leerraum am anfang und ende weg
function bereinige(text) {
  return text.replace(/\r\n?/g, '\n').replace(/\t/g, ' ').trim();
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function render(container, config) {
  const maxZeichen = config.maxZeichen ?? 200;
  let quelltext = '';     // eingabe des spielers, bleibt beim zurückgehen erhalten
  let tokens = null;      // ergebnis der lexikalischen analyse
  let programm = null;    // dieselben tokens im format der syntaxanalyse
  let maschinencode = null; // ergebnis der codegenerierung: zeilen { id, p } oder null
  let cleanup = null;

  container.className = 'cw-app';
  container.innerHTML = `
    <div class="robot-ue-phases">
      <button type="button" class="robot-ue-phase" data-phase="1">Quellcode</button>
      <span class="robot-ue-phase-sep" aria-hidden="true">→</span>
      <button type="button" class="robot-ue-phase" data-phase="2">Lexikalische Analyse</button>
      <span class="robot-ue-phase-sep" aria-hidden="true">→</span>
      <button type="button" class="robot-ue-phase" data-phase="3">Syntaxanalyse</button>
      <span class="robot-ue-phase-sep" aria-hidden="true">→</span>
      <button type="button" class="robot-ue-phase" data-phase="4">Semantische Analyse</button>
      <span class="robot-ue-phase-sep" aria-hidden="true">→</span>
      <button type="button" class="robot-ue-phase" data-phase="5">Codegenerierung</button>
      <span class="robot-ue-phase-sep" aria-hidden="true">→</span>
      <button type="button" class="robot-ue-phase" data-phase="6">Laufzeitumgebung</button>
      <button class="btn btn--s cw-loesen-btn" type="button" hidden>Phase lösen</button>
      <button class="btn btn--s cw-schritt-btn" type="button" hidden>Schritt vormachen</button>
      <button class="btn btn--s cw-reset-btn" type="button" hidden>Zurücksetzen</button>
    </div>
    <div class="cw-wechsel" hidden></div>
    <div class="cw-host"></div>
    <div class="cw-leiste-anker">
      <div class="cw-leiste" hidden>
        <div class="cw-leiste-text"></div>
        <div class="cw-leiste-knoepfe"></div>
      </div>
    </div>
  `;
  const phaseEls = [...container.querySelectorAll('.robot-ue-phase')];
  const host = container.querySelector('.cw-host');
  const leisteEl = container.querySelector('.cw-leiste');
  const leisteText = container.querySelector('.cw-leiste-text');
  const leisteKnoepfe = container.querySelector('.cw-leiste-knoepfe');
  const hilfeEl = container.querySelector('.cw-schritt-btn');
  const loesenEl = container.querySelector('.cw-loesen-btn');
  const resetEl = container.querySelector('.cw-reset-btn');
  let angefasst = false;  // hat der spieler in der aktuellen phase schon etwas getan?
  let schrittFn = null;   // schritt der laufenden übung (config.schrittBereit der phase)
  let phaseEnde = null;   // 'ok' oder 'fehler', sobald die übung der phase zu ende ist
  let falsch = 0;         // falsche züge seit dem letzten richtigen zug oder "schritt vormachen"
  let weitester = 1;      // weiteste erreichte phase, bis dahin sind die phasen anklickbar
  let aktuell = 1;        // phase, die gerade angezeigt wird
  const wechselEl = container.querySelector('.cw-wechsel');

  // ---- Rückfrage vor einem Phasenwechsel ----
  // ein kleines fenster direkt unter der angeklickten phase, es liegt über der übung, damit sich beim auf- und zuklappen nichts verschiebt
  // schließen ohne wechsel geht mit "hier bleiben", esc oder einem klick daneben
  function aufTaste(e) { if (e.key === 'Escape') verbergeWechsel(); }
  function aufKlick(e) {
    if (!wechselEl.contains(e.target) && !e.target.closest('.robot-ue-phase')) verbergeWechsel();
  }
  function verbergeWechsel() {
    wechselEl.hidden = true;
    wechselEl.textContent = '';
    window.removeEventListener('keydown', aufTaste);
    window.removeEventListener('pointerdown', aufKlick);
  }
  function frageWechsel(chip, text, jaText, ja) {
    verbergeWechsel();
    wechselEl.hidden = false;
    const t = document.createElement('div');
    t.className = 'cw-wechsel-text';
    t.textContent = text;
    const k = document.createElement('div');
    k.className = 'cw-wechsel-knoepfe';
    const nein = document.createElement('button');
    nein.type = 'button';
    nein.className = 'btn btn--l';
    nein.textContent = 'Hier bleiben';
    nein.onclick = verbergeWechsel;
    const jaB = document.createElement('button');
    jaB.type = 'button';
    jaB.className = 'btn btn--l btn--accent';
    jaB.textContent = jaText;
    jaB.onclick = () => { verbergeWechsel(); ja(); };
    k.append(nein, jaB);
    wechselEl.append(t, k);

    // unter die phase legen, am rechten rand nach links ausweichen
    const box = container.getBoundingClientRect();
    const c = chip.getBoundingClientRect();
    const links = Math.max(0, Math.min(c.left - box.left, box.width - wechselEl.offsetWidth));
    wechselEl.style.left = links + 'px';
    wechselEl.style.top = (c.bottom - box.top + 8) + 'px';
    window.addEventListener('keydown', aufTaste);
    window.addEventListener('pointerdown', aufKlick);
    // fokus auf die harmlose wahl, damit enter nicht versehentlich wechselt
    nein.focus({ preventScroll: true });
  }

  // klick auf eine phase in der kopfzeile
  function wechsleZu(p) {
    const chip = phaseEls[p - 1];
    if (p === aktuell || p > weitester) return;
    if (aktuell === 1) {
      // geänderter quellcode: neu beginnen, wie mit dem knopf "zur lexikalischen analyse"
      const eingabe = host.querySelector('.cw-eingabe');
      const text = eingabe ? bereinige(eingabe.value) : quelltext;
      if (text !== quelltext) {
        frageWechsel(chip,
          'Du hast den Quellcode geändert. Dann beginnt die Übung bei der lexikalischen Analyse von vorn.',
          'Mit neuem Quellcode starten',
          () => host.querySelector('.cw-weiter').click(),
        );
        return;
      }
    } else if (aktuell >= 2 && aktuell <= 5 && phaseEnde === null && angefasst) {
      frageWechsel(chip, 'Wenn du jetzt wechselst, geht dein Fortschritt in dieser Phase verloren.', 'Trotzdem wechseln', () => setPhase(p));
      return;
    }
    setPhase(p);
  }
  phaseEls.forEach((el) => { el.onclick = () => wechsleZu(+el.dataset.phase); });

  // ---- Zurücksetzen: zurück an den Anfang der laufenden Phase ----
  // die phase wird neu aufgebaut, in phase 6 ist das programm danach wieder entladen, die ergebnisse der phasen davor bleiben
  // rückfrage nur in den phasen 2 bis 5, wenn dort schon etwas getan, aber die phase noch nicht abgeschlossen ist, einen lauf in phase 6 kann man jederzeit wiederholen
  // ob etwas getan wurde, merkt sich angefasst: jeder klick und jede taste in der übung
  host.addEventListener('pointerdown', () => { angefasst = true; }, true);
  host.addEventListener('keydown', () => { angefasst = true; }, true);
  resetEl.onclick = () => {
    if (aktuell >= 2 && aktuell <= 5 && phaseEnde === null && angefasst) {
      frageWechsel(resetEl, 'Wenn du zurücksetzt, geht dein Fortschritt in dieser Phase verloren.', 'Trotzdem zurücksetzen', () => setPhase(aktuell));
      return;
    }
    setPhase(aktuell);
  };

  // ---- Leiste unter der Phase: Ergebnis der Phase und wie es weitergeht ----
  // knoepfe: [{ text, primaer, onClick }]
  // die leiste ist neutral (ohne farbe und symbol): sie sagt, wie es mit dem programm weitergeht, farbe und symbol gehören den meldungen der phase selbst
  function zeigeLeiste(text, knoepfe) {
    leisteEl.hidden = false;
    leisteEl.className = 'cw-leiste cw-leiste--neutral';
    leisteText.textContent = text;
    leisteKnoepfe.textContent = '';
    knoepfe.forEach((k) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = k.primaer ? 'btn btn--l btn--accent' : 'btn btn--l';
      b.textContent = k.text;
      b.onclick = k.onClick;
      leisteKnoepfe.appendChild(b);
    });
  }
  function versteckeLeiste() {
    leisteEl.hidden = true;
  }

  function setPhase(p) {
    if (cleanup) { cleanup(); cleanup = null; }
    aktuell = p;
    if (p > weitester) weitester = p;
    // nur die bäume (syntax 3, semantik 4) wachsen mit dem fenster, die anderen phasen passen sich ihrem inhalt an
    meldeBreite(container, p === 3 || p === 4);
    // die hilfe wechselt mit der phase: quellcode hat eine eigene, die übrigen sind dieselben texte wie in den kapiteln 2 bis 5
    // hier gibt es die ganze sprache, also auch blöcke, und register und flag sind sichtbar
    meldeHilfe(container, p === 1
      ? hilfeQuelltext({ maxZeichen, beispiel: config.beispiel })
      : hilfeFuerPhase(PHASEN_HILFE[p], { bereiche: true, schrittweise: true, nachFehler: !SCHRITT_IMMER, phaseLoesen: true }));
    verbergeWechsel();
    phaseEls.forEach((el) => {
      const n = +el.dataset.phase;
      el.classList.toggle('active', n === p);
      el.disabled = n > weitester;
      if (n === p) el.setAttribute('aria-current', 'step');
      else el.removeAttribute('aria-current');
    });
    schrittFn = null;
    phaseEnde = null;
    angefasst = false;
    falsch = 0;
    resetEl.hidden = p < 2;
    loesenEl.hidden = !(p >= 2 && p <= 5);
    zeigeSchritt();
    versteckeLeiste();
    host.textContent = '';
    if (p === 1) phaseQuelltext();
    else if (p === 2) phaseLexik();
    else if (p === 3) phaseSyntax();
    else if (p === 4) phaseSemantik();
    else if (p === 5) phaseCodegen();
    else phaseLaufzeit();
  }

  // ---- Phase 1: Quellcode eingeben ----
  function phaseQuelltext() {
    host.innerHTML = `
      <div class="lex-stage">
        <div class="lex-main">
          <div class="lex-codebox">
            <textarea class="cw-eingabe" rows="9" maxlength="${maxZeichen}" spellcheck="false" autocapitalize="off" autocomplete="off"
              aria-label="Quellcode" placeholder="${esc(config.beispiel ?? '')}"></textarea>
            <div class="lex-result" hidden>
              <button class="btn-close msg-x" type="button" aria-label="Meldung schließen">×</button>
              <div class="lex-msg-text"></div>
            </div>
          </div>
        </div>
        <div class="cw-quelle-feld"></div>
        <div class="cw-quelle-knoepfe">
          ${config.beispiel ? '<button class="btn btn--l cw-beispiel" type="button">Beispiel einfügen</button>' : ''}
          <button class="btn btn--l btn--accent cw-weiter" type="button">Zur lexikalischen Analyse</button>
        </div>
      </div>
    `;
    // abbildung des spielfelds neben der eingabe: startfeld und hindernisse, damit man das programm darum herum planen kann
    // dasselbe spielfeld wie in phase 6
    host.querySelector('.cw-quelle-feld').appendChild(
      baueSpielfeld(config.hindernisse, config.start ?? START_FELD).gridWrap);
    const eingabe = host.querySelector('.cw-eingabe');
    const resultEl = host.querySelector('.lex-result');
    eingabe.value = quelltext;
    const beispiel = host.querySelector('.cw-beispiel');
    if (beispiel) beispiel.onclick = () => { eingabe.value = config.beispiel; resultEl.hidden = true; eingabe.focus(); };
    eingabe.addEventListener('input', () => { resultEl.hidden = true; });
    // die meldung liegt oben rechts im eingabefeld und lässt sich mit dem x schließen
    host.querySelector('.msg-x').onclick = () => { resultEl.hidden = true; eingabe.focus(); };
    host.querySelector('.cw-weiter').onclick = () => {
      const text = bereinige(eingabe.value);
      if (!text) {
        resultEl.hidden = false;
        resultEl.className = 'lex-result lex-err';
        resultEl.querySelector('.lex-msg-text').textContent = 'Gib zuerst Quellcode ein.';
        return;
      }
      quelltext = text;
      tokens = null;
      // neuer quellcode: alle ergebnisse dahinter gelten nicht mehr
      weitester = 1;
      setPhase(2);
    };
  }

  // ---- Hilfe: Schritt vormachen ----
  // ruft die schrittfunktion der laufenden übung auf (config.schrittBereit), die dort nach denselben regeln zieht wie ein spieler
  // meldet die übung am ende einen fehler im quellcode, sieht man die meldung der übung
  const schrittBereit = (fn) => { schrittFn = fn; };
  // "schritt vormachen" erscheint in den phasen 2 bis 5 erst, wenn der spieler nicht weiterkommt: nach FEHLER_BIS_SCHRITT falschen zügen hintereinander (jeder richtige zug setzt den zähler zurück)
  // in der prüferversion (SCHRITT_IMMER) von anfang an
  function zeigeSchritt() {
    const art = PHASEN_HILFE[aktuell];
    hilfeEl.hidden = !(aktuell >= 2 && aktuell <= 5 && !phaseEnde && (SCHRITT_IMMER || falsch >= FEHLER_BIS_SCHRITT[art]));
  }
  // die phasen melden, wann etwas falsch oder richtig war (config.beiFalsch/beiRichtig)
  const zaehler = {
    beiFalsch: () => { falsch++; zeigeSchritt(); },
    beiRichtig: () => { falsch = 0; zeigeSchritt(); },
  };
  // zurücksetzen der übung: ergebnis der phase und leiste gelten nicht mehr
  function neustart() {
    phaseEnde = null;
    falsch = 0;
    zeigeSchritt();
    versteckeLeiste();
  }
  function einSchritt() {
    if (schrittFn && !phaseEnde) { angefasst = true; schrittFn(); }
    falsch = 0;
    zeigeSchritt();
  }
  hilfeEl.onclick = einSchritt;
  // "phase lösen": wiederholt den schritt, bis die phase zu ende ist (beiEnde setzt phaseEnde)
  // die grenze ist nur eine notbremse gegen eine phase, die nie endet
  function loesePhase() {
    angefasst = true;
    for (let n = 0; schrittFn && !phaseEnde && n < 1000; n++) schrittFn();
    zeigeSchritt();
  }
  loesenEl.onclick = loesePhase;

  // ---- Phase 2: Lexikalische Analyse ----
  function phaseLexik() {
    cleanup = renderLexik(host, {
      code: quelltext,
      werkzeuge: config.werkzeuge,
      schluesselwoerter: config.schluesselwoerter,
      literalwoerter: config.literalwoerter,
      hinweisKategorien: config.hinweisKategorien,
      schrittBereit,
      beiNeustart: neustart,
      ...zaehler,
      beiEnde: (ergebnis) => {
        tokens = ergebnis.tokens;
        const fehler = tokens.filter((t) => t.type === 'error');
        const zurueck = { text: 'Quellcode ändern', primaer: true, onClick: () => setPhase(1) };
        if (fehler.length) {
          phaseEnde = 'fehler';
          zeigeLeiste('Der Quellcode enthält einen lexikalischen Fehler („' + fehler[0].text + '“). Dieses Zeichen kennt die Sprache nicht, deshalb geht er nicht an die Syntaxanalyse. Ändere den Quellcode.', [zurueck]);
        } else {
          phaseEnde = 'ok';
          zeigeLeiste('Der Quellcode ist lexikalisch einwandfrei. Der Scanner hat ' + tokens.length + ' Tokens gefunden und schickt sie nun einzeln an die Syntaxanalyse.',
            [{ text: 'Weiter zur Syntaxanalyse →', primaer: true, onClick: () => setPhase(3) }]);
        }
      },
    });
  }

  // ---- Phase 3: Syntaxanalyse ----
  function phaseSyntax() {
    programm = tokensFuerParser(tokens);
    cleanup = renderSyntax(host, {
      programm,
      ablage: config.ablage,
      regelnHtml: config.regelnHtml,
      schrittBereit,
      beiNeustart: neustart,
      ...zaehler,
      beiEnde: (ergebnis) => {
        const aendern = { text: 'Quellcode ändern', primaer: true, onClick: () => setPhase(1) };
        phaseEnde = ergebnis === 'finished' ? 'ok' : 'fehler';
        if (ergebnis === 'finished') {
          zeigeLeiste('Der Quellcode ist syntaktisch korrekt. Der Parser reicht den Syntaxbaum nun an die semantische Analyse weiter.',
            [{ text: 'Weiter zur semantischen Analyse →', primaer: true, onClick: () => setPhase(4) }]);
        } else {
          zeigeLeiste('Der Quellcode enthält einen Syntaxfehler. Er geht nicht weiter an den Compiler. Ändere den Quellcode.', [aendern]);
        }
      },
    });
  }

  // ---- Phase 4: Semantische Analyse ----
  function phaseSemantik() {
    cleanup = renderSemantik(host, {
      baum: () => baueAst(programm),
      typen: config.typen ?? ['number', 'boolean'],
      fehler: config.fehler ?? ['range', 'undeclared', 'duplicate', 'type'],
      symboltabelle: true,
      bereiche: true,
      regelnHtml: config.regelnSemantik,
      schrittBereit,
      beiNeustart: neustart,
      ...zaehler,
      beiEnde: (ergebnis) => {
        const aendern = { text: 'Quellcode ändern', primaer: true, onClick: () => setPhase(1) };
        phaseEnde = ergebnis === 'ok' ? 'ok' : 'fehler';
        if (ergebnis === 'ok') {
          zeigeLeiste('Der Quellcode ist semantisch korrekt. Der Compiler reicht den Syntaxbaum nun an die Codegenerierung weiter.',
            [{ text: 'Weiter zur Codegenerierung →', primaer: true, onClick: () => setPhase(5) }]);
        } else {
          zeigeLeiste('Der Quellcode enthält einen semantischen Fehler. Er geht nicht weiter an den Compiler. Ändere den Quellcode.', [aendern]);
        }
      },
    });
  }

  // ---- Phase 5: Codegenerierung ----
  function phaseCodegen() {
    const ergebnis = erzeugeMuster(baueAst(programm), quelltext);
    // die codegenerierung kennt noch keine echten adressen, wie ein echter compiler: sprungziele sind zeilen (Z1, Z2 …), variablen zellen relativ zum anfang des datenspeichers (D1, D2 …), eine pro variable, erst der lader in der laufzeit rechnet beides in adressen um
    cleanup = renderCodegen(host, {
      quelltext,
      bausteine: ergebnis.bausteine,
      muster: ergebnis.muster,
      datenAdressen: { start: MEM_FIRST, anzahl: ladeProgramm(ergebnis.muster).variablen.length },
      start: config.start ?? START_FELD,
      hindernisse: config.hindernisse,
      schrittBereit,
      beiNeustart: neustart,
      ...zaehler,
      beiEnde: (ergebnis, zeilen) => {
        phaseEnde = 'ok';
        maschinencode = zeilen.map((z) => ({ id: z.id, p: z.p }));
        zeigeLeiste('Der Quellcode ist richtig in Maschinencode übersetzt. Die Laufzeitumgebung führt ihn nun Befehl für Befehl aus.',
          [{ text: 'Weiter zur Laufzeitumgebung →', primaer: true, onClick: () => setPhase(6) }]);
      },
    });
  }

  // ---- Phase 6: Laufzeitsystem ----
  function phaseLaufzeit() {
    cleanup = renderLaufzeitFaecher(host, {
      programm: maschinencode,
      start: config.start ?? START_FELD,
      hindernisse: config.hindernisse,
    });
  }

  setPhase(1);

  return () => { verbergeWechsel(); if (cleanup) cleanup(); };
}

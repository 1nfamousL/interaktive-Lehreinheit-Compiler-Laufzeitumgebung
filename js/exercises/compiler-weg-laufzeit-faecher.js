// laufzeitphase
//
// config:
//   programm: befehle { id, p } wie in maschine.js (ergebnis der codegenerierung)
//   start: { c, r } startfeld des roboters
//   hindernisse: optional, felder { c, r } in der farbe der mauer, fährt der roboter darauf, hält das programm an
//   sichtbar: optional { register, flag }, false blendet register (mit dem rechenwerk) bzw. flag in der cpu aus
//   beiEnde: optional, wird aufgerufen, sobald das programm fehlerfrei bis „end“ gelaufen ist
//   fehlerIstZiel: optional, true: der laufzeitfehler ist das ziel der übung (endlosschleife), beiEnde wird dann beim fehler aufgerufen
//
// geladen wird in einzelne fächer: ein befehl liegt in einem fach, jede zahl, jedes register und jede adresse dahinter in einem eigenen
//   mov 1 → (D1)   wird zu   fach 00 mov | fach 01 1 | fach 02 [06]   (adressen zählen ab 0)
// vor dem laden gibt es nur relative lagen: (Z1), (Z2) … für programmzeilen, (D1), (D2) … für datenzellen, der lader rechnet sie in echte adressen um (eckige klammern)
// der datenspeicher beginnt direkt hinter dem letzten programmfach: (Dk) wird zur adresse datenanfang + k - 1
// sprünge zeigen nicht mehr auf eine zeile (Zk), sondern auf das fach ihres zielbefehls
// programm und daten zusammen dürfen höchstens SPEICHER_GESAMT fächer belegen, sonst startet das programm nicht (ladeProgramm().fehler)
//
// die cpu arbeitet pro befehl in drei phasen:
//   holen: das befehlsfach lesen, im befehlsregister steht nur der befehl
//   dekodieren: der befehl legt fest, was folgt (leere platzhalter neben dem befehl), danach liest die cpu die fächer dahinter einzeln, die werte füllen die platzhalter
//   ausführen: der befehl tut, was er soll
// der befehlszähler zählt bei jedem gelesenen fach um eins weiter, nur ein sprung setzt ihn neu, das flag ändert nur ein vergleich
//
// das programm wird erst komplett durchgerechnet (trace() liefert eine liste von zuständen), danach nur noch abgespielt
// laufzeitfehler: befehlszähler läuft aus dem programm, leeres datenfach, division durch 0, unter- oder überlauf, roboter fährt gegen ein hindernis (auch die wand), endlosschleife
// endlosschleife: befehlszähler, register, flag, datenspeicher und roboter zum dritten mal im selben zustand (ohne eingabe kann dann nichts neues passieren)
// als notbremse zählt es außerdem die befehle (schrittlimit 2000)
//
// das automatische abspielen läuft über eine setTimeout-kette, die zurückgegebene funktion hält sie an

import { REGS, WERT_MAX, DEFS, MEM_FIRST, SPEICHER_GESAMT, pad2, robotAnzahl, ROBOTER_SVG, istHindernis } from './maschine.js';
import { rem } from '../einheiten.js';

const GRID = { cols: 6, rows: 6, pitch: 60, cell: 52 };
const MAX_BEFEHLE = 2000;
// beim dritten auftreten desselben gesamtzustands hält das laufzeitsystem an (endlosschleife)
const WIEDERHOLUNGEN = 3;
const SPEEDS = [
  { label: 'langsam', ms: 1300 },
  { label: 'mittel', ms: 750 },
  { label: 'schnell', ms: 300 },
];
const PHASES = [
  { id: 'holen', label: 'holen' },
  { id: 'dekodieren', label: 'dekodieren' },
  { id: 'ausfuehren', label: 'ausführen' },
];
const LABEL = { zahl: 'Zahl', register: 'Register', adresse: 'Adresse', ziel: 'Ziel' };

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

// baut das spielfeld (6×6-raster, hindernisse, roboter) und liefert die elemente
// das laufzeitsystem setzt den roboter und färbt besuchte felder, mit start steht der roboter gleich auf seinem startfeld (für die abbildung neben dem quellcode)
export function baueSpielfeld(hindernisse = [], start = null) {
  // mit mauer und schmalem innenabstand (.robot-rt-grid-wrap-kompakt)
  const gridWrap = el('div', 'robot-rt-grid-wrap robot-rt-grid-wrap-kompakt');
  const grid = el('div', 'robot-rt-grid robot-ue-grid');
  grid.style.width = rem(GRID.cols * GRID.pitch - (GRID.pitch - GRID.cell));
  grid.style.height = rem(GRID.rows * GRID.pitch - (GRID.pitch - GRID.cell));
  const cells = [];
  for (let r = 0; r < GRID.rows; r++) {
    cells.push([]);
    for (let c = 0; c < GRID.cols; c++) {
      const cell = el('div', 'robot-rt-cell');
      if (istHindernis(hindernisse, c, r)) cell.classList.add('robot-rt-hindernis');
      cell.style.left = rem(c * GRID.pitch);
      cell.style.top = rem(r * GRID.pitch);
      cell.style.width = cell.style.height = rem(GRID.cell);
      grid.appendChild(cell);
      cells[r].push(cell);
    }
  }
  const robotEl = el('div', 'robot-figure');
  robotEl.style.width = robotEl.style.height = rem(GRID.cell);
  robotEl.insertAdjacentHTML('beforeend', ROBOTER_SVG);
  if (start) robotEl.style.transform = 'translate(' + rem(start.c * GRID.pitch) + ',' + rem(start.r * GRID.pitch) + ')';
  grid.appendChild(robotEl);
  gridWrap.appendChild(grid);
  return { gridWrap, cells, robotEl };
}

// adressen stehen überall in eckigen klammern: neben dem programmspeicher, im datenspeicher, im befehlszähler und als adresse im befehl
const adr = (a) => '[' + pad2(a) + ']';

// ein fach als text: zahl, register, [adresse im datenspeicher] oder [adresse des zielbefehls]
function teilText(t) {
  if (t.art === 'zahl') return String(t.wert);
  if (t.art === 'register') return t.wert;
  return adr(t.wert);
}

// vor dem laden: befehl mit relativen lagen, (Dk) für datenzellen, (Zk) für sprungziele
const relZelle = (a) => '(D' + (a - MEM_FIRST + 1) + ')';
function relOperand(op) {
  if (op.t === 'wert') return String(op.v);
  if (op.t === 'register') return op.v;
  return relZelle(op.v);
}
function relText(inst) {
  const def = DEFS[inst.id], p = inst.p;
  if (def.form === 'kopiere') return def.label + ' ' + relOperand(p.src) + ' → ' + relOperand(p.dst);
  if (def.form === 'arith') return def.label + ' ' + p.reg + ', ' + relOperand(p.op2);
  if (def.form === 'cmp') return def.label + ' ' + relOperand(p.op1) + ', ' + relOperand(p.op2);
  if (def.form === 'jump' || def.form === 'jumpf') return def.label + ' (Z' + p.line + ')';
  if (def.form === 'robot') return def.label + ' ' + relOperand(robotAnzahl(p));
  return def.label;
}

// ---- Laden ----
// zerlegt das programm in fächer und rechnet adressen und sprungziele um
// ergebnis:
//   befehle: [{ zeile, inst, def, adr, teile: [{ art, wert }] }] in programmreihenfolge
//   faecher: [{ adr, art, text, kind, befehl }] für programmfach 0..laenge - 1 (art: 'befehl' | 'zahl' | 'register' | 'adresse' | 'ziel')
//   nachAdr: map adresse des befehlsfachs -> befehl
//   laenge: anzahl der programmfächer
//   datenStart: erste adresse des datenspeichers (gleich laenge, weil die adressen bei 0 beginnen)
//   variablen: [{ alt, neu }] benutzte datenzellen: alte adresse -> fach im datenspeicher
//   benoetigt: anzahl der fächer, die das programm im speicher belegt (laenge + datenzellen)
//   fehler: text, wenn das programm nicht geladen werden kann (programm und daten belegen mehr als SPEICHER_GESAMT fächer), sonst null
// der compiler kennt die größe des speichers nicht, erst der lader merkt, dass der platz nicht reicht
export function ladeProgramm(prog) {
  const befehle = [];
  prog.forEach((inst, zeile) => {
    if (!inst) return;
    const def = DEFS[inst.id], p = inst.p;
    let roh;
    if (def.form === 'kopiere') roh = [{ op: p.src }, { op: p.dst }];
    else if (def.form === 'arith') roh = [{ reg: p.reg }, { op: p.op2 }];
    else if (def.form === 'cmp') roh = [{ op: p.op1 }, { op: p.op2 }];
    else if (def.form === 'jump' || def.form === 'jumpf') roh = [{ ziel: p.line }];
    else if (def.form === 'robot') roh = [{ op: robotAnzahl(p) }];
    else roh = [];
    befehle.push({ zeile, inst, def, roh });
  });

  // startadresse jedes befehls: 1 fach für den befehl, je 1 fach pro parameter (der speicher beginnt bei adresse 0)
  let adr = 0;
  befehle.forEach((b) => { b.adr = adr; adr += 1 + b.roh.length; });
  const laenge = adr;
  const datenStart = laenge;

  // benutzte datenzellen: (Dk) bzw. alte adresse MEM_FIRST + k - 1 wird zu datenStart + k - 1
  const alt = new Set();
  befehle.forEach((b) => b.roh.forEach((r) => { if (r.op && r.op.t === 'speicher') alt.add(r.op.v); }));
  const variablen = [...alt].sort((a, b) => a - b).map((a) => ({ alt: a, neu: datenStart + a - MEM_FIRST }));
  const neuVon = new Map(variablen.map((v) => [v.alt, v.neu]));

  // zeile (ab 0) -> adresse des befehls dieser zeile, leere zeilen zeigen auf den nächsten befehl
  const zeilenAdr = [];
  let naechste = datenStart;
  for (let z = prog.length - 1; z >= 0; z--) {
    const b = befehle.find((x) => x.zeile === z);
    if (b) naechste = b.adr;
    zeilenAdr[z] = naechste;
  }

  befehle.forEach((b) => {
    b.teile = b.roh.map((r) => {
      if (r.reg !== undefined) return { art: 'register', wert: r.reg };
      if (r.ziel !== undefined) return { art: 'ziel', wert: zeilenAdr[r.ziel - 1] ?? datenStart };
      if (r.op.t === 'wert') return { art: 'zahl', wert: r.op.v };
      if (r.op.t === 'register') return { art: 'register', wert: r.op.v };
      return { art: 'adresse', wert: neuVon.get(r.op.v) };
    });
  });

  const faecher = [];
  const nachAdr = new Map();
  befehle.forEach((b, i) => {
    nachAdr.set(b.adr, b);
    faecher.push({ adr: b.adr, art: 'befehl', text: b.def.label, kind: b.def.kind, befehl: i });
    b.teile.forEach((t, k) => faecher.push({ adr: b.adr + 1 + k, art: t.art, text: teilText(t), kind: null, befehl: i }));
  });
  // programm und daten teilen sich einen speicher mit SPEICHER_GESAMT fächern
  const benoetigt = laenge + variablen.length;
  const fehler = benoetigt > SPEICHER_GESAMT
    ? 'Der Speicher hat nur ' + SPEICHER_GESAMT + ' Fächer, das Programm braucht ' + benoetigt
      + ' (' + laenge + ' für Befehle und Werte, ' + variablen.length + ' für Daten). Das Programm kann nicht geladen werden.'
    : null;
  return { befehle, faecher, nachAdr, laenge, datenStart, variablen, benoetigt, fehler };
}

// was ein befehl bedeutet, in worten (phase "dekodieren"), die werte stehen noch nicht fest
function decodeText(def) {
  if (def.form === 'kopiere') return 'Kopiert einen Wert von der Quelle zum Ziel. Beide stehen in den nächsten zwei Fächern.';
  if (def.form === 'arith') return 'Rechnet im Register und legt das Ergebnis dort ab. Das Register und der zweite Wert stehen in den nächsten zwei Fächern.';
  if (def.form === 'cmp') return 'Vergleicht zwei Werte und setzt das Flag. Beide stehen in den nächsten zwei Fächern, jeder ist eine Zahl oder ein Register.';
  if (def.form === 'jump') return 'Springt zu einem anderen Befehl. Das Ziel steht im nächsten Fach.';
  if (def.form === 'jumpf') return 'Springt nur, wenn das Flag 1 ist. Das Ziel steht im nächsten Fach.';
  if (def.form === 'robot') return 'Bewegt den Roboter. Die Anzahl der Felder steht im nächsten Fach.';
  return 'Beendet das Programm. Es folgt kein weiteres Fach.';
}

// führt das programm komplett aus und liefert alle zustände (einer pro phase, beim lesen der fächer hinter dem befehl einer pro fach)
// bricht bei einem laufzeitfehler mit einem fehlerzustand ab
function trace(l, start, hindernisse = []) {
  const states = [];
  let pc = 0;
  const regs = { A: 0, B: 0 };
  let flag = 0;
  const mem = {}; // adresse im datenspeicher -> wert, fehlende adresse = leer
  const robot = { ...start };
  const visited = [];
  let count = 0;
  const gesehen = new Map(); // gesamtzustand vor einem befehl -> wie oft schon aufgetreten

  const push = (s) => states.push({
    pc, regs: { ...regs }, flag, mem: { ...mem }, robot: { ...robot }, visited: visited.slice(),
    ir: null, phase: null, lesen: null, fach: null, alu: null, msg: '', changed: {}, read: null, jump: null, error: null, ende: false,
    ...s,
  });

  for (;;) {
    const b = l.nachAdr.get(pc);
    if (!b) {
      push({ phase: 'holen', fach: pc < l.laenge ? pc : null, error: pc >= l.laenge
        ? 'Der Befehlszähler steht auf Fach ' + pad2(pc) + ', dahinter ist der Programmspeicher zu Ende, ohne dass die CPU auf „end“ getroffen ist.'
        : 'In Fach ' + pad2(pc) + ' steht kein Befehl.' });
      return states;
    }
    // ohne eingabe läuft das programm deterministisch: ist der gesamtzustand vor einem befehl derselbe wie schon einmal, wiederholt sich alles bis in alle ewigkeit
    // beim dritten mal hält es an, der spieler hat die schleife dann zweimal ganz gesehen
    const zustand = [pc, regs.A, regs.B, flag, JSON.stringify(mem), robot.c, robot.r].join('|');
    const mal = (gesehen.get(zustand) || 0) + 1;
    gesehen.set(zustand, mal);
    if (mal >= WIEDERHOLUNGEN) {
      push({ phase: 'holen', fach: pc, error: 'Befehlszähler, Register, Flag, Datenspeicher und Roboter sind zum dritten Mal im selben Zustand. Das Programm hat keine Eingabe, die etwas ändern könnte, es endet also nie. Die Laufzeitumgebung hält an.' });
      return states;
    }
    if (++count > MAX_BEFEHLE) {
      push({ phase: 'holen', fach: pc, error: 'Nach ' + MAX_BEFEHLE + ' Befehlen hat die Laufzeitumgebung abgebrochen. Vermutlich eine Endlosschleife: Prüfe, ob die Sprungbedingung jemals erfüllt wird.' });
      return states;
    }
    const def = b.def;
    const ir = { name: def.label, form: def.form, teile: null };
    const irKopie = () => ({ name: ir.name, form: ir.form, teile: ir.teile && ir.teile.map((t) => ({ ...t })) });
    const von = pc;

    // 1. holen: das befehlsfach wird gelesen, der befehlszähler zählt weiter
    pc += 1;
    push({ phase: 'holen', ir: irKopie(), lesen: von, msg: 'Fach ' + pad2(von) + ' ist im Befehlsregister. Der Befehlszähler zählt auf ' + pad2(pc) + ' weiter.' });

    // 2. dekodieren: der befehl legt fest, was folgt
    ir.teile = b.teile.map((t) => ({ art: t.art, label: LABEL[t.art], wert: null, text: null }));
    push({ phase: 'dekodieren', ir: irKopie(), msg: decodeText(def) });

    // auch das lesen der fächer hinter dem befehl gehört zum dekodieren: ein fach nach dem anderen
    b.teile.forEach((t, k) => {
      const fach = pc;
      pc += 1;
      ir.teile[k].wert = t.wert;
      ir.teile[k].text = teilText(t);
      push({ phase: 'dekodieren', ir: irKopie(), lesen: fach, msg: 'Fach ' + pad2(fach) + ' gelesen: ' + teilText(t) + '. Der Befehlszähler zählt auf ' + pad2(pc) + ' weiter.' });
    });

    // 3. ausführen
    const ex = { phase: 'ausfuehren', ir: irKopie() };
    if (def.form === 'halt') {
      push({ ...ex, msg: 'Das Programm ist beendet. Der Befehlszähler bewegt sich nicht mehr.', ende: true });
      return states;
    }
    const p = b.teile;
    let read = null;
    const val = (t) => {
      if (t.art === 'zahl') return t.wert;
      if (t.art === 'register') return regs[t.wert];
      read = t.wert;
      return mem[t.wert] == null ? null : mem[t.wert];
    };
    const emptyAddr = (t) => 'Fach ' + pad2(t.wert) + ' im Datenspeicher ist leer. Der Befehl in Fach ' + pad2(von) + ' kann keinen Wert lesen.';
    const wohin = (t) => (t.art === 'register' ? 'Register ' + t.wert : 'Fach ' + pad2(t.wert) + ' im Datenspeicher');

    if (def.form === 'kopiere') {
      const v = val(p[0]);
      if (v === null) { push({ ...ex, read, fach: von, error: emptyAddr(p[0]) }); return states; }
      const changed = {};
      if (p[1].art === 'register') { regs[p[1].wert] = v; changed.reg = p[1].wert; }
      else { mem[p[1].wert] = v; changed.mem = p[1].wert; }
      push({ ...ex, read, changed, msg: 'Wert ' + v + ' nach ' + wohin(p[1]) + ' kopiert.' });
    } else if (def.form === 'arith') {
      const reg = p[0].wert, a = regs[reg], b2 = val(p[1]);
      if (b2 === null) { push({ ...ex, read, fach: von, error: emptyAddr(p[1]) }); return states; }
      if (def.id === 'div' && b2 === 0) {
        push({ ...ex, read, fach: von, alu: a + ' ' + def.label + ' 0 = ?', error: 'Division durch 0 im Befehl in Fach ' + pad2(von) + '. Das Ergebnis ist nicht definiert, die Laufzeitumgebung bricht ab.' });
        return states;
      }
      const r = def.id === 'add' ? a + b2 : def.id === 'sub' ? a - b2 : def.id === 'mul' ? a * b2 : Math.trunc(a / b2);
      if (r < 0 || r > WERT_MAX) {
        push({ ...ex, read, fach: von, alu: a + ' ' + def.label + ' ' + b2 + ' = ' + r, error: (r < 0 ? 'Unterlauf' : 'Überlauf') + ' im Befehl in Fach ' + pad2(von) + '. Das Ergebnis ' + r + ' liegt außerhalb von 0 bis ' + WERT_MAX + ', die Laufzeitumgebung bricht ab.' });
        return states;
      }
      regs[reg] = r;
      push({ ...ex, read, changed: { reg }, alu: a + ' ' + def.label + ' ' + b2 + ' = ' + r + '  → ' + reg, msg: 'Das Rechenwerk rechnet, das Ergebnis landet in Register ' + reg + '.' });
    } else if (def.form === 'cmp') {
      const a = val(p[0]), b2 = val(p[1]);
      if (b2 === null) { push({ ...ex, read, fach: von, error: emptyAddr(p[1]) }); return states; }
      const ok = def.op === '<' ? a < b2 : def.op === '>' ? a > b2 : def.op === '<=' ? a <= b2 : def.op === '>=' ? a >= b2 : def.op === '!=' ? a !== b2 : a === b2;
      flag = ok ? 1 : 0;
      push({ ...ex, read, changed: { flag: true }, alu: a + ' ' + def.op + ' ' + b2 + ' → ' + (ok ? 'wahr' : 'falsch') + ', Flag = ' + flag, msg: 'Der Vergleich ist ' + (ok ? 'wahr, das Flag wird gesetzt (1).' : 'falsch, das Flag wird gelöscht (0).') });
    } else if (def.form === 'jump' || def.form === 'jumpf') {
      const springt = def.form === 'jump' || flag === 1;
      if (springt) pc = p[0].wert;
      push({
        ...ex,
        jump: springt ? { from: von, to: pc } : null,
        msg: def.form === 'jump' ? 'Sprung: Der Befehlszähler wird auf Fach ' + pad2(pc) + ' gesetzt.'
          : springt ? 'Das Flag ist 1, also Sprung: Der Befehlszähler wird auf Fach ' + pad2(pc) + ' gesetzt.'
            : 'Das Flag ist 0, kein Sprung. Weiter mit Fach ' + pad2(pc) + '.',
      });
    } else if (def.form === 'robot') {
      const n = val(p[0]);
      if (n === null) { push({ ...ex, read, fach: von, error: emptyAddr(p[0]) }); return states; }
      if (n === 0) { push({ ...ex, read, msg: 'Die Anzahl ist 0, der Roboter bleibt stehen.' }); continue; }
      // pro feld ein zustand
      for (let i = 1; i <= n; i++) {
        const c = robot.c + def.dc, r = robot.r + def.dr;
        if (c < 0 || r < 0 || c >= GRID.cols || r >= GRID.rows) {
          push({ ...ex, read, fach: von, error: 'Der Roboter würde im Befehl in Fach ' + pad2(von) + ' gegen ein Hindernis fahren. Die Laufzeitumgebung hält das Programm an.', crash: true });
          return states;
        }
        if (istHindernis(hindernisse, c, r)) {
          push({ ...ex, read, fach: von, error: 'Der Roboter würde im Befehl in Fach ' + pad2(von) + ' gegen ein Hindernis fahren. Die Laufzeitumgebung hält das Programm an.', crash: true });
          return states;
        }
        robot.c = c; robot.r = r;
        visited.push({ c, r });
        push({ ...ex, read, msg: 'Der Roboter fährt ein Feld nach ' + def.wort + (n > 1 ? ' (' + i + ' von ' + n + ').' : '.') });
      }
    }
  }
}

export function render(host, config) {
  const container = document.createElement('div');
  host.appendChild(container);
  const prog = config.programm.slice();
  const START = config.start;
  const HINDERNISSE = config.hindernisse || [];
  const lade = ladeProgramm(prog);

  let geladen = false; // erst nach dem laden gibt es fächer
  let ladeFehler = false; // der lader hat das programm abgelehnt (speicher zu klein)
  let states = null;
  let idx = -1;
  let timer = null;
  let speed = SPEEDS[1].ms;

  container.className = 'robot-app';
  container.innerHTML = '<div class="robot-stage lz-stage"></div>';
  const stageEl = container.querySelector('.robot-stage');

  // ---- 1. Spalte: Maschinencode, nach dem Laden Programmspeicher ----
  const build = el('div', 'robot-build lz-prog');
  const titelEl = el('div', 'robot-ref-title', 'Maschinencode');
  build.appendChild(titelEl);
  const rowsEl = el('div', 'lz-rows-scroll');
  build.appendChild(rowsEl);
  stageEl.appendChild(build);
  let rowEls = []; // eine zeile pro fach (nach dem laden)

  // unsichtbare messzeile mit dem breitesten möglichen baustein (mov von datenzelle zu datenzelle)
  // sie gibt dem fenster seine breite, vor und nach dem laden gleich, und alle bausteine sind so breit wie sie
  // nr: längste zeilennummer bzw. adresse links, nach ihr richtet sich die spalte
  function messzeile(nr) {
    const n = Math.max(1, lade.variablen.length);
    const z = el('div', 'robot-mrow lz-row cg-messzeile');
    z.setAttribute('aria-hidden', 'true');
    z.appendChild(el('span', 'lz-pc', '▶'));
    z.appendChild(el('span', 'robot-lineno', nr));
    const b = el('div', 'robot-mblock-placed cg-block ' + DEFS.kopiere.kind);
    b.appendChild(el('span', 'cg-name', DEFS.kopiere.label + ' (D' + n + ') → (D' + n + ')'));
    z.appendChild(b);
    return z;
  }
  // die spalte der zeilennummern bzw. adressen ist so breit wie die längste davon (gemessen an der messzeile), nicht breiter
  // die bausteine stehen so bündig und rücken trotzdem dicht heran
  function setzeZeilenBreite() {
    const nr = rowsEl.querySelector('.cg-messzeile .robot-lineno');
    if (nr) rowsEl.style.setProperty('--zeilen-breite', Math.ceil(nr.getBoundingClientRect().width) + 'px');
  }

  // vor dem laden: der maschinencode wie aus der codegenerierung, eine zeile pro befehl
  function zeigeZeilen() {
    titelEl.textContent = 'Maschinencode';
    rowsEl.textContent = '';
    rowsEl.appendChild(messzeile('(Z' + prog.length + ')'));
    prog.forEach((inst, i) => {
      const row = el('div', 'robot-mrow lz-row');
      row.appendChild(el('span', 'lz-pc', '▶'));
      row.appendChild(el('span', 'robot-lineno', '(Z' + (i + 1) + ')'));
      if (inst) {
        const b = el('div', 'robot-mblock-placed cg-block ' + DEFS[inst.id].kind);
        b.appendChild(el('span', 'cg-name', relText(inst)));
        row.appendChild(b);
      }
      rowsEl.appendChild(row);
    });
    rowEls = [];
    setzeZeilenBreite();
  }

  // nach dem laden: ein fach pro zeile, die fächer erscheinen nacheinander
  // im speicher gibt es keine farben: befehle, zahlen, adressen und register sehen gleich aus (weiß auf dunkel), die adresse des fachs steht klein und grau im fach selbst
  // welche fächer zu einem befehl gehören, zeigt erst die cpu beim dekodieren (die gelesenen fächer leuchten)
  function zeigeFaecher() {
    titelEl.textContent = 'Programmspeicher';
    rowsEl.textContent = '';
    rowsEl.appendChild(messzeile(adr(lade.laenge)));
    rowEls = lade.faecher.map((f, i) => {
      const row = el('div', 'robot-mrow lz-row lz-fach-neu');
      row.style.animationDelay = (i * 40) + 'ms';
      row.appendChild(el('span', 'lz-pc', '▶'));
      const b = el('div', 'robot-mblock-placed lz-fach');
      b.appendChild(el('span', 'lz-adr-im-fach', adr(f.adr)));
      b.appendChild(el('span', 'lz-fach-text', f.text));
      row.appendChild(b);
      row.appendChild(el('span', 'lz-jump-label'));
      rowsEl.appendChild(row);
      return row;
    });
    setzeZeilenBreite();
  }

  // hält die aktuelle zeile im sichtbaren bereich, bewusst ohne scrollIntoView, das würde auch die ganze seite mitscrollen
  function scrollToRow(i) {
    const row = rowEls[i];
    if (!row || rowsEl.scrollHeight <= rowsEl.clientHeight) return;
    const top = row.offsetTop;
    if (top < rowsEl.scrollTop) rowsEl.scrollTop = top;
    else if (top + row.offsetHeight > rowsEl.scrollTop + rowsEl.clientHeight) rowsEl.scrollTop = top + row.offsetHeight - rowsEl.clientHeight;
  }

  // ---- 2. Spalte: CPU mit Register und Flag ----
  const mid = el('div', 'lz-mid');
  const cpu = el('div', 'robot-card lz-cpu');
  cpu.appendChild(el('h2', '', 'CPU'));
  const cpuGrid = el('div', 'lz-cpu-grid');
  cpuGrid.appendChild(el('span', 'lz-cpu-key', 'Befehlszähler'));
  const pcEl = el('span', 'lz-cpu-val lz-adr-box');
  cpuGrid.appendChild(pcEl);
  cpuGrid.appendChild(el('span', 'lz-cpu-key', 'Befehlsregister'));
  const irEl = el('span', 'lz-cpu-val');
  cpuGrid.appendChild(irEl);
  cpu.appendChild(cpuGrid);
  const phaseRow = el('div', 'lz-phases');
  const phaseEls = PHASES.map((ph, i) => {
    if (i) phaseRow.appendChild(el('span', 'robot-ue-phase-sep', '→'));
    const p = el('span', 'robot-ue-phase', ph.label);
    phaseRow.appendChild(p);
    return p;
  });
  cpu.appendChild(phaseRow);
  // das rechenwerk gehört wie das register erst ab kapitel 3 dazu: ohne register wird es nicht angezeigt (aluEl bleibt als loses element bestehen, damit die anzeige unten nichts prüfen muss)
  const aluEl = el('div', 'lz-alu');
  if (config.sichtbar?.register !== false) {
    cpu.appendChild(el('div', 'cg-sub cg-mem-title', 'Rechenwerk'));
    cpu.appendChild(aluEl);
  }
  // register und flag gehören zur cpu: nebeneinander unter dem rechenwerk
  // datenspeicher und schritt-text liegen außerhalb der cpu (3. spalte)
  const cpuSpeicher = el('div', 'lz-cpu-speicher');
  const regGruppe = el('div', 'lz-cpu-gruppe');
  regGruppe.appendChild(el('div', 'cg-sub cg-mem-title', 'Register'));
  const regRow = el('div', 'cg-reg-row');
  const regEls = {};
  REGS.forEach((r) => {
    const c = el('div', 'cg-mem-cell lz-reg');
    c.appendChild(el('span', 'cg-mem-addr', r));
    const v = el('span', 'lz-val');
    c.appendChild(v);
    regRow.appendChild(c);
    regEls[r] = { cell: c, val: v };
  });
  regGruppe.appendChild(regRow);
  const flagGruppe = el('div', 'lz-cpu-gruppe');
  flagGruppe.appendChild(el('div', 'cg-sub cg-mem-title', 'Flag'));
  const flagRow = el('div', 'cg-reg-row');
  const flagCell = el('div', 'cg-mem-cell lz-reg lz-flag');
  const flagVal = el('span', 'lz-val');
  flagCell.appendChild(flagVal);
  flagRow.appendChild(flagCell);
  flagGruppe.appendChild(flagRow);
  if (config.sichtbar?.register !== false) cpuSpeicher.append(regGruppe);
  if (config.sichtbar?.flag !== false) cpuSpeicher.append(flagGruppe);
  if (cpuSpeicher.children.length) cpu.appendChild(cpuSpeicher);
  mid.appendChild(cpu);
  stageEl.appendChild(mid);

  // ---- 3. Spalte: Datenspeicher, darunter Steuerleiste und Meldungen ----
  // schritt-text und ergebnis liegen übereinander (.lz-meldung)
  const side = el('div', 'lz-side');
  const memCard = el('div', 'robot-card');
  memCard.appendChild(el('div', 'cg-sub cg-mem-title', 'Datenspeicher'));
  const memGrid = el('div', 'cg-mem-grid lz-datengrid');
  const memNote = el('div', 'robot-rt-note lz-mem-note');
  memCard.appendChild(memGrid);
  memCard.appendChild(memNote);
  side.appendChild(memCard);
  stageEl.appendChild(side);
  let memEls = {}; // adresse -> { cell, val }

  // datenspeicher: genau ein fach pro variable, direkt hinter dem programm
  function baueDaten() {
    memGrid.textContent = '';
    memEls = {};
    if (!geladen) {
      // vor dem laden gibt es noch keinen datenspeicher, nur die zahl der zellen, die der lader anlegen wird
      const n = lade.variablen.length;
      memNote.textContent = n === 0 ? 'Es werden keine Datenzellen benötigt.'
        : n === 1 ? 'Es wird 1 Datenzelle benötigt.' : 'Es werden ' + n + ' Datenzellen benötigt.';
      return;
    }
    lade.variablen.forEach((v) => {
      const c = el('div', 'cg-mem-cell lz-feld');
      c.appendChild(el('span', 'cg-mem-addr', adr(v.neu)));
      const val = el('span', 'lz-val');
      c.appendChild(val);
      memGrid.appendChild(c);
      memEls[v.neu] = { cell: c, val };
    });
    memNote.textContent = lade.variablen.length ? '' : 'Dieses Programm deklariert nichts, deshalb bleibt der Datenspeicher leer.';
  }

  // steuerleiste und meldungen in der 3. spalte
  // der schritt-text (was gerade passiert) und das ergebnis (ziel erreicht / fehler) stehen an derselben stelle, das ergebnis liegt darüber
  const controls = el('div', 'lz-controls');
  side.appendChild(controls);
  const meldung = el('div', 'lz-meldung');
  const msgEl = el('div', 'robot-rt-note lz-msg');
  meldung.appendChild(msgEl);
  const resultEl = el('div', 'robot-ue-result');
  resultEl.hidden = true;
  meldung.appendChild(resultEl);
  side.appendChild(meldung);

  // ---- 4. Spalte: Spielfeld ----
  const right = el('div', 'lz-right');
  const { gridWrap, cells, robotEl } = baueSpielfeld(HINDERNISSE);
  right.appendChild(gridWrap);
  stageEl.appendChild(right);

  // ---- Steuerleiste: Tempo, darunter Einzelschritt und Laden/Start ----
  // zurücksetzen gibt es hier nicht, die phase wird neu aufgebaut, das programm ist dann wieder entladen
  const stepBtn = el('button', 'btn btn--l btn--fill', 'Einzelschritt');
  stepBtn.onclick = () => { pause(); step(); };
  const playBtn = el('button', 'btn btn--l btn--accent', 'Programm laden');
  playBtn.onclick = () => {
    if (!geladen) { ladeInSpeicher(); return; }
    if (timer) pause(); else play();
  };
  const speedSel = el('select', 'lz-speed');
  SPEEDS.forEach((s) => {
    const o = el('option', '', 'Tempo: ' + s.label);
    o.value = s.ms;
    if (s.ms === speed) o.selected = true;
    speedSel.appendChild(o);
  });
  speedSel.onchange = () => { speed = +speedSel.value; };
  const row = el('div', 'robot-actions');
  row.appendChild(stepBtn);
  row.appendChild(playBtn);
  controls.appendChild(speedSel);
  controls.appendChild(row);

  // ---- Anzeige eines Zustands ----
  function placeRobot(pos) {
    const t = 'translate(' + rem(pos.c * GRID.pitch) + ',' + rem(pos.r * GRID.pitch) + ')';
    robotEl.style.setProperty('--pos', t);
    robotEl.style.transform = t;
  }

  // befehlsregister als normaler text: der befehl, dahinter pro fach der platzhalter (zahl, register, adresse, ziel) und, sobald das fach gelesen ist, sein wert: "mov 1 [15]", "+ A, 3", "rgt [15]"
  // ohne pfeil bei mov: im speicher stehen die fächer ohne pfeil hintereinander, das erste ist die quelle, das zweite das ziel
  function zeigeIr(ir) {
    if (!ir) { irEl.textContent = '–'; return; }
    const teile = (ir.teile || []).map((t) => (t.wert === null ? t.label : t.text));
    const trenner = ir.form === 'arith' || ir.form === 'cmp' ? ', ' : ' ';
    irEl.textContent = ir.name + (teile.length ? ' ' + teile.join(trenner) : '');
  }

  function show(s) {
    if (geladen) {
      rowEls.forEach((row, i) => {
        const adr = lade.faecher[i].adr;
        row.classList.toggle('lz-pcrow', s.pc === adr);
        row.classList.toggle('lz-lesen', s.lesen === adr);
        row.classList.toggle('lz-error', !!s.error && s.fach === adr);
        const isTarget = s.jump && s.jump.to === adr;
        row.classList.toggle('lz-jump-target', !!isTarget);
        row.querySelector('.lz-jump-label').textContent = isTarget ? '← Sprung von ' + pad2(s.jump.from) : '';
      });
      const sicht = s.lesen != null ? s.lesen : s.pc;
      const ri = lade.faecher.findIndex((f) => f.adr === sicht);
      if (ri >= 0) scrollToRow(ri);
      if (!s.phase) rowsEl.scrollTop = 0;
    }

    pcEl.textContent = geladen ? adr(s.pc) : '–';
    zeigeIr(s.ir);
    phaseEls.forEach((p, i) => p.classList.toggle('active', PHASES[i].id === s.phase));
    aluEl.textContent = s.alu || '–';
    msgEl.textContent = s.error ? '' : s.msg;

    REGS.forEach((r) => {
      regEls[r].val.textContent = s.regs[r];
      regEls[r].cell.classList.toggle('lz-write', s.changed.reg === r);
    });
    flagVal.textContent = s.flag;
    flagCell.classList.toggle('lz-write', !!s.changed.flag);
    Object.keys(memEls).forEach((k) => {
      const a = +k, m = memEls[a];
      m.val.textContent = s.mem[a] == null ? '' : s.mem[a];
      m.cell.classList.toggle('lz-read', s.read === a);
      m.cell.classList.toggle('lz-write', s.changed.mem === a);
    });

    cells.flat().forEach((c) => c.classList.remove('robot-ue-visited'));
    s.visited.forEach((v) => cells[v.r][v.c].classList.add('robot-ue-visited'));
    placeRobot(s.robot);
    if (s.crash) {
      robotEl.classList.remove('robot-crash');
      void robotEl.offsetWidth; // animation neu starten
      robotEl.classList.add('robot-crash');
    }

    if (s.error) {
      showResult('Laufzeitfehler: ' + s.error, 'robot-ue-err');
      if (config.fehlerIstZiel && config.beiEnde) config.beiEnde();
    } else if (s.ende) {
      showResult('Programm erfolgreich beendet.', 'robot-ue-ok');
      if (config.beiEnde) config.beiEnde();
    } else resultEl.hidden = true;
  }

  function showResult(msg, kind) {
    resultEl.className = 'robot-ue-result ' + kind;
    resultEl.textContent = msg;
    resultEl.hidden = false;
  }

  // zustand "bereit": noch nichts ausgeführt
  function showReady() {
    show({
      pc: 0, regs: { A: 0, B: 0 }, flag: 0, mem: {}, robot: START, visited: [],
      ir: null, phase: null, lesen: null, fach: null, alu: null,
      msg: geladen ? 'Bereit. Drücke auf „Start“ oder „Einzelschritt“.' : 'Der Maschinencode muss erst in den Speicher geladen werden.',
      changed: {}, read: null, jump: null, error: null, ende: false,
    });
  }

  function updateButtons() {
    const done = states && idx >= states.length - 1;
    stepBtn.disabled = !geladen || !!done;
    playBtn.disabled = ladeFehler || (geladen && !!done);
    playBtn.textContent = !geladen ? 'Programm laden' : timer ? 'Pause' : idx >= 0 ? 'Weiter' : 'Start';
  }

  // ---- Ablauf ----
  function ladeInSpeicher() {
    if (lade.fehler) {
      // das programm kommt nicht in den speicher: es wird nichts geladen und nichts ausgeführt
      ladeFehler = true;
      showResult('Ladefehler: ' + lade.fehler, 'robot-ue-err');
      updateButtons();
      return;
    }
    geladen = true;
    zeigeFaecher();
    baueDaten();
    showReady();
    updateButtons();
  }
  function step() {
    if (!geladen) return false;
    if (!states) states = trace(lade, START, HINDERNISSE);
    if (idx >= states.length - 1) return false;
    idx++;
    show(states[idx]);
    updateButtons();
    return idx < states.length - 1;
  }
  function play() {
    const tick = () => {
      timer = null;
      if (step()) timer = setTimeout(tick, speed);
      updateButtons();
    };
    timer = setTimeout(tick, 0);
    updateButtons();
  }
  function pause() {
    if (timer) { clearTimeout(timer); timer = null; }
    updateButtons();
  }
  zeigeZeilen();
  baueDaten();
  showReady();
  updateButtons();

  // maschinencode bzw. programmspeicher wächst mit dem programm, aber höchstens bis zum unteren rand der folie, danach scrollt er
  // die höchsthöhe hängt von der höhe der folie und von der lage der liste ab, deshalb wird sie bei jeder größenänderung neu berechnet
  const folie = container.closest('.slide');
  function passeHoeheAn() {
    if (!folie) return;
    const fs = getComputedStyle(folie), bs = getComputedStyle(build);
    const folieOben = folie.getBoundingClientRect().top + folie.clientTop;
    const listeOben = rowsEl.getBoundingClientRect().top - folieOben + folie.scrollTop;
    const unten = folie.clientHeight - parseFloat(fs.paddingBottom)
      - parseFloat(bs.paddingBottom) - parseFloat(bs.borderBottomWidth);
    // mindestens eine zeile bleibt sichtbar (die messzeile zählt nicht)
    const zeile = rowsEl.querySelector('.robot-mrow:not(.cg-messzeile)');
    const minimum = zeile ? zeile.getBoundingClientRect().height : 0;
    rowsEl.style.maxHeight = Math.max(minimum, unten - listeOben) + 'px';
  }
  const beobachter = new ResizeObserver(passeHoeheAn);
  if (folie) beobachter.observe(folie);
  beobachter.observe(stageEl);
  passeHoeheAn();

  return () => {
    beobachter.disconnect();
    pause();
  };
}

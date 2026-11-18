// beispielmaschine für codegenerierung und laufzeitsystem: speichergrößen, register, befehlssatz
// gemeinsames befehlsformat { id, p }, damit das programm aus der codegenerierung direkt läuft
//
// befehlsformat (p je nach form):
//   kopiere     { src, dst }   operand = { t, v }, t: 'wert' | 'register' | 'speicher'
//   arith       { reg, op2 }   op2: wert oder register, nie speicher (daten vorher per mov laden), ergebnis in reg
//   cmp         { op1, op2 }   wert oder register, setzt nur das flag
//   jump/jumpf  { line }       zielzeile
//   robot       { n }          anzahl (wert oder speicher), fehlt n: 1
//   halt        {}

// roboter auf dem raster, selbst gezeichnet
export const ROBOTER_SVG = '<svg viewBox="0 0 34 40" fill="none" stroke="var(--text)" stroke-width="2" stroke-linejoin="round"><rect x="7" y="14" width="20" height="21" rx="4"/><path d="M17 14V8"/><circle cx="17" cy="5.5" r="3" fill="var(--text)"/><circle cx="13" cy="24" r="1.7" fill="var(--text)" stroke="none"/><circle cx="21" cy="24" r="1.7" fill="var(--text)" stroke="none"/></svg>';

export const REGS = ['A', 'B'];
export const MEM_FIRST = 11;                // erste datenzelle
// programm und daten zusammen höchstens SPEICHER_GESAMT fächer, geprüft vom lader
export const SPEICHER_GESAMT = 50;
export const WERT_MAX = 255;                // ein wert ist ein byte

// label = name im programmspeicher, wort = richtung ausgeschrieben (nur roboter, für meldungen)
const GROUPS = [
  { title: 'Datentransfer', kind: 'cg-xfer', defs: [
    { id: 'kopiere', form: 'kopiere', label: 'mov' }] },
  { title: 'Rechnen', kind: 'cg-calc', defs: [
    { id: 'add', form: 'arith', label: '+' },
    { id: 'sub', form: 'arith', label: '-' },
    { id: 'mul', form: 'arith', label: '*' },
    { id: 'div', form: 'arith', label: '/' }] },
  { title: 'Vergleichen (setzt das Flag)', kind: 'cg-cmp', defs: [
    { id: 'lt', form: 'cmp', label: '<', op: '<' },
    { id: 'gt', form: 'cmp', label: '>', op: '>' },
    { id: 'le', form: 'cmp', label: '<=', op: '<=' },
    { id: 'ge', form: 'cmp', label: '>=', op: '>=' },
    { id: 'eq', form: 'cmp', label: '==', op: '==' },
    { id: 'ne', form: 'cmp', label: '!=', op: '!=' }] },
  { title: 'Sprünge', kind: 'cg-jump', defs: [
    { id: 'jmp', form: 'jump', label: 'jmp' },
    { id: 'jmpf', form: 'jumpf', label: 'jif' }] },
  { title: 'Roboter', kind: 'cg-move', defs: [
    { id: 'right', form: 'robot', label: 'rgt', wort: 'rechts', dc: 1, dr: 0 },
    { id: 'left', form: 'robot', label: 'lft', wort: 'links', dc: -1, dr: 0 },
    { id: 'up', form: 'robot', label: 'up', wort: 'oben', dc: 0, dr: -1 },
    { id: 'down', form: 'robot', label: 'dwn', wort: 'unten', dc: 0, dr: 1 }] },
];
export const DEFS = {};
GROUPS.forEach((g) => g.defs.forEach((d) => { DEFS[d.id] = { ...d, kind: g.kind }; }));
// "end" gehört zu keiner gruppe der ablage, es gibt ihn genau einmal
DEFS.halt = { id: 'halt', form: 'halt', label: 'end', kind: 'cg-halt' };
export const HALT = () => ({ id: 'halt', p: {} });

export const pad2 = (n) => String(n).padStart(2, '0');

// hindernisse: liste { c, r } (0-basiert), hinfahren ist ein laufzeitfehler wie die wand
export const istHindernis = (hindernisse, c, r) => (hindernisse || []).some((h) => h.c === c && h.r === r);

// anzahl-operand eines roboterbefehls, ohne angabe 1
export const robotAnzahl = (p) => p.n || { t: 'wert', v: 1 };

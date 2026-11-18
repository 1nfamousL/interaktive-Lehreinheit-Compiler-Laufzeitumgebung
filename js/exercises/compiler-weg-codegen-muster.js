/* 
  generator der phase "codegenerierung", ohne dom
  übersetzt den abstrakten syntaxbaum des spielers in eine musterübersetzung und zerlegt sie in bausteine
  die oberfläche gibt dem spieler die bausteine, die prüfung vergleicht seinen maschinencode im lauf mit dem muster

  muster (maschine aus maschine.js, nur "jif"):
    x = zahl / true / false;   mov wert → [x]
    x = y;                     mov [y] → A, mov A → [x]
    x = l op r; (+ - * /)      l nach A, bei r = variable r nach B, rechne A, r, mov A → [x]
    x = l op r; (vergleich)    vergleich l, r, jif zur 4. zeile, mov 0 → [x], jmp hinter die 4. zeile, mov 1 → [x]
    moveRight(zahl) / (v)      rgt zahl / rgt [v]
    if (l op r)                vergleich l ⟨umgekehrter operator⟩ r, jif hinter den block, rumpf
    if (w) / if (true)         == w, 0 (w als variable vorher nach A), jif hinter den block, rumpf
    while                      wie if, am ende jmp zurück auf das laden des linken operanden
    programmende               end
  zahlen stehen direkt im vergleich, eine variable kommt vorher per mov nach A (links) bzw. B (rechts)

  speicherbelegung: eine zelle pro deklaration ab MEM_FIRST in quellcode-reihenfolge, ohne wiederverwendung
  der compiler kennt die größe des datenspeichers nicht, reicht er nicht aus, meldet das erst der lader

  erzeugeMuster(ast, samen) liefert { muster, bausteine }
    muster: liste { id, p } im format von maschine.js
    bausteine: liste { bid, id, p } in gemischter reihenfolge (aus samen, z. b. dem quellcode) 
*/

import { MEM_FIRST, HALT } from './maschine.js';

const RICHTUNG = { rechts: 'right', links: 'left', oben: 'up', unten: 'down' };
const RECHNEN = { '+': 'add', '-': 'sub', '*': 'mul', '/': 'div' };
const VERGLEICH = { '<': 'lt', '>': 'gt', '<=': 'le', '>=': 'ge', '==': 'eq', '!=': 'ne' };
const UMGEKEHRT = { '<': '>=', '>': '<=', '<=': '>', '>=': '<', '==': '!=', '!=': '==' };

const wert = (v) => ({ t: 'wert', v });
const reg = (v) => ({ t: 'register', v });
const spk = (v) => ({ t: 'speicher', v });
const kopie = (x) => JSON.parse(JSON.stringify(x));

// zahl, true (1) oder false (0) als wert
const zahlWert = (k) => (k.bool ? (k.wert === 'true' ? 1 : 0) : k.wert);

// feste, vom samen abhängige reihenfolge (fisher-yates mit mulberry32), damit die ablage bei demselben quellcode gleich aussieht
function mische(liste, samen) {
  let h = 2166136261;
  for (let i = 0; i < samen.length; i++) { h ^= samen.charCodeAt(i); h = Math.imul(h, 16777619); }
  let s = h >>> 0;
  const zufall = () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const a = liste.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(zufall() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function erzeugeMuster(ast, samen = '') {
  const code = [];              // { id, p }
  const bereiche = [new Map()]; // name -> { zelle }
  let naechste = MEM_FIRST;

  const emit = (id, p) => code.push({ id, p }) - 1;
  // sprungziel nachtragen: index = zeile im muster (ab 0), p.line zählt ab 1
  const ziel = (sprung, index) => { code[sprung].p.line = index + 1; };

  function suche(name) {
    for (let i = bereiche.length - 1; i >= 0; i--) if (bereiche[i].has(name)) return bereiche[i].get(name);
    throw new Error('Variable ' + name + ' nicht gefunden');
  }

  // operand in ein register laden
  function laden(k, r) {
    if (k.art === 'var') emit('kopiere', { src: spk(suche(k.name).zelle), dst: reg(r) });
    else emit('kopiere', { src: wert(zahlWert(k)), dst: reg(r) });
  }
  // operand eines vergleichs: zahl direkt als wert, variable zuerst ins register r
  function vergleichsOperand(k, r) {
    if (k.art === 'var') { laden(k, r); return reg(r); }
    return wert(zahlWert(k));
  }
  // rechter operand beim rechnen: zahl direkt als wert, variable zuerst nach B
  function rechts(k) {
    if (k.art === 'var') { laden(k, 'B'); return reg('B'); }
    return wert(zahlWert(k));
  }

  // ausdruck e berechnen und in die zelle der variable v schreiben
  function zuweisen(v, e) {
    if (e.art === 'lit') {
      emit('kopiere', { src: wert(zahlWert(e)), dst: spk(v.zelle) });
    } else if (e.art === 'var') {
      laden(e, 'A');
      emit('kopiere', { src: reg('A'), dst: spk(v.zelle) });
    } else if (RECHNEN[e.op]) {
      laden(e.kids[0], 'A');
      emit(RECHNEN[e.op], { reg: 'A', op2: rechts(e.kids[1]) });
      emit('kopiere', { src: reg('A'), dst: spk(v.zelle) });
    } else {
      // vergleich als wert: das flag lässt sich nicht kopieren, also über einen sprung
      const links = vergleichsOperand(e.kids[0], 'A');
      emit(VERGLEICH[e.op], { op1: links, op2: vergleichsOperand(e.kids[1], 'B') });
      const jaSprung = emit('jmpf', { line: 1 });
      emit('kopiere', { src: wert(0), dst: spk(v.zelle) });
      const weiter = emit('jmp', { line: 1 });
      ziel(jaSprung, emit('kopiere', { src: wert(1), dst: spk(v.zelle) }));
      ziel(weiter, code.length);
    }
  }

  function block(b) {
    bereiche.push(new Map());
    b.kids.forEach(anweisung);
    bereiche.pop();
  }

  // if und while: bedingung, rumpf und (bei while) der rücksprung
  function kontrolle(k) {
    const bedingung = k.kids[0];
    const start = code.length;
    const hinter = []; // sprünge, die hinter den rumpf zeigen
    if (bedingung.art === 'op') {
      const links = vergleichsOperand(bedingung.kids[0], 'A');
      emit(VERGLEICH[UMGEKEHRT[bedingung.op]], { op1: links, op2: vergleichsOperand(bedingung.kids[1], 'B') });
      hinter.push(emit('jmpf', { line: 1 }));
    } else {
      emit('eq', { op1: vergleichsOperand(bedingung, 'A'), op2: wert(0) });
      hinter.push(emit('jmpf', { line: 1 }));
    }
    block(k.kids[1]);
    if (k.art === 'while') ziel(emit('jmp', { line: 1 }), start);
    hinter.forEach((j) => ziel(j, code.length));
  }

  function anweisung(k) {
    switch (k.art) {
      case 'decl': {
        // die zelle gehört der neuen variable, sichtbar wird sie erst nach dem ausdruck
        const v = { zelle: naechste++ };
        zuweisen(v, k.kids[0]);
        bereiche[bereiche.length - 1].set(k.name, v);
        break;
      }
      case 'assign': zuweisen(suche(k.name), k.kids[0]); break;
      case 'move': {
        const a = k.kids[0];
        if (a.art === 'var') {
          emit(RICHTUNG[k.richtung], { n: spk(suche(a.name).zelle) });
        } else {
          emit(RICHTUNG[k.richtung], { n: wert(zahlWert(a)) });
        }
        break;
      }
      case 'if': case 'while': kontrolle(k); break;
      default: throw new Error('Unbekannter Knoten ' + k.art);
    }
  }

  ast.kids.forEach(anweisung);
  code.push({ id: HALT().id, p: HALT().p });

  const muster = code.map((c) => ({ id: c.id, p: kopie(c.p) }));
  const bausteine = mische(code.map((c, i) => ({ bid: 'b' + (i + 1), id: c.id, p: kopie(c.p), zeile: i })), samen);
  return { muster, bausteine };
}

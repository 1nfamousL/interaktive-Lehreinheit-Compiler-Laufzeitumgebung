/* regeln der phase "semantische analyse", ohne dom: ast-bausteine, prüfschritte und regeln, was an welchem knoten richtig ist
 gespielt wird die typprüfung: knoten für knoten, erst die kinder, dann der knoten selbst
 der spieler wählt eine aktion (typ bestimmen, eintragen, nachschlagen, bereich öffnen/schließen, "passt") oder meldet einen fehler

 ---- AST-Bausteine ----
 jeder knoten: { art, label, kids, ... }, "typ" und "ann" (notiz unter dem knoten) füllt die prüfung
 so beschreiben die lektionen ihre bäume: prog(dek('number', 'a', zahl(1))) */

const knoten = (art, label, kids, extra) => Object.assign({ art, label, kids: kids || [], ann: '' }, extra);

// literale zeigen nur ihren text, den typ bestimmt der spieler
export const zahl = (v) => knoten('lit', String(v), [], { wert: v, bool: false, blatt: true });
export const wahrheit = (v) => knoten('lit', v, [], { wert: v, bool: true, blatt: true });
export const variable = (name) => knoten('var', name, [], { name, blatt: true });
export const op = (o, links, rechts) => knoten('op', 'Operation (' + o + ')', [links, rechts], { op: o });
export const dek = (typ, name, ausdruck) => knoten('decl', 'Deklaration (' + typ + ', ' + name + ')', [ausdruck], { typ, name });
export const zuw = (name, ausdruck) => knoten('assign', 'Zuweisung (' + name + ')', [ausdruck], { name });
// richtung intern deutsch ('rechts', 'links', 'oben', 'unten'), schlüsselwort englisch (moveRight, …)
export const RICHTUNG_ENGLISCH = { rechts: 'Right', links: 'Left', oben: 'Up', unten: 'Down' };
export const bew = (richtung, ausdruck) => knoten('move', 'move' + RICHTUNG_ENGLISCH[richtung], [ausdruck], { richtung });
const block = (...rumpf) => knoten('block', 'Block', rumpf);
export const if_ = (bedingung, ...rumpf) => knoten('if', 'If', [bedingung, block(...rumpf)]);
export const while_ = (bedingung, ...rumpf) => knoten('while', 'While', [bedingung, block(...rumpf)]);
export const prog = (...anweisungen) => knoten('prog', 'Programm', anweisungen);

// vergibt jedem knoten eine id (für die oberfläche und die linien im baum)
export function nummeriere(wurzel) {
  let n = 0;
  (function besuche(k) { k.id = ++n; k.kids.forEach(besuche); })(wurzel);
  return wurzel;
}

// ---- Texte ----

export const FEHLER = {
  undeclared: 'Nicht deklariert',
  duplicate: 'Doppelt deklariert',
  type: 'Typfehler',
  range: 'Zahl über 255',
};

// was am knoten zu tun ist, als neutrale aufgabe (verrät nicht die lösung)
export const AUFGABE = {
  lit: 'Welchen Typ hat dieser Wert?',
  var: 'Schlage den Namen in der Symboltabelle nach und klicke seine Zeile an.',
  op: 'Welchen Typ hat das Ergebnis dieser Operation?',
  decl: 'Prüfe die Deklaration.',
  assign: 'Prüfe die Zuweisung.',
  move: 'Prüfe das Argument der Bewegung.',
  cond: 'Prüfe die Bedingung.',
  open: 'Der Block beginnt.',
  close: 'Der Block endet.',
  end: 'Alle Knoten sind geprüft.',
};

// regel zum knoten, wird bei falschen zügen angezeigt
function regel(schritt) {
  const k = schritt.knoten;
  switch (schritt.art) {
    case 'lit': return 'Der Typ ergibt sich aus der Art des Werts. Zahlen müssen zwischen 0 und 255 liegen.';
    case 'var': return 'Ein Name muss deklariert und an dieser Stelle sichtbar sein. Sein Typ steht in der Symboltabelle.';
    case 'op':
      if ('+-*/'.indexOf(k.op) >= 0) return 'Bei + - * / müssen beide Seiten number sein.';
      if (k.op === '==' || k.op === '!=') return 'Bei ' + k.op + ' müssen beide Seiten denselben Typ haben.';
      return 'Bei < > <= >= müssen beide Seiten number sein.';
    case 'decl': return 'Der Name darf nicht schon sichtbar sein, und der Typ des Ausdrucks muss zum deklarierten Typ passen.';
    case 'assign': return 'Der Name muss deklariert sein, und der Typ des Ausdrucks muss zum Typ des Namens passen.';
    case 'move': return 'Das Argument einer Bewegung muss vom Typ number sein.';
    case 'cond': return 'Die Bedingung bei if und while muss vom Typ boolean sein.';
    case 'open': case 'close': return 'Jeder Block hat einen eigenen Bereich. Er wird beim Betreten geöffnet und beim Verlassen geschlossen.';
    default: return 'Alle Knoten sind geprüft, es bleibt nur die Bestätigung.';
  }
}

// zusatzzeile unter dem aktuellen knoten: die typen der kinder, wie sie auch im baum stehen
export function detail(schritt) {
  const k = schritt.knoten;
  switch (schritt.art) {
    case 'op': return 'links: ' + k.kids[0].typ + ' · rechts: ' + k.kids[1].typ;
    case 'decl': return 'Deklariert ' + k.name + ' als ' + k.typ + '. Der Ausdruck hat den Typ ' + k.kids[0].typ + '.';
    case 'assign': return 'Ziel: ' + k.name + ' · Ausdruck: ' + k.kids[0].typ;
    case 'move': return 'Argument: ' + k.kids[0].typ;
    case 'cond': return 'Bedingung: ' + k.kids[0].typ;
    default: return '';
  }
}

// ---- Prüfschritte ----

// kinder zuerst; if/while: bedingung, block (öffnen, rumpf, schließen), dann der knoten
// schritt: { art, knoten }, art = lit, var, op, decl, assign, move, cond, open, close oder end
export function baueSchritte(wurzel) {
  const s = [];
  (function besuche(k) {
    switch (k.art) {
      case 'prog': k.kids.forEach(besuche); s.push({ art: 'end', knoten: k }); break;
      case 'decl': besuche(k.kids[0]); s.push({ art: 'decl', knoten: k }); break;
      case 'assign': besuche(k.kids[0]); s.push({ art: 'assign', knoten: k }); break;
      case 'move': besuche(k.kids[0]); s.push({ art: 'move', knoten: k }); break;
      case 'if': case 'while': {
        besuche(k.kids[0]); s.push({ art: 'cond', knoten: k });
        const b = k.kids[1];
        s.push({ art: 'open', knoten: b }); b.kids.forEach(besuche); s.push({ art: 'close', knoten: b });
        break;
      }
      case 'op': besuche(k.kids[0]); besuche(k.kids[1]); s.push({ art: 'op', knoten: k }); break;
      case 'lit': s.push({ art: 'lit', knoten: k }); break;
      case 'var': s.push({ art: 'var', knoten: k }); break;
    }
  })(wurzel);
  return s;
}

// ---- Symboltabelle ----
// zustand der prüfung: stapel von bereichen, unten der programm-bereich, jeder block legt einen neuen obenauf

export function neuerZustand() {
  return { bereiche: [{ name: 'Programm', eintraege: [] }] };
}

// von innen nach außen, wie ein echter compiler
function nachschlagen(zustand, name) {
  for (let i = zustand.bereiche.length - 1; i >= 0; i--) {
    const es = zustand.bereiche[i].eintraege;
    for (let j = 0; j < es.length; j++) if (es[j].name === name) return es[j];
  }
  return null;
}

// ---- Was ist am aktuellen Schritt richtig? ----
// ergebnis:
//   { art: 'fehler', fehler, grund }     an diesem knoten liegt ein fehler vor
//   { art: 'ok', aktion: { t, v }, anwenden }   die richtige aktion; anwenden() trägt typ/eintrag/bereich nach
// aktionen: type (v = number|boolean), row (v = name), enter, open, close, pass

const fehler = (art, grund) => ({ art: 'fehler', fehler: art, grund });
const ok = (aktion, anwenden) => ({ art: 'ok', aktion, anwenden });

export function erwartet(schritt, zustand) {
  const k = schritt.knoten;
  let e, a, b, t;
  switch (schritt.art) {
    case 'lit':
      if (!k.bool && k.wert > 255) return fehler('range', 'Die Zahl ' + k.wert + ' liegt außerhalb des Wertebereichs 0 bis 255.');
      t = k.bool ? 'boolean' : 'number';
      return ok({ t: 'type', v: t }, () => { k.typ = t; k.ann = t; });
    case 'var':
      e = nachschlagen(zustand, k.name);
      if (!e) return fehler('undeclared', 'Der Name ' + k.name + ' steht nicht in der Symboltabelle, er ist an dieser Stelle nicht sichtbar.');
      return ok({ t: 'row', v: k.name }, () => { k.typ = e.typ; k.ann = e.typ; });
    case 'op':
      a = k.kids[0].typ; b = k.kids[1].typ;
      if ('+-*/'.indexOf(k.op) >= 0) {
        if (a !== 'number' || b !== 'number') return fehler('type', 'Rechnen geht nur mit zwei Zahlen, hier stehen ' + a + ' und ' + b + '.');
        t = 'number';
      } else if (k.op === '==' || k.op === '!=') {
        if (a !== b) return fehler('type', 'Mit ' + k.op + ' lassen sich nur zwei Werte vom gleichen Typ vergleichen, hier stehen ' + a + ' und ' + b + '.');
        t = 'boolean';
      } else {
        if (a !== 'number' || b !== 'number') return fehler('type', 'Der Vergleich ' + k.op + ' braucht zwei Zahlen, hier stehen ' + a + ' und ' + b + '.');
        t = 'boolean';
      }
      return ok({ t: 'type', v: t }, () => { k.typ = t; k.ann = t; });
    case 'decl':
      if (nachschlagen(zustand, k.name)) return fehler('duplicate', 'Der Name ' + k.name + ' ist an dieser Stelle schon sichtbar.');
      a = k.kids[0].typ;
      if (a !== k.typ) return fehler('type', 'Der Ausdruck hat den Typ ' + a + ', der Name wird aber als ' + k.typ + ' deklariert.');
      return ok({ t: 'enter' }, () => {
        zustand.bereiche[zustand.bereiche.length - 1].eintraege.push({ name: k.name, typ: k.typ });
        k.ann = 'eingetragen';
      });
    case 'assign':
      e = nachschlagen(zustand, k.name);
      if (!e) return fehler('undeclared', 'Der Name ' + k.name + ' steht nicht in der Symboltabelle, er ist an dieser Stelle nicht sichtbar.');
      a = k.kids[0].typ;
      if (a !== e.typ) return fehler('type', 'Der Name ' + k.name + ' hat den Typ ' + e.typ + ', der Ausdruck hat den Typ ' + a + '.');
      return ok({ t: 'pass' }, () => { k.ann = '✓'; });
    case 'move':
      a = k.kids[0].typ;
      if (a !== 'number') return fehler('type', 'Das Argument einer Bewegung muss vom Typ number sein, hier ist es vom Typ ' + a + '.');
      return ok({ t: 'pass' }, () => { k.ann = '✓'; });
    case 'cond':
      a = k.kids[0].typ;
      if (a !== 'boolean') return fehler('type', 'Die Bedingung muss vom Typ boolean sein, hier ist es vom Typ ' + a + '.');
      return ok({ t: 'pass' }, () => { k.ann = '✓'; });
    case 'open':
      return ok({ t: 'open' }, () => { zustand.bereiche.push({ name: 'Block', eintraege: [] }); k.ann = 'Bereich offen'; });
    case 'close':
      return ok({ t: 'close' }, () => { zustand.bereiche.pop(); k.ann = 'Bereich zu'; });
    default:
      return ok({ t: 'pass' }, () => { k.ann = '✓'; });
  }
}

// rückmeldung bei einer falschen aktion an einem fehlerfreien knoten: { text, hinweis }
// text sagt kurz, was nicht stimmt, hinweis zeigt auf die regel
function falscheAktion(schritt, aktion, soll) {
  if (schritt.art === 'var') {
    if (aktion.t === 'row') return { text: 'Das ist ein anderer Name.', hinweis: 'Der Name im Baum lautet ' + schritt.knoten.name + '.' };
    return { text: 'Der Typ steht nicht hier.', hinweis: 'Der Typ eines Namens steht in der Symboltabelle. Klicke die Zeile des Namens an.' };
  }
  if (aktion.t === soll.aktion.t) return { text: 'Das stimmt nicht.', hinweis: 'Lies die Regel noch einmal: ' + regel(schritt) };
  return { text: 'Das ist hier nicht die richtige Aktion.', hinweis: AUFGABE[schritt.art] };
}

// wertet einen zug des spielers aus, aktion: { t, v } wie oben, oder { t: 'fehler', v: fehlerart } für einen gemeldeten fehler
// ergebnis { urteil, text, hinweis }:
//   'weiter'   richtig, baum und zustand sind aktualisiert, der nächste schritt kommt
//   'gefunden' der fehler dieses knotens wurde richtig gemeldet (text = begründung)
//   'falsch'   falscher zug, nichts hat sich verändert (text = kurze rückmeldung, hinweis = verweis auf die regel, erst nach "zeige hinweis")
export function zug(schritt, zustand, aktion) {
  const soll = erwartet(schritt, zustand);
  const pruefe = 'Prüfe den Knoten gegen seine Regel: ' + regel(schritt);

  if (aktion.t === 'fehler') {
    if (soll.art !== 'fehler') return { urteil: 'falsch', text: 'An dieser Stelle ist alles in Ordnung.', hinweis: pruefe };
    if (soll.fehler !== aktion.v) return { urteil: 'falsch', text: 'Das stimmt hier nicht.', hinweis: pruefe };
    return { urteil: 'gefunden', text: 'Semantischer Fehler gefunden: ' + FEHLER[aktion.v] + '. ' + soll.grund };
  }

  if (soll.art === 'fehler') {
    return { urteil: 'falsch', text: 'Das stimmt nicht.', hinweis: 'Lies die Regel noch einmal: ' + regel(schritt) };
  }

  if (aktion.t === soll.aktion.t && aktion.v === soll.aktion.v) {
    soll.anwenden();
    return { urteil: 'weiter', text: '' };
  }
  return { urteil: 'falsch', ...falscheAktion(schritt, aktion, soll) };
}

// baut aus den tokens eines syntaktisch korrekten quellcodes den abstrakten syntaxbaum für die semantische analyse
// tokens im format der syntaxanalyse { text, cat }
// parser mit rekursivem abstieg über dieselbe grammatik wie die syntaxanalyse:
//
// im baum entfallen gliederungszeichen und die zwischenknoten anweisung und ausdruck
// keine fehlermeldungen für den spieler, die syntaxanalyse hat schon geprüft: passt etwas nicht, ist das ein programmierfehler und wirft

import { prog, dek, zuw, bew, if_, while_, op, zahl, wahrheit, variable, RICHTUNG_ENGLISCH } from './compiler-weg-semantik-regeln.js';

// moveRight → 'rechts' usw. (intern heißen die richtungen deutsch)
const RICHTUNG = Object.fromEntries(Object.entries(RICHTUNG_ENGLISCH).map(([de, en]) => [en, de]));

// rechnen und vergleichen, nicht "=" und nicht ein einzelnes "!"
const AUSDRUCK_OP = ['+', '-', '*', '/', '>', '<', '==', '!=', '<=', '>='];

export function baueAst(tokens) {
  let i = 0;
  const peek = () => tokens[i];
  const fehler = (was) => { throw new Error('Syntaxbaum nicht aufbaubar (' + was + ' bei Token ' + i + ')'); };
  const erwarte = (cat, text) => {
    const t = tokens[i];
    if (!t || t.cat !== cat || (text !== undefined && t.text !== text)) fehler('erwartet ' + cat);
    i++;
    return t;
  };

  function operand() {
    const t = tokens[i++];
    if (!t) fehler('Operand fehlt');
    if (t.cat === 'id') return variable(t.text);
    if (t.cat === 'lit') return t.text === 'true' || t.text === 'false' ? wahrheit(t.text) : zahl(Number(t.text));
    return fehler('kein Operand');
  }

  function ausdruck() {
    const links = operand();
    const t = peek();
    if (t && t.cat === 'op' && AUSDRUCK_OP.indexOf(t.text) >= 0) {
      i++;
      return op(t.text, links, operand());
    }
    return links;
  }

  function block() {
    erwarte('lbrace');
    const rumpf = [];
    while (peek() && peek().cat !== 'rbrace') rumpf.push(anweisung());
    erwarte('rbrace');
    return rumpf;
  }

  function anweisung() {
    const t = peek();
    if (!t) return fehler('Anweisung fehlt');
    if (t.cat === 'kw' && (t.text === 'if' || t.text === 'while')) {
      i++;
      erwarte('open');
      const bedingung = ausdruck();
      erwarte('close');
      return (t.text === 'if' ? if_ : while_)(bedingung, ...block());
    }
    if (t.cat === 'kw' && t.text.indexOf('move') === 0) {
      i++;
      erwarte('open');
      const anzahl = operand();
      erwarte('close');
      erwarte('semi');
      return bew(RICHTUNG[t.text.slice('move'.length)], anzahl);
    }
    if (t.cat === 'kw') {
      i++;
      const name = erwarte('id');
      erwarte('op', '=');
      const wert = ausdruck();
      erwarte('semi');
      return dek(t.text, name.text, wert);
    }
    if (t.cat === 'id') {
      i++;
      erwarte('op', '=');
      const wert = ausdruck();
      erwarte('semi');
      return zuw(t.text, wert);
    }
    return fehler('unerwartetes Token ' + t.text);
  }

  const anweisungen = [];
  while (i < tokens.length) anweisungen.push(anweisung());
  return prog(...anweisungen);
}

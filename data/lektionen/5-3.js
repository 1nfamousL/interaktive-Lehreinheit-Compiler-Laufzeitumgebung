import { render as renderEinzelphase } from '../../js/exercises/einzelphase.js';
import { chip, regel, zeichen, ende, rasterHtml, regelnPopupHtml } from '../../js/grammatik.js';

// Übung "Werde zum Parser": dasselbe Programm wie in den Übungen davor,
// diesmal als Tokenliste, so wie der Scanner sie liefert. cat ist die
// Kategorie des Tokens (kw = Schlüsselwort, open/close = runde Klammern,
// lbrace/rbrace = geschweifte Klammern, lit = Literal, id = Bezeichner,
// op = Operator, semi = Semikolon).
const ZEILE_1 = [
  { text: 'number', cat: 'kw' }, { text: 'n', cat: 'id' }, { text: '=', cat: 'op' }, { text: '3', cat: 'lit' }, { text: ';', cat: 'semi' },
];
const BEDINGUNG = [
  { text: 'n', cat: 'id' }, { text: '>', cat: 'op' }, { text: '0', cat: 'lit' },
];
const RUMPF = [
  { text: '{', cat: 'lbrace' },
  { text: 'moveRight', cat: 'kw' }, { text: '(', cat: 'open' }, { text: '1', cat: 'lit' }, { text: ')', cat: 'close' }, { text: ';', cat: 'semi' },
  { text: 'moveUp', cat: 'kw' }, { text: '(', cat: 'open' }, { text: '1', cat: 'lit' }, { text: ')', cat: 'close' }, { text: ';', cat: 'semi' },
  { text: 'n', cat: 'id' }, { text: '=', cat: 'op' }, { text: 'n', cat: 'id' }, { text: '-', cat: 'op' }, { text: '1', cat: 'lit' }, { text: ';', cat: 'semi' },
  { text: '}', cat: 'rbrace' },
];
const WHILE = { text: 'while', cat: 'kw' };
const KLAMMER_AUF = { text: '(', cat: 'open' };
const KLAMMER_ZU = { text: ')', cat: 'close' };

// Basis: fehlerfrei. Eine Fehlerübung gibt es hier nicht: Fehlende Klammern kennt der Spieler
// aus Kapitel 2, und bei while ist der Fehler derselbe wie bei if.
const PARSER_PROGRAMM = [...ZEILE_1, WHILE, KLAMMER_AUF, ...BEDINGUNG, KLAMMER_ZU, ...RUMPF];

// Die Regeln der Grammatik, einmal geschrieben: je Regel die Zeile des Rasters und ein Satz dazu. Die Folie zeigt
// das Raster, das Pop-up der Übung zusätzlich den Satz unter jeder Regel (siehe js/grammatik.js). Eine Funktion,
// damit die Hilfsfunktionen weiter unten erst beim Aufruf gebraucht werden.
export const grammatik = () => [
  [regel(chip('Programm'), `${chip('Anweisung')}${zeichen(',')} ${chip('Anweisung')}${zeichen(',')} ${zeichen('…')}${zeichen(',')} ${ende()}`),
    'Ein Programm besteht aus einer oder mehreren Anweisungen.'],
  [regel(chip('Anweisung'), `${zeichen('(')} ${chip('Deklaration')} ${zeichen('|')} ${chip('Zuweisung')} ${zeichen('|')} ${chip('Bewegung')} ${zeichen(')')} ${marke('separator', ';')} ${zeichen('|')} ${chip('If-Anweisung')} ${zeichen('|')} ${chip('While-Anweisung')}`),
    'Eine Anweisung besteht aus einer Deklaration, einer Zuweisung oder einer Bewegung und einem Semikolon. If- und While-Anweisung sind Anweisungen für sich und brauchen kein Semikolon.'],
  [regel(chip('Deklaration'), `${zeichen('(')} ${marke('keyword', 'number')} ${zeichen('|')} ${marke('keyword', 'boolean')} ${zeichen(')')} ${marke('identifier', 'Bezeichner')} ${marke('operator', '=')} ${chip('Ausdruck')}`),
    'Eine Deklaration besteht aus „number“ oder „boolean“, dem Namen der Variablen, einem Gleichheitszeichen und einem Ausdruck.'],
  [regel(chip('Zuweisung'), `${marke('identifier', 'Bezeichner')} ${marke('operator', '=')} ${chip('Ausdruck')}`),
    'Eine Zuweisung gibt einer bereits deklarierten Variablen einen neuen Wert. Sie beginnt ohne Schlüsselwort mit dem Namen der Variablen.'],
  [regel(chip('While-Anweisung'), `${marke('keyword', 'while')} ${marke('separator', '(')} ${chip('Ausdruck')} ${marke('separator', ')')} ${chip('Block')}`),
    'Eine While-Anweisung besteht aus dem Schlüsselwort „while“, einer Bedingung in runden Klammern und einem Block, der wiederholt wird.'],
  [regel(chip('If-Anweisung'), `${marke('keyword', 'if')} ${marke('separator', '(')} ${chip('Ausdruck')} ${marke('separator', ')')} ${chip('Block')}`),
    'Eine If-Anweisung besteht aus dem Schlüsselwort „if“, einer Bedingung in runden Klammern und einem Block.'],
  [regel(chip('Block'), `${marke('separator', '{')} ${chip('Anweisung')}${zeichen(',')} ${chip('Anweisung')}${zeichen(',')} ${zeichen('…')} ${marke('separator', '}')}`),
    'Ein Block fasst beliebig viele Anweisungen in geschweiften Klammern zusammen.'],
  [regel(chip('Ausdruck'), `${zeichen('(')} ${marke('identifier', 'Bezeichner')} ${zeichen('|')} ${marke('literal', 'Literal')} ${zeichen(')')} ${zeichen('[')} ${marke('operator', 'Operator')} ${zeichen('(')} ${marke('identifier', 'Bezeichner')} ${zeichen('|')} ${marke('literal', 'Literal')} ${zeichen(')')} ${zeichen(']')}`),
    'Ein Ausdruck ist ein einzelner Wert oder eine Rechnung oder ein Vergleich mit zwei Werten, zum Beispiel „n - 1“ oder „n > 0“.'],
  [regel(chip('Bewegung'), `${zeichen('(')} ${marke('keyword', 'moveUp')} ${zeichen('|')} ${marke('keyword', 'moveDown')} ${zeichen('|')} ${marke('keyword', 'moveRight')} ${zeichen('|')} ${marke('keyword', 'moveLeft')} ${zeichen(')')} ${marke('separator', '(')} ${zeichen('(')} ${marke('identifier', 'Bezeichner')} ${zeichen('|')} ${marke('literal', 'Literal')} ${zeichen(')')} ${marke('separator', ')')}`),
    'Eine Bewegung besteht aus einem Schlüsselwort (moveUp, moveDown, moveRight oder moveLeft), einer öffnenden Klammer, einer Variablen oder Zahl und einer schließenden Klammer.'],
];

function parserUebung(programm) {
  return {
    phase: 'syntax',
    programm,
    // Je Zeile ein langer und ein kurzer Chip, damit die Zeilen etwa gleich breit sind
    ablage: ['Anweisung', 'Zuweisung', 'Deklaration', 'Ausdruck', 'While-Anweisung', 'Block', 'If-Anweisung', 'Bewegung'],
    regelnHtml: regelnPopupHtml(grammatik()),
  };
}

// Ein einzelnes Token im Text, eingefärbt wie in der Lexik-Übung (art = Werkzeug-ID, siehe 2-2.js)
const marke = (art, text) => `<span class="token-marke lex-mark-${art}">${text}</span>`;

export const LEKTION = {
  id: '5-3',
  title: '5.3 Syntax: Die while-Schleife',
  desc: 'Die while-Schleife im Syntaxbaum.',
  slides: [
    {
      id: 's1',
      title: 'Was ist neu?',
      // Die gesamte Grammatik wie in 4.3, mit der neuen While-Anweisung
      render: (container) => {
        container.innerHTML = `
          <div class="slide-centered slide-lesbar">
            <p>Unsere Grammatik wächst um die While-Anweisung. Dazu ändert sich eine Regel: Eine Anweisung kann jetzt auch eine While-Anweisung sein. Die While-Anweisung ist aufgebaut wie die If-Anweisung, nur mit dem Schlüsselwort ${marke('keyword', 'while')}. Wie diese braucht sie kein Semikolon.</p>
            <div class="robot-card grammatik-fenster">
            ${rasterHtml(grammatik())}
            </div>
          </div>
        `;
      },
    },
    {
      id: 's2',
      title: 'Werde zum Parser: Die while-Schleife',
      render: (container) => renderEinzelphase(container, parserUebung(PARSER_PROGRAMM)),
    },
  ],
};

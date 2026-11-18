import { render as renderEinzelphase } from '../../js/exercises/einzelphase.js';
import { chip, regel, zeichen, ende, rasterHtml, regelnPopupHtml } from '../../js/grammatik.js';

// Übung "Werde zum Parser": dasselbe Programm wie in der Scanner-Übung,
// diesmal als Tokenliste, so wie der Scanner sie liefert. cat ist die
// Kategorie des Tokens (kw = Schlüsselwort, open/close = runde Klammern,
// lbrace/rbrace = geschweifte Klammern, lit = Literal, id = Bezeichner,
// op = Operator, semi = Semikolon).
const ZEILE_1 = [
  { text: 'number', cat: 'kw' }, { text: 'schritte', cat: 'id' }, { text: '=', cat: 'op' }, { text: '3', cat: 'lit' }, { text: ';', cat: 'semi' },
];
const ZEILE_2 = [
  { text: 'boolean', cat: 'kw' }, { text: 'weit', cat: 'id' }, { text: '=', cat: 'op' }, { text: 'false', cat: 'lit' }, { text: ';', cat: 'semi' },
];
const IF_1_KOPF = [
  { text: 'if', cat: 'kw' }, { text: '(', cat: 'open' }, { text: 'schritte', cat: 'id' }, { text: '>', cat: 'op' }, { text: '2', cat: 'lit' }, { text: ')', cat: 'close' },
];
const IF_1_RUMPF = [
  { text: 'moveUp', cat: 'kw' }, { text: '(', cat: 'open' }, { text: '1', cat: 'lit' }, { text: ')', cat: 'close' }, { text: ';', cat: 'semi' },
];
const IF_2 = [
  { text: 'if', cat: 'kw' }, { text: '(', cat: 'open' }, { text: 'weit', cat: 'id' }, { text: '==', cat: 'op' }, { text: 'true', cat: 'lit' }, { text: ')', cat: 'close' }, { text: '{', cat: 'lbrace' },
  { text: 'moveRight', cat: 'kw' }, { text: '(', cat: 'open' }, { text: 'schritte', cat: 'id' }, { text: ')', cat: 'close' }, { text: ';', cat: 'semi' },
  { text: '}', cat: 'rbrace' },
];
const KLAMMER_AUF = { text: '{', cat: 'lbrace' };
const KLAMMER_ZU = { text: '}', cat: 'rbrace' };

// Basis: fehlerfrei. Eine Fehlerübung gibt es hier nicht: Ein fehlender Block (if ohne „{“)
// ist derselbe Syntaxfehler wie in Kapitel 2 und 3 und steht nur im Text.
const PARSER_PROGRAMM = [...ZEILE_1, ...ZEILE_2, ...IF_1_KOPF, KLAMMER_AUF, ...IF_1_RUMPF, KLAMMER_ZU, ...IF_2];

// Die Regeln der Grammatik, einmal geschrieben: je Regel die Zeile des Rasters und ein Satz dazu. Die Folie zeigt
// das Raster, das Pop-up der Übung zusätzlich den Satz unter jeder Regel (siehe js/grammatik.js). Eine Funktion,
// damit die Hilfsfunktionen weiter unten erst beim Aufruf gebraucht werden.
const grammatik = () => [
  [regel(chip('Programm'), `${chip('Anweisung')}${zeichen(',')} ${chip('Anweisung')}${zeichen(',')} ${zeichen('…')}${zeichen(',')} ${ende()}`),
    'Ein Programm besteht aus einer oder mehreren Anweisungen.'],
  [regel(chip('Anweisung'), `${zeichen('(')} ${chip('Deklaration')} ${zeichen('|')} ${chip('Zuweisung')} ${zeichen('|')} ${chip('Bewegung')} ${zeichen(')')} ${marke('separator', ';')} ${zeichen('|')} ${chip('If-Anweisung')}`),
    'Eine Anweisung besteht aus einer Deklaration, einer Zuweisung oder einer Bewegung und einem Semikolon. Eine If-Anweisung ist eine Anweisung für sich und braucht kein Semikolon.'],
  [regel(chip('Deklaration'), `${zeichen('(')} ${marke('keyword', 'number')} ${zeichen('|')} ${marke('keyword', 'boolean')} ${zeichen(')')} ${marke('identifier', 'Bezeichner')} ${marke('operator', '=')} ${chip('Ausdruck')}`),
    'Eine Deklaration besteht aus „number“ oder „boolean“, dem Namen der Variablen, einem Gleichheitszeichen und einem Ausdruck.'],
  [regel(chip('Zuweisung'), `${marke('identifier', 'Bezeichner')} ${marke('operator', '=')} ${chip('Ausdruck')}`),
    'Eine Zuweisung gibt einer bereits deklarierten Variablen einen neuen Wert. Sie beginnt ohne Schlüsselwort mit dem Namen der Variablen.'],
  [regel(chip('If-Anweisung'), `${marke('keyword', 'if')} ${marke('separator', '(')} ${chip('Ausdruck')} ${marke('separator', ')')} ${chip('Block')}`),
    'Eine If-Anweisung besteht aus dem Schlüsselwort „if“, einer Bedingung in runden Klammern und einem Block.'],
  [regel(chip('Block'), `${marke('separator', '{')} ${chip('Anweisung')}${zeichen(',')} ${chip('Anweisung')}${zeichen(',')} ${zeichen('…')} ${marke('separator', '}')}`),
    'Ein Block fasst beliebig viele Anweisungen in geschweiften Klammern zusammen.'],
  [regel(chip('Ausdruck'), `${zeichen('(')} ${marke('identifier', 'Bezeichner')} ${zeichen('|')} ${marke('literal', 'Literal')} ${zeichen(')')} ${zeichen('[')} ${marke('operator', 'Operator')} ${zeichen('(')} ${marke('identifier', 'Bezeichner')} ${zeichen('|')} ${marke('literal', 'Literal')} ${zeichen(')')} ${zeichen(']')}`),
    'Ein Ausdruck ist ein einzelner Wert oder eine Rechnung oder ein Vergleich mit zwei Werten, zum Beispiel „schritte > 2“.'],
  [regel(chip('Bewegung'), `${zeichen('(')} ${marke('keyword', 'moveUp')} ${zeichen('|')} ${marke('keyword', 'moveDown')} ${zeichen('|')} ${marke('keyword', 'moveRight')} ${zeichen('|')} ${marke('keyword', 'moveLeft')} ${zeichen(')')} ${marke('separator', '(')} ${zeichen('(')} ${marke('identifier', 'Bezeichner')} ${zeichen('|')} ${marke('literal', 'Literal')} ${zeichen(')')} ${marke('separator', ')')}`),
    'Eine Bewegung besteht aus einem Schlüsselwort (moveUp, moveDown, moveRight oder moveLeft), einer öffnenden Klammer, einer Variablen oder Zahl und einer schließenden Klammer.'],
];

function parserUebung(programm) {
  return {
    phase: 'syntax',
    programm,
    // Reihenfolge wie in 5.3 und 6.2, ohne While-Anweisung (kommt erst in Kapitel 5). Das
    // Programm der Übung enthält keine Zuweisung, sie liegt als Ablenkung in der Ablage.
    ablage: ['Anweisung', 'Zuweisung', 'Deklaration', 'Ausdruck', 'If-Anweisung', 'Block', 'Bewegung'],
    regelnHtml: regelnPopupHtml(grammatik()),
  };
}

// Ein einzelnes Token im Text, eingefärbt wie in der Lexik-Übung (art = Werkzeug-ID, siehe 2-2.js)
const marke = (art, text) => `<span class="token-marke lex-mark-${art}">${text}</span>`;
const tokens = (...t) => t.map(([art, text]) => marke(art, text)).join(' ');

export const LEKTION = {
  id: '4-3',
  title: '4.3 Syntax: Blöcke und if',
  desc: 'Die if-Anweisung mit Block und Vergleich im Syntaxbaum.',
  slides: [
    {
      id: 's1',
      title: 'Was ist neu?',
      // Die gesamte Grammatik wie in 3.3, mit der neuen If-Anweisung und dem Block
      render: (container) => {
        container.innerHTML = `
          <div class="slide-centered slide-lesbar">
            <p>Unsere Grammatik wächst um die If-Anweisung und den Block. Dazu ändern sich zwei Regeln: Eine Anweisung kann jetzt eine If-Anweisung sein, und die Deklaration beginnt mit ${marke('keyword', 'number')} oder ${marke('keyword', 'boolean')}. Alle anderen Regeln bleiben, wie sie waren.</p>
            <div class="robot-card grammatik-fenster">
            ${rasterHtml(grammatik())}
            </div>
            <p>Der Ausdruck bleibt, wie er war: Die Vergleichszeichen sind Operatoren und passen deshalb schon in die Regel.</p>
          </div>
        `;
      },
    },
    {
      id: 's2',
      title: 'Syntaxfehler bei Block und Klammern',
      // Die Beispiele stehen als Tokens in den Lexik-Farben, so wie der Parser sie vom Scanner bekommt
      render: (container) => {
        container.innerHTML = `
          <div class="slide-centered slide-lesbar">
            <p>Mit dem Block kommen neue Möglichkeiten für Syntaxfehler dazu. Auch hier ist jedes Token für sich gültig, nur die Reihenfolge stimmt nicht.</p>
            <div class="vergleich">
              <div class="robot-card robot-card--geteilt robot-card--stapel">
               <div class="robot-card-teil">
                <h2>If ohne Block</h2>
                <p>${tokens(['keyword', 'if'], ['separator', '('], ['identifier', 'hoch'], ['operator', '&lt;'], ['literal', '5'], ['separator', ')'], ['keyword', 'moveLeft'], ['separator', '('], ['literal', '2'], ['separator', ')'], ['separator', ';'])}</p>
                <p>Nach der Bedingung erwartet die Regel einen Block, also ${marke('separator', '{')}. Es folgt aber ${marke('keyword', 'moveLeft')}. Auch wenn nur die öffnende Klammer fehlt, ist es dieser Fehler.</p>
               </div>
               <div class="robot-card-teil">
                <h2>Schließende Klammer fehlt</h2>
                <p>${tokens(['keyword', 'if'], ['separator', '('], ['identifier', 'hoch'], ['operator', '&lt;'], ['literal', '5'], ['separator', ')'], ['separator', '{'], ['keyword', 'moveLeft'], ['separator', '('], ['literal', '2'], ['separator', ')'], ['separator', ';'])} ${ende()}</p>
                <p>Nach der Anweisung im Block erwartet der Parser eine weitere Anweisung oder die schließende Klammer ${marke('separator', '}')}. Es folgt aber schon das Programmende.</p>
               </div>
              </div>
            </div>
            <p>Auf der nächsten Folie bist du wieder der Parser und baust den Baum Token für Token auf.</p>
          </div>
        `;
      },
    },
    {
      id: 's3',
      title: 'Werde zum Parser: if und Blöcke',
      render: (container) => renderEinzelphase(container, parserUebung(PARSER_PROGRAMM)),
    },
  ],
};

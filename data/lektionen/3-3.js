import { render as renderEinzelphase } from '../../js/exercises/einzelphase.js';
import { chip, regel, zeichen, ende, rasterHtml, regelnPopupHtml } from '../../js/grammatik.js';

// Übung "Werde zum Parser": dasselbe Programm wie in der Scanner-Übung,
// diesmal als Tokenliste, so wie der Scanner sie liefert. cat ist die
// Kategorie des Tokens (kw = Schlüsselwort, open/close = Klammern,
// lit = Literal, id = Bezeichner, op = Operator, semi = Semikolon).
const ZEILE_1 = [
  { text: 'number', cat: 'kw' }, { text: 'weg', cat: 'id' }, { text: '=', cat: 'op' }, { text: '4', cat: 'lit' }, { text: '+', cat: 'op' }, { text: '3', cat: 'lit' }, { text: ';', cat: 'semi' },
];
const ZEILE_2 = [
  { text: 'weg', cat: 'id' }, { text: '=', cat: 'op' }, { text: '10', cat: 'lit' }, { text: '-', cat: 'op' }, { text: 'weg', cat: 'id' }, { text: ';', cat: 'semi' },
];
const ZEILE_3 = [
  { text: 'moveRight', cat: 'kw' }, { text: '(', cat: 'open' }, { text: 'weg', cat: 'id' }, { text: ')', cat: 'close' }, { text: ';', cat: 'semi' },
];

// Basis: fehlerfrei
const PARSER_PROGRAMM = [...ZEILE_1, ...ZEILE_2, ...ZEILE_3];

// Fehler 1: Operand fehlt (weg = 10 - ;). Der Parser erwartet nach dem „-“ einen Wert und findet „;“.
const PARSER_OPERAND_FEHLT = [
  ...ZEILE_1,
  { text: 'weg', cat: 'id' }, { text: '=', cat: 'op' }, { text: '10', cat: 'lit' }, { text: '-', cat: 'op' }, { text: ';', cat: 'semi' },
  ...ZEILE_3,
];

// Alle Übungen unterscheiden sich nur im Programm.
function parserUebung(programm) {
  return {
    phase: 'syntax',
    programm,
    // Reihenfolge wie in 4.3, 5.3 und 6.2, ohne If-/While-Anweisung und Block (kommen erst in
    // Kapitel 4 und 5)
    ablage: ['Anweisung', 'Zuweisung', 'Deklaration', 'Ausdruck', 'Bewegung'],
    regelnHtml: regelnPopupHtml(grammatik()),
  };
}

// Die Regeln der Grammatik, einmal geschrieben: je Regel die Zeile des Rasters und ein Satz dazu. Die Folie zeigt
// das Raster, das Pop-up der Übung zusätzlich den Satz unter jeder Regel (siehe js/grammatik.js). Eine Funktion,
// damit die Hilfsfunktionen weiter unten erst beim Aufruf gebraucht werden.
const grammatik = () => [
  [regel(chip('Programm'), `${chip('Anweisung')}${zeichen(',')} ${chip('Anweisung')}${zeichen(',')} ${zeichen('…')}${zeichen(',')} ${ende()}`),
    'Ein Programm besteht aus einer oder mehreren Anweisungen.'],
  [regel(chip('Anweisung'), `${zeichen('(')} ${chip('Deklaration')} ${zeichen('|')} ${chip('Zuweisung')} ${zeichen('|')} ${chip('Bewegung')} ${zeichen(')')} ${marke('separator', ';')}`),
    'Eine Anweisung besteht aus einer Deklaration, einer Zuweisung oder einer Bewegung und einem Semikolon.'],
  [regel(chip('Deklaration'), `${marke('keyword', 'number')} ${marke('identifier', 'Bezeichner')} ${marke('operator', '=')} ${chip('Ausdruck')}`),
    'Eine Deklaration besteht aus dem Schlüsselwort „number“, dem Namen der Variablen, einem Gleichheitszeichen und einem Ausdruck.'],
  [regel(chip('Zuweisung'), `${marke('identifier', 'Bezeichner')} ${marke('operator', '=')} ${chip('Ausdruck')}`),
    'Eine Zuweisung gibt einer bereits deklarierten Variablen einen neuen Wert. Sie beginnt ohne Schlüsselwort mit dem Namen der Variablen.'],
  [regel(chip('Bewegung'), `${zeichen('(')} ${marke('keyword', 'moveUp')} ${zeichen('|')} ${marke('keyword', 'moveDown')} ${zeichen('|')} ${marke('keyword', 'moveRight')} ${zeichen('|')} ${marke('keyword', 'moveLeft')} ${zeichen(')')} ${marke('separator', '(')} ${zeichen('(')} ${marke('identifier', 'Bezeichner')} ${zeichen('|')} ${marke('literal', 'Literal')} ${zeichen(')')} ${marke('separator', ')')}`),
    'Eine Bewegung besteht aus einem Schlüsselwort (moveUp, moveDown, moveRight oder moveLeft), einer öffnenden Klammer, einer Variablen oder Zahl und einer schließenden Klammer.'],
  [regel(chip('Ausdruck'), `${zeichen('(')} ${marke('identifier', 'Bezeichner')} ${zeichen('|')} ${marke('literal', 'Literal')} ${zeichen(')')} ${zeichen('[')} ${zeichen('(')} ${marke('operator', '+')} ${zeichen('|')} ${marke('operator', '-')} ${zeichen('|')} ${marke('operator', '*')} ${zeichen('|')} ${marke('operator', '/')} ${zeichen(')')} ${zeichen('(')} ${marke('identifier', 'Bezeichner')} ${zeichen('|')} ${marke('literal', 'Literal')} ${zeichen(')')} ${zeichen(']')}`),
    'Ein Ausdruck ist ein einzelner Wert oder eine Rechnung mit zwei Werten, zum Beispiel „a + 3“.'],
];


// Ein einzelnes Token im Text, eingefärbt wie in der Lexik-Übung (art = Werkzeug-ID, siehe 2-2.js).
// Programmteile aus mehreren Tokens stehen als code(...) auf Papier.
const marke = (art, text) => `<span class="token-marke lex-mark-${art}">${text}</span>`;
const code = (text) => `<span class="code-papier">${text}</span>`;
const tokens = (...t) => t.map(([art, text]) => marke(art, text)).join(' ');

export const LEKTION = {
  id: '3-3',
  title: '3.3 Syntax: Ausdrücke im Baum',
  desc: 'Zuweisung und Rechnung im Syntaxbaum.',
  slides: [
    {
      id: 's1',
      title: 'Was ist neu?',
      // Die gesamte Grammatik wie in 2.3, mit der neuen Zuweisung und dem erweiterten Ausdruck
      render: (container) => {
        container.innerHTML = `
          <div class="slide-centered slide-lesbar">
            <p>Unsere Grammatik wächst um zwei Dinge, die Zuweisung und die Möglichkeit, dass ein Ausdruck eine Rechnung enthält. Alle anderen Regeln bleiben, wie sie waren.</p>
            <div class="robot-card grammatik-fenster">
            ${rasterHtml(grammatik())}
            </div>
            <p>Die eckigen Klammern bedeuten „kann auch fehlen“: Hinter dem ersten Wert darf ein Operator und ein zweiter Wert folgen.</p>
            <p>Eine Zuweisung erkennt der Parser am ersten Token: Beginnt die Anweisung mit einem Bezeichner, ist es eine Zuweisung. Bei ${marke('keyword', 'number')} ist es eine Deklaration, bei einem der vier Schlüsselwörter für eine Bewegung ist es eine Bewegung.</p>
          </div>
        `;
      },
    },
    {
      id: 's2',
      title: 'Syntaxfehler im Ausdruck',
      // Die Beispiele stehen als Tokens in den Lexik-Farben, so wie der Parser sie vom Scanner bekommt
      render: (container) => {
        container.innerHTML = `
          <div class="slide-centered slide-lesbar">
            <p>Mit dem Ausdruck kommen neue Möglichkeiten für Syntaxfehler dazu. Auch hier ist jedes Token für sich gültig, nur die Reihenfolge stimmt nicht.</p>
            <div class="vergleich">
              <div class="robot-card robot-card--geteilt robot-card--stapel">
               <div class="robot-card-teil">
                <h2>Zwei Operatoren</h2>
                <p>${tokens(['identifier', 'weg'], ['operator', '='], ['identifier', 'a'], ['operator', '+'], ['literal', '1'], ['operator', '+'], ['literal', '2'], ['separator', ';'])}</p>
                <p>Nach dem zweiten Wert ist der Ausdruck zu Ende. Die Regel erwartet ein ${marke('separator', ';')}, es folgt aber ${marke('operator', '+')}.</p>
               </div>
               <div class="robot-card-teil">
                <h2>Rechnung in der Bewegung</h2>
                <p>${tokens(['keyword', 'moveRight'], ['separator', '('], ['identifier', 'a'], ['operator', '*'], ['literal', '2'], ['separator', ')'], ['separator', ';'])}</p>
                <p>Nach dem Wert erwartet die Bewegung die schließende Klammer, es folgt aber ${marke('operator', '*')}.</p>
               </div>
               <div class="robot-card-teil">
                <h2>Negative Zahl</h2>
                <p>${tokens(['identifier', 'a'], ['operator', '='], ['operator', '-'], ['literal', '1'], ['separator', ';'])}</p>
                <p>Ein Ausdruck beginnt mit einem Bezeichner oder einem Literal, hier steht aber ${marke('operator', '-')}.</p>
               </div>
              </div>
            </div>
            <p>Auf den nächsten Folien bist du wieder der Parser und baust den Baum Token für Token auf.</p>
          </div>
        `;
      },
    },
    {
      id: 's3',
      title: 'Werde zum Parser: Rechnungen und Zuweisung',
      render: (container) => renderEinzelphase(container, parserUebung(PARSER_PROGRAMM)),
    },
    {
      id: 's4',
      title: 'Werde zum Parser: Fehlender Operand',
      render: (container) => renderEinzelphase(container, parserUebung(PARSER_OPERAND_FEHLT)),
    },
  ],
};

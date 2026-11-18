import { render as renderEinzelphase } from '../../js/exercises/einzelphase.js';
import { prog, dek, zuw, bew, op, zahl, variable } from '../../js/exercises/compiler-weg-semantik-regeln.js';

// Übung "Werde zur semantischen Analyse": dasselbe Programm wie in den Übungen
// davor, fehlerfrei.
const SEMANTIK_BAUM = () => prog(
  dek('number', 'weg', op('+', zahl(4), zahl(3))),
  zuw('weg', op('-', zahl(10), variable('weg'))),
  bew('rechts', variable('weg')),
);

// Fehler range: Das Literal 300 liegt außerhalb von 0 bis 255. Gemeldet wird schon das Literal,
// bevor etwas gerechnet wird.
const BAUM_RANGE = () => prog(
  dek('number', 'weg', op('+', zahl(4), zahl(300))),
  zuw('weg', op('-', zahl(10), variable('weg'))),
  bew('rechts', variable('weg')),
);

// Beide Übungen unterscheiden sich nur im Baum.
function semantikUebung(baum) {
  // Stand Kapitel 3: nur der Typ number, keine Blöcke (also keine Bereiche), kein Typfehler
  return {
    phase: 'semantik',
    baum,
    typen: ['number'],
    fehler: ['range', 'undeclared', 'duplicate'],
    symboltabelle: true,
    regelnHtml: SEMANTIK_REGELN,
  };
}

// Regeln für das Pop-up der Übung. Es stehen nur die Regeln da, die bis zu
// diesem Kapitel vorkommen.
const SEMANTIK_REGELN = `
  <div class="modal-abschnitt">Werte und Ausdrücke</div>
  <p><strong>Zahl</strong> → Typ number<span class="regel-satz">Jede Zahl hat den Typ number und liegt zwischen 0 und 255.</span></p>
  <p><strong>Variable</strong> → Typ aus der Symboltabelle<span class="regel-satz">Eine Variable muss deklariert und an dieser Stelle sichtbar sein. Ihr Typ steht in der Symboltabelle.</span></p>
  <p><strong>Rechnen</strong> (+ - * /) → Typ number<span class="regel-satz">Beide Seiten müssen vom Typ number sein.</span></p>
  <div class="modal-abschnitt">Anweisungen</div>
  <p><strong>Deklaration</strong> → Eintrag in der Symboltabelle<span class="regel-satz">Der Name darf noch nicht sichtbar sein, und der Typ des Ausdrucks muss zum deklarierten Typ passen. Danach wird die Variable in die Symboltabelle eingetragen.</span></p>
  <p><strong>Zuweisung</strong><span class="regel-satz">Die Variable muss deklariert sein, und der Typ des Ausdrucks muss zu ihrem Typ passen.</span></p>
  <p><strong>Bewegung</strong> → Argument ist number<span class="regel-satz">Das Argument einer Bewegung muss vom Typ number sein.</span></p>
`;


// Ein einzelnes Token im Text, eingefärbt wie in der Lexik-Übung (art = Werkzeug-ID, siehe 2-2.js).
// Programmteile aus mehreren Tokens stehen als code(...) auf Papier.
const marke = (art, text) => `<span class="token-marke lex-mark-${art}">${text}</span>`;
const code = (text) => `<span class="code-papier">${text}</span>`;
// Fehlerknopf wie in der Übung (Texte aus FEHLER in compiler-weg-semantik-regeln.js)
const fehlerknopf = (text) => `<span class="mini-fehlerknopf">${text}</span>`;

export const LEKTION = {
  id: '3-4',
  title: '3.4 Semantik: Zahlenbereich prüfen',
  desc: 'Rechnungen und Zuweisungen prüfen, Zahlen außerhalb von 0 bis 255 melden.',
  slides: [
    {
      id: 's1',
      title: 'Was ist neu?',
      render: (container) => {
        container.innerHTML = `
          <div class="slide-centered slide-lesbar">
            <p>Die semantische Analyse arbeitet wie in Kapitel 2: Sie geht den abstrakten Syntaxbaum durch, bestimmt Typen und prüft Namen mithilfe der Symboltabelle. Neu sind zwei Knotenarten, jede mit einer Regel:</p>
            <div class="vergleich">
              <div class="robot-card robot-card--geteilt robot-card--stapel">
               <div class="robot-card-teil">
                <h2>Operation</h2>
                <p>Eine Operation ist eine Rechnung. Sie hat zwei Kinder, die beiden Werte. Bei ${marke('operator', '+')}, ${marke('operator', '-')}, ${marke('operator', '*')} und ${marke('operator', '/')} müssen beide den Typ ${marke('keyword', 'number')} haben, und das Ergebnis hat ebenfalls den Typ ${marke('keyword', 'number')}.</p>
                <p>z.B. ${code('a + 3')}</p>
               </div>
               <div class="robot-card-teil">
                <h2>Zuweisung</h2>
                <p>Eine Zuweisung hat den Namen der Variablen und ein Kind, den neuen Wert. Der Name muss deklariert sein, und der Typ des Werts muss zum Typ des Namens passen.</p>
                <p>z.B. ${code('weg = weg - a;')}</p>
               </div>
              </div>
            </div>
          </div>
        `;
      },
    },
    {
      id: 's2',
      title: 'Bekannte Fehler an neuen Stellen',
      render: (container) => {
        container.innerHTML = `
          <div class="slide-centered slide-lesbar">
            <p>Es gibt keine neue Fehlerart. Der Fehler ${fehlerknopf('Nicht deklariert')} fällt aber jetzt an mehr Stellen auf:</p>
            <div class="vergleich">
              <div class="robot-card robot-card--geteilt robot-card--stapel">
               <div class="robot-card-teil">
                <h2>In der Rechnung</h2>
                <p>Bei einer Deklaration prüft der Compiler zuerst den Ausdruck und trägt die neue Variable erst danach in die Symboltabelle ein. Beim Prüfen der Rechnung gibt es den Namen also noch nicht.</p>
                <p>z.B. ${code('number a = a + 1;')}</p>
               </div>
               <div class="robot-card-teil">
                <h2>Links von der Zuweisung</h2>
                <p>Ein Tippfehler im Namen fällt beim Nachschlagen auf.</p>
                <p>z.B. ${code('wegg = weg - a;')}, wenn es ${marke('identifier', 'wegg')} nie gab.</p>
               </div>
              </div>
            </div>
          </div>
        `;
      },
    },
    {
      id: 's3',
      title: 'Zahlen und Ergebnisse',
      text: [
        `Eine Zahl im Quellcode wie ${marke('literal', '500')} erkennt der Compiler als ${fehlerknopf('Zahl über 255')}, zum Beispiel in ${code('weg = 500 / a;')}. Gemeldet wird die Zahl selbst, noch bevor er die Rechnung betrachtet.`,
        `Das Ergebnis einer Rechnung prüft er nicht. ${code('number a = 200 + 100;')} ist semantisch in Ordnung, obwohl das Ergebnis nicht mehr in ein Byte passt. Das zeigt sich erst zur Laufzeit.`,
        'Auf den nächsten Folien prüfst du wieder den Baum Knoten für Knoten.',
      ],
    },
    {
      id: 's4',
      title: 'Prüfe den Baum: Rechnungen und Zuweisung',
      render: (container) => renderEinzelphase(container, semantikUebung(SEMANTIK_BAUM)),
    },
    {
      id: 's5',
      title: 'Prüfe den Baum: Zahl über 255',
      render: (container) => renderEinzelphase(container, semantikUebung(BAUM_RANGE)),
    },
  ],
};

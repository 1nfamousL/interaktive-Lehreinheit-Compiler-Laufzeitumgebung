import { render as renderCompilerWeg } from '../../js/exercises/compiler-weg.js';
import { regelnPopupHtml } from '../../js/grammatik.js';
import { grammatik } from './5-3.js';


// Die Sprache aus den Kapiteln 2 bis 5 (Roboterbefehle, Variablen, if, while)
const SCHLUESSELWOERTER = ['number', 'boolean', 'if', 'while', 'moveUp', 'moveDown', 'moveRight', 'moveLeft'];
const LITERALWOERTER = ['true', 'false'];

// Beispiel für das Eingabefeld: Deklaration, Schleife, Zuweisung und Verzweigung,
// ohne Fehler (der Roboter fährt von der Mitte zwei Felder nach rechts, dann eins zurück)
const BEISPIEL = [
  'number x = 2;',
  'while (x > 0) {',
  '    moveRight(1);',
  '    x = x - 1;',
  '}',
  'if (2 > x) {',
  '    moveLeft(1);',
  '}',
].join('\n');

// Regeln für das Pop-up der semantischen Analyse: alle Regeln der Sprache
const SEMANTIK_REGELN = `
  <div class="modal-abschnitt">Werte und Ausdrücke</div>
  <p><strong>Zahl</strong> → Typ number<span class="regel-satz">Jede Zahl hat den Typ number und liegt zwischen 0 und 255.</span></p>
  <p><strong>true, false</strong> → Typ boolean</p>
  <p><strong>Variable</strong> → Typ aus der Symboltabelle<span class="regel-satz">Eine Variable muss deklariert und an dieser Stelle sichtbar sein. Ihr Typ steht in der Symboltabelle.</span></p>
  <p><strong>Rechnen</strong> (+ - * /) → Typ number<span class="regel-satz">Beide Seiten müssen vom Typ number sein.</span></p>
  <p><strong>Vergleichen</strong> (&lt; &gt; &lt;= &gt;=) → Typ boolean<span class="regel-satz">Beide Seiten müssen vom Typ number sein.</span></p>
  <p><strong>Gleichheit</strong> (== !=) → Typ boolean<span class="regel-satz">Beide Seiten müssen denselben Typ haben.</span></p>
  <div class="modal-abschnitt">Anweisungen</div>
  <p><strong>Deklaration</strong> → Eintrag in der Symboltabelle<span class="regel-satz">Der Name darf noch nicht sichtbar sein, auch nicht in einem äußeren Bereich. Der Typ des Ausdrucks muss zum deklarierten Typ passen.</span></p>
  <p><strong>Zuweisung</strong><span class="regel-satz">Die Variable muss deklariert sein, und der Typ des Ausdrucks muss zu ihrem Typ passen.</span></p>
  <p><strong>Bewegung</strong> → Argument ist number<span class="regel-satz">Das Argument einer Bewegung muss vom Typ number sein.</span></p>
  <p><strong>if und while</strong> → Bedingung ist ein boolean<span class="regel-satz">Die Bedingung muss vom Typ boolean sein.</span></p>
  <div class="modal-abschnitt">Blöcke</div>
  <p><strong>Block</strong> → eigener Bereich<span class="regel-satz">Jeder Block bekommt beim Betreten einen eigenen Bereich in der Symboltabelle und verliert ihn beim Verlassen wieder. Variablen aus einem Block sind außerhalb nicht sichtbar.</span></p>
`;

const WEG_KONFIG = {
  beispiel: BEISPIEL,
  schluesselwoerter: SCHLUESSELWOERTER,
  literalwoerter: LITERALWOERTER,
  // Hindernisse { c, r } ab 0 (Spalte, Zeile), der Roboter startet auf 3/3. Das Beispiel
  // fährt nur in Zeile 3 und kommt an keinem vorbei.
  hindernisse: [{ c: 1, r: 1 }, { c: 4, r: 1 }, { c: 1, r: 5 }, { c: 4, r: 5 }],
  hinweisKategorien: 'Ist es ein festes Wort der Sprache, ein selbst gewählter Name, ein Wert, ein Rechen-, Zuweisungs- oder Vergleichszeichen oder ein Zeichen zum Gliedern?',
  // Je Zeile ein langer und ein kurzer Chip, damit die Zeilen etwa gleich breit sind
  ablage: ['Anweisung', 'Zuweisung', 'Deklaration', 'Ausdruck', 'While-Anweisung', 'Block', 'If-Anweisung', 'Bewegung'],
  regelnHtml: regelnPopupHtml(grammatik()),
  regelnSemantik: SEMANTIK_REGELN,
};

export const LEKTION = {
  id: '6-2',
  title: '6.2 Dein eigenes Programm',
  desc: 'Schreib ein eigenes Programm und schick es durch alle Phasen bis zum laufenden Roboter.',
  slides: [
    {
      id: 's1',
      title: 'Alles kommt zusammen',
      text: [
        'Jetzt kommt alles zusammen. Du schreibst ein eigenes Programm und schickst es durch alle Phasen des Compilers, von der lexikalischen Analyse bis zur Laufzeitumgebung. Jede Phase übernimmst du selbst, so wie in den Kapiteln davor. Enthält dein Programm einen Fehler, bleibt es in der Phase hängen, die ihn findet, und du kannst den Quellcode ändern.',
        'Dein Programm darf höchstens 200 Zeichen lang sein. In den Phasen 2 bis 5 erledigt „Phase lösen“ oben rechts die ganze Phase für dich. Wenn du nicht weiterkommst, erscheint außerdem „Schritt vormachen“ und erledigt einen einzelnen Schritt.',
      ],
    },
    {
      id: 's2',
      title: 'Durchlaufe alle Phasen',
      render: (container) => renderCompilerWeg(container, {
        ...WEG_KONFIG,
      }),
    },
  ],
};

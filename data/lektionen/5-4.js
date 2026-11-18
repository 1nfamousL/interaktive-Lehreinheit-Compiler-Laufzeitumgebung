import { render as renderEinzelphase } from '../../js/exercises/einzelphase.js';
import { prog, dek, zuw, bew, while_, op, zahl, variable } from '../../js/exercises/compiler-weg-semantik-regeln.js';

// Übung "Werde zur semantischen Analyse": das Programm der Übungen davor, aber mit einer
// zweiten Variable schritt vor der Schleife. Im Rumpf wird schritt noch einmal deklariert,
// der Name ist dort aus dem äußeren Bereich schon sichtbar (duplicate). Der Fehler tritt im
// Rumpf auf, bevor der Bereich geschlossen wird. Dass ein Name aus dem Block draußen nicht
// mehr sichtbar ist (undeclared), steht nur als Text in 4.4.
const SEMANTIK_BAUM = () => prog(
  dek('number', 'n', zahl(3)),
  dek('number', 'schritt', zahl(1)),
  while_(
    op('>', variable('n'), zahl(0)),
    // Fehler duplicate: „schritt“ ist aus dem äußeren Bereich schon sichtbar
    dek('number', 'schritt', zahl(1)),
    bew('rechts', variable('schritt')),
    bew('oben', zahl(1)),
    zuw('n', op('-', variable('n'), zahl(1))),
  ),
);

// Regeln für das Pop-up der Übung. Es stehen alle Regeln der Sprache da.
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

// Einzeiliger Quellcode im Text (Papier-Darstellung, siehe .code-papier)
const code = (text) => `<span class="code-papier">${text}</span>`;

export const LEKTION = {
  id: '5-4',
  title: '5.4 Semantik: Sichtbarkeit im Schleifenrumpf',
  desc: 'Ein Name, der außen schon vergeben ist, darf im Schleifenrumpf nicht noch einmal deklariert werden.',
  slides: [
    {
      id: 's1',
      title: 'Was ist neu?',
      text: [
        `Für die while-Anweisung gelten dieselben Regeln wie für if. Die Bedingung muss ein Wahrheitswert sein, eine Zahl als Bedingung wie in ${code('while (n) {')} ist ein Typfehler. Der Rumpf ist ein Block und hat wie jeder Block seinen eigenen Gültigkeitsbereich.`,
      ],
    },
    {
      id: 's2',
      title: 'Prüfe den Baum: Name im Rumpf doppelt',
      render: (container) => renderEinzelphase(container, {
        phase: 'semantik',
        baum: SEMANTIK_BAUM,
        typen: ['number', 'boolean'],
        fehler: ['range', 'undeclared', 'duplicate', 'type'],
        symboltabelle: true,
        bereiche: true,
        regelnHtml: SEMANTIK_REGELN,
      }),
    },
  ],
};

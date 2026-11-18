import { render as renderEinzelphase } from '../../js/exercises/einzelphase.js';
import { zeigeBaum } from '../../js/baum-abbildung.js';
import { prog, dek, zuw, bew, op, zahl, variable } from '../../js/exercises/compiler-weg-semantik-regeln.js';

// Übung "Werde zum Codegenerator": dasselbe Programm wie in den Übungen davor.
// Musterlösung und Bausteine erzeugt einzelphase.js aus dem Baum, die Adressen sind
// relativ wie in 6.2 mit Fächern: (D1) für weg, (Z1) … für die Zeilen.
// Das Flag ist ausgeblendet, Vergleiche gibt es erst in Kapitel 4.
const QUELLTEXT = [
  'number weg = 4 + 3;',
  'weg = 10 - weg;',
  'moveRight(weg);',
].join('\n');

const BAUM = () => prog(
  dek('number', 'weg', op('+', zahl(4), zahl(3))),
  zuw('weg', op('-', zahl(10), variable('weg'))),
  bew('rechts', variable('weg')),
);

// Zweite Übung: Kopieren und Multiplizieren. number weg = a; ist das Muster x = y
// (Wert über ein Register von Zelle zu Zelle), weg = weg * a; braucht *.
// (D1) für a, (D2) für weg. Der Roboter fährt vier nach rechts.
const QUELLTEXT_KOPIE = [
  'number a = 2;',
  'number weg = a;',
  'weg = weg * a;',
  'moveRight(weg);',
].join('\n');

const BAUM_KOPIE = () => prog(
  dek('number', 'a', zahl(2)),
  dek('number', 'weg', variable('a')),
  zuw('weg', op('*', variable('weg'), variable('a'))),
  bew('rechts', variable('weg')),
);

// Hilfsfunktionen für den Text wie in 2.5: Befehle als farbige Bausteine (Gruppen wie in maschine.js:
// xfer = mov, calc = Rechnen, move = Bewegung, halt = end), Programmteile auf Papier, Adressen von
// Datenzellen als dunkles Feld
const befehl = (gruppe, text) => `<span class="cg-block cg-${gruppe} cg-ohne-symbol cg-inline">${text}</span>`;
const code = (text) => `<span class="code-papier">${text}</span>`;

// Beispiel für die Abbildung auf Folie 3, zu "number x = 2; number y = x * 3;": bewusst nicht das
// Programm der ersten Übung (sonst wäre deren Lösung verraten), aber mit denselben Mustern. Der
// abstrakte Syntaxbaum wie in 3.4, die Befehle dazu stehen im Text der Folie.
const BEISPIEL_BAUM = {
  nt: 'Programm',
  kinder: [
    { nt: 'Deklaration (number, x)', kinder: [{ t: '2' }] },
    {
      nt: 'Deklaration (number, y)',
      kinder: [{ nt: 'Operation (*)', kinder: [{ t: 'x' }, { t: '3' }] }],
    },
  ],
};

export const LEKTION = {
  id: '3-5',
  title: '3.5 Codegenerierung: Rechnen mit Registern',
  desc: 'Register A und B und die Rechenbefehle.',
  slides: [
    {
      id: 's1',
      title: 'Was ist neu?',
      render: (container) => {
        container.innerHTML = `
          <div class="slide-centered slide-lesbar">
            <p>Der Compiler erzeugt wie in Kapitel 2 Maschinencode mit relativen Adressen. Eine Zuweisung übersetzt er genauso wie eine Deklaration, nämlich in einen ${befehl('xfer', 'mov')}-Befehl, der eine Zahl in eine Datenzelle schreibt: ${befehl('xfer', 'mov 5 → (D1)')}. Der Unterschied liegt nur in der Datenzelle: Bei der Deklaration vergibt der Compiler eine neue, bei der Zuweisung schreibt ${befehl('xfer', 'mov')} in die Datenzelle einer Variablen, die es schon gibt.</p>
            <p>Neu ist, dass der Compiler auch Rechnungen übersetzen muss. Dafür gibt es für jede Rechenart einen eigenen Befehl: ${befehl('calc', '+')}, ${befehl('calc', '-')}, ${befehl('calc', '*')} und ${befehl('calc', '/')}. Diese Befehle brauchen aber eine neue Art von Speicher, denn die CPU kann Werte im Datenspeicher nicht direkt verrechnen.</p>
            <p>Dieser Speicher sind die <strong>Register</strong>: Zwischenspeicher direkt in der CPU. Sie sind deutlich schneller als der Datenspeicher, aber es gibt nur sehr wenige. Unser Roboter hat zwei, sie heißen A und B. Vergleich: Der Datenspeicher ist ein Regal, in dem Dinge lagern. Das Register ist die Arbeitsfläche, auf die man sie legt, um damit zu arbeiten.</p>
          </div>
        `;
      },
    },
    {
      id: 's2',
      title: 'Rechenbefehle und mov',
      render: (container) => {
        container.innerHTML = `
          <div class="slide-centered slide-lesbar">
            <p>Ein Rechenbefehl hat zwei Parameter. Der erste ist immer ein Register, denn dort wird auch das Ergebnis hineingeschrieben. Der zweite ist entweder eine Zahl, die direkt im Befehl steht (im Programmspeicher), oder ein zweites Register, wenn der Wert aus einer Variablen kommt. ${befehl('calc', '+ A, 3')} rechnet den Wert in A + 3, ${befehl('calc', '- A, B')} rechnet den Wert in A − den Wert in B. Das Ergebnis bleibt jeweils im ersten Register.</p>
            <p>Damit die Werte überhaupt in die Register kommen, nutzt der Compiler wieder den Befehl ${befehl('xfer', 'mov')}. Er kann jetzt auch Register verwenden: ${befehl('xfer', 'mov (D1) → A')} lädt den Wert einer Datenzelle in ein Register, ${befehl('xfer', 'mov A → (D2)')} schreibt ihn zurück in eine Datenzelle, ${befehl('xfer', 'mov 3 → B')} legt eine Zahl direkt in ein Register.</p>
          </div>
        `;
      },
    },
    {
      id: 's3',
      title: 'Vom Baum zum Maschinencode',
      // Text oben, darunter links der abstrakte Syntaxbaum eines Beispiels und rechts die Befehle mit ihrer
      // Erklärung. Das Beispiel ist bewusst nicht das Programm der ersten Übung, sonst wäre ihre Lösung
      // verraten.
      render: (container) => {
        container.innerHTML = `
          <div class="slide-centered slide-lesbar">
            <p>Hier der Weg vom Baum zum Maschinencode für das Programm: ${code('number x = 2; number y = x * 3;')}</p>
            <div class="slide-split">
              <div class="slide-split-figure"></div>
              <div class="slide-split-text slide-centered">
                <p>(Z1) ${befehl('xfer', 'mov 2 → (D1)')} Die Deklaration von x bekommt eine neue Datenzelle, die Zahl 2 kommt direkt hinein.</p>
                <p>(Z2) ${befehl('xfer', 'mov (D1) → A')} Für die Rechnung wird der linke Wert, x, in das Register A geladen.</p>
                <p>(Z3) ${befehl('calc', '* A, 3')} Das Rechenwerk rechnet. Die 3 steht direkt im Befehl, das Ergebnis bleibt in A. Stünde rechts eine Variable statt einer Zahl, würde der Compiler auch sie in ein Register laden, und zwar in B.</p>
                <p>(Z4) ${befehl('xfer', 'mov A → (D2)')} Die Deklaration von y bekommt eine neue Datenzelle, das Ergebnis aus A kommt hinein.</p>
                <p>(Z5) ${befehl('halt', 'end')} Das Programm ist zu Ende.</p>
              </div>
            </div>
          </div>
        `;
        return zeigeBaum(container.querySelector('.slide-split-figure'), BEISPIEL_BAUM, { ast: true });
      },
    },
    {
      id: 's4',
      title: 'Übersetze den Code: Rechnen mit Registern',
      render: (container) => renderEinzelphase(container, {
        phase: 'codegen',
        baum: BAUM,
        quelltext: QUELLTEXT,
        // Startfeld 1/3 im 6×6-Spielfeld, der Roboter fährt drei nach rechts
        start: { c: 1, r: 3 },
        hindernisse: [{ c: 2, r: 1 }, { c: 4, r: 4 }, { c: 1, r: 5 }],
        sichtbar: { flag: false },
      }),
    },
    {
      id: 's5',
      title: 'Übersetze den Code: Kopieren und Multiplizieren',
      render: (container) => renderEinzelphase(container, {
        phase: 'codegen',
        baum: BAUM_KOPIE,
        quelltext: QUELLTEXT_KOPIE,
        // Startfeld 1/3 im 6×6-Spielfeld, der Roboter fährt vier nach rechts
        start: { c: 1, r: 3 },
        hindernisse: [{ c: 2, r: 1 }, { c: 4, r: 4 }, { c: 1, r: 5 }],
        sichtbar: { flag: false },
      }),
    },
  ],
};

import { render as renderEinzelphase } from '../../js/exercises/einzelphase.js';
import { prog, dek, bew, if_, op, zahl, wahrheit, variable } from '../../js/exercises/compiler-weg-semantik-regeln.js';

// Übung "Werde zum Codegenerator": dasselbe Programm wie in den Übungen davor.
// Musterlösung und Bausteine erzeugt einzelphase.js aus dem Baum, die Adressen sind
// relativ wie in 6.2 mit Fächern: (D1) für schritte, (D2) für weit, (Z1) … für die Zeilen.
const QUELLTEXT = [
  'number schritte = 3;',
  'boolean weit = false;',
  'if (schritte > 2) {',
  '    moveUp(1);',
  '}',
  'if (weit == true) {',
  '    moveRight(schritte);',
  '}',
].join('\n');

const BAUM = () => prog(
  dek('number', 'schritte', zahl(3)),
  dek('boolean', 'weit', wahrheit('false')),
  if_(op('>', variable('schritte'), zahl(2)), bew('oben', zahl(1))),
  if_(op('==', variable('weit'), wahrheit('true')), bew('rechts', variable('schritte'))),
);

// Zweite Übung: Wahrheitswerte. Der Vergleich als Wert (boolean weit = schritte > 2;)
// braucht ein Gerüst aus jif und zwei mov, weil sich das Flag nicht kopieren lässt.
// if (weit) hat keinen Vergleich: die Variable wird mit 0 verglichen.
// Das Muster mit if und umgekehrtem Operator kennt der Spieler aus der ersten Übung,
// deshalb steht hier nur ein if (12 statt 16 Zeilen). (D1) für schritte, (D2) für weit.
const QUELLTEXT_WERT = [
  'number schritte = 3;',
  'boolean weit = schritte > 2;',
  'if (weit) {',
  '    moveRight(schritte);',
  '}',
].join('\n');

const BAUM_WERT = () => prog(
  dek('number', 'schritte', zahl(3)),
  dek('boolean', 'weit', op('>', variable('schritte'), zahl(2))),
  if_(variable('weit'), bew('rechts', variable('schritte'))),
);

// Hilfsfunktionen für den Text wie in 2.5 und 3.5: Befehle als farbige Bausteine (Gruppen wie in
// maschine.js: xfer = mov, cmp = Vergleich, jump = Sprung, move = Bewegung, halt = end) und
// Programmteile auf Papier
const befehl = (gruppe, text) => `<span class="cg-block cg-${gruppe} cg-ohne-symbol cg-inline">${text}</span>`;
const code = (text) => `<span class="code-papier">${text}</span>`;

export const LEKTION = {
  id: '4-5',
  title: '4.5 Codegenerierung: Vergleiche und Sprünge',
  desc: 'Vergleiche setzen das Flag, jif springt hinter den Block.',
  slides: [
    {
      id: 's1',
      title: 'Was ist neu?',
      render: (container) => {
        container.innerHTML = `
          <div class="slide-centered slide-lesbar">
            <p>Der Compiler erzeugt wie bisher Maschinencode mit relativen Adressen. Neu ist, dass das Programm nicht mehr nur von oben nach unten läuft: Ein Block soll nur ausgeführt werden, wenn eine Bedingung stimmt. Dafür braucht die CPU zwei neue Dinge, ein Flag und Sprungbefehle.</p>
            <p>Das <strong>Flag</strong> ist ein weiterer Zwischenspeicher in der CPU, neben den Registern. Es kennt nur zwei Zustände: gesetzt (wahr) oder nicht gesetzt (falsch).</p>
            <p>Gesetzt wird es von den <strong>Vergleichsbefehlen</strong>. Es gibt für jeden Vergleichsoperator einen: ${befehl('cmp', '&lt;')} ${befehl('cmp', '&gt;')} ${befehl('cmp', '&lt;=')} ${befehl('cmp', '&gt;=')} ${befehl('cmp', '==')} ${befehl('cmp', '!=')}. Sie haben zwei Parameter, jeder ist eine Zahl oder ein Register. Ein Vergleichsbefehl schreibt in kein Register, er setzt nur das Flag: ${befehl('cmp', '&gt;= A, 5')} setzt es, wenn der Wert in A größer oder gleich 5 ist.</p>
            <p>Eine Zahl steht direkt im Befehl. Eine Variable muss der Compiler vorher mit ${befehl('xfer', 'mov')} in ein Register laden, denn Vergleichsbefehle lesen den Datenspeicher nicht.</p>
            <p>Auch Wahrheitswerte müssen im Speicher stehen. Der Compiler speichert ${code('true')} als 1 und ${code('false')} als 0.</p>
          </div>
        `;
      },
    },
    {
      id: 's2',
      title: 'Sprünge und if',
      render: (container) => {
        container.innerHTML = `
          <div class="slide-centered slide-lesbar">
            <p>Normalerweise liest die CPU einen Befehl nach dem anderen. Ein <strong>Sprungbefehl</strong> setzt stattdessen den Befehlszähler auf eine andere Zeile, die als Ziel im Befehl steht. ${befehl('jump', 'jmp (Z4)')} springt immer. ${befehl('jump', 'jif (Z4)')} springt nur, wenn das Flag gesetzt ist, sonst geht es mit dem nächsten Befehl weiter.</p>
            <p>Damit lässt sich eine if-Anweisung übersetzen. Ist die Bedingung falsch, soll der Block <strong>übersprungen</strong> werden. Weil ${befehl('jump', 'jif')} bei gesetztem Flag springt, muss das Flag bei einer falschen Bedingung gesetzt sein. Der Compiler vergleicht deshalb mit dem <strong>umgekehrten Operator</strong>: Aus ${befehl('cmp', '&lt;')} wird ${befehl('cmp', '&gt;=')}, aus ${befehl('cmp', '&gt;')} wird ${befehl('cmp', '&lt;=')}, aus ${befehl('cmp', '==')} wird ${befehl('cmp', '!=')}, und jeweils umgekehrt.</p>
            <p>Der Block selbst erzeugt keinen eigenen Code, nur seine Anweisungen. Hier der Weg für das Programm: ${code('number x = 2; if (x &lt; 5) { moveLeft(1); }')}</p>
            <p>(Z1) ${befehl('xfer', 'mov 2 → (D1)')} Die Deklaration von x bekommt eine neue Datenzelle, die Zahl 2 kommt direkt hinein.</p>
            <p>(Z2) ${befehl('xfer', 'mov (D1) → A')} Für den Vergleich wird x in das Register A geladen.</p>
            <p>(Z3) ${befehl('cmp', '&gt;= A, 5')} Die Bedingung ist x &lt; 5, der Compiler vergleicht mit dem umgekehrten Operator. Das Flag ist gesetzt, wenn die Bedingung falsch ist.</p>
            <p>(Z4) ${befehl('jump', 'jif (Z6)')} Ist das Flag gesetzt, springt die CPU hinter den Block.</p>
            <p>(Z5) ${befehl('move', 'lft 1')} Der Block. Hier kommt die CPU nur hin, wenn die Bedingung wahr war.</p>
            <p>(Z6) ${befehl('halt', 'end')} Das Programm ist zu Ende.</p>
            <p>Auf der nächsten Folie setzt du den Maschinencode wieder aus Bausteinen zusammen.</p>
          </div>
        `;
      },
    },
    {
      id: 's3',
      title: 'Übersetze den Code: Vergleiche und Sprünge',
      render: (container) => renderEinzelphase(container, {
        phase: 'codegen',
        baum: BAUM,
        quelltext: QUELLTEXT,
        // Startfeld 1/3 im 6×6-Spielfeld, der Roboter fährt eins nach oben, weit ist false
        // und der zweite Block wird übersprungen
        start: { c: 1, r: 3 },
        hindernisse: [{ c: 2, r: 4 }, { c: 4, r: 4 }, { c: 5, r: 1 }],
      }),
    },
    {
      id: 's4',
      title: 'Wahrheitswerte',
      render: (container) => {
        container.innerHTML = `
          <div class="slide-centered slide-lesbar">
            <p>Ein Vergleich kann auch als Wert in einer Variablen gespeichert werden. Das Flag lässt sich aber nicht in eine Datenzelle kopieren. Deshalb fragt der Compiler das Flag mit ${befehl('jump', 'jif')} ab und schreibt selbst die 0 oder die 1. Hier der Weg für das Programm: ${code('number x = 2; boolean ok = x &lt;= 4;')}</p>
            <p>(Z1) ${befehl('xfer', 'mov 2 → (D1)')} (Z2) ${befehl('xfer', 'mov (D1) → A')} Wie gewohnt: Deklaration und x in das Register A laden.</p>
            <p>(Z3) ${befehl('cmp', '&lt;= A, 4')} Der Vergleich. Der Operator wird hier nicht umgekehrt, denn das Flag soll gesetzt sein, wenn der Vergleich wahr ist.</p>
            <p>(Z4) ${befehl('jump', 'jif (Z7)')} Ist das Flag gesetzt, springt die CPU zur 1.</p>
            <p>(Z5) ${befehl('xfer', 'mov 0 → (D2)')} Der Vergleich war falsch, die 0 kommt in die Zelle von ok.</p>
            <p>(Z6) ${befehl('jump', 'jmp (Z8)')} Die 1 darf nicht auch noch geschrieben werden, deshalb springt die CPU dahinter.</p>
            <p>(Z7) ${befehl('xfer', 'mov 1 → (D2)')} Der Vergleich war wahr, die 1 kommt in die Zelle von ok.</p>
            <p>(Z8) ${befehl('halt', 'end')} Das Programm ist zu Ende.</p>
            <p>Steht in einer if-Anweisung nur ein Wahrheitswert, zum Beispiel ${code('if (ok)')}, gibt es keinen Vergleich. Der Compiler lädt die Variable in ein Register und vergleicht sie mit 0: ${befehl('cmp', '== A, 0')} setzt das Flag, wenn die Variable falsch ist. Danach springt ${befehl('jump', 'jif')} wie gewohnt hinter den Block.</p>
          </div>
        `;
      },
    },
    {
      id: 's5',
      title: 'Übersetze den Code: Wahrheitswerte',
      render: (container) => renderEinzelphase(container, {
        phase: 'codegen',
        baum: BAUM_WERT,
        quelltext: QUELLTEXT_WERT,
        // Startfeld 1/3 im 6×6-Spielfeld, der Roboter fährt drei nach rechts
        start: { c: 1, r: 3 },
        hindernisse: [{ c: 2, r: 4 }, { c: 4, r: 4 }, { c: 5, r: 1 }],
      }),
    },
  ],
};

import { render as renderEinzelphase } from '../../js/exercises/einzelphase.js';
import { prog, dek, bew, zahl, variable } from '../../js/exercises/compiler-weg-semantik-regeln.js';
import { zeigeBaum } from '../../js/baum-abbildung.js';

// Übung "Werde zum Codegenerator": dasselbe Programm wie in den Übungen davor.
// Musterlösung und Bausteine erzeugt einzelphase.js aus dem Baum, die Adressen sind
// relativ wie in 6.2 mit Fächern: (D1) für schritte, (Z1) … für die Zeilen.
// Register und Flag sind ausgeblendet: Bewegungsbefehle lesen die Anzahl direkt aus
// der Datenzelle, Rechnen kommt erst in Kapitel 3, Vergleiche in Kapitel 4.
const QUELLTEXT = [
  'number schritte = 2;',
  'moveRight(schritte);',
  'moveUp(1);',
].join('\n');

const BAUM = () => prog(
  dek('number', 'schritte', zahl(2)),
  bew('rechts', variable('schritte')),
  bew('oben', zahl(1)),
);

// Zweite Übung: zwei Konstanten, damit jede Deklaration ihre eigene Datenzelle bekommt
// ((D1) für schritte, (D2) für hoch). Beide Bewegungen lesen ihre Anzahl aus einer Zelle.
const QUELLTEXT_ZWEI = [
  'number schritte = 2;',
  'number hoch = 1;',
  'moveRight(schritte);',
  'moveUp(hoch);',
].join('\n');

const BAUM_ZWEI = () => prog(
  dek('number', 'schritte', zahl(2)),
  dek('number', 'hoch', zahl(1)),
  bew('rechts', variable('schritte')),
  bew('oben', variable('hoch')),
);

// Hilfsfunktionen für den Text. Befehle, von denen als Ganzes die Rede ist, stehen als farbige Bausteine
// (Gruppen wie in maschine.js: xfer = mov, move = Bewegung, halt = end). Adressen von Datenzellen und
// echte Adressen wie die Adresse eines Fachs (dunkles Feld, grau), Zeilen (Z1) nicht: sie haben mit
// Speicher noch nichts zu tun.
const befehl = (gruppe, text) => `<span class="cg-block cg-${gruppe} cg-ohne-symbol cg-inline">${text}</span>`;
const adresse = (text) => `<span class="lz-fach-inline lz-fach-adr">${text}</span>`;

// Beispiel für die Abbildung auf Folie 4, zu "number weg = 3; moveLeft(weg); moveDown(2);": bewusst
// nicht das Programm der ersten Übung (sonst wäre deren Lösung verraten), aber mit derselben
// Struktur. Der abstrakte Syntaxbaum wie in 2.4, daneben der Maschinencode dazu.
const BEISPIEL_BAUM = {
  nt: 'Programm',
  kinder: [
    { nt: 'Deklaration (number, weg)', kinder: [{ t: '3' }] },
    { nt: 'moveLeft', kinder: [{ t: 'weg' }] },
    { nt: 'moveDown', kinder: [{ t: '2' }] },
  ],
};
const BEISPIEL_MASCHINENCODE = [
  ['(Z1)', 'xfer', 'mov 3 → (D1)'],
  ['(Z2)', 'move', 'lft (D1)'],
  ['(Z3)', 'move', 'dwn 2'],
  ['(Z4)', 'halt', 'end'],
];

export const LEKTION = {
  id: '2-5',
  title: '2.5 Codegenerierung: Vom Baum zum Maschinencode',
  desc: 'Vom Baum zum Maschinencode mit relativen Adressen.',
  slides: [
    {
      id: 's1',
      title: 'Was ist das?',
      text: [
        'Vierter und letzter Schritt des Compilers. Der Syntaxbaum ist geprüft: Das Programm ist richtig geschrieben, richtig aufgebaut und ergibt Sinn.',
        'Jetzt erzeugt der Compiler daraus Maschinencode, also Befehle, die der Roboter direkt ausführen kann.',
        `Den Befehlssatz, also alle Befehle unserer Maschinensprache, kennst du aus Kapitel 1: ${befehl('xfer', 'mov Wert → Ziel')} kopiert einen Wert in eine Datenzelle, ${befehl('move', 'rgt')} ${befehl('move', 'lft')} ${befehl('move', 'up')} ${befehl('move', 'dwn')} bewegen den Roboter, und ${befehl('halt', 'end')} beendet das Programm.`,
        `Ein Bewegungsbefehl bekommt seine Anzahl entweder direkt als Zahl (${befehl('move', 'up 1')}) oder aus einer Datenzelle (${befehl('move', 'rgt (D1)')}).`,
      ],
    },
    {
      id: 's2',
      title: 'Relative Adressen',
      text: [
        'Der Compiler weiß nicht, wo im Speicher das Programm später liegen wird. Deshalb schreibt er keine echten Adressen, sondern Namen, die nur innerhalb des Programms gelten. Runde Klammern bedeuten „relativ“:',
        `<strong>Zeilen</strong> heißen (Z1), (Z2), …<br><strong>Datenzellen</strong> heißen ${adresse('(D1)')}, ${adresse('(D2)')}, …, eine pro deklariertem Namen.`,
        `Die echten Adressen in eckigen Klammern wie ${adresse('[08]')} setzt erst die Laufzeitumgebung ein, wenn sie das Programm in den Speicher lädt.`,
      ],
    },
    {
      id: 's3',
      title: 'Vom Baum zum Maschinencode',
      // Text links, abstrakter Syntaxbaum und Maschinencode eines Beispiels rechts (Layout wie in 2.3,
      // Folie 3). Das Beispiel ist bewusst nicht das Programm der ersten Übung, sonst wäre ihre Lösung
      // verraten.
      render: (container) => {
        container.innerHTML = `
          <div class="slide-split">
            <div class="slide-split-text slide-centered slide-lesbar">
              <p>Der Compiler geht den Baum von oben nach unten durch, in der Reihenfolge der Anweisungen.</p>
              <p>Eine <strong>Deklaration</strong> bekommt eine neue Datenzelle und einen ${befehl('xfer', 'mov')}-Befehl, der den Wert dort ablegt. Eine <strong>Bewegung</strong> wird ein einzelner Bewegungsbefehl.</p>
              <p>Am Ende setzt der Compiler ein ${befehl('halt', 'end')}. Ohne ${befehl('halt', 'end')} wüsste die CPU nicht, wann das Programm zu Ende ist. Sie würde hinter dem letzten Befehl weiterlesen und alles, was dort im Speicher steht, als Befehl ausführen.</p>
              <p><strong>Wichtig:</strong> Der Maschinencode muss genau dasselbe tun wie der Quellcode. Dafür übersetzt der Compiler jeden Teil des Baums nach einem festen Muster. Steht in einer Bewegung ein Name, liest der Bewegungsbefehl die Anzahl aus dieser Datenzelle, so wie es im Quellcode steht. Der Compiler übersetzt also, was dasteht. Auch die Datenzellen vergibt der Compiler systematisch, zum Beispiel in der Reihenfolge der Deklarationen.</p>
            </div>
            <div class="slide-split-figure">
              <div class="codegen-abbildung">
                <div class="codegen-baum"></div>
                <div class="robot-build lz-prog">
                  <div class="robot-ref-title">Maschinencode</div>
                  ${BEISPIEL_MASCHINENCODE.map(([zeile, gruppe, text]) => `
                  <div class="robot-mrow lz-row">
                    <span class="robot-lineno">${zeile}</span>
                    <div class="robot-mblock-placed cg-block cg-${gruppe} cg-ohne-symbol"><span class="cg-name">${text}</span></div>
                  </div>`).join('')}
                </div>
              </div>
            </div>
          </div>
        `;
        return zeigeBaum(container.querySelector('.codegen-baum'), BEISPIEL_BAUM, { ast: true });
      },
    },
    {
      id: 's4',
      title: 'Jetzt bist du dran',
      text: [
        'Auf den nächsten Folien übernimmst du die Arbeit des Codegenerators. Der Compiler geht dafür den Baum durch. In der Übung siehst du stattdessen den Quellcode, damit du den Bezug zum Programm behältst: Du liest den Quellcode und setzt aus den Bausteinen den passenden Maschinencode zusammen. Anders als der Compiler darfst du selbst entscheiden, welche Datenzelle du für welche Konstante verwendest. Für jede Deklaration steht dir eine Zelle zur Verfügung.',
      ],
    },
    {
      id: 's5',
      title: 'Übersetze den Code: Konstante und Bewegungen',
      render: (container) => renderEinzelphase(container, {
        phase: 'codegen',
        baum: BAUM,
        quelltext: QUELLTEXT,
        // Startfeld 2/3 im 6×6-Spielfeld, der Roboter fährt zwei nach rechts und eins nach oben
        start: { c: 2, r: 3 },
        hindernisse: [{ c: 2, r: 1 }, { c: 5, r: 1 }, { c: 1, r: 4 }, { c: 4, r: 5 }],
        sichtbar: { register: false, flag: false },
      }),
    },
    {
      id: 's6',
      title: 'Übersetze den Code: Zwei Konstanten',
      render: (container) => renderEinzelphase(container, {
        phase: 'codegen',
        baum: BAUM_ZWEI,
        quelltext: QUELLTEXT_ZWEI,
        // Startfeld 2/3 im 6×6-Spielfeld, der Roboter fährt zwei nach rechts und eins nach oben
        start: { c: 2, r: 3 },
        hindernisse: [{ c: 2, r: 1 }, { c: 5, r: 1 }, { c: 1, r: 4 }, { c: 4, r: 5 }],
        sichtbar: { register: false, flag: false },
      }),
    },
  ],
};

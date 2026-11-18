import { render as renderEinzelphase } from '../../js/exercises/einzelphase.js';
import { render as renderPhasenZuordnung } from '../../js/exercises/phasen-zuordnung.js';
import { ZIELE, GRUPPEN, kartenBis, kartenNeuIn } from '../phasenaufgaben.js';
import { prog, dek, bew, zahl, variable } from '../../js/exercises/compiler-weg-semantik-regeln.js';

// Übung "Das Laufzeitsystem": Der Maschinencode zum Programm aus den Übungen davor
// (die Musterlösung aus 2.5) wird geladen und Fach für Fach ausgeführt. Register und
// Flag sind ausgeblendet wie in 2.5.
const BAUM = () => prog(
  dek('number', 'schritte', zahl(2)),
  bew('rechts', variable('schritte')),
  bew('oben', zahl(1)),
);

// Zweite Übung: Hindernis. Das Programm ist dasselbe, aber schritte = 5. Vom Startfeld
// (2,3) aus liegt das Ziel außerhalb des 6×6-Felds, der Roboter fährt gegen die Wand um das
// Spielfeld (auch sie ist ein Hindernis), das Laufzeitsystem hält an.
const BAUM_HINDERNIS = () => prog(
  dek('number', 'schritte', zahl(5)),
  bew('rechts', variable('schritte')),
  bew('oben', zahl(1)),
);

// Hilfsfunktionen für den Text wie in 2.5: Befehle als farbige Bausteine, Programmteile auf Papier,
// Adressen von Datenzellen und echte Adressen wie die Adresse eines Fachs (dunkles Feld, grau)
const befehl = (gruppe, text) => `<span class="cg-block cg-${gruppe} cg-ohne-symbol cg-inline">${text}</span>`;
const code = (text) => `<span class="code-papier">${text}</span>`;
const adresse = (text) => `<span class="lz-fach-inline lz-fach-adr">${text}</span>`;

// Abbildung "Der Lader": ein kurzes Programm (number weg = 3; moveLeft(weg);) als Maschinencode und
// nach dem Laden. Die Fächer: Befehl, dann je ein Fach pro Zahl oder Adresse dahinter. Der
// Datenspeicher beginnt hinter dem letzten Programmfach, hier bei [06].
const MASCHINENCODE = [
  ['(Z1)', 'xfer', 'mov 3 → (D1)'],
  ['(Z2)', 'move', 'lft (D1)'],
  ['(Z3)', 'halt', 'end'],
];
const GELADEN = [
  ['[00]', 'mov'], ['[01]', '3'], ['[02]', '[06]'],
  ['[03]', 'lft'], ['[04]', '[06]'],
  ['[05]', 'end'],
];

export const LEKTION = {
  id: '2-6',
  title: '2.6 Laufzeitumgebung: Laden und Ausführen',
  desc: 'Der Lader legt das Programm in den Speicher, die CPU führt es aus.',
  slides: [
    {
      id: 's1',
      title: 'Übersetzungszeit und Laufzeit',
      text: [
        'Mit dem Maschinencode ist die Arbeit des Compilers beendet. Man unterscheidet deshalb zwei Zeitpunkte: die <strong>Übersetzungszeit</strong>, in der der Compiler arbeitet, und die <strong>Laufzeit</strong>, in der das fertige Programm läuft.',
        'Ausgeführt wird es von der <strong>Laufzeitumgebung</strong>. Bei unserem Roboter ist das die CPU mit dem Speicher aus Kapitel 1.',
        'Fehler, die der Compiler nicht erkennen kann, zeigen sich erst zur Laufzeit. Dann hält die Laufzeitumgebung das Programm an.',
      ],
    },
    {
      id: 's2',
      title: 'Der Lader',
      // Text oben, darunter in vier Spalten: Maschinencode, Pfeil "Lader", Programmspeicher und
      // Datenspeicher nach dem Laden. Das Beispiel ist das aus 2.5, nicht das Programm der Übungen.
      render: (container) => {
        container.innerHTML = `
          <div class="slide-centered slide-lesbar">
            <p>Der Maschinencode kennt nur relative Angaben wie (Z1) und ${adresse('(D1)')}. Bevor die CPU ihn ausführen kann, muss er in den Speicher. Das erledigt der <strong>Lader</strong>: Er legt das Programm in den Programmspeicher und rechnet die relativen Angaben in echte Adressen um.</p>
            <p>Dabei wird jeder Befehl in Fächer zerlegt, eines für den Befehl und je eines für jede Zahl und jede Adresse dahinter. Der Datenspeicher beginnt direkt hinter dem letzten Programmfach. Aus ${adresse('(Dk)')} wird die Adresse Datenanfang + k − 1.</p>
            <p>Im Beispiel liegt das Programm in ${adresse('[00]')} bis ${adresse('[05]')}, der Datenspeicher beginnt bei ${adresse('[06]')}, und aus ${adresse('(D1)')} wird ${adresse('[06]')}.</p>
            <div class="lader-abbildung">
              <div class="robot-build lz-prog">
                <div class="robot-ref-title">Maschinencode</div>
                ${MASCHINENCODE.map(([zeile, gruppe, text]) => `
                <div class="robot-mrow lz-row">
                  <span class="robot-lineno">${zeile}</span>
                  <div class="robot-mblock-placed cg-block cg-${gruppe} cg-ohne-symbol"><span class="cg-name">${text}</span></div>
                </div>`).join('')}
              </div>
              <div class="lader-pfeil" aria-hidden="true"><span>Lader</span>→</div>
              <div class="robot-build lz-prog">
                <div class="robot-ref-title">Programmspeicher</div>
                ${GELADEN.map(([adr, text]) => `
                <div class="robot-mrow lz-row">
                  <div class="robot-mblock-placed lz-fach"><span class="lz-adr-im-fach">${adr}</span><span class="lz-fach-text">${text}</span></div>
                </div>`).join('')}
              </div>
              <div class="robot-card lader-daten">
                <div class="cg-sub cg-mem-title">Datenspeicher</div>
                <div class="cg-mem-grid"><div class="cg-mem-cell lz-feld"><span class="cg-mem-addr">[06]</span><span class="lz-val">&#8203;</span></div></div>
              </div>
            </div>
          </div>
        `;
      },
    },
    {
      id: 's3',
      title: 'Ladefehler',
      text: [
        `Der Speicher unseres Roboters hat 50 Fächer, für Programm und Daten zusammen. Braucht ein Programm mehr, lehnt der Lader es ab, bevor etwas ausgeführt wird. Ein Programm mit 13 Deklarationen (${code('number a1 = 1;')} bis ${code('number a13 = 1;')}) belegt zum Beispiel 53 Fächer.`,
        'Die Sprache kennt keine solche Grenze, nur die Maschine. Der Compiler kennt die Größe des Speichers nicht und meldet deshalb nichts.',
      ],
    },
    {
      id: 's4',
      title: 'Ausführen',
      text: [
        'Die CPU arbeitet jeden Befehl in drei Phasen ab: holen, dekodieren, ausführen. Beim Dekodieren erkennt sie am Befehl, wie viele Fächer dahinter zu ihm gehören, und liest sie. Der Befehlszähler zählt dabei mit jedem gelesenen Fach um eins weiter und zeigt nach dem letzten Fach des Befehls schon auf den nächsten.',
        `Der Datenspeicher ändert sich nur durch ${befehl('xfer', 'mov')}. Die Bewegungsbefehle bewegen den Roboter. Das Fach einer Konstanten wird einmal beschrieben und danach nur noch gelesen. Das Programm ist zu Ende, wenn die CPU auf ${befehl('halt', 'end')} trifft.`,
      ],
    },
    {
      id: 's5',
      title: 'Laufzeitfehler',
      text: [
        'Manche Fehler lassen sich erst zur Laufzeit erkennen. Fährt der Roboter gegen ein Hindernis, hält die Laufzeitumgebung das Programm an. Der Compiler konnte das nicht wissen: Wie groß das Feld ist und wo Hindernisse stehen, weiß nur die Maschine, nicht die Sprache.',
        `Dass die CPU hinter das Programmende läuft, kann dagegen nicht passieren: Der Compiler setzt immer ein ${befehl('halt', 'end')}.`,
        'Auf den nächsten Folien führst du das Programm selbst aus: Du lädst den Maschinencode in den Speicher und lässt die CPU ihn Fach für Fach abarbeiten. Beobachte dabei, wie sich Datenspeicher und Roboter verändern.',
      ],
    },
    {
      id: 's6',
      title: 'Lass den Code laufen: Fach für Fach',
      render: (container) => renderEinzelphase(container, {
        phase: 'laufzeit',
        baum: BAUM,
        // Startfeld 2/3 im 6×6-Spielfeld, wie in 2.5
        start: { c: 2, r: 3 },
        hindernisse: [{ c: 2, r: 1 }, { c: 5, r: 1 }, { c: 1, r: 4 }, { c: 4, r: 5 }],
        sichtbar: { register: false, flag: false },
      }),
    },
    {
      id: 's7',
      title: 'Lass den Code laufen: Hindernis',
      render: (container) => renderEinzelphase(container, {
        phase: 'laufzeit',
        baum: BAUM_HINDERNIS,
        start: { c: 2, r: 3 },
        hindernisse: [{ c: 2, r: 1 }, { c: 5, r: 1 }, { c: 1, r: 4 }, { c: 4, r: 5 }],
        sichtbar: { register: false, flag: false },
        // Der Laufzeitfehler ist beabsichtigt und das Ziel der Übung
        fehlerIstZiel: true,
      }),
    },
    {
      id: 's8',
      title: 'Der ganze Weg im Überblick',
      // Wie "Der Lader": Text als HTML, damit die Folie wie die anderen Textfolien dieser Lektion gebaut ist
      render: (container) => {
        container.innerHTML = `
          <div class="slide-centered slide-lesbar">
            <p>Damit kennst du alle Stationen vom Quellcode bis zum laufenden Programm. Lexikalische Analyse, Syntaxanalyse, semantische Analyse und Codegenerierung bilden den <strong>Compiler</strong> und arbeiten zur Übersetzungszeit. Laden und Ausführen übernimmt danach die <strong>Laufzeitumgebung</strong>, zur Laufzeit.</p>
            <p>Jede Station bekommt etwas von der vorigen und gibt etwas an die nächste weiter: Aus dem Quellcode werden Tokens, daraus ein Syntaxbaum, der geprüft wird, daraus der Maschinencode, und der wird zu einem laufenden Programm.</p>
            <p>Auf der nächsten Folie siehst du diese Kette wieder. Du bekommst nacheinander Karten und ordnest jede der Stelle zu, an die sie gehört. Eine Karte zeigt entweder eine Ein- oder Ausgabe zwischen zwei Phasen, eine Aufgabe, die eine Phase erledigt, oder einen Fehler, der in einer Phase auffällt.</p>
          </div>
        `;
      },
    },
    {
      id: 'zuordnung',
      title: 'Ordne den Phasen zu: Die Phasen im Überblick',
      // Wie 6.1, aber nur mit den Karten, die in diesem Kapitel neu sind. Die früheren liegen schon an ihrem Platz.
      render: (container) => renderPhasenZuordnung(container, {
        ziele: ZIELE,
        gruppen: GRUPPEN,
        karten: kartenNeuIn(2),
        vorbefuellt: kartenBis(1),
      }),
    },
  ],
};

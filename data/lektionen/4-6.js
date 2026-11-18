import { render as renderEinzelphase } from '../../js/exercises/einzelphase.js';
import { render as renderPhasenZuordnung } from '../../js/exercises/phasen-zuordnung.js';
import { ZIELE, GRUPPEN, kartenBis, kartenNeuIn } from '../phasenaufgaben.js';
import { prog, dek, bew, if_, op, zahl, wahrheit, variable } from '../../js/exercises/compiler-weg-semantik-regeln.js';

// Übung "Das Laufzeitsystem": Der Maschinencode zum Programm aus den Übungen davor
// (die Musterlösung aus 4.5) wird geladen und Fach für Fach ausgeführt.
const BAUM = () => prog(
  dek('number', 'schritte', zahl(3)),
  dek('boolean', 'weit', wahrheit('false')),
  if_(op('>', variable('schritte'), zahl(2)), bew('oben', zahl(1))),
  if_(op('==', variable('weit'), wahrheit('true')), bew('rechts', variable('schritte'))),
);

// Hilfsfunktionen für den Text wie in 2.6 und 3.6: Befehle als farbige Bausteine, Programmteile auf Papier
const befehl = (gruppe, text) => `<span class="cg-block cg-${gruppe} cg-ohne-symbol cg-inline">${text}</span>`;
const code = (text) => `<span class="code-papier">${text}</span>`;

export const LEKTION = {
  id: '4-6',
  title: '4.6 Laufzeitumgebung: Flag und Überspringen',
  desc: 'Das Flag und Sprünge: Blöcke werden übersprungen.',
  slides: [
    {
      id: 's1',
      title: 'Sprünge',
      render: (container) => {
        container.innerHTML = `
          <div class="slide-centered slide-lesbar">
            <p>Bisher hat der Befehlszähler beim Lesen jedes Fachs um eins weitergezählt und zeigte nach dem letzten Fach eines Befehls von selbst auf den nächsten. Ein Sprungbefehl ändert das: Er setzt den Befehlszähler auf ein anderes Fach. ${befehl('jump', 'jmp')} tut das immer, ${befehl('jump', 'jif')} nur, wenn das Flag gesetzt ist. Sonst zählt der Befehlszähler normal weiter.</p>
            <p>Im Maschinencode steht das Ziel noch als Zeile, zum Beispiel ${befehl('jump', 'jif (Z6)')}. Der Lader rechnet es beim Laden um: Danach zeigt das Ziel auf das Fach, in dem der Zielbefehl beginnt.</p>
            <p>Fächer, die ein Sprung überspringt, liest die CPU nie. Dasselbe Programm läuft deshalb mit anderen Werten im Datenspeicher anders ab, je nachdem, ob das Flag bei einem ${befehl('jump', 'jif')} gesetzt ist.</p>
          </div>
        `;
      },
    },
    {
      id: 's2',
      title: 'Keine Typen zur Laufzeit',
      render: (container) => {
        container.innerHTML = `
          <div class="slide-centered slide-lesbar">
            <p>Im Speicher sind alle Werte nur Bits. Die Laufzeitumgebung kennt keine Typen: Eine Zahl, ein Wahrheitswert und ein Befehl sehen dort gleich aus. Weil der Compiler ${code('true')} als 1 und ${code('false')} als 0 speichert, hat ein Wahrheitswert im Datenspeicher dasselbe Bitmuster wie die Zahl 1 oder 0.</p>
            <p>Wie ein Fach gelesen wird, entscheidet allein der Befehl, der es benutzt. ${befehl('calc', '+')} liest seine Werte als Zahlen, ${befehl('cmp', '== A, 0')} vergleicht ein Fach mit 0. Dass ein Fach einen Wahrheitswert enthält, steckt nur in der Befehlsauswahl des Compilers, nicht im Fach selbst.</p>
            <p>Deshalb muss die Semantik die Typen vorher prüfen. Aus ${code('true + 1')} würde die Maschine einfach 1 + 1 rechnen und 2 herausbekommen, ohne sich zu beschweren. Einen Typfehler gibt es zur Laufzeit nicht, denn der Compiler hat ihn schon vorher abgefangen.</p>
            <p>Auf der nächsten Folie führst du das Programm selbst aus. Beobachte dabei Flag, Befehlszähler und Datenspeicher.</p>
          </div>
        `;
      },
    },
    {
      id: 's3',
      title: 'Lass den Code laufen: Flag und Sprünge',
      render: (container) => renderEinzelphase(container, {
        phase: 'laufzeit',
        baum: BAUM,
        // Startfeld 1/3 im 6×6-Spielfeld, wie in 4.5
        start: { c: 1, r: 3 },
        hindernisse: [{ c: 2, r: 4 }, { c: 4, r: 4 }, { c: 5, r: 1 }],
      }),
    },
    {
      id: 'zuordnung',
      title: 'Ordne den Phasen zu: Das ist neu in Kapitel 4',
      // Wie 6.1, aber nur mit den Karten, die in diesem Kapitel neu sind. Die früheren liegen schon an ihrem Platz.
      render: (container) => renderPhasenZuordnung(container, {
        ziele: ZIELE,
        gruppen: GRUPPEN,
        karten: kartenNeuIn(4),
        vorbefuellt: kartenBis(3),
      }),
    },
  ],
};

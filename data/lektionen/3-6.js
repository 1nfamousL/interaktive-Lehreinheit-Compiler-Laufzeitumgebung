import { render as renderEinzelphase } from '../../js/exercises/einzelphase.js';
import { render as renderPhasenZuordnung } from '../../js/exercises/phasen-zuordnung.js';
import { ZIELE, GRUPPEN, kartenBis, kartenNeuIn } from '../phasenaufgaben.js';
import { prog, dek, zuw, bew, op, zahl, variable } from '../../js/exercises/compiler-weg-semantik-regeln.js';

// Übung "Das Laufzeitsystem": Der Maschinencode zum Programm aus den Übungen davor
// (die Musterlösung aus 3.5) wird geladen und Fach für Fach ausgeführt. Das Flag ist
// ausgeblendet, Vergleiche gibt es erst in Kapitel 4.
const BAUM = () => prog(
  dek('number', 'weg', op('+', zahl(4), zahl(3))),
  zuw('weg', op('-', zahl(10), variable('weg'))),
  bew('rechts', variable('weg')),
);

// Zweite Übung: Überlauf. Die Rechnung 254 + 3 ergibt 257 und liegt über 255.
const BAUM_UEBERLAUF = () => prog(
  dek('number', 'weg', op('+', zahl(254), zahl(3))),
  zuw('weg', op('-', zahl(10), variable('weg'))),
  bew('rechts', variable('weg')),
);

// Dritte Übung: Division durch 0. Nach der ersten Zeile ist weg gleich 0, und 10 / weg teilt durch
// den Wert von weg. Der Compiler rechnet nicht vorab, der Fehler zeigt sich erst bei der Ausführung.
const BAUM_DIVISION = () => prog(
  dek('number', 'weg', op('-', zahl(4), zahl(4))),
  zuw('weg', op('/', zahl(10), variable('weg'))),
  bew('rechts', variable('weg')),
);

// Hilfsfunktionen für den Text wie in 2.6: Befehle als farbige Bausteine, Programmteile auf Papier
const befehl = (gruppe, text) => `<span class="cg-block cg-${gruppe} cg-ohne-symbol cg-inline">${text}</span>`;
const code = (text) => `<span class="code-papier">${text}</span>`;

export const LEKTION = {
  id: '3-6',
  title: '3.6 Laufzeitumgebung: Überlauf und Division durch 0',
  desc: 'Rechnen in der CPU: Überlauf und Division durch 0 stoppen das Programm.',
  slides: [
    {
      id: 's1',
      title: 'Das Rechenwerk',
      render: (container) => {
        container.innerHTML = `
          <div class="slide-centered slide-lesbar">
            <p>In der Codegenerierung haben wir bereits gelernt, dass die CPU zum Rechnen Register benötigt. Neu ist jetzt das <strong>Rechenwerk</strong>: der Teil der CPU, der die Berechnung ausführt. Am Befehl ${befehl('calc', '+ A, 2')} sieht der Ablauf so aus: Zuerst landet der Befehl wie immer im Befehlsregister. Dann wird der Inhalt von A als erster Operand ins Rechenwerk geladen. Die 2 steht direkt im Befehl und kann von dort als zweiter Operand übernommen werden. Das Rechenwerk führt die Addition aus, und das Ergebnis wird zurück ins Register A geschrieben.</p>
            <p>Außerdem neu: Anders als in Kapitel 2 können Datenzellen jetzt durch Zuweisungen mehrmals beschrieben werden.</p>
          </div>
        `;
      },
    },
    {
      id: 's2',
      title: 'Grenzen des Rechnens',
      render: (container) => {
        container.innerHTML = `
          <div class="slide-centered slide-lesbar">
            <p>Ein Wert hat nur die Größe eines Bytes. Deshalb haben wir in der Semantik bereits geprüft, ob Zahlen im Quellcode zwischen 0 und 255 liegen. Dem Compiler fällt jedoch nicht auf, wenn das Ergebnis einer Rechnung diesen Wertebereich verlässt. Deshalb gibt es zwei neue Laufzeitfehler:</p>
            <p><strong>Überlauf:</strong> Das Ergebnis ist größer als 255, zum Beispiel ${code('200 + 100')}.<br><strong>Unterlauf:</strong> Das Ergebnis ist kleiner als 0, zum Beispiel ${code('1 - 5')}.</p>
            <p>Da nur ganze Zahlen gespeichert werden können, rechnet die CPU außerdem ganzzahlig: Bei einer Division wird der Rest abgeschnitten, ${code('7 / 2')} ergibt 3. Auch hier kann ein Laufzeitfehler auftreten:</p>
            <p><strong>Division durch 0:</strong> Der Divisor ist 0, zum Beispiel ${code('9 / 0')}. Dafür gibt es kein Ergebnis.</p>
            <p>Auf den nächsten Folien führst du das Programm selbst aus. Beobachte dabei Register, Rechenwerk und Datenspeicher.</p>
          </div>
        `;
      },
    },
    {
      id: 's3',
      title: 'Lass den Code laufen: Rechnen in der CPU',
      render: (container) => renderEinzelphase(container, {
        phase: 'laufzeit',
        baum: BAUM,
        // Startfeld 1/3 im 6×6-Spielfeld, wie in 3.5
        start: { c: 1, r: 3 },
        hindernisse: [{ c: 2, r: 1 }, { c: 4, r: 4 }, { c: 1, r: 5 }],
        sichtbar: { flag: false },
      }),
    },
    {
      id: 's4',
      title: 'Lass den Code laufen: Überlauf',
      render: (container) => renderEinzelphase(container, {
        phase: 'laufzeit',
        baum: BAUM_UEBERLAUF,
        start: { c: 1, r: 3 },
        hindernisse: [{ c: 2, r: 1 }, { c: 4, r: 4 }, { c: 1, r: 5 }],
        sichtbar: { flag: false },
        // Der Laufzeitfehler ist beabsichtigt und das Ziel der Übung
        fehlerIstZiel: true,
      }),
    },
    {
      id: 's5',
      title: 'Lass den Code laufen: Division durch 0',
      render: (container) => renderEinzelphase(container, {
        phase: 'laufzeit',
        baum: BAUM_DIVISION,
        start: { c: 1, r: 3 },
        hindernisse: [{ c: 2, r: 1 }, { c: 4, r: 4 }, { c: 1, r: 5 }],
        sichtbar: { flag: false },
        // Der Laufzeitfehler ist beabsichtigt und das Ziel der Übung
        fehlerIstZiel: true,
      }),
    },
    {
      id: 'zuordnung',
      title: 'Ordne den Phasen zu: Das ist neu in Kapitel 3',
      // Wie 6.1, aber nur mit den Karten, die in diesem Kapitel neu sind. Die früheren liegen schon an ihrem Platz.
      render: (container) => renderPhasenZuordnung(container, {
        ziele: ZIELE,
        gruppen: GRUPPEN,
        karten: kartenNeuIn(3),
        vorbefuellt: kartenBis(2),
      }),
    },
  ],
};

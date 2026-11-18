import { render as renderEinzelphase } from '../../js/exercises/einzelphase.js';
import { render as renderPhasenZuordnung } from '../../js/exercises/phasen-zuordnung.js';
import { ZIELE, GRUPPEN, kartenBis, kartenNeuIn } from '../phasenaufgaben.js';
import { prog, dek, zuw, bew, while_, op, zahl, variable } from '../../js/exercises/compiler-weg-semantik-regeln.js';

// Übung "Das Laufzeitsystem": Der Maschinencode zum Programm aus den Übungen davor
// (die Musterlösung aus 5.5) wird geladen und Fach für Fach ausgeführt.
const BAUM = () => prog(
  dek('number', 'n', zahl(3)),
  while_(
    op('>', variable('n'), zahl(0)),
    bew('rechts', zahl(1)),
    bew('oben', zahl(1)),
    zuw('n', op('-', variable('n'), zahl(1))),
  ),
);

// Zweite Übung: Deklaration im Rumpf (die Musterlösung aus 5.5, zweite Übung). Im Datenspeicher
// wird (D2) in jedem Durchlauf auf 1 zurückgesetzt und dann auf 2 erhöht, der Roboter fährt
// dreimal ein Feld nach oben.
const BAUM_RUMPF = () => prog(
  dek('number', 'n', zahl(3)),
  while_(
    op('>', variable('n'), zahl(0)),
    dek('number', 'schritte', zahl(1)),
    bew('oben', variable('schritte')),
    zuw('schritte', op('+', variable('schritte'), zahl(1))),
    zuw('n', op('-', variable('n'), zahl(1))),
  ),
);

// Dritte Übung: Endlosschleife. Die Bedingung 3 > 0 ist immer wahr, der Rumpf ist leer. Der
// Maschinencode hat nur vier Zeilen (<= 3, 0 / jif / jmp / end). Das Laufzeitsystem erkennt, dass
// Befehlszähler, Register, Flag, Datenspeicher und Roboter zum dritten Mal im selben Zustand sind, und hält an.
// Der Laufzeitfehler ist hier das Ziel der Übung (fehlerIstZiel).
const BAUM_ENDLOS = () => prog(
  while_(op('>', zahl(3), zahl(0))),
);

// Einzeiliger Quellcode im Text (Papier-Darstellung, siehe .code-papier)
const code = (text) => `<span class="code-papier">${text}</span>`;

export const LEKTION = {
  id: '5-6',
  title: '5.6 Laufzeitumgebung: Durchläufe und Endlosschleife',
  desc: 'Derselbe Code läuft mehrfach, Endlosschleifen werden erkannt und angehalten.',
  slides: [
    {
      id: 's1',
      title: 'Lass den Code laufen: Der Rücksprung',
      render: (container) => renderEinzelphase(container, {
        phase: 'laufzeit',
        baum: BAUM,
        // Startfeld 1/4 im 6×6-Spielfeld, wie in 5.5
        start: { c: 1, r: 4 },
        hindernisse: [{ c: 3, r: 4 }, { c: 4, r: 3 }, { c: 5, r: 2 }, { c: 2, r: 1 }],
      }),
    },
    {
      id: 's2',
      title: 'Lass den Code laufen: Deklaration im Rumpf',
      render: (container) => renderEinzelphase(container, {
        phase: 'laufzeit',
        baum: BAUM_RUMPF,
        // Startfeld 1/4 im 6×6-Spielfeld, wie in 5.5
        start: { c: 1, r: 4 },
        hindernisse: [{ c: 3, r: 4 }, { c: 4, r: 3 }, { c: 5, r: 2 }, { c: 2, r: 1 }],
      }),
    },
    {
      id: 's3',
      title: 'Endlosschleife',
      text: [
        `Was passiert, wenn sich die Bedingung nie ändert? Dann bleibt sie wahr, und die Schleife läuft ohne Ende. Das nennt man eine <strong>Endlosschleife</strong>. Im Beispielprogramm würde das passieren, wenn die Zeile ${code('n = n - 1;')} fehlt.`,
        'Die Laufzeitumgebung kann nicht wissen, ob ein Programm irgendwann endet. Deshalb braucht es eine feste Regel. Bei uns lautet sie: Tritt derselbe Zustand aus Befehlszähler, Register, Flag, Datenspeicher und Roboter zum dritten Mal auf, hält das Programm an, denn es hat keine Eingabe, die etwas ändern könnte.',
        'Echte Systeme haben ähnliche Mechanismen. Häufig wird ein Zeitraum festgelegt, den ein Programm die CPU höchstens blockieren darf.',
      ],
    },
    {
      id: 's4',
      title: 'Lass den Code laufen: Endlosschleife',
      render: (container) => renderEinzelphase(container, {
        phase: 'laufzeit',
        baum: BAUM_ENDLOS,
        // Startfeld 1/4 im 6×6-Spielfeld, wie in 5.5. Der Roboter bewegt sich nicht.
        start: { c: 1, r: 4 },
        hindernisse: [{ c: 3, r: 4 }, { c: 4, r: 3 }, { c: 5, r: 2 }, { c: 2, r: 1 }],
        fehlerIstZiel: true,
      }),
    },
    {
      id: 'zuordnung',
      title: 'Ordne den Phasen zu: Das ist neu in Kapitel 5',
      // Wie 6.1, aber nur mit den Karten, die in diesem Kapitel neu sind. Die früheren liegen schon an ihrem Platz.
      render: (container) => renderPhasenZuordnung(container, {
        ziele: ZIELE,
        gruppen: GRUPPEN,
        karten: kartenNeuIn(5),
        vorbefuellt: kartenBis(4),
      }),
    },
  ],
};

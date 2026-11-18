import { render as renderEinzelphase } from '../../js/exercises/einzelphase.js';
import { prog, dek, zuw, bew, while_, op, zahl, variable } from '../../js/exercises/compiler-weg-semantik-regeln.js';

// Übung "Werde zum Codegenerator": dasselbe Programm wie in den Übungen davor.
// Musterlösung und Bausteine erzeugt einzelphase.js aus dem Baum, die Adressen sind
// relativ wie in 6.2 mit Fächern: (D1) für n, (Z1) … für die Zeilen.
const QUELLTEXT = [
  'number n = 3;',
  'while (n > 0) {',
  '    moveRight(1);',
  '    moveUp(1);',
  '    n = n - 1;',
  '}',
].join('\n');

const BAUM = () => prog(
  dek('number', 'n', zahl(3)),
  while_(
    op('>', variable('n'), zahl(0)),
    bew('rechts', zahl(1)),
    bew('oben', zahl(1)),
    zuw('n', op('-', variable('n'), zahl(1))),
  ),
);

// Zweite Übung: Deklaration im Rumpf. Die Datenzelle für schritte gibt es nur einmal ((D2)),
// die Initialisierung steht im Rumpf und läuft in jedem Durchlauf. Die Zeile
// schritte = schritte + 1 macht das in der Laufzeit (5.6) sichtbar: schritte wird in jedem
// Durchlauf auf 1 zurückgesetzt, der Roboter fährt nur dreimal ein Feld nach oben. Stünde die
// Deklaration vor der Schleife, führe er 1 + 2 + 3 Felder und prallte gegen die Wand um das Spielfeld.
const QUELLTEXT_RUMPF = [
  'number n = 3;',
  'while (n > 0) {',
  '    number schritte = 1;',
  '    moveUp(schritte);',
  '    schritte = schritte + 1;',
  '    n = n - 1;',
  '}',
].join('\n');

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

// Befehle im Text als farbige Bausteine (Gruppen wie in maschine.js: jump = Sprung), siehe 4.5
const befehl = (gruppe, text) => `<span class="cg-block cg-${gruppe} cg-ohne-symbol cg-inline">${text}</span>`;

export const LEKTION = {
  id: '5-5',
  title: '5.5 Codegenerierung: Der Rücksprung',
  desc: 'Ein Rücksprung wertet die Bedingung jedes Mal neu aus.',
  slides: [
    {
      id: 's1',
      title: 'Der Rücksprung',
      text: [
        `Eine while-Anweisung übersetzt der Compiler wie eine if-Anweisung, mit einem zusätzlichen ${befehl('jump', 'jmp')} am Ende des Rumpfes. Dieser Sprung geht zurück auf das Laden des linken Wertes, denn die Bedingung muss mit dem neuen Wert der Variablen jedes Mal erneut ausgewertet werden. Dieselbe Zeile wird deshalb mehrfach ausgeführt.`,
      ],
    },
    {
      id: 's2',
      title: 'Übersetze den Code: Der Rücksprung',
      render: (container) => renderEinzelphase(container, {
        phase: 'codegen',
        baum: BAUM,
        quelltext: QUELLTEXT,
        // Startfeld 1/4 im 6×6-Spielfeld, der Roboter fährt dreimal schräg nach oben rechts
        start: { c: 1, r: 4 },
        hindernisse: [{ c: 3, r: 4 }, { c: 4, r: 3 }, { c: 5, r: 2 }, { c: 2, r: 1 }],
      }),
    },
    {
      id: 's3',
      title: 'Übersetze den Code: Deklaration im Rumpf',
      render: (container) => renderEinzelphase(container, {
        phase: 'codegen',
        baum: BAUM_RUMPF,
        quelltext: QUELLTEXT_RUMPF,
        // Startfeld 1/4 im 6×6-Spielfeld, der Roboter fährt dreimal ein Feld nach oben
        start: { c: 1, r: 4 },
        hindernisse: [{ c: 3, r: 4 }, { c: 4, r: 3 }, { c: 5, r: 2 }, { c: 2, r: 1 }],
      }),
    },
  ],
};

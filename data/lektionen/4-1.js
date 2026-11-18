// Einzeiliger Quellcode im Text (Papier-Darstellung, siehe .code-papier) und mehrzeiliger Block
const code = (text) => `<span class="code-papier">${text}</span>`;
const block = (text) => `<span class="slide-code code-papier">${text}</span>`;

// Das Beispielprogramm von Kapitel 4, Basis aller Übungen dieses Kapitels
const BEISPIEL = block('number schritte = 3;\nboolean weit = false;\nif (schritte > 2) {\n    moveUp(1);\n}\nif (weit == true) {\n    moveRight(schritte);\n}');

export const LEKTION = {
  id: '4-1',
  title: '4.1 Verzweigungen',
  desc: 'Der Datentyp boolean, Vergleiche und die if-Anweisung.',
  slides: [
    {
      id: 's1',
      title: 'Programme treffen Entscheidungen',
      text: [
        'Bisher hat der Roboter jede Anweisung ausgeführt, eine nach der anderen von oben nach unten. Das Programm sah immer gleich aus, egal welche Werte in den Variablen standen.',
        'Oft soll ein Teil des Programms aber nur dann laufen, wenn etwas zutrifft. Im Alltag sagen wir: „Wenn es regnet, nimm den Schirm mit.“ Der Satz hat eine Bedingung und eine Handlung, die nur gilt, wenn die Bedingung erfüllt ist.',
        'Genau das führen wir jetzt in unsere Sprache ein. Wir brauchen dafür drei Dinge: einen Wert, der „stimmt“ oder „stimmt nicht“ ausdrücken kann, Vergleiche, die so einen Wert erzeugen, und eine Anweisung, die davon abhängig Teile des Programms ausführt oder überspringt.',
      ],
    },
    {
      id: 's2',
      title: 'Der Datentyp boolean',
      text: [
        `Bisher gab es nur den Datentyp „number“. Neu ist der Datentyp „boolean“. Eine Variable dieses Typs speichert einen <strong>Wahrheitswert</strong>, das ist entweder ${code('true')} (wahr) oder ${code('false')} (falsch).`,
        `Sie wird wie bisher deklariert, nur mit einem anderen Schlüsselwort: ${code('boolean weit = false;')}`,
        `${code('true')} und ${code('false')} sind Literale, genau wie die Zahlen. Sie sind aber keine Zahlen: Unsere Sprache unterscheidet Zahlen und Wahrheitswerte durch ihren Typ. Beides zu mischen, zum Beispiel ${code('true + 1')} zu rechnen, ergibt keinen Sinn und ist ein Fehler. Wie der Compiler das erkennt, sehen wir bei der semantischen Analyse.`,
      ],
    },
    {
      id: 's3',
      title: 'Vergleiche',
      text: [
        `Einen Wahrheitswert kann man auch berechnen. Dazu dient ein <strong>Vergleich</strong>: Er hat zwei Werte und einen Vergleichsoperator und ergibt wahr oder falsch. Mit ${code('schritte = 3')} ist ${code('schritte > 2')} wahr, ${code('schritte < 2')} dagegen falsch.`,
        'Es gibt sechs Vergleichsoperatoren: „<“ (kleiner), „>“ (größer), „<=“ (kleiner oder gleich), „>=“ (größer oder gleich), „==“ (gleich) und „!=“ (ungleich).',
        'Vorsicht bei „=“ und „==“: Ein einfaches „=“ speichert einen Wert in eine Variable, ein doppeltes „==“ fragt, ob zwei Werte gleich sind.',
        `Ein Vergleich ist ein Ausdruck, so wie eine Rechnung. Man kann sein Ergebnis deshalb in einer Variablen speichern: ${code('boolean weit = schritte > 2;')}`,
      ],
    },
    {
      id: 's4',
      title: 'Die if-Anweisung und der Block',
      text: [
        `Mit der <strong>if-Anweisung</strong> hängt man Teile des Programms an eine Bedingung. Sie besteht aus dem Wort „if“, einer Bedingung in runden Klammern und einem Block:`,
        block('if (schritte > 2) {\n    moveUp(1);\n}'),
        'Ein <strong>Block</strong> fasst beliebig viele Anweisungen in geschweiften Klammern zusammen. Ist die Bedingung wahr, führt der Roboter den Block aus. Ist sie falsch, überspringt er ihn und macht hinter der schließenden Klammer weiter.',
        'Hinter dem Block steht kein Semikolon.',
        'Der Block bildet außerdem einen eigenen Gültigkeitsbereich: Eine Variable, die in einem Block deklariert wird, gibt es nur dort. Außerhalb ist sie nicht sichtbar.',
      ],
    },
    {
      id: 's5',
      title: 'Das Beispielprogramm von Kapitel 4',
      text: [
        'Dieses Programm begleitet uns durch alle Phasen des Kapitels. Der Roboter startet auf dem Feld (1, 3) und soll am Ende auf dem Feld (1, 2) stehen:',
        BEISPIEL,
        'Wie in den Kapiteln davor gehen wir den Weg des Compilers Phase für Phase durch und schauen jeweils, was durch Wahrheitswerte, Vergleiche und die if-Anweisung neu hinzukommt. Zuerst übernimmst du wieder die Rolle des Scanners.',
      ],
    },
  ],
};

// Einzeiliger Quellcode im Text (Papier-Darstellung, siehe .code-papier) und mehrzeiliger Block
const code = (text) => `<span class="code-papier">${text}</span>`;
const block = (text) => `<span class="slide-code code-papier">${text}</span>`;

// Das Beispielprogramm von Kapitel 5, Basis aller Übungen dieses Kapitels
const BEISPIEL = block('number n = 3;\nwhile (n > 0) {\n    moveRight(1);\n    moveUp(1);\n    n = n - 1;\n}');

export const LEKTION = {
  id: '5-1',
  title: '5.1 Schleifen',
  desc: 'Die while-Anweisung wiederholt einen Block, solange die Bedingung wahr ist.',
  slides: [
    {
      id: 's1',
      title: 'Wiederholen statt Abschreiben',
      text: [
        `Der Roboter soll dreimal ein Feld nach rechts und eines nach oben fahren. Mit dem, was wir bisher können, schreiben wir die beiden Anweisungen ${code('moveRight(1);')} und ${code('moveUp(1);')} dreimal hintereinander. Bei zehn Wiederholungen wären es zwanzig Zeilen, und die Zahl der Wiederholungen müsste beim Schreiben feststehen.`,
        'Besser ist es, dem Programm zu sagen: „Wiederhole diesen Teil, solange etwas gilt.“ Eine solche Wiederholung heißt <strong>Schleife</strong>.',
      ],
    },
    {
      id: 's2',
      title: 'Die while-Anweisung',
      text: [
        `Die <strong>while-Anweisung</strong> sieht aus wie die if-Anweisung: das Wort „while“, eine Bedingung in runden Klammern und ein Block, der hier <strong>Rumpf</strong> der Schleife heißt.`,
        block('while (n > 0) {\n    moveRight(1);\n}'),
        'Der Unterschied liegt im Ablauf. Eine if-Anweisung prüft die Bedingung einmal. Die while-Anweisung prüft sie vor jedem Durchlauf: Ist sie wahr, läuft der Rumpf, danach wird die Bedingung noch einmal geprüft. Das geht so lange, bis sie falsch ist. Dann macht das Programm hinter dem Block weiter.',
        'Ist die Bedingung schon am Anfang falsch, läuft der Rumpf gar nicht. Wie bei if steht hinter dem Block kein Semikolon.',
        'Damit die Schleife irgendwann endet, muss sich im Rumpf etwas ändern, das die Bedingung beeinflusst. Meistens ist das eine Variable, der <strong>Schleifenzähler</strong>.',
      ],
    },
    {
      id: 's3',
      title: 'Das Beispielprogramm von Kapitel 5',
      text: [
        'Dieses Programm begleitet uns durch alle Phasen des Kapitels. Der Roboter startet auf dem Feld (1, 4) und soll am Ende auf dem Feld (4, 1) stehen:',
        BEISPIEL,
        'Wie in den Kapiteln davor gehen wir den Weg des Compilers Phase für Phase durch und schauen jeweils, was durch die while-Anweisung neu hinzukommt. Zuerst übernimmst du wieder die Rolle des Scanners.',
      ],
    },
  ],
};

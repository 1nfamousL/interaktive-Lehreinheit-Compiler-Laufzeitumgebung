// Einzeiliger Quellcode im Text (Papier-Darstellung, siehe .code-papier) und mehrzeiliger Block
const code = (text) => `<span class="code-papier">${text}</span>`;
const block = (text) => `<span class="slide-code code-papier">${text}</span>`;

// Das Beispielprogramm von Kapitel 3, Basis aller Übungen dieses Kapitels
const BEISPIEL = block('number weg = 4 + 3;\nweg = 10 - weg;\nmoveRight(weg);');

export const LEKTION = {
  id: '3-1',
  title: '3.1 Zuweisung und Rechnung',
  desc: 'Aus Konstanten werden Variablen, und die Sprache lernt zu rechnen.',
  slides: [
    {
      id: 's1',
      title: 'Von der Konstante zur Variable',
      text: [
        `In Kapitel 2 hat eine Deklaration wie ${code('number schritte = 2;')} einer Zahl einen Namen gegeben. Der Wert stand danach fest, wir haben ihn eine <strong>Konstante</strong> genannt.`,
        `Dabei bleibt es nicht. Ab jetzt darf sich ein Wert im Lauf des Programms ändern. Eine benannte Zahl, die sich ändern lässt, heißt <strong>Variable</strong>. Die Deklaration schreibst du weiter wie bisher: ${code('number a = 1;')}`,
        `Den Wert einer Variablen ändert die <strong>Zuweisung</strong>. Sie überschreibt ihn: ${code('a = 5;')} Nach ${code('number a = 1;')} und ${code('a = 5;')} hat „a“ den Wert 5, der alte Wert ist weg.`,
        'Die Zuweisung sieht aus wie eine Deklaration, nur ohne das Wort „number“. Die Deklaration legt eine Variable neu an, die Zuweisung ändert eine, die es schon gibt. Der Name muss also vorher deklariert worden sein.',
      ],
    },
    {
      id: 's2',
      title: 'Rechnungen und Bewegungen',
      text: [
        `Rechts vom „=“ steht bisher ein einzelner Wert. Neu darf dort auch eine <strong>Rechnung</strong> stehen: ${code('number weg = a + 3;')}`,
        'Es gibt vier Rechenzeichen: „+“, „-“, „*“ und „/“. Eine Rechnung hat genau eines davon und zwei Werte, jeder Wert ist eine Zahl oder ein Name.',
        `Bewegungsanweisungen dürfen weiterhin einen Namen in die Klammer nehmen: ${code('moveRight(weg);')} Der Roboter bewegt sich so weit, wie der letzte Wert von „weg“ angibt. Hat sich „weg“ vorher durch eine Zuweisung geändert, gilt der neue Wert.`,
      ],
    },
    {
      id: 's3',
      title: 'Das Beispielprogramm von Kapitel 3',
      text: [
        'Dieses Programm begleitet uns durch alle Phasen des Kapitels. Der Roboter startet auf dem Feld (1, 3) und soll am Ende auf dem Feld (4, 3) stehen:',
        BEISPIEL,
        'Wie in Kapitel 2 gehen wir den Weg des Compilers Phase für Phase durch und schauen jeweils, was durch Zuweisung und Rechnung neu hinzukommt.',
      ],
    },
  ],
};

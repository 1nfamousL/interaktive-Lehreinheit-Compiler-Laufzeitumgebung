import { render as renderEinzelphase } from '../../js/exercises/einzelphase.js';

// Quellcode der Übung "Werde zum Scanner": das Beispielprogramm aus Kapitel 1 (Folie 1.3 s2) mit seinen
// Zeilenumbrüchen, so wie der Scanner es sieht. Er enthält einen lexikalischen Fehler: Das „%“ steht
// anstelle des Semikolons und gehört zu keiner Kategorie.
const SCANNER_CODE = 'number schritte = 2;\nmoveRight(schritte)%\nmoveUp(1);';

// Das Beispielprogramm aus Kapitel 1 als Quellcode im Text (Papier-Darstellung, siehe .code-papier)
const BEISPIEL = '<span class="slide-code code-papier">number schritte = 2;\nmoveRight(schritte);\nmoveUp(1);</span>';

// Ein einzelnes Token im Text, eingefärbt wie in der Übung (Art = Werkzeug-ID der Lexik-Übung).
// Quellcode-Fragmente aus mehreren Tokens stehen dagegen als code(...) auf Papier.
const marke = (art, text) => `<span class="token-marke lex-mark-${art}">${text}</span>`;
const code = (text) => `<span class="code-papier">${text}</span>`;

// Jedes Token hat einen Tokencode. Bei festen Tokens ist das der Baustein selbst, nur Bezeichner und
// Zahlen haben einen gemeinsamen Code (Bezeichner, Zahl) und speichern zusätzlich ihren Wert.
export const LEKTION = {
  id: '2-2',
  title: '2.2 Lexik: Vom Text zu Tokens',
  desc: 'Der Scanner zerlegt den Quellcode in Tokens.',
  slides: [
    {
      id: 's1',
      title: 'Was ist das?',
      text: [
        'Erster Schritt beim Übersetzen eines Programms.',
        'Der Quellcode ist am Anfang nur eine lange Folge von Zeichen. Unser Beispiel aus Kapitel 1:',
        BEISPIEL,
        'Für den Scanner sind das „n“, „u“, „m“, „b“, „e“, „r“, ein Leerzeichen, „s“ usw.',
        'Seine Aufgabe ist es, aus den Zeichen die kleinsten Bausteine zu bilden, die für sich etwas bedeuten, so wie Wörter in einer Sprache. Diese Bausteine heißen Tokens.',
        'Vergleich: Wir erkennen in der Zeichenfolge HUNDKATZEHAUS die Wörter Hund, Katze und Haus an ihrem Muster. Dieses Muster zeigt uns auch, wo ein Wort anfängt und wo es aufhört. Der Scanner geht genauso vor: Er kennt die Muster der Tokens und schneidet den Quellcode an den Stellen auseinander, an denen ein Muster zu Ende ist.',
      ],
    },
    {
      id: 's2',
      title: 'Die Tokens unserer Sprache',
      text: [
        'Der sogenannte Scanner liest den Quellcode Zeichen für Zeichen von links nach rechts. Ist ein Baustein vollständig, wird daraus ein Token. Leerzeichen und Zeilenumbrüche erkennt er auch, wirft sie aber danach weg, weil sie für die weiteren Schritte nicht wichtig sind.',
        'In unserem Beispiel erkennt er diese 15 Tokens:',
        [
          marke('keyword', 'number'), marke('identifier', 'schritte'), marke('operator', '='), marke('literal', '2'), marke('separator', ';'),
          marke('keyword', 'moveRight'), marke('separator', '('), marke('identifier', 'schritte'), marke('separator', ')'), marke('separator', ';'),
          marke('keyword', 'moveUp'), marke('separator', '('), marke('literal', '1'), marke('separator', ')'), marke('separator', ';'),
        ].join(' '),
        'Jedes Token bekommt vom Scanner einen <strong>Tokencode</strong>. Das ist ein Etikett, das dem Compiler sagt, was für ein Baustein das ist. Die nächsten Phasen arbeiten nur noch mit diesen Etiketten und müssen den Text nicht mehr Zeichen für Zeichen lesen.',
        `Echte Compiler nehmen dafür meist Zahlen, zum Beispiel 1 für ${marke('keyword', 'number')} und 2 für ${marke('operator', '=')}. Wir machen es uns einfacher und nehmen als Tokencode den Baustein selbst: Das Token ${marke('keyword', 'number')} hat den Tokencode „number“, das Token ${marke('separator', ';')} den Tokencode „;“.`,
      ],
    },
    {
      id: 's3',
      title: 'Tokens, bei denen der Code reicht',
      text: [
        `Man kann Tokens nach ihrer Art in Tokengruppen einteilen. Wir geben jeder Tokengruppe eine eigene Farbe.`,
        `<strong>Schlüsselwörter</strong> sind feste Wörter, die die Sprache selbst festlegt. Bei uns sind das ${marke('keyword', 'number')} für eine Deklaration und ${marke('keyword', 'moveUp')}, ${marke('keyword', 'moveDown')}, ${marke('keyword', 'moveRight')} und ${marke('keyword', 'moveLeft')} für die Bewegungen. Sie müssen genau so geschrieben werden, das heißt, es kommt auf Groß- und Kleinschreibung an.`,
        `<strong>Operatoren</strong> sind Zeichen, die etwas mit Werten tun. Bisher gibt es nur das Gleichheitszeichen ${marke('operator', '=')}, das einem Namen einen Wert zuweist.`,
        `<strong>Gliederungszeichen</strong>: In einem deutschen Satz gliedern Punkt und Komma den Text, ohne selbst ein Wort zu sein. Bei uns übernehmen das ${marke('separator', ';')}, ${marke('separator', '(')} und ${marke('separator', ')')}. Das Semikolon beendet eine Anweisung, die Klammern fassen den Wert ein.`,
      ],
    },
    {
      id: 's4',
      title: 'Bezeichner',
      text: [
        `Bei Namen reicht der Tokencode nicht. Den Namen ${marke('identifier', 'schritte')} hat sich der Programmierer ausgedacht, er könnte genauso gut ${marke('identifier', 'weg')} heißen. Deshalb haben alle Namen denselben Tokencode <strong>Bezeichner</strong>, und das Token speichert zusätzlich seinen <strong>Wert</strong>, also den konkreten Namen. Im Beispiel gibt es zwei Tokens mit dem Tokencode Bezeichner und dem Wert „schritte“.`,
        'Ein Bezeichner besteht aus Buchstaben und Ziffern und beginnt mit einem Buchstaben. Jedes Wort, das kein Schlüsselwort ist, ist für den Scanner ein Bezeichner.',
        `Hier spielen die Leerzeichen eine Rolle: Der Scanner liest einen Namen, solange Buchstaben oder Ziffern folgen. Ein Leerzeichen beendet ihn, deshalb sind ${code('number schritte')} zwei Tokens, ${code('numberschritte')} dagegen ein einziger Bezeichner. Vor einem Zeichen wie „=“ braucht es dagegen kein Leerzeichen: ${code('schritte=2')} ergibt ebenfalls drei Tokens, weil „=“ weder Buchstabe noch Ziffer ist.`,
      ],
    },
    {
      id: 's5',
      title: 'Literale',
      text: [
        `<strong>Literale</strong> sind Werte, die eine Konstante speichern kann. In unserer Sprache gehören dazu die Zahlen, im Beispiel ${marke('literal', '2')} und ${marke('literal', '1')}.`,
        'Wie Bezeichner können auch Zahlen verschiedene Werte haben. Sie können aus einer oder mehreren Ziffern bestehen. Deshalb bekommen alle Zahlen denselben Tokencode <strong>Zahl</strong>, und das Token speichert zusätzlich den konkreten Wert.',
      ],
    },
    {
      id: 's6',
      title: 'Lexikalische Fehler',
      text: [
        'Ein lexikalischer Fehler liegt vor, wenn der Scanner ein Zeichen liest, das zu keinem Token passt. Beispiele sind „%“, „#“ oder „!“. Der Scanner meldet dann einen Fehler und hört dort auf.',
        'Das Ergebnis des Scanners ist die Liste der Tokens und dient der nächsten Phase als Eingabe. Sie muss weder strukturell noch inhaltlich Sinn ergeben, denn das prüfen erst die nächsten Phasen.',
        'Auf der nächsten Folie übernimmst du nun selbst die Arbeit des Scanners. Gehe dazu den Quellcode Zeichen für Zeichen durch und identifiziere die Wörter, indem du sie in der Farbe ihrer Gruppe färbst. Wenn du Hilfe bei der Bedienung benötigst, klicke oben rechts auf <span class="mini-knopf">Hilfe</span>.'      ],
    },
    {
      id: 's7',
      title: 'Werde zum Scanner: Die ersten Tokens',
      render: (container) => renderEinzelphase(container, {
        phase: 'lexik',
        code: SCANNER_CODE,
        werkzeuge: ['keyword', 'identifier', 'literal', 'operator', 'separator', 'error'],
        schluesselwoerter: ['number', 'moveUp', 'moveDown', 'moveRight', 'moveLeft'],
        hinweisKategorien: 'Ist es ein festes Wort der Sprache, ein selbst gewählter Name, ein Zahlenwert, ein Zuweisungszeichen, ein Zeichen zum Gliedern oder passt es zu keiner Tokengruppe?',
      }),
    },
  ],
};

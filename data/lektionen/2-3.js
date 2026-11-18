import { render as renderEinzelphase } from '../../js/exercises/einzelphase.js';
import { chip, regel, zeichen, ende, rasterHtml, regelnPopupHtml } from '../../js/grammatik.js';
import { zeigeBaum } from '../../js/baum-abbildung.js';

// Syntaxbaum zu "moveUp(1);" für die Abbildung auf Folie 3. Die Bewegung hat ihren Operanden direkt
// als Kind (kein Ausdruck), wie in der Syntaxübung.
const BEISPIEL_BAUM = {
  nt: 'Programm',
  kinder: [{
    nt: 'Anweisung',
    kinder: [
      {
        nt: 'Bewegung',
        kinder: [
          { t: 'moveUp', art: 'keyword' },
          { t: '(', art: 'separator' },
          { t: '1', art: 'literal' },
          { t: ')', art: 'separator' },
        ],
      },
      { t: ';', art: 'separator' },
    ],
  }, { t: 'Programmende', art: 'ende' }],
};

// Übung "Werde zum Parser": das Programm der Scanner-Übung (ohne den Scanner-Fehler), diesmal als
// Tokenliste, so wie der Scanner sie liefert. cat ist die Kategorie des Tokens (kw = Schlüsselwort,
// open/close = Klammern, lit = Literal, id = Bezeichner, op = Operator, semi = Semikolon).
const ZEILE_1 = [
  { text: 'number', cat: 'kw' }, { text: 'schritte', cat: 'id' }, { text: '=', cat: 'op' }, { text: '2', cat: 'lit' }, { text: ';', cat: 'semi' },
];
const ZEILE_3 = [
  { text: 'moveUp', cat: 'kw' }, { text: '(', cat: 'open' }, { text: '1', cat: 'lit' }, { text: ')', cat: 'close' }, { text: ';', cat: 'semi' },
];

// Basis: fehlerfrei
const PARSER_PROGRAMM = [
  ...ZEILE_1,
  { text: 'moveRight', cat: 'kw' }, { text: '(', cat: 'open' }, { text: 'schritte', cat: 'id' }, { text: ')', cat: 'close' }, { text: ';', cat: 'semi' },
  ...ZEILE_3,
];

// Mit Fehler: nur eine kurze Anweisung, bei der die schließende Klammer fehlt (moveRight(1;).
// Der Spieler baut den Baum bis dorthin auf und meldet den Syntaxfehler.
const PARSER_FEHLER = [
  { text: 'moveRight', cat: 'kw' }, { text: '(', cat: 'open' }, { text: '1', cat: 'lit' }, { text: ';', cat: 'semi' },
];

// Die Regeln der Grammatik, einmal geschrieben: je Regel die Zeile des Rasters und ein Satz dazu. Die Folie zeigt
// das Raster, das Pop-up der Übung zusätzlich den Satz unter jeder Regel (siehe js/grammatik.js). Eine Funktion,
// damit die Hilfsfunktionen weiter unten erst beim Aufruf gebraucht werden.
const grammatik = () => [
  [regel(chip('Programm'), `${chip('Anweisung')}${zeichen(',')} ${chip('Anweisung')}${zeichen(',')} ${zeichen('…')}${zeichen(',')} ${ende()}`),
    'Ein Programm besteht aus einer oder mehreren Anweisungen.'],
  [regel(chip('Anweisung'), `${zeichen('(')} ${chip('Deklaration')} ${zeichen('|')} ${chip('Bewegung')} ${zeichen(')')} ${marke('separator', ';')}`),
    'Eine Anweisung besteht aus einer Deklaration oder einer Bewegung und einem Semikolon.'],
  [regel(chip('Deklaration'), `${marke('keyword', 'number')} ${marke('identifier', 'Bezeichner')} ${marke('operator', '=')} ${chip('Ausdruck')}`),
    'Eine Deklaration besteht aus dem Schlüsselwort „number“, dem Namen der Konstanten, einem Gleichheitszeichen und einem Ausdruck.'],
  [regel(chip('Bewegung'), `${zeichen('(')} ${marke('keyword', 'moveUp')} ${zeichen('|')} ${marke('keyword', 'moveDown')} ${zeichen('|')} ${marke('keyword', 'moveRight')} ${zeichen('|')} ${marke('keyword', 'moveLeft')} ${zeichen(')')} ${marke('separator', '(')} ${zeichen('(')} ${marke('identifier', 'Bezeichner')} ${zeichen('|')} ${marke('literal', 'Literal')} ${zeichen(')')} ${marke('separator', ')')}`),
    'Eine Bewegung besteht aus einem Schlüsselwort (moveUp, moveDown, moveRight oder moveLeft), einer öffnenden Klammer, einer Konstanten oder Zahl und einer schließenden Klammer.'],
  [regel(chip('Ausdruck'), `${marke('identifier', 'Bezeichner')} ${zeichen('|')} ${marke('literal', 'Literal')}`),
    'Ein Ausdruck ist ein einzelner Wert, eine Konstante oder eine Zahl.'],
];

// Ein einzelnes Token im Text, eingefärbt wie in der Lexik-Übung (art = Werkzeug-ID, siehe 2-2.js)
const marke = (art, text) => `<span class="token-marke lex-mark-${art}">${text}</span>`;

// Beide Übungen unterscheiden sich nur im Programm.
function parserUebung(programm) {
  return {
    phase: 'syntax',
    programm,
    // Reihenfolge wie in den späteren Kapiteln. Zuweisung gehört noch nicht zur Sprache (fehlt
    // in den Regeln), sie liegt wie in Kapitel 3 und 4 als Ablenkung in der Ablage.
    ablage: ['Anweisung', 'Zuweisung', 'Deklaration', 'Ausdruck', 'Bewegung'],
    regelnHtml: regelnPopupHtml(grammatik()),
  };
}

export const LEKTION = {
  id: '2-3',
  title: '2.3 Syntax: Der Syntaxbaum',
  desc: 'Der Parser baut aus den Tokens den Syntaxbaum.',
  slides: [
    {
      id: 's1',
      title: 'Was ist das?',
      text: [
        'Zweiter Schritt beim Übersetzen. Der sogenannte Parser bekommt die Tokenliste vom Scanner übergeben.',
        `Der Scanner hat nur einzelne Tokens erkannt und nicht geprüft, ob sie sinnvoll aufeinander folgen. Für ihn ist ${[marke('separator', ')'), marke('literal', '2'), marke('separator', '('), marke('keyword', 'moveRight'), marke('separator', ';')].join(' ')} eine völlig gültige Tokenfolge.`,
        'Der Parser prüft nun, ob die Tokens in einer erlaubten Reihenfolge stehen, und erkennt, wie sie zusammengehören.',
        'Welche Reihenfolgen erlaubt sind, legt die Grammatik der Sprache fest. Sie besteht aus Regeln, die Sprachkonstrukte so lange in kleinere zerlegen, bis nur noch Tokens übrig sind. Dadurch entsteht eine Struktur.',
        'Vergleich: Der Scanner erkennt Wörter, der Parser prüft, ob daraus ein gültiger Satz wird.',
      ],
    },
    {
      id: 's2',
      title: 'Die Grammatik',
      render: (container) => {
        container.innerHTML = `
          <div class="slide-centered slide-lesbar">
            <p>Die Regeln unserer Grammatik sehen so aus. Der Pfeil liest sich als „besteht aus“, der senkrechte Strich als „oder“.</p>
            <div class="robot-card grammatik-fenster">
            ${rasterHtml(grammatik())}
            </div>
            <p>Ein Programm besteht also aus einer oder mehreren Anweisungen und dem Programmende, das der Scanner hinter dem letzten Token meldet. Eine Anweisung ist eine Deklaration oder eine Bewegung, gefolgt von einem Semikolon. Bei einer Deklaration steht hinter dem Gleichheitszeichen ein Ausdruck, bei uns bisher ein Bezeichner oder ein Literal. In den Klammern einer Bewegung steht direkt ein Bezeichner oder ein Literal, bei uns bisher eine Zahl.</p>
            <p>Für den Parser zählt nur der Tokencode, nicht der Wert. Ob ein Bezeichner „schritte“ oder „weg“ heißt, spielt keine Rolle. Bei Zahlen ist es genauso: Ob es 3 oder 42 ist, spielt keine Rolle. Für die Struktur ist nur wichtig, dass an dieser Stelle ein Wert steht, deshalb fasst die Regel „Literal“ solche Werte zusammen.</p>
          </div>
        `;
      },
    },
    {
      id: 's3',
      title: 'Der Syntaxbaum',
      // Text links, Abbildung des Baums rechts (Layout wie in 1.2, Folie 6 und 7)
      render: (container) => {
        container.innerHTML = `
          <div class="slide-split">
            <div class="slide-split-text slide-centered slide-lesbar">
              <p>Bei der Syntaxanalyse baut der Parser mithilfe der Regeln einen Baum auf, der die Struktur des Programms abbildet. Ganz oben steht das ganze Programm, darunter kommen immer kleinere Sprachkonstrukte. Ganz unten, an den Blättern, stehen die Tokens.</p>
              <p>Um den Baum aufzubauen, erhält der Parser die Tokens Stück für Stück aus der Liste des Scanners. Bei jedem Token muss er entscheiden: Kann ich es an der aktuellen Stelle schon einsetzen, oder muss ich zuerst ein Sprachkonstrukt nach den Regeln in seine Teile zerlegen?</p>
              <p>Am Beispiel <span class="code-papier">moveUp(1);</span>: Der Baum beginnt mit dem Programm. Das erste Token ist ${marke('keyword', 'moveUp')}. Dafür gibt es unter dem Programm noch keine passende Stelle. Also zerlegt der Parser das Programm in eine Anweisung und die Anweisung in eine Bewegung. Erst dort darf ${marke('keyword', 'moveUp')} stehen. Die folgenden Tokens ${marke('separator', '(')}, ${marke('literal', '1')} und ${marke('separator', ')')} setzt er direkt unter die Bewegung, denn die Regel erlaubt sie dort in dieser Reihenfolge. Das Semikolon gehört nicht mehr zur Bewegung, sondern zur Anweisung, also hängt er es dort ein.</p>
            </div>
            <div class="slide-split-figure">
              <div class="baum-host"></div>
              <p class="abbildung-unterschrift">Syntaxbaum zu dem Programm <span class="code-papier">moveUp(1);</span></p>
            </div>
          </div>
        `;
        // zeigeBaum leert seinen Container, deshalb bekommt der Baum einen eigenen und die Unterschrift steht daneben
        return zeigeBaum(container.querySelector('.baum-host'), BEISPIEL_BAUM);
      },
    },
    {
      id: 's4',
      title: 'Syntaxfehler',
      // Die Beispiele stehen als Tokens in den Lexik-Farben, so wie der Parser sie vom Scanner bekommt
      render: (container) => {
        const tokens = (...t) => t.map(([art, text]) => marke(art, text)).join(' ');
        container.innerHTML = `
          <div class="slide-centered slide-lesbar">
            <p>Findet der Parser für ein Token keine Stelle, an die es laut Regel passt, liegt ein <strong>Syntaxfehler</strong> vor.</p>
            <div class="vergleich">
              <div class="robot-card robot-card--geteilt robot-card--stapel">
               <div class="robot-card-teil">
                <h2>Das Semikolon fehlt</h2>
                <p>${tokens(['keyword', 'moveRight'], ['separator', '('], ['identifier', 'schritte'], ['separator', ')'])}<br>${tokens(['keyword', 'moveUp'], ['separator', '('], ['literal', '1'], ['separator', ')'], ['separator', ';'])}</p>
                <p>Nach der Klammer erwartet die Regel ein ${marke('separator', ';')}, es folgt aber ${marke('keyword', 'moveUp')}.</p>
               </div>
               <div class="robot-card-teil">
                <h2>Tippfehler im Befehl</h2>
                <p>${tokens(['identifier', 'moveUpp'], ['separator', '('], ['literal', '1'], ['separator', ')'], ['separator', ';'])}</p>
                <p>Der Scanner hält ${marke('identifier', 'moveUpp')} für einen Bezeichner.</p>
                <p>Eine Anweisung beginnt aber mit ${marke('keyword', 'number')} oder einem der vier Schlüsselwörter für eine Bewegung.</p>
               </div>
              </div>
            </div>
            <p>Auf den nächsten Folien bist du der Parser und baust den Baum Token für Token auf.</p>
          </div>
        `;
      },
    },
    {
      id: 's5',
      title: 'Werde zum Parser: Deklaration und Bewegungen',
      render: (container) => renderEinzelphase(container, parserUebung(PARSER_PROGRAMM)),
    },
    {
      id: 's6',
      title: 'Werde zum Parser: Fehlende Klammer',
      render: (container) => renderEinzelphase(container, parserUebung(PARSER_FEHLER)),
    },
  ],
};

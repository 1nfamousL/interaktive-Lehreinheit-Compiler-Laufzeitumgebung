import { render as renderEinzelphase } from '../../js/exercises/einzelphase.js';
import { prog, dek, bew, zahl, variable } from '../../js/exercises/compiler-weg-semantik-regeln.js';
import { zeigeBaum } from '../../js/baum-abbildung.js';

// Ein einzelnes Token im Text, eingefärbt wie in der Lexik-Übung (art = Werkzeug-ID, siehe 2-2.js).
// Programmteile aus mehreren Tokens stehen als code(...) auf Papier.
const marke = (art, text) => `<span class="token-marke lex-mark-${art}">${text}</span>`;
const code = (text) => `<span class="code-papier">${text}</span>`;
// Fehlerknopf wie in der Übung (Texte aus FEHLER in compiler-weg-semantik-regeln.js)
const fehlerknopf = (text) => `<span class="mini-fehlerknopf">${text}</span>`;

// Das Beispielprogramm aus Kapitel 1 als Quellcode im Text
const BEISPIEL = '<span class="slide-code code-papier">number schritte = 2;\nmoveRight(schritte);\nmoveUp(1);</span>';

// Abstrakter Syntaxbaum zum Beispielprogramm für die Abbildung auf Folie 5 (wie der Baum der Übung,
// noch ohne Typen und Haken)
const ABBILDUNG_AST = {
  nt: 'Programm',
  kinder: [
    { nt: 'Deklaration (number, schritte)', kinder: [{ t: '2' }] },
    { nt: 'moveRight', kinder: [{ t: 'schritte' }] },
    { nt: 'moveUp', kinder: [{ t: '1' }] },
  ],
};

// Übung "Werde zur semantischen Analyse": dasselbe Programm wie in den Übungen
// davor, fehlerfrei.
const SEMANTIK_BAUM = () => prog(
  dek('number', 'schritte', zahl(2)),
  bew('rechts', variable('schritte')),
  bew('oben', zahl(1)),
);

// Fehler undeclared: Tippfehler im Namen, „schritt“ statt „schritte“ steht nicht in der Symboltabelle.
const BAUM_UNDECLARED = () => prog(
  dek('number', 'schritte', zahl(2)),
  bew('rechts', variable('schritt')),
  bew('oben', zahl(1)),
);

// Fehler duplicate: Der Name „schritte“ wird ein zweites Mal deklariert.
const BAUM_DUPLICATE = () => prog(
  dek('number', 'schritte', zahl(2)),
  dek('number', 'schritte', zahl(3)),
  bew('rechts', variable('schritte')),
  bew('oben', zahl(1)),
);

// Alle Übungen unterscheiden sich nur im Baum. `range` kommt in Kapitel 2 nur im Text vor
// (die Übung dazu steht in Kapitel 3), steht aber weiter zur Auswahl.
function semantikUebung(baum) {
  // Stand Kapitel 2: nur der Typ number, keine Blöcke (also keine Bereiche), kein Typfehler
  return {
    phase: 'semantik',
    baum,
    typen: ['number'],
    fehler: ['range', 'undeclared', 'duplicate'],
    symboltabelle: true,
    regelnHtml: SEMANTIK_REGELN,
  };
}

// Regeln für das Pop-up der Übung. Es stehen nur die Regeln da, die bis zu
// diesem Kapitel vorkommen.
const SEMANTIK_REGELN = `
  <div class="modal-abschnitt">Werte und Ausdrücke</div>
  <p><strong>Zahl</strong> → Typ number<span class="regel-satz">Jede Zahl hat den Typ number und liegt zwischen 0 und 255.</span></p>
  <p><strong>Konstante</strong> → Typ aus der Symboltabelle<span class="regel-satz">Eine Konstante muss deklariert und an dieser Stelle sichtbar sein. Ihr Typ steht in der Symboltabelle.</span></p>
  <div class="modal-abschnitt">Anweisungen</div>
  <p><strong>Deklaration</strong> → Eintrag in der Symboltabelle<span class="regel-satz">Der Name darf noch nicht sichtbar sein. Danach wird die Konstante in die Symboltabelle eingetragen.</span></p>
  <p><strong>Bewegung</strong> → Argument ist number<span class="regel-satz">Das Argument einer Bewegung muss vom Typ number sein.</span></p>
`;

export const LEKTION = {
  id: '2-4',
  title: '2.4 Semantik: Namen und Typen prüfen',
  desc: 'Namen und Typen prüfen: nicht deklarierte und doppelte Namen.',
  slides: [
    {
      id: 's1',
      title: 'Was ist das?',
      text: [
        'Dritter Schritt beim Übersetzen. Das Programm ist jetzt schon richtig geschrieben und richtig aufgebaut.',
        'Der Compiler prüft, ob es auch inhaltlich Sinn ergibt.',
        'Vergleich: „Der Stein trinkt Kaffee“ ist ein korrekter Satz, aber er ergibt keinen Sinn.'
      ],
    },
    {
      id: 's2',
      title: 'Typen',
      text: [
        'Jeder Wert hat einen Datentyp, kurz Typ. Er legt fest, welche Werte möglich sind und was man damit tun darf.',
        `In unserer Sprache gibt es bisher nur den Typ ${marke('keyword', 'number')}. Der Roboter speichert Zahlen in einem Byte, also in 8 Bit. Deshalb erlaubt unser Typ nur ganze Zahlen von 0 bis 255.`,
        `Weder Scanner noch Parser prüfen das, für sie ist ${marke('literal', '300')} ein gültiges Literal. Erst die semantische Analyse prüft, ob der Wert in den erlaubten Bereich fällt.`,
      ],
    },
    {
      id: 's3',
      title: 'Namen müssen bekannt sein',
      // Mini-Symboltabelle wie in der Übung (.sem-bereich mit .sem-zeile)
      render: (container) => {
        container.innerHTML = `
          <div class="slide-centered slide-lesbar">
            <p>Namen wie ${marke('identifier', 'schritte')} denkt sich der Programmierer aus, der Compiler kennt sie nicht. Deshalb gilt: Ein Name muss deklariert sein, bevor man ihn benutzt. Die Deklaration sagt dem Compiler, dass es den Namen gibt und welchen Typ er hat.</p>
            <p>Der Compiler schreibt sich das in eine Liste, die <strong>Symboltabelle</strong>. Jede Zeile besteht aus Namen und Typ.</p>
            <div class="sem-bereich sem-bereich--text sem-bereich--uebung">
              <div class="pb-label">Symboltabelle</div>
              <div class="sem-zeile"><span>schritte</span><span>number</span></div>
            </div>
            <p>Wird ein Name benutzt, schaut der Compiler in der Liste nach. Steht der Name nicht darin, ist das ein Fehler. Steht er darin, liest der Compiler seinen Typ aus der Tabelle.</p>
          </div>
        `;
      },
    },
    {
      id: 's4',
      title: 'Regeln und Fehler',
      // Jede Regel mit ihrem Fehler als Karte; die Fehlerknöpfe sind die aus der Übung
      render: (container) => {
        container.innerHTML = `
          <div class="slide-centered slide-lesbar">
            <p>Für unsere Sprache gelten drei Regeln. Verstößt ein Knoten gegen eine davon, meldet der Compiler einen semantischen Fehler. Die Fehler heißen wie die Knöpfe in der Übung.</p>
            <div class="vergleich">
              <div class="robot-card robot-card--geteilt robot-card--stapel">
               <div class="robot-card-teil">
                <p>${fehlerknopf('Zahl über 255')}</p>
                <p>Jede Zahl hat den Typ ${marke('keyword', 'number')} und liegt zwischen 0 und 255.</p>
                <p>z.B. ${code('number hoch = 300;')}</p>
               </div>
               <div class="robot-card-teil">
                <p>${fehlerknopf('Nicht deklariert')}</p>
                <p>Ein Name muss vorher deklariert sein, bevor man ihn benutzt.</p>
                <p>z.B. ${code('moveRight(weg);')}, wenn es ${marke('identifier', 'weg')} nie gab.</p>
               </div>
               <div class="robot-card-teil">
                <p>${fehlerknopf('Doppelt deklariert')}</p>
                <p>Ein Name darf nur einmal vergeben werden.</p>
                <p>z.B. ${code('number doppelt = 1; number doppelt = 2;')}</p>
               </div>
              </div>
            </div>
          </div>
        `;
      },
    },
    {
      id: 's5',
      title: 'Der abstrakte Syntaxbaum',
      // Text links, Abbildung des Baums rechts (Layout wie in 2.3, Folie 3)
      render: (container) => {
        container.innerHTML = `
          <div class="slide-split">
            <div class="slide-split-text slide-centered slide-lesbar">
              <p>Für die Prüfung braucht der Compiler nicht jedes Detail des Syntaxbaums. Gliederungszeichen wie „(“, „)“ und „;“ und Zwischenknoten wie Anweisung fallen weg. Übrig bleibt ein schlankerer Baum, der abstrakte Syntaxbaum.</p>
              <p>Der Compiler geht diesen Baum Knoten für Knoten durch, erst die Kinder, dann den Knoten selbst. Bei ${marke('keyword', 'moveRight')} prüft er also zuerst den Namen ${marke('identifier', 'schritte')} und schlägt ihn nach, danach, ob er als Argument passt. Denn ob ein Knoten richtig ist, hängt von seinen Kindern ab. Die Deklaration steht vor der Bewegung, deshalb steht ${marke('identifier', 'schritte')} schon in der Symboltabelle, wenn er gebraucht wird.</p>
            </div>
            <div class="slide-split-figure">
              <div class="baum-host"></div>
              <p class="abbildung-unterschrift">Syntaxbaum zum Beispielprogramm</p>
              ${BEISPIEL}
            </div>
          </div>
        `;
        // zeigeBaum leert seinen Container, deshalb bekommt der Baum einen eigenen (wie in 2.3, Folie 3)
        return zeigeBaum(container.querySelector('.baum-host'), ABBILDUNG_AST, { ast: true });
      },
    },
    {
      id: 's6',
      title: 'Was der Compiler nicht sieht',
      text: [
        `Nicht auffallen kann dem Compiler, was erst vom Ablauf des Programms abhängt. ${code('moveRight(200);')} ist semantisch in Ordnung, der Roboter fährt damit aber gegen ein Hindernis. Solche Fehler zeigen sich erst zur Laufzeit.`,
        'Besteht das Programm die Prüfung, geht der geprüfte Baum an die Codegenerierung.',
        'Auf den nächsten Folien übernimmst du die Arbeit der semantischen Analyse: Du gehst den Baum Knoten für Knoten durch, bestimmst Typen, trägst Deklarationen in die Symboltabelle ein und schlägst Namen nach.',
      ],
    },
    {
      id: 's7',
      title: 'Prüfe den Baum: Namen und Typen',
      render: (container) => renderEinzelphase(container, semantikUebung(SEMANTIK_BAUM)),
    },
    {
      id: 's8',
      title: 'Prüfe den Baum: Nicht deklarierter Name',
      render: (container) => renderEinzelphase(container, semantikUebung(BAUM_UNDECLARED)),
    },
    {
      id: 's9',
      title: 'Prüfe den Baum: Doppelter Name',
      render: (container) => renderEinzelphase(container, semantikUebung(BAUM_DUPLICATE)),
    },
  ],
};

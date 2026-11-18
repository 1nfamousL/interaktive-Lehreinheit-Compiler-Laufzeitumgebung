import { render as renderEinzelphase } from '../../js/exercises/einzelphase.js';
import { prog, dek, bew, if_, op, zahl, wahrheit, variable } from '../../js/exercises/compiler-weg-semantik-regeln.js';

// Übung "Werde zur semantischen Analyse": dasselbe Programm wie in den Übungen
// davor, fehlerfrei.
const SEMANTIK_BAUM = () => prog(
  dek('number', 'schritte', zahl(3)),
  dek('boolean', 'weit', wahrheit('false')),
  if_(op('>', variable('schritte'), zahl(2)), bew('oben', zahl(1))),
  if_(op('==', variable('weit'), wahrheit('true')), bew('rechts', variable('schritte'))),
);

// Fehler type: Die Bedingung des ersten if ist eine Zahl (if (schritte) {), verlangt ist ein boolean.
const BAUM_TYPE = () => prog(
  dek('number', 'schritte', zahl(3)),
  dek('boolean', 'weit', wahrheit('false')),
  if_(variable('schritte'), bew('oben', zahl(1))),
  if_(op('==', variable('weit'), wahrheit('true')), bew('rechts', variable('schritte'))),
);

// Beide Übungen unterscheiden sich nur im Baum.
function semantikUebung(baum) {
  return {
    phase: 'semantik',
    baum,
    typen: ['number', 'boolean'],
    fehler: ['range', 'undeclared', 'duplicate', 'type'],
    symboltabelle: true,
    bereiche: true,
    regelnHtml: SEMANTIK_REGELN,
  };
}

// Regeln für das Pop-up der Übung. Es stehen nur die Regeln da, die bis zu
// diesem Kapitel vorkommen.
const SEMANTIK_REGELN = `
  <div class="modal-abschnitt">Werte und Ausdrücke</div>
  <p><strong>Zahl</strong> → Typ number<span class="regel-satz">Jede Zahl hat den Typ number und liegt zwischen 0 und 255.</span></p>
  <p><strong>true, false</strong> → Typ boolean</p>
  <p><strong>Variable</strong> → Typ aus der Symboltabelle<span class="regel-satz">Eine Variable muss deklariert und an dieser Stelle sichtbar sein. Ihr Typ steht in der Symboltabelle.</span></p>
  <p><strong>Rechnen</strong> (+ - * /) → Typ number<span class="regel-satz">Beide Seiten müssen vom Typ number sein.</span></p>
  <p><strong>Vergleichen</strong> (&lt; &gt; &lt;= &gt;=) → Typ boolean<span class="regel-satz">Beide Seiten müssen vom Typ number sein.</span></p>
  <p><strong>Gleichheit</strong> (== !=) → Typ boolean<span class="regel-satz">Beide Seiten müssen denselben Typ haben.</span></p>
  <div class="modal-abschnitt">Anweisungen</div>
  <p><strong>Deklaration</strong> → Eintrag in der Symboltabelle<span class="regel-satz">Der Name darf noch nicht sichtbar sein, auch nicht in einem äußeren Bereich. Der Typ des Ausdrucks muss zum deklarierten Typ passen.</span></p>
  <p><strong>Zuweisung</strong><span class="regel-satz">Die Variable muss deklariert sein, und der Typ des Ausdrucks muss zu ihrem Typ passen.</span></p>
  <p><strong>Bewegung</strong> → Argument ist number<span class="regel-satz">Das Argument einer Bewegung muss vom Typ number sein.</span></p>
  <p><strong>if</strong> → Bedingung ist ein boolean<span class="regel-satz">Die Bedingung muss vom Typ boolean sein, ein if mit einer Zahl als Bedingung ist ein Typfehler.</span></p>
  <div class="modal-abschnitt">Blöcke</div>
  <p><strong>Block</strong> → eigener Bereich<span class="regel-satz">Jeder Block bekommt beim Betreten einen eigenen Bereich in der Symboltabelle und verliert ihn beim Verlassen wieder. Variablen aus einem Block sind außerhalb nicht sichtbar.</span></p>
`;

// Ein einzelnes Token im Text, eingefärbt wie in der Lexik-Übung (art = Werkzeug-ID, siehe 2-2.js).
// Programmteile aus mehreren Tokens stehen als code(...) auf Papier.
const marke = (art, text) => `<span class="token-marke lex-mark-${art}">${text}</span>`;
const code = (text) => `<span class="code-papier">${text}</span>`;
// Fehlerknopf wie in der Übung (Texte aus FEHLER in compiler-weg-semantik-regeln.js)
const fehlerknopf = (text) => `<span class="mini-fehlerknopf">${text}</span>`;

export const LEKTION = {
  id: '4-4',
  title: '4.4 Semantik: Typfehler und Gültigkeitsbereiche',
  desc: 'Der Typ boolean, Bedingungen prüfen, Blöcke mit eigenem Gültigkeitsbereich.',
  slides: [
    {
      id: 's1',
      title: 'Was ist neu?',
      render: (container) => {
        container.innerHTML = `
          <div class="slide-centered slide-lesbar">
            <p>Die semantische Analyse arbeitet wie bisher: Sie geht den abstrakten Syntaxbaum durch, bestimmt Typen und prüft Namen mithilfe der Symboltabelle. Neu ist ein zweiter Typ, ${marke('keyword', 'boolean')}. Damit gibt es zum ersten Mal Typen, die an einer Stelle nicht zusammenpassen.</p>
            <div class="vergleich">
              <div class="robot-card robot-card--geteilt robot-card--stapel">
               <div class="robot-card-teil">
                <h2>Der Typ boolean</h2>
                <p>${marke('literal', 'true')} und ${marke('literal', 'false')} haben den Typ ${marke('keyword', 'boolean')}, Zahlen den Typ ${marke('keyword', 'number')}. Scanner und Parser behandeln beide gleich, erst die Semantik legt den Typ fest.</p>
               </div>
               <div class="robot-card-teil">
                <h2>Vergleich</h2>
                <p>Bei ${marke('operator', '&lt;')} ${marke('operator', '&gt;')} ${marke('operator', '&lt;=')} ${marke('operator', '&gt;=')} müssen beide Seiten den Typ ${marke('keyword', 'number')} haben. Bei ${marke('operator', '==')} und ${marke('operator', '!=')} müssen beide Seiten denselben Typ haben. Das Ergebnis ist immer ${marke('keyword', 'boolean')}. Z.B. ${code('schritte &gt; 2')}, ${code('weit == true')} und ${code('schritte == 2')}</p>
               </div>
               <div class="robot-card-teil">
                <h2>If</h2>
                <p>Die Bedingung einer If-Anweisung muss den Typ ${marke('keyword', 'boolean')} haben.</p>
                <p>z.B. ${code('if (schritte &gt; 2)')}</p>
               </div>
               <div class="robot-card-teil">
                <h2>Deklaration</h2>
                <p>Der Typ des Ausdrucks muss zum deklarierten Typ passen. Solange es nur ${marke('keyword', 'number')} gab, konnte das nicht schiefgehen.</p>
                <p>z.B. ${code('boolean weit = schritte &gt; 2;')}</p>
               </div>
              </div>
            </div>
          </div>
        `;
      },
    },
    {
      id: 's2',
      title: 'Gültigkeitsbereiche',
      // Mini-Symboltabelle wie in der Übung (.sem-tabelle mit .sem-bereich, eingerückt wie dort)
      render: (container) => {
        container.innerHTML = `
          <div class="slide-centered slide-lesbar">
            <p>Ein Block bekommt in der Symboltabelle einen eigenen <strong>Gültigkeitsbereich</strong>: den Teil des Programms, in dem seine Namen gültig, also sichtbar sind. Betritt der Compiler den Block, legt er einen neuen Gültigkeitsbereich oben auf die Tabelle, beim Verlassen nimmt er ihn wieder weg. Beim Nachschlagen sucht er von innen nach außen.</p>
            <p>So sieht die Tabelle in ${code('if (schritte &gt; 2) { number hoch = 1; …')} aus:</p>
            <div class="sem-tabelle">
              <div class="sem-bereich sem-bereich--text sem-bereich--uebung">
                <div class="pb-label">Programm</div>
                <div class="sem-zeile"><span>schritte</span><span>number</span></div>
              </div>
              <div class="sem-bereich sem-bereich--text sem-bereich--uebung" style="margin-left:12px">
                <div class="pb-label">Block</div>
                <div class="sem-zeile"><span>hoch</span><span>number</span></div>
              </div>
            </div>
            <div class="vergleich">
              <div class="robot-card robot-card--geteilt robot-card--stapel">
               <div class="robot-card-teil">
                <h2>Name nur im Block</h2>
                <p>Nach dem Block ist sein Gültigkeitsbereich weg und ${marke('identifier', 'hoch')} nicht mehr sichtbar. Der Compiler meldet ${fehlerknopf('Nicht deklariert')}.</p>
                <p>z.B. ${code('if (schritte &gt; 2) { number hoch = 1; } moveUp(hoch);')}</p>
               </div>
               <div class="robot-card-teil">
                <h2>Name schon vergeben</h2>
                <p>Ein Name aus einem äußeren Gültigkeitsbereich ist auch im Block sichtbar. Ihn dort neu zu deklarieren, meldet der Compiler als ${fehlerknopf('Doppelt deklariert')}.</p>
                <p>z.B. ${code('if (schritte &gt; 2) { number schritte = 1; }')}</p>
               </div>
              </div>
            </div>
          </div>
        `;
      },
    },
    {
      id: 's3',
      title: 'Typfehler',
      render: (container) => {
        container.innerHTML = `
          <div class="slide-centered slide-lesbar">
            <p>Mit zwei Typen gibt es eine neue Fehlerart, den ${fehlerknopf('Typfehler')}. Er liegt vor, wenn ein Typ an einer Stelle nicht passt:</p>
            <div class="vergleich">
              <div class="robot-card robot-card--geteilt robot-card--stapel">
               <div class="robot-card-teil">
                <h2>Rechnen mit einem Wahrheitswert</h2>
                <p>Rechnen verlangt auf beiden Seiten ${marke('keyword', 'number')}, ${marke('literal', 'true')} ist aber ${marke('keyword', 'boolean')}.</p>
                <p>z.B. ${code('true + 1')}</p>
               </div>
               <div class="robot-card-teil">
                <h2>Gleichheit mit verschiedenen Typen</h2>
                <p>Bei ${marke('operator', '==')} müssen beide Seiten denselben Typ haben, hier sind es ${marke('keyword', 'boolean')} und ${marke('keyword', 'number')}.</p>
                <p>z.B. ${code('weit == 3')}</p>
               </div>
               <div class="robot-card-teil">
                <h2>Falscher Typ in der Deklaration</h2>
                <p>Die Variable ist ${marke('keyword', 'boolean')}, der Ausdruck aber ${marke('keyword', 'number')}.</p>
                <p>z.B. ${code('boolean weit = 3;')}</p>
               </div>
              </div>
            </div>
            <p>Auf den nächsten Folien prüfst du wieder den Baum Knoten für Knoten.</p>
          </div>
        `;
      },
    },
    {
      id: 's4',
      title: 'Prüfe den Baum: Wahrheitswerte und Blöcke',
      render: (container) => renderEinzelphase(container, semantikUebung(SEMANTIK_BAUM)),
    },
    {
      id: 's5',
      title: 'Prüfe den Baum: Zahl als Bedingung',
      render: (container) => renderEinzelphase(container, semantikUebung(BAUM_TYPE)),
    },
  ],
};

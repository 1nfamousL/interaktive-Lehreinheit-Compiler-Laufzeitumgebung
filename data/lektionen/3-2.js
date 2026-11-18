import { render as renderEinzelphase } from '../../js/exercises/einzelphase.js';

// Quellcode der Übung "Werde zum Scanner": ein durchgehender Zeichenstrom
// in der Roboter-Sprache, so wie der Scanner ihn sieht. Das zweite „Number“ ist falsch
// geschrieben: Der Scanner meldet keinen Fehler, es ist ein Bezeichner.
const SCANNER_CODE = 'number weg = 4 + 3;Number a = 10 - weg;moveRight(a);';

// Ein einzelnes Token im Text, eingefärbt wie in der Übung (Art = Werkzeug-ID der Lexik-Übung).
// Quellcode-Fragmente aus mehreren Tokens stehen dagegen als code(...) auf Papier.
const marke = (art, text) => `<span class="token-marke lex-mark-${art}">${text}</span>`;
const code = (text) => `<span class="code-papier">${text}</span>`;

export const LEKTION = {
  id: '3-2',
  title: '3.2 Lexik: Rechenzeichen und Schreibweise',
  desc: 'Rechenzeichen sind eigene Tokens, ein falsch geschriebenes Schlüsselwort ist ein Bezeichner.',
  slides: [
    {
      id: 's1',
      title: 'Was ist neu?',
      // Die vier neuen Operatoren sind in der Übersicht umrandet (.token-marke--neu)
      render: (container) => {
        const neu = (art, text) => `<span class="token-marke lex-mark-${art} token-marke--neu">${text}</span>`;
        container.innerHTML = `
          <div class="slide-centered slide-lesbar">
            <p>Der Scanner arbeitet wie in Kapitel 2. Neu sind nur die vier Rechenzeichen ${neu('operator', '+')} ${neu('operator', '-')} ${neu('operator', '*')} ${neu('operator', '/')}. Sie sind Operatoren, so wie das ${marke('operator', '=')}.</p>
            <p>In unserer Sprache gibt es keine negativen Zahlen, deshalb ist „-“ immer ein eigenes Token, und aus ${code('-1')} werden die zwei Tokens ${marke('operator', '-')} und ${marke('literal', '1')}. Ob das an dieser Stelle erlaubt ist, entscheidet erst der Parser.</p>
            <p>Schreibst du ein Schlüsselwort falsch, zum Beispiel „MoveRight“ statt „moveRight“, sieht das für uns nach einer falschen Zuordnung aus. Der Scanner kennt aber nur die Wörter seiner Liste, und „MoveRight“ steht nicht darin. Für ihn ist es ein Bezeichner wie jeder andere, und das ist völlig legitim. Der Fehler fällt deshalb erst in einer späteren Phase auf.</p>
            <p>Hier alle Tokens unserer Sprache, geordnet nach Gruppen:</p>
            <div class="robot-card token-uebersicht-fenster">
            <div class="token-uebersicht">
              <span class="token-uebersicht-gruppe">Schlüsselwörter</span>
              <span>${['number', 'moveUp', 'moveDown', 'moveRight', 'moveLeft'].map((t) => marke('keyword', t)).join(' ')}</span>
              <span class="token-uebersicht-gruppe">Bezeichner</span>
              <span>${marke('identifier', 'a')} ${marke('identifier', 'weg')} <span class="grammatik-zeichen">… selbst gewählte Namen</span></span>
              <span class="token-uebersicht-gruppe">Literale</span>
              <span>${marke('literal', '1')} ${marke('literal', '255')} <span class="grammatik-zeichen">… Zahlen</span></span>
              <span class="token-uebersicht-gruppe">Operatoren</span>
              <span>${marke('operator', '=')} ${neu('operator', '+')} ${neu('operator', '-')} ${neu('operator', '*')} ${neu('operator', '/')}</span>
              <span class="token-uebersicht-gruppe">Gliederungszeichen</span>
              <span>${['(', ')', ';'].map((t) => marke('separator', t)).join(' ')}</span>
            </div>
            </div>
            <p>Auf der nächsten Folie färbst du wieder alle Tokens ein.</p>
          </div>
        `;
      },
    },
    {
      id: 's2',
      title: 'Werde zum Scanner: Rechenzeichen und Schreibweise',
      render: (container) => renderEinzelphase(container, {
        phase: 'lexik',
        code: SCANNER_CODE,
        werkzeuge: ['keyword', 'identifier', 'literal', 'operator', 'separator', 'error'],
        schluesselwoerter: ['number', 'moveUp', 'moveDown', 'moveRight', 'moveLeft'],
        hinweisKategorien: 'Ist es ein festes Wort der Sprache (genau so geschrieben, auch in Groß- und Kleinschreibung), ein selbst gewählter Name, ein Zahlenwert, ein Rechen- oder Zuweisungszeichen oder ein Zeichen zum Gliedern?',
      }),
    },
  ],
};

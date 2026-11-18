import { render as renderEinzelphase } from '../../js/exercises/einzelphase.js';

// Quellcode der Übung "Werde zum Scanner": ein durchgehender Zeichenstrom
// in der Roboter-Sprache, so wie der Scanner ihn sieht. Das „!“ steht allein, mit einem
// Leerzeichen dahinter: Nur „!=“ ist ein Token, ein einzelnes „!“ passt zu keiner Tokengruppe.
// Der Fehler liegt hinter dem neuen Schlüsselwort while, damit es vor ihm gelesen wird
// (die lexikalische Analyse endet beim ersten Fehler, der Rest bleibt ungelesen).
const SCANNER_CODE = 'number n=3;while(n ! 0){moveRight(1);moveUp(1);n=n-1;}';

// Ein einzelnes Token im Text, eingefärbt wie in der Übung (art = Werkzeug-ID der Lexik-Übung);
// neu = zusätzlich umrandet (.token-marke--neu)
const marke = (art, text) => `<span class="token-marke lex-mark-${art}">${text}</span>`;
const neu = (art, text) => `<span class="token-marke lex-mark-${art} token-marke--neu">${text}</span>`;

export const LEKTION = {
  id: '5-2',
  title: '5.2 Lexik: Ein „!“ allein',
  desc: 'Ein einzelnes „!“ passt zu keinem Token, der Scanner meldet einen Fehler.',
  slides: [
    {
      id: 's1',
      title: 'Was ist neu?',
      // Die Übersicht aller Tokens, das neue Schlüsselwort ist umrandet
      render: (container) => {
        container.innerHTML = `
          <div class="slide-centered slide-lesbar">
            <p>Neu ist nur das Schlüsselwort ${neu('keyword', 'while')}. Hier alle Tokens unserer Sprache, geordnet nach Gruppen:</p>
            <div class="robot-card token-uebersicht-fenster">
            <div class="token-uebersicht">
              <span class="token-uebersicht-gruppe">Schlüsselwörter</span>
              <span>${['number', 'boolean', 'if', 'moveUp', 'moveDown', 'moveRight', 'moveLeft'].map((t) => marke('keyword', t)).join(' ')} ${neu('keyword', 'while')}</span>
              <span class="token-uebersicht-gruppe">Bezeichner</span>
              <span>${marke('identifier', 'a')} ${marke('identifier', 'weg')} <span class="grammatik-zeichen">… selbst gewählte Namen</span></span>
              <span class="token-uebersicht-gruppe">Literale</span>
              <span>${marke('literal', '1')} ${marke('literal', '255')} <span class="grammatik-zeichen">… Zahlen</span> ${marke('literal', 'true')} ${marke('literal', 'false')}</span>
              <span class="token-uebersicht-gruppe">Operatoren</span>
              <span>${['=', '+', '-', '*', '/', '<', '>', '<=', '>=', '==', '!='].map((t) => marke('operator', t)).join(' ')}</span>
              <span class="token-uebersicht-gruppe">Gliederungszeichen</span>
              <span>${['(', ')', ';', '{', '}'].map((t) => marke('separator', t)).join(' ')}</span>
            </div>
            </div>
          </div>
        `;
      },
    },
    {
      id: 's2',
      title: 'Werde zum Scanner: Ein „!“ allein',
      render: (container) => renderEinzelphase(container, {
        phase: 'lexik',
        code: SCANNER_CODE,
        werkzeuge: ['keyword', 'identifier', 'literal', 'operator', 'separator', 'error'],
        schluesselwoerter: ['number', 'boolean', 'if', 'while', 'moveUp', 'moveDown', 'moveRight', 'moveLeft'],
        literalwoerter: ['true', 'false'],
        hinweisKategorien: 'Ist es ein festes Wort der Sprache, ein selbst gewählter Name, ein Wert, ein Rechen-, Zuweisungs- oder Vergleichszeichen oder ein Zeichen zum Gliedern, oder passt es zu keiner Tokengruppe?',
      }),
    },
  ],
};

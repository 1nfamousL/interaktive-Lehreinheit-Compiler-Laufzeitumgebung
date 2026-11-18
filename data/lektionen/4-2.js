import { render as renderEinzelphase } from '../../js/exercises/einzelphase.js';

// Quellcode der Übung "Werde zum Scanner": ein durchgehender Zeichenstrom
// in der Roboter-Sprache, so wie der Scanner ihn sieht. Der Code ist fehlerfrei und
// zeigt alles Neue des Kapitels: „<=“ und „==“ sind je ein Token (der Scanner liest das
// längste passende), dazu die geschweiften Klammern und die Werte true und false.
const SCANNER_CODE = 'number schritte=3;boolean weit=false;if(schritte <= 3){moveUp(1);}if(weit == true){moveRight(schritte);}';

// Ein einzelnes Token im Text, eingefärbt wie in der Übung (Art = Werkzeug-ID der Lexik-Übung).
// Quellcode-Fragmente aus mehreren Tokens stehen dagegen als code(...) auf Papier.
const marke = (art, text) => `<span class="token-marke lex-mark-${art}">${text}</span>`;
const neu = (art, text) => `<span class="token-marke lex-mark-${art} token-marke--neu">${text}</span>`;
const code = (text) => `<span class="code-papier">${text}</span>`;

function scannerUebung(code) {
  return {
    phase: 'lexik',
    code,
    werkzeuge: ['keyword', 'identifier', 'literal', 'operator', 'separator', 'error'],
    schluesselwoerter: ['number', 'boolean', 'if', 'moveUp', 'moveDown', 'moveRight', 'moveLeft'],
    literalwoerter: ['true', 'false'],
    hinweisKategorien: 'Ist es ein festes Wort der Sprache, ein selbst gewählter Name, ein Wert, ein Rechen-, Zuweisungs- oder Vergleichszeichen oder ein Zeichen zum Gliedern?',
  };
}

export const LEKTION = {
  id: '4-2',
  title: '4.2 Lexik: Das längste Token gewinnt',
  desc: 'Mehrzeichen-Operatoren wie <= sind ein Token.',
  slides: [
    {
      id: 's1',
      title: 'Was ist neu?',
      // Die neuen Tokens sind in der Übersicht umrandet (.token-marke--neu)
      render: (container) => {
        container.innerHTML = `
          <div class="slide-centered slide-lesbar">
            <p>Der Scanner arbeitet wie in Kapitel 3. Neu sind die Schlüsselwörter ${neu('keyword', 'boolean')} und ${neu('keyword', 'if')}, die Werte ${neu('literal', 'true')} und ${neu('literal', 'false')}, die sechs Vergleichszeichen und die geschweiften Klammern ${neu('separator', '{')} und ${neu('separator', '}')}.</p>
            <p>${marke('literal', 'true')} und ${marke('literal', 'false')} sehen aus wie Schlüsselwörter und werden auch so erkannt: Der Scanner liest das ganze Wort und findet es in der Liste der festen Wörter. Ihr Tokencode ist deshalb wie bei den Schlüsselwörtern der Baustein selbst. Wir ordnen sie trotzdem den Literalen zu, weil der Parser sie genauso behandelt wie Zahlen: Wo eine Zahl stehen darf, darf auch ${code('true')} oder ${code('false')} stehen. Ob der Typ dazu passt, prüft erst die Semantik.</p>
            <p>Hier alle Tokens unserer Sprache, geordnet nach Gruppen:</p>
            <div class="robot-card token-uebersicht-fenster">
            <div class="token-uebersicht">
              <span class="token-uebersicht-gruppe">Schlüsselwörter</span>
              <span>${['number', 'moveUp', 'moveDown', 'moveRight', 'moveLeft'].map((t) => marke('keyword', t)).join(' ')} ${neu('keyword', 'boolean')} ${neu('keyword', 'if')}</span>
              <span class="token-uebersicht-gruppe">Bezeichner</span>
              <span>${marke('identifier', 'a')} ${marke('identifier', 'weg')} <span class="grammatik-zeichen">… selbst gewählte Namen</span></span>
              <span class="token-uebersicht-gruppe">Literale</span>
              <span>${marke('literal', '1')} ${marke('literal', '255')} <span class="grammatik-zeichen">… Zahlen</span> ${neu('literal', 'true')} ${neu('literal', 'false')}</span>
              <span class="token-uebersicht-gruppe">Operatoren</span>
              <span>${['=', '+', '-', '*', '/'].map((t) => marke('operator', t)).join(' ')} ${['<', '>', '<=', '>=', '==', '!='].map((t) => neu('operator', t)).join(' ')}</span>
              <span class="token-uebersicht-gruppe">Gliederungszeichen</span>
              <span>${['(', ')', ';'].map((t) => marke('separator', t)).join(' ')} ${neu('separator', '{')} ${neu('separator', '}')}</span>
            </div>
            </div>
          </div>
        `;
      },
    },
    {
      id: 's2',
      title: 'Das längste Token gewinnt',
      render: (container) => {
        container.innerHTML = `
          <div class="slide-centered slide-lesbar">
            <p>Manche Vergleichszeichen bestehen aus einem Zeichen (${marke('operator', '<')} ${marke('operator', '>')}), andere aus zwei (${marke('operator', '<=')} ${marke('operator', '>=')} ${marke('operator', '==')} ${marke('operator', '!=')}). Dazu kommt das ${marke('operator', '=')} der Zuweisung. Woher weiß der Scanner bei einem „<“, ob es allein steht oder zu einem „<=“ gehört?</p>
            <p>Er nimmt immer das <strong>längste Stück, das noch zu einem Token passt</strong>. Sieht er ein „<“, schaut er auf das nächste Zeichen: Ist es ein „=“, ist beides zusammen das Token ${marke('operator', '<=')}. Sonst ist es nur ${marke('operator', '<')}. In ${code('schritte <= 7')} sind es also drei Tokens ${marke('identifier', 'schritte')} ${marke('operator', '<=')} ${marke('literal', '7')} und nicht vier.</p>
            <p>Das Prinzip kennst du schon von den Bezeichnern: Der Scanner liest einen Namen, solange Buchstaben oder Ziffern folgen.</p>
            <p>Das Zeichen „!“ allein ist dagegen kein Token. Es ist nur der Anfang von „!=“. Folgt kein „=“, passt es zu keinem Token, und der Scanner meldet einen lexikalischen Fehler. Steht ein Leerzeichen zwischen „<“ und „=“, sind es zwei Tokens. Ob das erlaubt ist, entscheidet erst der Parser.</p>
            <p>Auf der nächsten Folie färbst du wieder alle Tokens ein.</p>
          </div>
        `;
      },
    },
    {
      id: 's3',
      title: 'Werde zum Scanner: Das längste Token',
      render: (container) => renderEinzelphase(container, scannerUebung(SCANNER_CODE)),
    },
  ],
};

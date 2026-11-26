/* 
phase syntaxanalyse
offener pfad: alle knoten von der wurzel bis zum tiefsten zuletzt geöffneten (cursor), entspricht dem stack eines parsers
jeder offene knoten zeigt am ende seiner kinder eine ablagefläche, eine höhere fläche schließt die knoten darunter (nur wenn sie vollständig sind)

beiEnde(ergebnis): 'finished' (baum fertig) oder 'syntax' (syntaxfehler richtig gemeldet)
kein eigener zurücksetzen-knopf, die phase wird neu aufgebaut
die zurückgegebene funktion räumt alle listener (pointer, resize, tastatur im pop-up) und das requestAnimationFrame ab

config: programm (pflichct, tokenliste { text, cat }), ablage (pflicht, nichtterminale in der ablage),
  regelnHtml (optional, inhalt des pop-ups "syntaxregeln"), beiEnde, beiNeustart, beiFalsch, beiRichtig (optional),
  schrittBereit(fn) (optional, fn ordnet das nächste token für den spieler ein)
  cat: kw schlüsselwort, open "(", close ")", lit literal, id bezeichner, semi ";", op operator,
      lbrace/rbrace "{" "}", dot "." (gehört in keine regel)
*/

import { zentriere } from './baum-scroll.js';

// was eine bewegung der reihe nach enthalten muss: pro position die erlaubten tokenkategorien (0: schlüsselwort, 1: "(", 2: literal oder bezeichner, 3: ")")
const BEW = [['kw'], ['open'], ['lit', 'id'], ['close']];

// operatoren in einem ausdruck: rechnen und vergleichen (das "=" der deklaration gehört nicht dazu)
const AUSDRUCK_OP = ['+', '-', '*', '/', '>', '<', '==', '!=', '<=', '>='];

// anweisungen, die mit einem block enden und deshalb kein semikolon haben
const MIT_BLOCK = ['If-Anweisung', 'While-Anweisung'];

// farbklasse eines tokens, passend zur scanner-übung
const CAT_KLASSE = {
  kw: 'keyword', open: 'separator', close: 'separator', semi: 'separator', lbrace: 'separator', rbrace: 'separator',
  lit: 'literal', id: 'identifier', op: 'operator', dot: 'separator',
};

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// token-bausteine zeigen höchstens 20 zeichen (der quellcode ist frei eingegeben, ein langer bezeichner sprengt sonst die fläche)
const MAX_ZEICHEN = 20;
const kurz = (s) => String(s).slice(0, MAX_ZEICHEN);

// tokenklasse als beschriftung über dem wert, nur bezeichner und literal haben einen offenen wert
// alle anderen tokens sind fest und zeigen nur ihren text
// der parser sieht nur die klasse: 2 und true sind beide ein literal
const KLASSE_NAME = { id: 'BEZEICHNER', lit: 'LITERAL' };
function tokenInhalt(cat, text) {
  const wert = esc(kurz(text));
  return KLASSE_NAME[cat]
    ? `<span class="pb-klasse">${KLASSE_NAME[cat]}</span><span class="pb-wert">${wert}</span>`
    : wert;
}

export function render(container, config) {
  const erfolgstext = 'Der Baum ist fertig. Alle Tokens sind eingeordnet, es gibt keinen Syntaxfehler.';

  container.innerHTML = `
    <div class="pb-stage">
      <div class="pb-main">
        <section class="pb-canvas" aria-label="Syntaxbaum">
          <div class="pb-tree-scroll"><div class="pb-tree"></div></div>
          <div class="pb-msg" aria-live="polite">
            <span class="pb-kind"></span><span class="pb-text"></span>
            <button class="btn btn--s lex-btn-hinweis" type="button" hidden>Zeige Hinweis</button>
            <div class="lex-hinweis-text" hidden></div>
            <button class="btn-close msg-x" type="button" aria-label="Meldung schließen">×</button>
          </div>
        </section>
      </div>
      <aside class="pb-sidebar cw-syn-sidebar" aria-label="Ablage">
        <div class="pb-card">
          ${config.regelnHtml ? '<div class="pb-cell pb-cell-regeln"><button class="btn pb-btn-regeln" type="button">Syntaxregeln</button></div>' : ''}
          <div class="pb-cell">
            <div class="pb-label">Aktuelles Token</div>
            <div class="pb-tokens"></div>
          </div>
          <div class="pb-cell">
            <div class="pb-label">Sprachkonstrukte</div>
            <div class="pb-tray"></div>
          </div>
          <div class="pb-cell">
            <div class="pb-errzone pb-errzone-cw" data-zone="err" role="button" tabindex="0">Syntaxfehler melden</div>
          </div>
        </div>
      </aside>
    </div>
  `;
  const tokensEl = container.querySelector('.pb-tokens');
  const trayEl = container.querySelector('.pb-tray');
  const errZoneEl = container.querySelector('.pb-errzone');
  const msgEl = container.querySelector('.pb-msg');
  const hinweisBtn = msgEl.querySelector('.lex-btn-hinweis');
  const hinweisEl = msgEl.querySelector('.lex-hinweis-text');
  const treeEl = container.querySelector('.pb-tree');
  const scrollEl = container.querySelector('.pb-tree-scroll');
  const stageEl = container.querySelector('.pb-stage');

  // ---- Zustand ----
  // state.prog:    tokenliste
  // state.ti:      index des aktuellen tokens
  // state.root:    wurzelknoten
  // state.cursor:  tiefster offener knoten
  // state.over:    spiel zu ende?
  // state.result:  'finished' (baum fertig) oder 'syntax' (fehler richtig gefunden)
  // state.errNode: knoten, an dem der syntaxfehler liegt (für die rote markierung)
  // state.sel:     per antippen ausgewähltes element oder null
  // state.badZone: besitzer-id der zuletzt falsch getroffenen fläche
  let state;
  let nodes;            // alle knoten nach id, um sie aus dem dom wiederzufinden
  let uid;
  let lastMsg = { kind: 'info', text: '' };
  let hinweisOffen = false; // ist der hinweis zur meldung aufgeklappt?
  let drag = null;      // laufender ziehvorgang
  let rafId = 0;        // ausstehendes linien-zeichnen
  let gemeldet = false; // wurde das ende schon an config.beiEnde gemeldet?
  let zentriereId = 0;  // zuletzt gesetzter knoten: nach dem nächsten zeichnen in die mitte scrollen

  // ---- Hilfsfunktionen ----

  // legt einen baumknoten an und hängt ihn unter parent (falls vorhanden)
  // kind: 'nt' = nichtterminal, 't' = terminal (blatt)
  function mk(sym, kind, parent) {
    const n = { id: ++uid, sym, kind, parent: parent || null, children: [] };
    if (parent) parent.children.push(n);
    nodes[n.id] = n;
    return n;
  }

  // aktuelles token (oder null, wenn die eingabe zu ende ist)
  const curTok = () => state.prog[state.ti] || null;

  // hinweis (optional): genauere erklärung, erst nach "zeige hinweis" sichtbar
  const say = (kind, text, hinweis = null) => { lastMsg = { kind, text, hinweis }; hinweisOffen = false; };

  // lookahead: welche anweisungsart beginnt mit diesem token (das erste token reicht immer, die grammatik ist ll(1))
  // null, wenn mit dem token keine anweisung beginnt
  function lookahead(t) {
    if (!t) return null;
    if (t.cat === 'kw' && t.text === 'if') return 'If-Anweisung';
    if (t.cat === 'kw' && t.text === 'while') return 'While-Anweisung';
    if (t.cat === 'kw' && t.text.indexOf('move') === 0) return 'Bewegung';
    if (t.cat === 'kw' && (t.text === 'number' || t.text === 'boolean')) return 'Deklaration';
    if (t.cat === 'id') return 'Zuweisung';
    return null;
  }

  function isAncestor(a, n) {
    for (let p = n.parent; p; p = p.parent) if (p === a) return true;
    return false;
  }

  // ---- Offener Pfad und Ablageflächen ----

  // liegt der knoten auf dem offenen pfad? nach spielende ist nichts mehr offen
  const onPath = (n) => !state.over && (n === state.cursor || isAncestor(n, state.cursor));

  // kinder eines knotens, wie sie gezeichnet werden: echte kinder, plus am ende eine ablagefläche, wenn der knoten offen ist
  // die fläche ist nur ein zeichenobjekt (kind 'zone'), kein teil des echten baums, ihre id ist 'z' + id des besitzers
  function kidsOf(n) {
    return onPath(n) ? n.children.concat([{ id: 'z' + n.id, kind: 'zone', owner: n, children: [] }]) : n.children;
  }

  // ---- Regeln (das eigentliche Parser-Wissen) ----

  // der eine richtige zug an einem knoten, gegeben das aktuelle token (tok, kann null sein):
  //   { kind: 'place' }           token wird als blatt an diesen knoten gehängt
  //   { kind: 'open', sym }       neues nichtterminal sym öffnen
  //   { kind: 'close' }           knoten ist vollständig und wird geschlossen
  //   { kind: 'error' }           kein gültiger zug
  // neue regeln: hier einen zweig für das neue nichtterminal ergänzen (und in lookahead() das startsymbol, falls nötig)
  function legalMove(node, tok) {
    const k = node.children.length; // fortschritt im knoten
    if (node.sym === 'Programm') {
      // programmende: schließen, wenn mindestens eine anweisung da ist
      if (!tok) return { kind: k >= 1 ? 'close' : 'error' };
      return lookahead(tok) ? { kind: 'open', sym: 'Anweisung' } : { kind: 'error' };
    }
    if (node.sym === 'Anweisung') {
      // noch leer: das token bestimmt, welche art von anweisung beginnt
      if (k === 0) { const la = lookahead(tok); return la ? { kind: 'open', sym: la } : { kind: 'error' }; }
      // if- und while-anweisung enden mit ihrem block und brauchen kein semikolon
      if (k === 1 && MIT_BLOCK.indexOf(node.children[0].sym) >= 0) return { kind: 'close' };
      // die anweisung selbst ist da: jetzt muss das semikolon folgen
      if (k === 1) return tok && tok.cat === 'semi' ? { kind: 'place' } : { kind: 'error' };
      return { kind: 'close' };
    }
    if (node.sym === 'Bewegung') {
      if (k < 4) return tok && BEW[k].indexOf(tok.cat) >= 0 ? { kind: 'place' } : { kind: 'error' };
      return { kind: 'close' };
    }
    if (node.sym === 'Deklaration') {
      // 0: schlüsselwort (number), 1: bezeichner, 2: "=", 3: ausdruck
      if (k === 0) return tok && tok.cat === 'kw' ? { kind: 'place' } : { kind: 'error' };
      if (k === 1) return tok && tok.cat === 'id' ? { kind: 'place' } : { kind: 'error' };
      if (k === 2) return tok && tok.cat === 'op' && tok.text === '=' ? { kind: 'place' } : { kind: 'error' };
      if (k === 3) return tok && (tok.cat === 'lit' || tok.cat === 'id') ? { kind: 'open', sym: 'Ausdruck' } : { kind: 'error' };
      return { kind: 'close' };
    }
    if (node.sym === 'Ausdruck') {
      // 0: operand, dann entweder ende oder rechenoperator (1) und zweiter operand (2)
      if (k === 0 || k === 2) return tok && (tok.cat === 'lit' || tok.cat === 'id') ? { kind: 'place' } : { kind: 'error' };
      if (k === 1) return tok && tok.cat === 'op' && AUSDRUCK_OP.indexOf(tok.text) >= 0 ? { kind: 'place' } : { kind: 'close' };
      return { kind: 'close' };
    }
    if (node.sym === 'Zuweisung') {
      // 0: bezeichner, 1: "=", 2: ausdruck
      if (k === 0) return tok && tok.cat === 'id' ? { kind: 'place' } : { kind: 'error' };
      if (k === 1) return tok && tok.cat === 'op' && tok.text === '=' ? { kind: 'place' } : { kind: 'error' };
      if (k === 2) return tok && (tok.cat === 'lit' || tok.cat === 'id') ? { kind: 'open', sym: 'Ausdruck' } : { kind: 'error' };
      return { kind: 'close' };
    }
    if (MIT_BLOCK.indexOf(node.sym) >= 0) {
      // if und while haben denselben aufbau
      // 0: schlüsselwort (if/while), 1: "(", 2: ausdruck, 3: ")", 4: block
      if (k === 0) return tok && tok.cat === 'kw' ? { kind: 'place' } : { kind: 'error' };
      if (k === 1) return tok && tok.cat === 'open' ? { kind: 'place' } : { kind: 'error' };
      if (k === 2) return tok && (tok.cat === 'lit' || tok.cat === 'id') ? { kind: 'open', sym: 'Ausdruck' } : { kind: 'error' };
      if (k === 3) return tok && tok.cat === 'close' ? { kind: 'place' } : { kind: 'error' };
      if (k === 4) return tok && tok.cat === 'lbrace' ? { kind: 'open', sym: 'Block' } : { kind: 'error' };
      return { kind: 'close' };
    }
    if (node.sym === 'Block') {
      // "{", beliebig viele anweisungen, "}", mit der schließenden klammer ist der block fertig
      if (k === 0) return tok && tok.cat === 'lbrace' ? { kind: 'place' } : { kind: 'error' };
      if (node.children[k - 1].cat === 'rbrace') return { kind: 'close' };
      if (tok && tok.cat === 'rbrace') return { kind: 'place' };
      return lookahead(tok) ? { kind: 'open', sym: 'Anweisung' } : { kind: 'error' };
    }
    // unbekanntes nichtterminal (in der ablage nur als ablenker): kein gültiger zug
    return { kind: 'error' };
  }

  // gibt es auf dem offenen pfad noch einen gültigen zug? wenn nein, liegt ein syntaxfehler vor
  // vom tiefsten offenen knoten nach oben, solange der knoten nur noch geschlossen werden kann
  // null = es gibt einen gültigen zug, sonst { node } mit dem knoten, an dem es nicht weitergeht
  function deadEnd() {
    const tok = curTok();
    for (let n = state.cursor; n; n = n.parent) {
      const lm = legalMove(n, tok);
      if (lm.kind === 'place' || lm.kind === 'open') return null;
      if (lm.kind === 'error') return { node: n };
      // 'close': knoten ist fertig, weiter beim elternknoten prüfen
    }
    return null;
  }

  // darf item an der ablagefläche von zone abgelegt werden?
  // item.type: 'tok' (aktuelles token), 'nt' (nichtterminal, item.sym) oder 'eof' (programmende)
  // liegt zone höher als der tiefste offene knoten, müssen alle knoten dazwischen schließbar sein
  function evalDrop(zone, item) {
    const tok = curTok();
    for (let n = state.cursor; n !== zone; n = n.parent) if (legalMove(n, tok).kind !== 'close') return false;
    const lm = legalMove(zone, tok);
    if (item.type === 'eof') return zone === state.root && lm.kind === 'close'; // ende gehört nur ans programm
    if (item.type === 'tok') return lm.kind === 'place';
    return lm.kind === 'open' && lm.sym === item.sym;
  }

  // warum ist der zug (item auf zone) falsch? spiegelt evalDrop() und liefert meldung samt hinweis
  // beide zeigen auf die regel, verraten aber nicht den richtigen zug: genannt wird nur der knoten, den der spieler selbst gewählt hat
  function grundFalsch(zone, item) {
    const tok = curTok();
    const name = (n) => `‚${n.sym}‘`;
    for (let n = state.cursor; n !== zone; n = n.parent) {
      if (legalMove(n, tok).kind !== 'close') {
        return { text: 'Darunter ist noch etwas nicht fertig.', hinweis: `${name(n)} ist noch nicht vollständig.` };
      }
    }
    if (item.type === 'eof') {
      return { text: 'Das Programmende passt hier nicht.', hinweis: 'Es gehört auf das ganze Programm, wenn alles darunter fertig ist.' };
    }
    if (legalMove(zone, tok).kind === 'close') {
      return { text: 'Hier ist nichts mehr zu ergänzen.', hinweis: `Die Regel für ${name(zone)} ist schon erfüllt.` };
    }
    if (item.type === 'tok') {
      return { text: 'Hier passt das Token nicht.', hinweis: `Schau dir die Regel für ${name(zone)} an: Was verlangt sie als Nächstes?` };
    }
    return { text: 'Dieses Sprachkonstrukt passt hier nicht.', hinweis: `Schau in die Regel für ${name(zone)}: Was darf an dieser Stelle stehen?` };
  }

  // ---- Spielablauf ----

  function init() {
    uid = 0; nodes = {};
    const root = mk('Programm', 'nt', null);
    state = { prog: config.programm, ti: 0, root, cursor: root, over: false, result: null, errNode: null, sel: null, badZone: null };
    lastMsg = { kind: 'info', text: '' };
    hinweisOffen = false;
    gemeldet = false;
    if (config.beiNeustart) config.beiNeustart();
    zeichne();
  }

  // der spieler meldet einen syntaxfehler, richtig, wenn es keinen gültigen zug mehr gibt
  function reportSyntax() {
    const d = deadEnd();
    if (d) {
      const tok = curTok();
      state.over = true; state.result = 'syntax'; state.errNode = d.node;
      say('ok', tok
        ? `Syntaxfehler gefunden: In ‚${d.node.sym}‘ gibt es für ‚${tok.text}‘ keine passende Stelle.`
        : `Syntaxfehler gefunden: In ‚${d.node.sym}‘ fehlt am Programmende noch etwas.`);
      config.beiRichtig?.();
    } else {
      say('err', 'Es gibt noch einen gültigen Zug.', 'Prüfe das Token gegen die offenen Regeln, von unten nach oben.');
      config.beiFalsch?.();
    }
  }

  // das element item wird auf die fläche zid abgelegt
  // zid ist die id des besitzerknotens der fläche oder 'err' für die syntaxfehler-fläche
  function drop(zid, item) {
    if (state.over) return;
    state.sel = null; state.badZone = null;

    // syntaxfehler-fläche: nur token oder programmende dürfen gemeldet werden
    if (zid === 'err') {
      if (item.type === 'nt') { say('err', 'Hier lässt sich nur das Token oder das Programmende melden.'); config.beiFalsch?.(); }
      else reportSyntax();
      zeichne(); return;
    }

    const zone = nodes[+zid];
    if (!zone) return;

    // falscher zug: meldung, fläche rot markieren, nichts ändert sich im baum
    if (!evalDrop(zone, item)) {
      const g = grundFalsch(zone, item);
      state.badZone = zone.id; say('err', g.text, g.hinweis);
      config.beiFalsch?.();
      zeichne(); return;
    }

    // richtiger zug: zuerst alle knoten unterhalb der fläche schließen (evalDrop hat geprüft, dass das geht)
    const tok = curTok();
    state.cursor = zone;
    if (item.type === 'tok') {
      const t = mk(tok.text, 't', zone); t.cat = tok.cat; state.ti++;
      zentriereId = t.id;
    } else if (item.type === 'nt') {
      state.cursor = mk(item.sym, 'nt', zone);
      zentriereId = state.cursor.id;
    } else {
      state.over = true; state.result = 'finished';
      say('ok', erfolgstext);
      config.beiRichtig?.();
      zeichne(); return;
    }
    say('info', '');
    config.beiRichtig?.();
    zeichne();
  }

  // ein schritt für den spieler (knopf "schritt vormachen")
  // führt die richtigen züge aus, die legalMove() vorgibt (knoten öffnen), bis das aktuelle token als blatt eingeordnet ist
  // gibt es keinen gültigen zug mehr, meldet er den syntaxfehler wie der spieler auf der fehlerfläche
  function schritt() {
    for (let schutz = 0; !state.over && schutz < 50; schutz++) {
      const tok = curTok();
      let n = state.cursor;
      let lm = legalMove(n, tok);
      while (lm.kind === 'close' && n.parent) { n = n.parent; lm = legalMove(n, tok); }
      if (lm.kind === 'close') { drop(n.id, { type: 'eof' }); return; } // eingabe zu ende, baum fertig
      if (lm.kind === 'error') { drop('err', { type: tok ? 'tok' : 'eof' }); return; }
      if (lm.kind === 'place') { drop(n.id, { type: 'tok' }); return; }
      drop(n.id, { type: 'nt', sym: lm.sym }); // 'open': nichtterminal öffnen, weiter zum token
    }
  }
  if (config.schrittBereit) config.schrittBereit(schritt);

  // antippen-variante: element auswählen (nochmal antippen hebt die auswahl auf)
  // danach genügt ein tipp auf eine fläche, um es dort abzulegen
  function selectItem(item) {
    if (state.over) return;
    const s = state.sel;
    state.sel = (s && s.type === item.type && s.sym === item.sym) ? null : item;
    zeichne();
  }

  // ---- Darstellung ----

  // html für einen knoten samt kindern (rekursiv)
  // data-id wird von zeichneLinien() gebraucht, data-zone markiert ablageflächen
  function nodeHtml(n) {
    let h = '<div class="pb-n">';
    if (n.kind === 'zone') {
      const cls = 'pb-box pb-zone' + (state.sel ? ' armed' : '') + (state.badZone === n.owner.id ? ' bad' : '');
      return h + `<div class="${cls}" data-zone="${n.owner.id}" data-id="${n.id}" role="button" tabindex="0" aria-label="Unter ${esc(n.owner.sym)} ablegen">hier ablegen</div></div>`;
    }
    if (n.kind === 't') {
      h += `<div class="pb-box pb-term pb-cat-${CAT_KLASSE[n.cat]}" data-id="${n.id}">${tokenInhalt(n.cat, n.sym)}</div>`;
    } else {
      const c = 'pb-box pb-nt' + (onPath(n) ? ' open' : '') + (state.result === 'finished' ? ' ok' : '') + (state.errNode === n ? ' err' : '');
      h += `<div class="${c}" data-id="${n.id}"><span>${esc(n.sym)}</span></div>`;
    }
    const ks = kidsOf(n);
    if (ks.length) h += `<div class="pb-kids${n === state.root ? ' top' : ''}">${ks.map(nodeHtml).join('')}</div>`;
    return h + '</div>';
  }

  // meldung oben rechts im baumfenster, "info" bleibt leer und unsichtbar
  function zeichneMeldung() {
    const showMsg = lastMsg.kind !== 'info';
    msgEl.className = 'pb-msg' + (showMsg ? ' pb-' + lastMsg.kind : '');
    // fester titel über dem individuellen satz: "geschafft" (grün) oder "falsch" (orange, falscher zug)
    msgEl.querySelector('.pb-kind').textContent = !showMsg ? '' : (lastMsg.kind === 'ok' ? 'Geschafft' : 'Falsch');
    msgEl.querySelector('.pb-text').textContent = showMsg ? lastMsg.text : '';
    // hinweis erst nach "zeige hinweis" sichtbar (textContent, kein innerHTML)
    const hat = showMsg && !!lastMsg.hinweis;
    hinweisBtn.hidden = !hat || hinweisOffen;
    hinweisEl.hidden = !(hat && hinweisOffen);
    const fett = document.createElement('strong');
    fett.textContent = 'Hinweis:';
    hinweisEl.replaceChildren(fett, ' ' + (hat ? lastMsg.hinweis : ''));
  }
  msgEl.querySelector('.msg-x').onclick = () => {
    lastMsg = { kind: 'info', text: '' };
    hinweisOffen = false;
    zeichneMeldung();
  };
  hinweisBtn.onclick = () => {
    hinweisOffen = true;
    zeichneMeldung();
  };

  // zeichnet die gesamte oberfläche anhand von state neu
  // nach jeder änderung, nie während des ziehens (sonst ginge das gezogene element verloren)
  function zeichne() {
    const sel = state.sel;

    // --- Aktuelles Token ---
    tokensEl.innerHTML = '';
    const t = curTok();
    let el;
    if (t) {
      // solange das spiel läuft, ist es ein ziehbarer button, danach nur text
      // nach einem richtig gemeldeten syntaxfehler wird es rot markiert
      const live = !state.over;
      const bad = state.over && state.result === 'syntax';
      el = document.createElement(live ? 'button' : 'span');
      if (live) { el.type = 'button'; el.dataset.kind = 'tok'; el.setAttribute('aria-label', 'Token ' + t.text + ' ablegen'); }
      el.className = `pb-tok pb-cat-${CAT_KLASSE[t.cat]}` + (live ? ' cur pb-src' : '') + (bad ? ' bad' : '') + (live && sel && sel.type === 'tok' ? ' sel' : '');
      el.innerHTML = tokenInhalt(t.cat, t.text);
    } else if (!state.over) {
      // eingabe zu ende, spiel läuft: "programmende" als ziehbares element
      el = document.createElement('button');
      el.type = 'button'; el.dataset.kind = 'eof';
      el.className = 'pb-tok pb-tok-end cur pb-src' + (sel && sel.type === 'eof' ? ' sel' : '');
      el.textContent = 'Programmende';
    } else {
      el = document.createElement('span');
      el.className = 'pb-tok-end'; el.textContent = 'Programmende';
    }
    tokensEl.appendChild(el);

    // --- Nichtterminale (nach Spielende deaktiviert), immer zwei pro Zeile in der Reihenfolge der Ablage ---
    trayEl.innerHTML = '';
    let zeile = null;
    config.ablage.forEach((s, i) => {
      if (i % 2 === 0) { zeile = document.createElement('div'); zeile.className = 'pb-tray-zeile'; trayEl.appendChild(zeile); }
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pb-chip pb-src' + (sel && sel.type === 'nt' && sel.sym === s ? ' sel' : '');
      b.textContent = s; b.dataset.kind = 'nt'; b.dataset.sym = s; b.disabled = state.over;
      zeile.appendChild(b);
    });

    // --- Baum: erst das (leere) svg für die linien, dann die knoten ---
    // die linien werden erst nach dem layout gezeichnet, weil dafür die positionen der elemente bekannt sein müssen
    treeEl.innerHTML = '<svg class="pb-wires" aria-hidden="true"></svg>' + nodeHtml(state.root);
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      zeichneLinien();
      // nur nach einem richtigen zug: der eben gesetzte knoten kommt in die mitte der baumfläche
      if (zentriereId) {
        zentriere(scrollEl, treeEl.querySelector(`[data-id="${zentriereId}"]`));
        zentriereId = 0;
      }
    });

    zeichneMeldung();

    // --- Syntaxfehler-Fläche ---
    errZoneEl.className = 'pb-errzone pb-errzone-cw' +(sel ? ' armed' : '') + (state.over ? ' off' : '');

    // --- Ende genau einmal melden, damit die Folie weiterschalten kann ---
    if (state.over && !gemeldet) {
      gemeldet = true;
      if (config.beiEnde) config.beiEnde(state.result);
    }
  }

  // verbindungslinien als geschwungene kurven ins svg: von der unterkante des elternknotens zur oberkante des kindes
  // positionen aus dem tatsächlichen layout, relativ zum baumcontainer
  // linien zu ablageflächen sind gestrichelt
  function zeichneLinien() {
    const svg = treeEl.querySelector('.pb-wires');
    if (!svg) return;
    const tr = treeEl.getBoundingClientRect();
    const elOf = (n) => treeEl.querySelector(`[data-id="${n.id}"]`);
    // mittelpunkt der ober- bzw. unterkante eines elements, relativ zum baum
    const pt = (e, unten) => {
      const r = e.getBoundingClientRect();
      return { x: r.left - tr.left + r.width / 2, y: (unten ? r.bottom : r.top) - tr.top };
    };
    let out = '';
    (function walk(n) {
      kidsOf(n).forEach((c) => {
        const pe = elOf(n);
        const ce = elOf(c);
        if (pe && ce) {
          const p = pt(pe, true);
          const q = pt(ce, false);
          const mid = (p.y + q.y) / 2;
          out += `<path${c.kind === 'zone' ? ' class="z"' : ''} d="M${p.x} ${p.y} C${p.x} ${mid} ${q.x} ${mid} ${q.x} ${q.y}"/>`;
        }
        walk(c);
      });
    })(state.root);
    svg.innerHTML = out;
  }

  // ---- Ziehen (Pointer-Events, funktioniert mit Maus und Touch) und Antippen ----
  // bewusst nicht das eingebaute html5-drag-and-drop, weil das auf touchgeräten nicht funktioniert
  // pointerdown merkt sich die quelle, ab 8px bewegung beginnt das ziehen (eine kopie folgt dem zeiger, die fläche darunter leuchtet auf)
  // beim loslassen über einer fläche wird abgelegt, ohne ziehen zählt es als antippen und wählt aus

  // was ein quell-element darstellt: { type: 'tok' | 'eof' } oder { type: 'nt', sym }
  function itemOf(el) {
    const k = el.dataset.kind;
    return k === 'nt' ? { type: 'nt', sym: el.dataset.sym } : { type: k };
  }

  // die ablagefläche unter den bildschirmkoordinaten x, y oder null
  // die kopie hat pointer-events: none und stört deshalb nicht
  function zoneUnder(x, y) {
    const e = document.elementFromPoint(x, y);
    const z = e && e.closest ? e.closest('[data-zone]') : null;
    return z && container.contains(z) ? z : null;
  }

  function placeGhost(x, y) {
    drag.ghost.style.left = x + 'px';
    drag.ghost.style.top = y + 'px';
  }

  function onMove(ev) {
    if (ev.pointerId !== drag.id) return;
    if (!drag.active) {
      if (Math.abs(ev.clientX - drag.x) + Math.abs(ev.clientY - drag.y) < 8) return;
      drag.active = true;
      const r = drag.el.getBoundingClientRect();
      const g = drag.el.cloneNode(true);
      g.className += ' pb-ghost';
      g.style.width = r.width + 'px';
      delete g.dataset.kind;
      document.body.appendChild(g);
      drag.ghost = g;
      drag.el.classList.add('dragging');
      stageEl.classList.add('pb-dragging');
    }
    placeGhost(ev.clientX, ev.clientY);
    const z = zoneUnder(ev.clientX, ev.clientY);
    if (drag.hot !== z) {
      if (drag.hot) drag.hot.classList.remove('hot');
      if (z) z.classList.add('hot');
      drag.hot = z;
    }
  }

  // räumt nach dem ziehen auf: kopie entfernen, hervorhebung zurücksetzen, listener abhängen
  function endDrag() {
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    document.removeEventListener('pointercancel', onCancel);
    if (drag.ghost) drag.ghost.remove();
    if (drag.hot) drag.hot.classList.remove('hot');
    drag.el.classList.remove('dragging');
    stageEl.classList.remove('pb-dragging');
    drag = null;
  }

  // losgelassen: entweder ablegen (wenn gezogen wurde) oder auswählen (wenn nur getippt wurde)
  // über keiner fläche passiert nichts, auch keine fehlermeldung
  function onUp(ev) {
    if (ev.pointerId !== drag.id) return;
    const d = drag;
    endDrag();
    if (d.active) {
      const z = zoneUnder(ev.clientX, ev.clientY);
      if (z) drop(z.dataset.zone, d.item);
    } else {
      selectItem(d.item);
    }
  }

  // ziehen vom system abgebrochen (z. b. anruf): nur aufräumen
  function onCancel() { endDrag(); }

  container.addEventListener('pointerdown', (ev) => {
    if (ev.pointerType === 'mouse' && ev.button !== 0) return; // nur linke maustaste
    if (drag) return;
    const el = ev.target.closest('.pb-src');
    if (!el || el.disabled || state.over) return;
    drag = { el, item: itemOf(el), x: ev.clientX, y: ev.clientY, active: false, ghost: null, hot: null, id: ev.pointerId };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onCancel);
  });

  // ---- Antippen und Tastatur ----
  // mausklicks auf quellen werden bereits in onUp behandelt (detail > 0), deshalb reagiert click dort nur auf tastatur (detail === 0)
  // klicks auf flächen werden hier behandelt
  container.addEventListener('click', (ev) => {
    const src = ev.target.closest('.pb-src');
    if (src && ev.detail === 0 && !src.disabled) { selectItem(itemOf(src)); return; }

    const z = ev.target.closest('[data-zone]');
    if (!z) return;
    // klick auf "syntaxfehler" ohne auswahl: direkt das aktuelle token (oder das programmende) melden
    if (z.dataset.zone === 'err' && !state.sel) { drop('err', curTok() ? { type: 'tok' } : { type: 'eof' }); return; }
    // klick auf eine fläche mit ausgewähltem element: dort ablegen
    if (state.sel) drop(z.dataset.zone, state.sel);
  });

  // enter oder leertaste auf einer fokussierten fläche entspricht einem klick
  container.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Enter' && ev.key !== ' ') return;
    const z = ev.target.closest('[data-zone]');
    if (!z || ev.target !== z) return;
    ev.preventDefault();
    if (state.sel) drop(z.dataset.zone, state.sel);
    else if (z.dataset.zone === 'err') drop('err', curTok() ? { type: 'tok' } : { type: 'eof' });
  });

  // ---- Syntaxregeln-Pop-up (nur mit config.regelnHtml) ----
  // eigenes fenster statt openModal() aus app.js, weil eine übung app.js nicht kennen soll
  // nutzt dieselben css-klassen (.modal-backdrop, .modal, ...) und sieht deshalb aus wie die info-/hilfe-pop-ups
  let regelnModal = null;
  function openRegeln() {
    if (regelnModal) return;
    regelnModal = document.createElement('div');
    regelnModal.className = 'modal-backdrop';
    regelnModal.innerHTML = `
      <div class="modal modal--regeln" role="dialog" aria-modal="true" aria-label="Syntaxregeln">
        <div class="modal-head"><h3>Syntaxregeln</h3><button class="btn-close modal-close" aria-label="Schließen">&times;</button></div>
        <div class="modal-body"><div class="modal-text">${config.regelnHtml}</div></div>
      </div>
    `;
    document.body.appendChild(regelnModal);
    regelnModal.querySelector('.modal-close').onclick = closeRegeln;
    regelnModal.addEventListener('click', (e) => { if (e.target === regelnModal) closeRegeln(); });
    document.addEventListener('keydown', onRegelnKeydown);
  }
  function onRegelnKeydown(e) {
    if (e.key === 'Escape') closeRegeln();
  }
  function closeRegeln() {
    if (!regelnModal) return;
    regelnModal.remove();
    regelnModal = null;
    document.removeEventListener('keydown', onRegelnKeydown);
  }
  const regelnBtn = container.querySelector('.pb-btn-regeln');
  if (regelnBtn) regelnBtn.onclick = openRegeln;

  // bei veränderter fenstergröße die linien neu berechnen
  window.addEventListener('resize', zeichneLinien);

  init();

  return () => {
    if (drag) endDrag();
    cancelAnimationFrame(rafId);
    window.removeEventListener('resize', zeichneLinien);
    closeRegeln();
  };
}

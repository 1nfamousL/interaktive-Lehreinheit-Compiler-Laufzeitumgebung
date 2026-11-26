// phase "semantische analyse": der spieler prüft den syntaxbaum knoten für knoten (typ bestimmen, symboltabelle, bereiche) oder meldet einen fehler
// der baum kommt in 6.2 aus dem quellcode, in kapitel 2 bis 5 von hand aus der lektion (config.baum)
// kein eigener zurücksetzen-knopf, die phase wird neu aufgebaut
// die zurückgegebene funktion räumt resize- und tastatur-listener (pop-up) und das requestAnimationFrame ab
//
// config:
//   baum: funktion, die den baum neu baut (pflicht), er wird beim prüfen beschriftet, deshalb frisch für jedes zurücksetzen
//   typen: typ-knöpfe, z. b. ['number', 'boolean']
//   fehler: fehlerknöpfe, schlüssel aus FEHLER
//   symboltabelle: true = karte "symboltabelle" und aktion "eintragen"
//   bereiche: true = aktionen "öffnen" und "schließen"
//   regelnHtml: optional, inhalt des pop-ups "semantikregeln"
//   beiEnde(ergebnis): 'ok' (alle knoten geprüft) oder 'fehler' (semantischer fehler richtig gemeldet)
//   beiNeustart, beiFalsch, beiRichtig: optional
//   schrittBereit(fn): optional, fn prüft den nächsten knoten für den spieler

import {
  zug, erwartet, baueSchritte, nummeriere, neuerZustand, FEHLER, AUFGABE, detail,
} from './compiler-weg-semantik-regeln.js';
import { zentriere } from './baum-scroll.js';

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// blätter (token) zeigen höchstens 20 zeichen (der quellcode ist frei eingegeben, ein langer bezeichner sprengt sonst die fläche)
const MAX_ZEICHEN = 20;
const kurz = (s) => String(s).slice(0, MAX_ZEICHEN);
const beschriftung = (n) => (n.blatt ? kurz(n.label) : n.label);

export function render(container, config) {
  const typen = config.typen || ['number'];
  const fehlerArten = config.fehler || [];

  container.innerHTML = `
    <div class="pb-stage">
      <div class="pb-main">
        <section class="pb-canvas" aria-label="Abstrakter Syntaxbaum">
          <div class="pb-tree-scroll"><div class="pb-tree"></div></div>
          <div class="pb-msg" aria-live="polite">
            <span class="pb-kind"></span><span class="pb-text"></span>
            <button class="btn btn--s lex-btn-hinweis" type="button" hidden>Zeige Hinweis</button>
            <div class="lex-hinweis-text" hidden></div>
            <button class="btn-close msg-x" type="button" aria-label="Meldung schließen">×</button>
          </div>
        </section>
      </div>
      <aside class="pb-sidebar sem-sidebar" aria-label="Prüfung">
        <div class="pb-card">
          ${config.regelnHtml ? '<div class="pb-cell pb-cell-regeln"><button class="btn pb-btn-regeln" type="button">Semantikregeln</button></div>' : ''}
          <div class="pb-cell">
            <div class="pb-label">Aktueller Knoten</div>
            <div class="sem-cur"></div>
          </div>
          <div class="sem-scroll">
          ${config.symboltabelle ? `
          <div class="pb-cell">
            <div class="pb-label">Symboltabelle</div>
            <div class="sem-tabelle"></div>
          </div>` : ''}
          <div class="pb-cell sem-cell-aktionen">
            <div class="pb-label">Aktionen</div>
            <div class="sem-aktionen"></div>
          </div>
          ${fehlerArten.length ? `
          <div class="pb-cell sem-cell-fehler">
            <div class="pb-label">Fehler melden</div>
            <div class="sem-fehler-reihe"></div>
          </div>` : ''}
          </div>
        </div>
      </aside>
    </div>
  `;
  const curEl = container.querySelector('.sem-cur');
  const tabelleEl = container.querySelector('.sem-tabelle');
  const aktionenEl = container.querySelector('.sem-aktionen');
  const fehlerEl = container.querySelector('.sem-fehler-reihe');
  const msgEl = container.querySelector('.pb-msg');
  const hinweisBtn = msgEl.querySelector('.lex-btn-hinweis');
  const hinweisEl = msgEl.querySelector('.lex-hinweis-text');
  const treeEl = container.querySelector('.pb-tree');
  const scrollEl = container.querySelector('.pb-tree-scroll');

  // ---- Zustand ----
  // state.wurzel:     wurzel des baums
  // state.schritte:   prüfschritte (baueSchritte)
  // state.i:          index des aktuellen schritts
  // state.zustand:    symboltabelle (stapel von bereichen)
  // state.over:       prüfung zu ende?
  // state.result:     'ok' (alles geprüft) oder 'fehler' (fehler gefunden)
  // state.fehlerKnoten: knoten, an dem der fehler gefunden wurde (rote markierung)
  let state;
  let lastMsg = { kind: 'info', text: '' };
  let hinweisOffen = false; // ist der hinweis zur meldung aufgeklappt?
  let rafId = 0;       // ausstehendes linien-zeichnen
  let zentriertBei = -1; // schritt, für den der baum zuletzt zentriert wurde

  // hinweis (optional): genauere erklärung, erst nach "zeige hinweis" sichtbar
  const say = (kind, text, hinweis = null) => { lastMsg = { kind, text, hinweis }; hinweisOffen = false; };

  // ---- Spielablauf ----

  function lade() {
    const wurzel = nummeriere(config.baum());
    state = {
      wurzel, schritte: baueSchritte(wurzel), i: 0, zustand: neuerZustand(),
      over: false, result: null, fehlerKnoten: null,
    };
    lastMsg = { kind: 'info', text: '' };
    hinweisOffen = false;
    zentriertBei = -1;
    if (config.beiNeustart) config.beiNeustart();
    zeichne();
  }

  function beende(result, text) {
    state.over = true; state.result = result;
    // auch ein gefundener fehler ist ein erfolgreiches ende (grün, titel "geschafft"), rot ist nur der fehler selbst, am knoten und am fehlerknopf
    say('ok', text);
    if (config.beiEnde) config.beiEnde(result);
  }

  // ein zug des spielers, a = { t, v }, siehe zug()
  function zieh(a) {
    if (state.over) return;
    const schritt = state.schritte[state.i];
    const r = zug(schritt, state.zustand, a);
    if (r.urteil === 'falsch') {
      say('err', r.text, r.hinweis);
      config.beiFalsch?.();
    } else if (r.urteil === 'gefunden') {
      state.fehlerKnoten = schritt.knoten;
      beende('fehler', r.text);
      config.beiRichtig?.();
    } else {
      state.i++;
      config.beiRichtig?.();
      say('info', '');
      if (state.i >= state.schritte.length) {
        beende('ok', 'Alle Knoten sind geprüft, der Quellcode ist semantisch korrekt.');
      }
    }
    zeichne();
  }

  // ein schritt für den spieler (knopf "schritt vormachen"): führt die richtige aktion am aktuellen knoten aus, liegt dort ein fehler vor, meldet er ihn
  function schritt() {
    if (state.over) return;
    const soll = erwartet(state.schritte[state.i], state.zustand);
    zieh(soll.art === 'fehler' ? { t: 'fehler', v: soll.fehler } : soll.aktion);
  }
  if (config.schrittBereit) config.schrittBereit(schritt);

  // ---- Darstellung ----

  // html für einen knoten samt kindern (rekursiv), data-id wird von zeichneLinien() gebraucht, der typ bzw. status steht als notiz unter dem namen
  function nodeHtml(n) {
    const cur = !state.over && state.schritte[state.i].knoten === n;
    const cls = 'pb-box sem-knoten ' + (n.blatt ? 'pb-term' : 'pb-nt')
      + (cur ? ' cur' : '') + (n.ann ? ' erledigt' : '') + (state.fehlerKnoten === n ? ' err' : '');
    let h = `<div class="pb-n"><div class="${cls}" data-id="${n.id}"><span>${esc(beschriftung(n))}</span>`
      + (n.ann ? `<span class="sem-ann">${esc(n.ann)}</span>` : '') + '</div>';
    if (n.kids.length) h += `<div class="pb-kids">${n.kids.map(nodeHtml).join('')}</div>`;
    return h + '</div>';
  }

  function aktionKnopf(t, v, text, extra) {
    return `<button type="button" class="pb-chip sem-aktion${extra ? ' ' + extra : ''}" data-t="${t}"`
      + (v ? ` data-v="${v}"` : '') + (state.over ? ' disabled' : '') + `>${esc(text)}</button>`;
  }

  // zeichnet die gesamte oberfläche anhand von state neu, nach jedem zug
  function zeichne() {
    const schritt = state.schritte[state.i];

    // --- Aktueller Knoten ---
    if (state.over) {
      curEl.innerHTML = state.result === 'fehler'
        ? `<div class="sem-curbox bad">${esc(beschriftung(state.fehlerKnoten))}</div>`
        : '<div class="sem-curbox fin">Fertig geprüft</div>';
    } else {
      const d = detail(schritt);
      curEl.innerHTML = `<div class="sem-curbox">${esc(beschriftung(schritt.knoten))}</div>`
        // erst die aufgabe, darunter die einzelheiten zum knoten, die dafür nötig sind
        + `<div class="sem-aufgabe">${esc(AUFGABE[schritt.art])}</div>`
        + (d ? `<div class="sem-detail">${esc(d)}</div>` : '');
    }

    // --- Symboltabelle: Zeilen sind nur beim Nachschlagen anklickbar ---
    if (tabelleEl) {
      const nachschlagen = !state.over && schritt.art === 'var';
      tabelleEl.innerHTML = state.zustand.bereiche.map((b, i) => {
        const zeilen = b.eintraege.length ? b.eintraege.map((e) => {
          const inner = `<span>${esc(e.name)}</span><span>${esc(e.typ)}</span>`;
          return nachschlagen
            ? `<button type="button" class="sem-zeile klick" data-zeile="${esc(e.name)}">${inner}</button>`
            : `<div class="sem-zeile">${inner}</div>`;
        }).join('') : '<div class="sem-leer">leer</div>';
        return `<div class="sem-bereich" style="margin-left:${i * 12}px"><div class="pb-label">${esc(b.name)}</div>${zeilen}</div>`;
      }).join('');
    }

    // --- Aktionen ---
    let h = '<div class="sem-gruppe"><span class="sem-gruppe-titel">Typ bestimmen</span><div class="sem-reihe">'
      + typen.map((t) => aktionKnopf('type', t, t, 'sem-typ')).join('') + '</div></div>';
    if (config.symboltabelle) {
      h += '<div class="sem-gruppe"><span class="sem-gruppe-titel">Symboltabelle</span><div class="sem-reihe">'
        + aktionKnopf('enter', '', 'Eintragen') + '</div></div>';
    }
    if (config.bereiche) {
      h += '<div class="sem-gruppe"><span class="sem-gruppe-titel">Block</span><div class="sem-reihe">'
        + aktionKnopf('open', '', 'Öffnen') + aktionKnopf('close', '', 'Schließen') + '</div></div>';
    }
    h += '<div class="sem-gruppe"><span class="sem-gruppe-titel">Knoten bestätigen</span><div class="sem-reihe">'
      + aktionKnopf('pass', '', 'Passt') + '</div></div>';
    aktionenEl.innerHTML = h;

    // --- Fehlerknöpfe ---
    if (fehlerEl) {
      fehlerEl.innerHTML = fehlerArten.map((k) =>
        `<button type="button" class="sem-fehlerknopf" data-fehler="${k}"${state.over ? ' disabled' : ''}>${esc(FEHLER[k])}</button>`
      ).join('');
    }

    // --- Baum: erst das (leere) svg für die linien, dann die knoten ---
    // die linien werden erst nach dem layout gezeichnet, weil dafür die positionen der elemente bekannt sein müssen
    treeEl.innerHTML = '<svg class="pb-wires" aria-hidden="true"></svg>' + nodeHtml(state.wurzel);
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => { zeichneLinien(); zeigeAktuellen(); });

    zeichneMeldung();
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

  // bei jedem neuen prüfschritt den aktuellen knoten in die mitte der baumfläche scrollen, waagerecht und senkrecht
  // nur einmal pro schritt, damit ein fehlversuch oder ein neuzeichnen den baum nicht wegschiebt, wenn der spieler ihn selbst verschoben hat
  function zeigeAktuellen() {
    if (state.i === zentriertBei) return;
    const cur = treeEl.querySelector('.cur');
    if (!cur) return;
    zentriertBei = state.i;
    zentriere(scrollEl, cur);
  }

  // verbindungslinien als geschwungene kurven ins svg, von der unterkante des elternknotens zur oberkante des kindes
  // positionen aus dem tatsächlichen layout, relativ zum baumcontainer
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
      n.kids.forEach((c) => {
        const pe = elOf(n);
        const ce = elOf(c);
        if (pe && ce) {
          const p = pt(pe, true);
          const q = pt(ce, false);
          const mid = (p.y + q.y) / 2;
          out += `<path d="M${p.x} ${p.y} C${p.x} ${mid} ${q.x} ${mid} ${q.x} ${q.y}"/>`;
        }
        walk(c);
      });
    })(state.wurzel);
    svg.innerHTML = out;
  }

  // ---- Bedienung: ein Klick pro Zug ----
  container.addEventListener('click', (ev) => {
    const t = ev.target;
    let b;
    if ((b = t.closest('[data-t]'))) { zieh({ t: b.dataset.t, v: b.dataset.v || undefined }); return; }
    if ((b = t.closest('[data-fehler]'))) { zieh({ t: 'fehler', v: b.dataset.fehler }); return; }
    if ((b = t.closest('[data-zeile]'))) { zieh({ t: 'row', v: b.dataset.zeile }); }
  });

  // ---- Semantikregeln-Pop-up (nur mit config.regelnHtml) ----
  // eigenes fenster statt openModal() aus app.js, weil eine übung app.js nicht kennen soll
  // nutzt dieselben css-klassen (.modal-backdrop, .modal, ...) und sieht deshalb aus wie die info-/hilfe-pop-ups
  let regelnModal = null;
  function openRegeln() {
    if (regelnModal) return;
    regelnModal = document.createElement('div');
    regelnModal.className = 'modal-backdrop';
    regelnModal.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-label="Semantikregeln">
        <div class="modal-head"><h3>Semantikregeln</h3><button class="btn-close modal-close" aria-label="Schließen">&times;</button></div>
        <div class="modal-body"><div class="modal-text modal-text--regeln">${config.regelnHtml}</div></div>
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

  lade();

  return () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener('resize', zeichneLinien);
    closeRegeln();
  };
}

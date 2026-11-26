/* 
codegenerierungsphase

config:
  quelltext: quellcode (text)
  bausteine: liste { bid, id, p, zeile } in reihenfolge der ablage (zeile = index ab 0, in die der baustein im muster gehört)
  muster: musterübersetzung (liste { id, p }), nur für die prüfung
  datenAdressen: { start, anzahl }, zur wahl stehen nur die zellen start bis start + anzahl - 1
  start: { c, r } startfeld des roboters für den vergleich der läufe
  hindernisse: optional, felder { c, r }, auf die der roboter nicht fahren darf
  sichtbar: optional { register, flag }, false blendet register bzw. flag in der speicheranzeige aus (standard: alles sichtbar)
  schrittBereit(fn): optional, fn setzt den nächsten baustein für den spieler richtig
  beiFalsch, beiRichtig: optional
  beiEnde('ok', programm): optional, nach bestandener prüfung, programm = kopie der zeilen { bid, id, p }
*/

import { REGS, WERT_MAX, DEFS, robotAnzahl } from './maschine.js';
import { pruefe } from './compiler-weg-codegen-pruefung.js';

const range = (a, b) => { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; };

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

// operand in der ablage: die art steht fest (zahl, register, speicherzelle), der inhalt ist offen und wird erst im programmspeicher eingetragen
function operandFrei(op) {
  if (op.t === 'wert') return 'Zahl';
  if (op.t === 'register') return 'Register';
  return '(D)';
}

// der baustein als text für die ablage
function bausteinText(b) {
  const def = DEFS[b.id], p = b.p;
  if (def.form === 'kopiere') return def.label + ' ' + operandFrei(p.src) + ' → ' + operandFrei(p.dst);
  if (def.form === 'arith') return def.label + ' Register, ' + operandFrei(p.op2);
  if (def.form === 'cmp') return def.label + ' ' + operandFrei(p.op1) + ', ' + operandFrei(p.op2);
  if (def.form === 'jump' || def.form === 'jumpf') return def.label + ' (Z)';
  if (def.form === 'robot') return def.label + ' ' + operandFrei(robotAnzahl(p));
  return def.label;
}

// die parameter eines neu platzierten bausteins: feste teile bleiben, alles offene beginnt leer (zahl) oder mit einem standardwert (verrät nichts von der musterübersetzung)
function frischeParameter(b, ersteZelle) {
  const q = JSON.parse(JSON.stringify(b.p));
  ['src', 'dst', 'op1', 'op2', 'n'].forEach((k) => {
    if (!q[k]) return;
    if (q[k].t === 'register') q[k].v = REGS[0];
    else if (q[k].t === 'speicher') q[k].v = ersteZelle;
    else q[k].v = null;
  });
  if (q.reg) q.reg = REGS[0];
  if (q.line) q.line = 1;
  return q;
}

export function render(container, config) {
  const bausteine = config.bausteine;
  const LINES = bausteine.length;
  const nachBid = new Map(bausteine.map((b) => [b.bid, b]));
  // programmspeicher: pro zeile { bid, id, p } oder null
  const rows = new Array(LINES).fill(null);
  // zellen des datenspeichers, die zur wahl stehen: genau die der variablen (config.datenAdressen)
  const da = config.datenAdressen;
  const MEM_ADR = range(da.start, da.start + da.anzahl - 1);
  const ERSTE_ZELLE = da.start;
  // schreibweise der adressen: datenzelle, zeile als sprungziel und zeilennummer links im programmspeicher
  const zelleText = (a) => '(D' + (a - ERSTE_ZELLE + 1) + ')';
  const zielText = (z) => '(Z' + z + ')';
  const zeilenNr = zielText;
  let drag = null;      // { bid, ghost, from } während eines drags
  let fertig = false;   // prüfung bestanden: programm ist gesperrt
  const flashTimers = new Set();

  const root = el('div', 'robot-app');
  container.appendChild(root);
  root.innerHTML = '<div class="robot-stage cg-stage"></div>';
  const stageEl = root.querySelector('.robot-stage');

  // spalten von links nach rechts: quellcode, maschinencode, ablage, speicher/register mit button und rückmeldung darunter

  const left = el('div', 'cg-left');
  const ref = el('div', 'cg-source');
  ref.appendChild(el('div', 'cg-source-title', 'Quellcode'));
  ref.appendChild(el('pre', 'cg-source-code', config.quelltext));
  left.appendChild(ref);
  stageEl.appendChild(left);

  // passive speicheranzeige oben in der 4. spalte (eingehängt unten)
  // in der ersten zeile register und flag nebeneinander, darunter der datenspeicher, jeweils mit überschrift
  // die zellen und register bleiben leer, weil sie erst zur laufzeit werte bekommen
  const memCard = el('div', 'robot-card cg-speicherleiste');
  const gruppe = (titel, parent) => {
    const g = el('div', 'cg-speicher-gruppe');
    g.appendChild(el('div', 'cg-sub cg-mem-title', titel));
    parent.appendChild(g);
    return g;
  };
  const cpuZeile = el('div', 'cg-speicher-zeile');
  memCard.appendChild(cpuZeile);
  const regGruppe = gruppe('Register', cpuZeile);
  const flagGruppe = gruppe('Flag', cpuZeile);
  // es gibt noch keinen datenspeicher, nur die geplanten datenzellen
  const memGruppe = gruppe('Datenzellen', memCard);
  const memGrid = el('div', 'cg-mem-grid');
  const memCells = {};
  MEM_ADR.forEach((a) => {
    const c = el('div', 'cg-mem-cell');
    c.appendChild(el('span', 'cg-mem-addr', zelleText(a)));
    c.appendChild(el('span', 'cg-mem-val'));
    memGrid.appendChild(c);
    memCells[a] = c;
  });
  memGruppe.appendChild(memGrid);
  const regRow = el('div', 'cg-reg-row');
  REGS.forEach((r) => {
    const g = el('div', 'cg-mem-cell cg-reg');
    g.appendChild(el('span', 'cg-reg-name', r));
    g.appendChild(el('span', 'cg-mem-val'));
    regRow.appendChild(g);
  });
  regGruppe.appendChild(regRow);
  const flagRow = el('div', 'cg-reg-row');
  const flagCell = el('div', 'cg-mem-cell cg-flag');
  flagCell.appendChild(el('span', 'cg-flag-val', '1/0'));
  flagRow.appendChild(flagCell);
  flagGruppe.appendChild(flagRow);
  // ohne flag füllen die register die zeile allein
  // ist keins von beiden sichtbar, entfällt die zeile ganz
  if (config.sichtbar?.register === false) regGruppe.remove();
  if (config.sichtbar?.flag === false) flagGruppe.remove();
  if (!cpuZeile.children.length) cpuZeile.remove();

  // hebt die gewählte zelle kurz hervor, damit sichtbar ist, worauf die adresse zeigt (reine darstellung)
  function flashCell(addr) {
    const c = memCells[addr];
    if (!c) return;
    c.classList.add('highlight');
    const t = setTimeout(() => { c.classList.remove('highlight'); flashTimers.delete(t); }, 1400);
    flashTimers.add(t);
  }

  // ---- 2. und 3. Spalte: Programmspeicher und Ablage als Paar ----
  // die höhe des paars gibt der programmspeicher vor, höchstens bis zum unteren rand der folie (passeHoeheAn()), die ablage wird auf diese höhe gestreckt und scrollt
  const pair = el('div', 'cg-pair');
  const build = el('div', 'robot-build cg-build');
  build.appendChild(el('div', 'robot-ref-title', 'Maschinencode'));
  // immer scrollbar: das fenster reicht bis zum unteren rand der folie
  const rowsEl = el('div', 'cg-rows-scroll');
  build.appendChild(rowsEl);
  pair.appendChild(build);
  stageEl.appendChild(pair);

  const side = el('div', 'robot-ue-side cg-pal-side');
  const palCard = el('div', 'robot-card');
  palCard.appendChild(el('h2', '', 'Bausteine'));
  const ablageEl = el('div', 'robot-ue-pal');
  palCard.appendChild(ablageEl);
  side.appendChild(palCard);
  pair.appendChild(side);

  // ---- 4. Spalte: Speicher, darunter Überprüfen und die Rückmeldung ----
  const memSide = el('div', 'robot-ue-side cg-mem-side');
  memSide.appendChild(memCard);

  const actions = el('div', 'robot-actions');
  // zurücksetzen gibt es hier nicht, die phase wird neu aufgebaut
  const checkBtn = el('button', 'btn btn--l btn--accent', 'Überprüfen');
  checkBtn.onclick = ueberpruefen;
  actions.appendChild(checkBtn);
  memSide.appendChild(actions);

  const resultEl = el('div', 'robot-ue-result');
  resultEl.hidden = true;
  memSide.appendChild(resultEl);
  stageEl.appendChild(memSide);

  // ---- Bedienelemente im Baustein ----
  function select(values, current, cls, fmt, onChange) {
    const s = el('select', 'cg-field ' + cls);
    values.forEach((v) => {
      const o = el('option', '', fmt(v));
      o.value = v;
      if (String(v) === String(current)) o.selected = true;
      s.appendChild(o);
    });
    s.disabled = fertig;
    s.onchange = () => { onChange(s.value); clearResult(); };
    return s;
  }
  // zahl im baustein: nur ganze zahlen von 0 bis 255
  // textfeld statt type="number", weil sich dort minus, komma und "e" nicht sperren lassen
  // was über 255 hinausginge, wird gar nicht erst angenommen (die zuletzt getippte ziffer fällt weg)
  function zahlEl(op) {
    const i = el('input', 'cg-field');
    i.type = 'text';
    i.inputMode = 'numeric';
    i.maxLength = 3;
    i.value = op.v === null ? '' : op.v;
    i.disabled = fertig;
    i.oninput = () => {
      let s = i.value.replace(/\D/g, '').slice(0, 3);
      while (s !== '' && parseInt(s, 10) > WERT_MAX) s = s.slice(0, -1);
      i.value = s;
      op.v = s === '' ? null : parseInt(s, 10);
      clearResult();
    };
    return i;
  }
  // zahl, register und speicherzelle als auswahl
  function operandEl(op) {
    if (op.t === 'wert') return zahlEl(op);
    if (op.t === 'register') return select(REGS, op.v, '', (v) => v, (v) => { op.v = v; });
    return select(MEM_ADR, op.v, 'cg-sel-mem', zelleText, (v) => { op.v = +v; flashCell(+v); });
  }

  // ---- Baustein-Elemente ----
  // baustein in der ablage: <button> wie in den übrigen übungen, mit den festen teilen, die offenen teile (□) trägt man erst nach dem platzieren ein
  function ablageBaustein(b) {
    const e = el('button', 'robot-mblock cg-block ' + DEFS[b.id].kind);
    e.type = 'button';
    e.appendChild(el('span', 'cg-name', bausteinText(b)));
    return e;
  }
  // platzierter baustein: div statt <button>, weil <select> und <input> nicht in einen <button> dürfen
  function placedEl(row, ri) {
    const def = DEFS[row.id], p = row.p;
    const b = el('div', 'robot-mblock-placed cg-block ' + def.kind + (fertig ? '' : ' robot-movable'));
    // verschieben im programmspeicher: ziehen startet überall im baustein, nur nicht auf den bedienelementen, die sollen normal bedienbar bleiben
    b.addEventListener('pointerdown', (e) => {
      if (e.target.closest('select, input, button')) return;
      startDrag(row.bid, e, ri);
    });
    if (def.form === 'kopiere') {
      b.appendChild(el('span', 'cg-name', def.label));
      b.appendChild(operandEl(p.src));
      b.appendChild(el('span', 'cg-name', '→'));
      b.appendChild(operandEl(p.dst));
    } else if (def.form === 'arith') {
      b.appendChild(el('span', 'cg-name', def.label));
      b.appendChild(select(REGS, p.reg, '', (v) => v, (v) => { p.reg = v; }));
      b.appendChild(el('span', 'cg-name', ','));
      b.appendChild(operandEl(p.op2));
    } else if (def.form === 'cmp') {
      b.appendChild(el('span', 'cg-name', def.label));
      b.appendChild(operandEl(p.op1));
      b.appendChild(el('span', 'cg-name', ','));
      b.appendChild(operandEl(p.op2));
    } else if (def.form === 'jump' || def.form === 'jumpf') {
      b.appendChild(el('span', 'cg-name', def.label));
      b.appendChild(select(range(1, LINES), p.line, 'cg-sel-line', zielText, (v) => { p.line = +v; }));
    } else if (def.form === 'robot') {
      b.appendChild(el('span', 'cg-name', def.label));
      b.appendChild(operandEl(robotAnzahl(p)));
    } else {
      b.appendChild(el('span', 'cg-name', def.label));
    }
    if (!fertig) {
      const rm = el('button', 'robot-mblock-remove', '×');
      rm.type = 'button';
      rm.title = 'Entfernen';
      rm.onclick = () => { rows[ri] = null; clearResult(); renderAll(); };
      b.appendChild(rm);
    }
    return b;
  }

  // unsichtbare messzeile mit dem breitesten möglichen baustein (mov, speicherzelle → speicherzelle, samt entfernen-knopf)
  // sie gibt dem maschinencode-fenster seine breite, damit es auch ohne platzierte bausteine und nach der prüfung gleich breit bleibt
  function messzeile() {
    const z = el('div', 'robot-mrow cg-messzeile');
    z.setAttribute('aria-hidden', 'true');
    z.appendChild(el('span', 'robot-lineno', zeilenNr(LINES)));
    const slot = el('div', 'robot-mslot robot-filled');
    const b = el('div', 'robot-mblock-placed cg-block ' + DEFS.kopiere.kind);
    const mem = { t: 'speicher', v: ERSTE_ZELLE };
    b.appendChild(el('span', 'cg-name', DEFS.kopiere.label));
    b.appendChild(operandEl(mem, false));
    b.appendChild(el('span', 'cg-name', '→'));
    b.appendChild(operandEl(mem, false));
    b.appendChild(el('button', 'robot-mblock-remove', '×'));
    slot.appendChild(b);
    z.appendChild(slot);
    return z;
  }

  let blockEls = [];
  function renderRows() {
    rowsEl.innerHTML = '';
    rowsEl.appendChild(messzeile());
    blockEls = [];
    for (let ri = 0; ri < LINES; ri++) {
      const row = el('div', 'robot-mrow');
      row.appendChild(el('span', 'robot-lineno', zeilenNr(ri + 1)));
      const slot = el('div', 'robot-mslot');
      slot.dataset.row = ri;
      if (rows[ri]) {
        slot.classList.add('robot-filled');
        blockEls[ri] = placedEl(rows[ri], ri);
        slot.appendChild(blockEls[ri]);
      }
      row.appendChild(slot);
      rowsEl.appendChild(row);
    }
  }
  // die ablage zeigt alle bausteine, die noch in keiner zeile stehen
  function renderAblage() {
    ablageEl.innerHTML = '';
    const platziert = new Set(rows.filter(Boolean).map((r) => r.bid));
    const offen = bausteine.filter((b) => !platziert.has(b.bid));
    offen.forEach((b) => {
      const e = ablageBaustein(b);
      e.disabled = fertig;
      e.addEventListener('pointerdown', (ev) => startDrag(b.bid, ev));
      ablageEl.appendChild(e);
    });
  }
  function renderAll() {
    renderRows();
    renderAblage();
    checkBtn.disabled = fertig;
  }

  // ---- Drag & Drop: nur Zeilen im Programmspeicher sind Ablageziel ----
  // aus der ablage: ein baustein in der zielzeile wird ersetzt und wandert zurück in die ablage
  // innerhalb des programmspeichers (drag.from = ausgangszeile): der baustein wandert samt parametern in die zielzeile, steht dort schon einer, tauschen beide die plätze
  // sprungziele werden dabei bewusst nicht angepasst, sie sind feste zeilennummern wie im echten maschinencode
  // loslassen außerhalb lässt alles, wie es war
  function dropSlot(x, y) {
    const t = document.elementFromPoint(x, y);
    if (!t || !rowsEl.contains(t)) return null;
    return t.closest('.robot-mslot');
  }
  function ghostAt(x, y) {
    if (drag) { drag.ghost.style.left = x + 'px'; drag.ghost.style.top = y + 'px'; }
  }
  function startDrag(bid, e, from = null) {
    if (fertig) return;
    e.preventDefault();
    const ghost = ablageBaustein(nachBid.get(bid));
    ghost.classList.add('robot-drag-ghost');
    document.body.appendChild(ghost);
    drag = { bid, ghost, from };
    if (from !== null) blockEls[from].classList.add('robot-dragging');
    ghostAt(e.clientX, e.clientY);
    window.addEventListener('pointermove', onDragMove);
    window.addEventListener('pointerup', onDragUp);
    window.addEventListener('pointercancel', clearDrag);
  }
  function clearActiveSlot() {
    rowsEl.querySelectorAll('.robot-mslot.robot-slot-active').forEach((s) => s.classList.remove('robot-slot-active'));
  }
  function onDragMove(e) {
    ghostAt(e.clientX, e.clientY);
    clearActiveSlot();
    const slot = dropSlot(e.clientX, e.clientY);
    if (slot) slot.classList.add('robot-slot-active');
    if (drag) drag.ghost.classList.toggle('robot-no-drop', !slot);
  }
  function onDragUp(e) {
    const slot = dropSlot(e.clientX, e.clientY);
    const bid = drag && drag.bid;
    const from = drag && drag.from;
    clearDrag();
    if (!slot || !bid) return;
    const to = +slot.dataset.row;
    if (from !== null) {
      if (to === from) return;
      [rows[from], rows[to]] = [rows[to], rows[from]];
    } else {
      const b = nachBid.get(bid);
      rows[to] = { bid, id: b.id, p: frischeParameter(b, ERSTE_ZELLE) };
    }
    clearResult();
    renderAll();
  }
  function clearDrag() {
    if (drag) {
      drag.ghost.remove();
      if (drag.from !== null && blockEls[drag.from]) blockEls[drag.from].classList.remove('robot-dragging');
      drag = null;
    }
    clearActiveSlot();
    window.removeEventListener('pointermove', onDragMove);
    window.removeEventListener('pointerup', onDragUp);
    window.removeEventListener('pointercancel', clearDrag);
  }

  // ---- Überprüfen ----
  // titel: fester titel ("geschafft" grün, "falsch" orange), in einer eigenen zeile über dem satz
  function showResult(msg, kind, titel) {
    resultEl.className = 'robot-ue-result ' + kind;
    resultEl.textContent = '';
    if (titel) {
      const t = document.createElement('span');
      t.className = 'meldung-titel' + (kind === 'robot-ue-hinweis' ? ' meldung-titel--hinweis' : '');
      t.textContent = titel;
      resultEl.append(t);
    }
    resultEl.append(msg);
    resultEl.hidden = false;
  }
  function clearResult() {
    resultEl.hidden = true;
    blockEls.forEach((b) => b && b.classList.remove('cg-err'));
  }

  const zahlFehlt = (op) => op && op.t === 'wert' && (op.v === null || Number.isNaN(op.v));

  function ueberpruefen() {
    clearResult();
    const offen = rows.filter((r) => !r).length;
    if (offen > 0) {
      showResult('Noch ' + (offen === 1 ? '1 Baustein liegt' : offen + ' Bausteine liegen') + ' in der Ablage. Jeder Baustein wird gebraucht.', 'robot-ue-hinweis', 'Falsch');
      return;
    }
    // vollständigkeit: alle zahlenfelder müssen ausgefüllt sein
    const leer = [];
    rows.forEach((r, ri) => {
      if (['src', 'dst', 'op1', 'op2', 'n'].some((k) => zahlFehlt(r.p[k]))) leer.push(ri);
    });
    if (leer.length) {
      leer.forEach((ri) => blockEls[ri].classList.add('cg-err'));
      showResult('Noch nicht vollständig: In Zeile ' + leer.map((ri) => zeilenNr(ri + 1)).join(', ') + ' fehlt eine Zahl (umrandet).', 'robot-ue-hinweis', 'Falsch');
      return;
    }
    const r = pruefe(JSON.parse(JSON.stringify(rows)), bausteine, config.muster, config.start, zeilenNr, config.hindernisse);
    if (!r.ok) {
      (r.zeilen || []).forEach((ri) => { if (blockEls[ri]) blockEls[ri].classList.add('cg-err'); });
      showResult(r.meldung, 'robot-ue-hinweis', 'Falsch');
      // nur ein vollständiges, aber falsches programm zählt als fehler (nicht "noch nicht alles gesetzt")
      config.beiFalsch?.();
      return;
    }
    fertig = true;
    config.beiRichtig?.();
    renderAll();
    showResult('Richtig übersetzt. Dein Programm macht dasselbe wie der Quellcode.', 'robot-ue-ok', 'Geschafft');
    if (config.beiEnde) config.beiEnde('ok', JSON.parse(JSON.stringify(rows)));
  }

  // ein schritt für den spieler (knopf "schritt vormachen"): setzt den baustein der ersten zeile, die noch nicht stimmt, samt den parametern des musters an seinen platz
  // was dort lag, geht zurück in die ablage, ist alles richtig gesetzt, schließt er die übung mit der überprüfung ab
  function schritt() {
    if (fertig) return;
    for (let i = 0; i < LINES; i++) {
      const soll = bausteine.find((b) => b.zeile === i);
      const ist = rows[i];
      if (ist && ist.bid === soll.bid && JSON.stringify(ist.p) === JSON.stringify(soll.p)) continue;
      const j = rows.findIndex((r) => r && r.bid === soll.bid);
      if (j >= 0) rows[j] = null;
      rows[i] = { bid: soll.bid, id: soll.id, p: JSON.parse(JSON.stringify(soll.p)) };
      clearResult();
      renderAll();
      return;
    }
    ueberpruefen();
  }
  if (config.schrittBereit) config.schrittBereit(schritt);

  renderAll();

  // maschinencode (und damit die ablage daneben) wächst mit dem programm, aber höchstens bis zum unteren rand der folie, danach scrollt er
  // die höchsthöhe hängt von der höhe der folie und von der lage der liste ab, deshalb wird sie bei jeder größenänderung neu berechnet
  const folie = container.closest('.slide');
  function passeHoeheAn() {
    if (!folie) return;
    const fs = getComputedStyle(folie), bs = getComputedStyle(build);
    const folieOben = folie.getBoundingClientRect().top + folie.clientTop;
    const listeOben = rowsEl.getBoundingClientRect().top - folieOben + folie.scrollTop;
    const unten = folie.clientHeight - parseFloat(fs.paddingBottom)
      - parseFloat(bs.paddingBottom) - parseFloat(bs.borderBottomWidth);
    // mindestens eine zeile bleibt sichtbar (die erste ist die unsichtbare messzeile)
    const zeile = rowsEl.children[1];
    const minimum = zeile ? zeile.getBoundingClientRect().height : 0;
    rowsEl.style.maxHeight = Math.max(minimum, unten - listeOben) + 'px';
  }
  // alle bausteine sind gleich breit, in der ablage wie im maschinencode: so breit wie der breiteste mögliche baustein (die messzeile)
  // ein baustein behält so seine breite, wenn er aus der ablage in den maschinencode wandert
  // die breite hängt von schrift und auswahlfeldern ab, deshalb wird sie gemessen
  // die ablage wird so breit, dass genau ein baustein hineinpasst (innenabstand der karte und platz für die scrollleiste dazu)
  function passeBreiteAn() {
    // spalte der zeilennummern so breit wie die längste nummer (die der messzeile)
    const nr = rowsEl.querySelector('.cg-messzeile .robot-lineno');
    if (nr) rowsEl.style.setProperty('--zeilen-breite', Math.ceil(nr.getBoundingClientRect().width) + 'px');
    const muster = rowsEl.querySelector('.cg-messzeile .robot-mblock-placed');
    if (!muster) return;
    const ks = getComputedStyle(palCard);
    const breite = Math.ceil(muster.getBoundingClientRect().width
      + parseFloat(ks.paddingLeft) + parseFloat(ks.paddingRight)
      + (palCard.offsetWidth - palCard.clientWidth)) + 'px';
    if (side.style.width !== breite) side.style.width = breite;
  }
  const beobachter = new ResizeObserver(() => { passeBreiteAn(); passeHoeheAn(); });
  if (folie) beobachter.observe(folie);
  beobachter.observe(stageEl);
  passeBreiteAn();
  passeHoeheAn();

  return () => {
    beobachter.disconnect();
    clearDrag();
    flashTimers.forEach((t) => clearTimeout(t));
    flashTimers.clear();
  };
}

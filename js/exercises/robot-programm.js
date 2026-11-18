// roboterprogrammierung
//
// config:
//   mitSchritten: false = jeder befehl bewegt um ein feld, true = hinter dem befehl wählt man per dropdown die anzahl der schritte (0 bis 4), z. b. "rgt 3"
//   hindernisse: optional, felder { c, r } in der farbe der mauer, fährt der roboter darauf, bricht das programm mit einem fehler ab, genau wie bei der wand um das spielfeld
//
// die zurückgegebene funktion stoppt die setTimeout-kette der ausführung und räumt einen laufenden drag auf (window-listener, ghost-node am document.body)

import { meldeHilfe } from '../uebung.js';
import { ROBOTER_SVG, istHindernis } from './maschine.js';
import { rem } from '../einheiten.js';

const DIR_STEP =[{ dc: 0, dr: -1 }, { dc: 1, dr: 0 }, { dc: 0, dr: 1 }, { dc: -1, dr: 0 }];

const MAX_SCHRITTE = 4;
const ZEILEN = 6;           // zeilen des programms
const STANDARD_SCHRITTE = 1;

// hilfetext im zeilen-aufbau der übrigen hilfen: links nachbildungen der bausteine und knöpfe (.mini-* in css/20-popups.css), rechts kurz, was sie tun
// mit mitSchritten kommt eine zeile zur schrittzahl dazu
function hilfeHtml(mitSchritten) {
  const zeile = (links, text) => `
    <div class="hilfe-zeile">
      <div class="hilfe-knoepfe">${links}</div>
      <p>${text}</p>
    </div>`;
  const befehl = (name, extra = '') => `<span class="mini-befehl">${name}${extra}</span>`;
  return [
    zeile(`<span class="mini-befehle">${['up', 'dwn', 'rgt', 'lft'].map((n) => befehl(n)).join('')}</span>`,
      mitSchritten
        ? 'Die Befehle bewegen den Roboter nach oben, unten, rechts oder links.'
        : 'Die Befehle bewegen den Roboter ein Feld nach oben, unten, rechts oder links.'),
    mitSchritten && zeile(befehl('rgt', '<span class="mini-zahl">3 ▾</span>'),
      `Hinter jedem Befehl im Programm wählst du, wie viele Felder er gehen soll (0 bis ${MAX_SCHRITTE}). Bei 0 bleibt er stehen, die Zeile wird aber trotzdem ausgeführt.`),
    zeile(`<span class="mini-programmzeile"><span class="mini-zeilennr">01</span>${befehl('rgt', '<span class="mini-x">×</span>')}</span>`,
      'Zieh einen Befehl in eine Zeile des Programms. Liegt dort schon einer, wird er ersetzt. Platzierte Befehle kannst du in eine andere Zeile ziehen, dann tauschen sie die Plätze. Mit × entfernst du einen Befehl.'),
    zeile('<span class="mini-knopf mini-knopf--akzent">Start</span>',
      'Leere Zeilen werden zuerst geschlossen, die Befehle rücken nach oben. Dann arbeitet der Roboter das Programm von oben nach unten ab, die aktuelle Zeile wird markiert.'),
    zeile('<span class="mini-warnung" aria-hidden="true"></span>',
      'Fährt der Roboter gegen ein Hindernis (die Wand um das Spielfeld oder ein graues Feld), bricht das Programm ab, und du siehst, in welcher Zeile es passiert ist.'),
    zeile('<span class="mini-knopf">Zurücksetzen</span>',
      'Leert das Programm und stellt den Roboter zurück auf sein Startfeld.'),
  ].filter(Boolean).join('');
}

export function renderRobotProgramm(container, { mitSchritten = false, hindernisse = [] } = {}) {
  meldeHilfe(container, { titel: 'Roboter programmieren', html: hilfeHtml(mitSchritten) });
  const GEN = {
    buildTitle: 'Programm',
    buildSub: '',
    paletteTitle: 'Roboter-Befehle',
    rowCount: ZEILEN,
    // reihenfolge wie in der aufzählung auf der folie davor
    blocks: [
      { id: 'oben', name: 'up', dir: 0 },
      { id: 'unten', name: 'dwn', dir: 2 },
      { id: 'rechts', name: 'rgt', dir: 1 },
      { id: 'links', name: 'lft', dir: 3 },
    ].map((b) => ({ ...b, kind: 'robot-m-dir', text: b.name })),
    placed: new Array(ZEILEN).fill(null),
    zahlen: new Array(ZEILEN).fill(STANDARD_SCHRITTE), // gewählte schrittzahl je zeile
  };
  const RT = {
    cols: 6, rows: 6, pitch: 60, cell: 52, start: { c: 3, r: 3 },
  };

  let rtTimer = null;
  let rtPos = { c: RT.start.c, r: RT.start.r };
  let rtProg = [];
  let genDrag = null;    // { def, from } während eines drags, from = ausgangszeile oder null (ablage)
  let genGhostEl = null;
  let disarmMove = null; // wartet auf genug bewegung, um aus einem klick ein ziehen zu machen
  let errEl = null;

  const rtStartPos = () => ({ c: RT.start.c, r: RT.start.r });
  const rtOutside = (c, r) => c < 0 || r < 0 || c >= RT.cols || r >= RT.rows;
  const rtProgram = () => GEN.placed.map((id, ri) => {
    if (!id) return null;
    const b = GEN.blocks.find((x) => x.id === id);
    return { dir: b.dir, n: mitSchritten ? GEN.zahlen[ri] : 1 };
  }).filter(Boolean);

  // dropdown hinter dem befehl eines platzierten bausteins
  function schrittSelect(ri) {
    const sel = document.createElement('select');
    sel.className = 'robot-mem-ref robot-schritt';
    sel.title = 'Anzahl der Schritte';
    sel.setAttribute('aria-label', 'Anzahl der Schritte');
    for (let n = 0; n <= MAX_SCHRITTE; n++) sel.add(new Option(String(n), String(n)));
    sel.value = String(GEN.zahlen[ri]);
    sel.onchange = () => { GEN.zahlen[ri] = +sel.value; };
    return sel;
  }

  function blockEl(def) {
    const b = document.createElement('button');
    b.className = 'robot-mblock ' + def.kind;
    b.innerHTML = '<span class="robot-cap">' + def.text + '</span>';
    return b;
  }

  container.className = 'robot-app robot-programm';
  container.innerHTML = `
    <div class="robot-hint">${mitSchritten
    ? `Ziehe die Befehle in das Programm, wähle hinter dem Befehl die Anzahl der Schritte (0 bis ${MAX_SCHRITTE}) und drücke auf „Start“, damit sie der Roboter abarbeitet.`
    : 'Ziehe die Befehle in das Programm und drücke auf „Start“, damit sie der Roboter abarbeitet.'}</div>
    <div class="robot-stage"></div>
  `;
  const stageEl = container.querySelector('.robot-stage');

  // ---- Programmspeicher (links) ----
  const build = document.createElement('div');
  build.className = 'robot-build robot-build-links';
  build.innerHTML = '<div class="robot-ref-title">' + GEN.buildTitle + '</div>'
    + (GEN.buildSub ? '<div class="robot-build-sub">' + GEN.buildSub + '</div>' : '');
  const rowsEl = document.createElement('div');
  build.appendChild(rowsEl);
  stageEl.appendChild(build);

  function renderRows() {
    rowsEl.innerHTML = '';
    for (let ri = 0; ri < GEN.rowCount; ri++) {
      const row = document.createElement('div');
      row.className = 'robot-mrow';
      const no = document.createElement('span');
      no.className = 'robot-lineno';
      no.textContent = String(ri + 1).padStart(2, '0');
      row.appendChild(no);

      const slot = document.createElement('div');
      slot.className = 'robot-mslot';
      slot.dataset.row = ri;
      const bid = GEN.placed[ri];
      if (bid) {
        const def = GEN.blocks.find((b) => b.id === bid);
        slot.classList.add('robot-filled');
        // kein <button> wie in der palette, weil der entfernen-button hineinmuss (button in button ist nicht erlaubt)
        // verschieben per ziehen, entfernen per ×
        const b = document.createElement('div');
        b.className = 'robot-mblock robot-movable ' + def.kind;
        b.title = 'Ziehen zum Verschieben';
        const cap = document.createElement('span');
        cap.className = 'robot-cap';
        if (mitSchritten) cap.append(def.name + ' ', schrittSelect(ri));
        else cap.textContent = def.text;
        b.appendChild(cap);
        b.addEventListener('pointerdown', (e) => {
          if (e.target.closest('button, select')) return;
          armMove(def, ri, e);
        });
        const rm = document.createElement('button');
        rm.type = 'button';
        rm.className = 'robot-mblock-remove';
        rm.title = 'Entfernen';
        rm.textContent = '×';
        rm.onclick = () => { GEN.placed[ri] = null; renderRows(); };
        b.appendChild(rm);
        slot.appendChild(b);
      }
      row.appendChild(slot);
      rowsEl.appendChild(row);
    }
  }
  renderRows();

  // ---- Laufzeit-Grid (3. Spalte, rechts außen) ----
  // fern von der palette, damit bausteine nicht über das grid gezogen werden müssen
  const left = document.createElement('div');
  left.className = 'robot-rt-left';
  const gridWrap = document.createElement('div');
  gridWrap.className = 'robot-rt-grid-wrap robot-rt-grid-wrap-kompakt';
  const grid = document.createElement('div');
  grid.className = 'robot-rt-grid';
  grid.style.width = rem(RT.cols * RT.pitch - (RT.pitch - RT.cell));
  grid.style.height = rem(RT.rows * RT.pitch - (RT.pitch - RT.cell));
  for (let r = 0; r < RT.rows; r++) {
    for (let c = 0; c < RT.cols; c++) {
      const cell = document.createElement('div');
      cell.className = 'robot-rt-cell';
      if (istHindernis(hindernisse, c, r)) cell.classList.add('robot-rt-hindernis');
      cell.style.width = cell.style.height = rem(RT.cell);
      cell.style.left = rem(c * RT.pitch);
      cell.style.top = rem(r * RT.pitch);
      grid.appendChild(cell);
    }
  }
  const robotEl = document.createElement('div');
  robotEl.className = 'robot-figure robot-figure-gross';
  robotEl.style.width = robotEl.style.height = rem(RT.cell);
  robotEl.insertAdjacentHTML('beforeend', ROBOTER_SVG);
  grid.appendChild(robotEl);
  gridWrap.appendChild(grid);
  left.appendChild(gridWrap);

  function placeRobot() {
    const t = 'translate(' + rem(rtPos.c * RT.pitch) + ',' + rem(rtPos.r * RT.pitch) + ')';
    robotEl.style.setProperty('--pos', t);
    robotEl.style.transform = t;
  }
  placeRobot();

  // ---- 2. Spalte, direkt neben dem Programmspeicher: Palette, Buttons ----
  const col = document.createElement('div');
  col.className = 'robot-rightstack';

  const palCard = document.createElement('div');
  palCard.className = 'robot-card';
  palCard.innerHTML = '<h2>' + GEN.paletteTitle + '</h2>';
  const pal = document.createElement('div');
  pal.className = 'robot-dir-grid robot-dir-spalte';
  palCard.appendChild(pal);
  GEN.blocks.forEach((def) => {
    const b = blockEl(def);
    b.addEventListener('pointerdown', (e) => startDrag(def, e));
    pal.appendChild(b);
  });
  col.appendChild(palCard);

  const actionsEl = document.createElement('div');
  actionsEl.className = 'robot-actions';
  const resetBtn = document.createElement('button');
  resetBtn.className = 'robot-btn-reset';
  resetBtn.textContent = 'Zurücksetzen';
  resetBtn.onclick = reset;
  const runBtn = document.createElement('button');
  runBtn.className = 'robot-check-btn';
  runBtn.textContent = 'Start';
  runBtn.onclick = run;
  actionsEl.appendChild(resetBtn);
  actionsEl.appendChild(runBtn);
  col.appendChild(actionsEl);

  stageEl.appendChild(col);
  stageEl.appendChild(left);

  // markiert die zeile, die gerade ausgeführt wird
  // line zählt nur die belegten zeilen (wie rtProg), nicht die zeilennummer in der ablage
  function markLine(line) {
    clearMark();
    const slots = rowsEl.querySelectorAll('.robot-mslot.robot-filled');
    if (slots[line]) slots[line].classList.add('robot-aktiv');
  }
  function clearMark() {
    rowsEl.querySelectorAll('.robot-mslot.robot-aktiv').forEach((s) => s.classList.remove('robot-aktiv'));
  }

  // ---- Drag & Drop: nur Zeilen im Programmspeicher gelten als Ablageziel ----
  // aus der ablage: ein baustein in der zielzeile wird ersetzt
  // innerhalb des programmspeichers (genDrag.from = ausgangszeile): der baustein wandert in die zielzeile, steht dort schon einer, tauschen beide die plätze
  function dropSlot(x, y) {
    const el = document.elementFromPoint(x, y);
    if (!el || !rowsEl.contains(el)) return null;
    return el.closest('.robot-mslot');
  }
  function ghostAt(x, y) {
    if (genGhostEl) { genGhostEl.style.left = x + 'px'; genGhostEl.style.top = y + 'px'; }
  }
  // ein platzierter baustein wird erst ab ein paar pixeln bewegung zum ziehen, damit ein einfacher klick darauf nichts auslöst
  function armMove(def, ri, e) {
    if (e.button !== 0) return;
    const x0 = e.clientX, y0 = e.clientY;
    const onMove = (ev) => {
      if (Math.hypot(ev.clientX - x0, ev.clientY - y0) < 5) return;
      disarm();
      startDrag(def, ev, ri);
    };
    const disarm = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', disarm);
      window.removeEventListener('pointercancel', disarm);
      disarmMove = null;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', disarm);
    window.addEventListener('pointercancel', disarm);
    disarmMove = disarm;
  }
  function startDrag(def, e, from = null) {
    e.preventDefault();
    genDrag = { def, from };
    if (from !== null) rowsEl.querySelector('.robot-mslot[data-row="' + from + '"] > *').classList.add('robot-dragging');
    genGhostEl = blockEl(def);
    genGhostEl.classList.add('robot-drag-ghost');
    document.body.appendChild(genGhostEl);
    ghostAt(e.clientX, e.clientY);
    window.addEventListener('pointermove', onDragMove);
    window.addEventListener('pointerup', onDragUp);
    window.addEventListener('pointercancel', clearDrag);
  }
  function onDragMove(e) {
    ghostAt(e.clientX, e.clientY);
    rowsEl.querySelectorAll('.robot-mslot.robot-slot-active').forEach((s) => s.classList.remove('robot-slot-active'));
    const slot = dropSlot(e.clientX, e.clientY);
    if (slot) { slot.classList.add('robot-slot-active'); if (genGhostEl) genGhostEl.classList.remove('robot-no-drop'); }
    else if (genGhostEl) genGhostEl.classList.add('robot-no-drop');
  }
  function onDragUp(e) {
    const slot = dropSlot(e.clientX, e.clientY);
    const drag = genDrag;
    clearDrag();
    if (!slot || !drag) return;
    const to = +slot.dataset.row;
    if (drag.from === null) {
      GEN.placed[to] = drag.def.id;
      GEN.zahlen[to] = STANDARD_SCHRITTE;
    } else if (to !== drag.from) {
      [GEN.placed[drag.from], GEN.placed[to]] = [GEN.placed[to], GEN.placed[drag.from]];
      [GEN.zahlen[drag.from], GEN.zahlen[to]] = [GEN.zahlen[to], GEN.zahlen[drag.from]];
    } else return;
    renderRows();
  }
  function clearDrag() {
    if (disarmMove) disarmMove();
    rowsEl.querySelectorAll('.robot-dragging').forEach((b) => b.classList.remove('robot-dragging'));
    genDrag = null;
    if (genGhostEl) { genGhostEl.remove(); genGhostEl = null; }
    rowsEl.querySelectorAll('.robot-mslot.robot-slot-active').forEach((s) => s.classList.remove('robot-slot-active'));
    window.removeEventListener('pointermove', onDragMove);
    window.removeEventListener('pointerup', onDragUp);
    window.removeEventListener('pointercancel', clearDrag);
  }

  function reset() {
    GEN.placed = new Array(GEN.rowCount).fill(null);
    GEN.zahlen = new Array(GEN.rowCount).fill(STANDARD_SCHRITTE);
    renderRows();
    stopTimer();
    clearError();
    rtPos = rtStartPos();
    rtProg = rtProgram();
    placeRobot();
  }

  // ---- Ausführung ----
  function trace() {
    const steps = [];
    const p = rtStartPos();
    for (let i = 0; i < rtProg.length; i++) {
      const cmd = rtProg[i];
      // ein schritt pro feld
      // bei 0 schritten gibt es trotzdem einen eintrag ohne bewegung, damit die zeile markiert wird
      for (let s = 0; s < Math.max(cmd.n, 1); s++) {
        const st = { line: i, first: s === 0 };
        if (cmd.n > 0) {
          const nc = p.c + DIR_STEP[cmd.dir].dc;
          const nr = p.r + DIR_STEP[cmd.dir].dr;
          // fehler: 'rand' (wand um das spielfeld) oder 'hindernis', beides ist für den spieler ein hindernis, der roboter bleibt stehen
          const fehler = rtOutside(nc, nr) ? 'rand' : istHindernis(hindernisse, nc, nr) ? 'hindernis' : null;
          if (fehler) { st.error = fehler; st.c = p.c; st.r = p.r; steps.push(st); return steps; }
          p.c = nc; p.r = nr;
        }
        st.c = p.c; st.r = p.r;
        steps.push(st);
      }
    }
    return steps;
  }
  function runStep(steps, k) {
    const st = steps[k];
    const bewege = () => {
      // phase 2: der roboter führt den befehl aus und bewegt sich
      rtPos = { c: st.c, r: st.r };
      placeRobot();
      rtTimer = setTimeout(() => {
        if (st.error) { crash(st); return; }
        if (k + 1 >= steps.length) { done(); return; }
        runStep(steps, k + 1);
      }, 480);
    };
    // phase 1: beim ersten schritt eines befehls wird die zeile markiert, der roboter steht noch
    // weitere schritte desselben befehls laufen direkt
    if (st.first) {
      markLine(st.line);
      rtTimer = setTimeout(bewege, 380);
    } else {
      bewege();
    }
  }
  // schließt lücken im programm: die belegten zeilen rücken der reihe nach nach oben, die schrittzahlen wandern mit
  // danach ist die nummer im programm (rtProg, st.line) gleich der zeilennummer im programmspeicher, die fehlermeldung nennt die richtige zeile
  function lueckenSchliessen() {
    const belegt = GEN.placed.map((id, ri) => ({ id, n: GEN.zahlen[ri] })).filter((z) => z.id);
    GEN.placed = new Array(GEN.rowCount).fill(null);
    GEN.zahlen = new Array(GEN.rowCount).fill(STANDARD_SCHRITTE);
    belegt.forEach((z, i) => { GEN.placed[i] = z.id; GEN.zahlen[i] = z.n; });
    renderRows();
  }

  function run() {
    rtProg = rtProgram();
    if (!rtProg.length) return;
    lueckenSchliessen();
    stopTimer();
    clearError();
    clearMark();
    rtPos = rtStartPos();
    placeRobot();
    const steps = trace();
    setActionsDisabled(true);
    runStep(steps, 0);
  }
  function crash(st) {
    robotEl.classList.add('robot-crash');
    setTimeout(() => robotEl.classList.remove('robot-crash'), 360);
    if (errEl) { setActionsDisabled(false); return; }
    errEl = document.createElement('div');
    errEl.className = 'robot-rt-error';
    errEl.innerHTML = '<div class="robot-exc" aria-hidden="true"></div><div class="robot-msg">Fehler in Zeile '
      + (st.line + 1) + ': Der Roboter ist gegen ein Hindernis gefahren.</div>';
    gridWrap.appendChild(errEl);
    setActionsDisabled(false);
  }
  function done() {
    clearMark();
    setActionsDisabled(false);
  }
  function clearError() { if (errEl) { errEl.remove(); errEl = null; } }
  function setActionsDisabled(v) { actionsEl.querySelectorAll('button').forEach((b) => { b.disabled = v; }); }
  function stopTimer() { if (rtTimer) { clearTimeout(rtTimer); rtTimer = null; } }

  rtProg = rtProgram();

  return () => {
    stopTimer();
    clearDrag();
  };
}

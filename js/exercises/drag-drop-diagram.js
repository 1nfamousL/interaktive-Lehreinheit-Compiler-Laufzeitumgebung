/* 
übung: begriffe per drag & drop in ein svg-diagramm ziehen (lektion 1.3)

config:
  svg: das komplette diagramm als svg-string, darin je eine gruppe pro feld: <g class="dd-term-slot" data-target="..."> mit <rect class="dd-drop-zone-box" x y width height /> und <g class="dd-filled-box"></g>
      referenzierte icons (<use href="#...">) müssen als <symbol> im selben svg-string über <defs> definiert sein
  terms: array { id, label, icon?, group?, iconSize?, iconGap?, zeile?, warum?, hinweis? }
    icon: ohne icon steht nur der text im feld und im chip
    group: erlaubt mehrere begriffe für dasselbe feld, standard ist die eigene id (exakter 1:1-treffer)
    iconSize/iconGap: platzierung neben dem text im ausgefüllten feld, standard 18/8
    zeile: bindet begriffe zu paaren, die im diagramm in derselben zeile stehen müssen (gehört zu data-zeile am feld)
    warum: der satz in der grünen meldung nach dem richtigen ablegen
    hinweis: die überlegung hinter "zeige hinweis" nach einem falschen ablegen, zeigt auf den gedanken, nie auf das richtige feld
  zeilenMeldung: optional { text, hinweis }, meldung, wenn der begriff zum feld passt, aber nicht zu den schon liegenden begriffen der zeile, sonst ein allgemeiner satz
  erfolgstext: optional, text in der geleerten begriffsablage, wenn alle begriffe sitzen
  schrittImmer: true: "schritt vormachen" ist immer da, sonst erst nach FEHLER_BIS_SCHRITT falschen ablagen hintereinander
  hinweis: optionale arbeitsanweisung über dem diagramm
  ablage: "unten" legt die begriffsleiste unter das diagramm (chips nebeneinander) statt rechts daneben
*/

import { meldeUebung, meldeGeloest, meldeHilfe } from '../uebung.js';
import { SCHRITT_IMMER } from '../bau-info.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

// nach so vielen falschen ablagen hintereinander erscheint "schritt vormachen"
// ein richtiges ablegen oder der schritt selbst setzt den zähler zurück
const FEHLER_BIS_SCHRITT = 3;

// satz über "zeige hinweis" bei einem begriff am falschen feld: er sagt nur, dass es nicht passt
const PASST_NICHT = 'Das passt hier nicht.';
const ZEILE_STANDARD = {
  text: 'Die Begriffe dieser Zeile passen nicht zusammen.',
  hinweis: 'Überlege, welche Begriffe schon im Diagramm stehen und zu welchem davon dieser gehört.',
};

function fillSlot(slot, term) {
  const dz = slot.querySelector('.dd-drop-zone-box');
  const x = parseFloat(dz.getAttribute('x'));
  const y = parseFloat(dz.getAttribute('y'));
  const w = parseFloat(dz.getAttribute('width'));
  const h = parseFloat(dz.getAttribute('height'));
  const size = term.iconSize ?? 18;
  const gap = term.iconGap ?? 8;
  const iconX = x + 14;
  const iconY = y + (h - size) / 2;
  const textX = term.icon ? iconX + size + gap : x + w / 2;
  const textY = y + h / 2 + 5;

  const group = slot.querySelector('.dd-filled-box');
  group.innerHTML = '';

  const rect = document.createElementNS(SVG_NS, 'rect');
  rect.setAttribute('class', 'dd-node-box');
  rect.setAttribute('x', x); rect.setAttribute('y', y);
  rect.setAttribute('width', w); rect.setAttribute('height', h);
  rect.setAttribute('rx', 10);

  let use = null;
  if (term.icon) {
    use = document.createElementNS(SVG_NS, 'use');
    use.setAttribute('href', '#' + term.icon);
    use.setAttribute('class', 'dd-node-icon');
    use.setAttribute('x', iconX); use.setAttribute('y', iconY);
    use.setAttribute('width', size); use.setAttribute('height', size);
  }

  const text = document.createElementNS(SVG_NS, 'text');
  text.setAttribute('class', 'dd-node-label');
  text.setAttribute('x', textX);
  text.setAttribute('text-anchor', term.icon ? 'start' : 'middle');
  const zeilen = term.label.split('\n');
  if (zeilen.length === 1) {
    text.setAttribute('y', textY);
    text.textContent = term.label;
  } else {
    // mehrere zeilen: als block um die mitte des feldes zentriert
    const lh = 18;
    const y0 = y + h / 2 + 5 - ((zeilen.length - 1) * lh) / 2;
    zeilen.forEach((z, i) => {
      const t = document.createElementNS(SVG_NS, 'tspan');
      t.setAttribute('x', textX);
      t.setAttribute('y', y0 + i * lh);
      t.textContent = z;
      text.appendChild(t);
    });
  }

  group.append(rect, ...(use ? [use] : []), text);
}

// hilfetext im zeilen-aufbau der übrigen hilfen: links nachbildungen von begriffskarte und feld (.mini-dd-* in css/20-popups.css), rechts kurz, was passiert
// allgemein gehalten, die übung kennt die lektion nicht
function hilfeHtml(config) {
  return [
    ['<span class="mini-dd"><span class="mini-dd-karte">Quellcode</span><span class="mini-dd-pfeil">→</span><span class="mini-dd-feld"></span></span>',
      'Zieh einen Begriff aus der Leiste rechts auf ein gestricheltes Feld im Diagramm.'],
    ['<span class="mini-dd-feld falsch"></span>',
      'Passt der Begriff nicht, wackelt das Feld kurz, der Begriff bleibt in der Leiste, und unten links erklärt eine Meldung, dass es nicht passt. Mit „Zeige Hinweis“ bekommst du einen Gedankenanstoß. Mit dem X schließt du die Meldung, sie verschwindet auch, sobald du den nächsten Begriff anfasst. Du kannst es beliebig oft versuchen.'],
    ['<span class="mini-dd-feld gefuellt">Quellcode</span>',
      'Passt er, bleibt er im Feld stehen, und ein Satz erklärt, warum. Richtig abgelegte Begriffe lassen sich nicht mehr verschieben.'],
    ['<span class="mini-knopf">Schritt vormachen</span>',
      (config.schrittImmer || SCHRITT_IMMER
        ? 'Kommst du bei einem Begriff nicht weiter, hilft „Schritt vormachen“. Es legt den Begriff an die richtige Stelle und erklärt, warum er dort hingehört.'
        : 'Kommst du nicht weiter, erscheint nach drei falschen Versuchen hintereinander oben rechts „Schritt vormachen“. Es legt den Begriff, bei dem du zuletzt danebenlagst, an die richtige Stelle und erklärt, warum er dort hingehört.')],
  ].map(([links, text]) => `
    <div class="hilfe-zeile">
      <div class="hilfe-knoepfe">${links}</div>
      <p>${text}</p>
    </div>`).join('');
}

export function render(container, config) {
  meldeUebung(container); // die lektion zählt erst als abgeschlossen, wenn alle begriffe sitzen
  meldeHilfe(container, { titel: 'Vervollständige die Übersetzungswege', html: hilfeHtml(config) });
  const terms = config.terms.map((t) => ({ ...t, group: t.group ?? t.id }));
  const erfolgstext = config.erfolgstext ?? 'Alle Begriffe erfolgreich zugeordnet';

  // ablage rechts: ist die folie zu niedrig, scrollt die begriffsliste in der ablage statt der ganzen folie (.dd-scroll)
  // die ablage unten bleibt davon unberührt
  if (config.ablage !== 'unten') {
    container.classList.add('dd-scroll');
    // die ablage soll nicht schrumpfen, wenn begriffe herauskommen: die liste reserviert platz für alle
    container.style.setProperty('--dd-anzahl', terms.length);
  }

  container.innerHTML = `
    <div class="dd-kopf">
      ${config.hinweis ? `<p class="dd-hint">${config.hinweis}</p>` : ''}
      <button type="button" class="lex-btn-reset cw-schritt-btn" hidden>Schritt vormachen</button>
    </div>
    <div class="dd-stage${config.ablage === 'unten' ? ' dd-unten' : ''}">
      <div class="dd-diagram-wrap">${config.svg}</div>
      <aside class="dd-tray">
        <h2>Begriffe</h2>
        <div class="dd-chip-list"></div>
        <p class="dd-erfolg" hidden>${erfolgstext}</p>
      </aside>
    </div>
    <div class="cw-leiste-anker cw-leiste-anker--links">
      <div class="cw-leiste dd-leiste" hidden>
        <div class="cw-leiste-text"></div>
        <button class="lex-btn-hinweis" type="button" hidden>Zeige Hinweis</button>
        <div class="lex-hinweis-text" hidden></div>
        <button class="msg-x" type="button" aria-label="Meldung schließen">×</button>
      </div>
    </div>
  `;

  const chipList = container.querySelector('.dd-chip-list');
  const schrittEl = container.querySelector('.cw-schritt-btn');
  const erfolgEl = container.querySelector('.dd-erfolg');
  const leiste = container.querySelector('.dd-leiste');
  const leisteText = container.querySelector('.cw-leiste-text');
  const hinweisBtn = leiste.querySelector('.lex-btn-hinweis');
  const hinweisEl = leiste.querySelector('.lex-hinweis-text');

  // rückmeldung als leiste unten links (art: 'ok' grün oder 'err' = orange), ohne art wird sie versteckt
  // hinweis (optional): überlegung, erst nach "zeige hinweis" sichtbar
  function setzeMeldung(art, titel, text, hinweis = null) {
    if (!art) { leiste.hidden = true; return; }
    leiste.hidden = false;
    leiste.className = 'cw-leiste dd-leiste ' + (art === 'ok' ? 'cw-ok' : 'cw-hinweis');
    leisteText.textContent = '';
    // fester titel in der ersten zeile neben dem symbol ("falsch" orange, "richtig" und "vorgemacht" grün)
    // der individuelle satz darunter ganz links
    const t = document.createElement('span');
    t.className = 'meldung-titel' + (art === 'ok' ? '' : ' meldung-titel--hinweis');
    t.textContent = titel;
    leisteText.append(t, text);
    hinweisBtn.hidden = !hinweis;
    hinweisEl.hidden = true;
    const h = document.createElement('strong');
    h.textContent = 'Hinweis:';
    hinweisEl.replaceChildren(h, ' ' + (hinweis ?? ''));
  }
  leiste.querySelector('.msg-x').addEventListener('click', () => { leiste.hidden = true; });
  hinweisBtn.addEventListener('click', () => {
    hinweisBtn.hidden = true;
    hinweisEl.hidden = false;
  });

  // der gerade laufende drag (falls einer läuft), damit die zurückgegebene funktion ihn beim verlassen der folie beenden kann, statt die document-listener hängen zu lassen
  let activeDrag = null;

  function checkDone() {
    if (!chipList.children.length) {
      erfolgEl.hidden = false;
      meldeGeloest(container);
    }
  }

  // welcher begriff in welchem feld steht, für die zeilen-paar-prüfung
  const belegt = new Map();

  // passt der begriff zur zeile des feldes? bei jedem schon abgelegten begriff mit "zeile" gilt: gleiche zeile im diagramm genau dann, wenn gleiche "zeile" am begriff
  function zeileStimmt(slot, term) {
    if (!term.zeile || !slot.dataset.zeile) return true;
    return [...belegt].every(([s, t]) => {
      if (!t.zeile || !s.dataset.zeile) return true;
      return (s.dataset.zeile === slot.dataset.zeile) === (t.zeile === term.zeile);
    });
  }

  const chipVon = new Map(); // begriff-id → chip in der ablage
  let falsch = 0;            // falsche ablagen hintereinander
  let zuletztFalsch = null;  // begriff der letzten falschen ablage: ihn legt "schritt vormachen" ab

  // "schritt vormachen" gibt es nur, solange noch begriffe in der ablage liegen und der spieler nicht weiterkommt
  function aktualisiereSchritt() {
    schrittEl.hidden = !chipList.children.length || !(config.schrittImmer || SCHRITT_IMMER || falsch >= FEHLER_BIS_SCHRITT);
  }

  // einen begriff richtig ins feld legen, das tut sowohl der spieler (onUp) als auch der knopf (vorgemacht)
  function platziere(slot, term, vorgemacht = false) {
    belegt.set(slot, term);
    fillSlot(slot, term);
    slot.classList.add('solved');
    chipVon.get(term.id).remove();
    falsch = 0;
    zuletztFalsch = null;
    setzeMeldung('ok', vorgemacht ? 'Vorgemacht' : 'Richtig', term.warum ?? '');
    checkDone(); // beim letzten begriff erscheint zusätzlich der erfolgstext in der ablage
    aktualisiereSchritt();
  }

  function attachDrag(chip, term) {
    chip.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      setzeMeldung(null); // der nächste begriff wird angefasst: die rückmeldung zum letzten hat ihren zweck erfüllt
      const rect = chip.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;

      const ghost = document.createElement('div');
      ghost.className = 'dd-chip-ghost' + (config.ablage === 'unten' ? ' dd-ghost-gleich' : '');
      ghost.innerHTML = chip.innerHTML;
      ghost.style.width = rect.width + 'px';
      document.body.appendChild(ghost);
      placeGhost(e.clientX, e.clientY);
      chip.classList.add('dragging');

      function placeGhost(x, y) {
        ghost.style.left = (x - offsetX) + 'px';
        ghost.style.top = (y - offsetY) + 'px';
      }
      // freies feld unter dem mauszeiger, oder null
      function slotAt(x, y) {
        const el = document.elementFromPoint(x, y);
        const slot = el ? el.closest('.dd-term-slot') : null;
        return slot && !slot.classList.contains('solved') ? slot : null;
      }
      // hebt das feld unter dem mauszeiger hervor, wie .robot-slot-active in den roboter-übungen
      // bewusst jedes freie feld, nicht nur das richtige, sonst würde das aufleuchten die lösung verraten
      function highlight(slot) {
        container.querySelectorAll('.dd-term-slot.active').forEach((s) => { if (s !== slot) s.classList.remove('active'); });
        if (slot) slot.classList.add('active');
      }
      function onMove(ev) {
        placeGhost(ev.clientX, ev.clientY);
        highlight(slotAt(ev.clientX, ev.clientY));
      }

      function endDrag() {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        document.removeEventListener('pointercancel', endDrag);
        ghost.remove();
        chip.classList.remove('dragging');
        highlight(null);
        activeDrag = null;
      }

      function onUp(ev) {
        endDrag();
        const slot = slotAt(ev.clientX, ev.clientY);
        if (!slot) return;

        const feldPasst = slot.dataset.target === term.group;
        if (feldPasst && zeileStimmt(slot, term)) {
          platziere(slot, term);
        } else {
          slot.classList.add('wrong');
          setTimeout(() => slot.classList.remove('wrong'), 250);
          // passt der begriff zum feld, nur nicht zur zeile, sagt die meldung das, sonst "passt nicht"
          const meldung = feldPasst
            ? (config.zeilenMeldung ?? ZEILE_STANDARD)
            : { text: PASST_NICHT, hinweis: term.hinweis ?? null };
          setzeMeldung('err', 'Falsch', meldung.text, meldung.hinweis);
          falsch += 1;
          zuletztFalsch = term;
          aktualisiereSchritt();
        }
      }

      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
      // bricht das system den touch-drag ab (z. b. systemgeste), wird wie bei einem loslassen außerhalb aufgeräumt: ghost weg, listener ab, nichts abgelegt
      document.addEventListener('pointercancel', endDrag);
      activeDrag = { endDrag };
    });
  }

  const shuffled = [...terms].sort(() => Math.random() - 0.5);
  shuffled.forEach((term) => {
    const chip = document.createElement('div');
    chip.className = 'dd-chip';
    chip.dataset.term = term.id;
    chip.innerHTML = `${term.icon ? `<svg viewBox="0 0 24 24"><use href="#${term.icon}" width="24" height="24"></use></svg>` : ''}<span>${term.label.replace('\n', ' ')}</span>`;
    chipList.appendChild(chip);
    chipVon.set(term.id, chip);
    attachDrag(chip, term);
  });
  aktualisiereSchritt(); // mit config.schrittImmer von anfang an sichtbar

  // der begriff der letzten falschen ablage kommt an ein freies, passendes feld (gleiche prüfung wie beim ablegen)
  // ohne falsche ablage (nur mit config.schrittImmer) ist es der erste begriff der ablage
  schrittEl.addEventListener('click', () => {
    if (activeDrag) activeDrag.endDrag();
    const erster = chipList.firstElementChild;
    const term = zuletztFalsch ?? (erster && terms.find((t) => t.id === erster.dataset.term));
    if (!term) return;
    const slot = [...container.querySelectorAll('.dd-term-slot:not(.solved)')]
      .find((s) => s.dataset.target === term.group && zeileStimmt(s, term));
    if (slot) platziere(slot, term, true);
  });

  return () => {
    if (activeDrag) activeDrag.endDrag();
  };
}

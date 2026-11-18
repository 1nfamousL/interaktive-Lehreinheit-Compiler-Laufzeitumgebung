// mindmap
//
// zeichnet einen begriffsbaum (data/mindmap.js) als mindmap in ein <svg>: wurzel in der mitte, begriffe werden nach außen spezifischer
// jeder begriff ist an oder aus, nur angeschaltete sind sichtbar, aber alle haben ihren platz von anfang an, dadurch springt beim anschalten nichts
// kennt weder fortschritt noch navigation, wann ein begriff an ist und was ein klick tut, entscheidet der aufrufer über die schnittstelle
// die farben stehen als --mindmap-*-rollen in css/01-grundlagen.css, die regeln in css/05-mindmap.css
// das <svg> muss bereits im dokument hängen und einen elternknoten mit fester größe haben, weil die karte sich auf dessen größe einpasst
//
// createMindMap(svgElement, BEGRIFFE, { onOpen, onChange, margin })
//   onOpen: term => {...}, klick auf einen begriff, z. b. die folie öffnen
//   onChange: () => {...}, wird aufgerufen, wenn sich ein schalter ändert
//   margin: optional, rand in px, den die karte im container frei lässt
//
// schnittstelle:
//   mm.terms: liste aller begriffe { key, label, slide, on, isNew } in baumreihenfolge
//   mm.unlock(key): schaltet den begriff an, true wenn er neu angeschaltet wurde, false wenn schon an oder schlüssel unbekannt
//   mm.set(key, bool): schaltet einen begriff an oder aus
//   mm.setOn(keys, newKeys): setzt den kompletten zustand, newKeys sind die begriffe, die als neu markiert werden sollen
//   mm.getOn(): schlüssel aller angeschalteten begriffe, zum speichern
//   mm.clearNew(key): nimmt die neu-markierung weg (ein klick macht das von selbst)
//   mm.ready: promise, erfüllt, sobald die karte gezeichnet ist (nach dem laden der schrift), zustandsänderungen davor werden gemerkt
//   mm.destroy(): räumt listener und zeichnung wieder auf

// ---- einstellungen ----

// die vier stufen der hierarchie, je nach tiefe im baum
//   l1: ebene 1 (hauptäste), gefüllte pille
//   l2: ebene 2, pille mit kontur
//   l3: ab ebene 3 mit unterbegriffen, text auf unterstreichung
//   lf: ab ebene 3 ohne unterbegriffe (blatt), nur text
// felder (px im viewBox-raster, nicht die bildschirmgröße): base = schriftgröße in ruhe, max = größte schriftgröße unter dem zeiger, wt = schriftgewicht, h = höhe im layout, px = innerer rand links und rechts
const LV = {
  l1: { base: 17, max: 20, wt: 600, h: 30, px: 13 },
  l2: { base: 15, max: 19, wt: 500, h: 26, px: 11 },
  l3: { base: 13, max: 18, wt: 500, h: 21, px: 1 },
  lf: { base: 12, max: 18, wt: 400, h: 20, px: 5 } };

const ROOTSZ = 20;    // schriftgröße der wurzel (wird nicht vergrößert)
const SIGMA = 26;     // breite der lupe in px, kleiner = engerer fokus, größer = mehr nachbarn wachsen mit

// abstände im layout (px im viewBox-raster)
const P = 19;            // zeilenhöhe eines blatts, daraus ergibt sich die gesamthöhe der karte
const SUBGAP = 7;        // zusätzlicher abstand zwischen geschwistern, sobald eines davon unterbegriffe hat
const BRANCHGAP = 26;    // abstand zwischen den zwei hauptästen derselben seite
const GAP = 28;          // waagerechter abstand zwischen einem begriff und seinen unterbegriffen
const SIDE_INNER = .25;  // abstand der ebene-1-pillen zur mitte (anteil der wurzelbreite)
const LINE_REL = .4;     // startpunkt der wurzellinien als anteil von SIDE_INNER, wandert mit

// dieselbe schrift wie die übrige app (body in css/02-basis.css), die breiten werden mit ihr gemessen, sie muss also der gerenderten entsprechen
const FONT = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const NS = 'http://www.w3.org/2000/svg';

// ---- hilfsfunktionen ----

// erzeugt ein svg-element mit attributen und hängt es optional an einen elternknoten
function el(name, attrs, parent) {
  const e = document.createElementNS(NS, name);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}

// ---- die komponente ----
export function createMindMap(svg, data, opts) {
  opts = opts || {};
  const margin = opts.margin == null ? 0 : opts.margin;
  // alle stile der karte hängen an dieser klasse (css/05-mindmap.css), damit nichts nach außen wirkt
  svg.classList.add('mindmap');
  // nach destroy() darf nichts spätes (schrift geladen, animationsbild) mehr in das svg schreiben
  let dead = false;

  // ---- begriffe aufbauen ----
  // aus den daten werden knoten mit elternverweis, tiefe und schalter (on, isNew)
  // all: alle knoten in baumreihenfolge, eltern vor kindern
  const root = { lines: data.title, c: [] };
  const all = [], byKey = new Map(), place = new Map();
  (function () {
    function make(t, par, depth) {
      if (byKey.has(t.key)) throw new Error('Doppelter Schlüssel: ' + t.key);
      const n = { key: t.key, l: t.label, slide: t.slide || null, c: [], par, depth, on: false, isNew: false };
      byKey.set(n.key, n); all.push(n);
      (t.children || []).forEach(k => n.c.push(make(k, n, depth + 1)));
      return n;
    }
    data.branches.forEach(b => {
      const n = make(b.term, root, 1);
      root.c.push(n);
      // place: auf welcher seite der wurzel (-1 links, 1 rechts) und in welcher reihenfolge von oben nach unten
      place.set(n, { dir: b.side === 'left' ? -1 : 1, o: b.order });
    });
  })();

  // die öffentliche liste, on und isNew sind lesezugriffe auf den echten zustand, so zeigt mm.terms immer den aktuellen stand
  const terms = all.map(n => ({
    key: n.key, label: n.l, slide: n.slide,
    get on() { return n.on; }, get isNew() { return n.isNew; } }));

  // ---- maße ----
  // breiten werden mit der echten schrift gemessen (canvas), die spalten hängen davon ab
  const ctx = document.createElement('canvas').getContext('2d');
  const measure = (font, t) => { ctx.font = font; return Math.ceil(ctx.measureText(t).width); };

  // legt stufe, breite und höhe eines begriffs fest
  function size(n) {
    n.kind = n.depth === 1 ? 'l1' : n.depth === 2 ? 'l2' : n.c.length ? 'l3' : 'lf';
    const lv = LV[n.kind];
    n.mw = measure(`${lv.wt} ${lv.base}px ${FONT}`, n.l);   // breite des texts
    n.w = n.mw + 2 * lv.px;                                  // breite inklusive rand
    n.h = lv.h;
    n.smax = lv.max / lv.base;                               // größter vergrößerungsfaktor
  }

  // ---- layout ----
  // einmal aus der vollständigen liste berechnet, nicht aus dem zustand: ausgeschaltete begriffe behalten ihren platz, anschalten verschiebt nichts

  // senkrechte position: jedes blatt belegt eine zeile, oberbegriffe stehen mittig über ihren unterbegriffen
  // cur: oberkante des nächsten freien platzes, rückgabe: unterkante des platzierten teilbaums
  function rows(n, cur) {
    if (!n.c.length) {
      // pillen als blatt (z. b. "Laufzeit") sind höher als eine textzeile und brauchen mehr platz
      const r = (n.kind === 'l1' || n.kind === 'l2') ? n.h + 4 : P;
      n.y = cur + r / 2; return cur + r;
    }
    let c = cur, prev = null;
    n.c.forEach(k => {
      // etwas luft, sobald eines von zwei benachbarten geschwistern selbst unterbegriffe hat
      if (prev && (prev.c.length || k.c.length)) c += SUBGAP;
      c = rows(k, c); prev = k;
    });
    n.y = (n.c[0].y + n.c[n.c.length - 1].y) / 2;   // mittig zwischen erstem und letztem kind
    return c;
  }

  // gesamtlayout: pro seite (links, rechts) werden die hauptäste untereinander gestapelt und senkrecht um die mitte zentriert, danach die waagerechten positionen vergeben
  function layout() {
    all.forEach(size);
    // die wurzel richtet sich nach ihrer breitesten titelzeile
    root.w = Math.max(...root.lines.map(t => measure(`700 ${ROOTSZ}px ${FONT}`, t))) + 40;
    root.h = 64; root.x0 = -root.w / 2; root.y = 0;
    [-1, 1].forEach(dir => {
      const tops = root.c.filter(n => place.get(n).dir === dir).sort((a, b) => place.get(a).o - place.get(b).o);
      let cur = 0;
      tops.forEach((t, i) => { if (i) cur += BRANCHGAP; cur = rows(t, cur); });
      // gesamthöhe dieser seite um y = 0 zentrieren und die seite an alle knoten schreiben
      const off = -cur / 2;
      tops.forEach(t => (function w(n) { n.y += off; n.dir = dir; n.c.forEach(w); })(t));
      // waagerecht: e = abstand der innenkante zur mitte, jede gruppe von geschwistern beginnt direkt hinter ihrem oberbegriff (e + breite + GAP)
      // so bleibt die karte schmal und die lage hängt nur vom inhalt ab, nie vom zustand
      const inner = root.w * SIDE_INNER;
      tops.forEach(t => (function put(n, e) {
        n.x0 = dir > 0 ? e : -e - n.w;     // x0 = linke kante des begriffs
        const out = e + n.w + GAP;
        n.c.forEach(k => put(k, out));
      })(t, inner));
    });
  }

  // geometrie-hilfen: "innen" ist die seite zur wurzel, "außen" die seite zu den unterbegriffen
  const innerX = n => n.dir > 0 ? n.x0 : n.x0 + n.w;
  const outerX = n => n.dir > 0 ? n.x0 + n.w : n.x0;
  const ulY = n => n.y + 8;                                // höhe der unterstreichung
  const dockY = n => n.kind === 'l3' ? ulY(n) : n.y;       // höhe, an der die linien ein- und auslaufen

  // ---- zeichnen ----
  // alle elemente werden einmal erzeugt und danach nur über klassen umgeschaltet (weiche übergänge, kein flackern)
  let VB = { x: 0, y: 0, w: 1, h: 1 }, built = false;
  const dom = new Map();   // knoten -> { g (gruppe), link, bridge }

  function build() {
    svg.innerHTML = ''; dom.clear();
    // zwei ebenen: erst alle linien, darüber alle begriffe
    const gLinks = el('g', {}, svg), gNodes = el('g', {}, svg);
    // während des zeichnens wird die ausdehnung mitgerechnet (für die viewBox)
    let x1 = root.x0, x2 = root.x0 + root.w, y1 = -root.h / 2, y2 = root.h / 2;

    all.forEach(n => {
      const d = {}, lv = LV[n.kind], p = n.par;

      // --- verbindungslinie vom oberbegriff zu diesem begriff ---
      // linienstärke nimmt mit der tiefe ab
      const sw = n.depth === 1 ? 3.5 : n.depth === 2 ? 2.2 : n.depth === 3 ? 1.5 : 1.1;
      let path;
      if (p === root) {
        // die linien an der wurzel starten an der ober- bzw. unterkante, symmetrisch links und rechts der mitte, erst senkrecht, dann waagerecht in die pille
        const up = n.y < 0, sx = n.dir * root.w * SIDE_INNER * LINE_REL, sy = up ? -root.h / 2 : root.h / 2;
        const bx = innerX(n), by = n.y, k = Math.abs(bx - sx) * .5;
        path = `M${sx},${sy} C${sx},${by} ${bx - n.dir * k},${by} ${bx},${by}`;
      } else {
        // sonst: sanfte s-kurve von der außenkante des oberbegriffs zur innenkante des kindes
        const ax = outerX(p), ay = dockY(p), bx = innerX(n), by = dockY(n), mx = (ax + bx) / 2;
        path = `M${ax},${ay} C${mx},${ay} ${mx},${by} ${bx},${by}`;
      }
      d.link = el('path', { class: 'lk', 'stroke-width': sw, d: path }, gLinks);

      // --- brücke ---
      // ist ein oberbegriff aus, aber ein nachkomme an, läuft die linie als gerader strich durch den leeren platz weiter (nur sichtbar, solange der begriff aus ist)
      if (n.c.length) {
        const dy = dockY(n);
        d.bridge = el('path', { class: 'lk', 'stroke-width': sw, d: `M${innerX(n)},${dy} L${outerX(n)},${dy}` }, gLinks);
      }

      // --- der begriff selbst ---
      const g = el('g', { class: `n ${n.kind}` }, gNodes);
      d.g = g;
      const top = n.y - n.h / 2, left = n.x0, right = n.x0 + n.w;
      const pill = n.kind === 'l1' || n.kind === 'l2';
      if (pill) el('rect', { class: 'bg', x: left, y: top, width: n.w, height: n.h, rx: n.h / 2 }, g);
      else {
        // ebene 3 trägt immer eine unterstreichung, blätter nur beim fokus (per css eingeblendet)
        const uy = n.kind === 'l3' ? ulY(n) : n.y + 8;
        el('line', { class: 'ul', x1: left, y1: uy, x2: right, y2: uy }, g);
      }
      // text: pillen zentriert, sonst an der innenkante ausgerichtet (links der wurzel rechtsbündig, rechts linksbündig), so wirkt der ast wie aus der wurzel gewachsen
      let tx, anchor;
      if (pill) { tx = left + n.w / 2; anchor = 'middle'; }
      else { tx = n.dir > 0 ? left + lv.px : right - lv.px; anchor = n.dir > 0 ? 'start' : 'end'; }
      // "halo" legt einen rand in hintergrundfarbe um die schrift, damit linien dahinter nicht stören
      const t1 = el('text', { class: 'main' + (pill ? '' : ' halo'), x: tx, y: n.y, 'text-anchor': anchor,
        'font-size': lv.base, 'font-weight': lv.wt, 'font-family': FONT }, g);
      t1.textContent = n.l;

      // neu-punkt: bei pillen an der oberen außenecke, sonst auf höhe der textmitte hinter dem begriff
      if (pill) el('circle', { class: 'dot', cx: n.dir > 0 ? right + 2 : left - 2, cy: top + 1, r: 3.5 }, g);
      else el('circle', { class: 'dot', cx: n.dir > 0 ? right + 7 : left - 7, cy: n.y, r: 3 }, g);
      dom.set(n, d);

      // ausdehnung mitrechnen, inklusive platz für das wachsen unter der lupe nach außen
      const extra = n.w * (n.smax - 1);
      if (n.dir > 0) x2 = Math.max(x2, right + extra + 6); else x1 = Math.min(x1, left - extra - 6);
      y1 = Math.min(y1, top - n.h * (n.smax - 1) / 2 - 4);
      y2 = Math.max(y2, top + n.h + n.h * (n.smax - 1) / 2 + 4);
    });

    // wurzel zuletzt, damit sie über den linien liegt
    const gr = el('g', {}, gNodes);
    el('rect', { class: 'rootbg', x: root.x0, y: -root.h / 2, width: root.w, height: root.h, rx: 18 }, gr);
    root.lines.forEach((s, i) => {
      const t = el('text', { class: 'roottxt', x: 0, y: (i - .5) * 24, 'text-anchor': 'middle',
        'font-size': ROOTSZ, 'font-weight': 700, 'font-family': FONT }, gr);
      t.textContent = s;
    });

    // zeichenfläche: genau die berechnete ausdehnung plus rand (pad: platz für neu-punkte, schriftrand und die vergrößerung am rand durch die lupe), ausgelegt für den endzustand, ändert sich beim anschalten nicht
    const pad = 8;
    VB = { x: x1 - pad, y: y1 - pad, w: x2 - x1 + 2 * pad, h: y2 - y1 + 2 * pad };
    svg.setAttribute('viewBox', `${VB.x} ${VB.y} ${VB.w} ${VB.h}`);
    fit();
  }

  // skaliert die karte auf den verfügbaren platz im umgebenden element, faktor 1 = pixelgrößen aus LV
  // sie wächst ohne obergrenze, bis sie in breite oder höhe an den rand kommt, nach unten gilt 0,6, darunter scrollt der container (.mindmap-host in css/05-mindmap.css)
  // zoom: vergrößerung per zwei-finger-geste (touch), 1 = eingepasst, der container scrollt, sobald die karte größer wird als er
  const ZOOM_MAX = 3;
  let sc = 1, zoom = 1;
  function fit() {
    const host = svg.parentElement;
    // offsetWidth/-Height statt clientWidth/-Height: bleiben gleich, wenn scrollbalken erscheinen
    const W = host ? host.offsetWidth : innerWidth, H = host ? host.offsetHeight : innerHeight;
    sc = Math.max(.6, Math.min((W - margin) / VB.w, (H - margin) / VB.h)) * zoom;
    svg.setAttribute('width', VB.w * sc); svg.setAttribute('height', VB.h * sc);
  }

  // ---- zustand anzeigen ----
  // F: begriff im fokus (unter dem zeiger), hot: gerade anklickbarer begriff, mouse: zeigerposition im viewBox-raster, lastF: zuletzt gemalter fokus, damit paint() nur bei änderung läuft
  let F = null, hot = null, mouse = null, lastF = undefined;

  // setzt nur css-klassen, die optik (farben, dimmen, übergänge) steckt im css
  function paint() {
    // hervorgehoben wird der pfad vom begriff im fokus zur wurzel
    const path = new Set(), kids = new Set(), reach = new Set();
    for (let x = F; x && x !== root; x = x.par) path.add(x);
    // beim fokus bleiben auch die direkten unterbegriffe hell (nur die angeschalteten)
    if (F) F.c.forEach(c => { if (c.on) kids.add(c); });
    // reach: alle begriffe, die selbst oder durch einen nachkommen an sind, nur für sie wird die linie gezeichnet
    all.forEach(n => { if (n.on) for (let x = n; x && x !== root; x = x.par) reach.add(x); });
    all.forEach(n => {
      const d = dom.get(n), vis = n.on, cl = d.g.classList;
      // hi: gehört zur hervorhebung, ohne fokus ist alles hell, mit fokus wird der rest gedimmt
      const hi = !F || path.has(n) || kids.has(n);
      cl.toggle('vis', vis);                          // sichtbar
      cl.toggle('dim', vis && !hi);                   // gedimmt
      cl.toggle('path', path.has(n) && n !== F);      // vorfahre des fokus
      cl.toggle('hov', n === F);                      // der fokus selbst
      cl.toggle('kid', kids.has(n));                  // direkter unterbegriff des fokus
      cl.toggle('isnew', n.isNew);                    // neu-punkt
      const lv = reach.has(n), on = path.has(n) || kids.has(n);
      d.link.classList.toggle('vis', lv);
      d.link.classList.toggle('dim', lv && !hi);
      d.link.classList.toggle('on', on);              // linie hell, wenn sie zur hervorhebung gehört
      if (d.bridge) {
        // die brücke zeigt sich nur, wenn der begriff selbst aus ist, aber die linie durchlaufen soll
        d.bridge.classList.toggle('vis', lv && !vis);
        d.bridge.classList.toggle('dim', lv && !vis && !hi);
        d.bridge.classList.toggle('on', on);
      }
    });
  }

  // ---- lupe ----
  // größe fällt glockenförmig (gauß) mit dem abstand zum zeiger, es wird nur skaliert, nie verschoben
  // anker: pillen wachsen zu beiden seiten, alle anderen von der innenkante nach außen, damit sie nicht in die linie zur wurzel wachsen
  function frame() {
    if (!built || dead) return;
    let best = null, bd = 1e9, hd = 1e9;   // best: nächster begriff (fokus), hd: abstand des anklickbaren
    hot = null;
    all.forEach(n => {
      const d = dom.get(n);
      let g = 0, dist = 1e9;               // g: stärke der lupe 0..1, dist: abstand zum zeiger
      if (mouse && n.on) {
        // abstand zum begriffsrahmen: waagerecht 0, solange der zeiger über dem begriff steht
        const dx = Math.max(n.x0 - mouse.x, 0, mouse.x - (n.x0 + n.w)), dy = Math.abs(mouse.y - n.y);
        dist = Math.hypot(dx, dy);
        g = Math.exp(-dist * dist / (2 * SIGMA * SIGMA));
        if (dist < bd) { bd = dist; best = n; }
      }
      n.s = 1 + (n.smax - 1) * g;          // vergrößerungsfaktor dieses begriffs
      const pl = n.kind === 'l1' || n.kind === 'l2';
      const ax = pl ? n.x0 + n.w / 2 : innerX(n), ay = n.y;   // ankerpunkt der skalierung
      d.g.style.transform = `translate(${ax}px,${ay}px) scale(${n.s.toFixed(3)}) translate(${-ax}px,${-ay}px)`;
      // klickziel: nur, wenn der zeiger im vergrößerten rahmen liegt (exakter treffer), liegen mehrere rahmen übereinander, gewinnt der mit dem kleinsten abstand
      if (mouse && n.on) {
        const w = n.w * n.s, x0 = pl ? n.x0 + n.w / 2 - w / 2 : (n.dir > 0 ? n.x0 : n.x0 + n.w - w);
        if (mouse.x >= x0 - 3 && mouse.x <= x0 + w + 3 && Math.abs(mouse.y - n.y) <= n.h * n.s / 2 + 1 && dist < hd) { hd = dist; hot = n; }
      }
    });
    // fokus: nächster begriff, aber nur innerhalb von etwa einer zeile abstand
    F = bd <= 26 ? best : null;
    if (F !== lastF) { lastF = F; paint(); }
    svg.style.cursor = hot ? 'pointer' : 'default';
  }
  // nach einer zustandsänderung alles neu berechnen und malen
  const refresh = () => { lastF = undefined; frame(); };
  const changed = () => { refresh(); if (opts.onChange) opts.onChange(); };

  // ---- zeigergeräte ----
  let raf = 0;
  // zeigerposition vom bildschirm in das koordinatensystem der karte umrechnen
  const punkt = e => {
    const r = svg.getBoundingClientRect();
    return { x: VB.x + (e.clientX - r.left) * VB.w / r.width, y: VB.y + (e.clientY - r.top) * VB.h / r.height };
  };
  // die lupe gibt es nur für maus und stift, mit pointermove statt mousemove, weil ein finger sonst nach dem antippen ein emuliertes mousemove auslöst und die lupe anspringt
  const onMove = e => {
    if (e.pointerType === 'touch') return;
    mouse = punkt(e);
    // höchstens ein durchlauf pro bild, auch wenn die maus öfter meldet
    if (!raf) raf = requestAnimationFrame(() => { raf = 0; frame(); });
  };
  const onLeave = e => {                              // zeiger verlässt die karte: alles zurück auf ruhegröße
    if (e.pointerType === 'touch') return;
    mouse = null; frame();
  };
  const open = n => {
    n.isNew = false; refresh();                       // angeklickt heißt gesehen: neu-punkt weg
    if (opts.onOpen) opts.onOpen(terms[all.indexOf(n)]);
  };
  const onClick = () => {
    if (moved) return;                                // ende einer wisch- oder zoomgeste, kein antippen
    if (!hot) return;
    open(hot);
  };
  // antippen mit dem finger: den begriff an der stelle suchen (die lupe wird kurz gerechnet, aber im selben schritt zurückgesetzt, es wird nichts gezeichnet) und öffnen
  function tippe(e) {
    mouse = punkt(e); frame();
    const n = hot;
    mouse = null; frame();
    if (n) open(n);
  }
  svg.addEventListener('pointermove', onMove);
  svg.addEventListener('pointerleave', onLeave);
  svg.addEventListener('click', onClick);

  // touch: zwei finger zoomen die karte, ein finger verschiebt sie, das svg hat touch-action: none (css/05-mindmap.css), der browser scrollt oder zoomt also nicht selbst
  // maus und stift sind nicht betroffen
  const touches = new Map();   // pointerId -> { x, y } in bildschirmpixeln
  let pinch = null, pan = null, moved = false, movedTimer = 0;
  // zoom auf z setzen, der punkt (cx, cy) unter den fingern bleibt dabei an seiner stelle
  function setZoom(z, cx, cy) {
    const host = svg.parentElement;
    const r1 = svg.getBoundingClientRect();
    const px = cx - r1.left, py = cy - r1.top, k = z / zoom;
    zoom = z; fit();
    const r2 = svg.getBoundingClientRect();
    host.scrollLeft += r2.left + px * k - cx;
    host.scrollTop += r2.top + py * k - cy;
  }
  // bei jedem wechsel der fingerzahl neu ansetzen (zwei finger: zoom, einer: verschieben)
  function startGeste() {
    const host = svg.parentElement, pts = [...touches.values()];
    if (pts.length === 2) {
      moved = true; pan = null;
      pinch = { d: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1, z: zoom };
    } else if (pts.length === 1) {
      pinch = null;
      pan = { x: pts[0].x, y: pts[0].y, sl: host.scrollLeft, st: host.scrollTop };
    } else { pinch = null; pan = null; }
  }
  const onPointerDown = e => {
    if (e.pointerType !== 'touch') return;
    if (!touches.size) { moved = false; clearTimeout(movedTimer); }
    touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { svg.setPointerCapture(e.pointerId); } catch (err) { /* finger schon weg */ }
    startGeste();
  };
  const onPointerMove = e => {
    if (e.pointerType !== 'touch' || !touches.has(e.pointerId)) return;
    touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const host = svg.parentElement, pts = [...touches.values()];
    if (pinch && pts.length === 2) {
      const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const z = Math.min(ZOOM_MAX, Math.max(1, pinch.z * d / pinch.d));
      setZoom(z, (pts[0].x + pts[1].x) / 2, (pts[0].y + pts[1].y) / 2);
    } else if (pan && pts.length === 1) {
      const dx = pts[0].x - pan.x, dy = pts[0].y - pan.y;
      if (!moved && Math.hypot(dx, dy) > 8) moved = true;   // erst ab einer kleinen strecke: wischen
      if (moved) { host.scrollLeft = pan.sl - dx; host.scrollTop = pan.st - dy; }
    }
  };
  const onPointerEnd = e => {
    if (!touches.has(e.pointerId)) return;
    // antippen: ein finger, nicht gewischt oder gezoomt, losgelassen (nicht abgebrochen)
    const tap = e.type === 'pointerup' && touches.size === 1 && !moved;
    touches.delete(e.pointerId);
    startGeste();
    if (tap) tippe(e);
    // das click nach dem loslassen kommt gleich danach: erst dann gilt wieder jedes antippen
    if (!touches.size) { clearTimeout(movedTimer); movedTimer = setTimeout(() => { moved = false; }, 50); }
  };
  svg.addEventListener('pointerdown', onPointerDown);
  svg.addEventListener('pointermove', onPointerMove);
  svg.addEventListener('pointerup', onPointerEnd);
  svg.addEventListener('pointercancel', onPointerEnd);
  // größenänderung des containers verfolgen (ResizeObserver, sonst fenstergröße)
  const onResize = () => { if (built && !dead) fit(); };
  const ro = typeof ResizeObserver !== 'undefined' && svg.parentElement ? new ResizeObserver(onResize) : null;
  if (ro) ro.observe(svg.parentElement); else window.addEventListener('resize', onResize);

  // ---- schnittstelle ----
  const api = {
    terms,
    // einschalten, ein begriff, der schon an ist, bleibt unberührt (kein neu-punkt, kein onChange)
    unlock(key) {
      const n = byKey.get(key);
      if (!n || n.on) return false;
      n.on = true; n.isNew = true; changed(); return true;
    },
    // an- oder ausschalten, wer eingeschaltet wird, gilt als neu
    set(key, on) {
      const n = byKey.get(key);
      if (!n || n.on === !!on) return;
      n.on = !!on; n.isNew = !!on; changed();
    },
    // kompletter zustand auf einmal (z. b. gespeicherter stand), alles, was nicht in keys steht, wird aus
    setOn(keys, newKeys) {
      const s = new Set(keys), ns = new Set(newKeys || []);
      all.forEach(n => { n.on = s.has(n.key); n.isNew = n.on && ns.has(n.key); });
      changed();
    },
    getOn() { return all.filter(n => n.on).map(n => n.key); },
    clearNew(key) { const n = byKey.get(key); if (n) { n.isNew = false; refresh(); } },
    destroy() {
      dead = true;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      svg.removeEventListener('pointermove', onMove);
      svg.removeEventListener('pointerleave', onLeave);
      svg.removeEventListener('click', onClick);
      svg.removeEventListener('pointerdown', onPointerDown);
      svg.removeEventListener('pointermove', onPointerMove);
      svg.removeEventListener('pointerup', onPointerEnd);
      svg.removeEventListener('pointercancel', onPointerEnd);
      clearTimeout(movedTimer);
      if (ro) ro.disconnect(); else window.removeEventListener('resize', onResize);
      svg.innerHTML = ''; svg.classList.remove('mindmap');
    } };

  // start: schrift abwarten, weil die breiten aus der gemessenen schrift berechnet werden, nach destroy() wird nichts mehr gebaut
  api.ready = (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
    if (dead) return;
    layout(); build(); built = true; refresh();
  });
  return api;
}

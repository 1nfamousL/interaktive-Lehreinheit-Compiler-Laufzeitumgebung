// statische abbildung eines syntaxbaums für lektionstexte
// gleiches aussehen wie der baum der syntaxübung: sprachkonstrukte als kapseln, tokens als kästchen in der farbe ihrer art, dazwischen linien
// klassen (.pb-*) kommen aus css/16-syntax.css

// ---- AUFRUF ----
// zeigeBaum(container, wurzel, optionen)
// die zurückgegebene funktion als cleanup der folie zurückgeben (ein resizeobserver läuft)

// ---- KNOTEN ----
// { nt: 'Bewegung', kinder: [ … ] }   sprachkonstrukt (nichtterminal) mit kindern
// { t: 'moveUp', art: 'keyword' }     token als blatt
//   art wie die lexik-werkzeuge: keyword | identifier | literal | operator | separator
//   oder 'ende' für das programmende (ohne farbe)
// bezeichner und literal zeigen ihre tokenklasse als kleine beschriftung über dem wert

// ---- OPTION ast ----
// { ast: true }: abstrakter syntaxbaum wie in der semantikübung
// alle knoten zeigen nur ihren text (nt oder t, wie im quellcode, ohne großschreibung)
// knoten mit kindern als kapsel, blätter als kästchen ohne farbe der lexik

// beschriftung über dem wert bei bezeichner und literal
const KLASSE_NAME = { identifier: 'BEZEICHNER', literal: 'LITERAL' };

// element mit klasse und text
function el(tag, klasse, text) {
  const e = document.createElement(tag);
  if (klasse) e.className = klasse;
  if (text !== undefined) e.textContent = text;
  return e;
}

// knoten samt kindern, paare sammelt (eltern-kasten, kind-kasten) für die linien
function baue(knoten, paare, ast) {
  const wrap = el('div', 'pb-n');
  let kasten;
  if (ast) {
    const hatKinder = knoten.kinder && knoten.kinder.length;
    kasten = el('div', 'pb-box sem-knoten ' + (hatKinder ? 'pb-nt' : 'pb-term'));
    kasten.appendChild(el('span', '', knoten.nt ?? knoten.t));
  } else if (knoten.nt) {
    kasten = el('div', 'pb-box pb-nt');
    kasten.appendChild(el('span', '', knoten.nt));
  } else {
    // art 'ende' = programmende, kein lexik-token, ohne farbe (.pb-ende)
    kasten = el('div', 'pb-box pb-term ' + (knoten.art === 'ende' ? 'pb-ende' : 'pb-cat-' + knoten.art));
    if (KLASSE_NAME[knoten.art]) {
      kasten.appendChild(el('span', 'pb-klasse', KLASSE_NAME[knoten.art]));
      kasten.appendChild(el('span', 'pb-wert', knoten.t));
    } else {
      kasten.textContent = knoten.t;
    }
  }
  wrap.appendChild(kasten);
  if (knoten.kinder && knoten.kinder.length) {
    const kinder = el('div', 'pb-kids');
    knoten.kinder.forEach((k) => {
      const kind = baue(k, paare, ast);
      kinder.appendChild(kind.wrap);
      paare.push([kasten, kind.kasten]);
    });
    wrap.appendChild(kinder);
  }
  return { wrap, kasten };
}

export function zeigeBaum(container, wurzel, optionen = {}) {
  const ast = !!optionen.ast;
  const paare = [];
  const canvas = el('section', 'pb-canvas pb-abbildung');
  canvas.setAttribute('aria-label', ast ? 'Beispiel eines abstrakten Syntaxbaums' : 'Beispiel eines Syntaxbaums');
  const scroll = el('div', 'pb-tree-scroll');
  const tree = el('div', 'pb-tree');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'pb-wires');
  svg.setAttribute('aria-hidden', 'true');
  tree.appendChild(svg);
  tree.appendChild(baue(wurzel, paare, ast).wrap);
  scroll.appendChild(tree);
  canvas.appendChild(scroll);
  container.textContent = '';
  container.appendChild(canvas);

  // linien von der unterkante des elternknotens zur oberkante des kindes
  // erst nach dem layout, weil die positionen der knoten bekannt sein müssen
  // neu gezeichnet bei größenänderung (resizeobserver) und einmal nach dem ersten layout (animationframe)
  function zeichneLinien() {
    const tr = tree.getBoundingClientRect();
    const punkt = (e, unten) => {
      const r = e.getBoundingClientRect();
      return { x: r.left - tr.left + r.width / 2, y: (unten ? r.bottom : r.top) - tr.top };
    };
    svg.innerHTML = paare.map(([eltern, kind]) => {
      const p = punkt(eltern, true);
      const q = punkt(kind, false);
      const mitte = (p.y + q.y) / 2;
      return `<path d="M${p.x} ${p.y} C${p.x} ${mitte} ${q.x} ${mitte} ${q.x} ${q.y}"/>`;
    }).join('');
  }

  const beobachter = new ResizeObserver(zeichneLinien);
  beobachter.observe(tree);
  const rafId = requestAnimationFrame(zeichneLinien);

  return () => {
    cancelAnimationFrame(rafId);
    beobachter.disconnect();
  };
}

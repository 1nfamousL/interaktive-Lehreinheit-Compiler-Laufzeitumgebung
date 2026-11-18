// phase lexikalische analyse
//
// config: code (pflicht), werkzeuge (ids, ohne angabe alle), schluesselwoerter, literalwoerter (optional),
//   hinweisKategorien (optional, satz am hinweis zur falschen kategorie), beiFalsch/beiRichtig (optional),
//   beiEnde({ tokens }) (optional, tokens = { text, type }, bei fehler bis zum fehlertoken),
//   schrittBereit(fn) (optional, fn erledigt einen schritt für den spieler)

// farben stehen als css-variablen auf .lex-stage (css/15-lexik.css)
const TOOLS = [
  { id: 'identifier', label: 'Bezeichner', color: 'var(--c-identifier)' },
  { id: 'keyword', label: 'Schlüsselwort', color: 'var(--c-keyword)' },
  { id: 'literal', label: 'Literal', color: 'var(--c-literal)' },
  { id: 'operator', label: 'Operatoren', color: 'var(--c-operator)' },
  { id: 'separator', label: 'Gliederungszeichen', color: 'var(--c-separator)' },
  { id: 'error', label: 'Lexikalische Fehler', color: 'var(--c-error)' },
];

// radiergummi: entfernt eine farbe wieder, z. b. wenn ein noch offenes token zu früh gefärbt wurde
// steht immer als letztes werkzeug da
const RADIERER = { id: 'radierer', label: 'Farbe entfernen', color: 'var(--text-dim)' };

const TWO_CHAR_OPS = ['==', '!=', '<=', '>='];

// musterlösung: längstes passendes token, schlüsselwort vor literalwort vor bezeichner
// alles unbekannte (auch ein einzelnes „!“) ist ein fehler, leerraum wird übersprungen
function tokenize(src, keywords, literalWords) {
  const isStart = (c) => /[A-Za-z]/.test(c);
  const isPart = (c) => /[A-Za-z0-9]/.test(c);
  const isDigit = (c) => /[0-9]/.test(c);
  const tokens = [];
  const n = src.length;
  let i = 0;
  while (i < n) {
    const c = src[i];
    let j = i + 1;
    let type;
    if (/\s/.test(c)) { i = j; continue; }
    if (isStart(c)) {
      while (j < n && isPart(src[j])) j++;
      const word = src.slice(i, j);
      type = keywords.has(word) ? 'keyword' : literalWords.has(word) ? 'literal' : 'identifier';
    } else if (isDigit(c)) {
      while (j < n && isDigit(src[j])) j++;
      type = 'literal';
    } else if ('();.{}'.includes(c)) {
      type = 'separator';
    } else if (TWO_CHAR_OPS.includes(src.substr(i, 2))) {
      j = i + 2;
      type = 'operator';
    } else if ('=+-*/<>'.includes(c)) {
      type = 'operator';
    } else {
      type = 'error';
    }
    tokens.push({ start: i, end: j, type });
    i = j;
  }
  return tokens;
}

export function render(container, config) {
  const code = config.code;
  const erfolgstext = 'Alle Tokens richtig klassifiziert. Der Quellcode ist lexikalisch einwandfrei.';
  const tools = config.werkzeuge
    ? TOOLS.filter((t) => config.werkzeuge.includes(t.id))
    : TOOLS;
  const tokens = tokenize(code, new Set(config.schluesselwoerter ?? []), new Set(config.literalwoerter ?? []));

  const marks = new Array(code.length).fill(null);
  let pos = 0;          // anzahl bisher gelesener (sichtbarer) zeichen; code[pos] steht in der vorschau
  let tool = tools[0].id;
  let drag = null;      // { start, cur } während des färbens
  let msg = null;       // { text, hinweis, kind } oder null
  let hinweisOffen = false;
  let gelöst = false;
  let abgebrochen = false; // phase beim ersten lexikalischen fehler beendet (der rest bleibt ungelesen)

  container.innerHTML = `
    <div class="lex-stage">
      <div class="lex-main">
        <div class="lex-codebox">
          <div class="lex-code"></div>
          <div class="lex-result" hidden>
            <button class="msg-x" type="button" aria-label="Meldung schließen">×</button>
            <div class="lex-msg-text"></div>
            <button class="lex-btn-hinweis" hidden>Zeige Hinweis</button>
            <div class="lex-hinweis-text" hidden></div>
          </div>
        </div>
      </div>
      <aside class="lex-sidebar">
        <h2>Vorschau</h2>
        <div class="lex-peek">
          <div class="lex-peek-box"></div>
          <button class="lex-btn-check lex-btn-next"></button>
        </div>
        <h2>Werkzeuge</h2>
        <div class="lex-tools"></div>
      </aside>
    </div>
  `;
  const codeEl = container.querySelector('.lex-code');
  const resultEl = container.querySelector('.lex-result');
  const msgEl = container.querySelector('.lex-msg-text');
  const hinweisBtn = container.querySelector('.lex-btn-hinweis');
  const hinweisEl = container.querySelector('.lex-hinweis-text');
  const toolsEl = container.querySelector('.lex-tools');
  const peekBoxEl = container.querySelector('.lex-peek-box');
  const nextBtn = container.querySelector('.lex-btn-next');
  let chars = [];

  // ---- Werkzeugleiste ----
  // falsche farben lassen sich mit dem richtigen werkzeug übermalen, zu früh gesetzte nimmt der radiergummi weg
  const toolButtons = [...tools, RADIERER].map((t) => {
    const b = document.createElement('button');
    b.className = 'lex-tool';
    b.style.setProperty('--tool-color', t.color);
    b.innerHTML = `<span class="lex-swatch${t === RADIERER ? ' lex-swatch-radierer' : ''}" style="background:${t.color}"></span><span>${t.label}</span>`;
    b.onclick = () => selectTool(t.id);
    b.dataset.tool = t.id;
    toolsEl.appendChild(b);
    return b;
  });
  function selectTool(id) {
    tool = id;
    toolButtons.forEach((b) => b.classList.toggle('active', b.dataset.tool === id));
  }
  selectTool(tool);

  // ---- Sichtbarer Text ----
  // ein <span> pro gelesenem zeichen, damit sich jedes einzeln einfärben lässt
  // noch nicht gelesene zeichen gibt es im dom nicht
  function baueZeichen() {
    codeEl.textContent = '';
    chars = [];
    for (let i = 0; i < pos; i++) {
      const s = document.createElement('span');
      s.className = 'lex-ch';
      s.dataset.i = i;
      // leerzeichen als gedimmter mittelpunkt, sonst sieht man nicht, dass schon ein zeichen da ist (der text selbst bleibt unverändert)
      if (code[i] === ' ') {
        s.textContent = '·';
        s.classList.add('lex-leer');
      } else if (code[i] === '\n') {
        s.textContent = '⏎\n';
        s.classList.add('lex-leer');
      } else {
        s.textContent = code[i];
      }
      codeEl.appendChild(s);
      chars.push(s);
    }
    renderMarks();
    zeichneVorschau();
  }

  // vorschau: das nächste zeichen, das der scanner noch nicht gelesen hat
  // leerzeichen und zeilenumbruch als symbol (· und ⏎ wie im textfeld), am textende leer
  function zeichneVorschau() {
    const ende = abgebrochen || pos >= code.length;
    const zeile = !ende && code[pos] === '\n';
    const leer = !ende && code[pos] === ' ';
    peekBoxEl.textContent = ende ? '' : zeile ? '⏎' : leer ? '·' : code[pos];
    peekBoxEl.classList.toggle('lex-peek-leer', ende || leer || zeile);
  }

  // farben neu zeichnen, zusammenhängende gleiche farben bekommen nur außen runde ecken
  // setzt dabei auch die unterstreichungen (hinweisfarbe) einer früheren prüfung zurück
  function renderMarks() {
    chars.forEach((el, i) => {
      const m = marks[i];
      el.className = /\s/.test(code[i]) ? 'lex-ch lex-leer' : 'lex-ch';
      if (!m) return;
      el.classList.add('lex-mark-' + m);
      if (marks[i - 1] !== m) el.classList.add('round-l');
      if (marks[i + 1] !== m) el.classList.add('round-r');
    });
  }

  // ---- Färben per Ziehen ----
  // zeichen unter dem zeiger über elementFromPoint statt pointerover, so geht es auch mit touch
  function charIndexAt(x, y) {
    const el = document.elementFromPoint(x, y);
    const ch = el && el.closest('.lex-ch');
    return ch && codeEl.contains(ch) ? +ch.dataset.i : null;
  }
  function range() {
    return [Math.min(drag.start, drag.cur), Math.max(drag.start, drag.cur)];
  }
  function showSelection() {
    const [a, b] = drag ? range() : [-1, -2];
    chars.forEach((el, i) => el.classList.toggle('lex-sel', i >= a && i <= b));
  }
  function onMove(e) {
    const i = charIndexAt(e.clientX, e.clientY);
    if (i !== null && i !== drag.cur) { drag.cur = i; showSelection(); }
  }
  function onUp() {
    const [a, b] = range();
    for (let i = a; i <= b; i++) {
      if (/\s/.test(code[i])) continue;
      marks[i] = tool === RADIERER.id ? null : tool;
    }
    stopDrag();
    setMsg(null); // eine frühere meldung ist durch das färben überholt
    renderMarks();
    zeichneMeldung();
  }
  function stopDrag() {
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    drag = null;
    showSelection();
  }
  codeEl.addEventListener('pointerdown', (e) => {
    if (gelöst) return;
    const ch = e.target.closest('.lex-ch');
    if (!ch) return;
    e.preventDefault();
    drag = { start: +ch.dataset.i, cur: +ch.dataset.i };
    showSelection();
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  });

  // ---- Prüfung ----
  // fertig = alle zeichen des tokens sind gelesen, dass es nicht länger wird, zeigt die vorschau
  // (folgezeichen passt nicht mehr, oder textende)
  // einzelzeichen-tokens (gliederungszeichen, operatoren, fehler) wachsen nie
  const einzeln = (t) => t.type === 'separator' || t.type === 'operator' || t.type === 'error';
  function istFertig(t) {
    return pos >= t.end;
  }

  // meldung beim ersten lexikalischen fehler (leerzeichen und zeilenumbruch sind nie ein fehler)
  function fehlerText(t) {
    return `Lexikalischer Fehler gefunden: Das Zeichen „${code.slice(t.start, t.end)}“ gehört zu keinem Token. Der Scanner liest nicht weiter.`;
  }

  // name eines zeichens für meldungen (leerzeichen sind sonst unsichtbar)
  const zeichenName = (c) => (c === ' ' ? 'Leerzeichen' : c === '\n' ? 'Zeilenumbruch' : `„${c}“`);

  function hinweisZuFertig(t) {
    if (einzeln(t)) {
      return 'Dieses Zeichen wird nie länger. Deshalb ist das Token sofort fertig.';
    }
    if (t.end >= code.length) {
      return 'Der Text ist zu Ende. Es kommt kein Zeichen mehr, das das Token verlängern könnte.';
    }
    return `Das nächste Zeichen (${zeichenName(code[t.end])}) passt nicht mehr zum bisherigen Token. Deshalb ist es fertig.`;
  }

  function pruefe() {
    renderMarks();
    let erstes = null;
    tokens.forEach((t) => {
      if (t.start >= pos) return;
      const bis = Math.min(t.end, pos);
      // A: fertig, aber ungefärbt; B: fertig, falsche gruppe; C: noch offen, aber gefärbt
      let problem = null;
      if (istFertig(t)) {
        let ungefaerbt = false;
        let falsch = false;
        for (let i = t.start; i < bis; i++) {
          if (marks[i] === null) ungefaerbt = true;
          else if (marks[i] !== t.type) falsch = true;
        }
        if (ungefaerbt) problem = 'A';
        else if (falsch) problem = 'B';
      } else {
        for (let i = t.start; i < bis; i++) {
          if (marks[i] !== null) { problem = 'C'; break; }
        }
      }
      if (!problem) return;
      for (let i = t.start; i < bis; i++) {
        chars[i].classList.add('lex-wrong');
        if (marks[i] === null) chars[i].classList.add('lex-nomark');
      }
      if (!erstes) erstes = { problem, t };
    });

    if (erstes) {
      config.beiFalsch?.();
      const { problem, t } = erstes;
      if (problem === 'A') {
        setMsg({ titel: 'Falsch', text: 'Dieses Token ist fertig, aber noch nicht eingefärbt.', hinweis: hinweisZuFertig(t), kind: 'err' });
      } else if (problem === 'B') {
        setMsg({
          titel: 'Falsch',
          text: 'Diese Tokengruppe passt nicht zum Token.',
          hinweis: 'Überlege, welche Rolle dieses Token in der Sprache hat.' + (config.hinweisKategorien ? ' ' + config.hinweisKategorien : ''),
          kind: 'err',
        });
      } else {
        setMsg({
          titel: 'Falsch',
          text: 'Das Token ist noch nicht zu Ende gelesen. Färbe erst, wenn es fertig ist.',
          hinweis: 'Der Scanner kann hier noch weiterlesen, denn das nächste Zeichen könnte noch zum Token gehören.',
          kind: 'err',
        });
      }
    } else if (tokens.some((t) => t.type === 'error' && t.end <= pos)) {
      // das fehlerzeichen ist gelesen und richtig markiert: die phase endet hier
      const t = tokens.find((x) => x.type === 'error');
      gelöst = true;
      abgebrochen = true;
      config.beiRichtig?.();
      setMsg({ titel: 'Geschafft', text: fehlerText(t), hinweis: null, kind: 'ok' });
      zeichneVorschau();
      if (config.beiEnde) config.beiEnde({ tokens: tokens.filter((x) => x.end <= pos).map((x) => ({ text: code.slice(x.start, x.end), type: x.type })) });
    } else if (pos >= code.length) {
      gelöst = true;
      config.beiRichtig?.();
      setMsg({ titel: 'Geschafft', text: erfolgstext, hinweis: null, kind: 'ok' });
      if (config.beiEnde) config.beiEnde({ tokens: tokens.map((t) => ({ text: code.slice(t.start, t.end), type: t.type })) });
    } else {
      pos++;
      config.beiRichtig?.();
      setMsg(null);
      baueZeichen();
    }
    zeichneMeldung();
    zeichneButtons();
  }

  // ---- Meldung und Buttons ----
  function setMsg(m) {
    msg = m;
    hinweisOffen = false;
  }
  function zeichneMeldung() {
    resultEl.hidden = !msg;
    if (!msg) return;
    resultEl.className = 'lex-result' + (msg.kind === 'ok' ? ' lex-ok' : ' lex-err');
    // fester titel ("geschafft" grün, "falsch" orange) in einer eigenen zeile über dem satz
    msgEl.textContent = '';
    if (msg.titel) {
      const titel = document.createElement('span');
      titel.className = 'meldung-titel' + (msg.kind === 'ok' ? '' : ' meldung-titel--hinweis');
      titel.textContent = msg.titel;
      msgEl.append(titel);
    }
    msgEl.append(msg.text);
    hinweisBtn.hidden = !msg.hinweis || hinweisOffen;
    hinweisEl.hidden = !(msg.hinweis && hinweisOffen);
    // zeichen wie „<“ können im hinweis stehen, deshalb kein innerHTML
    const fett = document.createElement('strong');
    fett.textContent = 'Hinweis:';
    hinweisEl.replaceChildren(fett, ' ' + (msg.hinweis ?? ''));
  }
  function zeichneButtons() {
    nextBtn.textContent = pos >= code.length && !abgebrochen ? 'Überprüfen' : 'Nächstes Zeichen';
    nextBtn.disabled = gelöst;
    toolButtons.forEach((b) => { b.disabled = gelöst; });
  }

  // ein schritt für den spieler (knopf "schritt vormachen")
  // erst alle schon gelesenen zeichen richtig setzen (fertige tokens in ihrer farbe, offene ungefärbt), damit die prüfung weiterläuft
  // dann zeichen für zeichen bis zum ende des nächsten tokens lesen und es färben
  function schritt() {
    if (gelöst) return;
    const nachstes = tokens.find((t) => t.end > pos);
    tokens.forEach((t) => {
      if (t.start >= pos) return;
      for (let i = t.start; i < Math.min(t.end, pos); i++) marks[i] = istFertig(t) ? t.type : null;
    });
    if (nachstes) {
      let grenze = code.length + 1; // schutz gegen eine schleife ohne fortschritt
      while (pos < nachstes.end && !gelöst && grenze-- > 0) pruefe();
      if (pos >= nachstes.end) {
        for (let i = nachstes.start; i < nachstes.end; i++) marks[i] = nachstes.type;
        renderMarks();
      }
    }
    // letztes token gefärbt oder fehlerzeichen gefärbt: übung abschließen
    if (!gelöst && (pos >= code.length || nachstes?.type === 'error')) pruefe();
  }
  if (config.schrittBereit) config.schrittBereit(schritt);

  nextBtn.onclick = pruefe;
  container.querySelector('.msg-x').onclick = () => {
    setMsg(null);
    zeichneMeldung();
  };
  hinweisBtn.onclick = () => {
    hinweisOffen = true;
    zeichneMeldung();
  };
  baueZeichen();
  zeichneButtons();

  return () => {
    if (drag) stopDrag();
  };
}

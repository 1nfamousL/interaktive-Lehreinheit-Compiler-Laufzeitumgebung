// übung "ordne zu" (lektion 6.1)
//
// config (inhalte: data/phasenaufgaben.js):
//   ziele: blöcke von links nach rechts: { id, titel, gruppe?, ablehnen? }, gruppe: schlüssel in config.gruppen, ablehnen: hinweis, wenn hier eine fehlerzeile landet, obwohl dieser block nie etwas ablehnt
//   gruppen: klammern über den blöcken: { schluessel: { titel, zusatz, farbe } }, farbe ist der name einer farbrolle (compile → --compile)
//   karten: { id, art, ... }, karten der art "ergebnis" haben ein "platz" (0 vor dem ersten block bis ziele.length hinter dem letzten)
//   vorbefuellt: karten, die schon an ihrem richtigen platz liegen (standard: keine), sie werden nicht abgefragt und zählen nicht mit, "zurücksetzen" lässt sie stehen
//   ergebnisseZuerst: true (standard), erst kommen die eingaben und ausgaben, dann der rest
//   schrittImmer: true, "schritt vormachen" ist immer da, solange eine karte offen ist, sonst erst nach falschen versuchen
//   hilfe: { titel, html } für den hilfe-button, sonst allgemeiner text
//
// drei arten von karten, jede mit eigener farbe und einem etikett:
//   kernaufgabe: was eine phase tut → in den block der phase
//   fehler: codezeile mit fehlerart → in den block der phase, die sie als erste ablehnt
//   eingabe / ausgabe (art "ergebnis"): was zwischen zwei blöcken wandert → in die lücke über der stelle zwischen zwei blöcken
// der spieler wählt nur das ziel, im block stehen erst die kernaufgaben, darunter die fehler, ohne eigene überschriften
//
// "schritt vormachen" erscheint nach FEHLER_BIS_SCHRITT falschen versuchen bei derselben karte und legt die karte an die richtige stelle
// die rückmeldung erscheint als leiste unten rechts über der übung, mit x zum schließen, sie verschwindet, sobald der spieler die nächste karte anfasst
// während eines drags hängen pointermove/pointerup/pointercancel-listener auf document, die zurückgegebene funktion räumt sie auf

import { meldeUebung, meldeGeloest, meldeHilfe, meldeBreite } from '../uebung.js';
import { SCHRITT_IMMER } from '../bau-info.js';

// nach so vielen falschen versuchen bei derselben karte erscheint "schritt vormachen"
// ein richtiger zug oder der schritt selbst setzt den zähler zurück
const FEHLER_BIS_SCHRITT = 2;

const ART_NAMEN = { aufgabe: 'Kernaufgabe', fehler: 'Fehler', ergebnis: 'Eingabe / Ausgabe' };

// kleiner helfer: element mit klasse und text (textContent, nie html, die texte stammen aus den daten)
function el(tag, klasse, text) {
  const e = document.createElement(tag);
  if (klasse) e.className = klasse;
  if (text != null) e.textContent = text;
  return e;
}

// fisher-yates, damit die reihenfolge wirklich gleichverteilt ist
function mische(liste) {
  const l = [...liste];
  for (let i = l.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [l[i], l[j]] = [l[j], l[i]];
  }
  return l;
}

// inhalt einer karte ohne etikett der art: so steht sie im block bzw. in der lücke, dort sagt schon der bereich, was sie ist
// fehler: erst die fehlerart, darunter die codezeile
function inhalt(k) {
  const teile = [];
  if (k.art === 'fehler') {
    teile.push(el('span', 'pz-etikett', k.etikett), el('code', 'pz-codezeile', k.text));
  } else {
    teile.push(el('span', 'pz-text', k.text));
    if (k.zusatz) teile.push(el('span', 'pz-zusatz', k.zusatz));
  }
  return teile;
}

// hilfetext im zeilen-aufbau der übrigen hilfen: links nachbildungen (.mini-dd-*, .mini-pz-* in css/20-popups.css), rechts kurz, was passiert
function hilfeHtml(config) {
  const tag = (art) => `<span class="mini-pz-tag pz-art-${art}">${ART_NAMEN[art]}</span>`;
  const zeilen = [
    ['<span class="mini-dd"><span class="mini-pz-karte pz-art-aufgabe">Karte</span><span class="mini-dd-pfeil">→</span><span class="mini-pz-ziel">Ziel</span></span>',
      'Oben steht eine Karte. Zieh sie dorthin, wo sie hingehört, oder klick das Ziel an. Es gibt drei Arten von Karten, du erkennst sie an Farbe und Etikett.'],
    [tag('aufgabe'),
      'Eine Aufgabe, die eine Phase erledigt. Sie gehört in den Block dieser Phase.'],
    [tag('fehler'),
      'Eine Codezeile mit einem Fehler. Das Etikett sagt, was falsch ist. Sie gehört in den Block der Phase, die den Fehler als Erste bemerkt. Die Zeile besteht alle Phasen davor.'],
    [tag('ergebnis'),
      'Das, was eine Phase an die nächste weitergibt. Es gehört nicht in einen Block, sondern in die Lücke über der Stelle zwischen zwei Blöcken: Es ist die Ausgabe des linken und die Eingabe des rechten Blocks.'],
    ['<span class="mini-pz-ziel falsch">Ziel</span>',
      'Passt es nicht, wackelt das Ziel kurz, die Karte bleibt oben, und unten rechts erklärt ein Hinweis, woran du es erkennst.'],
    ...(config.vorbefuellt?.length ? [['<span class="mini-pz-ziel"><span class="mini-pz-chip pz-art-aufgabe">Karte</span></span>',
      'Karten aus den früheren Kapiteln liegen schon an ihrem Platz. Du ordnest nur die neuen zu.']] : []),
    ['<span class="mini-knopf">Schritt vormachen</span>',
      (config.schrittImmer || SCHRITT_IMMER
        ? 'Kommst du bei einer Karte nicht weiter, hilft „Schritt vormachen“. Es legt die Karte an die richtige Stelle und erklärt, warum sie dort hingehört.'
        : 'Kommst du bei einer Karte nicht weiter, erscheint nach zwei falschen Versuchen „Schritt vormachen“. Es legt die Karte an die richtige Stelle und erklärt, warum sie dort hingehört.')],
    ['<span class="mini-knopf">Zurücksetzen</span>', '„Zurücksetzen“ mischt die Karten neu und beginnt die Übung noch einmal.'],
  ];
  return zeilen.map(([links, text]) => `
    <div class="hilfe-zeile">
      <div class="hilfe-knoepfe">${links}</div>
      <p>${text}</p>
    </div>`).join('');
}

export function render(container, config) {
  meldeUebung(container); // die lektion zählt erst als abgeschlossen, wenn alle karten sitzen
  meldeBreite(container); // fünf blöcke nebeneinander brauchen die volle folienbreite
  meldeHilfe(container, config.hilfe ?? { titel: 'Phasen zuordnen', html: hilfeHtml(config) });

  const ziele = config.ziele;
  const zielNr = (id) => ziele.findIndex((z) => z.id === id);

  container.classList.add('pz');
  container.innerHTML = `
    <div class="pz-fest">
      <span class="pz-zaehler"></span>
      <div class="pz-stapel"></div>
      <button type="button" class="lex-btn-reset cw-schritt-btn" hidden>Schritt vormachen</button>
      <button type="button" class="lex-btn-reset cw-reset-btn">Zurücksetzen</button>
    </div>
    <div class="pz-weg"></div>
    <div class="cw-leiste-anker">
      <div class="cw-leiste pz-leiste" hidden>
        <div class="cw-leiste-text"></div>
        <button class="lex-btn-hinweis" type="button" hidden>Zeige Hinweis</button>
        <div class="lex-hinweis-text" hidden></div>
        <button class="msg-x" type="button" aria-label="Meldung schließen">×</button>
      </div>
    </div>
  `;
  const zaehler = container.querySelector('.pz-zaehler');
  const stapel = container.querySelector('.pz-stapel');
  const schrittEl = container.querySelector('.cw-schritt-btn');
  const leiste = container.querySelector('.pz-leiste');
  const leisteText = container.querySelector('.cw-leiste-text');
  const hinweisBtn = leiste.querySelector('.lex-btn-hinweis');
  const hinweisEl = leiste.querySelector('.lex-hinweis-text');
  const weg = container.querySelector('.pz-weg');

  // ----- Diagramm aufbauen: Zeile 1 Klammern, Zeile 2 Lücken für Eingabe / Ausgabe, Zeile 3 Blöcke und Pfeile -----
  const spalten = [];
  const blockSpalte = []; // rasterspalte jedes blocks
  const pfeilSpalte = []; // rasterspalte des pfeils vor block i (i ≥ 1)
  const bereiche = new Map(); // "blockId:art" → liste im block
  const gruppenSpannen = new Map(); // gruppe → { von, bis } (rasterspalten)
  const blockEls = [];
  ziele.forEach((z, i) => {
    if (i > 0) {
      const pfeil = el('span', 'pz-pfeil', '→');
      pfeil.setAttribute('aria-hidden', 'true');
      pfeilSpalte[i] = spalten.length + 1;
      pfeil.style.gridColumn = String(pfeilSpalte[i]);
      weg.append(pfeil);
      spalten.push('var(--pz-pfeil)');
    }
    const spalte = spalten.length + 1;
    blockSpalte[i] = spalte;
    spalten.push('minmax(0, 1fr)');

    const block = el('div', 'pz-block');
    block.dataset.ziel = z.id;
    block.style.gridColumn = String(spalte);
    block.tabIndex = 0;
    block.setAttribute('role', 'button');
    block.setAttribute('aria-label', z.titel);
    block.append(el('div', 'pz-titel', z.titel));
    // zwei listen: erst die kernaufgaben, darunter die fehler, eine leere liste nimmt keinen platz ein
    ['aufgabe', 'fehler'].forEach((art) => {
      const liste = el('div', `pz-liste pz-art-${art}`);
      bereiche.set(`${z.id}:${art}`, liste);
      block.append(liste);
    });
    weg.append(block);
    blockEls.push(block);

    if (z.gruppe) {
      const sp = gruppenSpannen.get(z.gruppe) ?? { von: spalte, bis: spalte };
      sp.bis = spalte;
      gruppenSpannen.set(z.gruppe, sp);
    }
  });
  weg.style.gridTemplateColumns = spalten.join(' ');

  gruppenSpannen.forEach((sp, schluessel) => {
    const g = config.gruppen?.[schluessel];
    if (!g) return;
    const klammer = el('div', 'pz-klammer');
    klammer.style.gridColumn = `${sp.von} / ${sp.bis + 1}`;
    klammer.style.setProperty('--pz-gruppe', `var(--${g.farbe})`);
    klammer.append(el('span', 'pz-klammer-titel', g.titel));
    if (g.zusatz) klammer.append(el('span', 'pz-klammer-zusatz', g.zusatz));
    weg.append(klammer);
  });

  // lücken für eingabe / ausgabe: eine vor dem ersten block, eine zwischen je zwei blöcken, eine hinter dem letzten
  // die mittleren liegen über dem pfeil und dürfen breiter sein als dieser (sie ragen in die nachbarspalten, das stört in ihrer eigenen zeile nicht), die äußeren schließen bündig mit der kette ab
  const lueckenEls = [];
  for (let k = 0; k <= ziele.length; k++) {
    const luecke = el('div', 'pz-luecke pz-art-ergebnis');
    luecke.dataset.platz = String(k);
    luecke.tabIndex = 0;
    luecke.setAttribute('role', 'button');
    luecke.setAttribute('aria-label',
      k === 0 ? `Vor ${ziele[0].titel}`
        : k === ziele.length ? `Nach ${ziele[k - 1].titel}`
          : `Zwischen ${ziele[k - 1].titel} und ${ziele[k].titel}`);
    if (k === 0) { luecke.style.gridColumn = String(blockSpalte[0]); luecke.classList.add('pz-luecke--erste'); }
    else if (k === ziele.length) { luecke.style.gridColumn = String(blockSpalte[k - 1]); luecke.classList.add('pz-luecke--letzte'); }
    else luecke.style.gridColumn = String(pfeilSpalte[k]);
    weg.append(luecke);
    lueckenEls.push(luecke);
  }

  // ----- Ablauf -----
  let warteschlange = []; // noch nicht richtig einsortierte karten, vorn die aktuelle
  let gesamt = 0;
  let beimErstenMal = 0; // karten, die gleich beim ersten versuch am richtigen ort gelandet sind
  let versucheAktuell = 0;
  let fertig = false;
  let aktiverDrag = null;
  const wackelTimer = new Set();

  // rückmeldung als leiste unten rechts (art: 'ok' oder 'err' = hinweis), ohne art wird sie versteckt
  // hinweis (optional): genauere erklärung, erst nach "zeige hinweis" sichtbar
  function setzeMeldung(art, titel, text, hinweis = null) {
    if (!art) { leiste.hidden = true; return; }
    leiste.hidden = false;
    leiste.className = 'cw-leiste pz-leiste ' + (art === 'ok' ? 'cw-ok' : 'cw-hinweis');
    leisteText.textContent = '';
    // fester titel in der ersten zeile neben dem symbol ("falsch" orange, "richtig" und "vorgemacht" grün)
    // der individuelle satz darunter ganz links
    leisteText.append(el('span', 'meldung-titel' + (art === 'ok' ? '' : ' meldung-titel--hinweis'), titel), text);
    hinweisBtn.hidden = !hinweis;
    hinweisEl.hidden = true;
    hinweisEl.replaceChildren(el('strong', null, 'Hinweis:'), ' ' + (hinweis ?? ''));
  }
  leiste.querySelector('.msg-x').addEventListener('click', () => { leiste.hidden = true; });
  hinweisBtn.addEventListener('click', () => {
    hinweisBtn.hidden = true;
    hinweisEl.hidden = false;
  });

  // "schritt vormachen" gibt es nur, solange eine karte offen ist und der spieler an ihr nicht weiterkommt
  function aktualisiereSchritt() {
    schrittEl.hidden = fertig || !warteschlange.length || !(config.schrittImmer || SCHRITT_IMMER || versucheAktuell >= FEHLER_BIS_SCHRITT);
  }
  // das richtige ziel der aktuellen karte: die lücke bei eingabe / ausgabe, sonst der block der phase
  const richtigerOrt = (karte) => (karte.art === 'ergebnis' ? lueckenEls[karte.platz] : blockEls[zielNr(karte.ziel)]);

  function zeigeKarte() {
    stapel.textContent = '';
    if (!warteschlange.length) return;
    const k = warteschlange[0];
    const karte = el('div', `pz-karte pz-art-${k.art}`);
    const tag = el('span', 'pz-tag', ART_NAMEN[k.art]);
    const teile = inhalt(k);
    if (k.art === 'fehler') {
      // zwei zeilen: oben etikett der art und die fehlerart nebeneinander, darunter die codezeile
      const kopf = el('div', 'pz-kartenkopf');
      kopf.append(tag, teile[0]);
      karte.append(kopf, teile[1]);
    } else {
      karte.append(tag, ...teile);
    }
    stapel.append(karte);
    haengeDragAn(karte);
    zaehler.textContent = `Karte ${gesamt - warteschlange.length + 1} von ${gesamt}`;
  }

  // rückmeldung bei falschem ziel: { text, hinweis }
  // der text sagt kurz, dass es nicht passt, der hinweis zeigt auf die überlegung, ohne die richtung oder den richtigen ort zu nennen, er erscheint erst nach "zeige hinweis"
  const PASST_NICHT = 'Das passt hier nicht.';
  function meldungBlock(karte, ziel) {
    if (karte.art === 'ergebnis') {
      return { text: PASST_NICHT, hinweis: 'Das ist keine Aufgabe einer Phase, sondern etwas, das zwischen zwei Phasen wandert.' };
    }
    if (karte.art === 'fehler') {
      if (ziel.ablehnen) {
        // ziel.ablehnen besteht aus einem satz zum hinweis und der erklärung dahinter
        const i = ziel.ablehnen.indexOf('. ');
        return i < 0
          ? { text: ziel.ablehnen, hinweis: null }
          : { text: ziel.ablehnen.slice(0, i + 1), hinweis: ziel.ablehnen.slice(i + 2) };
      }
      return { text: PASST_NICHT, hinweis: 'Überlege, welche Phase diese Zeile als Erste ablehnt.' };
    }
    return {
      text: `Das gehört nicht zu „${ziel.titel}“.`,
      hinweis: karte.hinweis ?? 'Überlege, was die Phase bekommt und was sie weitergibt.',
    };
  }
  function meldungLuecke(karte) {
    if (karte.art !== 'ergebnis') {
      return {
        text: PASST_NICHT,
        hinweis: karte.art === 'fehler'
          ? 'In die Lücken gehören nur Eingaben und Ausgaben. Eine Codezeile gehört in die Phase, die sie als Erste ablehnt.'
          : 'In die Lücken gehören nur Eingaben und Ausgaben. Eine Aufgabe gehört in die Phase, die sie erledigt.',
      };
    }
    return { text: PASST_NICHT, hinweis: 'Überlege, welche Phase es erzeugt und welche es als Nächstes bekommt.' };
  }

  function wackeln(ort) {
    ort.classList.add('falsch');
    const t = setTimeout(() => { ort.classList.remove('falsch'); wackelTimer.delete(t); }, 250);
    wackelTimer.add(t);
  }

  // eine karte an ihren richtigen ort setzen: eingabe / ausgabe in ihre lücke, alles andere in die liste ihrer art im block ihrer phase
  // das tut sowohl der spieler (legeAb) als auch der start mit config.vorbefuellt
  function setzeEin(karte) {
    const chip = el('div', `pz-chip pz-art-${karte.art}`);
    chip.append(...inhalt(karte));
    if (karte.art === 'ergebnis') {
      const luecke = lueckenEls[karte.platz];
      luecke.classList.add('belegt');
      luecke.append(chip);
    } else {
      bereiche.get(`${karte.ziel}:${karte.art}`).append(chip);
    }
  }

  // die aktuelle karte an einen ort legen: ein block (dataset.ziel) oder eine lücke (dataset.platz)
  // vorgemacht: der schritt wurde dem spieler abgenommen (knopf "schritt vormachen")
  function legeAb(ort, vorgemacht = false) {
    if (fertig || !warteschlange.length) return;
    const karte = warteschlange[0];
    const istBlock = ort.dataset.ziel != null;
    let richtig;
    let meldung;
    if (istBlock) {
      const ziel = ziele[zielNr(ort.dataset.ziel)];
      richtig = karte.art !== 'ergebnis' && karte.ziel === ziel.id;
      if (!richtig) meldung = meldungBlock(karte, ziel);
    } else {
      const platz = Number(ort.dataset.platz);
      richtig = karte.art === 'ergebnis' && karte.platz === platz;
      if (!richtig) meldung = meldungLuecke(karte);
    }
    if (!richtig) {
      versucheAktuell += 1;
      wackeln(ort);
      setzeMeldung('err', 'Falsch', meldung.text, meldung.hinweis);
      aktualisiereSchritt();
      return;
    }
    if (versucheAktuell === 0 && !vorgemacht) beimErstenMal += 1;
    versucheAktuell = 0;
    setzeEin(karte);
    warteschlange.shift();
    setzeMeldung('ok', vorgemacht ? 'Vorgemacht' : 'Richtig', karte.warum);
    if (warteschlange.length) {
      zeigeKarte();
      aktualisiereSchritt();
      return;
    }
    fertig = true;
    aktualisiereSchritt();
    // am ende steht an der stelle der karten die erfolgsmeldung, der zähler entfällt
    // die leiste behält die begründung der letzten karte
    stapel.textContent = '';
    zaehler.hidden = true;
    stapel.append(el('p', 'pz-erfolg',
      `Alle ${gesamt} Karten erfolgreich zugeordnet, ${beimErstenMal} davon gleich beim ersten Versuch.`));
    meldeGeloest(container);
  }

  // ----- Klicken und Tastatur: das Ziel nimmt die aktuelle Karte -----
  [...blockEls, ...lueckenEls].forEach((ort) => {
    ort.addEventListener('click', () => legeAb(ort));
    ort.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      legeAb(ort);
    });
  });

  // ----- Ziehen: Geisterkarte folgt dem Zeiger, das Ziel darunter leuchtet auf -----
  function haengeDragAn(karte) {
    karte.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      setzeMeldung(null); // die nächste karte wird angefasst: die rückmeldung zur letzten hat ihren zweck erfüllt
      // der geist ist klein und hängt rechts unterhalb des zeigers, das ziel direkt unter dem zeiger bleibt frei und sichtbar
      // getroffen wird allein nach der zeigerposition, nicht nach dem geist
      const geist = karte.cloneNode(true);
      geist.classList.add('pz-karte-geist');
      document.body.appendChild(geist);
      karte.classList.add('zieht');

      const ABSTAND = 14;
      const setze = (x, y) => { geist.style.left = (x + ABSTAND) + 'px'; geist.style.top = (y + ABSTAND) + 'px'; };
      setze(e.clientX, e.clientY);

      const ortBei = (x, y) => {
        const hit = document.elementFromPoint(x, y);
        return hit ? hit.closest('.pz-block, .pz-luecke') : null;
      };
      // bewusst leuchtet jedes ziel auf, nicht nur das richtige, sonst verriete das die lösung
      const hebeHervor = (ort) => {
        [...blockEls, ...lueckenEls].forEach((o) => o.classList.toggle('aktiv', o === ort));
      };
      const bewegt = (ev) => { setze(ev.clientX, ev.clientY); hebeHervor(ortBei(ev.clientX, ev.clientY)); };
      const beenden = () => {
        document.removeEventListener('pointermove', bewegt);
        document.removeEventListener('pointerup', losgelassen);
        document.removeEventListener('pointercancel', beenden);
        geist.remove();
        karte.classList.remove('zieht');
        hebeHervor(null);
        aktiverDrag = null;
      };
      const losgelassen = (ev) => {
        beenden();
        const ort = ortBei(ev.clientX, ev.clientY);
        if (ort) legeAb(ort);
      };
      document.addEventListener('pointermove', bewegt);
      document.addEventListener('pointerup', losgelassen);
      // bricht das system den touch-drag ab (z. b. systemgeste), wird wie bei einem loslassen außerhalb aufgeräumt: geist weg, listener ab, keine karte abgelegt, kein versuch gezählt
      document.addEventListener('pointercancel', beenden);
      aktiverDrag = { beenden };
    });
  }

  // ----- Start und "Zurücksetzen" -----
  function starte() {
    if (aktiverDrag) aktiverDrag.beenden();
    bereiche.forEach((l) => { l.textContent = ''; });
    lueckenEls.forEach((l) => { l.textContent = ''; l.classList.remove('belegt'); });
    (config.vorbefuellt ?? []).forEach(setzeEin); // karten früherer kapitel liegen schon an ihrem platz
    if (config.ergebnisseZuerst === false) {
      warteschlange = mische(config.karten);
    } else {
      warteschlange = [
        ...mische(config.karten.filter((k) => k.art === 'ergebnis')),
        ...mische(config.karten.filter((k) => k.art !== 'ergebnis')),
      ];
    }
    gesamt = warteschlange.length;
    beimErstenMal = 0;
    versucheAktuell = 0;
    fertig = false;
    setzeMeldung(null);
    zaehler.hidden = false;
    zeigeKarte();
    aktualisiereSchritt();
  }
  schrittEl.addEventListener('click', () => {
    if (fertig || !warteschlange.length) return;
    legeAb(richtigerOrt(warteschlange[0]), true);
  });
  container.querySelector('.cw-reset-btn').addEventListener('click', starte);
  starte();

  return () => {
    if (aktiverDrag) aktiverDrag.beenden();
    wackelTimer.forEach(clearTimeout);
  };
}

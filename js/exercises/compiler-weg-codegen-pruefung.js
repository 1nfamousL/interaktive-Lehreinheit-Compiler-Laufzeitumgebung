// prüft übersetzung des users mit musterlösugn

import { DEFS, robotAnzahl, pad2, WERT_MAX, istHindernis } from './maschine.js';

const RASTER = { cols: 6, rows: 6 };
const MAX_BEFEHLE = 2000; // danach gilt das programm als endlosschleife

const FEHLER_TEXT = {
  division: 'Division durch 0',
  unterlauf: 'ein Ergebnis kleiner als 0 (Unterlauf)',
  ueberlauf: 'ein Ergebnis größer als 255 (Überlauf)',
  raster: 'der Roboter fährt gegen ein Hindernis',
  hindernis: 'der Roboter fährt gegen ein Hindernis',
  zelle: 'ein Befehl liest eine Datenzelle, in der noch nichts steht',
  register: 'ein Befehl liest ein Register, in das noch nichts geladen wurde',
  zeile: 'die CPU trifft auf eine leere Programmzeile',
  ende: 'der Programmspeicher ist zu Ende, ohne dass „end“ erreicht wurde',
  limit: 'das Programm läuft endlos (zu viele Befehle)',
};

// führt ein programm aus, prog: zeilen { id, p } oder null
// ergebnis: { schritte, fehler, speicher, zaehler, vergleiche }
//   schritte: jedes feld, auf das der roboter fährt: { c, r, zeile } (zeile ab 0)
//   fehler: null (halt erreicht) oder { art, zeile } (zeile ab 0 oder null)
//   speicher: adresse -> wert der beschriebenen zellen am ende des laufs
//   zaehler: pro zeile, wie oft der befehl ausgeführt wurde (auch der befehl, der den fehler auslöst)
//   vergleiche: jeder ausgeführte vergleich in der reihenfolge des laufs: { zeile, a, b } mit den beiden verglichenen werten
// datenzellen und register sind am anfang leer, ein befehl, der eines davon liest, bevor etwas hineingeschrieben wurde, endet mit dem fehler 'zelle' bzw. 'register'
// so fällt ein vergleich nicht durch, nur weil ein ungeladenes register zufällig 0 enthält
// hindernisse: optional, felder { c, r }, auf die der roboter nicht fahren darf
function fuehreAus(prog, start, hindernisse = []) {
  const regs = { A: null, B: null };
  let flag = 0;
  const mem = {}; // fehlende adresse = leer
  const pos = { c: start.c, r: start.r };
  const schritte = [];
  const zaehler = new Array(prog.length).fill(0);
  const vergleiche = []; // jeder ausgeführte vergleich: { zeile, a, b } mit den verglichenen werten
  let pc = 0;
  let count = 0;
  const abbruch = (art, zeile) => ({ schritte, fehler: { art, zeile }, speicher: { ...mem }, zaehler, vergleiche });
  const val = (op) => (op.t === 'wert' ? op.v : op.t === 'register' ? regs[op.v] : (op.v in mem ? mem[op.v] : null));
  // fehlerart, wenn der operand leer ist
  const leerArt = (op) => (op.t === 'register' ? 'register' : 'zelle');

  for (;;) {
    const zeile = pc;
    if (pc >= prog.length) return abbruch('ende', null);
    const inst = prog[pc];
    if (!inst) return abbruch('zeile', zeile);
    if (++count > MAX_BEFEHLE) return abbruch('limit', zeile);
    zaehler[pc]++;
    if (inst.id === 'halt') return { schritte, fehler: null, speicher: { ...mem }, zaehler, vergleiche };
    const def = DEFS[inst.id], p = inst.p;
    let next = pc + 1;

    if (def.form === 'kopiere') {
      const v = val(p.src);
      if (v === null) return abbruch(leerArt(p.src), zeile);
      if (p.dst.t === 'register') regs[p.dst.v] = v;
      else mem[p.dst.v] = v;
    } else if (def.form === 'arith') {
      const a = regs[p.reg], b = val(p.op2);
      if (a === null) return abbruch('register', zeile);
      if (b === null) return abbruch(leerArt(p.op2), zeile);
      if (def.id === 'div' && b === 0) return abbruch('division', zeile);
      const r = def.id === 'add' ? a + b : def.id === 'sub' ? a - b : def.id === 'mul' ? a * b : Math.trunc(a / b);
      if (r < 0) return abbruch('unterlauf', zeile);
      if (r > WERT_MAX) return abbruch('ueberlauf', zeile);
      regs[p.reg] = r;
    } else if (def.form === 'cmp') {
      const a = val(p.op1), b = val(p.op2);
      if (a === null) return abbruch(leerArt(p.op1), zeile);
      if (b === null) return abbruch(leerArt(p.op2), zeile);
      vergleiche.push({ zeile, a, b });
      flag = (def.op === '<' ? a < b : def.op === '>' ? a > b : def.op === '<=' ? a <= b : def.op === '>=' ? a >= b : def.op === '!=' ? a !== b : a === b) ? 1 : 0;
    } else if (def.form === 'jump' || def.form === 'jumpf') {
      if (def.form === 'jump' || flag === 1) next = p.line - 1;
    } else if (def.form === 'robot') {
      const n = val(robotAnzahl(p));
      if (n === null) return abbruch('zelle', zeile);
      for (let i = 0; i < n; i++) {
        const c = pos.c + def.dc, r = pos.r + def.dr;
        if (c < 0 || r < 0 || c >= RASTER.cols || r >= RASTER.rows) return abbruch('raster', zeile);
        if (istHindernis(hindernisse, c, r)) return abbruch('hindernis', zeile);
        pos.c = c; pos.r = r;
        schritte.push({ c, r, zeile });
      }
    }
    pc = next;
  }
}

const OPERANDEN = ['src', 'dst', 'op1', 'op2', 'n'];

// form eines bausteins: befehl und art der operanden, also die festen teile
// bausteine derselben form sind für den spieler nicht zu unterscheiden und austauschbar
const form = (inst) => inst.id + ':' + OPERANDEN.map((k) => (inst.p[k] ? inst.p[k].t : '-')).join(',');

// die zahlen eines bausteins (operanden der art "wert") als text, mit ihrem platz im befehl
const zahlen = (inst) => OPERANDEN
  .filter((k) => inst.p[k] && inst.p[k].t === 'wert')
  .map((k) => k + '=' + inst.p[k].v).join(',');

// gruppiert die zeilen eines programms nach der form ihres bausteins
// zeilen: liste { id, p } (oder null), zaehler: ausführungen pro zeile aus fuehreAus()
function nachForm(zeilen, zaehler) {
  const gruppen = new Map();
  zeilen.forEach((inst, i) => {
    if (!inst) return;
    const k = form(inst);
    if (!gruppen.has(k)) gruppen.set(k, []);
    gruppen.get(k).push({ i, n: zaehler[i], zahlen: zahlen(inst) });
  });
  return gruppen;
}

// erste zeile (kleinster index) des spielers, deren wert in der musterübersetzung der gruppe nicht mehr vorkommt, null, wenn es keinen unterschied gibt
// beide listen enthalten gleich viele einträge
function ersteAbweichung(spieler, muster, wert) {
  const rest = muster.map(wert);
  for (const z of spieler) {
    const j = rest.indexOf(wert(z));
    if (j < 0) return z.i;
    rest.splice(j, 1);
  }
  return null;
}

// rows: zeilen des programmspeichers { bid, id, p } oder null
// bausteine: bausteine der oberfläche { bid, id, p, etikett }
// muster: musterübersetzung (liste { id, p })
// zeilenNr: optional, zeilennummer (ab 1) als text für die meldungen, standard "05"
// hindernisse: optional, felder { c, r } (siehe fuehreAus)
// ergebnis: { ok, meldung, zeilen } (zeilen = index ab 0 der fehlerhaften zeilen)
export function pruefe(rows, bausteine, muster, start, zeilenNr = pad2, hindernisse = []) {
  const fehler = (meldung, zeilen = []) => ({ ok: false, meldung, zeilen });
  const z = (i) => zeilenNr(i + 1);

  // ---- 1. Aufbau ----
  const bids = rows.filter(Boolean).map((r) => r.bid);
  if (bids.length !== bausteine.length || new Set(bids).size !== bids.length) {
    return fehler('Jeder Baustein muss genau einmal im Programm vorkommen.');
  }
  const h = rows.findIndex((r) => r && r.id === 'halt');
  if (h < 0) return fehler('„end“ fehlt. Ohne „end“ weiß die CPU nicht, wann das Programm zu Ende ist.');
  const luecke = rows.slice(0, h).findIndex((r) => !r);
  if (luecke >= 0) {
    return fehler('Zeile ' + z(luecke) + ' ist leer. Die CPU holt Befehl für Befehl und würde dort abbrechen.', [luecke]);
  }
  const dahinter = [];
  rows.forEach((r, i) => { if (r && i > h) dahinter.push(i); });
  if (dahinter.length) return fehler('Hinter „end“ stehen noch Befehle. Sie werden nie ausgeführt. „end“ gehört ans Ende des Programms.', dahinter);

  // ---- 2. Lauf ----
  const soll = fuehreAus(muster, start, hindernisse);
  const ist = fuehreAus(rows.map((r) => r && { id: r.id, p: r.p }), start, hindernisse);
  const feld = (s) => '(' + s.c + ',' + s.r + ')';
  const grund = (f) => FEHLER_TEXT[f.art] + (f.zeile !== null ? ' (Zeile ' + z(f.zeile) + ')' : '');

  const gemeinsam = Math.min(soll.schritte.length, ist.schritte.length);
  for (let k = 0; k < gemeinsam; k++) {
    const a = soll.schritte[k], b = ist.schritte[k];
    if (a.c !== b.c || a.r !== b.r) {
      return fehler('Nach dem ' + (k + 1) + '. Feld steht der Roboter im Quellcode auf ' + feld(a) + ', bei deinem Programm auf ' + feld(b) + '. Der Weg stimmt nicht überein.', [b.zeile]);
    }
  }
  // endlosschleifen brechen an verschiedenen stellen ab, dann zählt von den wegen nur der gemeinsame anfang (oben), ihre länge und die genauen anzahlen (3.2, 3.4) sind nicht vergleichbar
  // die abdeckung (3.1) und die zahlen (3.3) gelten weiter: die zahlen brauchen keinen lauf, und in einer endlosschleife läuft jede zeile der schleife
  // sonst ginge ein programm mit falschen zahlen oder ohne jede bewegung als richtig durch
  const endlos = soll.fehler && ist.fehler && soll.fehler.art === 'limit' && ist.fehler.art === 'limit';

  if (!endlos && ist.schritte.length < soll.schritte.length) {
    const k = ist.schritte.length;
    if (ist.fehler) return fehler('Dein Programm bricht nach ' + k + ' Feldern ab: ' + grund(ist.fehler) + '. Der Quellcode fährt weiter.', ist.fehler.zeile !== null ? [ist.fehler.zeile] : []);
    return fehler('Dein Programm hört nach ' + k + ' Feldern auf, der Quellcode fährt weiter.', [h]);
  }
  if (!endlos && ist.schritte.length > soll.schritte.length) {
    const k = soll.schritte.length;
    const grundSoll = soll.fehler ? ' (' + FEHLER_TEXT[soll.fehler.art] + ')' : '';
    return fehler(k === 0
      ? 'Dein Programm bewegt den Roboter, der Quellcode tut es nicht' + grundSoll + '.'
      : 'Dein Programm fährt nach dem ' + k + '. Feld weiter, der Quellcode hört dort auf' + grundSoll + '.', [ist.schritte[k].zeile]);
  }
  if (!soll.fehler && ist.fehler) {
    const f = ist.fehler;
    const zeilen = f.zeile !== null ? [f.zeile] : [];
    // leere zelle oder leeres register: sagen, welcher schritt fehlt (ohne die lösung zu nennen)
    if (f.art === 'register') {
      return fehler('Dein Programm bricht in Zeile ' + z(f.zeile) + ' ab: Der Befehl liest ein Register, in das vorher noch nichts geladen wurde. Lade zuerst einen Wert hinein.', zeilen);
    }
    if (f.art === 'zelle') {
      return fehler('Dein Programm bricht in Zeile ' + z(f.zeile) + ' ab: Der Befehl liest eine Datenzelle, in die vorher noch nichts geschrieben wurde. Schreibe zuerst einen Wert hinein.', zeilen);
    }
    return fehler('Dein Programm bricht ab: ' + grund(f) + '. Der Quellcode löst diesen Fehler nicht aus. Prüfe die Zahlen und die Reihenfolge deiner Befehle.', zeilen);
  }
  if (soll.fehler && !ist.fehler) {
    return fehler('Der Quellcode bricht mit einem Laufzeitfehler ab (' + FEHLER_TEXT[soll.fehler.art] + '), dein Programm läuft dagegen fehlerfrei durch.');
  }
  if (soll.fehler && ist.fehler && soll.fehler.art !== ist.fehler.art) {
    return fehler('Der Quellcode bricht mit einem anderen Laufzeitfehler ab (' + FEHLER_TEXT[soll.fehler.art] + '), dein Programm mit: ' + grund(ist.fehler) + '.', ist.fehler.zeile !== null ? [ist.fehler.zeile] : []);
  }

  // ---- 3. Treue zum Quellcode ----
  // weg und ende stimmen, jetzt prüfen, ob das programm auch so gebaut ist, wie der quellcode es verlangt
  // gruppen: bausteine gleicher form
  const sollGruppen = nachForm(muster, soll.zaehler);
  const istGruppen = nachForm(rows, ist.zaehler);
  const kopf = soll.fehler
    ? 'Dein Programm verhält sich wie der Quellcode, entspricht ihm aber nicht. '
    : 'Dein Roboter erreicht das Ziel, aber dein Programm entspricht nicht dem Quellcode. ';
  const abweichung = (satz, zeile) => fehler(kopf + satz, [zeile]);

  // 3.1 abdeckung: was die musterübersetzung ausführt, muss auch beim spieler laufen
  let nie = null;
  for (const [k, s] of sollGruppen) {
    const i = istGruppen.get(k) || [];
    const sollBenutzt = s.filter((x) => x.n > 0).length;
    if (i.filter((x) => x.n > 0).length < sollBenutzt) {
      const ungenutzt = i.filter((x) => x.n === 0).map((x) => x.i)[0];
      if (ungenutzt !== undefined && (nie === null || ungenutzt < nie)) nie = ungenutzt;
    }
  }
  if (nie !== null) return abweichung('Der Baustein in Zeile ' + z(nie) + ' wird nie ausgeführt.', nie);

  // 3.2 bewegungen: die roboterbausteine laufen so oft wie im quellcode
  for (const [k, s] of endlos ? [] : sollGruppen) {
    if (DEFS[k.split(':')[0]].form !== 'robot') continue;
    const i = istGruppen.get(k) || [];
    const zeile = ersteAbweichung(i, s, (x) => x.n);
    if (zeile !== null) return abweichung('Der Baustein in Zeile ' + z(zeile) + ' wird nicht so oft ausgeführt wie im Quellcode.', zeile);
  }

  // 3.3 zahlen: alle zahlen kommen aus dem quellcode, auch in bausteinen, die nie laufen
  for (const [k, s] of sollGruppen) {
    if (s.every((x) => x.zahlen === '')) continue;
    const i = istGruppen.get(k) || [];
    const zeile = ersteAbweichung(i, s, (x) => x.zahlen);
    if (zeile !== null) return abweichung('Die Zahlen im Baustein in Zeile ' + z(zeile) + ' passen nicht zum Quellcode.', zeile);
  }

  // 3.4 vergleichswerte: jeder vergleich rechnet mit denselben zwei werten wie im quellcode
  // das findet eine falsche variable (oder ein altes register), wenn der vergleich trotzdem zufällig gleich ausgeht, etwa 3 != 1 statt 0 != 1
  const vergleichsGruppen = (zeilen, liste) => {
    const g = new Map();
    liste.forEach((v) => {
      const k = form(zeilen[v.zeile]);
      if (!g.has(k)) g.set(k, []);
      g.get(k).push({ i: v.zeile, s: v.a + ',' + v.b });
    });
    return g;
  };
  const sollV = vergleichsGruppen(muster, soll.vergleiche);
  const istV = vergleichsGruppen(rows, ist.vergleiche);
  for (const [k, s] of endlos ? [] : sollV) {
    const i = istV.get(k) || [];
    const zeile = ersteAbweichung(i, s, (x) => x.s);
    if (zeile !== null) return abweichung('Der Vergleich in Zeile ' + z(zeile) + ' arbeitet mit anderen Werten als im Quellcode.', zeile);
  }

  // ---- 4. Datenspeicher am Ende ----
  if (!soll.fehler && !ist.fehler) {
    const werte = (m) => Object.values(m).sort((a, b) => a - b);
    const a = werte(soll.speicher), b = werte(ist.speicher);
    const schreiber = [];
    rows.forEach((r, i) => { if (r.p.dst && r.p.dst.t === 'speicher') schreiber.push(i); });
    if (a.length !== b.length) {
      return fehler('Am Ende sind in deinem Programm ' + b.length + ' Datenzellen beschrieben, der Quellcode braucht ' + a.length + ' (jede Deklaration hat ihre eigene Zelle). '
        + (b.length < a.length ? 'Vermutlich teilen sich zwei Namen eine Datenzelle.' : 'Vermutlich ist ein Name auf mehrere Datenzellen verteilt.'), schreiber);
    }
    if (a.some((x, i) => x !== b[i])) {
      return fehler('Die Werte im Datenspeicher stimmen am Ende nicht mit dem Quellcode überein. Prüfe die Zahlen, die du in die Bausteine eingetragen hast.', schreiber);
    }
  }
  return { ok: true, meldung: '', zeilen: [] };
}

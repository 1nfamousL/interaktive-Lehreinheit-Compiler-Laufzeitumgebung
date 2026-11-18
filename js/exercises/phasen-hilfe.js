// hilfetexte der phasen für den hilfe-button der lektion (über meldeHilfe)
// genutzt von einzelphase (kapitel 2 bis 5, eine phase pro folie) und compiler-weg (kapitel 6, hilfe wechselt mit der phase)

// zeilen-aufbau wie in den übrigen hilfen: links nachbildung des bedienelements (.mini-* in css/20-popups.css), rechts kurz, was es tut
const hilfeZeilen = (zeilen) => zeilen.map(([links, text]) => `
  <div class="hilfe-zeile">
    <div class="hilfe-knoepfe">${links}</div>
    <p>${text}</p>
  </div>`).join('');

const miniWerkzeug = (farbe, name) =>
  `<span class="mini-tool"><span class="mini-swatch" style="background: var(--c-${farbe})"></span>${name}</span>`;

// hilfetext je phase, in allen kapiteln gleich
// ein eintrag kann eine funktion der konfiguration sein, wenn eine zeile nur zu manchen übungen passt
const HILFE = {
  lexik: {
    titel: 'Tokens einfärben',
    html: hilfeZeilen([
      [miniWerkzeug('identifier', 'Bezeichner') + miniWerkzeug('keyword', 'Schlüsselwort'),
        'Wähle rechts ein Werkzeug und fahre bei gedrückter Maustaste über die Zeichen, die zu einem Token gehören. Sie werden in der Farbe des Werkzeugs eingefärbt.'],
      ['<span class="mini-tool"><span class="mini-swatch mini-swatch--radierer"></span>Farbe entfernen</span>',
        'Falsch eingefärbt? Male mit dem richtigen Werkzeug darüber oder wähle „Farbe entfernen“.'],
      [miniWerkzeug('error', 'Lexikalische Fehler'),
        'Passt ein Zeichen zu keiner Tokengruppe, markiere es mit dem Werkzeug „Lexikalische Fehler“. Der Scanner meldet den Fehler dann und hört dort auf.'],
      ['<span class="mini-peek-box">n</span><span class="mini-knopf mini-knopf--akzent">Nächstes Zeichen</span>',
        '„Nächstes Zeichen“ liest ein Zeichen weiter und prüft dabei deinen Stand. Die Vorschau zeigt das nächste Zeichen. Daran erkennst du, ob ein Token weitergeht oder zu Ende ist.'],
      ['<span class="mini-zeichen"><span class="mini-peek-box mini-peek-leer">·</span><span class="mini-peek-box mini-peek-leer">⏎</span></span>',
        'Leerzeichen sind als „·“ dargestellt, Zeilenumbrüche (Enter) als „⏎“. Beide gehören zu keinem Token und bleiben ungefärbt.'],
      ['<span class="mini-knopf">Zurücksetzen</span>',
        '„Zurücksetzen“ beginnt die Übung von vorn.'],
    ]),
  },
  syntax: {
    titel: 'Syntaxbaum aufbauen',
    html: hilfeZeilen([
      [`<span class="mini-token" style="--tk: var(--c-identifier)">x</span>`,
        'Der Scanner liefert dir ein Token nach dem anderen. Das aktuelle Token steht oben in der Seitenleiste. Du entscheidest, wohin es im Baum gehört.'],
      [`<span class="mini-dd"><span class="mini-token" style="--tk: var(--c-identifier)">x</span><span class="mini-dd-pfeil">→</span><span class="mini-dd-feld">hier ablegen</span></span>`,
        'Ziehe das Token auf eine Fläche „hier ablegen“, an der es als Blatt angehängt werden darf. Statt zu ziehen kannst du das Token antippen und danach die Fläche.'],
      ['<span class="mini-chip">Anweisung</span><span class="mini-chip">Ausdruck</span>',
        'Gehört das Token zu einem neuen Knoten, ziehe zuerst das passende Sprachkonstrukt aus der Ablage dorthin, wo der Knoten beginnen soll. Danach legst du das Token darunter ab.'],
      ['<span class="mini-fehlerknopf">Syntaxfehler melden</span>',
        'Gibt es keinen gültigen Zug mehr, melde einen Syntaxfehler. Ziehe dafür das Token auf „Syntaxfehler melden“ oder klicke die Fläche an.'],
      ['<span class="mini-knopf">Syntaxregeln</span>',
        '„Syntaxregeln“ öffnet die Grammatik, nach der du entscheidest.'],
      ['<span class="mini-knopf">Zurücksetzen</span>',
        '„Zurücksetzen“ beginnt die Übung von vorn.'],
    ]),
  },
  // zeile "öffnen/schließen" nur mit config.bereiche (ab kapitel 4)
  semantik: (config) => ({
    titel: 'Syntaxbaum prüfen',
    html: hilfeZeilen([
      ['<span class="mini-curbox">Zuweisung</span>',
        'Du prüfst den Baum Knoten für Knoten, erst die Kinder, dann den Knoten selbst. Der aktuelle Knoten ist im Baum markiert und steht oben in der Seitenleiste.'],
      ['<span class="mini-chip">number</span>',
        'Wähle die Aktion, die zum Knoten passt. Unter „Typ bestimmen“ legst du den Typ eines Werts oder einer Operation fest.'],
      ['<span class="mini-chip">Eintragen</span>',
        '„Eintragen“ trägt Namen und Typ einer Deklaration in die Symboltabelle ein.'],
      ['<span class="mini-zeile"><span>x</span><span>number</span></span>',
        'Bei einer Variablen schlägst du den Namen nach: Klicke seine Zeile in der Symboltabelle an.'],
      config.bereiche && ['<span class="mini-chip">Öffnen</span><span class="mini-chip">Schließen</span>',
        'Jeder Block hat einen eigenen Bereich in der Symboltabelle. Beginnt ein Block, wählst du „Öffnen“, endet er, „Schließen“.'],
      ['<span class="mini-chip">Passt</span>',
        '„Passt“ bestätigt den Knoten, wenn alles stimmt.'],
      ['<span class="mini-fehlerknopf">Nicht deklariert</span><span class="mini-fehlerknopf">Doppelt deklariert</span>',
        'Verstößt der Knoten gegen eine Regel, melde unten den passenden Fehler.'],
      ['<span class="mini-knopf">Semantikregeln</span>',
        '„Semantikregeln“ zeigt die Regeln, nach denen du entscheidest.'],
      ['<span class="mini-knopf">Zurücksetzen</span>',
        '„Zurücksetzen“ beginnt die Übung von vorn.'],
    ].filter(Boolean)),
  }),
  // register ab kapitel 3, flag und sprung ab kapitel 4 (config.sichtbar)
  codegen: (config) => ({
    titel: 'Maschinencode zusammensetzen',
    html: hilfeZeilen([
      ['<span class="mini-papier">number a = 2;<br>moveUp(1);</span>',
        'Links steht der Quellcode, den du in Maschinencode übersetzt.'],
      ['<span class="mini-baustein mini-baustein--mov">mov Zahl → (D)</span><span class="mini-dd-pfeil">↓</span><span class="mini-dd-feld">(Z1)</span>',
        'Ziehe einen Baustein aus der Ablage in eine Zeile des Maschinencodes. Jeder Baustein wird genau einmal gebraucht, seine festen Teile kannst du nicht ändern.'],
      ['<span class="mini-baustein mini-baustein--mov">mov <span class="mini-feld">2</span> → <span class="mini-feld mini-feld--zelle">(D1)</span></span>',
        'Die offenen Teile eines Bausteins füllst du nach dem Ablegen aus.'],
      ['<span class="mini-baustein mini-baustein--mov">mov … <span class="mini-entfernen">×</span></span>',
        'Ziehe einen Baustein in eine andere Zeile, um ihn zu verschieben. Steht dort schon einer, tauschen beide die Plätze. Mit dem × nimmst du ihn wieder heraus.'],
      ['<span class="mini-zellen"><span class="mini-zelle">(D1)</span><span class="mini-zelle">(D2)</span></span>',
        'Rechts siehst du, wie viele Datenzellen dein Code insgesamt braucht.'],
      config.sichtbar?.register !== false && ['<span class="mini-zellen"><span class="mini-zelle mini-zelle--name">A</span><span class="mini-zelle mini-zelle--name">B</span></span>',
        'Register sind Zwischenspeicher. Wähle im Baustein das Register, das der Befehl nutzt.'],
      config.sichtbar?.flag !== false && ['<span class="mini-zellen"><span class="mini-zelle mini-zelle--name">1/0</span></span>',
        'Das Flag merkt sich das Ergebnis eines Vergleichs.'],
      config.sichtbar?.flag !== false && ['<span class="mini-baustein mini-baustein--sprung">jmp <span class="mini-feld mini-feld--zeile">(Z3)</span></span>',
        'Bei einem Sprung wählst du die Zeile, zu der gesprungen wird.'],
      ['<span class="mini-knopf mini-knopf--akzent">Überprüfen</span>',
        '„Überprüfen“ prüft deinen Code.'],
      ['<span class="mini-knopf">Zurücksetzen</span>',
        '„Zurücksetzen“ beginnt die Übung von vorn.'],
    ].filter(Boolean)),
  }),
  // rechenwerk und register ab kapitel 3, flag ab kapitel 4 (config.sichtbar)
  laufzeit: (config) => ({
    titel: 'Programm laden und starten',
    html: hilfeZeilen([
      ['<span class="mini-knopf mini-knopf--akzent">Programm laden</span>',
        '„Programm laden“ legt den Maschinencode in den Speicher. Dort besteht jeder Befehl aus einzelnen Fächern.'],
      ['<span class="mini-knopf mini-knopf--akzent">Start</span>',
        '„Start“ lässt die CPU das Programm abspielen. Mit „Pause“ hältst du an, mit „Weiter“ geht es von dort aus weiter.'],
      ['<span class="mini-knopf">Einzelschritt</span>',
        '„Einzelschritt“ führt genau einen Schritt aus.'],
      ['<span class="mini-knopf">Tempo: mittel ▾</span>',
        'Das Tempo bestimmt, wie schnell das Programm abgespielt wird.'],
      ['<span class="mini-phase">holen</span><span class="mini-phase">dekodieren</span><span class="mini-phase">ausführen</span>',
        'Die CPU arbeitet jeden Befehl in drei Phasen ab: holen, dekodieren, ausführen.'],
      ['<span class="mini-kv"><span class="mini-kv-key">Befehlszähler</span><span class="mini-kv-val">[07]</span></span>',
        'Der Befehlszähler zeigt die Adresse des Fachs, das die CPU als Nächstes liest. Er zählt mit jedem gelesenen Fach um eins weiter.'],
      ['<span class="mini-kv"><span class="mini-kv-key">Befehlsregister</span><span class="mini-kv-val">mov 2 [15]</span></span>',
        'Das Befehlsregister hält den Befehl, den die CPU gerade bearbeitet, samt den Werten, die dazugehören.'],
      config.sichtbar?.register !== false && ['<span class="mini-kv"><span class="mini-kv-key">Rechenwerk</span><span class="mini-kv-val">2 + 3 = 5 → A</span></span>',
        'Das Rechenwerk führt Rechnungen und Vergleiche aus. Hier steht, was gerade gerechnet wird.'],
      config.sichtbar?.register !== false && ['<span class="mini-zellen"><span class="mini-zelle mini-zelle--name">A<br><span class="mini-zelle-wert">5</span></span><span class="mini-zelle mini-zelle--name">B<br><span class="mini-zelle-wert">0</span></span></span>',
        'Register sind Zwischenspeicher. Hier siehst du, welche Werte sie gerade halten.'],
      config.sichtbar?.flag !== false && ['<span class="mini-zellen"><span class="mini-zelle mini-zelle--name">Flag<br><span class="mini-zelle-wert">1</span></span></span>',
        'Das Flag zeigt das Ergebnis des letzten Vergleichs.'],
      ['<span class="mini-zellen"><span class="mini-zelle">(D1)<br><span class="mini-zelle-wert">2</span></span><span class="mini-zelle">(D2)<br><span class="mini-zelle-wert">5</span></span></span>',
        'Im Datenspeicher stehen die Werte deiner Variablen. Fächer, die gerade gelesen oder beschrieben werden, leuchten auf.'],
      ['<span class="mini-knopf">Zurücksetzen</span>',
        '„Zurücksetzen“ entlädt das Programm und beginnt die Übung von vorn.'],
    ].filter(Boolean)),
  }),
};

// hilfe einer phase nach name (lexik, syntax, semantik, codegen, laufzeit)
// compiler-weg übersetzt dafür die phasennummer (1 quellcode, 2 lexik, …) in den namen
export function hilfeFuerPhase(phase, config = {}) {
  const h = HILFE[phase];
  const hilfe = typeof h === 'function' ? h(config) : h;
  // config.schrittweise: zeile "schritt vormachen" in phasen 2 bis 5 (das laufzeitsystem hat eine eigene steuerung)
  // steht zuletzt, wie der knopf in der leiste
  const schritt = config.schrittweise && SCHRITT[phase];
  if (!schritt) return hilfe;
  // config.nachFehler (kapitel 2 bis 5): knopf erscheint erst, wenn der spieler nicht weiterkommt
  const text = schritt + (config.nachFehler ? ' Der Knopf erscheint, wenn du nicht weiterkommst.' : '');
  const zeilen = [['<span class="mini-knopf">Schritt vormachen</span>', text]];
  // config.phaseLoesen (nur 6.2): davor die zeile "phase lösen"
  if (config.phaseLoesen) {
    zeilen.unshift(['<span class="mini-knopf">Phase lösen</span>',
      '„Phase lösen“ erledigt die ganze Phase auf einmal. Liegt im Quellcode ein Fehler, hört er dort auf und meldet ihn.']);
  }
  return { ...hilfe, html: hilfe.html + hilfeZeilen(zeilen) };
}

// was "schritt vormachen" in der jeweiligen phase tut
const SCHRITT = {
  lexik: '„Schritt vormachen“ erledigt einen Schritt für dich und färbt das nächste Token richtig ein.',
  syntax: '„Schritt vormachen“ erledigt einen Schritt für dich und ordnet das nächste Token richtig im Baum ein. Gibt es keinen gültigen Zug mehr, meldet er den Syntaxfehler.',
  semantik: '„Schritt vormachen“ erledigt einen Schritt für dich und prüft den nächsten Knoten richtig. Liegt dort ein Fehler vor, meldet er ihn.',
  codegen: '„Schritt vormachen“ erledigt einen Schritt für dich und setzt den nächsten Baustein richtig.',
};

// aufgabe jeder phase in einem satz, in allen kapiteln gleich
// einzelphase zeigt sie links in der zeile mit den knöpfen
export const AUFGABE = {
  lexik: 'Färbe jedes Token in der Farbe seiner Gruppe und melde ggf. Fehler.',
  syntax: 'Baue den Syntaxbaum: Ziehe zum aktuellen Token das passende Sprachkonstrukt an die richtige Stelle, und melde ggf. Fehler.',
  semantik: 'Prüfe den Baum Knoten für Knoten und melde ggf. Fehler.',
  codegen: 'Übersetze den geprüften Code in Maschinencode: Setze für jeden Knoten die passenden Befehle.',
  laufzeit: 'Lade den Maschinencode in den Speicher und führe ihn aus.',
};

// hilfe der ersten phase von compiler-weg (quellcode eingeben)
// config.maxZeichen: längengrenze der eingabe, config.beispiel: beispielprogramm (ohne gibt es den knopf nicht)
export function hilfeQuelltext(config) {
  return {
    titel: 'Quellcode schreiben',
    html: hilfeZeilen([
      ['<span class="mini-papier">number x = 2;<br>moveUp(x);</span>',
        'Schreibe ein eigenes Programm in der Hochsprache. Es geht danach durch alle Phasen des Compilers bis zur Laufzeitumgebung, und du führst jede Phase selbst aus. Dein Programm darf höchstens ' + config.maxZeichen + ' Zeichen lang sein.'],
      config.beispiel && ['<span class="mini-knopf">Beispiel einfügen</span>',
        '„Beispiel einfügen“ schreibt ein fertiges Beispielprogramm in das Feld.'],
      ['<span class="mini-knopf mini-knopf--akzent">Zur lexikalischen Analyse</span>',
        'Startet die erste Phase mit deinem Programm.'],
      ['<span class="mini-phase">Quellcode</span><span class="mini-phase">Lexikalische Analyse</span>',
        'Oben stehen die Phasen. Zu jeder Phase, die du schon erreicht hast, kannst du zurückspringen. Mit einem neuen Quellcode beginnst du wieder bei der lexikalischen Analyse.'],
    ].filter(Boolean)),
  };
}

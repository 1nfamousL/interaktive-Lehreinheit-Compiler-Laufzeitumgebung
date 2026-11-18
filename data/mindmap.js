// begriffe der mindmap "zusammenspiel von compiler und laufzeitumgebung"
//
// jeder begriff hat:
//   key: stabiler, eindeutiger schlüssel (ändert sich nie), auf ihn bezieht sich die freischaltung und der speicher der gesehenen begriffe
//   label: angezeigter text, genau so, wie er in der karte steht
//   slide: folie, auf der der begriff zum ersten mal vorkommt oder erklärt wird: "<lektions-id>/<folien-id>", z. b. '2-2/s3'
//   children: optional, unterbegriffe
// slide sind die ids aus data/lektionen/, nicht die positionen ("folie 3"), die ids sind nicht fortlaufend
// kommt ein begriff an mehreren stellen vor, steht hier die früheste, sonst erschiene er zu spät
// der begriff schaltet sich frei, sobald diese folie besucht wurde
// side: 'left' oder 'right' der wurzel, order: reihenfolge von oben nach unten auf dieser seite
// wird eine folie umnummeriert oder gelöscht, zeigt der verweis ins leere, pruefeBegriffe() meldet das beim start in der konsole

export const BEGRIFFE = {
  title: ['Zusammenspiel von', 'Compiler & Laufzeitumgebung'],
  branches: [
    {side:'left',order:1,term:
      {key:'rechner-hardware',label:'Hardware',slide:'1-1/s2',children:[
        {key:'cpu',label:'CPU',slide:'1-2/s1',children:[
          {key:'befehlszyklus',label:'Befehlszyklus',slide:'1-2/s2',children:[
            {key:'befehl-holen',label:'Befehl holen',slide:'1-2/s2'},
            {key:'dekodieren',label:'dekodieren',slide:'1-2/s2'},
            {key:'ausfuehren',label:'ausführen',slide:'1-2/s2'}
          ]},
          {key:'befehlszaehler',label:'Befehlszähler',slide:'1-2/s7'},
          {key:'befehlsregister',label:'Befehlsregister',slide:'1-2/s7'},
          {key:'register',label:'Register',slide:'3-5/s1'},
          {key:'rechenwerk',label:'Rechenwerk',slide:'3-6/s1'},
          {key:'flag',label:'Flag',slide:'4-5/s1'}
        ]},
        {key:'speicher',label:'Speicher',slide:'1-2/s1',children:[
          {key:'bit-byte',label:'Bit, Byte',slide:'1-2/s3'},
          {key:'adresse',label:'Adresse',slide:'1-2/s4'},
          {key:'fach',label:'Fach',slide:'1-2/s6'},
          {key:'programmspeicher',label:'Programmspeicher',slide:'1-2/s6'},
          {key:'datenspeicher',label:'Datenspeicher',slide:'1-2/s6'}
        ]}
      ]}},
    {side:'left',order:0,term:
      {key:'programmiersprache',label:'Programmiersprache',slide:'1-1/s1',children:[
        {key:'machen-sachen',label:'Machen / Sachen',slide:'1-1/s1',children:[
          {key:'befehl',label:'Befehl',slide:'1-1/s1'},
          {key:'daten',label:'Daten',slide:'1-1/s1'}
        ]},
        {key:'maschinensprache',label:'Maschinensprache',slide:'1-3/s1',children:[
          {key:'maschinencode',label:'Maschinencode',slide:'1-3/s3'},
          {key:'befehlssatz',label:'Befehlssatz',slide:'2-5/s1',children:[
            {key:'bewegungsbefehl',label:'Bewegungsbefehl',slide:'1-1/s3'},
            {key:'datentransferbefehl',label:'Datentransferbefehl',slide:'1-2/s5'},
            {key:'endbefehl',label:'Endbefehl',slide:'1-2/s7'},
            {key:'rechenbefehl',label:'Rechenbefehl',slide:'3-5/s2'},
            {key:'vergleichsbefehl',label:'Vergleichsbefehl',slide:'4-5/s1'},
            {key:'sprungbefehl',label:'Sprungbefehl',slide:'4-5/s1'}
          ]}
        ]},
        {key:'hochsprache',label:'Hochsprache',slide:'1-3/s1',children:[
          {key:'quellcode',label:'Quellcode',slide:'1-3/s3'},
          {key:'anweisung',label:'Anweisung',slide:'1-3/s2',children:[
            {key:'deklaration',label:'Deklaration',slide:'1-3/s2',children:[
              {key:'konstante',label:'Konstante',slide:'1-3/s2'},
              {key:'variable',label:'Variable',slide:'3-1/s1'}
            ]},
            {key:'zuweisung',label:'Zuweisung',slide:'3-1/s1'},
            {key:'bewegungsanweisung',label:'Bewegungsanweisung',slide:'1-3/s2'},
            {key:'if-anweisung',label:'if-Anweisung',slide:'4-1/s4',children:[
              {key:'bedingung',label:'Bedingung',slide:'4-1/s1'}
            ]},
            {key:'while-anweisung',label:'while-Anweisung',slide:'5-1/s2',children:[
              {key:'schleife',label:'Schleife',slide:'5-1/s1'},
              {key:'rumpf',label:'Rumpf',slide:'5-1/s2'},
              {key:'schleifenzaehler',label:'Schleifenzähler',slide:'5-1/s2'}
            ]}
          ]},
          {key:'block',label:'Block',slide:'4-1/s4',children:[
            {key:'gueltigkeitsbereich',label:'Gültigkeitsbereich',slide:'4-1/s4'}
          ]},
          {key:'ausdruck',label:'Ausdruck',slide:'2-3/s2',children:[
            {key:'vergleich',label:'Vergleich',slide:'4-1/s1'}
          ]},
          {key:'datentyp',label:'Datentyp',slide:'2-4/s2',children:[
            {key:'wertebereich-0-bis-255',label:'Wertebereich 0 bis 255',slide:'2-4/s2'},
            {key:'wahrheitswert-boolean',label:'Wahrheitswert / boolean',slide:'4-1/s2'}
          ]}
        ]}
      ]}},
    {side:'right',order:0,term:
      {key:'compiler-uebersetzer',label:'Compiler / Übersetzer',slide:'1-3/s2',children:[
        {key:'wege-aot-jit',label:'AOT / JIT',slide:'1-3/s5',children:[
          {key:'bytecode',label:'Bytecode',slide:'1-3/s5'},
          {key:'zwischensprache',label:'Zwischensprache',slide:'1-3/s5'},
          {key:'virtuelle-maschine',label:'Virtuelle Maschine',slide:'1-3/s5'}
        ]},
        {key:'lexikalische-analyse-woerter',label:'Lexikalische Analyse',slide:'2-1/s2',children:[
          {key:'scanner',label:'Scanner',slide:'2-2/s1'},
          {key:'lexikalischer-fehler',label:'Lexikalischer Fehler',slide:'2-2/s6'},
          {key:'token',label:'Token',slide:'2-2/s1',children:[
            {key:'tokencode',label:'Tokencode',slide:'2-2/s2'},
            {key:'schluesselwort',label:'Schlüsselwort',slide:'2-2/s3'},
            {key:'operator',label:'Operator',slide:'2-2/s3'},
            {key:'gliederungszeichen',label:'Gliederungszeichen',slide:'2-2/s3'},
            {key:'bezeichner',label:'Bezeichner',slide:'2-2/s4'},
            {key:'literal',label:'Literal',slide:'2-2/s5'}
          ]}
        ]},
        {key:'syntaxanalyse-satzbau',label:'Syntaxanalyse',slide:'2-1/s2',children:[
          {key:'parser',label:'Parser',slide:'2-3/s1'},
          {key:'grammatik',label:'Grammatik',slide:'2-3/s2'},
          {key:'syntaxbaum',label:'Syntaxbaum',slide:'2-3/s3'},
          {key:'syntaxfehler',label:'Syntaxfehler',slide:'2-3/s4'}
        ]},
        {key:'semantische-analyse-bedeutung',label:'Semantische Analyse',slide:'2-1/s2',children:[
          {key:'symboltabelle',label:'Symboltabelle',slide:'2-4/s3'},
          {key:'abstrakter-syntaxbaum',label:'Abstrakter Syntaxbaum',slide:'2-4/s5'},
          {key:'fehler',label:'Fehler',slide:'2-4/s4',children:[
            {key:'nicht-deklariert',label:'Nicht deklariert',slide:'2-4/s4'},
            {key:'doppelt-deklariert',label:'Doppelt deklariert',slide:'2-4/s4'},
            {key:'zahl-ueber-255',label:'Zahl über 255',slide:'2-4/s4'},
            {key:'typfehler',label:'Typfehler',slide:'4-4/s3'}
          ]}
        ]},
        {key:'codegenerierung',label:'Codegenerierung',slide:'2-1/s2',children:[
          {key:'relative-adressen',label:'Relative Adressen',slide:'2-5/s2',children:[
            {key:'datenzellen',label:'Datenzellen',slide:'2-5/s1'},
            {key:'zeilen',label:'Zeilen',slide:'2-5/s2'}
          ]},
          {key:'umgekehrter-operator',label:'Umgekehrter Operator',slide:'4-5/s2'},
          {key:'ruecksprung',label:'Rücksprung',slide:'5-5/s1'}
        ]}
      ]}},
    {side:'right',order:1,term:
      {key:'laufzeitsystem',label:'Laufzeitumgebung',slide:'1-2/s7',children:[
        {key:'laufzeit',label:'Laufzeit',slide:'2-6/s1'},
        {key:'lader',label:'Lader',slide:'2-6/s2',children:[
          {key:'ladefehler',label:'Ladefehler',slide:'2-6/s3'}
        ]},
        {key:'laufzeitfehler',label:'Laufzeitfehler',slide:'2-6/s5',children:[
          {key:'hindernis',label:'Hindernis',slide:'2-6/s7'},
          {key:'ueberlauf-unterlauf',label:'Überlauf / Unterlauf',slide:'3-6/s2'},
          {key:'division-durch-0',label:'Division durch 0',slide:'3-6/s2'},
          {key:'endlosschleife',label:'Endlosschleife',slide:'5-6/s3'}
        ]}
      ]}}
  ]
};

// "2-2/s3" → { lektion: '2-2', folie: 's3' }
export function folieVon(begriff) {
  const [lektion, folie] = String(begriff.slide || '').split('/');
  return { lektion, folie };
}

// alle begriffe als flache liste, eltern vor kindern
export function alleBegriffe(daten = BEGRIFFE) {
  const liste = [];
  const geh = (t) => { liste.push(t); (t.children || []).forEach(geh); };
  daten.branches.forEach((b) => geh(b.term));
  return liste;
}

// gleicht jeden folienverweis mit den lektionen ab und meldet fehler in der konsole (doppelte schlüssel, fehlender verweis, lektion oder folie gibt es nicht)
// es gibt keine tests, deshalb läuft das einmal beim start, die meldungen werden auch zurückgegeben
export function pruefeBegriffe(lektionen, daten = BEGRIFFE) {
  const probleme = [];
  const schluessel = new Set();
  alleBegriffe(daten).forEach((t) => {
    if (schluessel.has(t.key)) probleme.push(`Mindmap: Schlüssel "${t.key}" kommt doppelt vor`);
    schluessel.add(t.key);
    const { lektion, folie } = folieVon(t);
    if (!lektion || !folie) probleme.push(`Mindmap: "${t.key}" hat keinen Folienverweis (slide: '<Lektion>/<Folie>')`);
    else if (!lektionen[lektion]) probleme.push(`Mindmap: "${t.key}" verweist auf die unbekannte Lektion ${lektion}`);
    else if (!lektionen[lektion].slides.some((s) => s.id === folie)) {
      probleme.push(`Mindmap: "${t.key}" verweist auf die Folie ${lektion}/${folie}, die es nicht gibt`);
    }
  });
  probleme.forEach((p) => console.error(p));
  return probleme;
}

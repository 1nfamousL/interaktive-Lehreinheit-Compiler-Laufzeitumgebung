// inhalt des quiz "ordne zu": die phasen als kette von blöcken und die karten, die der spieler einsortiert
// nur daten, kein verhalten
//
// drei arten von karten:
//   aufgabe: gehört in den block der phase, die das tut { ziel, text, warum, hinweis? }
//   fehler: codezeile mit kurzer fehlerart, gehört in den block der phase, die sie als erste ablehnt { ziel, etikett, text, warum }
//   ergebnis: das, was zwischen zwei blöcken wandert (ausgabe des linken und eingabe des rechten), gehört in die lücke an dieser stelle { platz, text, zusatz?, warum }
// jede karte hat ein "kapitel" (2 bis 5): das kapitel, in dem sie zum ersten mal gefragt wird
// das ist nie früher, als die lektionen das thema lehren, darf aber später sein (zum beispiel, damit kapitel 2 nicht zu voll wird)
// die wiederholung am ende von kapitel n zeigt alle karten bis n, lektion 6.1 alle
//
// die plätze für eingabe / ausgabe (platz 0 bis 5) liegen in einer eigenen zeile über den lücken: platz 0 vor dem ersten block (eingabe des compilers), platz k zwischen ZIELE[k - 1] und ZIELE[k], platz 5 hinter dem letzten block
// der quellcode ist kein block, weil er keine aufgabe hat, die man zuordnen könnte, er ist die eingabe an platz 0

// die fünf blöcke von links nach rechts
// gruppe: zu welcher klammer (GRUPPEN) der block gehört
// ablehnen: hinweis, wenn der spieler hier eine zeile als "abgelehnt" ablegt, obwohl der block nie etwas ablehnt
export const ZIELE = [
  { id: 'lexik', titel: 'Lexikalische Analyse', gruppe: 'compiler' },
  { id: 'syntax', titel: 'Syntaxanalyse', gruppe: 'compiler' },
  { id: 'semantik', titel: 'Semantische Analyse', gruppe: 'compiler' },
  { id: 'codegen', titel: 'Codegenerierung', gruppe: 'compiler',
    ablehnen: 'Die Codegenerierung lehnt nichts ab. Sie übersetzt, was bis hierher durchgekommen ist, denn das ist schon geprüft.' },
  { id: 'laufzeit', titel: 'Laden und Ausführen', gruppe: 'laufzeit' },
];

// klammern über den blöcken, farbe: name der farbrolle (--compile, --run, wie im titel des hauptmenüs)
export const GRUPPEN = {
  compiler: { titel: 'Compiler', zusatz: 'Übersetzungszeit', farbe: 'compile' },
  laufzeit: { titel: 'Laufzeitumgebung', zusatz: 'Laufzeit', farbe: 'run' },
};

export const KARTEN = [
  // ===== eingabe / ausgabe zwischen den blöcken (alle ab kapitel 2, dort kommen alle phasen vor) =====
  { id: 'e0', art: 'ergebnis', kapitel: 2, platz: 0, text: 'Quellcode',
    warum: 'Der Quellcode ist das, was ein Mensch schreibt und der Compiler als Eingabe bekommt.' },
  { id: 'e1', art: 'ergebnis', kapitel: 2, platz: 1, text: 'Tokens',
    warum: 'Die lexikalische Analyse liefert Tokens, die Syntaxanalyse bekommt sie.' },
  { id: 'e2', art: 'ergebnis', kapitel: 2, platz: 2, text: 'Syntaxbaum',
    warum: 'Die Syntaxanalyse baut aus den Tokens einen Baum, die semantische Analyse prüft ihn.' },
  { id: 'e3', art: 'ergebnis', kapitel: 2, platz: 3, text: 'geprüfter Baum',
    warum: 'Die semantische Analyse gibt den geprüften Baum weiter, aus ihm erzeugt die Codegenerierung den Maschinencode.' },
  { id: 'e4', art: 'ergebnis', kapitel: 2, platz: 4, text: 'Maschinencode',
    warum: 'Das ist die Übergabe: Der Compiler liefert Maschinencode mit relativen Adressen, die Laufzeitumgebung lädt ihn.' },
  { id: 'e5', art: 'ergebnis', kapitel: 2, platz: 5, text: 'laufendes Programm',
    warum: 'Am Ende kommt ein laufendes Programm heraus: Der Roboter bewegt sich.' },

  // ===== aufgaben der phasen =====
  // lexikalische analyse
  { id: 'l1', art: 'aufgabe', kapitel: 2, ziel: 'lexik', text: 'Text in Tokens zerlegen',
    warum: 'Der Scanner liest den Text Zeichen für Zeichen und schneidet die Tokens heraus.' },
  { id: 'l2', art: 'aufgabe', kapitel: 3, ziel: 'lexik', text: 'Leerzeichen und Zeilenumbrüche verwerfen',
    warum: 'Leerzeichen und Zeilenumbrüche trennen die Wörter, sind aber selbst keine Tokens.' },
  { id: 'l3', art: 'aufgabe', kapitel: 4, ziel: 'lexik', text: 'Tokens einer Tokengruppe zuordnen',
    warum: 'Schlüsselwort, Bezeichner, Literal, Operator, Gliederungszeichen: Jedes Token gehört zu einer Tokengruppe.' },
  { id: 'l4', art: 'aufgabe', kapitel: 4, ziel: 'lexik', text: 'Das längste passende Token lesen',
    warum: '<= ist ein Token und nicht < und =. Der Scanner liest immer das längste Token, das passt.' },

  // syntaxanalyse
  { id: 's1', art: 'aufgabe', kapitel: 4, ziel: 'syntax', text: 'Prüfen, ob die Tokens zur Grammatik passen',
    warum: 'Der Parser prüft, ob die Tokens in einer Reihenfolge stehen, die die Grammatik erlaubt.' },
  { id: 's2', art: 'aufgabe', kapitel: 2, ziel: 'syntax', text: 'Den Syntaxbaum aufbauen',
    warum: 'Aus den Tokens entsteht ein Baum: oben das Programm, unten die Tokens.' },
  { id: 's3', art: 'aufgabe', kapitel: 3, ziel: 'syntax', text: 'Tokens zu Anweisungen und Ausdrücken zusammenfassen',
    warum: 'Der Parser fasst Tokens zu Sprachkonstrukten zusammen, etwa zu einer Zuweisung oder einer Rechnung.' },
  { id: 's4', art: 'aufgabe', kapitel: 4, ziel: 'syntax', text: 'Tokens zwischen { und } zu einem Block zusammenfassen',
    warum: 'Ob zu einem if ein Block mit { und } gehört, ist eine Frage des Satzbaus. Das prüft der Parser.' },

  // semantische analyse
  { id: 'm1', art: 'aufgabe', kapitel: 2, ziel: 'semantik', text: 'Namen in der Symboltabelle eintragen und nachschlagen',
    warum: 'Jede Deklaration trägt Name und Typ in die Symboltabelle ein. Wo ein Name benutzt wird, schlägt die Semantik ihn nach: Er muss deklariert sein, und sein Typ steht dort.' },
  { id: 'm3', art: 'aufgabe', kapitel: 3, ziel: 'semantik', text: 'Zahlen im Quellcode auf 0 bis 255 prüfen',
    warum: 'Die Grammatik sieht nur „eine Zahl“. Ob der Wert erlaubt ist, wird erst hier geprüft.' },
  { id: 'm4', art: 'aufgabe', kapitel: 4, ziel: 'semantik', text: 'Typen prüfen',
    warum: 'Rechnen braucht number, eine Bedingung braucht boolean. Das prüft die Semantik, die Grammatik kennt keine Typen.' },
  { id: 'm5', art: 'aufgabe', kapitel: 5, ziel: 'semantik', text: 'Gültigkeitsbereich eines Blocks verwalten',
    warum: 'Jeder Block bekommt in der Symboltabelle einen eigenen Bereich. Namen aus dem Block sind außerhalb nicht sichtbar.' },

  // codegenerierung
  { id: 'c1', art: 'aufgabe', kapitel: 2, ziel: 'codegen', text: 'Baum in Maschinenbefehle übersetzen',
    warum: 'Der Compiler geht den Baum durch und erzeugt für jeden Teil Befehle nach einem festen Muster.' },
  { id: 'c2', art: 'aufgabe', kapitel: 4, ziel: 'codegen', text: 'Relative Adressen (D1), (Z1) vergeben',
    warum: 'Der Compiler kennt die echten Adressen nicht. Er schreibt (D1) für Daten und (Z1) für Zeilen, die echten Adressen kennt erst die Laufzeitumgebung.' },
  { id: 'c3', art: 'aufgabe', kapitel: 3, ziel: 'codegen', text: 'Befehl end ans Ende des Maschinencodes schreiben',
    warum: 'Ohne end liefe die CPU hinter den letzten Befehl.' },
  { id: 'c4', art: 'aufgabe', kapitel: 3, ziel: 'codegen', text: 'Ladebefehle für die Register erzeugen',
    warum: 'Gerechnet wird in den Registern A und B. Der Compiler erzeugt Befehle, die die Werte aus dem Datenspeicher dorthin laden, rechnen und das Ergebnis zurückschreiben.' },
  { id: 'c5', art: 'aufgabe', kapitel: 4, ziel: 'codegen', text: 'Vergleichsbefehl mit umgekehrtem Operator erzeugen',
    warum: 'Aus if (a > 2) wird ein Vergleich a <= 2 mit einem Sprung hinter den Block: Trifft der umgekehrte Vergleich zu, wird der Block übersprungen.' },
  { id: 'c6', art: 'aufgabe', kapitel: 5, ziel: 'codegen', text: 'Sprungbefehl hinter dem Block erzeugen',
    warum: 'Aus if oder while wird der Befehl jif, der bei gesetztem Flag hinter den Block springt.' },
  { id: 'c7', art: 'aufgabe', kapitel: 5, ziel: 'codegen', text: 'Sprungbefehl zurück zur Bedingung erzeugen',
    warum: 'Am Ende des Rumpfes springt ein jmp zurück zur Bedingung. So wird derselbe Code wiederholt.' },

  // laden und ausführen
  { id: 'r1', art: 'aufgabe', kapitel: 2, ziel: 'laufzeit', text: 'Programm laden, Adressen umrechnen',
    warum: 'Der Lader legt das Programm in den Speicher und macht aus (D1) und (Z1) echte Adressen.' },
  { id: 'r3', art: 'aufgabe', kapitel: 2, ziel: 'laufzeit', text: 'Befehle holen, dekodieren, ausführen',
    warum: 'Die CPU arbeitet das Programm Befehl für Befehl ab, der Befehlszähler läuft mit.' },
  { id: 'r2', art: 'aufgabe', kapitel: 3, ziel: 'laufzeit', text: 'Zu großes Programm beim Laden ablehnen',
    warum: 'Wie groß der Speicher ist, weiß nur die Maschine. Der Compiler sieht das nicht, deshalb fällt es erst beim Laden auf.' },
  { id: 'r4', art: 'aufgabe', kapitel: 3, ziel: 'laufzeit', text: 'Ergebnisse von Rechnungen auf Überlauf und Division durch 0 prüfen',
    warum: 'Das Rechenwerk rechnet mit den Registern und meldet, wenn ein Ergebnis über 255 oder unter 0 liegt oder durch 0 geteilt wird.' },
  { id: 'r5', art: 'aufgabe', kapitel: 4, ziel: 'laufzeit', text: 'Flag setzen und Sprünge ausführen',
    warum: 'Ein Vergleichsbefehl setzt das Flag, jif und jmp setzen den Befehlszähler neu. Dabei werden Fächer übersprungen.' },
  { id: 'r6', art: 'aufgabe', kapitel: 5, ziel: 'laufzeit', text: 'Endlosschleife erkennen und anhalten',
    warum: 'Sieht die Laufzeitumgebung denselben Zustand ein drittes Mal, kommt das Programm nie zum Ende. Dann hält es an.' },

  // ===== codezeilen mit fehlern =====
  // ziel: die phase, die die zeile als erste ablehnt, jede zeile ist für sich vollständig und besteht alle phasen vor der richtigen
  // etikett: kurz, was an der zeile falsch ist, es nennt nie die phase
  // zeilen ohne fehler gibt es bewusst noch nicht (ein block "kein fehler" wäre möglich)
  { id: 'f1', art: 'fehler', kapitel: 2, ziel: 'lexik', etikett: 'Zeichen unbekannt', text: 'moveRight(1)%',
    warum: 'Das Zeichen % gehört zu keiner Tokengruppe. Schon der Scanner meldet es.' },
  { id: 'f2', art: 'fehler', kapitel: 2, ziel: 'syntax', etikett: 'Klammer fehlt', text: 'moveRight(1;',
    warum: 'Jedes Token ist gültig, aber die schließende Klammer fehlt. Das fällt erst dem Parser auf.' },
  { id: 'f3', art: 'fehler', kapitel: 2, ziel: 'semantik', etikett: 'Nicht deklariert', text: 'moveUp(hoch);',
    warum: 'Der Name hoch wurde nie deklariert, die Symboltabelle kennt ihn nicht.' },
  { id: 'f5', art: 'fehler', kapitel: 2, ziel: 'laufzeit', etikett: 'Zu weit gefahren', text: 'moveRight(99);',
    warum: 'Der Compiler hat nichts auszusetzen, 99 ist eine gültige Zahl. Dass der Roboter dabei gegen ein Hindernis fährt (hier die Wand um das Spielfeld), zeigt sich erst beim Fahren.' },

  { id: 'f7', art: 'fehler', kapitel: 3, ziel: 'syntax', etikett: 'Wert fehlt', text: 'number a = 1 +;',
    warum: 'Nach dem + fehlt der zweite Wert. Die Wörter sind alle gültig, nur der Satzbau stimmt nicht.' },
  { id: 'f4', art: 'fehler', kapitel: 3, ziel: 'semantik', etikett: 'Doppelt deklariert', text: 'number a = 1; number a = 2;',
    warum: 'Der Aufbau ist gültig, aber der Name a ist schon vergeben. Das weiß nur die Symboltabelle.' },
  { id: 'f8', art: 'fehler', kapitel: 3, ziel: 'semantik', etikett: 'Zahl über 255', text: 'number a = 300;',
    warum: 'Wörter und Aufbau stimmen, aber 300 liegt außerhalb von 0 bis 255. Eine Zahl im Quellcode prüft die Semantik.' },
  { id: 'f9', art: 'fehler', kapitel: 3, ziel: 'laufzeit', etikett: 'Ergebnis zu groß', text: 'number a = 200 + 100;',
    warum: 'Beide Zahlen sind gültig. Das Ergebnis 300 entsteht erst bei der Ausführung, dort meldet die Laufzeitumgebung den Überlauf.' },
  { id: 'f10', art: 'fehler', kapitel: 3, ziel: 'laufzeit', etikett: 'Durch 0 geteilt', text: 'number a = 6 / 0;',
    warum: 'Der Compiler hat an Wörtern, Aufbau und Typen nichts auszusetzen. Dass durch 0 geteilt wird, zeigt sich erst bei der Ausführung.' },

  { id: 'f12', art: 'fehler', kapitel: 4, ziel: 'lexik', etikett: 'Einzelnes !', text: 'if (a ! 2) { }',
    warum: 'Ein ! allein ist kein Token, nur != ist eines. Der Scanner meldet es, bevor der Parser etwas sieht.' },
  { id: 'f13', art: 'fehler', kapitel: 4, ziel: 'syntax', etikett: 'Schließende Klammer fehlt', text: 'if (a > 2) { moveUp(1);',
    warum: 'Jedes Token ist gültig, aber der Block wird geöffnet und nie geschlossen. Nach der Anweisung erwartet der Parser eine weitere Anweisung oder die schließende Klammer.' },
  { id: 'f14', art: 'fehler', kapitel: 4, ziel: 'syntax', etikett: 'Block fehlt', text: 'if (a > 2) moveUp(1);',
    warum: 'Nach der Bedingung muss ein Block mit { und } stehen. Das ist eine Frage des Satzbaus.' },
  { id: 'f15', art: 'fehler', kapitel: 4, ziel: 'semantik', etikett: 'Typfehler', text: 'if (3) { }',
    warum: 'Der Aufbau ist gültig, aber eine Bedingung muss ein boolean sein. Eine Zahl ist ein Typfehler.' },

  { id: 'f16', art: 'fehler', kapitel: 5, ziel: 'syntax', etikett: 'Klammern fehlen', text: 'while n > 0 { }',
    warum: 'Die Bedingung der Schleife steht in runden Klammern. Ohne sie passt keine Regel der Grammatik.' },
  { id: 'f18', art: 'fehler', kapitel: 5, ziel: 'semantik', etikett: 'Typfehler', text: 'while (3) { }',
    warum: 'Der Aufbau ist gültig, aber auch die Bedingung einer Schleife muss ein boolean sein. Eine Zahl ist ein Typfehler.' },
  { id: 'f17', art: 'fehler', kapitel: 5, ziel: 'laufzeit', etikett: 'Schleife endet nie', text: 'while (3 > 0) { }',
    warum: 'Der Compiler findet nichts auszusetzen. Dass die Schleife nie endet, merkt erst die Laufzeitumgebung, weil sie immer denselben Zustand sieht.' },
];

// die karten, die in der wiederholung am ende von kapitel n gezeigt werden (alle bis dahin) und davon die, die in diesem kapitel neu dazukommen
// lektion 6.1 nimmt alle karten
export const kartenBis = (kapitel) => KARTEN.filter((k) => k.kapitel <= kapitel);
export const kartenNeuIn = (kapitel) => KARTEN.filter((k) => k.kapitel === kapitel);

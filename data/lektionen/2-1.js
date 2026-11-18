export const LEKTION = {
  id: '2-1',
  title: '2.1 Die 5 Phasen',
  desc: 'Der Weg vom Quellcode zum laufenden Programm in fünf Phasen.',
  slides: [
    {
      id: 's1',
      title: 'Sprachen haben Regeln',
      render: (container) => {
        container.innerHTML = `
          <div class="slide-centered slide-lesbar">
            <p>Gesprochene Sprachen und Programmiersprachen folgen festen Regeln. Ein Compiler übersetzt ein Programm nicht einfach, er prüft es vorher auf mehreren Ebenen. Das funktioniert ähnlich wie bei einem Satz im Deutschen.</p>
            <p><strong>Wörter:</strong> Gehört das Wort zur Sprache? „Haus“ ist ein deutsches Wort, „Hasu“ nicht.</p>
            <p><strong>Satzbau:</strong> Stehen die Wörter in einer erlaubten Reihenfolge? „Der Hund jagt die Katze“ ist ein gültiger Satz, „Jagt Katze der die Hund“ nicht.</p>
            <p><strong>Bedeutung:</strong> Ergibt der Satz Sinn? „Der Stein trinkt Kaffee“ ist richtig gebaut, aber unsinnig.</p>
            <p>Besteht das Programm alle drei Prüfungen, übersetzt der Compiler es in die Sprache, die der Computer ausführen kann.</p>
          </div>
        `;
      },
    },
    {
      id: 's2',
      title: 'Die fünf Phasen',
      render: (container) => {
        container.innerHTML = `
          <div class="slide-centered slide-lesbar">
            <p>Der Weg vom Quellcode zum laufenden Programm besteht aus fünf Phasen. Die ersten vier gehören zum Compiler und laufen zur Übersetzungszeit, die fünfte übernimmt die Laufzeitumgebung zur Laufzeit. Jede Phase baut auf dem Ergebnis der vorherigen auf.</p>
            <p><strong>1. Lexikalische Analyse:</strong> Sie prüft, ob das Programm nur Wörter und Zeichen enthält, die zur Sprache gehören.</p>
            <p><strong>2. Syntaxanalyse:</strong> Sie prüft, ob die Wörter in einer Reihenfolge stehen, die die Grammatik erlaubt.</p>
            <p><strong>3. Semantische Analyse:</strong> Sie prüft, ob das Programm Sinn ergibt, zum Beispiel ob jede verwendete Konstante vorher angelegt wurde und die Typen zusammenpassen.</p>
            <p><strong>4. Codegenerierung:</strong> Sie übersetzt das geprüfte Programm in Maschinencode, den der Computer ausführen kann.</p>
            <p><strong>5. Laden und Ausführen:</strong> Die Laufzeitumgebung lädt den übersetzten Code in den Speicher und führt ihn aus.</p>
            <p>Im Folgenden durchlaufen wir alle fünf Phasen mit unserem Beispielcode aus Kapitel 1.</p>
          </div>
        `;
      },
    },
  ],
};

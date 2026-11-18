import { render as renderDragDropDiagram } from '../../js/exercises/drag-drop-diagram.js';

const UEBERSETZUNGS_DIAGRAMM = `
  <svg class="dd-diagram" viewBox="19 11 932 359" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Zwei Wege vom Quellcode zu den Robotern, AOT direkt in Maschinencode und JIT über Bytecode und virtuelle Maschinen. Begriffe müssen den richtigen Feldern zugeordnet werden">
    <defs>
      <marker id="dd-arrow" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
        <path class="dd-arrow-head" d="M 0 0 L 10 5 L 0 10 z" />
      </marker>
    </defs>

    <rect class="dd-phase-box" x="20" y="12" width="150" height="40" rx="8"/>
    <text class="dd-phase-label" x="95" y="32" text-anchor="middle">Entwicklung</text>

    <rect class="dd-phase-box" x="186" y="12" width="382" height="40" rx="8"/>
    <text class="dd-phase-label" x="377" y="32" text-anchor="middle">Kompilierung</text>

    <rect class="dd-phase-box" x="584" y="12" width="366" height="40" rx="8"/>
    <text class="dd-phase-label" x="767" y="32" text-anchor="middle">Ausführung</text>

    <text class="dd-pfad-label" x="210" y="84"><tspan class="dd-pfad-name">AOT:</tspan> direkter Weg, nur für diesen Roboter übersetzt</text>
    <text class="dd-pfad-label" x="210" y="244"><tspan class="dd-pfad-name">JIT:</tspan> Weg über Zwischencode, einmal übersetzt und zur Laufzeit an die jeweilige Hardware angepasst</text>

    <path class="dd-edge" d="M 170 217 H 186"/>
    <path class="dd-edge" d="M 186 122 V 312"/>
    <path class="dd-edge" marker-end="url(#dd-arrow)" d="M 186 122 H 208"/>
    <path class="dd-edge" marker-end="url(#dd-arrow)" d="M 186 312 H 208"/>
    <path class="dd-edge" marker-end="url(#dd-arrow)" d="M 360 122 H 392"/>
    <path class="dd-edge" marker-end="url(#dd-arrow)" d="M 544 122 H 798"/>
    <path class="dd-edge" marker-end="url(#dd-arrow)" d="M 360 312 H 392"/>
    <path class="dd-edge" d="M 544 312 H 580"/>
    <path class="dd-edge" d="M 580 277 V 347"/>
    <path class="dd-edge" marker-end="url(#dd-arrow)" d="M 580 277 H 607"/>
    <path class="dd-edge" marker-end="url(#dd-arrow)" d="M 580 347 H 607"/>
    <path class="dd-edge" marker-end="url(#dd-arrow)" d="M 759 277 H 798"/>
    <path class="dd-edge" marker-end="url(#dd-arrow)" d="M 759 347 H 798"/>

    <g class="dd-term-slot" data-target="quellcode">
      <rect class="dd-drop-zone-box" x="20" y="195" width="150" height="44" rx="8"/>
      <g class="dd-filled-box"></g>
    </g>
    <g class="dd-term-slot" data-target="compiler">
      <rect class="dd-drop-zone-box" x="210" y="100" width="150" height="44" rx="8"/>
      <g class="dd-filled-box"></g>
    </g>
    <g class="dd-term-slot" data-target="maschinencode">
      <rect class="dd-drop-zone-box" x="394" y="100" width="150" height="44" rx="8"/>
      <g class="dd-filled-box"></g>
    </g>
    <g class="dd-term-slot" data-target="mini-roboter">
      <rect class="dd-drop-zone-box" x="800" y="100" width="150" height="44" rx="8"/>
      <g class="dd-filled-box"></g>
    </g>
    <g class="dd-term-slot" data-target="compiler">
      <rect class="dd-drop-zone-box" x="210" y="290" width="150" height="44" rx="8"/>
      <g class="dd-filled-box"></g>
    </g>
    <g class="dd-term-slot" data-target="bytecode">
      <rect class="dd-drop-zone-box" x="394" y="290" width="150" height="44" rx="8"/>
      <g class="dd-filled-box"></g>
    </g>
    <g class="dd-term-slot" data-target="vm" data-zeile="oben">
      <rect class="dd-drop-zone-box" x="609" y="255" width="150" height="44" rx="8"/>
      <g class="dd-filled-box"></g>
    </g>
    <g class="dd-term-slot" data-target="roboter" data-zeile="oben">
      <rect class="dd-drop-zone-box" x="800" y="255" width="150" height="44" rx="8"/>
      <g class="dd-filled-box"></g>
    </g>
    <g class="dd-term-slot" data-target="vm" data-zeile="unten">
      <rect class="dd-drop-zone-box" x="609" y="325" width="150" height="44" rx="8"/>
      <g class="dd-filled-box"></g>
    </g>
    <g class="dd-term-slot" data-target="roboter" data-zeile="unten">
      <rect class="dd-drop-zone-box" x="800" y="325" width="150" height="44" rx="8"/>
      <g class="dd-filled-box"></g>
    </g>
  </svg>
`;

// Meldung, wenn VM und Roboter zusammenpassen würden, aber nicht in dieselbe Zeile gehören (siehe zeile).
const ZEILEN_MELDUNG = {
  text: 'VM und Roboter passen nicht zusammen.',
  hinweis: 'Zu jeder VM gehört genau ein Roboter, und beide stehen in derselben Zeile. Schau, was schon im Diagramm steht.',
};

// group: mehrere Begriffe mit derselben group dürfen in jedes Feld mit
// demselben data-target, die Reihenfolge untereinander ist beliebig.
// Ohne eigene Angabe ist die group gleich der id (exakter 1:1-Treffer).
// "Compiler" gibt es zweimal (AOT- und JIT-Weg), beide Karten sind gleich.
// zeile: VM und Roboter desselben Typs müssen in derselben Zeile stehen, welche
// der beiden JIT-Zeilen das ist, ist egal (siehe drag-drop-diagram.js).
const UEBERSETZUNGS_BEGRIFFE = [
  { id: 'quellcode', label: 'Quellcode',
    warum: 'Jeder Weg beginnt mit dem Programm als Text in der Hochsprache.',
    hinweis: 'Überlege, womit ein Weg beginnt, bevor irgendetwas übersetzt wurde.' },
  { id: 'compiler-aot', label: 'Compiler', group: 'compiler',
    warum: 'Auf beiden Wegen übersetzt ein Compiler den Quellcode, einmal direkt in Maschinencode, einmal in Bytecode.',
    hinweis: 'Ein Compiler ist ein Programm, das etwas übersetzt. Überlege, was er bekommt und was er abgibt.' },
  { id: 'compiler-jit', label: 'Compiler', group: 'compiler',
    warum: 'Auf beiden Wegen übersetzt ein Compiler den Quellcode, einmal direkt in Maschinencode, einmal in Bytecode.',
    hinweis: 'Ein Compiler ist ein Programm, das etwas übersetzt. Überlege, was er bekommt und was er abgibt.' },
  { id: 'maschinencode', label: 'Maschinencode',
    warum: 'Auf dem direkten Weg entsteht Code für genau diesen Roboter, seine Hardware führt ihn unmittelbar aus.',
    hinweis: 'Überlege, welches Ergebnis einer Übersetzung die Hardware ohne weiteren Schritt ausführen kann.' },
  { id: 'bytecode', label: 'Bytecode',
    warum: 'Bytecode ist ein Zwischencode, den keine Hardware direkt ausführt. Er ist für alle Roboter gleich.',
    hinweis: 'Überlege, welcher Weg einen Zwischencode erzeugt, der erst zur Laufzeit angepasst wird.' },
  { id: 'mini-roboter', label: 'Mini-Roboter',
    warum: 'Er bekommt den Maschinencode und führt ihn direkt aus, eine VM braucht er nicht.',
    hinweis: 'Überlege, welcher Roboter keine VM bekommt, weil der Code schon für ihn übersetzt ist.' },
  { id: 'vm-ketten', label: 'VM für Ketten', group: 'vm', zeile: 'ketten',
    warum: 'Die VM übersetzt den Bytecode beim Ausführen in Maschinencode für ihre Hardware, hier für Ketten.',
    hinweis: 'Überlege, was den Bytecode zur Laufzeit in Maschinencode für eine bestimmte Hardware umsetzt.' },
  { id: 'kettenroboter', label: 'Kettenroboter', group: 'roboter', zeile: 'ketten',
    warum: 'Er bekommt den Bytecode und die VM für seine Hardware, hier Ketten.',
    hinweis: 'Überlege, welcher Roboter zu den Ketten gehört.' },
  { id: 'vm-beine', label: 'VM für Beine', group: 'vm', zeile: 'beine',
    warum: 'Die VM übersetzt den Bytecode beim Ausführen in Maschinencode für ihre Hardware, hier für Beine.',
    hinweis: 'Überlege, was den Bytecode zur Laufzeit in Maschinencode für eine bestimmte Hardware umsetzt.' },
  { id: 'laufroboter', label: 'Laufroboter', group: 'roboter', zeile: 'beine',
    warum: 'Er bekommt den Bytecode und die VM für seine Hardware, hier Beine.',
    hinweis: 'Überlege, welcher Roboter zu den Beinen gehört.' },
];

export const LEKTION = {
  id: '1-3',
  title: '1.3 Grundlagen des Compilers',
  desc: 'Hochsprache, Compiler und Bytecode: der Weg vom Quellcode zum Roboter.',
  slides: [
    {
      id: 's1',
      title: 'Von Adressen zu Namen',
      render: (container) => {
        container.innerHTML = `
          <div class="slide-centered slide-lesbar">
            <p>Wir haben mit unserer Robotersprache eine Maschinensprache definiert. Sie bezieht sich direkt auf die Hardware des Roboters. Ein Programm in dieser Sprache liegt als Bitfolge im Programmspeicher und wird direkt von der Maschine ausgeführt. Für uns Programmierer ist sie aber umständlich.</p>
            <p>Wir müssen uns merken, an welcher Adresse welche Zahl steht. Was bedeutet <span class="lz-fach-inline lz-fach-adr">[08]</span>? Eigentlich ist uns egal, wo ein Wert gespeichert wird.</p>
            <p>Auch die Befehle sind nicht leicht zu lesen. Für den Roboter ist nur wichtig, dass sich die Bitfolgen unterscheiden. Die Namen wie <span class="cg-block cg-xfer cg-ohne-symbol cg-inline">mov</span> oder <span class="cg-block cg-move cg-ohne-symbol cg-inline">rgt</span> sind nur eine lesbare Schreibweise dieser Bitfolgen. Das hilft schon, sagt aber immer noch wenig darüber, was der Befehl tut.</p>
            <p>Deshalb führen wir eine zweite Sprache ein, eine sogenannte <strong>Hochsprache</strong>. Sie ist weiter von der Hardware entfernt und deshalb für Menschen leichter lesbar. Statt einer Adresse schreiben wir einen Namen, und auch die Befehle bekommen verständliche Namen.</p>
          </div>
        `;
      },
    },
    {
      id: 's2',
      title: 'Die Hochsprache: zwei Bausteine',
      render: (container) => {
        container.innerHTML = `
          <div class="slide-centered slide-lesbar">
            <p>Unsere Hochsprache hat zwei Bausteine. Sie entsprechen den beiden Teilen des Modells „Machen mit Sachen“:</p>
            <ul>
              <li>Eine <strong>Deklaration</strong> (Sachen) gibt einer Zahl einen Namen. Man sagt: Die Zahl wird deklariert. Sie besteht aus dem Wort „<span class="code-papier">number</span>“, dem Namen, einem „<span class="code-papier">=</span>“ und dem Wert, jede Anweisung endet mit einem Semikolon: <span class="code-papier">number schritte = 2;</span> Der Wert steht danach fest, eine solche benannte Zahl heißt <strong>Konstante</strong>.</li>
              <li>Eine <strong>Bewegungsanweisung</strong> (Machen) hat ein Klammerpaar, in das eine Zahl oder der Name einer deklarierten Zahl kommt: <span class="code-papier">moveRight(schritte);</span> oder <span class="code-papier">moveUp(1);</span></li>
            </ul>
            <div class="vergleich">
              <div class="robot-card">
                <h2>Robotersprache</h2>
                <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 6px">
                  <div class="robot-mblock-placed cg-block cg-xfer cg-ohne-symbol" style="width: fit-content"><span class="cg-name">mov 2 [08]</span></div>
                  <div class="robot-mblock-placed cg-block cg-move cg-ohne-symbol" style="width: fit-content"><span class="cg-name">rgt [08]</span></div>
                  <div class="robot-mblock-placed cg-block cg-move cg-ohne-symbol" style="width: fit-content"><span class="cg-name">up 1</span></div>
                  <div class="robot-mblock-placed cg-block cg-halt cg-ohne-symbol" style="width: fit-content"><span class="cg-name">end</span></div>
                </div>
              </div>
              <div class="robot-card">
                <h2>Hochsprache</h2>
                <span class="slide-code code-papier">number schritte = 2;
moveRight(schritte);
moveUp(1);</span>
              </div>
            </div>
            <p>Welche Adresse hinter dem Namen steckt und ob ein <span class="cg-block cg-xfer cg-ohne-symbol cg-inline">mov</span> nötig ist, muss der Programmierer nicht mehr wissen. Damit der Roboter dieses Programm ausführen kann, brauchen wir einen <strong>Übersetzer</strong>, der es in die Maschinensprache bringt.</p>
          </div>
        `;
      },
    },
    {
      id: 's3',
      title: 'Der Compiler',
      render: (container) => {
        container.innerHTML = `
          <div class="slide-centered slide-lesbar">
            <p>Hier kommt der <strong>Compiler</strong> ins Spiel, der selbst ein Programm ist. Er schlägt die Brücke zwischen Hochsprache und Maschinensprache, indem er Programme aus der Hochsprache in Maschinensprache übersetzt. Das passiert einmal, bevor das Programm läuft.</p>
            <p>Dafür muss er sowohl die Quellsprache als auch die Zielsprache kennen. Das heißt: Für jede Kombination aus Quellsprache und Zielsprache gibt es einen eigenen Compiler. Zum Vergleich: Ein Roboter, dessen Hardware anders funktioniert, versteht auch andere Maschinencode-Befehle. Für ihn braucht man deshalb einen anderen Compiler.</p>
            <div class="fluss fluss-kurz">
              <div class="fluss-sprache fluss-rahmen"><span class="fluss-rolle">Hochsprache:</span><span class="fluss-name">Quellcode</span></div>
              <div class="fluss-pfeil" aria-hidden="true">→</div>
              <div class="fluss-sprache fluss-rahmen"><span class="fluss-rolle">Übersetzung:</span><span class="fluss-name">Compiler</span></div>
              <div class="fluss-pfeil" aria-hidden="true">→</div>
              <div class="fluss-sprache fluss-rahmen"><span class="fluss-rolle">Maschinensprache:</span><span class="fluss-name">Maschinencode</span></div>
              <div class="fluss-pfeil" aria-hidden="true">→</div>
              <div class="fluss-sprache fluss-rahmen"><span class="fluss-rolle">Ausführung:</span><span class="fluss-name">Maschine</span></div>
            </div> 
          </div>
        `;
      },
    },
    {
      id: 's4',
      title: 'Maschinennah oder High-Level',
      render: (container) => {
        container.innerHTML = `
          <div class="slide-centered slide-lesbar">
            <p>Wie maschinennah eine Programmiersprache ist, bestimmt, wie viele Freiheiten der Programmierer hat und wie viel der Compiler entscheidet.</p>
            <div class="vergleich vergleich--schmal">
              <div class="robot-card robot-card--geteilt">
               <div class="robot-card-teil">
                <h2>Maschinennah (z. B. Assembler)</h2>
                <ul>
                  <li>Das Programm besteht aus vielen kleinschrittigen Befehlen.</li>
                  <li>Die Befehle beschreiben, wie die CPU etwas ausführt.</li>
                  <li>Der Programmierer bestimmt genauer, welche Befehle die CPU ausführt.</li>
                  <li>Die Programme sind länger, schwerer zu lesen und fehleranfälliger.</li>
                  <li>Erfahrene Programmierer können den Code gezielt auf Geschwindigkeit optimieren.</li>
                  <li>Das Programm ist an eine bestimmte Hardware gebunden.</li>
                </ul>
               </div>
               <div class="robot-card-teil">
                <h2>Hochsprache (z. B. Java)</h2>
                <ul>
                  <li>Eine Anweisung fasst viele Maschinenbefehle zusammen.</li>
                  <li>Die Anweisungen beschreiben, was das Programm tut, nicht wie die CPU es ausführt.</li>
                  <li>Der Compiler entscheidet, welche Maschinenbefehle entstehen.</li>
                  <li>Die Programme sind kürzer und besser lesbar.</li>
                  <li>Übersetzt der Compiler nicht optimal, läuft das Programm langsamer.</li>
                  <li>Dasselbe Programm lässt sich für verschiedene Hardware übersetzen.</li>
                </ul>
               </div>
              </div>
            </div>
          </div>
        `;
      },
    },
    {
      id: 's5',
      title: 'Zwei Wege zur Maschine',
      render: (container) => {
        container.innerHTML = `
          <div class="slide-centered slide-lesbar">
            <p>Der Compiler kann auf zwei Wegen zur Maschine führen: direkt in Maschinencode oder über einen Zwischencode.</p>
            <div class="vergleich vergleich--schmal">
              <div class="robot-card robot-card--geteilt">
               <div class="robot-card-teil">
                <h2>Direkt in Maschinencode</h2>
                <p><strong>Quellcode → Compiler → Maschinencode</strong></p>
                <ul>
                  <li>Der Compiler übersetzt das Programm vollständig vor dem Start (AOT, Ahead-of-Time).</li>
                  <li>Das Ergebnis ist Maschinencode für genau eine Hardware, den die CPU sofort ausführen kann.</li>
                  <li>Ein Beispiel ist die Programmiersprache „C“.</li>
                  <li>So wird auch unser Robotercode erzeugt.</li>
                </ul>
               </div>
               <div class="robot-card-teil">
                <h2>Über Zwischencode und virtuelle Maschine</h2>
                <p><strong>Quellcode → Compiler → Bytecode → VM → Maschinencode</strong></p>
                <ul>
                  <li>Der Compiler erzeugt zunächst einen <strong>Zwischencode</strong>, den <strong>Bytecode</strong>. Er ist nicht an eine bestimmte Hardware gebunden.</li>
                  <li>Der Prozessor versteht den Bytecode nicht direkt. Dafür gibt es eine <strong>virtuelle Maschine (VM)</strong>: ein Programm, das auf der Hardware läuft und den Bytecode ausführt. Dabei übersetzt sie ihn erst zur Laufzeit in Maschinencode für diese Hardware (JIT, Just-in-Time).</li>
                  <li>Beispiel: Java. Die VM heißt dort JVM (Java Virtual Machine).</li>
                </ul>
               </div>
              </div>
            </div>
            <p>AOT und JIT sagen nur, <em>wann</em> übersetzt wird: vor dem Start oder erst während der Ausführung. Der Bytecode ist die Zwischensprache dazwischen.</p>
          </div>
        `;
      },
    },
    {
      id: 's6',
      title: 'Warum der Umweg?',
      render: (container) => {
        container.innerHTML = `
          <div class="slide-centered slide-lesbar">
            <p>Stell dir drei Roboter vor. Der Befehl <span class="code-papier">moveRight(2)</span> soll bei allen dasselbe bewirken, aber jede Hardware setzt ihn anders um.</p>
            <div class="vergleich vergleich--schmal">
              <div class="robot-card robot-card--geteilt">
               <div class="robot-card-teil">
                <h2>Kettenroboter</h2>
                <p>Fährt auf Ketten. Er bekommt den Bytecode und eine VM, die ihn beim Ausführen in Maschinencode für seine Hardware übersetzt.</p>
                <h2>Laufroboter</h2>
                <p>Läuft auf Beinen. Er bekommt denselben Bytecode, aber eine andere VM, die ihn in Maschinencode für seine Hardware übersetzt.</p>
               </div>
               <div class="robot-card-teil">
                <h2>Mini-Roboter</h2>
                <p>Er hat nur wenig Speicher und Rechenleistung. Eine VM ist selbst ein Programm, das beides braucht, und passt deshalb nicht auf ihn. Sein Programm wird darum schon vorher direkt in Maschinencode übersetzt (AOT). Das spart Speicher und läuft schnell, weil zur Laufzeit nichts mehr übersetzt werden muss. Dafür gilt dieser Maschinencode nur für genau diesen Roboter. Für einen anderen müsste man neu übersetzen.</p>
               </div>
              </div>
            </div>
            <p>Bei direkter Übersetzung (AOT) müsste man das Programm für jeden Roboter einzeln übersetzen. Mit Bytecode übersetzt man nur einmal, die jeweilige VM erledigt den Rest. So läuft dasselbe Java-Programm überall, wo es eine JVM gibt: <strong>„Einmal geschrieben, überall lauffähig.“</strong></p>
          </div>
        `;
      },
    },  
    {
      id: 's7',
      title: 'Vervollständige die Übersetzungswege',
      render: (container) => renderDragDropDiagram(container, {
        svg: UEBERSETZUNGS_DIAGRAMM,
        terms: UEBERSETZUNGS_BEGRIFFE,
        zeilenMeldung: ZEILEN_MELDUNG,
        hinweis: 'Ziehe die Begriffe aus der Leiste in die passenden Felder. So entstehen die beiden Wege vom Quellcode bis zu den Robotern.',
      }),
    },      
  ],
};

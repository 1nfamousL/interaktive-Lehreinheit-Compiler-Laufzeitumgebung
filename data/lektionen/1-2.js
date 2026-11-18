const machenBadge = () => `<svg class="inline-shape-svg" viewBox="0 0 72 72" role="img" aria-label="Machen"><circle cx="36" cy="36" r="34" style="fill: var(--badge-machen)"/><text x="36" y="40" text-anchor="middle" style="fill: var(--text-auf-farbe)" font-weight="500" font-size="17">Machen</text></svg>`;
const sachenBadge = () => `<svg class="inline-shape-svg" viewBox="0 0 72 72" role="img" aria-label="Sachen"><rect x="2" y="2" width="68" height="68" rx="6" style="fill: var(--badge-sachen)"/><text x="36" y="40" text-anchor="middle" style="fill: var(--text-auf-farbe)" font-weight="500" font-size="17">Sachen</text></svg>`;

const SPEICHER_MODELL = `
  <div class="robot-stage modell-cpu-spalte">
    <div class="robot-build lz-prog">
      <div class="robot-ref-title">Programmspeicher</div>
      <div class="robot-mrow lz-row">
        <div class="robot-mblock-placed lz-fach"><span class="lz-adr-im-fach">[00]</span><span class="lz-fach-text">mov</span></div>
      </div>
      <div class="robot-mrow lz-row">
        <div class="robot-mblock-placed lz-fach"><span class="lz-adr-im-fach">[01]</span><span class="lz-fach-text">2</span></div>
      </div>
      <div class="robot-mrow lz-row">
        <div class="robot-mblock-placed lz-fach"><span class="lz-adr-im-fach">[02]</span><span class="lz-fach-text">[08]</span></div>
      </div>
      <div class="robot-mrow lz-row robot-ue-active">
        <div class="robot-mblock-placed lz-fach"><span class="lz-adr-im-fach">[03]</span><span class="lz-fach-text">rgt</span></div>
      </div>
      <div class="robot-mrow lz-row">
        <div class="robot-mblock-placed lz-fach"><span class="lz-adr-im-fach">[04]</span><span class="lz-fach-text">[08]</span></div>
      </div>
      <div class="robot-mrow lz-row">
        <div class="robot-mblock-placed lz-fach"><span class="lz-adr-im-fach">[05]</span><span class="lz-fach-text">up</span></div>
      </div>
      <div class="robot-mrow lz-row">
        <div class="robot-mblock-placed lz-fach"><span class="lz-adr-im-fach">[06]</span><span class="lz-fach-text">1</span></div>
      </div>
      <div class="robot-mrow lz-row">
        <div class="robot-mblock-placed lz-fach"><span class="lz-adr-im-fach">[07]</span><span class="lz-fach-text">end</span></div>
      </div>
    </div>
    <div class="lz-mid">
      <div class="robot-card lz-cpu">
        <h2>CPU</h2>
        <div class="lz-cpu-grid">
          <span class="lz-cpu-key">Befehlszähler</span>
          <span class="lz-cpu-val">[03]</span>
          <span class="lz-cpu-key">Befehlsregister</span>
          <span class="lz-cpu-val">rgt</span>
        </div>
        <div class="lz-phases">
          <span class="robot-ue-phase">holen</span>
          <span class="robot-ue-phase-sep">→</span>
          <span class="robot-ue-phase">dekodieren</span>
          <span class="robot-ue-phase-sep">→</span>
          <span class="robot-ue-phase">ausführen</span>
        </div>
      </div>
      <div class="robot-card">
        <div class="cg-sub cg-mem-title">Datenspeicher</div>
        <div class="cg-mem-grid">
          <div class="cg-mem-cell"><span class="cg-mem-addr">[08]</span><span class="lz-val">2</span></div>
          <div class="cg-mem-cell"><span class="cg-mem-addr">[09]</span><span class="lz-val">0</span></div>
          <div class="cg-mem-cell"><span class="cg-mem-addr">[10]</span><span class="lz-val">0</span></div>
          <div class="cg-mem-cell"><span class="cg-mem-addr">[11]</span><span class="lz-val">0</span></div>
          <div class="cg-mem-cell"><span class="cg-mem-addr">[12]</span><span class="lz-val">0</span></div>
        </div>
      </div>
    </div>
  </div>
`;

// Aufteilung des Speichers (Folie 6): Programm [00] bis [07], Daten ab [08].
// Wie SPEICHER_MODELL, aber ohne CPU, ohne markierten Befehl und ohne end (kommt erst auf
// Folie 7, [07] bleibt frei). Der Datenspeicher ist noch leer (überall 0), im Programm
// steht mov, ein Befehl mit Adresse und einer mit Zahl, jeweils in Fächer aufgeteilt.
// Hier (zum Testen) steht die Adresse im Fach selbst (.lz-adr-im-fach) statt davor. Im Speicher
// gibt es keine Farben: jedes Fach ist ein dunkler Rahmen (.lz-fach) mit weißem Inhalt, Befehle,
// Zahlen und Adressen sehen gleich aus. Das freie Fach [07] zeigt nur seine Adresse.
const SPEICHER_AUFTEILUNG = `
    <div class="robot-build lz-prog">
      <div class="robot-ref-title">Programmspeicher</div>
      <div class="robot-mrow lz-row">
        <div class="robot-mblock-placed lz-fach"><span class="lz-adr-im-fach">[00]</span><span class="lz-fach-text">mov</span></div>
      </div>
      <div class="robot-mrow lz-row">
        <div class="robot-mblock-placed lz-fach"><span class="lz-adr-im-fach">[01]</span><span class="lz-fach-text">2</span></div>
      </div>
      <div class="robot-mrow lz-row">
        <div class="robot-mblock-placed lz-fach"><span class="lz-adr-im-fach">[02]</span><span class="lz-fach-text">[08]</span></div>
      </div>
      <div class="robot-mrow lz-row">
        <div class="robot-mblock-placed lz-fach"><span class="lz-adr-im-fach">[03]</span><span class="lz-fach-text">rgt</span></div>
      </div>
      <div class="robot-mrow lz-row">
        <div class="robot-mblock-placed lz-fach"><span class="lz-adr-im-fach">[04]</span><span class="lz-fach-text">[08]</span></div>
      </div>
      <div class="robot-mrow lz-row">
        <div class="robot-mblock-placed lz-fach"><span class="lz-adr-im-fach">[05]</span><span class="lz-fach-text">up</span></div>
      </div>
      <div class="robot-mrow lz-row">
        <div class="robot-mblock-placed lz-fach"><span class="lz-adr-im-fach">[06]</span><span class="lz-fach-text">1</span></div>
      </div>
      <div class="robot-mrow lz-row">
        <div class="robot-mblock-placed lz-fach"><span class="lz-adr-im-fach">[07]</span><span class="lz-fach-text">&#8203;</span></div>
      </div>
    </div>
    <div class="lz-mid">
      <div class="robot-card">
        <div class="cg-sub cg-mem-title">Datenspeicher</div>
        <div class="cg-mem-grid">
          <div class="cg-mem-cell"><span class="cg-mem-addr">[08]</span><span class="lz-val">0</span></div>
          <div class="cg-mem-cell"><span class="cg-mem-addr">[09]</span><span class="lz-val">0</span></div>
          <div class="cg-mem-cell"><span class="cg-mem-addr">[10]</span><span class="lz-val">0</span></div>
          <div class="cg-mem-cell"><span class="cg-mem-addr">[11]</span><span class="lz-val">0</span></div>
          <div class="cg-mem-cell"><span class="cg-mem-addr">[12]</span><span class="lz-val">0</span></div>
        </div>
      </div>
    </div>
`;

export const LEKTION = {
  id: '1-2',
  title: '1.2 Die Hardware',
  desc: 'CPU, Speicher und Befehlszähler: die Umgebung, in der Programme laufen.',
  slides: [
    {
      id: 's1',
      title: 'Rückblick',
      render: (container) => {
        container.innerHTML = `
          <div class="slide-centered slide-lesbar">
            <p>Wir haben gelernt, dass ein Programm aus ${machenBadge()} und ${sachenBadge()} besteht.</p>
            <p>Unser Roboter hat dieses Programm ausgeführt. Er ist in unserem Beispiel die Hardware, also die Umgebung, die Software zum Leben erweckt.</p>
            <p>Die Eigenschaften der Hardware spiegeln sich in den Eigenschaften der Software wider: Der Roboter kann sich in vier Richtungen bewegen, deshalb gibt es auch vier Bewegungsbefehle.</p>
            <p>Wie diese Hardware bei einem echten Computer aufgebaut ist, sehen wir uns jetzt an. Die CPU ist für das Machen zuständig, der Speicher für die Sachen.</p>
          </div>
        `;
      },
    },
    {
      id: 's2',
      title: 'Machen: CPU',
      render: (container) => {
        container.innerHTML = `
          <div class="slide-centered slide-lesbar">
            <p>Die CPU (Central Processing Unit, auf Deutsch Prozessor) ist die zentrale Komponente eines Computers. Sie führt die Befehle eines Programms aus.</p>
            <p>Dazu arbeitet sie sich von Befehl zu Befehl:</p>            
            <div class="cpu-loop">
              <svg class="cpu-loop-cpu" viewBox="0 0 110 110" role="img" aria-label="CPU">
                <circle cx="55" cy="55" r="50" style="fill: var(--badge-machen)"/>
                <text x="55" y="55" text-anchor="middle" dominant-baseline="middle" style="fill: var(--text-auf-farbe)" font-weight="700" font-size="15">CPU</text>
              </svg>
              <div class="cpu-loop-steps">
                <p>nächsten Befehl holen</p>
                <p>Befehl dekodieren</p>
                <p>Befehl ausführen</p>
              </div>
              <svg class="cpu-loop-arrow" viewBox="15 0 80 100" role="img" aria-label="wird wiederholt">
                <path d="M 29.42 78.51 A 32 32 0 1 0 41.72 23.09" fill="none" style="stroke: var(--linie-grafik)" stroke-width="14"/>
                <polygon points="26.26,27.23 54.75,33.06 48.01,7.94" style="fill: var(--linie-grafik)"/>
              </svg>
            </div>
            <p>Beim Dekodieren findet die CPU heraus, was der Befehl bedeutet. In der Übung hast du das gesehen: Erst wurde die Zeile markiert (der Befehl wird geholt), danach hat sich der Roboter bewegt (der Befehl wird ausgeführt).</p>
          </div>
        `;
      },
    },
    {
      id: 's3',
      title: 'Sachen: Speicher',
      render: (container) => {
        container.innerHTML = `
          <div class="slide-centered slide-lesbar">
            <p>Die „Sachen“, also die Daten, liegen im Speicher.</p>
            <p>Die CPU muss die Daten in diesem Speicher gezielt ansprechen können. Dazu wird der Speicher folgendermaßen organisiert:</p>
            <p>Im Speicher steht alles als Folge von Bits. Ein Bit ist entweder <span class="code-text">0</span> oder <span class="code-text">1</span>. Alle Bits liegen in einer linearen Anordnung hintereinander:</p>
            <div class="memory-box memory-box--fach">
              <div class="memory-col"><span class="memory-byte">0010010100101010010111011010100100101010</span></div>
            </div>
            <p>Je <strong>8 Bits</strong> werden zu einem <strong>Byte</strong> zusammengefasst:</p>
            <div class="memory-box memory-box--fach memory-box--getrennt">
              <div class="memory-col"><span class="memory-byte">00100101</span></div>
              <div class="memory-col"><span class="memory-byte">00101010</span></div>
              <div class="memory-col"><span class="memory-byte">01011101</span></div>
              <div class="memory-col"><span class="memory-byte">10101001</span></div>
              <div class="memory-col"><span class="memory-byte">00101010</span></div>
            </div>
            <p>Ein Byte kann eine Zahl von 0 (<span class="code-text">00000000</span>) bis 255 (<span class="code-text">11111111</span>) darstellen.</p>
          </div>
        `;
      },
    },
    {
      id: 's4',
      title: 'Speicher adressieren',
      render: (container) => {
        container.innerHTML = `
          <div class="slide-centered slide-lesbar">
            <p>Jedes Byte bekommt nun eine eindeutige <strong>Adresse</strong>. Dazu werden die Bytes einfach von 0 an hochgezählt. Die laufende Nummer ist die Speicheradresse des Bytes.</p>
            <div class="memory-box memory-box--fach memory-box--getrennt">
              <div class="memory-col"><span class="memory-byte">00100101</span><span class="memory-addr">[0]</span></div>
              <div class="memory-col"><span class="memory-byte">00101010</span><span class="memory-addr">[1]</span></div>
              <div class="memory-col"><span class="memory-byte highlight">01011101</span><span class="memory-addr">[2]</span></div>
              <div class="memory-col"><span class="memory-byte">10101001</span><span class="memory-addr">[3]</span></div>
              <div class="memory-col"><span class="memory-byte">00101010</span><span class="memory-addr">[4]</span></div>
            </div>
            <p>Die CPU kann nun zum Beispiel:</p>
            <ul>
              <li>den Wert von der Speicheradresse <span class="code-text">2</span> lesen (<span class="code-text">01011101</span>)</li>
              <li>ihn als Zahl (93) interpretieren und um 1 erhöhen (94)</li>
              <li>das Ergebnis (<span class="code-text">01011110</span>) wieder an die Speicheradresse <span class="code-text">2</span> schreiben</li>
            </ul>
          </div>

        `;
      },
    },
    {
      id: 's5',
      title: 'Daten im Speicher ablegen',
      render: (container) => {
        container.innerHTML = `
          <div class="slide-centered slide-lesbar">
            <p>Um Daten im Speicher abzulegen benötigen wir einen neuen Befehl:</p>
            <div class="robot-mblock-placed cg-block cg-xfer cg-ohne-symbol" style="width: fit-content"><span class="cg-name">mov WERT ADRESSE</span></div>
            <p>Der Name kommt vom englischen „move“. Der Befehl kopiert den Wert in die Adresse.</p>
            <p>Stellen wir uns vor, der Roboter hat fünf Speicherfächer mit den Adressen <span class="code-text">[08]</span> bis <span class="code-text">[12]</span>. Der Einfachheit halber bilden wir sie nun mit echten Zahlen ab:</p>
            <div class="memory-box memory-box--fach memory-box--getrennt">
              <div class="memory-col"><span class="memory-byte highlight">0</span><span class="memory-addr">[08]</span></div>
              <div class="memory-col"><span class="memory-byte">2</span><span class="memory-addr">[09]</span></div>
              <div class="memory-col"><span class="memory-byte">5</span><span class="memory-addr">[10]</span></div>
              <div class="memory-col"><span class="memory-byte">9</span><span class="memory-addr">[11]</span></div>
              <div class="memory-col"><span class="memory-byte">6</span><span class="memory-addr">[12]</span></div>
            </div>
            <p>Der Befehl <span class="cg-block cg-xfer cg-ohne-symbol cg-inline">mov 2 [08]</span> führt somit dazu, dass der Wert 0 in Adresse <span class="code-text">[08]</span> durch den Wert 2 ersetzt wird.</p>
            <p>Wenn ein Bewegungsbefehl nun diese Adresse referenziert, wird er für 2 Felder ausgeführt.</p>
          </div>
        `;
      },
    },

    {
      id: 's6',
      title: 'Aufteilung in Programm- & Datenspeicher',
      render: (container) => {
        container.innerHTML = `
          <div class="robot-stage modell-speicher speicher-raster">
            <div class="speicher-text-oben slide-centered slide-lesbar">
            <p>Auch die Befehle sind Daten, die gespeichert werden müssen, damit die CPU sie ausführen kann. Der Speicher ist deshalb in zwei Bereiche aufgeteilt: den <strong>Programmspeicher</strong> für die Befehle und den <strong>Datenspeicher</strong> für die Zahlenwerte. Beide gehören zum selben Speicher, d.h. die Adressen laufen durch.</p>
            </div>
            <div class="speicher-text-unten slide-centered slide-lesbar">
            <p>Wie alle Daten stehen auch Befehle im Speicher als Bits. Schreibweisen wie <span class="cg-block cg-move cg-ohne-symbol cg-inline">rgt [08]</span> sind nur eine lesbare Darstellung davon: Der Befehl <span class="lz-fach-inline">rgt</span> ist ein festes Bitmuster. Dahinter steht als Binärzahl entweder eine Adresse, wie hier die <span class="lz-fach-inline">[08]</span> in Fach <span class="lz-fach-inline lz-fach-adr">[04]</span>, oder direkt die Zahl selbst, wie bei <span class="cg-block cg-move cg-ohne-symbol cg-inline">up 1</span> in den Fächern <span class="lz-fach-inline lz-fach-adr">[05]</span> und <span class="lz-fach-inline lz-fach-adr">[06]</span>.</p>
            <p>Der Speicher unseres Roboters ist insgesamt 50 Fächer groß, die Adressen reichen also von <span class="lz-fach-inline lz-fach-adr">[00]</span> bis <span class="lz-fach-inline lz-fach-adr">[49]</span>. Unser kleines Programm passt also locker hinein, die Abbildung zeigt nur den Anfang.</p>
            <p>Je nachdem, wo die Zahl steht, verhält sie sich anders. Steht sie direkt im Befehl, liegt sie im Programmspeicher und ist nur für diesen einen Befehl verfügbar. Steht sie im Datenspeicher, ist sie im ganzen Programm verfügbar, und jeder Befehl kann dieselbe Zahl über ihre Adresse referenzieren.</p>
            </div>
            ${SPEICHER_AUFTEILUNG}
          </div>
        `;
      },
    },
    {
      id: 's7',
      title: 'Befehlszähler & Befehlsregister',
      render: (container) => {
        container.innerHTML = `
          <div class="slide-split">
            <div class="slide-split-text slide-centered slide-lesbar">
            <p>Damit die CPU weiß, welchen Befehl sie als Nächstes ausführen muss, zeigt der <strong>Befehlszähler</strong> auf die entsprechende Adresse im Programmspeicher. Ein <span class="cg-block cg-halt cg-ohne-symbol cg-inline">end</span>-Befehl markiert das Programmende.</p>
            <p>Die CPU holt den Befehl in das <strong>Befehlsregister</strong>, einen kleinen Speicher in der CPU. Beim Dekodieren erkennt sie an der Bitfolge, um welchen Befehl es sich handelt und wie viele der folgenden Fächer (mit Zahlen oder Adressen) dazugehören. Diese Fächer liest sie direkt mit, wobei der Befehlszähler pro Fach eine Adresse weiterrückt. Nach der Ausführung steht er so schon auf dem nächsten Befehl.</p>
            <p>Ob ein Fach einen Befehl oder eine Zahl enthält, sieht man dem Bitmuster nicht an. Es kommt nur darauf an, wo die CPU es liest.</p>
            <p>In der Abbildung zeigt der Befehlszähler auf <span class="lz-fach-inline lz-fach-adr">[03]</span>, dort steht <span class="lz-fach-inline">rgt</span>. Die CPU erkennt beim Dekodieren, dass im Fach <span class="lz-fach-inline lz-fach-adr">[04]</span> eine Adresse folgt, nämlich <span class="lz-fach-inline">[08]</span>. Der Roboter bewegt sich also so oft nach rechts, wie in <span class="lz-fach-inline lz-fach-adr">[08]</span> steht. Das ist unsere erste Vorstellung der <strong>Laufzeitumgebung</strong>, in der unser Programm ausgeführt wird.</p>
            </div>
            <div class="slide-split-figure">${SPEICHER_MODELL}</div>
          </div>
        `;
      },
    },
  ],
};

import { renderRobotProgramm } from '../../js/exercises/robot-programm.js';

const machenBadge = () => `<svg class="inline-shape-svg" viewBox="0 0 72 72" role="img" aria-label="Machen"><circle cx="36" cy="36" r="34" style="fill: var(--badge-machen)"/><text x="36" y="40" text-anchor="middle" style="fill: var(--text-auf-farbe)" font-weight="500" font-size="17">Machen</text></svg>`;
const sachenBadge = () => `<svg class="inline-shape-svg" viewBox="0 0 72 72" role="img" aria-label="Sachen"><rect x="2" y="2" width="68" height="68" rx="6" style="fill: var(--badge-sachen)"/><text x="36" y="40" text-anchor="middle" style="fill: var(--text-auf-farbe)" font-weight="500" font-size="17">Sachen</text></svg>`;

export const LEKTION = {
  id: '1-1',
  title: '1.1 Was ist ein Programm?',
  desc: 'Programm = Machen mit Sachen.',
  slides: [
    {
      id: 's1',
      title: 'Grundmodell eines Programms',
      render: (container) => {
        container.innerHTML = `
          <div class="slide-centered slide-lesbar">
            <p>Ein Programm besteht im Kern aus zwei Teilen: aus Befehlen, die etwas tun, dem <strong>Machen</strong>, und aus Daten, mit denen sie arbeiten, den <strong>Sachen</strong>.</p>
            <svg class="machen-sachen-svg" viewBox="0 0 260 190" role="img" aria-label="Ein Programm ist Machen mit Sachen">
              <text x="130" y="28" text-anchor="middle" fill="var(--text)" font-weight="700" font-size="17">Programm</text>
              <rect x="5" y="44" width="250" height="130" rx="12" fill="none" stroke="var(--border)" stroke-width="2" stroke-dasharray="none"/>
              <circle cx="69" cy="109" r="37" style="fill: var(--badge-machen)"/>
              <text x="69" y="115" text-anchor="middle" style="fill: var(--text-auf-farbe)" font-weight="500" font-size="17">Machen</text>
              <text x="130" y="115" text-anchor="middle" fill="var(--text)" font-size="17">mit</text>
              <rect x="157" y="75" width="74" height="74" rx="6" style="fill: var(--badge-sachen)"/>
              <text x="194" y="118" text-anchor="middle" style="fill: var(--text-auf-farbe)" font-weight="500" font-size="17">Sachen</text>
            </svg>
            <p>Das ist stark vereinfacht, zeigt aber die grundlegende Aufteilung von Software.</p>
            <p>So lässt sich leichter vorstellen, was ein Programm ist, was es tut und womit.</p>
          </div>
        `;
      },
    },
    {
      id: 's2',
      title: 'Die Hardware',
      render: (container) => {
        container.innerHTML = `
          <div class="slide-centered slide-lesbar">
            <p>Für das Verständnis von Software ist es sinnvoll, sich mit Hardware zu befassen, da Hardware die Software erst
            „zum Leben erweckt“.</p>
            <p>Sie bietet eine Umgebung, auf der das ${machenBadge()} mit ${sachenBadge()} stattfindet.</p>
            <p>Die Eigenschaften der Hardware-Bestandteile
            spiegeln sich in den Eigenschaften von Software wider.</p>
            <p>Hardware ist alles, was man anfassen kann:
            Bildschirm, Maus, Tastatur usw.</p>
            <p>Direkt mit der Software hat eine Maus jedoch nichts zu tun.</p>
            <p>Für den Betrieb der Software, das „Laufenlassen“, sind die Hardware-Bestandteile im Innern des Computer-Gehäuses zuständig.</p>
          </div>
        `;
      },
    },
    {
      id: 's3',
      title: 'Machen',
      render: (container) => {
        const zellen = [];
        for (let r = 0; r < 6; r++) {
          for (let c = 0; c < 6; c++) {
            zellen.push(`<rect x="${c * 60}" y="${r * 60}" width="52" height="52" rx="8" fill="var(--panel-2)" stroke="var(--border)"/>`);
          }
        }
        const rasterFigur = `<svg viewBox="-8 -8 368 368" role="img" aria-label="Raster mit Roboter">
          ${zellen.join('')}
          <g transform="translate(189.7 186.8) scale(0.96)" fill="none" stroke="var(--text)" stroke-width="2" stroke-linejoin="round">
            <rect x="7" y="14" width="20" height="21" rx="4"/>
            <path d="M17 14V8"/>
            <circle cx="17" cy="5.5" r="3" fill="var(--text)"/>
            <circle cx="13" cy="24" r="1.7" fill="var(--text)" stroke="none"/>
            <circle cx="21" cy="24" r="1.7" fill="var(--text)" stroke="none"/>
          </g>
        </svg>`;
        container.innerHTML = `
          <div class="slide-split">
            <div class="slide-split-text slide-centered slide-lesbar">
              <p>Beginnen wir mit dem Machen: Wir bauen unser erstes Programm. Ein Programm besteht aus Code: einer Folge von Befehlen, die der Prozessor nacheinander abarbeitet.</p>
              <p>Die Hardware, die es ausführt, ist ein Roboter. Er versteht nur vier einfache Befehle:</p>
              <div class="robot-dir-grid robot-dir-spalte" style="grid-template-columns: 7.5rem auto; align-items: center; width: fit-content; pointer-events: none">
                <div class="robot-mblock robot-m-dir"><span class="robot-cap">up</span></div><span>→ Roboter bewegt sich nach oben</span>
                <div class="robot-mblock robot-m-dir"><span class="robot-cap">dwn</span></div><span>→ Roboter bewegt sich nach unten</span>
                <div class="robot-mblock robot-m-dir"><span class="robot-cap">rgt</span></div><span>→ Roboter bewegt sich nach rechts</span>
                <div class="robot-mblock robot-m-dir"><span class="robot-cap">lft</span></div><span>→ Roboter bewegt sich nach links</span>
              </div>
              <p>Unser Roboter folgt den Befehlen und bewegt sich über ein Raster.</p>
            </div>
            <div class="slide-split-figure"><div class="robot-rt-grid-wrap robot-rt-grid-wrap-kompakt">${rasterFigur}</div></div>
          </div>
        `;
      },
    },
    {
      id: 's4',
      title: 'Programmiere den Roboter: Erste Bewegungen',
      
      // Hindernisse { c, r } ab 0 (Spalte, Zeile), der Roboter startet auf 3/3
      render: (container) => renderRobotProgramm(container, {
        hindernisse: [{ c: 1, r: 1 }, { c: 4, r: 1 }, { c: 1, r: 4 }],
      }),
    },
    {
      id: 's5',
      title: 'Sachen: Werte, Daten, Strukturen',
      render: (container) => {
        container.innerHTML = `
          <div class="slide-centered slide-lesbar">
            <p>Das Grundelement Sachen steht für Daten, die von der Software beim Machen bearbeitet werden.</p>
            <p>Dies können Zahlenwerte sein.</p>
            <p>In unserer Robotersprache stellen beispielsweise Zahlenwerte „Sachen“ dar.</p>
            <p>Ein Bewegungsbefehl kann durch Angabe eines Zahlenwertes aussagen, wie weit der Roboter die Bewegung ausführt.</p>
            <p>Dazu wird hinter dem Befehl ein Zahlenwert angegeben: <span class="cg-block cg-move cg-ohne-symbol cg-inline">rgt 2</span> → der Roboter bewegt sich 2 Felder nach rechts.</p>
          </div>
        `;
      },
    },
    {
      id: 's6',
      title: 'Programmiere den Roboter: Machen mit Sachen',
      render: (container) => renderRobotProgramm(container, {
        mitSchritten: true,
        hindernisse: [{ c: 3, r: 1 }, { c: 5, r: 2 }, { c: 0, r: 3 }, { c: 2, r: 5 }, { c: 4, r: 4 }],
      }),
    }
  ],
};

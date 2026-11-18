// html-bausteine für grammatikregeln, damit die regeln überall gleich aussehen
// eine lektion schreibt ihre regeln einmal als liste [zeile, satz]
// daraus entstehen das raster der erklärfolie und der inhalt des pop-ups "Syntaxregeln"

// ---- BAUSTEINE EINER REGEL ----
// nichtterminal im text als kapsel wie in übung und hilfe-pop-up (.mini-chip, mit abstand für den fließtext)
export const chip = (name) => `<span class="mini-chip mini-chip--text">${name}</span>`;

// regel als zeile des rasters (.grammatik): name, pfeil, rechte seite
export const regel = (name, rumpf) => `<span>${name}</span><span class="grammatik-pfeil">→</span><span class="grammatik-rumpf">${rumpf}</span>`;
// zeichen der regelschreibweise ("(", ")", "|", ",") sind gedämpft, damit man sie von den tokens "(" und ")" unterscheidet
export const zeichen = (z) => `<span class="grammatik-zeichen">${z}</span>`;
// programmende: token ohne lexik-farbe, der scanner meldet es hinter dem letzten zeichen
export const ende = () => '<span class="token-marke token-marke--ende">Programmende</span>';

// ---- RASTER UND POP-UP ----
// raster aller regeln wie auf der erklärfolie
export const rasterHtml = (zeilen) => `<div class="grammatik">${zeilen.map(([zeile]) => zeile).join('')}</div>`;

// inhalt des pop-ups "Syntaxregeln": dasselbe raster, unter jeder regel ein satz
// satz bricht um und macht das raster nicht breiter (.grammatik-satz in css/20-popups.css)
export const regelnPopupHtml = (zeilen) => `
  <p>Der Pfeil liest sich als „besteht aus“, der senkrechte Strich als „oder“.</p>
  <div class="grammatik grammatik--regeln">${zeilen.map(([zeile, satz]) => `${zeile}<span class="grammatik-satz">${satz}</span>`).join('')}</div>
`;

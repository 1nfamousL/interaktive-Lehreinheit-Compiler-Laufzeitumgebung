// angaben zum build (datum, variante), die build.js beim export einsetzt

const BAUDATUM = typeof __BAUDATUM__ !== 'undefined' ? __BAUDATUM__ : null;

export const PRUEFERVERSION = typeof __PRUEFERVERSION__ !== 'undefined' ? __PRUEFERVERSION__ : false;

export const SCHRITT_IMMER = PRUEFERVERSION;

export function standText() {
  if (!BAUDATUM) return null;
  const [j, m, t] = BAUDATUM.split('-');
  return 'Stand: ' + t + '.' + m + '.' + j + (PRUEFERVERSION ? ' · Prüferversion' : '');
}

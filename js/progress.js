// fortschritt (welche lektionen abgeschlossen sind) speichern und laden
// kennt nur eine menge von lektions-ids, weder den navigations-state noch den inhalt einer lektion
// export/import als datei passiert in app.js zusammen mit notes.js, dieses modul kennt nur seinen eigenen teil

// ---- ZWEI WEGE ZUM SPEICHERN ----
// 1. localStorage: automatisch, bequem
//    zuverlässig über http/https, dort pro domain isoliert
//    bei file:// teilen sich alle lokal geöffneten html-dateien denselben speicher (chrome)
//    deshalb ein projektspezifischer schlüssel gegen kollisionen, ganz ausschließen lässt es sich nicht
// 2. export/import als json-datei: manuell, aber zuverlässig
//    unabhängig vom browser-speicher, übersteht das löschen der browserdaten
//    mitnehmbar auf ein anderes gerät oder in eine neuere version
//    import ersetzt den fortschritt vollständig, nichts wird zusammengeführt
//    für die einzeldatei die robustere wahl

// ---- DATENSTRUKTUR ----
// beide wege benutzen dieselbe struktur:
//   { "1-1": true, "2-2": { besucht: [...], uebungen: [...], geloest: [...] }, ... }
// true: abgeschlossen, für immer
// objekt: teilfortschritt einer offenen lektion (folien-ids besucht, als übung angemeldet, gelöst)
// so geht eine gelöste übung nicht verloren, wenn man die lektion vor dem letzten folienbesuch verlässt

// ---- SPEICHER ----
// eigener schlüssel gegen kollisionen bei file://
const STORAGE_KEY = 'interaktive-lehreinheit-fortschritt';

// localStorage kann fehlen oder blockiert sein (z. b. inkognito)
// dann läuft die app ohne gespeicherten fortschritt weiter, statt abzustürzen
export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// speichern kann fehlschlagen (voll, blockiert)
// dann geht der fortschritt verloren, die app läuft trotzdem weiter
function saveProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // absichtlich leer
  }
}

// ---- ABGESCHLOSSENE LEKTIONEN ----
export function isLessonComplete(lessonId) {
  return loadProgress()[lessonId] === true;
}

// gesamtfortschritt über eine liste von lektions-ids, kennt nur ids
export function courseProgress(lessonIds) {
  const total = lessonIds.length;
  const done = lessonIds.filter(isLessonComplete).length;
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0 };
}

// lektion auf abgeschlossen setzen, teilfortschritt verwerfen
// kein weg zurück
export function markLessonComplete(lessonId) {
  const progress = loadProgress();
  progress[lessonId] = true;
  saveProgress(progress);
}

// ---- TEILFORTSCHRITT ----
// { besucht, uebungen, geloest } (listen von folien-ids)
// abgeschlossene oder unberührte lektion: leere listen
export function loadLessonDetail(lessonId) {
  const v = loadProgress()[lessonId];
  const liste = (x) => (Array.isArray(x) ? x : []);
  if (!v || typeof v !== 'object') return { besucht: [], uebungen: [], geloest: [] };
  return { besucht: liste(v.besucht), uebungen: liste(v.uebungen), geloest: liste(v.geloest) };
}

// teilfortschritt merken, eine abgeschlossene lektion wird nie zurückgestuft
export function saveLessonDetail(lessonId, detail) {
  const progress = loadProgress();
  if (progress[lessonId] === true) return;
  progress[lessonId] = detail;
  saveProgress(progress);
}

// ---- IMPORT ----
// ersetzt den gespeicherten fortschritt vollständig durch data, kein merge
// lokaler stand wird 1:1 auf den der datei gesetzt
export function replaceProgress(data) {
  saveProgress(data && typeof data === 'object' ? data : {});
}

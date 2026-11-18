// merkt sich, welche begriffe der mindmap schon angeklickt wurden
// freigeschaltet, aber nicht in dieser liste = punkt "neu" in der karte
// ob ein begriff freigeschaltet ist, steht hier nicht: das wird aus dem fortschritt abgeleitet, damit es keinen zweiten stand gibt
// kennt nur schlüssel (strings), export/import als datei macht app.js (optionales feld "mindmap")

// eigener schlüssel gegen kollisionen bei file://
const STORAGE_KEY = 'interaktive-lehreinheit-mindmap-gesehen';

// leere liste, wenn nichts gespeichert oder der speicher nicht erreichbar ist (dann läuft die app ohne neu-punkte weiter)
export function loadGesehen() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const liste = raw ? JSON.parse(raw) : [];
    return Array.isArray(liste) ? liste.filter(k => typeof k === 'string') : [];
  } catch {
    return [];
  }
}

function saveGesehen(liste) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(liste));
  } catch {
    // absichtlich leer
  }
}

// begriff angeklickt: neu-punkt ist weg, für immer
export function markiereGesehen(key) {
  const liste = loadGesehen();
  if (!liste.includes(key)) saveGesehen([...liste, key]);
}

// ersetzt die liste vollständig, kein merge
// alles, was keine liste ist, wird zur leeren liste
export function replaceGesehen(liste) {
  saveGesehen(Array.isArray(liste) ? liste.filter(k => typeof k === 'string') : []);
}

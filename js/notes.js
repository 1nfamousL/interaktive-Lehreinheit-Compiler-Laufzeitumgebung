// kommentare zu einzelnen folien speichern und laden
// kennt nur lektions-id + folien-id, export/import als datei macht app.js zusammen mit progress.js
// gespeichert über die folien-id, nicht über den index im "slides"-array (der index verschiebt sich beim einfügen oder entfernen einer folie)
// struktur: { "<lektionId>": { "<folienId>": "kommentartext", ... }, ... }, folie ohne kommentar fehlt als key

// eigener schlüssel gegen kollisionen bei file://
const STORAGE_KEY = 'interaktive-lehreinheit-notizen-v1';

// localStorage kann fehlen oder blockiert sein, dann läuft die app ohne gespeicherte kommentare weiter
export function loadNotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveNotes(notes) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch {
    // absichtlich leer
  }
}

export function getNote(lessonId, slideId) {
  const notes = loadNotes();
  return notes[lessonId]?.[slideId] ?? '';
}

// aufgerufen beim tippen, bewusst ohne render(): ein rebuild pro tastendruck würde fokus und cursorposition verlieren
// text wie getippt gespeichert, trim nur für die prüfung auf leer
export function setNote(lessonId, slideId, text) {
  const notes = loadNotes();
  const trimmed = text.trim();
  if (!trimmed) {
    // leer: eintrag entfernen statt leeren string zu speichern
    if (notes[lessonId]) {
      const rest = { ...notes[lessonId] };
      delete rest[slideId];
      if (Object.keys(rest).length) notes[lessonId] = rest;
      else delete notes[lessonId];
      saveNotes(notes);
    }
    return;
  }
  notes[lessonId] = { ...(notes[lessonId] || {}), [slideId]: text };
  saveNotes(notes);
}

// ersetzt alle kommentare vollständig
export function replaceNotes(data) {
  saveNotes(data && typeof data === 'object' ? data : {});
}

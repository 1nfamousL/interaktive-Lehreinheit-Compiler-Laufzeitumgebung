// inhaltsverzeichnis: titel und beschreibung der kapitel und welche lektions-ids dazugehören
// der inhalt jeder lektion liegt in data/lektionen/<id>.js

export const CHAPTERS = [
  {
    id: 1,
    title: 'Einführung',
    desc: 'Wie aus geschriebenem Code ein laufendes Programm wird.',
    lessons: ['1-1', '1-2', '1-3'],
  },
  {
    id: 2,
    title: 'Konstanten und Roboterbewegung',
    desc: 'Eine Mini-Sprache, einmal durch den ganzen Compiler bis zum laufenden Roboter.',
    lessons: ['2-1', '2-2', '2-3', '2-4', '2-5', '2-6'],
  },
  {
    id: 3,
    title: 'Variablen und Rechnen',
    desc: 'Werte ändern und verrechnen. Der Compiler nutzt Register, die Laufzeit fängt Überlauf ab.',
    lessons: ['3-1', '3-2', '3-3', '3-4', '3-5', '3-6'],
  },
  {
    id: 4,
    title: 'Verzweigungen',
    desc: 'Vergleiche setzen ein Flag, Sprünge lassen das Programm Teile überspringen.',
    lessons: ['4-1', '4-2', '4-3', '4-4', '4-5', '4-6'],
  },
  {
    id: 5,
    title: 'Schleifen',
    desc: 'Ein Rücksprung wiederholt Code, bis die Bedingung falsch wird, oder für immer.',
    lessons: ['5-1', '5-2', '5-3', '5-4', '5-5', '5-6'],
  },
  {
    id: 6,
    title: 'Der gesamte Weg',
    desc: 'Schicke dein Programm durch alle Phasen und prüfe dein Wissen.',
    lessons: ['6-1', '6-2'],
  },
];

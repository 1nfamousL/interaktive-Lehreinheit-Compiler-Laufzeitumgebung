import { render as renderPhasenZuordnung } from '../../js/exercises/phasen-zuordnung.js';
import { ZIELE, GRUPPEN, KARTEN } from '../phasenaufgaben.js';

// Quiz zum Zusammenhang von Compiler und Laufzeitsystem. Eine Übung mit allen Karten: Der Weg vom
// Quellcode zum laufenden Programm als Kette von Blöcken, in die der Spieler Eingabe und Ausgabe zwischen
// den Phasen, die Kernaufgaben jeder Phase und Codezeilen mit Fehlern einsortiert. Die Inhalte stehen
// in data/phasenaufgaben.js. Dort hat jede Karte ein Kapitel (2 bis 5), sodass dieselbe Übung später
// am Ende jedes Kapitels mit den bis dahin bekannten Karten laufen kann.

export const LEKTION = {
  id: '6-1',
  title: '6.1 Prüfe dein Wissen',
  desc: 'Ordne Eingaben und Ausgaben, Aufgaben und Fehler den Phasen vom Quellcode bis zum laufenden Programm zu.',
  slides: [
    {
      id: 's1',
      title: 'Ordne den Phasen zu: Der Weg zum laufenden Programm',
      render: (container) => renderPhasenZuordnung(container, {
        ziele: ZIELE,
        gruppen: GRUPPEN,
        karten: KARTEN,
      }),
    },
  ],
};

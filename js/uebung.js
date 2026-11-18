// schnittstelle zwischen übungen und app.js
// übung meldet per dom-ereignis auf dem container der folie, app.js lauscht dort
// beide müssen sich so nicht kennen
// ereignisnamen als konstanten, damit sender und empfänger denselben namen nutzen

// ---- ANMELDEN UND LÖSEN ----
// übung, die gelöst sein muss, damit die lektion als abgeschlossen zählt
// übungen ohne meldung zählen nicht mit (roboter-programm in 1.1, sandbox in 6.2)
export const UEBUNG_ANGEMELDET = 'uebung-angemeldet';
export const UEBUNG_GELOEST = 'uebung-geloest';

// beim aufbau der übung aufrufen: diese folie muss gelöst werden
export function meldeUebung(container) {
  container.dispatchEvent(new CustomEvent(UEBUNG_ANGEMELDET, { bubbles: true }));
}

// aufrufen, sobald richtig gelöst, mehrfach melden schadet nicht
export function meldeGeloest(container) {
  container.dispatchEvent(new CustomEvent(UEBUNG_GELOEST, { bubbles: true }));
}

// ---- BREITE ----
// standard: folie passt sich dem inhalt an und steht mittig
// meldeBreite(container) beim aufbau: volle breite (.slide--voll), z. b. bei den bäumen
// meldeBreite(container, false): zurück auf breite nach inhalt, pro phase möglich (sandbox in 6.2)
export const UEBUNG_BREITE = 'uebung-breite';

export function meldeBreite(container, voll = true) {
  container.dispatchEvent(new CustomEvent(UEBUNG_BREITE, { bubbles: true, detail: voll }));
}

// ---- HILFE ----
// hilfetext für den hilfe-button der lektion: { titel, html }
// app.js zeigt ihn oben im hilfe-pop-up, solange die folie offen ist
// unabhängig von meldeUebung, auch nicht mitzählende übungen haben eine hilfe
export const UEBUNG_HILFE = 'uebung-hilfe';

export function meldeHilfe(container, hilfe) {
  container.dispatchEvent(new CustomEvent(UEBUNG_HILFE, { bubbles: true, detail: hilfe }));
}

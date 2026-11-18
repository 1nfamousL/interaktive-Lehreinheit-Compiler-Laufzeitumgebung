// app
//
// hub der anwendung: kapitelliste, lektionen und alle bildschirme laufen hier zusammen
// kennt weder den inhalt einer lektion noch das innere einer übung, jede lektionsdatei gibt einer folie über "render" mit, was darauf läuft

import { CHAPTERS } from '../data/kapitel.js';
import { LESSONS } from '../data/lektionen/index.js';
import { isLessonComplete, markLessonComplete, loadLessonDetail, saveLessonDetail, courseProgress, loadProgress, replaceProgress } from './progress.js';
import { getNote, setNote, loadNotes, replaceNotes } from './notes.js';
import { renderPrompt } from './terminal-prompt.js';
import { UEBUNG_ANGEMELDET, UEBUNG_GELOEST, UEBUNG_HILFE, UEBUNG_BREITE } from './uebung.js';
import { BEGRIFFE, alleBegriffe, folieVon, pruefeBegriffe } from '../data/mindmap.js';
import { createMindMap } from './mindmap.js';
import { PRUEFERVERSION, standText } from './bau-info.js';
import { loadGesehen, markiereGesehen, replaceGesehen } from './mindmap-gesehen.js';

const app = document.getElementById('app');

// jeder folienverweis der mindmap muss auf eine folie zeigen, die es gibt (keine tests, deshalb einmal beim start, fehler stehen in der konsole)
pruefeBegriffe(LESSONS);

const GEAR_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';

const NOTE_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';

const WARN_ICON = '<svg class="warn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';

// haken im kreis hinter einem abgeschlossenen kapitel (feather „check-circle“)
const CHECK_CIRCLE_ICON = '<svg class="kapitel-fertig" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="abgeschlossen"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';

// pfeile für zurück-/weiter-buttons (feather „chevron-right“/„chevron-left“), der zurück-pfeil ist der weiter-pfeil gespiegelt
// viewBox 3 3 18 18 statt 0 0 24 24 schneidet den leeren rand ab, damit der pfeil bei gleicher größe (.chevron) groß wirkt
const CHEVRON_RIGHT = '<svg class="chevron" xmlns="http://www.w3.org/2000/svg" viewBox="3 3 18 18" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';
const CHEVRON_LEFT = '<svg class="chevron" xmlns="http://www.w3.org/2000/svg" viewBox="3 3 18 18" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';

const EXPORT_FILENAME = 'compiler-laufzeitumgebung-lehreinheit-daten.json';

// vollbild-knopf (feather "maximize" / "minimize") nur auf touch-geräten mit fullscreen-api (safari auf dem ipad teils mit webkit-präfix), die beschriftung folgt dem ereignis, weil der vollbildmodus auch ohne den knopf verlassen werden kann
const VOLLBILD_AN_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>';
const VOLLBILD_AUS_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>';
const vollbildAktiv = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
function vollbildMoeglich() {
  const el = document.documentElement;
  return !!(el.requestFullscreen || el.webkitRequestFullscreen) && window.matchMedia('(pointer: coarse)').matches;
}
function vollbildUmschalten() {
  try {
    const el = document.documentElement;
    const ergebnis = vollbildAktiv()
      ? (document.exitFullscreen || document.webkitExitFullscreen).call(document)
      : (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
    Promise.resolve(ergebnis).catch(() => {});
  } catch (e) { /* browser verweigert den vollbildmodus: dann bleibt alles wie es ist */ }
}
function vollbildKnopfBeschriften(btn) {
  const aktiv = vollbildAktiv();
  const text = aktiv ? 'Vollbild beenden' : 'Vollbild';
  btn.innerHTML = aktiv ? VOLLBILD_AUS_ICON : VOLLBILD_AN_ICON;
  btn.title = text;
  btn.setAttribute('aria-label', text);
}
// ein einziger listener für alle knöpfe (menü, kapitelübersicht, lektion werden bei jedem render() neu gebaut)
['fullscreenchange', 'webkitfullscreenchange'].forEach(name =>
  document.addEventListener(name, () => document.querySelectorAll('.vollbild-btn').forEach(vollbildKnopfBeschriften)));
// setzt den knopf links vor "hilfe", falls vollbild hier sinnvoll ist
function vollbildKnopfEinfuegen(actions) {
  if (!vollbildMoeglich()) return;
  const btn = document.createElement('button');
  btn.className = 'icon-btn vollbild-btn';
  btn.onclick = vollbildUmschalten;
  vollbildKnopfBeschriften(btn);
  actions.prepend(btn);
}

// "hilfe"- und zahnrad-block, den kapitelübersicht und lektion rechts in ihrer kopfzeile zeigen, jeweils mit eigenem hilfe-inhalt
function buildHeadActions(onHelp) {
  const actions = document.createElement('div');
  actions.className = 'head-actions';
  const helpBtn = document.createElement('button');
  helpBtn.className = 'btn';
  helpBtn.textContent = 'Hilfe';
  helpBtn.onclick = onHelp;
  const settingsBtn = document.createElement('button');
  settingsBtn.className = 'icon-btn';
  settingsBtn.title = 'Einstellungen';
  settingsBtn.setAttribute('aria-label', 'Einstellungen');
  settingsBtn.innerHTML = GEAR_ICON;
  settingsBtn.onclick = () => openSettingsModal();
  actions.append(helpBtn, settingsBtn);
  vollbildKnopfEinfuegen(actions);
  return actions;
}

// chapterView gehört zur kapitelübersicht (liste oder mindmap), wie slideIndex zur lektion
let state = { screen: 'menu', lessonId: null, slideIndex: 0, chapterView: 'list' };

// aufgeklappte kapitel, bewusst nicht in state (kein navigationsziel), beim start alle mit offenen lektionen (standardOffeneKapitel()), danach merkt sich das set, was der spieler auf- und zuklappt
const openChapters = new Set();
const kapitelAbgeschlossen = ch => ch.lessons.length > 0 && ch.lessons.every(isLessonComplete);
function standardOffeneKapitel() {
  openChapters.clear();
  CHAPTERS.filter(ch => !kapitelAbgeschlossen(ch)).forEach(ch => openChapters.add(ch.id));
}
standardOffeneKapitel();

// ob das kommentar-panel offen ist, bewusst nicht in state (kein navigationsziel), bleibt über folienwechsel erhalten
let notesOpen = false;

// verzögert das speichern eines kommentars beim tippen, damit nicht bei jedem tastendruck in den localStorage geschrieben wird
let noteSaveTimer = null;

// kapitel einer lektion, für den zurück-button
const chapterOf = lessonId => CHAPTERS.find(ch => ch.lessons.includes(lessonId));

// folien-ids der gerade offenen lektion, die schon gesehen wurden, solange sie nicht abgeschlossen ist, wird der stand in progress.js mitgeschrieben und beim erneuten öffnen geladen
let visitedSlides = new Set();
let visitedLessonId = null;
// folien der offenen lektion mit einer übung (meldet sich selbst an, js/uebung.js) und davon die gelösten
let uebungSlides = new Set();
let geloesteSlides = new Set();

// lädt den gespeicherten teilfortschritt, folien-ids, die es nicht mehr gibt, fallen heraus, sonst könnte die lektion nie abgeschlossen werden
function ladeTeilfortschritt(le) {
  const detail = loadLessonDetail(le.id);
  const gueltig = new Set(le.slides.map(s => s.id));
  const nurGueltige = (liste) => new Set(liste.filter(id => gueltig.has(id)));
  visitedSlides = nurGueltige(detail.besucht);
  uebungSlides = nurGueltige(detail.uebungen);
  geloesteSlides = nurGueltige(detail.geloest);
}

function speichereTeilfortschritt(le) {
  saveLessonDetail(le.id, {
    besucht: [...visitedSlides], uebungen: [...uebungSlides], geloest: [...geloesteSlides],
  });
}

// lektion gilt als abgeschlossen: jede folie gesehen und jede angemeldete übung gelöst
function pruefeAbschluss(le) {
  if (le.slides.every(s => visitedSlides.has(s.id)) && [...uebungSlides].every(id => geloesteSlides.has(id))) {
    markLessonComplete(le.id);
  } else {
    speichereTeilfortschritt(le);
  }
}

// aufräumfunktion der aktuellen folie, wenn sie etwas laufendes gestartet hat (cleanup-vertrag), render() ruft sie auf, bevor die folie den bildschirm verlässt
let activeCleanup = null;

// "vorherige"/"nächste"-knopf der offenen lektion für die pfeiltasten, nur in der lektion gesetzt, sonst null
let folienKnoepfe = null;

function goto(screen, extra = {}) {
  state = { ...state, screen, ...extra };
  render();
}

// zwischen liste und mindmap wechseln, ohne den screen zu verlassen
function setChapterView(view) {
  state = { ...state, screen: 'chapters', chapterView: view };
  render();
}

// von einer lektion zurück zur kapitelübersicht, ihr kapitel ist aufgeklappt, die ansicht (liste oder mindmap) bleibt wie sie war
// wo eine lektion nicht aus einer der beiden ansichten geöffnet wird ("fortsetzen" im hauptmenü), setzt der aufrufer chapterView selbst
function backToChapters() {
  const ch = chapterOf(state.lessonId);
  if (ch) openChapters.add(ch.id);
  goto('chapters');
}

function render() {
  if (activeCleanup) {
    activeCleanup();
    activeCleanup = null;
  }
  folienKnoepfe = null; // renderLesson() setzt sie neu
  if (state.screen === 'menu') renderMenu();
  else if (state.screen === 'chapters') renderChapters();
  else if (state.screen === 'lesson') renderLesson();
}

// pfeil links/rechts löst die folienknöpfe aus (auch über lektions- und kapitelgrenzen), damit es nur eine navigationslogik gibt, ein handler für die ganze app, deshalb ohne cleanup
// nichts tun, wenn die taste jemand anderes braucht: eingabefeld, auswahlliste, offenes pop-up, tastenkombination (alt+← ist "zurück" im browser), gehaltene taste oder eine übung hat sie schon behandelt
document.addEventListener('keydown', (e) => {
  if (!folienKnoepfe || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
  if (e.defaultPrevented || e.repeat || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
  if (document.querySelector('.modal-backdrop')) return;
  if (e.target instanceof Element && e.target.closest('input, textarea, select, [contenteditable]')) return;
  const knopf = e.key === 'ArrowLeft' ? folienKnoepfe.prev : folienKnoepfe.next;
  if (knopf.disabled) return;
  e.preventDefault();
  knopf.click();
});

// ===== pop-up-fenster =====
// allgemeiner mechanismus, kennt nur titel und html, variante 'fit': fenster so breit wie die breiteste zeile, überschrift zentriert (einstellungen)
function openModal(title, bodyHtml, variant) {
  closeModal();
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.id = 'appModal';
  const variantClass = variant ? ` modal--${variant}` : '';
  backdrop.innerHTML = `
    <div class="modal${variantClass}" role="dialog" aria-modal="true" aria-label="${title}">
      <div class="modal-head"><h3>${title}</h3><button class="modal-close" aria-label="Schließen">&times;</button></div>
      <div class="modal-body"><div class="modal-text">${bodyHtml}</div></div>
    </div>
  `;
  document.body.appendChild(backdrop);
  backdrop.querySelector('.modal-close').onclick = closeModal;
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeModal(); });
  document.addEventListener('keydown', onModalKeydown);
}
function onModalKeydown(e) {
  if (e.key === 'Escape') closeModal();
}
function closeModal() {
  const m = document.getElementById('appModal');
  if (m) m.remove();
  document.removeEventListener('keydown', onModalKeydown);
}

function openInfoModal() {
  const stand = standText(); // nur in der einzeldatei (build.js), nicht im entwicklungsbetrieb
  openModal('Über dieses Projekt', `
    <p>Diese interaktive Lehreinheit für die Programmierlehre richtet sich an Erstsemester ohne Programmiererfahrung. Sie zeigt, wie sich ein abstraktes Thema durch Interaktion und Gamification-Elemente erfahrbar machen lässt.</p>
    <p>Als Beispiel dient das Zusammenspiel von Compiler und Laufzeitumgebung. Roter Faden ist ein Roboter, der über eine einfache Programmiersprache gesteuert wird. Mit jedem Kapitel kommen neue Programmierkonzepte hinzu, und die Lernenden verfolgen, wie sich diese auf die Phasen des Compilers und auf die Laufzeitumgebung auswirken.</p>
    <p>Das Projekt ist im Rahmen der Bachelorarbeit von Leonard Hackenberg im Studiengang Medieninformatik im Fachbereich Medien der Hochschule Düsseldorf (HSD) entstanden.</p>
    <p>© 2026 Leonard Hackenberg. Lizenz: <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.de" target="_blank" rel="noopener">CC BY-NC-SA 4.0</a></p>
    ${stand ? `<p>${stand}</p>` : ''}
    ${LIZENZ_HTML}
  `);
}

// lizenzangabe der icons: alle icons stammen aus feather icons (mit-lizenz), bis auf den selbst gezeichneten roboter
// die mit-lizenz verlangt copyright- und lizenztext in jeder kopie, deshalb steht er in der app selbst (wandert so in die einzeldatei), eingeklappt
const LIZENZ_HTML = `
  <details class="lizenz">
    <summary>Icons: Feather Icons, © 2013–2023 Cole Bemis, MIT-Lizenz</summary>
    <pre>The MIT License (MIT)

Copyright (c) 2013-2023 Cole Bemis

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.</pre>
  </details>
`;

// tastenkürzel als tastenkappen (.taste), die größe stellt der browser-zoom ein, nicht die app
const taste = (t) => `<kbd class="taste">${t}</kbd>`;
// mehrere tasten, die zusammen gedrückt werden, mit einem + dazwischen
const kombi = (...tasten) => tasten.map(taste).join(' + ');
// links in der hilfe-zeile: drei kürzel untereinander (.hilfe-knoepfe stapelt sie)
const ZOOM_TASTEN = ['+', '−', '0'].map((t) => `<span class="tasten">${kombi('Strg', t)}</span>`).join('');
const ZOOM_TEXT = `Mit ${kombi('Strg', '+')} und ${kombi('Strg', '−')} vergrößerst oder verkleinerst du die Ansicht, ${kombi('Strg', '0')} setzt sie zurück. Auf dem Mac nimmst du ${taste('⌘')} statt ${taste('Strg')}.`;

// vollbild über die taste des browsers (einstellungen, abschnitt größe, und hilfe zum hauptmenü), wo es den vollbild-knopf gibt (vollbildMoeglich(), touch), entfallen diese texte
const VOLLBILD_TASTEN = `<span class="tasten">${taste('F11')}</span>`;
const VOLLBILD_TEXT = `${taste('F11')} schaltet den Vollbildmodus ein und aus, auf dem Mac ${kombi('Strg', '⌘', 'F')}.`;

// hilfe-button im hauptmenü: nur die bedienung dieses screens
// jede zeile: links eine nachbildung des echten knopfs (nur abbildung, gleiche farbrollen wie im menü), rechts kurz, was er tut
function openMenuHelpModal() {
  openModal('Hilfe zum Hauptmenü', `
    <div class="hilfe-zeile">
      <div class="hilfe-knoepfe"><span class="mini-knopf mini-knopf--akzent">Fortsetzen</span></div>
      <p>Bringt dich zur ersten Lektion, die du noch nicht abgeschlossen hast, und dort zur ersten offenen Folie.</p>
    </div>
    <div class="hilfe-zeile">
      <div class="hilfe-knoepfe"><span class="mini-knopf mini-knopf--primaer">Kapitelübersicht</span></div>
      <p>Alle Kapitel und ihre Lektionen auf einen Blick.</p>
    </div>
    <div class="hilfe-zeile">
      <div class="hilfe-knoepfe">
        <span class="mini-knopf">Daten exportieren</span>
        <span class="mini-knopf">Daten importieren</span>
      </div>
      <p>Dein Fortschritt und deine Kommentare liegen im Speicher deines Browsers. Als Datei kannst du sie sichern und, zum Beispiel auf einem anderen Gerät, wieder laden.<br>${WARN_ICON} Ein Import ersetzt deinen aktuellen Stand vollständig.</p>
    </div>
    <div class="hilfe-zeile">
      <div class="hilfe-knoepfe"><span class="mini-knopf mini-knopf--icon">${GEAR_ICON}</span></div>
      <p>Einstellungen: helle oder dunkle Darstellung, Farben für Rot-Grün-Schwäche, Fortschritt und Kommentare zurücksetzen.</p>
    </div>
    <div class="hilfe-zeile">
      <div class="hilfe-knoepfe">${ZOOM_TASTEN}</div>
      <p>${ZOOM_TEXT}</p>
    </div>
    ${vollbildMoeglich() ? '' : `<div class="hilfe-zeile">
      <div class="hilfe-knoepfe">${VOLLBILD_TASTEN}</div>
      <p>${VOLLBILD_TEXT}</p>
    </div>`}
  `, 'hilfe');
}

// hilfe-button in der kapitelübersicht, aufbau wie openMenuHelpModal(): links nachbildungen (kapitelzeile, lektionskarten in drei zuständen, balken, reiter), die mini-karten teilen sich ihre rahmenregeln mit den echten (.lesson-card.done/.angefangen)
function openChaptersHelpModal() {
  const chevron = '<svg class="mini-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>';
  openModal('Hilfe zur Kapitelübersicht', `
    <div class="hilfe-zeile">
      <div class="hilfe-knoepfe"><span class="mini-kapitel">${chevron}Kapitel 2</span></div>
      <p>Ein Klick auf ein Kapitel klappt seine Lektionen auf oder zu. Kapitel, in denen noch etwas offen ist, sind beim Start aufgeklappt.</p>
    </div>
    <div class="hilfe-zeile">
      <div class="hilfe-knoepfe">
        <span class="mini-karten">
          <span class="mini-karte" title="neu"></span>
          <span class="mini-karte angefangen" title="angefangen"></span>
          <span class="mini-karte done" title="abgeschlossen"></span>
        </span>
      </div>
      <p>Jede Karte ist eine Lektion, ein Klick öffnet sie. Grau heißt noch nicht begonnen, gestrichelt angefangen, farbig umrandet abgeschlossen. Abgeschlossen ist eine Lektion, wenn du jede Folie gesehen und jede Übung gelöst hast.</p>
    </div>
    <div class="hilfe-zeile">
      <div class="hilfe-knoepfe">
        <span class="mini-kapitel neu">Kapitel 3</span>
        <span class="mini-kapitel">Kapitel 2</span>
        <span class="mini-kapitel">Kapitel 1${CHECK_CIRCLE_ICON}</span>
      </div>
      <p>Dasselbe für ganze Kapitel: grau noch nicht begonnen, farbig angefangen, mit Haken abgeschlossen.</p>
    </div>
    <div class="hilfe-zeile">
      <div class="hilfe-knoepfe"><span class="mini-balken"><span></span></span></div>
      <p>Wie viele Lektionen du insgesamt abgeschlossen hast.</p>
    </div>
    <div class="hilfe-zeile">
      <div class="hilfe-knoepfe">
        <span class="mini-knopf">Kapitelübersicht</span>
        <span class="mini-knopf mini-knopf--flach">Mindmap</span>
      </div>
      <p>Wechselt zwischen dieser Liste und der Mindmap.</p>
    </div>
    <div class="hilfe-zeile">
      <div class="hilfe-knoepfe"><span class="mini-knopf">${chevron}Menü</span></div>
      <p>Zurück zum Hauptmenü.</p>
    </div>
  `, 'hilfe');
}

// hilfe in der mindmap-ansicht, eigener inhalt bei gleicher kopfzeile wie die liste
function openMindmapHelpModal() {
  openModal('Hilfe zur Mindmap', `
    <div class="hilfe-zeile">
      <div class="hilfe-knoepfe"><span class="mini-begriff">Compiler</span></div>
      <p>Die Mindmap zeigt die Fachbegriffe, die du kennengelernt hast. Ein Begriff erscheint, sobald du die Folie gesehen hast, auf der er eingeführt wird. Die Karte wächst also mit deinem Fortschritt.</p>
    </div>
    <div class="hilfe-zeile">
      <div class="hilfe-knoepfe"><span class="mini-begriff">Scanner</span></div>
      <p>Fahr mit der Maus in die Nähe eines Begriffs: Er wird größer, der Weg bis zur Mitte leuchtet auf.</p>
    </div>
    <div class="hilfe-zeile">
      <div class="hilfe-knoepfe"><span class="mini-begriff">Parser</span></div>
      <p>Ein Klick öffnet die Folie, auf der der Begriff erklärt wird. Mit „Kapitelübersicht“ kommst du von dort zurück in die Mindmap.</p>
    </div>
    <div class="hilfe-zeile">
      <div class="hilfe-knoepfe"><span class="mini-begriff neu">Token</span></div>
      <p>Der Punkt heißt: neu dazugekommen und noch nicht angeklickt.</p>
    </div>
  `, 'hilfe');
}

// bedienung der lektion als hilfe-zeilen, die mini-folienpunkte teilen sich ihre regeln mit den echten (.slide-dot.active/.uebung/.erledigt)
// mitPunkten: false lässt die erste zeile weg (auf übungsfolien, unter der hilfe der übung)
function lektionBedienungHtml(mitPunkten) {
  const zeile = (links, text) => `
    <div class="hilfe-zeile">
      <div class="hilfe-knoepfe">${links}</div>
      <p>${text}</p>
    </div>`;
  const punkt = (n, klasse = '') => `<span class="mini-punkt ${klasse}">${n}</span>`;
  const punkte = (...p) => `<span class="mini-punkte">${p.join('<span class="mini-verbinder"></span>')}</span>`;
  return [
    mitPunkten && zeile(punkte(punkt(1), punkt(2, 'active'), punkt(3)),
      'Die Punkte unten sind die Folien dieser Lektion, der hervorgehobene ist die aktuelle. Ein Klick springt direkt zu einer Folie.'),
    zeile(punkte(punkt(1), punkt(2, 'uebung'), punkt(3, 'erledigt')),
      'Grau heißt noch nicht gesehen, gestrichelt wartet hier eine Übung, ein farbiger Ring heißt erledigt. Sind alle Ringe farbig, ist die Lektion abgeschlossen.'),
    zeile(`<span class="mini-knopf">${CHEVRON_LEFT}Vorherige Folie</span><span class="mini-knopf">Nächste Folie${CHEVRON_RIGHT}</span>`,
      'Blättert zwischen den Folien. Auf der ersten und letzten Folie geht es direkt in die vorige bzw. nächste Lektion.'),
    zeile(['←', '→'].map((t) => `<span class="tasten">${taste(t)}</span>`).join(''),
      'Blättern auch mit den Pfeiltasten, solange du nicht gerade in ein Textfeld oder eine Auswahlliste schreibst.'),
    zeile(`<span class="mini-knopf mini-knopf--icon">${NOTE_ICON}</span>`,
      'Schreib einen Kommentar zu dieser Folie. Er wird automatisch gespeichert und ist beim nächsten Öffnen wieder da.'),
    zeile(`<span class="mini-knopf">${CHEVRON_LEFT}Kapitelübersicht</span>`,
      'Zurück zur Übersicht. Das Kapitel dieser Lektion ist dort aufgeklappt.'),
  ].filter(Boolean).join('');
}

// hilfe-button in der lektion: bedienung innerhalb einer lektion
// meldet die übung auf der folie ihre hilfe (meldeHilfe() in js/uebung.js), steht deren text oben, darunter die bedienung ohne die zeile zu den folienpunkten
function openLessonHelpModal(uebungHilfe) {
  if (uebungHilfe) {
    openModal('Hilfe zur Lektion', `
      <h4 class="modal-abschnitt">${uebungHilfe.titel}</h4>
      ${uebungHilfe.html}
      <h4 class="modal-abschnitt">Bedienung der Lektion</h4>
      ${lektionBedienungHtml(false)}
    `, 'hilfe');
    return;
  }
  openModal('Hilfe zur Lektion', lektionBedienungHtml(true), 'hilfe');
}

// einstellungen: bewusst kein eigener screen, sondern ein pop-up, es schließt sich einfach dorthin, wo man war
// umschalter hell/dunkel und farbsicht (normal/rot-grün), beides setzt das skript im <head> von index.html (window.darstellung, window.farbsicht), damit es vor dem ersten zeichnen feststeht, kein render(): eine laufende übung behält ihren zustand
// sonne und mond für hell/dunkel (feather „sun“ und „moon“), linien in der schriftfarbe des knopfs
const ICON_HELL = '<svg class="einst-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
const ICON_DUNKEL = '<svg class="einst-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

// optionen: [modus, beschriftung, icon (optional)]
const EINSTELLUNGEN = [
  { id: 'darstellung', label: 'Darstellung', optionen: [['hell', 'Hell', ICON_HELL], ['dunkel', 'Dunkel', ICON_DUNKEL]] },
  { id: 'farbsicht', label: 'Farbsicht', optionen: [['normal', 'Normal'], ['rot-gruen', 'Rot-Grün']] },
];

function openSettingsModal() {
  const vorhanden = EINSTELLUNGEN.filter((e) => window[e.id]);
  // ein gemeinsames raster: beschriftungen links in einer spalte, umschalter rechts gleich breit und in zwei gleich breite hälften geteilt (.einst-raster), zwischen den zeilen ein strich (.einst-trenner)
  const zeilen = [
    ...vorhanden.map((e) => `
      <div class="einst-zeile">
        <span class="einst-label" id="${e.id}Label">${e.label}</span>
        <div class="theme-seg" role="radiogroup" aria-labelledby="${e.id}Label" data-einstellung="${e.id}">
          ${e.optionen.map(([modus, text, icon]) => `<button type="button" role="radio" data-modus="${modus}">${icon ?? ''}${text}</button>`).join('')}
        </div>
      </div>`),
    `<div class="einst-zeile">
      <span class="einst-label">Größe</span>
      <p class="einst-text">${ZOOM_TEXT}${vollbildMoeglich() ? '' : `<br>${VOLLBILD_TEXT}`}</p>
    </div>`,
    `<div class="einst-zeile">
      <span class="einst-label">Daten</span>
      <button type="button" class="secondary einst-reset">Zurücksetzen</button>
    </div>
    <div class="rueckfrage" hidden></div>`,
  ];
  openModal('Einstellungen', `<div class="einst-raster">${zeilen.join('<hr class="einst-trenner">')}</div>`, 'fit');
  vorhanden.forEach((e) => segmentVerbinden(`#appModal .theme-seg[data-einstellung="${e.id}"] button`, window[e.id]));
  rueckfrageVerbinden(
    document.querySelector('#appModal .einst-reset'),
    document.querySelector('#appModal .rueckfrage'),
    'Dein gesamter Stand wird gelöscht: abgeschlossene Lektionen, besuchte Folien, gelöste Übungen und deine Kommentare. Willst du ihn behalten, sichere ihn vorher im Menü mit „Daten exportieren“.',
    'Alles löschen',
    alleDatenZuruecksetzen,
  );
}

// rückfrage vor einer folgenschweren aktion, aussehen wie die rückfrage vor einem phasenwechsel in 6.2 (frageWechsel() in compiler-weg.js): text, darunter eine harmlose wahl (hat den fokus, damit enter nichts löscht) und die eigentliche aktion
// sie steht unter dem knopf statt darüber zu schweben, weil das pop-up überstehenden inhalt abschneidet, esc schließt erst die rückfrage, dann das pop-up
function rueckfrageVerbinden(knopf, box, text, jaText, ja) {
  function aufTaste(e) {
    if (e.key !== 'Escape') return;
    e.stopPropagation(); // nicht auch noch das pop-up schließen (onModalKeydown)
    verbergen();
    knopf.focus();
  }
  function verbergen() {
    box.hidden = true;
    box.textContent = '';
    knopf.disabled = false;
    document.removeEventListener('keydown', aufTaste, true);
  }
  knopf.onclick = () => {
    box.innerHTML = `
      <div class="cw-wechsel-text">${text}</div>
      <div class="cw-wechsel-knoepfe">
        <button type="button" class="lex-btn-reset">Abbrechen</button>
        <button type="button" class="lex-btn-check">${jaText}</button>
      </div>`;
    const [nein, jaB] = box.querySelectorAll('button');
    nein.onclick = () => { verbergen(); knopf.focus(); };
    jaB.onclick = () => { verbergen(); ja(); };
    box.hidden = false;
    knopf.disabled = true;
    // capture-phase: läuft vor onModalKeydown, das sonst das ganze pop-up schließt
    document.addEventListener('keydown', aufTaste, true);
    nein.focus();
  };
}

// löscht den gesamten gespeicherten stand (fortschritt, neu-punkte der mindmap, kommentare), wie nach einem import: teilfortschritt beim nächsten rendern neu laden, kapitel nach dem neuen stand auf- und zuklappen
function alleDatenZuruecksetzen() {
  // ein gerade getippter kommentar wartet noch auf den speicher-timer (buildNotesPanel()), ohne diese zeile würde er sich nach dem löschen selbst wieder eintragen
  clearTimeout(noteSaveTimer);
  replaceProgress({});
  replaceNotes({});
  replaceGesehen([]); // ohne fortschritt ist auch nichts mehr freigeschaltet, neu-punkte starten von vorn
  visitedLessonId = null;
  standardOffeneKapitel();
  closeModal();
  render();
}

// verbindet eine radiogruppe mit einem objekt mit lesen()/setzen() und hält aria-checked aktuell
function segmentVerbinden(selektor, objekt) {
  const knoepfe = document.querySelectorAll(selektor);
  const markieren = () => {
    const aktuell = objekt.lesen();
    knoepfe.forEach((b) => b.setAttribute('aria-checked', String(b.dataset.modus === aktuell)));
  };
  knoepfe.forEach((b) => {
    b.onclick = () => { objekt.setzen(b.dataset.modus); markieren(); };
  });
  markieren();
}

// ===== daten exportieren/importieren =====
// eine datei für fortschritt und kommentare, damit im menü nur ein export-/import-button nötig ist, progress.js und notes.js kennen nur ihren eigenen teil, nur hier werden beide zusammengeführt
function exportData() {
  const payload = {
    fortschritt: loadProgress(),
    notizen: loadNotes(),
    mindmap: loadGesehen(), // optional: welche begriffe schon angeklickt wurden (neu-punkte)
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = EXPORT_FILENAME;
  a.click();
  URL.revokeObjectURL(url);
}

// ersetzt den gespeicherten stand vollständig und führt nichts mit dem bisherigen zusammen
// bewusst keine rückwärtskompatibilität zum alten reinen fortschritts-export: eine so alte datei hat weder "fortschritt" noch "notizen" und würde den stand ohne fehlermeldung durch nichts ersetzen
function importData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        replaceProgress(parsed.fortschritt);
        replaceNotes(parsed.notizen);
        // "mindmap" ist optional, fehlt es (datei von vor der mindmap), gelten alle durch den importierten fortschritt freigeschalteten begriffe als gesehen, sonst trüge nach dem import jeder einen neu-punkt
        replaceGesehen(Array.isArray(parsed.mindmap) ? parsed.mindmap : freigeschalteteBegriffe());
        visitedLessonId = null; // teilfortschritt der lektion beim nächsten öffnen neu laden
        standardOffeneKapitel(); // auf-/zuklappen nach dem neuen stand richten
        resolve();
      } catch (err) {
        reject(new Error('Datei ist kein gültiger Daten-Export.'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function renderMenu() {
  app.innerHTML = `
    <div class="head-actions menu-head-actions">
      <button class="btn" id="btnHelp">Hilfe</button>
      <button class="icon-btn" id="btnSettings" title="Einstellungen" aria-label="Einstellungen">${GEAR_ICON}</button>
    </div>
    <header class="mt">
      <p class="mt-kicker">Interaktive Lehreinheit</p>
      <p class="mt-kommentar">für die Programmierlehre zum Thema</p>
      <h1 class="mt-titel" aria-label="Zusammenspiel von Compiler und Laufzeitumgebung">
        <span class="mt-zeile">Zusammenspiel von</span>
        <span class="mt-pipeline" aria-hidden="true">
          <span class="mt-name mt-compile">Compiler</span>
          <span class="mt-und">und</span>
          <span class="mt-name mt-run">Laufzeitumgebung</span>
          <span class="mt-label mt-compile">COMPILE TIME</span>
          <span class="mt-pfeil"><span class="mt-schaft"></span><span class="mt-spitze"></span></span>
          <span class="mt-label mt-run">RUN TIME</span>
        </span>
      </h1>
    </header>
    <div class="menu-actions">
      <button class="menu-btn menu-btn-akzent" id="btnContinue">Fortsetzen</button>
      <button class="primary" id="btnStart">Kapitelübersicht</button>
      <button class="menu-btn" id="btnInfo">Über dieses Projekt</button>
    </div>
    <div class="progress-tools">
      <button id="btnExport" class="secondary">Daten exportieren</button>
      <button id="btnImport" class="secondary">Daten importieren</button>
      <input type="file" id="fileImport" accept="application/json" hidden>
    </div>
  `;
  vollbildKnopfEinfuegen(app.querySelector('.menu-head-actions'));
  // nur in der prüferversion (npm run build:pruefer): knopf links neben "hilfe"
  if (PRUEFERVERSION) {
    const prueferBtn = document.createElement('button');
    prueferBtn.className = 'btn';
    prueferBtn.id = 'btnPruefer';
    prueferBtn.textContent = 'Prüferversion';
    prueferBtn.onclick = () => openModal('Prüferversion', `
      <p>Inhalt und Übungen sind dieselben wie in der normalen Version, in einem Punkt unterscheidet sich diese Version:</p>
      <p>In den Übungen ist „Schritt vormachen“ von Anfang an sichtbar. In der normalen Version erscheint der Knopf erst, wenn man mehrfach nicht weiterkommt. Mit ihm lässt sich jede Übung im Schnelldurchlauf durchgehen.</p>
      <p>Fortschritt und Kommentare werden im Browser gespeichert. Wer die Datei direkt von der Festplatte öffnet, teilt sich diesen Speicher mit anderen lokal geöffneten Versionen. Über „Daten exportieren“ und „Daten importieren“ im Hauptmenü lässt sich der Stand sichern oder übertragen.</p>
    `);
    document.getElementById('btnHelp').before(prueferBtn);
  }
  document.getElementById('btnStart').onclick = () => goto('chapters');
  const btnContinue = document.getElementById('btnContinue');
  const ziel = fortsetzenZiel();
  if (ziel) {
    // ziel gleich mit anzeigen, lektionsnummer wie in den lektionstiteln (3-4 → 3.4)
    btnContinue.textContent = `Fortsetzen · ${ziel.lessonId.replace('-', '.')} Folie ${ziel.slideIndex + 1}`;
    // chapterView: 'list', damit "zurück" aus dieser lektion in der liste landet und nicht in der mindmap, falls man sie zuletzt dort verlassen hat
    btnContinue.onclick = () => goto('lesson', { ...ziel, chapterView: 'list' });
  } else {
    btnContinue.disabled = true;
    btnContinue.title = 'Alle Lektionen abgeschlossen';
  }
  document.getElementById('btnInfo').onclick = () => openInfoModal();
  document.getElementById('btnHelp').onclick = () => openMenuHelpModal();
  document.getElementById('btnSettings').onclick = () => openSettingsModal();
  document.getElementById('btnExport').onclick = () => exportData();

  const fileInput = document.getElementById('fileImport');
  document.getElementById('btnImport').onclick = () => fileInput.click();
  fileInput.onchange = async () => {
    if (!fileInput.files[0]) return;
    try {
      await importData(fileInput.files[0]);
      render(); // aktualisiert z. b. häkchen und kommentare, falls schon sichtbar
    } catch (err) {
      alert(err.message);
    }
    fileInput.value = '';
  };

  // dekorative terminal-zeile unten links, die tipp-animation läuft per setTimeout, deshalb als cleanup merken
  activeCleanup = renderPrompt(app, {
    pfad: ['HSD', 'FB_Medien', 'interaktive_Lehreinheit'],
    befehl: './start_lehreinheit',
  });
}

// ===== mindmap =====
// die karte (js/mindmap.js) kennt weder fortschritt noch navigation, hier wird beides verbunden

// schlüssel aller begriffe, deren einführungsfolie besucht wurde, direkt aus dem fortschritt abgeleitet, nichts wird gesondert gespeichert: import, zurücksetzen der daten und gelöschte folien wirken so von selbst
// in einer abgeschlossenen lektion steht im fortschritt nur "true" statt der liste der besuchten folien, dort gelten alle folien als besucht
function freigeschalteteBegriffe() {
  const fortschritt = loadProgress();
  const besucht = (lektion, folie) => {
    const eintrag = fortschritt[lektion];
    return eintrag === true || (!!eintrag && Array.isArray(eintrag.besucht) && eintrag.besucht.includes(folie));
  };
  return alleBegriffe().filter((t) => {
    const { lektion, folie } = folieVon(t);
    return besucht(lektion, folie);
  }).map((t) => t.key);
}

// klick auf einen begriff: seine einführungsfolie öffnen, zurück führt wieder in die mindmap (chapterView bleibt 'mindmap')
function oeffneBegriff(term) {
  const { lektion, folie } = folieVon(term);
  const le = LESSONS[lektion];
  if (!le) return;
  markiereGesehen(term.key);
  goto('lesson', { lessonId: lektion, slideIndex: Math.max(0, le.slides.findIndex((s) => s.id === folie)) });
}

function renderMindmap() {
  // der container gibt der karte ihre größe (.mindmap-host), er muss schon im dokument hängen, bevor die karte entsteht
  const host = document.createElement('div');
  host.className = 'mindmap-host';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Mindmap der Fachbegriffe, die du bisher kennengelernt hast');
  host.appendChild(svg);
  app.appendChild(host);

  const mm = createMindMap(svg, BEGRIFFE, { onOpen: oeffneBegriff });
  const an = freigeschalteteBegriffe();
  const gesehen = new Set(loadGesehen());
  mm.setOn(an, an.filter((key) => !gesehen.has(key)));
  // render() ruft das vor dem nächsten screen auf
  activeCleanup = () => mm.destroy();
}

function renderChapters() {
  app.innerHTML = '';

  // eigene kopfzeile dieses screens: zurück, reiter, fortschritt, rechts hilfe und einstellungen, bleibt beim scrollen oben stehen (.screen-head--sticky)
  const head = document.createElement('div');
  head.className = 'screen-head screen-head--sticky';

  const back = document.createElement('button');
  back.className = 'back';
  back.innerHTML = CHEVRON_LEFT + '<span class="btn-label">Menü</span>';
  back.onclick = () => goto('menu');
  head.appendChild(back);

  // umschalter zwischen liste und mindmap, wechselt nur state.chapterView, state.screen bleibt "chapters"
  const tabs = document.createElement('div');
  tabs.className = 'view-tabs';
  tabs.setAttribute('role', 'tablist');
  tabs.setAttribute('aria-label', 'Ansicht');
  const views = [
    { id: 'list', label: 'Kapitelübersicht' },
    { id: 'mindmap', label: 'Mindmap' },
  ];
  views.forEach(v => {
    const tab = document.createElement('button');
    tab.className = 'view-tab';
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', String(state.chapterView === v.id));
    tab.textContent = v.label;
    tab.onclick = () => setChapterView(v.id);
    tabs.appendChild(tab);
  });
  tabs.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    setChapterView(state.chapterView === 'mindmap' ? 'list' : 'mindmap');
  });
  head.appendChild(tabs);

  // gesamtfortschritt über alle lektionen, rein berechnet aus progress.js, gilt für liste und mindmap, deshalb in der gemeinsamen kopfzeile
  const allLessonIds = CHAPTERS.flatMap(ch => ch.lessons);
  const { percent } = courseProgress(allLessonIds);
  const progress = document.createElement('div');
  progress.className = 'progress';
  progress.setAttribute('role', 'img');
  progress.setAttribute('aria-label', `Fortschritt ${percent} Prozent`);
  progress.innerHTML = `
    <span class="progress-label">Fortschritt:</span>
    <div class="progress-track"><div class="progress-fill" style="width:${percent}%"></div></div>
    <span class="progress-value">${percent}%</span>
  `;
  head.appendChild(progress);

  // hilfe richtet sich nach der gerade gewählten ansicht (liste oder mindmap)
  head.appendChild(buildHeadActions(() => {
    if (state.chapterView === 'mindmap') openMindmapHelpModal();
    else openChaptersHelpModal();
  }));

  app.appendChild(head);

  if (state.chapterView === 'mindmap') {
    renderMindmap();
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'chapter-grid';
  CHAPTERS.forEach(ch => {
    // aufklappbares kapitel (details/summary), der offene zustand steht in openChapters, nicht in state
    const sec = document.createElement('details');
    sec.className = 'chapter';
    sec.open = openChapters.has(ch.id);
    sec.addEventListener('toggle', () => {
      if (sec.open) openChapters.add(ch.id);
      else openChapters.delete(ch.id);
    });
    // kapitel abgeschlossen, wenn jede seiner lektionen abgeschlossen ist: haken hinter "Kapitel n"
    const kapitelFertig = kapitelAbgeschlossen(ch);
    // noch nicht bearbeitet: keine lektion abgeschlossen und keine folie besucht, dann ist "Kapitel n" grau
    const kapitelNeu = ch.lessons.every(id => !isLessonComplete(id) && loadLessonDetail(id).besucht.length === 0);
    sec.innerHTML = `
      <summary>
        <svg class="chap-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        <div class="chapter-head">
          <span class="chapter-num${kapitelNeu ? ' neu' : ''}">Kapitel ${ch.id}${kapitelFertig ? CHECK_CIRCLE_ICON : ''}</span>
          <h2>${ch.title}</h2>
          <p>${ch.desc}</p>
        </div>
      </summary>
    `;

    const body = document.createElement('div');
    body.className = 'chapter-body';
    const row = document.createElement('div');
    row.className = 'lesson-row';
    ch.lessons.forEach(id => {
      const le = LESSONS[id];
      const done = isLessonComplete(id);
      // angefangen: mindestens eine folie besucht, aber noch nicht abgeschlossen
      const angefangen = !done && loadLessonDetail(id).besucht.length > 0;
      const card = document.createElement('button');
      card.className = 'lesson-card' + (done ? ' done' : '') + (angefangen ? ' angefangen' : '');
      card.innerHTML = `<h3>${le.title}</h3><p>${le.desc}</p>`;
      card.onclick = () => goto('lesson', { lessonId: id, slideIndex: 0 });
      row.appendChild(card);
    });
    body.appendChild(row);
    sec.appendChild(body);
    grid.appendChild(sec);
  });
  app.appendChild(grid);
}

// nachbar-lektion in der reihenfolge von data/kapitel.js (über kapitelgrenzen), dir = -1 (vorherige) oder +1 (nächste), lektions-ids ohne eintrag in LESSONS werden übersprungen, null bei der ersten bzw. letzten lektion
function neighborLesson(dir) {
  const ids = CHAPTERS.flatMap(ch => ch.lessons).filter(id => LESSONS[id]);
  const next = ids[ids.indexOf(state.lessonId) + dir];
  return next === undefined ? null : next;
}

// ziel von "fortsetzen": die erste nicht abgeschlossene lektion und darin die erste folie, die noch nicht besucht wurde oder eine ungelöste übung enthält, also die lücke, die den abschluss verhindert, null wenn alles abgeschlossen ist
function fortsetzenZiel() {
  const ids = CHAPTERS.flatMap(ch => ch.lessons).filter(id => LESSONS[id]);
  const lessonId = ids.find(id => !isLessonComplete(id));
  if (!lessonId) return null;
  const { besucht, uebungen, geloest } = loadLessonDetail(lessonId);
  const i = LESSONS[lessonId].slides.findIndex(s =>
    !besucht.includes(s.id) || (uebungen.includes(s.id) && !geloest.includes(s.id)));
  return { lessonId, slideIndex: i === -1 ? 0 : i };
}

function renderLesson() {
  const le = LESSONS[state.lessonId];
  const slide = le.slides[state.slideIndex];
  app.innerHTML = '';

  // eigene kopfzeile dieses screens: zurück links, titel daneben, beides innerhalb des rahmens
  const head = document.createElement('div');
  head.className = 'screen-head';
  const back = document.createElement('button');
  back.className = 'back';
  back.innerHTML = CHEVRON_LEFT + '<span class="btn-label">Kapitelübersicht</span>';
  back.onclick = backToChapters;
  // lektionstitel und folientitel stehen in einer zeile (spart höhe), der lektionstitel ist farbig abgesetzt
  const h1 = document.createElement('h1');
  h1.className = 'lesson-head-title';
  // die nummer ("1.3") steht vorn im titelstring und bleibt immer sichtbar, der rest liegt in einem wrapper, aus dem bei platzmangel zuerst der titeltext herausfällt (.lesson-head-rest)
  const titelTeile = le.title.match(/^(\d+\.\d+)\s+(.*)$/);
  const nummerEl = document.createElement('span');
  nummerEl.className = 'lesson-head-nr';
  nummerEl.textContent = titelTeile ? titelTeile[1] : '';
  const lektionEl = document.createElement('span');
  lektionEl.className = 'lesson-head-lektion';
  lektionEl.textContent = titelTeile ? titelTeile[2] : le.title;
  const folieEl = document.createElement('span');
  folieEl.className = 'lesson-head-folie';
  folieEl.textContent = slide.title;
  const trennEl = document.createElement('span');
  trennEl.className = 'lesson-head-trenner';
  trennEl.setAttribute('aria-hidden', 'true');
  trennEl.textContent = '/';
  const restEl = document.createElement('span');
  restEl.className = 'lesson-head-rest';
  restEl.append(lektionEl, trennEl, folieEl);
  h1.append(nummerEl, restEl);
  h1.title = le.title + ' / ' + slide.title;
  head.append(back, h1);

  // kommentar-button steht in derselben reihe wie hilfe/zahnrad, ist aber nur für die lektion da, deshalb hier eingefügt statt buildHeadActions() zu erweitern
  // hilfetext der übung auf dieser folie, falls sie einen meldet (siehe slide.render unten)
  let uebungHilfe = null;
  const headActions = buildHeadActions(() => openLessonHelpModal(uebungHilfe));
  const notesBtn = document.createElement('button');
  notesBtn.className = 'icon-btn' + (notesOpen ? ' active' : '');
  notesBtn.title = 'Kommentare';
  notesBtn.setAttribute('aria-label', 'Kommentare zu dieser Folie');
  notesBtn.setAttribute('aria-pressed', String(notesOpen));
  notesBtn.innerHTML = NOTE_ICON;
  // öffnen/schließen hängt nur das panel an oder nimmt es weg, bewusst ohne render(): ein render() würde die folie neu bauen und eine laufende übung von vorn starten, das panel liegt über der folie (.notes-panel)
  function setzeNotesOffen(offen) {
    notesOpen = offen;
    notesBtn.classList.toggle('active', notesOpen);
    notesBtn.setAttribute('aria-pressed', String(notesOpen));
    const panel = body.querySelector('.notes-panel');
    if (panel) {
      // noch nicht gespeicherten text sofort sichern, sonst zeigt ein gleich wieder geöffnetes panel den alten stand
      clearTimeout(noteSaveTimer);
      setNote(le.id, slide.id, panel.querySelector('textarea').value);
      panel.remove();
    }
    if (notesOpen) {
      body.appendChild(buildNotesPanel(le.id, slide.id, schliesseNotes));
      body.querySelector('.notes-panel textarea').focus();
    }
  }
  // schließen über das x oder escape: fokus zurück auf den knopf, der es geöffnet hat
  function schliesseNotes() {
    setzeNotesOffen(false);
    notesBtn.focus();
  }
  notesBtn.onclick = () => setzeNotesOffen(!notesOpen);
  headActions.insertBefore(notesBtn, headActions.firstChild);
  head.appendChild(headActions);

  app.appendChild(head);

  // fortschritt: sobald jede folie angesehen und jede übung gelöst wurde, gilt die lektion als abgeschlossen (geprüft am ende dieser funktion, nachdem die folie gebaut ist und ihre übung sich angemeldet hat), beim öffnen einer anderen lektion wird deren teilfortschritt geladen
  if (visitedLessonId !== state.lessonId) {
    visitedLessonId = state.lessonId;
    ladeTeilfortschritt(le);
  }
  visitedSlides.add(slide.id);
  const schonAbgeschlossen = isLessonComplete(le.id);

  // navigation zwischen den folien: zurück links, folienpunkte mit verbindungslinie in der mitte, weiter rechts, die buttons stehen an festen außenpositionen, damit sie nicht mit der folienzahl wandern
  // auf der ersten/letzten folie springen zurück/weiter in die vorherige/nächste lektion (auch über kapitelgrenzen), zurück landet auf der letzten folie der vorherigen lektion
  const nav = document.createElement('div');
  nav.className = 'slide-nav';

  const isFirst = state.slideIndex === 0;
  const isLast = state.slideIndex === le.slides.length - 1;
  const prevLessonId = isFirst ? neighborLesson(-1) : null;
  const nextLessonId = isLast ? neighborLesson(1) : null;

  // liegt die ziel-lektion in einem anderen kapitel, heißt der button "kapitel" (neutrum: vorheriges/nächstes), sonst "lektion"
  const sameChapter = targetId => chapterOf(targetId) === chapterOf(state.lessonId);
  const prevLabel = !prevLessonId ? 'Vorherige Folie'
    : sameChapter(prevLessonId) ? 'Vorherige Lektion' : 'Vorheriges Kapitel';
  const nextLabel = !nextLessonId ? 'Nächste Folie'
    : sameChapter(nextLessonId) ? 'Nächste Lektion' : 'Nächstes Kapitel';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'btn slide-prev';
  prevBtn.innerHTML = CHEVRON_LEFT + `<span class="btn-label">${prevLabel}</span>`;
  prevBtn.disabled = isFirst && !prevLessonId;
  prevBtn.onclick = () => {
    if (prevLessonId) {
      goto('lesson', { lessonId: prevLessonId, slideIndex: LESSONS[prevLessonId].slides.length - 1 });
    } else {
      goto('lesson', { lessonId: state.lessonId, slideIndex: state.slideIndex - 1 });
    }
  };

  const dots = document.createElement('div');
  dots.className = 'slide-dots';
  const dotEls = [];
  // zustand eines folienpunkts (nur der ring wird gefärbt, .slide-dot): "uebung" = übung noch nicht gelöst (gestrichelt), "erledigt" = gesehen und, falls übung, gelöst (ring in --abgeschlossen)
  // in einer abgeschlossenen lektion sind alle folien erledigt, wird erneut aufgerufen, sobald sich die übung der offenen folie anmeldet oder gelöst wird
  const dotZustand = (i) => {
    const id = le.slides[i].id;
    const offeneUebung = !schonAbgeschlossen && uebungSlides.has(id) && !geloesteSlides.has(id);
    dotEls[i].classList.toggle('uebung', offeneUebung);
    dotEls[i].classList.toggle('erledigt', schonAbgeschlossen || (visitedSlides.has(id) && !offeneUebung));
  };
  le.slides.forEach((s, i) => {
    const b = document.createElement('button');
    b.textContent = i + 1;
    b.title = s.title;
    b.className = 'slide-dot' + (i === state.slideIndex ? ' active' : '');
    b.onclick = () => goto('lesson', { lessonId: state.lessonId, slideIndex: i });
    dots.appendChild(b);
    dotEls.push(b);
    dotZustand(i);
    if (i < le.slides.length - 1) {
      const connector = document.createElement('span');
      connector.className = 'slide-connector';
      dots.appendChild(connector);
    }
  });

  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn slide-next';
  nextBtn.innerHTML = `<span class="btn-label">${nextLabel}</span>` + CHEVRON_RIGHT;
  nextBtn.disabled = isLast && !nextLessonId;
  nextBtn.onclick = () => {
    if (nextLessonId) {
      goto('lesson', { lessonId: nextLessonId, slideIndex: 0 });
    } else {
      goto('lesson', { lessonId: state.lessonId, slideIndex: state.slideIndex + 1 });
    }
  };

  nav.append(prevBtn, dots, nextBtn);
  folienKnoepfe = { prev: prevBtn, next: nextBtn }; // für die pfeiltasten

  // die folie füllt die verbleibende höhe (.lesson-body), lang werdender inhalt scrollt innerhalb von .slide, das kommentar-panel liegt, falls geöffnet, oben rechts über der folie
  const body = document.createElement('div');
  body.className = 'lesson-body';
  app.appendChild(body);
  // die navigationsleiste steht unter der folie
  app.appendChild(nav);

  const stage = document.createElement('div');
  stage.className = 'slide';
  body.appendChild(stage);

  // der folientitel steht in der kopfzeile, hier nur als name des bereichs
  stage.setAttribute('aria-label', slide.title);

  if (slide.render) {
    // gebaute folie: die lektion bringt ihre render-funktion mit, gibt sie eine funktion zurück, merkt app.js sie als cleanup und ruft sie auf, sobald die nächste folie oder ein anderer screen gerendert wird
    const box = document.createElement('div');
    stage.appendChild(box);
    // eine übung meldet sich an und später ihren erfolg (js/uebung.js), gelöst wird nur gezählt, solange die folie noch offen ist, ein verspätetes ereignis einer verlassenen folie (z. b. aus einem timer) darf die zählung der nächsten nicht verändern
    const lessonId = state.lessonId, slideIndex = state.slideIndex;
    const nochOffen = () => state.screen === 'lesson' && state.lessonId === lessonId && state.slideIndex === slideIndex;
    box.addEventListener(UEBUNG_ANGEMELDET, () => {
      if (!nochOffen()) return;
      uebungSlides.add(slide.id);
      // in einer abgeschlossenen lektion gilt jede übung als gelöst, auch wenn man sie noch einmal ansieht
      if (schonAbgeschlossen) geloesteSlides.add(slide.id);
      dotZustand(slideIndex);
    });
    box.addEventListener(UEBUNG_GELOEST, () => {
      if (!nochOffen()) return;
      geloesteSlides.add(slide.id);
      dotZustand(slideIndex);
      pruefeAbschluss(le);
    });
    // eine übung, die mit dem fenster wachsen soll, nimmt die volle folienbreite (sonst passt sich die folie ihrem inhalt an, .slide--voll)
    box.addEventListener(UEBUNG_BREITE, (e) => stage.classList.toggle('slide--voll', e.detail !== false));
    box.addEventListener(UEBUNG_HILFE, (e) => {
      if (!nochOffen() || !e.detail) return;
      uebungHilfe = e.detail;
    });
    const cleanup = slide.render(box);
    if (typeof cleanup === 'function') activeCleanup = cleanup;
  } else if (slide.text) {
    // reine textfolie, optional mit eigener abbildung
    const copy = document.createElement('div');
    copy.className = 'slide-copy';
    copy.innerHTML = slide.text.map(t => `<p>${t}</p>`).join('');
    stage.appendChild(copy);

    if (slide.figure) {
      const fig = document.createElement('div');
      fig.className = 'slide-figure';
      fig.innerHTML = slide.figure;
      stage.appendChild(fig);
    }
  }

  pruefeAbschluss(le);

  if (notesOpen) body.appendChild(buildNotesPanel(le.id, slide.id, schliesseNotes));
}

// kommentar-panel zu genau dieser folie, über die folien-id gespeichert (js/notes.js), gespeichert wird beim tippen mit kurzer verzögerung, bewusst ohne render(), sonst ginge der fokus verloren
// onClose: schließt das panel (x-knopf und escape, solange der fokus im panel liegt), der listener hängt am panel selbst und verschwindet mit ihm
function buildNotesPanel(lessonId, slideId, onClose) {
  const panel = document.createElement('div');
  panel.className = 'notes-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Kommentare zu dieser Folie');
  const panelTitle = document.createElement('h3');
  panelTitle.textContent = 'Kommentare';
  panel.appendChild(panelTitle);

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'msg-x';
  closeBtn.setAttribute('aria-label', 'Kommentare schließen');
  closeBtn.textContent = '×';
  closeBtn.onclick = onClose;
  panel.appendChild(closeBtn);
  panel.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
  });

  const textarea = document.createElement('textarea');
  textarea.rows = 7;
  textarea.placeholder = 'Kommentar zu dieser Folie ...';
  textarea.value = getNote(lessonId, slideId);
  textarea.oninput = () => {
    const value = textarea.value;
    clearTimeout(noteSaveTimer);
    noteSaveTimer = setTimeout(() => setNote(lessonId, slideId, value), 400);
  };
  panel.appendChild(textarea);
  return panel;
}

render();

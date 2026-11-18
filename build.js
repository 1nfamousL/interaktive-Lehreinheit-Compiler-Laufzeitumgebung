/*
  build

  fasst die anwendung zu einer einzigen datei in dist/ zusammen, die sich ohne server per doppelklick (file://) öffnen lässt
  aufruf: npm run build, für die prüferversion npm run build:pruefer (name mit "_prueferversion", hinweis im info-pop-up)
  ein zweiter build am selben tag überschreibt die datei, dateien früherer tage bleiben liegen
*/

import { build, transform } from 'esbuild';
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import path from 'node:path';

// der einzige kommentar der datei in dist/, direkt unter dem doctype, kein doppelter bindestrich im text, sonst ist es kein gültiger html-kommentar
const KOPFKOMMENT = `
  Interaktive Lehreinheit: Zusammenspiel von Compiler und Laufzeitumgebung
  Autor: Leonard Hackenberg. Lizenz: CC BY-NC-SA 4.0 (siehe LICENSE im Projekt).
`;

// prüferversion: node build.js --pruefer, der tag des builds (lokale zeit) als JJJJ-MM-TT steht im dateinamen, im kopfkommentar und im info-pop-up
const pruefer = process.argv.includes('--pruefer');
const jetzt = new Date();
const baudatum = [jetzt.getFullYear(), String(jetzt.getMonth() + 1).padStart(2, '0'), String(jetzt.getDate()).padStart(2, '0')].join('-');
const dateiname = `interaktive-lehreinheit_${baudatum}${pruefer ? '_prueferversion' : ''}.html`;

const MIME_BY_EXT = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

// bettet die bilder aus url("../assets/...") in den dateien unter css/ (nach dem bündeln, esbuild schreibt die pfade ohne anführungszeichen), die pfade bleiben so stehen wie in der quelldatei, also relativ zu css/
async function embedCssUrls(cssText) {
  const pattern = /url\((["']?)(?:\.\.\/)?(assets\/[^"')]+\.(png|jpe?g|gif|webp|svg))\1\)/gi;
  let out = cssText;

  for (const [full, , relPath] of [...cssText.matchAll(pattern)]) {
    const ext = path.extname(relPath).toLowerCase();
    const absPath = path.resolve(process.cwd(), relPath);

    try {
      await access(absPath);
    } catch {
      throw new Error(
        `Datei nicht gefunden für den Build: "${relPath}" aus css/ ` +
        `(gesucht unter ${absPath}).`
      );
    }

    const bytes = await readFile(absPath);
    const dataUri = `data:${MIME_BY_EXT[ext]};base64,${bytes.toString('base64')}`;
    out = out.replace(full, `url("${dataUri}")`);
  }

  return out;
}

// minifiziert die inline-skripte der vorlage (ohne attribute, also nicht das modul-skript, das später ersetzt wird), muss laufen, bevor das bundle eingesetzt wird
async function minifiziereInlineSkripte(htmlText) {
  let out = htmlText;
  for (const [voll, code] of [...htmlText.matchAll(/<script>([\s\S]*?)<\/script>/g)]) {
    const klein = (await transform(code, { loader: 'js', minify: true, legalComments: 'none' })).code.trim();
    out = out.replace(voll, () => `<script>${klein}</script>`);
  }
  return out;
}

// minify kürzt lokale namen und entfernt leerraum und kommentare, eigenschaftsnamen, strings (lektionstexte) und css-klassen bleiben
const result = await build({
  entryPoints: ['js/app.js'],
  bundle: true,
  format: 'iife',
  write: false,
  minify: true,
  legalComments: 'none',
  logLevel: 'info',
  // datum und variante für das info-pop-up (js/bau-info.js)
  define: { __BAUDATUM__: JSON.stringify(baudatum), __PRUEFERVERSION__: String(pruefer) },
});

const bundledJs = result.outputFiles[0].text;
// style.css besteht nur aus @import-Zeilen auf css/*.css: esbuild setzt die Teile in dieser Reihenfolge zusammen (Bilder bleiben als url() stehen), dann die dateien einbetten, dann minifizieren
const cssBuendel = await build({
  entryPoints: ['style.css'],
  bundle: true,
  write: false,
  external: ['*.png', '*.jpg', '*.jpeg', '*.gif', '*.webp', '*.svg'],
  logLevel: 'info',
});
const css = (await transform(
  await embedCssUrls(cssBuendel.outputFiles[0].text),
  { loader: 'css', minify: true, legalComments: 'none' },
)).code;
let html = await readFile('index.html', 'utf8');

// beide anker müssen in index.html vorkommen (zeile geändert: anderes stylesheet, anderer script-pfad, zusätzliche attribute), sonst bricht der build laut ab, statt still eine datei mit alten, funktionslosen verweisen zu erzeugen
const linkTag = '<link rel="stylesheet" href="style.css">';
const scriptTag = '<script type="module" src="js/app.js"></script>';

if (!html.includes(linkTag)) {
  throw new Error(`Anker nicht gefunden in index.html: ${linkTag}`);
}
if (!html.includes(scriptTag)) {
  throw new Error(`Anker nicht gefunden in index.html: ${scriptTag}`);
}

if (!/^<!doctype html>/i.test(html)) {
  throw new Error('index.html muss mit <!DOCTYPE html> beginnen (hier kommt der Kopfkommentar hin).');
}

// nur die vorlage bereinigen, nie das eingesetzte bundle: in den lektionstexten könnte ein "<!--" als text vorkommen
html = html.replace(/<!--[\s\S]*?-->/g, '');
html = await minifiziereInlineSkripte(html);
const stand = `  Stand: ${baudatum}${pruefer ? ' (Prüferversion)' : ''}\n`;
html = html.replace(/^<!doctype html>/i, (doctype) => `${doctype}\n<!--${KOPFKOMMENT}${stand}-->`);

// als funktion ersetzen, nicht als string: in einem string würden $&, $' oder $$ aus dem minifizierten code als ersetzungsmuster gelesen
html = html.replace(linkTag, () => `<style>${css}</style>`);
html = html.replace(scriptTag, () => `<script>${bundledJs}</script>`);

await mkdir('dist', { recursive: true });
await writeFile(`dist/${dateiname}`, html);

console.log(`Fertig: dist/${dateiname} (eine einzige, eigenständige Datei)`);

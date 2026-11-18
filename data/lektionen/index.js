// Der einzige Ort, an dem alle Lektionsdateien zusammenlaufen.
// app.js kennt nicht jede einzelne Lektionsdatei, sondern nur diese eine.
//
// Neue Lektion hinzufügen:
//   1. Neue Datei hier im Ordner anlegen, z.B. 2-5.js, mit demselben
//      Aufbau (export const LEKTION = {...}).
//   2. Hier importieren und in LESSONS aufnehmen.
//   3. Die Lektions-ID in data/kapitel.js beim passenden Kapitel eintragen.

import { LEKTION as l1_1 } from './1-1.js';
import { LEKTION as l1_2 } from './1-2.js';
import { LEKTION as l1_3 } from './1-3.js';
import { LEKTION as l2_1 } from './2-1.js';
import { LEKTION as l2_2 } from './2-2.js';
import { LEKTION as l2_3 } from './2-3.js';
import { LEKTION as l2_4 } from './2-4.js';
import { LEKTION as l2_5 } from './2-5.js';
import { LEKTION as l2_6 } from './2-6.js';
import { LEKTION as l3_1 } from './3-1.js';
import { LEKTION as l3_2 } from './3-2.js';
import { LEKTION as l3_3 } from './3-3.js';
import { LEKTION as l3_4 } from './3-4.js';
import { LEKTION as l3_5 } from './3-5.js';
import { LEKTION as l3_6 } from './3-6.js';
import { LEKTION as l4_1 } from './4-1.js';
import { LEKTION as l4_2 } from './4-2.js';
import { LEKTION as l4_3 } from './4-3.js';
import { LEKTION as l4_4 } from './4-4.js';
import { LEKTION as l4_5 } from './4-5.js';
import { LEKTION as l4_6 } from './4-6.js';
import { LEKTION as l5_1 } from './5-1.js';
import { LEKTION as l5_2 } from './5-2.js';
import { LEKTION as l5_3 } from './5-3.js';
import { LEKTION as l5_4 } from './5-4.js';
import { LEKTION as l5_5 } from './5-5.js';
import { LEKTION as l5_6 } from './5-6.js';
import { LEKTION as l6_1 } from './6-1.js';
import { LEKTION as l6_2 } from './6-2.js';

export const LESSONS = {
  [l1_1.id]: l1_1,
  [l1_2.id]: l1_2,
  [l1_3.id]: l1_3,
  [l2_1.id]: l2_1,
  [l2_2.id]: l2_2,
  [l2_3.id]: l2_3,
  [l2_4.id]: l2_4,
  [l2_5.id]: l2_5,
  [l2_6.id]: l2_6,
  [l3_1.id]: l3_1,
  [l3_2.id]: l3_2,
  [l3_3.id]: l3_3,
  [l3_4.id]: l3_4,
  [l3_5.id]: l3_5,
  [l3_6.id]: l3_6,
  [l4_1.id]: l4_1,
  [l4_2.id]: l4_2,
  [l4_3.id]: l4_3,
  [l4_4.id]: l4_4,
  [l4_5.id]: l4_5,
  [l4_6.id]: l4_6,
  [l5_1.id]: l5_1,
  [l5_2.id]: l5_2,
  [l5_3.id]: l5_3,
  [l5_4.id]: l5_4,
  [l5_5.id]: l5_5,
  [l5_6.id]: l5_6,
  [l6_1.id]: l6_1,
  [l6_2.id]: l6_2,
};

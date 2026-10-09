import { LESSONS, type Item, type Step } from '@/data/curriculum';
import { ALL_LETTERS } from '@/data/letters';
import { vowelRow } from '@/data/curriculum/builders';
import { letterItem, maddItem, shaddaItem, sukunItem, tanwinItem, VOWEL_IDS } from '@/data/curriculum/items';
import type { Sound } from './sounds';

/**
 * Inventaire de tous les sons (hors mots du Coran) utilisés par le parcours :
 * sert à générer la liste des fichiers à enregistrer (`npm run audio:list`).
 */
export function expectedAudio(): { src: string; text: string }[] {
  const map = new Map<string, string>();
  const add = (s: Sound | undefined) => {
    if (s?.src && !s.src.startsWith('quran/')) map.set(s.src, s.text ?? '');
  };
  const addItem = (i: Item | undefined) => add(i?.sound);
  const fromStep = (step: Step) => {
    switch (step.kind) {
      case 'intro':
        addItem(step.hero);
        step.items?.forEach(addItem);
        break;
      case 'discover':
        step.items.forEach(addItem);
        break;
      case 'listen':
        step.options.forEach(addItem);
        break;
      case 'choose':
        add(step.question.sound);
        break;
      case 'match':
        step.pairs.forEach((p) => addItem(p.left));
        break;
      case 'repeat':
        step.lines.flat().forEach(addItem);
        break;
      case 'build':
        addItem(step.target);
        [...step.pieces, ...step.distractors].forEach(addItem);
        break;
    }
  };
  // Page « Alphabet » : nom, voyelles courtes et longues, tanwîn, soukoun, chadda.
  for (const l of ALL_LETTERS) {
    addItem(letterItem(l.id));
    VOWEL_IDS.forEach((v) => addItem(vowelRow([l.id], v)[0]));
    if (l.id === 'alif' || l.id === 'hamza') continue;
    VOWEL_IDS.forEach((v) => {
      addItem(maddItem(l.id, v));
      addItem(tanwinItem(l.id, v));
    });
    addItem(sukunItem(l.id));
    addItem(shaddaItem(l.id));
  }
  LESSONS.forEach((l) => l.steps.forEach(fromStep));
  return [...map].map(([src, text]) => ({ src, text })).sort((a, b) => a.src.localeCompare(b.src));
}

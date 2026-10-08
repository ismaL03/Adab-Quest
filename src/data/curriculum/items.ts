import { sounds, type Sound } from '@/audio/sounds';
import { graphemes, MARKS } from '@/lib/arabic';
import { ALL_LETTERS, letter as getLetter, type Letter } from '@/data/letters';
import type { Item } from './types';

/* ──────────────────────────────────────────────────────────────────────────
   Identification des caractères et des signes (sert à nommer les fichiers audio)
   ────────────────────────────────────────────────────────────────────────── */

const CHAR_IDS: Record<string, string> = {
  ...Object.fromEntries(ALL_LETTERS.map((l) => [l.char, l.id])),
  'أ': 'alif-hamza',
  'إ': 'alif-hamza-below',
  'آ': 'alif-madda',
  'ٱ': 'alif-wasla',
  'ؤ': 'waw-hamza',
  'ئ': 'ya-hamza',
  'ة': 'ta-marbuta',
  'ى': 'alif-maqsura',
  'ـ': 'tatweel',
};

const MARK_NAMES: [string, string][] = [
  [MARKS.shadda, 'shadda'],
  [MARKS.fatha, 'fatha'],
  [MARKS.kasra, 'kasra'],
  [MARKS.damma, 'damma'],
  [MARKS.tanwinFath, 'tanwin-fath'],
  [MARKS.tanwinKasr, 'tanwin-kasr'],
  [MARKS.tanwinDamm, 'tanwin-damm'],
  [MARKS.sukun, 'sukun'],
  [MARKS.sukunQuranic, 'sukun'],
  [MARKS.maddah, 'maddah'],
  [MARKS.daggerAlif, 'dagger-alif'],
  [MARKS.smallWaw, 'small-waw'],
  [MARKS.smallYa, 'small-ya'],
];
const MARK_ORDER = new Map(MARK_NAMES.map(([m, n], i) => [m, { n, i }]));

const hex = (ch: string) => `u${ch.codePointAt(0)!.toString(16)}`;

/** Clé stable d’un graphème : « ba-fatha », « nun-shadda-fatha », « alif-plain »… */
export function graphemeKey(text: string): string {
  const [first, ...rest] = Array.from(text);
  const base = CHAR_IDS[first] ?? hex(first);
  const marks = rest
    .filter((ch) => ch !== '‌' && ch !== '‍')
    .map((ch) => MARK_ORDER.get(ch) ?? { n: hex(ch), i: 99 })
    .sort((a, b) => a.i - b.i)
    .map((m) => m.n);
  return `${base}-${marks.length ? [...new Set(marks)].join('-') : 'plain'}`;
}

/** Clé d’une syllabe (un ou plusieurs graphèmes) : « qaf-fatha_alif-plain ». */
export function syllableKey(text: string): string {
  return graphemes(text)
    .map((g) => graphemeKey(g.text))
    .join('_');
}

const VOWEL_MARKS = new Set<string>([
  MARKS.fatha,
  MARKS.kasra,
  MARKS.damma,
  MARKS.tanwinFath,
  MARKS.tanwinKasr,
  MARKS.tanwinDamm,
  MARKS.shadda,
]);

/**
 * Découpe un mot vocalisé en syllabes de lecture :
 * une consonne voyellée + éventuelle lettre de prolongation ou consonne au soukoun.
 *   كَتَبَ → كَ · تَ · بَ      قَالَ → قَا · لَ      نَعْبُدُ → نَعْ · بُ · دُ
 */
export function syllabify(word: string): string[] {
  const out: string[] = [];
  for (const g of graphemes(word)) {
    const startsSyllable = Array.from(g.text).some((ch) => VOWEL_MARKS.has(ch));
    if (startsSyllable || out.length === 0) out.push(g.text);
    else out[out.length - 1] += g.text;
  }
  return out;
}

/* ──────────────────────────────────────────────────────────────────────────
   Translittération (convention francophone : « ou » pour la damma)
   ────────────────────────────────────────────────────────────────────────── */

export const VOWELS = {
  fatha: { mark: MARKS.fatha, name: 'Fatha', nameAr: 'فَتْحَة', sound: 'a', long: 'â', carrier: 'ا' },
  kasra: { mark: MARKS.kasra, name: 'Kasra', nameAr: 'كَسْرَة', sound: 'i', long: 'î', carrier: 'ي' },
  damma: { mark: MARKS.damma, name: 'Damma', nameAr: 'ضَمَّة', sound: 'ou', long: 'oû', carrier: 'و' },
} as const;

export type VowelId = keyof typeof VOWELS;
export const VOWEL_IDS: VowelId[] = ['fatha', 'kasra', 'damma'];

export const TANWIN = {
  fatha: { mark: MARKS.tanwinFath, sound: 'an', name: 'Tanwîn fath' },
  kasra: { mark: MARKS.tanwinKasr, sound: 'in', name: 'Tanwîn kasr' },
  damma: { mark: MARKS.tanwinDamm, sound: 'oun', name: 'Tanwîn damm' },
} as const;

/** Support de la voyelle pour la ligne « alif » (l’alif seul ne porte pas de voyelle). */
function carrier(l: Letter, vowel: VowelId): string {
  if (l.id !== 'alif') return l.char;
  return vowel === 'kasra' ? 'إ' : 'أ';
}

const consonant = (l: Letter) => (l.id === 'alif' ? '' : l.translit);

/* ──────────────────────────────────────────────────────────────────────────
   Fabriques d’items
   ────────────────────────────────────────────────────────────────────────── */

export function soundForText(text: string): Sound {
  const key = syllableKey(text);
  return { id: `syl:${key}`, src: `syllables/${key}.mp3`, tts: text };
}

export function textItem(ar: string, label?: string, meaning?: string): Item {
  const sound = soundForText(ar);
  return { id: sound.id, ar, sound, label, meaning };
}

/** La lettre isolée ; le son est son nom (« bâ’ »). */
export function letterItem(id: string): Item {
  const l = getLetter(id);
  return { id: `letter:${l.id}`, ar: l.char, sound: sounds.letterName(l.id, l.nameAr), label: l.name };
}

/** Lettre + voyelle courte : بَ بِ بُ */
export function vowelItem(id: string, vowel: VowelId): Item {
  const l = getLetter(id);
  return textItem(carrier(l, vowel) + VOWELS[vowel].mark, consonant(l) + VOWELS[vowel].sound);
}

/** Lettre + voyelle longue : بَا بِي بُو */
export function maddItem(id: string, vowel: VowelId): Item {
  const l = getLetter(id);
  const v = VOWELS[vowel];
  return textItem(carrier(l, vowel) + v.mark + v.carrier, consonant(l) + v.long);
}

/** Lettre + tanwîn : بًا بٍ بٌ */
export function tanwinItem(id: string, vowel: VowelId): Item {
  const l = getLetter(id);
  const t = TANWIN[vowel];
  // Le tanwîn fath s’écrit avec un alif de support : بًا
  const text = carrier(l, vowel) + t.mark + (vowel === 'fatha' ? 'ا' : '');
  return textItem(text, consonant(l) + t.sound);
}

/** Voyelle + lettre au soukoun : أَبْ إِبْ أُبْ */
export function sukunItem(id: string, vowel: VowelId = 'fatha'): Item {
  const l = getLetter(id);
  const v = VOWELS[vowel];
  const lead = vowel === 'kasra' ? 'إ' : 'أ';
  return textItem(lead + v.mark + l.char + MARKS.sukun, v.sound + l.translit);
}

/** Voyelle + lettre avec chadda : أَبَّ إِبِّ أُبُّ */
export function shaddaItem(id: string, vowel: VowelId = 'fatha'): Item {
  const l = getLetter(id);
  const v = VOWELS[vowel];
  const lead = vowel === 'kasra' ? 'إ' : 'أ';
  return textItem(lead + v.mark + l.char + MARKS.shadda + v.mark, v.sound + l.translit + l.translit + v.sound);
}

/** Mot de vocabulaire (avec son propre fichier audio). */
export interface WordEntry {
  slug: string;
  ar: string;
  translit: string;
  fr: string;
}

export function wordItem(w: WordEntry): Item {
  return { id: `word:${w.slug}`, ar: w.ar, sound: sounds.word(w.slug, w.ar), label: w.translit, meaning: w.fr };
}

/** Syllabes cliquables d’un mot (pour les exercices d’assemblage). */
export function syllableItems(word: string): Item[] {
  return syllabify(word).map((s) => textItem(s));
}

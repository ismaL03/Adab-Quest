/**
 * Outils typographiques pour l'arabe coranique (texte Uthmani Hafs).
 */

export const MARKS = {
  fatha: 'َ',
  kasra: 'ِ',
  damma: 'ُ',
  sukun: 'ْ',
  sukunQuranic: 'ۡ',
  shadda: 'ّ',
  tanwinFath: 'ً',
  tanwinDamm: 'ٌ',
  tanwinKasr: 'ٍ',
  maddah: 'ٓ',
  daggerAlif: 'ٰ',
  smallWaw: 'ۥ',
  smallYa: 'ۦ',
} as const;

export const TATWEEL = 'ـ';
export const ZWJ = '‍';

/** Signes combinants (harakat, signes coraniques). */
const COMBINING = /\p{M}/u;

export function isCombining(ch: string): boolean {
  return COMBINING.test(ch) || ch === '‌' || ch === '‍';
}

export interface Grapheme {
  /** Lettre de base (ou caractère non combinant). */
  base: string;
  /** Texte complet du graphème (base + signes). */
  text: string;
  /** Index (en points de code) du début du graphème dans le mot. */
  start: number;
  /** Nombre de points de code. */
  length: number;
}

/**
 * Découpe un texte en graphèmes « lettre + signes diacritiques ».
 * Les index sont exprimés en points de code (et non en unités UTF-16).
 */
export function graphemes(text: string): Grapheme[] {
  const chars = Array.from(text);
  const out: Grapheme[] = [];
  chars.forEach((ch, i) => {
    const last = out[out.length - 1];
    if (last && isCombining(ch)) {
      last.text += ch;
      last.length += 1;
    } else {
      out.push({ base: ch, text: ch, start: i, length: 1 });
    }
  });
  return out;
}

/** Retire toutes les voyelles et signes : utile pour les comparaisons. */
export function stripMarks(text: string): string {
  return Array.from(text)
    .filter((ch) => !isCombining(ch) && ch !== TATWEEL)
    .join('');
}

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export function toArabicDigits(n: number): string {
  return String(n)
    .split('')
    .map((d) => ARABIC_DIGITS[Number(d)] ?? d)
    .join('');
}

/** Lettres qui ne se lient jamais à la lettre suivante. */
export const NON_CONNECTORS = new Set(['ا', 'أ', 'إ', 'آ', 'ٱ', 'د', 'ذ', 'ر', 'ز', 'و', 'ؤ', 'ء', 'ة']);

export type LetterPosition = 'isolated' | 'initial' | 'medial' | 'final';

/**
 * Affiche une lettre dans sa forme contextuelle grâce au tatweel (ـ),
 * méthode la plus fiable avec la police KFGQPC.
 */
export function contextualForm(letter: string, position: LetterPosition): string {
  const connects = !NON_CONNECTORS.has(letter);
  switch (position) {
    case 'isolated':
      return letter;
    case 'initial':
      return connects ? letter + TATWEEL : letter;
    case 'medial':
      return connects ? TATWEEL + letter + TATWEEL : TATWEEL + letter;
    case 'final':
      return TATWEEL + letter;
  }
}

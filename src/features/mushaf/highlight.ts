import { graphemes, MARKS } from '@/lib/arabic';
import type { QuranWord } from '@/data/quran/loader';
import { resolveRuleColor, type ColorOptions, type TajweedRule } from './tajweed';

/**
 * Ce que l’on souhaite mettre en évidence dans le texte coranique :
 * une ou plusieurs lettres, des signes (voyelles, soukoun, chadda…)
 * et/ou des règles de Tajweed. Ce paramètre est passé à la Vue Mushaf.
 */
export interface HighlightSpec {
  letters?: string[];
  marks?: string[];
  rules?: TajweedRule[];
  /** Libellé lisible (« la lettre ب », « le soukoun »…). */
  label?: string;
}

/** Variantes graphiques d’une même lettre dans le texte Uthmani. */
const LETTER_VARIANTS: Record<string, string[]> = {
  ا: ['ا', 'أ', 'إ', 'آ', 'ٱ'],
  ء: ['ء', 'أ', 'إ', 'ؤ', 'ئ'],
};

/** Variantes graphiques d’un signe (ex. soukoun standard / coranique). */
const MARK_VARIANTS: Record<string, string[]> = {
  [MARKS.sukun]: [MARKS.sukun, MARKS.sukunQuranic],
};

export function expandLetters(letters: readonly string[]): Set<string> {
  const out = new Set<string>();
  for (const l of letters) for (const v of LETTER_VARIANTS[l] ?? [l]) out.add(v);
  return out;
}

export function expandMarks(marks: readonly string[]): Set<string> {
  const out = new Set<string>();
  for (const m of marks) for (const v of MARK_VARIANTS[m] ?? [m]) out.add(v);
  return out;
}

export interface WordRun {
  text: string;
  color: string | null;
  highlighted: boolean;
}

export interface WordAnalysis {
  runs: WordRun[];
  /** Nombre de graphèmes correspondant au paramètre de mise en évidence. */
  matches: number;
}

export interface AnalyzeOptions extends ColorOptions {
  tajweed: boolean;
}

export function isEmptySpec(spec?: HighlightSpec | null): boolean {
  return !spec || (!spec.letters?.length && !spec.marks?.length && !spec.rules?.length);
}

/**
 * Découpe un mot en « runs » colorés (Tajweed) et/ou mis en évidence (leçon).
 * Les couleurs sont appliquées au niveau du caractère, comme sur Quran.com ;
 * la mise en évidence couvre le graphème complet (lettre + signes).
 */
export function analyzeWord(word: QuranWord, spec: HighlightSpec | null | undefined, options: AnalyzeOptions): WordAnalysis {
  const chars: { ch: string; rules: TajweedRule[] }[] = [];
  for (const seg of word.segments) for (const ch of Array.from(seg.text)) chars.push({ ch, rules: seg.rules });

  const flagged = new Array<boolean>(chars.length).fill(false);
  let matches = 0;

  if (!isEmptySpec(spec)) {
    const letters = expandLetters(spec!.letters ?? []);
    const marks = expandMarks(spec!.marks ?? []);
    const rules = new Set(spec!.rules ?? []);
    for (const g of graphemes(word.text)) {
      const slice = chars.slice(g.start, g.start + g.length);
      const hit =
        letters.has(g.base) ||
        Array.from(g.text).some((ch) => marks.has(ch)) ||
        (rules.size > 0 && slice.some((c) => c.rules.some((r) => rules.has(r))));
      if (hit) {
        matches += 1;
        for (let i = g.start; i < g.start + g.length; i++) flagged[i] = true;
      }
    }
  }

  const runs: WordRun[] = [];
  chars.forEach((c, i) => {
    const color = options.tajweed ? resolveRuleColor(c.rules, options) : null;
    const highlighted = flagged[i];
    const last = runs[runs.length - 1];
    if (last && last.color === color && last.highlighted === highlighted) last.text += c.ch;
    else runs.push({ text: c.ch, color, highlighted });
  });

  return { runs, matches };
}

/** Nombre de mots d’une liste qui contiennent l’élément étudié. */
export function countMatchingWords(words: readonly QuranWord[], spec: HighlightSpec): number {
  return words.filter((w) => analyzeWord(w, spec, { tajweed: false }).matches > 0).length;
}

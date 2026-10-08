import { loadSurah } from '@/data/quran/loader';
import { countMatchingWords, type HighlightSpec } from './highlight';

export interface Passage {
  surah: number;
  from: number;
  to: number;
}

export interface PassageMatch extends Passage {
  /** Nombre de mots contenant l’élément étudié dans le passage. */
  matchingWords: number;
}

/** Courtes sourates connues des débutants, par ordre de préférence. */
export const BEGINNER_SURAHS = [
  1, 112, 113, 114, 108, 103, 110, 111, 105, 106, 107, 109, 97, 99, 101, 102, 104, 95, 94, 93, 100, 92, 91, 87, 86,
];

/**
 * Trouve automatiquement le passage (fenêtre de versets consécutifs) le plus
 * riche en occurrences de l’élément étudié parmi les sourates candidates.
 */
export async function findBestPassage(
  spec: HighlightSpec,
  { candidates = BEGINNER_SURAHS, maxVerses = 6 }: { candidates?: number[]; maxVerses?: number } = {},
): Promise<PassageMatch> {
  let best: PassageMatch | null = null;
  for (const [rank, surah] of candidates.entries()) {
    const verses = await loadSurah(surah);
    const counts = verses.map((v) => countMatchingWords(v.words, spec));
    const size = Math.min(maxVerses, verses.length);
    for (let start = 0; start + size <= verses.length; start++) {
      const total = counts.slice(start, start + size).reduce((a, b) => a + b, 0);
      // Légère préférence pour les sourates les plus connues (rang faible).
      const score = total - rank * 0.15;
      const bestScore = best ? best.matchingWords - candidates.indexOf(best.surah) * 0.15 : -Infinity;
      if (score > bestScore) {
        best = { surah, from: start + 1, to: start + size, matchingWords: total };
      }
    }
  }
  return best ?? { surah: 1, from: 1, to: 7, matchingWords: 0 };
}

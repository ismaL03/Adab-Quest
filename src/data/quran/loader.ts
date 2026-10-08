import { decodeRules, type TajweedRule } from '@/features/mushaf/tajweed';

type RawSegment = string | [string, number[]];
type RawWord = RawSegment[];
interface RawSurah {
  n: number;
  v: RawWord[][];
}

export interface QuranSegment {
  text: string;
  rules: TajweedRule[];
}

export interface QuranWord {
  surah: number;
  ayah: number;
  /** Position du mot dans le verset (à partir de 1, identique à Quran.com). */
  position: number;
  /** Clé unique « sourate:verset:position ». */
  key: string;
  text: string;
  segments: QuranSegment[];
}

export interface QuranVerse {
  surah: number;
  ayah: number;
  words: QuranWord[];
}

// Chaque sourate est un fichier JSON séparé : Vite en fait un chunk chargé à la demande.
const files = import.meta.glob<RawSurah>('./surahs/*.json', { import: 'default' });

const cache = new Map<number, Promise<QuranVerse[]>>();

function parseSurah(raw: RawSurah): QuranVerse[] {
  return raw.v.map((verse, vi) => {
    const ayah = vi + 1;
    return {
      surah: raw.n,
      ayah,
      words: verse.map((word, wi) => {
        const segments: QuranSegment[] = word.map((seg) =>
          typeof seg === 'string' ? { text: seg, rules: [] } : { text: seg[0], rules: decodeRules(seg[1]) },
        );
        return {
          surah: raw.n,
          ayah,
          position: wi + 1,
          key: `${raw.n}:${ayah}:${wi + 1}`,
          text: segments.map((s) => s.text).join(''),
          segments,
        };
      }),
    };
  });
}

export function loadSurah(n: number): Promise<QuranVerse[]> {
  const existing = cache.get(n);
  if (existing) return existing;
  const loader = files[`./surahs/${String(n).padStart(3, '0')}.json`];
  if (!loader) return Promise.reject(new Error(`Sourate introuvable : ${n}`));
  const promise = loader().then(parseSurah);
  promise.catch(() => cache.delete(n));
  cache.set(n, promise);
  return promise;
}

export async function loadVerses(surah: number, from = 1, to?: number): Promise<QuranVerse[]> {
  const verses = await loadSurah(surah);
  return verses.filter((v) => v.ayah >= from && (to === undefined || v.ayah <= to));
}

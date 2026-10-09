import { describe, expect, it } from 'vitest';
import { loadSurah } from '@/data/quran/loader';
import { normalizeQuranText } from '@/data/quran/normalize';
import { wordItem } from '@/data/curriculum/items';
import type { WordEntry } from '@/data/curriculum/items';
import * as WORDS from '@/data/curriculum/words';
import MAP from '@/data/curriculum/quranWordAudio.json';

const flatten = (v: unknown): WordEntry[] =>
  Array.isArray(v)
    ? v.flatMap(flatten)
    : v && typeof v === 'object'
      ? 'slug' in v
        ? [v as WordEntry]
        : Object.values(v).flatMap(flatten)
      : [];
const words = flatten(Object.values(WORDS));

describe('vocabulaire lu par la récitation du Coran', () => {
  it('pointe vers un mot du Coran identique (orthographe et voyelles)', async () => {
    for (const [slug, key] of Object.entries(MAP as Record<string, string>)) {
      const [s, a, p] = key.split(':').map(Number);
      const verse = (await loadSurah(s))[a - 1];
      const entry = words.find((w) => w.slug === slug)!;
      expect(normalizeQuranText(verse.words[p - 1].text), slug).toBe(normalizeQuranText(entry.ar));
    }
  });

  it('donne une URL de récitation aux mots concernés uniquement', () => {
    const qul = words.find((w) => w.slug === 'qul')!;
    expect(wordItem(qul).sound.remote).toMatch(/\d{3}_\d{3}_\d{3}\.mp3$/);
    const tut = words.find((w) => w.slug === 'tut')!;
    expect(wordItem(tut).sound.remote).toBeUndefined();
  });
});

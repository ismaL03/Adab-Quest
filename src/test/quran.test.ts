import { describe, expect, it } from 'vitest';
import { loadSurah } from '@/data/quran/loader';
import { SURAHS } from '@/data/quran/surahMeta';
import { analyzeWord } from '@/features/mushaf/highlight';
import { findBestPassage } from '@/features/mushaf/passage';
import { sounds } from '@/audio/sounds';

describe('données coraniques', () => {
  it('a des métadonnées cohérentes avec le texte (114 sourates)', async () => {
    expect(SURAHS).toHaveLength(114);
    for (const meta of SURAHS) {
      const verses = await loadSurah(meta.number);
      expect(verses.length, `sourate ${meta.number}`).toBe(meta.ayahs);
    }
  });

  it('découpe Al-Fâtiha en mots alignés sur Quran.com', async () => {
    const fatiha = await loadSurah(1);
    const nfc = (t: string) => t.normalize('NFC');
    expect(fatiha[0].words.map((w) => nfc(w.text))).toEqual(['بِسْمِ', 'ٱللَّهِ', 'ٱلرَّحْمَـٰنِ', 'ٱلرَّحِيمِ'].map(nfc));
    expect(fatiha.reduce((n, v) => n + v.words.length, 0)).toBe(29);
  });

  it('associe chaque mot à son audio mot-à-mot', () => {
    const s = sounds.quranWord(1, 2, 3, 'رَبِّ');
    expect(s.src).toBe('quran/wbw/001_002_003.mp3');
    expect(s.remote).toMatch(/001_002_003\.mp3$/);
  });
});

describe('mise en évidence dans la Vue Mushaf', () => {
  it('met en évidence une lettre passée en paramètre', async () => {
    const [v1] = await loadSurah(112);
    const qul = v1.words[0]; // قُلْ
    const res = analyzeWord(qul, { letters: ['ق'] }, { tajweed: false });
    expect(res.matches).toBe(1);
    expect(res.runs.filter((r) => r.highlighted).map((r) => r.text).join('')).toBe('قُ');
  });

  it('reconnaît toutes les formes de l’alif', async () => {
    const [v1] = await loadSurah(1);
    const res = analyzeWord(v1.words[1], { letters: ['ا'] }, { tajweed: false }); // ٱللَّهِ
    expect(res.matches).toBeGreaterThan(0);
  });

  it('met en évidence une règle de Tajweed', async () => {
    const verses = await loadSurah(112);
    const ahad = verses[0].words[3]; // أَحَدٌ (qalqala sur le dâl)
    const res = analyzeWord(ahad, { rules: ['qalaqah'] }, { tajweed: true });
    expect(res.matches).toBe(1);
  });

  it('colore le texte selon le Tajweed', async () => {
    const [v1] = await loadSurah(1);
    const res = analyzeWord(v1.words[2], null, { tajweed: true });
    expect(res.runs.some((r) => r.color)).toBe(true);
    expect(res.runs.map((r) => r.text).join('')).toBe(v1.words[2].text);
  });

  it('trouve un passage riche pour un élément donné', async () => {
    const p = await findBestPassage({ letters: ['س'] });
    expect(p.matchingWords).toBeGreaterThan(3);
  });
});

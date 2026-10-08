import { describe, expect, it } from 'vitest';
import { toSpeechText } from '@/audio/speechText';
import { loadSurah } from '@/data/quran/loader';

// Les attentes sont écrites à la main : on remet la chadda avant la voyelle, comme le convertisseur.
const shaddaFirst = (s: string) => s.replace(/([ً-ِ])(ّ)/g, '$2$1');
const expectSpeech = (input: string, expected: string) => expect(toSpeechText(input)).toBe(shaddaFirst(expected));

describe('texte pour la synthèse vocale', () => {
  it('prononce l’alif de liaison en début de mot', () => {
    expectSpeech('ٱلْحَمْدُ', 'اَلْحَمْدُ');
    expectSpeech('ٱهْدِنَا', 'اِهْدِنَا');
  });

  it('assimile le lâm solaire et lit l’alif suscrit', () => {
    expectSpeech('ٱلرَّحْمَـٰنِ', 'اَرَّحْمَانِ');
    expectSpeech('مَـٰلِكِ', 'مَالِكِ');
    expectSpeech('ٱللَّهِ', 'اَلَّاهِ');
    expectSpeech('لِلَّهِ', 'لِلَّاهِ');
    expectSpeech('وَٱللَّهُ', 'وَلَّاهُ');
  });

  it('rend l’alif de liaison muet en milieu de mot', () => {
    expectSpeech('وَٱلشَّمْسِ', 'وَشَّمْسِ');
    expectSpeech('وَٱلْقَمَرِ', 'وَلْقَمَرِ');
  });

  it('lit les petites lettres et les lettres muettes', () => {
    expectSpeech('لَهُۥ', 'لَهُو');
    expectSpeech('بِهِۦ', 'بِهِي');
    expectSpeech('قَالُوا', 'قَالُو');
  });

  it('prononce la tâ’ marbûta « h » à la pause', () => {
    expectSpeech('هَمْزَة', 'هَمْزَهْ');
    expectSpeech('جَنَّةٌ', 'جَنَّةٌ');
  });

  it('place toujours la chadda avant la voyelle', () => {
    expect(toSpeechText('رَبِّ')).toBe('رَبِّ');
  });

  it('ne laisse aucun signe uthmani non géré dans Juz ‘Amma et Al-Fâtiha', async () => {
    const leftovers = new Set<string>();
    for (const n of [1, ...Array.from({ length: 37 }, (_, i) => 78 + i)]) {
      for (const v of await loadSurah(n)) {
        for (const w of v.words) {
          for (const ch of toSpeechText(w.text)) {
            if (!/[ء-يً-ْ ]/.test(ch)) leftovers.add(ch.codePointAt(0)!.toString(16));
          }
        }
      }
    }
    expect([...leftovers]).toEqual([]);
  });
});

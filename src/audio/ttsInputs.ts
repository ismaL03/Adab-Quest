import { loadSurah } from '@/data/quran/loader';
import { expectedAudio } from './expected';
import { sounds } from './sounds';
import { toSpeechText } from './speechText';

export type TtsKind = 'letter' | 'syllable' | 'word' | 'quran';

export interface TtsInput {
  /** Chemin du son (clé de l’index des paquets audio). */
  src: string;
  /** Texte vocalisé envoyé au moteur de synthèse. */
  text: string;
  kind: TtsKind;
  /** Paquet audio de destination. */
  group: string;
}

/** Sourates dont les mots sont intégrés à l’application : Al-Fâtiha + Juz ‘Amma. */
export const BUNDLED_SURAHS = [1, ...Array.from({ length: 37 }, (_, i) => 78 + i)];

/** Liste de tous les sons à générer (`npm run audio:tts`). */
export async function ttsInputs(): Promise<TtsInput[]> {
  const out: TtsInput[] = expectedAudio().map(({ src, text }) => {
    const kind: TtsKind = src.startsWith('letters/') ? 'letter' : src.startsWith('words/') ? 'word' : 'syllable';
    const group = kind === 'letter' ? 'lettres' : kind === 'word' ? 'mots' : 'syllabes';
    return { src, text: toSpeechText(text), kind, group };
  });
  for (const n of BUNDLED_SURAHS) {
    for (const verse of await loadSurah(n)) {
      for (const w of verse.words) {
        out.push({
          src: sounds.quranWord(w.surah, w.ayah, w.position, w.text).src,
          text: toSpeechText(w.text),
          kind: 'quran',
          group: `coran-${String(n).padStart(3, '0')}`,
        });
      }
    }
  }
  return out;
}

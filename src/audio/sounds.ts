/**
 * Description d’un son cliquable. Chaque lettre, syllabe ou mot affiché
 * possède un `Sound` : le moteur audio tente, dans l’ordre,
 *   1. le fichier local  /public/audio/<src>
 *   2. l’URL distante éventuelle (audio mot-à-mot du Coran)
 *   3. la synthèse vocale arabe du navigateur (repli, désactivable)
 */
export interface Sound {
  /** Identifiant unique (sert à synchroniser l’animation de lecture). */
  id: string;
  /** Chemin relatif sous /audio (ex. « letters/ba.mp3 »). */
  src: string;
  /** Texte arabe correspondant (liste des enregistrements à réaliser). */
  text?: string;
  /** URL distante facultative. */
  remote?: string;
}

export const AUDIO_BASE_URL: string =
  (import.meta.env?.VITE_AUDIO_BASE_URL as string | undefined) ?? `${import.meta.env?.BASE_URL ?? '/'}audio/`;

/** Audio mot-à-mot de Quran.com (même nommage que les fichiers locaux). */
export const QURAN_WBW_REMOTE_URL: string =
  (import.meta.env?.VITE_QURAN_WBW_URL as string | undefined) ?? 'https://audio.qurancdn.com/wbw/';

const pad3 = (n: number) => String(n).padStart(3, '0');

/** URL de la récitation mot-à-mot d’un mot du Coran (« sourate:verset:mot »). */
function quranWordUrl(key: string): string | undefined {
  if (!QURAN_WBW_REMOTE_URL) return undefined;
  const [s, a, p] = key.split(':').map(Number);
  return `${QURAN_WBW_REMOTE_URL}${pad3(s)}_${pad3(a)}_${pad3(p)}.mp3`;
}

export const sounds = {
  /** Nom d’une lettre : « letters/ba.mp3 » → « bâ’ ». */
  letterName: (letterId: string, nameAr: string): Sound => ({
    id: `letter:${letterId}`,
    src: `letters/${letterId}.mp3`,
    text: nameAr,
  }),
  /** Syllabe : « syllables/ba-fatha.mp3 » → « ba ». */
  syllable: (letterId: string, vowel: string, text: string): Sound => ({
    id: `syl:${letterId}-${vowel}`,
    src: `syllables/${letterId}-${vowel}.mp3`,
    text,
  }),
  /** Mot de vocabulaire : « words/kataba.mp3 ». */
  word: (slug: string, text: string, quranKey?: string): Sound => ({
    id: `word:${slug}`,
    src: `words/${slug}.mp3`,
    text,
    // Mot présent tel quel dans le Coran : lu par la récitation de Quran.com.
    remote: quranKey ? quranWordUrl(quranKey) : undefined,
  }),
  /** Mot du Coran : « quran/wbw/001_001_001.mp3 » (+ repli Quran.com). */
  quranWord: (surah: number, ayah: number, position: number, text: string): Sound => {
    const file = `${pad3(surah)}_${pad3(ayah)}_${pad3(position)}.mp3`;
    return {
      id: `quran:${surah}:${ayah}:${position}`,
      src: `quran/wbw/${file}`,
      remote: QURAN_WBW_REMOTE_URL ? `${QURAN_WBW_REMOTE_URL}${file}` : undefined,
      text,
    };
  },
};

import { useEffect, useState } from 'react';
import { loadSurah, type QuranVerse } from '@/data/quran/loader';

export function useSurah(surah: number): { verses: QuranVerse[] | null; error: Error | null } {
  const [state, setState] = useState<{ surah: number; verses: QuranVerse[] | null; error: Error | null }>({
    surah,
    verses: null,
    error: null,
  });

  useEffect(() => {
    let alive = true;
    loadSurah(surah)
      .then((verses) => alive && setState({ surah, verses, error: null }))
      .catch((error: Error) => alive && setState({ surah, verses: null, error }));
    return () => {
      alive = false;
    };
  }, [surah]);

  // Évite d’afficher brièvement l’ancienne sourate lors d’un changement.
  return state.surah === surah ? state : { verses: null, error: null };
}

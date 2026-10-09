import { useCallback, useMemo } from 'react';
import { motion } from 'motion/react';
import { sounds } from '@/audio/sounds';
import { playSound } from '@/components/SoundTile';
import type { QuranVerse, QuranWord } from '@/data/quran/loader';
import { getSurahMeta } from '@/data/quran/surahMeta';
import { cn } from '@/lib/cn';
import { useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';
import { isEmptySpec, type HighlightSpec } from './highlight';
import { MushafWord } from './MushafWord';
import { AyahMarker, PageCorners, SurahBanner } from './ornaments';
import { useSurah } from './useSurah';

export interface MushafViewProps {
  surah: number;
  /** Premier verset affiché (inclus). */
  from?: number;
  /** Dernier verset affiché (inclus). */
  to?: number;
  /**
   * Élément étudié à mettre en évidence : lettre(s), signe(s) ou règle(s) de
   * Tajweed. Exemple : `{ letters: ['ب'] }`, `{ rules: ['qalaqah'] }`.
   */
  highlight?: HighlightSpec | null;
  /** Mots déjà trouvés (clés « s:a:p »). */
  foundKeys?: ReadonlySet<string>;
  /** Atténue les mots ne contenant pas l’élément étudié. */
  dimOthers?: boolean;
  /** Exercice de recherche : l’élément n’est révélé (en doré) qu’une fois trouvé. */
  revealOnFound?: boolean;
  /** Mot touché à tort (signal rouge bref). */
  wrongKey?: string | null;
  /** Force l’affichage des couleurs du Tajweed (sinon : réglage utilisateur). */
  tajweed?: boolean;
  fontScale?: number;
  showBanner?: boolean;
  className?: string;
  onWordPress?: (word: QuranWord, info: { matches: number; el: HTMLElement }) => void;
}

const NO_BASMALA = new Set([1, 9]);

export function MushafView({
  surah,
  from = 1,
  to,
  highlight,
  foundKeys,
  dimOthers,
  revealOnFound,
  wrongKey,
  tajweed,
  fontScale = 1,
  showBanner = true,
  className,
  onWordPress,
}: MushafViewProps) {
  const { verses, error } = useSurah(surah);
  const { verses: fatiha } = useSurah(1);
  const settings = useSettings();
  const tajweedOn = tajweed ?? settings.tajweedColors;
  const meta = getSurahMeta(surah);
  const spec = isEmptySpec(highlight) ? null : highlight;

  const shown = useMemo(
    () => verses?.filter((v) => v.ayah >= from && (to === undefined || v.ayah <= to)) ?? null,
    [verses, from, to],
  );

  const handlePress = useCallback(
    (word: QuranWord, matches: number, el: HTMLElement) => {
      void playSound(sounds.quranWord(word.surah, word.ayah, word.position, word.text), word.key);
      useProgress.getState().recordMushafWord();
      onWordPress?.(word, { matches, el });
    },
    [onWordPress],
  );

  const showBasmala = showBanner && from === 1 && !NO_BASMALA.has(surah) && fatiha;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[2rem] border border-paper-edge bg-paper text-paper-ink shadow-[var(--shadow-lift)]',
        className,
      )}
    >
      {/* Double filet du cadre */}
      <div className="pointer-events-none absolute inset-2.5 rounded-[1.6rem] border border-[color-mix(in_oklab,var(--gold)_45%,transparent)]" />
      <div className="pointer-events-none absolute inset-4 rounded-[1.3rem] border border-[color-mix(in_oklab,var(--gold)_22%,transparent)]" />
      <PageCorners />

      <div className="relative px-5 pt-7 pb-6 sm:px-10 sm:pt-9">
        {showBanner && <SurahBanner ar={`سُورَةُ ${meta.ar}`} subtitle={`${meta.name} · ${meta.fr} · ${meta.ayahs} versets`} />}

        {showBasmala && (
          <p dir="rtl" lang="ar" className="font-quran mt-3 text-center" style={{ fontSize: `calc(${fontScale} * clamp(1.45rem, 3.6vw, 2rem))` }}>
            {fatiha![0].words.map((w) => (
              <span key={w.key}>
                <MushafWord
                  word={w}
                  highlight={spec}
                  tajweed={tajweedOn}
                  showTafkhim={settings.showTafkhim}
                  found={foundKeys?.has(w.key)}
                  dimOthers={dimOthers && !!spec}
                  revealOnFound={revealOnFound}
                  wrong={wrongKey === w.key}
                  onPress={handlePress}
                />{' '}
              </span>
            ))}
          </p>
        )}

        {error && <p className="py-10 text-center text-danger">Impossible de charger la sourate.</p>}
        {!shown && !error && <MushafSkeleton />}

        {shown && (
          <motion.div
            key={`${surah}-${from}-${to}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            dir="rtl"
            lang="ar"
            className="font-quran mt-4 text-justify [text-align-last:center]"
            style={{ fontSize: `calc(${fontScale} * clamp(1.55rem, 4.2vw, 2.25rem))`, lineHeight: 2.25 }}
          >
            {shown.map((verse: QuranVerse) => (
              <span key={verse.ayah}>
                {verse.words.map((w) => (
                  <span key={w.key}>
                    <MushafWord
                      word={w}
                      highlight={spec}
                      tajweed={tajweedOn}
                      showTafkhim={settings.showTafkhim}
                      found={foundKeys?.has(w.key)}
                      dimOthers={dimOthers && !!spec}
                      revealOnFound={revealOnFound}
                      wrong={wrongKey === w.key}
                      onPress={handlePress}
                    />{' '}
                  </span>
                ))}
                <AyahMarker n={verse.ayah} />{' '}
              </span>
            ))}
          </motion.div>
        )}

        <p className="mt-5 text-center text-xs font-semibold tracking-[0.2em] text-muted tabular-nums">— {meta.page} —</p>
      </div>
    </div>
  );
}

function MushafSkeleton() {
  return (
    <div className="mt-6 space-y-5" aria-hidden>
      {[92, 100, 86, 97, 60].map((w, i) => (
        <div
          key={i}
          className="ms-auto h-6 animate-shimmer rounded-full bg-[linear-gradient(90deg,var(--surface-sunken)_0%,var(--line-strong)_50%,var(--surface-sunken)_100%)] bg-[length:200%_100%]"
          style={{ width: `${w}%` }}
        />
      ))}
    </div>
  );
}

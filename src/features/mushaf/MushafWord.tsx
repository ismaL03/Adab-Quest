import { memo, useMemo } from 'react';
import { motion } from 'motion/react';
import { useIsPlaying } from '@/audio/engine';
import type { QuranWord } from '@/data/quran/loader';
import { cn } from '@/lib/cn';
import { analyzeWord, type HighlightSpec } from './highlight';

export interface MushafWordProps {
  word: QuranWord;
  highlight?: HighlightSpec | null;
  tajweed: boolean;
  showTafkhim: boolean;
  /** Mot déjà trouvé (chasse dans une leçon). */
  found?: boolean;
  /** Atténue les mots qui ne contiennent pas l’élément étudié. */
  dimOthers?: boolean;
  onPress: (word: QuranWord, matches: number, el: HTMLElement) => void;
}

export const MushafWord = memo(function MushafWord({
  word,
  highlight,
  tajweed,
  showTafkhim,
  found,
  dimOthers,
  onPress,
}: MushafWordProps) {
  const playing = useIsPlaying(word.key);
  const { runs, matches } = useMemo(
    () => analyzeWord(word, highlight, { tajweed, showTafkhim }),
    [word, highlight, tajweed, showTafkhim],
  );
  const isMatch = matches > 0;

  return (
    <motion.span
      role="button"
      tabIndex={0}
      data-word={word.key}
      aria-label={`Mot ${word.position}, verset ${word.ayah}`}
      onClick={(e) => onPress(word, matches, e.currentTarget)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPress(word, matches, e.currentTarget);
        }
      }}
      animate={playing ? { y: -2, scale: 1.04 } : { y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 26 }}
      className={cn(
        'relative inline-block cursor-pointer rounded-xl px-[0.08em] transition-[background-color,box-shadow,opacity] duration-300 outline-none',
        'hover:bg-[color-mix(in_oklab,var(--primary)_9%,transparent)] focus-visible:ring-2 focus-visible:ring-primary',
        playing && 'bg-[color-mix(in_oklab,var(--primary)_16%,transparent)] shadow-[0_0_0_1px_var(--primary-soft)]',
        found && 'bg-[color-mix(in_oklab,var(--highlight)_20%,transparent)] shadow-[inset_0_-3px_0_var(--highlight)]',
        dimOthers && !isMatch && !playing && 'opacity-45',
      )}
    >
      {runs.map((r, i) => (
        <span
          key={i}
          className={cn(r.highlighted && 'mushaf-highlight')}
          style={r.color && !r.highlighted ? { color: r.color } : undefined}
        >
          {r.text}
        </span>
      ))}
      {playing && (
        <motion.span
          layoutId="mushaf-playing"
          className="pointer-events-none absolute inset-x-1 -bottom-0.5 h-[3px] rounded-full bg-primary"
        />
      )}
    </motion.span>
  );
});

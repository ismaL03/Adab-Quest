import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { Check } from 'lucide-react';
import { audio, useIsPlaying } from '@/audio/engine';
import type { Sound } from '@/audio/sounds';
import type { Item } from '@/data/curriculum';
import { cn } from '@/lib/cn';
import { useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';

/** Petite onde animée, synchronisée avec la lecture audio. */
export function WaveBars({ active, className, bars = 5 }: { active: boolean; className?: string; bars?: number }) {
  return (
    <span className={cn('inline-flex h-4 items-end gap-[3px]', className)} aria-hidden>
      {Array.from({ length: bars }, (_, i) => (
        <span
          key={i}
          className={cn(
            'w-[3px] origin-bottom rounded-full bg-current transition-opacity duration-300',
            active ? 'animate-wave opacity-100' : 'scale-y-[0.35] opacity-40',
          )}
          style={{ height: '100%', animationDelay: `${(i % 3) * 0.14 + i * 0.05}s` }}
        />
      ))}
    </span>
  );
}

/** Joue un son et le comptabilise (statistiques, badges). */
export function playSound(sound: Sound, key?: string) {
  useProgress.getState().recordSound();
  return audio.play(sound, key);
}

/** « ي » présenté seul (éventuellement voyellé) : on affiche ses points pour les débutants. */
const isLoneYa = (ar: string) => /^\u0640?\u064A[\u064B-\u065F\u0670]*\u0640?$/.test(ar);
export const LETTER_FONT: React.CSSProperties = { fontFamily: "'Iqra Ya', var(--font-quran)" };

type TileState = 'idle' | 'selected' | 'correct' | 'wrong' | 'dim' | 'active';

const SIZE: Record<string, { box: string; ar: string; label: string }> = {
  sm: { box: 'min-h-[4.75rem] min-w-[4rem] px-3 py-2', ar: 'text-[2.35rem]', label: 'text-[0.7rem]' },
  md: { box: 'min-h-[6.75rem] min-w-[5rem] px-4 py-3', ar: 'text-[3.1rem]', label: 'text-xs' },
  lg: { box: 'min-h-[8.75rem] min-w-[6.75rem] px-5 py-4', ar: 'text-[4rem]', label: 'text-sm' },
  xl: { box: 'min-h-[12.5rem] min-w-[11rem] px-8 py-6', ar: 'text-[6.5rem]', label: 'text-base' },
};

export interface SoundTileProps {
  item: Item;
  size?: keyof typeof SIZE;
  state?: TileState;
  heard?: boolean;
  /** Affiche la translittération (par défaut : réglage utilisateur). */
  showLabel?: boolean;
  caption?: string;
  /** Joue le son au clic (par défaut : oui). */
  playOnClick?: boolean;
  onPress?: (item: Item) => void;
  disabled?: boolean;
  className?: string;
}

export function SoundTile({
  item,
  size = 'md',
  state = 'idle',
  heard,
  showLabel,
  caption,
  playOnClick = true,
  onPress,
  disabled,
  className,
}: SoundTileProps) {
  const playing = useIsPlaying(item.id);
  const transliteration = useSettings((s) => s.transliteration);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const s = SIZE[size];
  const label = (showLabel ?? transliteration) ? item.label : undefined;
  const active = playing || state === 'active';

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples((r) => [...r, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setRipples((r) => r.filter((x) => x.id !== id)), 700);
    if (playOnClick) void playSound(item.sound, item.id);
    onPress?.(item);
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      whileTap={{ scale: 0.94 }}
      animate={{ scale: active ? 1.04 : 1, y: state === 'wrong' ? [0, -2, 2, -2, 0] : 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 22 }}
      aria-label={`${item.label ?? ''} ${item.meaning ?? ''}`.trim() || item.ar}
      className={cn(
        'group relative isolate flex flex-col items-center justify-center overflow-hidden rounded-3xl text-ink transition-[box-shadow,background-color,border-color,opacity] duration-300',
        'glass',
        s.box,
        active && 'ring-2 ring-primary shadow-[0_0_0_6px_var(--primary-soft),0_16px_40px_-14px_var(--primary)]',
        state === 'selected' && 'ring-2 ring-primary bg-primary-soft',
        state === 'correct' && 'ring-2 ring-success bg-success-soft',
        state === 'wrong' && 'ring-2 ring-danger bg-danger-soft',
        state === 'dim' && 'opacity-40',
        className,
      )}
    >
      {/* Halo de lecture */}
      <AnimatePresence>
        {active && (
          <motion.span
            className="pointer-events-none absolute inset-0 -z-10 rounded-3xl bg-[radial-gradient(circle_at_50%_40%,var(--primary-soft),transparent_70%)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      {ripples.map((r) => (
        <span
          key={r.id}
          className="ripple pointer-events-none absolute -z-10 size-8 rounded-full bg-primary/25"
          style={{ left: r.x, top: r.y }}
        />
      ))}

      <span
        dir="rtl"
        lang="ar"
        className={cn('font-quran leading-[1.55] whitespace-nowrap', s.ar)}
        style={isLoneYa(item.ar) ? LETTER_FONT : undefined}
      >
        {item.ar}
      </span>
      {label && (
        <span dir="ltr" className={cn('mt-0.5 font-semibold text-muted', s.label)}>
          {label}
        </span>
      )}
      {caption && (
        <span dir="ltr" className={cn('mt-0.5 text-muted', s.label)}>
          {caption}
        </span>
      )}

      <WaveBars active={playing} className={cn('mt-1 h-3 text-primary transition-opacity', playing ? 'opacity-100' : 'opacity-0')} />

      <AnimatePresence>
        {heard && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute top-2 right-2 grid size-5 place-items-center rounded-full bg-success text-white"
          >
            <Check className="size-3" strokeWidth={3} />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/** Gros bouton rond « écouter » (exercices auditifs). */
export function PlayButton({
  sound,
  id,
  size = 'lg',
  label = 'Écouter',
}: {
  sound: Sound;
  id: string;
  size?: 'md' | 'lg';
  label?: string;
}) {
  const playing = useIsPlaying(id);
  const dim = size === 'lg' ? 'size-28' : 'size-16';
  return (
    <div className="flex flex-col items-center gap-3">
      <motion.button
        type="button"
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.03 }}
        onClick={() => void playSound(sound, id)}
        className={cn(
          'relative grid place-items-center rounded-full bg-gradient-to-b from-primary to-primary-strong text-on-primary shadow-[0_20px_50px_-18px_var(--primary)]',
          dim,
        )}
        aria-label={label}
      >
        {playing && (
          <>
            <span className="absolute inset-0 animate-ping-soft rounded-full bg-primary/40" />
            <span className="absolute inset-0 animate-ping-soft rounded-full bg-primary/30 [animation-delay:0.6s]" />
          </>
        )}
        <span className="absolute inset-[3px] rounded-full bg-gradient-to-b from-white/25 to-transparent" />
        {playing ? (
          <WaveBars active className={size === 'lg' ? 'h-9 [&>span]:w-[5px]' : 'h-6'} />
        ) : (
          <svg viewBox="0 0 24 24" className={size === 'lg' ? 'size-11' : 'size-7'} fill="currentColor" aria-hidden>
            <path d="M3 9.5v5a1 1 0 0 0 1 1h3.2l4.1 3.6c.65.57 1.7.1 1.7-.76V5.66c0-.86-1.05-1.33-1.7-.76L7.2 8.5H4a1 1 0 0 0-1 1Zm13.1-3.36a.9.9 0 0 0-.13 1.27 7.1 7.1 0 0 1 0 9.18.9.9 0 1 0 1.4 1.14 8.9 8.9 0 0 0 0-11.46.9.9 0 0 0-1.27-.13Zm-2.6 2.9a.9.9 0 0 0-.14 1.26 2.8 2.8 0 0 1 0 3.4.9.9 0 1 0 1.4 1.13 4.6 4.6 0 0 0 0-5.66.9.9 0 0 0-1.26-.13Z" />
          </svg>
        )}
      </motion.button>
      <span className="text-sm font-semibold text-muted">{label}</span>
    </div>
  );
}

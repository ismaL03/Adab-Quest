import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Flame, RotateCcw, Star, Target, Zap } from 'lucide-react';
import { sfx } from '@/audio/sfx';
import { BadgeGlyph } from '@/components/BadgeGlyph';
import { Button } from '@/components/ui/Button';
import { Arabic } from '@/components/ui/primitives';
import { getBadge } from '@/data/badges';
import type { Lesson } from '@/data/curriculum';
import { celebrateLesson } from '@/features/celebrate/celebrate';
import { ParticleBurst } from '@/features/celebrate/ParticleBurst';
import { cn } from '@/lib/cn';
import type { CompletionSummary } from '@/store/progress';

function useCountUp(target: number, delay = 600, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now() + delay;
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / duration));
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, delay, duration]);
  return value;
}

const TITLES: Record<1 | 2 | 3, string> = {
  3: 'Parfait, sans aucune faute !',
  2: 'Très beau travail !',
  1: 'Leçon terminée !',
};

export function LessonComplete({
  lesson,
  summary,
  accuracy,
  bestCombo,
  onContinue,
  onRetry,
}: {
  lesson: Lesson;
  summary: CompletionSummary;
  accuracy: number;
  bestCombo: number;
  onContinue: () => void;
  onRetry: () => void;
}) {
  const xp = useCountUp(summary.xpGained);

  useEffect(() => {
    sfx.complete();
    celebrateLesson();
    const timers = [0, 1, 2]
      .filter((i) => i < summary.stars)
      .map((i) => setTimeout(() => sfx.unlock(), 700 + i * 280));
    return () => timers.forEach(clearTimeout);
  }, [summary.stars]);

  return (
    <div className="mx-auto flex min-h-full w-full max-w-xl flex-col items-center justify-center gap-7 px-5 py-10 text-center">
      {/* Médaillon */}
      <motion.div
        className="relative grid size-44 place-items-center"
        initial={{ scale: 0.4, opacity: 0, rotate: -12 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 180, damping: 14 }}
      >
        <motion.div
          className="absolute inset-[-30%] rounded-full bg-[conic-gradient(from_0deg,transparent,var(--gold-soft),transparent_30%,var(--primary-soft),transparent_60%,var(--gold-soft),transparent)]"
          animate={{ rotate: 360 }}
          transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
        />
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-gold-bright to-gold shadow-[0_24px_60px_-20px_var(--gold)]" />
        <div className="absolute inset-[7px] rounded-full bg-gradient-to-b from-primary to-primary-strong" />
        <div className="absolute inset-[7px] rounded-full bg-[radial-gradient(circle_at_30%_20%,rgb(255_255_255/0.35),transparent_55%)]" />
        <Arabic className="relative text-[3.2rem] text-on-primary drop-shadow">{lesson.glyph}</Arabic>
        <ParticleBurst count={22} radius={130} />
      </motion.div>

      {/* Étoiles */}
      <div className="flex items-end gap-3">
        {[0, 1, 2].map((i) => {
          const earned = i < summary.stars;
          return (
            <motion.div
              key={i}
              initial={{ scale: 0, rotate: -40, opacity: 0 }}
              animate={{ scale: earned ? 1 : 0.85, rotate: 0, opacity: 1 }}
              transition={{ delay: 0.7 + i * 0.28, type: 'spring', stiffness: 300, damping: 12 }}
              className={cn(i === 1 && '-translate-y-2')}
            >
              <Star
                className={cn('size-12', earned ? 'fill-gold-bright text-gold drop-shadow-[0_6px_14px_var(--gold-soft)]' : 'fill-line-strong text-line-strong')}
                strokeWidth={1.5}
              />
            </motion.div>
          );
        })}
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <p className="text-[0.72rem] font-bold tracking-[0.16em] text-primary uppercase">{lesson.title}</p>
        <h1 className="mt-2 font-display text-[2.1rem] leading-tight font-semibold tracking-[-0.02em]">{TITLES[summary.stars]}</h1>
      </motion.div>

      <div className="grid w-full grid-cols-3 gap-3">
        <Stat icon={<Zap className="size-4" />} label="XP gagnés" value={`+${xp}`} tone="gold" delay={0.5} />
        <Stat icon={<Target className="size-4" />} label="Précision" value={`${Math.round(accuracy * 100)} %`} tone="primary" delay={0.6} />
        <Stat
          icon={<Flame className="size-4" />}
          label={summary.streakExtended ? 'Série prolongée' : 'Série'}
          value={`${summary.streak} j`}
          tone="ink"
          delay={0.7}
        />
      </div>

      {bestCombo >= 3 && (
        <p className="text-sm text-muted">
          Meilleur combo : <span className="font-bold text-ink">{bestCombo} bonnes réponses d’affilée</span>
        </p>
      )}

      {summary.dailyGoalReached && (
        <motion.p
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
          className="rounded-full bg-success-soft px-4 py-2 text-sm font-semibold text-success"
        >
          Objectif du jour atteint !
        </motion.p>
      )}

      {summary.newBadges.length > 0 && (
        <div className="w-full space-y-2">
          <p className="text-xs font-bold tracking-[0.14em] text-muted uppercase">Nouveau badge</p>
          {summary.newBadges.map((id, i) => {
            const b = getBadge(id);
            if (!b) return null;
            return (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 14, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 1.2 + i * 0.2, type: 'spring' }}
                className="glass relative flex items-center gap-4 overflow-hidden rounded-2xl p-3 text-left"
              >
                <div className="pointer-events-none absolute inset-0 animate-shimmer bg-[linear-gradient(110deg,transparent_30%,rgb(255_255_255/0.25)_50%,transparent_70%)] bg-[length:200%_100%]" />
                <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-b from-gold-bright to-gold text-[#1d1608]">
                  <BadgeGlyph glyph={b.glyph} />
                </div>
                <div>
                  <p className="font-semibold">{b.title}</p>
                  <p className="text-sm text-muted">{b.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="flex w-full flex-col gap-3 pt-2 sm:flex-row-reverse">
        <Button size="lg" block onClick={onContinue} autoFocus>
          Continuer
        </Button>
        <Button size="lg" variant="secondary" block onClick={onRetry}>
          <RotateCcw className="size-4" /> Recommencer
        </Button>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  tone,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: 'gold' | 'primary' | 'ink';
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 260, damping: 22 }}
      className="glass rounded-2xl px-3 py-3.5"
    >
      <p
        className={cn(
          'flex items-center justify-center gap-1.5 text-[0.7rem] font-bold tracking-[0.08em] uppercase',
          tone === 'gold' ? 'text-gold' : tone === 'primary' ? 'text-primary' : 'text-ink-soft',
        )}
      >
        {icon}
        {label}
      </p>
      <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{value}</p>
    </motion.div>
  );
}

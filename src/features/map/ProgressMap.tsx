import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { BookOpen, Check, Lock, Play, RotateCcw, Star, Zap } from 'lucide-react';
import { sfx } from '@/audio/sfx';
import { RichText } from '@/components/RichText';
import { Button } from '@/components/ui/Button';
import { Arabic } from '@/components/ui/primitives';
import { isLessonUnlocked, LESSONS, type Lesson, type Module } from '@/data/curriculum';
import { ParticleBurst } from '@/features/celebrate/ParticleBurst';
import { cn } from '@/lib/cn';
import { useProgress, type LessonRecord } from '@/store/progress';
import { useUi } from '@/store/ui';

const ROW = 112; // hauteur d’une rangée de la carte (px)
const AMPLITUDE = 82; // amplitude horizontale du chemin (px)

const offsetX = (i: number) => Math.round(Math.sin(i * 0.95) * AMPLITUDE);

type NodeState = 'done' | 'current' | 'open' | 'locked';

export function ProgressMap({ modules }: { modules: Module[] }) {
  const records = useProgress((s) => s.lessons);
  const justCompleted = useUi((s) => s.justCompleted);
  const setJustCompleted = useUi((s) => s.setJustCompleted);
  const [openId, setOpenId] = useState<string | null>(null);
  const [celebrateId, setCelebrateId] = useState<string | null>(null);
  const currentRef = useRef<HTMLDivElement | null>(null);

  const completed = (id: string) => !!records[id];
  const currentId = useMemo(() => LESSONS.find((l) => !records[l.id])?.id ?? null, [records]);

  // Au retour d’une leçon : on fait défiler jusqu’au nouveau nœud et on fête son déverrouillage.
  useEffect(() => {
    const t = setTimeout(() => {
      const el = currentRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const visible = r.top >= 80 && r.bottom <= window.innerHeight - 100;
      if (justCompleted || !visible) el.scrollIntoView({ behavior: justCompleted ? 'smooth' : 'auto', block: 'center' });
    }, 120);
    if (justCompleted && currentId) {
      const c = setTimeout(() => {
        setCelebrateId(currentId);
        sfx.unlock();
        setJustCompleted(null);
      }, 650);
      const d = setTimeout(() => setCelebrateId(null), 2200);
      return () => [t, c, d].forEach(clearTimeout);
    }
    return () => clearTimeout(t);
  }, [justCompleted, currentId, setJustCompleted]);

  useEffect(() => {
    if (!openId) return;
    const close = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-node]')) setOpenId(null);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [openId]);

  let globalIndex = 0;

  return (
    <div className="space-y-14">
      {modules.map((module) => {
        const done = module.lessons.filter((l) => completed(l.id)).length;
        const startIndex = globalIndex;
        globalIndex += module.lessons.length;
        const locked = !isLessonUnlocked(module.lessons[0].id, completed);
        return (
          <section key={module.id} aria-labelledby={`mod-${module.id}`}>
            <ModuleBanner module={module} done={done} locked={locked} />
            <div className="relative mx-auto mt-8 w-full max-w-sm" style={{ height: module.lessons.length * ROW }}>
              <PathLine lessons={module.lessons} startIndex={startIndex} completed={completed} />
              {module.lessons.map((lesson, i) => {
                const state: NodeState = completed(lesson.id)
                  ? 'done'
                  : lesson.id === currentId
                    ? 'current'
                    : isLessonUnlocked(lesson.id, completed)
                      ? 'open'
                      : 'locked';
                return (
                  <div
                    key={lesson.id}
                    ref={lesson.id === currentId ? currentRef : undefined}
                    className="absolute left-1/2"
                    style={{
                      top: i * ROW + 14,
                      transform: `translateX(calc(-50% + ${offsetX(startIndex + i)}px))`,
                      zIndex: openId === lesson.id ? 20 : 1,
                    }}
                  >
                    <PathNode
                      lesson={lesson}
                      state={state}
                      record={records[lesson.id]}
                      open={openId === lesson.id}
                      celebrate={celebrateId === lesson.id}
                      onToggle={() => setOpenId((o) => (o === lesson.id ? null : lesson.id))}
                      shift={-offsetX(startIndex + i)}
                      prevTitle={LESSONS[LESSONS.findIndex((l) => l.id === lesson.id) - 1]?.title}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function ModuleBanner({ module, done, locked }: { module: Module; done: number; locked: boolean }) {
  const total = module.lessons.length;
  const complete = done === total;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'relative overflow-hidden rounded-[1.75rem] p-5 sm:p-6',
        complete
          ? 'bg-gradient-to-br from-gold to-[color-mix(in_oklab,var(--gold)_70%,black)] text-white'
          : locked
            ? 'glass'
            : 'bg-gradient-to-br from-primary to-primary-strong text-on-primary shadow-[0_20px_50px_-24px_var(--primary)]',
      )}
    >
      <div className="pointer-events-none absolute -top-6 -right-4 select-none opacity-[0.13]">
        <Arabic className="text-[7rem] leading-none">{module.titleAr.split(' ')[0]}</Arabic>
      </div>
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className={cn('text-[0.7rem] font-bold tracking-[0.18em] uppercase', locked ? 'text-muted' : 'opacity-80')}>
            Étape {module.index}
          </p>
          <h2 id={`mod-${module.id}`} className="mt-1 font-display text-[1.6rem] leading-tight font-semibold tracking-[-0.02em]">
            {module.title}
          </h2>
          <p className={cn('mt-1.5 max-w-md text-sm leading-relaxed', locked ? 'text-muted' : 'opacity-85')}>{module.description}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Arabic className={cn('text-[1.45rem] leading-[1.6]', locked && 'text-ink-soft')}>{module.titleAr}</Arabic>
          <span
            className={cn(
              'rounded-full px-2.5 py-1 text-xs font-bold tabular-nums',
              locked ? 'bg-surface-sunken text-muted' : 'bg-white/18 text-current',
            )}
          >
            {done} / {total}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/** Chemin sinueux reliant les nœuds (plein jusqu’à la progression, pointillé ensuite). */
function PathLine({ lessons, startIndex, completed }: { lessons: Lesson[]; startIndex: number; completed: (id: string) => boolean }) {
  const width = 384;
  const cx = width / 2;
  const points = lessons.map((_, i) => ({ x: cx + offsetX(startIndex + i), y: i * ROW + 14 + 38 }));
  const segment = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    `M${a.x},${a.y} C${a.x},${a.y + ROW / 2} ${b.x},${b.y - ROW / 2} ${b.x},${b.y}`;
  return (
    <svg
      className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 overflow-visible"
      width={width}
      height={lessons.length * ROW}
      viewBox={`0 0 ${width} ${lessons.length * ROW}`}
      aria-hidden
    >
      {points.slice(1).map((p, i) => {
        const doneSeg = completed(lessons[i].id);
        return (
          <path
            key={i}
            d={segment(points[i], p)}
            fill="none"
            strokeLinecap="round"
            stroke={doneSeg ? 'var(--gold)' : 'var(--line-strong)'}
            strokeWidth={doneSeg ? 5 : 4}
            strokeDasharray={doneSeg ? undefined : '2 12'}
            opacity={doneSeg ? 0.75 : 1}
          />
        );
      })}
    </svg>
  );
}

function PathNode({
  lesson,
  state,
  record,
  open,
  celebrate,
  onToggle,
  prevTitle,
  shift,
}: {
  lesson: Lesson;
  state: NodeState;
  record?: LessonRecord;
  open: boolean;
  celebrate: boolean;
  onToggle: () => void;
  prevTitle?: string;
  /** Décalage horizontal pour recentrer la fiche sous la carte. */
  shift: number;
}) {
  const navigate = useNavigate();
  const isQuran = lesson.type === 'quran';
  const isReview = lesson.type === 'review';

  return (
    <div data-node className="relative flex flex-col items-center">
      <AnimatePresence>
        {state === 'current' && !open && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: [0, -5, 0] }}
            exit={{ opacity: 0 }}
            transition={{ y: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } }}
            className="absolute -top-11 z-10 rounded-xl bg-surface-strong px-3 py-1.5 text-xs font-bold whitespace-nowrap text-primary shadow-[var(--shadow-soft)] ring-1 ring-line"
          >
            {record ? 'Réviser' : 'Commencer'}
            <span className="absolute -bottom-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 bg-surface-strong ring-1 ring-line [clip-path:polygon(100%_0,100%_100%,0_100%)]" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => {
          sfx.tap();
          onToggle();
        }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.92 }}
        initial={{ opacity: 0, scale: 0.6 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ type: 'spring', stiffness: 360, damping: 20 }}
        aria-label={`${lesson.title} — ${state === 'locked' ? 'verrouillée' : state === 'done' ? 'terminée' : 'disponible'}`}
        className={cn(
          'relative grid size-[4.75rem] place-items-center transition-shadow',
          isReview ? 'rounded-[1.6rem]' : 'rounded-full',
          state === 'done' &&
            'bg-gradient-to-b from-gold-bright to-gold text-[#1d1608] shadow-[0_6px_0_color-mix(in_oklab,var(--gold)_70%,black),0_18px_30px_-12px_var(--gold)]',
          (state === 'current' || state === 'open') &&
            'bg-gradient-to-b from-primary to-primary-strong text-white shadow-[0_6px_0_color-mix(in_oklab,var(--primary-strong)_75%,black),0_18px_30px_-12px_var(--primary)]',
          state === 'locked' && 'bg-surface-sunken text-muted shadow-[0_6px_0_var(--line-strong)] ring-1 ring-line',
        )}
      >
        {state === 'current' && (
          <>
            <span className={cn('absolute -inset-2 animate-ping-soft border-2 border-primary/50', isReview ? 'rounded-[1.9rem]' : 'rounded-full')} />
            <span className={cn('absolute -inset-[7px] border-[3px] border-primary/25', isReview ? 'rounded-[1.9rem]' : 'rounded-full')} />
          </>
        )}
        <span className={cn('absolute inset-[3px] bg-gradient-to-b from-white/25 to-transparent', isReview ? 'rounded-[1.4rem]' : 'rounded-full')} />
        {state === 'locked' ? (
          <Lock className="relative size-6 opacity-70" />
        ) : (
          <Arabic className={cn('relative leading-none', lesson.glyph.length > 4 ? 'text-[1.5rem]' : 'text-[2.5rem]')}>{lesson.glyph}</Arabic>
        )}
        {isQuran && state !== 'locked' && (
          <span className="absolute -right-1 -bottom-1 grid size-6 place-items-center rounded-full bg-surface-strong text-gold shadow ring-1 ring-line">
            <BookOpen className="size-3.5" />
          </span>
        )}
        {state === 'done' && (
          <span className="absolute -top-1 -right-1 grid size-6 place-items-center rounded-full bg-success text-white shadow ring-2 ring-bg">
            <Check className="size-3.5" strokeWidth={3} />
          </span>
        )}
        {celebrate && <ParticleBurst count={20} radius={90} />}
      </motion.button>

      {record && (
        <div className="mt-2 flex gap-0.5">
          {[1, 2, 3].map((n) => (
            <Star key={n} className={cn('size-3.5', n <= record.stars ? 'fill-gold text-gold' : 'fill-line-strong text-line-strong')} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 460, damping: 32 }}
            style={{ left: `calc(50% + ${shift}px)`, translateX: '-50%' }}
            className="glass-strong absolute top-[5.6rem] z-30 w-72 rounded-3xl p-5 text-left"
          >
            <p className="text-[0.68rem] font-bold tracking-[0.14em] text-primary uppercase">
              {isQuran ? 'Lecture du Coran' : isReview ? 'Révision' : 'Leçon'}
            </p>
            <h3 className="mt-1 font-display text-lg leading-snug font-semibold">{lesson.title}</h3>
            <p className="mt-1 text-sm text-muted">
              <RichText text={lesson.subtitle} />
            </p>
            <div className="mt-3 flex items-center gap-3 text-xs font-semibold text-ink-soft">
              <span>{lesson.steps.length} étapes</span>
              <span className="flex items-center gap-1 text-gold">
                <Zap className="size-3.5 fill-current" /> {record ? `+${Math.round(lesson.xp / 2)}` : `+${lesson.xp}`} XP
              </span>
            </div>
            {state === 'locked' ? (
              <p className="mt-4 flex items-start gap-2 rounded-2xl bg-surface-sunken p-3 text-sm text-muted">
                <Lock className="mt-0.5 size-4 shrink-0" />
                Termine d’abord « {prevTitle} » pour débloquer cette leçon.
              </p>
            ) : (
              <Button className="mt-4" block variant={state === 'done' ? 'gold' : 'primary'} onClick={() => navigate(`/lecon/${lesson.id}`)}>
                {state === 'done' ? <RotateCcw className="size-4" /> : <Play className="size-4 fill-current" />}
                {state === 'done' ? 'Réviser' : 'Commencer'}
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function useLessonProgress() {
  const records = useProgress((s) => s.lessons);
  const done = LESSONS.filter((l) => records[l.id]).length;
  return { done, total: LESSONS.length, ratio: done / LESSONS.length };
}

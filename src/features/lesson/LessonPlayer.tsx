import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, Flame, X, XCircle } from 'lucide-react';
import { audio } from '@/audio/engine';
import { sfx } from '@/audio/sfx';
import { playSound } from '@/components/SoundTile';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/primitives';
import { GRADED_KINDS, type Item, type Lesson, type Step } from '@/data/curriculum';
import { cn } from '@/lib/cn';
import { useProgress, type CompletionSummary } from '@/store/progress';
import { useUi } from '@/store/ui';
import { getBadge } from '@/data/badges';
import { LessonComplete } from './LessonComplete';
import { DiscoverStepView, FormsStepView, IntroStepView, LetterStepView } from './steps/InfoSteps';
import { BuildStepView, ChooseStepView, ListenStepView, MatchStepView } from './steps/QuizSteps';
import {
  MushafStepView,
  RepeatStepView,
  VerseListenStepView,
  VerseOrderStepView,
  VerseStepView,
} from './steps/ReadingSteps';
import type { AnswerDetail, StepApi } from './types';

const PRAISE = ['Excellent !', 'Bravo !', 'Parfait !', 'Bien joué !', 'Mâchâ’ Allâh !', 'Très bien !'];
const COMFORT = ['Presque !', 'Pas tout à fait…', 'Ce n’est pas grave, on continue.'];

interface Feedback {
  ok: boolean;
  title: string;
  detail?: AnswerDetail;
  retry: boolean;
}

function StepView({ step, api }: { step: Step; api: StepApi }) {
  switch (step.kind) {
    case 'intro':
      return <IntroStepView step={step} api={api} />;
    case 'letter':
      return <LetterStepView step={step} api={api} />;
    case 'discover':
      return <DiscoverStepView step={step} api={api} />;
    case 'forms':
      return <FormsStepView step={step} api={api} />;
    case 'listen':
      return <ListenStepView step={step} api={api} />;
    case 'choose':
      return <ChooseStepView step={step} api={api} />;
    case 'match':
      return <MatchStepView step={step} api={api} />;
    case 'build':
      return <BuildStepView step={step} api={api} />;
    case 'repeat':
      return <RepeatStepView step={step} api={api} />;
    case 'mushaf':
      return <MushafStepView step={step} api={api} />;
    case 'verse':
      return <VerseStepView step={step} api={api} />;
    case 'verse-listen':
      return <VerseListenStepView step={step} api={api} />;
    case 'verse-order':
      return <VerseOrderStepView step={step} api={api} />;
  }
}

export function LessonPlayer({ lesson, onExit }: { lesson: Lesson; onExit: () => void }) {
  const [attempt, setAttempt] = useState(0);
  return <LessonRun key={attempt} lesson={lesson} onExit={onExit} onRetry={() => setAttempt((a) => a + 1)} />;
}

function LessonRun({ lesson, onExit, onRetry }: { lesson: Lesson; onExit: () => void; onRetry: () => void }) {
  const completeLesson = useProgress((s) => s.completeLesson);
  const recordCorrect = useProgress((s) => s.recordCorrect);
  const { pushToast, setJustCompleted } = useUi.getState();

  const [queue, setQueue] = useState<number[]>(() => lesson.steps.map((_, i) => i));
  const [pos, setPos] = useState(0);
  const [ready, setReady] = useState(false);
  const [hasCheck, setHasCheck] = useState(false);
  const checkRef = useRef<(() => void) | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [combo, setCombo] = useState(0);
  const stats = useRef({ answers: 0, correct: 0, mistakes: 0, bestCombo: 0 });
  const retried = useRef(new Set<number>());
  const [summary, setSummary] = useState<CompletionSummary | null>(null);
  const [confirmExit, setConfirmExit] = useState(false);

  const stepIndex = queue[pos];
  const step = lesson.steps[stepIndex];
  const graded = GRADED_KINDS.includes(step.kind);
  const locked = feedback !== null;

  useEffect(() => () => audio.stop(), []);

  const bumpCombo = useCallback(() => {
    setCombo((c) => {
      const next = c + 1;
      stats.current.bestCombo = Math.max(stats.current.bestCombo, next);
      return next;
    });
  }, []);

  const api = useMemo<StepApi>(
    () => ({
      locked,
      setReady: (r) => setReady(r),
      setCheck: (fn) => {
        checkRef.current = fn;
        setHasCheck(!!fn);
      },
      answer: (ok, detail) => {
        stats.current.answers += 1;
        let retry = false;
        if (ok) {
          stats.current.correct += 1;
          recordCorrect();
          bumpCombo();
          sfx.correct();
        } else {
          stats.current.mistakes += 1;
          setCombo(0);
          sfx.wrong();
          // La question ratée revient une fois en fin de leçon.
          if (!retried.current.has(stepIndex)) {
            retried.current.add(stepIndex);
            setQueue((q) => [...q, stepIndex]);
            retry = true;
          }
        }
        const pool = ok ? PRAISE : COMFORT;
        setFeedback({ ok, detail, retry, title: pool[Math.floor(Math.random() * pool.length)] });
      },
      mistake: () => {
        stats.current.mistakes += 1;
        setCombo(0);
      },
      hit: bumpCombo,
    }),
    // L’API change avec l’étape (et son verrouillage) pour que chaque étape reparte de zéro.
    [locked, stepIndex, pos, recordCorrect, bumpCombo],
  );

  const finish = useCallback(() => {
    const { answers, correct, mistakes, bestCombo } = stats.current;
    const accuracy = answers ? correct / Math.max(answers, correct + mistakes) : 1;
    const result = completeLesson({ lessonId: lesson.id, accuracy, mistakes, bestCombo });
    setJustCompleted(lesson.id);
    result.newBadges.forEach((id, i) => {
      const b = getBadge(id);
      if (b) setTimeout(() => pushToast({ title: 'Badge débloqué', description: b.title, tone: 'gold', glyph: b.glyph }), 1800 + i * 600);
    });
    setSummary(result);
  }, [completeLesson, lesson.id, pushToast, setJustCompleted]);

  const next = useCallback(() => {
    audio.stop();
    if (pos + 1 >= queue.length) return finish();
    // Réinitialise le pied de page avant que l’étape suivante ne s’installe.
    setReady(false);
    setHasCheck(false);
    checkRef.current = null;
    setFeedback(null);
    setPos((p) => p + 1);
  }, [finish, pos, queue.length]);

  const primary = useMemo(() => {
    if (feedback) return { label: 'Continuer', enabled: true, action: next, tone: feedback.ok ? 'success' : 'danger' } as const;
    if (graded && step.kind !== 'match')
      return { label: 'Vérifier', enabled: hasCheck, action: () => checkRef.current?.(), tone: 'primary' } as const;
    if (step.kind === 'match') return { label: 'Associe toutes les paires', enabled: false, action: () => {}, tone: 'primary' } as const;
    return { label: 'Continuer', enabled: ready, action: next, tone: 'primary' } as const;
  }, [feedback, graded, hasCheck, next, ready, step.kind]);

  // Entrée = action principale.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && primary.enabled && !summary && !confirmExit) {
        e.preventDefault();
        primary.action();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [primary, summary, confirmExit]);

  if (summary) {
    const { answers, correct, mistakes, bestCombo } = stats.current;
    return (
      <LessonComplete
        lesson={lesson}
        summary={summary}
        accuracy={answers ? correct / Math.max(answers, correct + mistakes) : 1}
        bestCombo={bestCombo}
        onContinue={onExit}
        onRetry={onRetry}
      />
    );
  }

  const progress = (pos + (feedback || ready ? 1 : 0)) / queue.length;

  return (
    <div className="flex min-h-dvh flex-col">
      {/* En-tête */}
      <header className="sticky top-[env(safe-area-inset-top,0px)] z-30 bg-bg/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => setConfirmExit(true)}
            className="grid size-10 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-surface-sunken hover:text-ink"
            aria-label="Quitter la leçon"
          >
            <X className="size-5" />
          </button>
          <ProgressBar value={progress} height={12} />
          <AnimatePresence>
            {combo >= 2 && (
              <motion.div
                key="combo"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                className="flex shrink-0 items-center gap-1 rounded-full bg-gold-soft px-2.5 py-1 text-sm font-bold text-gold"
              >
                <Flame className="size-4 fill-current" />
                <motion.span key={combo} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                  ×{combo}
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Étape */}
      <main className="flex flex-1 flex-col px-4 pt-4 pb-40 sm:px-6 sm:pt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${pos}-${stepIndex}`}
            initial={{ opacity: 0, x: 40, filter: 'blur(6px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: -40, filter: 'blur(6px)' }}
            transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto my-auto w-full max-w-4xl py-4"
          >
            <StepView step={step} api={api} />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Pied de page + retour visuel */}
      <footer className="fixed inset-x-0 bottom-0 z-30">
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 34 }}
              className={cn(
                'absolute inset-x-0 bottom-0 border-t backdrop-blur-xl',
                feedback.ok ? 'border-success/20 bg-[color-mix(in_oklab,var(--success)_14%,var(--bg))]' : 'border-danger/20 bg-[color-mix(in_oklab,var(--danger)_12%,var(--bg))]',
              )}
            >
              <div className="mx-auto flex max-w-4xl items-start gap-4 px-5 pt-5 pb-28 sm:px-8">
                <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }}>
                  {feedback.ok ? <CheckCircle2 className="size-9 text-success" /> : <XCircle className="size-9 text-danger" />}
                </motion.div>
                <div className="min-w-0 flex-1">
                  <p className={cn('font-display text-xl font-semibold', feedback.ok ? 'text-success' : 'text-danger')}>{feedback.title}</p>
                  {!feedback.ok && feedback.detail?.correct && <CorrectAnswer correct={feedback.detail.correct} />}
                  {feedback.detail?.explain && <p className="mt-1 text-sm text-ink-soft">{feedback.detail.explain}</p>}
                  {feedback.retry && <p className="mt-1 text-xs text-muted">Cette question reviendra à la fin de la leçon.</p>}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className={cn('relative', !feedback && 'border-t border-line bg-bg/80 backdrop-blur-xl')}>
          <div className="mx-auto flex max-w-4xl justify-end px-5 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:px-8">
            <Button
              size="lg"
              variant={primary.tone}
              disabled={!primary.enabled}
              onClick={primary.action}
              className="w-full sm:w-auto sm:min-w-56"
              silent
            >
              {primary.label}
            </Button>
          </div>
        </div>
      </footer>

      <ExitDialog open={confirmExit} onCancel={() => setConfirmExit(false)} onConfirm={onExit} />
    </div>
  );
}

function CorrectAnswer({ correct }: { correct: NonNullable<AnswerDetail['correct']> }) {
  const item = 'sound' in correct ? (correct as Item) : null;
  return (
    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-ink">
      <span className="text-sm text-muted">Bonne réponse :</span>
      {correct.ar && (
        <button
          type="button"
          disabled={!item}
          onClick={() => item && void playSound(item.sound, `fb:${item.id}`)}
          dir="rtl"
          className={cn('font-quran text-[1.9rem] leading-[1.7]', item && 'underline decoration-dotted underline-offset-8')}
        >
          {correct.ar}
        </button>
      )}
      {'label' in correct && correct.label && <span className="font-semibold">{correct.label}</span>}
      {'text' in correct && correct.text && <span className="font-semibold">{correct.text}</span>}
    </div>
  );
}

function ExitDialog({ open, onCancel, onConfirm }: { open: boolean; onCancel: () => void; onConfirm: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-end bg-black/30 p-4 backdrop-blur-sm sm:place-items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ y: 40, scale: 0.96 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 40, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong w-full max-w-sm rounded-3xl p-6 text-center"
          >
            <p className="font-display text-xl font-semibold">Quitter la leçon ?</p>
            <p className="mt-2 text-sm text-muted">Ta progression dans cette leçon ne sera pas enregistrée.</p>
            <div className="mt-6 flex flex-col gap-2">
              <Button block onClick={onCancel} autoFocus>
                Continuer la leçon
              </Button>
              <Button block variant="ghost" onClick={onConfirm} className="text-danger hover:text-danger">
                Quitter
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

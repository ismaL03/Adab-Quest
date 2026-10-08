import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Delete } from 'lucide-react';
import { audio } from '@/audio/engine';
import { sfx } from '@/audio/sfx';
import { PlayButton, playSound, SoundTile } from '@/components/SoundTile';
import type { BuildStep, ChooseStep, Item, ListenStep, MatchStep } from '@/data/curriculum';
import { sparkleAt } from '@/features/celebrate/celebrate';
import { cn } from '@/lib/cn';
import { shuffle } from '@/lib/random';
import { useSettings } from '@/store/settings';
import type { StepProps } from '../types';
import { ChoiceButton, Stagger, StepHeading, staggerItem } from './common';

function useAutoPlaySound(item: Item | undefined, key?: string) {
  const autoplay = useSettings((s) => s.autoplay);
  useEffect(() => {
    if (!autoplay || !item) return;
    const t = setTimeout(() => void playSound(item.sound, key ?? item.id), 500);
    return () => clearTimeout(t);
  }, [autoplay, item, key]);
}

/* ── QCM auditif ─────────────────────────────────────────────────────────── */

export function ListenStepView({ step, api }: StepProps<ListenStep>) {
  const [selected, setSelected] = useState<string | null>(null);
  const options = useMemo(() => shuffle(step.options), [step]);
  const playKey = `listen:${step.id}`;
  useAutoPlaySound(step.answer, playKey);
  useEffect(() => void audio.preload(step.options.map((o) => o.sound)), [step]);

  const check = useCallback(() => {
    const ok = selected === step.answer.id;
    api.answer(ok, { correct: step.answer });
  }, [api, selected, step.answer]);

  useEffect(() => api.setCheck(selected ? check : null), [api, check, selected]);

  return (
    <div className="flex flex-col items-center gap-8">
      <StepHeading eyebrow="Écoute" title={step.prompt} />
      <PlayButton sound={step.answer.sound} id={playKey} label="Réécouter" />
      <Stagger className="grid w-full max-w-lg grid-cols-2 gap-3 sm:gap-4" delay={0.05}>
        {options.map((opt) => {
          const state = api.locked
            ? opt.id === step.answer.id
              ? 'correct'
              : opt.id === selected
                ? 'wrong'
                : 'dim'
            : opt.id === selected
              ? 'selected'
              : 'idle';
          return (
            <motion.div key={opt.id} variants={staggerItem}>
              <SoundTile
                item={opt}
                size="lg"
                className="w-full"
                state={state}
                showLabel={api.locked}
                // Avant de répondre, toucher une option la sélectionne sans donner la réponse.
                playOnClick={api.locked}
                onPress={() => {
                  if (api.locked) return;
                  sfx.select();
                  setSelected(opt.id);
                }}
              />
            </motion.div>
          );
        })}
      </Stagger>
    </div>
  );
}

/* ── QCM visuel ──────────────────────────────────────────────────────────── */

export function ChooseStepView({ step, api }: StepProps<ChooseStep>) {
  const [selected, setSelected] = useState<string | null>(null);
  const options = useMemo(() => shuffle(step.options), [step]);
  const answer = step.options.find((o) => o.id === step.answerId);

  const check = useCallback(() => {
    const ok = selected === step.answerId;
    if (step.question.sound) void playSound(step.question.sound, `q:${step.id}`);
    api.answer(ok, { correct: { text: answer?.arabic ? undefined : answer?.text, ar: answer?.arabic ? answer.text : undefined }, explain: step.explain });
  }, [api, answer, selected, step]);

  useEffect(() => api.setCheck(selected ? check : null), [api, check, selected]);

  const questionItem: Item | null = step.question.ar
    ? { id: `q:${step.id}`, ar: step.question.ar, sound: step.question.sound ?? { id: `q:${step.id}`, src: '' } }
    : null;

  return (
    <div className="flex flex-col items-center gap-8">
      <StepHeading eyebrow="Lecture" title={step.prompt} />
      {questionItem && (
        <SoundTile
          item={questionItem}
          size="xl"
          showLabel={false}
          playOnClick={api.locked && !!step.question.sound}
          caption={step.question.caption}
        />
      )}
      {step.question.text && <p className="text-center text-lg font-semibold text-ink">{step.question.text}</p>}
      <Stagger className={cn('grid w-full max-w-lg gap-3', options.length > 2 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2')} delay={0.05}>
        {options.map((opt, i) => {
          const state = api.locked
            ? opt.id === step.answerId
              ? 'correct'
              : opt.id === selected
                ? 'wrong'
                : 'dim'
            : opt.id === selected
              ? 'selected'
              : 'idle';
          return (
            <ChoiceButton
              key={opt.id}
              index={i}
              arabic={opt.arabic}
              state={state}
              disabled={api.locked}
              onClick={() => {
                sfx.select();
                setSelected(opt.id);
              }}
            >
              {opt.text}
            </ChoiceButton>
          );
        })}
      </Stagger>
    </div>
  );
}

/* ── Associer des paires ─────────────────────────────────────────────────── */

export function MatchStepView({ step, api }: StepProps<MatchStep>) {
  const lefts = useMemo(() => shuffle(step.pairs.map((p) => p.left)), [step]);
  const rights = useMemo(() => shuffle(step.pairs.map((p) => p.right)), [step]);
  const [left, setLeft] = useState<string | null>(null);
  const [right, setRight] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<{ l: string; r: string } | null>(null);
  const [burst, setBurst] = useState<string | null>(null);

  useEffect(() => {
    if (!left || !right) return;
    if (left === right) {
      sfx.match();
      api.hit();
      setBurst(left);
      const el = document.querySelector(`[data-match-right="${CSS.escape(right)}"]`);
      if (el) {
        const r = el.getBoundingClientRect();
        sparkleAt(r.left + r.width / 2, r.top + r.height / 2);
      }
      setMatched((m) => new Set(m).add(left));
    } else {
      sfx.wrong();
      api.mistake();
      setWrong({ l: left, r: right });
      setTimeout(() => setWrong(null), 600);
    }
    setLeft(null);
    setRight(null);
  }, [left, right, api]);

  useEffect(() => {
    if (matched.size === step.pairs.length && !api.locked) {
      const t = setTimeout(() => api.answer(true), 450);
      return () => clearTimeout(t);
    }
  }, [matched, step.pairs.length, api]);

  return (
    <div className="flex flex-col items-center gap-7">
      <StepHeading eyebrow="Association" title={step.prompt} prompt="Touche un élément arabe (pour l’écouter), puis sa lecture." />
      <div className="grid w-full max-w-lg grid-cols-2 gap-4">
        <Stagger className="flex flex-col gap-3" delay={0.05}>
          {lefts.map((it) => {
            const done = matched.has(it.id);
            return (
              <motion.div key={it.id} variants={staggerItem} animate={{ opacity: done ? 0.35 : 1, scale: done ? 0.96 : 1 }}>
                <SoundTile
                  item={it}
                  size="sm"
                  showLabel={false}
                  className="w-full"
                  disabled={done}
                  state={done ? 'correct' : wrong?.l === it.id ? 'wrong' : left === it.id ? 'selected' : 'idle'}
                  onPress={() => setLeft(it.id)}
                />
              </motion.div>
            );
          })}
        </Stagger>
        <Stagger className="flex flex-col gap-3" delay={0.05}>
          {rights.map((r) => {
            const done = matched.has(r.id);
            return (
              <motion.button
                key={r.id}
                type="button"
                data-match-right={r.id}
                variants={staggerItem}
                whileTap={{ scale: 0.95 }}
                disabled={done}
                onClick={() => {
                  sfx.select();
                  setRight(r.id);
                }}
                animate={wrong?.r === r.id ? { x: [0, -6, 6, -4, 4, 0] } : { opacity: done ? 0.35 : 1 }}
                className={cn(
                  'glass relative flex min-h-[4.5rem] items-center justify-center rounded-3xl px-3 text-[1.05rem] font-semibold transition-colors',
                  done && 'bg-success-soft text-success ring-2 ring-success',
                  wrong?.r === r.id && 'bg-danger-soft text-danger ring-2 ring-danger',
                  right === r.id && !done && 'bg-primary-soft ring-2 ring-primary',
                )}
              >
                {r.arabic ? (
                  <span dir="rtl" className="font-quran text-3xl">
                    {r.text}
                  </span>
                ) : (
                  r.text
                )}
                {burst === r.id && <BurstOnce onDone={() => setBurst(null)} />}
              </motion.button>
            );
          })}
        </Stagger>
      </div>
    </div>
  );
}

function BurstOnce({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 700);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <motion.span
      className="pointer-events-none absolute inset-0 rounded-3xl ring-4 ring-gold"
      initial={{ opacity: 0.9, scale: 1 }}
      animate={{ opacity: 0, scale: 1.15 }}
      transition={{ duration: 0.6 }}
    />
  );
}

/* ── Assembler un mot ────────────────────────────────────────────────────── */

export function BuildStepView({ step, api }: StepProps<BuildStep>) {
  const bank = useMemo(
    () => shuffle([...step.pieces, ...step.distractors].map((p, i) => ({ ...p, id: `${p.id}#${i}` }))),
    [step],
  );
  const [chosen, setChosen] = useState<string[]>([]);
  const playKey = `build:${step.id}`;
  useAutoPlaySound(step.target, playKey);
  useEffect(() => void audio.preload([step.target.sound, ...bank.map((b) => b.sound)]), [step, bank]);

  const composed = chosen.map((id) => bank.find((b) => b.id === id)!.ar).join('');
  const full = chosen.length === step.pieces.length;

  const check = useCallback(() => {
    api.answer(composed === step.target.ar, { correct: step.target });
  }, [api, composed, step.target]);

  useEffect(() => api.setCheck(full ? check : null), [api, check, full]);

  return (
    <div className="flex flex-col items-center gap-7">
      <StepHeading eyebrow="Assemblage" title={step.prompt} />
      <div className="flex items-center gap-5">
        <PlayButton sound={step.target.sound} id={playKey} size="md" label="Le mot" />
        {step.target.meaning && (
          <div className="glass rounded-2xl px-4 py-2 text-sm">
            <span className="text-muted">Sens : </span>
            <span className="font-semibold text-ink">{step.target.meaning}</span>
          </div>
        )}
      </div>

      {/* Zone de composition : la liaison des lettres se fait en direct */}
      <div className="glass relative flex min-h-[8.5rem] w-full max-w-lg items-center justify-center rounded-3xl px-6">
        <div className="absolute inset-x-8 bottom-6 border-b-2 border-dashed border-line-strong" />
        <AnimatePresence mode="popLayout">
          {composed ? (
            <motion.span
              key={composed}
              dir="rtl"
              lang="ar"
              initial={{ opacity: 0.4, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                'font-quran relative text-[3.6rem] leading-[1.6]',
                api.locked && (composed === step.target.ar ? 'text-success' : 'text-danger'),
              )}
            >
              {composed}
            </motion.span>
          ) : (
            <span className="relative text-sm text-muted">Touche les syllabes dans l’ordre (de droite à gauche)</span>
          )}
        </AnimatePresence>
        {chosen.length > 0 && !api.locked && (
          <button
            type="button"
            onClick={() => setChosen((c) => c.slice(0, -1))}
            className="absolute top-3 left-3 grid size-9 place-items-center rounded-full text-muted hover:bg-surface-sunken hover:text-ink"
            aria-label="Effacer la dernière syllabe"
          >
            <Delete className="size-4" />
          </button>
        )}
      </div>

      <Stagger className="flex max-w-lg flex-wrap justify-center gap-3" delay={0.04}>
        {bank.map((b) => {
          const used = chosen.includes(b.id);
          return (
            <motion.div key={b.id} variants={staggerItem} animate={{ opacity: used ? 0.25 : 1, scale: used ? 0.9 : 1 }}>
              <SoundTile
                item={b}
                size="sm"
                showLabel={false}
                disabled={used || api.locked || full}
                onPress={() => {
                  if (!used && !full) setChosen((c) => [...c, b.id]);
                }}
              />
            </motion.div>
          );
        })}
      </Stagger>
    </div>
  );
}

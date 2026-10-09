import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Pause, Play, Search, Sparkles } from 'lucide-react';
import { audio } from '@/audio/engine';
import { sfx } from '@/audio/sfx';
import { sounds } from '@/audio/sounds';
import { PlayButton, playSound, SoundTile } from '@/components/SoundTile';
import { Button } from '@/components/ui/Button';
import type { MushafStep, RepeatStep, VerseListenStep, VerseOrderStep, VerseStep } from '@/data/curriculum';
import { loadVerses, type QuranWord } from '@/data/quran/loader';
import { getSurahMeta } from '@/data/quran/surahMeta';
import { sparkleAt } from '@/features/celebrate/celebrate';
import { countMatchingWords, type HighlightSpec } from '@/features/mushaf/highlight';
import { MushafView } from '@/features/mushaf/MushafView';
import { MushafWord } from '@/features/mushaf/MushafWord';
import { AyahMarker } from '@/features/mushaf/ornaments';
import { findBestPassage, type Passage } from '@/features/mushaf/passage';
import { useSurah } from '@/features/mushaf/useSurah';
import { cn } from '@/lib/cn';
import { sample, shuffle } from '@/lib/random';
import { useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';
import type { StepProps } from '../types';
import { ChoiceButton, Stagger, StepHeading, staggerItem } from './common';

/** Bouton « lecture guidée » : joue une suite de sons avec surlignage karaoké. */
function GuidedButton({ playing, onPlay, onStop }: { playing: boolean; onPlay: () => void; onStop: () => void }) {
  return (
    <Button variant={playing ? 'secondary' : 'primary'} onClick={playing ? onStop : onPlay} silent>
      {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
      {playing ? 'Arrêter' : 'Lecture guidée'}
    </Button>
  );
}

/* ── Écoute et répète ────────────────────────────────────────────────────── */

export function RepeatStepView({ step, api }: StepProps<RepeatStep>) {
  const flat = useMemo(() => step.lines.flat(), [step]);
  const [heard, setHeard] = useState<Set<string>>(new Set());
  const [guided, setGuided] = useState<number | null>(null);
  const [guidedDone, setGuidedDone] = useState(false);

  const ready = guidedDone || flat.every((it) => heard.has(it.id));
  useEffect(() => api.setReady(ready), [api, ready]);
  useEffect(() => void audio.preload(flat.map((i) => i.sound)), [flat]);
  useEffect(() => () => audio.stop(), []);

  const runGuided = async () => {
    const ok = await audio.playSequence(
      flat.map((it) => ({ sound: it.sound, key: it.id })),
      (i) => {
        setGuided(i >= 0 ? i : null);
        if (i >= 0) setHeard((h) => new Set(h).add(flat[i].id));
      },
      380,
    );
    setGuided(null);
    if (ok) setGuidedDone(true);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <StepHeading eyebrow="Écoute et répète" title={step.title} prompt={step.prompt} />
      <GuidedButton playing={guided !== null} onPlay={runGuided} onStop={() => audio.stop()} />
      <Stagger className="flex w-full max-w-3xl flex-col items-center gap-3" delay={0.06}>
        {step.lines.map((line, li) => (
          <motion.div key={li} variants={staggerItem} dir="rtl" className="flex flex-wrap justify-center gap-2.5">
            {line.map((it) => (
              <SoundTile
                key={it.id}
                item={it}
                size="md"
                heard={heard.has(it.id)}
                state={guided !== null && flat[guided]?.id === it.id ? 'active' : 'idle'}
                onPress={() => setHeard((h) => new Set(h).add(it.id))}
              />
            ))}
          </motion.div>
        ))}
      </Stagger>
      <AnimatePresence>
        {ready && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 rounded-full bg-success-soft px-4 py-2 text-sm font-semibold text-success"
          >
            <Sparkles className="size-4" /> Maintenant, relis toute la série à voix haute, sans l’audio.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Chasse dans le Mushaf ───────────────────────────────────────────────── */

export function MushafStepView({ step, api }: StepProps<MushafStep>) {
  const [passage, setPassage] = useState<Passage | null>(step.passage ?? null);
  const [available, setAvailable] = useState<number | null>(null);
  const [filter, setFilter] = useState<number>(-1);
  const [found, setFound] = useState<Set<string>>(new Set());
  const [hint, setHint] = useState<string | null>(null);
  const [wrongKey, setWrongKey] = useState<string | null>(null);

  const highlight: HighlightSpec = filter >= 0 && step.filters ? step.filters[filter].highlight : step.highlight;

  // Passage : fourni par la leçon ou choisi automatiquement (le plus riche en occurrences).
  useEffect(() => {
    let alive = true;
    (async () => {
      const p = step.passage ?? (await findBestPassage(step.highlight));
      const verses = await loadVerses(p.surah, p.from, p.to);
      if (!alive) return;
      setPassage(p);
      setAvailable(countMatchingWords(verses.flatMap((v) => v.words), step.highlight));
    })();
    return () => {
      alive = false;
    };
  }, [step]);

  const goal = available === null ? step.goal : Math.max(1, Math.min(step.goal, available));
  const done = found.size >= goal;
  useEffect(() => api.setReady(done), [api, done]);

  const onWord = useCallback(
    (word: QuranWord, { matches, el }: { matches: number; el: HTMLElement }) => {
      if (matches > 0) {
        if (!found.has(word.key)) {
          const r = el.getBoundingClientRect();
          sparkleAt(r.left + r.width / 2, r.top + r.height / 2);
          sfx.match();
          setFound((f) => new Set(f).add(word.key));
        }
        setHint(null);
      } else {
        // Pas de pénalité : un signal bref, puis on continue de chercher.
        sfx.wrong();
        setWrongKey(word.key);
        setTimeout(() => setWrongKey((k) => (k === word.key ? null : k)), 650);
        setHint(`Ce mot ne contient pas ${highlight.label ?? 'l’élément recherché'}. Observe bien chaque lettre.`);
      }
    },
    [found, highlight.label],
  );

  const meta = passage ? getSurahMeta(passage.surah) : null;

  return (
    <div className="flex flex-col items-center gap-5">
      <StepHeading eyebrow="Dans le Mushaf" title={step.prompt} />
      <div className="flex flex-wrap items-center justify-center gap-3">
        <div className="glass flex items-center gap-3 rounded-full px-4 py-2">
          <Search className="size-4 text-primary" />
          <span className="text-sm font-semibold tabular-nums">
            {Math.min(found.size, goal)} / {goal} trouvés
          </span>
          <div className="flex gap-1">
            {Array.from({ length: goal }, (_, i) => (
              <motion.span
                key={i}
                className={cn('size-2 rounded-full', i < found.size ? 'bg-highlight' : 'bg-line-strong')}
                animate={i < found.size ? { scale: [1, 1.6, 1] } : {}}
              />
            ))}
          </div>
        </div>
        {meta && passage && (
          <span className="text-sm text-muted">
            {meta.name} · v. {passage.from}–{passage.to}
          </span>
        )}
      </div>

      {step.filters && step.filters.length > 1 && (
        <div className="flex flex-wrap justify-center gap-2">
          {step.filters.map((f, i) => (
            <button
              key={f.label}
              type="button"
              onClick={() => setFilter(i)}
              className={cn(
                'min-w-11 rounded-full px-3.5 py-1 text-sm font-semibold transition-colors',
                filter === i
                  ? 'bg-ink text-bg'
                  : 'bg-surface-sunken text-ink-soft ring-1 ring-line hover:text-ink',
              )}
            >
              <span className={/[؀-ۿ]/.test(f.label) ? 'font-quran text-xl leading-none' : ''}>{f.label}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setFilter(-1)}
            className={cn(
              'rounded-full px-3.5 py-1 text-sm font-semibold transition-colors',
              filter < 0 ? 'bg-ink text-bg' : 'bg-surface-sunken text-ink-soft ring-1 ring-line hover:text-ink',
            )}
          >
            Tout
          </button>
        </div>
      )}

      {passage ? (
        <MushafView
          surah={passage.surah}
          from={passage.from}
          to={passage.to}
          highlight={highlight}
          foundKeys={found}
          wrongKey={wrongKey}
          // Texte uni : c’est à l’élève de trouver l’élément, révélé en doré une fois touché.
          revealOnFound
          tajweed={step.tajweed ?? false}
          showBanner={passage.from === 1}
          className="w-full max-w-3xl"
          onWordPress={onWord}
        />
      ) : (
        <div className="h-64 w-full max-w-3xl animate-pulse rounded-[2rem] bg-surface-sunken" />
      )}

      <AnimatePresence mode="wait">
        {hint && !done && (
          <motion.p key={hint} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center text-sm text-muted">
            {hint}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Lecture d’un verset ─────────────────────────────────────────────────── */

function useVerse(surah: number, ayah: number) {
  const { verses } = useSurah(surah);
  return verses?.find((v) => v.ayah === ayah) ?? null;
}

const wordSound = (w: QuranWord) => sounds.quranWord(w.surah, w.ayah, w.position, w.text);

export function VerseStepView({ step, api }: StepProps<VerseStep>) {
  const verse = useVerse(step.surah, step.ayah);
  const settings = useSettings();
  const [heard, setHeard] = useState<Set<string>>(new Set());
  const [guiding, setGuiding] = useState(false);
  const [guidedDone, setGuidedDone] = useState(false);
  const meta = getSurahMeta(step.surah);

  const ready = guidedDone || (!!verse && verse.words.every((w) => heard.has(w.key)));
  useEffect(() => api.setReady(ready), [api, ready]);
  useEffect(() => () => audio.stop(), []);

  const onPress = useCallback((w: QuranWord) => {
    void playSound(wordSound(w), w.key);
    useProgress.getState().recordMushafWord();
    setHeard((h) => new Set(h).add(w.key));
  }, []);

  const runGuided = async () => {
    if (!verse) return;
    setGuiding(true);
    const ok = await audio.playSequence(
      verse.words.map((w) => ({ sound: wordSound(w), key: w.key })),
      (i) => i >= 0 && setHeard((h) => new Set(h).add(verse.words[i].key)),
      260,
    );
    setGuiding(false);
    if (ok) setGuidedDone(true);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <StepHeading eyebrow={`${meta.name} · verset ${step.ayah}`} title={step.prompt} />
      <GuidedButton playing={guiding} onPlay={runGuided} onStop={() => audio.stop()} />
      <div className="relative w-full max-w-3xl overflow-hidden rounded-[2rem] border border-paper-edge bg-paper px-6 py-8 text-paper-ink shadow-[var(--shadow-lift)] sm:px-10">
        <div className="pointer-events-none absolute inset-2.5 rounded-[1.6rem] border border-[color-mix(in_oklab,var(--gold)_40%,transparent)]" />
        {verse ? (
          <p dir="rtl" lang="ar" className="font-quran relative text-center text-[clamp(2rem,6vw,3rem)]" style={{ lineHeight: 2.1 }}>
            {verse.words.map((w) => (
              <span key={w.key}>
                <MushafWord
                  word={w}
                  highlight={step.highlight}
                  tajweed={settings.tajweedColors}
                  showTafkhim={settings.showTafkhim}
                  found={heard.has(w.key)}
                  onPress={onPress}
                />{' '}
              </span>
            ))}
            <AyahMarker n={step.ayah} />
          </p>
        ) : (
          <div className="h-24 animate-pulse rounded-2xl bg-surface-sunken" />
        )}
      </div>
      {verse && (
        <p className="text-sm text-muted">
          {heard.size} / {verse.words.length} mots écoutés
        </p>
      )}
    </div>
  );
}

/* ── Quel mot as-tu entendu ? ────────────────────────────────────────────── */

export function VerseListenStepView({ step, api }: StepProps<VerseListenStep>) {
  const verse = useVerse(step.surah, step.ayah);
  const [selected, setSelected] = useState<string | null>(null);
  const autoplay = useSettings((s) => s.autoplay);

  const quiz = useMemo(() => {
    if (!verse) return null;
    const unique = [...new Map(verse.words.map((w) => [w.text, w])).values()];
    const answer = unique[Math.floor(Math.random() * unique.length)];
    const others = sample(
      unique.filter((w) => w.key !== answer.key),
      Math.min(3, unique.length - 1),
    );
    return { answer, options: shuffle([answer, ...others]) };
  }, [verse]);

  const playKey = `vl:${step.id}`;
  useEffect(() => {
    if (!quiz || !autoplay) return;
    const t = setTimeout(() => void playSound(wordSound(quiz.answer), playKey), 500);
    return () => clearTimeout(t);
  }, [quiz, autoplay, playKey]);

  const check = useCallback(() => {
    if (!quiz) return;
    api.answer(selected === quiz.answer.key, { correct: { ar: quiz.answer.text } });
  }, [api, quiz, selected]);
  useEffect(() => api.setCheck(selected ? check : null), [api, check, selected]);

  if (!quiz) return <div className="mx-auto h-64 w-full max-w-lg animate-pulse rounded-3xl bg-surface-sunken" />;

  return (
    <div className="flex flex-col items-center gap-8">
      <StepHeading eyebrow={`${getSurahMeta(step.surah).name} · verset ${step.ayah}`} title={step.prompt} />
      <PlayButton sound={wordSound(quiz.answer)} id={playKey} label="Réécouter" />
      <Stagger className="grid w-full max-w-lg grid-cols-2 gap-3" delay={0.05}>
        {quiz.options.map((w) => (
          <ChoiceButton
            key={w.key}
            arabic
            disabled={api.locked}
            state={
              api.locked
                ? w.key === quiz.answer.key
                  ? 'correct'
                  : w.key === selected
                    ? 'wrong'
                    : 'dim'
                : w.key === selected
                  ? 'selected'
                  : 'idle'
            }
            onClick={() => {
              sfx.select();
              setSelected(w.key);
            }}
          >
            {w.text}
          </ChoiceButton>
        ))}
      </Stagger>
    </div>
  );
}

/* ── Remettre le verset dans l’ordre ─────────────────────────────────────── */

export function VerseOrderStepView({ step, api }: StepProps<VerseOrderStep>) {
  const verse = useVerse(step.surah, step.ayah);
  const bank = useMemo(() => (verse ? shuffle(verse.words) : []), [verse]);
  const [chosen, setChosen] = useState<QuranWord[]>([]);
  const full = !!verse && chosen.length === verse.words.length;
  const correct = full && chosen.every((w, i) => w.text === verse!.words[i].text);

  const check = useCallback(() => {
    api.answer(correct, { correct: { ar: verse?.words.map((w) => w.text).join(' ') } });
  }, [api, correct, verse]);
  useEffect(() => api.setCheck(full ? check : null), [api, check, full]);

  if (!verse) return <div className="mx-auto h-64 w-full max-w-lg animate-pulse rounded-3xl bg-surface-sunken" />;

  return (
    <div className="flex flex-col items-center gap-7">
      <StepHeading eyebrow={`${getSurahMeta(step.surah).name} · verset ${step.ayah}`} title={step.prompt} />
      <div
        dir="rtl"
        className={cn(
          'glass flex min-h-[7rem] w-full max-w-2xl flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-3xl px-5 py-4',
          api.locked && (correct ? 'ring-2 ring-success' : 'ring-2 ring-danger'),
        )}
      >
        {chosen.length === 0 && <span className="text-sm text-muted" dir="ltr">Touche les mots dans l’ordre de lecture</span>}
        <AnimatePresence>
          {chosen.map((w) => (
            <motion.button
              key={w.key}
              type="button"
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              disabled={api.locked}
              onClick={() => setChosen((c) => c.filter((x) => x.key !== w.key))}
              className="font-quran rounded-xl px-1.5 text-[2.1rem] leading-[1.9] hover:bg-surface-sunken"
            >
              {w.text}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
      <div dir="rtl" className="flex max-w-2xl flex-wrap justify-center gap-2.5">
        {bank.map((w) => {
          const used = chosen.some((c) => c.key === w.key);
          return (
            <motion.button
              key={w.key}
              type="button"
              layout
              whileTap={{ scale: 0.94 }}
              disabled={used || api.locked}
              animate={{ opacity: used ? 0.2 : 1 }}
              onClick={() => {
                void playSound(wordSound(w), w.key);
                setChosen((c) => [...c, w]);
              }}
              className="glass font-quran rounded-2xl px-4 text-[1.9rem] leading-[1.9]"
            >
              {w.text}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

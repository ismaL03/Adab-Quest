import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Lightbulb, Link2Off, Sun, Volume2, Weight } from 'lucide-react';
import { audio } from '@/audio/engine';
import { SoundTile } from '@/components/SoundTile';
import type { DiscoverStep, FormsStep, IntroStep, LetterStep } from '@/data/curriculum';
import { formItems } from '@/data/curriculum/builders';
import { letterItem } from '@/data/curriculum/items';
import { letter } from '@/data/letters';
import { RichText } from '@/components/RichText';
import { cn } from '@/lib/cn';
import { useSettings } from '@/store/settings';
import type { StepProps } from '../types';
import { Stagger, StepHeading, staggerItem } from './common';

function useAutoPlay(play: () => void, deps: unknown[]) {
  const autoplay = useSettings((s) => s.autoplay);
  useEffect(() => {
    if (!autoplay) return;
    const t = setTimeout(play, 450);
    return () => clearTimeout(t);
  }, deps); // dépendances fournies par l’appelant

}

export function IntroStepView({ step, api }: StepProps<IntroStep>) {
  useEffect(() => api.setReady(true), [api]);
  return (
    <div className="flex flex-col items-center gap-7">
      <StepHeading eyebrow={step.eyebrow} title={step.title} />
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="max-w-xl text-center text-[1.05rem] leading-relaxed text-pretty text-ink-soft"
      >
        <RichText text={step.body} />
      </motion.p>
      {step.hero && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15, type: 'spring' }}>
          <SoundTile item={step.hero} size="xl" />
        </motion.div>
      )}
      {step.items && (
        <Stagger className="flex flex-wrap justify-center gap-3" delay={0.04}>
          {step.items.map((it) => (
            <motion.div key={it.id} variants={staggerItem}>
              <SoundTile item={it} size="md" />
            </motion.div>
          ))}
        </Stagger>
      )}
      {step.tips && (
        <div className="glass w-full max-w-xl space-y-2.5 rounded-3xl p-5">
          {step.tips.map((tip) => (
            <p key={tip} className="flex items-start gap-3 text-[0.95rem] text-ink-soft">
              <Lightbulb className="mt-0.5 size-4 shrink-0 text-gold" />
              <span>
                <RichText text={tip} />
              </span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export function LetterStepView({ step, api }: StepProps<LetterStep>) {
  const l = letter(step.letterId);
  const item = letterItem(l.id);
  const forms = l.id === 'hamza' ? [] : formItems(l.id);
  useEffect(() => api.setReady(true), [api]);
  useAutoPlay(() => void audio.play(item.sound, item.id), [l.id]);

  return (
    <div className="flex flex-col items-center gap-6">
      <StepHeading eyebrow="Nouvelle lettre" title={l.name} />
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-stretch">
        <SoundTile item={item} size="xl" showLabel={false} />
        <div className="glass flex max-w-sm flex-col justify-center gap-3 rounded-3xl p-5">
          <p dir="rtl" lang="ar" className="font-quran text-3xl leading-[1.7] text-ink">
            {l.nameAr}
          </p>
          <p className="flex items-start gap-2.5 text-[0.95rem] leading-relaxed text-ink-soft">
            <Volume2 className="mt-1 size-4 shrink-0 text-primary" />
            {l.tip}
          </p>
          <div className="flex flex-wrap gap-2">
            {l.heavy && <Tag icon={<Weight className="size-3.5" />}>Lettre épaisse</Tag>}
            {l.nonConnector && <Tag icon={<Link2Off className="size-3.5" />}>Ne se lie pas à gauche</Tag>}
            {l.solar && <Tag icon={<Sun className="size-3.5" />}>Lettre solaire</Tag>}
          </div>
        </div>
      </div>
      {forms.length > 0 && (
        <div className="w-full max-w-xl">
          <p className="mb-2 text-center text-xs font-bold tracking-[0.14em] text-muted uppercase">Ses formes dans le mot</p>
          <Stagger className="grid grid-cols-4 gap-2.5" delay={0.05}>
            {[...forms].reverse().map((f) => (
              <motion.div key={f.id} variants={staggerItem}>
                <SoundTile item={f} size="sm" className="w-full" showLabel={false} caption={f.label?.split(' · ')[1]} />
              </motion.div>
            ))}
          </Stagger>
        </div>
      )}
    </div>
  );
}

function Tag({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-soft px-2.5 py-1 text-xs font-semibold text-gold">
      {icon}
      {children}
    </span>
  );
}

export function DiscoverStepView({ step, api }: StepProps<DiscoverStep>) {
  const [heard, setHeard] = useState<Set<string>>(new Set());
  const done = heard.size >= step.items.length;
  useEffect(() => api.setReady(done), [api, done]);
  useEffect(() => void audio.preload(step.items.map((i) => i.sound)), [step]);

  return (
    <div className="flex flex-col items-center gap-6">
      <StepHeading title={step.title} prompt={step.prompt} />
      <div className="flex items-center gap-2 rounded-full bg-surface-sunken px-3 py-1 text-sm font-semibold text-muted ring-1 ring-line">
        <span className={cn('tabular-nums', done && 'text-success')}>
          {heard.size} / {step.items.length}
        </span>
        écoutés
      </div>
      <Stagger className="flex max-w-3xl flex-wrap justify-center gap-3" delay={0.035}>
        {step.items.map((it) => (
          <motion.div key={it.id} variants={staggerItem}>
            <SoundTile item={it} size="lg" heard={heard.has(it.id)} onPress={() => setHeard((h) => new Set(h).add(it.id))} />
          </motion.div>
        ))}
      </Stagger>
    </div>
  );
}

export function FormsStepView({ step, api }: StepProps<FormsStep>) {
  useEffect(() => api.setReady(true), [api]);
  const heads = ['Isolée', 'Début', 'Milieu', 'Fin'];
  return (
    <div className="flex flex-col items-center gap-6">
      <StepHeading title={step.title} prompt={step.prompt} />
      <div className="w-full max-w-2xl">
        <div dir="rtl" className="mb-2 grid grid-cols-[repeat(4,1fr)_4.5rem] gap-2 px-1 text-center text-[0.7rem] font-bold tracking-[0.12em] text-muted uppercase">
          {heads.map((h) => (
            <span key={h}>{h}</span>
          ))}
          <span />
        </div>
        <Stagger className="space-y-2" delay={0.05}>
          {step.letterIds.map((id) => {
            const forms = formItems(id);
            return (
              <motion.div key={id} variants={staggerItem} dir="rtl" className="grid grid-cols-[repeat(4,1fr)_4.5rem] items-center gap-2">
                {forms.map((f) => (
                  <SoundTile key={f.id} item={f} size="sm" className="w-full" showLabel={false} />
                ))}
                <span dir="ltr" className="text-sm font-semibold text-ink-soft">
                  {letter(id).name}
                </span>
              </motion.div>
            );
          })}
        </Stagger>
      </div>
    </div>
  );
}


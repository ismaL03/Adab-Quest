import { useState } from 'react';
import { Link } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { BookOpenText, Link2Off, Sun, Volume2, Weight } from 'lucide-react';
import { SoundTile } from '@/components/SoundTile';
import { Arabic, GlassCard } from '@/components/ui/primitives';
import { formItems } from '@/data/curriculum/builders';
import { letterItem, maddItem, shaddaItem, sukunItem, tanwinItem, VOWEL_IDS } from '@/data/curriculum/items';
import { vowelRow } from '@/data/curriculum/builders';
import { ALL_LETTERS, letter } from '@/data/letters';
import { cn } from '@/lib/cn';

export default function AlphabetPage() {
  const [selected, setSelected] = useState('ba');
  const l = letter(selected);
  const canVowel = l.id !== 'alif';

  return (
    <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6 lg:pt-10">
      <p className="text-[0.7rem] font-bold tracking-[0.16em] text-primary uppercase">Référence</p>
      <h1 className="mt-1 font-display text-[clamp(1.8rem,4.5vw,2.4rem)] leading-tight font-semibold tracking-[-0.02em]">L’alphabet arabe</h1>
      <p className="mt-1 text-sm text-muted">Touche une lettre pour l’écouter et découvrir ses formes et ses sons.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_24rem]">
        <div dir="rtl" className="grid content-start grid-cols-4 gap-2.5 sm:grid-cols-6 xl:grid-cols-7">
          {ALL_LETTERS.map((it, i) => (
            <motion.div
              key={it.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.012 }}
              dir="ltr"
            >
              <SoundTile
                item={letterItem(it.id)}
                size="md"
                className="w-full"
                state={selected === it.id ? 'selected' : 'idle'}
                onPress={() => setSelected(it.id)}
              />
            </motion.div>
          ))}
        </div>

        <div className="lg:sticky lg:top-8 lg:self-start">
          <AnimatePresence mode="wait">
            <motion.div
              key={l.id}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <GlassCard strong className="overflow-hidden p-5">
                <div className="flex items-center gap-4">
                  <SoundTile item={letterItem(l.id)} size="lg" showLabel={false} />
                  <div>
                    <p className="font-display text-2xl font-semibold">{l.name}</p>
                    <Arabic className="text-2xl leading-[1.7] text-ink-soft">{l.nameAr}</Arabic>
                  </div>
                </div>
                <p className="mt-4 flex items-start gap-2.5 text-sm leading-relaxed text-ink-soft">
                  <Volume2 className="mt-0.5 size-4 shrink-0 text-primary" /> {l.tip}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {l.heavy && <Chip icon={<Weight className="size-3.5" />}>Lettre épaisse</Chip>}
                  {l.nonConnector && <Chip icon={<Link2Off className="size-3.5" />}>Ne se lie pas à gauche</Chip>}
                  {l.solar && <Chip icon={<Sun className="size-3.5" />}>Lettre solaire</Chip>}
                </div>

                {l.id !== 'hamza' && (
                  <Section title="Formes">
                    <div dir="rtl" className="grid grid-cols-4 gap-2">
                      {formItems(l.id).map((f) => (
                        <SoundTile key={f.id} item={f} size="sm" className="w-full" showLabel={false} caption={f.label?.split(' · ')[1]} />
                      ))}
                    </div>
                  </Section>
                )}

                <Section title="Voyelles courtes">
                  <Row items={VOWEL_IDS.map((v) => vowelRow([l.id], v)[0])} />
                </Section>

                {canVowel && l.id !== 'hamza' && (
                  <>
                    <Section title="Voyelles longues">
                      <Row items={VOWEL_IDS.map((v) => maddItem(l.id, v))} />
                    </Section>
                    <Section title="Tanwîn">
                      <Row items={VOWEL_IDS.map((v) => tanwinItem(l.id, v))} />
                    </Section>
                    <Section title="Soukoun et chadda">
                      <Row items={[sukunItem(l.id), shaddaItem(l.id)]} />
                    </Section>
                  </>
                )}

                <Link
                  to={`/mushaf?s=${l.id === 'sin' ? 114 : 1}&l=${encodeURIComponent(l.char)}`}
                  className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-primary-soft px-4 py-3 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-on-primary"
                >
                  <BookOpenText className="size-4" /> Voir cette lettre dans le Mushaf
                </Link>
              </GlassCard>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <p className="mb-2 text-[0.68rem] font-bold tracking-[0.14em] text-muted uppercase">{title}</p>
      {children}
    </div>
  );
}

function Row({ items }: { items: ReturnType<typeof letterItem>[] }) {
  return (
    <div dir="rtl" className={cn('grid gap-2', items.length === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
      {items.map((it) => (
        <SoundTile key={it.id} item={it} size="sm" className="w-full" />
      ))}
    </div>
  );
}

function Chip({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-soft px-2.5 py-1 text-xs font-semibold text-gold">
      {icon}
      {children}
    </span>
  );
}

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, BookOpenText, Headphones, Sparkles } from 'lucide-react';
import { useSettings } from '@/store/settings';
import { Button } from './ui/Button';
import { Arabic } from './ui/primitives';

const FEATURES = [
  { icon: Headphones, title: 'Écoute et répète', text: 'Chaque lettre, syllabe et mot se touche pour être entendu.' },
  { icon: Sparkles, title: 'Une progression claire', text: 'D’abord le système de lecture, puis une lettre par leçon, retrouvée à chaque fois dans le Mushaf.' },
  { icon: BookOpenText, title: 'Jusqu’au Mushaf', text: 'Retrouve ce que tu apprends dans le texte coranique, en couleurs Tajweed.' },
];

/** Écran d’accueil affiché à la première ouverture. */
export function Welcome() {
  const onboarded = useSettings((s) => s.onboarded);
  const update = useSettings((s) => s.update);
  const [name, setName] = useState('');

  return (
    <AnimatePresence>
      {!onboarded && (
        <motion.div
          className="fixed inset-0 z-[70] overflow-y-auto bg-bg"
          exit={{ opacity: 0, scale: 1.03 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="app-backdrop" />
          <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-6 py-12 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, filter: 'blur(12px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <div className="absolute inset-0 -z-10 rounded-full bg-[radial-gradient(circle,var(--primary-soft),transparent_70%)] blur-2xl" />
              <Arabic className="block text-[6.5rem] leading-[1.6] text-primary">ٱقْرَأْ</Arabic>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="font-display text-[2.4rem] leading-[1.1] font-semibold tracking-[-0.03em]"
            >
              Apprends à lire l’arabe,
              <br />
              <span className="text-primary">jusqu’au Coran.</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-3 text-muted">
              Gratuit, sans publicité, à ton rythme.
            </motion.p>

            <div className="mt-8 w-full space-y-3 text-left">
              {FEATURES.map(({ icon: Icon, title, text }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.75 + i * 0.12, type: 'spring', stiffness: 260, damping: 24 }}
                  className="glass flex items-start gap-4 rounded-2xl p-4"
                >
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <p className="font-semibold">{title}</p>
                    <p className="text-sm text-muted">{text}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="mt-8 w-full space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                update({ onboarded: true, displayName: name.trim() });
              }}
            >
              <input
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 32))}
                placeholder="Ton prénom (facultatif)"
                aria-label="Ton prénom"
                className="glass h-14 w-full rounded-2xl px-5 text-center text-base outline-none placeholder:text-muted focus:ring-2 focus:ring-primary"
              />
              <Button type="submit" size="lg" block>
                Commencer <ArrowRight className="size-4" />
              </Button>
            </motion.form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

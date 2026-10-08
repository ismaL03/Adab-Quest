import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Info, X } from 'lucide-react';
import { audio, useAudioState } from '@/audio/engine';
import { cn } from '@/lib/cn';
import { BadgeGlyph } from './BadgeGlyph';
import { useUi } from '@/store/ui';

export function Toaster() {
  const toasts = useUi((s) => s.toasts);
  const dismiss = useUi((s) => s.dismissToast);
  const missing = useAudioState((s) => s.missingNotice);

  // L’avertissement audio disparaît de lui-même après quelques secondes.
  useEffect(() => {
    if (!missing) return;
    const t = setTimeout(() => audio.dismissNotice(), 9000);
    return () => clearTimeout(t);
  }, [missing]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-4 lg:top-5">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: -24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            className="glass-strong pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl p-3 pr-2"
          >
            {t.glyph && (
              <div
                className={cn(
                  'grid size-11 shrink-0 place-items-center rounded-xl',
                  t.tone === 'gold' ? 'bg-gradient-to-b from-gold-bright to-gold text-[#1d1608]' : 'bg-primary-soft text-primary',
                )}
              >
                <BadgeGlyph glyph={t.glyph} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">{t.title}</p>
              {t.description && <p className="truncate text-sm text-muted">{t.description}</p>}
            </div>
            <button type="button" onClick={() => dismiss(t.id)} className="grid size-8 place-items-center rounded-full text-muted hover:bg-surface-sunken" aria-label="Fermer">
              <X className="size-4" />
            </button>
          </motion.div>
        ))}
        {missing && (
          <motion.div
            key="audio-missing"
            layout
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="glass-strong pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl p-3.5 pr-2"
          >
            <Info className="mt-0.5 size-5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-bold">Audio de démonstration</p>
              <p className="text-muted">
                {missing.kind === 'file'
                  ? 'Les enregistrements ne sont pas encore installés : la voix arabe du navigateur prend le relais.'
                  : 'Les enregistrements ne sont pas encore installés et aucune voix arabe n’est disponible sur cet appareil : le retour visuel reste actif.'}{' '}
                Fichier attendu :{' '}
                <code className="rounded bg-surface-sunken px-1 py-0.5 text-[0.8em] break-all">public/audio/{missing.src}</code>
              </p>
            </div>
            <button type="button" onClick={() => audio.dismissNotice()} className="grid size-8 place-items-center rounded-full text-muted hover:bg-surface-sunken" aria-label="Fermer">
              <X className="size-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

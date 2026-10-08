import { motion } from 'motion/react';
import { RichText } from '@/components/RichText';
import { cn } from '@/lib/cn';

export function StepHeading({ eyebrow, title, prompt, className }: { eyebrow?: string; title?: string; prompt?: string; className?: string }) {
  return (
    <div className={cn('mx-auto max-w-2xl text-center', className)}>
      {eyebrow && <p className="text-[0.72rem] font-bold tracking-[0.16em] text-primary uppercase">{eyebrow}</p>}
      {title && (
        <h2 className="mt-1.5 font-display text-[clamp(1.5rem,4vw,2.1rem)] leading-tight font-semibold tracking-[-0.02em] text-balance text-ink">
          <RichText text={title} arClassName="text-[1.15em]" />
        </h2>
      )}
      {prompt && (
        <p className="mt-2 text-[0.98rem] text-balance text-muted">
          <RichText text={prompt} />
        </p>
      )}
    </div>
  );
}

/** Conteneur en cascade : les enfants apparaissent les uns après les autres. */
export function Stagger({ children, className, delay = 0.05 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: delay, delayChildren: 0.08 } } }}
    >
      {children}
    </motion.div>
  );
}

export const staggerItem = {
  hidden: { opacity: 0, y: 14, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 380, damping: 28 } },
};

export function ChoiceButton({
  children,
  state,
  onClick,
  disabled,
  arabic,
  index,
}: {
  children: React.ReactNode;
  state: 'idle' | 'selected' | 'correct' | 'wrong' | 'dim';
  onClick: () => void;
  disabled?: boolean;
  arabic?: boolean;
  index?: number;
}) {
  return (
    <motion.button
      type="button"
      variants={staggerItem}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      disabled={disabled}
      animate={state === 'wrong' ? { x: [0, -6, 6, -4, 4, 0] } : undefined}
      transition={{ duration: 0.4 }}
      className={cn(
        'glass relative flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl px-4 py-3 text-center font-semibold transition-[box-shadow,background-color,opacity] duration-200',
        state === 'selected' && 'bg-primary-soft ring-2 ring-primary',
        state === 'correct' && 'bg-success-soft text-success ring-2 ring-success',
        state === 'wrong' && 'bg-danger-soft text-danger ring-2 ring-danger',
        state === 'dim' && 'opacity-45',
        state === 'idle' && 'hover:bg-surface-strong',
      )}
    >
      {index !== undefined && (
        <span className="absolute top-2 left-2.5 text-[0.65rem] font-bold text-muted/70">{index + 1}</span>
      )}
      {arabic ? (
        <span dir="rtl" lang="ar" className="font-quran text-[2.2rem] leading-[1.6]">
          {children}
        </span>
      ) : (
        <span className="text-[1.05rem]">{children}</span>
      )}
    </motion.button>
  );
}

import { motion } from 'motion/react';
import { cn } from '@/lib/cn';

export function GlassCard({
  className,
  children,
  strong,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { strong?: boolean }) {
  return (
    <div className={cn(strong ? 'glass-strong' : 'glass', 'rounded-3xl', className)} {...rest}>
      {children}
    </div>
  );
}

export function ProgressBar({
  value,
  className,
  tone = 'primary',
  height = 10,
}: {
  value: number;
  className?: string;
  tone?: 'primary' | 'gold';
  height?: number;
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div
      className={cn('relative w-full overflow-hidden rounded-full bg-surface-sunken ring-1 ring-line ring-inset', className)}
      style={{ height }}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
    >
      <motion.div
        className={cn(
          'absolute inset-y-0 left-0 rounded-full',
          tone === 'gold' ? 'bg-gradient-to-r from-gold to-gold-bright' : 'bg-gradient-to-r from-primary-strong to-primary',
        )}
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      >
        <div className="absolute inset-x-1 top-[2px] h-[30%] rounded-full bg-white/30" />
      </motion.div>
    </div>
  );
}

export function ProgressRing({
  value,
  size = 44,
  stroke = 4,
  tone = 'primary',
  children,
  className,
}: {
  value: number;
  size?: number;
  stroke?: number;
  tone?: 'primary' | 'gold';
  children?: React.ReactNode;
  className?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className={cn('relative inline-grid place-items-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line-strong)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone === 'gold' ? 'var(--gold)' : 'var(--primary)'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: c * (1 - v) }}
          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

/** Texte arabe coranique (police KFGQPC, sens RTL). */
export function Arabic({
  children,
  className,
  as: Tag = 'span',
}: {
  children: React.ReactNode;
  className?: string;
  as?: 'span' | 'div' | 'p';
}) {
  return (
    <Tag dir="rtl" lang="ar" className={cn('font-quran', className)}>
      {children}
    </Tag>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-2xl px-1 py-2.5 text-left"
    >
      <span>
        <span className="block text-[0.95rem] font-semibold text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-sm text-muted">{description}</span>}
      </span>
      <span
        className={cn(
          'relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300',
          checked ? 'bg-primary' : 'bg-line-strong',
        )}
      >
        <motion.span
          className="absolute top-1 left-1 size-5 rounded-full bg-white shadow-md"
          animate={{ x: checked ? 20 : 0 }}
          transition={{ type: 'spring', stiffness: 600, damping: 32 }}
        />
      </span>
    </button>
  );
}

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  className,
}: {
  value: T;
  options: { value: T; label: React.ReactNode }[];
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cn('inline-flex rounded-2xl bg-surface-sunken p-1 ring-1 ring-line ring-inset', className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              'relative flex-1 rounded-xl px-3 py-1.5 text-sm font-semibold whitespace-nowrap transition-colors',
              active ? 'text-ink' : 'text-muted hover:text-ink',
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${options.map((x) => x.value).join('-')}`}
                className="absolute inset-0 rounded-xl bg-surface-strong shadow-sm ring-1 ring-line"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn('text-[0.72rem] font-bold tracking-[0.16em] text-primary uppercase', className)}>{children}</p>
  );
}

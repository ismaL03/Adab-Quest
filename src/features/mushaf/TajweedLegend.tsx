import { useMemo } from 'react';
import { motion } from 'motion/react';
import type { QuranVerse } from '@/data/quran/loader';
import { cn } from '@/lib/cn';
import { RULE_INFO, TAJWEED_RULES, type TajweedRule } from './tajweed';

/** Règles présentes dans un ensemble de versets (pour une légende contextuelle). */
export function rulesIn(verses: readonly QuranVerse[] | null): TajweedRule[] {
  if (!verses) return [];
  const found = new Set<TajweedRule>();
  for (const v of verses) for (const w of v.words) for (const s of w.segments) s.rules.forEach((r) => found.add(r));
  return TAJWEED_RULES.filter((r) => found.has(r) && RULE_INFO[r].color);
}

export function TajweedLegend({
  rules,
  active,
  onSelect,
  className,
}: {
  rules: readonly TajweedRule[];
  active?: TajweedRule | null;
  onSelect?: (rule: TajweedRule | null) => void;
  className?: string;
}) {
  const sorted = useMemo(() => [...rules], [rules]);
  if (!sorted.length) return null;
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {sorted.map((rule) => {
        const info = RULE_INFO[rule];
        const isActive = active === rule;
        return (
          <motion.button
            key={rule}
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect?.(isActive ? null : rule)}
            title={info.description}
            className={cn(
              'flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
              isActive ? 'bg-ink text-bg' : 'bg-surface-sunken text-ink-soft ring-1 ring-line hover:text-ink',
            )}
          >
            <span className="size-2.5 rounded-full" style={{ background: info.color ?? 'var(--muted)' }} />
            {info.label}
          </motion.button>
        );
      })}
    </div>
  );
}

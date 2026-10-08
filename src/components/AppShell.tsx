import { useState } from 'react';
import { NavLink, useLocation, useOutlet } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { BookOpenText, Flame, Map as MapIcon, Type, UserRound, Zap } from 'lucide-react';
import { cn } from '@/lib/cn';
import { displayedStreak, todayXp, useProgress } from '@/store/progress';
import { Logo } from './Logo';
import { ProgressRing } from './ui/primitives';

const NAV = [
  { to: '/', label: 'Parcours', icon: MapIcon, end: true },
  { to: '/mushaf', label: 'Mushaf', icon: BookOpenText },
  { to: '/alphabet', label: 'Alphabet', icon: Type },
  { to: '/profil', label: 'Profil', icon: UserRound },
];

/** Fige l’outlet pendant l’animation de sortie de page. */
function FrozenOutlet() {
  const outlet = useOutlet();
  const [frozen] = useState(outlet);
  return frozen;
}

function StatChips({ compact }: { compact?: boolean }) {
  const xp = useProgress((s) => s.xp);
  const streak = useProgress((s) => displayedStreak(s.streak));
  const daily = useProgress((s) => todayXp(s.daily));
  const goal = useProgress((s) => s.dailyGoal);
  return (
    <div className={cn('flex items-center', compact ? 'gap-1.5' : 'gap-2')}>
      <span
        className={cn(
          'flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-bold tabular-nums',
          streak > 0 ? 'bg-gold-soft text-gold' : 'bg-surface-sunken text-muted',
        )}
        title="Série de jours"
      >
        <Flame className={cn('size-4', streak > 0 && 'fill-current')} />
        {streak}
      </span>
      <span className="flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-sm font-bold text-primary tabular-nums" title="Expérience">
        <Zap className="size-4 fill-current" />
        {xp}
      </span>
      <ProgressRing value={daily / goal} size={compact ? 30 : 34} stroke={3.5} tone="gold">
        <span className="text-[0.55rem] font-bold text-muted">{Math.min(99, Math.round((daily / goal) * 100))}</span>
      </ProgressRing>
    </div>
  );
}

export function AppShell() {
  const location = useLocation();
  const section = '/' + (location.pathname.split('/')[1] ?? '');

  return (
    <div className="min-h-dvh lg:pl-[17rem]">
      {/* Barre latérale (bureau) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[17rem] flex-col border-r border-line bg-bg-elevated/60 px-5 py-6 backdrop-blur-xl lg:flex">
        <Logo />
        <nav className="mt-10 flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center gap-3 rounded-2xl px-4 py-3 text-[0.95rem] font-semibold transition-colors',
                  isActive ? 'text-ink' : 'text-muted hover:bg-surface-sunken hover:text-ink',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-2xl bg-surface-strong shadow-[var(--shadow-soft)] ring-1 ring-line"
                      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                    />
                  )}
                  <Icon className={cn('relative size-5', isActive && 'text-primary')} />
                  <span className="relative">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto space-y-4">
          <div className="glass rounded-3xl p-4">
            <p className="mb-3 text-[0.7rem] font-bold tracking-[0.14em] text-muted uppercase">Aujourd’hui</p>
            <StatChips />
          </div>
          <p className="px-1 text-xs leading-relaxed text-muted">100 % gratuit · sans publicité</p>
        </div>
      </aside>

      {/* Barre supérieure (mobile) */}
      <header className="sticky top-0 z-40 border-b border-line bg-bg/75 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between px-4 py-2.5">
          <Logo compact />
          <StatChips compact />
        </div>
      </header>

      <main className="relative pb-28 lg:pb-12">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={section}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            <FrozenOutlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Barre d’onglets (mobile) */}
      <nav className="fixed inset-x-3 bottom-3 z-40 lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="glass-strong mx-auto flex max-w-md items-center justify-around rounded-[1.6rem] p-1.5">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="relative flex-1">
              {({ isActive }) => (
                <span className={cn('relative flex flex-col items-center gap-0.5 rounded-2xl py-2 text-[0.68rem] font-bold', isActive ? 'text-primary' : 'text-muted')}>
                  {isActive && (
                    <motion.span
                      layoutId="tab-active"
                      className="absolute inset-0 rounded-2xl bg-primary-soft"
                      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                    />
                  )}
                  <Icon className="relative size-5" />
                  <span className="relative">{label}</span>
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

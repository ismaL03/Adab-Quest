import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowRight, Flame, Target, Trophy } from 'lucide-react';
import { RichText } from '@/components/RichText';
import { Button } from '@/components/ui/Button';
import { Arabic, GlassCard, ProgressBar, ProgressRing } from '@/components/ui/primitives';
import { LESSONS, MODULES } from '@/data/curriculum';
import { ProgressMap, useLessonProgress } from '@/features/map/ProgressMap';
import { displayedStreak, todayXp, useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';

function greeting() {
  const h = new Date().getHours();
  if (h < 5 || h >= 18) return 'Bonsoir';
  return 'Bonjour';
}

export default function HomePage() {
  const navigate = useNavigate();
  const name = useSettings((s) => s.displayName);
  const records = useProgress((s) => s.lessons);
  const streak = useProgress((s) => displayedStreak(s.streak));
  const daily = useProgress((s) => todayXp(s.daily));
  const goal = useProgress((s) => s.dailyGoal);
  const { done, total, ratio } = useLessonProgress();

  const next = LESSONS.find((l) => !records[l.id]);
  const nextModule = next ? MODULES.find((m) => m.id === next.moduleId) : null;

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6 lg:pt-10">
      {/* En-tête */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <p className="text-sm font-semibold text-muted">
          {greeting()}
          {name ? `, ${name}` : ''}
        </p>
        <h1 className="mt-1 font-display text-[clamp(1.9rem,5vw,2.6rem)] leading-[1.1] font-semibold tracking-[-0.025em]">
          Ton chemin vers le <span className="text-primary">Mushaf</span>
        </h1>
      </motion.div>

      {/* Reprendre + objectifs */}
      <div className="grid gap-4 sm:grid-cols-[1.35fr_1fr]">
        <GlassCard strong className="relative overflow-hidden p-5 sm:p-6">
          <div className="pointer-events-none absolute -right-6 -bottom-10 opacity-[0.07]">
            <Arabic className="text-[9rem] leading-none">{next?.glyph ?? 'ٱقْرَأْ'}</Arabic>
          </div>
          {next ? (
            <>
              <p className="text-[0.7rem] font-bold tracking-[0.16em] text-primary uppercase">
                {done === 0 ? 'Commence ici' : 'Continue ta lecture'} · Étape {nextModule?.index}
              </p>
              <h2 className="mt-2 font-display text-2xl leading-tight font-semibold">{next.title}</h2>
              <p className="mt-1 text-sm text-muted">
                <RichText text={next.subtitle} />
              </p>
              <Button className="mt-5" size="lg" onClick={() => navigate(`/lecon/${next.id}`)}>
                {done === 0 ? 'Commencer la première leçon' : 'Reprendre'}
                <ArrowRight className="size-4" />
              </Button>
            </>
          ) : (
            <>
              <p className="text-[0.7rem] font-bold tracking-[0.16em] text-gold uppercase">Parcours terminé</p>
              <h2 className="mt-2 font-display text-2xl font-semibold">Mâchâ’ Allâh, tu sais lire !</h2>
              <p className="mt-1 text-sm text-muted">Poursuis ta lecture dans la Vue Mushaf, sourate après sourate.</p>
              <Button className="mt-5" size="lg" variant="gold" onClick={() => navigate('/mushaf')}>
                Ouvrir le Mushaf <ArrowRight className="size-4" />
              </Button>
            </>
          )}
        </GlassCard>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-1">
          <GlassCard className="flex items-center gap-4 p-4">
            <ProgressRing value={daily / goal} size={56} stroke={5} tone="gold">
              <Target className="size-5 text-gold" />
            </ProgressRing>
            <div>
              <p className="text-[0.68rem] font-bold tracking-[0.12em] text-muted uppercase">Objectif du jour</p>
              <p className="font-display text-xl font-semibold tabular-nums">
                {Math.min(daily, goal)}
                <span className="text-sm text-muted"> / {goal} XP</span>
              </p>
            </div>
          </GlassCard>
          <GlassCard className="flex items-center gap-4 p-4">
            <div className="grid size-14 place-items-center rounded-full bg-gold-soft">
              <Flame className={streak > 0 ? 'size-6 fill-gold text-gold' : 'size-6 text-muted'} />
            </div>
            <div>
              <p className="text-[0.68rem] font-bold tracking-[0.12em] text-muted uppercase">Série</p>
              <p className="font-display text-xl font-semibold tabular-nums">
                {streak} <span className="text-sm text-muted">{streak > 1 ? 'jours' : 'jour'}</span>
              </p>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Progression globale */}
      <GlassCard className="mt-4 flex items-center gap-4 p-4">
        <Trophy className="size-5 shrink-0 text-gold" />
        <div className="flex-1">
          <div className="mb-1.5 flex justify-between text-xs font-semibold text-muted">
            <span>Progression du parcours</span>
            <span className="tabular-nums">
              {done} / {total} leçons
            </span>
          </div>
          <ProgressBar value={ratio} tone="gold" height={8} />
        </div>
      </GlassCard>

      <div className="mt-12">
        <ProgressMap modules={MODULES} />
      </div>

      <p className="mx-auto mt-16 max-w-md text-center text-xs leading-relaxed text-muted">
        Parcours inspiré de la progression de la méthode « Ata‘allamu al-‘arabiyya » de Cheikh Ayyoub (La Madrassah) : des lettres
        isolées jusqu’à la lecture du Mushaf.
      </p>
    </div>
  );
}

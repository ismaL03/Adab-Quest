import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Award, BookCheck, Ear, Flame, Lock, Moon, Monitor, RotateCcw, Sparkles, Sun, Zap } from 'lucide-react';
import { audio } from '@/audio/engine';
import { BadgeGlyph } from '@/components/BadgeGlyph';
import { Button } from '@/components/ui/Button';
import { GlassCard, ProgressBar, Segmented, Toggle } from '@/components/ui/primitives';
import { BADGES } from '@/data/badges';
import { LESSONS } from '@/data/curriculum';
import { cn } from '@/lib/cn';
import { displayedStreak, levelFromXp, useProgress } from '@/store/progress';
import { useSettings, type ThemePreference } from '@/store/settings';

export default function ProfilePage() {
  const progress = useProgress();
  const settings = useSettings();
  const lvl = levelFromXp(progress.xp);
  const completed = LESSONS.filter((l) => progress.lessons[l.id]).length;
  const [confirmReset, setConfirmReset] = useState(false);
  const [audioFiles, setAudioFiles] = useState<number | null>(null);

  useEffect(() => {
    audio.loadManifest().then((m) => setAudioFiles(m.size));
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 pt-6 sm:px-6 lg:pt-10">
      {/* Carte d’identité */}
      <GlassCard strong className="relative overflow-hidden p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(40rem_16rem_at_100%_0%,var(--primary-soft),transparent)]" />
        <div className="relative flex flex-wrap items-center gap-5">
          <div className="grid size-20 place-items-center rounded-[1.6rem] bg-gradient-to-br from-primary to-primary-strong text-3xl font-bold text-white shadow-[0_16px_40px_-16px_var(--primary)]">
            {(settings.displayName || 'م').slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <input
              value={settings.displayName}
              onChange={(e) => settings.update({ displayName: e.target.value.slice(0, 32) })}
              placeholder="Ton prénom"
              aria-label="Ton prénom"
              className="w-full bg-transparent font-display text-2xl font-semibold outline-none placeholder:text-muted"
            />
            <p className="text-sm text-muted">
              Niveau {lvl.level} · {progress.xp} XP au total
            </p>
            <div className="mt-3 max-w-sm">
              <ProgressBar value={lvl.progress} tone="gold" height={8} />
              <p className="mt-1 text-xs text-muted tabular-nums">
                {lvl.current} / {lvl.next} XP jusqu’au niveau {lvl.level + 1}
              </p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Statistiques */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={<Flame className="size-4" />} label="Série actuelle" value={`${displayedStreak(progress.streak)} j`} sub={`Record : ${progress.streak.best} j`} />
        <Stat icon={<BookCheck className="size-4" />} label="Leçons" value={`${completed}/${LESSONS.length}`} sub={`${progress.stats.perfectLessons} sans faute`} />
        <Stat icon={<Ear className="size-4" />} label="Sons écoutés" value={String(progress.stats.soundsPlayed)} sub={`${progress.stats.mushafWords} mots du Mushaf`} />
        <Stat icon={<Zap className="size-4" />} label="Bonnes réponses" value={String(progress.stats.correctAnswers)} sub={`${progress.xp} XP`} />
      </div>

      {/* Badges */}
      <h2 className="mt-10 mb-4 flex items-center gap-2 font-display text-xl font-semibold">
        <Award className="size-5 text-gold" /> Badges
        <span className="text-sm font-normal text-muted">
          {Object.keys(progress.badges).length} / {BADGES.length}
        </span>
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {BADGES.map((b, i) => {
          const unlocked = !!progress.badges[b.id];
          return (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={cn('glass relative flex flex-col items-center rounded-3xl p-4 text-center', !unlocked && 'opacity-55')}
            >
              <div
                className={cn(
                  'relative grid size-16 place-items-center rounded-2xl',
                  unlocked
                    ? b.tone === 'gold'
                      ? 'bg-gradient-to-b from-gold-bright to-gold text-[#1d1608] shadow-[0_12px_28px_-12px_var(--gold)]'
                      : b.tone === 'emerald'
                        ? 'bg-gradient-to-b from-primary to-primary-strong text-white shadow-[0_12px_28px_-12px_var(--primary)]'
                        : 'bg-ink text-bg'
                    : 'bg-surface-sunken text-muted ring-1 ring-line',
                )}
              >
                {unlocked ? <BadgeGlyph glyph={b.glyph} /> : <Lock className="size-5" />}
              </div>
              <p className="mt-3 text-sm font-bold">{b.title}</p>
              <p className="mt-0.5 text-xs text-muted">{b.description}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Réglages */}
      <h2 className="mt-10 mb-4 flex items-center gap-2 font-display text-xl font-semibold">
        <Sparkles className="size-5 text-primary" /> Réglages
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        <GlassCard className="space-y-5 p-5">
          <Setting label="Thème">
            <Segmented<ThemePreference>
              value={settings.theme}
              onChange={(theme) => settings.update({ theme })}
              options={[
                { value: 'system', label: <Monitor className="mx-auto size-4" aria-label="Système" /> },
                { value: 'light', label: <Sun className="mx-auto size-4" aria-label="Clair" /> },
                { value: 'dark', label: <Moon className="mx-auto size-4" aria-label="Sombre" /> },
              ]}
            />
          </Setting>
          <Setting label="Vitesse de l’audio">
            <Segmented<number>
              value={settings.playbackRate}
              onChange={(playbackRate) => settings.update({ playbackRate })}
              options={[
                { value: 0.75, label: '0,75×' },
                { value: 1, label: '1×' },
                { value: 1.25, label: '1,25×' },
              ]}
            />
          </Setting>
          <Setting label="Objectif quotidien">
            <Segmented<number>
              value={progress.dailyGoal}
              onChange={(g) => progress.setDailyGoal(g)}
              options={[
                { value: 30, label: '30 XP' },
                { value: 50, label: '50 XP' },
                { value: 100, label: '100 XP' },
              ]}
            />
          </Setting>
        </GlassCard>
        <GlassCard className="divide-y divide-line px-5 py-2">
          <Toggle label="Translittération" description="Affiche « ba », « bi »… sous l’arabe." checked={settings.transliteration} onChange={(v) => settings.update({ transliteration: v })} />
          <Toggle label="Lecture automatique" description="Joue le son au début de chaque exercice." checked={settings.autoplay} onChange={(v) => settings.update({ autoplay: v })} />
          <Toggle label="Effets sonores" checked={settings.sfx} onChange={(v) => settings.update({ sfx: v })} />
          <Toggle label="Couleurs du Tajweed" checked={settings.tajweedColors} onChange={(v) => settings.update({ tajweedColors: v })} />
          <Toggle label="Afficher l’emphase (tafkhîm)" description="Colore aussi les lettres épaisses en bleu." checked={settings.showTafkhim} onChange={(v) => settings.update({ showTafkhim: v })} />
        </GlassCard>
        <GlassCard className="divide-y divide-line px-5 py-2 md:col-span-2">
          <Toggle
            label="Audio mot-à-mot du Coran en ligne"
            description="Si le fichier local manque, utilise la récitation mot-à-mot de Quran.com."
            checked={settings.remoteQuranAudio}
            onChange={(v) => settings.update({ remoteQuranAudio: v })}
          />
          <Toggle
            label="Synthèse vocale de secours"
            description="Si aucun enregistrement n’est disponible, la voix arabe du navigateur lit l’élément."
            checked={settings.ttsFallback}
            onChange={(v) => settings.update({ ttsFallback: v })}
          />
          <p className="py-3 text-sm text-muted">
            Fichiers audio installés : <span className="font-semibold text-ink tabular-nums">{audioFiles ?? '…'}</span> — ajoutez vos enregistrements dans{' '}
            <code className="rounded bg-surface-sunken px-1 py-0.5 text-xs">public/audio/</code> puis lancez{' '}
            <code className="rounded bg-surface-sunken px-1 py-0.5 text-xs">npm run audio:manifest</code>.
          </p>
        </GlassCard>
      </div>

      <GlassCard className="mt-4 flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <p className="font-semibold">Réinitialiser la progression</p>
          <p className="text-sm text-muted">Efface leçons, XP, séries et badges sur cet appareil.</p>
        </div>
        {confirmReset ? (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setConfirmReset(false)}>
              Annuler
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                progress.reset();
                setConfirmReset(false);
              }}
            >
              Confirmer
            </Button>
          </div>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => setConfirmReset(true)}>
            <RotateCcw className="size-4" /> Réinitialiser
          </Button>
        )}
      </GlassCard>

      <p className="mt-10 text-center text-xs leading-relaxed text-muted">
        Police coranique : KFGQPC HAFS Uthmanic Script © Complexe du Roi Fahd (distribution gratuite).
        <br />
        Texte et annotations Tajweed : Quran.com (texte uthmani Hafs), via « react-native-quran-tajweed » (licence MIT).
      </p>
    </div>
  );
}

function Stat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <GlassCard className="p-4">
      <p className="flex items-center gap-1.5 text-[0.68rem] font-bold tracking-[0.1em] text-muted uppercase">
        <span className="text-primary">{icon}</span>
        {label}
      </p>
      <p className="mt-1.5 font-display text-2xl font-semibold tabular-nums">{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </GlassCard>
  );
}

function Setting({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-[0.95rem] font-semibold">{label}</p>
      {children}
    </div>
  );
}

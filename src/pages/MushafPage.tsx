import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Highlighter, Minus, Palette, Plus, Search, Volume2, X } from 'lucide-react';
import { useAudioState, type AudioSource } from '@/audio/engine';
import { sounds } from '@/audio/sounds';
import { LETTER_FONT, playSound } from '@/components/SoundTile';
import { Button } from '@/components/ui/Button';
import { Arabic, GlassCard, Segmented, Toggle } from '@/components/ui/primitives';
import { LETTERS } from '@/data/letters';
import type { QuranWord } from '@/data/quran/loader';
import { getSurahMeta, SURAHS } from '@/data/quran/surahMeta';
import type { HighlightSpec } from '@/features/mushaf/highlight';
import { MushafView } from '@/features/mushaf/MushafView';
import { RULE_INFO, TAJWEED_RULES, type TajweedRule } from '@/features/mushaf/tajweed';
import { rulesIn, TajweedLegend } from '@/features/mushaf/TajweedLegend';
import { useSurah } from '@/features/mushaf/useSurah';
import { MARKS } from '@/lib/arabic';
import { cn } from '@/lib/cn';
import { useSettings } from '@/store/settings';

const PAGE_SIZE = 12;

/** Origine du son entendu, affichée sous le mot. */
const SOURCE_LABEL: Record<AudioSource, string> = {
  remote: 'Récitation mot à mot (Quran.com)',
  file: 'Enregistrement',
  silent: 'Récitation indisponible hors connexion',
};

export const MARK_OPTIONS: { key: string; label: string; ar: string; marks: string[] }[] = [
  { key: 'fatha', label: 'Fatha', ar: 'ـَ', marks: [MARKS.fatha] },
  { key: 'kasra', label: 'Kasra', ar: 'ـِ', marks: [MARKS.kasra] },
  { key: 'damma', label: 'Damma', ar: 'ـُ', marks: [MARKS.damma] },
  { key: 'sukun', label: 'Soukoun', ar: 'ـْ', marks: [MARKS.sukun] },
  { key: 'shadda', label: 'Chadda', ar: 'ـّ', marks: [MARKS.shadda] },
  { key: 'tanwin', label: 'Tanwîn', ar: 'ـٌ', marks: [MARKS.tanwinFath, MARKS.tanwinKasr, MARKS.tanwinDamm] },
  { key: 'suscrit', label: 'Alif suscrit', ar: 'ـٰ', marks: [MARKS.daggerAlif, MARKS.smallWaw, MARKS.smallYa] },
];

const HIGHLIGHT_RULES = TAJWEED_RULES.filter((r) => r !== 'tarqiq');

/** Lit le paramètre de mise en évidence dans l’URL : ?l=ب&m=sukun&r=qalaqah */
function specFromParams(params: URLSearchParams): HighlightSpec | null {
  const letters = params.get('l')?.split(',').filter(Boolean) ?? [];
  const markKeys = params.get('m')?.split(',').filter(Boolean) ?? [];
  const rules = (params.get('r')?.split(',').filter((r) => (TAJWEED_RULES as readonly string[]).includes(r)) ?? []) as TajweedRule[];
  const marks = markKeys.flatMap((k) => MARK_OPTIONS.find((o) => o.key === k)?.marks ?? []);
  if (!letters.length && !marks.length && !rules.length) return null;
  const label = [
    ...letters.map((l) => `la lettre ${l}`),
    ...markKeys.map((k) => MARK_OPTIONS.find((o) => o.key === k)?.label ?? k),
    ...rules.map((r) => RULE_INFO[r].label),
  ].join(', ');
  return { letters, marks, rules, label };
}

export default function MushafPage() {
  const [params, setParams] = useSearchParams();
  const settings = useSettings();
  const surah = Math.min(114, Math.max(1, Number(params.get('s')) || 1));
  const meta = getSurahMeta(surah);
  const pages = Math.ceil(meta.ayahs / PAGE_SIZE);
  const page = Math.min(pages - 1, Math.max(0, Number(params.get('p')) || 0));
  const from = page * PAGE_SIZE + 1;
  const to = Math.min(meta.ayahs, from + PAGE_SIZE - 1);
  const highlight = useMemo(() => specFromParams(params), [params]);
  const { verses } = useSurah(surah);
  const shownRules = useMemo(() => rulesIn(verses?.filter((v) => v.ayah >= from && v.ayah <= to) ?? null), [verses, from, to]);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [highlightOpen, setHighlightOpen] = useState(!!highlight);
  const [fontScale, setFontScale] = useState(1);
  const [lastWord, setLastWord] = useState<QuranWord | null>(null);
  const lastSource = useAudioState((s) => s.lastSource);

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '') next.delete(k);
      else next.set(k, v);
    }
    setParams(next, { replace: true });
  };

  const toggleParam = (key: 'l' | 'm' | 'r', value: string) => {
    const current = params.get(key)?.split(',').filter(Boolean) ?? [];
    const nextValues = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    update({ [key]: nextValues.join(',') || null });
  };

  const activeRule = (params.get('r')?.split(',') ?? []).length === 1 ? (params.get('r') as TajweedRule) : null;

  return (
    <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6 lg:pt-10">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.7rem] font-bold tracking-[0.16em] text-primary uppercase">Vue Mushaf</p>
          <h1 className="mt-1 font-display text-[clamp(1.8rem,4.5vw,2.4rem)] leading-tight font-semibold tracking-[-0.02em]">
            Lis le Coran, mot à mot
          </h1>
          <p className="mt-1 text-sm text-muted">Touche un mot pour entendre sa prononciation exacte.</p>
        </div>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="glass flex items-center gap-3 rounded-2xl py-2 pr-3 pl-4 text-left transition-colors hover:bg-surface-strong"
        >
          <span>
            <span className="block text-xs font-semibold text-muted">Sourate {surah}</span>
            <span className="block font-semibold">{meta.name}</span>
          </span>
          <Arabic className="text-2xl leading-[1.5]">{meta.ar}</Arabic>
          <Search className="size-4 text-muted" />
        </button>
      </div>

      {/* Barre d’outils */}
      <GlassCard className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-3 p-3 sm:px-5">
        <div className="min-w-56 flex-1">
          <Toggle
            checked={settings.tajweedColors}
            onChange={(v) => settings.update({ tajweedColors: v })}
            label="Couleurs du Tajweed"
          />
        </div>
        <Button variant={highlightOpen || highlight ? 'primary' : 'secondary'} size="sm" onClick={() => setHighlightOpen((o) => !o)}>
          <Highlighter className="size-4" /> Mettre en évidence
        </Button>
        <div className="flex items-center gap-1 rounded-xl bg-surface-sunken p-1 ring-1 ring-line">
          <button type="button" className="grid size-8 place-items-center rounded-lg hover:bg-surface-strong" onClick={() => setFontScale((f) => Math.max(0.8, +(f - 0.1).toFixed(2)))} aria-label="Réduire le texte">
            <Minus className="size-4" />
          </button>
          <span className="w-12 text-center text-xs font-bold tabular-nums">{Math.round(fontScale * 100)}%</span>
          <button type="button" className="grid size-8 place-items-center rounded-lg hover:bg-surface-strong" onClick={() => setFontScale((f) => Math.min(1.5, +(f + 0.1).toFixed(2)))} aria-label="Agrandir le texte">
            <Plus className="size-4" />
          </button>
        </div>
      </GlassCard>

      <AnimatePresence initial={false}>
        {highlightOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <HighlightPanel params={params} onToggle={toggleParam} onClear={() => update({ l: null, m: null, r: null })} />
          </motion.div>
        )}
      </AnimatePresence>

      {highlight && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted">Mis en évidence :</span>
          <span className="rounded-full bg-[color-mix(in_oklab,var(--highlight)_22%,transparent)] px-3 py-1 font-semibold text-ink">
            {highlight.label}
          </span>
          <button type="button" onClick={() => update({ l: null, m: null, r: null })} className="flex items-center gap-1 text-muted hover:text-ink">
            <X className="size-3.5" /> Effacer
          </button>
        </div>
      )}

      <MushafView
        surah={surah}
        from={from}
        to={to}
        highlight={highlight}
        dimOthers={!!highlight}
        fontScale={fontScale}
        showBanner={page === 0}
        onWordPress={(w) => setLastWord(w)}
      />

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between gap-3">
          <Button variant="secondary" size="sm" disabled={page >= pages - 1} onClick={() => update({ p: String(page + 1) })}>
            <ChevronLeft className="size-4" /> Suivant
          </Button>
          <span className="text-sm font-semibold text-muted tabular-nums">
            Versets {from}–{to} · page {page + 1}/{pages}
          </span>
          <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => update({ p: page - 1 ? String(page - 1) : null })}>
            Précédent <ChevronRight className="size-4" />
          </Button>
        </div>
      )}

      {settings.tajweedColors && shownRules.length > 0 && (
        <GlassCard className="mt-6 p-4 sm:p-5">
          <p className="mb-3 flex items-center gap-2 text-sm font-bold">
            <Palette className="size-4 text-primary" /> Légende du Tajweed
            <span className="font-normal text-muted">— touche une règle pour la mettre en évidence</span>
          </p>
          <TajweedLegend rules={shownRules} active={activeRule} onSelect={(r) => update({ r, l: null, m: null })} />
        </GlassCard>
      )}

      <AnimatePresence>
        {lastWord && (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="glass-strong fixed inset-x-4 bottom-24 z-30 mx-auto flex max-w-md items-center gap-4 rounded-2xl p-3 pl-4 lg:bottom-6"
          >
            <button
              type="button"
              onClick={() => void playSound(sounds.quranWord(lastWord.surah, lastWord.ayah, lastWord.position, lastWord.text), lastWord.key)}
              className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-on-primary"
              aria-label="Réécouter le mot"
            >
              <Volume2 className="size-5" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-muted">
                {getSurahMeta(lastWord.surah).name} · verset {lastWord.ayah} · mot {lastWord.position}
              </p>
              <p className="text-[0.7rem] text-muted">{SOURCE_LABEL[lastSource ?? 'remote']}</p>
            </div>
            <Arabic className="text-3xl leading-[1.7]">{lastWord.text}</Arabic>
            <button type="button" onClick={() => setLastWord(null)} className="grid size-8 place-items-center rounded-full text-muted hover:bg-surface-sunken" aria-label="Fermer">
              <X className="size-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <SurahPicker
        open={pickerOpen}
        current={surah}
        onClose={() => setPickerOpen(false)}
        onPick={(n) => {
          update({ s: String(n), p: null });
          setPickerOpen(false);
          setLastWord(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
}

function HighlightPanel({
  params,
  onToggle,
  onClear,
}: {
  params: URLSearchParams;
  onToggle: (key: 'l' | 'm' | 'r', value: string) => void;
  onClear: () => void;
}) {
  const [tab, setTab] = useState<'l' | 'm' | 'r'>('l');
  const selected = (key: string) => params.get(key)?.split(',') ?? [];
  return (
    <GlassCard className="mb-4 p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'l', label: 'Lettres' },
            { value: 'm', label: 'Signes' },
            { value: 'r', label: 'Règles' },
          ]}
        />
        <button type="button" onClick={onClear} className="text-sm font-semibold text-muted hover:text-ink">
          Tout effacer
        </button>
      </div>
      {tab === 'l' && (
        <div dir="rtl" className="grid grid-cols-7 gap-2 sm:grid-cols-10">
          {[...LETTERS, { id: 'hamza', char: 'ء', name: 'Hamza' }].map((l) => {
            const on = selected('l').includes(l.char);
            return (
              <button
                key={l.id}
                type="button"
                title={l.name}
                style={l.char === 'ي' ? LETTER_FONT : undefined}
                onClick={() => onToggle('l', l.char)}
                className={cn(
                  'font-quran grid h-12 place-items-center rounded-xl text-2xl transition-colors',
                  on ? 'bg-highlight text-[#1d1608] shadow-[var(--shadow-glow)]' : 'bg-surface-sunken ring-1 ring-line hover:bg-surface-strong',
                )}
              >
                {l.char}
              </button>
            );
          })}
        </div>
      )}
      {tab === 'm' && (
        <div className="flex flex-wrap gap-2">
          {MARK_OPTIONS.map((o) => {
            const on = selected('m').includes(o.key);
            return (
              <button
                key={o.key}
                type="button"
                onClick={() => onToggle('m', o.key)}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-semibold transition-colors',
                  on ? 'bg-highlight text-[#1d1608]' : 'bg-surface-sunken ring-1 ring-line hover:bg-surface-strong',
                )}
              >
                <span className="font-quran text-2xl leading-[1.4]">{o.ar}</span>
                {o.label}
              </button>
            );
          })}
        </div>
      )}
      {tab === 'r' && (
        <div className="flex flex-wrap gap-2">
          {HIGHLIGHT_RULES.map((r) => {
            const on = selected('r').includes(r);
            const info = RULE_INFO[r];
            return (
              <button
                key={r}
                type="button"
                onClick={() => onToggle('r', r)}
                title={info.description}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors',
                  on ? 'bg-highlight text-[#1d1608]' : 'bg-surface-sunken ring-1 ring-line hover:bg-surface-strong',
                )}
              >
                <span className="size-2.5 rounded-full" style={{ background: info.color ?? 'var(--muted)' }} />
                {info.label}
              </button>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}

function SurahPicker({ open, current, onClose, onPick }: { open: boolean; current: number; onClose: () => void; onPick: (n: number) => void }) {
  const [query, setQuery] = useState('');
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SURAHS;
    return SURAHS.filter(
      (s) => String(s.number) === q || s.name.toLowerCase().includes(q) || s.fr.toLowerCase().includes(q) || s.ar.includes(query.trim()),
    );
  }, [query]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Choisir une sourate"
            initial={{ y: 60 }}
            animate={{ y: 0 }}
            exit={{ y: 60 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong flex max-h-[85dvh] w-full max-w-lg flex-col rounded-t-[2rem] p-4 sm:rounded-[2rem]"
          >
            <div className="flex items-center gap-2 rounded-2xl bg-surface-sunken px-3 ring-1 ring-line">
              <Search className="size-4 text-muted" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher (numéro, nom, sens…)"
                className="h-11 flex-1 bg-transparent text-[0.95rem] outline-none placeholder:text-muted"
              />
              <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-full text-muted hover:bg-surface-strong" aria-label="Fermer">
                <X className="size-4" />
              </button>
            </div>
            <div className="scrollbar-none mt-3 flex-1 overflow-y-auto">
              {list.map((s) => (
                <button
                  key={s.number}
                  type="button"
                  onClick={() => onPick(s.number)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-surface-sunken',
                    s.number === current && 'bg-primary-soft',
                  )}
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-sunken text-xs font-bold tabular-nums ring-1 ring-line">
                    {s.number}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{s.name}</span>
                    <span className="block truncate text-xs text-muted">
                      {s.fr} · {s.ayahs} versets · {s.revelation}
                    </span>
                  </span>
                  <Arabic className="text-xl leading-[1.6]">{s.ar}</Arabic>
                </button>
              ))}
              {list.length === 0 && <p className="py-8 text-center text-sm text-muted">Aucune sourate trouvée.</p>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

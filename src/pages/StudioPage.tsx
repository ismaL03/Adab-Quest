import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { strToU8, unzipSync, zipSync } from 'fflate';
import { ChevronLeft, ChevronRight, Download, Mic, Play, Square, Trash2, Upload } from 'lucide-react';
import { audio } from '@/audio/engine';
import { expectedAudio, type ExpectedSound } from '@/audio/expected';
import { deleteRecording, listRecordings, pickRecordingFormat, saveRecording, stemOf, type StudioRecording } from '@/audio/studio';
import { Button } from '@/components/ui/Button';
import { Eyebrow, GlassCard, ProgressBar, Segmented, Toggle } from '@/components/ui/primitives';
import { cn } from '@/lib/cn';

/* ──────────────────────────────────────────────────────────────────────────
   Catégories : ce qu’il faut prononcer
   ────────────────────────────────────────────────────────────────────────── */

type Category = 'letters' | 'madd' | 'sukun' | 'tanwin' | 'shadda' | 'syllables' | 'words';

const CATEGORIES: Record<Category, { label: string; hint: string }> = {
  letters: { label: 'Lettres', hint: 'Dis le nom de la lettre.' },
  madd: { label: 'Voyelles longues', hint: 'Allonge bien la voyelle sur deux temps.' },
  sukun: { label: 'Soukoun', hint: 'Lis la syllabe fermée, sans ajouter de voyelle à la fin.' },
  tanwin: { label: 'Tanwîn', hint: 'Fais bien entendre le « n » final.' },
  shadda: { label: 'Chadda', hint: 'Appuie sur la lettre doublée.' },
  syllables: { label: 'Syllabes', hint: 'Lis la syllabe telle qu’elle est écrite.' },
  words: { label: 'Mots', hint: 'Lis le mot entier, d’une voix posée, avec toutes ses voyelles.' },
};

function categoryOf(src: string): Category {
  if (src.startsWith('letters/')) return 'letters';
  if (src.startsWith('words/')) return 'words';
  const key = src.split('/')[1] ?? '';
  if (key.includes('shadda')) return 'shadda';
  if (key.includes('tanwin')) return 'tanwin';
  if (key.includes('sukun')) return 'sukun';
  if (/_(alif|waw|ya)-plain/.test(key) || key.includes('dagger') || key.includes('u6e5') || key.includes('u6e6')) return 'madd';
  return 'syllables';
}

/* ──────────────────────────────────────────────────────────────────────────
   Audio : silences coupés, export WAV (lisible partout)
   ────────────────────────────────────────────────────────────────────────── */

async function trimToWav(blob: Blob): Promise<Blob | null> {
  try {
    const ctx = new OfflineAudioContext(1, 1, 44100);
    const buf = await ctx.decodeAudioData(await blob.arrayBuffer());
    const data = buf.getChannelData(0);
    const rate = buf.sampleRate;
    let peak = 0;
    for (const v of data) peak = Math.max(peak, Math.abs(v));
    if (peak < 0.01) return null; // rien n’a été dit
    const threshold = peak * 0.06;
    const win = Math.round(rate * 0.01);
    const loud = (i: number) => {
      let sum = 0;
      for (let j = i; j < Math.min(i + win, data.length); j++) sum += Math.abs(data[j]);
      return sum / win > threshold * 0.5;
    };
    let start = 0;
    while (start < data.length && !loud(start)) start += win;
    let end = data.length - win;
    while (end > start && !loud(end)) end -= win;
    start = Math.max(0, start - Math.round(rate * 0.05));
    end = Math.min(data.length, end + win + Math.round(rate * 0.12));
    // Normalisation douce du volume.
    const gain = Math.min(4, 0.9 / peak);
    const pcm = new Int16Array(end - start);
    for (let i = 0; i < pcm.length; i++) pcm[i] = Math.max(-1, Math.min(1, data[start + i] * gain)) * 0x7fff;
    const header = new DataView(new ArrayBuffer(44));
    const w = (o: number, s: string) => [...s].forEach((c, i) => header.setUint8(o + i, c.charCodeAt(0)));
    w(0, 'RIFF');
    header.setUint32(4, 36 + pcm.byteLength, true);
    w(8, 'WAVE');
    w(12, 'fmt ');
    header.setUint32(16, 16, true);
    header.setUint16(20, 1, true);
    header.setUint16(22, 1, true);
    header.setUint32(24, rate, true);
    header.setUint32(28, rate * 2, true);
    header.setUint16(32, 2, true);
    header.setUint16(34, 16, true);
    w(36, 'data');
    header.setUint32(40, pcm.byteLength, true);
    return new Blob([header, pcm], { type: 'audio/wav' });
  } catch {
    return blob; // format non décodable ici : on garde l’original
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   Page
   ────────────────────────────────────────────────────────────────────────── */

type Filter = 'todo' | 'all';
type MicState = 'idle' | 'asking' | 'recording' | 'denied' | 'unsupported';

interface Entry extends ExpectedSound {
  category: Category;
  stem: string;
}

export default function StudioPage() {
  const [params] = useSearchParams();
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [recs, setRecs] = useState<Map<string, StudioRecording>>(new Map());
  const [filter, setFilter] = useState<Filter>('todo');
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [current, setCurrent] = useState<string | null>(params.get('src') ? stemOf(params.get('src')!) : null);
  const [chain, setChain] = useState(true);
  const [mic, setMic] = useState<MicState>('idle');
  const [level, setLevel] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const stopTimer = useRef<number | undefined>(undefined);
  const levelRaf = useRef<number | undefined>(undefined);

  const refreshRecs = useCallback(async () => {
    const list = await listRecordings();
    setRecs(new Map(list.map((r) => [r.stem, r])));
    await audio.reloadStudio();
  }, []);

  // Sons à enregistrer : ni enregistrement fourni avec le site, ni récitation du Coran.
  useEffect(() => {
    let alive = true;
    (async () => {
      await audio.loadManifest();
      const all = expectedAudio()
        .filter((e) => !e.remote && !audio.resolveFile(e.src))
        .map((e) => ({ ...e, category: categoryOf(e.src), stem: stemOf(e.src) }));
      const order: Category[] = ['letters', 'syllables', 'madd', 'sukun', 'tanwin', 'shadda', 'words'];
      all.sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category) || a.src.localeCompare(b.src));
      if (alive) setEntries(all);
      await refreshRecs();
    })();
    return () => {
      alive = false;
    };
  }, [refreshRecs]);

  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      cancelAnimationFrame(levelRaf.current!);
      clearTimeout(stopTimer.current);
    },
    [],
  );

  const visible = useMemo(
    () =>
      (entries ?? []).filter(
        (e) => (category === 'all' || e.category === category) && (filter === 'all' || !recs.has(e.stem) || e.stem === current),
      ),
    [entries, category, filter, recs, current],
  );
  const entry = visible.find((e) => e.stem === current) ?? visible[0] ?? null;
  const index = entry ? visible.indexOf(entry) : -1;
  const done = (entries ?? []).filter((e) => recs.has(e.stem)).length;
  const total = entries?.length ?? 0;

  const go = useCallback(
    (delta: number) => {
      if (!entry) return;
      const next = visible[index + delta];
      if (next) setCurrent(next.stem);
    },
    [entry, index, visible],
  );

  const playOwn = useCallback(
    (e: Entry) => audio.play({ id: `studio:${e.stem}`, src: e.src, text: e.text }, `studio:${e.stem}`),
    [],
  );

  const getStream = useCallback(async () => {
    if (streamRef.current) return streamRef.current;
    if (!navigator.mediaDevices?.getUserMedia || !pickRecordingFormat()) {
      setMic('unsupported');
      return null;
    }
    setMic('asking');
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      setMic('idle');
      return streamRef.current;
    } catch {
      setMic('denied');
      return null;
    }
  }, []);

  const stop = useCallback(() => {
    clearTimeout(stopTimer.current);
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  }, []);

  const record = useCallback(async () => {
    if (!entry) return;
    if (recorderRef.current?.state === 'recording') return stop();
    const stream = await getStream();
    if (!stream) return;
    audio.stop();
    const format = pickRecordingFormat()!;
    const recorder = new MediaRecorder(stream, format.mimeType ? { mimeType: format.mimeType } : undefined);
    const chunks: Blob[] = [];
    const target = entry;
    recorder.ondataavailable = (ev) => ev.data.size && chunks.push(ev.data);
    recorder.onstop = async () => {
      cancelAnimationFrame(levelRaf.current!);
      setLevel(0);
      setMic('idle');
      const raw = new Blob(chunks, { type: recorder.mimeType || format.mimeType });
      const trimmed = await trimToWav(raw);
      if (!trimmed) {
        setMessage('Aucun son détecté : rapproche-toi du micro et recommence.');
        return;
      }
      setMessage(null);
      const ext = trimmed.type === 'audio/wav' ? 'wav' : format.ext;
      await saveRecording({ stem: target.stem, blob: trimmed, ext, savedAt: Date.now() });
      await refreshRecs();
      await playOwn(target);
      if (chain) {
        const next = visible[visible.indexOf(target) + 1];
        if (next) setCurrent(next.stem);
      } else setCurrent(target.stem);
    };
    recorderRef.current = recorder;
    recorder.start();
    setMic('recording');
    // Vu-mètre
    try {
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const buf = new Uint8Array(analyser.fftSize);
      const tick = () => {
        analyser.getByteTimeDomainData(buf);
        let max = 0;
        for (const v of buf) max = Math.max(max, Math.abs(v - 128));
        setLevel(max / 128);
        if (recorder.state === 'recording') levelRaf.current = requestAnimationFrame(tick);
        else void ctx.close();
      };
      tick();
    } catch {
      /* vu-mètre facultatif */
    }
    stopTimer.current = window.setTimeout(stop, 6000);
  }, [chain, entry, getStream, playOwn, refreshRecs, stop, visible]);

  // Raccourcis : Espace = enregistrer / arrêter, flèches = précédent / suivant.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        void record();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') go(1);
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, record]);

  const remove = async (e: Entry) => {
    await deleteRecording(e.stem);
    await refreshRecs();
  };

  const exportZip = async () => {
    const files: Record<string, Uint8Array> = {
      'LISEZ-MOI.txt': strToU8(
        'Enregistrements du Studio Iqra.\nDéposez le contenu de ce dossier dans public/audio du projet (en conservant les sous-dossiers), puis lancez « npm run audio:import -- <ce fichier .zip> » ou « npm run audio:manifest ».\n',
      ),
    };
    for (const r of recs.values()) files[`${r.stem}.${r.ext}`] = new Uint8Array(await r.blob.arrayBuffer());
    const zip = zipSync(files, { level: 0 });
    const url = URL.createObjectURL(new Blob([zip as Uint8Array<ArrayBuffer>], { type: 'application/zip' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `iqra-enregistrements-${new Date().toISOString().slice(0, 10)}.zip`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const importZip = async (file: File) => {
    try {
      const files = unzipSync(new Uint8Array(await file.arrayBuffer()));
      const known = new Set((entries ?? []).map((e) => e.stem));
      let n = 0;
      for (const [path, data] of Object.entries(files)) {
        const m = path.match(/^(?:.*?\/)?((?:letters|syllables|words)\/[^/]+)\.(wav|webm|m4a|mp3|ogg|opus|aac)$/i);
        if (!m || !known.has(m[1])) continue;
        const type = { wav: 'audio/wav', webm: 'audio/webm', m4a: 'audio/mp4', mp3: 'audio/mpeg', ogg: 'audio/ogg', opus: 'audio/ogg', aac: 'audio/aac' }[m[2].toLowerCase()]!;
        await saveRecording({ stem: m[1], blob: new Blob([data.slice() as Uint8Array<ArrayBuffer>], { type }), ext: m[2].toLowerCase(), savedAt: Date.now() });
        n++;
      }
      await refreshRecs();
      setMessage(`${n} enregistrement(s) importé(s).`);
    } catch {
      setMessage('Ce fichier n’est pas un export du Studio.');
    }
  };

  const recording = mic === 'recording';

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 pb-16 sm:px-6 lg:pt-10">
      <Eyebrow>Studio d’enregistrement</Eyebrow>
      <h1 className="mt-1 font-display text-3xl font-semibold text-balance">Donne ta voix aux sons muets</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">
        Ces sons n’ont pas encore de voix humaine. Enregistre-les ici (ou fais-les enregistrer par un enseignant) : ils sont
        joués <strong className="font-semibold text-ink">tout de suite sur cet appareil</strong>. Exporte-les ensuite pour
        qu’ils soient ajoutés au site, pour tout le monde. Les apprenants, eux, n’ont jamais besoin du micro.
      </p>

      <GlassCard className="mt-5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold">
            <span className="tabular-nums">{done}</span> / <span className="tabular-nums">{total}</span> sons enregistrés
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={exportZip} disabled={!recs.size}>
              <Download className="size-4" /> Exporter (.zip)
            </Button>
            <label className="glass inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl px-3.5 text-sm font-semibold text-ink hover:bg-surface-strong">
              <Upload className="size-4" /> Importer
              <input type="file" accept=".zip,application/zip" className="sr-only" onChange={(e) => e.target.files?.[0] && importZip(e.target.files[0])} />
            </label>
          </div>
        </div>
        <ProgressBar value={total ? done / total : 0} className="mt-3" height={8} />
      </GlassCard>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Segmented<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'todo', label: 'À faire' },
            { value: 'all', label: 'Tous' },
          ]}
        />
        <div className="flex flex-wrap gap-1.5">
          {(['all', ...Object.keys(CATEGORIES)] as (Category | 'all')[]).map((c) => {
            const count = (entries ?? []).filter((e) => c === 'all' || e.category === c).length;
            if (!count) return null;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={cn(
                  'rounded-full px-3 py-1 text-sm font-semibold ring-1 transition-colors',
                  category === c ? 'bg-primary text-on-primary ring-primary' : 'text-ink-soft ring-line hover:text-ink',
                )}
              >
                {c === 'all' ? 'Tout' : CATEGORIES[c].label} <span className="opacity-70 tabular-nums">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Carte guidée */}
      {entries === null ? (
        <GlassCard className="mt-5 h-72 animate-pulse" />
      ) : !entry ? (
        <GlassCard strong className="mt-5 p-8 text-center">
          <p className="font-display text-xl font-semibold">Tout est enregistré ici ✦</p>
          <p className="mt-2 text-ink-soft">Exporte le fichier .zip pour que ces voix soient ajoutées au site.</p>
        </GlassCard>
      ) : (
        <GlassCard strong className="relative mt-5 overflow-hidden p-6 text-center">
          <p className="text-xs font-bold tracking-[0.14em] text-muted uppercase">
            {CATEGORIES[entry.category].label} · {index + 1} / {visible.length}
          </p>
          <AnimatePresence mode="wait">
            <motion.div key={entry.stem} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <p dir="rtl" lang="ar" className="font-quran mt-4 text-[clamp(3rem,12vw,5.5rem)] leading-[1.5] text-ink">
                {entry.text}
              </p>
              {(entry.label || entry.meaning) && (
                <p className="text-lg text-ink-soft">
                  {entry.label && <span className="font-semibold">« {entry.label} »</span>}
                  {entry.meaning && <span className="text-muted"> · {entry.meaning}</span>}
                </p>
              )}
              <p className="mt-2 text-sm text-muted">{CATEGORIES[entry.category].hint}</p>
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex items-center justify-center gap-3">
            <Button variant="ghost" size="md" onClick={() => go(-1)} disabled={index <= 0} aria-label="Précédent">
              <ChevronLeft className="size-5" />
            </Button>
            <motion.button
              type="button"
              onClick={() => void record()}
              whileTap={{ scale: 0.94 }}
              aria-label={recording ? 'Arrêter' : 'Enregistrer'}
              className={cn(
                'relative grid size-20 place-items-center rounded-full text-white shadow-[0_16px_40px_-16px_var(--danger)]',
                recording ? 'bg-danger' : 'bg-gradient-to-b from-danger to-[color-mix(in_oklab,var(--danger)_80%,black)]',
              )}
            >
              {recording && (
                <motion.span
                  className="absolute inset-0 rounded-full ring-4 ring-danger/40"
                  animate={{ scale: 1 + level * 0.6 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                />
              )}
              {recording ? <Square className="size-7 fill-current" /> : <Mic className="size-8" />}
            </motion.button>
            <Button variant="ghost" size="md" onClick={() => go(1)} disabled={index >= visible.length - 1} aria-label="Suivant">
              <ChevronRight className="size-5" />
            </Button>
          </div>
          <p className="mt-3 h-5 text-sm text-muted">
            {mic === 'asking'
              ? 'Autorise l’accès au micro…'
              : mic === 'denied'
                ? 'Accès au micro refusé : autorise-le dans les réglages du navigateur.'
                : mic === 'unsupported'
                  ? 'Ce navigateur ne permet pas d’enregistrer.'
                  : recording
                    ? 'Parle maintenant… touche à nouveau pour arrêter.'
                    : (message ?? 'Touche le micro (ou Espace), prononce, puis touche à nouveau.')}
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {recs.has(entry.stem) && (
              <>
                <Button variant="secondary" size="sm" onClick={() => playOwn(entry)}>
                  <Play className="size-4" /> Réécouter
                </Button>
                <Button variant="ghost" size="sm" onClick={() => remove(entry)}>
                  <Trash2 className="size-4" /> Effacer
                </Button>
              </>
            )}
          </div>
          <div className="mx-auto mt-3 max-w-xs">
            <Toggle checked={chain} onChange={setChain} label="Enchaîner" description="Passer au son suivant après chaque enregistrement" />
          </div>
        </GlassCard>
      )}

      {/* Liste */}
      {entries && visible.length > 0 && (
        <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {visible.slice(Math.max(0, index - 5), Math.max(0, index - 5) + 30).map((e) => (
            <button
              key={e.stem}
              type="button"
              onClick={() => setCurrent(e.stem)}
              className={cn(
                'glass relative rounded-2xl px-2 py-2.5 text-center transition-colors',
                e.stem === entry?.stem && 'ring-2 ring-primary',
                recs.has(e.stem) && 'bg-success-soft',
              )}
            >
              <span dir="rtl" lang="ar" className="font-quran block truncate text-2xl leading-[1.6]">
                {e.text}
              </span>
              {recs.has(e.stem) && <span className="absolute top-1.5 right-2 text-xs text-success">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

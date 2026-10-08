import { create } from 'zustand';
import { useSettings } from '@/store/settings';
import { getAudioContext, unlockAudio } from './context';
import { AUDIO_BASE_URL, type Sound } from './sounds';
import { toSpeechText } from './speechText';

export type AudioSource = 'file' | 'pack' | 'remote' | 'speech' | 'silent';

/** État observable de la lecture (pour synchroniser les animations). */
interface AudioState {
  playingId: string | null;
  /** Source utilisée pour le son en cours. */
  source: AudioSource | null;
  /** Source du dernier son joué (conservée après la fin de la lecture). */
  lastSource: AudioSource | null;
  /** Avertissement affiché une seule fois : aucun son disponible pour un élément. */
  missingNotice: { kind: 'file' | 'voice'; src: string } | null;
}

export const useAudioState = create<AudioState>(() => ({
  playingId: null,
  source: null,
  lastSource: null,
  missingNotice: null,
}));

export function useIsPlaying(id: string | undefined): boolean {
  return useAudioState((s) => !!id && s.playingId === id);
}

/** Index des paquets audio intégrés (public/audio/packs/index.json). */
interface PackIndex {
  voice?: string;
  packs: { id: string; file: string; duration: number }[];
  /** chemin sans extension → [n° de paquet, début (s), durée (s)] */
  clips: Record<string, [number, number, number]>;
}

const stem = (path: string) => path.replace(/\.[a-z0-9]+$/i, '');
/** Nombre de paquets décodés gardés en mémoire (un paquet ≈ 1 min de son). */
const MAX_DECODED = 8;

class AudioEngine {
  private manifest: Map<string, string> | null = null;
  private manifestPromise: Promise<Map<string, string>> | null = null;
  private index: PackIndex | null = null;
  private indexPromise: Promise<PackIndex> | null = null;
  private buffers = new Map<number, Promise<AudioBuffer>>();
  private pool = new Map<string, HTMLAudioElement>();
  private current: HTMLAudioElement | null = null;
  private currentNode: AudioBufferSourceNode | null = null;
  private token = 0;
  private resolveCurrent: (() => void) | null = null;
  private voice: SpeechSynthesisVoice | null = null;
  private failedUrls = new Set<string>();
  private noticeShown = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.pickVoice();
      window.speechSynthesis.addEventListener?.('voiceschanged', () => this.pickVoice());
    }
  }

  /** Choisit la meilleure voix arabe installée (les voix se chargent de façon asynchrone). */
  private pickVoice() {
    const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('ar'));
    this.voice =
      voices.find((v) => /sa|eg/i.test(v.lang) && /google|natural|neural|premium/i.test(v.name)) ??
      voices.find((v) => /google|natural|neural|premium/i.test(v.name)) ??
      voices[0] ??
      null;
  }

  /* ── Inventaire des sons disponibles ─────────────────────────────────── */

  /**
   * Enregistrements individuels déposés dans /public/audio (liste générée par
   * `npm run audio:manifest`), indexés sans extension : un « .ogg » déposé à la
   * place du « .mp3 » attendu est reconnu automatiquement.
   */
  loadManifest(): Promise<Map<string, string>> {
    if (this.manifest) return Promise.resolve(this.manifest);
    this.manifestPromise ??= fetch(`${AUDIO_BASE_URL}manifest.json`, { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : { files: [] }))
      .then((data: { files?: string[] }) => new Map((data.files ?? []).map((f) => [stem(f), f])))
      .catch(() => new Map<string, string>())
      .then((map) => (this.manifest = map));
    return this.manifestPromise;
  }

  /** Index des sons intégrés (paquets générés par `npm run audio:tts`). */
  loadIndex(): Promise<PackIndex> {
    if (this.index) return Promise.resolve(this.index);
    this.indexPromise ??= fetch(`${AUDIO_BASE_URL}packs/index.json`)
      .then((r) => (r.ok ? r.json() : { packs: [], clips: {} }))
      .catch(() => ({ packs: [], clips: {} }))
      .then((idx: PackIndex) => (this.index = idx));
    return this.indexPromise;
  }

  private ready() {
    return Promise.all([this.loadManifest(), this.loadIndex()]);
  }

  /** Statistiques affichées dans le profil. */
  async stats(): Promise<{ files: number; bundled: number }> {
    const [manifest, index] = await this.ready();
    return { files: manifest.size, bundled: Object.keys(index.clips).length };
  }

  /** Chemin réel du fichier local correspondant à `src`, ou null s’il est absent. */
  resolveFile(src: string): string | null {
    return this.manifest?.get(stem(src)) ?? null;
  }

  private resolveClip(src: string) {
    const clip = this.index?.clips[stem(src)];
    return clip ? { pack: clip[0], start: clip[1], duration: clip[2] } : null;
  }

  /** Télécharge et décode un paquet (mis en cache, dédupliqué). */
  private loadPack(n: number): Promise<AudioBuffer> {
    const cached = this.buffers.get(n);
    if (cached) {
      // Rafraîchit l’ordre LRU.
      this.buffers.delete(n);
      this.buffers.set(n, cached);
      return cached;
    }
    const ac = getAudioContext();
    const pack = this.index?.packs[n];
    if (!ac || !pack) return Promise.reject(new Error('Web Audio indisponible'));
    const promise = fetch(AUDIO_BASE_URL + pack.file)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.arrayBuffer();
      })
      // Forme « callback » : compatible avec les anciens Safari.
      .then((data) => new Promise<AudioBuffer>((resolve, reject) => ac.decodeAudioData(data, resolve, reject)));
    promise.catch(() => this.buffers.delete(n));
    this.buffers.set(n, promise);
    while (this.buffers.size > MAX_DECODED) this.buffers.delete(this.buffers.keys().next().value!);
    return promise;
  }

  private element(url: string): HTMLAudioElement {
    let el = this.pool.get(url);
    if (!el) {
      el = new Audio();
      el.preload = 'auto';
      el.src = url;
      this.pool.set(url, el);
    }
    return el;
  }

  /** Précharge les sons d’une étape pour une lecture instantanée au clic. */
  async preload(list: readonly Sound[]): Promise<void> {
    await this.ready();
    const packs = new Set<number>();
    for (const s of list) {
      const file = this.resolveFile(s.src);
      if (file) this.element(AUDIO_BASE_URL + file);
      else {
        const clip = this.resolveClip(s.src);
        if (clip) packs.add(clip.pack);
      }
    }
    for (const n of [...packs].slice(0, MAX_DECODED - 2)) this.loadPack(n).catch(() => {});
  }

  /* ── Lecture ──────────────────────────────────────────────────────────── */

  stop(): void {
    this.token++;
    if (this.current) {
      this.current.pause();
      this.current = null;
    }
    if (this.currentNode) {
      try {
        this.currentNode.stop();
      } catch {
        /* déjà arrêté */
      }
      this.currentNode = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    this.resolveCurrent?.();
    this.resolveCurrent = null;
    useAudioState.setState({ playingId: null, source: null });
  }

  /**
   * Joue un son. Ordre des sources :
   *   1. enregistrement déposé dans public/audio ;
   *   2. mots du Coran : récitation mot-à-mot de Quran.com (si activée) ;
   *   3. son intégré à l’application (paquets générés) ;
   *   4. voix arabe de l’appareil.
   * La promesse se résout à la fin de la lecture (ou si un autre son l’interrompt).
   */
  async play(sound: Sound, key: string = sound.id): Promise<void> {
    // Synchrone, pendant le geste de l’utilisateur : indispensable sur iOS.
    unlockAudio();
    this.stop();
    const token = this.token;
    const settings = useSettings.getState();
    useAudioState.setState({ playingId: key });

    await this.ready();
    if (token !== this.token) return;

    const urls: { url: string; source: 'file' | 'remote' }[] = [];
    const file = this.resolveFile(sound.src);
    if (file) urls.push({ url: AUDIO_BASE_URL + file, source: 'file' });
    if (sound.remote && settings.remoteQuranAudio && !this.failedUrls.has(sound.remote)) {
      urls.push({ url: sound.remote, source: 'remote' });
    }
    for (const { url, source } of urls) {
      const ok = await this.playUrl(url, token, settings.playbackRate, source);
      if (token !== this.token) return;
      if (ok) return this.finish(token);
      this.failedUrls.add(url);
    }

    const clip = this.resolveClip(sound.src);
    if (clip && (await this.playClip(clip, token, settings.playbackRate))) return this.finish(token);
    if (token !== this.token) return;

    if (settings.ttsFallback && sound.tts && (await this.speak(toSpeechText(sound.tts), sound.src, token, settings.playbackRate))) {
      return this.finish(token);
    }
    if (token !== this.token) return;

    // Aucun son disponible : on garde le retour visuel et on prévient une seule fois.
    this.notifyMissing('voice', sound.src);
    this.setSource('silent');
    await new Promise<void>((resolve) => {
      this.resolveCurrent = resolve;
      setTimeout(resolve, 650);
    });
    this.finish(token);
  }

  private setSource(source: AudioSource) {
    useAudioState.setState({ source, lastSource: source });
  }

  private finish(token: number) {
    if (token === this.token) {
      this.resolveCurrent = null;
      this.currentNode = null;
      useAudioState.setState({ playingId: null, source: null });
    }
  }

  private notifyMissing(kind: 'file' | 'voice', src: string) {
    if (this.noticeShown) return;
    this.noticeShown = true;
    useAudioState.setState({ missingNotice: { kind, src } });
  }

  /** Joue un extrait d’un paquet intégré via Web Audio (fonctionne sur tous les navigateurs récents). */
  private async playClip(clip: { pack: number; start: number; duration: number }, token: number, rate: number): Promise<boolean> {
    const ac = getAudioContext();
    if (!ac) return false;
    let buffer: AudioBuffer;
    try {
      buffer = await this.loadPack(clip.pack);
    } catch {
      return false;
    }
    if (token !== this.token) return true;
    if (ac.state !== 'running') await ac.resume().catch(() => {});
    return new Promise((resolve) => {
      const node = ac.createBufferSource();
      node.buffer = buffer;
      node.playbackRate.value = rate;
      node.connect(ac.destination);
      let settled = false;
      const done = (ok: boolean) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(ok);
      };
      node.onended = () => done(true);
      this.resolveCurrent = () => done(true);
      this.currentNode = node;
      // Filet de sécurité si « ended » n’arrive pas (onglet en arrière-plan…).
      const timer = setTimeout(() => done(true), (clip.duration / rate) * 1000 + 1500);
      this.setSource('pack');
      try {
        // +80 ms : absorbe le léger décalage introduit par certains décodeurs MP3
        // (l’extrait est suivi d’un silence dans le paquet).
        node.start(0, Math.max(0, clip.start), clip.duration + 0.08);
      } catch {
        done(false);
      }
    });
  }

  private playUrl(url: string, token: number, rate: number, source: 'file' | 'remote'): Promise<boolean> {
    return new Promise((resolve) => {
      const el = this.element(url);
      this.current = el;
      let settled = false;
      const done = (ok: boolean) => {
        if (settled) return;
        settled = true;
        clearTimeout(startTimer);
        el.removeEventListener('ended', onEnded);
        el.removeEventListener('error', onError);
        el.removeEventListener('playing', onPlaying);
        resolve(ok);
      };
      const onEnded = () => done(true);
      const onError = () => {
        this.pool.delete(url);
        done(false);
      };
      const onPlaying = () => clearTimeout(startTimer);
      // Réseau lent ou bloqué : on bascule sur la source suivante.
      const startTimer = setTimeout(
        () => {
          el.pause();
          done(false);
        },
        source === 'remote' ? 2500 : 4000,
      );
      this.resolveCurrent = () => done(true);
      el.addEventListener('ended', onEnded);
      el.addEventListener('error', onError);
      el.addEventListener('playing', onPlaying);
      try {
        el.currentTime = 0;
      } catch {
        /* certains navigateurs refusent avant le chargement */
      }
      el.playbackRate = rate;
      if (token !== this.token) return done(true);
      this.setSource(source);
      el.play().catch(() => done(false));
    });
  }

  private speak(text: string, src: string, token: number, rate: number): Promise<boolean> {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return Promise.resolve(false);
    if (!this.voice) this.pickVoice();
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = this.voice?.lang ?? 'ar-SA';
      if (this.voice) utterance.voice = this.voice;
      utterance.rate = 0.78 * rate;
      let settled = false;
      const done = (ok: boolean) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(ok);
      };
      utterance.onend = () => done(true);
      utterance.onerror = () => done(false);
      this.resolveCurrent = () => done(true);
      // Filet de sécurité : certains navigateurs n’émettent jamais « end ».
      const timer = setTimeout(() => done(true), 4000 + text.length * 250);
      if (token !== this.token) return done(true);
      this.setSource('speech');
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      // Sans voix arabe installée, la synthèse peut rester muette : on le signale.
      this.notifyMissing(this.voice ? 'file' : 'voice', src);
    });
  }

  /** Joue une liste de sons à la suite (lecture guidée). */
  async playSequence(
    list: readonly { sound: Sound; key?: string }[],
    onStep?: (index: number) => void,
    gapMs = 220,
  ): Promise<boolean> {
    const token = this.token + 1;
    for (let i = 0; i < list.length; i++) {
      onStep?.(i);
      await this.play(list[i].sound, list[i].key);
      if (this.token !== token + i) return false;
      await new Promise((r) => setTimeout(r, gapMs));
      if (this.token !== token + i) return false;
    }
    onStep?.(-1);
    return true;
  }

  dismissNotice() {
    useAudioState.setState({ missingNotice: null });
  }
}

export const audio = new AudioEngine();

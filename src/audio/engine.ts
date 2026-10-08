import { create } from 'zustand';
import { useSettings } from '@/store/settings';
import { AUDIO_BASE_URL, type Sound } from './sounds';

/** État observable de la lecture (pour synchroniser les animations). */
interface AudioState {
  playingId: string | null;
  /** Source effectivement utilisée pour le son en cours. */
  source: 'file' | 'remote' | 'speech' | 'silent' | null;
  /** Avertissement affiché une seule fois : fichier absent ou voix arabe indisponible. */
  missingNotice: { kind: 'file' | 'voice'; src: string } | null;
}

export const useAudioState = create<AudioState>(() => ({
  playingId: null,
  source: null,
  missingNotice: null,
}));

export function useIsPlaying(id: string | undefined): boolean {
  return useAudioState((s) => !!id && s.playingId === id);
}

type Listener = (sound: Sound) => void;

const stem = (path: string) => path.replace(/\.[a-z0-9]+$/i, '');

class AudioEngine {
  private manifest: Map<string, string> | null = null;
  private manifestPromise: Promise<Map<string, string>> | null = null;
  private pool = new Map<string, HTMLAudioElement>();
  private current: HTMLAudioElement | null = null;
  private token = 0;
  private resolveCurrent: (() => void) | null = null;
  private voice: SpeechSynthesisVoice | null = null;
  private failedUrls = new Set<string>();
  private noticeShown = false;
  private listeners = new Set<Listener>();

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

  /**
   * Liste des fichiers réellement présents dans /public/audio (générée par
   * `npm run audio:manifest`). Indexée sans extension : un « .ogg » ou « .m4a »
   * déposé à la place du « .mp3 » attendu est donc reconnu automatiquement.
   */
  loadManifest(): Promise<Map<string, string>> {
    if (this.manifest) return Promise.resolve(this.manifest);
    if (!this.manifestPromise) {
      this.manifestPromise = fetch(`${AUDIO_BASE_URL}manifest.json`, { cache: 'no-cache' })
        .then((r) => (r.ok ? r.json() : { files: [] }))
        .then((data: { files?: string[] }) => new Map((data.files ?? []).map((f) => [stem(f), f])))
        .catch(() => new Map<string, string>())
        .then((map) => (this.manifest = map));
    }
    return this.manifestPromise;
  }

  /** Chemin réel du fichier local correspondant à `src`, ou null s’il est absent. */
  resolveFile(src: string): string | null {
    return this.manifest?.get(stem(src)) ?? null;
  }

  onPlay(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
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

  /** Précharge les fichiers d’une étape pour une lecture instantanée au clic. */
  async preload(list: readonly Sound[]): Promise<void> {
    await this.loadManifest();
    for (const s of list) {
      const file = this.resolveFile(s.src);
      if (file) this.element(AUDIO_BASE_URL + file);
    }
  }

  stop(): void {
    this.token++;
    if (this.current) {
      this.current.pause();
      this.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    this.resolveCurrent?.();
    this.resolveCurrent = null;
    useAudioState.setState({ playingId: null, source: null });
  }

  /**
   * Joue un son. La promesse se résout à la fin de la lecture (ou si un autre son
   * l’interrompt), ce qui permet d’enchaîner une « lecture guidée ».
   */
  async play(sound: Sound, key: string = sound.id): Promise<void> {
    this.stop();
    const token = this.token;
    const settings = useSettings.getState();
    useAudioState.setState({ playingId: key });
    this.listeners.forEach((l) => l(sound));

    await this.loadManifest();
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

    if (settings.ttsFallback && sound.tts && (await this.speak(sound.tts, sound.src, token, settings.playbackRate))) {
      return this.finish(token);
    }
    if (token !== this.token) return;

    // Aucun son disponible : on garde le retour visuel et on prévient une seule fois.
    this.notifyMissing('voice', sound.src);
    useAudioState.setState({ source: 'silent' });
    await new Promise<void>((resolve) => {
      this.resolveCurrent = resolve;
      setTimeout(resolve, 650);
    });
    this.finish(token);
  }

  private finish(token: number) {
    if (token === this.token) {
      this.resolveCurrent = null;
      useAudioState.setState({ playingId: null, source: null });
    }
  }

  private notifyMissing(kind: 'file' | 'voice', src: string) {
    if (this.noticeShown) return;
    this.noticeShown = true;
    useAudioState.setState({ missingNotice: { kind, src } });
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
      // Réseau lent ou bloqué : on bascule sur la source suivante après 4 s.
      const startTimer = setTimeout(() => {
        el.pause();
        done(false);
      }, 4000);
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
      useAudioState.setState({ source });
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
      useAudioState.setState({ source: 'speech' });
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

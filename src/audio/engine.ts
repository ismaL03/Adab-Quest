import { create } from 'zustand';
import { useSettings } from '@/store/settings';
import { unlockAudio } from './context';
import { AUDIO_BASE_URL, type Sound } from './sounds';
import { listRecordings, stemOf } from './studio';

/**
 * Sources audio : uniquement des voix humaines.
 *   - `file`   : enregistrement du Studio (sur cet appareil) ou déposé dans public/audio ;
 *   - `remote` : récitation mot-à-mot de Quran.com (mots du Coran) ;
 *   - `silent` : aucun enregistrement — seule l’animation est jouée.
 * Aucune voix de synthèse n’est utilisée : une prononciation approximative
 * ferait plus de mal que de bien à un apprenant.
 */
export type AudioSource = 'file' | 'remote' | 'silent';

/** Pourquoi un élément est resté silencieux (avertissement affiché une fois). */
export type MissingKind = 'recording' | 'online';

/** État observable de la lecture (pour synchroniser les animations). */
interface AudioState {
  playingId: string | null;
  /** Source utilisée pour le son en cours. */
  source: AudioSource | null;
  /** Source du dernier son joué (conservée après la fin de la lecture). */
  lastSource: AudioSource | null;
  missingNotice: { kind: MissingKind; src: string } | null;
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

const stem = stemOf;

class AudioEngine {
  private manifest: Map<string, string> | null = null;
  private manifestPromise: Promise<Map<string, string>> | null = null;
  /** Enregistrements du Studio : chemin sans extension → URL locale. */
  private studio = new Map<string, string>();
  private studioPromise: Promise<void> | null = null;
  private pool = new Map<string, HTMLAudioElement>();
  private current: HTMLAudioElement | null = null;
  private token = 0;
  private resolveCurrent: (() => void) | null = null;
  private failedUrls = new Set<string>();
  private noticesShown = new Set<MissingKind>();

  /**
   * Enregistrements déposés dans /public/audio (liste générée par
   * `npm run audio:manifest`), indexés sans extension : un « .ogg » déposé à la
   * place du « .mp3 » attendu est reconnu automatiquement.
   */
  loadManifest(): Promise<Map<string, string>> {
    this.studioPromise ??= this.reloadStudio();
    if (this.manifest) return this.studioPromise.then(() => this.manifest!);
    this.manifestPromise ??= fetch(`${AUDIO_BASE_URL}manifest.json`, { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : { files: [] }))
      .then((data: { files?: string[] }) => new Map((data.files ?? []).map((f) => [stem(f), f])))
      .catch(() => new Map<string, string>())
      .then((map) => (this.manifest = map));
    return Promise.all([this.manifestPromise, this.studioPromise]).then(([m]) => m);
  }

  /** Recharge les enregistrements du Studio (après un ajout ou une suppression). */
  async reloadStudio(): Promise<void> {
    const recs = await listRecordings();
    this.studio.forEach((url) => URL.revokeObjectURL(url));
    this.studio = new Map(recs.map((r) => [r.stem, URL.createObjectURL(r.blob)]));
    this.pool.clear();
    this.failedUrls.clear();
  }

  /** URL d’un enregistrement du Studio pour `src`, s’il existe sur cet appareil. */
  studioUrl(src: string): string | null {
    return this.studio.get(stem(src)) ?? null;
  }

  /** Nombre d’enregistrements installés (profil). */
  async recordingsCount(): Promise<number> {
    return (await this.loadManifest()).size;
  }

  /** Chemin réel du fichier local correspondant à `src`, ou null s’il est absent. */
  resolveFile(src: string): string | null {
    return this.manifest?.get(stem(src)) ?? null;
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

  /** Précharge les enregistrements d’une étape pour une lecture instantanée au clic. */
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
    this.resolveCurrent?.();
    this.resolveCurrent = null;
    useAudioState.setState({ playingId: null, source: null });
  }

  /**
   * Joue un son : l’enregistrement local s’il existe, sinon (mots du Coran) la
   * récitation de Quran.com. La promesse se résout à la fin de la lecture, ce
   * qui permet d’enchaîner une « lecture guidée ».
   */
  async play(sound: Sound, key: string = sound.id): Promise<void> {
    // Pendant le geste de l’utilisateur : déverrouille le son sur iOS.
    unlockAudio();
    this.stop();
    const token = this.token;
    const settings = useSettings.getState();
    useAudioState.setState({ playingId: key });

    await this.loadManifest();
    if (token !== this.token) return;

    const urls: { url: string; source: 'file' | 'remote' }[] = [];
    const own = this.studioUrl(sound.src);
    if (own) urls.push({ url: own, source: 'file' });
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

    // Aucun enregistrement : animation seule, et explication une seule fois.
    this.notifyMissing(sound.remote ? 'online' : 'recording', sound.src);
    useAudioState.setState({ source: 'silent', lastSource: 'silent' });
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

  private notifyMissing(kind: MissingKind, src: string) {
    if (this.noticesShown.has(kind)) return;
    this.noticesShown.add(kind);
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
      // Réseau lent ou bloqué : on abandonne après quelques secondes.
      const startTimer = setTimeout(
        () => {
          el.pause();
          done(false);
        },
        source === 'remote' ? 6000 : 4000,
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
      useAudioState.setState({ source, lastSource: source });
      el.play().catch(() => done(false));
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

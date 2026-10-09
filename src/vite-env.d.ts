/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Dossier (ou CDN) contenant les fichiers audio. Défaut : « /audio/ ». */
  readonly VITE_AUDIO_BASE_URL?: string;
  /** Source distante de l’audio mot-à-mot du Coran. Vide = désactivé. */
  readonly VITE_QURAN_WBW_URL?: string;
  /** Type de routage : « browser » (défaut), « hash » ou « memory ». */
  readonly VITE_ROUTER?: 'browser' | 'hash' | 'memory';
}

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemePreference = 'system' | 'light' | 'dark';

export interface SettingsState {
  theme: ThemePreference;
  /** Couleurs du Tajweed dans la Vue Mushaf. */
  tajweedColors: boolean;
  /** Affiche aussi l’emphase (tafkhîm) en couleur. */
  showTafkhim: boolean;
  /** Affiche la translittération sous les lettres et syllabes. */
  transliteration: boolean;
  /** Vitesse de lecture audio. */
  playbackRate: number;
  /** Effets sonores de l’interface. */
  sfx: boolean;
  /** Synthèse vocale arabe si le fichier audio est absent. */
  ttsFallback: boolean;
  /** Audio mot-à-mot de Quran.com si le fichier local est absent. */
  remoteQuranAudio: boolean;
  /** Lecture automatique du son au début de chaque étape. */
  autoplay: boolean;
  onboarded: boolean;
  displayName: string;
  update: (patch: Partial<Omit<SettingsState, 'update'>>) => void;
}

export const DEFAULT_SETTINGS = {
  theme: 'system' as ThemePreference,
  tajweedColors: true,
  showTafkhim: false,
  transliteration: true,
  playbackRate: 1,
  sfx: true,
  ttsFallback: true,
  remoteQuranAudio: true,
  autoplay: true,
  onboarded: false,
  displayName: '',
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      update: (patch) => set(patch),
    }),
    { name: 'iqra-settings', version: 1 },
  ),
);

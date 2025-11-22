
export type QuestCategory = 'heart' | 'body' | 'mind';

export interface Quest {
  id: string;
  title: string;
  description: string;
  category: QuestCategory;
  xp: number; // Noor
  completed: boolean;
  type: 'declarative' | 'checkin' | 'timer';
  isCustom?: boolean;
  reference?: string; // Hadith ou Verset
}

export interface UserState {
  noor: number; // XP
  level: number;
  streak: number;
  name: string;
  title: string; // ex: "Chercheur de Vérité"
  quranProgress: number; // Pourcentage du Coran lu
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'murabbi';
  text: string;
  timestamp: Date;
}

export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export interface Ayah {
  number: number;
  text: string; // Arabe
  secondaryText?: string; // Français ou Tafsir
  audio?: string; // URL Audio
  numberInSurah: number;
  juz: number;
  page: number;
}

export interface PredefinedQuest {
  title: string;
  description: string;
  category: QuestCategory;
  xp: number;
  reference?: string;
}

export interface QuranSettings {
  reciterId: string; // ex: ar.alafasy
  translationId: string; // ex: fr.hamidullah ou ar.muyassar (tafsir)
  autoPlay: boolean;
}

// Types for Travel Components (Leftover compatibility)
export interface SearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  travelers: number;
  type: 'flight' | 'hotel' | 'both';
}

export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

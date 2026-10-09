import type { Sound } from '@/audio/sounds';
import type { HighlightSpec } from '@/features/mushaf/highlight';
import type { Passage } from '@/features/mushaf/passage';

/** Élément arabe affichable et cliquable (lettre, syllabe, mot). */
export interface Item {
  id: string;
  ar: string;
  sound: Sound;
  /** Translittération (ex. « ba »). */
  label?: string;
  /** Sens en français (mots). */
  meaning?: string;
}

export interface ChoiceOption {
  id: string;
  text: string;
  arabic?: boolean;
  sound?: Sound;
}

interface BaseStep {
  id: string;
}

/** Présentation d’une notion. */
export interface IntroStep extends BaseStep {
  kind: 'intro';
  eyebrow?: string;
  title: string;
  body: string;
  /** Grand exemple arabe cliquable. */
  hero?: Item;
  items?: Item[];
  tips?: string[];
}

/** Fiche d’une lettre : nom, prononciation, formes. */
export interface LetterStep extends BaseStep {
  kind: 'letter';
  letterId: string;
}

/** Découverte : écouter chaque élément d’une grille. */
export interface DiscoverStep extends BaseStep {
  kind: 'discover';
  title: string;
  prompt: string;
  items: Item[];
}

/** QCM auditif : écouter puis choisir l’élément entendu. */
export interface ListenStep extends BaseStep {
  kind: 'listen';
  prompt: string;
  answer: Item;
  options: Item[];
}

/** QCM visuel : lire puis choisir la bonne réponse. */
export interface ChooseStep extends BaseStep {
  kind: 'choose';
  prompt: string;
  question: { ar?: string; text?: string; sound?: Sound; caption?: string };
  options: ChoiceOption[];
  answerId: string;
  explain?: string;
}

/** Associer des paires. */
export interface MatchStep extends BaseStep {
  kind: 'match';
  prompt: string;
  pairs: { left: Item; right: ChoiceOption }[];
}

/** Écoute et répète : lignes de syllabes / mots, avec lecture guidée. */
export interface RepeatStep extends BaseStep {
  kind: 'repeat';
  title: string;
  prompt: string;
  lines: Item[][];
}

/** Assembler un mot à partir de ses syllabes. */
export interface BuildStep extends BaseStep {
  kind: 'build';
  prompt: string;
  target: Item;
  pieces: Item[];
  distractors: Item[];
}

/** Tableau des formes (isolée, début, milieu, fin). */
export interface FormsStep extends BaseStep {
  kind: 'forms';
  title: string;
  prompt: string;
  letterIds: string[];
}

/** Chasse dans le Mushaf : retrouver l’élément étudié dans le texte coranique. */
export interface MushafStep extends BaseStep {
  kind: 'mushaf';
  prompt: string;
  highlight: HighlightSpec;
  /** Filtres proposés (ex. une puce par lettre de la leçon). */
  filters?: { label: string; highlight: HighlightSpec }[];
  passage?: Passage;
  goal: number;
  /** Affiche les couleurs du Tajweed (leçon sur le code couleur). */
  tajweed?: boolean;
}

/** Lecture d’un verset mot à mot. */
export interface VerseStep extends BaseStep {
  kind: 'verse';
  surah: number;
  ayah: number;
  prompt: string;
  highlight?: HighlightSpec;
}

/** QCM auditif sur les mots d’un verset. */
export interface VerseListenStep extends BaseStep {
  kind: 'verse-listen';
  surah: number;
  ayah: number;
  prompt: string;
}

/** Remettre les mots d’un verset dans l’ordre. */
export interface VerseOrderStep extends BaseStep {
  kind: 'verse-order';
  surah: number;
  ayah: number;
  prompt: string;
}

export type Step =
  | IntroStep
  | LetterStep
  | DiscoverStep
  | ListenStep
  | ChooseStep
  | MatchStep
  | RepeatStep
  | BuildStep
  | FormsStep
  | MushafStep
  | VerseStep
  | VerseListenStep
  | VerseOrderStep;

export type StepKind = Step['kind'];

/** Étapes notées (une erreur fait perdre une étoile). */
export const GRADED_KINDS: StepKind[] = ['listen', 'choose', 'match', 'build', 'verse-listen', 'verse-order'];

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  subtitle: string;
  /** Glyphe arabe affiché sur le nœud de la carte. */
  glyph: string;
  type: 'lesson' | 'review' | 'quran';
  xp: number;
  steps: Step[];
}

export interface Module {
  id: string;
  index: number;
  title: string;
  titleAr: string;
  description: string;
  lessons: Lesson[];
}

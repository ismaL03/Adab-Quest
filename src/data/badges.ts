import { MODULES } from '@/data/curriculum';

export interface BadgeContext {
  xp: number;
  completed: (lessonId: string) => boolean;
  perfectLessons: number;
  streak: number;
  soundsPlayed: number;
  mushafWords: number;
  completedCount: number;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  /** Glyphe (arabe ou symbole) affiché dans le médaillon. */
  glyph: string;
  tone: 'emerald' | 'gold' | 'ink';
  check: (ctx: BadgeContext) => boolean;
}

const moduleDone = (id: string) => (ctx: BadgeContext) =>
  MODULES.find((m) => m.id === id)!.lessons.every((l) => ctx.completed(l.id));

export const BADGES: Badge[] = [
  {
    id: 'premier-pas',
    title: 'Premier pas',
    description: 'Terminer ta première leçon.',
    glyph: 'ا',
    tone: 'emerald',
    check: (c) => c.completedCount >= 1,
  },
  {
    id: 'sans-faute',
    title: 'Sans faute',
    description: 'Réussir une leçon sans aucune erreur.',
    glyph: '✦',
    tone: 'gold',
    check: (c) => c.perfectLessons >= 1,
  },
  {
    id: 'alphabet',
    title: 'Alphabet maîtrisé',
    description: 'Découvrir les 28 lettres de l’alphabet.',
    glyph: 'أ ب ت',
    tone: 'emerald',
    check: moduleDone('dernieres'),
  },
  {
    id: 'harakat',
    title: 'Maître des voyelles',
    description: 'Comprendre comment se lit l’arabe : voyelles, soukoun, voyelles longues.',
    glyph: 'بَ بِ بُ',
    tone: 'emerald',
    check: moduleDone('systeme'),
  },
  {
    id: 'lecteur',
    title: 'Premiers mots',
    description: 'Terminer l’étape de la famille du bâ’ et lire tes premiers mots.',
    glyph: 'بَيْتٌ',
    tone: 'gold',
    check: moduleDone('famille-ba'),
  },
  {
    id: 'tajweed',
    title: 'Oreille du Tajweed',
    description: 'Terminer les leçons sur la chadda, les lettres épaisses et la qalqala.',
    glyph: 'نّ',
    tone: 'gold',
    check: (c) => ['chadda', 'epaisses', 'qalqala'].every((id) => c.completed(id)),
  },
  {
    id: 'mushaf',
    title: 'Lecteur du Mushaf',
    description: 'Terminer l’étape « Lire le Mushaf ».',
    glyph: 'ٱقْرَأْ',
    tone: 'gold',
    check: moduleDone('mushaf'),
  },
  {
    id: 'perfection-5',
    title: 'Précision',
    description: 'Réussir 5 leçons sans faute.',
    glyph: '✧',
    tone: 'gold',
    check: (c) => c.perfectLessons >= 5,
  },
  {
    id: 'serie-3',
    title: 'Régularité',
    description: 'Pratiquer 3 jours d’affilée.',
    glyph: '٣',
    tone: 'ink',
    check: (c) => c.streak >= 3,
  },
  {
    id: 'serie-7',
    title: 'Persévérance',
    description: 'Pratiquer 7 jours d’affilée.',
    glyph: '٧',
    tone: 'gold',
    check: (c) => c.streak >= 7,
  },
  {
    id: 'oreille',
    title: 'Oreille attentive',
    description: 'Écouter 200 sons.',
    glyph: '♪',
    tone: 'ink',
    check: (c) => c.soundsPlayed >= 200,
  },
  {
    id: 'explorateur',
    title: 'Explorateur du Mushaf',
    description: 'Écouter 50 mots dans la Vue Mushaf.',
    glyph: '۞',
    tone: 'emerald',
    check: (c) => c.mushafWords >= 50,
  },
  {
    id: 'xp-1000',
    title: 'Mille lumières',
    description: 'Cumuler 1 000 points d’expérience.',
    glyph: '١٠٠٠',
    tone: 'gold',
    check: (c) => c.xp >= 1000,
  },
];

export function getBadge(id: string): Badge | undefined {
  return BADGES.find((b) => b.id === id);
}

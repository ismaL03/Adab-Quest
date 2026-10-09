import { createRng, hashString, sample, shuffle } from '@/lib/random';
import { contextualForm, graphemes, MARKS, NON_CONNECTORS, TATWEEL, type LetterPosition } from '@/lib/arabic';
import { letter, LETTERS, SHAPE_FAMILIES, SOUND_PAIRS } from '@/data/letters';
import type { HighlightSpec } from '@/features/mushaf/highlight';
import type { Passage } from '@/features/mushaf/passage';
import {
  letterItem,
  maddItem,
  syllableItems,
  tanwinItem,
  textItem,
  vowelItem,
  VOWELS,
  VOWEL_IDS,
  wordItem,
  type VowelId,
  type WordEntry,
} from './items';
import type { ChoiceOption, IntroStep, Item, Lesson, MushafStep, Step } from './types';

/** Étape sans identifiant : l’identifiant est attribué par `lesson()`. */
export type Draft = Step extends infer S ? (S extends Step ? Omit<S, 'id'> : never) : never;

export interface LessonInput {
  id: string;
  title: string;
  subtitle: string;
  glyph: string;
  type?: Lesson['type'];
  xp?: number;
  steps: (rng: () => number) => Draft[];
}

export interface LessonDraft extends Omit<Lesson, 'moduleId'> {}

/** Assemble une leçon : RNG déterministe (même leçon = mêmes exercices). */
export function lesson(input: LessonInput): LessonDraft {
  const rng = createRng(hashString(input.id));
  const drafts = input.steps(rng);
  return {
    id: input.id,
    title: input.title,
    subtitle: input.subtitle,
    glyph: input.glyph,
    type: input.type ?? 'lesson',
    xp: input.xp ?? 20,
    steps: drafts.map((d, i) => ({ ...d, id: `${input.id}-${i + 1}` }) as Step),
  };
}

/* ──────────────────────────────────────────────────────────────────────────
   Lettres « faciles à confondre » (même squelette ou son voisin)
   ────────────────────────────────────────────────────────────────────────── */

export function confusables(letterId: string): string[] {
  const out = new Set<string>();
  for (const fam of SHAPE_FAMILIES) if (fam.includes(letterId)) fam.forEach((id) => out.add(id));
  for (const [a, b] of SOUND_PAIRS) {
    if (a === letterId) out.add(b);
    if (b === letterId) out.add(a);
  }
  out.delete(letterId);
  return [...out];
}

/* ──────────────────────────────────────────────────────────────────────────
   Fabriques d’étapes
   ────────────────────────────────────────────────────────────────────────── */

/** QCM auditif : la bonne réponse + des distracteurs pris dans `pool`. */
export function listen(answer: Item, pool: Item[], rng: () => number, count = 4, prompt?: string): Draft {
  const others = pool.filter((p) => p.id !== answer.id && p.ar !== answer.ar);
  const unique = [...new Map(others.map((o) => [o.ar, o])).values()];
  return {
    kind: 'listen',
    prompt: prompt ?? 'Écoute, puis choisis ce que tu as entendu',
    answer,
    options: shuffle([answer, ...sample(unique, count - 1, rng)], rng),
  };
}

/** QCM visuel : lire l’arabe, choisir la translittération / le nom. */
export function readChoice(
  item: Item,
  pool: Item[],
  rng: () => number,
  { prompt = 'Comment se lit ceci ?', field = 'label' as 'label' | 'meaning', count = 4 } = {},
): Draft {
  const text = (i: Item) => (field === 'label' ? i.label : i.meaning) ?? i.ar;
  const answer: ChoiceOption = { id: item.id, text: text(item) };
  const seen = new Set([answer.text]);
  const distractors: ChoiceOption[] = [];
  for (const p of shuffle(pool, rng)) {
    const t = text(p);
    if (seen.has(t)) continue;
    seen.add(t);
    distractors.push({ id: p.id, text: t });
    if (distractors.length >= count - 1) break;
  }
  return {
    kind: 'choose',
    prompt,
    question: { ar: item.ar, sound: item.sound },
    options: shuffle([answer, ...distractors], rng),
    answerId: answer.id,
  };
}

/** Associer l’arabe à sa translittération (ou à un autre champ). */
export function match(items: Item[], rng: () => number, prompt = 'Associe chaque élément à sa lecture', max = 4): Draft {
  const unique = [...new Map(items.map((i) => [i.label ?? i.ar, i])).values()];
  return {
    kind: 'match',
    prompt,
    pairs: sample(unique, Math.min(max, unique.length), rng).map((left) => ({
      left,
      right: { id: left.id, text: left.label ?? left.meaning ?? '' },
    })),
  };
}

export function mushaf(
  prompt: string,
  highlight: HighlightSpec,
  goal = 3,
  extra: { filters?: MushafStep['filters']; passage?: Passage; tajweed?: boolean } = {},
): Draft {
  return { kind: 'mushaf', prompt, highlight, goal, ...extra };
}

export function discover(title: string, items: Item[], prompt = 'Touche chaque élément pour l’écouter.'): Draft {
  return { kind: 'discover', title, prompt, items };
}

export function repeat(title: string, lines: Item[][], prompt = 'Lance la lecture guidée, puis répète chaque son à voix haute.'): Draft {
  return { kind: 'repeat', title, prompt, lines };
}

export function build(word: WordEntry, rng: () => number, distractorPool: Item[] = []): Draft {
  const target = wordItem(word);
  const pieces = syllableItems(word.ar);
  const texts = new Set(pieces.map((p) => p.ar));
  const distractors = sample(
    distractorPool.filter((d) => !texts.has(d.ar)),
    2,
    rng,
  );
  return {
    kind: 'build',
    prompt: 'Écoute le mot, puis assemble ses syllabes',
    target,
    pieces,
    distractors,
  };
}

export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/* ──────────────────────────────────────────────────────────────────────────
   Modèles de leçons réutilisables
   ────────────────────────────────────────────────────────────────────────── */

/** Syllabes « lettre + voyelle » pour une liste de lettres. */
export function vowelRow(letterIds: string[], vowel: VowelId): Item[] {
  return letterIds.map((id) => {
    const l = letter(id);
    const base = l.id === 'alif' ? (vowel === 'kasra' ? 'إ' : 'أ') : l.char;
    const lead = l.id === 'alif' ? '' : l.translit;
    return textItem(base + VOWELS[vowel].mark, lead + VOWELS[vowel].sound);
  });
}

export const ALPHABET_IDS = LETTERS.map((l) => l.id);

/** Formes contextuelles d’une lettre sous forme d’items cliquables. */
export function formItems(letterId: string): Item[] {
  const l = letter(letterId);
  const positions: LetterPosition[] = ['isolated', 'initial', 'medial', 'final'];
  const labels: Record<LetterPosition, string> = {
    isolated: 'isolée',
    initial: 'début',
    medial: 'milieu',
    final: 'fin',
  };
  return positions.map((p) => ({
    ...letterItem(letterId),
    id: `form:${letterId}:${p}`,
    ar: contextualForm(l.char, p),
    label: `${l.name} · ${labels[p]}`,
  }));
}

/* ──────────────────────────────────────────────────────────────────────────
   Position d’une lettre dans un mot (début, milieu, fin, seule)
   ────────────────────────────────────────────────────────────────────────── */

const POSITION_LABELS: Record<LetterPosition, string> = {
  isolated: 'Seule',
  initial: 'Au début',
  medial: 'Au milieu',
  final: 'À la fin',
};

/**
 * Forme prise par `char` dans `word` (s’il y apparaît une seule fois) :
 * elle dépend de ses voisines, car six lettres ne se lient jamais à la suivante.
 */
export function letterPosition(word: string, char: string): LetterPosition | null {
  const bases = graphemes(word)
    .map((g) => g.base)
    .filter((b) => b !== ' ' && b !== TATWEEL);
  const hits = bases.flatMap((b, i) => (b === char ? [i] : []));
  if (hits.length !== 1) return null;
  const i = hits[0];
  const joinsPrev = i > 0 && !NON_CONNECTORS.has(bases[i - 1]) && char !== 'ء';
  const joinsNext = i < bases.length - 1 && !NON_CONNECTORS.has(char);
  if (joinsPrev && joinsNext) return 'medial';
  if (joinsPrev) return 'final';
  if (joinsNext) return 'initial';
  return 'isolated';
}

/** Exercice : « Où se trouve la lettre dans ce mot ? » */
export function positionQuiz(word: Item, letterId: string): Draft | null {
  const l = letter(letterId);
  const pos = letterPosition(word.ar, l.char);
  if (!pos) return null;
  return {
    kind: 'choose',
    prompt: `Où se trouve la lettre ${l.char} dans ce mot ?`,
    question: { ar: word.ar, sound: word.sound, caption: word.label },
    options: (Object.keys(POSITION_LABELS) as LetterPosition[]).map((p) => ({ id: p, text: POSITION_LABELS[p] })),
    answerId: pos,
    explain: `Dans ${word.ar}, le ${l.name} est ${POSITION_LABELS[pos].toLowerCase()} : il s’écrit ${contextualForm(l.char, pos)}.`,
  };
}

/* ──────────────────────────────────────────────────────────────────────────
   Leçon « une lettre » (structure d’une leçon du livre)
   ────────────────────────────────────────────────────────────────────────── */

/** La lettre avec chaque voyelle courte, le soukoun et (si étudié) le tanwîn. */
export function letterVowelItems(letterId: string, { tanwin = false } = {}): Item[] {
  const l = letter(letterId);
  const items = VOWEL_IDS.map((v) => vowelItem(letterId, v));
  items.push(textItem(l.char + MARKS.sukun, l.translit));
  if (tanwin) items.push(...VOWEL_IDS.map((v) => tanwinItem(letterId, v)));
  return items;
}

/** Paires « voyelle courte / voyelle longue » : بَ بَا · بِ بِي · بُ بُو */
export function shortLongLines(letterId: string): Item[][] {
  return VOWEL_IDS.map((v) => [vowelItem(letterId, v), maddItem(letterId, v)]);
}

export interface LetterLessonInput {
  id: string;
  letterId: string;
  subtitle: string;
  /** Lettres déjà étudiées (distracteurs des exercices d’écoute). */
  known: string[];
  words: WordEntry[];
  keyword?: WordEntry;
  /** Le tanwîn a déjà été étudié : il rejoint la ligne des voyelles. */
  tanwin?: boolean;
  /** Notion qui se glisse dans la leçon (lettres non attachées, lîn…). */
  notion?: Omit<IntroStep, 'kind' | 'id'>;
  passage?: Passage;
}

/**
 * Une leçon par lettre, comme dans « Ata‘allamu al-‘arabiyya » :
 * la lettre et son mot-clé → la lettre avec les voyelles → les voyelles
 * longues → des mots qui n’utilisent que des lettres connues → sa forme
 * selon sa place dans le mot → la retrouver dans le Mushaf.
 */
export function letterLesson(input: LetterLessonInput): LessonDraft {
  const l = letter(input.letterId);
  return lesson({
    id: input.id,
    title: `${l.name} ${l.char}`,
    subtitle: input.subtitle,
    glyph: l.char,
    xp: 25,
    steps: (rng) => {
      const row = letterVowelItems(l.id, { tanwin: input.tanwin });
      const lines = shortLongLines(l.id);
      const syllables = [...row, ...lines.map((p) => p[1])];
      const words = input.words.map(wordItem);
      const others = input.known.filter((id) => id !== l.id && id !== 'alif');
      const near = [...confusables(l.id).filter((id) => others.includes(id)), ...shuffle(others, rng)];
      const letterPool = [...new Set(near)].slice(0, 3).map((id) => vowelItem(id, 'fatha'));

      const steps: Draft[] = [{ kind: 'letter', letterId: l.id, keyword: input.keyword && keywordItem(input.keyword) }];
      if (input.notion) steps.push({ kind: 'intro', ...input.notion });
      steps.push(
        discover(`${l.name} et ses voyelles`, row, 'Touche chaque syllabe : la voyelle change le son de la lettre.'),
        repeat('Court ou long ?', lines, 'Écoute la voyelle courte puis la voyelle longue, et répète.'),
        ...sample(syllables, 2, rng).map((it) => listen(it, syllables, rng, 4, 'Quel son as-tu entendu ?')),
      );
      if (letterPool.length) {
        const target = vowelItem(l.id, 'fatha');
        steps.push(listen(target, [target, ...letterPool], rng, Math.min(4, letterPool.length + 1), 'Quelle lettre as-tu entendue ?'));
      }
      steps.push(readChoice(sample(syllables, 1, rng)[0], syllables, rng));

      steps.push(
        discover('Lis tes premiers mots', words, 'Ces mots n’utilisent que des lettres que tu connais. Touche-les pour les écouter.'),
      );
      if (words.length > 1) steps.push(repeat('Lecture guidée', chunk(words, 3)));
      const buildable = input.words.filter((w) => syllableItems(w.ar).length >= 2);
      const syllablePool = input.words.flatMap((w) => syllableItems(w.ar));
      steps.push(...sample(buildable, Math.min(2, buildable.length), rng).map((w) => build(w, rng, syllablePool)));
      if (words.length >= 3) steps.push(...sample(words, 2, rng).map((it) => listen(it, words, rng, 4, 'Quel mot as-tu entendu ?')));

      // Sa forme dans le mot : une question par position différente.
      const byPos = new Map<LetterPosition, Draft>();
      for (const word of shuffle(words, rng)) {
        const pos = letterPosition(word.ar, l.char);
        const quiz = positionQuiz(word, l.id);
        if (pos && quiz && !byPos.has(pos)) byPos.set(pos, quiz);
      }
      steps.push(...[...byPos.values()].slice(0, 2));
      if (words.length >= 3) steps.push(match(words, rng, 'Associe chaque mot à sa lecture'));

      if (l.id !== 'alif') {
        steps.push(
          mushaf(
            `Retrouve la lettre ${l.char} dans le Coran : touche les mots qui la contiennent.`,
            { letters: [l.char], label: `la lettre ${l.name}` },
            3,
            { passage: input.passage },
          ),
        );
      }
      return steps;
    },
  });
}

/** Mot-clé : un mot illustré, identifié à part pour ne pas compter comme un mot de lecture. */
export function keywordItem(entry: WordEntry): Item {
  return { ...wordItem(entry), id: `keyword:${entry.slug}` };
}

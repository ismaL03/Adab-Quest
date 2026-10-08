import { createRng, hashString, sample, shuffle } from '@/lib/random';
import { contextualForm, type LetterPosition } from '@/lib/arabic';
import { letter, LETTERS, SHAPE_FAMILIES, SOUND_PAIRS } from '@/data/letters';
import type { HighlightSpec } from '@/features/mushaf/highlight';
import type { Passage } from '@/features/mushaf/passage';
import {
  letterItem,
  syllableItems,
  textItem,
  VOWELS,
  wordItem,
  type VowelId,
  type WordEntry,
} from './items';
import type { ChoiceOption, Item, Lesson, MushafStep, Step } from './types';

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

/** Lettres déjà vues avant (et y compris) cette liste, dans l’ordre de l’alphabet. */
export function lettersUpTo(lastId: string): string[] {
  const idx = LETTERS.findIndex((l) => l.id === lastId);
  return LETTERS.slice(0, idx + 1).map((l) => l.id);
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

/** Leçon d’introduction de nouvelles lettres isolées. */
export function letterGroupLesson(opts: { id: string; letterIds: string[]; title: string; subtitle: string }): LessonDraft {
  const { letterIds } = opts;
  return lesson({
    id: opts.id,
    title: opts.title,
    subtitle: opts.subtitle,
    glyph: letter(letterIds[letterIds.length > 1 ? 1 : 0]).char,
    steps: (rng) => {
      const items = letterIds.map(letterItem);
      const known = lettersUpTo(letterIds[letterIds.length - 1]);
      const poolIds = [...new Set([...letterIds, ...letterIds.flatMap(confusables), ...sample(known, 4, rng)])];
      const pool = poolIds.map(letterItem);
      const steps: Draft[] = [
        {
          kind: 'intro',
          eyebrow: 'Nouvelles lettres',
          title: opts.title,
          body: 'Observe chaque lettre, écoute son nom, puis apprends à la reconnaître à l’oreille et à l’œil. Touche une lettre pour l’entendre.',
          items,
        },
        ...letterIds.map((letterId): Draft => ({ kind: 'letter', letterId })),
        discover('Écoute les lettres', items, 'Touche chaque lettre pour l’entendre au moins une fois.'),
        ...shuffle(items, rng).map((it) => listen(it, pool, rng)),
        ...sample(items, Math.min(2, items.length), rng).map((it) =>
          readChoice(it, pool, rng, { prompt: 'Quel est le nom de cette lettre ?' }),
        ),
        match(items, rng, 'Associe chaque lettre à son nom'),
        mushaf(
          'Retrouve ces lettres dans le Coran : touche les mots qui les contiennent.',
          { letters: letterIds.filter((id) => id !== 'alif').map((id) => letter(id).char), label: 'les lettres de la leçon' },
          3,
          {
            filters: letterIds
              .filter((id) => id !== 'alif')
              .map((id) => ({ label: letter(id).char, highlight: { letters: [letter(id).char], label: `la lettre ${letter(id).name}` } })),
          },
        ),
      ];
      return steps;
    },
  });
}

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

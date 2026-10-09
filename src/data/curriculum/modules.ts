import { MARKS } from '@/lib/arabic';
import { letter, SHAPE_FAMILIES } from '@/data/letters';
import { sample, shuffle } from '@/lib/random';
import {
  build,
  chunk,
  discover,
  formItems,
  lesson,
  letterLesson,
  listen,
  match,
  mushaf,
  positionQuiz,
  readChoice,
  repeat,
  shortLongLines,
  vowelRow,
  type Draft,
  type LessonDraft,
  type LetterLessonInput,
} from './builders';
import {
  letterItem,
  maddItem,
  sukunItem,
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
import { KEYWORDS, LESSON_WORDS, SENTENCES, WORDS_QAMARI, WORDS_SHAMSI } from './words';
import type { HighlightSpec } from '@/features/mushaf/highlight';
import type { Passage } from '@/features/mushaf/passage';
import type { Item, Module } from './types';

interface ModuleDraft extends Omit<Module, 'lessons'> {
  lessons: LessonDraft[];
}

/**
 * Ordre d’apparition des lettres. Comme dans « Ata‘allamu al-‘arabiyya » :
 * on comprend d’abord le système (lettre + voyelle = son), puis on découvre
 * une lettre par leçon ; chaque nouvelle lettre permet de lire de nouveaux
 * mots, et les notions (tanwîn, tâ’ marbûṭa, alif maqsûra…) se glissent en
 * chemin, dès que les lettres nécessaires sont connues.
 */
export const LETTER_ORDER = [
  'ba',
  'ta',
  'tha',
  'nun',
  'ya',
  'ra',
  'dal',
  'waw',
  'zay',
  'dhal',
  'mim',
  'lam',
  'kaf',
  'ha',
  'sin',
  'shin',
  'qaf',
  'jim',
  'hha',
  'kha',
  'fa',
  'ayn',
  'ghayn',
  'sad',
  'dad',
  'taa',
  'dhaa',
];

/** Lettres connues une fois la leçon de `letterId` terminée. */
const knownUpTo = (letterId: string) => LETTER_ORDER.slice(0, LETTER_ORDER.indexOf(letterId) + 1);

/** Le tanwîn est étudié juste après le yâ’ : il rejoint ensuite chaque ligne de voyelles. */
const TANWIN_FROM = LETTER_ORDER.indexOf('ra');

function letterStep(
  letterId: string,
  subtitle: string,
  extra: Partial<Pick<LetterLessonInput, 'notion' | 'passage'>> = {},
): LessonDraft {
  return letterLesson({
    id: letterId,
    letterId,
    subtitle,
    known: knownUpTo(letterId),
    words: LESSON_WORDS[letterId] ?? [],
    keyword: KEYWORDS[letterId],
    tanwin: LETTER_ORDER.indexOf(letterId) >= TANWIN_FROM,
    ...extra,
  });
}

/** Leçon de lecture de mots autour d’une notion. */
function wordsLesson(opts: {
  id: string;
  title: string;
  subtitle: string;
  glyph: string;
  words: WordEntry[];
  intro: { eyebrow: string; body: string; tips?: string[]; items?: Item[] };
  extra?: (rng: () => number, items: Item[]) => Draft[];
  highlight?: { prompt: string; spec: HighlightSpec; goal?: number; passage?: Passage };
  type?: 'lesson' | 'review';
}): LessonDraft {
  return lesson({
    id: opts.id,
    title: opts.title,
    subtitle: opts.subtitle,
    glyph: opts.glyph,
    type: opts.type,
    xp: 25,
    steps: (rng) => {
      const items = opts.words.map(wordItem);
      const allSyllables = opts.words.flatMap((w) => syllableItems(w.ar));
      const steps: Draft[] = [
        {
          kind: 'intro',
          eyebrow: opts.intro.eyebrow,
          title: opts.title,
          body: opts.intro.body,
          hero: opts.intro.items ? undefined : items[0],
          items: opts.intro.items,
          tips: opts.intro.tips,
        },
        ...(opts.extra?.(rng, items) ?? []),
        discover('Écoute et lis chaque mot', items, 'Touche chaque mot : écoute, observe, puis relis-le seul.'),
        repeat('Lecture guidée', chunk(items, 3)),
        ...sample(
          opts.words.filter((w) => syllableItems(w.ar).length >= 2),
          2,
          rng,
        ).map((w) => build(w, rng, allSyllables)),
        ...sample(items, 2, rng).map((it) => listen(it, items, rng, 4, 'Quel mot as-tu entendu ?')),
        ...sample(items, 2, rng).map((it) => readChoice(it, items, rng)),
        match(items, rng, 'Associe chaque mot à sa lecture'),
      ];
      if (opts.highlight) {
        const { prompt, spec, goal = 4, passage } = opts.highlight;
        steps.push(mushaf(prompt, spec, goal, { passage }));
      }
      return steps;
    },
  });
}

/* ════════════════════════════════════════════════════════════════════════
   Étape 1 — Comment se lit l’arabe
   ════════════════════════════════════════════════════════════════════════ */

const VOWEL_TEXT: Record<VowelId, string> = {
  fatha: 'La **fatha** est un petit trait posé **au-dessus** de la lettre. Elle donne le son « a » : بَ se lit « ba ».',
  kasra: 'La **kasra** est un petit trait placé **en dessous** de la lettre. Elle donne le son « i » : بِ se lit « bi ».',
  damma: 'La **damma** est un petit wâw posé **au-dessus** de la lettre. Elle donne le son « ou » : بُ se lit « bou ».',
};

const soundsLesson = lesson({
  id: 'sons',
  title: 'Lettre + voyelle = son',
  subtitle: 'Le principe de la lecture arabe',
  glyph: 'بَ',
  steps: (rng) => {
    const row = VOWEL_IDS.map((v) => vowelItem('ba', v));
    const which = (v: VowelId): Draft => ({
      kind: 'choose',
      prompt: `Quelle syllabe se lit « b${VOWELS[v].sound} » ?`,
      question: { text: `Le son « b${VOWELS[v].sound} »` },
      options: row.map((it, i) => ({ id: VOWEL_IDS[i], text: it.ar, arabic: true })),
      answerId: v,
      explain: VOWEL_TEXT[v].replace(/\*\*/g, ''),
    });
    return [
      {
        kind: 'intro',
        eyebrow: 'Comment se lit l’arabe',
        title: 'Une lettre + une voyelle = un son',
        body: 'L’arabe se lit **de droite à gauche**. Ses lettres sont des **consonnes** : seules, elles ne font pas de son. On leur ajoute de petits signes, les **voyelles**, pour les faire sonner. Toute la lecture repose sur ce principe.',
        hero: letterItem('ba'),
        tips: ['ب avec une fatha → بَ « ba »', 'ب avec une kasra → بِ « bi »', 'ب avec une damma → بُ « bou »'],
      },
      ...VOWEL_IDS.map(
        (v, i): Draft => ({
          kind: 'intro',
          eyebrow: `Voyelle courte · ${VOWELS[v].nameAr}`,
          title: `La ${VOWELS[v].name}`,
          body: VOWEL_TEXT[v],
          hero: row[i],
          tips: ['Une voyelle courte se prononce brièvement : un seul temps.'],
        }),
      ),
      discover('Trois voyelles, trois sons', row, 'Touche chaque syllabe : seule la voyelle change.'),
      ...shuffle(row, rng).map((it) => listen(it, row, rng, 3, 'Quelle syllabe as-tu entendue ?')),
      ...sample(VOWEL_IDS, 2, rng).map(which),
      match(row, rng, 'Associe chaque syllabe à son son'),
      mushaf('Choisis une voyelle et retrouve-la dans le Coran.', { marks: [MARKS.fatha], label: 'la fatha' }, 4, {
        filters: VOWEL_IDS.map((v) => ({
          label: VOWELS[v].name,
          highlight: { marks: [VOWELS[v].mark], label: `la ${VOWELS[v].name}` },
        })),
      }),
    ];
  },
});

const sukunLesson = lesson({
  id: 'soukoun',
  title: 'Le soukoun',
  subtitle: 'Une lettre sans voyelle',
  glyph: 'أَبْ',
  steps: (rng) => {
    const closed = VOWEL_IDS.map((v) => sukunItem('ba', v));
    const open = VOWEL_IDS.map((v) => vowelItem('alif', v));
    return [
      {
        kind: 'intro',
        eyebrow: 'Nouveau signe',
        title: 'Le soukoun ـْ',
        body: 'Le **soukoun** est un petit rond posé sur la lettre : elle n’a **pas de voyelle**. Elle ne se prononce donc jamais seule : elle se colle au son qui la précède. أَ « a » + بْ = أَبْ « ab ».',
        hero: closed[0],
        tips: [
          'Au début, l’alif porte une petite hamza (أ / إ) : ici, elle sert seulement de support à la voyelle.',
          'Un mot ne commence jamais par une lettre au soukoun.',
          'Dans le Mushaf, le soukoun s’écrit parfois comme une petite tête de ḥâ’ : ـۡ',
        ],
      },
      repeat('Ouvert ou fermé ?', open.map((o, i) => [o, closed[i]]), 'Écoute la syllabe, puis la même fermée par un soukoun.'),
      discover('Syllabes fermées', closed),
      ...shuffle(closed, rng).map((it) => listen(it, [...closed, ...open], rng, 3, 'Quelle syllabe as-tu entendue ?')),
      readChoice(closed[1], closed, rng),
      mushaf('Retrouve le soukoun dans le Coran.', { marks: [MARKS.sukun, MARKS.sukunQuranic], label: 'le soukoun' }, 4),
    ];
  },
});

const longVowelsLesson = lesson({
  id: 'voyelles-longues',
  title: 'Les voyelles longues',
  subtitle: 'ا · و · ي : allonger le son',
  glyph: 'بَا',
  steps: (rng) => {
    const lines = shortLongLines('ba');
    const longs = lines.map((l) => l[1]);
    return [
      {
        kind: 'intro',
        eyebrow: 'Voyelles longues',
        title: 'Trois lettres pour allonger',
        body: 'Trois lettres servent à **allonger** les voyelles. Elles ne portent aucun signe : on prolonge simplement le son sur **deux temps**. ا après une fatha, ي après une kasra, و après une damma.',
        items: ['alif', 'waw', 'ya'].map(letterItem),
        tips: ['بَ « ba » → بَا « bâ »', 'بِ « bi » → بِي « bî »', 'بُ « bou » → بُو « boû »'],
      },
      { kind: 'letter', letterId: 'alif' },
      repeat('Court ou long ?', lines, 'Écoute la voyelle courte puis la voyelle longue, et répète.'),
      discover('Les sons longs', longs),
      ...shuffle(lines, rng).map((pair) => listen(pair[Math.floor(rng() * 2)], pair, rng, 2, 'Court ou long ?')),
      ...sample(longs, 2, rng).map((it) => readChoice(it, [...longs, ...lines.map((l) => l[0])], rng)),
      match([...longs, ...lines.map((l) => l[0])], rng, 'Associe chaque syllabe à son son'),
      mushaf('Repère les voyelles longues dans le Coran.', { rules: ['madda_normal'], label: 'la voyelle longue' }, 4),
    ];
  },
});

const MODULE_SYSTEM: ModuleDraft = {
  id: 'systeme',
  index: 1,
  title: 'Comment se lit l’arabe',
  titleAr: 'كَيْفَ نَقْرَأُ',
  description: 'Le principe de la lecture : lettre + voyelle = son, le soukoun, les voyelles longues, puis la première lettre.',
  lessons: [
    soundsLesson,
    sukunLesson,
    longVowelsLesson,
    letterStep('ba', 'Ta première lettre', {
      notion: {
        eyebrow: 'L’écriture attachée',
        title: 'Les lettres se lient',
        body: 'Dans un mot, les lettres **s’attachent** les unes aux autres, de droite à gauche. Une lettre change donc un peu de forme selon sa place : **seule**, **au début**, **au milieu** ou **à la fin** du mot.',
        items: formItems('ba'),
        tips: ['بـ au début · ـبـ au milieu · ـب à la fin · ب seule'],
      },
    }),
  ],
};

/* ════════════════════════════════════════════════════════════════════════
   Étape 2 — La famille du bâ’
   ════════════════════════════════════════════════════════════════════════ */

const tanwinLesson = wordsLesson({
  id: 'tanwin',
  title: 'Le tanwîn',
  subtitle: 'an · in · oun',
  glyph: 'بٌ',
  words: LESSON_WORDS.tanwin,
  intro: {
    eyebrow: 'Voyelle doublée',
    body: 'À la fin d’un mot, la voyelle peut être **doublée** : c’est le **tanwîn**. Il fait entendre un **ن** final : بًا « ban », بٍ « bin », بٌ « boun ». Le tanwîn fath s’écrit avec un alif, qu’on ne prononce pas.',
    items: VOWEL_IDS.map((v) => tanwinItem('ba', v)),
    tips: ['ـً « an » · ـٍ « in » · ـٌ « oun »', 'Le tanwîn s’écrit seulement à la fin des mots.'],
  },
  extra: (rng) => {
    const ids = ['ba', 'ta', 'tha', 'nun'];
    const pairs = ids.flatMap((id) => VOWEL_IDS.map((v) => [vowelItem(id, v), tanwinItem(id, v)]));
    return [
      repeat('Simple ou doublée ?', sample(pairs, 6, rng), 'Compare la voyelle simple et le tanwîn.'),
      ...sample(pairs, 4, rng).map((p) => listen(p[Math.floor(rng() * 2)], p, rng, 2, 'Voyelle simple ou tanwîn ?')),
    ];
  },
  highlight: { prompt: 'Retrouve le tanwîn dans le Coran.', spec: { marks: [MARKS.tanwinFath, MARKS.tanwinKasr, MARKS.tanwinDamm], label: 'le tanwîn' }, goal: 4 },
});

const dotsReview = lesson({
  id: 'points',
  title: 'Les points font la différence',
  subtitle: 'ب ت ث ن ي : un même squelette',
  glyph: 'ث',
  type: 'review',
  steps: (rng) => {
    const family = SHAPE_FAMILIES[0];
    const items = family.map(letterItem);
    const syll = family.map((id) => vowelItem(id, 'fatha'));
    return [
      {
        kind: 'intro',
        eyebrow: 'Révision',
        title: 'Un squelette, cinq lettres',
        body: 'ب ت ث ن ي partagent le même squelette : seuls le **nombre** et la **place des points** les distinguent. Regarde bien avant de lire !',
        items,
        tips: ['Un point dessous : ب', 'Deux points dessus : ت · trois points dessus : ث', 'Un point dessus : ن · deux points dessous : ي'],
      },
      { kind: 'forms', title: 'Leurs formes dans le mot', prompt: 'Au début et au milieu du mot, seuls les points permettent de les reconnaître.', letterIds: family },
      ...shuffle(syll, rng).map((it) => listen(it, syll, rng, 4, 'Quelle lettre as-tu entendue ?')),
      ...sample(items, 2, rng).map((it) => readChoice(it, items, rng, { prompt: 'Quel est le nom de cette lettre ?' })),
      match(items, rng, 'Associe chaque lettre à son nom'),
      mushaf('Choisis une lettre et retrouve-la dans le Coran.', { letters: ['ب'], label: 'la lettre Bâ' }, 4, {
        filters: family.map((id) => ({ label: letter(id).char, highlight: { letters: [letter(id).char], label: `la lettre ${letter(id).name}` } })),
      }),
    ];
  },
});

const MODULE_BA: ModuleDraft = {
  id: 'famille-ba',
  index: 2,
  title: 'La famille du bâ’',
  titleAr: 'عَائِلَةُ ٱلْبَاءِ',
  description: 'Quatre lettres au même squelette, tes premiers mots et le tanwîn.',
  lessons: [
    letterStep('ta', 'Deux points au-dessus'),
    letterStep('tha', 'Trois points au-dessus', {
      notion: {
        eyebrow: 'Astuce',
        title: 'ث = ت + un point',
        body: 'Le **thâ’** a la forme du tâ’ avec **trois points**. Il se prononce la langue entre les dents, comme le « th » anglais de « think ».',
        items: ['ba', 'ta', 'tha'].map(letterItem),
      },
    }),
    letterStep('nun', 'Un point au-dessus'),
    letterStep('ya', 'Consonne et voyelle longue', {
      notion: {
        eyebrow: 'Notion',
        title: 'Le yâ’, consonne ou voyelle',
        body: 'Avec une voyelle, ي est une **consonne** : يَ « ya ». Sans signe après une kasra, il **allonge** le son : بِي « bî ». Avec un soukoun après une fatha, il forme le son doux **« ay »** : بَيْ « bay ».',
        items: [vowelItem('ya', 'fatha'), maddItem('ba', 'kasra'), textItem('بَيْ', 'bay')],
        tips: ['بَيْنَ se lit « bayna » : entre.'],
      },
    }),
    tanwinLesson,
    dotsReview,
  ],
};

/* ════════════════════════════════════════════════════════════════════════
   Étape 3 — Les lettres qui ne s’attachent pas
   ════════════════════════════════════════════════════════════════════════ */

const NON_CONNECTING = ['alif', 'dal', 'dhal', 'ra', 'zay', 'waw'];

const attachReview = lesson({
  id: 'attachees',
  title: 'Attachée ou pas ?',
  subtitle: 'ا د ذ ر ز و',
  glyph: 'ر',
  type: 'review',
  steps: (rng) => {
    const connecting = ['ba', 'ta', 'tha', 'nun', 'ya'];
    const yesNo = (id: string): Draft => ({
      kind: 'choose',
      prompt: 'Cette lettre s’attache-t-elle à la lettre qui la suit ?',
      question: { ar: letter(id).char, sound: letterItem(id).sound },
      options: [
        { id: 'oui', text: 'Oui, des deux côtés' },
        { id: 'non', text: 'Non, seulement à droite' },
      ],
      answerId: NON_CONNECTING.includes(id) ? 'non' : 'oui',
      explain: 'ا د ذ ر ز و ne s’attachent jamais à la lettre suivante.',
    });
    const words = [...LESSON_WORDS.ra, ...LESSON_WORDS.dal, ...LESSON_WORDS.waw].map(wordItem);
    const positions = shuffle(words, rng)
      .map((w) => positionQuiz(w, ['ra', 'dal', 'waw'].find((id) => w.ar.includes(letter(id).char)) ?? 'ra'))
      .filter((q): q is Draft => q !== null)
      .slice(0, 3);
    return [
      {
        kind: 'intro',
        eyebrow: 'Révision',
        title: 'Les six lettres qui ne s’attachent pas',
        body: 'ا د ذ ر ز و s’attachent à la lettre **précédente**, jamais à la **suivante**. Après elles, le mot se « coupe » : la lettre suivante reprend sa forme de début.',
        items: NON_CONNECTING.map(letterItem),
        tips: ['نُورٌ : le ر suit un و, il s’écrit donc seul.'],
      },
      { kind: 'forms', title: 'Deux formes seulement', prompt: 'Elles n’ont qu’une forme seule et une forme finale.', letterIds: NON_CONNECTING },
      ...shuffle([...sample(NON_CONNECTING, 3, rng), ...sample(connecting, 3, rng)], rng).map(yesNo),
      ...positions,
    ];
  },
});

const MODULE_NON_CONNECTING: ModuleDraft = {
  id: 'non-attachees',
  index: 3,
  title: 'Les lettres qui ne s’attachent pas',
  titleAr: 'حُرُوفٌ لَا تَتَّصِلُ',
  description: 'ر د و ز ذ : des lettres qui coupent le mot, et le son doux « aw ».',
  lessons: [
    letterStep('ra', 'Une lettre qui ne s’attache pas', {
      notion: {
        eyebrow: 'Notion',
        title: 'Six lettres ne s’attachent pas',
        body: 'Comme l’alif, le **râ’** s’attache à la lettre d’avant mais **jamais à la suivante**. Six lettres se comportent ainsi : ا د ذ ر ز و. Tu les découvres dans cette étape.',
        items: NON_CONNECTING.map(letterItem),
        tips: ['نَارٌ : ن s’attache à ا, mais ا et ر restent séparés.'],
      },
    }),
    letterStep('dal', 'Ne s’attache pas non plus'),
    letterStep('waw', 'Consonne, voyelle longue et « aw »', {
      notion: {
        eyebrow: 'Notion',
        title: 'Le wâw, consonne ou voyelle',
        body: 'Avec une voyelle, و est une **consonne** : وَ « wa ». Sans signe après une damma, il **allonge** le son : بُو « boû ». Avec un soukoun après une fatha, il forme le son doux **« aw »** : ثَوْ « thaw ».',
        items: [vowelItem('waw', 'fatha'), maddItem('ba', 'damma'), textItem('ثَوْ', 'thaw')],
      },
    }),
    letterStep('zay', 'ز = ر + un point'),
    letterStep('dhal', 'ذ = د + un point'),
    attachReview,
  ],
};

/* ════════════════════════════════════════════════════════════════════════
   Étape 4 — Les lettres fréquentes
   ════════════════════════════════════════════════════════════════════════ */

const shaddaLesson = wordsLesson({
  id: 'chadda',
  title: 'La chadda',
  subtitle: 'Doubler une lettre',
  glyph: 'بّ',
  words: LESSON_WORDS.chadda,
  intro: {
    eyebrow: 'Nouveau signe',
    body: 'La **chadda** ressemble à un petit « w ». Elle **double** la lettre : la première est au soukoun, la seconde porte la voyelle. رَبِّ = رَبْ + بِ « rabbi ».',
    items: [textItem('رَبْ', 'rab'), textItem('بِ', 'bi'), textItem('رَبِّ', 'rabbi')],
    tips: ['Appuie sur la lettre doublée, sans la répéter deux fois.', 'Le nûn et le mîm avec chadda (نّ مّ) se prononcent avec une nasalisation de deux temps : la ghunna.'],
  },
  extra: (rng) => {
    const parts: [string, string, string][] = [
      ['ثُمْ', 'مَ', 'ثُمَّ'],
      ['مَدْ', 'دَ', 'مَدَّ'],
      ['نَزْ', 'زَ', 'نَزَّ'],
      ['ذَرْ', 'رَ', 'ذَرَّ'],
    ];
    const lines = parts.map((p) => p.map((t) => textItem(t)));
    const doubled = ['ba', 'ta', 'dal', 'ra', 'nun', 'mim', 'lam'].map((id) =>
      textItem(letter(id).char + MARKS.shadda + MARKS.fatha, `${letter(id).translit}${letter(id).translit}a`),
    );
    return [
      repeat('Décomposer la chadda', lines, 'Écoute les deux morceaux, puis la syllabe doublée.'),
      ...sample(doubled, 2, rng).map((it) => listen(it, doubled, rng, 3, 'Quelle lettre doublée as-tu entendue ?')),
    ];
  },
  highlight: { prompt: 'Retrouve la chadda dans le Coran.', spec: { marks: [MARKS.shadda], label: 'la chadda' }, goal: 5 },
});

const taMarbutaLesson = wordsLesson({
  id: 'ta-marbuta',
  title: 'Le tâ’ marbûṭa ة',
  subtitle: 'Un « t » qui ferme le mot',
  glyph: 'ة',
  words: LESSON_WORDS['ta-marbuta'],
  intro: {
    eyebrow: 'Notion',
    body: 'Le **tâ’ marbûṭa** ة ressemble au hâ’ avec deux points. On le trouve **seulement à la fin** des mots. Il se lit **« t »** quand on enchaîne, et **« h »** quand on s’arrête dessus.',
    items: [letterItem('ha'), textItem('ةَ', 'ta'), textItem('ةٌ', 'toun')],
    tips: ['كَلِمَةٌ se lit « kalimatoun » ; à l’arrêt : « kalimah ».', 'Il ne s’attache jamais à une lettre suivante : il est toujours le dernier.'],
  },
  highlight: { prompt: 'Retrouve le tâ’ marbûṭa dans le Coran.', spec: { letters: ['ة'], label: 'le tâ’ marbûṭa' }, goal: 3 },
});

const MODULE_FREQUENT: ModuleDraft = {
  id: 'frequentes',
  index: 4,
  title: 'Les lettres fréquentes',
  titleAr: 'حُرُوفٌ كَثِيرَةٌ',
  description: 'م ل ك ه س ش, la chadda et le tâ’ marbûṭa : de quoi lire de nombreux mots du Coran.',
  lessons: [
    letterStep('mim', 'Les lèvres fermées'),
    letterStep('lam', 'Et la ligature لا', {
      notion: {
        eyebrow: 'Notion',
        title: 'Lâm + alif = لا',
        body: 'Quand le lâm est suivi d’un alif, les deux lettres s’écrivent ensemble d’un seul trait : **لا** « lâ ». Ce n’est pas une nouvelle lettre, seulement une façon de les lier.',
        items: [letterItem('lam'), letterItem('alif'), textItem('لَا', 'lâ')],
      },
    }),
    shaddaLesson,
    letterStep('kaf', 'Un « k » léger'),
    letterStep('ha', 'Un souffle léger'),
    taMarbutaLesson,
    letterStep('sin', 'Trois petites dents'),
    letterStep('shin', 'Trois dents, trois points'),
  ],
};

/* ════════════════════════════════════════════════════════════════════════
   Étape 5 — La gorge et la hamza
   ════════════════════════════════════════════════════════════════════════ */

const hamzaLesson = wordsLesson({
  id: 'hamza',
  title: 'La hamza ء',
  subtitle: 'Le coup de glotte et ses supports',
  glyph: 'ء',
  words: LESSON_WORDS.hamza,
  intro: {
    eyebrow: 'Notion',
    body: 'La **hamza** est un coup de glotte. Elle s’écrit seule (ء) ou posée sur un support : l’alif (أ / إ), le wâw (ؤ) ou un yâ’ sans points (ئ). C’est elle qui porte la voyelle au début des mots : أَحَدٌ.',
    items: [textItem('أَ', 'a'), textItem('إِ', 'i'), textItem('أُ', 'ou'), textItem('ؤ'), textItem('ئ')],
  },
  extra: () => [{ kind: 'letter', letterId: 'hamza' }],
  highlight: { prompt: 'Retrouve la hamza dans le Coran.', spec: { letters: ['ء', 'أ', 'إ', 'ؤ', 'ئ'], label: 'la hamza' }, goal: 3 },
});

const alifMaqsuraLesson = wordsLesson({
  id: 'alif-maqsura',
  title: 'L’alif maqsûra ى',
  subtitle: 'Un « â » final écrit avec un yâ’',
  glyph: 'ى',
  words: LESSON_WORDS['alif-maqsura'],
  intro: {
    eyebrow: 'Notion',
    body: 'À la fin de certains mots, le son long **« â »** s’écrit avec un **yâ’ sans points** : ى. On l’appelle **alif maqsûra**. هُدًى « houdan », مُوسَى « moûsâ ».',
    tips: ['Dans le Mushaf, il porte souvent un petit alif : مُوسَىٰ.'],
  },
  highlight: { prompt: 'Retrouve l’alif maqsûra dans le Coran.', spec: { letters: ['ى'], label: 'l’alif maqsûra' }, goal: 3 },
});

const MODULE_THROAT: ModuleDraft = {
  id: 'gorge',
  index: 5,
  title: 'La gorge et la hamza',
  titleAr: 'حُرُوفُ ٱلْحَلْقِ',
  description: 'ق ج ح خ, la hamza et l’alif maqsûra.',
  lessons: [
    letterStep('qaf', 'Un « q » profond'),
    letterStep('jim', 'Un « dj » doux'),
    letterStep('hha', 'Un souffle de la gorge'),
    letterStep('kha', 'Un « kh » râpeux'),
    hamzaLesson,
    alifMaqsuraLesson,
  ],
};

/* ════════════════════════════════════════════════════════════════════════
   Étape 6 — Le soleil et la lune
   ════════════════════════════════════════════════════════════════════════ */

const articleLesson = lesson({
  id: 'article',
  title: 'Le soleil et la lune',
  subtitle: 'L’article « al » : lettres lunaires et solaires',
  glyph: 'ٱلْ',
  xp: 30,
  steps: (rng) => {
    const qamari = WORDS_QAMARI.map(wordItem);
    const shamsi = WORDS_SHAMSI.map(wordItem);
    const sort = (it: Item, solar: boolean): Draft => ({
      kind: 'choose',
      prompt: 'Lettre lunaire ou lettre solaire ?',
      question: { ar: it.ar, sound: it.sound, caption: it.label },
      options: [
        { id: 'lune', text: 'Lunaire : on entend le ل' },
        { id: 'soleil', text: 'Solaire : le ل disparaît' },
      ],
      answerId: solar ? 'soleil' : 'lune',
      explain: solar ? 'Le ل ne se prononce pas : la lettre suivante porte une chadda.' : 'Le ل porte un soukoun et se prononce.',
    });
    return [
      {
        kind: 'intro',
        eyebrow: 'L’article',
        title: 'ٱلْ : « le, la, les »',
        body: 'L’article **ٱلْ** se place devant un nom. Si la première lettre du nom est **lunaire** (قَمَرِيَّة), on entend le ل : ٱلْقَمَرُ « al-qamarou ». Si elle est **solaire** (شَمْسِيَّة), le ل ne se prononce plus : il se transforme en la lettre suivante, qui porte alors une **chadda** : ٱلشَّمْسُ « ash-shamsou ».',
        items: [qamari[0], shamsi[0]],
        tips: ['Le ب est donc lunaire : ٱلْبَيْتِ', 'Le ت est solaire : ٱلتِّينِ', 'Le petit signe sur l’alif (ٱ) indique un alif de liaison, que tu étudieras bientôt.'],
      },
      discover('Lettres lunaires : le ل se prononce', qamari),
      discover('Lettres solaires : le ل disparaît', shamsi),
      repeat('Lune ou soleil', chunk(shuffle([...qamari.slice(0, 3), ...shamsi.slice(0, 3)], rng), 3)),
      ...shuffle([...sample(qamari, 3, rng).map((it) => sort(it, false)), ...sample(shamsi, 3, rng).map((it) => sort(it, true))], rng),
      ...sample([...qamari, ...shamsi], 2, rng).map((it) => listen(it, [...qamari, ...shamsi], rng, 4, 'Quel mot as-tu entendu ?')),
      mushaf('Retrouve le lâm solaire, écrit mais non prononcé.', { rules: ['laam_shamsiyah'], label: 'le lâm solaire' }, 3),
    ];
  },
});

const waslLesson = wordsLesson({
  id: 'wasl',
  title: 'L’alif de liaison ٱ',
  subtitle: 'Prononcé au début, muet en liaison',
  glyph: 'ٱ',
  words: LESSON_WORDS.wasl,
  intro: {
    eyebrow: 'Notion',
    body: 'L’alif surmonté d’un petit ṣâd (**ٱ**) est un **alif de liaison**. On le prononce seulement quand on **commence** la lecture par lui. Au milieu d’une phrase, il **disparaît** : on lie directement les mots. بِسْمِ ٱللَّهِ se lit « bismi-llâhi ».',
    tips: ['Sa voyelle de départ peut être « a » (ٱلْكِتَابُ), « i » (ٱقْرَأْ) ou « ou » selon le mot.'],
  },
  highlight: { prompt: 'Retrouve les alifs de liaison muets (ٱ en milieu de phrase).', spec: { rules: ['ham_wasl'], label: 'l’alif de liaison' }, goal: 3 },
});

const MODULE_ARTICLE: ModuleDraft = {
  id: 'soleil-lune',
  index: 6,
  title: 'Le soleil et la lune',
  titleAr: 'ٱلشَّمْسُ وَٱلْقَمَرُ',
  description: 'L’article, les lettres lunaires et solaires, le fâ’ et l’alif de liaison.',
  lessons: [
    articleLesson,
    letterStep('fa', 'Un point au-dessus de la boucle', {
      notion: {
        eyebrow: 'Astuce',
        title: 'Le fâ’ et le qâf',
        body: 'Le **fâ’** ressemble au qâf : le fâ’ a **un point**, le qâf en a **deux**. Remarque aussi que dans فِي, le ف peut s’écrire au-dessus du ي dans certaines écritures.',
        items: [letterItem('fa'), letterItem('qaf')],
      },
    }),
    waslLesson,
  ],
};

/* ════════════════════════════════════════════════════════════════════════
   Étape 7 — Les dernières lettres
   ════════════════════════════════════════════════════════════════════════ */

const HEAVY = ['kha', 'sad', 'dad', 'taa', 'dhaa', 'ghayn', 'qaf'];

const heavyLesson = lesson({
  id: 'epaisses',
  title: 'Les lettres épaisses',
  subtitle: 'Le tafkhîm',
  glyph: 'قَ',
  type: 'review',
  steps: (rng) => {
    const lines = HEAVY.map((id) => VOWEL_IDS.map((v) => vowelRow([id], v)[0]));
    const pairs = [
      ['ta', 'taa'],
      ['sin', 'sad'],
      ['dal', 'dad'],
      ['kaf', 'qaf'],
      ['dhal', 'dhaa'],
    ].map(([a, b]) => [vowelRow([a], 'fatha')[0], vowelRow([b], 'fatha')[0]]);
    return [
      {
        kind: 'intro',
        eyebrow: 'Tajweed',
        title: 'Les 7 lettres épaisses',
        body: 'خ ص ض ط ظ غ ق sont toujours **épaisses** : le fond de la langue se relève et le son devient plein, presque « o ». Leurs voisines légères restent fines.',
        items: HEAVY.map(letterItem),
        tips: ['Formule à retenir : خُصَّ ضَغْطٍ قِظْ', 'تَ (léger) ≠ طَ (épais) · سَ ≠ صَ · دَ ≠ ضَ'],
      },
      repeat('Léger ou épais ?', pairs),
      repeat('Les lettres épaisses avec les voyelles', lines),
      ...shuffle(pairs, rng).map((p) => listen(p[Math.floor(rng() * 2)], p, rng, 2, 'Léger ou épais ?')),
      mushaf('Retrouve les lettres épaisses dans le Coran.', { rules: ['tafkhim'], label: 'l’emphase' }, 4),
    ];
  },
});

const qalqalaLesson = lesson({
  id: 'qalqala',
  title: 'La qalqala',
  subtitle: 'Le rebond de قطب جد',
  glyph: 'قْ',
  steps: (rng) => {
    const ids = ['qaf', 'taa', 'ba', 'jim', 'dal'];
    const row = ids.map((id) => sukunItem(id, 'fatha'));
    const lines = ids.map((id) => VOWEL_IDS.map((v) => sukunItem(id, v)));
    return [
      {
        kind: 'intro',
        eyebrow: 'Tajweed',
        title: 'La qalqala قَلْقَلَة',
        body: 'Cinq lettres — ق ط ب ج د (« qoṭbou jad ») — produisent un léger **rebond** sonore lorsqu’elles portent un soukoun. Écoute : أَقْ, أَطْ, أَبْ.',
        items: row,
        tips: ['Le rebond est plus fort en fin de verset, à l’arrêt.'],
      },
      repeat('Écoute le rebond', lines),
      ...sample(row, 3, rng).map((it) => listen(it, row, rng)),
      mushaf('Retrouve la qalqala dans le Coran.', { rules: ['qalaqah'], label: 'la qalqala' }, 3),
    ];
  },
});

const MODULE_LAST: ModuleDraft = {
  id: 'dernieres',
  index: 7,
  title: 'Les dernières lettres',
  titleAr: 'آخِرُ ٱلْحُرُوفِ',
  description: 'ع غ ص ض ط ظ, les lettres épaisses et la qalqala.',
  lessons: [
    letterStep('ayn', 'Le son de la gorge resserrée'),
    letterStep('ghayn', 'ع + un point'),
    letterStep('sad', 'Un « s » épais'),
    letterStep('dad', 'ص + un point'),
    letterStep('taa', 'Un « t » épais'),
    letterStep('dhaa', 'ط + un point'),
    heavyLesson,
    qalqalaLesson,
  ],
};

/* ════════════════════════════════════════════════════════════════════════
   Étape 8 — Lire le Mushaf
   ════════════════════════════════════════════════════════════════════════ */

const smallLettersLesson = wordsLesson({
  id: 'petites-lettres',
  title: 'Les petites lettres du Mushaf',
  subtitle: 'ـٰ ۥ ۦ : l’alif suscrit',
  glyph: 'مَٰ',
  words: LESSON_WORDS['petites-lettres'],
  intro: {
    eyebrow: 'Écriture du Mushaf',
    body: 'Dans le Mushaf, certaines voyelles longues s’écrivent avec une **petite lettre** : l’alif suscrit (ـٰ) se lit « â », le petit wâw (ۥ) « oû » et le petit yâ’ (ۦ) « î ». مَٰلِكِ se lit « mâliki ».',
  },
  highlight: {
    prompt: 'Retrouve l’alif suscrit et les petites lettres dans le Coran.',
    spec: { marks: [MARKS.daggerAlif, MARKS.smallWaw, MARKS.smallYa], label: 'les petites lettres' },
    goal: 3,
  },
});

const sentencesLesson = lesson({
  id: 'phrases',
  title: 'Lire des phrases',
  subtitle: 'Toutes les notions réunies',
  glyph: 'قَرَأَ',
  xp: 30,
  steps: (rng) => {
    const sentences = SENTENCES.map((s) => ({ fr: s.fr, items: s.words.map(wordItem) }));
    const all = sentences.flatMap((s) => s.items);
    return [
      {
        kind: 'intro',
        eyebrow: 'Lecture suivie',
        title: 'Tu sais lire !',
        body: 'Tu connais toutes les lettres et tous les signes. Lis maintenant des phrases entières, mot après mot. Attention aux **liaisons** : l’alif de liaison ٱ ne se prononce pas au milieu d’une phrase.',
        tips: ['إِلَى ٱلْمَدْرَسَةِ se lit « ilal-madrasati ».'],
      },
      ...sentences.map((s, i) => repeat(`Phrase ${i + 1}`, [s.items], `« ${s.fr} » Lance la lecture guidée, puis relis la phrase seul.`)),
      ...sample(all, 3, rng).map((it) => listen(it, all, rng, 4, 'Quel mot as-tu entendu ?')),
      match(sample(all, 4, rng), rng, 'Associe chaque mot à sa lecture'),
    ];
  },
});

function surahLesson(opts: {
  id: string;
  title: string;
  subtitle: string;
  glyph: string;
  surah: number;
  ayat: number[];
  intro: string;
  order?: number[];
  highlight: { prompt: string; spec: HighlightSpec; goal: number; from: number; to: number };
}): LessonDraft {
  return lesson({
    id: opts.id,
    title: opts.title,
    subtitle: opts.subtitle,
    glyph: opts.glyph,
    type: 'quran',
    xp: 30,
    steps: (rng) => {
      const listenAyat = sample(opts.ayat, Math.min(2, opts.ayat.length), rng);
      return [
        { kind: 'intro', eyebrow: 'Lecture du Coran', title: opts.title, body: opts.intro },
        ...opts.ayat.map(
          (ayah): Draft => ({
            kind: 'verse',
            surah: opts.surah,
            ayah,
            prompt: 'Écoute chaque mot, puis lis le verset à voix haute.',
          }),
        ),
        ...listenAyat.map(
          (ayah): Draft => ({
            kind: 'verse-listen',
            surah: opts.surah,
            ayah,
            prompt: 'Quel mot as-tu entendu ?',
          }),
        ),
        ...(opts.order ?? []).map(
          (ayah): Draft => ({
            kind: 'verse-order',
            surah: opts.surah,
            ayah,
            prompt: 'Remets les mots du verset dans l’ordre (de droite à gauche).',
          }),
        ),
        mushaf(opts.highlight.prompt, opts.highlight.spec, opts.highlight.goal, {
          passage: { surah: opts.surah, from: opts.highlight.from, to: opts.highlight.to },
        }),
      ];
    },
  });
}

const tajweedColors = lesson({
  id: 'tajweed-couleurs',
  title: 'Le Tajweed en couleurs',
  subtitle: 'Lire le code couleur du Mushaf',
  glyph: 'مَدّ',
  type: 'quran',
  xp: 30,
  steps: () => [
    {
      kind: 'intro',
      eyebrow: 'Mushaf Tajweed',
      title: 'Les couleurs du Tajweed',
      body: 'Dans un Mushaf Tajweed, chaque couleur signale une règle : les tons rouges et orangés indiquent les allongements (madd), le vert la nasalisation (ghunna), le bleu la qalqala, le gris les lettres non prononcées.',
      tips: ['Active ou désactive les couleurs à tout moment depuis la Vue Mushaf.'],
    },
    mushaf('Repère les allongements (tons rouges et orangés) dans Al-Fâtiha.', { rules: ['madda_normal', 'madda_permissible', 'madda_obligatory', 'madda_necessary'], label: 'le madd' }, 4, {
      passage: { surah: 1, from: 1, to: 7 },
      tajweed: true,
    }),
    mushaf('Repère la nasalisation (tons verts et violets) dans An-Nâs.', { rules: ['ghunnah', 'ikhafa', 'idgham_ghunnah', 'iqlab'], label: 'la nasalisation' }, 3, {
      passage: { surah: 114, from: 1, to: 6 },
      tajweed: true,
    }),
    mushaf('Repère la qalqala (en bleu) dans Al-Falaq.', { rules: ['qalaqah'], label: 'la qalqala' }, 3, {
      passage: { surah: 113, from: 1, to: 5 },
      tajweed: true,
    }),
    mushaf('Repère les lettres non prononcées (en gris) dans Al-Ikhlâs.', { rules: ['ham_wasl', 'laam_shamsiyah', 'slnt'], label: 'les lettres muettes' }, 3, {
      passage: { surah: 112, from: 1, to: 4 },
      tajweed: true,
    }),
  ],
});

const MODULE_QURAN: ModuleDraft = {
  id: 'mushaf',
  index: 8,
  title: 'Lire le Mushaf',
  titleAr: 'نَقْرَأُ ٱلْمُصْحَفَ',
  description: 'Les petites lettres du Mushaf, la lecture suivie, puis tes premières sourates mot à mot.',
  lessons: [
    smallLettersLesson,
    sentencesLesson,
    surahLesson({
      id: 'fatiha-1',
      title: 'Al-Fâtiha (1)',
      subtitle: 'Versets 1 à 4',
      glyph: 'ٱلْحَمْدُ',
      surah: 1,
      ayat: [1, 2, 3, 4],
      order: [4],
      intro: 'Al-Fâtiha, « L’Ouverture », est la sourate que tout musulman récite dans chaque prière. Lis-la mot à mot : touche un mot pour entendre sa prononciation exacte.',
      highlight: { prompt: 'Retrouve le lâm solaire dans Al-Fâtiha.', spec: { rules: ['laam_shamsiyah'], label: 'le lâm solaire' }, goal: 3, from: 1, to: 4 },
    }),
    surahLesson({
      id: 'fatiha-2',
      title: 'Al-Fâtiha (2)',
      subtitle: 'Versets 5 à 7',
      glyph: 'ٱهْدِنَا',
      surah: 1,
      ayat: [5, 6, 7],
      order: [5, 6],
      intro: 'Termine Al-Fâtiha. Attention aux voyelles longues et à la chadda de إِيَّاكَ.',
      highlight: { prompt: 'Retrouve la chadda dans la fin d’Al-Fâtiha.', spec: { marks: [MARKS.shadda], label: 'la chadda' }, goal: 4, from: 5, to: 7 },
    }),
    surahLesson({
      id: 'ikhlas',
      title: 'Al-Ikhlâs',
      subtitle: 'Le monothéisme pur',
      glyph: 'أَحَدٌ',
      surah: 112,
      ayat: [1, 2, 3, 4],
      order: [1, 3],
      intro: 'Al-Ikhlâs (112) affirme l’unicité d’Allah. Remarque la qalqala sur le dâl : أَحَدٌ, ٱلصَّمَدُ, يَلِدْ.',
      highlight: { prompt: 'Retrouve la qalqala dans Al-Ikhlâs.', spec: { rules: ['qalaqah'], label: 'la qalqala' }, goal: 4, from: 1, to: 4 },
    }),
    surahLesson({
      id: 'falaq',
      title: 'Al-Falaq',
      subtitle: 'L’aube naissante',
      glyph: 'ٱلْفَلَقِ',
      surah: 113,
      ayat: [1, 2, 3, 4, 5],
      order: [2],
      intro: 'Al-Falaq (113) est une demande de protection. Lis attentivement les lettres épaisses et les lettres liées.',
      highlight: { prompt: 'Retrouve les lettres épaisses dans Al-Falaq.', spec: { rules: ['tafkhim'], label: 'l’emphase' }, goal: 4, from: 1, to: 5 },
    }),
    surahLesson({
      id: 'nas',
      title: 'An-Nâs',
      subtitle: 'Les hommes',
      glyph: 'ٱلنَّاسِ',
      surah: 114,
      ayat: [1, 2, 3, 4, 5, 6],
      order: [2, 3],
      intro: 'An-Nâs (114) clôt le Coran. La lettre sîn y revient comme un murmure : ٱلنَّاسِ, ٱلْوَسْوَاسِ, ٱلْخَنَّاسِ.',
      highlight: { prompt: 'Retrouve toutes les lettres sîn س dans An-Nâs.', spec: { letters: ['س'], label: 'la lettre sîn' }, goal: 6, from: 1, to: 6 },
    }),
    tajweedColors,
  ],
};

/* ════════════════════════════════════════════════════════════════════════ */

const DRAFTS: ModuleDraft[] = [
  MODULE_SYSTEM,
  MODULE_BA,
  MODULE_NON_CONNECTING,
  MODULE_FREQUENT,
  MODULE_THROAT,
  MODULE_ARTICLE,
  MODULE_LAST,
  MODULE_QURAN,
];

export const MODULES: Module[] = DRAFTS.map((m) => ({
  ...m,
  lessons: m.lessons.map((l) => ({ ...l, moduleId: m.id })),
}));

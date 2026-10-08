import { MARKS } from '@/lib/arabic';
import { letter, SHAPE_FAMILIES, SOUND_PAIRS } from '@/data/letters';
import { sample, shuffle } from '@/lib/random';
import {
  ALPHABET_IDS,
  build,
  chunk,
  confusables,
  discover,
  formItems,
  lesson,
  letterGroupLesson,
  listen,
  match,
  mushaf,
  readChoice,
  repeat,
  vowelRow,
  type Draft,
  type LessonDraft,
} from './builders';
import {
  letterItem,
  maddItem,
  shaddaItem,
  sukunItem,
  syllableItems,
  tanwinItem,
  textItem,
  VOWELS,
  VOWEL_IDS,
  wordItem,
  type VowelId,
  type WordEntry,
} from './items';
import {
  WORDS_DAGGER,
  WORDS_GHUNNA,
  WORDS_LIN,
  WORDS_MADD,
  WORDS_QAMARI,
  WORDS_SHADDA,
  WORDS_SHAMSI,
  WORDS_SHORT_VOWELS,
  WORDS_SUKUN,
  WORDS_TANWIN,
  WORDS_WASL,
} from './words';
import type { HighlightSpec } from '@/features/mushaf/highlight';
import type { Passage } from '@/features/mushaf/passage';
import type { Item, Module } from './types';

interface ModuleDraft extends Omit<Module, 'lessons'> {
  lessons: LessonDraft[];
}

/* ════════════════════════════════════════════════════════════════════════
   Étape 1 — Les lettres isolées
   ════════════════════════════════════════════════════════════════════════ */

const LETTER_GROUPS: { ids: string[]; title: string; subtitle: string }[] = [
  { ids: ['alif', 'ba', 'ta', 'tha'], title: 'Alif, Bâ, Tâ, Thâ', subtitle: 'Les premières lettres et leurs points' },
  { ids: ['jim', 'hha', 'kha'], title: 'Jîm, Ḥâ, Khâ', subtitle: 'Une même forme, trois sons' },
  { ids: ['dal', 'dhal', 'ra', 'zay'], title: 'Dâl, Dhâl, Râ, Zây', subtitle: 'Quatre lettres qui ne se lient pas à gauche' },
  { ids: ['sin', 'shin', 'sad', 'dad'], title: 'Sîn, Shîn, Ṣâd, Ḍâd', subtitle: 'Les dents et les lettres épaisses' },
  { ids: ['taa', 'dhaa', 'ayn', 'ghayn'], title: 'Ṭâ, Ẓâ, ‘Ayn, Ghayn', subtitle: 'Emphase et sons de la gorge' },
  { ids: ['fa', 'qaf', 'kaf', 'lam'], title: 'Fâ, Qâf, Kâf, Lâm', subtitle: 'Des boucles et des crochets' },
  { ids: ['mim', 'nun', 'ha', 'waw', 'ya'], title: 'Mîm, Nûn, Hâ, Wâw, Yâ', subtitle: 'Les dernières lettres de l’alphabet' },
];

const shapesReview = lesson({
  id: 'lettres-soeurs',
  title: 'Les lettres sœurs',
  subtitle: 'Même squelette, points différents',
  glyph: 'ث',
  type: 'review',
  steps: (rng) => {
    const steps: Draft[] = [
      {
        kind: 'intro',
        eyebrow: 'Révision',
        title: 'Les points font la différence',
        body: 'Plusieurs lettres partagent le même squelette : seuls le nombre et la position des points les distinguent. Observe bien chaque famille.',
        items: ['ba', 'ta', 'tha', 'nun', 'ya'].map(letterItem),
        tips: ['Un point dessous : ب', 'Deux points dessus : ت', 'Trois points dessus : ث'],
      },
    ];
    for (const fam of SHAPE_FAMILIES.slice(0, 5)) {
      steps.push(discover('Famille de lettres', fam.map(letterItem)));
    }
    for (const fam of shuffle(SHAPE_FAMILIES, rng)) {
      const items = fam.map(letterItem);
      const target = items[Math.floor(rng() * items.length)];
      steps.push(listen(target, items, rng, Math.min(4, items.length)));
    }
    const all = SHAPE_FAMILIES.flat().map(letterItem);
    steps.push(match(sample(all, 4, rng), rng, 'Associe chaque lettre à son nom'));
    return steps;
  },
});

const soundsReview = lesson({
  id: 'sons-proches',
  title: 'Les sons proches',
  subtitle: 'Léger ou épais, gorge ou palais',
  glyph: 'ط',
  type: 'review',
  steps: (rng) => {
    const pairs = SOUND_PAIRS.map(([a, b]) => [vowelRow([a], 'fatha')[0], vowelRow([b], 'fatha')[0]]);
    const steps: Draft[] = [
      {
        kind: 'intro',
        eyebrow: 'Écoute attentive',
        title: 'Entraîne ton oreille',
        body: 'Certaines lettres se ressemblent à l’oreille. Les lettres épaisses (ص ض ط ظ ق خ غ) se prononcent bouche arrondie, la voix pleine ; leurs voisines légères restent fines.',
        items: pairs.flat().slice(0, 6),
        tips: ['تَ (léger) ≠ طَ (épais)', 'سَ (léger) ≠ صَ (épais)', 'هَ (souffle léger) ≠ حَ (gorge)'],
      },
      repeat('Paires de sons', pairs),
    ];
    for (const pair of shuffle(pairs, rng)) {
      steps.push(listen(pair[Math.floor(rng() * 2)], pair, rng, 2, 'Léger ou épais ? Choisis le son entendu'));
    }
    steps.push(
      mushaf('Repère les lettres épaisses (tafkhîm) dans le Coran.', { rules: ['tafkhim'], label: 'les lettres épaisses' }, 4),
    );
    return steps;
  },
});

const hamzaLesson = lesson({
  id: 'hamza',
  title: 'La Hamza',
  subtitle: 'Le coup de glotte et ses supports',
  glyph: 'ء',
  steps: (rng) => {
    const seats = [textItem('أَ', 'a'), textItem('إِ', 'i'), textItem('أُ', 'ou'), textItem('ءَ', 'a')];
    return [
      {
        kind: 'intro',
        eyebrow: 'Signe spécial',
        title: 'La hamza ء',
        body: 'La hamza est un coup de glotte. Elle s’écrit seule (ء) ou posée sur un support : l’alif (أ / إ), le wâw (ؤ) ou le yâ’ sans points (ئ). C’est elle qui porte la voyelle au début des mots comme أَحَدٌ.',
        hero: letterItem('hamza'),
        items: [textItem('أ'), textItem('إ'), textItem('ؤ'), textItem('ئ')],
      },
      { kind: 'letter', letterId: 'hamza' },
      discover('La hamza avec une voyelle', seats),
      listen(seats[1], seats, rng, 3),
      listen(seats[2], seats, rng, 3),
      mushaf('Retrouve la hamza dans le texte coranique.', { letters: ['ء'], label: 'la hamza' }, 3),
    ];
  },
});

const MODULE_LETTERS: ModuleDraft = {
  id: 'lettres',
  index: 1,
  title: 'Les lettres isolées',
  titleAr: 'ٱلْحُرُوفُ',
  description: 'Les 28 lettres de l’alphabet : leur nom, leur son et leur forme.',
  lessons: [
    ...LETTER_GROUPS.map((g, i) =>
      letterGroupLesson({ id: `lettres-${i + 1}`, letterIds: g.ids, title: g.title, subtitle: g.subtitle }),
    ),
    hamzaLesson,
    shapesReview,
    soundsReview,
  ],
};

/* ════════════════════════════════════════════════════════════════════════
   Étape 2 — Les voyelles courtes
   ════════════════════════════════════════════════════════════════════════ */

const VOWEL_TEXT: Record<VowelId, { body: string; tip: string }> = {
  fatha: {
    body: 'La fatha est un petit trait oblique posé AU-DESSUS de la lettre. Elle donne le son « a » : بَ se lit « ba ».',
    tip: 'Bouche ouverte, son bref.',
  },
  kasra: {
    body: 'La kasra est un petit trait oblique placé EN DESSOUS de la lettre. Elle donne le son « i » : بِ se lit « bi ».',
    tip: 'Lèvres étirées, son bref.',
  },
  damma: {
    body: 'La damma est un petit wâw (ـُ) posé AU-DESSUS de la lettre. Elle donne le son « ou » : بُ se lit « bou ».',
    tip: 'Lèvres arrondies, son bref.',
  },
};

function vowelLesson(vowel: VowelId): LessonDraft {
  const v = VOWELS[vowel];
  return lesson({
    id: `voyelle-${vowel}`,
    title: `La ${v.name}`,
    subtitle: `${v.nameAr} — le son « ${v.sound} »`,
    glyph: vowelRow(['ba'], vowel)[0].ar,
    steps: (rng) => {
      const row = vowelRow(ALPHABET_IDS, vowel);
      const head = row.slice(0, 10);
      // Distracteurs : d’abord les lettres faciles à confondre, complétées au hasard.
      const quizPool = (i: number): Item[] => {
        const near = confusables(ALPHABET_IDS[i]).map((id) => vowelRow([id], vowel)[0]);
        return near.length >= 3 ? near : [...near, ...sample(row.filter((_, j) => j !== i), 3 - near.length, rng)];
      };
      const quizIdx = sample(
        row.map((_, i) => i),
        5,
        rng,
      );
      return [
        {
          kind: 'intro',
          eyebrow: 'Voyelle courte',
          title: `La ${v.name} ${v.nameAr}`,
          body: VOWEL_TEXT[vowel].body,
          hero: vowelRow(['ba'], vowel)[0],
          tips: [VOWEL_TEXT[vowel].tip, 'Une voyelle courte dure un seul temps.'],
        },
        discover(`Les syllabes en « ${v.sound} »`, head),
        repeat('Tout l’alphabet', chunk(row, 7)),
        ...quizIdx.slice(0, 3).map((i) => listen(row[i], quizPool(i), rng)),
        ...quizIdx.slice(3).map((i) => readChoice(row[i], row, rng)),
        match(sample(row, 4, rng), rng),
        mushaf(
          `Repère la ${v.name} dans le texte coranique.`,
          { marks: [v.mark], label: `la ${v.name}` },
          5,
        ),
      ];
    },
  });
}

const threeVowels = lesson({
  id: 'trois-voyelles',
  title: 'Les trois voyelles',
  subtitle: 'a · i · ou sur une même lettre',
  glyph: 'بُ',
  steps: (rng) => {
    const ids = ['ba', 'ta', 'jim', 'dal', 'sin', 'ayn', 'qaf', 'mim', 'nun', 'ha'];
    const lines = ids.map((id) => VOWEL_IDS.map((v) => vowelRow([id], v)[0]));
    const quizzes = sample(lines, 5, rng).map((line) =>
      listen(line[Math.floor(rng() * 3)], line, rng, 3, 'Quelle voyelle as-tu entendue ?'),
    );
    return [
      {
        kind: 'intro',
        eyebrow: 'Synthèse',
        title: 'Fatha, kasra, damma',
        body: 'Une même lettre change de son selon sa voyelle. Entraîne-toi à passer de l’une à l’autre : بَ بِ بُ.',
        items: lines[0],
      },
      repeat('Lecture en trois temps', lines.slice(0, 6)),
      ...quizzes,
      ...sample(lines.flat(), 3, rng).map((it) => readChoice(it, lines.flat(), rng)),
      match(sample(lines.flat(), 4, rng), rng),
      mushaf('Choisis une voyelle et retrouve-la dans le Coran.', { marks: [MARKS.fatha], label: 'la Fatha' }, 4, {
        filters: VOWEL_IDS.map((v) => ({
          label: VOWELS[v].name,
          highlight: { marks: [VOWELS[v].mark], label: `la ${VOWELS[v].name}` },
        })),
      }),
    ];
  },
});

const heavyLetters = lesson({
  id: 'lettres-epaisses',
  title: 'Lettres épaisses',
  subtitle: 'Le tafkhîm avec les voyelles',
  glyph: 'قَ',
  type: 'review',
  steps: (rng) => {
    const heavy = ['kha', 'sad', 'dad', 'taa', 'dhaa', 'ghayn', 'qaf'];
    const lines = heavy.map((id) => VOWEL_IDS.map((v) => vowelRow([id], v)[0]));
    const pairs = [
      ['ta', 'taa'],
      ['sin', 'sad'],
      ['dal', 'dad'],
      ['kaf', 'qaf'],
    ].map(([a, b]) => [vowelRow([a], 'fatha')[0], vowelRow([b], 'fatha')[0]]);
    return [
      {
        kind: 'intro',
        eyebrow: 'Tajweed',
        title: 'Les 7 lettres d’élévation',
        body: 'خ ص ض ط ظ غ ق sont toujours épaisses : le fond de la langue se relève. Leur fatha sonne plus grave, presque « o » : قَ, صَ, طَ.',
        items: heavy.map(letterItem),
        tips: ['Formule mnémotechnique : خُصَّ ضَغْطٍ قِظْ'],
      },
      repeat('Les lettres épaisses voyellées', lines),
      ...pairs.map((p) => listen(p[Math.floor(rng() * 2)], p, rng, 2, 'Léger ou épais ?')),
      mushaf('Retrouve les lettres épaisses dans le Coran.', { rules: ['tafkhim'], label: 'l’emphase' }, 4),
    ];
  },
});

const MODULE_VOWELS: ModuleDraft = {
  id: 'voyelles',
  index: 2,
  title: 'Les voyelles courtes',
  titleAr: 'ٱلْحَرَكَاتُ',
  description: 'Fatha, kasra et damma : donner une voix aux lettres.',
  lessons: [vowelLesson('fatha'), vowelLesson('kasra'), vowelLesson('damma'), threeVowels, heavyLetters],
};

/* ════════════════════════════════════════════════════════════════════════
   Étape 3 — Le soukoun
   ════════════════════════════════════════════════════════════════════════ */

const SUKUN_IDS = ALPHABET_IDS.filter((id) => !['alif', 'waw', 'ya'].includes(id));

const sukunIntro = lesson({
  id: 'soukoun-1',
  title: 'Le soukoun',
  subtitle: 'Une lettre sans voyelle',
  glyph: 'بْ',
  steps: (rng) => {
    const row = SUKUN_IDS.map((id) => sukunItem(id, 'fatha'));
    return [
      {
        kind: 'intro',
        eyebrow: 'Nouveau signe',
        title: 'Le soukoun ـْ',
        body: 'Le soukoun est un petit cercle posé au-dessus de la lettre. Il indique l’absence de voyelle : la lettre s’appuie sur la voyelle qui la précède. أَبْ se lit « ab ».',
        hero: sukunItem('ba'),
        tips: ['On ne commence jamais un mot par une lettre au soukoun.'],
      },
      discover('Lettres au soukoun', row.slice(0, 9)),
      repeat('Lecture continue', chunk(row, 5)),
      ...sample(row, 3, rng).map((it) => listen(it, row, rng)),
      ...sample(row, 2, rng).map((it) => readChoice(it, row, rng)),
      mushaf('Repère le soukoun dans le texte coranique.', { marks: [MARKS.sukun], label: 'le soukoun' }, 5),
    ];
  },
});

const sukunVowels = lesson({
  id: 'soukoun-2',
  title: 'Soukoun et voyelles',
  subtitle: 'ab · ib · oub',
  glyph: 'أُبْ',
  steps: (rng) => {
    const ids = ['ba', 'ta', 'dal', 'ra', 'sin', 'lam', 'mim', 'nun', 'fa', 'kaf'];
    const lines = ids.map((id) => VOWEL_IDS.map((v) => sukunItem(id, v)));
    return [
      {
        kind: 'intro',
        eyebrow: 'Combinaison',
        title: 'Le soukoun après chaque voyelle',
        body: 'La voyelle qui précède la lettre au soukoun change tout : أَبْ « ab », إِبْ « ib », أُبْ « oub ».',
        items: lines[0],
      },
      repeat('Lecture en trois temps', lines.slice(0, 6)),
      ...sample(lines, 4, rng).map((line) => listen(line[Math.floor(rng() * 3)], line, rng, 3)),
      match(sample(lines.flat(), 4, rng), rng),
    ];
  },
});

const qalqala = lesson({
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
        body: 'Cinq lettres — ق ط ب ج د (« qoṭbou jad ») — produisent un léger rebond sonore lorsqu’elles portent un soukoun. Écoute : أَقْ, أَطْ, أَبْ.',
        items: row,
        tips: ['Le rebond est plus fort en fin de verset (arrêt).'],
      },
      repeat('Écoute le rebond', lines),
      ...sample(row, 3, rng).map((it) => listen(it, row, rng)),
      mushaf('Retrouve les lettres de qalqala dans le Coran.', { rules: ['qalaqah'], label: 'la qalqala' }, 3),
    ];
  },
});

const MODULE_SUKUN: ModuleDraft = {
  id: 'soukoun',
  index: 3,
  title: 'Le soukoun',
  titleAr: 'ٱلسُّكُونُ',
  description: 'Lire une lettre sans voyelle et découvrir la qalqala.',
  lessons: [sukunIntro, sukunVowels, qalqala],
};

/* ════════════════════════════════════════════════════════════════════════
   Étape 4 — Les lettres liées
   ════════════════════════════════════════════════════════════════════════ */

const formsLesson = (id: string, title: string, subtitle: string, letterIds: string[], glyph: string) =>
  lesson({
    id,
    title,
    subtitle,
    glyph,
    steps: (rng) => {
      const forms = letterIds.flatMap(formItems);
      const quizForms = sample(
        forms.filter((f) => !f.id.endsWith(':isolated')),
        4,
        rng,
      );
      return [
        {
          kind: 'forms',
          title: 'Début, milieu, fin',
          prompt: 'Une lettre change de forme selon sa place dans le mot. Touche chaque forme pour l’écouter.',
          letterIds,
        },
        ...quizForms.map(
          (f): Draft => {
            const lid = f.id.split(':')[1];
            const options = [lid, ...sample(confusables(lid).length ? confusables(lid) : letterIds, 3, rng)];
            return {
              kind: 'choose',
              prompt: 'Quelle lettre se cache dans cette forme ?',
              question: { ar: f.ar, sound: f.sound },
              options: shuffle(
                [...new Set(options)].map((o) => ({ id: o, text: letter(o).char, arabic: true })),
                rng,
              ),
              answerId: lid,
            };
          },
        ),
        mushaf('Observe ces lettres liées dans le Coran.', { letters: letterIds.map((l) => letter(l).char) }, 4, {
          filters: letterIds.map((l) => ({ label: letter(l).char, highlight: { letters: [letter(l).char] } })),
        }),
      ];
    },
  });

const connectors = lesson({
  id: 'liees-1',
  title: 'Lettres qui se lient',
  subtitle: 'Et les six qui ne se lient pas',
  glyph: 'بـ',
  steps: (rng) => {
    const non = ['alif', 'dal', 'dhal', 'ra', 'zay', 'waw'];
    const connecting = ['ba', 'jim', 'sin', 'ayn', 'fa', 'mim', 'ha', 'kaf'];
    const yesNo = (id: string): Draft => ({
      kind: 'choose',
      prompt: 'Cette lettre se lie-t-elle à la lettre qui la suit ?',
      question: { ar: letter(id).char, sound: letterItem(id).sound },
      options: [
        { id: 'oui', text: 'Oui, des deux côtés' },
        { id: 'non', text: 'Non, seulement à droite' },
      ],
      answerId: non.includes(id) ? 'non' : 'oui',
      explain: 'ا د ذ ر ز و ne se lient jamais à la lettre suivante.',
    });
    return [
      {
        kind: 'intro',
        eyebrow: 'Écriture liée',
        title: 'L’arabe s’écrit attaché',
        body: 'Dans un mot, les lettres se lient entre elles, de droite à gauche. Six lettres font exception : ا د ذ ر ز و ne se lient qu’à la lettre précédente, jamais à la suivante.',
        items: non.map(letterItem),
        tips: ['Après ces six lettres, le mot « se coupe » visuellement : دَرَسَ, وَرَدَ.'],
      },
      {
        kind: 'forms',
        title: 'Les six lettres non attachantes',
        prompt: 'Remarque : elles n’ont que deux formes (isolée et finale).',
        letterIds: non,
      },
      ...shuffle([...sample(non, 3, rng), ...sample(connecting, 3, rng)], rng).map(yesNo),
    ];
  },
});

function wordsLesson(opts: {
  id: string;
  title: string;
  subtitle: string;
  glyph: string;
  words: WordEntry[];
  intro: string;
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
          eyebrow: 'Lecture',
          title: opts.title,
          body: opts.intro,
          hero: items[0],
        },
        discover('Écoute et lis chaque mot', items, 'Touche chaque mot : écoute, observe, puis relis-le seul.'),
        repeat('Lecture guidée', chunk(items, 3)),
        ...sample(opts.words, 3, rng).map((w) => build(w, rng, allSyllables)),
        ...sample(items, 3, rng).map((it) => listen(it, items, rng)),
        ...sample(items, 2, rng).map((it) => readChoice(it, items, rng)),
        match(sample(items, 4, rng), rng, 'Associe chaque mot à sa lecture'),
      ];
      if (opts.highlight) {
        const { prompt, spec, goal = 4, passage } = opts.highlight;
        steps.push(mushaf(prompt, spec, goal, { passage }));
      }
      return steps;
    },
  });
}

const MODULE_CONNECTED: ModuleDraft = {
  id: 'liees',
  index: 4,
  title: 'Les lettres liées',
  titleAr: 'ٱلْحُرُوفُ ٱلْمُتَّصِلَةُ',
  description: 'Reconnaître les lettres au début, au milieu et à la fin des mots, puis lire des mots entiers.',
  lessons: [
    connectors,
    formsLesson('liees-2', 'La famille du Bâ', 'ب ت ث ن ي dans les mots', ['ba', 'ta', 'tha', 'nun', 'ya'], 'ـبـ'),
    formsLesson('liees-3', 'Gorge et crochets', 'ج ح خ ع غ ه dans les mots', ['jim', 'hha', 'kha', 'ayn', 'ghayn', 'ha'], 'ـعـ'),
    formsLesson('liees-4', 'Les autres formes', 'س ش ص ض ط ظ ف ق ك ل م', ['sin', 'sad', 'taa', 'fa', 'qaf', 'kaf', 'lam', 'mim'], 'ـكـ'),
    wordsLesson({
      id: 'liees-5',
      title: 'Lire des mots',
      subtitle: 'Les voyelles courtes dans le mot',
      glyph: 'كَتَبَ',
      words: WORDS_SHORT_VOWELS,
      intro: 'Tu connais les lettres et les voyelles : lis maintenant des mots entiers, syllabe par syllabe. كَتَبَ = كَ + تَ + بَ.',
      highlight: { prompt: 'Retrouve la fatha dans le Coran.', spec: { marks: [MARKS.fatha], label: 'la fatha' }, goal: 5 },
    }),
    wordsLesson({
      id: 'liees-6',
      title: 'Mots avec soukoun',
      subtitle: 'Des syllabes fermées',
      glyph: 'قُلْ',
      words: WORDS_SUKUN,
      intro: 'Le soukoun ferme la syllabe : قُلْ « qoul », نَعْ·بُ·دُ « na‘boudou ». Lis lentement, puis enchaîne.',
      highlight: { prompt: 'Retrouve le soukoun dans le Coran.', spec: { marks: [MARKS.sukun], label: 'le soukoun' }, goal: 5 },
    }),
  ],
};

/* ════════════════════════════════════════════════════════════════════════
   Étape 5 — Les voyelles longues
   ════════════════════════════════════════════════════════════════════════ */

const MADD_TEXT: Record<VowelId, string> = {
  fatha: 'Une fatha suivie d’un alif (sans signe) s’allonge sur deux temps : بَا « bâ ».',
  kasra: 'Une kasra suivie d’un yâ’ (sans signe) s’allonge sur deux temps : بِي « bî ».',
  damma: 'Une damma suivie d’un wâw (sans signe) s’allonge sur deux temps : بُو « boû ».',
};

function maddLesson(vowel: VowelId): LessonDraft {
  const v = VOWELS[vowel];
  const ids = ALPHABET_IDS.filter((id) => id !== 'alif');
  return lesson({
    id: `madd-${vowel}`,
    title: `Le madd avec ${v.carrier}`,
    subtitle: `Le son long « ${v.long} »`,
    glyph: maddItem('ba', vowel).ar,
    steps: (rng) => {
      const row = ids.map((id) => maddItem(id, vowel));
      const contrast = sample(['ba', 'ta', 'nun', 'mim', 'lam', 'sin', 'qaf', 'ra'], 5, rng).map((id) => [
        vowelRow([id], vowel)[0],
        maddItem(id, vowel),
      ]);
      return [
        {
          kind: 'intro',
          eyebrow: 'Voyelle longue',
          title: `Le madd « ${v.long} »`,
          body: MADD_TEXT[vowel],
          hero: maddItem('ba', vowel),
          tips: ['Voyelle courte = 1 temps, voyelle longue = 2 temps.', 'Les trois lettres de prolongation : ا و ي'],
        },
        repeat('Court ou long ?', contrast),
        discover(`Syllabes en « ${v.long} »`, row.slice(0, 9)),
        ...contrast.slice(0, 4).map((pair) => listen(pair[Math.floor(rng() * 2)], pair, rng, 2, 'Court ou long ?')),
        ...sample(row, 2, rng).map((it) => readChoice(it, row, rng)),
        mushaf('Repère les voyelles longues (madd naturel) dans le Coran.', { rules: ['madda_normal'], label: 'le madd naturel' }, 4),
      ];
    },
  });
}

const MODULE_MADD: ModuleDraft = {
  id: 'madd',
  index: 5,
  title: 'Les voyelles longues',
  titleAr: 'حُرُوفُ ٱلْمَدِّ',
  description: 'Allonger le son avec alif, wâw et yâ’, et lire l’alif suscrit du Mushaf.',
  lessons: [
    maddLesson('fatha'),
    maddLesson('kasra'),
    maddLesson('damma'),
    wordsLesson({
      id: 'madd-mots',
      title: 'Mots avec madd',
      subtitle: 'Lire des voyelles longues',
      glyph: 'قَالَ',
      words: WORDS_MADD,
      intro: 'Allonge bien chaque voyelle longue sur deux temps : قَا·لَ « qâla », يَ·قُو·لُ « yaqoûlou ».',
      highlight: { prompt: 'Retrouve les madd naturels dans le Coran.', spec: { rules: ['madda_normal'] }, goal: 4 },
    }),
    wordsLesson({
      id: 'madd-suscrit',
      title: 'L’alif suscrit',
      subtitle: 'ـٰ ۥ ۦ : les petites lettres du Mushaf',
      glyph: 'مَٰ',
      words: WORDS_DAGGER,
      intro: 'Dans le Mushaf, certains madd s’écrivent avec une petite lettre : l’alif suscrit (ـٰ) se lit « â », le petit wâw (ۥ) « oû » et le petit yâ’ (ۦ) « î ». مَٰلِكِ se lit « mâliki ».',
      highlight: {
        prompt: 'Retrouve l’alif suscrit et les petites lettres dans le Coran.',
        spec: { marks: [MARKS.daggerAlif, MARKS.smallWaw, MARKS.smallYa], label: 'l’alif suscrit' },
        goal: 3,
      },
    }),
    wordsLesson({
      id: 'lin',
      title: 'Les lettres douces',
      subtitle: 'aw · ay (lîn)',
      glyph: 'يَوْ',
      words: WORDS_LIN,
      intro: 'Un wâw ou un yâ’ au soukoun précédé d’une fatha forme une diphtongue douce : يَوْمِ « yawmi », بَيْتٌ « baytoun ».',
      highlight: {
        prompt: 'Observe le wâw et le yâ’ dans la sourate Quraysh.',
        spec: { letters: ['و', 'ي'], label: 'wâw et yâ’' },
        goal: 3,
        passage: { surah: 106, from: 1, to: 4 },
      },
    }),
  ],
};

/* ════════════════════════════════════════════════════════════════════════
   Étape 6 — Le tanwîn
   ════════════════════════════════════════════════════════════════════════ */

const TANWIN_MARKS = [MARKS.tanwinFath, MARKS.tanwinKasr, MARKS.tanwinDamm];

const tanwinBasics = lesson({
  id: 'tanwin-1',
  title: 'Le tanwîn',
  subtitle: 'an · in · oun',
  glyph: 'بٌ',
  steps: (rng) => {
    const ids = ['ba', 'ta', 'dal', 'ra', 'sin', 'lam', 'mim', 'nun', 'qaf', 'kaf'];
    const lines = ids.map((id) => (['fatha', 'kasra', 'damma'] as VowelId[]).map((v) => tanwinItem(id, v)));
    return [
      {
        kind: 'intro',
        eyebrow: 'Voyelle doublée',
        title: 'Le tanwîn ـً ـٍ ـٌ',
        body: 'Le tanwîn est une voyelle doublée qui ajoute un son « n » en fin de mot : بًا « ban », بٍ « bin », بٌ « boun ». Le tanwîn fath s’écrit avec un alif de support.',
        items: lines[0],
        tips: ['On ne prononce pas l’alif du tanwîn fath.'],
      },
      repeat('an · in · oun', lines.slice(0, 6)),
      ...sample(lines, 4, rng).map((line) => listen(line[Math.floor(rng() * 3)], line, rng, 3)),
      ...sample(lines.flat(), 2, rng).map((it) => readChoice(it, lines.flat(), rng)),
      match(sample(lines.flat(), 4, rng), rng),
      mushaf('Retrouve le tanwîn dans le Coran.', { marks: TANWIN_MARKS, label: 'le tanwîn' }, 4),
    ];
  },
});

const tanwinContrast = lesson({
  id: 'tanwin-2',
  title: 'Voyelle ou tanwîn ?',
  subtitle: 'Distinguer ba / ban',
  glyph: 'بًا',
  type: 'review',
  steps: (rng) => {
    const ids = ['ba', 'ta', 'dal', 'ra', 'sin', 'lam', 'mim', 'qaf'];
    const pairs = ids.flatMap((id) =>
      (['fatha', 'kasra', 'damma'] as VowelId[]).map((v) => [vowelRow([id], v)[0], tanwinItem(id, v)]),
    );
    return [
      {
        kind: 'intro',
        eyebrow: 'Oreille fine',
        title: 'Simple ou doublée ?',
        body: 'Compare bien : بَ « ba » et بًا « ban », بِ « bi » et بٍ « bin ». La différence est le petit « n » final.',
        items: pairs[0],
      },
      repeat('Comparer', sample(pairs, 6, rng)),
      ...sample(pairs, 6, rng).map((p) => listen(p[Math.floor(rng() * 2)], p, rng, 2, 'Voyelle ou tanwîn ?')),
    ];
  },
});

const MODULE_TANWIN: ModuleDraft = {
  id: 'tanwin',
  index: 6,
  title: 'Le tanwîn',
  titleAr: 'ٱلتَّنْوِينُ',
  description: 'La voyelle doublée qui fait entendre un « n » final.',
  lessons: [
    tanwinBasics,
    tanwinContrast,
    wordsLesson({
      id: 'tanwin-mots',
      title: 'Mots avec tanwîn',
      subtitle: 'Lire la fin des mots',
      glyph: 'أَحَدٌ',
      words: WORDS_TANWIN,
      intro: 'Lis ces mots en faisant bien entendre le tanwîn final : أَحَدٌ « aḥadoun », عِلْمًا « ‘ilman ».',
      highlight: { prompt: 'Retrouve le tanwîn dans le Coran.', spec: { marks: TANWIN_MARKS, label: 'le tanwîn' }, goal: 4 },
    }),
  ],
};

/* ════════════════════════════════════════════════════════════════════════
   Étape 7 — La chadda
   ════════════════════════════════════════════════════════════════════════ */

const shaddaBasics = lesson({
  id: 'chadda-1',
  title: 'La chadda',
  subtitle: 'Doubler une lettre',
  glyph: 'بّ',
  steps: (rng) => {
    const ids = ['ba', 'ta', 'dal', 'ra', 'sin', 'lam', 'qaf', 'kaf', 'fa', 'ha'];
    const lines = ids.map((id) => VOWEL_IDS.map((v) => shaddaItem(id, v)));
    return [
      {
        kind: 'intro',
        eyebrow: 'Nouveau signe',
        title: 'La chadda ـّ',
        body: 'La chadda ressemble à un petit « w ». Elle double la lettre : la première est au soukoun, la seconde porte la voyelle. أَبَّ = أَبْ + بَ « abba ».',
        hero: shaddaItem('ba'),
        tips: ['Appuie sur la lettre doublée, sans la répéter deux fois.'],
      },
      repeat('Lettres doublées', lines.slice(0, 6)),
      ...sample(lines, 4, rng).map((line) => listen(line[Math.floor(rng() * 3)], line, rng, 3)),
      ...sample(lines.flat(), 2, rng).map((it) => readChoice(it, lines.flat(), rng)),
      mushaf('Retrouve la chadda dans le Coran.', { marks: [MARKS.shadda], label: 'la chadda' }, 5),
    ];
  },
});

const MODULE_SHADDA: ModuleDraft = {
  id: 'chadda',
  index: 7,
  title: 'La chadda',
  titleAr: 'ٱلشَّدَّةُ',
  description: 'La lettre doublée et la ghunna, nasalisation du nûn et du mîm.',
  lessons: [
    shaddaBasics,
    wordsLesson({
      id: 'chadda-mots',
      title: 'Mots avec chadda',
      subtitle: 'رَبِّ · ثُمَّ · عَلَّمَ',
      glyph: 'رَبِّ',
      words: WORDS_SHADDA,
      intro: 'Lis ces mots en appuyant sur la lettre doublée : رَبِّ « rabbi », عَلَّمَ « ‘allama ».',
      highlight: { prompt: 'Retrouve la chadda dans le Coran.', spec: { marks: [MARKS.shadda], label: 'la chadda' }, goal: 5 },
    }),
    wordsLesson({
      id: 'ghunna',
      title: 'La ghunna',
      subtitle: 'نّ et مّ : la nasalisation',
      glyph: 'إِنَّ',
      words: WORDS_GHUNNA,
      intro: 'Un nûn ou un mîm avec chadda se prononce avec une nasalisation (ghunna) de deux temps, le son passant par le nez : إِنَّ, ثُمَّ.',
      highlight: { prompt: 'Retrouve la ghunna (en vert) dans le Coran.', spec: { rules: ['ghunnah'], label: 'la ghunna' }, goal: 3 },
    }),
  ],
};

/* ════════════════════════════════════════════════════════════════════════
   Étape 8 — L’article et la hamzat al-wasl
   ════════════════════════════════════════════════════════════════════════ */

const MODULE_ARTICLE: ModuleDraft = {
  id: 'article',
  index: 8,
  title: 'L’article « al »',
  titleAr: 'ٱللَّامُ ٱلْقَمَرِيَّةُ وَٱلشَّمْسِيَّةُ',
  description: 'Lettres lunaires et solaires, et l’alif de liaison ٱ du Mushaf.',
  lessons: [
    wordsLesson({
      id: 'lam-qamari',
      title: 'Le lâm lunaire',
      subtitle: 'ٱلْقَمَرُ : le lâm se prononce',
      glyph: 'ٱلْقَ',
      words: WORDS_QAMARI,
      intro: 'Devant les 14 lettres lunaires (ا ب ج ح خ ع غ ف ق ك م و ه ي), le lâm de l’article porte un soukoun et se prononce : ٱلْقَمَرُ « al-qamarou ».',
      highlight: { prompt: 'Repère l’alif de liaison ٱ qui ouvre l’article.', spec: { letters: ['ٱ'], label: 'l’alif de liaison' }, goal: 4 },
    }),
    wordsLesson({
      id: 'lam-shamsi',
      title: 'Le lâm solaire',
      subtitle: 'ٱلشَّمْسُ : le lâm disparaît',
      glyph: 'ٱلشَّ',
      words: WORDS_SHAMSI,
      intro: 'Devant les 14 lettres solaires (ت ث د ذ ر ز س ش ص ض ط ظ ل ن), le lâm s’écrit mais ne se prononce pas : la lettre suivante prend une chadda. ٱلشَّمْسُ « ash-shamsou ».',
      highlight: { prompt: 'Retrouve le lâm solaire (en gris) dans le Coran.', spec: { rules: ['laam_shamsiyah'], label: 'le lâm solaire' }, goal: 3 },
    }),
    wordsLesson({
      id: 'hamzat-wasl',
      title: 'L’alif de liaison',
      subtitle: 'ٱ : prononcé au début, muet en liaison',
      glyph: 'ٱ',
      words: WORDS_WASL,
      intro: 'L’alif surmonté d’un petit ṣâd (ٱ) se prononce seulement en début de lecture. En liaison, il disparaît : بِسْمِ ٱللَّهِ se lit « bismi-llâhi ».',
      highlight: { prompt: 'Retrouve les alifs de liaison muets (en gris).', spec: { rules: ['ham_wasl'], label: 'la hamzat al-wasl' }, goal: 3 },
    }),
  ],
};

/* ════════════════════════════════════════════════════════════════════════
   Étape 9 — Vers le Mushaf
   ════════════════════════════════════════════════════════════════════════ */

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
    mushaf('Repère les allongements (madd) dans Al-Fâtiha.', { rules: ['madda_normal', 'madda_permissible', 'madda_obligatory', 'madda_necessary'], label: 'le madd' }, 4, {
      passage: { surah: 1, from: 1, to: 7 },
    }),
    mushaf('Repère la nasalisation (ghunna, ikhfâ’, idghâm) dans An-Nâs.', { rules: ['ghunnah', 'ikhafa', 'idgham_ghunnah', 'iqlab'], label: 'la nasalisation' }, 3, {
      passage: { surah: 114, from: 1, to: 6 },
    }),
    mushaf('Repère la qalqala dans Al-Falaq.', { rules: ['qalaqah'], label: 'la qalqala' }, 3, {
      passage: { surah: 113, from: 1, to: 5 },
    }),
    mushaf('Repère les lettres non prononcées (gris) dans Al-Ikhlâs.', { rules: ['ham_wasl', 'laam_shamsiyah', 'slnt'], label: 'les lettres muettes' }, 3, {
      passage: { surah: 112, from: 1, to: 4 },
    }),
  ],
});

const MODULE_QURAN: ModuleDraft = {
  id: 'mushaf',
  index: 9,
  title: 'Vers le Mushaf',
  titleAr: 'نَحْوَ ٱلْمُصْحَفِ',
  description: 'Lire tes premières sourates mot à mot, avec le code couleur du Tajweed.',
  lessons: [
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
  MODULE_LETTERS,
  MODULE_VOWELS,
  MODULE_SUKUN,
  MODULE_CONNECTED,
  MODULE_MADD,
  MODULE_TANWIN,
  MODULE_SHADDA,
  MODULE_ARTICLE,
  MODULE_QURAN,
];

export const MODULES: Module[] = DRAFTS.map((m) => ({
  ...m,
  lessons: m.lessons.map((l) => ({ ...l, moduleId: m.id })),
}));

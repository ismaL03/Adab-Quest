import { describe, expect, it } from 'vitest';
import { LESSONS, MODULES, isLessonUnlocked, type Item, type Step } from '@/data/curriculum';
import { letterPosition } from '@/data/curriculum/builders';
import { graphemeKey, syllabify, syllableKey } from '@/data/curriculum/items';
import { LESSON_WORDS, SENTENCES } from '@/data/curriculum/words';
import { ALL_LETTERS, letter } from '@/data/letters';
import { graphemes, isCombining, TATWEEL } from '@/lib/arabic';

describe('parcours pédagogique', () => {
  it('commence par le système de lecture, puis une lettre par leçon', () => {
    expect(MODULES.map((m) => m.id)).toEqual([
      'systeme',
      'famille-ba',
      'non-attachees',
      'frequentes',
      'gorge',
      'soleil-lune',
      'dernieres',
      'mushaf',
    ]);
    expect(LESSONS.slice(0, 3).map((l) => l.id)).toEqual(['sons', 'soukoun', 'voyelles-longues']);
  });

  it('a des identifiants de leçons et d’étapes uniques', () => {
    const lessonIds = LESSONS.map((l) => l.id);
    expect(new Set(lessonIds).size).toBe(lessonIds.length);
    const stepIds = LESSONS.flatMap((l) => l.steps.map((s) => s.id));
    expect(new Set(stepIds).size).toBe(stepIds.length);
  });

  it('présente chacune des 28 lettres (et la hamza) une seule fois', () => {
    const seen = LESSONS.flatMap((l) => l.steps.flatMap((s) => (s.kind === 'letter' ? [s.letterId] : [])));
    expect(new Set(seen).size).toBe(29);
    expect(seen.length).toBe(29);
  });

  it('chaque nouvelle lettre se cherche ensuite dans le Mushaf', () => {
    for (const l of LESSONS) {
      const letterStep = l.steps.find((s) => s.kind === 'letter');
      if (!letterStep || letterStep.letterId === 'alif' || letterStep.letterId === 'hamza') continue;
      expect(l.steps.at(-1)?.kind, l.id).toBe('mushaf');
    }
  });

  it('ne fait lire que des lettres et des signes déjà étudiés', () => {
    // Ce que chaque leçon notionnelle débloque (le reste vient des fiches « lettre »).
    const UNLOCKS: Record<string, string[]> = {
      sons: ['ب', '\u064E', '\u0650', '\u064F'],
      soukoun: ['\u0652', 'أ', 'إ'],
      'voyelles-longues': ['ا', 'و', 'ي'],
      tanwin: ['\u064B', '\u064C', '\u064D'],
      chadda: ['\u0651'],
      'ta-marbuta': ['ة'],
      hamza: ['ء', 'أ', 'إ', 'ؤ', 'ئ'],
      'alif-maqsura': ['ى'],
      article: ['ٱ'],
      'petites-lettres': ['\u0670', '\u06E5', '\u06E6'],
    };
    const known = new Set<string>();
    const problems: string[] = [];
    const check = (lessonId: string, text: string) => {
      for (const g of graphemes(text)) {
        if (g.base === ' ' || g.base === TATWEEL) continue;
        const marks = Array.from(g.text).filter(isCombining);
        // و et ي sans signe : voyelles longues ; avec un signe : consonnes.
        const base = (g.base === 'و' || g.base === 'ي') && marks.length ? `${g.base}:consonne` : g.base;
        for (const need of [base, ...marks]) if (!known.has(need)) problems.push(`${lessonId} : ${text} (${need})`);
      }
    };
    const readItems = (step: Step): Item[] => {
      switch (step.kind) {
        case 'discover':
          return step.items;
        case 'repeat':
          return step.lines.flat();
        case 'listen':
          return step.options;
        case 'build':
          return [step.target, ...step.pieces];
        case 'match':
          return step.pairs.map((p) => p.left);
        default:
          return [];
      }
    };
    for (const lesson of LESSONS) {
      for (const ch of UNLOCKS[lesson.id] ?? []) known.add(ch);
      for (const step of lesson.steps) {
        if (step.kind !== 'letter') continue;
        const l = letter(step.letterId);
        known.add(l.id === 'waw' || l.id === 'ya' ? `${l.char}:consonne` : l.char);
      }
      for (const step of lesson.steps) {
        for (const it of readItems(step)) check(lesson.id, it.ar);
        if (step.kind === 'choose') {
          if (step.question.ar) check(lesson.id, step.question.ar);
          for (const o of step.options) if (o.arabic) check(lesson.id, o.text);
        }
      }
    }
    expect(problems).toEqual([]);
  });

  it('associe chaque identifiant de mot à une seule orthographe', () => {
    const all = [...Object.values(LESSON_WORDS).flat(), ...SENTENCES.flatMap((s) => s.words)];
    const bySlug = new Map<string, string>();
    for (const w of all) {
      expect(bySlug.get(w.slug) ?? w.ar, w.slug).toBe(w.ar);
      bySlug.set(w.slug, w.ar);
    }
  });

  for (const lesson of LESSONS) {
    describe(lesson.id, () => {
      it('a des étapes valides', () => {
        expect(lesson.steps.length).toBeGreaterThanOrEqual(4);
        for (const step of lesson.steps) {
          switch (step.kind) {
            case 'listen': {
              expect(step.options.some((o) => o.id === step.answer.id)).toBe(true);
              const texts = step.options.map((o) => o.ar);
              expect(new Set(texts).size).toBe(texts.length);
              expect(step.options.length).toBeGreaterThanOrEqual(2);
              break;
            }
            case 'choose': {
              expect(step.options.some((o) => o.id === step.answerId)).toBe(true);
              const texts = step.options.map((o) => o.text);
              expect(new Set(texts).size).toBe(texts.length);
              break;
            }
            case 'match': {
              expect(step.pairs.length).toBeGreaterThanOrEqual(2);
              const rights = step.pairs.map((p) => p.right.text);
              expect(new Set(rights).size).toBe(rights.length);
              break;
            }
            case 'build': {
              expect(step.pieces.map((p) => p.ar).join('')).toBe(step.target.ar);
              break;
            }
            case 'letter':
              expect(() => letter(step.letterId)).not.toThrow();
              break;
            case 'mushaf':
              expect(step.goal).toBeGreaterThan(0);
              break;
          }
        }
      });
    });
  }

  it('déverrouille les leçons dans l’ordre', () => {
    const done = new Set([LESSONS[0].id]);
    expect(isLessonUnlocked(LESSONS[0].id, (id) => done.has(id))).toBe(true);
    expect(isLessonUnlocked(LESSONS[1].id, (id) => done.has(id))).toBe(true);
    expect(isLessonUnlocked(LESSONS[2].id, (id) => done.has(id))).toBe(false);
  });
});

describe('forme de la lettre selon sa place', () => {
  it('tient compte des lettres qui ne s’attachent pas', () => {
    expect(letterPosition('تَابَ', 'ت')).toBe('initial');
    expect(letterPosition('بَيْنَ', 'ي')).toBe('medial');
    expect(letterPosition('نُورٌ', 'ر')).toBe('isolated');
    expect(letterPosition('بِنْتْ', 'ت')).toBe('final');
    expect(letterPosition('بَابَا', 'ب')).toBeNull();
    expect(ALL_LETTERS.length).toBe(29);
  });
});

describe('syllabes et clés audio', () => {
  it('découpe les mots en syllabes de lecture', () => {
    expect(syllabify('كَتَبَ')).toEqual(['كَ', 'تَ', 'بَ']);
    expect(syllabify('قَالَ')).toEqual(['قَا', 'لَ']);
    expect(syllabify('نَعْبُدُ')).toEqual(['نَعْ', 'بُ', 'دُ']);
    expect(syllabify('ٱلشَّمْسُ')).toEqual(['ٱل', 'شَّمْ', 'سُ']);
  });

  it('nomme les fichiers audio de façon stable et lisible', () => {
    expect(graphemeKey('بَ')).toBe('ba-fatha');
    expect(graphemeKey('أُ')).toBe('alif-hamza-damma');
    expect(graphemeKey('رَّ')).toBe('ra-shadda-fatha');
    expect(syllableKey('بَا')).toBe('ba-fatha_alif-plain');
  });
});

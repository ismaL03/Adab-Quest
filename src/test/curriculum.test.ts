import { describe, expect, it } from 'vitest';
import { LESSONS, MODULES, isLessonUnlocked } from '@/data/curriculum';
import { graphemeKey, syllabify, syllableKey } from '@/data/curriculum/items';
import { letter } from '@/data/letters';

describe('parcours pédagogique', () => {
  it('contient 9 étapes dans l’ordre de la méthode', () => {
    expect(MODULES.map((m) => m.id)).toEqual([
      'lettres',
      'voyelles',
      'soukoun',
      'liees',
      'madd',
      'tanwin',
      'chadda',
      'article',
      'mushaf',
    ]);
  });

  it('a des identifiants de leçons et d’étapes uniques', () => {
    const lessonIds = LESSONS.map((l) => l.id);
    expect(new Set(lessonIds).size).toBe(lessonIds.length);
    const stepIds = LESSONS.flatMap((l) => l.steps.map((s) => s.id));
    expect(new Set(stepIds).size).toBe(stepIds.length);
  });

  it('couvre les 28 lettres de l’alphabet dans l’étape 1', () => {
    const seen = new Set(
      MODULES[0].lessons.flatMap((l) => l.steps.flatMap((s) => (s.kind === 'letter' ? [s.letterId] : []))),
    );
    expect(seen.size).toBe(29); // 28 lettres + la hamza
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

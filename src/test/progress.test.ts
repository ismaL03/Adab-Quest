import { beforeEach, describe, expect, it } from 'vitest';
import { levelFromXp, starsFor, useProgress } from '@/store/progress';

describe('progression et gamification', () => {
  beforeEach(() => useProgress.getState().reset());

  it('attribue les étoiles selon les erreurs', () => {
    expect(starsFor(0)).toBe(3);
    expect(starsFor(2)).toBe(2);
    expect(starsFor(5)).toBe(1);
  });

  it('calcule les niveaux à partir de l’XP', () => {
    expect(levelFromXp(0).level).toBe(1);
    expect(levelFromXp(100).level).toBe(2);
    expect(levelFromXp(249).level).toBe(2);
    expect(levelFromXp(250).level).toBe(3);
  });

  it('enregistre une leçon terminée : XP, série, badges', () => {
    const summary = useProgress.getState().completeLesson({ lessonId: 'lettres-1', accuracy: 1, mistakes: 0, bestCombo: 6 });
    const s = useProgress.getState();
    expect(summary.firstTime).toBe(true);
    expect(summary.stars).toBe(3);
    expect(summary.xpGained).toBe(20 + 10 + 4);
    expect(s.xp).toBe(summary.xpGained);
    expect(s.streak.current).toBe(1);
    expect(summary.newBadges).toEqual(expect.arrayContaining(['premier-pas', 'sans-faute']));
    expect(s.lessons['lettres-1'].stars).toBe(3);
  });

  it('réduit l’XP en révision et garde la meilleure note', () => {
    useProgress.getState().completeLesson({ lessonId: 'lettres-1', accuracy: 1, mistakes: 0, bestCombo: 0 });
    const second = useProgress.getState().completeLesson({ lessonId: 'lettres-1', accuracy: 0.5, mistakes: 4, bestCombo: 0 });
    expect(second.firstTime).toBe(false);
    expect(second.xpGained).toBe(10);
    expect(useProgress.getState().lessons['lettres-1'].stars).toBe(3);
    expect(useProgress.getState().lessons['lettres-1'].completions).toBe(2);
    // Même jour : la série ne s’allonge pas deux fois.
    expect(useProgress.getState().streak.current).toBe(1);
  });
});

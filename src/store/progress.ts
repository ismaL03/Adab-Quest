import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BADGES, type BadgeContext } from '@/data/badges';
import { LESSONS } from '@/data/curriculum';
import { dayKey, daysBetween } from '@/lib/date';

export interface LessonRecord {
  stars: 1 | 2 | 3;
  bestAccuracy: number;
  completions: number;
  lastCompletedAt: string;
}

export interface LessonResult {
  lessonId: string;
  /** Réponses justes / réponses données (0 → 1). */
  accuracy: number;
  mistakes: number;
  /** Plus longue série de bonnes réponses dans la leçon. */
  bestCombo: number;
}

export interface CompletionSummary {
  xpGained: number;
  stars: 1 | 2 | 3;
  firstTime: boolean;
  newBadges: string[];
  streak: number;
  streakExtended: boolean;
  dailyGoalReached: boolean;
}

interface Stats {
  soundsPlayed: number;
  mushafWords: number;
  perfectLessons: number;
  correctAnswers: number;
}

export interface ProgressState {
  xp: number;
  lessons: Record<string, LessonRecord>;
  streak: { current: number; best: number; lastDay: string | null };
  daily: { day: string; xp: number };
  dailyGoal: number;
  badges: Record<string, string>;
  stats: Stats;

  completeLesson: (result: LessonResult) => CompletionSummary;
  recordSound: () => void;
  recordMushafWord: () => void;
  recordCorrect: () => void;
  setDailyGoal: (goal: number) => void;
  /** Évalue les badges et renvoie ceux nouvellement obtenus. */
  evaluateBadges: () => string[];
  reset: () => void;
}

export function starsFor(mistakes: number): 1 | 2 | 3 {
  if (mistakes === 0) return 3;
  if (mistakes <= 2) return 2;
  return 1;
}

/** Niveau à partir de l’XP : chaque niveau demande 50 XP de plus que le précédent. */
export function levelFromXp(xp: number): { level: number; current: number; next: number; progress: number } {
  let level = 1;
  let floor = 0;
  let need = 100;
  while (xp >= floor + need) {
    floor += need;
    level += 1;
    need += 50;
  }
  return { level, current: xp - floor, next: need, progress: (xp - floor) / need };
}

const initialState = () => ({
  xp: 0,
  lessons: {} as Record<string, LessonRecord>,
  streak: { current: 0, best: 0, lastDay: null as string | null },
  daily: { day: dayKey(), xp: 0 },
  dailyGoal: 50,
  badges: {} as Record<string, string>,
  stats: { soundsPlayed: 0, mushafWords: 0, perfectLessons: 0, correctAnswers: 0 },
});

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      ...initialState(),

      completeLesson: (result) => {
        const lesson = LESSONS.find((l) => l.id === result.lessonId);
        const state = get();
        const today = dayKey();
        const previous = state.lessons[result.lessonId];
        const stars = starsFor(result.mistakes);
        const firstTime = !previous;

        // XP : base de la leçon (réduite en révision) + bonus sans-faute + bonus de combo.
        const base = lesson?.xp ?? 20;
        const xpGained =
          (firstTime ? base : Math.round(base / 2)) + (stars === 3 ? 10 : 0) + Math.min(10, Math.floor(result.bestCombo / 3) * 2);

        // Série quotidienne.
        let { current, best, lastDay } = state.streak;
        let streakExtended = false;
        if (lastDay !== today) {
          const gap = lastDay ? daysBetween(lastDay, today) : Infinity;
          current = gap === 1 ? current + 1 : 1;
          best = Math.max(best, current);
          lastDay = today;
          streakExtended = true;
        }

        const daily = state.daily.day === today ? state.daily : { day: today, xp: 0 };
        const dailyXp = daily.xp + xpGained;
        const dailyGoalReached = daily.xp < state.dailyGoal && dailyXp >= state.dailyGoal;

        set({
          xp: state.xp + xpGained,
          lessons: {
            ...state.lessons,
            [result.lessonId]: {
              stars: previous ? (Math.max(previous.stars, stars) as 1 | 2 | 3) : stars,
              bestAccuracy: Math.max(previous?.bestAccuracy ?? 0, result.accuracy),
              completions: (previous?.completions ?? 0) + 1,
              lastCompletedAt: new Date().toISOString(),
            },
          },
          streak: { current, best, lastDay },
          daily: { day: today, xp: dailyXp },
          stats: {
            ...state.stats,
            perfectLessons: state.stats.perfectLessons + (stars === 3 ? 1 : 0),
          },
        });

        const newBadges = get().evaluateBadges();
        return { xpGained, stars, firstTime, newBadges, streak: current, streakExtended, dailyGoalReached };
      },

      recordSound: () => set((s) => ({ stats: { ...s.stats, soundsPlayed: s.stats.soundsPlayed + 1 } })),
      recordMushafWord: () => set((s) => ({ stats: { ...s.stats, mushafWords: s.stats.mushafWords + 1 } })),
      recordCorrect: () => set((s) => ({ stats: { ...s.stats, correctAnswers: s.stats.correctAnswers + 1 } })),
      setDailyGoal: (dailyGoal) => set({ dailyGoal }),

      evaluateBadges: () => {
        const s = get();
        const ctx: BadgeContext = {
          xp: s.xp,
          completed: (id) => !!s.lessons[id],
          completedCount: Object.keys(s.lessons).length,
          perfectLessons: s.stats.perfectLessons,
          streak: s.streak.current,
          soundsPlayed: s.stats.soundsPlayed,
          mushafWords: s.stats.mushafWords,
        };
        const unlocked = BADGES.filter((b) => !s.badges[b.id] && b.check(ctx)).map((b) => b.id);
        if (unlocked.length) {
          const now = new Date().toISOString();
          set({ badges: { ...s.badges, ...Object.fromEntries(unlocked.map((id) => [id, now])) } });
        }
        return unlocked;
      },

      reset: () => set(initialState()),
    }),
    {
      name: 'iqra-progress',
      version: 1,
      partialize: (s) => ({
        xp: s.xp,
        lessons: s.lessons,
        streak: s.streak,
        daily: s.daily,
        dailyGoal: s.dailyGoal,
        badges: s.badges,
        stats: s.stats,
      }),
    },
  ),
);

/** Série affichée : remise à zéro si un jour a été manqué. */
export function displayedStreak(streak: ProgressState['streak'], today = dayKey()): number {
  if (!streak.lastDay) return 0;
  return daysBetween(streak.lastDay, today) <= 1 ? streak.current : 0;
}

export function todayXp(daily: ProgressState['daily'], today = dayKey()): number {
  return daily.day === today ? daily.xp : 0;
}

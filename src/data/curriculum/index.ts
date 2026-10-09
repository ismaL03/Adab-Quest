import { MODULES } from './modules';
import type { Lesson, Module } from './types';

export { MODULES };
export type * from './types';
export { GRADED_KINDS } from './types';

/** Toutes les leçons, dans l’ordre du parcours. */
export const LESSONS: Lesson[] = MODULES.flatMap((m) => m.lessons);

const LESSON_INDEX = new Map(LESSONS.map((l, i) => [l.id, i]));

export function getLesson(id: string): Lesson | undefined {
  const i = LESSON_INDEX.get(id);
  return i === undefined ? undefined : LESSONS[i];
}

export function getModule(id: string): Module | undefined {
  return MODULES.find((m) => m.id === id);
}

export function lessonIndex(id: string): number {
  return LESSON_INDEX.get(id) ?? -1;
}

export function nextLesson(id: string): Lesson | undefined {
  const i = LESSON_INDEX.get(id);
  return i === undefined ? undefined : LESSONS[i + 1];
}

/** Une leçon est accessible si c’est la première ou si la précédente est terminée. */
export function isLessonUnlocked(id: string, completed: (lessonId: string) => boolean): boolean {
  const i = LESSON_INDEX.get(id);
  if (i === undefined) return false;
  return i === 0 || completed(LESSONS[i - 1].id);
}

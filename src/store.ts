import { useSyncExternalStore } from 'react'
import { WORDS, SURAHS, type Word } from './data'

// Statut d'un mot : absent = nouveau, 1 = à réviser, 2 = maîtrisé.
export type Status = 0 | 1 | 2
export type UnlockMode = 'mix' | 'new' | 'review'

export type State = {
  st: Record<number, [Status, number]> // id -> [statut, dernière fois vu]
  scope: number[] | null // sourates choisies pour l'apprentissage (null = tout le Coran)
  unlock: { enabled: boolean; mode: UnlockMode; interval: number }
}

const KEY = 'siraj.v1'
const initial: State = { st: {}, scope: null, unlock: { enabled: false, mode: 'mix', interval: 0 } }

function load(): State {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (s && typeof s === 'object' && s.st) return { ...initial, ...s, unlock: { ...initial.unlock, ...s.unlock } }
  } catch {}
  return initial
}

let state = load()
const subs = new Set<() => void>()

export function setState(patch: Partial<State>) {
  state = { ...state, ...patch }
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {}
  subs.forEach((f) => f())
}
export const getState = () => state
export const useStore = () =>
  useSyncExternalStore(
    (f) => (subs.add(f), () => subs.delete(f)),
    () => state,
  )

export const statusOf = (id: number, s = state): Status => s.st[id]?.[0] ?? 0

export function mark(id: number, status: Status) {
  markMany([id], status)
}

export function markMany(ids: number[], status: Status) {
  const st = { ...state.st }
  const now = Date.now()
  for (const id of ids) {
    if (status === 0) delete st[id]
    else st[id] = [status, now]
  }
  setState({ st })
}

const inScope = (w: Word, s = state) => !s.scope || s.scope.length === 0 || s.scope.includes(w.s)

export function counts(ids?: number[], s = state) {
  let review = 0
  let mastered = 0
  const total = ids ? ids.length : WORDS.length
  const tally = (v?: Status) => {
    if (v === 1) review++
    else if (v === 2) mastered++
  }
  if (ids) for (const id of ids) tally(s.st[id]?.[0])
  else for (const k in s.st) tally(s.st[k][0])
  return { total, review, mastered, fresh: total - review - mastered }
}

/** Prochain mot jamais vu, dans l'ordre du Mushaf, parmi les sourates choisies. */
export function nextNew(skip: Set<number> = new Set()): Word | null {
  for (const w of WORDS) if (!state.st[w.id] && !skip.has(w.id) && inScope(w)) return w
  return null
}

/** Mots à réviser, le plus anciennement vu d'abord. */
export function reviewQueue(includeMastered = false): Word[] {
  const out: [number, number][] = []
  for (const k in state.st) {
    const [status, at] = state.st[k]
    if (status === 1 || (includeMastered && status === 2)) out.push([+k, at])
  }
  out.sort((a, b) => a[1] - b[1])
  return out.map(([id]) => WORDS[id])
}

export type Pick = { word: Word; kind: 'new' | 'review' }

// Tout est maîtrisé : on repropose les mots maîtrisés les plus anciens.
function consolidation(): Pick | null {
  const q = reviewQueue(true)
  return q.length ? { word: q[Math.floor(Math.random() * Math.min(q.length, 20))], kind: 'review' } : null
}

/** Mot proposé au déverrouillage, selon le mode choisi. */
export function pickUnlock(mode: UnlockMode = state.unlock.mode): Pick | null {
  const fresh = nextNew()
  const queue = reviewQueue()
  const review = queue.length ? queue[Math.floor(Math.random() * Math.min(queue.length, 5))] : null
  const asNew: Pick | null = fresh && { word: fresh, kind: 'new' }
  const asReview: Pick | null = review && { word: review, kind: 'review' }
  if (mode === 'new') return asNew || asReview || consolidation()
  if (mode === 'review') return asReview || consolidation() || asNew
  return (Math.random() < 0.5 ? asReview || asNew : asNew || asReview) || consolidation()
}

export function exportData() {
  return JSON.stringify({ app: 'siraj', v: 1, st: state.st, scope: state.scope })
}
export function importData(text: string): boolean {
  try {
    const d = JSON.parse(text)
    if (d?.app !== 'siraj' || typeof d.st !== 'object' || !d.st) return false
    setState({ st: d.st, scope: Array.isArray(d.scope) ? d.scope : null })
    return true
  } catch {
    return false
  }
}

export const scopeLabel = (s = state) =>
  !s.scope || s.scope.length === 0
    ? 'Tout le Coran'
    : s.scope.length === 1
      ? SURAHS[s.scope[0]].fr
      : `${s.scope.length} sourates`

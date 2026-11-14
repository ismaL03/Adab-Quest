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
export const subscribe = (f: () => void) => (subs.add(f), () => void subs.delete(f))
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

/** Mot passé sans réponse : il garde son statut mais repart en fin de file. */
export function touch(id: number) {
  const cur = state.st[id]
  if (cur) setState({ st: { ...state.st, [id]: [cur[0], Date.now()] } })
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
  return q.length ? { word: q[0], kind: 'review' } : null
}

/** Mot proposé au déverrouillage, selon le mode choisi. */
export function pickUnlock(mode: UnlockMode = state.unlock.mode): Pick | null {
  const fresh = nextNew()
  const queue = reviewQueue()
  // Toujours le mot vu le plus anciennement : aucun mot ne revient avant que les autres soient passés.
  const review = queue[0] ?? null
  const asNew: Pick | null = fresh && { word: fresh, kind: 'new' }
  const asReview: Pick | null = review && { word: review, kind: 'review' }
  if (mode === 'new') return asNew || asReview || consolidation()
  if (mode === 'review') return asReview || consolidation() || asNew
  return (Math.random() < 0.5 ? asReview || asNew : asNew || asReview) || consolidation()
}

/** Réponses données sur les cartes de déverrouillage Android, à reporter dans la progression. */
export function applyAnswers(answers: { id: number; st: Status; at: number }[]) {
  if (!answers.length) return
  const st = { ...state.st }
  for (const a of answers) if (WORDS[a.id] && (a.st === 1 || a.st === 2)) st[a.id] = [a.st, a.at || Date.now()]
  setState({ st })
}

/** Les prochains mots à proposer au déverrouillage, dans l'ordre, selon le mode choisi. */
export function unlockQueue(n = 80): Pick[] {
  const fresh: Pick[] = []
  for (const w of WORDS) {
    if (fresh.length >= n) break
    if (!state.st[w.id] && inScope(w)) fresh.push({ word: w, kind: 'new' })
  }
  const review: Pick[] = reviewQueue().slice(0, n).map((word) => ({ word, kind: 'review' }))
  const mode = state.unlock.mode
  let out: Pick[] = []
  if (mode === 'new') out = [...fresh, ...review]
  else if (mode === 'review') out = [...review]
  else {
    let i = 0
    let j = 0
    while (out.length < n && (i < fresh.length || j < review.length)) {
      const takeReview = j < review.length && (i >= fresh.length || Math.random() < 0.5)
      out.push(takeReview ? review[j++] : fresh[i++])
    }
  }
  // Plus rien à réviser : on consolide les mots maîtrisés, puis on reprend les nouveaux.
  if (out.length < n && mode !== 'new') {
    const seen = new Set(out.map((p) => p.word.id))
    for (const word of reviewQueue(true)) if (out.length < n && !seen.has(word.id)) out.push({ word, kind: 'review' })
    if (mode === 'review') out.push(...fresh)
  }
  return out.slice(0, n)
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

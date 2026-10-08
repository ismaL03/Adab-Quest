import type { Item, Step } from '@/data/curriculum';

export interface AnswerDetail {
  /** Bonne réponse à rappeler en cas d’erreur. */
  correct?: Item | { ar?: string; text?: string };
  explain?: string;
}

/** Contrat entre le lecteur de leçon et chaque type d’étape. */
export interface StepApi {
  /** Étape non notée : autorise (ou non) le bouton « Continuer ». */
  setReady: (ready: boolean) => void;
  /** Étape notée : enregistre l’action du bouton « Vérifier » (null = désactivé). */
  setCheck: (check: (() => void) | null) => void;
  /** Étape notée : transmet le résultat. */
  answer: (ok: boolean, detail?: AnswerDetail) => void;
  /** Étape notée à correction immédiate (association) : erreur ponctuelle. */
  mistake: () => void;
  /** Bonne réponse ponctuelle (combo). */
  hit: () => void;
  /** Vrai une fois la réponse donnée : l’étape doit se figer. */
  locked: boolean;
}

export interface StepProps<S extends Step = Step> {
  step: S;
  api: StepApi;
}

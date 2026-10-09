import { create } from 'zustand';

export interface Toast {
  id: number;
  title: string;
  description?: string;
  tone?: 'default' | 'success' | 'gold';
  glyph?: string;
}

interface UiState {
  toasts: Toast[];
  /** Dernière leçon terminée : anime le déverrouillage sur la carte. */
  justCompleted: string | null;
  pushToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: number) => void;
  setJustCompleted: (id: string | null) => void;
}

let nextId = 1;

export const useUi = create<UiState>((set) => ({
  toasts: [],
  justCompleted: null,
  pushToast: (toast) => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4200);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  setJustCompleted: (justCompleted) => set({ justCompleted }),
}));

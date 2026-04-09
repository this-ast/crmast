import { create } from 'zustand'

export type PreviewEntityType = 'property' | 'client' | 'complex' | 'deal'

export interface PreviewEntry {
  type: PreviewEntityType
  id: string
}

interface CrossPreviewState {
  stack: PreviewEntry[]
  open: (type: PreviewEntityType, id: string) => void
  back: () => void
  close: () => void
}

export const useCrossPreview = create<CrossPreviewState>((set) => ({
  stack: [],
  open: (type, id) => set((s) => ({ stack: [...s.stack, { type, id }] })),
  back: () => set((s) => ({ stack: s.stack.slice(0, -1) })),
  close: () => set({ stack: [] }),
}))

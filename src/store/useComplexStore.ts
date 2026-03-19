import { create } from 'zustand'

interface ComplexStore {
  selectedComplexId: string | null
  isDetailOpen: boolean
  isFormOpen: boolean
  editingComplexId: string | null

  openDetail: (id: string) => void
  closeDetail: () => void
  openForm: (editId?: string) => void
  closeForm: () => void
}

export const useComplexStore = create<ComplexStore>((set) => ({
  selectedComplexId: null,
  isDetailOpen: false,
  isFormOpen: false,
  editingComplexId: null,

  openDetail: (id) => set({ selectedComplexId: id, isDetailOpen: true }),
  closeDetail: () => set({ selectedComplexId: null, isDetailOpen: false }),
  openForm: (editId) => set({ isFormOpen: true, editingComplexId: editId ?? null }),
  closeForm: () => set({ isFormOpen: false, editingComplexId: null }),
}))

import { create } from 'zustand'
import type { PropertyType, PropertyStatus } from '@/types'

interface PropertyFilters {
  type: PropertyType | 'all'
  status: PropertyStatus | 'all'
  search: string
  priceMin: string
  priceMax: string
  areaMin: string
  areaMax: string
}

interface PropertyStore {
  filters: PropertyFilters
  selectedPropertyId: string | null
  isDetailOpen: boolean
  isFormOpen: boolean
  editingPropertyId: string | null

  setFilter: <K extends keyof PropertyFilters>(key: K, value: PropertyFilters[K]) => void
  resetFilters: () => void
  openDetail: (id: string) => void
  closeDetail: () => void
  openForm: (editId?: string) => void
  closeForm: () => void
}

const defaultFilters: PropertyFilters = {
  type: 'all',
  status: 'all',
  search: '',
  priceMin: '',
  priceMax: '',
  areaMin: '',
  areaMax: '',
}

export const usePropertyStore = create<PropertyStore>((set) => ({
  filters: defaultFilters,
  selectedPropertyId: null,
  isDetailOpen: false,
  isFormOpen: false,
  editingPropertyId: null,

  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),

  resetFilters: () => set({ filters: defaultFilters }),

  openDetail: (id) => set({ selectedPropertyId: id, isDetailOpen: true }),
  closeDetail: () => set({ selectedPropertyId: null, isDetailOpen: false }),

  openForm: (editId) =>
    set({ isFormOpen: true, editingPropertyId: editId ?? null }),
  closeForm: () => set({ isFormOpen: false, editingPropertyId: null }),
}))

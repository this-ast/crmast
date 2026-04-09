import { create } from 'zustand'
import type { PropertyType, PropertyStatus, MarketType, DealType } from '@/types'

// Virtual filter category (maps to type | marketType | dealType)
export type FilterCategory =
  | PropertyType
  | 'all'
  | 'secondary'   // market_type = secondary
  | 'new_build'   // market_type = new_build
  | 'rent'        // deal_type = rent

interface PropertyFilters {
  category: FilterCategory
  status: PropertyStatus | 'all'
  search: string
  ownerSearch: string
  priceMin: string
  priceMax: string
  areaMin: string
  areaMax: string
  rooms: string       // '' | '1' | '2' | '3' | '4' | '5+'
  floorMin: string
  floorMax: string
  filterMortgage: boolean
  filterInstallment: boolean
  filterTradeIn: boolean
  filterMaternalCap: boolean
  filterMilitaryMort: boolean
  // Land / house
  areaSotkiMin: string
  areaSotkiMax: string
  // Commercial
  filterParking: boolean
  filterActiveBusiness: boolean
  filterWetPoints: boolean
  // New build sub-types
  filterNewBuildReady: boolean
  filterNewBuildUnready: boolean
  // Source
  filterRealtorProperty: boolean
  // Date range
  dateField: 'created_at' | 'updated_at'
  dateFrom: string   // YYYY-MM-DD
  dateTo: string     // YYYY-MM-DD
}

interface PropertyStore {
  filters: PropertyFilters
  selectedPropertyId: string | null
  isDetailOpen: boolean
  isFormOpen: boolean
  editingPropertyId: string | null

  setFilter: <K extends keyof PropertyFilters>(key: K, value: PropertyFilters[K]) => void
  setCategory: (category: FilterCategory) => void
  resetFilters: () => void
  openDetail: (id: string) => void
  closeDetail: () => void
  openForm: (editId?: string) => void
  closeForm: () => void
}

const defaultFilters: PropertyFilters = {
  category: 'all',
  status: 'all',
  search: '',
  ownerSearch: '',
  priceMin: '',
  priceMax: '',
  areaMin: '',
  areaMax: '',
  rooms: '',
  floorMin: '',
  floorMax: '',
  filterMortgage: false,
  filterInstallment: false,
  filterTradeIn: false,
  filterMaternalCap: false,
  filterMilitaryMort: false,
  areaSotkiMin: '',
  areaSotkiMax: '',
  filterParking: false,
  filterActiveBusiness: false,
  filterWetPoints: false,
  filterNewBuildReady: false,
  filterNewBuildUnready: false,
  filterRealtorProperty: false,
  dateField: 'created_at',
  dateFrom: '',
  dateTo: '',
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

  setCategory: (category) =>
    set((state) => ({
      filters: {
        ...state.filters,
        category,
        rooms: '',
        floorMin: '',
        floorMax: '',
        areaSotkiMin: '',
        areaSotkiMax: '',
        filterParking: false,
        filterActiveBusiness: false,
        filterWetPoints: false,
        filterNewBuildReady: false,
        filterNewBuildUnready: false,
      },
    })),

  resetFilters: () => set({ filters: defaultFilters }),

  openDetail: (id) => set({ selectedPropertyId: id, isDetailOpen: true }),
  closeDetail: () => set({ selectedPropertyId: null, isDetailOpen: false }),

  openForm: (editId) =>
    set({ isFormOpen: true, editingPropertyId: editId ?? null }),
  closeForm: () => set({ isFormOpen: false, editingPropertyId: null }),
}))

// Derive actual type/marketType/dealType from category
export function categoryToFilters(category: FilterCategory): {
  type: PropertyType | 'all'
  marketType: MarketType | 'all'
  dealType: DealType | 'all'
} {
  switch (category) {
    case 'secondary':
      return { type: 'all', marketType: 'secondary', dealType: 'all' }
    case 'new_build':
      return { type: 'all', marketType: 'new_build', dealType: 'all' }
    case 'rent':
      return { type: 'all', marketType: 'all', dealType: 'rent' }
    case 'all':
      return { type: 'all', marketType: 'all', dealType: 'all' }
    default:
      return { type: category, marketType: 'all', dealType: 'all' }
  }
}

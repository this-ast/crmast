export type PropertyType = 'apartment' | 'house' | 'land' | 'commercial'
export type PropertyStatus = 'active' | 'sold' | 'reserved' | 'withdrawn'
export type MarketType = 'secondary' | 'new_build' | 'new_build_ready' | 'new_build_unready'
export type DealType = 'sale' | 'rent'

export interface Property {
  id: string
  article: string // APT-001, DOM-001, UCH-001, KOM-001
  type: PropertyType
  status: PropertyStatus

  // Market & deal
  market_type?: MarketType  // вторичка / новострой
  deal_type: DealType       // продажа / аренда
  has_mortgage: boolean       // ипотека
  has_installment: boolean    // рассрочка
  has_trade_in: boolean       // трейд-ин
  has_maternal_cap: boolean   // маткапитал
  has_military_mort: boolean  // военная ипотека

  // Price & Area
  price: number
  price_net?: number      // цена на руки (собственнику)
  agent_commission?: number  // комиссия риэлтора
  area: number // sqm

  // Apartment specific
  rooms?: number
  floor?: number
  total_floors?: number
  view?: string
  kitchen_area?: number
  living_area?: number
  extra_features?: string[]
  room_type?: string
  ceiling_height?: number
  bathroom_type?: string
  window_views?: string[]
  renovation?: string
  heated_floor?: boolean
  furniture?: string[]
  sale_method?: string
  floor_plan?: string

  // Location
  address: string
  complex_name?: string // название ЖК

  // Description
  description?: string

  // Media
  photos: string[]
  videos: string[]
  documents?: { name: string; url: string }[]

  // Owner reference (nullable — can be saved without owner)
  owner_id: string | null

  // Location details
  district?: string

  // Complex reference
  complex_id?: string

  // Land specific
  area_sotki?: number
  communications?: string[]
  cadastral_number?: string

  // House specific
  area2?: number  // площадь второго дома на участке (м²)

  // Commercial specific
  is_active_business?: boolean
  has_wet_points?: boolean
  has_parking?: boolean
  entrance_groups?: number

  // Source
  is_realtor_property: boolean  // объект передан риэлтором в работу

  // New build completion date (free text: "Сдан", "Q4 2027", etc.)
  completion_date?: string

  created_at: string
  updated_at: string
}

// Property with populated owner data (from join)
export interface PropertyWithOwner extends Property {
  owner?: {
    id: string
    client_number: number // #142
    name: string
    phone: string
  }
}

export interface PropertyFormData {
  type: PropertyType
  status: PropertyStatus
  market_type?: MarketType
  deal_type: DealType
  has_mortgage: boolean
  has_installment: boolean
  has_trade_in: boolean
  has_maternal_cap: boolean
  has_military_mort: boolean
  price: number
  price_net?: number
  agent_commission?: number
  area: number
  rooms?: number
  floor?: number
  total_floors?: number
  view?: string
  kitchen_area?: number
  living_area?: number
  extra_features?: string[]
  room_type?: string
  ceiling_height?: number
  bathroom_type?: string
  window_views?: string[]
  renovation?: string
  heated_floor?: boolean
  furniture?: string[]
  sale_method?: string
  floor_plan?: string
  address: string
  complex_name?: string
  description?: string
  owner_id?: string | null
  // Location details
  district?: string
  // Complex
  complex_id?: string
  // Land
  area_sotki?: number
  communications?: string[]
  cadastral_number?: string
  // House extra
  area2?: number
  // Commercial
  is_active_business?: boolean
  has_wet_points?: boolean
  has_parking?: boolean
  entrance_groups?: number
  // Source
  is_realtor_property?: boolean
  // New build completion date
  completion_date?: string
}

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  apartment: 'Квартира',
  house: 'Дом',
  land: 'Участок',
  commercial: 'Коммерция',
}

export const PROPERTY_TYPE_ICONS: Record<PropertyType, string> = {
  apartment: '🏢',
  house: '🏠',
  land: '🌍',
  commercial: '🏬',
}

export const PROPERTY_STATUS_LABELS: Record<PropertyStatus, string> = {
  active: 'Активный',
  sold: 'Продан',
  reserved: 'Резерв',
  withdrawn: 'Снят',
}

export const PROPERTY_STATUS_COLORS: Record<PropertyStatus, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  sold: 'bg-slate-100 text-slate-600',
  reserved: 'bg-amber-100 text-amber-700',
  withdrawn: 'bg-red-100 text-red-600',
}

export const MARKET_TYPE_LABELS: Record<MarketType, string> = {
  secondary: 'Вторичка',
  new_build: 'Новострой',
  new_build_ready: 'Новострой · Сданный дом',
  new_build_unready: 'Новострой · Не сдан',
}

export const DEAL_TYPE_LABELS: Record<DealType, string> = {
  sale: 'Продажа',
  rent: 'Аренда',
}

export const ARTICLE_PREFIXES: Record<PropertyType, string> = {
  apartment: 'APT',
  house: 'DOM',
  land: 'UCH',
  commercial: 'KOM',
}

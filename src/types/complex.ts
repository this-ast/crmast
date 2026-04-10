import type { PropertyWithOwner } from './property'

export interface PricingEntry {
  price_per_sqm?: number
  updated_at?: string
}

export interface ComplexPricing {
  cash?: PricingEntry
  installment_6m?: PricingEntry
  installment_12m?: PricingEntry
  installment_18m?: PricingEntry
  installment_24m?: PricingEntry
  installment_36m?: PricingEntry
  installment_48m?: PricingEntry
  installment_60m?: PricingEntry
  family_mortgage?: PricingEntry
  escrow?: PricingEntry
}

export type PricingPaymentType = 'cash' | 'installment' | 'mortgage' | 'escrow' | 'other'

export interface PricingCondition {
  id: string
  label: string
  payment_type: PricingPaymentType
  price_per_sqm?: number
  notes?: string
  updated_at?: string
}

export interface Complex {
  id: string
  name: string
  description?: string
  developer?: string
  completion_date?: string
  purchase_conditions?: string
  characteristics: Record<string, string>
  developer_phones: string[]
  manager_names: string[]
  manager_phones: string[]
  photos: string[]
  layouts: string[]
  documents: ComplexDocument[]
  created_at: string
  updated_at: string
  floors_total?: string
  elevator?: string
  yard_features?: string[]
  parking?: string[]
  building_type?: string
  district?: string
  address?: string
  pricing?: ComplexPricing
  pricing_conditions: PricingCondition[]
}

export interface ComplexDocument {
  name: string
  url: string
  type: 'permit' | 'developer' | 'other'
}

export interface ComplexWithProperties extends Complex {
  properties?: PropertyWithOwner[]
}

export interface ComplexFormData {
  name: string
  description?: string
  developer?: string
  completion_date?: string
  purchase_conditions?: string
  characteristics: Record<string, string>
  developer_phones: string[]
  manager_names: string[]
  manager_phones: string[]
  floors_total?: string
  elevator?: string
  yard_features?: string[]
  parking?: string[]
  building_type?: string
  district?: string
  address?: string
  pricing?: ComplexPricing
  pricing_conditions?: PricingCondition[]
}

export interface ComplexUnit {
  id: string
  complex_id: string
  title?: string
  rooms?: number
  area?: number
  floor?: number
  floor_to?: number
  total_floors?: number
  price?: number
  notes?: string
  photos: string[]
  created_at: string
  updated_at: string
}

export interface ComplexUnitFormData {
  title?: string
  rooms?: number
  area?: number
  floor?: number
  floor_to?: number
  total_floors?: number
  price?: number
  notes?: string
}

export interface AgentSettings {
  id?: string
  name?: string
  phone?: string
  email?: string
  agency_name?: string
  instagram?: string
  telegram?: string
  whatsapp?: string
  logo_url?: string
}

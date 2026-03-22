import type { PropertyWithOwner } from './property'

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
  documents: ComplexDocument[]
  created_at: string
  updated_at: string
  floors_total?: string
  elevator?: string
  yard_features?: string[]
  parking?: string[]
  building_type?: string
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

export type UserRole = 'admin' | 'agency_owner' | 'agency_manager' | 'realtor' | 'viewer'

export type PropertyType = 'apartment' | 'house' | 'commercial' | 'land'
export type PropertyStatus = 'draft' | 'active' | 'reserved' | 'sold' | 'rented' | 'archived'

export type ClientType = 'buyer' | 'seller' | 'tenant' | 'landlord'
export type ClientStatus = 'new' | 'contacted' | 'negotiation' | 'deal' | 'lost'

export type DealType = 'sale' | 'rent'
export type DealStatus = 'active' | 'completed' | 'cancelled'

export type InteractionType = 'call' | 'meeting' | 'email' | 'message' | 'viewing' | 'note'

export type DocumentStatus = 'draft' | 'sent' | 'signed' | 'cancelled'

export interface Agency {
  id: string
  name: string
  logo_url: string | null
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  settings: Record<string, unknown>
  plan: string
  subscription_status: string
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  agency_id: string | null
  role: UserRole
  full_name: string
  avatar_url: string | null
  phone: string | null
  email: string
  specialization: string | null
  is_active: boolean
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Property {
  id: string
  agency_id: string
  realtor_id: string
  type: PropertyType
  status: PropertyStatus
  title: string
  description: string | null
  address: string
  city: string
  district: string | null
  lat: number | null
  lng: number | null
  price: number
  currency: string
  area: number | null
  rooms: number | null
  floor: number | null
  total_floors: number | null
  features: Record<string, unknown>
  published_at: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

export interface PropertyImage {
  id: string
  property_id: string
  url: string
  sort_order: number
  is_cover: boolean
  created_at: string
}

export interface PropertyPriceHistory {
  id: string
  property_id: string
  old_price: number
  new_price: number
  changed_at: string
  changed_by: string
}

export type ClientPriority = 'high' | 'medium' | 'low'

export interface Client {
  id: string
  agency_id: string
  realtor_id: string
  display_id: number
  full_name: string
  phone: string | null
  email: string | null
  type: ClientType
  status: ClientStatus
  priority: ClientPriority
  preferences: Record<string, unknown>
  source: string | null
  notes: string | null
  last_contact_date: string | null
  created_at: string
  updated_at: string
}

export interface ClientInteraction {
  id: string
  client_id: string
  realtor_id: string
  type: InteractionType
  description: string
  occurred_at: string
  created_at: string
}

export interface Deal {
  id: string
  agency_id: string
  realtor_id: string
  property_id: string | null
  client_id: string | null
  type: DealType
  status: DealStatus
  stage: string
  price: number
  commission_percent: number | null
  commission_amount: number | null
  notes: string | null
  created_at: string
  closed_at: string | null
  updated_at: string
}

export interface DealStage {
  id: string
  deal_id: string
  stage_name: string
  completed: boolean
  completed_at: string | null
  sort_order: number
}

export interface Document {
  id: string
  agency_id: string
  deal_id: string | null
  client_id: string | null
  name: string
  file_url: string | null
  type: string
  status: DocumentStatus
  version: number
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  is_read: boolean
  link: string | null
  created_at: string
}

export interface ActivityLog {
  id: string
  user_id: string
  agency_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  details: Record<string, unknown>
  created_at: string
}

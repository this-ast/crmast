export type DealStatus = 'active' | 'completed' | 'cancelled'

export interface Deal {
  id: string
  deal_number?: number
  title?: string
  deal_date?: string
  buyer_id?: string
  seller_id?: string
  property_id?: string
  property_notes?: string
  payment_method?: string
  deal_price?: number
  commission?: number
  commission_split?: string
  status: DealStatus
  notes?: string
  created_at: string
  updated_at: string
  // Populated via join
  buyer?: { id: string; client_number: number; name: string; phone: string } | null
  seller?: { id: string; client_number: number; name: string; phone: string } | null
  property?: { id: string; article: string; type: string; address: string; price: number } | null
}

export interface DealFormData {
  title?: string
  deal_date?: string
  buyer_id?: string
  seller_id?: string
  property_id?: string
  property_notes?: string
  payment_method?: string
  deal_price?: number
  commission?: number
  commission_split?: string
  status: DealStatus
  notes?: string
}

export const DEAL_STATUSES: { value: DealStatus; label: string; color: string }[] = [
  { value: 'active',    label: 'В работе',  color: 'bg-blue-100 text-blue-700' },
  { value: 'completed', label: 'Завершена', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'cancelled', label: 'Отменена',  color: 'bg-red-100 text-red-600' },
]

export const PAYMENT_METHODS = [
  'Наличные',
  'Ипотека',
  'Рассрочка',
  'Маткапитал',
  'Военная ипотека',
  'Безналичный расчёт',
  'Смешанная',
]

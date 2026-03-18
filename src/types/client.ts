export interface Client {
  id: string
  client_number: number
  name: string
  phone: string
  email?: string
  notes?: string
  request?: string
  budget?: string
  contact_date?: string
  status?: string
  priority?: string
  last_contact?: string
  next_contact?: string
  next_step?: string
  created_at: string
  updated_at: string
}

export interface ClientFormData {
  name: string
  phone: string
  email?: string
  notes?: string
  request?: string
  budget?: string
  contact_date?: string
  status?: string
  priority?: string
  last_contact?: string
  next_contact?: string
  next_step?: string
}

export const CLIENT_STATUSES = [
  'Тёплый',
  'Холодный(ЛИД)',
  'Думает',
  'Воздухан(ка)',
  'Сделка',
  'Архив',
] as const

export const CLIENT_PRIORITIES = [
  '🟡 В работе',
  '🟠Прогреть',
  '🟣 Дожим',
  '💨 Забей!',
  '✅ Закрыто',
  '😴 Ждем',
] as const

export const CLIENT_STATUS_COLORS: Record<string, string> = {
  'Тёплый': 'bg-orange-100 text-orange-700',
  'Холодный(ЛИД)': 'bg-blue-100 text-blue-700',
  'Думает': 'bg-purple-100 text-purple-700',
  'Воздухан(ка)': 'bg-slate-100 text-slate-500',
  'Сделка': 'bg-emerald-100 text-emerald-700',
  'Архив': 'bg-yellow-100 text-yellow-700',
}

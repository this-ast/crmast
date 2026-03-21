export type FunnelStage = 'new' | 'needs' | 'selection' | 'showings' | 'thinking' | 'bargain' | 'deal'

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
  client_type?: string
  status?: string
  priority?: string
  last_contact?: string
  next_contact?: string
  next_step?: string
  funnel_stage?: FunnelStage
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
  client_type?: string
  status?: string
  priority?: string
  last_contact?: string
  next_contact?: string
  next_step?: string
  funnel_stage?: FunnelStage
}

export const FUNNEL_STAGES: { value: FunnelStage; label: string; color: string; bg: string; border: string }[] = [
  { value: 'new',       label: 'Новый клиент',          color: 'text-slate-700',   bg: 'bg-slate-50',   border: 'border-slate-200' },
  { value: 'needs',     label: 'Выявление потребностей', color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200'  },
  { value: 'selection', label: 'Подбор объектов',        color: 'text-violet-700',  bg: 'bg-violet-50',  border: 'border-violet-200'},
  { value: 'showings',  label: 'Просмотры',              color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200' },
  { value: 'thinking',  label: 'Думает',                 color: 'text-orange-700',  bg: 'bg-orange-50',  border: 'border-orange-200'},
  { value: 'bargain',   label: 'Торг',                   color: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-200'  },
  { value: 'deal',      label: 'Сделка',                 color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200'},
]

export const CLIENT_TYPES = [
  'Покупатель',
  'Продавец',
  'Подрядчик-перекуп',
  'Арендодатель',
  'Арендатор',
] as const

export const CLIENT_TYPE_ICONS: Record<string, string> = {
  'Покупатель': '🛒',
  'Продавец': '🏠',
  'Подрядчик-перекуп': '🔄',
  'Арендодатель': '🔑',
  'Арендатор': '🏡',
}

export const CLIENT_TYPE_COLORS: Record<string, string> = {
  'Покупатель': 'bg-blue-100 text-blue-700',
  'Продавец': 'bg-emerald-100 text-emerald-700',
  'Подрядчик-перекуп': 'bg-violet-100 text-violet-700',
  'Арендодатель': 'bg-amber-100 text-amber-700',
  'Арендатор': 'bg-cyan-100 text-cyan-700',
}

export const CLIENT_STATUSES = [
  'Горячий',
  'Теплый',
  'Думает',
  'Воздухан',
  'Холодный',
  'Сделка',
  'Архив',
] as const

// Priority hint shown next to status
export const CLIENT_STATUS_PRIORITY: Record<string, string> = {
  'Горячий': '🔥 Срочно в работу',
  'Теплый': '⚡ Активно работать',
  'Думает': '💭 Прогреть',
  'Воздухан': '💨 Дожать или забить',
  'Холодный': '❄️ Напомнить о себе',
  'Сделка': '✅ Закрыто',
  'Архив': '📦 Архив',
}

export const CLIENT_PRIORITIES = [
  '🟡 В работе',
  '🟠 Прогреть',
  '🟣 Дожим',
  '💨 Забей!',
  '✅ Закрыто',
  '😴 Ждем',
] as const

export const CLIENT_STATUS_COLORS: Record<string, string> = {
  // New statuses
  'Горячий': 'bg-red-100 text-red-700',
  'Теплый': 'bg-orange-100 text-orange-700',
  'Думает': 'bg-purple-100 text-purple-700',
  'Воздухан': 'bg-slate-100 text-slate-500',
  'Холодный': 'bg-blue-100 text-blue-700',
  'Сделка': 'bg-emerald-100 text-emerald-700',
  'Архив': 'bg-yellow-100 text-yellow-700',
  // Legacy statuses (backward compat)
  'Тёплый': 'bg-orange-100 text-orange-700',
  'Холодный(ЛИД)': 'bg-blue-100 text-blue-700',
  'Воздухан(ка)': 'bg-slate-100 text-slate-500',
}

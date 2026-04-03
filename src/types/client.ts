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
  /** Legacy single-type field (kept for backward compat) */
  client_type?: string
  /** Multi-type: Продавец, Покупатель, Арендодатель, Арендатор */
  client_types?: string[]
  status?: string
  priority?: string
  /** Global active/inactive for buyers & tenants (separate from temperature status) */
  is_active?: boolean
  first_contact?: string
  last_contact?: string
  next_contact?: string
  next_step?: string
  funnel_stage?: FunnelStage
  /** Seller: net price (цена на руки) */
  price_net?: number
  /** Landlord: monthly rental price */
  rental_price?: number
  /** Landlord: deposit */
  rental_deposit?: number
  /** Landlord: utilities — 'included' | 'separate' */
  rental_utilities?: string
  /** Seller/Landlord role status: 'Активный' | 'Неактивный' */
  seller_status?: string
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
  client_types?: string[]
  status?: string
  priority?: string
  is_active?: boolean
  first_contact?: string
  last_contact?: string
  next_contact?: string
  next_step?: string
  funnel_stage?: FunnelStage
  price_net?: number
  rental_price?: number
  rental_deposit?: number
  rental_utilities?: string
  seller_status?: string
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

/** Active types shown in UI for new/editing. Legacy types kept only in icon/color maps for display. */
export const CLIENT_TYPES = [
  'Покупатель',
  'Продавец',
  'Арендодатель',
  'Арендатор',
] as const

export const CLIENT_TYPE_ICONS: Record<string, string> = {
  'Покупатель':         '🛒',
  'Продавец':           '🏠',
  'Подрядчик-перекуп':  '🔄',
  'Арендодатель':       '🔑',
  'Арендатор':          '🏡',
}

export const CLIENT_TYPE_COLORS: Record<string, string> = {
  'Покупатель':         'bg-green-100 text-green-800',
  'Арендатор':          'bg-emerald-100 text-emerald-700',
  'Продавец':           'bg-yellow-100 text-yellow-800',
  'Арендодатель':       'bg-amber-100 text-amber-700',
  'Подрядчик-перекуп':  'bg-violet-100 text-violet-700',
}

/** Temperature statuses for Buyers and Tenants */
export const BUYER_STATUSES = ['Горячий', 'Теплый', 'Холодный', 'Воздухан'] as const

/** Simple active/inactive statuses for Sellers and Landlords */
export const SELLER_STATUSES = ['Активный', 'Неактивный'] as const

/** Full list kept for backward compat (filters, display, etc.) */
export const CLIENT_STATUSES = [
  'Горячий',
  'Теплый',
  'Думает',
  'Воздухан',
  'Холодный',
  'Активный',
  'Неактивный',
  'Сделка',
  'Архив',
] as const

// Priority hint shown next to status
export const CLIENT_STATUS_PRIORITY: Record<string, string> = {
  'Горячий':    '🔥 Срочно в работу',
  'Теплый':     '⚡ Активно работать',
  'Холодный':   '❄️ Напомнить о себе',
  'Думает':     '💭 Прогреть',
  'Воздухан':   '💨 Дожать или забить',
  'Активный':   '✅ В работе',
  'Неактивный': '⏸ Приостановлен',
  'Сделка':     '✅ Закрыто',
  'Архив':      '📦 Архив',
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
  'Горячий':    'bg-red-100 text-red-700',
  'Теплый':     'bg-orange-100 text-orange-700',
  'Думает':     'bg-purple-100 text-purple-700',
  'Воздухан':   'bg-slate-100 text-slate-500',
  'Холодный':   'bg-blue-100 text-blue-700',
  'Активный':   'bg-emerald-100 text-emerald-700',
  'Неактивный': 'bg-slate-100 text-slate-500',
  'Сделка':     'bg-emerald-100 text-emerald-700',
  'Архив':      'bg-yellow-100 text-yellow-700',
  // Legacy backward compat
  'Тёплый':          'bg-orange-100 text-orange-700',
  'Холодный(ЛИД)':   'bg-blue-100 text-blue-700',
  'Воздухан(ка)':    'bg-slate-100 text-slate-500',
}

/** Returns the canonical types array for a client, falling back to legacy client_type */
export function getClientTypes(client: Pick<Client, 'client_types' | 'client_type'>): string[] {
  if (client.client_types && client.client_types.length > 0) return client.client_types
  if (client.client_type) return [client.client_type]
  return []
}

/** True if the client is effectively active (any role active — for template display) */
export function isClientActive(client: Pick<Client, 'status' | 'is_active' | 'seller_status' | 'client_types' | 'client_type'>): boolean {
  const types = getClientTypes(client)
  const isBT = types.includes('Покупатель') || types.includes('Арендатор')
  const isSL = types.includes('Продавец') || types.includes('Арендодатель')

  if (isSL && !isBT) return client.seller_status !== 'Неактивный'
  if (isBT && !isSL) return client.is_active !== false && client.status !== 'Архив'
  if (isBT && isSL) {
    const sellerActive = client.seller_status !== 'Неактивный'
    const buyerActive = client.is_active !== false && client.status !== 'Архив'
    return sellerActive || buyerActive
  }
  // Legacy / no type
  return client.status !== 'Неактивный' && client.status !== 'Архив'
}

/** True if the buyer/tenant role specifically is active (used for matching) */
export function isBuyerTenantActive(client: Pick<Client, 'is_active' | 'status'>): boolean {
  return client.is_active !== false && client.status !== 'Архив' && client.status !== 'Неактивный'
}

/** Returns template categories relevant for this client */
export function getClientTemplateCategories(client: Pick<Client, 'client_types' | 'client_type' | 'status' | 'is_active'>): string[] {
  if (!isClientActive(client)) return []
  const types = getClientTypes(client)
  const categories: string[] = []

  if (types.includes('Продавец')) {
    categories.push('Продавцам')
  }
  if (types.includes('Арендодатель')) {
    categories.push('Арендодатель')
  }
  if (types.includes('Покупатель')) {
    categories.push('Покупателям')
    if (client.status === 'Горячий') categories.push('Горячим')
    else if (client.status === 'Теплый' || client.status === 'Тёплый') categories.push('Тёплым')
    else if (client.status === 'Холодный') categories.push('Холодным')
    else if (client.status === 'Думает') categories.push('Думает')
  }
  if (types.includes('Арендатор')) {
    categories.push('Арендатор')
    if (client.status === 'Горячий') categories.push('Горячим')
    else if (client.status === 'Теплый' || client.status === 'Тёплый') categories.push('Тёплым')
    else if (client.status === 'Холодный') categories.push('Холодным')
  }

  return [...new Set(categories)]
}

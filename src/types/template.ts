export interface MessageTemplate {
  id: string
  title: string
  body: string
  category: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface TemplateFormData {
  title: string
  body: string
  category: string
}

export const TEMPLATE_CATEGORIES = [
  { value: 'Продавцам',    label: '🏠 Продавцам' },
  { value: 'Покупателям',  label: '🛒 Покупателям' },
  { value: 'Горячим',      label: '🔥 Горячим' },
  { value: 'Тёплым',       label: '⚡ Тёплым' },
  { value: 'Думает',       label: '💭 Думает' },
  { value: 'Воздухан',     label: '💨 Воздухан' },
  { value: 'Холодным',     label: '❄️ Холодным' },
  { value: 'После показа', label: '🏡 После показа' },
  { value: 'Напоминание',  label: '🔔 Напоминание' },
  { value: 'Общее',        label: '📋 Общее' },
] as const

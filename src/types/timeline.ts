export type TimelineEntityType = 'client' | 'property'

export interface TimelineEvent {
  id: string
  entity_type: TimelineEntityType
  entity_id: string
  event_type: string
  title?: string
  notes?: string
  event_date: string
  created_at: string
  updated_at: string
}

export interface TimelineEventFormData {
  event_type: string
  title?: string
  notes?: string
  event_date: string
}

export const TIMELINE_EVENT_TYPES = [
  { value: 'call',      label: 'Звонок',          icon: '📞', color: 'bg-blue-100 text-blue-700' },
  { value: 'showing',   label: 'Показ',            icon: '🏠', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'rejection', label: 'Отказ',            icon: '❌', color: 'bg-red-100 text-red-600' },
  { value: 'comment',   label: 'Комментарий',      icon: '💬', color: 'bg-slate-100 text-slate-600' },
  { value: 'bargain',   label: 'Торг',             icon: '🤝', color: 'bg-amber-100 text-amber-700' },
  { value: 'send',      label: 'Отправка объекта', icon: '📤', color: 'bg-violet-100 text-violet-700' },
] as const

export type TimelineEventTypeValue = typeof TIMELINE_EVENT_TYPES[number]['value']

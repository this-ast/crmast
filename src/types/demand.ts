export type DemandStatus = 'active' | 'archived' | 'deal'
export type DemandFunnelStage = 'new' | 'needs' | 'selection' | 'showings' | 'thinking' | 'bargain' | 'deal'

export interface Demand {
  id: string
  demand_number?: number
  title?: string
  client_id?: string
  budget_min?: number
  budget_max?: number
  districts?: string[]
  property_types?: string[]   // '1br','2br','3br','studio','commercial'
  payment_types?: string[]    // 'cash','mortgage','installment'
  floor_min?: number
  floor_max?: number
  market_type?: string        // 'primary','secondary','any'
  complex_ids?: string[]
  funnel_stage?: DemandFunnelStage
  status?: DemandStatus
  notes?: string
  created_at: string
  updated_at: string
  // Joined
  client?: { id: string; client_number: number; name: string; phone: string } | null
}

export interface DemandFormData {
  title?: string
  client_id?: string
  budget_min?: number
  budget_max?: number
  districts?: string[]
  property_types?: string[]
  payment_types?: string[]
  floor_min?: number
  floor_max?: number
  market_type?: string
  complex_ids?: string[]
  funnel_stage?: DemandFunnelStage
  status?: DemandStatus
  notes?: string
}

export const DEMAND_FUNNEL_STAGES: { value: DemandFunnelStage; label: string; color: string; bg: string; border: string }[] = [
  { value: 'new',       label: 'Новый',                 color: 'text-slate-700',   bg: 'bg-slate-50',   border: 'border-slate-200' },
  { value: 'needs',     label: 'Выявление потребностей', color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200'  },
  { value: 'selection', label: 'Подбор объектов',        color: 'text-violet-700',  bg: 'bg-violet-50',  border: 'border-violet-200'},
  { value: 'showings',  label: 'Просмотры',              color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200' },
  { value: 'thinking',  label: 'Думает',                 color: 'text-orange-700',  bg: 'bg-orange-50',  border: 'border-orange-200'},
  { value: 'bargain',   label: 'Торг',                   color: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-200'  },
  { value: 'deal',      label: 'Сделка',                 color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200'},
]

export const DEMAND_PROPERTY_TYPES: { value: string; label: string }[] = [
  { value: 'studio',     label: 'Студия'      },
  { value: '1br',        label: '1-комнатная' },
  { value: '2br',        label: '2-комнатная' },
  { value: '3br',        label: '3-комнатная' },
  { value: '4br+',       label: '4+ комнат'   },
  { value: 'commercial', label: 'Коммерция'   },
]

export const DEMAND_PAYMENT_TYPES: { value: string; label: string }[] = [
  { value: 'cash',        label: 'Наличные'  },
  { value: 'mortgage',    label: 'Ипотека'   },
  { value: 'installment', label: 'Рассрочка' },
]

export const DEMAND_MARKET_TYPES: { value: string; label: string }[] = [
  { value: 'any',       label: 'Любой'     },
  { value: 'primary',   label: 'Новостройка'},
  { value: 'secondary', label: 'Вторичка'  },
]

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
  property_types?: string[]   // 'studio','1br','2br','3br','4br+','house','cottage','land','commercial'
  payment_types?: string[]    // 'cash','mortgage','installment'
  floor_min?: number
  floor_max?: number
  area_min?: number
  area_max?: number
  area_sotki_min?: number
  area_sotki_max?: number
  market_type?: string        // 'primary','secondary','any'
  complex_ids?: string[]
  renovation?: string[]
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
  area_min?: number
  area_max?: number
  area_sotki_min?: number
  area_sotki_max?: number
  market_type?: string
  complex_ids?: string[]
  renovation?: string[]
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

// Grouped for form display
export const DEMAND_PROPERTY_GROUPS: { groupLabel: string; icon: string; items: { value: string; label: string }[] }[] = [
  {
    groupLabel: 'Квартиры',
    icon: '🏢',
    items: [
      { value: 'studio', label: 'Студия' },
      { value: '1br',    label: '1-комн.' },
      { value: '2br',    label: '2-комн.' },
      { value: '3br',    label: '3-комн.' },
      { value: '4br+',   label: '4+ комн.' },
    ],
  },
  {
    groupLabel: 'Дома',
    icon: '🏡',
    items: [
      { value: 'house',   label: 'Частный дом' },
      { value: 'cottage', label: 'Коттедж'     },
      { value: 'dacha',   label: 'Дача'        },
    ],
  },
  {
    groupLabel: 'Участки',
    icon: '🌿',
    items: [
      { value: 'land', label: 'Участок' },
    ],
  },
  {
    groupLabel: 'Коммерция',
    icon: '🏪',
    items: [
      { value: 'commercial', label: 'Коммерция' },
    ],
  },
]

// Flat list (for display badges, filters)
export const DEMAND_PROPERTY_TYPES: { value: string; label: string }[] = [
  { value: 'studio',     label: 'Студия'       },
  { value: '1br',        label: '1-комнатная'  },
  { value: '2br',        label: '2-комнатная'  },
  { value: '3br',        label: '3-комнатная'  },
  { value: '4br+',       label: '4+ комнат'    },
  { value: 'house',      label: 'Частный дом'  },
  { value: 'cottage',    label: 'Коттедж'      },
  { value: 'dacha',      label: 'Дача'         },
  { value: 'land',       label: 'Участок'      },
  { value: 'commercial', label: 'Коммерция'    },
]

export const DEMAND_PAYMENT_TYPES: { value: string; label: string }[] = [
  { value: 'cash',        label: 'Наличные'  },
  { value: 'mortgage',    label: 'Ипотека'   },
  { value: 'installment', label: 'Рассрочка' },
]

export const DEMAND_MARKET_TYPES: { value: string; label: string; sub?: { value: string; label: string }[] }[] = [
  { value: 'any',       label: 'Любой'     },
  {
    value: 'primary',   label: 'Новостройка',
    sub: [
      { value: 'primary_ready',   label: 'Сданный дом'   },
      { value: 'primary_unready', label: 'Не сданный дом' },
    ],
  },
  { value: 'secondary', label: 'Вторичка'  },
]

// Helper: determine which category the selected types belong to
export type DemandCategory = 'apartment' | 'house' | 'land' | 'commercial' | 'mixed' | 'none'

const APARTMENT_TYPES = new Set(['studio', '1br', '2br', '3br', '4br+'])
const HOUSE_TYPES = new Set(['house', 'cottage', 'dacha'])
const LAND_TYPES = new Set(['land'])
const COMMERCIAL_TYPES = new Set(['commercial'])

export function getDemandCategory(types: string[]): DemandCategory {
  if (!types || types.length === 0) return 'none'
  const hasApt = types.some((t) => APARTMENT_TYPES.has(t))
  const hasHouse = types.some((t) => HOUSE_TYPES.has(t))
  const hasLand = types.some((t) => LAND_TYPES.has(t))
  const hasCom = types.some((t) => COMMERCIAL_TYPES.has(t))
  const cats = [hasApt, hasHouse, hasLand, hasCom].filter(Boolean).length
  if (cats > 1) return 'mixed'
  if (hasApt) return 'apartment'
  if (hasHouse) return 'house'
  if (hasLand) return 'land'
  if (hasCom) return 'commercial'
  return 'none'
}

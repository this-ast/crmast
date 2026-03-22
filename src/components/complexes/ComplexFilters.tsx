import { Filter, X } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface ComplexFilterState {
  buildingType: string
  elevator: string
  yardFeatures: string[]
  parkingTypes: string[]
  floorsMin: string
  floorsMax: string
}

export const defaultComplexFilters: ComplexFilterState = {
  buildingType: '',
  elevator: '',
  yardFeatures: [],
  parkingTypes: [],
  floorsMin: '',
  floorsMax: '',
}

const ELEVATOR_OPTIONS = ['нет', '1', '2', '3+']
const YARD_OPTIONS = ['закрытая территория', 'детская площадка', 'спортивная площадка']
const PARKING_OPTIONS = ['подземная', 'наземная', 'многоуровневая', 'открытая во дворе', 'за шлагбаумом']
const BUILDING_TYPE_OPTIONS = ['кирпичный', 'монолитно-кирпичный', 'блочный', 'монолитно-блочный']

interface ComplexFiltersProps {
  filters: ComplexFilterState
  onChange: (f: ComplexFilterState) => void
  onReset: () => void
  resultCount: number
  totalCount: number
}

function ToggleGroup({
  options, value, onChange, multi = false
}: {
  options: string[]
  value: string | string[]
  onChange: (v: string | string[]) => void
  multi?: boolean
}) {
  const selected = multi ? (value as string[]) : []
  const singleVal = multi ? '' : (value as string)

  function toggle(opt: string) {
    if (multi) {
      const arr = selected.includes(opt) ? selected.filter(x => x !== opt) : [...selected, opt]
      onChange(arr)
    } else {
      onChange(singleVal === opt ? '' : opt)
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => {
        const active = multi ? selected.includes(opt) : singleVal === opt
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors',
              active
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
            )}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

export default function ComplexFilters({ filters, onChange, onReset, resultCount, totalCount }: ComplexFiltersProps) {
  const hasActive =
    filters.buildingType ||
    filters.elevator ||
    filters.yardFeatures.length > 0 ||
    filters.parkingTypes.length > 0 ||
    filters.floorsMin ||
    filters.floorsMax

  function set<K extends keyof ComplexFilterState>(key: K, val: ComplexFilterState[K]) {
    onChange({ ...filters, [key]: val })
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 mb-5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <Filter size={15} className="text-slate-400" />
          Фильтры
          {hasActive && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
              {resultCount} из {totalCount}
            </span>
          )}
        </div>
        {hasActive && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-500 transition-colors"
          >
            <X size={12} /> Сбросить
          </button>
        )}
      </div>

      {/* Floors */}
      <div>
        <p className="text-xs font-medium text-slate-500 mb-1.5">Этажность</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="от"
            value={filters.floorsMin}
            onChange={(e) => set('floorsMin', e.target.value)}
            className="w-20 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-slate-400 text-xs">—</span>
          <input
            type="number"
            placeholder="до"
            value={filters.floorsMax}
            onChange={(e) => set('floorsMax', e.target.value)}
            className="w-20 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Building type */}
      <div>
        <p className="text-xs font-medium text-slate-500 mb-1.5">Тип дома</p>
        <ToggleGroup
          options={BUILDING_TYPE_OPTIONS}
          value={filters.buildingType}
          onChange={(v) => set('buildingType', v as string)}
        />
      </div>

      {/* Elevator */}
      <div>
        <p className="text-xs font-medium text-slate-500 mb-1.5">Лифт</p>
        <ToggleGroup
          options={ELEVATOR_OPTIONS}
          value={filters.elevator}
          onChange={(v) => set('elevator', v as string)}
        />
      </div>

      {/* Yard */}
      <div>
        <p className="text-xs font-medium text-slate-500 mb-1.5">Двор</p>
        <ToggleGroup
          options={YARD_OPTIONS}
          value={filters.yardFeatures}
          onChange={(v) => set('yardFeatures', v as string[])}
          multi
        />
      </div>

      {/* Parking */}
      <div>
        <p className="text-xs font-medium text-slate-500 mb-1.5">Парковка</p>
        <ToggleGroup
          options={PARKING_OPTIONS}
          value={filters.parkingTypes}
          onChange={(v) => set('parkingTypes', v as string[])}
          multi
        />
      </div>
    </div>
  )
}

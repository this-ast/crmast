import { Search, X } from 'lucide-react'
import { usePropertyStore } from '@/store/usePropertyStore'
import type { PropertyType, PropertyStatus } from '@/types'
import { cn } from '@/utils/cn'

const types: Array<{ value: PropertyType | 'all'; label: string }> = [
  { value: 'all', label: 'Все' },
  { value: 'apartment', label: '🏢 Квартиры' },
  { value: 'house', label: '🏠 Дома' },
  { value: 'land', label: '🌍 Участки' },
  { value: 'commercial', label: '🏬 Коммерция' },
]

const statuses: Array<{ value: PropertyStatus | 'all'; label: string }> = [
  { value: 'all', label: 'Все статусы' },
  { value: 'active', label: 'Активные' },
  { value: 'reserved', label: 'Резерв' },
  { value: 'sold', label: 'Проданные' },
  { value: 'withdrawn', label: 'Снятые' },
]

export default function PropertyFilters() {
  const { filters, setFilter, resetFilters } = usePropertyStore()

  const hasActiveFilters =
    filters.type !== 'all' ||
    filters.status !== 'all' ||
    filters.search !== '' ||
    filters.priceMin !== '' ||
    filters.priceMax !== '' ||
    filters.areaMin !== '' ||
    filters.areaMax !== ''

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Поиск по адресу, ЖК, артикулу..."
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {filters.search && (
          <button
            onClick={() => setFilter('search', '')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Type filters */}
      <div className="flex flex-wrap gap-2">
        {types.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter('type', value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              filters.type === value
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Status + price + area row */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={filters.status}
          onChange={(e) => setFilter('status', e.target.value as PropertyStatus | 'all')}
          className="py-2 px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {statuses.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Цена от"
          value={filters.priceMin}
          onChange={(e) => setFilter('priceMin', e.target.value)}
          className="w-28 py-2 px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="number"
          placeholder="Цена до"
          value={filters.priceMax}
          onChange={(e) => setFilter('priceMax', e.target.value)}
          className="w-28 py-2 px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="number"
          placeholder="м² от"
          value={filters.areaMin}
          onChange={(e) => setFilter('areaMin', e.target.value)}
          className="w-20 py-2 px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="number"
          placeholder="м² до"
          value={filters.areaMax}
          onChange={(e) => setFilter('areaMax', e.target.value)}
          className="w-20 py-2 px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <X size={13} />
            Сбросить
          </button>
        )}
      </div>
    </div>
  )
}

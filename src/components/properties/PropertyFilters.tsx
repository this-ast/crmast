import { useState, useMemo } from 'react'
import { Search, X, User } from 'lucide-react'
import { usePropertyStore, categoryToFilters } from '@/store/usePropertyStore'
import type { FilterCategory } from '@/store/usePropertyStore'
import type { PropertyStatus } from '@/types'
import { useClients } from '@/hooks/useClients'
import { cn } from '@/utils/cn'

// ─── Category definitions ───────────────────────────────────────────────────

const CATEGORIES: Array<{ value: FilterCategory; label: string }> = [
  { value: 'all',        label: 'Все' },
  { value: 'apartment',  label: '🏢 Квартиры' },
  { value: 'house',      label: '🏠 Дома' },
  { value: 'land',       label: '🌍 Участки' },
  { value: 'commercial', label: '🏬 Коммерция' },
  { value: 'secondary',  label: '🏘 Вторичка' },
  { value: 'new_build',  label: '🏗 Новострой' },
  { value: 'rent',       label: '🔑 Аренда' },
]

const STATUSES: Array<{ value: PropertyStatus | 'all'; label: string }> = [
  { value: 'all',       label: 'Любой статус' },
  { value: 'active',    label: 'Активные' },
  { value: 'reserved',  label: 'Резерв' },
  { value: 'sold',      label: 'Проданные' },
  { value: 'withdrawn', label: 'Снятые' },
]

const ROOMS_OPTIONS = ['1', '2', '3', '4', '5+']

// ─── Helpers ────────────────────────────────────────────────────────────────

function showRoomsFilter(cat: FilterCategory) {
  return cat === 'apartment' || cat === 'secondary' || cat === 'new_build' || cat === 'all' || cat === 'rent'
}

function showFloorFilter(cat: FilterCategory) {
  return cat === 'apartment' || cat === 'secondary' || cat === 'new_build'
}

function showSotkiFilter(cat: FilterCategory) {
  return cat === 'land' || cat === 'house'
}

function showCommercialConditions(cat: FilterCategory) {
  return cat === 'commercial'
}

function showDealConditions(cat: FilterCategory) {
  return cat !== 'land' && cat !== 'commercial'
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function PropertyFilters() {
  const { filters, setFilter, setCategory, resetFilters } = usePropertyStore()
  const { category } = filters
  const { data: clients = [] } = useClients()

  const [ownerFocused, setOwnerFocused] = useState(false)

  // Autocomplete: match clients by name when typing
  const ownerSuggestions = useMemo(() => {
    const q = filters.ownerSearch.trim().toLowerCase()
    if (q.length < 1) return []
    return clients
      .filter((c) => c.name.toLowerCase().includes(q))
      .slice(0, 6)
  }, [clients, filters.ownerSearch])

  const showOwnerDropdown = ownerFocused && ownerSuggestions.length > 0

  const hasActiveFilters =
    category !== 'all' ||
    filters.status !== 'all' ||
    filters.search !== '' ||
    filters.ownerSearch !== '' ||
    filters.priceMin !== '' ||
    filters.priceMax !== '' ||
    filters.areaMin !== '' ||
    filters.areaMax !== '' ||
    filters.areaSotkiMin !== '' ||
    filters.areaSotkiMax !== '' ||
    filters.rooms !== '' ||
    filters.floorMin !== '' ||
    filters.floorMax !== '' ||
    filters.filterMortgage ||
    filters.filterInstallment ||
    filters.filterTradeIn ||
    filters.filterMaternalCap ||
    filters.filterMilitaryMort ||
    filters.filterParking ||
    filters.filterActiveBusiness ||
    filters.filterWetPoints

  const { dealType } = categoryToFilters(category)
  const priceLabel = dealType === 'rent' ? 'Аренда/мес' : 'Цена'

  return (
    <div className="space-y-3">
      {/* ── Row 1: Search + Owner search ── */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Поиск по адресу, ЖК, артикулу..."
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {filters.search && (
            <button
              onClick={() => setFilter('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Owner search with autocomplete */}
        <div className="relative w-56">
          <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
          <input
            type="text"
            placeholder="Собственник..."
            value={filters.ownerSearch}
            onChange={(e) => setFilter('ownerSearch', e.target.value)}
            onFocus={() => setOwnerFocused(true)}
            onBlur={() => setTimeout(() => setOwnerFocused(false), 150)}
            className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {filters.ownerSearch && (
            <button
              onClick={() => setFilter('ownerSearch', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={13} />
            </button>
          )}
          {/* Autocomplete dropdown */}
          {showOwnerDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-30 overflow-hidden">
              {ownerSuggestions.map((c) => (
                <button
                  key={c.id}
                  onMouseDown={() => {
                    setFilter('ownerSearch', c.name)
                    setOwnerFocused(false)
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex items-center gap-2 transition-colors"
                >
                  <span className="text-xs font-mono text-slate-400 shrink-0">#{c.client_number}</span>
                  <span className="text-slate-800 truncate">{c.name}</span>
                  {c.phone && (
                    <span className="text-xs text-slate-400 ml-auto shrink-0">
                      {c.phone.slice(-4)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Row 2: Category tabs ── */}
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setCategory(value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              category === value
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Row 3: Dynamic sub-filters ── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status */}
        <select
          value={filters.status}
          onChange={(e) => setFilter('status', e.target.value as PropertyStatus | 'all')}
          className="py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {STATUSES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        {/* Price */}
        <div className="flex items-center gap-1">
          <input
            type="number"
            placeholder={`${priceLabel} от`}
            value={filters.priceMin}
            onChange={(e) => setFilter('priceMin', e.target.value)}
            className="w-28 py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-slate-300 text-xs">—</span>
          <input
            type="number"
            placeholder={`${priceLabel} до`}
            value={filters.priceMax}
            onChange={(e) => setFilter('priceMax', e.target.value)}
            className="w-28 py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Area м² — for all except land */}
        {category !== 'land' && (
          <div className="flex items-center gap-1">
            <input
              type="number"
              placeholder="м² от"
              value={filters.areaMin}
              onChange={(e) => setFilter('areaMin', e.target.value)}
              className="w-20 py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-slate-300 text-xs">—</span>
            <input
              type="number"
              placeholder="м² до"
              value={filters.areaMax}
              onChange={(e) => setFilter('areaMax', e.target.value)}
              className="w-20 py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Area sotki — for land / house */}
        {showSotkiFilter(category) && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500 mr-0.5">Соток:</span>
            <input
              type="number"
              placeholder="от"
              value={filters.areaSotkiMin}
              onChange={(e) => setFilter('areaSotkiMin', e.target.value)}
              className="w-16 py-2 px-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-slate-300 text-xs">—</span>
            <input
              type="number"
              placeholder="до"
              value={filters.areaSotkiMax}
              onChange={(e) => setFilter('areaSotkiMax', e.target.value)}
              className="w-16 py-2 px-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Rooms — for apartments / secondary / new_build / all / rent */}
        {showRoomsFilter(category) && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500 mr-0.5">Комнат:</span>
            {ROOMS_OPTIONS.map((r) => (
              <button
                key={r}
                onClick={() => setFilter('rooms', filters.rooms === r ? '' : r)}
                className={cn(
                  'w-7 h-7 rounded-lg text-xs font-semibold border transition-all',
                  filters.rooms === r
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                )}
              >
                {r}
              </button>
            ))}
          </div>
        )}

        {/* Floor — for apartments / secondary / new_build */}
        {showFloorFilter(category) && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500 mr-0.5">Этаж:</span>
            <input
              type="number"
              placeholder="от"
              value={filters.floorMin}
              onChange={(e) => setFilter('floorMin', e.target.value)}
              className="w-14 py-2 px-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-slate-300 text-xs">—</span>
            <input
              type="number"
              placeholder="до"
              value={filters.floorMax}
              onChange={(e) => setFilter('floorMax', e.target.value)}
              className="w-14 py-2 px-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      {/* ── Row 4: Deal conditions (ипотека, рассрочка...) ── */}
      {showDealConditions(category) && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500">Условия:</span>
          {([
            ['filterMortgage', '🏦 Ипотека', 'violet'],
            ['filterInstallment', '📅 Рассрочка', 'emerald'],
            ['filterTradeIn', '🔄 Трейд-ин', 'orange'],
            ['filterMaternalCap', '👶 Маткапитал', 'pink'],
            ['filterMilitaryMort', '🎖 Воен. ипотека', 'slate'],
          ] as const).map(([key, label, color]) => (
            <button
              key={key}
              onClick={() => setFilter(key, !filters[key])}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                filters[key]
                  ? color === 'violet' ? 'bg-violet-600 text-white border-violet-600'
                    : color === 'emerald' ? 'bg-emerald-600 text-white border-emerald-600'
                    : color === 'orange' ? 'bg-orange-500 text-white border-orange-500'
                    : color === 'pink' ? 'bg-pink-500 text-white border-pink-500'
                    : 'bg-slate-700 text-white border-slate-700'
                  : color === 'violet' ? 'bg-white text-slate-600 border-slate-200 hover:border-violet-300 hover:text-violet-600'
                    : color === 'emerald' ? 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-emerald-600'
                    : color === 'orange' ? 'bg-white text-slate-600 border-slate-200 hover:border-orange-300 hover:text-orange-600'
                    : color === 'pink' ? 'bg-white text-slate-600 border-slate-200 hover:border-pink-300 hover:text-pink-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:text-slate-700'
              )}
            >
              {label}
            </button>
          ))}

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors ml-auto"
            >
              <X size={12} />
              Сбросить
            </button>
          )}
        </div>
      )}

      {/* ── Row 4b: Commercial-specific conditions ── */}
      {showCommercialConditions(category) && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500">Параметры:</span>
          {([
            ['filterMortgage', '🏦 Ипотека', 'violet'],
            ['filterInstallment', '📅 Рассрочка', 'emerald'],
            ['filterActiveBusiness', '⚡ Действующий бизнес', 'blue'],
            ['filterParking', '🅿️ Парковка', 'sky'],
            ['filterWetPoints', '💧 Мокрые точки', 'cyan'],
          ] as const).map(([key, label, color]) => (
            <button
              key={key}
              onClick={() => setFilter(key, !filters[key])}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                filters[key]
                  ? color === 'violet' ? 'bg-violet-600 text-white border-violet-600'
                    : color === 'emerald' ? 'bg-emerald-600 text-white border-emerald-600'
                    : color === 'blue' ? 'bg-blue-600 text-white border-blue-600'
                    : color === 'sky' ? 'bg-sky-500 text-white border-sky-500'
                    : 'bg-cyan-500 text-white border-cyan-500'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
              )}
            >
              {label}
            </button>
          ))}

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors ml-auto"
            >
              <X size={12} />
              Сбросить
            </button>
          )}
        </div>
      )}

      {/* ── Reset button when no conditions row shown (land) ── */}
      {!showDealConditions(category) && !showCommercialConditions(category) && hasActiveFilters && (
        <div className="flex">
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <X size={12} />
            Сбросить
          </button>
        </div>
      )}
    </div>
  )
}

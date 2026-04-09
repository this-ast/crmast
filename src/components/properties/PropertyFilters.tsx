import { useState, useMemo } from 'react'
import { Search, X, User, Calendar, SlidersHorizontal } from 'lucide-react'
import { usePropertyStore, categoryToFilters } from '@/store/usePropertyStore'
import type { FilterCategory } from '@/store/usePropertyStore'
import type { PropertyStatus } from '@/types'
import { useClients } from '@/hooks/useClients'
import { cn } from '@/utils/cn'

// ─── Category definitions ────────────────────────────────────────────────────

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

// ─── Sub-section label ───────────────────────────────────────────────────────
function FilterLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{children}</span>
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function PropertyFilters() {
  const { filters, setFilter, setCategory, resetFilters } = usePropertyStore()
  const { category } = filters
  const { data: clients = [] } = useClients()

  const [showAdvanced, setShowAdvanced] = useState(false)
  const [ownerFocused, setOwnerFocused] = useState(false)

  const ownerSuggestions = useMemo(() => {
    const q = filters.ownerSearch.trim().toLowerCase()
    if (q.length < 1) return []
    return clients.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 6)
  }, [clients, filters.ownerSearch])

  const showOwnerDropdown = ownerFocused && ownerSuggestions.length > 0

  // Count active hidden filters (not search/status/category — those are always visible)
  const hiddenActiveCount = [
    filters.ownerSearch !== '',
    filters.priceMin !== '',
    filters.priceMax !== '',
    filters.areaMin !== '',
    filters.areaMax !== '',
    filters.areaSotkiMin !== '',
    filters.areaSotkiMax !== '',
    filters.rooms !== '',
    filters.floorMin !== '',
    filters.floorMax !== '',
    filters.filterMortgage,
    filters.filterInstallment,
    filters.filterTradeIn,
    filters.filterMaternalCap,
    filters.filterMilitaryMort,
    filters.filterParking,
    filters.filterActiveBusiness,
    filters.filterWetPoints,
    filters.filterNewBuildReady,
    filters.filterNewBuildUnready,
    filters.filterRealtorProperty,
    filters.dateFrom !== '',
    filters.dateTo !== '',
  ].filter(Boolean).length

  const hasAnyFilter =
    category !== 'all' ||
    filters.status !== 'all' ||
    filters.search !== '' ||
    hiddenActiveCount > 0

  const { dealType } = categoryToFilters(category)
  const priceLabel = dealType === 'rent' ? 'Аренда/мес' : 'Цена'

  return (
    <div className="space-y-3 w-full">
      {/* ── Row 1: Search (full width) ── */}
      <div className="relative w-full">
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

      {/* ── Row 2: Status + Фильтры button ── */}
      <div className="flex gap-2">
        {/* Status */}
        <select
          value={filters.status}
          onChange={(e) => setFilter('status', e.target.value as PropertyStatus | 'all')}
          className="flex-1 min-w-0 py-2 px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {STATUSES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        {/* Фильтры toggle */}
        <button
          onClick={() => setShowAdvanced((v) => !v)}
          className={cn(
            'relative flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors shrink-0',
            showAdvanced || hiddenActiveCount > 0
              ? 'bg-blue-600 border-blue-600 text-white'
              : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
          )}
        >
          <SlidersHorizontal size={15} />
          Фильтры
          {hiddenActiveCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full">
              {hiddenActiveCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Row 2: Category tabs (always visible) ── */}
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

        {hasAnyFilter && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors ml-auto"
          >
            <X size={11} />
            Сбросить
          </button>
        )}
      </div>

      {/* New build sub-filters */}
      {category === 'new_build' && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilter('filterNewBuildReady', !filters.filterNewBuildReady)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
              filters.filterNewBuildReady
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400 hover:text-emerald-600'
            )}
          >
            ✅ Сданный дом
          </button>
          <button
            onClick={() => setFilter('filterNewBuildUnready', !filters.filterNewBuildUnready)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
              filters.filterNewBuildUnready
                ? 'bg-orange-500 text-white border-orange-500'
                : 'bg-white text-slate-600 border-slate-200 hover:border-orange-400 hover:text-orange-600'
            )}
          >
            🏗 Не сдан
          </button>
        </div>
      )}

      {/* ── Advanced filters panel ── */}
      {showAdvanced && (
        <div className="w-full bg-white border border-slate-200 rounded-2xl p-4 space-y-4 overflow-hidden">

          {/* Собственник */}
          <div className="space-y-1.5">
            <FilterLabel>Собственник</FilterLabel>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
              <input
                type="text"
                placeholder="Поиск по имени..."
                value={filters.ownerSearch}
                onChange={(e) => setFilter('ownerSearch', e.target.value)}
                onFocus={() => setOwnerFocused(true)}
                onBlur={() => setTimeout(() => setOwnerFocused(false), 150)}
                className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
              {filters.ownerSearch && (
                <button
                  onClick={() => setFilter('ownerSearch', '')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={13} />
                </button>
              )}
              {showOwnerDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-30 overflow-hidden">
                  {ownerSuggestions.map((c) => (
                    <button
                      key={c.id}
                      onMouseDown={() => { setFilter('ownerSearch', c.name); setOwnerFocused(false) }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex items-center gap-2 transition-colors"
                    >
                      <span className="text-xs font-mono text-slate-400 shrink-0">#{c.client_number}</span>
                      <span className="text-slate-800 truncate">{c.name}</span>
                      {c.phone && <span className="text-xs text-slate-400 ml-auto shrink-0">{c.phone.slice(-4)}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Цена */}
          <div className="space-y-1.5">
            <FilterLabel>{priceLabel}</FilterLabel>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="от"
                value={filters.priceMin}
                onChange={(e) => setFilter('priceMin', e.target.value)}
                className="flex-1 min-w-0 py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
              <span className="text-slate-300 text-sm">—</span>
              <input
                type="number"
                placeholder="до"
                value={filters.priceMax}
                onChange={(e) => setFilter('priceMax', e.target.value)}
                className="flex-1 min-w-0 py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Площадь */}
          {(category !== 'land' || showSotkiFilter(category)) && (
            <div className="space-y-1.5">
              <FilterLabel>Площадь</FilterLabel>
              <div className="space-y-2">
                {category !== 'land' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-10 shrink-0">м²</span>
                    <input
                      type="number"
                      placeholder="от"
                      value={filters.areaMin}
                      onChange={(e) => setFilter('areaMin', e.target.value)}
                      className="flex-1 min-w-0 py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                    <span className="text-slate-300 text-sm">—</span>
                    <input
                      type="number"
                      placeholder="до"
                      value={filters.areaMax}
                      onChange={(e) => setFilter('areaMax', e.target.value)}
                      className="flex-1 min-w-0 py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                )}
                {showSotkiFilter(category) && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-10 shrink-0">сот.</span>
                    <input
                      type="number"
                      placeholder="от"
                      value={filters.areaSotkiMin}
                      onChange={(e) => setFilter('areaSotkiMin', e.target.value)}
                      className="flex-1 min-w-0 py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                    <span className="text-slate-300 text-sm">—</span>
                    <input
                      type="number"
                      placeholder="до"
                      value={filters.areaSotkiMax}
                      onChange={(e) => setFilter('areaSotkiMax', e.target.value)}
                      className="flex-1 min-w-0 py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Комнаты */}
          {showRoomsFilter(category) && (
            <div className="space-y-1.5">
              <FilterLabel>Комнат</FilterLabel>
              <div className="flex items-center gap-1.5">
                {ROOMS_OPTIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setFilter('rooms', filters.rooms === r ? '' : r)}
                    className={cn(
                      'w-9 h-9 rounded-xl text-sm font-semibold border transition-all',
                      filters.rooms === r
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300'
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Этаж */}
          {showFloorFilter(category) && (
            <div className="space-y-1.5">
              <FilterLabel>Этаж</FilterLabel>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="от"
                  value={filters.floorMin}
                  onChange={(e) => setFilter('floorMin', e.target.value)}
                  className="flex-1 min-w-0 py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
                <span className="text-slate-300 text-sm">—</span>
                <input
                  type="number"
                  placeholder="до"
                  value={filters.floorMax}
                  onChange={(e) => setFilter('floorMax', e.target.value)}
                  className="flex-1 min-w-0 py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>
          )}

          {/* Условия сделки */}
          {showDealConditions(category) && (
            <div className="space-y-1.5">
              <FilterLabel>Условия сделки</FilterLabel>
              <div className="flex flex-wrap gap-1.5">
                {([
                  ['filterMortgage',    '🏦 Ипотека',         'violet'],
                  ['filterInstallment', '📅 Рассрочка',       'emerald'],
                  ['filterTradeIn',     '🔄 Трейд-ин',        'orange'],
                  ['filterMaternalCap', '👶 Маткапитал',      'pink'],
                  ['filterMilitaryMort','🎖 Воен. ипотека',   'slate'],
                ] as const).map(([key, label, color]) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key, !filters[key])}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all',
                      filters[key]
                        ? color === 'violet'  ? 'bg-violet-600 text-white border-violet-600'
                          : color === 'emerald' ? 'bg-emerald-600 text-white border-emerald-600'
                          : color === 'orange'  ? 'bg-orange-500 text-white border-orange-500'
                          : color === 'pink'    ? 'bg-pink-500 text-white border-pink-500'
                          : 'bg-slate-700 text-white border-slate-700'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Коммерция */}
          {showCommercialConditions(category) && (
            <div className="space-y-1.5">
              <FilterLabel>Параметры</FilterLabel>
              <div className="flex flex-wrap gap-1.5">
                {([
                  ['filterMortgage',       '🏦 Ипотека',             'violet'],
                  ['filterInstallment',    '📅 Рассрочка',           'emerald'],
                  ['filterActiveBusiness', '⚡ Действующий бизнес', 'blue'],
                  ['filterParking',        '🅿️ Парковка',           'sky'],
                  ['filterWetPoints',      '💧 Мокрые точки',        'cyan'],
                ] as const).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key, !filters[key])}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all',
                      filters[key]
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Дата */}
          <div className="space-y-1.5">
            <FilterLabel>Дата</FilterLabel>
            <div className="space-y-2">
              <select
                value={filters.dateField}
                onChange={(e) => setFilter('dateField', e.target.value as 'created_at' | 'updated_at')}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="created_at">Дата добавления</option>
                <option value="updated_at">Дата изменения</option>
              </select>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilter('dateFrom', e.target.value)}
                  className="flex-1 min-w-0 py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-slate-300 text-sm shrink-0">—</span>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilter('dateTo', e.target.value)}
                  className="flex-1 min-w-0 py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {(filters.dateFrom || filters.dateTo) && (
                  <button
                    onClick={() => { setFilter('dateFrom', ''); setFilter('dateTo', '') }}
                    className="text-slate-400 hover:text-slate-600 shrink-0"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Риэлтор */}
          <div className="pt-1 flex items-center justify-between">
            <button
              onClick={() => setFilter('filterRealtorProperty', !filters.filterRealtorProperty)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all',
                filters.filterRealtorProperty
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-purple-300 hover:text-purple-600'
              )}
            >
              🤝 Только объекты риэлтора
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

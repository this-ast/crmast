import { useMemo, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Building2, AlertCircle, Loader2, Settings, Search, LayoutList, LayoutGrid } from 'lucide-react'
import { useProperties } from '@/hooks/useProperties'
import { usePropertyStore, categoryToFilters } from '@/store/usePropertyStore'
import { useActiveTaskCounts } from '@/hooks/useTasks'
import { useAllComplexUnits, useComplexes } from '@/hooks/useComplexes'
import PropertyCard from '@/components/properties/PropertyCard'
import PropertyFilters from '@/components/properties/PropertyFilters'
import PropertyDetail from '@/components/properties/PropertyDetail'
import PropertyForm from '@/components/properties/PropertyForm'
import Modal from '@/components/ui/Modal'
import OptionsManager from '@/components/settings/OptionsManager'
import UnitDetailModal from '@/components/complexes/UnitDetailModal'
import DeveloperUnitForm from '@/components/complexes/DeveloperUnitForm'
import type { PropertyWithOwner, ComplexUnit } from '@/types'
import { formatPriceShort } from '@/utils/format'
import { cn } from '@/utils/cn'

function filterProperties(
  properties: PropertyWithOwner[],
  filters: ReturnType<typeof usePropertyStore.getState>['filters']
): PropertyWithOwner[] {
  const { type, marketType, dealType } = categoryToFilters(filters.category)

  return properties.filter((p) => {
    // Category filters
    if (type !== 'all' && p.type !== type) return false
    if (marketType !== 'all') {
      // new_build category matches all three new_build variants
      if (marketType === 'new_build') {
        if (!['new_build', 'new_build_ready', 'new_build_unready'].includes(p.market_type ?? '')) return false
      } else {
        if (p.market_type !== marketType) return false
      }
    }
    if (dealType !== 'all' && p.deal_type !== dealType) return false

    // New build sub-type filters
    if (filters.filterNewBuildReady || filters.filterNewBuildUnready) {
      const allowed: string[] = []
      if (filters.filterNewBuildReady) allowed.push('new_build_ready')
      if (filters.filterNewBuildUnready) allowed.push('new_build_unready')
      if (!allowed.includes(p.market_type ?? '')) return false
    }

    // Status — by default hide sold/withdrawn; show them only when explicitly selected
    if (filters.status === 'all') {
      if (p.status === 'sold' || p.status === 'withdrawn') return false
    } else {
      if (p.status !== filters.status) return false
    }

    // Text search (address, complex, article)
    if (filters.search) {
      const q = filters.search.toLowerCase()
      const searchIn = [p.article, p.address, p.complex_name, p.description]
        .filter(Boolean).join(' ').toLowerCase()
      if (!searchIn.includes(q)) return false
    }

    // Owner search
    if (filters.ownerSearch) {
      const q = filters.ownerSearch.toLowerCase()
      const ownerName = p.owner?.name?.toLowerCase() ?? ''
      if (!ownerName.includes(q)) return false
    }

    // Price
    if (filters.priceMin && p.price < Number(filters.priceMin)) return false
    if (filters.priceMax && p.price > Number(filters.priceMax)) return false

    // Area
    if (filters.areaMin && p.area < Number(filters.areaMin)) return false
    if (filters.areaMax && p.area > Number(filters.areaMax)) return false

    // Rooms
    if (filters.rooms) {
      if (filters.rooms === '5+') {
        if (!p.rooms || p.rooms < 5) return false
      } else {
        if (p.rooms !== Number(filters.rooms)) return false
      }
    }

    // Floor
    if (filters.floorMin && (!p.floor || p.floor < Number(filters.floorMin))) return false
    if (filters.floorMax && (!p.floor || p.floor > Number(filters.floorMax))) return false

    // Sotki (land / house)
    if (filters.areaSotkiMin && (!p.area_sotki || p.area_sotki < Number(filters.areaSotkiMin))) return false
    if (filters.areaSotkiMax && (!p.area_sotki || p.area_sotki > Number(filters.areaSotkiMax))) return false

    // Deal conditions
    if (filters.filterMortgage && !p.has_mortgage) return false
    if (filters.filterInstallment && !p.has_installment) return false
    if (filters.filterTradeIn && !p.has_trade_in) return false
    if (filters.filterMaternalCap && !p.has_maternal_cap) return false
    if (filters.filterMilitaryMort && !p.has_military_mort) return false

    // Commercial conditions
    if (filters.filterParking && !p.has_parking) return false
    if (filters.filterActiveBusiness && !p.is_active_business) return false
    if (filters.filterWetPoints && !p.has_wet_points) return false

    // Realtor property
    if (filters.filterRealtorProperty && !p.is_realtor_property) return false

    // Date range
    if (filters.dateFrom || filters.dateTo) {
      const dateVal = new Date(p[filters.dateField]).getTime()
      if (filters.dateFrom && dateVal < new Date(filters.dateFrom).getTime()) return false
      if (filters.dateTo) {
        const to = new Date(filters.dateTo)
        to.setHours(23, 59, 59, 999)
        if (dateVal > to.getTime()) return false
      }
    }

    return true
  })
}

export default function PropertiesPage() {
  const { data: properties = [], isLoading, error } = useProperties()
  const { data: allUnits = [], isLoading: unitsLoading } = useAllComplexUnits()
  const { data: complexes = [] } = useComplexes()
  const complexMap = useMemo(() => new Map(complexes.map(c => [c.id, c])), [complexes])
  const taskCounts = useActiveTaskCounts()
  const [searchParams, setSearchParams] = useSearchParams()
  const [tab, setTab] = useState<'all' | 'developer'>('all')
  const [unitSearch, setUnitSearch] = useState('')
  const [selectedUnit, setSelectedUnit] = useState<(ComplexUnit & { complex_name?: string; complex_photos?: string[] }) | null>(null)
  const [unitFilters, setUnitFilters] = useState({
    priceMin: '', priceMax: '', complexId: '', paymentType: '', completed: '', rooms: '',
  })
  const [showUnitForm, setShowUnitForm] = useState(false)
  const {
    filters,
    selectedPropertyId,
    isDetailOpen,
    isFormOpen,
    editingPropertyId,
    openDetail,
    closeDetail,
    openForm,
    closeForm,
  } = usePropertyStore()

  useEffect(() => {
    const openId = searchParams.get('open')
    if (openId && properties.length > 0) {
      const found = properties.find((p) => p.id === openId)
      if (found) {
        openDetail(openId)
        setSearchParams({}, { replace: true })
      }
    }
  }, [searchParams, properties, openDetail, setSearchParams])

  const filtered = useMemo(() => filterProperties(properties, filters), [properties, filters])

  const filteredUnits = useMemo(() => {
    const q = unitSearch.toLowerCase().trim()
    return allUnits.filter((u) => {
      // Text search
      if (q) {
        const label = u.title || (u.rooms ? `${u.rooms}-комн. кв.` : '')
        const match = label.toLowerCase().includes(q)
          || (u.complex_name ?? '').toLowerCase().includes(q)
          || String(u.price ?? '').includes(q)
          || String(u.area ?? '').includes(q)
        if (!match) return false
      }
      // Price range
      const price = u.price ?? (u.price_per_m2 && u.area ? u.price_per_m2 * u.area : null)
      if (unitFilters.priceMin && (price == null || price < Number(unitFilters.priceMin))) return false
      if (unitFilters.priceMax && (price == null || price > Number(unitFilters.priceMax))) return false
      // Complex
      if (unitFilters.complexId && u.complex_id !== unitFilters.complexId) return false
      // Rooms
      if (unitFilters.rooms) {
        if (unitFilters.rooms === '5+') { if (!u.rooms || u.rooms < 5) return false }
        else { if (u.rooms !== Number(unitFilters.rooms)) return false }
      }
      // Payment type
      if (unitFilters.paymentType) {
        if (unitFilters.paymentType === 'cash' && u.payment_type !== 'cash') return false
        if (unitFilters.paymentType === 'mortgage' && u.payment_type !== 'mortgage') return false
        if (unitFilters.paymentType === 'installment') {
          const cx = complexMap.get(u.complex_id)
          const cond = cx?.pricing_conditions?.find((c) => c.id === u.payment_type)
          if (!cond || cond.payment_type !== 'installment') return false
        }
      }
      // Completed / under construction
      if (unitFilters.completed) {
        const cx = complexMap.get(u.complex_id)
        const yearMatch = cx?.completion_date?.match(/\b(20\d{2})\b/)
        const year = yearMatch ? parseInt(yearMatch[1]) : null
        const isCompleted = year != null && year <= new Date().getFullYear()
        if (unitFilters.completed === 'yes' && !isCompleted) return false
        if (unitFilters.completed === 'no' && isCompleted) return false
      }
      return true
    })
  }, [allUnits, unitSearch, unitFilters, complexMap])

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId)
  const activeCount = properties.filter((p) => p.status === 'active').length
  const totalCount = properties.length
  const [showOptionsManager, setShowOptionsManager] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(
    () => (localStorage.getItem('crm_view_mode') as 'list' | 'grid') ?? 'list'
  )
  useEffect(() => { localStorage.setItem('crm_view_mode', viewMode) }, [viewMode])
  const formTitle = editingPropertyId ? 'Редактировать объект' : 'Новый объект'
  const gridClass = viewMode === 'grid'
    ? 'grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'
    : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'

  return (
    <div className="p-4 sm:p-6 max-w-screen-xl mx-auto w-full min-w-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Объекты</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {activeCount} активных · {totalCount} всего
            {tab === 'all' && filtered.length !== totalCount && ` · ${filtered.length} найдено`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center bg-slate-100 rounded-xl p-0.5">
            <button
              onClick={() => setViewMode('list')}
              title="Список"
              className={cn(
                'p-2 rounded-lg transition-colors',
                viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              )}
            >
              <LayoutList size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              title="Сетка"
              className={cn(
                'p-2 rounded-lg transition-colors',
                viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              )}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
          <button
            onClick={() => setShowOptionsManager(true)}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
            title="Настройки списков"
          >
            <Settings size={16} />
          </button>
          {tab === 'all' && (
            <button
              data-tour="add-property"
              onClick={() => openForm()}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              Добавить объект
            </button>
          )}
          {tab === 'developer' && (
            <button
              onClick={() => setShowUnitForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              <Plus size={16} />
              Добавить объект
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setTab('all')}
          className={cn(
            'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
            tab === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          )}
        >
          Все объекты
        </button>
        <button
          onClick={() => setTab('developer')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors',
            tab === 'developer' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          )}
        >
          <Building2 size={15} />
          От застройщика {allUnits.length > 0 && `(${allUnits.length})`}
        </button>
      </div>

      {/* ─── All properties tab ─── */}
      {tab === 'all' && (
        <>
          <div className="mb-5">
            <PropertyFilters />
          </div>

          {isLoading && (
            <div className="flex items-center justify-center h-48">
              <Loader2 size={24} className="animate-spin text-blue-500" />
            </div>
          )}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl text-red-700 text-sm">
              <AlertCircle size={18} />
              Ошибка загрузки данных.
            </div>
          )}
          {!isLoading && !error && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <Building2 size={40} className="text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">Объекты не найдены</p>
              <p className="text-slate-400 text-sm mt-1">
                {properties.length === 0 ? 'Добавьте первый объект' : 'Попробуйте изменить фильтры'}
              </p>
            </div>
          )}
          {!isLoading && filtered.length > 0 && (
            <div className={gridClass}>
              {filtered.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onClick={() => openDetail(property.id)}
                  taskCount={taskCounts[property.id] ?? 0}
                  compact={viewMode === 'grid'}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ─── Developer units tab ─── */}
      {tab === 'developer' && (
        <>
          {/* Search */}
          <div className="relative mb-3">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={unitSearch}
              onChange={(e) => setUnitSearch(e.target.value)}
              placeholder="Поиск по ЖК, типу, площади, цене..."
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>
          {/* Filters */}
          <div className="space-y-2 mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <input
                type="number"
                placeholder="Цена от"
                value={unitFilters.priceMin}
                onChange={(e) => setUnitFilters(f => ({ ...f, priceMin: e.target.value }))}
                className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <input
                type="number"
                placeholder="Цена до"
                value={unitFilters.priceMax}
                onChange={(e) => setUnitFilters(f => ({ ...f, priceMax: e.target.value }))}
                className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <select
                value={unitFilters.complexId}
                onChange={(e) => setUnitFilters(f => ({ ...f, complexId: e.target.value }))}
                className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 col-span-2 sm:col-span-1"
              >
                <option value="">Все ЖК</option>
                {complexes
                  .filter((c) => allUnits.some((u) => u.complex_id === c.id))
                  .map((c) => <option key={c.id} value={c.id}>{c.name}</option>)
                }
              </select>
              <select
                value={unitFilters.rooms}
                onChange={(e) => setUnitFilters(f => ({ ...f, rooms: e.target.value }))}
                className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">Все комнаты</option>
                <option value="0">Студия</option>
                <option value="1">1-комн.</option>
                <option value="2">2-комн.</option>
                <option value="3">3-комн.</option>
                <option value="4">4-комн.</option>
                <option value="5+">5+ комн.</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(['', 'cash', 'installment', 'mortgage'] as const).map((pt) => {
                const labels: Record<string, string> = { '': 'Любая оплата', cash: '💵 Наличные', installment: '📅 Рассрочка', mortgage: '🏦 Ипотека' }
                const active = unitFilters.paymentType === pt
                return (
                  <button key={pt} type="button"
                    onClick={() => setUnitFilters(f => ({ ...f, paymentType: pt }))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${active ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                    {labels[pt]}
                  </button>
                )
              })}
              <div className="w-px bg-slate-200 mx-1" />
              {(['', 'yes', 'no'] as const).map((v) => {
                const labels: Record<string, string> = { '': 'Любой статус', yes: '✅ Сдан', no: '🏗 Строится' }
                const active = unitFilters.completed === v
                return (
                  <button key={v} type="button"
                    onClick={() => setUnitFilters(f => ({ ...f, completed: v }))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${active ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                    {labels[v]}
                  </button>
                )
              })}
              {(unitFilters.priceMin || unitFilters.priceMax || unitFilters.complexId || unitFilters.paymentType || unitFilters.completed || unitFilters.rooms) && (
                <button type="button"
                  onClick={() => setUnitFilters({ priceMin: '', priceMax: '', complexId: '', paymentType: '', completed: '', rooms: '' })}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium text-red-500 border border-red-100 bg-red-50 hover:bg-red-100 transition-colors ml-auto">
                  Сбросить
                </button>
              )}
            </div>
          </div>

          {unitsLoading && (
            <div className="flex items-center justify-center h-48">
              <Loader2 size={24} className="animate-spin text-emerald-500" />
            </div>
          )}

          {!unitsLoading && filteredUnits.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <Building2 size={40} className="text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">
                {allUnits.length === 0 ? 'Нет объектов от застройщика' : 'Ничего не найдено'}
              </p>
              <p className="text-slate-400 text-sm mt-1">
                {allUnits.length === 0
                  ? 'Добавьте объекты в разделе ЖК'
                  : 'Попробуйте изменить поиск'}
              </p>
            </div>
          )}

          {!unitsLoading && filteredUnits.length > 0 && (
            <div className={gridClass}>
              {filteredUnits.map((u) => {
                const cx = complexMap.get(u.complex_id)
                const coverPhoto = u.photos?.[0] ?? cx?.photos?.[0] ?? null
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setSelectedUnit({ ...u, complex_photos: cx?.photos })}
                    className="bg-white rounded-2xl border border-slate-100 overflow-hidden text-left hover:shadow-md hover:border-emerald-200 transition-all group"
                  >
                    {coverPhoto ? (
                      <img
                        src={coverPhoto}
                        alt=""
                        className="w-full h-28 object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-28 bg-gradient-to-br from-emerald-50 to-slate-100 flex items-center justify-center">
                        <Building2 size={28} className="text-emerald-300" />
                      </div>
                    )}
                    <div className="p-3">
                      <p className="font-semibold text-slate-900 text-sm group-hover:text-emerald-700 line-clamp-1">
                        {u.title || (u.rooms ? `${u.rooms}-комн. квартира` : 'Объект')}
                        {u.area ? ` · ${u.area} м²` : ''}
                      </p>
                      {u.complex_name && (
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 truncate">
                          <Building2 size={10} />{u.complex_name}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {u.floor != null && (
                          <span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                            {u.floor_to && u.floor_to > u.floor ? `${u.floor}–${u.floor_to}` : u.floor}{u.total_floors ? `/${u.total_floors}` : ''} эт.
                          </span>
                        )}
                        {(() => {
                          const price = u.price ?? (u.price_per_m2 && u.area ? u.price_per_m2 * u.area : null)
                          return price != null ? (
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              {formatPriceShort(price)}
                            </span>
                          ) : null
                        })()}
                        {u.payment_type && (() => {
                          if (u.payment_type === 'cash') return <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">💵 Наличные</span>
                          if (u.payment_type === 'mortgage') return <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">🏦 Ипотека</span>
                          const cond = cx?.pricing_conditions?.find((c) => c.id === u.payment_type)
                          if (cond) {
                            const term = cond.payment_type === 'installment' && cond.installment_months
                              ? (cond.installment_months % 12 === 0 ? ` ${cond.installment_months / 12}г.` : ` ${cond.installment_months}м.`)
                              : ''
                            return <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">{cond.payment_type === 'installment' ? '📅' : '💳'}{term}</span>
                          }
                          return null
                        })()}
                      </div>
                      {taskCounts[u.id] > 0 && (
                        <div className="mt-2">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                            {taskCounts[u.id]} {taskCounts[u.id] === 1 ? 'задача' : taskCounts[u.id] < 5 ? 'задачи' : 'задач'}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      <Modal isOpen={isDetailOpen} onClose={closeDetail} size="xl">
        {selectedProperty && (
          <PropertyDetail property={selectedProperty} onClose={closeDetail} />
        )}
      </Modal>

      {/* Form Modal */}
      <Modal isOpen={isFormOpen} onClose={closeForm} title={formTitle} size="lg">
        <PropertyForm />
      </Modal>

      {/* Unit Detail Modal */}
      <Modal isOpen={!!selectedUnit} onClose={() => setSelectedUnit(null)} size="md">
        {selectedUnit && (
          <UnitDetailModal unit={selectedUnit} onClose={() => setSelectedUnit(null)} />
        )}
      </Modal>

      {/* Developer Unit Form Modal */}
      <Modal isOpen={showUnitForm} onClose={() => setShowUnitForm(false)} size="md">
        <DeveloperUnitForm onClose={() => setShowUnitForm(false)} />
      </Modal>

      <OptionsManager
        isOpen={showOptionsManager}
        onClose={() => setShowOptionsManager(false)}
      />
    </div>
  )
}

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
    if (marketType !== 'all' && p.market_type !== marketType) return false
    if (dealType !== 'all' && p.deal_type !== dealType) return false

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
    if (!q) return allUnits
    return allUnits.filter((u) => {
      const label = u.title || (u.rooms ? `${u.rooms}-комн. кв.` : '')
      return (
        label.toLowerCase().includes(q) ||
        (u.complex_name ?? '').toLowerCase().includes(q) ||
        String(u.price ?? '').includes(q) ||
        String(u.area ?? '').includes(q)
      )
    })
  }, [allUnits, unitSearch])

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
          <div className="relative mb-4">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={unitSearch}
              onChange={(e) => setUnitSearch(e.target.value)}
              placeholder="Поиск по ЖК, типу, площади, цене..."
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            />
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
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {u.floor != null && (
                          <span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                            {u.floor}{u.total_floors ? `/${u.total_floors}` : ''} эт.
                          </span>
                        )}
                        {u.price != null && (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            {formatPriceShort(u.price)}
                          </span>
                        )}
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

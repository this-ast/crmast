import { useMemo, useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Plus, Building2, AlertCircle, Loader2, Search, SlidersHorizontal, ChevronRight, Settings } from 'lucide-react'
import { useComplexes } from '@/hooks/useComplexes'
import { useProperties } from '@/hooks/useProperties'
import { useComplexStore } from '@/store/useComplexStore'
import { PROPERTY_TYPE_LABELS, PROPERTY_STATUS_COLORS, PROPERTY_STATUS_LABELS } from '@/types'
import { formatPriceShort } from '@/utils/format'
import PropertyTypeIcon from '@/components/properties/PropertyTypeIcon'
import ComplexCard from '@/components/complexes/ComplexCard'
import ComplexDetail from '@/components/complexes/ComplexDetail'
import ComplexForm from '@/components/complexes/ComplexForm'
import Modal from '@/components/ui/Modal'
import ComplexFilters, { ComplexFilterState, defaultComplexFilters } from '@/components/complexes/ComplexFilters'
import OptionsManager from '@/components/settings/OptionsManager'
import { cn } from '@/utils/cn'

export default function ComplexesPage() {
  const { data: complexes = [], isLoading, error } = useComplexes()
  const { data: properties = [] } = useProperties()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<ComplexFilterState>(defaultComplexFilters)
  const [showFilters, setShowFilters] = useState(false)
  const [propertiesModalComplexId, setPropertiesModalComplexId] = useState<string | null>(null)
  const [showOptionsManager, setShowOptionsManager] = useState(false)
  const navigate = useNavigate()

  const {
    selectedComplexId,
    isDetailOpen,
    isFormOpen,
    editingComplexId,
    openDetail,
    closeDetail,
    openForm,
    closeForm,
  } = useComplexStore()

  // Auto-open via ?open={id}
  useEffect(() => {
    const openId = searchParams.get('open')
    if (openId && complexes.length > 0) {
      const found = complexes.find((c) => c.id === openId)
      if (found) {
        openDetail(openId)
        setSearchParams({}, { replace: true })
      }
    }
  }, [searchParams, complexes, openDetail, setSearchParams])

  const filtered = useMemo(() => {
    let result = complexes

    // Text search
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.developer?.toLowerCase().includes(q) ?? false)
      )
    }

    // Building type
    if (filters.buildingType) {
      result = result.filter((c) =>
        c.building_type?.toLowerCase().includes(filters.buildingType.toLowerCase())
      )
    }

    // Elevator
    if (filters.elevator) {
      result = result.filter((c) => c.elevator === filters.elevator)
    }

    // Yard features (AND — must have all selected)
    if (filters.yardFeatures.length > 0) {
      result = result.filter((c) =>
        filters.yardFeatures.every((f) => (c.yard_features ?? []).includes(f))
      )
    }

    // Parking (AND — must have all selected)
    if (filters.parkingTypes.length > 0) {
      result = result.filter((c) =>
        filters.parkingTypes.every((p) => (c.parking ?? []).includes(p))
      )
    }

    // Floors range
    if (filters.floorsMin) {
      const min = parseInt(filters.floorsMin)
      result = result.filter((c) => {
        const f = parseInt(c.floors_total ?? '')
        return isNaN(f) || f >= min
      })
    }
    if (filters.floorsMax) {
      const max = parseInt(filters.floorsMax)
      result = result.filter((c) => {
        const f = parseInt(c.floors_total ?? '')
        return isNaN(f) || f <= max
      })
    }

    // District filter
    if (filters.district) {
      result = result.filter((c) => c.district === filters.district)
    }

    // Price per m² filter
    if (filters.priceMin) {
      const min = Number(filters.priceMin)
      result = result.filter((c) => {
        if (c.pricing_conditions && c.pricing_conditions.length > 0) {
          return c.pricing_conditions.some((cond) => cond.price_per_sqm != null && cond.price_per_sqm >= min)
        }
        const p = c.pricing?.cash?.price_per_sqm
        return p != null && p >= min
      })
    }
    if (filters.priceMax) {
      const max = Number(filters.priceMax)
      result = result.filter((c) => {
        if (c.pricing_conditions && c.pricing_conditions.length > 0) {
          return c.pricing_conditions.some((cond) => cond.price_per_sqm != null && cond.price_per_sqm <= max)
        }
        const p = c.pricing?.cash?.price_per_sqm
        return p != null && p <= max
      })
    }

    // Payment type filter
    if (filters.paymentTypes.length > 0) {
      result = result.filter((c) => {
        // Check new pricing_conditions array first
        if (c.pricing_conditions && c.pricing_conditions.length > 0) {
          return filters.paymentTypes.some((pt) =>
            c.pricing_conditions.some((cond) => cond.payment_type === pt && cond.price_per_sqm != null)
          )
        }
        // Fallback to legacy pricing object
        if (!c.pricing) return false
        return filters.paymentTypes.some((pt) => {
          if (pt === 'cash') return !!c.pricing?.cash?.price_per_sqm
          if (pt === 'family_mortgage') return !!c.pricing?.family_mortgage?.price_per_sqm
          if (pt === 'mortgage') return !!c.pricing?.family_mortgage?.price_per_sqm
          if (pt === 'escrow') return !!c.pricing?.escrow?.price_per_sqm
          if (pt === 'installment') return (
            !!c.pricing?.installment_6m?.price_per_sqm ||
            !!c.pricing?.installment_12m?.price_per_sqm ||
            !!c.pricing?.installment_18m?.price_per_sqm ||
            !!c.pricing?.installment_24m?.price_per_sqm ||
            !!c.pricing?.installment_36m?.price_per_sqm ||
            !!c.pricing?.installment_48m?.price_per_sqm ||
            !!c.pricing?.installment_60m?.price_per_sqm
          )
          return false
        })
      })
    }

    return result
  }, [complexes, search, filters])

  // Count properties per complex
  const propCountByComplex = useMemo(() => {
    const map: Record<string, number> = {}
    for (const p of properties) {
      if (p.complex_id) map[p.complex_id] = (map[p.complex_id] ?? 0) + 1
    }
    return map
  }, [properties])

  const formTitle = editingComplexId ? 'Редактировать ЖК' : 'Новый жилой комплекс'

  return (
    <div className="p-4 sm:p-6 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Жилые комплексы</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {complexes.length} ЖК
            {filtered.length !== complexes.length && ` · ${filtered.length} найдено`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOptionsManager(true)}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:border-slate-300 hover:bg-slate-50 transition-colors"
            title="Настройки справочников"
          >
            <Settings size={15} />
          </button>
          <button
            onClick={() => openForm()}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            Добавить ЖК
          </button>
        </div>
      </div>

      {/* Search + Filters toggle */}
      <div className="mb-5 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Поиск по названию или застройщику..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors',
            showFilters
              ? 'bg-blue-600 border-blue-600 text-white'
              : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
          )}
        >
          <SlidersHorizontal size={15} />
          Фильтры
        </button>
      </div>

      {showFilters && (
        <ComplexFilters
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters(defaultComplexFilters)}
          resultCount={filtered.length}
          totalCount={complexes.length}
          onOpenSettings={() => setShowOptionsManager(true)}
        />
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={24} className="animate-spin text-blue-500" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl text-red-700 text-sm">
          <AlertCircle size={18} />
          Ошибка загрузки данных.
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <Building2 size={40} className="text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">
            {complexes.length === 0 ? 'Нет жилых комплексов' : 'Ничего не найдено'}
          </p>
          <p className="text-slate-400 text-sm mt-1">
            {complexes.length === 0 ? 'Добавьте первый ЖК' : 'Попробуйте изменить поиск'}
          </p>
        </div>
      )}

      {/* Grid */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((complex) => (
            <ComplexCard
              key={complex.id}
              complex={complex}
              propertyCount={propCountByComplex[complex.id] ?? 0}
              onClick={() => openDetail(complex.id)}
              onShowProperties={(e) => { e.stopPropagation(); setPropertiesModalComplexId(complex.id) }}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Modal isOpen={isDetailOpen} onClose={closeDetail} size="xl">
        {selectedComplexId && (
          <ComplexDetail complexId={selectedComplexId} onClose={closeDetail} />
        )}
      </Modal>

      {/* Form Modal */}
      <Modal isOpen={isFormOpen} onClose={closeForm} title={formTitle} size="lg">
        <ComplexForm />
      </Modal>

      {/* Properties Modal */}
      {(() => {
        const modalComplex = complexes.find((c) => c.id === propertiesModalComplexId)
        const modalProperties = properties.filter((p) => p.complex_id === propertiesModalComplexId)
        return (
          <Modal
            isOpen={!!propertiesModalComplexId}
            onClose={() => setPropertiesModalComplexId(null)}
            title={modalComplex ? `Объекты в ${modalComplex.name}` : 'Объекты'}
            size="lg"
          >
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {modalProperties.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Building2 size={36} className="text-slate-300 mb-3" />
                  <p className="text-slate-500 font-medium">Нет объектов</p>
                  <p className="text-slate-400 text-sm mt-1">Добавьте объекты, указав этот ЖК</p>
                </div>
              ) : (
                modalProperties.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setPropertiesModalComplexId(null); setTimeout(() => navigate(`/properties?open=${p.id}`), 150) }}
                    className="w-full flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl hover:border-blue-200 hover:shadow-sm transition-all text-left group"
                  >
                    <PropertyTypeIcon type={p.type} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-slate-900">
                          {p.rooms ? `${p.rooms}-комн. ` : ''}{PROPERTY_TYPE_LABELS[p.type]}
                        </p>
                        <span className={cn('text-xs px-1.5 py-0.5 rounded-full', PROPERTY_STATUS_COLORS[p.status])}>
                          {PROPERTY_STATUS_LABELS[p.status]}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{p.article}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-slate-900">{formatPriceShort(p.price)}</p>
                      <p className="text-xs text-slate-400">{p.area} м²</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-400 transition-colors shrink-0" />
                  </button>
                ))
              )}
            </div>
          </Modal>
        )
      })()}

      {/* Options Manager Modal */}
      <OptionsManager
        isOpen={showOptionsManager}
        onClose={() => setShowOptionsManager(false)}
      />
    </div>
  )
}

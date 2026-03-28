import { useMemo, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Building2, AlertCircle, Loader2, Settings } from 'lucide-react'
import { useProperties } from '@/hooks/useProperties'
import { usePropertyStore, categoryToFilters } from '@/store/usePropertyStore'
import PropertyCard from '@/components/properties/PropertyCard'
import PropertyFilters from '@/components/properties/PropertyFilters'
import PropertyDetail from '@/components/properties/PropertyDetail'
import PropertyForm from '@/components/properties/PropertyForm'
import Modal from '@/components/ui/Modal'
import OptionsManager from '@/components/settings/OptionsManager'
import type { PropertyWithOwner } from '@/types'

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

    // Status
    if (filters.status !== 'all' && p.status !== filters.status) return false

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
  const [searchParams, setSearchParams] = useSearchParams()
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

  // Auto-open detail when navigated from client page via ?open={id}
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

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId)

  const activeCount = properties.filter((p) => p.status === 'active').length
  const totalCount = properties.length

  const [showOptionsManager, setShowOptionsManager] = useState(false)
  const formTitle = editingPropertyId ? 'Редактировать объект' : 'Новый объект'

  return (
    <div className="p-4 sm:p-6 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Объекты</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {activeCount} активных · {totalCount} всего
            {filtered.length !== totalCount && ` · ${filtered.length} найдено`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOptionsManager(true)}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
            title="Настройки списков"
          >
            <Settings size={16} />
          </button>
          <button
            data-tour="add-property"
            onClick={() => openForm()}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            Добавить объект
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-5 bg-slate-50 rounded-2xl p-4">
        <PropertyFilters />
      </div>

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
          Ошибка загрузки данных. Проверьте подключение к базе данных.
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <Building2 size={40} className="text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">Объекты не найдены</p>
          <p className="text-slate-400 text-sm mt-1">
            {properties.length === 0
              ? 'Добавьте первый объект'
              : 'Попробуйте изменить фильтры'}
          </p>
        </div>
      )}

      {/* Grid */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onClick={() => openDetail(property.id)}
            />
          ))}
        </div>
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

      <OptionsManager
        isOpen={showOptionsManager}
        onClose={() => setShowOptionsManager(false)}
      />
    </div>
  )
}

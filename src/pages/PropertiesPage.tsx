import { useMemo } from 'react'
import { Plus, Building2, AlertCircle, Loader2 } from 'lucide-react'
import { useProperties } from '@/hooks/useProperties'
import { usePropertyStore } from '@/store/usePropertyStore'
import PropertyCard from '@/components/properties/PropertyCard'
import PropertyFilters from '@/components/properties/PropertyFilters'
import PropertyDetail from '@/components/properties/PropertyDetail'
import PropertyForm from '@/components/properties/PropertyForm'
import Modal from '@/components/ui/Modal'
import type { PropertyWithOwner, PropertyType, PropertyStatus } from '@/types'

interface Filters {
  type: PropertyType | 'all'
  status: PropertyStatus | 'all'
  search: string
  priceMin: string
  priceMax: string
  areaMin: string
  areaMax: string
}

function filterProperties(
  properties: PropertyWithOwner[],
  filters: Filters
): PropertyWithOwner[] {
  return properties.filter((p) => {
    if (filters.type !== 'all' && p.type !== filters.type) return false
    if (filters.status !== 'all' && p.status !== filters.status) return false

    if (filters.search) {
      const q = filters.search.toLowerCase()
      const searchIn = [p.article, p.address, p.complex_name, p.description]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!searchIn.includes(q)) return false
    }

    if (filters.priceMin && p.price < Number(filters.priceMin)) return false
    if (filters.priceMax && p.price > Number(filters.priceMax)) return false

    return true
  })
}

export default function PropertiesPage() {
  const { data: properties = [], isLoading, error } = useProperties()
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

  const filtered = useMemo(() => filterProperties(properties, filters), [properties, filters])

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId)

  // Stats
  const activeCount = properties.filter((p) => p.status === 'active').length
  const totalCount = properties.length

  const formTitle = editingPropertyId ? 'Редактировать объект' : 'Новый объект'

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Объекты</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {activeCount} активных · {totalCount} всего
          </p>
        </div>
        <button
          onClick={() => openForm()}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          Добавить объект
        </button>
      </div>

      {/* Filters */}
      <div className="mb-5">
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

      {/* Property grid */}
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
      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title={formTitle}
        size="lg"
      >
        <PropertyForm />
      </Modal>
    </div>
  )
}

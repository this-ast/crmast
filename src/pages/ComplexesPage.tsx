import { useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Building2, AlertCircle, Loader2, Search } from 'lucide-react'
import { useComplexes } from '@/hooks/useComplexes'
import { useProperties } from '@/hooks/useProperties'
import { useComplexStore } from '@/store/useComplexStore'
import ComplexCard from '@/components/complexes/ComplexCard'
import ComplexDetail from '@/components/complexes/ComplexDetail'
import ComplexForm from '@/components/complexes/ComplexForm'
import Modal from '@/components/ui/Modal'

export default function ComplexesPage() {
  const { data: complexes = [], isLoading, error } = useComplexes()
  const { data: properties = [] } = useProperties()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')

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
    if (!search.trim()) return complexes
    const q = search.toLowerCase()
    return complexes.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.developer?.toLowerCase().includes(q) ?? false)
    )
  }, [complexes, search])

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
    <div className="p-6 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Жилые комплексы</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {complexes.length} ЖК
            {filtered.length !== complexes.length && ` · ${filtered.length} найдено`}
          </p>
        </div>
        <button
          onClick={() => openForm()}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          Добавить ЖК
        </button>
      </div>

      {/* Search */}
      <div className="mb-5 relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Поиск по названию или застройщику..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
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
    </div>
  )
}

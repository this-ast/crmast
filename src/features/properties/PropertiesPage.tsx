import { useEffect, useState, useCallback } from 'react'
import { MapPin, Maximize2, Search, Plus, Pencil, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card, Spinner, Button, ConfirmDialog } from '@/components/ui'
import {
  cn,
  formatPrice,
  PROPERTY_TYPE_LABELS,
  PROPERTY_STATUS_LABELS,
} from '@/lib/utils'
import { PropertyForm } from './PropertyForm'
import toast from 'react-hot-toast'

interface Property {
  id: string
  title: string
  type: string
  status: string
  address: string
  city: string
  district: string | null
  price: number
  area: number | null
  rooms: number | null
  floor: number | null
  total_floors: number | null
  description: string | null
  created_at: string
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  draft: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  reserved: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  sold: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  rented: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  archived: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
}

const TYPE_ICONS: Record<string, string> = {
  apartment: '\u{1F3E2}',
  house: '\u{1F3E0}',
  commercial: '\u{1F3EA}',
  land: '\u{1F30D}',
}

export function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const [formOpen, setFormOpen] = useState(false)
  const [editProp, setEditProp] = useState<Property | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadProperties = useCallback(async () => {
    const { data } = await supabase
      .from('properties')
      .select('id, title, type, status, address, city, district, price, area, rooms, floor, total_floors, description, created_at')
      .order('created_at', { ascending: false })
      .limit(500)
    setProperties(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadProperties() }, [loadProperties])

  const handleEdit = (p: Property) => {
    setEditProp(p)
    setFormOpen(true)
  }

  const handleCreate = () => {
    setEditProp(null)
    setFormOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const { error } = await supabase.from('properties').delete().eq('id', deleteTarget.id)
    if (error) {
      toast.error('Ошибка удаления: ' + error.message)
    } else {
      toast.success('Объект удалён')
      loadProperties()
    }
    setDeleting(false)
    setDeleteTarget(null)
  }

  const filtered = properties.filter((p) => {
    if (filterType !== 'all' && p.type !== filterType) return false
    if (filterStatus !== 'all' && p.status !== filterStatus) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        p.title.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
      )
    }
    return true
  })

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Объекты недвижимости</h1>
          <p className="mt-1 text-text-secondary">
            Всего {properties.length} объектов
          </p>
        </div>
        <Button onClick={handleCreate} icon={<Plus className="h-4 w-4" />}>
          Добавить объект
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Поиск по названию, адресу..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary focus:border-primary-500 focus:outline-none"
        >
          <option value="all">Все типы</option>
          {Object.entries(PROPERTY_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary focus:border-primary-500 focus:outline-none"
        >
          <option value="all">Все статусы</option>
          {Object.entries(PROPERTY_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="text-text-secondary">Объекты не найдены</p>
          <Button onClick={handleCreate} variant="outline" className="mt-3" icon={<Plus className="h-4 w-4" />}>
            Добавить первый объект
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((prop) => (
            <Card key={prop.id} className="group relative">
              {/* Action buttons */}
              <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => handleEdit(prop)}
                  className="rounded-lg bg-surface p-1.5 text-text-muted shadow-sm border border-border hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-950 transition-colors"
                  title="Редактировать"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setDeleteTarget(prop)}
                  className="rounded-lg bg-surface p-1.5 text-text-muted shadow-sm border border-border hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 transition-colors"
                  title="Удалить"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mb-3 flex items-start justify-between pr-16">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{TYPE_ICONS[prop.type] || '\u{1F3E0}'}</span>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      STATUS_COLORS[prop.status] || STATUS_COLORS.draft
                    )}
                  >
                    {PROPERTY_STATUS_LABELS[prop.status] || prop.status}
                  </span>
                </div>
                <span className="text-lg font-bold text-primary-600">
                  {formatPrice(prop.price)}
                </span>
              </div>

              <h3 className="font-semibold text-text-primary">{prop.title}</h3>

              <div className="mt-2 flex items-center gap-1 text-sm text-text-secondary">
                <MapPin className="h-3.5 w-3.5" />
                <span className="truncate">{prop.address}, {prop.city}</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-3 text-sm text-text-muted">
                {prop.rooms != null && prop.rooms > 0 && (
                  <span>{prop.rooms} комн.</span>
                )}
                {prop.area != null && prop.area > 0 && (
                  <span className="flex items-center gap-1">
                    <Maximize2 className="h-3 w-3" />
                    {prop.area} м²
                  </span>
                )}
                {prop.floor != null && prop.total_floors != null && (
                  <span>{prop.floor}/{prop.total_floors} эт.</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Forms & Dialogs */}
      <PropertyForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditProp(null) }}
        onSaved={loadProperties}
        editData={editProp}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Удалить объект?"
        message={`Вы уверены, что хотите удалить "${deleteTarget?.title}"? Это действие нельзя отменить.`}
        loading={deleting}
      />
    </div>
  )
}

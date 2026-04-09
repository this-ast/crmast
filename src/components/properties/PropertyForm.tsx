import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Loader2, Search, Plus, X, UserX, Check, ChevronDown, ImageIcon, Trash2, HeartHandshake } from 'lucide-react'
import type { PropertyFormData, PropertyType } from '@/types'
import { PROPERTY_TYPE_LABELS, PROPERTY_TYPE_ICONS } from '@/types'
import {
  useCreateProperty, useUpdateProperty, useProperty,
  useUploadPropertyPhoto, useDeletePropertyPhoto,
  useUploadFloorPlan, useDeleteFloorPlan,
} from '@/hooks/useProperties'
import { useCreateDeal } from '@/hooks/useDeals'
import { useClients, useCreateClient } from '@/hooks/useClients'
import { useComplexes } from '@/hooks/useComplexes'
import { usePropertyStore } from '@/store/usePropertyStore'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'
import MediaUploader from '@/components/ui/MediaUploader'

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Format integer with thousands spaces: 7700000 → "7 700 000"
function fmtNum(val: number | string | null | undefined): string {
  if (val == null || val === '') return ''
  const digits = String(val).replace(/[\s\u00A0]/g, '').replace(/[^\d]/g, '')
  return digits ? digits.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0') : ''
}

function parseFlexibleNumber(raw: string): number | null {
  // Accept: "5500000", "5 500 000", "5,500,000", "5.500.000", "65,5", "65.5"
  const clean = raw.trim()
    .replace(/\s/g, '')           // remove spaces
    .replace(/,(?=\d{3}(?:[^\d]|$))/g, '') // remove thousands-separator commas
    .replace(/\.(?=\d{3}(?:[^\d]|$))/g, '') // remove thousands-separator dots
    .replace(',', '.')            // treat remaining comma as decimal
  const n = parseFloat(clean)
  return isNaN(n) ? null : n
}

// ─── Field wrappers ────────────────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-medium text-slate-600 mb-1.5">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-red-500 mt-1">{message}</p>
}

const inputCls = 'w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
const selectCls = inputCls

// ─── Complex Selector ──────────────────────────────────────────────────────────

function ComplexSelector({
  complexId,
  complexName,
  onChange,
}: {
  complexId: string
  complexName: string
  onChange: (id: string, name: string) => void
}) {
  const { data: complexes = [] } = useComplexes()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropRef = useRef<HTMLDivElement>(null)

  const selected = complexes.find((c) => c.id === complexId)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = complexes
    .filter((c) => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return c.name.toLowerCase().includes(q) || (c.developer?.toLowerCase().includes(q) ?? false)
    })
    .slice(0, 30)

  const handleSelect = (id: string, name: string) => {
    onChange(id, name)
    setOpen(false)
    setSearch('')
  }

  const handleClear = () => {
    onChange('', '')
    setSearch('')
  }

  return (
    <div ref={dropRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 bg-white border rounded-lg text-sm text-left transition-all',
          open ? 'border-blue-500 ring-2 ring-blue-500' : 'border-slate-200 hover:border-slate-300'
        )}
      >
        {selected ? (
          <span className="text-slate-900 flex items-center gap-2 flex-1 min-w-0">
            <span className="truncate">{selected.name}</span>
            {selected.developer && (
              <span className="text-xs text-slate-400 shrink-0 truncate">{selected.developer}</span>
            )}
          </span>
        ) : complexName ? (
          <span className="text-slate-700 truncate flex-1">{complexName}</span>
        ) : (
          <span className="text-slate-400 flex-1">Выберите ЖК из списка...</span>
        )}
        <ChevronDown size={14} className={cn('text-slate-400 shrink-0 ml-2 transition-transform', open && 'rotate-180')} />
      </button>

      {(selected || complexName) && (
        <button
          type="button"
          onClick={handleClear}
          className="text-xs text-slate-400 hover:text-red-500 mt-1 flex items-center gap-1"
        >
          <X size={11} /> Убрать ЖК
        </button>
      )}

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                type="text"
                placeholder="Поиск по названию или застройщику..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">
                {search ? 'ЖК не найден' : 'Нет жилых комплексов'}
              </p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelect(c.id, c.name)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-slate-50 transition-colors',
                    c.id === complexId && 'bg-blue-50 text-blue-700'
                  )}
                >
                  <span className="flex-1 truncate font-medium">{c.name}</span>
                  {c.developer && (
                    <span className="text-xs text-slate-400 shrink-0 truncate max-w-[40%]">{c.developer}</span>
                  )}
                  {c.id === complexId && <Check size={12} className="text-blue-600 shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── District Selector ─────────────────────────────────────────────────────────

const DEFAULT_DISTRICTS = [
  'Центр', 'Северный', 'Южный', 'Западный', 'Восточный',
  'Новый город', 'Старый город', 'Микрорайон', 'ПМР',
  'Левый берег', 'Правый берег',
]

const DISTRICTS_KEY = 'crm_districts'

function getDistricts(): string[] {
  try {
    const raw = localStorage.getItem(DISTRICTS_KEY)
    if (!raw) return [...DEFAULT_DISTRICTS]
    const saved: string[] = JSON.parse(raw)
    // Merge defaults + saved, unique
    return Array.from(new Set([...DEFAULT_DISTRICTS, ...saved]))
  } catch {
    return [...DEFAULT_DISTRICTS]
  }
}

function saveCustomDistrict(name: string) {
  try {
    const raw = localStorage.getItem(DISTRICTS_KEY)
    const saved: string[] = raw ? JSON.parse(raw) : []
    if (!saved.includes(name)) {
      localStorage.setItem(DISTRICTS_KEY, JSON.stringify([...saved, name]))
    }
  } catch { /* ignore */ }
}

function DistrictSelector({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [districts, setDistricts] = useState<string[]>(() => getDistricts())
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = districts.filter((d) =>
    !search.trim() || d.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (d: string) => {
    onChange(d)
    setOpen(false)
    setSearch('')
  }

  const handleAddNew = () => {
    const name = search.trim()
    if (!name) return
    saveCustomDistrict(name)
    setDistricts(getDistricts())
    onChange(name)
    setOpen(false)
    setSearch('')
  }

  const canAdd = search.trim().length > 0 && !districts.some(
    (d) => d.toLowerCase() === search.trim().toLowerCase()
  )

  return (
    <div ref={dropRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 bg-white border rounded-lg text-sm text-left transition-all',
          open ? 'border-blue-500 ring-2 ring-blue-500' : 'border-slate-200 hover:border-slate-300'
        )}
      >
        {value ? (
          <span className="text-slate-900 flex-1 truncate">{value}</span>
        ) : (
          <span className="text-slate-400 flex-1">Выберите район...</span>
        )}
        <ChevronDown size={14} className={cn('text-slate-400 shrink-0 ml-2 transition-transform', open && 'rotate-180')} />
      </button>

      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="text-xs text-slate-400 hover:text-red-500 mt-1 flex items-center gap-1"
        >
          <X size={11} /> Убрать район
        </button>
      )}

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                type="text"
                placeholder="Поиск или новый район..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); canAdd ? handleAddNew() : filtered[0] && handleSelect(filtered[0]) } }}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {canAdd && (
              <button
                type="button"
                onClick={handleAddNew}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-blue-600 hover:bg-blue-50 transition-colors border-b border-slate-100"
              >
                <Plus size={13} />
                Добавить «{search.trim()}»
              </button>
            )}
            {filtered.length === 0 && !canAdd ? (
              <p className="text-xs text-slate-400 text-center py-4">Ничего не найдено</p>
            ) : (
              filtered.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleSelect(d)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-slate-50 transition-colors',
                    d === value && 'bg-blue-50 text-blue-700'
                  )}
                >
                  <span className="flex-1 truncate">{d}</span>
                  {d === value && <Check size={12} className="text-blue-600 shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Owner Selector ────────────────────────────────────────────────────────────

function OwnerSelector({
  value,
  onChange,
  error,
}: {
  value: string
  onChange: (id: string) => void
  error?: string
}) {
  const { data: clients = [] } = useClients()
  const createClient = useCreateClient()

  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [creating, setCreating] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  const selected = clients.find((c) => c.id === value)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false)
        setShowCreate(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = clients
    .filter((c) => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return c.name.toLowerCase().includes(q) || String(c.client_number).includes(q)
    })
    .slice(0, 30)

  const handleSelect = (id: string) => {
    onChange(id)
    setOpen(false)
    setSearch('')
  }

  const handleNoOwner = () => {
    onChange('')
    setOpen(false)
  }

  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const created = await createClient.mutateAsync({
        name: newName.trim(),
        phone: newPhone.trim(),
        status: 'Новый',
      })
      onChange(created.id)
      setShowCreate(false)
      setNewName('')
      setNewPhone('')
      setOpen(false)
      toast.success(`Клиент #${created.client_number} создан и выбран как собственник`)
    } catch (err) {
      toast.error(`Ошибка создания клиента: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div ref={dropRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); setShowCreate(false) }}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 bg-white border rounded-lg text-sm text-left transition-all',
          open ? 'border-blue-500 ring-2 ring-blue-500' : 'border-slate-200 hover:border-slate-300',
          error ? 'border-red-400' : ''
        )}
      >
        {selected ? (
          <span className="text-slate-900 flex items-center gap-2">
            <span className="text-xs font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">#{selected.client_number}</span>
            {selected.name}
          </span>
        ) : (
          <span className="text-slate-400">Выберите или создайте клиента</span>
        )}
        <ChevronDown size={14} className={cn('text-slate-400 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {/* No owner option shown below trigger */}
      {!selected && !open && (
        <p className="text-xs text-slate-400 mt-1">
          Или{' '}
          <button type="button" onClick={handleNoOwner} className="text-blue-500 hover:underline">
            оставить без собственника
          </button>
        </p>
      )}
      {selected && (
        <button
          type="button"
          onClick={handleNoOwner}
          className="text-xs text-slate-400 hover:text-red-500 mt-1 flex items-center gap-1"
        >
          <X size={11} /> Убрать собственника
        </button>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                type="text"
                placeholder="Поиск по имени или номеру..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Create mini-form */}
          {showCreate ? (
            <div className="p-3 border-b border-slate-100 space-y-2 bg-blue-50/50">
              <p className="text-xs font-semibold text-blue-700">Новый клиент</p>
              <input
                autoFocus
                type="text"
                placeholder="Имя *"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-2.5 py-1.5 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Телефон"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                className="w-full px-2.5 py-1.5 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={!newName.trim() || creating}
                  className="flex-1 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium disabled:opacity-60 flex items-center justify-center gap-1"
                >
                  {creating ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  Создать и выбрать
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-3 py-1.5 text-slate-500 hover:text-slate-700 text-xs"
                >
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-blue-600 hover:bg-blue-50 border-b border-slate-100 transition-colors"
            >
              <Plus size={13} /> Создать нового клиента
            </button>
          )}

          {/* No owner option */}
          <button
            type="button"
            onClick={handleNoOwner}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-500 hover:bg-slate-50 border-b border-slate-100 transition-colors"
          >
            <UserX size={13} /> Указать собственника позже
          </button>

          {/* Client list */}
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">
                {search ? 'Клиент не найден' : 'Нет клиентов'}
              </p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelect(c.id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-slate-50 transition-colors',
                    c.id === value && 'bg-blue-50 text-blue-700'
                  )}
                >
                  <span className="text-[10px] font-mono shrink-0 bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                    #{c.client_number}
                  </span>
                  <span className="flex-1 truncate">{c.name}</span>
                  {c.id === value && <Check size={12} className="text-blue-600 shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Communications ────────────────────────────────────────────────────────────

const COMM_OPTIONS = ['Электричество', 'Газ', 'Водоснабжение', 'Канализация', 'Отопление', 'Интернет']

const ROOM_TYPE_OPTIONS = ['Изолированные', 'Смежные', 'Студия', 'Евростудия', 'Свободная планировка']
const BATHROOM_OPTIONS  = ['Совмещенный', 'Раздельный', '2 санузла', '3+ санузла']
const WINDOW_VIEW_OPTIONS = ['Во двор', 'На улицу', 'На солнечную сторону', 'Угловая', 'Панорамный вид']
const RENOVATION_OPTIONS  = ['Без ремонта', 'Черновая отделка', 'Косметический', 'Евро', 'Дизайнерский', 'Студийный']
const FURNITURE_OPTIONS   = ['Без мебели', 'Хранение одежды', 'Спальные места', 'Кухонный гарнитур', 'Встроенная кухня', 'Вся мебель']
const SALE_METHOD_OPTIONS = ['Свободная', 'Альтернатива', 'Ипотечная', 'Долевая', 'Переуступка']

// ─── Main Form ─────────────────────────────────────────────────────────────────

export default function PropertyForm() {
  const navigate = useNavigate()
  const { closeForm, editingPropertyId, openDetail } = usePropertyStore()
  const [soldPrompt, setSoldPrompt] = useState<{ propertyId: string; sellerId: string } | null>(null)
  const [creatingDeal, setCreatingDeal] = useState(false)
  const createDeal = useCreateDeal()
  const { data: editingProperty } = useProperty(editingPropertyId ?? '')
  const createProperty = useCreateProperty()
  const updateProperty = useUpdateProperty()
  const uploadPhoto = useUploadPropertyPhoto()
  const deletePhoto = useDeletePropertyPhoto()

  // Local state for button-group fields (avoids setValue/register conflicts)
  const [propType,    setPropType]    = useState<PropertyType>('apartment')
  const [dealType,    setDealType]    = useState<'sale' | 'rent'>('sale')
  const [marketType,  setMarketType]  = useState<'secondary' | 'new_build' | undefined>(undefined)
  const [buildReadiness, setBuildReadiness] = useState<'ready' | 'unready' | null>(null)
  const [ownerId,     setOwnerId]     = useState('')
  const [complexId,   setComplexId]   = useState('')
  const [complexName, setComplexName] = useState('')
  const [district,    setDistrict]    = useState('')
  const [communications, setComms]   = useState<string[]>([])
  const [isRealtorProperty, setIsRealtorProperty] = useState(false)
  // Apartment extended
  const [windowViews,   setWindowViews]   = useState<string[]>([])
  const [furnitureList, setFurnitureList] = useState<string[]>([])
  const [extraFeatures, setExtraFeatures] = useState<string[]>([])
  const [heatedFloor,   setHeatedFloor]   = useState(false)
  const [extraInput,    setExtraInput]    = useState('')
  const uploadFloorPlan = useUploadFloorPlan()
  const deleteFloorPlan = useDeleteFloorPlan()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<any>()

  // Numeric change handler: strips non-digits, formats with thin spaces
  const onNumeric = (name: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/[\s\u00A0]/g, '').replace(/[^\d]/g, '')
    const formatted = digits ? digits.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0') : ''
    setValue(name, formatted, { shouldValidate: false })
    clearErrors(name as any)
  }

  // Load editing data
  useEffect(() => {
    if (editingProperty && editingPropertyId) {
      setPropType(editingProperty.type ?? 'apartment')
      setDealType(editingProperty.deal_type ?? 'sale')
      const mt = editingProperty.market_type
      if (mt === 'new_build_ready') { setMarketType('new_build'); setBuildReadiness('ready') }
      else if (mt === 'new_build_unready') { setMarketType('new_build'); setBuildReadiness('unready') }
      else { setMarketType((mt as 'secondary' | 'new_build' | undefined) ?? undefined); setBuildReadiness(null) }
      setOwnerId(editingProperty.owner_id ?? '')
      setComplexId(editingProperty.complex_id ?? '')
      setComplexName(editingProperty.complex_name ?? '')
      setDistrict(editingProperty.district ?? '')
      setComms(editingProperty.communications ?? [])
      setWindowViews(editingProperty.window_views ?? [])
      setFurnitureList(editingProperty.furniture ?? [])
      setExtraFeatures(editingProperty.extra_features ?? [])
      setHeatedFloor(editingProperty.heated_floor ?? false)
      setIsRealtorProperty(editingProperty.is_realtor_property ?? false)
      reset({
        status:          editingProperty.status,
        price:           fmtNum(editingProperty.price),
        price_net:       fmtNum(editingProperty.price_net),
        agent_commission: fmtNum(editingProperty.agent_commission),
        area:            editingProperty.area  != null ? String(editingProperty.area)  : '',
        rooms:           editingProperty.rooms ?? '',
        floor:           editingProperty.floor ?? '',
        total_floors:    editingProperty.total_floors ?? '',
        view:            editingProperty.view ?? '',
        address:         editingProperty.address ?? '',
        complex_name:    editingProperty.complex_name ?? '',
        description:     editingProperty.description ?? '',
        cadastral_number: editingProperty.cadastral_number ?? '',
        area_sotki:      editingProperty.area_sotki != null ? String(editingProperty.area_sotki) : '',
        area2:           editingProperty.area2 != null ? String(editingProperty.area2) : '',
        entrance_groups: editingProperty.entrance_groups ?? '',
        kitchen_area:    editingProperty.kitchen_area != null ? String(editingProperty.kitchen_area) : '',
        living_area:     editingProperty.living_area  != null ? String(editingProperty.living_area)  : '',
        room_type:       editingProperty.room_type ?? '',
        ceiling_height:  editingProperty.ceiling_height != null ? String(editingProperty.ceiling_height) : '',
        bathroom_type:   editingProperty.bathroom_type ?? '',
        renovation:      editingProperty.renovation ?? '',
        sale_method:     editingProperty.sale_method ?? '',
        has_mortgage:     editingProperty.has_mortgage ?? false,
        has_installment:  editingProperty.has_installment ?? false,
        has_trade_in:     editingProperty.has_trade_in ?? false,
        has_maternal_cap: editingProperty.has_maternal_cap ?? false,
        has_military_mort: editingProperty.has_military_mort ?? false,
        is_active_business: editingProperty.is_active_business ?? false,
        has_wet_points:   editingProperty.has_wet_points ?? false,
        has_parking:      editingProperty.has_parking ?? false,
      })
    }
  }, [editingProperty, editingPropertyId, reset])

  const toggleComm = (v: string) =>
    setComms((prev) => prev.includes(v) ? prev.filter((c) => c !== v) : [...prev, v])

  const onSubmit = async (raw: any) => {
    // ── Validate & parse price ─────────────────────────────────────────────
    const priceNum = parseFlexibleNumber(String(raw.price ?? ''))
    if (priceNum === null) {
      setError('price', { message: 'Укажите цену числом (например: 5500000)' })
      return
    }

    // ── Validate & parse area ──────────────────────────────────────────────
    const areaNum = parseFlexibleNumber(String(raw.area ?? ''))
    if (areaNum === null || areaNum <= 0) {
      setError('area', { message: 'Укажите площадь числом (например: 65)' })
      return
    }

    // ── Require address ────────────────────────────────────────────────────
    if (!raw.address?.trim()) {
      setError('address', { message: 'Укажите адрес объекта' })
      return
    }

    clearErrors()

    const intOrUndef = (v: any) => {
      const n = parseInt(v)
      return isNaN(n) || n === 0 ? undefined : n
    }
    const floatOrUndef = (v: any) => {
      const n = parseFlexibleNumber(String(v ?? ''))
      return n === null || n === 0 ? undefined : n
    }
    const strOrUndef = (v: any) => (v?.trim() ? v.trim() : undefined)

    const data: PropertyFormData = {
      type:          propType,
      status:        raw.status ?? 'active',
      deal_type:     dealType,
      market_type:   marketType === 'new_build'
        ? (buildReadiness === 'ready' ? 'new_build_ready' : buildReadiness === 'unready' ? 'new_build_unready' : 'new_build')
        : marketType,
      has_mortgage:  !!raw.has_mortgage,
      has_installment: !!raw.has_installment,
      has_trade_in:  !!raw.has_trade_in,
      has_maternal_cap: !!raw.has_maternal_cap,
      has_military_mort: !!raw.has_military_mort,
      price:         priceNum,
      price_net:     floatOrUndef(raw.price_net),
      agent_commission: floatOrUndef(raw.agent_commission),
      area:          propType === 'land' ? (floatOrUndef(raw.area_sotki) ?? 0) : areaNum,
      rooms:         intOrUndef(raw.rooms),
      floor:         intOrUndef(raw.floor),
      total_floors:  intOrUndef(raw.total_floors),
      view:          strOrUndef(raw.view),
      address:       raw.address.trim(),
      district:      district.trim() || undefined,
      description:   strOrUndef(raw.description),
      owner_id:      ownerId || (null as any),
      // Apartment extended
      kitchen_area:  floatOrUndef(raw.kitchen_area),
      living_area:   floatOrUndef(raw.living_area),
      room_type:     strOrUndef(raw.room_type),
      ceiling_height: floatOrUndef(raw.ceiling_height),
      bathroom_type: strOrUndef(raw.bathroom_type),
      renovation:    strOrUndef(raw.renovation),
      sale_method:   strOrUndef(raw.sale_method),
      heated_floor:  heatedFloor || undefined,
      window_views:  windowViews.length > 0 ? windowViews : undefined,
      furniture:     furnitureList.length > 0 ? furnitureList : undefined,
      extra_features: extraFeatures.length > 0 ? extraFeatures : undefined,
      // Land
      area_sotki:    floatOrUndef(raw.area_sotki),
      communications: communications.length > 0 ? communications : undefined,
      cadastral_number: strOrUndef(raw.cadastral_number),
      // House extra
      area2:         propType === 'house' ? floatOrUndef(raw.area2) : undefined,
      // Clear complex_id for land
      complex_id:    propType === 'land' ? undefined : (complexId || undefined),
      complex_name:  propType === 'land' ? undefined : (complexName.trim() || undefined),
      // Commercial
      is_active_business: !!raw.is_active_business || undefined,
      has_wet_points: !!raw.has_wet_points || undefined,
      has_parking:   !!raw.has_parking || undefined,
      entrance_groups: intOrUndef(raw.entrance_groups),
      // Source
      is_realtor_property: isRealtorProperty,
    }

    try {
      if (editingPropertyId) {
        await updateProperty.mutateAsync({ id: editingPropertyId, data })
        toast.success('Объект обновлён')
        if (data.status === 'sold') {
          setSoldPrompt({ propertyId: editingPropertyId, sellerId: ownerId })
        } else {
          closeForm()
        }
      } else {
        const created = await createProperty.mutateAsync(data)
        toast.success('Объект добавлен')
        if (data.status === 'sold') {
          setSoldPrompt({ propertyId: created.id, sellerId: ownerId })
        } else {
          closeForm()
          setTimeout(() => openDetail(created.id), 150)
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(`Ошибка: ${msg}`, { duration: 8000 })
    }
  }

  const showMarketType  = propType === 'apartment' || propType === 'house'
  const showConditions  = propType !== 'land'

  // ── Sold prompt overlay ────────────────────────────────────────────────────
  if (soldPrompt) {
    const handleCreateDeal = async () => {
      setCreatingDeal(true)
      try {
        await createDeal.mutateAsync({
          status: 'active',
          property_id: soldPrompt.propertyId || undefined,
          seller_id: soldPrompt.sellerId || undefined,
        })
        toast.success('Сделка создана')
        closeForm()
        navigate('/deals')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Ошибка при создании сделки')
      } finally {
        setCreatingDeal(false)
      }
    }

    return (
      <div className="flex flex-col items-center justify-center gap-6 p-8 text-center min-h-[320px]">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
          <HeartHandshake size={32} className="text-emerald-600" />
        </div>
        <div>
          <p className="text-lg font-bold text-slate-900 mb-1">Объект продан!</p>
          <p className="text-sm text-slate-500">Хотите создать сделку по этому объекту?</p>
        </div>
        <div className="flex flex-col gap-2 w-full max-w-xs">
          <button
            type="button"
            onClick={handleCreateDeal}
            disabled={creatingDeal}
            className="w-full py-3 rounded-xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {creatingDeal ? <Loader2 size={16} className="animate-spin" /> : <HeartHandshake size={16} />}
            Создать сделку
          </button>
          <button
            type="button"
            onClick={() => closeForm()}
            disabled={creatingDeal}
            className="w-full py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          >
            Пропустить
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col max-h-[90dvh]">
      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* ── Property type ────────────────────────────────────────────── */}
        <div>
          <FieldLabel required>Тип объекта</FieldLabel>
          <div className="grid grid-cols-4 gap-2">
            {(['apartment', 'house', 'land', 'commercial'] as PropertyType[]).map((t) => (
              <button
                key={t} type="button" onClick={() => setPropType(t)}
                className={cn(
                  'flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition-all',
                  propType === t
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                )}
              >
                <span className="text-lg">{PROPERTY_TYPE_ICONS[t]}</span>
                {PROPERTY_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {/* ── Realtor property flag ────────────────────────────────────── */}
        <button
          type="button"
          onClick={() => setIsRealtorProperty((v) => !v)}
          className={cn(
            'w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm font-medium transition-all',
            isRealtorProperty
              ? 'bg-purple-50 border-purple-300 text-purple-800'
              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
          )}
        >
          <span className="flex items-center gap-2">
            <span className="text-base">🤝</span>
            Объект риэлтора
          </span>
          <span className={cn(
            'text-xs px-2 py-0.5 rounded-full font-medium',
            isRealtorProperty ? 'bg-purple-200 text-purple-800' : 'bg-slate-100 text-slate-500'
          )}>
            {isRealtorProperty ? 'Да' : 'Нет'}
          </span>
        </button>

        {/* ── Deal type + Market type ──────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Тип сделки</FieldLabel>
            <div className="flex gap-2">
              {(['sale', 'rent'] as const).map((dt) => (
                <button key={dt} type="button" onClick={() => setDealType(dt)}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-xs font-medium border transition-all',
                    dealType === dt
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  )}
                >
                  {dt === 'sale' ? '💰 Продажа' : '🔑 Аренда'}
                </button>
              ))}
            </div>
          </div>

          {showMarketType && (
            <div>
              <FieldLabel>Рынок</FieldLabel>
              <div className="flex gap-1">
                {([undefined, 'secondary', 'new_build'] as const).map((mt) => (
                  <button key={mt ?? 'none'} type="button" onClick={() => { setMarketType(mt); if (mt !== 'new_build') setBuildReadiness(null) }}
                    className={cn(
                      'flex-1 py-2 rounded-lg text-xs font-medium border transition-all',
                      marketType === mt
                        ? 'bg-slate-700 text-white border-slate-700'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    )}
                  >
                    {mt === undefined ? '—' : mt === 'secondary' ? '🏘 Вторичка' : '🏗 Новострой'}
                  </button>
                ))}
              </div>
              {marketType === 'new_build' && (
                <div className="mt-2 flex gap-2 pl-1">
                  {([
                    { value: 'ready' as const,   label: '✅ Сданный дом'    },
                    { value: 'unready' as const, label: '🏗 Не сдан'        },
                  ]).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setBuildReadiness(buildReadiness === opt.value ? null : opt.value)}
                      className={cn(
                        'flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all',
                        buildReadiness === opt.value
                          ? 'bg-blue-100 text-blue-700 border-blue-300'
                          : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Status ──────────────────────────────────────────────────── */}
        <div>
          <FieldLabel required>Статус</FieldLabel>
          <select className={selectCls} {...register('status', { value: 'active' })}>
            <option value="active">Активный</option>
            <option value="reserved">Резерв</option>
            <option value="sold">{dealType === 'rent' ? 'Сдан' : 'Продан'}</option>
            <option value="withdrawn">Снят</option>
          </select>
        </div>

        {/* ── Price & Area (free text) ─────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel required>{dealType === 'rent' ? 'Аренда/мес (₽)' : 'Цена (₽)'}</FieldLabel>
            <input
              className={cn(inputCls, errors.price && 'border-red-400 focus:ring-red-400')}
              placeholder="5 500 000"
              inputMode="numeric"
              {...register('price')}
              onChange={onNumeric('price')}
            />
            <FieldError message={errors.price?.message as string} />
          </div>
          {propType !== 'land' && (
            <div>
              <FieldLabel required>Площадь (м²)</FieldLabel>
              <input
                className={cn(inputCls, errors.area && 'border-red-400 focus:ring-red-400')}
                placeholder="65"
                inputMode="decimal"
                {...register('area')}
                onChange={(e) => { register('area').onChange(e); clearErrors('area') }}
              />
              <FieldError message={errors.area?.message as string} />
            </div>
          )}
        </div>

        {/* ── Net price and commission ────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Цена на руки ₽</label>
            <input
              inputMode="numeric"
              placeholder="7 500 000"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register('price_net')}
              onChange={onNumeric('price_net')}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Комиссия риэлтора ₽</label>
            <input
              inputMode="numeric"
              placeholder="100 000"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register('agent_commission')}
              onChange={onNumeric('agent_commission')}
            />
          </div>
        </div>

        {/* ── Conditions ──────────────────────────────────────────────── */}
        {showConditions && (
          <div>
            <FieldLabel>Условия сделки</FieldLabel>
            <div className="flex flex-wrap gap-3">
              {[
                { field: 'has_mortgage',     label: '🏦 Ипотека',          accent: 'violet' },
                { field: 'has_installment',  label: '📅 Рассрочка',        accent: 'emerald' },
                { field: 'has_trade_in',     label: '🔄 Трейд-ин',         accent: 'orange' },
                { field: 'has_maternal_cap', label: '👶 Маткапитал',       accent: 'pink' },
                { field: 'has_military_mort',label: '🎖 Военная ипотека',  accent: 'slate' },
              ].map(({ field, label }) => (
                <label key={field} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded" {...register(field)} />
                  <span className="text-sm text-slate-700">{label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* ── Apartment specifics ──────────────────────────────────────── */}
        {propType === 'apartment' && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">О квартире</p>

            {/* rooms, floor, total_floors */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <FieldLabel>Комнат</FieldLabel>
                <select className={selectCls} {...register('rooms')}>
                  <option value="">—</option>
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>Этаж</FieldLabel>
                <input className={inputCls} placeholder="5" inputMode="numeric" {...register('floor')} />
              </div>
              <div>
                <FieldLabel>Этажей в доме</FieldLabel>
                <input className={inputCls} placeholder="16" inputMode="numeric" {...register('total_floors')} />
              </div>
            </div>

            {/* kitchen_area, living_area */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Площадь кухни (м²)</FieldLabel>
                <input className={inputCls} placeholder="12" inputMode="decimal" {...register('kitchen_area')} />
              </div>
              <div>
                <FieldLabel>Жилая площадь (м²)</FieldLabel>
                <input className={inputCls} placeholder="38" inputMode="decimal" {...register('living_area')} />
              </div>
            </div>

            {/* ceiling_height, bathroom_type */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Высота потолков (м)</FieldLabel>
                <input className={inputCls} placeholder="2.8" inputMode="decimal" {...register('ceiling_height')} />
              </div>
              <div>
                <FieldLabel>Санузел</FieldLabel>
                <select className={selectCls} {...register('bathroom_type')}>
                  <option value="">—</option>
                  {BATHROOM_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>

            {/* room_type */}
            <div>
              <FieldLabel>Тип комнат</FieldLabel>
              <select className={selectCls} {...register('room_type')}>
                <option value="">—</option>
                {ROOM_TYPE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            {/* window_views chips */}
            <div>
              <FieldLabel>Окна</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {WINDOW_VIEW_OPTIONS.map((o) => (
                  <button key={o} type="button"
                    onClick={() => setWindowViews((p) => p.includes(o) ? p.filter((v) => v !== o) : [...p, o])}
                    className={cn('px-2.5 py-1 rounded-lg text-xs font-medium border transition-all',
                      windowViews.includes(o) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    )}
                  >{o}</button>
                ))}
              </div>
            </div>

            {/* renovation, sale_method */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Ремонт</FieldLabel>
                <select className={selectCls} {...register('renovation')}>
                  <option value="">—</option>
                  {RENOVATION_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel>Способ продажи</FieldLabel>
                <select className={selectCls} {...register('sale_method')}>
                  <option value="">—</option>
                  {SALE_METHOD_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>

            {/* heated_floor toggle */}
            <button type="button" onClick={() => setHeatedFloor((v) => !v)}
              className={cn('flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all',
                heatedFloor ? 'bg-orange-50 border-orange-300 text-orange-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              )}
            >
              <span>🔥</span> Тёплый пол
              <span className={cn('ml-auto text-xs px-2 py-0.5 rounded-full', heatedFloor ? 'bg-orange-200 text-orange-800' : 'bg-slate-100 text-slate-500')}>
                {heatedFloor ? 'Есть' : 'Нет'}
              </span>
            </button>

            {/* furniture chips */}
            <div>
              <FieldLabel>Мебель</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {FURNITURE_OPTIONS.map((o) => (
                  <button key={o} type="button"
                    onClick={() => setFurnitureList((p) => p.includes(o) ? p.filter((v) => v !== o) : [...p, o])}
                    className={cn('px-2.5 py-1 rounded-lg text-xs font-medium border transition-all',
                      furnitureList.includes(o) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    )}
                  >{o}</button>
                ))}
              </div>
            </div>

            {/* extra_features tag input */}
            <div>
              <FieldLabel>Дополнительно</FieldLabel>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {extraFeatures.map((f) => (
                  <span key={f} className="flex items-center gap-1 px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full text-xs font-medium">
                    {f}
                    <button type="button" onClick={() => setExtraFeatures((p) => p.filter((v) => v !== f))}>
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  className={cn(inputCls, 'flex-1')}
                  placeholder="Гардеробная, панорамные окна... (Enter)"
                  value={extraInput}
                  onChange={(e) => setExtraInput(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ',') && extraInput.trim()) {
                      e.preventDefault()
                      const v = extraInput.trim().replace(/,$/, '')
                      if (v && !extraFeatures.includes(v)) setExtraFeatures((p) => [...p, v])
                      setExtraInput('')
                    }
                  }}
                />
                <button type="button"
                  onClick={() => {
                    const v = extraInput.trim()
                    if (v && !extraFeatures.includes(v)) setExtraFeatures((p) => [...p, v])
                    setExtraInput('')
                  }}
                  className="px-3 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm hover:bg-slate-200 transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── House specifics ──────────────────────────────────────────── */}
        {propType === 'house' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Площадь участка (сот.)</FieldLabel>
                <input className={inputCls} placeholder="8" inputMode="decimal" {...register('area_sotki')} />
              </div>
              <div>
                <FieldLabel>Площадь 2-го дома (м²)</FieldLabel>
                <input className={inputCls} placeholder="Если есть" inputMode="decimal" {...register('area2')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Этажей в доме</FieldLabel>
                <input className={inputCls} placeholder="2" inputMode="numeric" {...register('total_floors')} />
              </div>
              <div>
                <FieldLabel>Этаж</FieldLabel>
                <input className={inputCls} placeholder="1" inputMode="numeric" {...register('floor')} />
              </div>
            </div>
          </div>
        )}

        {/* ── Land specifics ──────────────────────────────────────────── */}
        {propType === 'land' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Площадь (соток)</FieldLabel>
                <input className={inputCls} placeholder="15" inputMode="decimal" {...register('area_sotki')} />
              </div>
              <div>
                <FieldLabel>Кадастровый номер</FieldLabel>
                <input className={inputCls} placeholder="50:01:0000000:123" {...register('cadastral_number')} />
              </div>
            </div>
            <div>
              <FieldLabel>Коммуникации</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {COMM_OPTIONS.map((c) => (
                  <button key={c} type="button" onClick={() => toggleComm(c)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-medium border transition-all',
                      communications.includes(c)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    )}
                  >{c}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Commercial specifics ────────────────────────────────────── */}
        {propType === 'commercial' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[
                { field: 'is_active_business', label: 'Действующий бизнес' },
                { field: 'has_wet_points',     label: 'Мокрые точки' },
                { field: 'has_parking',        label: 'Парковка' },
              ].map(({ field, label }) => (
                <label key={field} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded" {...register(field)} />
                  <span className="text-sm text-slate-700">{label}</span>
                </label>
              ))}
              <div>
                <FieldLabel>Входных групп</FieldLabel>
                <input className={inputCls} placeholder="1" inputMode="numeric" {...register('entrance_groups')} />
              </div>
            </div>
            <div>
              <FieldLabel>Коммуникации</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {COMM_OPTIONS.map((c) => (
                  <button key={c} type="button" onClick={() => toggleComm(c)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-medium border transition-all',
                      communications.includes(c)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    )}
                  >{c}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Location ────────────────────────────────────────────────── */}
        <div className="space-y-3">
          <div>
            <FieldLabel>Район</FieldLabel>
            <DistrictSelector value={district} onChange={setDistrict} />
          </div>
          {propType !== 'land' && (
            <div>
              <FieldLabel>Жилой комплекс</FieldLabel>
              <ComplexSelector
                complexId={complexId}
                complexName={complexName}
                onChange={(id, name) => { setComplexId(id); setComplexName(name) }}
              />
            </div>
          )}
          <div>
            <FieldLabel required>Адрес</FieldLabel>
            <input
              className={cn(inputCls, errors.address && 'border-red-400 focus:ring-red-400')}
              placeholder="ул. Ленина, д. 5, кв. 12"
              {...register('address')}
              onChange={(e) => { register('address').onChange(e); clearErrors('address') }}
            />
            <FieldError message={errors.address?.message as string} />
          </div>
        </div>

        {/* ── Description ─────────────────────────────────────────────── */}
        <div>
          <FieldLabel>Описание</FieldLabel>
          <textarea
            className={cn(inputCls, 'resize-none')}
            rows={3}
            placeholder="Описание объекта в свободной форме..."
            {...register('description')}
          />
        </div>

        {/* ── Owner ───────────────────────────────────────────────────── */}
        <div>
          <FieldLabel>Собственник</FieldLabel>
          <OwnerSelector
            value={ownerId}
            onChange={setOwnerId}
            error={errors.owner_id?.message as string}
          />
          {!ownerId && (
            <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
              <span>⚠</span> Собственник не указан — карточка будет сохранена без него
            </p>
          )}
        </div>

        {/* ── Photos ───────────────────────────────────────────────────── */}
        {editingPropertyId && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">
              Фотографии
              {editingProperty?.photos?.length ? (
                <span className="ml-1.5 text-slate-400 font-normal">({editingProperty.photos.length})</span>
              ) : null}
            </label>
            <MediaUploader
              photos={editingProperty?.photos ?? []}
              uploading={uploadPhoto.isPending}
              onUpload={async (files) => {
                for (const file of files) {
                  try {
                    await uploadPhoto.mutateAsync({ propertyId: editingPropertyId, file })
                  } catch (err) {
                    const msg = err instanceof Error ? err.message : 'Ошибка загрузки фото'
                    toast.error(msg, { duration: 8000 })
                    console.error('[PropertyForm] upload error:', err)
                  }
                }
              }}
              onDelete={(url) => deletePhoto.mutate({ propertyId: editingPropertyId, url })}
            />
          </div>
        )}
        {!editingPropertyId && (
          <p className="text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2.5 border border-dashed border-slate-200">
            💡 Фотографии и планировку можно добавить после сохранения объекта
          </p>
        )}

        {/* ── Floor plan ───────────────────────────────────────────────── */}
        {editingPropertyId && (propType === 'apartment' || propType === 'house') && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Планировка</label>
            {editingProperty?.floor_plan ? (
              <div className="relative inline-block">
                <img
                  src={editingProperty.floor_plan}
                  alt="Планировка"
                  className="w-full max-h-48 object-contain rounded-xl border border-slate-200 bg-slate-50"
                />
                <button
                  type="button"
                  onClick={() => deleteFloorPlan.mutate(editingPropertyId)}
                  disabled={deleteFloorPlan.isPending}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ) : (
              <label className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-colors',
                uploadFloorPlan.isPending ? 'border-blue-300 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'
              )}>
                {uploadFloorPlan.isPending
                  ? <Loader2 size={20} className="animate-spin text-blue-500" />
                  : <ImageIcon size={20} className="text-slate-400" />
                }
                <span className="text-xs text-slate-500">
                  {uploadFloorPlan.isPending ? 'Загрузка...' : 'Нажмите для загрузки планировки'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    try {
                      await uploadFloorPlan.mutateAsync({ propertyId: editingPropertyId, file })
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : 'Ошибка загрузки')
                    }
                  }}
                />
              </label>
            )}
          </div>
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div className="flex gap-3 px-6 py-4 border-t border-slate-100 shrink-0">
        <button
          type="button" onClick={closeForm}
          className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Отмена
        </button>
        <button
          type="submit" disabled={isSubmitting}
          className="flex-1 py-2.5 rounded-xl bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 size={15} className="animate-spin" />}
          {editingPropertyId ? 'Сохранить изменения' : 'Добавить объект'}
        </button>
      </div>
    </form>
  )
}

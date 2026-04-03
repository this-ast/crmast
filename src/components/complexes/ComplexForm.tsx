import { useEffect, useRef, useState } from 'react'
import { Loader2, Pencil, Plus, Trash2, Upload, X, ChevronDown, Search, Check } from 'lucide-react'
import {
  useCreateComplex,
  useUpdateComplex,
  useComplex,
  useUploadComplexPhoto,
  useUploadComplexDocument,
  useDeleteComplexPhoto,
  useDeleteComplexDocument,
  useUploadComplexLayout,
  useDeleteComplexLayout,
  useComplexUnits,
  useCreateComplexUnit,
  useUpdateComplexUnit,
  useDeleteComplexUnit,
} from '@/hooks/useComplexes'
import { useComplexStore } from '@/store/useComplexStore'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'
import type { ComplexPricing, ComplexUnit, PricingCondition, PricingPaymentType } from '@/types'

const DOC_TYPE_LABELS = {
  permit: 'Разрешение на строительство',
  developer: 'Документы застройщика',
  other: 'Другое',
}

const ELEVATOR_OPTIONS = ['нет', '1', '2', '3+']
const YARD_OPTIONS = ['закрытая территория', 'детская площадка', 'спортивная площадка']
const PARKING_OPTIONS = ['подземная', 'наземная', 'многоуровневая', 'открытая во дворе', 'за шлагбаумом']
const BUILDING_TYPE_OPTIONS = ['кирпичный', 'монолитно-кирпичный', 'блочный', 'монолитно-блочный']

// ─── District Selector ────────────────────────────────────────────────────────

const DEFAULT_DISTRICTS = [
  'Центр', 'Северный', 'Южный', 'Западный', 'Восточный',
  'Новый город', 'Старый город', 'Микрорайон', 'ПМР',
  'Левый берег', 'Правый берег',
]
const DISTRICTS_KEY = 'crm_districts'

function getDistricts(): string[] {
  try {
    const saved: string[] = JSON.parse(localStorage.getItem(DISTRICTS_KEY) ?? '[]')
    return Array.from(new Set([...DEFAULT_DISTRICTS, ...saved]))
  } catch { return [...DEFAULT_DISTRICTS] }
}

function saveCustomDistrict(name: string) {
  try {
    const saved: string[] = JSON.parse(localStorage.getItem(DISTRICTS_KEY) ?? '[]')
    if (!saved.includes(name)) localStorage.setItem(DISTRICTS_KEY, JSON.stringify([...saved, name]))
  } catch { /* ignore */ }
}

function DistrictSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [districts, setDistricts] = useState<string[]>(() => getDistricts())
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const filtered = districts.filter((d) => !search.trim() || d.toLowerCase().includes(search.toLowerCase()))
  const canAdd = search.trim().length > 0 && !districts.some((d) => d.toLowerCase() === search.trim().toLowerCase())

  const handleSelect = (d: string) => { onChange(d); setOpen(false); setSearch('') }
  const handleAdd = () => {
    const name = search.trim()
    saveCustomDistrict(name)
    setDistricts(getDistricts())
    onChange(name)
    setOpen(false)
    setSearch('')
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 bg-white border rounded-lg text-sm text-left transition-all',
          open ? 'border-blue-500 ring-2 ring-blue-500' : 'border-slate-200 hover:border-slate-300'
        )}
      >
        <span className={value ? 'text-slate-900' : 'text-slate-400'}>
          {value || 'Выберите район...'}
        </span>
        <ChevronDown size={14} className={cn('text-slate-400 shrink-0 ml-2 transition-transform', open && 'rotate-180')} />
      </button>
      {value && (
        <button type="button" onClick={() => onChange('')} className="text-xs text-slate-400 hover:text-red-500 mt-1 flex items-center gap-1">
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
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); canAdd ? handleAdd() : filtered[0] && handleSelect(filtered[0]) } }}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="max-h-44 overflow-y-auto">
            {canAdd && (
              <button type="button" onClick={handleAdd} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-blue-600 hover:bg-blue-50 border-b border-slate-100">
                <Plus size={13} /> Добавить «{search.trim()}»
              </button>
            )}
            {filtered.map((d) => (
              <button key={d} type="button" onClick={() => handleSelect(d)}
                className={cn('w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-slate-50', d === value && 'bg-blue-50 text-blue-700')}
              >
                <span className="flex-1">{d}</span>
                {d === value && <Check size={12} className="text-blue-600 shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── FieldLabel ────────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-slate-600 mb-1.5">
      {children}
    </label>
  )
}

function MultiToggle({
  label, options, value, onChange, multi = false
}: {
  label: string
  options: string[]
  value: string | string[]
  onChange: (v: string | string[]) => void
  multi?: boolean
}) {
  const selected = multi ? (value as string[]) : []
  const singleVal = multi ? '' : (value as string)

  function toggle(opt: string) {
    if (multi) {
      const arr = selected.includes(opt) ? selected.filter(x => x !== opt) : [...selected, opt]
      onChange(arr)
    } else {
      onChange(singleVal === opt ? '' : opt)
    }
  }

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => {
          const active = multi ? selected.includes(opt) : singleVal === opt
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                active
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
              )}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
        className
      )}
      {...props}
    />
  )
}

function DeveloperUnitsSection({ complexId }: { complexId: string }) {
  const { data: units = [] } = useComplexUnits(complexId)
  const createUnit = useCreateComplexUnit()
  const updateUnit = useUpdateComplexUnit()
  const deleteUnit = useDeleteComplexUnit()
  const [editingUnit, setEditingUnit] = useState<ComplexUnit | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  const emptyForm = { title: '', rooms: '', area: '', floor: '', total_floors: '', price: '', notes: '' }
  const [form, setForm] = useState<typeof emptyForm>(emptyForm)

  const handleAdd = async () => {
    try {
      await createUnit.mutateAsync({
        complexId,
        data: {
          title: form.title || undefined,
          rooms: form.rooms ? Number(form.rooms) : undefined,
          area: form.area ? Number(form.area) : undefined,
          floor: form.floor ? Number(form.floor) : undefined,
          total_floors: form.total_floors ? Number(form.total_floors) : undefined,
          price: form.price ? Number(form.price) : undefined,
          notes: form.notes || undefined,
        },
      })
      setForm(emptyForm)
      setShowAddForm(false)
      toast.success('Объект добавлен')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    }
  }

  const handleUpdate = async (unit: ComplexUnit) => {
    if (!editingUnit) return
    try {
      await updateUnit.mutateAsync({
        id: unit.id,
        complexId,
        data: {
          title: form.title || undefined,
          rooms: form.rooms ? Number(form.rooms) : undefined,
          area: form.area ? Number(form.area) : undefined,
          floor: form.floor ? Number(form.floor) : undefined,
          total_floors: form.total_floors ? Number(form.total_floors) : undefined,
          price: form.price ? Number(form.price) : undefined,
          notes: form.notes || undefined,
        },
      })
      setEditingUnit(null)
      toast.success('Обновлено')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    }
  }

  const handleDelete = async (unit: ComplexUnit) => {
    try {
      await deleteUnit.mutateAsync({ id: unit.id, complexId })
      toast.success('Удалено')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    }
  }

  const startEdit = (unit: ComplexUnit) => {
    setEditingUnit(unit)
    setForm({
      title: unit.title ?? '',
      rooms: unit.rooms != null ? String(unit.rooms) : '',
      area: unit.area != null ? String(unit.area) : '',
      floor: unit.floor != null ? String(unit.floor) : '',
      total_floors: unit.total_floors != null ? String(unit.total_floors) : '',
      price: unit.price != null ? String(unit.price) : '',
      notes: unit.notes ?? '',
    })
    setShowAddForm(false)
  }

  const UnitForm = ({ onSave, onCancel, saving }: { onSave: () => void; onCancel: () => void; saving?: boolean }) => (
    <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
      <Input placeholder="Название (напр. 2-комн. кв.)" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} />
      <div className="grid grid-cols-2 gap-2">
        <Input type="number" placeholder="Комнат" value={form.rooms} onChange={(e) => setForm(f => ({ ...f, rooms: e.target.value }))} />
        <Input type="number" placeholder="Площадь м²" value={form.area} onChange={(e) => setForm(f => ({ ...f, area: e.target.value }))} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input type="number" placeholder="Этаж" value={form.floor} onChange={(e) => setForm(f => ({ ...f, floor: e.target.value }))} />
        <Input type="number" placeholder="Всего этажей" value={form.total_floors} onChange={(e) => setForm(f => ({ ...f, total_floors: e.target.value }))} />
      </div>
      <Input type="number" placeholder="Цена (наличный)" value={form.price} onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))} />
      <Input placeholder="Заметки" value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} />
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="flex-1 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100">Отмена</button>
        <button type="button" onClick={onSave} disabled={saving} className="flex-1 py-1.5 rounded-lg bg-blue-600 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-1">
          {saving && <Loader2 size={12} className="animate-spin" />}Сохранить
        </button>
      </div>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <FieldLabel>Объекты от застройщика</FieldLabel>
        {!showAddForm && !editingUnit && (
          <button type="button" onClick={() => { setShowAddForm(true); setForm(emptyForm) }} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
            <Plus size={12} /> Добавить
          </button>
        )}
      </div>
      {showAddForm && (
        <UnitForm
          onSave={handleAdd}
          onCancel={() => setShowAddForm(false)}
          saving={createUnit.isPending}
        />
      )}
      <div className="space-y-2">
        {units.map((unit) => (
          <div key={unit.id}>
            {editingUnit?.id === unit.id ? (
              <UnitForm
                onSave={() => handleUpdate(unit)}
                onCancel={() => setEditingUnit(null)}
                saving={updateUnit.isPending}
              />
            ) : (
              <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {unit.title || (unit.rooms ? `${unit.rooms}-комн. кв.` : 'Объект')}
                    {unit.area ? ` · ${unit.area} м²` : ''}
                    {unit.floor ? ` · ${unit.floor}${unit.total_floors ? `/${unit.total_floors}` : ''} эт.` : ''}
                  </p>
                  {unit.price != null && (
                    <p className="text-xs font-semibold text-emerald-600 mt-0.5">
                      💵 {new Intl.NumberFormat('ru-RU').format(unit.price)} ₽
                    </p>
                  )}
                  {unit.notes && <p className="text-xs text-slate-400 truncate mt-0.5">{unit.notes}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button type="button" onClick={() => startEdit(unit)} className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                    <Pencil size={13} />
                  </button>
                  <button type="button" onClick={() => handleDelete(unit)} className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {units.length === 0 && !showAddForm && (
          <p className="text-xs text-slate-400">Нет объектов от застройщика</p>
        )}
      </div>
    </div>
  )
}

export default function ComplexForm() {
  const { closeForm, editingComplexId } = useComplexStore()
  const { data: editingComplex } = useComplex(editingComplexId ?? '')
  const createComplex = useCreateComplex()
  const updateComplex = useUpdateComplex()
  const uploadPhoto = useUploadComplexPhoto()
  const deletePhoto = useDeleteComplexPhoto()
  const uploadDoc = useUploadComplexDocument()
  const deleteDoc = useDeleteComplexDocument()
  const uploadLayout = useUploadComplexLayout()
  const deleteLayout = useDeleteComplexLayout()

  const photoInputRef = useRef<HTMLInputElement>(null)
  const docInputRef = useRef<HTMLInputElement>(null)
  const layoutInputRef = useRef<HTMLInputElement>(null)

  // Form fields as plain state — no React Hook Form
  const [name, setName] = useState('')
  const [developer, setDeveloper] = useState('')
  const [completionDate, setCompletionDate] = useState('')
  const [description, setDescription] = useState('')
  const [purchaseConditions, setPurchaseConditions] = useState('')
  const [floorsTotal, setFloorsTotal] = useState('')
  const [elevator, setElevator] = useState('')
  const [yardFeatures, setYardFeatures] = useState<string[]>([])
  const [parking, setParking] = useState<string[]>([])
  const [buildingType, setBuildingType] = useState('')
  const [district, setDistrict] = useState('')
  const [address, setAddress] = useState('')
  const [pricing, setPricing] = useState<ComplexPricing>({})
  const [pricingConditions, setPricingConditions] = useState<PricingCondition[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Populate form when editing
  useEffect(() => {
    if (editingComplex) {
      setName(editingComplex.name ?? '')
      setDeveloper(editingComplex.developer ?? '')
      setCompletionDate(editingComplex.completion_date ?? '')
      setDescription(editingComplex.description ?? '')
      setPurchaseConditions(editingComplex.purchase_conditions ?? '')
      setFloorsTotal(editingComplex.floors_total ?? '')
      setElevator(editingComplex.elevator ?? '')
      setYardFeatures(editingComplex.yard_features ?? [])
      setParking(editingComplex.parking ?? [])
      setBuildingType(editingComplex.building_type ?? '')
      setDistrict(editingComplex.district ?? '')
      setAddress(editingComplex.address ?? '')
      setPricing(editingComplex.pricing ?? {})
      setPricingConditions(editingComplex.pricing_conditions ?? [])
    }
  }, [editingComplex])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    // Блокируем только если абсолютно всё пусто
    const allEmpty = !name.trim() && !developer.trim() && !completionDate.trim() && !description.trim() && !purchaseConditions.trim()
    if (allEmpty) {
      setSubmitError('Заполните хотя бы одно поле')
      return
    }

    const data = {
      name: name.trim() || 'Без названия',
      developer: developer.trim() || undefined,
      completion_date: completionDate.trim() || undefined,
      description: description.trim() || undefined,
      purchase_conditions: purchaseConditions.trim() || undefined,
      characteristics: editingComplex?.characteristics ?? {},
      developer_phones: editingComplex?.developer_phones ?? [],
      manager_names: editingComplex?.manager_names ?? [],
      manager_phones: editingComplex?.manager_phones ?? [],
      floors_total: floorsTotal.trim() || undefined,
      elevator: elevator.trim() || undefined,
      yard_features: yardFeatures,
      parking: parking,
      building_type: buildingType.trim() || undefined,
      district: district.trim() || undefined,
      address: address.trim() || undefined,
      pricing: Object.keys(pricing).length > 0 ? pricing : undefined,
      pricing_conditions: pricingConditions,
    }

    console.log('[ComplexForm] Отправка данных:', data)
    setIsLoading(true)
    try {
      if (editingComplexId) {
        await updateComplex.mutateAsync({ id: editingComplexId, data })
        toast.success('ЖК обновлён')
      } else {
        await createComplex.mutateAsync(data)
        toast.success('ЖК добавлен')
      }
      closeForm()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка при сохранении'
      console.error('[ComplexForm] Ошибка:', err)
      setSubmitError(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  // Photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingComplexId || !e.target.files?.[0]) return
    const file = e.target.files[0]
    try {
      await uploadPhoto.mutateAsync({ complexId: editingComplexId, file })
      toast.success('Фото загружено')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка загрузки')
    }
    e.target.value = ''
  }

  // Document upload
  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingComplexId || !e.target.files?.[0]) return
    const file = e.target.files[0]
    const docType = (e.target.dataset.doctype as 'permit' | 'developer' | 'other') ?? 'other'
    const docName = file.name.replace(/\.[^/.]+$/, '')
    try {
      await uploadDoc.mutateAsync({ complexId: editingComplexId, file, docName, docType })
      toast.success('Документ загружен')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка загрузки')
    }
    e.target.value = ''
  }

  // Layout upload
  const handleLayoutUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingComplexId || !e.target.files?.[0]) return
    const file = e.target.files[0]
    try {
      await uploadLayout.mutateAsync({ complexId: editingComplexId, file })
      toast.success('Планировка загружена')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка загрузки')
    }
    e.target.value = ''
  }

  // Characteristics helpers
  const chars = editingComplex?.characteristics ?? {}
  const charEntries = Object.entries(chars)

  const updateChar = async (oldKey: string, newKey: string, newValue: string) => {
    if (!editingComplexId) return
    const updated = { ...chars }
    delete updated[oldKey]
    if (newKey.trim()) updated[newKey.trim()] = newValue
    await updateComplex.mutateAsync({ id: editingComplexId, data: { characteristics: updated } as never })
  }

  const addChar = async () => {
    if (!editingComplexId) return
    const key = `Характеристика ${charEntries.length + 1}`
    await updateComplex.mutateAsync({
      id: editingComplexId,
      data: { characteristics: { ...chars, [key]: '' } } as never,
    })
  }

  const removeChar = async (key: string) => {
    if (!editingComplexId) return
    const updated = { ...chars }
    delete updated[key]
    await updateComplex.mutateAsync({ id: editingComplexId, data: { characteristics: updated } as never })
  }

  // Phone/manager helpers
  const updateArray = async (field: 'developer_phones' | 'manager_phones' | 'manager_names', arr: string[]) => {
    if (!editingComplexId) return
    await updateComplex.mutateAsync({ id: editingComplexId, data: { [field]: arr } as never })
  }

  const devPhones = editingComplex?.developer_phones ?? []
  const mgNames = editingComplex?.manager_names ?? []
  const mgPhones = editingComplex?.manager_phones ?? []

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col" style={{ maxHeight: '80vh' }}>
      {/* Error at top */}
      {submitError && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm font-medium text-red-700 shrink-0">
          ⚠️ {submitError}
        </div>
      )}

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-5 w-full min-w-0">
        {/* Name */}
        <div>
          <FieldLabel>Название ЖК</FieldLabel>
          <Input
            placeholder="ЖК Солнечный"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        {/* Developer + Completion */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Застройщик</FieldLabel>
            <Input
              placeholder="ООО Стройград"
              value={developer}
              onChange={(e) => setDeveloper(e.target.value)}
            />
          </div>
          <div>
            <FieldLabel>Срок сдачи</FieldLabel>
            <Input
              placeholder="Q4 2025"
              value={completionDate}
              onChange={(e) => setCompletionDate(e.target.value)}
            />
          </div>
        </div>

        {/* District + Address */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Район</FieldLabel>
            <DistrictSelector value={district} onChange={setDistrict} />
          </div>
          <div>
            <FieldLabel>Адрес</FieldLabel>
            <Input
              placeholder="ул. Ленина, 1"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <FieldLabel>Описание</FieldLabel>
          <textarea
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
            placeholder="Описание ЖК..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Purchase conditions */}
        <div>
          <FieldLabel>Условия покупки</FieldLabel>
          <textarea
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={2}
            placeholder="Ипотека 0,1%, рассрочка на 24 мес..."
            value={purchaseConditions}
            onChange={(e) => setPurchaseConditions(e.target.value)}
          />
        </div>

        {/* Pricing conditions — dynamic list */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Условия сделки</p>
            <div className="flex flex-wrap gap-1">
              {([
                { type: 'cash' as PricingPaymentType, label: 'Наличный' },
                { type: 'installment' as PricingPaymentType, label: 'Рассрочка' },
                { type: 'mortgage' as PricingPaymentType, label: 'Ипотека' },
                { type: 'escrow' as PricingPaymentType, label: 'Эскроу' },
              ] as { type: PricingPaymentType; label: string }[]).map((preset) => (
                <button
                  key={preset.type}
                  type="button"
                  onClick={() => setPricingConditions((prev) => [
                    ...prev,
                    { id: crypto.randomUUID(), label: preset.label, payment_type: preset.type, price_per_sqm: undefined, notes: '', updated_at: '' },
                  ])}
                  className="text-xs text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded transition-colors"
                >
                  + {preset.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPricingConditions((prev) => [
                  ...prev,
                  { id: crypto.randomUUID(), label: '', payment_type: 'other', price_per_sqm: undefined, notes: '', updated_at: '' },
                ])}
                className="text-xs text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded transition-colors"
              >
                + Своё
              </button>
            </div>
          </div>

          {pricingConditions.length === 0 && (
            <p className="text-xs text-slate-400">Нет условий. Нажмите + чтобы добавить.</p>
          )}

          {pricingConditions.length > 0 && (
            <div className="space-y-2">
              {pricingConditions.map((cond) => (
                <div key={cond.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="text"
                      placeholder="Название условия"
                      value={cond.label}
                      onChange={(e) => setPricingConditions((prev) => prev.map((c) => c.id === cond.id ? { ...c, label: e.target.value } : c))}
                      className="flex-1 min-w-0 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <select
                      value={cond.payment_type}
                      onChange={(e) => setPricingConditions((prev) => prev.map((c) => c.id === cond.id ? { ...c, payment_type: e.target.value as PricingPaymentType } : c))}
                      className="shrink-0 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="cash">Наличный</option>
                      <option value="installment">Рассрочка</option>
                      <option value="mortgage">Ипотека</option>
                      <option value="escrow">Эскроу</option>
                      <option value="other">Другое</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setPricingConditions((prev) => prev.filter((c) => c.id !== cond.id))}
                      className="p-1 text-slate-300 hover:text-red-500 transition-colors shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wide shrink-0">₽/м²</span>
                      <input
                        inputMode="numeric"
                        placeholder="100 000"
                        value={cond.price_per_sqm != null ? String(cond.price_per_sqm).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0') : ''}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/[\s\u00A0]/g, '').replace(/[^\d]/g, '')
                          setPricingConditions((prev) => prev.map((c) => c.id === cond.id ? { ...c, price_per_sqm: digits ? Number(digits) : undefined } : c))
                        }}
                        className="flex-1 min-w-0 w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <input
                      type="date"
                      value={cond.updated_at ?? ''}
                      onChange={(e) => setPricingConditions((prev) => prev.map((c) => c.id === cond.id ? { ...c, updated_at: e.target.value || undefined } : c))}
                      className="w-full min-w-0 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Примечание (этажи 1-5, вид на горы, первоначальный взнос...)"
                    value={cond.notes ?? ''}
                    onChange={(e) => setPricingConditions((prev) => prev.map((c) => c.id === cond.id ? { ...c, notes: e.target.value } : c))}
                    className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-300"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Building characteristics */}
        <div className="space-y-4 pt-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Характеристики здания</p>

          {/* Floors + Building type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Этажность</FieldLabel>
              <Input
                placeholder="25"
                value={floorsTotal}
                onChange={(e) => setFloorsTotal(e.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Тип дома</FieldLabel>
              <Input
                placeholder="кирпичный"
                value={buildingType}
                onChange={(e) => setBuildingType(e.target.value)}
                list="building-type-options"
              />
              <datalist id="building-type-options">
                {BUILDING_TYPE_OPTIONS.map(o => <option key={o} value={o} />)}
              </datalist>
            </div>
          </div>

          {/* Elevator */}
          <MultiToggle
            label="Лифт"
            options={ELEVATOR_OPTIONS}
            value={elevator}
            onChange={(v) => setElevator(v as string)}
          />

          {/* Yard */}
          <MultiToggle
            label="Двор"
            options={YARD_OPTIONS}
            value={yardFeatures}
            onChange={(v) => setYardFeatures(v as string[])}
            multi
          />

          {/* Parking */}
          <MultiToggle
            label="Парковка"
            options={PARKING_OPTIONS}
            value={parking}
            onChange={(v) => setParking(v as string[])}
            multi
          />
        </div>

        {/* Characteristics — only when editing */}
        {editingComplexId && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <FieldLabel>Характеристики</FieldLabel>
              <button
                type="button"
                onClick={addChar}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Plus size={12} /> Добавить
              </button>
            </div>
            <div className="space-y-2">
              {charEntries.map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <input
                    defaultValue={key}
                    onBlur={(e) => updateChar(key, e.target.value, value)}
                    className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Название"
                  />
                  <span className="text-slate-300">:</span>
                  <input
                    defaultValue={value}
                    onBlur={(e) => updateChar(key, key, e.target.value)}
                    className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Значение"
                  />
                  <button type="button" onClick={() => removeChar(key)} className="text-red-400 hover:text-red-600">
                    <X size={14} />
                  </button>
                </div>
              ))}
              {charEntries.length === 0 && (
                <p className="text-xs text-slate-400">Нет характеристик. Нажмите «Добавить».</p>
              )}
            </div>
          </div>
        )}

        {/* Developer phones — only when editing */}
        {editingComplexId && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <FieldLabel>Телефоны застройщика</FieldLabel>
              <button
                type="button"
                onClick={() => updateArray('developer_phones', [...devPhones, ''])}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Plus size={12} /> Добавить
              </button>
            </div>
            <div className="space-y-2">
              {devPhones.map((phone, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    defaultValue={phone}
                    onBlur={(e) => {
                      const arr = [...devPhones]
                      arr[i] = e.target.value
                      updateArray('developer_phones', arr)
                    }}
                    className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+7 900 000-00-00"
                  />
                  <button
                    type="button"
                    onClick={() => updateArray('developer_phones', devPhones.filter((_, j) => j !== i))}
                    className="text-red-400 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Managers — only when editing */}
        {editingComplexId && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <FieldLabel>Менеджеры</FieldLabel>
              <button
                type="button"
                onClick={() => {
                  updateArray('manager_names', [...mgNames, ''])
                  updateArray('manager_phones', [...mgPhones, ''])
                }}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Plus size={12} /> Добавить
              </button>
            </div>
            <div className="space-y-2">
              {mgNames.map((mgName, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="flex-1 min-w-0 grid grid-cols-1 gap-1.5">
                    <input
                      defaultValue={mgName}
                      onBlur={(e) => {
                        const arr = [...mgNames]; arr[i] = e.target.value
                        updateArray('manager_names', arr)
                      }}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Имя менеджера"
                    />
                    <input
                      defaultValue={mgPhones[i] ?? ''}
                      onBlur={(e) => {
                        const arr = [...mgPhones]; arr[i] = e.target.value
                        updateArray('manager_phones', arr)
                      }}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+7 900 000-00-00"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      updateArray('manager_names', mgNames.filter((_, j) => j !== i))
                      updateArray('manager_phones', mgPhones.filter((_, j) => j !== i))
                    }}
                    className="mt-1 text-red-400 hover:text-red-600 shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Photos — only when editing */}
        {editingComplexId && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <FieldLabel>Фотографии</FieldLabel>
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Upload size={12} /> Загрузить
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>
            {editingComplex?.photos && editingComplex.photos.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {editingComplex.photos.map((url) => (
                  <div key={url} className="relative w-20 h-20 rounded-lg overflow-hidden group/photo">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => deletePhoto.mutate({ complexId: editingComplexId!, url })}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover/photo:opacity-100 flex items-center justify-center transition-opacity"
                    >
                      <Trash2 size={16} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">Нет фотографий</p>
            )}
          </div>
        )}

        {/* Documents — only when editing */}
        {editingComplexId && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <FieldLabel>Документы</FieldLabel>
              <div className="flex gap-2 flex-wrap">
                {(['permit', 'developer', 'other'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      if (docInputRef.current) {
                        docInputRef.current.dataset.doctype = type
                        docInputRef.current.click()
                      }
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    + {DOC_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
              <input
                ref={docInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.png"
                className="hidden"
                onChange={handleDocUpload}
              />
            </div>
            <div className="space-y-2">
              {(editingComplex?.documents ?? []).map((doc) => (
                <div key={doc.url} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-medium text-slate-500 shrink-0 bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[10px]">
                      {DOC_TYPE_LABELS[doc.type]}
                    </span>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline truncate"
                    >
                      {doc.name}
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteDoc.mutate({ complexId: editingComplexId!, url: doc.url })}
                    className="text-red-400 hover:text-red-600 shrink-0 ml-2"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              {(editingComplex?.documents ?? []).length === 0 && (
                <p className="text-xs text-slate-400">Нет документов</p>
              )}
            </div>
          </div>
        )}

        {/* Layouts — only when editing */}
        {editingComplexId && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <FieldLabel>Планировки</FieldLabel>
              <button
                type="button"
                onClick={() => layoutInputRef.current?.click()}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                disabled={uploadLayout.isPending}
              >
                {uploadLayout.isPending ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />}
                Добавить
              </button>
              <input
                ref={layoutInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLayoutUpload}
              />
            </div>
            {(editingComplex?.layouts ?? []).length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {(editingComplex?.layouts ?? []).map((url) => (
                  <div key={url} className="relative group/layout aspect-video rounded-lg overflow-hidden bg-slate-100">
                    <img src={url} alt="Планировка" className="w-full h-full object-contain" />
                    <button
                      type="button"
                      onClick={() => deleteLayout.mutate({ complexId: editingComplexId!, url })}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover/layout:opacity-100 flex items-center justify-center transition-opacity"
                    >
                      <Trash2 size={16} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">Нет планировок</p>
            )}
          </div>
        )}

        {/* Developer Units — only when editing */}
        {editingComplexId && <DeveloperUnitsSection complexId={editingComplexId} />}

        {!editingComplexId && (
          <p className="text-xs text-slate-400 bg-blue-50 rounded-lg p-3">
            После сохранения можно добавить фото, планировки, документы, характеристики и контакты.
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex gap-3 px-6 py-4 border-t border-slate-100 shrink-0">
        <button
          type="button"
          onClick={closeForm}
          disabled={isLoading}
          className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          Отмена
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 py-2.5 rounded-xl bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
        >
          {isLoading && <Loader2 size={15} className="animate-spin" />}
          {editingComplexId ? 'Сохранить' : 'Создать ЖК'}
        </button>
      </div>
    </form>
  )
}

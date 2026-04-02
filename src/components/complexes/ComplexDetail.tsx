import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2, CalendarDays, ClipboardList, FileText, MapPin, Phone, User, X,
  Pencil, Trash2, ChevronRight, ChevronLeft, Download, Plus, Loader2, ZoomIn, Share2,
} from 'lucide-react'
import LinkedTasksSection from '@/components/tasks/LinkedTasksSection'
import { useComplex, useComplexUnits, useCreateComplexUnit, useUpdateComplexUnit, useDeleteComplexUnit, useDeleteComplex, useUploadComplexDocument, useDeleteComplexDocument, useUploadComplexLayout, useDeleteComplexLayout, useDeleteComplexPhoto, useReorderComplexPhotos, useReorderComplexLayouts } from '@/hooks/useComplexes'
import { useComplexStore } from '@/store/useComplexStore'
import { useAgentSettings } from '@/hooks/useAgentSettings'
import { formatPriceShort } from '@/utils/format'
import { PROPERTY_TYPE_LABELS, PROPERTY_STATUS_COLORS, PROPERTY_STATUS_LABELS } from '@/types'
import toast from 'react-hot-toast'
import PropertyTypeIcon from '@/components/properties/PropertyTypeIcon'
import ComplexPdfButton from '@/components/pdf/ComplexPdfButton'

interface ComplexDetailProps {
  complexId: string
  onClose: () => void
}

const DOC_TYPE_LABELS = {
  permit: 'Разрешение на строительство',
  developer: 'Документы застройщика',
  other: 'Документ',
}

const EMPTY_UNIT_FORM = { title: '', rooms: '', area: '', floor: '', total_floors: '', price: '', notes: '' }

function UnitForm({
  initial,
  onSave,
  onCancel,
  isPending,
  accent = 'blue',
}: {
  initial?: typeof EMPTY_UNIT_FORM
  onSave: (f: typeof EMPTY_UNIT_FORM) => void
  onCancel: () => void
  isPending: boolean
  accent?: 'blue' | 'amber'
}) {
  const [form, setForm] = useState(initial ?? EMPTY_UNIT_FORM)
  const inp = 'w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500'
  const bg = accent === 'amber' ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100'
  return (
    <div className={`p-3 rounded-xl border space-y-2 ${bg}`}>
      <input className={inp} placeholder="Название (2-комн. кв., студия...)" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} />
      <div className="grid grid-cols-2 gap-2">
        <input className={inp} type="number" placeholder="Комнат" value={form.rooms} onChange={(e) => setForm(f => ({ ...f, rooms: e.target.value }))} />
        <input className={inp} type="number" placeholder="Площадь м²" value={form.area} onChange={(e) => setForm(f => ({ ...f, area: e.target.value }))} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input className={inp} type="number" placeholder="Этаж" value={form.floor} onChange={(e) => setForm(f => ({ ...f, floor: e.target.value }))} />
        <input className={inp} type="number" placeholder="Всего этажей" value={form.total_floors} onChange={(e) => setForm(f => ({ ...f, total_floors: e.target.value }))} />
      </div>
      <input className={inp} type="number" placeholder="Цена (наличный) ₽" value={form.price} onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))} />
      <input className={inp} placeholder="Заметки" value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} />
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="flex-1 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50">Отмена</button>
        <button type="button" onClick={() => onSave(form)} disabled={isPending} className="flex-1 py-1.5 rounded-lg bg-blue-600 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-1">
          {isPending && <Loader2 size={11} className="animate-spin" />}
          Сохранить
        </button>
      </div>
    </div>
  )
}

function DeveloperUnitsView({ complexId }: { complexId: string }) {
  const { data: units = [] } = useComplexUnits(complexId)
  const createUnit = useCreateComplexUnit()
  const updateUnit = useUpdateComplexUnit()
  const deleteUnit = useDeleteComplexUnit()
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleAdd = async (form: typeof EMPTY_UNIT_FORM) => {
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
      setShowAdd(false)
      toast.success('Объект добавлен')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    }
  }

  const handleEdit = async (id: string, form: typeof EMPTY_UNIT_FORM) => {
    try {
      await updateUnit.mutateAsync({
        id,
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
      setEditingId(null)
      toast.success('Объект обновлён')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить объект от застройщика?')) return
    try {
      await deleteUnit.mutateAsync({ id, complexId })
      toast.success('Удалено')
    } catch {
      toast.error('Ошибка при удалении')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Объекты от застройщика{units.length > 0 && ` (${units.length})`}
        </h3>
        <button
          type="button"
          onClick={() => setShowAdd((v) => !v)}
          className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg transition-colors"
        >
          <Plus size={12} />
          Добавить
        </button>
      </div>

      {showAdd && (
        <div className="mb-3">
          <UnitForm onSave={handleAdd} onCancel={() => setShowAdd(false)} isPending={createUnit.isPending} />
        </div>
      )}

      {units.length === 0 && !showAdd && (
        <p className="text-xs text-slate-400">Нет объектов от застройщика</p>
      )}

      <div className="space-y-2">
        {units.map((unit) => {
          const unitInitial: typeof EMPTY_UNIT_FORM = {
            title: unit.title ?? '',
            rooms: unit.rooms != null ? String(unit.rooms) : '',
            area: unit.area != null ? String(unit.area) : '',
            floor: unit.floor != null ? String(unit.floor) : '',
            total_floors: unit.total_floors != null ? String(unit.total_floors) : '',
            price: unit.price != null ? String(unit.price) : '',
            notes: unit.notes ?? '',
          }
          if (editingId === unit.id) {
            return (
              <UnitForm
                key={unit.id}
                initial={unitInitial}
                onSave={(f) => handleEdit(unit.id, f)}
                onCancel={() => setEditingId(null)}
                isPending={updateUnit.isPending}
                accent="amber"
              />
            )
          }
          return (
            <div key={unit.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800">
                  {unit.title || (unit.rooms ? `${unit.rooms}-комн. кв.` : 'Объект')}
                  {unit.area ? ` · ${unit.area} м²` : ''}
                  {unit.floor ? ` · ${unit.floor}${unit.total_floors ? `/${unit.total_floors}` : ''} эт.` : ''}
                </p>
                {unit.notes && <p className="text-xs text-slate-400 mt-0.5 truncate">{unit.notes}</p>}
              </div>
              <div className="flex items-center gap-2 ml-3 shrink-0">
                {unit.price != null && (
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Наличный</p>
                    <p className="text-sm font-bold text-emerald-600">{new Intl.NumberFormat('ru-RU').format(unit.price)} ₽</p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setEditingId(unit.id)}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Pencil size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(unit.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function ComplexDetail({ complexId, onClose }: ComplexDetailProps) {
  const { data: complex, isLoading } = useComplex(complexId)
  const { data: agentSettings } = useAgentSettings()
  const deleteComplex = useDeleteComplex()
  const uploadDoc = useUploadComplexDocument()
  const deleteDoc = useDeleteComplexDocument()
  const uploadLayout = useUploadComplexLayout()
  const deleteLayout = useDeleteComplexLayout()
  const deletePhoto = useDeleteComplexPhoto()
  const reorderPhotos = useReorderComplexPhotos()
  const reorderLayouts = useReorderComplexLayouts()
  const docInputRef = useRef<HTMLInputElement>(null)
  const layoutInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileUploadName, setFileUploadName] = useState('')
  const [fileUploadPending, setFileUploadPending] = useState<File | null>(null)
  const [editingPhotos, setEditingPhotos] = useState(false)
  const [editingLayouts, setEditingLayouts] = useState(false)
  const { openForm } = useComplexStore()
  const navigate = useNavigate()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [activePhotoIdx, setActivePhotoIdx] = useState(0)
  const [slideDir, setSlideDir] = useState<'left' | 'right' | null>(null)
  const [lightbox, setLightbox] = useState(false)
  const [layoutLbIdx, setLayoutLbIdx] = useState<number | null>(null)
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null)
  const [touchStartX, setTouchStartX] = useState(0)
  const [touchStartY, setTouchStartY] = useState(0)
  const [swipeDy, setSwipeDy] = useState(0)
  const [swipeDx, setSwipeDx] = useState(0)
  const [swipeAxis, setSwipeAxis] = useState<'x' | 'y' | null>(null)
  const [dismissing, setDismissing] = useState(false)
  const [layoutSlideDir, setLayoutSlideDir] = useState<'left' | 'right' | null>(null)
  const [layoutSwipeDy, setLayoutSwipeDy] = useState(0)
  const [layoutSwipeDx, setLayoutSwipeDx] = useState(0)
  const [layoutSwipeAxis, setLayoutSwipeAxis] = useState<'x' | 'y' | null>(null)
  const [layoutDismissing, setLayoutDismissing] = useState(false)
  const [layoutTouchStartX, setLayoutTouchStartX] = useState(0)
  const [layoutTouchStartY, setLayoutTouchStartY] = useState(0)
  const thumbStripRef = useState<HTMLDivElement | null>(null)

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !complexId) return
    const docType = (e.target.dataset.doctype as 'permit' | 'developer' | 'other') ?? 'other'
    const docName = file.name.replace(/\.[^.]+$/, '')
    try {
      await uploadDoc.mutateAsync({ complexId, file, docName, docType })
      toast.success('Документ прикреплён')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка загрузки')
    }
    e.target.value = ''
  }

  // Free file upload: user picks file first, then enters name, then confirms
  const handleFreeFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileUploadPending(file)
    setFileUploadName(file.name.replace(/\.[^.]+$/, ''))
    e.target.value = ''
  }

  const handleFreeFileConfirm = async () => {
    if (!fileUploadPending || !complexId) return
    const name = fileUploadName.trim() || fileUploadPending.name.replace(/\.[^.]+$/, '')
    try {
      await uploadDoc.mutateAsync({ complexId, file: fileUploadPending, docName: name, docType: 'other' })
      toast.success('Файл прикреплён')
      setFileUploadPending(null)
      setFileUploadName('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка загрузки')
    }
  }

  const handleLayoutUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !complexId) return
    try {
      await uploadLayout.mutateAsync({ complexId, file })
      toast.success('Планировка добавлена')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка загрузки')
    }
    e.target.value = ''
  }

  const goToPhoto = (i: number, dir: 'left' | 'right') => {
    setSlideDir(dir)
    setActivePhotoIdx(i)
    const el = thumbStripRef[0]
    if (el) {
      const thumb = el.children[i] as HTMLElement
      if (thumb) thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }

  const handlePhotoTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX)
    setTouchStartY(e.touches[0].clientY)
  }
  const handlePhotoTouchEnd = (e: React.TouchEvent, i: number) => {
    const dx = Math.abs(e.changedTouches[0].clientX - touchStartX)
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY)
    if (dx < 8 && dy < 8) {
      setSlideDir(null)
      setActivePhotoIdx(i)
      setLightbox(true)
    }
  }

  const handleLbTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX)
    setTouchStartY(e.touches[0].clientY)
    setSwipeAxis(null)
  }
  const handleLbTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX
    const dy = e.touches[0].clientY - touchStartY
    const adx = Math.abs(dx), ady = Math.abs(dy)
    const axis = swipeAxis ?? (adx > 8 || ady > 8 ? (ady > adx ? 'y' : 'x') : null)
    if (axis && !swipeAxis) setSwipeAxis(axis)
    if (axis === 'y') setSwipeDy(dy * 0.55)
    if (axis === 'x') setSwipeDx(dx * 0.25)
  }
  const handleLbTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX
    const dy = e.changedTouches[0].clientY - touchStartY
    const adx = Math.abs(dx), ady = Math.abs(dy)
    setSwipeDx(0)
    if (ady > 60 && ady > adx) {
      setDismissing(true)
      setSwipeDy(dy > 0 ? 400 : -400)
      setTimeout(() => { setLightbox(false); setSwipeDy(0); setDismissing(false) }, 220)
    } else {
      setSwipeDy(0)
      if (adx > 50 && adx > ady && complex && complex.photos.length > 1) {
        if (dx < 0) goToPhoto((activePhotoIdx + 1) % complex.photos.length, 'left')
        else goToPhoto((activePhotoIdx - 1 + complex.photos.length) % complex.photos.length, 'right')
      }
    }
    setSwipeAxis(null)
  }

  const handleLayoutLbTouchStart = (e: React.TouchEvent) => {
    setLayoutTouchStartX(e.touches[0].clientX)
    setLayoutTouchStartY(e.touches[0].clientY)
    setLayoutSwipeAxis(null)
  }
  const handleLayoutLbTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - layoutTouchStartX
    const dy = e.touches[0].clientY - layoutTouchStartY
    const adx = Math.abs(dx), ady = Math.abs(dy)
    const axis = layoutSwipeAxis ?? (adx > 8 || ady > 8 ? (ady > adx ? 'y' : 'x') : null)
    if (axis && !layoutSwipeAxis) setLayoutSwipeAxis(axis)
    if (axis === 'y') setLayoutSwipeDy(dy * 0.55)
    if (axis === 'x') setLayoutSwipeDx(dx * 0.25)
  }
  const handleLayoutLbTouchEnd = (e: React.TouchEvent, images: string[]) => {
    const dx = e.changedTouches[0].clientX - layoutTouchStartX
    const dy = e.changedTouches[0].clientY - layoutTouchStartY
    const adx = Math.abs(dx), ady = Math.abs(dy)
    setLayoutSwipeDx(0)
    if (ady > 60 && ady > adx) {
      setLayoutDismissing(true)
      setLayoutSwipeDy(dy > 0 ? 400 : -400)
      setTimeout(() => { setLayoutLbIdx(null); setLayoutSwipeDy(0); setLayoutDismissing(false) }, 220)
    } else {
      setLayoutSwipeDy(0)
      if (adx > 50 && adx > ady && images.length > 1) {
        if (dx < 0) setLayoutLbIdx(i => i !== null ? (i + 1) % images.length : 0)
        else setLayoutLbIdx(i => i !== null ? (i - 1 + images.length) % images.length : 0)
      }
    }
    setLayoutSwipeAxis(null)
  }

  const movePhoto = (idx: number, dir: -1 | 1) => {
    if (!complex) return
    const photos = [...complex.photos]
    const to = idx + dir
    if (to < 0 || to >= photos.length) return
    ;[photos[idx], photos[to]] = [photos[to], photos[idx]]
    reorderPhotos.mutate({ complexId, photos })
    setActivePhotoIdx(to)
  }

  const moveLayout = (url: string, dir: -1 | 1) => {
    if (!complex) return
    const layouts = [...complex.layouts]
    const idx = layouts.indexOf(url)
    const to = idx + dir
    if (to < 0 || to >= layouts.length) return
    ;[layouts[idx], layouts[to]] = [layouts[to], layouts[idx]]
    reorderLayouts.mutate({ complexId, layouts })
  }

  const handleEdit = () => {
    onClose()
    setTimeout(() => openForm(complexId), 150)
  }

  const handleDelete = async () => {
    try {
      await deleteComplex.mutateAsync(complexId)
      toast.success('ЖК удалён')
      onClose()
    } catch {
      toast.error('Ошибка при удалении')
    }
  }

  const handlePropertyClick = (propertyId: string) => {
    onClose()
    setTimeout(() => navigate(`/properties?open=${propertyId}`), 150)
  }

  if (isLoading || !complex) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  const properties = (complex as unknown as { properties?: typeof complex & { properties: [] } }).properties
    ? (complex as unknown as { properties: Record<string, unknown>[] }).properties
    : []

  const charEntries = Object.entries(complex.characteristics ?? {})

  return (
    <div className="flex flex-col max-h-[85vh]">
      {/* Header */}
      <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
            <Building2 size={20} className="text-blue-600" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900 truncate">{complex.name}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {complex.developer && (
                <span className="text-xs text-slate-500">{complex.developer}</span>
              )}
              {complex.completion_date && (
                <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                  <CalendarDays size={11} />
                  Сдача: {complex.completion_date}
                </span>
              )}
              {(properties as unknown[]).length > 0 && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  {(properties as unknown[]).length} объект{
                    (properties as unknown[]).length === 1 ? '' :
                    (properties as unknown[]).length < 5 ? 'а' : 'ов'
                  }
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-2">
          <ComplexPdfButton complex={complex} properties={properties as never} agentSettings={agentSettings ?? {}} />
          <button
            onClick={() => {
              const url = `${window.location.origin}/c/${complexId}`
              navigator.clipboard.writeText(url)
              toast.success('Ссылка на презентацию скопирована')
            }}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Скопировать ссылку на презентацию"
          >
            <Share2 size={16} />
          </button>
          <button
            onClick={handleEdit}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Редактировать"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Удалить"
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors ml-1"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* District / Address badges */}
      {(complex.district || complex.address) && (
        <div className="mx-6 mb-0 flex flex-wrap gap-2 pt-3">
          {complex.district && (
            <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600">
              📍 {complex.district}
            </span>
          )}
          {complex.address && (
            <span className="inline-flex items-center text-xs text-slate-500 gap-1">
              <MapPin size={12} />
              {complex.address}
            </span>
          )}
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="mx-6 mt-4 p-4 bg-red-50 rounded-xl border border-red-100">
          <p className="text-sm font-medium text-red-700 mb-3">Удалить этот ЖК?</p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex-1 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Отмена
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteComplex.isPending}
              className="flex-1 py-1.5 rounded-lg bg-red-600 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
              Удалить
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Photos gallery */}
        {complex.photos.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Фотографии ({complex.photos.length})
              </span>
              <button
                type="button"
                onClick={() => setEditingPhotos(v => !v)}
                className={`text-xs px-2 py-1 rounded-lg transition-colors font-medium ${editingPhotos ? 'bg-blue-600 text-white' : 'text-blue-600 bg-blue-50 hover:bg-blue-100'}`}
              >
                {editingPhotos ? 'Готово' : 'Редактировать'}
              </button>
            </div>
            {editingPhotos ? (
              /* Edit mode — grid with delete + reorder */
              <div className="grid grid-cols-3 gap-2">
                {complex.photos.map((url, i) => (
                  <div key={url} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 group/p">
                    <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1.5 opacity-0 group-hover/p:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => deletePhoto.mutate({ complexId, url })}
                        className="p-1.5 rounded-full bg-red-500/90 text-white hover:bg-red-600 transition-colors"
                        title="Удалить"
                      >
                        <Trash2 size={13} />
                      </button>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => movePhoto(i, -1)}
                          disabled={i === 0}
                          className="p-1 rounded bg-white/25 text-white hover:bg-white/40 disabled:opacity-30 transition-colors"
                          title="Влево"
                        >
                          <ChevronLeft size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => movePhoto(i, 1)}
                          disabled={i === complex.photos.length - 1}
                          className="p-1 rounded bg-white/25 text-white hover:bg-white/40 disabled:opacity-30 transition-colors"
                          title="Вправо"
                        >
                          <ChevronRight size={12} />
                        </button>
                      </div>
                    </div>
                    <div className="absolute top-1 left-1 text-[10px] bg-black/50 text-white px-1 rounded pointer-events-none">{i + 1}</div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* Main scrollable gallery */}
                <div
                  className="flex overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-hide"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', scrollBehavior: 'smooth' }}
                >
                  {complex.photos.map((url, i) => (
                    <div
                      key={url}
                      className="relative w-full shrink-0 snap-center group"
                      style={{ minWidth: '100%' }}
                    >
                      <img
                        src={url}
                        alt={`${complex.name} ${i + 1}`}
                        onClick={() => { setSlideDir(null); setActivePhotoIdx(i); setLightbox(true) }}
                        onTouchStart={handlePhotoTouchStart}
                        onTouchEnd={(e) => handlePhotoTouchEnd(e, i)}
                        className={`w-full h-48 rounded-xl object-cover cursor-zoom-in transition-all ${activePhotoIdx === i ? 'ring-2 ring-blue-500' : ''}`}
                        style={{ touchAction: 'pan-x' }}
                        loading="lazy"
                      />
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full pointer-events-none">
                        <ZoomIn size={10} />
                        {i + 1}/{complex.photos.length}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Thumbnail strip */}
                {complex.photos.length > 1 && (
                  <div
                    ref={(el) => { thumbStripRef[1](el) }}
                    className="flex gap-2 overflow-x-auto pb-1 mt-2"
                    style={{ scrollbarWidth: 'thin', scrollBehavior: 'smooth' }}
                  >
                    {complex.photos.map((url, i) => (
                      <button
                        key={url}
                        onClick={() => goToPhoto(i, i > activePhotoIdx ? 'left' : 'right')}
                        className={`w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all duration-200 ${
                          activePhotoIdx === i ? 'border-blue-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100 hover:border-slate-300'
                        }`}
                      >
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Lightbox */}
        {lightbox && complex.photos.length > 0 && (() => {
          const animClass = slideDir === 'left' ? 'lb-photo-from-right'
            : slideDir === 'right' ? 'lb-photo-from-left'
            : 'lb-photo-in'
          const isTracking = swipeDy !== 0 || swipeDx !== 0
          const dragProgress = Math.min(Math.abs(swipeDy) / 260, 1)
          const overlayOpacity = dismissing ? 0 : Math.max(0, 1 - dragProgress * 0.85)
          return (
          <div
            className="fixed inset-0 z-[10100] flex items-center justify-center lb-overlay-in"
            style={{ backgroundColor: `rgba(0,0,0,${0.95 * overlayOpacity})` }}
            onClick={() => { if (!isTracking) setLightbox(false) }}
            onTouchStart={handleLbTouchStart}
            onTouchMove={handleLbTouchMove}
            onTouchEnd={handleLbTouchEnd}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setLightbox(false) }}
              style={{ opacity: overlayOpacity, transition: 'opacity 0.2s' }}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <X size={20} />
            </button>
            {complex.photos.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); goToPhoto((activePhotoIdx - 1 + complex.photos.length) % complex.photos.length, 'right') }}
                  style={{ opacity: overlayOpacity, transition: 'opacity 0.2s' }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); goToPhoto((activePhotoIdx + 1) % complex.photos.length, 'left') }}
                  style={{ opacity: overlayOpacity, transition: 'opacity 0.2s' }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
            <img
              key={activePhotoIdx}
              src={complex.photos[activePhotoIdx]}
              alt=""
              className={`max-w-[90vw] max-h-[90vh] object-contain rounded-2xl ${isTracking ? '' : animClass}`}
              onClick={(e) => e.stopPropagation()}
              style={{
                touchAction: 'none',
                transform: `translateY(${swipeDy}px) translateX(${swipeDx}px) scale(${1 - dragProgress * 0.08})`,
                transition: isTracking ? 'none' : dismissing ? 'transform 0.22s cubic-bezier(0.4,0,1,1), opacity 0.22s' : 'transform 0.38s cubic-bezier(0.34,1.56,0.64,1)',
                opacity: Math.max(0, 1 - dragProgress * 0.6),
              }}
            />
            {complex.photos.length > 1 && (
              <div
                className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5"
                style={{ opacity: overlayOpacity, transition: 'opacity 0.2s' }}
              >
                {complex.photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); goToPhoto(i, i > activePhotoIdx ? 'left' : 'right') }}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === activePhotoIdx ? 'bg-white scale-110' : 'bg-white/40'}`}
                  />
                ))}
              </div>
            )}
            <div
              className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm"
              style={{ opacity: overlayOpacity, transition: 'opacity 0.2s' }}
            >
              {activePhotoIdx + 1} / {complex.photos.length}
            </div>
          </div>
          )
        })()}

        {/* Structural building characteristics */}
        {(complex.floors_total || complex.building_type || complex.elevator ||
          (complex.yard_features?.length ?? 0) > 0 || (complex.parking?.length ?? 0) > 0) && (
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Характеристики здания
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {complex.floors_total && (
                <div className="bg-slate-50 rounded-lg p-2.5">
                  <p className="text-xs text-slate-400 mb-0.5">Этажность</p>
                  <p className="text-sm font-medium text-slate-800">{complex.floors_total}</p>
                </div>
              )}
              {complex.building_type && (
                <div className="bg-slate-50 rounded-lg p-2.5">
                  <p className="text-xs text-slate-400 mb-0.5">Тип дома</p>
                  <p className="text-sm font-medium text-slate-800">{complex.building_type}</p>
                </div>
              )}
              {complex.elevator && (
                <div className="bg-slate-50 rounded-lg p-2.5">
                  <p className="text-xs text-slate-400 mb-0.5">Лифт</p>
                  <p className="text-sm font-medium text-slate-800">{complex.elevator}</p>
                </div>
              )}
              {(complex.yard_features?.length ?? 0) > 0 && (
                <div className="bg-slate-50 rounded-lg p-2.5 col-span-2">
                  <p className="text-xs text-slate-400 mb-1.5">Двор</p>
                  <div className="flex flex-wrap gap-1.5">
                    {complex.yard_features!.map((f) => (
                      <span key={f} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{f}</span>
                    ))}
                  </div>
                </div>
              )}
              {(complex.parking?.length ?? 0) > 0 && (
                <div className="bg-slate-50 rounded-lg p-2.5 col-span-2">
                  <p className="text-xs text-slate-400 mb-1.5">Парковка</p>
                  <div className="flex flex-wrap gap-1.5">
                    {complex.parking!.map((p) => (
                      <span key={p} className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full text-xs font-medium">{p}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Free-form characteristics */}
        {charEntries.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Дополнительно
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {charEntries.map(([key, value]) => (
                <div key={key} className="bg-slate-50 rounded-lg p-2.5">
                  <p className="text-xs text-slate-400 mb-0.5">{key}</p>
                  <p className="text-sm font-medium text-slate-800">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pricing / Deal conditions */}
        {complex.pricing && Object.values(complex.pricing).some((e) => e?.price_per_sqm) && (
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Условия сделки (цена за м²)
            </h3>
            <div className="space-y-2">
              {[
                { key: 'cash', label: 'Наличный расчёт', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
                { key: 'installment_6m', label: 'Рассрочка 6 мес', color: 'bg-blue-50 text-blue-700 border-blue-100' },
                { key: 'installment_12m', label: 'Рассрочка 1 год', color: 'bg-blue-50 text-blue-700 border-blue-100' },
                { key: 'installment_18m', label: 'Рассрочка 18 мес', color: 'bg-blue-50 text-blue-700 border-blue-100' },
                { key: 'installment_24m', label: 'Рассрочка 2 года', color: 'bg-blue-50 text-blue-700 border-blue-100' },
                { key: 'installment_36m', label: 'Рассрочка 3 года', color: 'bg-blue-50 text-blue-700 border-blue-100' },
                { key: 'installment_48m', label: 'Рассрочка 4 года', color: 'bg-blue-50 text-blue-700 border-blue-100' },
                { key: 'installment_60m', label: 'Рассрочка 5 лет', color: 'bg-blue-50 text-blue-700 border-blue-100' },
                { key: 'family_mortgage', label: 'Семейная ипотека 6%', color: 'bg-violet-50 text-violet-700 border-violet-100' },
                { key: 'escrow', label: 'Эскроу счета', color: 'bg-amber-50 text-amber-700 border-amber-100' },
              ].map(({ key, label, color }) => {
                const entry = (complex.pricing as Record<string, { price_per_sqm?: number; updated_at?: string }>)?.[key]
                if (!entry?.price_per_sqm) return null
                return (
                  <div key={key} className={`flex items-center justify-between p-2.5 rounded-xl border ${color}`}>
                    <span className="text-xs font-medium">{label}</span>
                    <div className="text-right">
                      <p className="text-sm font-bold">{new Intl.NumberFormat('ru-RU').format(entry.price_per_sqm)} ₽/м²</p>
                      {entry.updated_at && (
                        <p className="text-[10px] opacity-60">с {new Date(entry.updated_at).toLocaleDateString('ru-RU')}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Description */}
        {complex.description && (
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Описание</h3>
            <p className="text-sm text-slate-700 leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>
              {complex.description}
            </p>
          </div>
        )}

        {/* Contacts */}
        {(complex.developer_phones.length > 0 || complex.manager_names.length > 0) && (
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Контакты
            </h3>
            <div className="space-y-2">
              {complex.developer_phones.map((phone, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg">
                  <Phone size={14} className="text-slate-400 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">Телефон застройщика</p>
                    <p className="text-sm font-medium text-slate-800">{phone}</p>
                  </div>
                </div>
              ))}
              {complex.manager_names.map((name, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg">
                  <User size={14} className="text-slate-400 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-slate-400">Менеджер</p>
                    <p className="text-sm font-medium text-slate-800">{name}</p>
                  </div>
                  {complex.manager_phones[i] && (
                    <p className="text-xs text-slate-500 font-mono">{complex.manager_phones[i]}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Layouts */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Планировки{complex.layouts.length > 0 && ` (${complex.layouts.length})`}
            </h3>
            <div className="flex items-center gap-2">
              {complex.layouts.length > 0 && (
                <button
                  type="button"
                  onClick={() => setEditingLayouts(v => !v)}
                  className={`text-xs px-2 py-1 rounded-lg transition-colors font-medium ${editingLayouts ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                  {editingLayouts ? 'Готово' : 'Изменить'}
                </button>
              )}
              <button
                type="button"
                onClick={() => layoutInputRef.current?.click()}
                disabled={uploadLayout.isPending}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
              >
                {uploadLayout.isPending ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />}
                Добавить
              </button>
            </div>
            <input ref={layoutInputRef} type="file" accept="*" className="hidden" onChange={handleLayoutUpload} />
          </div>
          {complex.layouts.length === 0 && (
            <p className="text-xs text-slate-400">Нет планировок</p>
          )}
          {complex.layouts.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {complex.layouts.map((url, idx) => {
                const isPdf = /\.pdf(\?|$)/i.test(url) || url.includes('/complex-docs/')
                return (
                  <div key={url} className="relative group/layout aspect-video rounded-lg overflow-hidden bg-slate-100">
                    {isPdf ? (
                      <button
                        type="button"
                        onClick={() => !editingLayouts && setPdfViewerUrl(url)}
                        className="w-full h-full flex flex-col items-center justify-center gap-1 hover:bg-slate-200 transition-colors"
                      >
                        <FileText size={28} className="text-red-400" />
                        <span className="text-[10px] text-slate-500 uppercase tracking-wide font-medium">PDF</span>
                        <span className="text-[9px] text-slate-400">{editingLayouts ? '' : 'Открыть'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (editingLayouts) return
                          const imgOnlyUrls = complex.layouts.filter(u => !/\.pdf(\?|$)/i.test(u) && !u.includes('/complex-docs/'))
                          setLayoutLbIdx(imgOnlyUrls.indexOf(url))
                        }}
                        className="w-full h-full block"
                      >
                        <img src={url} alt="Планировка" className="w-full h-full object-contain" />
                        {!editingLayouts && (
                          <div className="absolute inset-0 bg-black/0 group-hover/layout:bg-black/20 transition-colors flex items-center justify-center">
                            <ZoomIn size={20} className="text-white opacity-0 group-hover/layout:opacity-100 transition-opacity drop-shadow" />
                          </div>
                        )}
                      </button>
                    )}
                    {editingLayouts && (
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => deleteLayout.mutate({ complexId, url })}
                          className="p-1.5 rounded-full bg-red-500/90 text-white hover:bg-red-600 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                        <div className="flex gap-1">
                          <button type="button" onClick={() => moveLayout(url, -1)} disabled={idx === 0}
                            className="p-1 rounded bg-white/25 text-white hover:bg-white/40 disabled:opacity-30">
                            <ChevronLeft size={12} />
                          </button>
                          <button type="button" onClick={() => moveLayout(url, 1)} disabled={idx === complex.layouts.length - 1}
                            className="p-1 rounded bg-white/25 text-white hover:bg-white/40 disabled:opacity-30">
                            <ChevronRight size={12} />
                          </button>
                        </div>
                      </div>
                    )}
                    {!editingLayouts && (
                      <button
                        type="button"
                        onClick={() => deleteLayout.mutate({ complexId, url })}
                        className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 p-1 rounded opacity-0 group-hover/layout:opacity-100 transition-opacity z-10"
                      >
                        <Trash2 size={12} className="text-white" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Layout lightbox */}
        {layoutLbIdx !== null && (() => {
          const images = complex.layouts.filter(u => !u.toLowerCase().includes('.pdf'))
          return (
            <div
              className="fixed inset-0 z-50 bg-black flex flex-col"
              style={{ opacity: layoutDismissing ? 0.6 : 1, transition: layoutDismissing ? 'opacity 0.22s' : undefined }}
              onClick={() => setLayoutLbIdx(null)}
            >
              <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
                <span className="text-white/40 text-xs tracking-widest uppercase">{layoutLbIdx + 1} / {images.length}</span>
                <button className="p-2 text-white/60 hover:text-white" onClick={() => setLayoutLbIdx(null)}><X size={20} /></button>
              </div>
              <div
                className="flex-1 relative flex items-center justify-center overflow-hidden select-none"
                onClick={e => e.stopPropagation()}
                onTouchStart={handleLayoutLbTouchStart}
                onTouchMove={handleLayoutLbTouchMove}
                onTouchEnd={e => handleLayoutLbTouchEnd(e, images)}
              >
                <div
                  style={{
                    transform: `translateY(${layoutSwipeDy}px) translateX(${layoutSwipeDx}px)`,
                    transition: layoutDismissing ? 'transform 0.22s ease' : layoutSwipeDx === 0 ? 'transform 0.18s ease' : undefined,
                    width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <img
                    src={images[layoutLbIdx]}
                    alt="Планировка"
                    className={`max-h-full max-w-full object-contain select-none ${layoutSlideDir === 'left' ? 'animate-slide-left' : layoutSlideDir === 'right' ? 'animate-slide-right' : ''}`}
                    draggable={false}
                    onLoad={() => setLayoutSlideDir(null)}
                  />
                </div>
                {images.length > 1 && (
                  <>
                    <button
                      onClick={e => { e.stopPropagation(); setLayoutSlideDir('right'); setLayoutLbIdx(i => i !== null ? (i - 1 + images.length) % images.length : 0) }}
                      className="absolute left-3 p-2.5 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
                    ><ChevronLeft size={20} /></button>
                    <button
                      onClick={e => { e.stopPropagation(); setLayoutSlideDir('left'); setLayoutLbIdx(i => i !== null ? (i + 1) % images.length : 0) }}
                      className="absolute right-3 p-2.5 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
                    ><ChevronRight size={20} /></button>
                  </>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 px-5 py-4 overflow-x-auto shrink-0 justify-center">
                  {images.map((url, i) => (
                    <button
                      key={i}
                      onClick={e => { e.stopPropagation(); setLayoutSlideDir(i > layoutLbIdx ? 'left' : 'right'); setLayoutLbIdx(i) }}
                      className={`shrink-0 w-14 h-14 rounded overflow-hidden border transition-all ${i === layoutLbIdx ? 'border-white' : 'border-transparent opacity-40 hover:opacity-70'}`}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })()}

        {/* Pricing conditions */}
        {complex.pricing_conditions && complex.pricing_conditions.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Условия сделки
            </h3>
            <div className="space-y-2">
              {complex.pricing_conditions.map((cond) => {
                const typeColors: Record<string, string> = {
                  cash: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                  installment: 'bg-blue-50 text-blue-700 border-blue-100',
                  mortgage: 'bg-purple-50 text-purple-700 border-purple-100',
                  escrow: 'bg-amber-50 text-amber-700 border-amber-100',
                  other: 'bg-slate-50 text-slate-700 border-slate-100',
                }
                const typeLabels: Record<string, string> = {
                  cash: 'Наличный', installment: 'Рассрочка', mortgage: 'Ипотека', escrow: 'Эскроу', other: 'Другое',
                }
                return (
                  <div key={cond.id} className={`p-3 rounded-xl border ${typeColors[cond.payment_type] ?? typeColors.other}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{cond.label || typeLabels[cond.payment_type]}</p>
                        {cond.notes && <p className="text-[11px] opacity-70 mt-0.5 truncate">{cond.notes}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        {cond.price_per_sqm && (
                          <p className="text-sm font-bold">{new Intl.NumberFormat('ru-RU').format(cond.price_per_sqm)} ₽/м²</p>
                        )}
                        {cond.updated_at && <p className="text-[10px] opacity-50 mt-0.5">{cond.updated_at}</p>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Documents */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Документы
            </h3>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg transition-colors"
            >
              <Plus size={10} />
              Загрузить файл
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="*"
              className="hidden"
              onChange={handleFreeFilePick}
            />
          </div>
          {fileUploadPending && (
            <div className="mb-3 flex items-center gap-2 p-2.5 bg-blue-50 border border-blue-100 rounded-xl">
              <FileText size={14} className="text-blue-400 shrink-0" />
              <input
                type="text"
                value={fileUploadName}
                onChange={(e) => setFileUploadName(e.target.value)}
                placeholder="Название файла"
                className="flex-1 min-w-0 text-sm bg-transparent outline-none text-slate-800 placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={handleFreeFileConfirm}
                disabled={uploadDoc.isPending}
                className="shrink-0 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
              >
                Прикрепить
              </button>
              <button
                type="button"
                onClick={() => { setFileUploadPending(null); setFileUploadName('') }}
                className="shrink-0 p-1 text-slate-400 hover:text-red-500 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {complex.documents.length === 0 && (
            <p className="text-xs text-slate-400">Нет документов</p>
          )}
          <div className="space-y-2">
            {complex.documents.map((doc) => {
              const isPdf = /\.pdf(\?|$)/i.test(doc.url)
              const isImage = /\.(jpe?g|png|gif|webp|svg)(\?|$)/i.test(doc.url)
              return (
                <div
                  key={doc.url}
                  className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg group/doc"
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (isPdf) setPdfViewerUrl(doc.url)
                      else window.open(doc.url, '_blank', 'noopener,noreferrer')
                    }}
                    className="shrink-0 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                    title="Открыть"
                  >
                    <FileText size={14} className={isPdf ? 'text-red-400' : isImage ? 'text-blue-400' : 'text-slate-400'} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (isPdf) setPdfViewerUrl(doc.url)
                      else window.open(doc.url, '_blank', 'noopener,noreferrer')
                    }}
                    className="flex-1 min-w-0 text-left"
                  >
                    <p className="text-xs text-slate-400">{DOC_TYPE_LABELS[doc.type]}</p>
                    <p className="text-sm font-medium text-slate-800 truncate group-hover/doc:text-blue-600 transition-colors">{doc.name}</p>
                  </button>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 p-1 text-blue-400 hover:text-blue-600"
                    title="Скачать"
                  >
                    <Download size={14} />
                  </a>
                  <button
                    type="button"
                    onClick={() => deleteDoc.mutate({ complexId, url: doc.url })}
                    className="shrink-0 p-1 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Properties in this complex */}
        {(properties as unknown[]).length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Объекты в ЖК
            </h3>
            <div className="space-y-2">
              {(properties as Record<string, unknown>[]).map((p) => (
                <button
                  key={p.id as string}
                  onClick={() => handlePropertyClick(p.id as string)}
                  className="w-full flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl hover:border-blue-200 hover:shadow-sm transition-all text-left group"
                >
                  <PropertyTypeIcon type={p.type as never} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {p.rooms ? `${p.rooms}-комн. ` : ''}
                        {PROPERTY_TYPE_LABELS[p.type as keyof typeof PROPERTY_TYPE_LABELS]}
                      </p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${PROPERTY_STATUS_COLORS[p.status as keyof typeof PROPERTY_STATUS_COLORS]}`}>
                        {PROPERTY_STATUS_LABELS[p.status as keyof typeof PROPERTY_STATUS_LABELS]}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono">{p.article as string}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {formatPriceShort(p.price as number)}
                    </p>
                    {p.area != null && (
                      <p className="text-xs text-slate-400">{p.area as number} м²</p>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-400 transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tasks */}
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <ClipboardList size={13} />
            Задачи
          </h3>
          <LinkedTasksSection linkedType="complex" linkedId={complexId} />
        </div>

        {/* Developer units */}
        <DeveloperUnitsView complexId={complexId} />
      </div>

      {/* PDF Viewer Modal */}
      {pdfViewerUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 shrink-0 bg-black/60">
            <span className="text-white/60 text-xs uppercase tracking-widest">PDF документ</span>
            <div className="flex items-center gap-2">
              <a
                href={pdfViewerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg transition-colors"
              >
                <Download size={13} />
                Скачать
              </a>
              <button
                onClick={() => setPdfViewerUrl(null)}
                className="p-2 text-white/60 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <iframe
              src={pdfViewerUrl}
              className="w-full h-full border-0"
              title="PDF документ"
            />
          </div>
        </div>
      )}
    </div>
  )
}

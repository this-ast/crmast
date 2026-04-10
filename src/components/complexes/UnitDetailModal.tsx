import { useRef, useState } from 'react'
import { Building2, Home, Layers, X, ChevronLeft, ChevronRight, Pencil, Loader2, Plus, Trash2 } from 'lucide-react'
import LinkedTasksSection from '@/components/tasks/LinkedTasksSection'
import type { ComplexUnit } from '@/types'
import { formatPriceShort } from '@/utils/format'
import {
  useUpdateComplexUnit,
  useUploadComplexUnitPhoto,
  useDeleteComplexUnitPhoto,
} from '@/hooks/useComplexes'
import toast from 'react-hot-toast'

interface UnitDetailModalProps {
  unit: ComplexUnit & { complex_name?: string; complex_photos?: string[] }
  onClose: () => void
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{children}</p>
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white placeholder:text-slate-400"
    />
  )
}

export default function UnitDetailModal({ unit: initialUnit, onClose }: UnitDetailModalProps) {
  const [unit, setUnit] = useState(initialUnit)
  const [editing, setEditing] = useState(false)
  const [photoIdx, setPhotoIdx] = useState(0)
  const [form, setForm] = useState({
    title: unit.title ?? '',
    rooms: unit.rooms != null ? String(unit.rooms) : '',
    area: unit.area != null ? String(unit.area) : '',
    floor: unit.floor != null ? String(unit.floor) : '',
    floor_to: unit.floor_to != null ? String(unit.floor_to) : '',
    total_floors: unit.total_floors != null ? String(unit.total_floors) : '',
    price: unit.price != null ? String(unit.price) : '',
    notes: unit.notes ?? '',
  })

  const updateUnit = useUpdateComplexUnit()
  const uploadPhoto = useUploadComplexUnitPhoto()
  const deletePhoto = useDeleteComplexUnitPhoto()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const label = unit.title || (unit.rooms ? `${unit.rooms}-комн. квартира` : 'Объект')
  const photos = unit.photos?.length ? unit.photos : (unit.complex_photos ?? [])

  async function handleSave() {
    try {
      await updateUnit.mutateAsync({
        id: unit.id,
        complexId: unit.complex_id,
        data: {
          title: form.title || undefined,
          rooms: form.rooms ? Number(form.rooms) : undefined,
          area: form.area ? Number(form.area) : undefined,
          floor: form.floor ? Number(form.floor) : undefined,
          floor_to: form.floor_to ? Number(form.floor_to) : undefined,
          total_floors: form.total_floors ? Number(form.total_floors) : undefined,
          price: form.price ? Number(form.price.replace(/\s/g, '')) : undefined,
          notes: form.notes || undefined,
        },
      })
      // Update local state
      setUnit((u) => ({
        ...u,
        title: form.title || undefined,
        rooms: form.rooms ? Number(form.rooms) : undefined,
        area: form.area ? Number(form.area) : undefined,
        floor: form.floor ? Number(form.floor) : undefined,
        floor_to: form.floor_to ? Number(form.floor_to) : undefined,
        total_floors: form.total_floors ? Number(form.total_floors) : undefined,
        price: form.price ? Number(form.price.replace(/\s/g, '')) : undefined,
        notes: form.notes || undefined,
      }))
      setEditing(false)
      toast.success('Сохранено')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка сохранения')
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    for (const file of files) {
      try {
        const url = await uploadPhoto.mutateAsync({ unitId: unit.id, complexId: unit.complex_id, file })
        setUnit((u) => ({ ...u, photos: [...(u.photos ?? []), url] }))
        toast.success('Фото добавлено')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Ошибка загрузки')
      }
    }
    e.target.value = ''
  }

  async function handleDeletePhoto(photoUrl: string) {
    try {
      await deletePhoto.mutateAsync({ unitId: unit.id, complexId: unit.complex_id, photoUrl })
      setUnit((u) => ({ ...u, photos: (u.photos ?? []).filter((p) => p !== photoUrl) }))
      setPhotoIdx(0)
      toast.success('Фото удалено')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка удаления')
    }
  }

  const displayPhotos = unit.photos?.length ? unit.photos : (unit.complex_photos ?? [])

  return (
    <div className="flex flex-col max-h-[85vh]">
      {/* Photos */}
      {displayPhotos.length > 0 && (
        <div className="relative w-full aspect-video bg-slate-900 shrink-0 overflow-hidden">
          <img src={displayPhotos[photoIdx]} alt={label} className="w-full h-full object-cover" />
          {editing && unit.photos?.length > 0 && (
            <button
              onClick={() => handleDeletePhoto(displayPhotos[photoIdx])}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
              title="Удалить фото"
            >
              <Trash2 size={14} />
            </button>
          )}
          {displayPhotos.length > 1 && (
            <>
              <button onClick={() => setPhotoIdx(i => (i - 1 + displayPhotos.length) % displayPhotos.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setPhotoIdx(i => (i + 1) % displayPhotos.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white">
                <ChevronRight size={16} />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {displayPhotos.slice(0, 7).map((_, i) => (
                  <button key={i} onClick={() => setPhotoIdx(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${i === photoIdx ? 'bg-white' : 'bg-white/40'}`} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
        <div className="min-w-0">
          <p className="text-base font-semibold text-slate-900 truncate">{label}</p>
          {unit.complex_name && (
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <Building2 size={11} /> {unit.complex_name}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-3">
          <button
            onClick={() => setEditing((v) => !v)}
            className={`p-1.5 rounded-lg transition-colors ${editing ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}
            title="Редактировать"
          >
            <Pencil size={16} />
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* Edit form */}
        {editing ? (
          <div className="space-y-3">
            <div>
              <FieldLabel>Название / описание</FieldLabel>
              <Input placeholder="напр. 2-комн. кв., угловая" value={form.title}
                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Комнат</FieldLabel>
                <Input type="number" placeholder="2" value={form.rooms}
                  onChange={(e) => setForm(f => ({ ...f, rooms: e.target.value }))} />
              </div>
              <div>
                <FieldLabel>Площадь м²</FieldLabel>
                <Input type="number" placeholder="65.5" value={form.area}
                  onChange={(e) => setForm(f => ({ ...f, area: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <FieldLabel>Этаж от</FieldLabel>
                <Input type="number" placeholder="3" value={form.floor}
                  onChange={(e) => setForm(f => ({ ...f, floor: e.target.value }))} />
              </div>
              <div>
                <FieldLabel>Этаж до</FieldLabel>
                <Input type="number" placeholder="15" value={form.floor_to}
                  onChange={(e) => setForm(f => ({ ...f, floor_to: e.target.value }))} />
              </div>
              <div>
                <FieldLabel>Всего эт.</FieldLabel>
                <Input type="number" placeholder="16" value={form.total_floors}
                  onChange={(e) => setForm(f => ({ ...f, total_floors: e.target.value }))} />
              </div>
            </div>
            <div>
              <FieldLabel>Цена</FieldLabel>
              <Input placeholder="5 500 000" value={form.price}
                onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))} />
            </div>
            <div>
              <FieldLabel>Заметки</FieldLabel>
              <Input placeholder="Доп. информация по квартире" value={form.notes}
                onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>

            {/* Photo upload */}
            <div>
              <FieldLabel>Фотографии</FieldLabel>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadPhoto.isPending}
                className="flex items-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors disabled:opacity-60"
              >
                {uploadPhoto.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Добавить фото
              </button>
              {unit.photos?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {unit.photos.map((url, i) => (
                    <div key={i} className="relative group">
                      <img src={url} alt="" className="w-16 h-16 object-cover rounded-lg" />
                      <button
                        onClick={() => handleDeletePhoto(url)}
                        className="absolute -top-1 -right-1 p-0.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setEditing(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                Отмена
              </button>
              <button type="button" onClick={handleSave} disabled={updateUnit.isPending}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                {updateUnit.isPending && <Loader2 size={14} className="animate-spin" />}
                Сохранить
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* View mode — details grid */}
            <div className="grid grid-cols-2 gap-3">
              {unit.area != null && (
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
                  <Home size={14} className="text-slate-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Площадь</p>
                    <p className="text-sm font-semibold text-slate-800">{unit.area} м²</p>
                  </div>
                </div>
              )}
              {unit.floor != null && (
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
                  <Layers size={14} className="text-slate-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Этаж</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {unit.floor_to && unit.floor_to > unit.floor
                        ? `${unit.floor}–${unit.floor_to}`
                        : unit.floor}
                      {unit.total_floors ? `/${unit.total_floors}` : ''}
                    </p>
                  </div>
                </div>
              )}
              {unit.rooms != null && (
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">Комнат</p>
                  <p className="text-sm font-semibold text-slate-800">{unit.rooms}</p>
                </div>
              )}
              {unit.price != null && (
                <div className="p-3 bg-emerald-50 rounded-xl">
                  <p className="text-[10px] text-emerald-600 uppercase tracking-wide">Цена</p>
                  <p className="text-sm font-bold text-emerald-700">{formatPriceShort(unit.price)}</p>
                </div>
              )}
            </div>

            {unit.notes && (
              <div className="px-3 py-2.5 bg-amber-50 border border-amber-100 rounded-xl text-xs text-slate-700">
                {unit.notes}
              </div>
            )}
          </>
        )}

        {/* Tasks */}
        {!editing && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Задачи</p>
            <LinkedTasksSection linkedType="unit" linkedId={unit.id} />
          </div>
        )}
      </div>
    </div>
  )
}

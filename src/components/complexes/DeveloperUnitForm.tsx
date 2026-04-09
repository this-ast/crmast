import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Loader2, X } from 'lucide-react'
import { useComplexes, useCreateComplexUnit } from '@/hooks/useComplexes'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'
import type { Complex } from '@/types'

interface Props {
  onClose: () => void
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white placeholder:text-slate-400"
    />
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{children}</p>
}

function ComplexPicker({
  complexId,
  onChange,
}: {
  complexId: string
  onChange: (id: string, complex: Complex) => void
}) {
  const { data: complexes = [] } = useComplexes()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const selected = complexes.find((c) => c.id === complexId)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const filtered = complexes
    .filter((c) => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return c.name.toLowerCase().includes(q) || (c.developer?.toLowerCase() ?? '').includes(q)
    })
    .slice(0, 30)

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
        {selected ? (
          <span className="text-slate-900 flex items-center gap-2 flex-1 min-w-0">
            <span className="truncate">{selected.name}</span>
            {selected.developer && (
              <span className="text-xs text-slate-400 shrink-0">{selected.developer}</span>
            )}
          </span>
        ) : (
          <span className="text-slate-400 flex-1">Выберите ЖК...</span>
        )}
        <ChevronDown size={14} className={cn('text-slate-400 shrink-0 ml-2 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск ЖК или застройщика..."
              className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="text-center text-slate-400 text-xs py-4">Ничего не найдено</p>
            )}
            {filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => { onChange(c.id, c); setOpen(false); setSearch('') }}
                className={cn(
                  'w-full px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors flex items-center gap-2',
                  c.id === complexId && 'bg-blue-50 text-blue-700'
                )}
              >
                <span className="flex-1 truncate">{c.name}</span>
                {c.developer && <span className="text-xs text-slate-400 shrink-0 truncate max-w-[120px]">{c.developer}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function DeveloperUnitForm({ onClose }: Props) {
  const createUnit = useCreateComplexUnit()
  const [complexId, setComplexId] = useState('')
  const [form, setForm] = useState({
    title: '',
    rooms: '',
    area: '',
    floor: '',
    total_floors: '',
    price: '',
    notes: '',
  })

  const handleSave = async () => {
    if (!complexId) {
      toast.error('Выберите ЖК')
      return
    }
    try {
      await createUnit.mutateAsync({
        complexId,
        data: {
          title: form.title || undefined,
          rooms: form.rooms ? Number(form.rooms) : undefined,
          area: form.area ? Number(form.area) : undefined,
          floor: form.floor ? Number(form.floor) : undefined,
          total_floors: form.total_floors ? Number(form.total_floors) : undefined,
          price: form.price ? Number(form.price.replace(/\s/g, '')) : undefined,
          notes: form.notes || undefined,
        },
      })
      toast.success('Объект добавлен')
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка сохранения')
    }
  }

  return (
    <div className="flex flex-col max-h-[85vh]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
        <h2 className="text-base font-semibold text-slate-900">Новый объект от застройщика</h2>
        <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* ЖК selector */}
        <div>
          <FieldLabel>Жилой комплекс *</FieldLabel>
          <ComplexPicker complexId={complexId} onChange={(id) => setComplexId(id)} />
        </div>

        {/* Title */}
        <div>
          <FieldLabel>Название / описание</FieldLabel>
          <Input
            placeholder="напр. 2-комн. кв., угловая"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
        </div>

        {/* Rooms + Area */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Комнат</FieldLabel>
            <Input
              type="number"
              placeholder="2"
              value={form.rooms}
              onChange={(e) => setForm((f) => ({ ...f, rooms: e.target.value }))}
            />
          </div>
          <div>
            <FieldLabel>Площадь м²</FieldLabel>
            <Input
              type="number"
              placeholder="65.5"
              value={form.area}
              onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
            />
          </div>
        </div>

        {/* Floor */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Этаж</FieldLabel>
            <Input
              type="number"
              placeholder="5"
              value={form.floor}
              onChange={(e) => setForm((f) => ({ ...f, floor: e.target.value }))}
            />
          </div>
          <div>
            <FieldLabel>Всего этажей</FieldLabel>
            <Input
              type="number"
              placeholder="16"
              value={form.total_floors}
              onChange={(e) => setForm((f) => ({ ...f, total_floors: e.target.value }))}
            />
          </div>
        </div>

        {/* Price */}
        <div>
          <FieldLabel>Цена (наличный)</FieldLabel>
          <Input
            placeholder="5 500 000"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
          />
        </div>

        {/* Notes */}
        <div>
          <FieldLabel>Заметки</FieldLabel>
          <Input
            placeholder="Доп. информация по квартире"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-slate-100 shrink-0 flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Отмена
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={createUnit.isPending}
          className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
        >
          {createUnit.isPending && <Loader2 size={14} className="animate-spin" />}
          Сохранить
        </button>
      </div>
    </div>
  )
}

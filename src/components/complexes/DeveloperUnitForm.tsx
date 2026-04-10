import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Loader2, X, Plus, Trash2 } from 'lucide-react'
import { useComplexes, useCreateComplexUnit, useUploadComplexUnitPhoto } from '@/hooks/useComplexes'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'
import type { Complex } from '@/types'
import { calcInstallment, calcMortgage } from '@/utils/unitCalc'
import { formatPriceShort } from '@/utils/format'

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
  const uploadPhoto = useUploadComplexUnitPhoto()
  const [complexId, setComplexId] = useState('')
  const [selectedComplex, setSelectedComplex] = useState<Complex | null>(null)
  const [pendingPhotos, setPendingPhotos] = useState<File[]>([])
  const [pendingPreviewUrls, setPendingPreviewUrls] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    title: '',
    rooms: '',
    area: '',
    floor: '',
    floor_to: '',
    total_floors: '',
    price: '',
    price_per_m2: '',
    payment_type: '',
    mortgage_rate: '',
    mortgage_years: '',
    mortgage_down_payment_pct: '',
    notes: '',
  })

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setPendingPhotos((prev) => [...prev, ...files])
    const urls = files.map((f) => URL.createObjectURL(f))
    setPendingPreviewUrls((prev) => [...prev, ...urls])
    e.target.value = ''
  }

  function removePhoto(idx: number) {
    URL.revokeObjectURL(pendingPreviewUrls[idx])
    setPendingPhotos((prev) => prev.filter((_, i) => i !== idx))
    setPendingPreviewUrls((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSave = async () => {
    if (!complexId) {
      toast.error('Выберите ЖК')
      return
    }
    try {
      const created = await createUnit.mutateAsync({
        complexId,
        data: {
          title: form.title || undefined,
          rooms: form.rooms ? Number(form.rooms) : undefined,
          area: form.area ? Number(form.area) : undefined,
          floor: form.floor ? Number(form.floor) : undefined,
          floor_to: form.floor_to ? Number(form.floor_to) : undefined,
          total_floors: form.total_floors ? Number(form.total_floors) : undefined,
          price_per_m2: form.price_per_m2 ? Number(form.price_per_m2) : undefined,
          price: form.price_per_m2 && form.area
            ? Number(form.price_per_m2) * Number(form.area)
            : (form.price ? Number(form.price.replace(/\s/g, '')) : undefined),
          payment_type: form.payment_type || undefined,
          mortgage_rate: form.mortgage_rate ? Number(form.mortgage_rate) : undefined,
          mortgage_years: form.mortgage_years ? Number(form.mortgage_years) : undefined,
          mortgage_down_payment_pct: form.mortgage_down_payment_pct ? Number(form.mortgage_down_payment_pct) : undefined,
          notes: form.notes || undefined,
        },
      })
      // Upload any pending photos
      for (const file of pendingPhotos) {
        try {
          await uploadPhoto.mutateAsync({ unitId: created.id, complexId, file })
        } catch { /* best-effort */ }
      }
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
          <ComplexPicker complexId={complexId} onChange={(id, c) => { setComplexId(id); setSelectedComplex(c) }} />
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

        {/* Floor range */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <FieldLabel>Этаж от</FieldLabel>
            <Input
              type="number"
              placeholder="3"
              value={form.floor}
              onChange={(e) => setForm((f) => ({ ...f, floor: e.target.value }))}
            />
          </div>
          <div>
            <FieldLabel>Этаж до</FieldLabel>
            <Input
              type="number"
              placeholder="15"
              value={form.floor_to}
              onChange={(e) => setForm((f) => ({ ...f, floor_to: e.target.value }))}
            />
          </div>
          <div>
            <FieldLabel>Всего эт.</FieldLabel>
            <Input
              type="number"
              placeholder="16"
              value={form.total_floors}
              onChange={(e) => setForm((f) => ({ ...f, total_floors: e.target.value }))}
            />
          </div>
        </div>

        {/* Price per m² + calculator */}
        <div>
          <FieldLabel>Цена за м² (₽/м²)</FieldLabel>
          <Input
            type="number"
            placeholder="100 000"
            value={form.price_per_m2}
            onChange={(e) => setForm((f) => ({ ...f, price_per_m2: e.target.value }))}
          />
          {form.price_per_m2 && form.area && (
            <p className="text-xs text-slate-500 mt-1 pl-1">
              Общая стоимость:{' '}
              <span className="font-semibold text-slate-800">
                {new Intl.NumberFormat('ru-RU').format(Math.round(Number(form.price_per_m2) * Number(form.area)))} ₽
              </span>
            </p>
          )}
        </div>

        {/* Payment type selector */}
        {complexId && selectedComplex && (
          <div>
            <FieldLabel>Форма оплаты</FieldLabel>
            <div className="flex flex-wrap gap-1.5">
              <button type="button"
                onClick={() => setForm((f) => {
                  const newPt = f.payment_type === 'cash' ? '' : 'cash'
                  const cashCond = selectedComplex?.pricing_conditions?.find(c => c.payment_type === 'cash')
                  return { ...f, payment_type: newPt, price_per_m2: newPt && cashCond?.price_per_sqm ? String(cashCond.price_per_sqm) : f.price_per_m2 }
                })}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors border ${form.payment_type === 'cash' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
                💵 Наличные
              </button>
              {(selectedComplex.pricing_conditions ?? []).map((opt) => (
                <button key={opt.id} type="button"
                  onClick={() => setForm((f) => {
                    const newPt = f.payment_type === opt.id ? '' : opt.id
                    return { ...f, payment_type: newPt, price_per_m2: newPt && opt.price_per_sqm ? String(opt.price_per_sqm) : f.price_per_m2 }
                  })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors border ${form.payment_type === opt.id ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
                  {opt.payment_type === 'installment' ? '📅' : opt.payment_type === 'mortgage' ? '🏦' : opt.payment_type === 'escrow' ? '🔒' : '💳'} {opt.label}
                  {opt.payment_type === 'installment' && opt.installment_months ? ` · ${opt.installment_months} мес.` : ''}
                </button>
              ))}
              <button type="button"
                onClick={() => setForm((f) => ({ ...f, payment_type: f.payment_type === 'mortgage' ? '' : 'mortgage' }))}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors border ${form.payment_type === 'mortgage' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
                🏦 Ипотека
              </button>
            </div>
          </div>
        )}

        {/* Mortgage inputs */}
        {form.payment_type === 'mortgage' && (
          <div className="space-y-2 p-3 bg-purple-50 rounded-xl border border-purple-100">
            <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Параметры ипотеки</p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <FieldLabel>Ставка %</FieldLabel>
                <Input type="number" placeholder="10" value={form.mortgage_rate}
                  onChange={(e) => setForm((f) => ({ ...f, mortgage_rate: e.target.value }))} />
              </div>
              <div>
                <FieldLabel>Срок (лет)</FieldLabel>
                <Input type="number" placeholder="20" value={form.mortgage_years}
                  onChange={(e) => setForm((f) => ({ ...f, mortgage_years: e.target.value }))} />
              </div>
              <div>
                <FieldLabel>ПВ %</FieldLabel>
                <Input type="number" placeholder="20" value={form.mortgage_down_payment_pct}
                  onChange={(e) => setForm((f) => ({ ...f, mortgage_down_payment_pct: e.target.value }))} />
              </div>
            </div>
          </div>
        )}

        {/* Calculator results */}
        {(() => {
          const area = Number(form.area) || 0
          const ppm2 = Number(form.price_per_m2) || 0
          if (!area || !ppm2) return null
          const total = ppm2 * area
          const selectedCondition = form.payment_type && form.payment_type !== 'cash' && form.payment_type !== 'mortgage'
            ? (selectedComplex?.pricing_conditions ?? []).find((c) => c.id === form.payment_type)
            : null
          let result = null
          if (selectedCondition?.payment_type === 'installment' &&
            selectedCondition.installment_months && selectedCondition.installment_down_payment_pct != null) {
            result = calcInstallment(total, selectedCondition.installment_months, selectedCondition.installment_down_payment_pct)
          } else if (form.payment_type === 'mortgage' && form.mortgage_rate && form.mortgage_years && form.mortgage_down_payment_pct) {
            result = calcMortgage(total, Number(form.mortgage_rate), Number(form.mortgage_years), Number(form.mortgage_down_payment_pct))
          }
          if (!result && form.payment_type !== 'cash') return null
          return (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Расчёт стоимости</p>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Общая стоимость</span>
                  <span className="font-semibold text-slate-800">{new Intl.NumberFormat('ru-RU').format(Math.round(total))} ₽</span>
                </div>
                {result && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Первоначальный взнос</span>
                      <span className="font-medium text-slate-700">{new Intl.NumberFormat('ru-RU').format(result.downPayment)} ₽</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">{form.payment_type === 'mortgage' ? 'Сумма кредита' : 'Остаток'}</span>
                      <span className="font-medium text-slate-700">{new Intl.NumberFormat('ru-RU').format(result.remainder)} ₽</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Срок</span>
                      <span className="font-medium text-slate-700">{result.termMonths} мес.</span>
                    </div>
                    <div className="h-px bg-slate-200 my-1" />
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold text-slate-700">Ежемесячный платёж</span>
                      <span className="text-base font-bold text-blue-600">{new Intl.NumberFormat('ru-RU').format(result.monthlyPayment)} ₽</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )
        })()}

        {/* Notes */}
        <div>
          <FieldLabel>Заметки</FieldLabel>
          <Input
            placeholder="Доп. информация по квартире"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </div>

        {/* Photos */}
        <div>
          <FieldLabel>Фотографии</FieldLabel>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoSelect} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors w-full justify-center"
          >
            <Plus size={14} /> Добавить фото
          </button>
          {pendingPreviewUrls.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {pendingPreviewUrls.map((url, i) => (
                <div key={i} className="relative group">
                  <img src={url} alt="" className="w-16 h-16 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute -top-1 -right-1 p-0.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
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
          disabled={createUnit.isPending || uploadPhoto.isPending}
          className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
        >
          {(createUnit.isPending || uploadPhoto.isPending) && <Loader2 size={14} className="animate-spin" />}
          Сохранить
        </button>
      </div>
    </div>
  )
}

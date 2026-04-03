import React, { useState, useMemo, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import {
  Search, Plus, X, Loader2, AlertCircle, Pencil, Trash2,
  ChevronDown, ChevronUp, User, TrendingUp, SlidersHorizontal,
  Banknote, MapPin, Home, ArrowRight, Filter, ClipboardList,
  Archive, ArchiveRestore, BookMarked, Building2, ExternalLink,
  Layers, CreditCard, Maximize2, MoveVertical, Wrench, LayoutGrid,
} from 'lucide-react'
import { useDemands, useCreateDemand, useUpdateDemand, useDeleteDemand } from '@/hooks/useDemands'
import { useActiveTaskCounts } from '@/hooks/useTasks'
import { useClients } from '@/hooks/useClients'
import { useComplexes, useAllComplexUnits } from '@/hooks/useComplexes'
import { useProperties } from '@/hooks/useProperties'
import { useCreateCollection } from '@/hooks/useCollections'
import LinkedTasksSection from '@/components/tasks/LinkedTasksSection'
import Modal from '@/components/ui/Modal'
import { cn } from '@/utils/cn'
import { formatPrice, formatPriceShort } from '@/utils/format'
import { getOptionsWithDeletions } from '@/lib/customOptions'
import toast from 'react-hot-toast'
import type { Demand, DemandFormData, DemandFunnelStage, Client } from '@/types'
import {
  DEMAND_FUNNEL_STAGES, DEMAND_PROPERTY_TYPES, DEMAND_PROPERTY_GROUPS,
  DEMAND_PAYMENT_TYPES, DEMAND_MARKET_TYPES, getDemandCategory,
  PROPERTY_TYPE_LABELS,
} from '@/types'

// ─── Funnel Bar ───────────────────────────────────────────────────────────────

function DemandFunnelBar({
  demands,
  activeStage,
  onStageClick,
}: {
  demands: Demand[]
  activeStage: DemandFunnelStage | 'all'
  onStageClick: (s: DemandFunnelStage | 'all') => void
}) {
  const counts = useMemo(() => {
    const c = {} as Record<DemandFunnelStage, number>
    DEMAND_FUNNEL_STAGES.forEach((s) => { c[s.value] = 0 })
    demands.forEach((d) => { if (d.funnel_stage) c[d.funnel_stage] = (c[d.funnel_stage] ?? 0) + 1 })
    return c
  }, [demands])

  const total = demands.length

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={14} className="text-blue-500" />
        <span className="text-sm font-semibold text-slate-800">Воронка покупателей</span>
        <span className="ml-auto text-xs text-slate-400">Всего: {total}</span>
        {activeStage !== 'all' && (
          <button
            onClick={() => onStageClick('all')}
            className="text-xs text-blue-500 hover:underline"
          >
            Сбросить
          </button>
        )}
      </div>

      {/* Funnel bars */}
      <div className="flex items-end gap-1 h-10 mb-2">
        {DEMAND_FUNNEL_STAGES.map((stage) => {
          const count = counts[stage.value]
          const pct = total > 0 ? Math.max((count / total) * 100, count > 0 ? 8 : 2) : 2
          const isActive = activeStage === stage.value
          return (
            <button
              key={stage.value}
              onClick={() => onStageClick(activeStage === stage.value ? 'all' : stage.value)}
              className="flex-1 flex flex-col items-center gap-0.5 group"
            >
              <span className="text-[10px] font-bold text-slate-600">{count > 0 ? count : ''}</span>
              <div
                className={cn(
                  'w-full rounded-t transition-all border',
                  stage.bg, stage.border,
                  isActive ? 'ring-2 ring-offset-1 ring-blue-400' : 'opacity-70 group-hover:opacity-100'
                )}
                style={{ height: `${pct * 0.7}px`, minHeight: count > 0 ? '6px' : '2px' }}
              />
            </button>
          )
        })}
      </div>

      {/* Stage labels */}
      <div className="flex gap-1">
        {DEMAND_FUNNEL_STAGES.map((stage) => (
          <button
            key={stage.value}
            onClick={() => onStageClick(activeStage === stage.value ? 'all' : stage.value)}
            className={cn(
              'flex-1 text-center text-[9px] font-medium leading-tight transition-colors',
              activeStage === stage.value ? stage.color + ' font-bold' : 'text-slate-400'
            )}
          >
            {stage.label.split(' ')[0]}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Multi-select chips helper ────────────────────────────────────────────────

function ChipSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: string; label: string }[]
  value: string[]
  onChange: (v: string[]) => void
}) {
  const toggle = (v: string) => {
    if (value.includes(v)) onChange(value.filter((x) => x !== v))
    else onChange([...value, v])
  }
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => toggle(o.value)}
            className={cn(
              'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
              value.includes(o.value)
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Client Selector ──────────────────────────────────────────────────────────

function ClientSelector({
  clients,
  value,
  onChange,
}: {
  clients: Client[]
  value: string
  onChange: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const selected = clients.find((c) => c.id === value)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return (q ? clients.filter((c) => c.name.toLowerCase().includes(q) || String(c.client_number).includes(q)) : clients).slice(0, 40)
  }, [clients, search])

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-medium text-slate-600 mb-1.5">Клиент</label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-left"
      >
        <User size={13} className="text-slate-400 shrink-0" />
        <span className={selected ? 'text-slate-800' : 'text-slate-400'}>
          {selected ? `${selected.client_number}. ${selected.name}` : 'Выберите клиента...'}
        </span>
        {value && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(''); setSearch('') }}
            className="ml-auto text-slate-400 hover:text-slate-600"
          >
            <X size={12} />
          </button>
        )}
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl">
          <div className="p-2">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск..."
              className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => { onChange(c.id); setOpen(false); setSearch('') }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex items-center gap-2"
              >
                <span className="text-slate-400 text-xs w-6">{c.client_number}</span>
                <span className="font-medium text-slate-800">{c.name}</span>
                <span className="ml-auto text-xs text-slate-400">{c.phone}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-4 text-sm text-slate-400 text-center">Не найдено</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Demand Form ──────────────────────────────────────────────────────────────

function RangeInput({
  label,
  nameFrom,
  nameTo,
  placeholderFrom,
  placeholderTo,
  register,
}: {
  label: string
  nameFrom: keyof DemandFormData
  nameTo: keyof DemandFormData
  placeholderFrom?: string
  placeholderTo?: string
  register: ReturnType<typeof useForm<DemandFormData>>['register']
}) {
  return (
    <div className="min-w-0">
      <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
      <div className="flex gap-2 items-center min-w-0">
        <input
          {...register(nameFrom, { valueAsNumber: true })}
          type="number"
          inputMode="numeric"
          placeholder={placeholderFrom ?? 'от'}
          className="min-w-0 flex-1 w-0 px-2.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-slate-400 text-sm shrink-0">—</span>
        <input
          {...register(nameTo, { valueAsNumber: true })}
          type="number"
          inputMode="numeric"
          placeholder={placeholderTo ?? 'до'}
          className="min-w-0 flex-1 w-0 px-2.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  )
}

function DemandForm({
  initial,
  clients,
  complexes,
  onSave,
  onCancel,
  isSubmitting,
}: {
  initial?: Partial<DemandFormData>
  clients: Client[]
  complexes: { id: string; name: string }[]
  onSave: (data: DemandFormData) => void
  onCancel: () => void
  isSubmitting: boolean
}) {
  const districts = getOptionsWithDeletions('crm_districts')
  const renovationOptions = getOptionsWithDeletions('crm_renovation')
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>(initial?.districts ?? [])
  const [selectedPropTypes, setSelectedPropTypes] = useState<string[]>(initial?.property_types ?? [])
  const [selectedPaymentTypes, setSelectedPaymentTypes] = useState<string[]>(initial?.payment_types ?? [])
  const [selectedComplexIds, setSelectedComplexIds] = useState<string[]>(initial?.complex_ids ?? [])
  const [selectedRenovation, setSelectedRenovation] = useState<string[]>(initial?.renovation ?? [])
  const [clientId, setClientId] = useState(initial?.client_id ?? '')

  const { register, handleSubmit } = useForm<DemandFormData>({
    defaultValues: {
      title: initial?.title ?? '',
      budget_min: initial?.budget_min,
      budget_max: initial?.budget_max,
      floor_min: initial?.floor_min,
      floor_max: initial?.floor_max,
      area_min: initial?.area_min,
      area_max: initial?.area_max,
      area_sotki_min: initial?.area_sotki_min,
      area_sotki_max: initial?.area_sotki_max,
      market_type: initial?.market_type ?? 'any',
      funnel_stage: initial?.funnel_stage ?? 'new',
      status: initial?.status ?? 'active',
      notes: initial?.notes ?? '',
    },
  })

  // Determine what fields to show based on selected property types
  const category = getDemandCategory(selectedPropTypes)
  const showApartmentFields = category === 'apartment' || category === 'mixed' || category === 'none'
  const showHouseFields     = category === 'house'     || category === 'mixed'
  const showLandFields      = category === 'land'      || category === 'mixed'
  const showCommercialFields = category === 'commercial' || category === 'mixed'
  const showFloor = showApartmentFields || showCommercialFields
  const showMarketType = showApartmentFields
  const showComplexes = (showApartmentFields || showCommercialFields) && complexes.length > 0

  const handleSave = (data: DemandFormData) => {
    onSave({
      ...data,
      client_id: clientId || undefined,
      districts: selectedDistricts,
      property_types: selectedPropTypes,
      payment_types: selectedPaymentTypes,
      complex_ids: selectedComplexIds,
      renovation: selectedRenovation,
    })
  }

  return (
    <form onSubmit={handleSubmit(handleSave)} className="flex flex-col max-h-[90vh]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 overflow-x-hidden">

        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Название / описание</label>
          <input
            {...register('title')}
            placeholder="Напр.: 2-комн. новостройка для семьи"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Client */}
        <ClientSelector clients={clients} value={clientId} onChange={setClientId} />

        {/* Funnel stage */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Этап воронки</label>
          <select
            {...register('funnel_stage')}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {DEMAND_FUNNEL_STAGES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <hr className="border-slate-100" />

        {/* Property type groups */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-2">Тип объекта</label>
          <div className="space-y-2">
            {DEMAND_PROPERTY_GROUPS.map((group) => (
              <div key={group.groupLabel}>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                  {group.icon} {group.groupLabel}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {group.items.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => {
                        if (selectedPropTypes.includes(o.value))
                          setSelectedPropTypes(selectedPropTypes.filter((x) => x !== o.value))
                        else
                          setSelectedPropTypes([...selectedPropTypes, o.value])
                      }}
                      className={cn(
                        'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                        selectedPropTypes.includes(o.value)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Budget */}
        <RangeInput label="Бюджет (₽)" nameFrom="budget_min" nameTo="budget_max" placeholderFrom="от" placeholderTo="до" register={register} />

        {/* Apartment-specific: floor, market type, ЖК */}
        {showFloor && (
          <RangeInput label="Этаж" nameFrom="floor_min" nameTo="floor_max" placeholderFrom="от" placeholderTo="до" register={register} />
        )}

        {/* Area m² — apartments, houses, commercial */}
        {(showApartmentFields || showHouseFields || showCommercialFields) && (
          <RangeInput label="Площадь (м²)" nameFrom="area_min" nameTo="area_max" placeholderFrom="от" placeholderTo="до" register={register} />
        )}

        {/* Land area sotki — houses and land */}
        {(showHouseFields || showLandFields) && (
          <RangeInput label="Площадь участка (сот.)" nameFrom="area_sotki_min" nameTo="area_sotki_max" placeholderFrom="от" placeholderTo="до" register={register} />
        )}

        {/* Market type — apartments / commercial only */}
        {showMarketType && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Рынок</label>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {DEMAND_MARKET_TYPES.map((m) => (
                <label key={m.value} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" value={m.value} {...register('market_type')} className="accent-blue-600" />
                  <span className="text-sm text-slate-700">{m.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Payment types */}
        <ChipSelect label="Форма оплаты" options={DEMAND_PAYMENT_TYPES} value={selectedPaymentTypes} onChange={setSelectedPaymentTypes} />

        {/* Districts */}
        {districts.length > 0 && (
          <ChipSelect
            label="Районы"
            options={districts.map((d) => ({ value: d, label: d }))}
            value={selectedDistricts}
            onChange={setSelectedDistricts}
          />
        )}

        {/* Linked complexes — apartments / commercial only */}
        {showComplexes && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">ЖК (интересующие)</label>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto overflow-x-hidden">
              {complexes.map((cx) => (
                <button
                  key={cx.id}
                  type="button"
                  onClick={() => {
                    if (selectedComplexIds.includes(cx.id))
                      setSelectedComplexIds(selectedComplexIds.filter((x) => x !== cx.id))
                    else
                      setSelectedComplexIds([...selectedComplexIds, cx.id])
                  }}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                    selectedComplexIds.includes(cx.id)
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-violet-400'
                  )}
                >
                  {cx.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Renovation */}
        {(showApartmentFields || showHouseFields) && renovationOptions.length > 0 && (
          <ChipSelect
            label="Ремонт"
            options={renovationOptions.map((r) => ({ value: r, label: r }))}
            value={selectedRenovation}
            onChange={setSelectedRenovation}
          />
        )}

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Примечания</label>
          <textarea
            {...register('notes')}
            rows={3}
            placeholder="Дополнительные пожелания..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      </div>

      <div className="shrink-0 flex gap-2 justify-end px-4 py-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          Отмена
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
        >
          {isSubmitting && <Loader2 size={14} className="animate-spin" />}
          Сохранить
        </button>
      </div>
    </form>
  )
}

// ─── Collection From Demand Modal ─────────────────────────────────────────────

function CollectionFromDemandModal({
  demand,
  onClose,
}: {
  demand: Demand
  onClose: () => void
}) {
  const { data: allProperties = [] } = useProperties()
  const { data: allUnits = [] } = useAllComplexUnits()
  const createCollection = useCreateCollection()
  const [tab, setTab] = useState<'props' | 'units'>('props')
  const [search, setSearch] = useState('')
  const [selectedProps, setSelectedProps] = useState<string[]>([])
  const [selectedUnits, setSelectedUnits] = useState<string[]>([])
  const [title, setTitle] = useState(demand.title ? `Подборка: ${demand.title}` : 'Подборка')

  const filteredProps = useMemo(() => {
    const q = search.toLowerCase()
    const props = allProperties.filter((p) => p.status !== 'sold' && p.status !== 'withdrawn')
    if (!q) return props.slice(0, 60)
    return props.filter((p) => {
      const loc = p.complex_name || p.address || ''
      const type = PROPERTY_TYPE_LABELS[p.type] ?? p.type
      return (
        loc.toLowerCase().includes(q) ||
        type.toLowerCase().includes(q) ||
        (p.district ?? '').toLowerCase().includes(q) ||
        String(p.price).includes(q)
      )
    }).slice(0, 60)
  }, [allProperties, search])

  const filteredUnits = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return allUnits.slice(0, 60)
    return allUnits.filter((u) => {
      const name = u.title || (u.rooms ? `${u.rooms}-комн. кв.` : 'Объект')
      const complex = u.complex_name || ''
      return (
        name.toLowerCase().includes(q) ||
        complex.toLowerCase().includes(q) ||
        String(u.price ?? '').includes(q)
      )
    }).slice(0, 60)
  }, [allUnits, search])

  const toggleProp = (id: string) =>
    setSelectedProps((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  const toggleUnit = (id: string) =>
    setSelectedUnits((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  const totalSelected = selectedProps.length + selectedUnits.length

  const handleCreate = async () => {
    if (totalSelected === 0) return
    try {
      await createCollection.mutateAsync({
        title: title.trim() || 'Подборка',
        client_id: demand.client_id ?? undefined,
        property_ids: selectedProps,
        unit_ids: selectedUnits,
      })
      toast.success('Подборка создана и добавлена в раздел Подборки')
      onClose()
    } catch {
      toast.error('Ошибка при создании подборки')
    }
  }

  return (
    <div className="flex flex-col max-h-[85vh]">
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Название подборки</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {demand.client && (
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-sm">
            <User size={13} className="text-blue-500" />
            <span className="text-blue-700 font-medium">{demand.client.name}</span>
            <span className="text-blue-400 text-xs">(будет привязан к подборке)</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setTab('props')}
            className={cn(
              'flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors',
              tab === 'props' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            Объекты {selectedProps.length > 0 && `(${selectedProps.length})`}
          </button>
          <button
            type="button"
            onClick={() => setTab('units')}
            className={cn(
              'flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors',
              tab === 'units' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            От застройщика {selectedUnits.length > 0 && `(${selectedUnits.length})`}
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === 'props' ? 'Поиск по адресу, типу, цене...' : 'Поиск по ЖК, типу, цене...'}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {totalSelected > 0 && (
          <div className="flex items-center gap-2 text-xs text-blue-600 font-medium">
            <BookMarked size={13} />
            Выбрано: {totalSelected} объект{totalSelected === 1 ? '' : totalSelected < 5 ? 'а' : 'ов'}
          </div>
        )}

        {/* Properties list */}
        {tab === 'props' && (
          <div className="space-y-1.5">
            {filteredProps.map((p) => {
              const isSelected = selectedProps.includes(p.id)
              const label = p.type === 'apartment' && p.rooms
                ? `${p.rooms}-комн. квартира`
                : PROPERTY_TYPE_LABELS[p.type] ?? p.type
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleProp(p.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-colors',
                    isSelected ? 'bg-blue-50 border-blue-300' : 'bg-white border-slate-100 hover:border-slate-300'
                  )}
                >
                  <div className={cn(
                    'w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors',
                    isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                  )}>
                    {isSelected && <span className="text-white text-[10px] font-bold">✓</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{label}</p>
                    <p className="text-[11px] text-slate-500 truncate">{p.complex_name || p.address}</p>
                  </div>
                  <span className="text-xs font-bold text-slate-700 shrink-0">{formatPriceShort(p.price)}</span>
                </button>
              )
            })}
            {filteredProps.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6">Объекты не найдены</p>
            )}
          </div>
        )}

        {/* Units list */}
        {tab === 'units' && (
          <div className="space-y-1.5">
            {filteredUnits.map((u) => {
              const isSelected = selectedUnits.includes(u.id)
              const label = u.title || (u.rooms ? `${u.rooms}-комн. кв.` : 'Объект')
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggleUnit(u.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-colors',
                    isSelected ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-slate-100 hover:border-slate-300'
                  )}
                >
                  <div className={cn(
                    'w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors',
                    isSelected ? 'bg-emerald-600 border-emerald-600' : 'border-slate-300'
                  )}>
                    {isSelected && <span className="text-white text-[10px] font-bold">✓</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{label}
                      {u.area ? ` · ${u.area} м²` : ''}</p>
                    <p className="text-[11px] text-slate-500 truncate">
                      <Building2 size={9} className="inline mr-0.5" />{u.complex_name ?? 'ЖК'}
                      {u.floor ? ` · ${u.floor} эт.` : ''}
                    </p>
                  </div>
                  {u.price != null && (
                    <span className="text-xs font-bold text-emerald-700 shrink-0">{formatPriceShort(u.price)}</span>
                  )}
                </button>
              )
            })}
            {filteredUnits.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6">Объекты от застройщика не найдены</p>
            )}
          </div>
        )}
      </div>
      <div className="shrink-0 flex gap-2 px-5 py-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          Отмена
        </button>
        <button
          type="button"
          onClick={handleCreate}
          disabled={totalSelected === 0 || createCollection.isPending}
          className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
        >
          {createCollection.isPending && <Loader2 size={14} className="animate-spin" />}
          <BookMarked size={14} />
          Создать подборку ({totalSelected})
        </button>
      </div>
    </div>
  )
}

// ─── Demand Card ──────────────────────────────────────────────────────────────

// Small helper: one labeled info row with an icon
function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 min-w-0">
      <span className="shrink-0 mt-0.5 text-slate-400">{icon}</span>
      <span className="shrink-0 text-[11px] font-semibold text-slate-400 w-14">{label}</span>
      <span className="flex-1 min-w-0">{children}</span>
    </div>
  )
}

function DemandCard({
  demand,
  complexesMap,
  onEdit,
  onDelete,
  onStageChange,
  onArchiveToggle,
  taskCount = 0,
}: {
  demand: Demand
  complexesMap: Record<string, string>
  onEdit: (d: Demand) => void
  onDelete: (id: string) => void
  onStageChange: (id: string, stage: DemandFunnelStage) => void
  onArchiveToggle: (id: string, current: string) => void
  taskCount?: number
}) {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)
  const [collectionOpen, setCollectionOpen] = useState(false)
  const stage = DEMAND_FUNNEL_STAGES.find((s) => s.value === demand.funnel_stage) ?? DEMAND_FUNNEL_STAGES[0]
  const isArchived = demand.status === 'archived'

  const ptLabels = (demand.property_types ?? [])
    .map((v) => DEMAND_PROPERTY_TYPES.find((x) => x.value === v)?.label ?? v)
  const payLabels = (demand.payment_types ?? [])
    .map((v) => DEMAND_PAYMENT_TYPES.find((x) => x.value === v)?.label ?? v)
  const marketLabel = DEMAND_MARKET_TYPES.find((m) => m.value === demand.market_type && demand.market_type !== 'any')?.label

  const budgetStr = (() => {
    if (!demand.budget_min && !demand.budget_max) return null
    if (demand.budget_min && demand.budget_max)
      return `${formatPriceShort(demand.budget_min)} — ${formatPriceShort(demand.budget_max)} ₽`
    if (demand.budget_max) return `до ${formatPriceShort(demand.budget_max)} ₽`
    return `от ${formatPriceShort(demand.budget_min!)} ₽`
  })()

  const floorStr = (() => {
    if (!demand.floor_min && !demand.floor_max) return null
    if (demand.floor_min && demand.floor_max) return `${demand.floor_min} — ${demand.floor_max} эт.`
    if (demand.floor_max) return `до ${demand.floor_max} эт.`
    return `от ${demand.floor_min} эт.`
  })()

  const areaStr = (() => {
    if (!demand.area_min && !demand.area_max) return null
    if (demand.area_min && demand.area_max) return `${demand.area_min} — ${demand.area_max} м²`
    if (demand.area_max) return `до ${demand.area_max} м²`
    return `от ${demand.area_min} м²`
  })()

  const sotkiStr = (() => {
    if (!demand.area_sotki_min && !demand.area_sotki_max) return null
    if (demand.area_sotki_min && demand.area_sotki_max) return `${demand.area_sotki_min} — ${demand.area_sotki_max} сот.`
    if (demand.area_sotki_max) return `до ${demand.area_sotki_max} сот.`
    return `от ${demand.area_sotki_min} сот.`
  })()

  const alsoLinkOptions = [
    demand.client ? { type: 'client' as const, id: demand.client.id, label: demand.client.name } : null,
    ...(demand.complex_ids ?? []).map((cid) => ({ type: 'complex' as const, id: cid, label: complexesMap[cid] ?? cid })),
  ].filter(Boolean) as { type: 'client' | 'complex'; id: string; label: string }[]

  return (
    <>
      <div className={cn(
        'bg-white border rounded-2xl shadow-sm overflow-hidden transition-shadow hover:shadow-md',
        isArchived ? 'opacity-60 border-slate-200' : stage.border
      )}>
        {isArchived && (
          <div className="flex items-center gap-2 px-4 py-1 bg-slate-50 border-b border-slate-200 text-[11px] text-slate-400">
            <Archive size={10} /> В архиве
          </div>
        )}

        {/* ── Clickable main body ── */}
        <button
          type="button"
          onClick={() => onEdit(demand)}
          className="w-full text-left p-4 hover:bg-slate-50/60 transition-colors"
        >
          {/* Header row: stage + number + actions */}
          <div className="flex items-start gap-2">
            <div className={cn('shrink-0 w-2 h-2 rounded-full mt-1.5 border', isArchived ? 'bg-slate-300 border-slate-300' : cn(stage.bg, stage.border))} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {!isArchived && (
                  <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full border', stage.bg, stage.color, stage.border)}>
                    {stage.label}
                  </span>
                )}
                {demand.demand_number && <span className="text-[11px] text-slate-400">#{demand.demand_number}</span>}
                {taskCount > 0 && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                    <ClipboardList size={10} />{taskCount}
                  </span>
                )}
              </div>
              {demand.title && (
                <p className="mt-1 text-sm font-semibold text-slate-800 leading-snug">{demand.title}</p>
              )}
              {demand.client && (
                <p className="mt-0.5 text-xs text-blue-600 flex items-center gap-1">
                  <User size={10} />
                  {demand.client.client_number}. {demand.client.name}
                </p>
              )}
            </div>
          </div>

          {/* ── Structured params ── */}
          <div className="mt-3 space-y-1.5 text-xs">
            {ptLabels.length > 0 && (
              <InfoRow icon={<Home size={11} />} label="Тип">
                <div className="flex flex-wrap gap-1">
                  {ptLabels.map((l) => (
                    <span key={l} className="px-1.5 py-0.5 bg-violet-50 text-violet-700 border border-violet-100 rounded-full text-[11px]">
                      {l}
                    </span>
                  ))}
                </div>
              </InfoRow>
            )}

            {budgetStr && (
              <InfoRow icon={<Banknote size={11} />} label="Бюджет">
                <span className="font-semibold text-emerald-700">{budgetStr}</span>
              </InfoRow>
            )}

            {marketLabel && (
              <InfoRow icon={<Layers size={11} />} label="Рынок">
                <span className="text-slate-700">{marketLabel}</span>
              </InfoRow>
            )}

            {(areaStr || floorStr || sotkiStr) && (
              <InfoRow icon={<Maximize2 size={11} />} label="Площадь">
                <span className="text-slate-700">
                  {[areaStr, sotkiStr, floorStr].filter(Boolean).join(' · ')}
                </span>
              </InfoRow>
            )}

            {(demand.districts ?? []).length > 0 && (
              <InfoRow icon={<MapPin size={11} />} label="Район">
                <div className="flex flex-wrap gap-1">
                  {demand.districts!.map((d) => (
                    <span key={d} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-[11px]">{d}</span>
                  ))}
                </div>
              </InfoRow>
            )}

            {payLabels.length > 0 && (
              <InfoRow icon={<CreditCard size={11} />} label="Оплата">
                <div className="flex flex-wrap gap-1">
                  {payLabels.map((l) => (
                    <span key={l} className="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-full text-[11px]">{l}</span>
                  ))}
                </div>
              </InfoRow>
            )}

            {(demand.renovation ?? []).length > 0 && (
              <InfoRow icon={<Wrench size={11} />} label="Ремонт">
                <div className="flex flex-wrap gap-1">
                  {demand.renovation!.map((r) => (
                    <span key={r} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-[11px]">{r}</span>
                  ))}
                </div>
              </InfoRow>
            )}

            {(demand.complex_ids ?? []).length > 0 && (
              <InfoRow icon={<Building2 size={11} />} label="ЖК">
                <div className="flex flex-wrap gap-1">
                  {demand.complex_ids!.map((cid) => (
                    <span key={cid} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-[11px]">
                      {complexesMap[cid] ?? cid}
                    </span>
                  ))}
                </div>
              </InfoRow>
            )}
          </div>
        </button>

        {/* ── Actions strip ── */}
        <div className="px-4 pb-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
          {/* Stage quick-change */}
          {!isArchived && (
            <div className="flex-1 flex gap-1 overflow-x-auto scrollbar-hide">
              {DEMAND_FUNNEL_STAGES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => onStageChange(demand.id, s.value)}
                  className={cn(
                    'shrink-0 text-[9px] font-medium px-2 py-0.5 rounded-full border transition-colors',
                    demand.funnel_stage === s.value ? cn(s.bg, s.color, s.border, 'font-bold') : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
                  )}
                >
                  {s.label.split(' ')[0]}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={() => setCollectionOpen(true)}
              title="Подборка"
              className="p-1.5 text-violet-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
            >
              <BookMarked size={13} />
            </button>
            <button
              onClick={() => onArchiveToggle(demand.id, demand.status ?? 'active')}
              title={isArchived ? 'Восстановить' : 'В архив'}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {isArchived ? <ArchiveRestore size={13} /> : <Archive size={13} />}
            </button>
            <button
              onClick={() => onEdit(demand)}
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => onDelete(demand.id)}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        <button
          onClick={() => setExpanded((e) => !e)}
          className="w-full flex items-center justify-center gap-1 py-2 text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-50 border-t border-slate-100 transition-colors"
        >
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {expanded ? 'Свернуть' : 'История и задачи'}
        </button>

        {expanded && (
          <div className="border-t border-slate-100 p-4 space-y-4">
            {demand.notes && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Примечания</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{demand.notes}</p>
              </div>
            )}
            <LinkedTasksSection linkedType="demand" linkedId={demand.id} alsoLinkOptions={alsoLinkOptions} />
          </div>
        )}
      </div>

      <Modal isOpen={collectionOpen} onClose={() => setCollectionOpen(false)} title="Создать подборку" size="lg">
        <CollectionFromDemandModal demand={demand} onClose={() => setCollectionOpen(false)} />
      </Modal>
    </>
  )
}

// ─── DemandsPage ──────────────────────────────────────────────────────────────

export default function DemandsPage() {
  const { data: demands = [], isLoading, error } = useDemands()
  const { data: clients = [] } = useClients()
  const { data: complexesData = [] } = useComplexes()
  const taskCounts = useActiveTaskCounts()
  const createDemand = useCreateDemand()
  const updateDemand = useUpdateDemand()
  const deleteDemand = useDeleteDemand()

  const complexesMap = useMemo(() => {
    const m: Record<string, string> = {}
    complexesData.forEach((cx) => { m[cx.id] = cx.name })
    return m
  }, [complexesData])

  const complexesList = useMemo(() =>
    complexesData.map((cx) => ({ id: cx.id, name: cx.name })),
    [complexesData]
  )

  // ── state ──
  const [search, setSearch] = useState('')
  const [funnelFilter, setFunnelFilter] = useState<DemandFunnelStage | 'all'>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [filterBudget, setFilterBudget] = useState('')
  const [filterDistrict, setFilterDistrict] = useState('')
  const [filterPropType, setFilterPropType] = useState('')
  const [filterPayment, setFilterPayment] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [editDemand, setEditDemand] = useState<Demand | null>(null)
  const [twoCol, setTwoCol] = useState(false)

  // ── filtering ──
  const filtered = useMemo(() => {
    let list = showArchived
      ? demands.filter((d) => d.status === 'archived')
      : demands.filter((d) => d.status !== 'archived')

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (d) =>
          d.title?.toLowerCase().includes(q) ||
          d.client?.name.toLowerCase().includes(q) ||
          d.notes?.toLowerCase().includes(q)
      )
    }
    if (funnelFilter !== 'all') {
      list = list.filter((d) => d.funnel_stage === funnelFilter)
    }
    if (filterBudget) {
      const b = Number(filterBudget)
      list = list.filter((d) => !d.budget_max || d.budget_max >= b)
    }
    if (filterDistrict) {
      list = list.filter((d) => d.districts?.includes(filterDistrict))
    }
    if (filterPropType) {
      list = list.filter((d) => d.property_types?.includes(filterPropType))
    }
    if (filterPayment) {
      list = list.filter((d) => d.payment_types?.includes(filterPayment))
    }
    return list
  }, [demands, search, funnelFilter, filterBudget, filterDistrict, filterPropType, filterPayment])

  const hasFilters = filterBudget || filterDistrict || filterPropType || filterPayment
  const districtOptions = getOptionsWithDeletions('crm_districts')

  // ── handlers ──
  const handleCreate = async (data: DemandFormData) => {
    try {
      await createDemand.mutateAsync(data)
      setCreateOpen(false)
      toast.success('Спрос добавлен')
    } catch (e) {
      toast.error('Ошибка при сохранении')
    }
  }

  const handleUpdate = async (data: DemandFormData) => {
    if (!editDemand) return
    try {
      await updateDemand.mutateAsync({ id: editDemand.id, data })
      setEditDemand(null)
      toast.success('Спрос обновлён')
    } catch {
      toast.error('Ошибка при обновлении')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить спрос?')) return
    try {
      await deleteDemand.mutateAsync(id)
      toast.success('Удалено')
    } catch {
      toast.error('Ошибка при удалении')
    }
  }

  const handleArchiveToggle = async (id: string, current: string) => {
    const newStatus = current === 'archived' ? 'active' : 'archived'
    try {
      await updateDemand.mutateAsync({ id, data: { status: newStatus as 'active' | 'archived' } })
      toast.success(newStatus === 'archived' ? 'Спрос архивирован' : 'Спрос восстановлен')
    } catch {
      toast.error('Ошибка')
    }
  }

  const handleStageChange = async (id: string, stage: DemandFunnelStage) => {
    try {
      await updateDemand.mutateAsync({ id, data: { funnel_stage: stage } })
    } catch {
      toast.error('Ошибка')
    }
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ArrowRight size={20} className="text-blue-500" />
            Спрос
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Запросы покупателей и работа с лидами</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowArchived((v) => !v)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-colors',
              showArchived
                ? 'bg-slate-700 text-white border-slate-700'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
            )}
          >
            {showArchived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
            {showArchived ? 'Архив' : 'Активные'}
          </button>
          <button
            onClick={() => setTwoCol((v) => !v)}
            title={twoCol ? 'Одна колонка' : 'Две колонки'}
            className={cn(
              'p-2 rounded-xl border transition-all',
              twoCol ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
            )}
          >
            <LayoutGrid size={15} />
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Plus size={15} />
            Добавить
          </button>
        </div>
      </div>

      {/* Funnel */}
      <DemandFunnelBar
        demands={demands.filter((d) => d.status !== 'archived')}
        activeStage={funnelFilter}
        onStageClick={setFunnelFilter}
      />

      {/* Search + filters */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по имени, описанию..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={13} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters((f) => !f)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors',
            showFilters || hasFilters
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
          )}
        >
          <Filter size={14} />
          Фильтр
          {hasFilters && <span className="bg-white text-blue-600 rounded-full w-4 h-4 text-[10px] flex items-center justify-center font-bold">!</span>}
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Бюджет до (₽)</label>
              <input
                type="number"
                value={filterBudget}
                onChange={(e) => setFilterBudget(e.target.value)}
                placeholder="Напр.: 5000000"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Район</label>
              <select
                value={filterDistrict}
                onChange={(e) => setFilterDistrict(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Все</option>
                {districtOptions.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Тип квартиры</label>
              <select
                value={filterPropType}
                onChange={(e) => setFilterPropType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Все</option>
                {DEMAND_PROPERTY_TYPES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Форма оплаты</label>
              <select
                value={filterPayment}
                onChange={(e) => setFilterPayment(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Все</option>
                {DEMAND_PAYMENT_TYPES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>
          {hasFilters && (
            <button
              onClick={() => { setFilterBudget(''); setFilterDistrict(''); setFilterPropType(''); setFilterPayment('') }}
              className="text-xs text-red-500 hover:underline"
            >
              Сбросить фильтры
            </button>
          )}
        </div>
      )}

      {/* Count */}
      {(funnelFilter !== 'all' || search || hasFilters) && (
        <p className="text-xs text-slate-400 mb-3">
          Показано: {filtered.length} из {demands.filter((d) => d.status !== 'archived').length}
        </p>
      )}

      {/* Content */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-blue-500" />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle size={16} />
          Ошибка загрузки данных
        </div>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ArrowRight size={36} className="text-slate-200 mb-3" />
          <p className="text-slate-500 font-medium">
            {demands.length === 0 ? 'Нет запросов покупателей' : 'Ничего не найдено'}
          </p>
          {demands.length === 0 && (
            <button
              onClick={() => setCreateOpen(true)}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Plus size={14} />
              Добавить спрос
            </button>
          )}
        </div>
      )}

      <div className={twoCol ? 'grid grid-cols-2 gap-3' : 'space-y-3'}>
        {filtered.map((d) => (
          <DemandCard
            key={d.id}
            demand={d}
            complexesMap={complexesMap}
            onEdit={setEditDemand}
            onDelete={handleDelete}
            onStageChange={handleStageChange}
            onArchiveToggle={handleArchiveToggle}
            taskCount={taskCounts[d.id] ?? 0}
          />
        ))}
      </div>

      {/* Create modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Новый спрос"
      >
        <DemandForm
          clients={clients}
          complexes={complexesList}
          onSave={handleCreate}
          onCancel={() => setCreateOpen(false)}
          isSubmitting={createDemand.isPending}
        />
      </Modal>

      {/* Edit modal */}
      <Modal
        isOpen={!!editDemand}
        onClose={() => setEditDemand(null)}
        title="Редактировать спрос"
      >
        {editDemand && (
          <DemandForm
            initial={{
              title: editDemand.title,
              client_id: editDemand.client_id,
              budget_min: editDemand.budget_min,
              budget_max: editDemand.budget_max,
              districts: editDemand.districts,
              property_types: editDemand.property_types,
              payment_types: editDemand.payment_types,
              floor_min: editDemand.floor_min,
              floor_max: editDemand.floor_max,
              market_type: editDemand.market_type,
              complex_ids: editDemand.complex_ids,
              funnel_stage: editDemand.funnel_stage,
              status: editDemand.status,
              notes: editDemand.notes,
            }}
            clients={clients}
            complexes={complexesList}
            onSave={handleUpdate}
            onCancel={() => setEditDemand(null)}
            isSubmitting={updateDemand.isPending}
          />
        )}
      </Modal>
    </div>
  )
}

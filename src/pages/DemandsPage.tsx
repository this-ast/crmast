import { useState, useMemo, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import {
  Search, Plus, X, Loader2, AlertCircle, Pencil, Trash2,
  ChevronDown, ChevronUp, User, TrendingUp, SlidersHorizontal,
  Banknote, MapPin, Home, ArrowRight, Filter, ClipboardList,
} from 'lucide-react'
import { useDemands, useCreateDemand, useUpdateDemand, useDeleteDemand } from '@/hooks/useDemands'
import { useActiveTaskCounts } from '@/hooks/useTasks'
import { useClients } from '@/hooks/useClients'
import { useComplexes } from '@/hooks/useComplexes'
import LinkedTasksSection from '@/components/tasks/LinkedTasksSection'
import Modal from '@/components/ui/Modal'
import { cn } from '@/utils/cn'
import { formatPrice } from '@/utils/format'
import { getOptionsWithDeletions } from '@/lib/customOptions'
import toast from 'react-hot-toast'
import type { Demand, DemandFormData, DemandFunnelStage, Client } from '@/types'
import {
  DEMAND_FUNNEL_STAGES, DEMAND_PROPERTY_TYPES, DEMAND_PAYMENT_TYPES, DEMAND_MARKET_TYPES,
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
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>(initial?.districts ?? [])
  const [selectedPropTypes, setSelectedPropTypes] = useState<string[]>(initial?.property_types ?? [])
  const [selectedPaymentTypes, setSelectedPaymentTypes] = useState<string[]>(initial?.payment_types ?? [])
  const [selectedComplexIds, setSelectedComplexIds] = useState<string[]>(initial?.complex_ids ?? [])
  const [clientId, setClientId] = useState(initial?.client_id ?? '')

  const { register, handleSubmit, watch, setValue } = useForm<DemandFormData>({
    defaultValues: {
      title: initial?.title ?? '',
      budget_min: initial?.budget_min,
      budget_max: initial?.budget_max,
      floor_min: initial?.floor_min,
      floor_max: initial?.floor_max,
      market_type: initial?.market_type ?? 'any',
      funnel_stage: initial?.funnel_stage ?? 'new',
      status: initial?.status ?? 'active',
      notes: initial?.notes ?? '',
    },
  })

  const handleSave = (data: DemandFormData) => {
    onSave({
      ...data,
      client_id: clientId || undefined,
      districts: selectedDistricts,
      property_types: selectedPropTypes,
      payment_types: selectedPaymentTypes,
      complex_ids: selectedComplexIds,
    })
  }

  return (
    <form onSubmit={handleSubmit(handleSave)} className="flex flex-col max-h-[90vh]">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Название / описание</label>
          <input
            {...register('title')}
            placeholder="Напр.: 2-комн. новостройка для семьи"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <ClientSelector clients={clients} value={clientId} onChange={setClientId} />

        {/* Budget */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Бюджет (₽)</label>
          <div className="flex gap-2 items-center">
            <input
              {...register('budget_min', { valueAsNumber: true })}
              type="number"
              placeholder="от"
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-slate-400 text-sm">—</span>
            <input
              {...register('budget_max', { valueAsNumber: true })}
              type="number"
              placeholder="до"
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Property types */}
        <ChipSelect
          label="Тип квартиры"
          options={DEMAND_PROPERTY_TYPES}
          value={selectedPropTypes}
          onChange={setSelectedPropTypes}
        />

        {/* Payment types */}
        <ChipSelect
          label="Форма оплаты"
          options={DEMAND_PAYMENT_TYPES}
          value={selectedPaymentTypes}
          onChange={setSelectedPaymentTypes}
        />

        {/* Districts */}
        <ChipSelect
          label="Районы"
          options={districts.map((d) => ({ value: d, label: d }))}
          value={selectedDistricts}
          onChange={setSelectedDistricts}
        />

        {/* Market type */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Рынок</label>
          <div className="flex gap-2">
            {DEMAND_MARKET_TYPES.map((m) => (
              <label key={m.value} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  value={m.value}
                  {...register('market_type')}
                  className="accent-blue-600"
                />
                <span className="text-sm text-slate-700">{m.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Floor */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Этаж</label>
          <div className="flex gap-2 items-center">
            <input
              {...register('floor_min', { valueAsNumber: true })}
              type="number"
              placeholder="от"
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-slate-400 text-sm">—</span>
            <input
              {...register('floor_max', { valueAsNumber: true })}
              type="number"
              placeholder="до"
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Linked complexes */}
        {complexes.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">ЖК (интересующие)</label>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
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

      <div className="shrink-0 flex gap-2 justify-end px-6 py-4 border-t border-slate-100">
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

// ─── Demand Card ──────────────────────────────────────────────────────────────

function DemandCard({
  demand,
  complexesMap,
  onEdit,
  onDelete,
  onStageChange,
  taskCount = 0,
}: {
  demand: Demand
  complexesMap: Record<string, string>
  onEdit: (d: Demand) => void
  onDelete: (id: string) => void
  onStageChange: (id: string, stage: DemandFunnelStage) => void
  taskCount?: number
}) {
  const [expanded, setExpanded] = useState(false)
  const stage = DEMAND_FUNNEL_STAGES.find((s) => s.value === demand.funnel_stage) ?? DEMAND_FUNNEL_STAGES[0]

  const ptLabels = (demand.property_types ?? [])
    .map((v) => DEMAND_PROPERTY_TYPES.find((x) => x.value === v)?.label ?? v)
  const payLabels = (demand.payment_types ?? [])
    .map((v) => DEMAND_PAYMENT_TYPES.find((x) => x.value === v)?.label ?? v)

  return (
    <div className={cn('bg-white border rounded-2xl shadow-sm overflow-hidden transition-shadow hover:shadow-md', stage.border)}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn('shrink-0 w-2 h-2 rounded-full mt-2', stage.bg, 'border', stage.border)} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full border', stage.bg, stage.color, stage.border)}>
                {stage.label}
              </span>
              {demand.demand_number && (
                <span className="text-xs text-slate-400">#{demand.demand_number}</span>
              )}
            </div>
            {demand.title && (
              <p className="mt-1 text-sm font-semibold text-slate-800 truncate">{demand.title}</p>
            )}
            {demand.client && (
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                <User size={10} />
                {demand.client.client_number}. {demand.client.name}
                <span className="text-slate-300">·</span>
                {demand.client.phone}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {taskCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 mr-1">
                <ClipboardList size={11} />
                {taskCount}
              </span>
            )}
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

        {/* Key params */}
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {(demand.budget_min || demand.budget_max) && (
            <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              <Banknote size={10} />
              {demand.budget_min && demand.budget_max
                ? `${formatPrice(demand.budget_min)} — ${formatPrice(demand.budget_max)}`
                : demand.budget_max
                ? `до ${formatPrice(demand.budget_max)}`
                : `от ${formatPrice(demand.budget_min!)}`}
            </span>
          )}
          {ptLabels.length > 0 && (
            <span className="flex items-center gap-1 text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100">
              <Home size={10} />
              {ptLabels.join(', ')}
            </span>
          )}
          {(demand.districts ?? []).length > 0 && (
            <span className="flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              <MapPin size={10} />
              {(demand.districts!).join(', ')}
            </span>
          )}
          {payLabels.length > 0 && (
            <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
              {payLabels.join(', ')}
            </span>
          )}
        </div>

        {/* Linked complexes */}
        {(demand.complex_ids ?? []).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {demand.complex_ids!.map((cid) => (
              <span
                key={cid}
                className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full border border-slate-200"
              >
                {complexesMap[cid] ?? cid}
              </span>
            ))}
          </div>
        )}

        {/* Stage quick-change */}
        <div className="mt-3 flex gap-1 overflow-x-auto scrollbar-hide">
          {DEMAND_FUNNEL_STAGES.map((s) => (
            <button
              key={s.value}
              onClick={() => onStageChange(demand.id, s.value)}
              className={cn(
                'shrink-0 text-[9px] font-medium px-2 py-0.5 rounded-full border transition-colors',
                demand.funnel_stage === s.value
                  ? cn(s.bg, s.color, s.border, 'font-bold')
                  : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
              )}
            >
              {s.label.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Expand button */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-center gap-1 py-2 text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-50 border-t border-slate-100 transition-colors"
      >
        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        {expanded ? 'Свернуть' : 'История и задачи'}
      </button>

      {/* Expanded: tasks */}
      {expanded && (
        <div className="border-t border-slate-100 p-4 space-y-4">
          {demand.notes && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Примечания</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{demand.notes}</p>
            </div>
          )}
          <LinkedTasksSection linkedType="demand" linkedId={demand.id} />
        </div>
      )}
    </div>
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
  const [filterBudget, setFilterBudget] = useState('')
  const [filterDistrict, setFilterDistrict] = useState('')
  const [filterPropType, setFilterPropType] = useState('')
  const [filterPayment, setFilterPayment] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [editDemand, setEditDemand] = useState<Demand | null>(null)

  // ── filtering ──
  const filtered = useMemo(() => {
    let list = demands.filter((d) => d.status !== 'archived')

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
        <button
          onClick={() => setCreateOpen(true)}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <Plus size={15} />
          Добавить
        </button>
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

      <div className="space-y-3">
        {filtered.map((d) => (
          <DemandCard
            key={d.id}
            demand={d}
            complexesMap={complexesMap}
            onEdit={setEditDemand}
            onDelete={handleDelete}
            onStageChange={handleStageChange}
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

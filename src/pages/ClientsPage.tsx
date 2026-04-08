import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Search, Plus, Users, Phone, X, Loader2, AlertCircle,
  Pencil, Trash2, ChevronDown, ChevronUp, Building2, Bell,
  ArrowUp, ArrowDown, List, GitMerge, ClipboardList, Bookmark,
  ShoppingCart, ArrowRight, MessageSquare, Copy, Check,
  ToggleLeft, ToggleRight, LayoutGrid,
} from 'lucide-react'
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from '@/hooks/useClients'
import { useActiveTaskCounts } from '@/hooks/useTasks'
import { useDemands, useCreateDemand, useUpdateDemand } from '@/hooks/useDemands'
import { usePropertiesByOwner } from '@/hooks/useProperties'
import { useDealsByClient } from '@/hooks/useDeals'
import { useCustomStatuses } from '@/hooks/useCustomStatuses'
import { useSavedFilters, useCreateSavedFilter } from '@/hooks/useSavedFilters'
import { useTemplates } from '@/hooks/useTemplates'
import { useComplexes } from '@/hooks/useComplexes'
import Timeline from '@/components/timeline/Timeline'
import SalesFunnel from '@/components/clients/SalesFunnel'
import LinkedTasksSection from '@/components/tasks/LinkedTasksSection'
import type { Client, ClientFormData, Demand, DemandFormData } from '@/types'
import {
  CLIENT_STATUSES, CLIENT_PRIORITIES, CLIENT_STATUS_COLORS, CLIENT_STATUS_PRIORITY,
  CLIENT_TYPES, CLIENT_TYPE_ICONS, CLIENT_TYPE_COLORS,
  BUYER_STATUSES, SELLER_STATUSES,
  PROPERTY_TYPE_LABELS, PROPERTY_TYPE_ICONS,
  DEAL_STATUSES, FUNNEL_STAGES,
  DEMAND_PROPERTY_GROUPS, DEMAND_PAYMENT_TYPES, DEMAND_MARKET_TYPES,
  getDemandCategory,
  getClientTypes, isClientActive, isBuyerTenantActive, getClientTemplateCategories,
} from '@/types'
import { formatPrice, formatPhone, maskPhone } from '@/utils/format'
import { cn } from '@/utils/cn'
import { getOptionsWithDeletions } from '@/lib/customOptions'
import Modal from '@/components/ui/Modal'
import toast from 'react-hot-toast'

// ─── Overdue Contact Banner ───────────────────────────────────────────────────

function OverdueBanner({ clients }: { clients: Client[] }) {
  const today = new Date().toISOString().slice(0, 10)
  const overdue = clients.filter(
    (c) =>
      c.next_contact &&
      c.next_contact <= today &&
      c.status !== 'Архив' &&
      c.status !== 'Сделка' &&
      c.status !== 'Неактивный' &&
      c.seller_status !== 'Неактивный'
  )
  if (overdue.length === 0) return null
  return (
    <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        <Bell size={15} className="text-amber-600" />
        <p className="text-sm font-semibold text-amber-800">Нужно связаться ({overdue.length})</p>
      </div>
      <div className="space-y-1.5">
        {overdue.map((c) => (
          <div key={c.id} className="flex items-start gap-2">
            <span className="text-xs font-medium text-amber-700 min-w-0 truncate">{c.name}</span>
            {c.next_step && <span className="text-xs text-amber-600 truncate">— {c.next_step}</span>}
            {c.next_contact && (
              <span className="text-xs text-amber-500 shrink-0 ml-auto">
                {c.next_contact === today ? 'сегодня' : `до ${c.next_contact}`}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Chip select helper ───────────────────────────────────────────────────────

function ChipSelect({
  label,
  options,
  value,
  onChange,
  colorActive = 'bg-blue-600 text-white border-blue-600',
}: {
  label: string
  options: { value: string; label: string }[]
  value: string[]
  onChange: (v: string[]) => void
  colorActive?: string
}) {
  const toggle = (v: string) =>
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])
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
                ? colorActive
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

// ─── Range Input ──────────────────────────────────────────────────────────────

function RangeInput({
  label,
  fromValue, toValue,
  onFromChange, onToChange,
  placeholderFrom = 'от', placeholderTo = 'до',
}: {
  label: string
  fromValue: number | undefined
  toValue: number | undefined
  onFromChange: (v: number | undefined) => void
  onToChange: (v: number | undefined) => void
  placeholderFrom?: string
  placeholderTo?: string
}) {
  return (
    <div className="min-w-0">
      <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
      <div className="flex gap-2 items-center min-w-0">
        <input
          type="number"
          inputMode="numeric"
          value={fromValue ?? ''}
          onChange={(e) => onFromChange(e.target.value === '' ? undefined : Number(e.target.value))}
          placeholder={placeholderFrom}
          className="min-w-0 flex-1 w-0 px-2.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-slate-400 text-sm shrink-0">—</span>
        <input
          type="number"
          inputMode="numeric"
          value={toValue ?? ''}
          onChange={(e) => onToChange(e.target.value === '' ? undefined : Number(e.target.value))}
          placeholder={placeholderTo}
          className="min-w-0 flex-1 w-0 px-2.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  )
}

// ─── Popup Chip Select (opens a bottom-sheet style popup) ─────────────────────

function PopupChipSelect({
  label,
  options,
  value,
  onChange,
  colorActive = 'bg-blue-600 text-white border-blue-600',
  searchable = false,
  buttonVariant = 'default',
}: {
  label: string
  options: { value: string; label: string }[]
  value: string[]
  onChange: (v: string[]) => void
  colorActive?: string
  searchable?: boolean
  buttonVariant?: 'default' | 'violet'
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const toggle = (v: string) =>
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])
  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options

  const btnColor = buttonVariant === 'violet'
    ? 'border-violet-200 text-violet-700 bg-violet-50 hover:bg-violet-100'
    : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50'

  return (
    <div className="relative">
      <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`w-full flex items-center justify-between px-3 py-2 border rounded-lg text-sm transition-colors ${btnColor}`}
      >
        <span className="truncate">
          {value.length === 0
            ? <span className="text-slate-400">Выбрать...</span>
            : <span className="font-medium">{value.slice(0, 3).join(', ')}{value.length > 3 ? ` +${value.length - 3}` : ''}</span>
          }
        </span>
        <ChevronDown size={14} className="text-slate-400 shrink-0 ml-1" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-lg bg-white rounded-t-2xl shadow-2xl border border-slate-100 p-4 pb-8 max-h-[60vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-800">{label}</p>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
            {searchable && (
              <div className="relative mb-3">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Поиск..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            )}
            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-wrap gap-2">
                {filtered.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => toggle(o.value)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                      value.includes(o.value) ? colorActive : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'
                    )}
                  >
                    {o.label}
                  </button>
                ))}
                {filtered.length === 0 && <p className="text-sm text-slate-400 py-4 w-full text-center">Ничего не найдено</p>}
              </div>
            </div>
            {value.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="mt-3 text-xs text-slate-400 hover:text-red-500 transition-colors"
              >
                Сбросить всё
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Active Toggle ────────────────────────────────────────────────────────────

function ActiveToggle({
  label,
  value,
  onChange,
}: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
        value
          ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
      )}
    >
      {value
        ? <ToggleRight size={14} className="text-emerald-600" />
        : <ToggleLeft size={14} className="text-slate-400" />}
      {label}: {value ? 'Активно' : 'Неактивно'}
    </button>
  )
}

// ─── Client Form ──────────────────────────────────────────────────────────────

function ClientForm({
  initial,
  initialDemand,
  complexes,
  onSave,
  onCancel,
  isSubmitting,
}: {
  initial?: Partial<ClientFormData>
  initialDemand?: Demand | null
  complexes: { id: string; name: string }[]
  onSave: (clientData: ClientFormData, demandData?: Partial<DemandFormData>) => void
  onCancel: () => void
  isSubmitting: boolean
}) {
  const districts = getOptionsWithDeletions('crm_districts')
  const renovationOptions = getOptionsWithDeletions('crm_renovation')

  const initialTypes = useMemo(() => {
    if (initial?.client_types && initial.client_types.length > 0) return initial.client_types
    if (initial?.client_type) return [initial.client_type]
    return []
  }, [initial])

  const [selectedTypes, setSelectedTypes] = useState<string[]>(initialTypes)

  // Buyer/tenant demand state
  const [demandPropTypes, setDemandPropTypes] = useState<string[]>(initialDemand?.property_types ?? [])
  const [demandDistricts, setDemandDistricts] = useState<string[]>(initialDemand?.districts ?? [])
  const [demandPaymentTypes, setDemandPaymentTypes] = useState<string[]>(initialDemand?.payment_types ?? [])
  const [demandComplexIds, setDemandComplexIds] = useState<string[]>(initialDemand?.complex_ids ?? [])
  const [demandRenovation, setDemandRenovation] = useState<string[]>(initialDemand?.renovation ?? [])
  const [demandBudgetMin, setDemandBudgetMin] = useState<number | undefined>(initialDemand?.budget_min)
  const [demandBudgetMax, setDemandBudgetMax] = useState<number | undefined>(initialDemand?.budget_max)
  const [demandFloorMin, setDemandFloorMin] = useState<number | undefined>(initialDemand?.floor_min)
  const [demandFloorMax, setDemandFloorMax] = useState<number | undefined>(initialDemand?.floor_max)
  const [demandAreaMin, setDemandAreaMin] = useState<number | undefined>(initialDemand?.area_min)
  const [demandAreaMax, setDemandAreaMax] = useState<number | undefined>(initialDemand?.area_max)
  const [demandAreaSotkiMin, setDemandAreaSotkiMin] = useState<number | undefined>(initialDemand?.area_sotki_min)
  const [demandAreaSotkiMax, setDemandAreaSotkiMax] = useState<number | undefined>(initialDemand?.area_sotki_max)
  const [demandMarketType, setDemandMarketType] = useState<string>(initialDemand?.market_type ?? 'any')
  const [demandFunnelStage, setDemandFunnelStage] = useState<string>(initialDemand?.funnel_stage ?? 'new')
  const [demandNotes, setDemandNotes] = useState<string>(initialDemand?.notes ?? '')

  // Seller active state
  const [sellerActive, setSellerActive] = useState<boolean>(
    initial?.seller_status !== 'Неактивный'
  )
  // Buyer active state
  const [buyerActive, setBuyerActive] = useState<boolean>(initial?.is_active !== false)

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<ClientFormData>({
    defaultValues: {
      ...initial,
      client_types: initialTypes,
      is_active: initial?.is_active !== false,
      seller_status: initial?.seller_status ?? 'Активный',
      status: initial?.status ?? '',
    },
  })

  const currentStatus = watch('status') ?? ''

  const isSeller   = selectedTypes.includes('Продавец')
  const isBuyer    = selectedTypes.includes('Покупатель')
  const isLandlord = selectedTypes.includes('Арендодатель')
  const isTenant   = selectedTypes.includes('Арендатор')
  const isBuyerOrTenant    = isBuyer || isTenant
  const isSellerOrLandlord = isSeller || isLandlord
  const isMixed = isBuyerOrTenant && isSellerOrLandlord

  const demandCategory = getDemandCategory(demandPropTypes)
  const showApartmentFields = demandCategory === 'apartment' || demandCategory === 'mixed' || demandCategory === 'none'
  const showHouseFields     = demandCategory === 'house'     || demandCategory === 'mixed'
  const showLandFields      = demandCategory === 'land'      || demandCategory === 'mixed'
  const showCommercialFields = demandCategory === 'commercial' || demandCategory === 'mixed'
  const showFloor     = showApartmentFields || showCommercialFields
  const showMarketType = showApartmentFields
  const showComplexes = (showApartmentFields || showCommercialFields) && complexes.length > 0

  const toggleType = (type: string) => {
    setSelectedTypes((prev) => {
      const next = prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
      setValue('client_types', next)
      setValue('client_type', next[0] ?? '')
      return next
    })
  }

  const onSubmit = (data: ClientFormData) => {
    const clientData: ClientFormData = {
      ...data,
      client_types: selectedTypes,
      client_type: selectedTypes[0] ?? data.client_type,
      seller_status: isSellerOrLandlord ? (sellerActive ? 'Активный' : 'Неактивный') : undefined,
      is_active: isBuyerOrTenant ? buyerActive : undefined,
    }

    let demandData: Partial<DemandFormData> | undefined
    if (isBuyerOrTenant) {
      demandData = {
        property_types: demandPropTypes,
        districts: demandDistricts,
        payment_types: demandPaymentTypes,
        complex_ids: demandComplexIds,
        renovation: demandRenovation,
        budget_min: demandBudgetMin,
        budget_max: demandBudgetMax,
        floor_min: demandFloorMin,
        floor_max: demandFloorMax,
        area_min: demandAreaMin,
        area_max: demandAreaMax,
        area_sotki_min: demandAreaSotkiMin,
        area_sotki_max: demandAreaSotkiMax,
        market_type: demandMarketType,
        funnel_stage: demandFunnelStage as any,
        notes: demandNotes,
        status: 'active',
      }
    }

    onSave(clientData, demandData)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col max-h-[90vh]">
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4">

        {/* Basic */}
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Имя <span className="text-red-500">*</span>
            </label>
            <input
              {...register('name', { required: 'Укажите имя' })}
              placeholder="Иван Петров"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Телефон</label>
            <input
              {...register('phone')}
              placeholder="+79001234567"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Request field (for all clients) */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Запрос / пожелания</label>
          <textarea
            {...register('request')}
            rows={2}
            placeholder="Что ищет клиент, особые пожелания..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Type chips */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Тип клиента</label>
          <div className="flex flex-wrap gap-2">
            {CLIENT_TYPES.map((t) => {
              const active = selectedTypes.includes(t)
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleType(t)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                    active
                      ? 'border-blue-400 bg-blue-50 text-blue-700 shadow-sm'
                      : 'border-slate-200 text-slate-600 bg-white hover:border-slate-300 hover:bg-slate-50'
                  )}
                >
                  <span>{CLIENT_TYPE_ICONS[t]}</span>
                  {t}
                  {active && <Check size={11} className="text-blue-500" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Seller / Landlord block ── */}
        {isSellerOrLandlord && (
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-emerald-700">
                {isSeller && isLandlord ? '🏠🔑 Как продавец/арендодатель' : isSeller ? '🏠 Как продавец' : '🔑 Как арендодатель'}
              </p>
              <ActiveToggle label="Статус" value={sellerActive} onChange={setSellerActive} />
            </div>

            {isSeller && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Цена на руки (₽)</label>
                <input
                  type="number"
                  {...register('price_net', { valueAsNumber: true })}
                  placeholder="4 500 000"
                  className="w-full px-3 py-2 border border-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
                <p className="text-xs text-slate-400 mt-1">Сумма, которую хочет получить после всех комиссий</p>
              </div>
            )}

            {isLandlord && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Аренда/мес (₽)</label>
                    <input
                      type="number"
                      {...register('rental_price', { valueAsNumber: true })}
                      placeholder="35 000"
                      className="w-full px-3 py-2 border border-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Залог (₽)</label>
                    <input
                      type="number"
                      {...register('rental_deposit', { valueAsNumber: true })}
                      placeholder="35 000"
                      className="w-full px-3 py-2 border border-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Коммунальные</label>
                  <select
                    {...register('rental_utilities')}
                    className="w-full px-3 py-2 border border-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">— не указано —</option>
                    <option value="included">Включены в стоимость</option>
                    <option value="separate">Оплачиваются отдельно</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Buyer / Tenant block ── */}
        {isBuyerOrTenant && (
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-blue-700">
                {isBuyer && isTenant ? '🛒🏡 Как покупатель/арендатор' : isBuyer ? '🛒 Как покупатель' : '🏡 Как арендатор'}
              </p>
              <ActiveToggle label="Статус" value={buyerActive} onChange={setBuyerActive} />
            </div>

            {/* Temperature status */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Температура лида</label>
              <div className="flex flex-wrap gap-2">
                {BUYER_STATUSES.map((s) => {
                  const colorMap: Record<string, string> = {
                    'Горячий':   'border-red-300 bg-red-50 text-red-700',
                    'Теплый':    'border-orange-300 bg-orange-50 text-orange-700',
                    'Холодный':  'border-blue-300 bg-blue-50 text-blue-700',
                    'Воздухан':  'border-slate-300 bg-slate-100 text-slate-500',
                  }
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setValue('status', currentStatus === s ? '' : s)}
                      className={cn(
                        'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                        currentStatus === s ? colorMap[s] : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      )}
                    >
                      {CLIENT_STATUS_PRIORITY[s]?.split(' ')[0]} {s}
                      {currentStatus === s && <Check size={11} />}
                    </button>
                  )
                })}
              </div>
            </div>

            <hr className="border-blue-100" />

            {/* Market type FIRST (above property types) */}
            {showMarketType && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Рынок</label>
                <div className="flex flex-wrap gap-2">
                  {DEMAND_MARKET_TYPES.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setDemandMarketType(demandMarketType === m.value ? 'any' : m.value)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                        demandMarketType === m.value
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'
                      )}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                {/* Sub-options when Новостройка selected */}
                {(demandMarketType === 'primary' || demandMarketType === 'primary_ready' || demandMarketType === 'primary_unready') && (
                  <div className="mt-2 flex flex-wrap gap-2 pl-2">
                    {[
                      { value: 'primary_ready',   label: 'Сданный дом'    },
                      { value: 'primary_unready',  label: 'Не сданный дом' },
                    ].map((sub) => (
                      <button
                        key={sub.value}
                        type="button"
                        onClick={() => setDemandMarketType(demandMarketType === sub.value ? 'primary' : sub.value)}
                        className={cn(
                          'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                          demandMarketType === sub.value
                            ? 'bg-blue-100 text-blue-700 border-blue-300'
                            : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'
                        )}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Property types */}
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
                          onClick={() =>
                            setDemandPropTypes((prev) =>
                              prev.includes(o.value) ? prev.filter((x) => x !== o.value) : [...prev, o.value]
                            )
                          }
                          className={cn(
                            'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                            demandPropTypes.includes(o.value)
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

            {/* Budget */}
            <RangeInput
              label="Бюджет (₽)"
              fromValue={demandBudgetMin}
              toValue={demandBudgetMax}
              onFromChange={setDemandBudgetMin}
              onToChange={setDemandBudgetMax}
              placeholderFrom="от"
              placeholderTo="до"
            />

            {/* Floor */}
            {showFloor && (
              <RangeInput
                label="Этаж"
                fromValue={demandFloorMin}
                toValue={demandFloorMax}
                onFromChange={setDemandFloorMin}
                onToChange={setDemandFloorMax}
              />
            )}

            {/* Area m² */}
            {(showApartmentFields || showHouseFields || showCommercialFields) && (
              <RangeInput
                label="Площадь (м²)"
                fromValue={demandAreaMin}
                toValue={demandAreaMax}
                onFromChange={setDemandAreaMin}
                onToChange={setDemandAreaMax}
              />
            )}

            {/* Land area */}
            {(showHouseFields || showLandFields) && (
              <RangeInput
                label="Площадь участка (сот.)"
                fromValue={demandAreaSotkiMin}
                toValue={demandAreaSotkiMax}
                onFromChange={setDemandAreaSotkiMin}
                onToChange={setDemandAreaSotkiMax}
              />
            )}

            {/* Payment types — popup */}
            <PopupChipSelect
              label="Форма оплаты"
              options={DEMAND_PAYMENT_TYPES}
              value={demandPaymentTypes}
              onChange={setDemandPaymentTypes}
            />

            {/* Districts — popup with search */}
            {districts.length > 0 && (
              <PopupChipSelect
                label="Районы"
                options={districts.map((d) => ({ value: d, label: d }))}
                value={demandDistricts}
                onChange={setDemandDistricts}
                searchable
              />
            )}

            {/* Complexes — popup with search */}
            {showComplexes && (
              <PopupChipSelect
                label="ЖК (интересующие)"
                options={complexes.map((cx) => ({ value: cx.id, label: cx.name }))}
                value={demandComplexIds}
                onChange={setDemandComplexIds}
                searchable
                colorActive="bg-violet-600 text-white border-violet-600"
                buttonVariant="violet"
              />
            )}

            {/* Renovation — popup */}
            {(showApartmentFields || showHouseFields) && renovationOptions.length > 0 && (
              <PopupChipSelect
                label="Ремонт"
                options={renovationOptions.map((r) => ({ value: r, label: r }))}
                value={demandRenovation}
                onChange={setDemandRenovation}
              />
            )}

            {/* Funnel stage */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Этап воронки</label>
              <select
                value={demandFunnelStage}
                onChange={(e) => setDemandFunnelStage(e.target.value)}
                className="w-full px-3 py-2 border border-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {FUNNEL_STAGES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Buyer notes */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Примечания к спросу</label>
              <textarea
                value={demandNotes}
                onChange={(e) => setDemandNotes(e.target.value)}
                rows={2}
                placeholder="Дополнительные пожелания..."
                className="w-full px-3 py-2 border border-white rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>
        )}

        {/* Contact dates (for all types) */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Первый контакт</label>
            <input
              type="date"
              {...register('first_contact')}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Последний контакт</label>
            <input
              type="date"
              {...register('last_contact')}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Следующий контакт</label>
            <input
              type="date"
              {...register('next_contact')}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Следующий шаг</label>
          <input
            {...register('next_step')}
            placeholder="Скинуть подборку, дожать..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Priority (only for non-seller-only clients) */}
        {!isSellerOrLandlord || isBuyerOrTenant ? (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Приоритет</label>
            <select
              {...register('priority')}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— не указан —</option>
              {CLIENT_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        ) : null}

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Заметки</label>
          <textarea
            {...register('notes')}
            rows={2}
            placeholder="Любые заметки..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex gap-3 px-4 py-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Отмена
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 py-2.5 rounded-xl bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 size={15} className="animate-spin" />}
          Сохранить
        </button>
      </div>
    </form>
  )
}

// ─── Client Properties mini-list ──────────────────────────────────────────────

function ClientProperties({ clientId }: { clientId: string }) {
  const navigate = useNavigate()
  const { data: props = [], isLoading } = usePropertiesByOwner(clientId)
  if (isLoading) return <p className="text-xs text-slate-400">Загрузка...</p>
  if (props.length === 0) return <p className="text-xs text-slate-400">Объектов нет</p>
  return (
    <div className="space-y-1.5">
      {props.map((p) => (
        <button
          key={p.id}
          onClick={(e) => { e.stopPropagation(); navigate(`/properties?open=${p.id}`) }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all text-left group"
        >
          <span className="text-base">{PROPERTY_TYPE_ICONS[p.type]}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-800 truncate group-hover:text-blue-700">
              {PROPERTY_TYPE_LABELS[p.type]}{p.rooms ? ` ${p.rooms}-комн.` : ''}{p.address ? ` · ${p.address}` : ''}
            </p>
            <p className="text-xs text-slate-400">{formatPrice(p.price)} · {p.area} м²</p>
          </div>
          <span className="text-xs font-mono text-slate-300">{p.article}</span>
        </button>
      ))}
    </div>
  )
}

// ─── Client Deals ─────────────────────────────────────────────────────────────

function ClientDealsSection({ clientId }: { clientId: string }) {
  const navigate = useNavigate()
  const { data: deals = [], isLoading } = useDealsByClient(clientId)
  if (isLoading || deals.length === 0) return null
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm">🤝</span>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Сделки</p>
      </div>
      <div className="space-y-1.5">
        {deals.map((d) => {
          const sm = DEAL_STATUSES.find((s) => s.value === d.status)
          return (
            <button
              key={d.id}
              onClick={(e) => { e.stopPropagation(); navigate(`/deals?open=${d.id}`) }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all text-left group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-800 truncate group-hover:text-emerald-700">
                  #{d.deal_number} {d.title || 'Сделка'}{d.deal_date ? ` · ${d.deal_date}` : ''}
                </p>
                <div className="flex items-center gap-2">
                  {sm && <span className={cn('text-xs font-medium px-1.5 rounded', sm.color)}>{sm.label}</span>}
                  {d.commission != null && d.commission > 0 && (
                    <span className="text-xs text-emerald-600 font-medium">{(d.commission / 1000).toFixed(0)}k ₽</span>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Client Templates Section ─────────────────────────────────────────────────

function ClientTemplatesSection({ client }: { client: Client }) {
  const { data: allTemplates = [] } = useTemplates()
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const categories = getClientTemplateCategories(client)
  if (categories.length === 0) return null
  const templates = allTemplates.filter((t) => categories.includes(t.category))
  if (templates.length === 0) return null
  const handleCopy = (id: string, body: string) => {
    navigator.clipboard.writeText(body).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1500)
    })
  }
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare size={13} className="text-slate-400" />
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Шаблоны</p>
      </div>
      <div className="space-y-1.5">
        {templates.map((t) => (
          <div key={t.id} className="flex items-start gap-2 px-3 py-2 bg-white border border-slate-100 rounded-lg">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-800">{t.title}</p>
              <p className="text-xs text-slate-400 truncate mt-0.5">{t.body.slice(0, 80)}{t.body.length > 80 ? '…' : ''}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleCopy(t.id, t.body) }}
              className={cn(
                'shrink-0 flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all',
                copiedId === t.id ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600'
              )}
            >
              {copiedId === t.id ? <Check size={11} /> : <Copy size={11} />}
              {copiedId === t.id ? 'Скопировано' : 'Копировать'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── iOS Activity Toggle ──────────────────────────────────────────────────────

function IOSToggle({
  isActive,
  onToggle,
}: {
  isActive: boolean
  onToggle: (e: React.MouseEvent) => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'relative inline-flex h-[22px] w-[40px] shrink-0 cursor-pointer rounded-full border-2 border-transparent',
        'transition-colors duration-200 ease-in-out focus:outline-none active:scale-95',
        isActive ? 'bg-emerald-500' : 'bg-slate-300'
      )}
      role="switch"
      aria-checked={isActive}
    >
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none inline-block h-[18px] w-[18px] rounded-full bg-white shadow ring-0',
          'transition-transform duration-200 ease-in-out',
          isActive ? 'translate-x-[18px]' : 'translate-x-0'
        )}
      />
    </button>
  )
}

// ─── Client Row ───────────────────────────────────────────────────────────────

function ClientRow({
  client,
  highlighted,
  onOpen,
  taskCount = 0,
  activeDemandCount = 0,
  twoCol = false,
}: {
  client: Client
  highlighted: boolean
  onOpen: (c: Client) => void
  taskCount?: number
  activeDemandCount?: number
  twoCol?: boolean
}) {
  const rowRef = useRef<HTMLDivElement>(null)
  const updateClient = useUpdateClient()

  const today = new Date().toISOString().slice(0, 10)
  const isOverdue =
    client.next_contact &&
    client.next_contact <= today &&
    client.status !== 'Архив' &&
    client.status !== 'Неактивный' &&
    client.seller_status !== 'Неактивный'

  const types = getClientTypes(client)
  const clientIsActive = isClientActive(client)

  useEffect(() => {
    if (highlighted && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlighted])

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    const isSL = types.includes('Продавец') || types.includes('Арендодатель')
    const isBT = types.includes('Покупатель') || types.includes('Арендатор')
    if (isSL && !isBT) {
      const nowActive = client.seller_status !== 'Неактивный'
      updateClient.mutate({ id: client.id, data: { seller_status: nowActive ? 'Неактивный' : 'Активный' } })
    } else if (isBT) {
      updateClient.mutate({ id: client.id, data: { is_active: client.is_active === false } })
    } else {
      const nowActive = client.status !== 'Неактивный' && client.status !== 'Архив'
      updateClient.mutate({ id: client.id, data: { status: nowActive ? 'Неактивный' : '' } })
    }
  }

  return (
    <div
      ref={rowRef}
      className={cn(
        'bg-white rounded-xl border overflow-hidden transition-all cursor-pointer select-none',
        'hover:shadow-sm hover:border-slate-200 active:scale-[0.99]',
        !clientIsActive ? 'opacity-65' : '',
        highlighted ? 'border-blue-400 shadow-sm shadow-blue-100' :
        isOverdue ? 'border-amber-300' : 'border-slate-100'
      )}
      onClick={() => onOpen(client)}
    >
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        {/* Number avatar */}
        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
          <span className="text-[10px] font-bold text-blue-600">#{client.client_number}</span>
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-0.5">
            <span className="text-sm font-semibold text-slate-900 truncate">{client.name}</span>
            {isOverdue && <span className="shrink-0 text-[11px]">⏰</span>}
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {types.map((t) => (
              <span
                key={t}
                className={cn(
                  'text-[10px] font-medium px-1.5 py-0.5 rounded-md whitespace-nowrap',
                  CLIENT_TYPE_COLORS[t] ?? 'bg-slate-100 text-slate-600'
                )}
              >
                {twoCol ? CLIENT_TYPE_ICONS[t] : `${CLIENT_TYPE_ICONS[t]} ${t}`}
              </span>
            ))}
            {client.status && CLIENT_STATUS_COLORS[client.status] && (
              <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap', CLIENT_STATUS_COLORS[client.status])}>
                {client.status}
              </span>
            )}
          </div>
        </div>

        {/* Right: iOS toggle + task/demand badges */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <IOSToggle isActive={clientIsActive} onToggle={handleToggle} />
          {(activeDemandCount > 0 || taskCount > 0) && (
            <div className="flex items-center gap-1">
              {activeDemandCount > 0 && (
                <span className="flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                  <ShoppingCart size={9} />{activeDemandCount}
                </span>
              )}
              {taskCount > 0 && (
                <span className="flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                  <ClipboardList size={9} />{taskCount}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Client Detail Modal ───────────────────────────────────────────────────────

function ClientDetailModal({
  client,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: {
  client: Client | null
  isOpen: boolean
  onClose: () => void
  onEdit: (c: Client) => void
  onDelete: (c: Client) => void
}) {
  const [phoneRevealed, setPhoneRevealed] = useState(false)
  const updateClient = useUpdateClient()

  useEffect(() => {
    if (!isOpen) setPhoneRevealed(false)
  }, [isOpen])

  if (!client) return null

  const today = new Date().toISOString().slice(0, 10)
  const isOverdue =
    client.next_contact &&
    client.next_contact <= today &&
    client.status !== 'Архив' &&
    client.status !== 'Неактивный' &&
    client.seller_status !== 'Неактивный'

  const types = getClientTypes(client)
  const clientIsActive = isClientActive(client)

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    const isSL = types.includes('Продавец') || types.includes('Арендодатель')
    const isBT = types.includes('Покупатель') || types.includes('Арендатор')
    if (isSL && !isBT) {
      const nowActive = client.seller_status !== 'Неактивный'
      updateClient.mutate({ id: client.id, data: { seller_status: nowActive ? 'Неактивный' : 'Активный' } })
    } else if (isBT) {
      updateClient.mutate({ id: client.id, data: { is_active: client.is_active === false } })
    } else {
      const nowActive = client.status !== 'Неактивный' && client.status !== 'Архив'
      updateClient.mutate({ id: client.id, data: { status: nowActive ? 'Неактивный' : '' } })
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={client.name} size="lg">
      <div className="px-5 pb-6 space-y-4 pt-3">
        {/* Header: number + types + status + active toggle */}
        <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-blue-600">#{client.client_number}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              {types.map((t) => (
                <span key={t} className={cn('text-xs font-medium px-2 py-0.5 rounded-md', CLIENT_TYPE_COLORS[t] ?? 'bg-slate-100 text-slate-600')}>
                  {CLIENT_TYPE_ICONS[t]} {t}
                </span>
              ))}
              {client.status && CLIENT_STATUS_COLORS[client.status] && (
                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', CLIENT_STATUS_COLORS[client.status])}>
                  {client.status}
                </span>
              )}
              {isOverdue && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">⏰ Контакт</span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 shrink-0">
            <IOSToggle isActive={clientIsActive} onToggle={handleToggle} />
            <span className="text-[10px] text-slate-400">{clientIsActive ? 'Активный' : 'Неактивный'}</span>
          </div>
        </div>

        {/* Contact info */}
        <div className="grid grid-cols-2 gap-3">
          {client.phone && (
            <div className="col-span-2">
              <p className="text-xs text-slate-400 mb-1">Телефон</p>
              <div className="flex items-center gap-2">
                <Phone size={13} className="text-slate-400 shrink-0" />
                <span className="text-sm font-mono text-slate-700">
                  {phoneRevealed ? formatPhone(client.phone) : maskPhone(client.phone)}
                </span>
                <button
                  onClick={() => setPhoneRevealed(v => !v)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  {phoneRevealed ? 'Скрыть' : 'Показать'}
                </button>
              </div>
            </div>
          )}
          {client.first_contact && (
            <div>
              <p className="text-xs text-slate-400 mb-1">Первый контакт</p>
              <p className="text-sm text-slate-700">{client.first_contact}</p>
            </div>
          )}
          {client.last_contact && (
            <div>
              <p className="text-xs text-slate-400 mb-1">Последний контакт</p>
              <p className="text-sm text-slate-700">{client.last_contact}</p>
            </div>
          )}
          {client.next_contact && (
            <div>
              <p className="text-xs text-slate-400 mb-1">Следующий контакт</p>
              <p className={cn('text-sm font-medium', isOverdue ? 'text-amber-600' : 'text-slate-700')}>
                {isOverdue ? '⏰ ' : ''}{client.next_contact}
              </p>
            </div>
          )}
        </div>

        {/* Seller info */}
        {types.includes('Продавец') && client.price_net != null && client.price_net > 0 && (
          <div className="bg-emerald-50 rounded-lg px-3 py-2">
            <p className="text-xs text-emerald-600 font-medium mb-0.5">Цена на руки</p>
            <p className="text-sm font-semibold text-emerald-800">{formatPrice(client.price_net)}</p>
          </div>
        )}

        {/* Landlord info */}
        {types.includes('Арендодатель') && (client.rental_price || client.rental_deposit || client.rental_utilities) && (
          <div className="bg-amber-50 rounded-lg px-3 py-2 space-y-1">
            <p className="text-xs text-amber-700 font-medium mb-1">Условия аренды</p>
            {client.rental_price != null && client.rental_price > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Аренда/мес</span>
                <span className="font-medium text-slate-800">{formatPrice(client.rental_price)}</span>
              </div>
            )}
            {client.rental_deposit != null && client.rental_deposit > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Залог</span>
                <span className="font-medium text-slate-800">{formatPrice(client.rental_deposit)}</span>
              </div>
            )}
            {client.rental_utilities && (
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Коммунальные</span>
                <span className="font-medium text-slate-800">
                  {client.rental_utilities === 'included' ? 'Включены' : 'Отдельно'}
                </span>
              </div>
            )}
          </div>
        )}

        {client.status && CLIENT_STATUS_PRIORITY[client.status] && (
          <div className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
            {CLIENT_STATUS_PRIORITY[client.status]}
          </div>
        )}

        {client.request && (
          <div>
            <p className="text-xs text-slate-400 mb-1">Запрос</p>
            <p className="text-sm text-slate-700 leading-relaxed">{client.request}</p>
          </div>
        )}

        {client.next_step && (
          <div className="bg-amber-50 rounded-lg px-3 py-2">
            <p className="text-xs text-amber-600 font-medium mb-0.5">Следующий шаг</p>
            <p className="text-sm text-amber-800">{client.next_step}</p>
          </div>
        )}

        {client.notes && (
          <div>
            <p className="text-xs text-slate-400 mb-1">Заметки</p>
            <p className="text-sm text-slate-600">{client.notes}</p>
          </div>
        )}

        {/* Objects (sellers/landlords) */}
        {(types.includes('Продавец') || types.includes('Арендодатель') || types.length === 0) && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Building2 size={13} className="text-slate-400" />
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Объекты</p>
            </div>
            <ClientProperties clientId={client.id} />
          </div>
        )}

        <ClientDealsSection clientId={client.id} />

        <div>
          <div className="flex items-center gap-2 mb-2">
            <ClipboardList size={13} className="text-slate-400" />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Задачи</p>
          </div>
          <LinkedTasksSection linkedType="client" linkedId={client.id} />
        </div>

        <div className="border-t border-slate-50 pt-3">
          <Timeline entityType="client" entityId={client.id} />
        </div>

        <ClientTemplatesSection client={client} />

        <div className="flex gap-2 pt-1">
          <button
            onClick={() => { onEdit(client); onClose() }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            <Pencil size={13} /> Редактировать
          </button>
          <button
            onClick={() => { onDelete(client); onClose() }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
          >
            <Trash2 size={13} /> Удалить
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Type Filter Tabs ─────────────────────────────────────────────────────────

const TYPE_TABS = [
  { value: '', label: 'Все' },
  { value: 'Покупатель', label: '🛒 Покупатели' },
  { value: 'Продавец', label: '🏠 Продавцы' },
  { value: 'Арендодатель', label: '🔑 Арендодатели' },
  { value: 'Арендатор', label: '🏡 Арендаторы' },
]

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ClientsPage() {
  const { data: clients = [], isLoading, error } = useClients()
  const taskCounts = useActiveTaskCounts()
  const { data: demands = [] } = useDemands()
  const { data: complexes = [] } = useComplexes()
  const createDemand = useCreateDemand()
  const updateDemand = useUpdateDemand()
  const navigate = useNavigate()
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()
  const deleteClient = useDeleteClient()
  const { data: customStatuses = [] } = useCustomStatuses()
  const { data: savedFilters = [] } = useSavedFilters('client')
  const createSavedFilter = useCreateSavedFilter()

  const [searchParams, setSearchParams] = useSearchParams()
  const highlightId = searchParams.get('highlight') ?? ''

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  // active filter: '' = all, 'active' = only active, 'inactive' = only inactive
  const [activeFilter, setActiveFilter] = useState<'' | 'active' | 'inactive'>('')
  const [sortBy, setSortBy] = useState<'client_number' | 'created_at' | 'updated_at' | 'last_contact'>('client_number')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [view, setView] = useState<'list' | 'funnel'>('list')
  const [twoCol, setTwoCol] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deletingClient, setDeletingClient] = useState<Client | null>(null)
  const [promptDemandClient, setPromptDemandClient] = useState<Client | null>(null)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const demandCounts = useMemo(() => {
    const m: Record<string, number> = {}
    demands.forEach((d) => {
      if (d.client_id && d.status !== 'archived') {
        m[d.client_id] = (m[d.client_id] ?? 0) + 1
      }
    })
    return m
  }, [demands])

  // Map clientId → active demand (for pre-filling buyer form)
  const clientDemandMap = useMemo(() => {
    const m: Record<string, Demand> = {}
    demands.forEach((d) => {
      if (d.client_id && d.status === 'active') {
        if (!m[d.client_id]) m[d.client_id] = d
      }
    })
    return m
  }, [demands])

  useEffect(() => {
    if (!highlightId) return
    const t = setTimeout(() => setSearchParams({}, { replace: true }), 3000)
    return () => clearTimeout(t)
  }, [highlightId, setSearchParams])

  const filtered = useMemo(() => {
    const list = clients.filter((c) => {
      if (typeFilter) {
        const types = getClientTypes(c)
        if (!types.includes(typeFilter)) return false
      }
      if (statusFilter && c.status !== statusFilter) return false
      if (activeFilter === 'active' && !isClientActive(c)) return false
      if (activeFilter === 'inactive' && isClientActive(c)) return false
      if (search) {
        const q = search.toLowerCase()
        const haystack = [c.name, c.phone, c.request, c.notes].filter(Boolean).join(' ').toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })

    list.sort((a, b) => {
      let va: string | number | null = null
      let vb: string | number | null = null
      if (sortBy === 'client_number') { va = a.client_number; vb = b.client_number }
      else if (sortBy === 'created_at') { va = a.created_at ?? ''; vb = b.created_at ?? '' }
      else if (sortBy === 'updated_at') { va = a.updated_at ?? ''; vb = b.updated_at ?? '' }
      else if (sortBy === 'last_contact') { va = a.last_contact ?? ''; vb = b.last_contact ?? '' }
      if (va === null || va === '') return sortDir === 'asc' ? 1 : -1
      if (vb === null || vb === '') return sortDir === 'asc' ? -1 : 1
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })

    return list
  }, [clients, search, typeFilter, statusFilter, activeFilter, sortBy, sortDir])

  const handleSave = async (data: ClientFormData, demandData?: Partial<DemandFormData>) => {
    try {
      const types = data.client_types ?? []
      const needsDemand = types.includes('Покупатель') || types.includes('Арендатор')

      if (editingClient) {
        await updateClient.mutateAsync({ id: editingClient.id, data })

        // Upsert demand for buyer/tenant
        if (needsDemand && demandData) {
          const existingDemand = clientDemandMap[editingClient.id]
          if (existingDemand) {
            await updateDemand.mutateAsync({ id: existingDemand.id, data: demandData as DemandFormData })
          } else {
            await createDemand.mutateAsync({
              ...demandData,
              title: `Спрос: ${data.name}`,
              client_id: editingClient.id,
              status: 'active',
            } as DemandFormData)
          }
        }

        toast.success('Клиент обновлён')
        setIsFormOpen(false)
        setEditingClient(null)
      } else {
        const newClient = await createClient.mutateAsync(data)
        toast.success('Клиент добавлен')
        setIsFormOpen(false)
        setEditingClient(null)

        if (needsDemand && newClient) {
          if (demandData && Object.keys(demandData).length > 1) {
            // Create demand with buyer params directly
            await createDemand.mutateAsync({
              ...demandData,
              title: `Спрос: ${data.name}`,
              client_id: (newClient as Client).id,
              status: 'active',
            } as DemandFormData)
          } else {
            // Prompt for quick demand creation
            setPromptDemandClient(newClient as Client)
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка при сохранении'
      console.error('[handleSave]', err)
      toast.error(msg)
    }
  }

  const handleDelete = async () => {
    if (!deletingClient) return
    try {
      await deleteClient.mutateAsync(deletingClient.id)
      toast.success('Клиент удалён')
      setDeletingClient(null)
    } catch {
      toast.error('Ошибка при удалении')
    }
  }

  const openEdit = useCallback((client: Client) => {
    setEditingClient(client)
    setIsFormOpen(true)
  }, [])

  const openDetail = useCallback((client: Client) => {
    setSelectedClient(client)
    setIsDetailOpen(true)
  }, [])

  // Auto-open detail modal when navigating with ?highlight=id
  useEffect(() => {
    if (!highlightId || isLoading || clients.length === 0) return
    const client = clients.find(c => c.id === highlightId)
    if (client) openDetail(client)
  }, [highlightId, clients, isLoading, openDetail])

  const typeCounts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const c of clients) {
      for (const t of getClientTypes(c)) {
        map[t] = (map[t] ?? 0) + 1
      }
    }
    return map
  }, [clients])

  const uniqueStatuses = useMemo(() =>
    [...new Set(clients.map((c) => c.status).filter(Boolean))] as string[], [clients]
  )

  const promptDemandType = promptDemandClient
    ? getClientTypes(promptDemandClient).includes('Арендатор') ? 'аренду' : 'покупку'
    : 'покупку'

  const editingDemand = editingClient ? (clientDemandMap[editingClient.id] ?? null) : null

  return (
    <div className="p-4 sm:p-6 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Клиенты</h1>
          <p className="text-sm text-slate-500 mt-0.5">{filtered.length} из {clients.length}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 rounded-xl p-1">
            <button
              onClick={() => setView('list')}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                view === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}
            >
              <List size={13} /> Список
            </button>
            <button
              onClick={() => setView('funnel')}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                view === 'funnel' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}
            >
              <GitMerge size={13} /> Воронка
            </button>
          </div>
          <button
            onClick={() => setTwoCol((v) => !v)}
            title={twoCol ? 'Одна колонка' : 'Две колонки'}
            className={cn(
              'p-2 rounded-xl border text-xs font-medium transition-all',
              twoCol ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
            )}
          >
            <LayoutGrid size={15} />
          </button>
          <button
            onClick={() => { setEditingClient(null); setIsFormOpen(true) }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} /> Добавить клиента
          </button>
        </div>
      </div>

      {!isLoading && <OverdueBanner clients={clients} />}

      {/* Type filter tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
        {TYPE_TABS.map((tab) => {
          const count = tab.value ? (typeCounts[tab.value] ?? 0) : clients.length
          return (
            <button
              key={tab.value}
              onClick={() => setTypeFilter(tab.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                typeFilter === tab.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'
              )}
            >
              {tab.label}
              {count > 0 && (
                <span className={cn('ml-1.5 text-xs', typeFilter === tab.value ? 'opacity-80' : 'text-slate-400')}>{count}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Active filter + search + status + sort */}
      <div className="flex flex-wrap gap-2 mb-5">
        {/* Active / Inactive filter */}
        <div className="flex items-center bg-white border border-slate-200 rounded-xl px-1 py-1">
          {([
            { value: '' as const, label: 'Все' },
            { value: 'active' as const, label: '🟢 Активные' },
            { value: 'inactive' as const, label: '⚫ Неактивные' },
          ]).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setActiveFilter(opt.value)}
              className={cn(
                'px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                activeFilter === opt.value ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Поиск..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="py-2.5 px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Все статусы</option>
          {(customStatuses.length > 0 ? customStatuses.map(s => s.name) : uniqueStatuses).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-1 py-1">
          {([
            { value: 'client_number', label: '№' },
            { value: 'created_at', label: 'Добавлен' },
            { value: 'updated_at', label: 'Обновлён' },
            { value: 'last_contact', label: 'Контакт' },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                if (sortBy === opt.value) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
                else { setSortBy(opt.value); setSortDir('asc') }
              }}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                sortBy === opt.value ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'
              )}
            >
              {opt.label}
              {sortBy === opt.value && (sortDir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
            </button>
          ))}
        </div>

        {(search || typeFilter || statusFilter || activeFilter) && (
          <button
            onClick={async () => {
              const name = window.prompt('Название фильтра:')
              if (!name?.trim()) return
              try {
                await createSavedFilter.mutateAsync({
                  name: name.trim(), entity_type: 'client',
                  filter_data: { search, typeFilter, statusFilter, activeFilter },
                  sort_order: savedFilters.length,
                })
                toast.success('Фильтр сохранён')
              } catch { toast.error('Ошибка') }
            }}
            className="flex items-center gap-1.5 py-2.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
          >
            <Bookmark size={13} /> Сохранить фильтр
          </button>
        )}
      </div>

      {/* Saved filters */}
      {savedFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {savedFilters.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setSearch(f.filter_data.search ?? '')
                setTypeFilter(f.filter_data.typeFilter ?? '')
                setStatusFilter(f.filter_data.statusFilter ?? '')
                setActiveFilter((f.filter_data.activeFilter ?? '') as '' | 'active' | 'inactive')
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all"
            >
              <Bookmark size={11} className="text-blue-400" /> {f.name}
            </button>
          ))}
          {(search || typeFilter || statusFilter || activeFilter) && (
            <button
              onClick={() => { setSearch(''); setTypeFilter(''); setStatusFilter(''); setActiveFilter('') }}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={11} /> Сбросить
            </button>
          )}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={24} className="animate-spin text-blue-500" />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl text-red-700 text-sm">
          <AlertCircle size={18} /> Ошибка загрузки клиентов.
        </div>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <Users size={40} className="text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">Клиенты не найдены</p>
          <p className="text-slate-400 text-sm mt-1">
            {clients.length === 0 ? 'Добавьте первого клиента' : 'Попробуйте изменить фильтры'}
          </p>
        </div>
      )}

      {!isLoading && view === 'funnel' && <SalesFunnel clients={filtered} />}

      {!isLoading && view === 'list' && filtered.length > 0 && (
        <div className={twoCol ? 'grid grid-cols-2 gap-2' : 'space-y-2'}>
          {filtered.map((client) => (
            <ClientRow
              key={client.id}
              client={client}
              highlighted={client.id === highlightId}
              onOpen={openDetail}
              taskCount={taskCounts[client.id] ?? 0}
              activeDemandCount={demandCounts[client.id] ?? 0}
              twoCol={twoCol}
            />
          ))}
        </div>
      )}

      {/* Client Detail Modal */}
      <ClientDetailModal
        client={selectedClient}
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setSelectedClient(null) }}
        onEdit={openEdit}
        onDelete={setDeletingClient}
      />

      {/* Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingClient(null) }}
        title={editingClient ? 'Редактировать клиента' : 'Новый клиент'}
        size="lg"
      >
        <ClientForm
          initial={editingClient ?? undefined}
          initialDemand={editingDemand}
          complexes={complexes}
          onSave={handleSave}
          onCancel={() => { setIsFormOpen(false); setEditingClient(null) }}
          isSubmitting={createClient.isPending || updateClient.isPending}
        />
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={!!deletingClient} onClose={() => setDeletingClient(null)} title="Удалить клиента?" size="sm">
        <div className="p-6">
          <p className="text-sm text-slate-600 mb-1">
            Клиент <span className="font-semibold text-slate-900">{deletingClient?.name}</span> будет удалён безвозвратно.
          </p>
          <p className="text-xs text-slate-400 mb-5">Связанные объекты останутся без изменений.</p>
          <div className="flex gap-3">
            <button onClick={() => setDeletingClient(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">Отмена</button>
            <button
              onClick={handleDelete}
              disabled={deleteClient.isPending}
              className="flex-1 py-2.5 rounded-xl bg-red-600 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {deleteClient.isPending && <Loader2 size={14} className="animate-spin" />} Удалить
            </button>
          </div>
        </div>
      </Modal>

      {/* Prompt demand modal */}
      <Modal isOpen={!!promptDemandClient} onClose={() => setPromptDemandClient(null)} title="Создать спрос?" size="sm">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingCart size={18} className="text-blue-500 shrink-0" />
            <p className="text-sm text-slate-700">
              <span className="font-semibold">{promptDemandClient?.name}</span> ищет недвижимость для <span className="font-medium">{promptDemandType}</span>. Создать спрос?
            </p>
          </div>
          <p className="text-xs text-slate-400 mb-5">Спрос позволит отслеживать требования, вести воронку и делать подборки.</p>
          <div className="flex gap-3">
            <button onClick={() => setPromptDemandClient(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">Позже</button>
            <button
              onClick={async () => {
                if (!promptDemandClient) return
                try {
                  await createDemand.mutateAsync({
                    title: `Спрос: ${promptDemandClient.name}`,
                    client_id: promptDemandClient.id,
                    funnel_stage: 'new',
                    status: 'active',
                  })
                  toast.success('Спрос создан')
                  setPromptDemandClient(null)
                  navigate('/demands')
                } catch { toast.error('Ошибка') }
              }}
              disabled={createDemand.isPending}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {createDemand.isPending ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
              Создать спрос
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

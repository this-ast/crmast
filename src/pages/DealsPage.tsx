import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import {
  Plus, HeartHandshake, Loader2, Search, X, Pencil, Trash2,
  ChevronDown, ChevronUp, User, Building2, Banknote, SplitSquareHorizontal,
  CalendarDays, FileText, TrendingUp,
} from 'lucide-react'
import { useDeals, useCreateDeal, useUpdateDeal, useDeleteDeal } from '@/hooks/useDeals'
import { useClients } from '@/hooks/useClients'
import { useProperties } from '@/hooks/useProperties'
import type { Deal, DealFormData } from '@/types'
import { DEAL_STATUSES, PAYMENT_METHODS, PROPERTY_TYPE_LABELS } from '@/types'
import { formatPrice } from '@/utils/format'
import { cn } from '@/utils/cn'
import Modal from '@/components/ui/Modal'
import toast from 'react-hot-toast'

// ─── Deal Form ────────────────────────────────────────────────────────────────

function DealForm({
  initial,
  onSave,
  onCancel,
  isSubmitting,
}: {
  initial?: Partial<DealFormData>
  onSave: (data: DealFormData) => void
  onCancel: () => void
  isSubmitting: boolean
}) {
  const { data: clients = [] } = useClients()
  const { data: properties = [] } = useProperties()
  const { register, handleSubmit, control, formState: { errors } } = useForm<DealFormData>({
    defaultValues: { status: 'active', ...initial },
  })

  return (
    <form onSubmit={handleSubmit(onSave)} className="flex flex-col max-h-[90vh]">
      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* Название */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Название сделки</label>
          <input
            {...register('title')}
            placeholder="Продажа квартиры на Ленина..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Дата + Статус */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Дата сделки</label>
            <input
              type="date"
              {...register('deal_date')}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Статус</label>
            <select
              {...register('status')}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {DEAL_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Покупатель + Продавец */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">🛒 Покупатель</label>
            <select
              {...register('buyer_id')}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— не выбран —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>#{c.client_number} {c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">🏠 Продавец</label>
            <select
              {...register('seller_id')}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— не выбран —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>#{c.client_number} {c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Объект */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">🏢 Объект недвижимости</label>
          <select
            {...register('property_id')}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— не выбран —</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.article} · {PROPERTY_TYPE_LABELS[p.type]}{p.address ? ` · ${p.address}` : ''} · {formatPrice(p.price)}
              </option>
            ))}
          </select>
        </div>

        {/* Форма оплаты */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Форма оплаты</label>
          <select
            {...register('payment_method')}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— не указана —</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Цена + Комиссия */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Цена сделки (₽)</label>
            <input
              type="number"
              {...register('deal_price', { valueAsNumber: true })}
              placeholder="5 000 000"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Моя комиссия (₽)</label>
            <input
              type="number"
              {...register('commission', { valueAsNumber: true })}
              placeholder="150 000"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Делился с */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">С кем делился комиссией</label>
          <textarea
            {...register('commission_split')}
            rows={2}
            placeholder="Иванов — 50 000 ₽, партнёр по сделке..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Заметки */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Заметки</label>
          <textarea
            {...register('notes')}
            rows={3}
            placeholder="Любые детали по сделке..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex gap-3 px-6 py-4 border-t border-slate-100">
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

// ─── Deal Card ────────────────────────────────────────────────────────────────

function DealCard({
  deal,
  defaultExpanded = false,
  onEdit,
  onDelete,
}: {
  deal: Deal
  defaultExpanded?: boolean
  onEdit: (d: Deal) => void
  onDelete: (d: Deal) => void
}) {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(defaultExpanded)
  const cardRef = useRef<HTMLDivElement>(null)
  const statusMeta = DEAL_STATUSES.find((s) => s.value === deal.status)

  useEffect(() => {
    if (defaultExpanded && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [defaultExpanded])

  return (
    <div
      ref={cardRef}
      className={cn(
        'bg-white rounded-xl border overflow-hidden transition-all',
        defaultExpanded ? 'border-blue-400 shadow-sm shadow-blue-100' : 'border-slate-100'
      )}
    >
      {/* Header row */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
          <HeartHandshake size={16} className="text-emerald-600" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-slate-400">#{deal.deal_number}</span>
            <span className="text-sm font-semibold text-slate-900 truncate">
              {deal.title || (deal.property ? `${PROPERTY_TYPE_LABELS[deal.property.type as keyof typeof PROPERTY_TYPE_LABELS]} · ${deal.property.address}` : 'Сделка')}
            </span>
            {statusMeta && (
              <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', statusMeta.color)}>
                {statusMeta.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            {deal.deal_date && (
              <span className="text-xs text-slate-400">{deal.deal_date}</span>
            )}
            {deal.payment_method && (
              <span className="text-xs text-slate-500">{deal.payment_method}</span>
            )}
            {deal.commission != null && deal.commission > 0 && (
              <span className="text-xs font-medium text-emerald-600">
                Комиссия: {formatPrice(deal.commission)}
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0">
          {expanded ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-50 space-y-4 pt-4">

          {/* Participants */}
          <div className="grid grid-cols-2 gap-3">
            {deal.buyer && (
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/clients?highlight=${deal.buyer!.id}`) }}
                className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-xl text-left hover:bg-blue-100 transition-colors group"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <User size={13} className="text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-blue-500 font-medium">Покупатель</p>
                  <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-blue-700">
                    #{deal.buyer.client_number} {deal.buyer.name}
                  </p>
                </div>
              </button>
            )}
            {deal.seller && (
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/clients?highlight=${deal.seller!.id}`) }}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-xl text-left hover:bg-emerald-100 transition-colors group"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                  <User size={13} className="text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-emerald-500 font-medium">Продавец</p>
                  <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-emerald-700">
                    #{deal.seller.client_number} {deal.seller.name}
                  </p>
                </div>
              </button>
            )}
          </div>

          {/* Property */}
          {deal.property && (
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/properties?open=${deal.property!.id}`) }}
              className="w-full flex items-center gap-3 px-3 py-2.5 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
                <Building2 size={13} className="text-slate-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 font-medium">Объект</p>
                <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-blue-700">
                  {deal.property.article} · {PROPERTY_TYPE_LABELS[deal.property.type as keyof typeof PROPERTY_TYPE_LABELS]} · {deal.property.address}
                </p>
              </div>
              <span className="text-xs font-medium text-slate-500 shrink-0">{formatPrice(deal.property.price)}</span>
            </button>
          )}

          {/* Finance */}
          <div className="grid grid-cols-2 gap-3">
            {deal.deal_price != null && deal.deal_price > 0 && (
              <div className="bg-slate-50 rounded-xl px-3 py-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Banknote size={13} className="text-slate-400" />
                  <p className="text-xs text-slate-400">Цена сделки</p>
                </div>
                <p className="text-sm font-bold text-slate-800">{formatPrice(deal.deal_price)}</p>
              </div>
            )}
            {deal.commission != null && deal.commission > 0 && (
              <div className="bg-emerald-50 rounded-xl px-3 py-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp size={13} className="text-emerald-500" />
                  <p className="text-xs text-emerald-500">Моя комиссия</p>
                </div>
                <p className="text-sm font-bold text-emerald-700">{formatPrice(deal.commission)}</p>
              </div>
            )}
          </div>

          {/* Payment + Split */}
          {deal.payment_method && (
            <div>
              <p className="text-xs text-slate-400 mb-1">Форма оплаты</p>
              <p className="text-sm font-medium text-slate-700">{deal.payment_method}</p>
            </div>
          )}
          {deal.commission_split && (
            <div className="bg-amber-50 rounded-xl px-3 py-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <SplitSquareHorizontal size={13} className="text-amber-500" />
                <p className="text-xs text-amber-600 font-medium">Делился комиссией</p>
              </div>
              <p className="text-sm text-amber-800">{deal.commission_split}</p>
            </div>
          )}

          {/* Notes */}
          {deal.notes && (
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <FileText size={13} className="text-slate-400" />
                <p className="text-xs text-slate-400">Заметки</p>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">{deal.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(deal) }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <Pencil size={13} />
              Редактировать
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(deal) }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
            >
              <Trash2 size={13} />
              Удалить
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DealsPage() {
  const { data: rawDeals = [], isLoading, error } = useDeals()
  const { data: clients = [] } = useClients()
  const { data: properties = [] } = useProperties()
  const createDeal = useCreateDeal()
  const updateDeal = useUpdateDeal()
  const deleteDeal = useDeleteDeal()

  const [searchParams, setSearchParams] = useSearchParams()
  const openId = searchParams.get('open') ?? ''

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [expandedId, setExpandedId] = useState<string>(openId)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null)
  const [deletingDeal, setDeletingDeal] = useState<Deal | null>(null)

  // Auto-expand deal from URL param, then clear it
  useEffect(() => {
    if (!openId) return
    setExpandedId(openId)
    const t = setTimeout(() => setSearchParams({}, { replace: true }), 1500)
    return () => clearTimeout(t)
  }, [openId, setSearchParams])

  // Enrich deals with client/property data from already-loaded lists
  const deals = useMemo<Deal[]>(() => rawDeals.map((d) => ({
    ...d,
    buyer:    d.buyer_id    ? clients.find((c) => c.id === d.buyer_id)    ?? null : null,
    seller:   d.seller_id   ? clients.find((c) => c.id === d.seller_id)   ?? null : null,
    property: d.property_id ? (properties.find((p) => p.id === d.property_id)
      ? { id: properties.find((p) => p.id === d.property_id)!.id,
          article: properties.find((p) => p.id === d.property_id)!.article,
          type: properties.find((p) => p.id === d.property_id)!.type,
          address: properties.find((p) => p.id === d.property_id)!.address,
          price: properties.find((p) => p.id === d.property_id)!.price }
      : null) : null,
  })), [rawDeals, clients, properties])

  const filtered = useMemo(() => {
    return deals.filter((d) => {
      if (statusFilter && d.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        const haystack = [
          d.title, d.notes, d.payment_method, d.commission_split,
          d.buyer?.name, d.seller?.name,
          d.property?.address, d.property?.article,
        ].filter(Boolean).join(' ').toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [deals, search, statusFilter])

  // Stats
  const totalCommission = deals
    .filter((d) => d.status === 'completed')
    .reduce((sum, d) => sum + (d.commission ?? 0), 0)
  const completedCount = deals.filter((d) => d.status === 'completed').length
  const activeCount = deals.filter((d) => d.status === 'active').length

  const handleSave = async (data: DealFormData) => {
    // Strip empty strings and NaN
    const cleaned: Partial<DealFormData> = {}
    for (const [k, v] of Object.entries(data)) {
      if (v === '' || v === undefined) continue
      if (typeof v === 'number' && isNaN(v)) continue
      ;(cleaned as Record<string, unknown>)[k] = v
    }
    try {
      if (editingDeal) {
        await updateDeal.mutateAsync({ id: editingDeal.id, data: cleaned as DealFormData })
        toast.success('Сделка обновлена')
      } else {
        await createDeal.mutateAsync(cleaned as DealFormData)
        toast.success('Сделка добавлена')
      }
      setIsFormOpen(false)
      setEditingDeal(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка при сохранении')
    }
  }

  const handleDelete = async () => {
    if (!deletingDeal) return
    try {
      await deleteDeal.mutateAsync(deletingDeal.id)
      toast.success('Сделка удалена')
      setDeletingDeal(null)
    } catch {
      toast.error('Ошибка при удалении')
    }
  }

  const openEdit = (deal: Deal) => {
    setEditingDeal(deal)
    setIsFormOpen(true)
  }

  return (
    <div className="p-4 sm:p-6 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Сделки</h1>
          <p className="text-sm text-slate-500 mt-0.5">{filtered.length} из {deals.length}</p>
        </div>
        <button
          onClick={() => { setEditingDeal(null); setIsFormOpen(true) }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          Новая сделка
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-slate-100 px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <TrendingUp size={17} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Заработано</p>
            <p className="text-base font-bold text-emerald-600">{formatPrice(totalCommission)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <HeartHandshake size={17} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-slate-400">В работе</p>
            <p className="text-base font-bold text-slate-800">{activeCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
            <CalendarDays size={17} className="text-slate-500" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Закрыто</p>
            <p className="text-base font-bold text-slate-800">{completedCount}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative w-full sm:flex-1 sm:min-w-0">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Поиск по клиенту, объекту, заметкам..."
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
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-1 py-1 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setStatusFilter('')}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
              statusFilter === '' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100')}
          >
            Все
          </button>
          {DEAL_STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(statusFilter === s.value ? '' : s.value)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                statusFilter === s.value ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100')}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={24} className="animate-spin text-blue-500" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 rounded-xl text-red-700 text-sm space-y-1">
          <p className="font-medium">Ошибка загрузки сделок</p>
          <p className="text-red-500 text-xs font-mono">{(error as Error).message}</p>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <HeartHandshake size={40} className="text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">Сделок нет</p>
          <p className="text-slate-400 text-sm mt-1">
            {deals.length === 0 ? 'Добавьте первую сделку' : 'Попробуйте изменить фильтры'}
          </p>
        </div>
      )}

      {/* List */}
      {!isLoading && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((deal) => (
            <DealCard key={deal.id} deal={deal} defaultExpanded={deal.id === expandedId} onEdit={openEdit} onDelete={setDeletingDeal} />
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingDeal(null) }}
        title={editingDeal ? 'Редактировать сделку' : 'Новая сделка'}
        size="lg"
      >
        <DealForm
          initial={editingDeal ? {
            title: editingDeal.title,
            deal_date: editingDeal.deal_date,
            buyer_id: editingDeal.buyer_id,
            seller_id: editingDeal.seller_id,
            property_id: editingDeal.property_id,
            payment_method: editingDeal.payment_method,
            deal_price: editingDeal.deal_price,
            commission: editingDeal.commission,
            commission_split: editingDeal.commission_split,
            status: editingDeal.status,
            notes: editingDeal.notes,
          } : undefined}
          onSave={handleSave}
          onCancel={() => { setIsFormOpen(false); setEditingDeal(null) }}
          isSubmitting={createDeal.isPending || updateDeal.isPending}
        />
      </Modal>

      {/* Delete Confirm */}
      <Modal
        isOpen={!!deletingDeal}
        onClose={() => setDeletingDeal(null)}
        title="Удалить сделку?"
        size="sm"
      >
        <div className="p-6">
          <p className="text-sm text-slate-600 mb-5">
            Сделка <span className="font-semibold text-slate-900">#{deletingDeal?.deal_number}</span> будет удалена безвозвратно.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeletingDeal(null)}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Отмена
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteDeal.isPending}
              className="flex-1 py-2.5 rounded-xl bg-red-600 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {deleteDeal.isPending && <Loader2 size={14} className="animate-spin" />}
              Удалить
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

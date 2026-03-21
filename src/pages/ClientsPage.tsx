import { useState, useMemo, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Search, Plus, Users, Phone, X, Loader2, AlertCircle,
  Pencil, Trash2, ChevronDown, ChevronUp, Building2, Bell,
  ArrowUp, ArrowDown, List, GitMerge,
} from 'lucide-react'
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from '@/hooks/useClients'
import { usePropertiesByOwner } from '@/hooks/useProperties'
import { useDealsByClient } from '@/hooks/useDeals'
import Timeline from '@/components/timeline/Timeline'
import SalesFunnel from '@/components/clients/SalesFunnel'
import LinkedTasksSection from '@/components/tasks/LinkedTasksSection'
import { ClipboardList } from 'lucide-react'
import type { Client, ClientFormData } from '@/types'
import {
  CLIENT_STATUSES, CLIENT_PRIORITIES, CLIENT_STATUS_COLORS, CLIENT_STATUS_PRIORITY,
  CLIENT_TYPES, CLIENT_TYPE_ICONS, CLIENT_TYPE_COLORS,
  PROPERTY_TYPE_LABELS, PROPERTY_TYPE_ICONS,
  DEAL_STATUSES, FUNNEL_STAGES,
} from '@/types'
import { formatPrice, formatPhone, maskPhone } from '@/utils/format'
import { cn } from '@/utils/cn'
import Modal from '@/components/ui/Modal'
import toast from 'react-hot-toast'

// ─── Overdue Contact Banner ──────────────────────────────────────────────────

function OverdueBanner({ clients }: { clients: Client[] }) {
  const today = new Date().toISOString().slice(0, 10)
  const overdue = clients.filter(
    (c) =>
      c.next_contact &&
      c.next_contact <= today &&
      c.status !== 'Архив' &&
      c.status !== 'Сделка'
  )
  if (overdue.length === 0) return null

  return (
    <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        <Bell size={15} className="text-amber-600" />
        <p className="text-sm font-semibold text-amber-800">
          Нужно связаться ({overdue.length})
        </p>
      </div>
      <div className="space-y-1.5">
        {overdue.map((c) => (
          <div key={c.id} className="flex items-start gap-2">
            <span className="text-xs font-medium text-amber-700 min-w-0 truncate">
              {c.name}
            </span>
            {c.next_step && (
              <span className="text-xs text-amber-600 truncate">— {c.next_step}</span>
            )}
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

// ─── Client Form ────────────────────────────────────────────────────────────────

function ClientForm({
  initial,
  onSave,
  onCancel,
  isSubmitting,
}: {
  initial?: Partial<ClientFormData>
  onSave: (data: ClientFormData) => void
  onCancel: () => void
  isSubmitting: boolean
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<ClientFormData>({
    defaultValues: initial,
  })

  return (
    <form onSubmit={handleSubmit(onSave)} className="flex flex-col max-h-[85vh]">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
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

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Тип клиента</label>
          <div className="flex flex-wrap gap-2">
            {CLIENT_TYPES.map((t) => (
              <label key={t} className="cursor-pointer">
                <input type="radio" {...register('client_type')} value={t} className="sr-only peer" />
                <span className={cn(
                  'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer',
                  'border-slate-200 text-slate-600 bg-white',
                  'peer-checked:border-blue-400 peer-checked:bg-blue-50 peer-checked:text-blue-700'
                )}>
                  {CLIENT_TYPE_ICONS[t]} {t}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Запрос</label>
          <textarea
            {...register('request')}
            rows={3}
            placeholder="Что ищет / что продаёт..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Бюджет</label>
            <input
              {...register('budget')}
              placeholder="до 5млн"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Дата контакта</label>
            <input
              type="date"
              {...register('contact_date')}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Статус</label>
            <select
              {...register('status')}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— не указан —</option>
              {CLIENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s} · {CLIENT_STATUS_PRIORITY[s]?.replace(/^[^\s]+\s/, '')}
                </option>
              ))}
            </select>
          </div>
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
        </div>

        <div className="grid grid-cols-2 gap-3">
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

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Этап воронки</label>
          <select
            {...register('funnel_stage')}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— не указан —</option>
            {FUNNEL_STAGES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

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

// ─── Client Properties mini-list ─────────────────────────────────────────────

function ClientProperties({ clientId }: { clientId: string }) {
  const navigate = useNavigate()
  const { data: props = [], isLoading } = usePropertiesByOwner(clientId)

  if (isLoading) return <p className="text-xs text-slate-400">Загрузка объектов...</p>
  if (props.length === 0) return <p className="text-xs text-slate-400">Объектов нет</p>

  return (
    <div className="space-y-1.5">
      {props.map((p) => (
        <button
          key={p.id}
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/properties?open=${p.id}`)
          }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all text-left group"
        >
          <span className="text-base">{PROPERTY_TYPE_ICONS[p.type]}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-800 truncate group-hover:text-blue-700">
              {PROPERTY_TYPE_LABELS[p.type]}
              {p.rooms ? ` ${p.rooms}-комн.` : ''}
              {p.address ? ` · ${p.address}` : ''}
            </p>
            <p className="text-xs text-slate-400">{formatPrice(p.price)} · {p.area} м²</p>
          </div>
          <span className="text-xs font-mono text-slate-300">{p.article}</span>
        </button>
      ))}
    </div>
  )
}

// ─── Client Deals mini-list ───────────────────────────────────────────────────

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
          const statusMeta = DEAL_STATUSES.find((s) => s.value === d.status)
          return (
            <button
              key={d.id}
              onClick={(e) => { e.stopPropagation(); navigate(`/deals?open=${d.id}`) }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all text-left group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-800 truncate group-hover:text-emerald-700">
                  #{d.deal_number} {d.title || 'Сделка'}
                  {d.deal_date ? ` · ${d.deal_date}` : ''}
                </p>
                <div className="flex items-center gap-2">
                  {statusMeta && (
                    <span className={cn('text-xs font-medium px-1.5 rounded', statusMeta.color)}>
                      {statusMeta.label}
                    </span>
                  )}
                  {d.commission != null && d.commission > 0 && (
                    <span className="text-xs text-emerald-600 font-medium">
                      {(d.commission / 1000).toFixed(0)}k ₽
                    </span>
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

// ─── Client Row ────────────────────────────────────────────────────────────────

function ClientRow({
  client,
  highlighted,
  onEdit,
  onDelete,
}: {
  client: Client
  highlighted: boolean
  onEdit: (c: Client) => void
  onDelete: (c: Client) => void
}) {
  const [expanded, setExpanded] = useState(highlighted)
  const [phoneRevealed, setPhoneRevealed] = useState(false)
  const rowRef = useRef<HTMLDivElement>(null)

  const today = new Date().toISOString().slice(0, 10)
  const isOverdue =
    client.next_contact &&
    client.next_contact <= today &&
    client.status !== 'Архив' &&
    client.status !== 'Сделка'

  useEffect(() => {
    if (highlighted && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlighted])

  return (
    <div
      ref={rowRef}
      className={cn(
        'bg-white rounded-xl border overflow-hidden transition-all',
        highlighted ? 'border-blue-400 shadow-sm shadow-blue-100' :
        isOverdue ? 'border-amber-300' : 'border-slate-100'
      )}
    >
      {/* Main row */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-blue-600">#{client.client_number}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-900 truncate">{client.name}</span>
            {client.client_type && (
              <span className={cn(
                'text-xs font-medium px-1.5 py-0.5 rounded-md',
                CLIENT_TYPE_COLORS[client.client_type] ?? 'bg-slate-100 text-slate-600'
              )}>
                {CLIENT_TYPE_ICONS[client.client_type]} {client.client_type}
              </span>
            )}
            {client.status && (
              <span className={cn(
                'text-xs font-medium px-2 py-0.5 rounded-full',
                CLIENT_STATUS_COLORS[client.status] ?? 'bg-slate-100 text-slate-600'
              )}>
                {client.status}
              </span>
            )}
            {isOverdue && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                ⏰ Контакт
              </span>
            )}
          </div>
          {client.request && (
            <p className="text-xs text-slate-500 truncate mt-0.5">{client.request}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {client.budget && (
            <span className="text-xs text-emerald-600 font-medium hidden sm:block">{client.budget}</span>
          )}
          {expanded ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-50">
          <div className="grid grid-cols-2 gap-3 pt-3">
            {client.phone && (
              <div>
                <p className="text-xs text-slate-400 mb-1">Телефон</p>
                <div className="flex items-center gap-2">
                  <Phone size={13} className="text-slate-400 shrink-0" />
                  <span className="text-sm font-mono text-slate-700">
                    {phoneRevealed ? formatPhone(client.phone) : maskPhone(client.phone)}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setPhoneRevealed(v => !v) }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {phoneRevealed ? 'Скрыть' : 'Показать'}
                  </button>
                </div>
              </div>
            )}
            {client.budget && (
              <div>
                <p className="text-xs text-slate-400 mb-1">Бюджет</p>
                <p className="text-sm font-medium text-slate-800">{client.budget}</p>
              </div>
            )}
            {client.contact_date && (
              <div>
                <p className="text-xs text-slate-400 mb-1">Дата контакта</p>
                <p className="text-sm text-slate-700">{client.contact_date}</p>
              </div>
            )}
            {client.next_contact && (
              <div>
                <p className="text-xs text-slate-400 mb-1">Следующий контакт</p>
                <p className={cn(
                  'text-sm font-medium',
                  isOverdue ? 'text-amber-600' : 'text-slate-700'
                )}>
                  {isOverdue ? '⏰ ' : ''}{client.next_contact}
                </p>
              </div>
            )}
          </div>

          {client.status && CLIENT_STATUS_PRIORITY[client.status] && (
            <div className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
              Приоритет работы: <span className="font-medium text-slate-700">{CLIENT_STATUS_PRIORITY[client.status]}</span>
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

          {/* Properties */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Building2 size={13} className="text-slate-400" />
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Объекты</p>
            </div>
            <ClientProperties clientId={client.id} />
          </div>

          {/* Deals */}
          <ClientDealsSection clientId={client.id} />

          {/* Tasks */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList size={13} className="text-slate-400" />
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Задачи</p>
            </div>
            <LinkedTasksSection linkedType="client" linkedId={client.id} />
          </div>

          {/* Timeline */}
          <div className="border-t border-slate-50 pt-3">
            <Timeline entityType="client" entityId={client.id} />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(client) }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <Pencil size={13} />
              Редактировать
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(client) }}
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

// ─── Type Filter Tabs ─────────────────────────────────────────────────────────

const TYPE_TABS = [
  { value: '', label: 'Все' },
  { value: 'Покупатель', label: '🛒 Покупатели' },
  { value: 'Продавец', label: '🏠 Продавцы' },
  { value: 'Подрядчик-перекуп', label: '🔄 Перекупы' },
  { value: 'Арендодатель', label: '🔑 Арендодатели' },
  { value: 'Арендатор', label: '🏡 Арендаторы' },
]

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function ClientsPage() {
  const { data: clients = [], isLoading, error } = useClients()
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()
  const deleteClient = useDeleteClient()

  const [searchParams, setSearchParams] = useSearchParams()
  const highlightId = searchParams.get('highlight') ?? ''

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState<'client_number' | 'created_at' | 'updated_at' | 'last_contact'>('client_number')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [view, setView] = useState<'list' | 'funnel'>('list')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deletingClient, setDeletingClient] = useState<Client | null>(null)

  // Clear highlight param after 3s
  useEffect(() => {
    if (!highlightId) return
    const t = setTimeout(() => setSearchParams({}, { replace: true }), 3000)
    return () => clearTimeout(t)
  }, [highlightId, setSearchParams])

  const filtered = useMemo(() => {
    const list = clients.filter((c) => {
      if (typeFilter && c.client_type !== typeFilter) return false
      if (statusFilter && c.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        const haystack = [c.name, c.phone, c.request, c.budget, c.notes]
          .filter(Boolean).join(' ').toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })

    list.sort((a, b) => {
      let va: string | number | null = null
      let vb: string | number | null = null
      if (sortBy === 'client_number') {
        va = a.client_number
        vb = b.client_number
      } else if (sortBy === 'created_at') {
        va = a.created_at ?? ''
        vb = b.created_at ?? ''
      } else if (sortBy === 'updated_at') {
        va = a.updated_at ?? ''
        vb = b.updated_at ?? ''
      } else if (sortBy === 'last_contact') {
        va = a.last_contact ?? ''
        vb = b.last_contact ?? ''
      }
      if (va === null || va === '') return sortDir === 'asc' ? 1 : -1
      if (vb === null || vb === '') return sortDir === 'asc' ? -1 : 1
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })

    return list
  }, [clients, search, typeFilter, statusFilter, sortBy, sortDir])

  const handleSave = async (data: ClientFormData) => {
    try {
      if (editingClient) {
        await updateClient.mutateAsync({ id: editingClient.id, data })
        toast.success('Клиент обновлён')
      } else {
        await createClient.mutateAsync(data)
        toast.success('Клиент добавлен')
      }
      setIsFormOpen(false)
      setEditingClient(null)
    } catch {
      toast.error('Ошибка при сохранении')
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

  const openEdit = (client: Client) => {
    setEditingClient(client)
    setIsFormOpen(true)
  }

  // Count per type for tab badges
  const typeCounts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const c of clients) {
      if (c.client_type) map[c.client_type] = (map[c.client_type] ?? 0) + 1
    }
    return map
  }, [clients])

  const uniqueStatuses = useMemo(() =>
    [...new Set(clients.map((c) => c.status).filter(Boolean))] as string[],
    [clients]
  )

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Клиенты</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {filtered.length} из {clients.length}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1">
            <button
              onClick={() => setView('list')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                view === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <List size={13} />
              Список
            </button>
            <button
              onClick={() => setView('funnel')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                view === 'funnel' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <GitMerge size={13} />
              Воронка
            </button>
          </div>
          <button
            onClick={() => { setEditingClient(null); setIsFormOpen(true) }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            Добавить клиента
          </button>
        </div>
      </div>

      {/* Overdue notifications */}
      {!isLoading && <OverdueBanner clients={clients} />}

      {/* Type filter tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {TYPE_TABS.map((tab) => {
          const count = tab.value ? (typeCounts[tab.value] ?? 0) : clients.length
          return (
            <button
              key={tab.value}
              onClick={() => setTypeFilter(tab.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                typeFilter === tab.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'
              )}
            >
              {tab.label}
              {count > 0 && (
                <span className={cn(
                  'ml-1.5 text-xs',
                  typeFilter === tab.value ? 'opacity-80' : 'text-slate-400'
                )}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Search + status filter + sort */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Поиск по имени, телефону, запросу..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
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
          {uniqueStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Sort controls */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-1 py-1">
          {([
            { value: 'client_number', label: '№' },
            { value: 'created_at',    label: 'Добавлен' },
            { value: 'updated_at',    label: 'Обновлён' },
            { value: 'last_contact',  label: 'Контакт' },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                if (sortBy === opt.value) {
                  setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
                } else {
                  setSortBy(opt.value)
                  setSortDir('asc')
                }
              }}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                sortBy === opt.value
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-500 hover:bg-slate-100'
              )}
            >
              {opt.label}
              {sortBy === opt.value && (
                sortDir === 'asc'
                  ? <ArrowUp size={11} />
                  : <ArrowDown size={11} />
              )}
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
        <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl text-red-700 text-sm">
          <AlertCircle size={18} />
          Ошибка загрузки клиентов. Проверьте подключение к базе данных.
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <Users size={40} className="text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">Клиенты не найдены</p>
          <p className="text-slate-400 text-sm mt-1">
            {clients.length === 0 ? 'Добавьте первого клиента' : 'Попробуйте изменить фильтры'}
          </p>
        </div>
      )}

      {/* Funnel view */}
      {!isLoading && view === 'funnel' && (
        <SalesFunnel clients={filtered} />
      )}

      {/* List view */}
      {!isLoading && view === 'list' && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((client) => (
            <ClientRow
              key={client.id}
              client={client}
              highlighted={client.id === highlightId}
              onEdit={openEdit}
              onDelete={setDeletingClient}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingClient(null) }}
        title={editingClient ? 'Редактировать клиента' : 'Новый клиент'}
        size="lg"
      >
        <ClientForm
          initial={editingClient ?? undefined}
          onSave={handleSave}
          onCancel={() => { setIsFormOpen(false); setEditingClient(null) }}
          isSubmitting={createClient.isPending || updateClient.isPending}
        />
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={!!deletingClient}
        onClose={() => setDeletingClient(null)}
        title="Удалить клиента?"
        size="sm"
      >
        <div className="p-6">
          <p className="text-sm text-slate-600 mb-1">
            Клиент <span className="font-semibold text-slate-900">{deletingClient?.name}</span> будет удалён безвозвратно.
          </p>
          <p className="text-xs text-slate-400 mb-5">Связанные объекты останутся без изменений.</p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeletingClient(null)}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Отмена
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteClient.isPending}
              className="flex-1 py-2.5 rounded-xl bg-red-600 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {deleteClient.isPending && <Loader2 size={14} className="animate-spin" />}
              Удалить
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

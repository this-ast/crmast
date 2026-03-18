import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { Search, Plus, Users, Phone, X, Loader2, AlertCircle, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from '@/hooks/useClients'
import type { Client, ClientFormData } from '@/types'
import { CLIENT_STATUSES, CLIENT_PRIORITIES, CLIENT_STATUS_COLORS } from '@/types'
import { formatPhone, maskPhone } from '@/utils/format'
import { cn } from '@/utils/cn'
import Modal from '@/components/ui/Modal'
import toast from 'react-hot-toast'

// ─── Client Form ───────────────────────────────────────────────────────────────

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
              {CLIENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
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

// ─── Client Row ────────────────────────────────────────────────────────────────

function ClientRow({
  client,
  onEdit,
  onDelete,
}: {
  client: Client
  onEdit: (c: Client) => void
  onDelete: (c: Client) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [phoneRevealed, setPhoneRevealed] = useState(false)

  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
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
            {client.status && (
              <span className={cn(
                'text-xs font-medium px-2 py-0.5 rounded-full',
                CLIENT_STATUS_COLORS[client.status] ?? 'bg-slate-100 text-slate-600'
              )}>
                {client.status}
              </span>
            )}
            {client.priority && (
              <span className="text-xs text-slate-500">{client.priority}</span>
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
                <p className="text-sm text-slate-700">{client.next_contact}</p>
              </div>
            )}
          </div>

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

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function ClientsPage() {
  const { data: clients = [], isLoading, error } = useClients()
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()
  const deleteClient = useDeleteClient()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deletingClient, setDeletingClient] = useState<Client | null>(null)

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      if (statusFilter && c.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        const haystack = [c.name, c.phone, c.request, c.budget, c.notes]
          .filter(Boolean).join(' ').toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [clients, search, statusFilter])

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

  const uniqueStatuses = [...new Set(clients.map((c) => c.status).filter(Boolean))] as string[]

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
        <button
          onClick={() => { setEditingClient(null); setIsFormOpen(true) }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          Добавить клиента
        </button>
      </div>

      {/* Search + filters */}
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
            {clients.length === 0 ? 'Добавьте первого клиента' : 'Попробуйте изменить поиск'}
          </p>
        </div>
      )}

      {/* List */}
      {!isLoading && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((client) => (
            <ClientRow
              key={client.id}
              client={client}
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

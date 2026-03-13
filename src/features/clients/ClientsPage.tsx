import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Phone, Plus, Pencil, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card, Spinner, Avatar, Button, ConfirmDialog } from '@/components/ui'
import {
  cn,
  formatPhone,
  timeAgo,
  CLIENT_TYPE_LABELS,
  CLIENT_STATUS_LABELS,
  CLIENT_STATUS_COLORS,
  CLIENT_PRIORITY_LABELS,
  CLIENT_PRIORITY_COLORS,
} from '@/lib/utils'
import { ClientForm } from './ClientForm'
import toast from 'react-hot-toast'

interface Client {
  id: string
  display_id: number | null
  full_name: string
  phone: string | null
  email: string | null
  type: string
  status: string
  priority: string
  notes: string | null
  source: string | null
  last_contact_date: string | null
  created_at: string
}

export function ClientsPage() {
  const [searchParams] = useSearchParams()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')

  const [formOpen, setFormOpen] = useState(false)
  const [editClient, setEditClient] = useState<Client | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadClients = useCallback(async () => {
    const { data } = await supabase
      .from('clients')
      .select('id, display_id, full_name, phone, email, type, status, priority, notes, source, last_contact_date, created_at')
      .order('created_at', { ascending: false })
      .limit(1000)
    setClients(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadClients() }, [loadClients])

  const handleEdit = (client: Client) => {
    setEditClient(client)
    setFormOpen(true)
  }

  const handleCreate = () => {
    setEditClient(null)
    setFormOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const { error } = await supabase.from('clients').delete().eq('id', deleteTarget.id)
    if (error) {
      toast.error('Ошибка удаления: ' + error.message)
    } else {
      toast.success('Клиент удалён')
      loadClients()
    }
    setDeleting(false)
    setDeleteTarget(null)
  }

  const filtered = clients.filter((c) => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false
    if (filterType !== 'all' && c.type !== filterType) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        c.full_name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.notes && c.notes.toLowerCase().includes(q))
      )
    }
    return true
  })

  const statusCounts = clients.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1
    return acc
  }, {})

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Клиенты</h1>
          <p className="mt-1 text-text-secondary">
            Всего {clients.length} клиентов
          </p>
        </div>
        <Button onClick={handleCreate} icon={<Plus className="h-4 w-4" />}>
          Добавить клиента
        </Button>
      </div>

      {/* Status pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterStatus('all')}
          className={cn(
            'rounded-full px-3 py-1 text-sm font-medium transition-colors',
            filterStatus === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-surface-secondary text-text-secondary hover:bg-surface-hover'
          )}
        >
          Все ({clients.length})
        </button>
        {Object.entries(CLIENT_STATUS_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilterStatus(filterStatus === key ? 'all' : key)}
            className={cn(
              'rounded-full px-3 py-1 text-sm font-medium transition-colors',
              filterStatus === key
                ? 'bg-primary-600 text-white'
                : 'bg-surface-secondary text-text-secondary hover:bg-surface-hover'
            )}
          >
            {label} ({statusCounts[key] || 0})
          </button>
        ))}
      </div>

      {/* Search and filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Поиск по имени, телефону, заметкам..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary focus:border-primary-500 focus:outline-none"
        >
          <option value="all">Все типы</option>
          {Object.entries(CLIENT_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Clients table */}
      {filtered.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="text-text-secondary">Клиенты не найдены</p>
          <Button onClick={handleCreate} variant="outline" className="mt-3" icon={<Plus className="h-4 w-4" />}>
            Добавить первого клиента
          </Button>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-secondary text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                <th className="px-4 py-3 w-12">#</th>
                <th className="px-4 py-3">Клиент</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3">Приоритет</th>
                <th className="px-4 py-3">Тип</th>
                <th className="px-4 py-3">Последний контакт</th>
                <th className="px-4 py-3 w-24 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((client) => (
                <tr
                  key={client.id}
                  className="transition-colors hover:bg-surface-hover"
                >
                  <td className="px-4 py-3 text-text-muted font-mono text-xs">
                    {client.display_id || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={client.full_name} size="sm" />
                      <div className="min-w-0">
                        <div className="font-medium text-text-primary truncate">
                          {client.full_name}
                        </div>
                        {client.phone && (
                          <div className="flex items-center gap-1 text-xs text-text-muted">
                            <Phone className="h-3 w-3" />
                            {formatPhone(client.phone)}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                        CLIENT_STATUS_COLORS[client.status] || CLIENT_STATUS_COLORS.new
                      )}
                    >
                      {CLIENT_STATUS_LABELS[client.status] || client.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                        CLIENT_PRIORITY_COLORS[client.priority] || CLIENT_PRIORITY_COLORS.medium
                      )}
                    >
                      {CLIENT_PRIORITY_LABELS[client.priority] || client.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs">
                    {CLIENT_TYPE_LABELS[client.type] || client.type}
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted">
                    {client.last_contact_date
                      ? timeAgo(client.last_contact_date)
                      : 'Нет контактов'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEdit(client)}
                        className="rounded-lg p-1.5 text-text-muted hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-950 transition-colors"
                        title="Редактировать"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(client)}
                        className="rounded-lg p-1.5 text-text-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Forms & Dialogs */}
      <ClientForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditClient(null) }}
        onSaved={loadClients}
        editData={editClient}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Удалить клиента?"
        message={`Вы уверены, что хотите удалить "${deleteTarget?.full_name}"? Это действие нельзя отменить.`}
        loading={deleting}
      />
    </div>
  )
}

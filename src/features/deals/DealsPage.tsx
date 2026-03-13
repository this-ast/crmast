import { useEffect, useState, useCallback } from 'react'
import { Handshake, Plus, Pencil, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card, Spinner, Button, ConfirmDialog } from '@/components/ui'
import {
  cn,
  formatPrice,
  formatDateShort,
  DEAL_STATUS_LABELS,
  DEAL_TYPE_LABELS,
} from '@/lib/utils'
import { DealForm } from './DealForm'
import toast from 'react-hot-toast'

interface DealRaw {
  id: string
  type: string
  status: string
  price: number
  commission_percent: number | null
  commission_amount: number | null
  notes: string | null
  created_at: string
  client_id: string | null
  property_id: string | null
  client: { full_name: string }[] | null
  property: { title: string; address: string }[] | null
}

interface Deal {
  id: string
  type: string
  status: string
  price: number
  commission_percent: number | null
  commission_amount: number | null
  notes: string | null
  created_at: string
  client_id: string | null
  property_id: string | null
  client: { full_name: string } | null
  property: { title: string; address: string } | null
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
}

export function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)

  const [formOpen, setFormOpen] = useState(false)
  const [editDeal, setEditDeal] = useState<Deal | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Deal | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadDeals = useCallback(async () => {
    const { data } = await supabase
      .from('deals')
      .select(`
        id, type, status, price, commission_percent, commission_amount, notes, created_at,
        client_id, property_id,
        client:clients(full_name),
        property:properties(title, address)
      `)
      .order('created_at', { ascending: false })
      .limit(200)
    const raw = (data || []) as DealRaw[]
    setDeals(raw.map((d) => ({
      ...d,
      client: Array.isArray(d.client) ? d.client[0] || null : d.client,
      property: Array.isArray(d.property) ? d.property[0] || null : d.property,
    })))
    setLoading(false)
  }, [])

  useEffect(() => { loadDeals() }, [loadDeals])

  const handleEdit = (deal: Deal) => {
    setEditDeal(deal)
    setFormOpen(true)
  }

  const handleCreate = () => {
    setEditDeal(null)
    setFormOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const { error } = await supabase.from('deals').delete().eq('id', deleteTarget.id)
    if (error) {
      toast.error('Ошибка удаления: ' + error.message)
    } else {
      toast.success('Сделка удалена')
      loadDeals()
    }
    setDeleting(false)
    setDeleteTarget(null)
  }

  const totalRevenue = deals
    .filter((d) => d.status === 'completed')
    .reduce((sum, d) => sum + (d.commission_amount || 0), 0)

  const activeDeals = deals.filter((d) => d.status === 'active')
  const completedDeals = deals.filter((d) => d.status === 'completed')

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
          <h1 className="text-2xl font-bold text-text-primary">Сделки</h1>
          <p className="mt-1 text-text-secondary">
            Всего {deals.length} сделок
          </p>
        </div>
        <Button onClick={handleCreate} icon={<Plus className="h-4 w-4" />}>
          Новая сделка
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-text-secondary">Активные сделки</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">{activeDeals.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary">Завершённые</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{completedDeals.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary">Общая комиссия</p>
          <p className="mt-1 text-2xl font-bold text-primary-600">{formatPrice(totalRevenue)}</p>
        </Card>
      </div>

      {/* Deals list */}
      {deals.length === 0 ? (
        <Card className="py-12 text-center">
          <Handshake className="mx-auto h-10 w-10 text-text-muted" />
          <p className="mt-2 text-text-secondary">Сделок пока нет</p>
          <Button onClick={handleCreate} variant="outline" className="mt-3" icon={<Plus className="h-4 w-4" />}>
            Создать первую сделку
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {deals.map((deal) => (
            <Card key={deal.id} className="group relative">
              {/* Action buttons */}
              <div className="absolute right-4 top-4 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => handleEdit(deal)}
                  className="rounded-lg bg-surface p-1.5 text-text-muted shadow-sm border border-border hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-950 transition-colors"
                  title="Редактировать"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setDeleteTarget(deal)}
                  className="rounded-lg bg-surface p-1.5 text-text-muted shadow-sm border border-border hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 transition-colors"
                  title="Удалить"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="flex items-start justify-between pr-20">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Handshake className="h-4 w-4 text-text-muted" />
                    <span className="font-semibold text-text-primary">
                      {deal.client?.full_name || 'Клиент не указан'}
                    </span>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        STATUS_COLORS[deal.status]
                      )}
                    >
                      {DEAL_STATUS_LABELS[deal.status] || deal.status}
                    </span>
                    <span className="rounded bg-surface-secondary px-1.5 py-0.5 text-xs text-text-muted">
                      {DEAL_TYPE_LABELS[deal.type] || deal.type}
                    </span>
                  </div>

                  {deal.property && (
                    <p className="mt-1 text-sm text-text-secondary">
                      {deal.property.title} — {deal.property.address}
                    </p>
                  )}

                  <p className="mt-1 text-xs text-text-muted">
                    {formatDateShort(deal.created_at)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-lg font-bold text-text-primary">
                    {formatPrice(deal.price)}
                  </p>
                  {deal.commission_amount != null && deal.commission_amount > 0 && (
                    <p className="text-sm text-green-600">
                      +{formatPrice(deal.commission_amount)}
                      {deal.commission_percent != null && (
                        <span className="text-text-muted"> ({deal.commission_percent}%)</span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Forms & Dialogs */}
      <DealForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditDeal(null) }}
        onSaved={loadDeals}
        editData={editDeal}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Удалить сделку?"
        message="Вы уверены, что хотите удалить эту сделку? Это действие нельзя отменить."
        loading={deleting}
      />
    </div>
  )
}

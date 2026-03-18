import { Building2, Users, TrendingUp, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { useProperties } from '@/hooks/useProperties'
import { useClients } from '@/hooks/useClients'
import { formatPrice } from '@/utils/format'
import { PROPERTY_TYPE_LABELS, PROPERTY_STATUS_LABELS } from '@/types'

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  color: string
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={18} />
        </div>
        <span className="text-xs font-medium text-slate-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const { data: properties = [], isLoading: propsLoading, error: propsError } = useProperties()
  const { data: clients = [], isLoading: clientsLoading, error: clientsError } = useClients()

  const isLoading = propsLoading || clientsLoading
  const hasError = propsError || clientsError

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-blue-500" />
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl text-red-700 text-sm">
          <AlertCircle size={18} />
          Ошибка загрузки данных. Проверьте подключение к Supabase.
        </div>
      </div>
    )
  }

  // Properties stats
  const activeProps = properties.filter((p) => p.status === 'active').length
  const soldProps = properties.filter((p) => p.status === 'sold').length
  const reservedProps = properties.filter((p) => p.status === 'reserved').length
  const totalValue = properties
    .filter((p) => p.status === 'active')
    .reduce((sum, p) => sum + p.price, 0)

  // Clients stats
  const totalClients = clients.length
  const closedClients = clients.filter((c) => c.status === 'Сделка').length
  const hotClients = clients.filter((c) => c.status === 'Тёплый').length
  const nextContactToday = clients.filter((c) => {
    if (!c.next_contact) return false
    return c.next_contact === new Date().toISOString().split('T')[0]
  }).length

  // Properties by type
  const byType = (['apartment', 'house', 'land', 'commercial'] as const).map((type) => ({
    type,
    label: PROPERTY_TYPE_LABELS[type],
    count: properties.filter((p) => p.type === type).length,
  }))

  // Recent clients (last 5 added / with highest numbers)
  const recentClients = [...clients]
    .sort((a, b) => b.client_number - a.client_number)
    .slice(0, 5)

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Дашборд</h1>
        <p className="text-sm text-slate-500 mt-0.5">Общая сводка по базе</p>
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={Building2}
          label="Активных объектов"
          value={activeProps}
          sub={`${properties.length} всего`}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Сумма активных"
          value={formatPrice(totalValue)}
          sub={`${soldProps} продано`}
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          icon={Users}
          label="Клиентов в базе"
          value={totalClients}
          sub={`${closedClients} сделок закрыто`}
          color="bg-purple-50 text-purple-600"
        />
        <StatCard
          icon={Clock}
          label="Тёплых клиентов"
          value={hotClients}
          sub={nextContactToday > 0 ? `${nextContactToday} контактов сегодня` : 'Контактов сегодня нет'}
          color="bg-orange-50 text-orange-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Properties by type */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Объекты по типам</h2>
          <div className="space-y-3">
            {byType.map(({ type, label, count }) => {
              const pct = properties.length > 0 ? Math.round((count / properties.length) * 100) : 0
              const colors: Record<string, string> = {
                apartment: 'bg-blue-500',
                house: 'bg-emerald-500',
                land: 'bg-amber-500',
                commercial: 'bg-purple-500',
              }
              return (
                <div key={type} className="flex items-center gap-3">
                  <span className="text-sm text-slate-600 w-24 shrink-0">{label}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${colors[type]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 w-6 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Properties by status */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Объекты по статусам</h2>
          <div className="space-y-2">
            {(
              [
                { status: 'active', count: activeProps, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { status: 'reserved', count: reservedProps, color: 'text-amber-600', bg: 'bg-amber-50' },
                { status: 'sold', count: soldProps, color: 'text-slate-600', bg: 'bg-slate-100' },
                { status: 'withdrawn', count: properties.filter(p => p.status === 'withdrawn').length, color: 'text-red-600', bg: 'bg-red-50' },
              ] as const
            ).map(({ status, count, color, bg }) => (
              <div key={status} className={`flex items-center justify-between px-3 py-2 rounded-lg ${bg}`}>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className={color} />
                  <span className={`text-sm font-medium ${color}`}>{PROPERTY_STATUS_LABELS[status]}</span>
                </div>
                <span className={`text-sm font-bold ${color}`}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent clients */}
      <div className="bg-white rounded-xl border border-slate-100 p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Последние клиенты</h2>
        {recentClients.length === 0 ? (
          <p className="text-sm text-slate-400">Клиентов пока нет</p>
        ) : (
          <div className="space-y-2">
            {recentClients.map((client) => (
              <div key={client.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-blue-600">#{client.client_number}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{client.name}</p>
                  {client.request && (
                    <p className="text-xs text-slate-400 truncate">{client.request}</p>
                  )}
                </div>
                {client.status && (
                  <span className="text-xs text-slate-500 shrink-0">{client.status}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

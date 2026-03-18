import { HeartHandshake, TrendingUp, CheckCircle2, Clock } from 'lucide-react'
import { useClients } from '@/hooks/useClients'
import { useProperties } from '@/hooks/useProperties'

export default function DealsPage() {
  const { data: clients = [] } = useClients()
  const { data: properties = [] } = useProperties()

  const closedClients = clients.filter((c) => c.status === 'Сделка').length
  const soldProperties = properties.filter((p) => p.status === 'sold').length
  const activeDeals = clients.filter((c) => c.status === 'Тёплый').length
  const pendingDeals = clients.filter((c) => c.status === 'Думает' || c.status === 'Холодный(ЛИД)').length

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Сделки</h1>
        <p className="text-sm text-slate-500 mt-0.5">Воронка продаж и статистика</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 size={18} className="text-emerald-600" />
            </div>
            <span className="text-xs font-medium text-slate-500">Закрытых сделок</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{closedClients}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <TrendingUp size={18} className="text-blue-600" />
            </div>
            <span className="text-xs font-medium text-slate-500">Проданных объектов</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{soldProperties}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
              <HeartHandshake size={18} className="text-orange-600" />
            </div>
            <span className="text-xs font-medium text-slate-500">Активных (Тёплых)</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{activeDeals}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
              <Clock size={18} className="text-purple-600" />
            </div>
            <span className="text-xs font-medium text-slate-500">В обработке</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{pendingDeals}</p>
        </div>
      </div>

      {/* Funnel */}
      <div className="bg-white rounded-xl border border-slate-100 p-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-5">Воронка по статусам клиентов</h2>
        <div className="space-y-3">
          {[
            { label: 'Тёплый', color: 'bg-orange-500', textColor: 'text-orange-700', bg: 'bg-orange-50' },
            { label: 'Думает', color: 'bg-purple-500', textColor: 'text-purple-700', bg: 'bg-purple-50' },
            { label: 'Холодный(ЛИД)', color: 'bg-blue-500', textColor: 'text-blue-700', bg: 'bg-blue-50' },
            { label: 'Воздухан(ка)', color: 'bg-slate-400', textColor: 'text-slate-600', bg: 'bg-slate-50' },
            { label: 'Сделка', color: 'bg-emerald-500', textColor: 'text-emerald-700', bg: 'bg-emerald-50' },
            { label: 'Архив', color: 'bg-yellow-500', textColor: 'text-yellow-700', bg: 'bg-yellow-50' },
          ].map(({ label, color, textColor, bg }) => {
            const count = clients.filter((c) => c.status === label).length
            const pct = clients.length > 0 ? Math.round((count / clients.length) * 100) : 0
            return (
              <div key={label} className="flex items-center gap-3">
                <div className={cn('text-xs font-medium px-2 py-1 rounded-lg w-36 shrink-0', bg, textColor)}>
                  {label}
                </div>
                <div className="flex-1 bg-slate-100 rounded-full h-2">
                  <div
                    className={cn('h-2 rounded-full transition-all', color)}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-slate-700 w-8 text-right">{count}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ')
}

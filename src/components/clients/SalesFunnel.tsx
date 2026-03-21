import { useMemo } from 'react'
import { ArrowRight, TrendingUp, Users } from 'lucide-react'
import type { Client, FunnelStage } from '@/types'
import { FUNNEL_STAGES } from '@/types'
import { useUpdateClient } from '@/hooks/useClients'
import { cn } from '@/utils/cn'
import { CLIENT_TYPE_ICONS, CLIENT_STATUS_COLORS } from '@/types'
import toast from 'react-hot-toast'

// ─── Conversion Stats Bar ──────────────────────────────────────────────────────

function ConversionStats({ counts }: { counts: Record<FunnelStage, number> }) {
  const total = counts['new'] + counts['needs'] + counts['selection'] +
    counts['showings'] + counts['thinking'] + counts['bargain'] + counts['deal']

  const conversions = FUNNEL_STAGES.slice(1).map((stage, i) => {
    const prev = FUNNEL_STAGES[i]
    const from = counts[prev.value] + counts[stage.value] +
      FUNNEL_STAGES.slice(i + 2).reduce((s, st) => s + counts[st.value], 0)
    const to = counts[stage.value] +
      FUNNEL_STAGES.slice(i + 2).reduce((s, st) => s + counts[st.value], 0)
    const rate = from > 0 ? Math.round((to / from) * 100) : 0
    return { from: prev.label, to: stage.label, rate }
  })

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={15} className="text-blue-500" />
        <span className="text-sm font-semibold text-slate-800">Конверсия по этапам</span>
        <span className="ml-auto text-xs text-slate-400">Всего в воронке: {total}</span>
      </div>

      {/* Funnel bar */}
      <div className="flex items-end gap-1 mb-4 h-14">
        {FUNNEL_STAGES.map((stage) => {
          const count = counts[stage.value]
          const pct = total > 0 ? Math.max((count / total) * 100, count > 0 ? 8 : 0) : 0
          return (
            <div key={stage.value} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs font-bold text-slate-700">{count > 0 ? count : ''}</span>
              <div
                className={cn('w-full rounded-t-md transition-all', stage.bg, 'border', stage.border)}
                style={{ height: `${pct}%`, minHeight: count > 0 ? '6px' : '2px' }}
              />
            </div>
          )
        })}
      </div>

      {/* Stage labels */}
      <div className="flex gap-1 mb-4">
        {FUNNEL_STAGES.map((stage) => (
          <div key={stage.value} className="flex-1 text-center">
            <span className={cn('text-[10px] font-medium leading-tight', stage.color)}>
              {stage.label.split(' ')[0]}
            </span>
          </div>
        ))}
      </div>

      {/* Conversion rates */}
      <div className="flex flex-wrap gap-2">
        {conversions.map((c, i) => (
          <div key={i} className="flex items-center gap-1 text-xs text-slate-500">
            <span className="truncate max-w-20">{c.from.split(' ')[0]}</span>
            <ArrowRight size={10} className="text-slate-300 shrink-0" />
            <span className={cn(
              'font-semibold',
              c.rate >= 70 ? 'text-emerald-600' :
              c.rate >= 40 ? 'text-amber-600' : 'text-red-500'
            )}>
              {c.rate}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Funnel Client Card ────────────────────────────────────────────────────────

function FunnelCard({
  client,
  stageIndex,
  onMove,
  isMoving,
}: {
  client: Client
  stageIndex: number
  onMove: (clientId: string, stage: FunnelStage) => void
  isMoving: boolean
}) {
  const isFirst = stageIndex === 0
  const isLast = stageIndex === FUNNEL_STAGES.length - 1
  const prevStage = isFirst ? null : FUNNEL_STAGES[stageIndex - 1]
  const nextStage = isLast ? null : FUNNEL_STAGES[stageIndex + 1]

  return (
    <div className={cn(
      'bg-white rounded-xl border border-slate-100 p-3 shadow-sm',
      'hover:border-blue-200 hover:shadow-md transition-all',
      isMoving && 'opacity-50'
    )}>
      <div className="flex items-start gap-2 mb-2">
        <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
          <span className="text-[10px] font-bold text-blue-600">#{client.client_number}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-900 truncate">{client.name}</p>
          {client.client_type && (
            <p className="text-[10px] text-slate-400 truncate">
              {CLIENT_TYPE_ICONS[client.client_type]} {client.client_type}
            </p>
          )}
        </div>
      </div>

      {client.budget && (
        <p className="text-[10px] text-emerald-600 font-medium mb-1.5 truncate">{client.budget}</p>
      )}

      {client.status && (
        <span className={cn(
          'inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full mb-2',
          CLIENT_STATUS_COLORS[client.status] ?? 'bg-slate-100 text-slate-600'
        )}>
          {client.status}
        </span>
      )}

      {/* Navigation buttons */}
      <div className="flex gap-1 mt-2">
        {!isFirst && prevStage && (
          <button
            onClick={() => onMove(client.id, prevStage.value)}
            disabled={isMoving}
            className="flex-1 py-1 text-[10px] font-medium rounded-md bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors disabled:opacity-50 truncate px-1"
            title={`← ${prevStage.label}`}
          >
            ←
          </button>
        )}
        {!isLast && nextStage && (
          <button
            onClick={() => onMove(client.id, nextStage.value)}
            disabled={isMoving}
            className="flex-1 py-1 text-[10px] font-medium rounded-md bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors disabled:opacity-50 truncate px-1"
            title={`→ ${nextStage.label}`}
          >
            →
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Funnel Column ─────────────────────────────────────────────────────────────

function FunnelColumn({
  stage,
  stageIndex,
  clients,
  onMove,
  movingId,
}: {
  stage: typeof FUNNEL_STAGES[number]
  stageIndex: number
  clients: Client[]
  onMove: (clientId: string, stage: FunnelStage) => void
  movingId: string | null
}) {
  return (
    <div className={cn(
      'flex flex-col rounded-2xl border min-w-52 w-52 shrink-0',
      stage.border, stage.bg
    )}>
      {/* Column header */}
      <div className={cn('px-3 py-2.5 border-b', stage.border)}>
        <div className="flex items-center justify-between">
          <span className={cn('text-xs font-semibold', stage.color)}>{stage.label}</span>
          <span className={cn(
            'text-xs font-bold px-2 py-0.5 rounded-full',
            clients.length > 0 ? `${stage.bg} ${stage.color}` : 'bg-white text-slate-400'
          )}>
            {clients.length}
          </span>
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 p-2 space-y-2 min-h-24 max-h-[calc(100vh-320px)] overflow-y-auto">
        {clients.length === 0 && (
          <div className="flex items-center justify-center h-16 text-center">
            <span className="text-[11px] text-slate-400">Пусто</span>
          </div>
        )}
        {clients.map((client) => (
          <FunnelCard
            key={client.id}
            client={client}
            stageIndex={stageIndex}
            onMove={onMove}
            isMoving={movingId === client.id}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Main SalesFunnel ──────────────────────────────────────────────────────────

export default function SalesFunnel({ clients }: { clients: Client[] }) {
  const updateClient = useUpdateClient()
  const movingId = updateClient.isPending ? (updateClient.variables as any)?.id ?? null : null

  const grouped = useMemo(() => {
    const map: Record<FunnelStage, Client[]> = {
      new: [], needs: [], selection: [], showings: [], thinking: [], bargain: [], deal: [],
    }
    for (const c of clients) {
      const stage = c.funnel_stage ?? 'new'
      if (map[stage]) map[stage].push(c)
      else map['new'].push(c)
    }
    return map
  }, [clients])

  const counts = useMemo(() => {
    const c: Record<FunnelStage, number> = {
      new: 0, needs: 0, selection: 0, showings: 0, thinking: 0, bargain: 0, deal: 0
    }
    for (const stage of FUNNEL_STAGES) c[stage.value] = grouped[stage.value].length
    return c
  }, [grouped])

  const handleMove = async (clientId: string, stage: FunnelStage) => {
    try {
      await updateClient.mutateAsync({ id: clientId, data: { funnel_stage: stage } })
      const stageMeta = FUNNEL_STAGES.find(s => s.value === stage)
      toast.success(`Перенесён: ${stageMeta?.label}`)
    } catch {
      toast.error('Ошибка при перемещении')
    }
  }

  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center">
        <Users size={40} className="text-slate-300 mb-3" />
        <p className="text-slate-500 font-medium">Нет клиентов в воронке</p>
        <p className="text-slate-400 text-sm mt-1">Добавьте клиентов, чтобы отслеживать этапы</p>
      </div>
    )
  }

  return (
    <div>
      <ConversionStats counts={counts} />
      <div className="flex gap-3 overflow-x-auto pb-4">
        {FUNNEL_STAGES.map((stage, i) => (
          <FunnelColumn
            key={stage.value}
            stage={stage}
            stageIndex={i}
            clients={grouped[stage.value]}
            onMove={handleMove}
            movingId={movingId}
          />
        ))}
      </div>
    </div>
  )
}

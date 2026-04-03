import { useState } from 'react'
import { Users, Wand2, MessageCircle, BookMarked, ChevronDown, ChevronUp } from 'lucide-react'
import { useClients } from '@/hooks/useClients'
import { useDemands } from '@/hooks/useDemands'
import { useCreateCollection } from '@/hooks/useCollections'
import {
  scorePropertyForClient,
  getMatchLevel, getMatchPercent,
  scorePropertyForDemand,
  getDemandMatchLevel, getDemandMatchPercent,
} from '@/utils/matching'
import type { Property, Client } from '@/types'
import type { Demand } from '@/types/demand'
import { getClientTypes, isClientActive, isBuyerTenantActive } from '@/types'
import { formatPriceShort } from '@/utils/format'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'

interface MatchingClientsSectionProps {
  property: Property
  onClientClick?: (client: MatchedClient) => void
}

const LEVEL_STYLES = {
  high:   { label: 'Высокое', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  medium: { label: 'Среднее', class: 'bg-amber-50 text-amber-700 border-amber-200' },
  low:    { label: 'Низкое',  class: 'bg-slate-100 text-slate-600 border-slate-200' },
}

interface MatchedClient extends Client {
  matchScore: number
  matchReasons: string[]
  matchMismatches: string[]
  demandBased: boolean
  demand?: Demand
}

function ClientRow({ client, property, onClientClick }: {
  client: MatchedClient
  property: Property
  onClientClick?: (c: MatchedClient) => void
}) {
  const [creating, setCreating] = useState(false)
  const createCollection = useCreateCollection()

  const level      = client.demandBased ? getDemandMatchLevel(client.matchScore) : getMatchLevel(client.matchScore)
  const percent    = client.demandBased ? getDemandMatchPercent(client.matchScore) : getMatchPercent(client.matchScore)
  const levelStyle = LEVEL_STYLES[level]
  const phone      = client.phone?.replace(/\D/g, '')

  const budgetLabel = (() => {
    if (client.demand?.budget_max || client.demand?.budget_min) {
      const min = client.demand.budget_min ? formatPriceShort(client.demand.budget_min) : null
      const max = client.demand.budget_max ? formatPriceShort(client.demand.budget_max) : null
      if (min && max) return `${min} – ${max}`
      if (max) return `до ${max}`
      if (min) return `от ${min}`
    }
    return client.budget ?? null
  })()

  async function handleCreateCollection() {
    setCreating(true)
    try {
      const collection = await createCollection.mutateAsync({
        title: `Подборка для ${client.name}`,
        client_id: client.id,
        property_ids: [property.id],
      })
      toast.success(
        <span>
          Подборка создана!{' '}
          <a href={`/share/${collection.slug}`} target="_blank" rel="noopener noreferrer" className="underline font-medium">
            Открыть ссылку
          </a>
        </span>,
        { duration: 5000 }
      )
    } catch {
      toast.error('Ошибка создания подборки')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 px-3 py-3 bg-white rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onClientClick?.(client)}
              className="text-sm font-semibold text-slate-900 hover:text-violet-600 transition-colors text-left"
            >
              {client.name}
            </button>
            <span className="text-xs text-slate-400 font-mono">#{client.client_number}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs text-slate-500">
            {budgetLabel && (
              <span>Бюджет: <span className="font-medium text-slate-700">{budgetLabel}</span></span>
            )}
            {getClientTypes(client).length > 0 && (
              <span>· {getClientTypes(client).join(', ')}</span>
            )}
          </div>
          {(client.matchReasons.length > 0 || client.matchMismatches.length > 0) && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {client.matchReasons.map((r) => (
                <span key={r} className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-100">
                  ✓ {r}
                </span>
              ))}
              {client.matchMismatches.map((m) => (
                <span key={m} className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-600 rounded border border-red-100">
                  ✗ {m}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1">
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', levelStyle.class)}>
            {levelStyle.label}
          </span>
          <span className="text-xs text-slate-400">{percent}%</span>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={handleCreateCollection}
          disabled={creating}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 disabled:opacity-50 transition-colors"
        >
          <BookMarked size={12} />
          {creating ? 'Создание...' : 'Создать подборку'}
        </button>
        {phone && (
          <a
            href={`https://wa.me/${phone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition-colors"
          >
            <MessageCircle size={12} />
            Написать
          </a>
        )}
      </div>
    </div>
  )
}

export default function MatchingClientsSection({ property, onClientClick }: MatchingClientsSectionProps) {
  const { data: clients = [], isLoading: clientsLoading } = useClients()
  const { data: demands = [], isLoading: demandsLoading }  = useDemands()
  const [expanded, setExpanded] = useState(true)
  const [showAll, setShowAll]   = useState(false)

  const isLoading = clientsLoading || demandsLoading

  // clientId → first active demand
  const demandMap = new Map<string, Demand>()
  for (const d of demands) {
    if (d.client_id && d.status !== 'archived' && d.status !== 'deal') {
      if (!demandMap.has(d.client_id)) demandMap.set(d.client_id, d)
    }
  }

  // Filter to active buyers/tenants matching deal type
  const eligibleClients = clients.filter((c) => {
    if (!isClientActive(c)) return false
    if (c.status === 'Архив') return false

    const types = getClientTypes(c)
    if (property.deal_type === 'sale') {
      if (types.length === 0) return true // legacy
      if (!types.some((t) => t === 'Покупатель' || t === 'Подрядчик-перекуп')) return false
      return isBuyerTenantActive(c)
    }
    if (property.deal_type === 'rent') {
      if (!types.includes('Арендатор')) return false
      return isBuyerTenantActive(c)
    }
    return true
  })

  // Score each client
  const matches: MatchedClient[] = []
  for (const c of eligibleClients) {
    const demand = demandMap.get(c.id)
    if (demand) {
      const { score, reasons, mismatches } = scorePropertyForDemand(property, demand)
      if (score > 0) {
        matches.push({ ...c, matchScore: score, matchReasons: reasons, matchMismatches: mismatches, demandBased: true, demand })
      }
    } else {
      const { score, reasons, mismatches } = scorePropertyForClient(property, c)
      if (score >= 2) {
        matches.push({ ...c, matchScore: score, matchReasons: reasons, matchMismatches: mismatches, demandBased: false })
      }
    }
  }

  // Sort by normalized percent (fair comparison between demand-based and legacy scores)
  matches.sort((a, b) => {
    const pa = a.demandBased ? getDemandMatchPercent(a.matchScore) : getMatchPercent(a.matchScore)
    const pb = b.demandBased ? getDemandMatchPercent(b.matchScore) : getMatchPercent(b.matchScore)
    return pb - pa
  })

  const displayed = showAll ? matches : matches.slice(0, 5)

  if (isLoading) return null

  return (
    <div>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 hover:text-slate-600 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Wand2 size={13} />
          Подходящие клиенты
          {matches.length > 0 && (
            <span className="text-[10px] font-normal normal-case px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded-full border border-violet-200">
              {matches.length}
            </span>
          )}
        </span>
        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {expanded && (
        <>
          {matches.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-5 bg-slate-50 rounded-xl text-center">
              <Users size={24} className="text-slate-300" />
              <p className="text-xs text-slate-400">Нет клиентов, подходящих под параметры объекта</p>
              <p className="text-[11px] text-slate-300">Заполните клиентам поля: бюджет, запрос, тип</p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayed.map((c) => (
                <ClientRow key={c.id} client={c} property={property} onClientClick={onClientClick} />
              ))}
              {matches.length > 5 && (
                <button
                  onClick={() => setShowAll((v) => !v)}
                  className="w-full py-2 text-xs text-slate-500 hover:text-blue-600 font-medium transition-colors"
                >
                  {showAll ? 'Скрыть' : `Показать ещё ${matches.length - 5}`}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

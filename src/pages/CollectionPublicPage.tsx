import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCollectionBySlug } from '@/hooks/useCollections'
import { useAgentSettings } from '@/hooks/useAgentSettings'
import { supabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'
import type { PropertyWithOwner, AgentSettings } from '@/types'
import {
  PROPERTY_TYPE_LABELS, PROPERTY_TYPE_ICONS, DEAL_TYPE_LABELS,
} from '@/types'
import { formatPriceShort } from '@/utils/format'
import { cn } from '@/utils/cn'
import {
  Phone, MessageCircle, Send, MapPin, ChevronLeft, ChevronRight,
  Building2, ArrowRight,
} from 'lucide-react'

// ─── Property Card Photo ───────────────────────────────────────────────────────

function CardPhoto({ photos, alt }: { photos: string[]; alt: string }) {
  const [idx, setIdx] = useState(0)
  if (!photos || photos.length === 0) {
    return (
      <div className="w-full aspect-video bg-slate-100 flex items-center justify-center">
        <Building2 size={36} className="text-slate-300" />
      </div>
    )
  }
  return (
    <div className="relative w-full aspect-video bg-slate-900 overflow-hidden group">
      <img
        src={photos[idx]}
        alt={alt}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        loading="lazy"
      />
      {photos.length > 1 && (
        <>
          <button
            onClick={e => { e.stopPropagation(); setIdx(i => (i - 1 + photos.length) % photos.length) }}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity active:scale-90"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); setIdx(i => (i + 1) % photos.length) }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity active:scale-90"
          >
            <ChevronRight size={16} />
          </button>
          {/* Dot indicators */}
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1">
            {photos.slice(0, 6).map((_, i) => (
              <button
                key={i}
                onClick={e => { e.stopPropagation(); setIdx(i) }}
                className={cn('w-1.5 h-1.5 rounded-full transition-all', i === idx ? 'bg-white scale-110' : 'bg-white/50')}
              />
            ))}
          </div>
        </>
      )}
      {/* Photo count */}
      <div className="absolute top-2.5 right-2.5 bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-1 rounded-full flex items-center gap-1">
        <span>📷</span>
        <span>{photos.length}</span>
      </div>
    </div>
  )
}

// ─── Property Card ─────────────────────────────────────────────────────────────

function PropertyCard({ property, index, onOpen }: {
  property: PropertyWithOwner
  index: number
  onOpen: () => void
}) {
  const typeLabel = PROPERTY_TYPE_LABELS[property.type]
  const typeIcon = PROPERTY_TYPE_ICONS[property.type]
  const dealLabel = DEAL_TYPE_LABELS[property.deal_type]

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all duration-200">
      {/* Photo */}
      <CardPhoto photos={property.photos} alt={property.address} />

      {/* Content */}
      <div className="p-4">
        {/* Badges row */}
        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {typeIcon} {typeLabel}
          </span>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
            {dealLabel}
          </span>
          {property.market_type === 'new_build' && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700">
              Новостройка
            </span>
          )}
        </div>

        {/* Price */}
        <div className="mb-2">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {formatPriceShort(property.price)}
            </span>
            {property.area > 0 && (
              <span className="text-xs text-slate-400">
                {Math.round(property.price / property.area).toLocaleString('ru-RU')} ₽/м²
              </span>
            )}
          </div>
        </div>

        {/* Key params row */}
        <div className="flex items-center gap-3 text-sm text-slate-600 mb-3 flex-wrap">
          {property.area > 0 && (
            <span className="flex items-center gap-1">
              <span className="text-slate-400 text-xs">📐</span>
              <span className="font-medium">{property.area} м²</span>
            </span>
          )}
          {property.rooms !== undefined && (
            <span className="flex items-center gap-1">
              <span className="text-slate-400 text-xs">🛏</span>
              <span className="font-medium">{property.rooms === 0 ? 'Студия' : `${property.rooms}-комн.`}</span>
            </span>
          )}
          {property.floor && property.total_floors && (
            <span className="flex items-center gap-1">
              <span className="text-slate-400 text-xs">📊</span>
              <span className="font-medium">{property.floor}/{property.total_floors} эт.</span>
            </span>
          )}
          {property.renovation && (
            <span className="flex items-center gap-1">
              <span className="text-slate-400 text-xs">🔨</span>
              <span className="font-medium">{property.renovation}</span>
            </span>
          )}
        </div>

        {/* Location */}
        <div className="flex items-start gap-1.5 mb-3">
          <MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm text-slate-700 leading-snug">{property.address}</p>
            {property.complex_name && (
              <p className="text-xs text-slate-400 mt-0.5">ЖК «{property.complex_name}»</p>
            )}
          </div>
        </div>

        {/* Payment options */}
        {(property.has_mortgage || property.has_installment || property.has_trade_in) && (
          <div className="flex flex-wrap gap-1 mb-3 pb-3 border-b border-slate-100">
            {property.has_mortgage && <span className="text-[11px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-medium">Ипотека</span>}
            {property.has_installment && <span className="text-[11px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-medium">Рассрочка</span>}
            {property.has_trade_in && <span className="text-[11px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-medium">Трейд-ин</span>}
            {property.has_maternal_cap && <span className="text-[11px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-medium">Маткапитал</span>}
            {property.has_military_mort && <span className="text-[11px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-medium">Воен. ипотека</span>}
          </div>
        )}

        {/* Description snippet */}
        {property.description && (
          <p className="text-sm text-slate-500 leading-relaxed mb-3 line-clamp-2">
            {property.description}
          </p>
        )}

        {/* CTA Button */}
        <button
          onClick={onOpen}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 active:scale-[0.98] transition-all"
        >
          Подробнее
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  )
}

// ─── Agent Bar ─────────────────────────────────────────────────────────────────

function AgentBar({ agent }: { agent: AgentSettings }) {
  const phone = agent.phone?.replace(/\D/g, '')
  const wa = (agent.whatsapp ?? agent.phone)?.replace(/\D/g, '')
  const tg = agent.telegram?.replace('@', '')

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-100 px-4 pt-3 pb-5">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-2.5">
          {agent.logo_url ? (
            <img src={agent.logo_url} alt={agent.name ?? ''} className="w-9 h-9 rounded-full object-cover border border-slate-100" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {(agent.name ?? 'А')[0].toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{agent.name ?? 'Агент'}</p>
            {agent.agency_name && (
              <p className="text-xs text-slate-500 truncate">{agent.agency_name}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {phone && (
            <a href={`tel:+${phone}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold active:scale-[0.97] transition-transform">
              <Phone size={15} /> Позвонить
            </a>
          )}
          {wa && (
            <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold active:scale-[0.97] transition-transform">
              <MessageCircle size={15} /> WhatsApp
            </a>
          )}
          {tg && (
            <a href={`https://t.me/${tg}`} target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-sky-500 text-white text-sm font-semibold active:scale-[0.97] transition-transform">
              <Send size={15} /> Telegram
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function CollectionPublicPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { data: collection, isLoading: loadingCollection } = useCollectionBySlug(slug ?? '')
  const { data: agent } = useAgentSettings()

  const { data: properties = [], isLoading: loadingProps } = useQuery({
    queryKey: ['public-collection-props', collection?.id],
    queryFn: async (): Promise<PropertyWithOwner[]> => {
      if (!collection || collection.property_ids.length === 0) return []
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .in('id', collection.property_ids)
      if (error) throw new Error(error.message)
      const map = new Map((data ?? []).map((p) => [p.id, p]))
      return collection.property_ids.map(id => map.get(id)).filter(Boolean) as PropertyWithOwner[]
    },
    enabled: !!collection,
  })

  const isLoading = loadingCollection || loadingProps

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Загрузка подборки...</p>
        </div>
      </div>
    )
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Подборка не найдена</h1>
          <p className="text-slate-500 text-sm">Возможно, ссылка устарела или была удалена.</p>
        </div>
      </div>
    )
  }

  // Price range
  const prices = properties.map(p => p.price).filter(Boolean).sort((a, b) => a - b)
  const priceRange = prices.length > 1
    ? `${formatPriceShort(prices[0])} — ${formatPriceShort(prices[prices.length - 1])}`
    : prices.length === 1 ? formatPriceShort(prices[0]) : null

  return (
    <div className="min-h-screen bg-slate-50 pb-36">
      {/* ── Header branding ─────────────────────────────────────────────────── */}
      {agent && (agent.logo_url || agent.agency_name) && (
        <div className="bg-white border-b border-slate-100 px-4 py-3">
          <div className="max-w-lg mx-auto flex items-center gap-3">
            {agent.logo_url ? (
              <img src={agent.logo_url} alt={agent.agency_name ?? ''} className="h-8 w-auto rounded-lg" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
                {(agent.name ?? agent.agency_name ?? 'А')[0].toUpperCase()}
              </div>
            )}
            <span className="text-sm font-semibold text-slate-700">{agent.agency_name ?? agent.name}</span>
          </div>
        </div>
      )}

      {/* ── Collection Cover ────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 px-4 py-6">
        <div className="max-w-lg mx-auto">
          {/* Title */}
          <h1 className="text-2xl font-black text-slate-900 leading-tight">{collection.title}</h1>

          {/* For whom */}
          {collection.client?.name && (
            <p className="text-sm text-slate-500 mt-1.5">
              Подготовлено для <span className="font-semibold text-slate-700">{collection.client.name}</span>
            </p>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full">
              <span className="text-sm font-bold text-slate-900">{properties.length}</span>
              <span className="text-xs text-slate-500">
                {properties.length === 1 ? 'объект' : properties.length < 5 ? 'объекта' : 'объектов'}
              </span>
            </div>
            {priceRange && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full">
                <span className="text-xs font-semibold text-blue-700">{priceRange}</span>
              </div>
            )}
          </div>

          {/* Comment */}
          {collection.comment && (
            <div className="mt-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-sm text-slate-600 leading-relaxed">{collection.comment}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Property List ───────────────────────────────────────────────────── */}
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {properties.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">
            Объекты в подборке не найдены
          </div>
        )}
        {properties.map((p, i) => (
          <PropertyCard
            key={p.id}
            property={p}
            index={i}
            onOpen={() => navigate(`/p/${p.id}`)}
          />
        ))}
      </div>

      {agent && (agent.phone || agent.whatsapp || agent.telegram) && (
        <AgentBar agent={agent} />
      )}
    </div>
  )
}

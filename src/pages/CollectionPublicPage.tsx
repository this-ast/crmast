import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useCollectionBySlug } from '@/hooks/useCollections'
import { useAgentSettings } from '@/hooks/useAgentSettings'
import { supabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'
import type { PropertyWithOwner, AgentSettings } from '@/types'
import {
  PROPERTY_TYPE_LABELS,
  PROPERTY_TYPE_ICONS,
  PROPERTY_STATUS_LABELS,
  PROPERTY_STATUS_COLORS,
  DEAL_TYPE_LABELS,
} from '@/types'
import { formatPrice, formatPriceShort } from '@/utils/format'
import { Phone, MessageCircle, Send, Instagram, MapPin, Maximize2, ChevronLeft, ChevronRight, Building2 } from 'lucide-react'

// ─── Property Photo Gallery ───────────────────────────────────────────────────

function PhotoGallery({ photos, alt }: { photos: string[]; alt: string }) {
  const [idx, setIdx] = useState(0)
  if (!photos || photos.length === 0) {
    return (
      <div className="w-full h-48 bg-slate-100 rounded-xl flex items-center justify-center text-slate-300">
        <Building2 size={40} />
      </div>
    )
  }
  return (
    <div className="relative w-full h-52 bg-slate-900 rounded-xl overflow-hidden group">
      <img
        src={photos[idx]}
        alt={alt}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      {photos.length > 1 && (
        <>
          <button
            onClick={() => setIdx((i) => (i - 1 + photos.length) % photos.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setIdx((i) => (i + 1) % photos.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight size={16} />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === idx ? 'bg-white' : 'bg-white/50'}`}
              />
            ))}
          </div>
        </>
      )}
      <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 rounded-full px-2 py-0.5 text-white text-xs">
        <Maximize2 size={10} />
        {photos.length}
      </div>
    </div>
  )
}

// ─── Property Card ────────────────────────────────────────────────────────────

function PropertyCard({ property }: { property: PropertyWithOwner }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <PhotoGallery photos={property.photos} alt={property.address} />
      <div className="p-4">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {PROPERTY_TYPE_ICONS[property.type]} {PROPERTY_TYPE_LABELS[property.type]}
          </span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PROPERTY_STATUS_COLORS[property.status]}`}>
            {PROPERTY_STATUS_LABELS[property.status]}
          </span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
            {DEAL_TYPE_LABELS[property.deal_type]}
          </span>
          {property.market_type === 'new_build' && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-violet-50 text-violet-700">
              Новострой
            </span>
          )}
        </div>

        {/* Price */}
        <div className="mb-2">
          <span className="text-2xl font-bold text-slate-900">{formatPriceShort(property.price)}</span>
          {property.area > 0 && (
            <span className="text-sm text-slate-400 ml-2">
              · {Math.round(property.price / property.area).toLocaleString('ru-RU')} ₽/м²
            </span>
          )}
        </div>

        {/* Key info */}
        <div className="flex flex-wrap gap-3 text-sm text-slate-600 mb-3">
          <span>{property.area} м²</span>
          {property.rooms !== undefined && (
            <span>{property.rooms === 0 ? 'Студия' : `${property.rooms}-комн.`}</span>
          )}
          {property.floor && property.total_floors && (
            <span>{property.floor}/{property.total_floors} эт.</span>
          )}
        </div>

        {/* Address */}
        <div className="flex items-start gap-1.5 text-sm text-slate-500">
          <MapPin size={14} className="shrink-0 mt-0.5 text-slate-400" />
          <span>{property.address}</span>
        </div>
        {property.complex_name && (
          <p className="text-xs text-slate-400 mt-1 ml-5">ЖК «{property.complex_name}»</p>
        )}

        {/* Payment options */}
        {(property.has_mortgage || property.has_installment || property.has_trade_in || property.has_maternal_cap || property.has_military_mort) && (
          <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-slate-100">
            {property.has_mortgage && <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">Ипотека</span>}
            {property.has_installment && <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">Рассрочка</span>}
            {property.has_trade_in && <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">Трейд-ин</span>}
            {property.has_maternal_cap && <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">Маткапитал</span>}
            {property.has_military_mort && <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">Воен. ипотека</span>}
          </div>
        )}

        {/* Description */}
        {property.description && (
          <p className="mt-3 text-sm text-slate-500 line-clamp-3">{property.description}</p>
        )}
      </div>
    </div>
  )
}

// ─── Agent Contact Bar ────────────────────────────────────────────────────────

function AgentContact({ agent }: { agent: AgentSettings }) {
  const phone = agent.phone?.replace(/\D/g, '')
  const wa = agent.whatsapp?.replace(/\D/g, '') ?? phone
  const tg = agent.telegram?.replace('@', '')

  return (
    <div className="sticky bottom-0 z-20 bg-white/95 backdrop-blur border-t border-slate-100 px-4 py-3">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-3">
          {agent.logo_url ? (
            <img src={agent.logo_url} alt={agent.name ?? ''} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-base">
              {(agent.name ?? 'А')[0].toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 text-sm truncate">{agent.name ?? 'Агент'}</p>
            {agent.agency_name && (
              <p className="text-xs text-slate-500 truncate">{agent.agency_name}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {phone && (
            <a
              href={`tel:+${phone}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Phone size={15} />
              Позвонить
            </a>
          )}
          {wa && (
            <a
              href={`https://wa.me/${wa}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors"
            >
              <MessageCircle size={15} />
              WhatsApp
            </a>
          )}
          {tg && (
            <a
              href={`https://t.me/${tg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-sky-500 text-white text-sm font-medium hover:bg-sky-600 transition-colors"
            >
              <Send size={15} />
              Telegram
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CollectionPublicPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: collection, isLoading: loadingCollection } = useCollectionBySlug(slug ?? '')
  const { data: agent } = useAgentSettings()

  // Fetch properties by IDs from the collection
  const { data: properties = [], isLoading: loadingProps } = useQuery({
    queryKey: ['public-collection-props', collection?.id],
    queryFn: async (): Promise<PropertyWithOwner[]> => {
      if (!collection || collection.property_ids.length === 0) return []
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .in('id', collection.property_ids)
      if (error) throw new Error(error.message)
      // Preserve order from property_ids
      const map = new Map((data ?? []).map((p) => [p.id, p]))
      return collection.property_ids.map((id) => map.get(id)).filter(Boolean) as PropertyWithOwner[]
    },
    enabled: !!collection,
  })

  const isLoading = loadingCollection || loadingProps

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Загрузка подборки...</p>
        </div>
      </div>
    )
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Подборка не найдена</h1>
          <p className="text-slate-500 text-sm">Возможно, ссылка устарела или была удалена.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Hero header */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white px-4 pt-10 pb-8">
        <div className="max-w-lg mx-auto">
          {agent?.logo_url && (
            <img
              src={agent.logo_url}
              alt={agent.agency_name ?? ''}
              className="h-10 w-auto mb-6 rounded-lg opacity-90"
            />
          )}
          {!agent?.logo_url && agent?.agency_name && (
            <p className="text-blue-200 text-sm font-medium mb-4">{agent.agency_name}</p>
          )}
          <h1 className="text-2xl font-bold leading-tight mb-2">{collection.title}</h1>
          {collection.client?.name && (
            <p className="text-blue-200 text-sm">
              Подготовлено для {collection.client.name}
            </p>
          )}
          {collection.comment && (
            <div className="mt-4 p-3 bg-white/10 backdrop-blur rounded-xl text-sm text-blue-50 leading-relaxed">
              {collection.comment}
            </div>
          )}
          <div className="mt-4 flex items-center gap-2 text-blue-200 text-sm">
            <span className="font-semibold text-white">{properties.length}</span>
            <span>объект{properties.length === 1 ? '' : properties.length < 5 ? 'а' : 'ов'} в подборке</span>
          </div>
        </div>
      </div>

      {/* Properties */}
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {properties.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">
            Объекты в подборке не найдены
          </div>
        )}
        {properties.map((p) => (
          <PropertyCard key={p.id} property={p} />
        ))}
      </div>

      {/* Agent contact bar */}
      {agent && (agent.phone || agent.whatsapp || agent.telegram) && (
        <AgentContact agent={agent} />
      )}
    </div>
  )
}

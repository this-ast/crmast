import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCollectionBySlug } from '@/hooks/useCollections'
import { useAgentSettings } from '@/hooks/useAgentSettings'
import { supabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'
import type { PropertyWithOwner, AgentSettings, ComplexUnit, Complex } from '@/types'
import { PROPERTY_TYPE_LABELS, PROPERTY_TYPE_ICONS, DEAL_TYPE_LABELS } from '@/types'
import { formatPriceShort } from '@/utils/format'
import { cn } from '@/utils/cn'
import {
  Phone, MessageCircle, Send, MapPin,
  ChevronLeft, ChevronRight, Building2, ArrowRight, Printer, Loader2, X,
} from 'lucide-react'
import { downloadElementAsPdf } from '@/utils/downloadPdf'

const GOLD = '#C5A059'

// ─── Card photo with arrows ────────────────────────────────────────────────────

function CardPhoto({ photos, alt }: { photos: string[]; alt: string }) {
  const [idx, setIdx] = useState(0)
  if (!photos || photos.length === 0) {
    return (
      <div className="w-full aspect-video bg-gray-100 flex items-center justify-center">
        <Building2 size={36} className="text-gray-300" />
      </div>
    )
  }
  return (
    <div className="relative w-full aspect-video bg-gray-900 overflow-hidden group">
      <img src={photos[idx]} alt={alt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" loading="lazy" />
      {photos.length > 1 && (
        <>
          <button
            onClick={e => { e.stopPropagation(); setIdx(i => (i - 1 + photos.length) % photos.length) }}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity no-print">
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); setIdx(i => (i + 1) % photos.length) }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity no-print">
            <ChevronRight size={16} />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 no-print">
            {photos.slice(0, 7).map((_, i) => (
              <button key={i} onClick={e => { e.stopPropagation(); setIdx(i) }}
                className={cn('w-1.5 h-1.5 rounded-full transition-all', i === idx ? 'bg-white scale-110' : 'bg-white/40')} />
            ))}
          </div>
        </>
      )}
      {/* Photo count */}
      <div className="absolute top-3 right-3 bg-black/50 text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 no-print">
        {photos.length} фото
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

  const specs: string[] = []
  if (property.area > 0) specs.push(`${property.area} м²`)
  if (property.rooms !== undefined) specs.push(property.rooms === 0 ? 'Студия' : `${property.rooms}-комн.`)
  if (property.floor && property.total_floors) specs.push(`${property.floor}/${property.total_floors} эт.`)
  else if (property.floor) specs.push(`${property.floor} эт.`)
  if (property.renovation) specs.push(property.renovation)

  return (
    <article className="bg-white border border-gray-100 overflow-hidden print:break-inside-avoid">
      {/* Photo */}
      <CardPhoto photos={property.photos} alt={property.address} />

      {/* Content */}
      <div className="p-6 md:p-8">
        {/* Number + type */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-300 text-xs font-bold uppercase tracking-[0.2em]">
            {String(index + 1).padStart(2, '0')}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              {typeIcon} {typeLabel}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 text-white"
              style={{ background: GOLD }}>
              {dealLabel}
            </span>
          </div>
        </div>

        {/* Price */}
        <div className="mb-4">
          <div className="serif text-3xl font-normal italic">
            {formatPriceShort(property.price)}
          </div>
          {property.area > 0 && (
            <p className="text-gray-400 text-xs mt-0.5">
              {Math.round(property.price / property.area).toLocaleString('ru-RU')} ₽/м²
            </p>
          )}
        </div>

        {/* Gold divider */}
        <div className="h-px w-8 mb-4" style={{ background: GOLD }} />

        {/* Specs */}
        {specs.length > 0 && (
          <div className="flex flex-wrap gap-x-5 gap-y-1 mb-4">
            {specs.map(s => (
              <span key={s} className="text-sm font-semibold text-gray-800">{s}</span>
            ))}
          </div>
        )}

        {/* Address */}
        <div className="flex items-start gap-1.5 mb-4">
          <MapPin size={13} className="shrink-0 mt-0.5 text-gray-300" />
          <div>
            <p className="text-sm text-gray-600">{property.address}</p>
            {property.complex_name && (
              <p className="text-xs text-gray-400 mt-0.5">ЖК «{property.complex_name}»</p>
            )}
          </div>
        </div>

        {/* Description snippet */}
        {property.description && (
          <p className="text-sm text-gray-500 leading-relaxed mb-5 line-clamp-2">{property.description}</p>
        )}

        {/* Payment tags */}
        {(property.has_mortgage || property.has_installment || property.has_trade_in || property.has_maternal_cap) && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {property.has_mortgage && <span className="text-[9px] uppercase font-bold tracking-widest px-2.5 py-1 border border-gray-200 text-gray-400">Ипотека</span>}
            {property.has_installment && <span className="text-[9px] uppercase font-bold tracking-widest px-2.5 py-1 border border-gray-200 text-gray-400">Рассрочка</span>}
            {property.has_trade_in && <span className="text-[9px] uppercase font-bold tracking-widest px-2.5 py-1 border border-gray-200 text-gray-400">Трейд-ин</span>}
            {property.has_maternal_cap && <span className="text-[9px] uppercase font-bold tracking-widest px-2.5 py-1 border border-gray-200 text-gray-400">Маткапитал</span>}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={onOpen}
          className="flex items-center gap-2 px-6 py-2.5 text-white text-[10px] font-bold uppercase tracking-[0.15em] hover:opacity-90 transition-opacity no-print"
          style={{ background: '#111' }}
        >
          Подробнее <ArrowRight size={13} />
        </button>
      </div>
    </article>
  )
}

// ─── Developer Unit Full Detail (overlay) ─────────────────────────────────────

function UnitFullDetail({ unit, complex, onClose }: {
  unit: ComplexUnit & { complex_name?: string }
  complex: Complex | undefined
  onClose: () => void
}) {
  const [photoIdx, setPhotoIdx] = useState(0)
  const photos = unit.photos?.length ? unit.photos : (complex?.photos ?? [])
  const label = unit.title
    ? unit.title
    : unit.rooms != null
      ? (unit.rooms === 0 ? 'Студия' : `${unit.rooms}-комн. квартира`)
      : 'Квартира'

  const specs: string[] = []
  if (unit.area) specs.push(`${unit.area} м²`)
  if (unit.rooms != null) specs.push(unit.rooms === 0 ? 'Студия' : `${unit.rooms}-комн.`)
  if (unit.floor && unit.total_floors) specs.push(`${unit.floor}/${unit.total_floors} эт.`)
  else if (unit.floor) specs.push(`${unit.floor} эт.`)

  const paymentTypes: string[] = []
  if (complex?.pricing_conditions?.length) {
    complex.pricing_conditions.forEach((pc) => {
      if (pc.payment_type === 'mortgage') paymentTypes.push('Ипотека')
      if (pc.payment_type === 'installment') paymentTypes.push('Рассрочка')
      if (pc.payment_type === 'escrow') paymentTypes.push('Эскроу')
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto no-print">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div>
          <p className="font-bold text-gray-900 text-sm">{label}</p>
          {complex?.name && <p className="text-xs text-gray-400 mt-0.5">ЖК «{complex.name}»</p>}
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <X size={20} className="text-gray-600" />
        </button>
      </div>

      {/* Photos */}
      {photos.length > 0 && (
        <div className="relative w-full bg-gray-900 group" style={{ height: 'min(60vh, 480px)' }}>
          <img src={photos[photoIdx]} alt={label} className="w-full h-full object-cover" />
          {photos.length > 1 && (
            <>
              <button
                onClick={() => setPhotoIdx(i => (i - 1 + photos.length) % photos.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => setPhotoIdx(i => (i + 1) % photos.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight size={20} />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                {photos.slice(0, 9).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPhotoIdx(i)}
                    className={cn('w-2 h-2 rounded-full transition-all', i === photoIdx ? 'bg-white' : 'bg-white/40')}
                  />
                ))}
              </div>
              <div className="absolute top-3 right-3 bg-black/50 text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1">
                {photos.length} фото
              </div>
            </>
          )}
        </div>
      )}

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 md:px-10 py-10">
        {/* Badges */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">🏗 Новостройка</span>
          <span
            className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 text-white"
            style={{ background: GOLD }}
          >
            От застройщика
          </span>
        </div>

        {/* Price */}
        {unit.price != null && (
          <div className="mb-4">
            <div className="serif text-4xl font-normal italic">{formatPriceShort(unit.price)}</div>
            {unit.area && (
              <p className="text-gray-400 text-sm mt-1">
                {Math.round(unit.price / unit.area).toLocaleString('ru-RU')} ₽/м²
              </p>
            )}
          </div>
        )}

        <div className="h-px w-12 mb-6" style={{ background: GOLD }} />

        {/* Specs */}
        {specs.length > 0 && (
          <div className="flex flex-wrap gap-x-6 gap-y-2 mb-6">
            {specs.map(s => (
              <span key={s} className="text-lg font-semibold text-gray-800">{s}</span>
            ))}
          </div>
        )}

        {/* Location */}
        {(complex?.name || complex?.address || complex?.district || complex?.developer) && (
          <div className="flex items-start gap-2 mb-6">
            <MapPin size={15} className="shrink-0 mt-0.5 text-gray-300" />
            <div>
              {complex?.name && <p className="text-sm text-gray-700 font-medium">ЖК «{complex.name}»</p>}
              {complex?.address && <p className="text-sm text-gray-500 mt-0.5">{complex.address}</p>}
              {complex?.district && <p className="text-xs text-gray-400 mt-0.5">{complex.district}</p>}
              {complex?.developer && (
                <p className="text-xs text-gray-400 mt-0.5">Застройщик: {complex.developer}</p>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        {(complex?.description || unit.notes) && (
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            {[complex?.description, unit.notes].filter(Boolean).join('\n\n')}
          </p>
        )}

        {/* Payment tags */}
        {paymentTypes.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {[...new Set(paymentTypes)].map(t => (
              <span key={t} className="text-[9px] uppercase font-bold tracking-widest px-3 py-1.5 border border-gray-200 text-gray-400">
                {t}
              </span>
            ))}
          </div>
        )}

        {complex?.completion_date && (
          <p className="text-sm text-gray-400">
            Срок сдачи: <span className="font-medium text-gray-600">{complex.completion_date}</span>
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Developer Unit Card ───────────────────────────────────────────────────────

function UnitCard({ unit, complex, index, onOpen }: {
  unit: ComplexUnit & { complex_name?: string }
  complex: Complex | undefined
  index: number
  onOpen: () => void
}) {
  const photos = (unit.photos?.length ? unit.photos : complex?.photos) ?? []
  const label = unit.title
    ? unit.title
    : unit.rooms
      ? (unit.rooms === 0 ? 'Студия' : `${unit.rooms}-комн. квартира`)
      : 'Квартира'

  const specs: string[] = []
  if (unit.area) specs.push(`${unit.area} м²`)
  if (unit.rooms !== undefined) specs.push(unit.rooms === 0 ? 'Студия' : `${unit.rooms}-комн.`)
  if (unit.floor && unit.total_floors) specs.push(`${unit.floor}/${unit.total_floors} эт.`)
  else if (unit.floor) specs.push(`${unit.floor} эт.`)

  const paymentTypes: string[] = []
  if (complex?.pricing_conditions?.length) {
    complex.pricing_conditions.forEach((pc) => {
      if (pc.payment_type === 'mortgage') paymentTypes.push('Ипотека')
      if (pc.payment_type === 'installment') paymentTypes.push('Рассрочка')
      if (pc.payment_type === 'escrow') paymentTypes.push('Эскроу')
    })
  }

  const location = [complex?.address, complex?.district].filter(Boolean).join(', ')

  return (
    <article className="bg-white border border-gray-100 overflow-hidden print:break-inside-avoid">
      <CardPhoto photos={photos} alt={label} />

      <div className="p-6 md:p-8">
        {/* Number + badge */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-300 text-xs font-bold uppercase tracking-[0.2em]">
            {String(index + 1).padStart(2, '0')}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              🏗 Новостройка
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 text-white"
              style={{ background: GOLD }}>
              От застройщика
            </span>
          </div>
        </div>

        {/* Price */}
        {unit.price != null && (
          <div className="mb-4">
            <div className="serif text-3xl font-normal italic">
              {formatPriceShort(unit.price)}
            </div>
            {unit.area && (
              <p className="text-gray-400 text-xs mt-0.5">
                {Math.round(unit.price / unit.area).toLocaleString('ru-RU')} ₽/м²
              </p>
            )}
          </div>
        )}

        <div className="h-px w-8 mb-4" style={{ background: GOLD }} />

        {/* Specs */}
        {specs.length > 0 && (
          <div className="flex flex-wrap gap-x-5 gap-y-1 mb-4">
            {specs.map((s) => (
              <span key={s} className="text-sm font-semibold text-gray-800">{s}</span>
            ))}
          </div>
        )}

        {/* ЖК name + location */}
        <div className="flex items-start gap-1.5 mb-4">
          <MapPin size={13} className="shrink-0 mt-0.5 text-gray-300" />
          <div>
            {complex?.name && (
              <p className="text-sm text-gray-600">ЖК «{complex.name}»</p>
            )}
            {location && <p className="text-xs text-gray-400 mt-0.5">{location}</p>}
            {complex?.developer && (
              <p className="text-xs text-gray-400 mt-0.5">Застройщик: {complex.developer}</p>
            )}
          </div>
        </div>

        {/* Description = complex description + unit notes */}
        {(complex?.description || unit.notes) && (
          <p className="text-sm text-gray-500 leading-relaxed mb-5 line-clamp-2">
            {[complex?.description, unit.notes].filter(Boolean).join(' · ')}
          </p>
        )}

        {/* Payment tags */}
        {paymentTypes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {[...new Set(paymentTypes)].map((t) => (
              <span key={t} className="text-[9px] uppercase font-bold tracking-widest px-2.5 py-1 border border-gray-200 text-gray-400">{t}</span>
            ))}
          </div>
        )}

        {complex?.completion_date && (
          <p className="text-xs text-gray-400 mb-5">Срок сдачи: {complex.completion_date}</p>
        )}

        {/* CTA */}
        <button
          onClick={onOpen}
          className="flex items-center gap-2 px-6 py-2.5 text-white text-[10px] font-bold uppercase tracking-[0.15em] hover:opacity-90 transition-opacity no-print"
          style={{ background: '#111' }}
        >
          Подробнее <ArrowRight size={13} />
        </button>
      </div>
    </article>
  )
}

// ─── Agent Footer ─────────────────────────────────────────────────────────────

function AgentFooter({ agent }: { agent: AgentSettings }) {
  const phone = agent.phone?.replace(/\D/g, '')
  const wa = (agent.whatsapp ?? agent.phone)?.replace(/\D/g, '')
  const tg = agent.telegram?.replace('@', '')

  return (
    <footer className="border-t border-gray-100 pt-10 flex flex-col md:flex-row items-center justify-between gap-8">
      <div className="flex items-center gap-6">
        {agent.logo_url ? (
          <img src={agent.logo_url} alt={agent.name ?? ''} className="w-20 h-20 rounded-full object-cover grayscale" />
        ) : (
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold"
            style={{ background: 'linear-gradient(135deg, #1a1a1a, #333)' }}>
            {(agent.name ?? 'А')[0].toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-gray-400 uppercase text-[10px] tracking-widest mb-1">Ваш персональный эксперт</p>
          <h3 className="serif text-2xl font-normal">{agent.name ?? 'Агент'}</h3>
          {agent.agency_name && (
            <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: GOLD }}>
              {agent.agency_name}
            </p>
          )}
        </div>
      </div>
      <div className="text-center md:text-right">
        {agent.phone && <p className="text-xl font-bold mb-3">{agent.phone}</p>}
        <div className="flex gap-2 justify-center md:justify-end no-print flex-wrap">
          {phone && (
            <a href={`tel:+${phone}`}
              className="flex items-center gap-1.5 px-5 py-2 bg-black text-white text-[10px] font-bold uppercase tracking-widest hover:bg-gray-800 transition">
              <Phone size={12} /> Позвонить
            </a>
          )}
          {wa && (
            <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-5 py-2 text-white text-[10px] font-bold uppercase tracking-widest"
              style={{ background: '#25D366' }}>
              <MessageCircle size={12} /> WhatsApp
            </a>
          )}
          {tg && (
            <a href={`https://t.me/${tg}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-5 py-2 text-white text-[10px] font-bold uppercase tracking-widest"
              style={{ background: '#229ED9' }}>
              <Send size={12} /> Telegram
            </a>
          )}
        </div>
      </div>
    </footer>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function CollectionPublicPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const contentRef = useRef<HTMLDivElement>(null)
  const [generating, setGenerating] = useState(false)
  const [openUnit, setOpenUnit] = useState<{
    unit: ComplexUnit & { complex_name?: string }
    complex: Complex | undefined
  } | null>(null)
  const { data: collection, isLoading: loadingCollection } = useCollectionBySlug(slug ?? '')
  const { data: agent } = useAgentSettings()

  async function handleDownload() {
    if (!contentRef.current || generating) return
    setGenerating(true)
    try {
      await downloadElementAsPdf(contentRef.current, collection?.title ?? 'подборка')
    } finally {
      setGenerating(false)
    }
  }

  const { data: properties = [], isLoading: loadingProps } = useQuery({
    queryKey: ['public-collection-props', collection?.id],
    queryFn: async (): Promise<PropertyWithOwner[]> => {
      if (!collection || collection.property_ids.length === 0) return []
      const { data, error } = await supabase
        .from('properties').select('*').in('id', collection.property_ids)
      if (error) throw new Error(error.message)
      const map = new Map((data ?? []).map(p => [p.id, p]))
      return collection.property_ids.map(id => map.get(id)).filter(Boolean) as PropertyWithOwner[]
    },
    enabled: !!collection,
  })

  const { data: units = [], isLoading: loadingUnits } = useQuery({
    queryKey: ['public-collection-units', collection?.id],
    queryFn: async (): Promise<(ComplexUnit & { complex_name?: string })[]> => {
      const ids = collection?.unit_ids ?? []
      if (!ids.length) return []
      const { data, error } = await supabase.from('complex_units').select('*').in('id', ids)
      if (error) throw new Error(error.message)
      const map = new Map((data ?? []).map(u => [u.id, u]))
      return ids.map(id => map.get(id)).filter(Boolean) as ComplexUnit[]
    },
    enabled: !!collection,
  })

  const complexIds = [...new Set(units.map(u => u.complex_id).filter(Boolean))]
  const { data: complexesForUnits = [] } = useQuery({
    queryKey: ['public-collection-complexes', complexIds.join(',')],
    queryFn: async (): Promise<Complex[]> => {
      if (!complexIds.length) return []
      const { data, error } = await supabase.from('complexes').select('*').in('id', complexIds)
      if (error) throw new Error(error.message)
      return (data ?? []) as Complex[]
    },
    enabled: complexIds.length > 0,
  })
  const complexMap = new Map(complexesForUnits.map(c => [c.id, c]))

  if (loadingCollection || loadingProps || loadingUnits) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-6 h-6 border border-gray-300 border-t-gray-800 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-xs uppercase tracking-widest">Загрузка подборки</p>
        </div>
      </div>
    )
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="serif text-2xl mb-2">Подборка не найдена</h1>
          <p className="text-gray-400 text-sm">Возможно, ссылка устарела или была удалена.</p>
        </div>
      </div>
    )
  }

  const allPrices = [
    ...properties.map(p => p.price),
    ...units.map(u => u.price),
  ].filter((v): v is number => v != null && v > 0).sort((a, b) => a - b)
  const priceRange = allPrices.length > 1
    ? `${formatPriceShort(allPrices[0])} — ${formatPriceShort(allPrices[allPrices.length - 1])}`
    : allPrices.length === 1 ? formatPriceShort(allPrices[0]) : null

  const totalCount = properties.length + units.length

  // Cover photo = first photo of first property or first complex
  const coverPhoto = properties[0]?.photos?.[0]
    ?? complexesForUnits[0]?.photos?.[0]
    ?? null

  return (
    <div className="min-h-screen bg-white" ref={contentRef}>

      {/* ── Cover ──────────────────────────────────────────────────────────── */}
      <div className="relative bg-gray-900" style={{ height: 'min(60vh, 480px)', minHeight: 280 }}>
        {coverPhoto ? (
          <img src={coverPhoto} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : null}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.5) 100%)' }} />

        {/* Agency branding */}
        {agent && (
          <div className="absolute top-6 right-6 flex items-center gap-2">
            {agent.logo_url ? (
              <img src={agent.logo_url} alt={agent.agency_name ?? ''} className="h-8 w-auto opacity-75 brightness-0 invert" />
            ) : agent.agency_name ? (
              <span className="text-white/60 text-xs font-bold uppercase tracking-widest">{agent.agency_name}</span>
            ) : null}
          </div>
        )}

        {/* Cover content */}
        <div className="absolute bottom-0 left-0 right-0 px-8 md:px-12 pb-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] mb-3" style={{ color: GOLD }}>
            Персональная подборка
          </p>
          <h1 className="serif text-3xl md:text-5xl text-white font-normal italic leading-tight mb-3">
            {collection.title}
          </h1>
          {collection.client?.name && (
            <p className="text-white/50 text-sm">
              Подготовлено для <span className="text-white/80 font-medium">{collection.client.name}</span>
            </p>
          )}
          <div className="flex items-center gap-4 mt-4 flex-wrap">
            <span className="text-white/50 text-xs uppercase tracking-widest">
              {totalCount} {totalCount === 1 ? 'объект' : totalCount < 5 ? 'объекта' : 'объектов'}
            </span>
            {priceRange && (
              <span className="text-xs font-bold" style={{ color: GOLD }}>
                {priceRange}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Comment ────────────────────────────────────────────────────────── */}
      {collection.comment && (
        <div className="max-w-5xl mx-auto px-6 md:px-10 py-8 border-b border-gray-100">
          <p className="text-gray-500 leading-relaxed text-sm italic max-w-2xl">
            «{collection.comment}»
          </p>
        </div>
      )}

      {/* ── Property list ──────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 md:px-10 py-10 space-y-6">
        {totalCount === 0 && (
          <p className="text-center text-gray-400 py-16 text-sm uppercase tracking-widest">
            Объекты не найдены
          </p>
        )}
        {properties.map((p, i) => (
          <PropertyCard key={p.id} property={p} index={i} onOpen={() => navigate(`/p/${p.id}`)} />
        ))}
        {units.map((u, i) => (
          <UnitCard
            key={u.id}
            unit={u}
            complex={complexMap.get(u.complex_id)}
            index={properties.length + i}
            onOpen={() => setOpenUnit({ unit: u, complex: complexMap.get(u.complex_id) })}
          />
        ))}
      </div>

      {/* ── Agent footer ───────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 md:px-10 py-10">
        {agent && <AgentFooter agent={agent} />}
      </div>

      {/* ── Download button ────────────────────────────────────────────────── */}
      <div className="no-print flex flex-col items-center gap-2 mt-4 mb-16">
        <button
          onClick={handleDownload}
          disabled={generating}
          className="flex items-center gap-2 text-white px-10 py-4 font-bold uppercase text-xs tracking-[0.2em] hover:opacity-90 transition shadow-lg disabled:opacity-60"
          style={{ background: GOLD }}
        >
          {generating
            ? <><Loader2 size={14} className="animate-spin" /> Открываю...</>
            : <><Printer size={14} /> Скачать PDF</>
          }
        </button>
        <p className="text-gray-400 text-[10px] uppercase tracking-widest">
          В диалоге выбери «Сохранить как PDF»
        </p>
      </div>

      {/* Unit full detail overlay */}
      {openUnit && (
        <UnitFullDetail
          unit={openUnit.unit}
          complex={openUnit.complex}
          onClose={() => setOpenUnit(null)}
        />
      )}
    </div>
  )
}

import { useState, useRef, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAgentSettings } from '@/hooks/useAgentSettings'
import type { Property, AgentSettings } from '@/types'
import { PROPERTY_TYPE_LABELS, DEAL_TYPE_LABELS } from '@/types'
import { formatPriceShort, formatPrice } from '@/utils/format'
import { cn } from '@/utils/cn'
import { MapPin, Phone, MessageCircle, Send, ChevronLeft, ChevronRight, X, Building2, Printer, Loader2 } from 'lucide-react'
import { downloadElementAsPdf } from '@/utils/downloadPdf'

// ─── Gold accent ───────────────────────────────────────────────────────────────
const GOLD = '#C5A059'

// ─── Lightbox ──────────────────────────────────────────────────────────────────

function Lightbox({ photos, startIdx, onClose }: { photos: string[]; startIdx: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIdx)
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col no-print" onClick={onClose}>
      <div className="flex items-center justify-between px-5 pt-5 pb-2 shrink-0">
        <span className="text-white/40 text-xs tracking-widest uppercase">{idx + 1} / {photos.length}</span>
        <button onClick={onClose} className="p-2 text-white/60 hover:text-white">
          <X size={20} />
        </button>
      </div>
      <div className="flex-1 relative flex items-center justify-center overflow-hidden" onClick={e => e.stopPropagation()}>
        <img src={photos[idx]} alt="" className="max-h-full max-w-full object-contain select-none" draggable={false} />
        {photos.length > 1 && (
          <>
            <button onClick={() => setIdx(i => (i - 1 + photos.length) % photos.length)}
              className="absolute left-3 p-2.5 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors">
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => setIdx(i => (i + 1) % photos.length)}
              className="absolute right-3 p-2.5 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors">
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>
      <div className="flex gap-2 px-5 py-4 overflow-x-auto shrink-0">
        {photos.map((p, i) => (
          <button key={i} onClick={e => { e.stopPropagation(); setIdx(i) }}
            className={cn('shrink-0 w-14 h-14 rounded overflow-hidden border transition-all',
              i === idx ? 'border-white' : 'border-transparent opacity-40 hover:opacity-70')}>
            <img src={p} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Section Title ─────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="serif text-2xl md:text-3xl mb-8 pl-5 italic font-normal"
      style={{ borderLeft: `4px solid ${GOLD}` }}>
      {children}
    </h2>
  )
}

// ─── Gold Divider ──────────────────────────────────────────────────────────────

function GoldLine() {
  return <div className="h-px w-12 mb-6" style={{ background: GOLD }} />
}

// ─── Feature Row ──────────────────────────────────────────────────────────────

function FeatureRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex justify-between items-center border-b border-gray-100 pb-2.5 pt-1 gap-4">
      <span className="text-gray-400 uppercase text-[10px] tracking-widest shrink-0">{label}</span>
      <span className="font-semibold text-sm text-right">{value}</span>
    </li>
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
        {agent.phone && (
          <p className="text-xl font-bold mb-3">{agent.phone}</p>
        )}
        <div className="flex gap-2 justify-center md:justify-end no-print flex-wrap">
          {phone && (
            <a href={`tel:+${phone}`}
              className="flex items-center gap-1.5 px-5 py-2 bg-black text-white text-[10px] font-bold uppercase tracking-widest hover:bg-gray-800 transition">
              <Phone size={12} /> Позвонить
            </a>
          )}
          {wa && (
            <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-5 py-2 text-white text-[10px] font-bold uppercase tracking-widest transition"
              style={{ background: '#25D366' }}>
              <MessageCircle size={12} /> WhatsApp
            </a>
          )}
          {tg && (
            <a href={`https://t.me/${tg}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-5 py-2 text-white text-[10px] font-bold uppercase tracking-widest transition"
              style={{ background: '#229ED9' }}>
              <Send size={12} /> Telegram
            </a>
          )}
        </div>
      </div>
    </footer>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PropertyPublicPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const autoPdf = searchParams.get('pdf') === '1'
  const [lbIdx, setLbIdx] = useState<number | null>(null)
  const [generating, setGenerating] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  async function handleDownload() {
    if (!contentRef.current || generating) return
    setGenerating(true)
    try {
      const filename = property ? `${property.article} — ${property.address}` : 'presentation'
      await downloadElementAsPdf(contentRef.current, filename)
    } finally {
      setGenerating(false)
    }
  }

  // Auto-download when opened with ?pdf=1 (from PropertyDetail button)
  useEffect(() => {
    if (!autoPdf || !property || !contentRef.current || generating) return
    // Wait for images to render
    const t = setTimeout(() => { handleDownload() }, 1200)
    return () => clearTimeout(t)
  }, [autoPdf, property])

  const { data: property, isLoading } = useQuery({
    queryKey: ['public-property', id],
    queryFn: async (): Promise<Property | null> => {
      if (!id) return null
      const { data, error } = await supabase
        .from('properties').select('*').eq('id', id).maybeSingle()
      if (error) throw new Error(error.message)
      return data as Property | null
    },
    enabled: !!id,
  })

  const { data: agent } = useAgentSettings()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-6 h-6 border border-gray-300 border-t-gray-800 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-xs uppercase tracking-widest">Загрузка</p>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="serif text-2xl mb-2">Объект не найден</h1>
          <p className="text-gray-400 text-sm">Ссылка устарела или объект был удалён.</p>
        </div>
      </div>
    )
  }

  const photos = property.photos ?? []
  const typeLabel = PROPERTY_TYPE_LABELS[property.type]
  const dealLabel = DEAL_TYPE_LABELS[property.deal_type]

  // Features for the right column block
  const features: Array<[string, string]> = []
  if (property.rooms !== undefined) features.push(['Комнаты', property.rooms === 0 ? 'Студия' : String(property.rooms)])
  if (property.area) features.push(['Площадь', `${property.area} м²`])
  if (property.floor) features.push(['Этаж', property.total_floors ? `${property.floor} из ${property.total_floors}` : String(property.floor)])
  if (property.ceiling_height) features.push(['Потолки', `${property.ceiling_height} м`])
  if (property.renovation) features.push(['Ремонт', property.renovation])
  if (property.bathroom_type) features.push(['Санузел', property.bathroom_type])
  if (property.kitchen_area) features.push(['Кухня', `${property.kitchen_area} м²`])
  if (property.room_type) features.push(['Тип комнат', property.room_type])
  if (property.market_type) features.push(['Рынок', property.market_type === 'new_build' ? 'Новостройка' : 'Вторичка'])
  if (property.sale_method) features.push(['Способ продажи', property.sale_method])

  // Tags (extra_features + payment options)
  const tags: string[] = [...(property.extra_features ?? [])]
  if (property.has_mortgage) tags.push('Ипотека')
  if (property.has_installment) tags.push('Рассрочка')
  if (property.has_trade_in) tags.push('Трейд-ин')
  if (property.has_maternal_cap) tags.push('Маткапитал')
  if (property.has_military_mort) tags.push('Воен. ипотека')
  if (property.has_parking) tags.push('Паркинг')
  if (property.heated_floor) tags.push('Тёплый пол')

  return (
    <div className="min-h-screen bg-white" ref={contentRef}>
      {lbIdx !== null && (
        <Lightbox photos={photos} startIdx={lbIdx} onClose={() => setLbIdx(null)} />
      )}

      {/* ── Hero Cover ─────────────────────────────────────────────────────── */}
      <div className="relative w-full bg-gray-900" style={{ height: 'min(75vh, 580px)', minHeight: 340 }}>
        {photos.length > 0 ? (
          <img
            src={photos[0]}
            alt={property.address}
            className="absolute inset-0 w-full h-full object-cover cursor-pointer"
            onClick={() => setLbIdx(0)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Building2 size={64} className="text-gray-700" />
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.35) 100%)' }} />

        {/* Agency top-right */}
        {agent && (
          <div className="absolute top-6 right-6 flex items-center gap-2">
            {agent.logo_url ? (
              <img src={agent.logo_url} alt={agent.agency_name ?? ''} className="h-8 w-auto opacity-80 brightness-0 invert" />
            ) : agent.agency_name ? (
              <span className="text-white/70 text-xs font-bold uppercase tracking-widest">{agent.agency_name}</span>
            ) : null}
          </div>
        )}

        {/* Type badge top-left */}
        <div className="absolute top-6 left-6">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 text-white"
            style={{ background: GOLD }}>
            {typeLabel} · {dealLabel}
          </span>
        </div>

        {/* Bottom content */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-8 md:px-12">
          {property.complex_name && (
            <p className="text-white/50 text-xs uppercase tracking-widest mb-2">{property.complex_name}</p>
          )}
          <div className="serif text-4xl md:text-5xl text-white font-normal italic leading-tight mb-2">
            {formatPriceShort(property.price)}
          </div>
          {property.area > 0 && (
            <p className="text-white/50 text-xs mb-3">
              {Math.round(property.price / property.area).toLocaleString('ru-RU')} ₽/м²
            </p>
          )}
          <div className="flex items-center gap-1.5 text-white/65 text-sm">
            <MapPin size={13} className="shrink-0" style={{ color: GOLD }} />
            {property.address}
            {property.district ? ` · ${property.district}` : ''}
          </div>
        </div>
      </div>

      {/* ── Main Content ───────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 md:px-10 py-12">

        {/* ── Quick stats bar ──────────────────────────────────────────────── */}
        {features.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 mb-16 border border-gray-100 divide-x divide-y md:divide-y-0 divide-gray-100">
            {features.slice(0, 4).map(([label, value]) => (
              <div key={label} className="px-5 py-4 text-center">
                <p className="text-gray-400 uppercase text-[9px] tracking-widest mb-1">{label}</p>
                <p className="font-bold text-base">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Gallery ──────────────────────────────────────────────────────── */}
        {photos.length > 0 && (
          <section className="mb-16">
            <SectionTitle>Интерьеры объекта</SectionTitle>
            {photos.length === 1 ? (
              <div className="h-96 rounded-sm overflow-hidden cursor-pointer" onClick={() => setLbIdx(0)}>
                <img src={photos[0]} alt="" className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500" />
              </div>
            ) : (
              <div className="grid grid-cols-12 gap-3">
                {/* Main big photo */}
                <button
                  onClick={() => setLbIdx(0)}
                  className="col-span-8 h-96 overflow-hidden rounded-sm block"
                >
                  <img src={photos[0]} alt="" className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500" />
                </button>
                {/* Right column — 2 photos */}
                <div className="col-span-4 flex flex-col gap-3">
                  {photos.slice(1, 3).map((p, i) => (
                    <button
                      key={i}
                      onClick={() => setLbIdx(i + 1)}
                      className="h-[186px] overflow-hidden rounded-sm relative block"
                    >
                      <img src={p} alt="" className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500" />
                      {i === 1 && photos.length > 3 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white text-2xl font-bold">+{photos.length - 3}</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── Description + Features ───────────────────────────────────────── */}
        {(property.description || features.length > 0 || tags.length > 0) && (
          <section className="grid md:grid-cols-2 gap-12 md:gap-16 mb-16 page-break pt-4">
            {/* Left: description */}
            <div>
              <h2 className="serif text-2xl md:text-3xl mb-4 font-normal">О проекте</h2>
              <GoldLine />
              {property.description ? (
                <div className="text-gray-600 leading-relaxed space-y-4 text-sm whitespace-pre-line">
                  {property.description.split('\n\n').map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm italic">Описание не добавлено</p>
              )}

              {/* Location */}
              {(property.address || property.district) && (
                <div className="mt-8">
                  <h3 className="serif text-lg font-normal mb-3">Местоположение</h3>
                  <GoldLine />
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin size={14} className="shrink-0 mt-0.5" style={{ color: GOLD }} />
                    <div>
                      <p>{property.address}</p>
                      {property.district && <p className="text-gray-400 mt-0.5">Район: {property.district}</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: features block */}
            <div className="bg-gray-50 p-7 rounded-sm">
              <h2 className="serif text-2xl font-normal mb-6">Особенности</h2>
              {features.length > 0 && (
                <ul className="space-y-0 mb-5">
                  {features.map(([label, value]) => (
                    <FeatureRow key={label} label={label} value={value} />
                  ))}
                </ul>
              )}
              {/* Window views */}
              {property.window_views && property.window_views.length > 0 && (
                <div className="mb-4">
                  <p className="text-gray-400 uppercase text-[10px] tracking-widest mb-2">Вид из окна</p>
                  <div className="flex flex-wrap gap-1.5">
                    {property.window_views.map(v => (
                      <span key={v} className="bg-white px-2.5 py-1 text-[9px] uppercase font-bold text-gray-400 border border-gray-200">
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {/* Furniture */}
              {property.furniture && property.furniture.length > 0 && (
                <div className="mb-4">
                  <p className="text-gray-400 uppercase text-[10px] tracking-widest mb-2">Мебель</p>
                  <div className="flex flex-wrap gap-1.5">
                    {property.furniture.map(f => (
                      <span key={f} className="bg-white px-2.5 py-1 text-[9px] uppercase font-bold text-gray-400 border border-gray-200">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {/* Tags */}
              {tags.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {tags.map(t => (
                    <span key={t}
                      className="bg-white px-2.5 py-1 text-[9px] uppercase font-bold text-gray-400 border border-gray-200 rounded-full">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Article ───────────────────────────────────────────────────────── */}
        <div className="mb-12 text-right">
          <p className="text-gray-300 text-[10px] uppercase tracking-widest">
            Артикул: <span className="font-mono font-bold text-gray-400">{property.article}</span>
          </p>
        </div>

        {/* ── Agent Footer ──────────────────────────────────────────────────── */}
        {agent && <AgentFooter agent={agent} />}
      </div>

      {/* ── Download Button ───────────────────────────────────────────────────── */}
      <div className="no-print flex justify-center mt-8 mb-20">
        <button
          onClick={handleDownload}
          disabled={generating}
          className="flex items-center gap-2 text-white px-10 py-4 font-bold uppercase text-xs tracking-[0.2em] hover:opacity-90 transition-all shadow-lg disabled:opacity-60"
          style={{ background: GOLD }}
        >
          {generating
            ? <><Loader2 size={14} className="animate-spin" /> Подготовка...</>
            : <><Printer size={14} /> Скачать PDF</>
          }
        </button>
      </div>
    </div>
  )
}

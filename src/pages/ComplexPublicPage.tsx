import { useState, useRef, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAgentSettings } from '@/hooks/useAgentSettings'
import type { Complex, AgentSettings } from '@/types'
import { cn } from '@/utils/cn'
import { MapPin, Phone, MessageCircle, Send, ChevronLeft, ChevronRight, X, Building2, Printer, Loader2 } from 'lucide-react'
import { downloadElementAsPdf } from '@/utils/downloadPdf'

const GOLD = '#C5A059'

function Lightbox({ photos, startIdx, onClose }: { photos: string[]; startIdx: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIdx)
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 })
  const [swipeDy, setSwipeDy] = useState(0)
  const [dismissing, setDismissing] = useState(false)

  function handleTouchStart(e: React.TouchEvent) {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY })
  }
  function handleTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStart.x
    const dy = e.changedTouches[0].clientY - touchStart.y
    if (Math.abs(dy) > 60 && Math.abs(dy) > Math.abs(dx)) {
      setDismissing(true)
      setSwipeDy(dy > 0 ? 400 : -400)
      setTimeout(() => { onClose(); setSwipeDy(0); setDismissing(false) }, 220)
    } else if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      setIdx(i => dx < 0 ? (i + 1) % photos.length : (i - 1 + photos.length) % photos.length)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col no-print"
      style={{ opacity: dismissing ? 0.6 : 1, transition: dismissing ? 'opacity 0.22s' : undefined }}
      onClick={onClose}>
      <div className="flex items-center justify-between px-5 pt-5 pb-2 shrink-0">
        <span className="text-white/40 text-xs tracking-widest uppercase">{idx + 1} / {photos.length}</span>
        <button onClick={onClose} className="p-2 text-white/60 hover:text-white"><X size={20} /></button>
      </div>
      <div
        className="flex-1 relative flex items-center justify-center overflow-hidden"
        onClick={e => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={photos[idx]}
          alt=""
          className="max-h-full max-w-full object-contain select-none"
          draggable={false}
          style={{
            transform: `translateY(${swipeDy}px)`,
            transition: dismissing ? 'transform 0.22s ease' : undefined,
          }}
        />
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="serif text-2xl md:text-3xl mb-8 pl-5 italic font-normal"
      style={{ borderLeft: `4px solid ${GOLD}` }}>
      {children}
    </h2>
  )
}

function GoldLine() {
  return <div className="h-px w-12 mb-6" style={{ background: GOLD }} />
}

function FeatureRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex justify-between items-center border-b border-gray-100 pb-2.5 pt-1 gap-4">
      <span className="text-gray-400 uppercase text-[10px] tracking-widest shrink-0">{label}</span>
      <span className="font-semibold text-sm text-right">{value}</span>
    </li>
  )
}

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

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Наличный',
  installment: 'Рассрочка',
  mortgage: 'Ипотека',
  escrow: 'Эскроу',
  other: 'Другое',
}

const PAYMENT_BADGE_COLORS: Record<string, string> = {
  cash: '#16a34a',
  installment: '#2563eb',
  mortgage: '#7c3aed',
  escrow: '#d97706',
  other: '#64748b',
}

export default function ComplexPublicPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const autoPdf = searchParams.get('pdf') === '1'
  const [lbIdx, setLbIdx] = useState<number | null>(null)
  const [layoutLbIdx, setLayoutLbIdx] = useState<number | null>(null)
  const [generating, setGenerating] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const { data: complex, isLoading } = useQuery({
    queryKey: ['public-complex', id],
    queryFn: async (): Promise<Complex | null> => {
      if (!id) return null
      const { data, error } = await supabase
        .from('complexes').select('*').eq('id', id).maybeSingle()
      if (error) throw new Error(error.message)
      if (!data) return null
      const row = data as unknown as Record<string, unknown>
      return {
        ...(row as unknown as Complex),
        photos: (row.photos as string[]) ?? [],
        layouts: (row.layouts as string[]) ?? [],
        documents: (row.documents as never[]) ?? [],
        characteristics: (row.characteristics as Record<string, string>) ?? {},
        developer_phones: (row.developer_phones as string[]) ?? [],
        manager_names: (row.manager_names as string[]) ?? [],
        manager_phones: (row.manager_phones as string[]) ?? [],
        pricing_conditions: (row.pricing_conditions as never[]) ?? [],
      }
    },
    enabled: !!id,
  })

  const { data: agent } = useAgentSettings()

  async function handleDownload() {
    if (!contentRef.current || generating) return
    setGenerating(true)
    try {
      await downloadElementAsPdf(contentRef.current, complex?.name ?? 'complex')
    } finally {
      setGenerating(false)
    }
  }

  useEffect(() => {
    if (!autoPdf || !complex || !contentRef.current || generating) return
    const t = setTimeout(() => { handleDownload() }, 1200)
    return () => clearTimeout(t)
  }, [autoPdf, complex])

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

  if (!complex) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center">
          <Building2 size={48} className="text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400 text-sm uppercase tracking-widest">Жилой комплекс не найден</p>
        </div>
      </div>
    )
  }

  const photos = complex.photos ?? []
  const layouts = complex.layouts ?? []
  const coverPhoto = photos[0]

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900" ref={contentRef}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 no-print">
        {agent?.agency_name ? (
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: GOLD }}>
            {agent.agency_name}
          </span>
        ) : <span />}
        <div className="flex gap-3">
          <button
            onClick={handleDownload}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 text-white text-[10px] font-bold uppercase tracking-widest transition disabled:opacity-50"
            style={{ background: GOLD }}
          >
            {generating ? <Loader2 size={12} className="animate-spin" /> : <Printer size={12} />}
            Скачать PDF
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden print-hero" style={{ height: '75vh', minHeight: 480 }}>
        {coverPhoto ? (
          <img src={coverPhoto} alt={complex.name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)' }} />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 100%)' }} />
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-14">
          {complex.developer && (
            <p className="text-white/60 text-[10px] uppercase tracking-[0.3em] mb-3">{complex.developer}</p>
          )}
          <h1 className="serif text-4xl md:text-6xl font-normal italic text-white mb-4 leading-tight">
            {complex.name}
          </h1>
          {(complex.district || complex.address) && (
            <p className="text-white/70 text-sm flex items-center gap-1.5">
              <MapPin size={14} />
              {[complex.district, complex.address].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
      </div>

      {/* Quick stats */}
      <div className="border-b border-gray-100 px-8 md:px-14">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
          {[
            complex.floors_total && { label: 'Этажность', value: `${complex.floors_total} эт.` },
            complex.building_type && { label: 'Тип дома', value: complex.building_type },
            complex.completion_date && { label: 'Срок сдачи', value: complex.completion_date },
            complex.elevator && complex.elevator !== 'нет' && { label: 'Лифт', value: complex.elevator },
          ].filter(Boolean).slice(0, 4).map((stat, i) => stat && (
            <div key={i} className="py-5 px-5 first:pl-0 text-center">
              <p className="text-gray-400 text-[9px] uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-base font-bold">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-6 md:px-14 py-14 space-y-16">

        {/* Photo gallery */}
        {photos.length > 0 && (
          <section>
            <SectionTitle>Фотографии</SectionTitle>
            {photos.length === 1 ? (
              <div className="w-full rounded-2xl overflow-hidden cursor-pointer" style={{ height: 480 }}
                onClick={() => setLbIdx(0)}>
                <img src={photos[0]} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </div>
            ) : (
              <div className="grid gap-2" style={{ gridTemplateColumns: photos.length >= 3 ? '1fr 1fr 1fr' : '1fr 1fr', gridTemplateRows: 'auto' }}>
                {photos.slice(0, 8).map((url, i) => (
                  <div key={i}
                    className={cn('overflow-hidden rounded-xl cursor-pointer bg-gray-100',
                      i === 0 && photos.length >= 3 ? 'col-span-2 row-span-2' : '')}
                    style={{ height: i === 0 && photos.length >= 3 ? 400 : 190 }}
                    onClick={() => setLbIdx(i)}>
                    <img src={url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                  </div>
                ))}
              </div>
            )}
            {photos.length > 8 && (
              <button onClick={() => setLbIdx(8)}
                className="mt-3 text-xs uppercase tracking-widest text-gray-400 hover:text-gray-700 transition-colors">
                + ещё {photos.length - 8} фото
              </button>
            )}
          </section>
        )}

        {/* About section */}
        {(complex.description || Object.keys(complex.characteristics ?? {}).length > 0) && (
          <section>
            <SectionTitle>О комплексе</SectionTitle>
            <div className="grid md:grid-cols-2 gap-10">
              {complex.description && (
                <div>
                  <GoldLine />
                  <p className="text-gray-600 leading-relaxed text-sm" style={{ whiteSpace: 'pre-wrap' }}>
                    {complex.description}
                  </p>
                </div>
              )}
              {Object.keys(complex.characteristics ?? {}).length > 0 && (
                <div>
                  <GoldLine />
                  <ul className="space-y-0">
                    {Object.entries(complex.characteristics).map(([k, v]) => (
                      <FeatureRow key={k} label={k} value={v} />
                    ))}
                    {complex.yard_features && complex.yard_features.length > 0 && (
                      <FeatureRow label="Двор" value={complex.yard_features.join(', ')} />
                    )}
                    {complex.parking && complex.parking.length > 0 && (
                      <FeatureRow label="Парковка" value={complex.parking.join(', ')} />
                    )}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Pricing conditions */}
        {complex.pricing_conditions && complex.pricing_conditions.length > 0 && (
          <section>
            <SectionTitle>Условия сделки</SectionTitle>
            <div className="space-y-3">
              {complex.pricing_conditions.map((cond) => (
                <div key={cond.id} className="flex items-center justify-between p-5 border border-gray-100 rounded-2xl hover:border-gray-200 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: PAYMENT_BADGE_COLORS[cond.payment_type] ?? PAYMENT_BADGE_COLORS.other }} />
                    <div>
                      <p className="font-semibold text-sm">{cond.label || PAYMENT_LABELS[cond.payment_type]}</p>
                      {cond.notes && <p className="text-gray-400 text-xs mt-0.5">{cond.notes}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    {cond.price_per_sqm && (
                      <p className="font-bold text-base">{new Intl.NumberFormat('ru-RU').format(cond.price_per_sqm)} <span className="text-gray-400 text-xs font-normal">₽/м²</span></p>
                    )}
                    {cond.updated_at && (
                      <p className="text-gray-300 text-[10px] mt-0.5">{cond.updated_at}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Floor plans / Layouts */}
        {layouts.length > 0 && (
          <section>
            <SectionTitle>Планировки</SectionTitle>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {layouts.map((url, i) => (
                <div key={i}
                  className="aspect-video bg-gray-50 rounded-xl overflow-hidden cursor-pointer border border-gray-100 hover:border-gray-300 transition-colors"
                  onClick={() => setLayoutLbIdx(i)}>
                  <img src={url} alt={`Планировка ${i + 1}`} className="w-full h-full object-contain" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Purchase conditions text */}
        {complex.purchase_conditions && (
          <section>
            <SectionTitle>Условия покупки</SectionTitle>
            <GoldLine />
            <p className="text-gray-600 leading-relaxed text-sm" style={{ whiteSpace: 'pre-wrap' }}>
              {complex.purchase_conditions}
            </p>
          </section>
        )}

        {/* Contacts */}
        {complex.developer_phones.length > 0 && (
          <section>
            <SectionTitle>Контакты</SectionTitle>
            <div className="grid md:grid-cols-2 gap-4">
              {complex.developer_phones.map((phone, i) => (
                <a key={i} href={`tel:${phone}`}
                  className="flex items-center gap-4 p-5 border border-gray-100 rounded-2xl hover:border-gray-200 transition-colors">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${GOLD}20` }}>
                    <Phone size={16} style={{ color: GOLD }} />
                  </div>
                  <div>
                    <p className="text-gray-400 text-[10px] uppercase tracking-widest">Телефон застройщика</p>
                    <p className="font-semibold text-sm">{phone}</p>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Agent footer */}
        {agent && <AgentFooter agent={agent} />}
      </div>

      {/* Lightbox for photos */}
      {lbIdx !== null && (
        <Lightbox photos={photos} startIdx={lbIdx} onClose={() => setLbIdx(null)} />
      )}
      {/* Lightbox for layouts */}
      {layoutLbIdx !== null && (
        <Lightbox photos={layouts} startIdx={layoutLbIdx} onClose={() => setLayoutLbIdx(null)} />
      )}
    </div>
  )
}

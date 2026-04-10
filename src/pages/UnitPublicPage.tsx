import { useState, useRef, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAgentSettings } from '@/hooks/useAgentSettings'
import type { ComplexUnit, Complex, AgentSettings } from '@/types'
import { cn } from '@/utils/cn'
import { MapPin, Phone, MessageCircle, Send, ChevronLeft, ChevronRight, X, Building2, Printer, Loader2 } from 'lucide-react'
import { downloadElementAsPdf } from '@/utils/downloadPdf'
import { calcInstallment, calcMortgage } from '@/utils/unitCalc'

const GOLD = '#C5A059'

// ─── Lightbox ──────────────────────────────────────────────────────────────────

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
          src={photos[idx]} alt=""
          className="max-h-full max-w-full object-contain select-none"
          draggable={false}
          style={{ transform: `translateY(${swipeDy}px)`, transition: dismissing ? 'transform 0.22s ease' : undefined }}
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function fmt(n: number) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(n))
}

function getPaymentLabel(unit: ComplexUnit, complex?: Complex | null): string {
  if (!unit.payment_type) return ''
  if (unit.payment_type === 'cash') return 'Наличный расчёт'
  if (unit.payment_type === 'mortgage') return 'Ипотека'
  const cond = complex?.pricing_conditions?.find(c => c.id === unit.payment_type)
  if (cond?.payment_type === 'installment' && cond.installment_months) {
    const m = cond.installment_months
    return `Рассрочка · ${m % 12 === 0 ? `${m / 12} лет` : `${m} мес.`}`
  }
  return cond?.label ?? ''
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UnitPublicPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const autoPdf = searchParams.get('pdf') === '1'
  const [lbIdx, setLbIdx] = useState<number | null>(null)
  const [generating, setGenerating] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const { data: unit, isLoading } = useQuery({
    queryKey: ['public-unit', id],
    queryFn: async (): Promise<ComplexUnit | null> => {
      if (!id) return null
      const { data, error } = await supabase
        .from('complex_units').select('*').eq('id', id).maybeSingle()
      if (error) throw new Error(error.message)
      if (!data) return null
      return { ...(data as ComplexUnit), photos: (data as any).photos ?? [] }
    },
    enabled: !!id,
  })

  const { data: complex } = useQuery({
    queryKey: ['public-unit-complex', unit?.complex_id],
    queryFn: async (): Promise<Complex | null> => {
      if (!unit?.complex_id) return null
      const { data, error } = await supabase
        .from('complexes').select('*').eq('id', unit.complex_id).maybeSingle()
      if (error) return null
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
    enabled: !!unit?.complex_id,
  })

  const { data: agent } = useAgentSettings()

  async function handleDownload() {
    if (!contentRef.current || generating) return
    setGenerating(true)
    try {
      const label = unit?.title || (unit?.rooms ? `${unit.rooms}-комн` : 'объект')
      await downloadElementAsPdf(contentRef.current, `${complex?.name ?? 'ЖК'} — ${label}`)
    } finally {
      setGenerating(false)
    }
  }

  useEffect(() => {
    if (!autoPdf || !unit || !contentRef.current || generating) return
    const t = setTimeout(() => { handleDownload() }, 1200)
    return () => clearTimeout(t)
  }, [autoPdf, unit])

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

  if (!unit) {
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

  const photos = unit.photos?.length ? unit.photos : (complex?.photos ?? [])
  const label = unit.title || (unit.rooms ? `${unit.rooms}-комн. квартира` : 'Объект от застройщика')
  const total = unit.price_per_m2 && unit.area ? unit.price_per_m2 * unit.area : unit.price
  const cond = complex?.pricing_conditions?.find(c => c.id === unit.payment_type)
  const paymentLabel = getPaymentLabel(unit, complex)

  let calcResult = null
  if (total && unit.payment_type) {
    if (cond?.payment_type === 'installment' && cond.installment_months != null && cond.installment_down_payment_pct != null) {
      calcResult = calcInstallment(total, cond.installment_months, cond.installment_down_payment_pct)
    } else if (unit.payment_type === 'mortgage' && unit.mortgage_rate && unit.mortgage_years && unit.mortgage_down_payment_pct != null) {
      calcResult = calcMortgage(total, unit.mortgage_rate, unit.mortgage_years, unit.mortgage_down_payment_pct)
    }
  }

  const features: Array<[string, string]> = []
  if (unit.rooms != null) features.push(['Комнаты', unit.rooms === 0 ? 'Студия' : String(unit.rooms)])
  if (unit.area) features.push(['Площадь', `${unit.area} м²`])
  if (unit.floor != null) {
    const floorStr = unit.floor_to && unit.floor_to > unit.floor ? `${unit.floor}–${unit.floor_to}` : String(unit.floor)
    features.push(['Этаж', unit.total_floors ? `${floorStr} из ${unit.total_floors}` : floorStr])
  }
  if (unit.price_per_m2) features.push(['Цена за м²', `${fmt(unit.price_per_m2)} ₽`])

  return (
    <div className="min-h-screen bg-white" ref={contentRef}>
      {lbIdx !== null && (
        <Lightbox photos={photos} startIdx={lbIdx} onClose={() => setLbIdx(null)} />
      )}

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 no-print">
        {agent?.agency_name ? (
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: GOLD }}>
            {agent.agency_name}
          </span>
        ) : <span />}
        <button
          onClick={handleDownload}
          disabled={generating}
          className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-gray-400 hover:text-gray-700 transition disabled:opacity-50"
        >
          {generating
            ? <Loader2 size={13} className="animate-spin" />
            : <Printer size={13} />}
          Сохранить PDF
        </button>
      </div>

      {/* ── Hero Cover ──────────────────────────────────────────────────────── */}
      <div className="relative w-full bg-gray-900" style={{ height: 'min(75vh, 580px)', minHeight: 340 }}>
        {photos.length > 0 ? (
          <img
            src={photos[0]} alt={label}
            className="absolute inset-0 w-full h-full object-cover cursor-pointer"
            onClick={() => setLbIdx(0)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Building2 size={64} className="text-gray-700" />
          </div>
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.35) 100%)' }} />

        {/* Agency logo */}
        {agent && (
          <div className="absolute top-6 right-6 flex items-center gap-2">
            {agent.logo_url ? (
              <img src={agent.logo_url} alt={agent.agency_name ?? ''} className="h-8 w-auto opacity-80 brightness-0 invert" />
            ) : agent.agency_name ? (
              <span className="text-white/70 text-xs font-bold uppercase tracking-widest">{agent.agency_name}</span>
            ) : null}
          </div>
        )}

        {/* Badge */}
        <div className="absolute top-6 left-6">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 text-white"
            style={{ background: GOLD }}>
            {complex?.name ?? 'Объект от застройщика'}
          </span>
        </div>

        {/* Bottom */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-8 md:px-12">
          {complex && (
            <p className="text-white/50 text-xs uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Building2 size={11} /> {complex.name}
              {complex.completion_date ? ` · Сдача: ${complex.completion_date}` : ''}
            </p>
          )}
          <div className="serif text-4xl md:text-5xl text-white font-normal italic leading-tight mb-2">
            {label}
          </div>
          {total != null && (
            <p className="text-white/80 text-xl font-semibold mb-1">
              {fmt(total)} ₽
            </p>
          )}
          {complex?.address && (
            <div className="flex items-center gap-1.5 text-white/65 text-sm mt-2">
              <MapPin size={13} className="shrink-0" style={{ color: GOLD }} />
              {complex.address}
            </div>
          )}
        </div>
      </div>

      {/* ── Main Content ────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 md:px-10 py-12">

        {/* Quick stats */}
        {features.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 mb-16 border border-gray-100 divide-x divide-y md:divide-y-0 divide-gray-100">
            {features.slice(0, 4).map(([lbl, val]) => (
              <div key={lbl} className="px-5 py-4 text-center">
                <p className="text-gray-400 uppercase text-[9px] tracking-widest mb-1">{lbl}</p>
                <p className="font-bold text-base">{val}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Calculator ────────────────────────────────────────────────────── */}
        {total != null && (
          <section className="mb-16">
            <SectionTitle>Расчёт стоимости</SectionTitle>
            {paymentLabel && (
              <div className="mb-6">
                <span className="inline-block text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 text-white"
                  style={{ background: GOLD }}>
                  {paymentLabel}
                </span>
              </div>
            )}
            <div className="border border-gray-100 rounded-none divide-y divide-gray-100 max-w-md">
              <div className="flex justify-between px-5 py-3.5">
                <span className="text-gray-400 text-xs uppercase tracking-widest">Общая стоимость</span>
                <span className="font-bold">{fmt(total)} ₽</span>
              </div>
              {calcResult && (
                <>
                  <div className="flex justify-between px-5 py-3.5">
                    <span className="text-gray-400 text-xs uppercase tracking-widest">Первоначальный взнос</span>
                    <span className="font-semibold">{fmt(calcResult.downPayment)} ₽</span>
                  </div>
                  <div className="flex justify-between px-5 py-3.5">
                    <span className="text-gray-400 text-xs uppercase tracking-widest">
                      {unit.payment_type === 'mortgage' ? 'Сумма кредита' : 'Остаток'}
                    </span>
                    <span className="font-semibold">{fmt(calcResult.remainder)} ₽</span>
                  </div>
                  <div className="flex justify-between px-5 py-3.5">
                    <span className="text-gray-400 text-xs uppercase tracking-widest">Срок</span>
                    <span className="font-semibold">{calcResult.termMonths} мес.</span>
                  </div>
                  <div className="flex justify-between px-5 py-5 bg-gray-50">
                    <span className="text-xs font-bold uppercase tracking-widest">Ежемесячный платёж</span>
                    <span className="text-2xl font-bold" style={{ color: GOLD }}>
                      {fmt(calcResult.monthlyPayment)} ₽
                    </span>
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {/* ── Details ───────────────────────────────────────────────────────── */}
        {features.length > 0 && (
          <section className="mb-16">
            <SectionTitle>Характеристики</SectionTitle>
            <div className="md:w-1/2">
              <GoldLine />
              <ul className="space-y-0.5">
                {features.map(([lbl, val]) => (
                  <FeatureRow key={lbl} label={lbl} value={val} />
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* ── Gallery ───────────────────────────────────────────────────────── */}
        {photos.length > 1 && (
          <section className="mb-16">
            <SectionTitle>Фотографии</SectionTitle>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {photos.slice(1).map((p, i) => (
                <div key={i} className="aspect-[4/3] overflow-hidden cursor-pointer group"
                  onClick={() => setLbIdx(i + 1)}>
                  <img src={p} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Notes ─────────────────────────────────────────────────────────── */}
        {unit.notes && (
          <section className="mb-16">
            <SectionTitle>Дополнительно</SectionTitle>
            <GoldLine />
            <p className="text-gray-600 leading-relaxed">{unit.notes}</p>
          </section>
        )}

        {/* ── Complex Info ──────────────────────────────────────────────────── */}
        {complex?.description && (
          <section className="mb-16">
            <SectionTitle>О комплексе</SectionTitle>
            <GoldLine />
            <p className="text-gray-600 leading-relaxed">{complex.description}</p>
          </section>
        )}

        {/* ── Agent ─────────────────────────────────────────────────────────── */}
        {agent && <AgentFooter agent={agent} />}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAgentSettings } from '@/hooks/useAgentSettings'
import type { Property, AgentSettings } from '@/types'
import {
  PROPERTY_TYPE_LABELS, PROPERTY_TYPE_ICONS, DEAL_TYPE_LABELS,
} from '@/types'
import { formatPriceShort } from '@/utils/format'
import { cn } from '@/utils/cn'
import { MapPin, Phone, MessageCircle, Send, ChevronLeft, ChevronRight, X, Building2 } from 'lucide-react'

// ─── Lightbox ──────────────────────────────────────────────────────────────────

function Lightbox({ photos, startIdx, onClose }: {
  photos: string[]
  startIdx: number
  onClose: () => void
}) {
  const [idx, setIdx] = useState(startIdx)
  const prev = () => setIdx(i => (i - 1 + photos.length) % photos.length)
  const next = () => setIdx(i => (i + 1) % photos.length)

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col" onClick={onClose}>
      <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
        <span className="text-white/50 text-sm">{idx + 1} / {photos.length}</span>
        <button onClick={onClose} className="p-2 text-white/70 hover:text-white transition-colors">
          <X size={22} />
        </button>
      </div>
      <div
        className="flex-1 relative flex items-center justify-center overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <img src={photos[idx]} alt="" className="max-h-full max-w-full object-contain select-none" draggable={false} />
        {photos.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-3 p-2.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors">
              <ChevronLeft size={20} />
            </button>
            <button onClick={next} className="absolute right-3 p-2.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors">
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>
      <div className="flex gap-2 px-4 py-3 overflow-x-auto shrink-0">
        {photos.map((p, i) => (
          <button
            key={i}
            onClick={e => { e.stopPropagation(); setIdx(i) }}
            className={cn('shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all',
              i === idx ? 'border-white scale-105' : 'border-transparent opacity-50 hover:opacity-80')}
          >
            <img src={p} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Spec Pill ────────────────────────────────────────────────────────────────

function SpecPill({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 px-4 py-3 bg-slate-50 rounded-2xl min-w-fit shrink-0">
      <span className="text-xl leading-none">{icon}</span>
      <span className="text-sm font-bold text-slate-900 whitespace-nowrap">{value}</span>
      <span className="text-[10px] text-slate-400 uppercase tracking-wide whitespace-nowrap">{label}</span>
    </div>
  )
}

// ─── Section ──────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-5 border-b border-slate-100">
      <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">{title}</h2>
      {children}
    </div>
  )
}

// ─── Char Grid Item ───────────────────────────────────────────────────────────

function CharItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-2xl px-3.5 py-3">
      <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-slate-900">{value}</p>
    </div>
  )
}

// ─── Agent Bar ────────────────────────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PropertyPublicPage() {
  const { id } = useParams<{ id: string }>()
  const [lbIdx, setLbIdx] = useState<number | null>(null)

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
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Загрузка...</p>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Объект не найден</h1>
          <p className="text-slate-500 text-sm">Ссылка устарела или объект был удалён.</p>
        </div>
      </div>
    )
  }

  const photos = property.photos ?? []
  const typeLabel = PROPERTY_TYPE_LABELS[property.type]
  const typeIcon = PROPERTY_TYPE_ICONS[property.type]
  const dealLabel = DEAL_TYPE_LABELS[property.deal_type]

  const specs: Array<{ icon: string; label: string; value: string }> = []
  if (property.area) specs.push({ icon: '📐', label: 'Площадь', value: `${property.area} м²` })
  if (property.rooms !== undefined) specs.push({ icon: '🛏', label: 'Комнаты', value: property.rooms === 0 ? 'Студия' : String(property.rooms) })
  if (property.floor) specs.push({ icon: '📊', label: 'Этаж', value: property.total_floors ? `${property.floor} / ${property.total_floors}` : String(property.floor) })
  if (property.renovation) specs.push({ icon: '🔨', label: 'Ремонт', value: property.renovation })
  if (property.ceiling_height) specs.push({ icon: '↕️', label: 'Потолки', value: `${property.ceiling_height} м` })
  if (property.market_type) specs.push({ icon: property.market_type === 'new_build' ? '🏗' : '🏘', label: 'Рынок', value: property.market_type === 'new_build' ? 'Новостройка' : 'Вторичка' })

  const hasPayOptions = property.has_mortgage || property.has_installment || property.has_trade_in || property.has_maternal_cap || property.has_military_mort
  const hasCharacteristics = property.area || property.kitchen_area || property.living_area || property.ceiling_height || property.renovation || property.bathroom_type || property.window_views?.length || property.furniture?.length || property.heated_floor !== undefined

  return (
    <div className="min-h-screen bg-white pb-36">
      {lbIdx !== null && (
        <Lightbox photos={photos} startIdx={lbIdx} onClose={() => setLbIdx(null)} />
      )}

      {/* ── Hero Cover ─────────────────────────────────────────────────────── */}
      <div className="relative w-full" style={{ height: 'min(72vh, 540px)', minHeight: 320 }}>
        {photos.length > 0 ? (
          <img
            src={photos[0]}
            alt={property.address}
            className="absolute inset-0 w-full h-full object-cover cursor-pointer"
            onClick={() => setLbIdx(0)}
          />
        ) : (
          <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
            <Building2 size={64} className="text-slate-300" />
          </div>
        )}

        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/35 pointer-events-none" />

        {/* Top badges */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-start justify-between">
          <span className="bg-white/20 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/20">
            {typeIcon} {typeLabel}
          </span>
          {photos.length > 1 && (
            <button
              onClick={() => setLbIdx(0)}
              className="bg-black/40 backdrop-blur-md text-white text-xs px-2.5 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10"
            >
              <span className="text-xs">📷</span>
              <span>{photos.length}</span>
            </button>
          )}
        </div>

        {/* Bottom content */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="max-w-lg mx-auto">
            {property.complex_name && (
              <p className="text-white/65 text-xs font-medium mb-1.5 tracking-wide">
                ЖК «{property.complex_name}»
              </p>
            )}
            <div className="text-4xl font-black text-white tracking-tight leading-none">
              {formatPriceShort(property.price)}
            </div>
            {property.area > 0 && (
              <p className="text-white/55 text-xs mt-1">
                {Math.round(property.price / property.area).toLocaleString('ru-RU')} ₽/м²
              </p>
            )}
            <div className="flex items-center gap-1.5 mt-2.5 text-white/75 text-sm">
              <MapPin size={13} className="shrink-0 text-white/60" />
              <span className="leading-snug">
                {property.address}
                {property.district ? ` · ${property.district}` : ''}
              </span>
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full border border-white/15">
                {dealLabel}
              </span>
              {property.market_type && (
                <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full border border-white/15">
                  {property.market_type === 'new_build' ? 'Новостройка' : 'Вторичка'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto">
        {/* ── Specs Strip ─────────────────────────────────────────────────── */}
        {specs.length > 0 && (
          <div className="px-4 py-5 border-b border-slate-100">
            <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {specs.map(s => (
                <SpecPill key={s.label} icon={s.icon} label={s.label} value={s.value} />
              ))}
            </div>
          </div>
        )}

        {/* ── Photo Gallery ───────────────────────────────────────────────── */}
        {photos.length > 1 && (
          <Section title={`Фотографии · ${photos.length}`}>
            <div className="grid grid-cols-3 gap-1.5">
              {photos.slice(0, 6).map((p, i) => (
                <button
                  key={i}
                  onClick={() => setLbIdx(i)}
                  className={cn(
                    'relative overflow-hidden rounded-xl bg-slate-100 transition-transform active:scale-[0.97]',
                    i === 0 ? 'col-span-2 row-span-2' : ''
                  )}
                  style={{ aspectRatio: i === 0 ? '1/1' : '1/1' }}
                >
                  <img src={p} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  {i === 5 && photos.length > 6 && (
                    <div className="absolute inset-0 bg-black/55 flex items-center justify-center text-white font-bold text-xl">
                      +{photos.length - 6}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </Section>
        )}

        {/* ── Characteristics ─────────────────────────────────────────────── */}
        {hasCharacteristics && (
          <Section title="Характеристики">
            <div className="grid grid-cols-2 gap-2.5">
              {property.area > 0 && <CharItem label="Общая площадь" value={`${property.area} м²`} />}
              {property.rooms !== undefined && (
                <CharItem label="Планировка" value={property.rooms === 0 ? 'Студия' : `${property.rooms}-комнатная`} />
              )}
              {property.floor && (
                <CharItem label="Этаж" value={property.total_floors ? `${property.floor} из ${property.total_floors}` : String(property.floor)} />
              )}
              {property.kitchen_area && <CharItem label="Кухня" value={`${property.kitchen_area} м²`} />}
              {property.living_area && <CharItem label="Жилая" value={`${property.living_area} м²`} />}
              {property.ceiling_height && <CharItem label="Потолки" value={`${property.ceiling_height} м`} />}
              {property.renovation && <CharItem label="Ремонт" value={property.renovation} />}
              {property.bathroom_type && <CharItem label="Санузел" value={property.bathroom_type} />}
              {property.room_type && <CharItem label="Тип комнат" value={property.room_type} />}
              {property.heated_floor !== undefined && (
                <CharItem label="Тёплый пол" value={property.heated_floor ? 'Есть' : 'Нет'} />
              )}
              {property.sale_method && <CharItem label="Способ продажи" value={property.sale_method} />}
            </div>

            {property.window_views && property.window_views.length > 0 && (
              <div className="mt-3.5">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mb-2">Вид из окна</p>
                <div className="flex flex-wrap gap-1.5">
                  {property.window_views.map(v => (
                    <span key={v} className="text-xs bg-sky-50 text-sky-700 px-2.5 py-1 rounded-full font-medium">{v}</span>
                  ))}
                </div>
              </div>
            )}

            {property.furniture && property.furniture.length > 0 && (
              <div className="mt-3.5">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mb-2">Мебель</p>
                <div className="flex flex-wrap gap-1.5">
                  {property.furniture.map(f => (
                    <span key={f} className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">{f}</span>
                  ))}
                </div>
              </div>
            )}
          </Section>
        )}

        {/* ── Description ─────────────────────────────────────────────────── */}
        {property.description && (
          <Section title="Описание">
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{property.description}</p>
          </Section>
        )}

        {/* ── Payment Options ──────────────────────────────────────────────── */}
        {hasPayOptions && (
          <Section title="Условия покупки">
            <div className="grid grid-cols-2 gap-2">
              {property.has_mortgage && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 rounded-xl">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold shrink-0">✓</span>
                  <span className="text-sm text-emerald-800 font-medium">Ипотека</span>
                </div>
              )}
              {property.has_installment && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 rounded-xl">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold shrink-0">✓</span>
                  <span className="text-sm text-emerald-800 font-medium">Рассрочка</span>
                </div>
              )}
              {property.has_trade_in && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 rounded-xl">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold shrink-0">✓</span>
                  <span className="text-sm text-emerald-800 font-medium">Трейд-ин</span>
                </div>
              )}
              {property.has_maternal_cap && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 rounded-xl">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold shrink-0">✓</span>
                  <span className="text-sm text-emerald-800 font-medium">Маткапитал</span>
                </div>
              )}
              {property.has_military_mort && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 rounded-xl">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold shrink-0">✓</span>
                  <span className="text-sm text-emerald-800 font-medium">Воен. ипотека</span>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* ── Extra Features ───────────────────────────────────────────────── */}
        {property.extra_features && property.extra_features.length > 0 && (
          <Section title="Особенности">
            <div className="flex flex-wrap gap-2">
              {property.extra_features.map(f => (
                <span key={f} className="text-sm text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl font-medium">{f}</span>
              ))}
            </div>
          </Section>
        )}

        {/* ── Location ─────────────────────────────────────────────────────── */}
        <Section title="Местоположение">
          <div className="bg-slate-50 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
              <MapPin size={17} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 leading-snug">{property.address}</p>
              {property.district && (
                <p className="text-xs text-slate-500 mt-1">Район: {property.district}</p>
              )}
              {property.complex_name && (
                <p className="text-xs text-slate-500 mt-0.5">ЖК «{property.complex_name}»</p>
              )}
            </div>
          </div>
        </Section>

        {/* ── Footer ────────────────────────────────────────────────────────── */}
        <div className="px-4 py-5">
          <p className="text-xs text-slate-400">
            Артикул: <span className="font-mono font-semibold text-slate-500">{property.article}</span>
          </p>
        </div>
      </div>

      {agent && (agent.phone || agent.whatsapp || agent.telegram) && (
        <AgentBar agent={agent} />
      )}
    </div>
  )
}

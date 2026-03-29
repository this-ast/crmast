import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MapPin, User, Phone, Hash, Maximize2, Layers, Eye, FileText,
  ChevronRight, Building2, X, Pencil, Trash2, ExternalLink, HeartHandshake,
  ChevronLeft, ZoomIn, LayoutDashboard, Share2,
  type LucideIcon
} from 'lucide-react'
import type { PropertyWithOwner } from '@/types'
import {
  PROPERTY_TYPE_LABELS,
  PROPERTY_STATUS_COLORS,
  PROPERTY_STATUS_LABELS,
  MARKET_TYPE_LABELS,
  DEAL_TYPE_LABELS,
  DEAL_STATUSES,
} from '@/types'
import { formatPrice, formatPhone, maskPhone } from '@/utils/format'
import { cn } from '@/utils/cn'
import PropertyTypeIcon from './PropertyTypeIcon'
import { useDeleteProperty } from '@/hooks/useProperties'
import { usePropertyStore } from '@/store/usePropertyStore'
import { useAgentSettings } from '@/hooks/useAgentSettings'
import { useDealsByProperty } from '@/hooks/useDeals'
import PropertyPdfButton from '@/components/pdf/PropertyPdfButton'
import Timeline from '@/components/timeline/Timeline'
import LinkedTasksSection from '@/components/tasks/LinkedTasksSection'
import MatchingClientsSection from './MatchingClientsSection'
import type { Client } from '@/types'
import { ClipboardList } from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Photo gallery ────────────────────────────────────────────────────────────

function PhotoGallery({ photos }: { photos: string[] }) {
  const [idx, setIdx] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const [slideDir, setSlideDir] = useState<'left' | 'right' | null>(null)
  const [lbTouchStart, setLbTouchStart] = useState({ x: 0, y: 0 })
  const [swipeDy, setSwipeDy] = useState(0)
  const [swipeDx, setSwipeDx] = useState(0)
  const [swipeAxis, setSwipeAxis] = useState<'x' | 'y' | null>(null)
  const [dismissing, setDismissing] = useState(false)
  const stripRef = useState<HTMLDivElement | null>(null)

  if (!photos || photos.length === 0) return null

  function goTo(newIdx: number, dir: 'left' | 'right') {
    setSlideDir(dir)
    setIdx(newIdx)
  }
  function prev(e: React.MouseEvent) {
    e.stopPropagation()
    goTo((idx - 1 + photos.length) % photos.length, 'right')
  }
  function next(e: React.MouseEvent) {
    e.stopPropagation()
    goTo((idx + 1) % photos.length, 'left')
  }
  function scrollThumbIntoView(i: number) {
    const el = stripRef[0]
    if (!el) return
    const thumb = el.children[i] as HTMLElement
    if (thumb) thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }

  function handleLbTouchStart(e: React.TouchEvent) {
    setLbTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY })
    setSwipeAxis(null)
  }
  function handleLbTouchMove(e: React.TouchEvent) {
    const dx = e.touches[0].clientX - lbTouchStart.x
    const dy = e.touches[0].clientY - lbTouchStart.y
    const adx = Math.abs(dx), ady = Math.abs(dy)
    const axis = swipeAxis ?? (adx > 8 || ady > 8 ? (ady > adx ? 'y' : 'x') : null)
    if (axis && !swipeAxis) setSwipeAxis(axis)
    if (axis === 'y') setSwipeDy(dy * 0.55)
    if (axis === 'x') setSwipeDx(dx * 0.25)
  }
  function handleLbTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - lbTouchStart.x
    const dy = e.changedTouches[0].clientY - lbTouchStart.y
    const adx = Math.abs(dx), ady = Math.abs(dy)
    setSwipeDx(0)
    if (ady > 60 && ady > adx) {
      setDismissing(true)
      setSwipeDy(dy > 0 ? 400 : -400)
      setTimeout(() => { setLightbox(false); setSwipeDy(0); setDismissing(false) }, 220)
    } else {
      setSwipeDy(0)
      if (adx > 50 && adx > ady && photos.length > 1) {
        if (dx < 0) goTo((idx + 1) % photos.length, 'left')
        else goTo((idx - 1 + photos.length) % photos.length, 'right')
      }
    }
    setSwipeAxis(null)
  }

  const photoAnimClass = slideDir === 'left' ? 'lb-photo-from-right'
    : slideDir === 'right' ? 'lb-photo-from-left'
    : lightbox ? 'lb-photo-in' : ''

  const isTracking = swipeDy !== 0 || swipeDx !== 0
  const dragProgress = Math.min(Math.abs(swipeDy) / 260, 1)
  const overlayOpacity = dismissing ? 0 : Math.max(0, 1 - dragProgress * 0.85)

  return (
    <>
      {/* Main scrollable strip */}
      <div
        className="flex overflow-x-auto snap-x snap-mandatory bg-slate-900 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', scrollBehavior: 'smooth' }}
      >
        {photos.map((src, i) => (
          <div key={src} className="relative w-full shrink-0 snap-center group" style={{ minWidth: '100%' }}>
            <img
              src={src}
              alt=""
              className="w-full h-52 object-cover cursor-zoom-in transition-transform duration-200 active:scale-[0.98]"
              onClick={() => { setSlideDir(null); setIdx(i); setLightbox(true) }}
              loading="lazy"
            />
            {photos.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); goTo((i - 1 + photos.length) % photos.length, 'right'); scrollThumbIntoView((i - 1 + photos.length) % photos.length) }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-all duration-200"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); goTo((i + 1) % photos.length, 'left'); scrollThumbIntoView((i + 1) % photos.length) }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-all duration-200"
                >
                  <ChevronRight size={16} />
                </button>
              </>
            )}
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full pointer-events-none">
              <ZoomIn size={10} />
              {i + 1}/{photos.length}
            </div>
          </div>
        ))}
      </div>

      {/* Thumbnail strip */}
      {photos.length > 1 && (
        <div
          ref={(el) => { stripRef[1](el) }}
          className="flex gap-2 overflow-x-auto px-4 py-2 bg-slate-900"
          style={{ scrollbarWidth: 'thin', scrollBehavior: 'smooth' }}
        >
          {photos.map((src, i) => (
            <button
              key={src}
              onClick={() => { goTo(i, i > idx ? 'left' : 'right'); scrollThumbIntoView(i) }}
              className={cn(
                'w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all duration-300',
                i === idx ? 'border-blue-400 scale-105' : 'border-transparent opacity-50 hover:opacity-90 hover:border-slate-400'
              )}
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[10100] flex items-center justify-center lb-overlay-in"
          style={{ backgroundColor: `rgba(0,0,0,${0.95 * overlayOpacity})` }}
          onClick={() => { if (!isTracking) setLightbox(false) }}
          onTouchStart={handleLbTouchStart}
          onTouchMove={handleLbTouchMove}
          onTouchEnd={handleLbTouchEnd}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setLightbox(false) }}
            style={{ opacity: overlayOpacity, transition: 'opacity 0.2s' }}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X size={20} />
          </button>
          {photos.length > 1 && (
            <>
              <button
                onClick={prev}
                style={{ opacity: overlayOpacity, transition: 'opacity 0.2s' }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={next}
                style={{ opacity: overlayOpacity, transition: 'opacity 0.2s' }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
          <img
            key={idx}
            src={photos[idx]}
            alt=""
            className={`max-w-[90vw] max-h-[90vh] object-contain rounded-2xl ${isTracking ? '' : photoAnimClass}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              touchAction: 'none',
              transform: `translateY(${swipeDy}px) translateX(${swipeDx}px) scale(${1 - dragProgress * 0.08})`,
              transition: isTracking ? 'none' : dismissing ? 'transform 0.22s cubic-bezier(0.4,0,1,1), opacity 0.22s' : 'transform 0.38s cubic-bezier(0.34,1.56,0.64,1)',
              opacity: Math.max(0, 1 - dragProgress * 0.6),
            }}
          />
          {photos.length > 1 && (
            <div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5"
              style={{ opacity: overlayOpacity, transition: 'opacity 0.2s' }}
            >
              {photos.map((_, i) => (
                <button key={i} onClick={(e) => { e.stopPropagation(); goTo(i, i > idx ? 'left' : 'right') }}
                  className={cn('w-2.5 h-2.5 rounded-full transition-all duration-300', i === idx ? 'bg-white scale-110' : 'bg-white/40')}
                />
              ))}
            </div>
          )}
          <div
            className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm"
            style={{ opacity: overlayOpacity, transition: 'opacity 0.2s' }}
          >
            {idx + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  )
}

interface PropertyDetailProps {
  property: PropertyWithOwner
  onClose: () => void
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={15} className="text-slate-400" />
      </div>
      <div>
        <p className="text-xs text-slate-400 mb-0.5">{label}</p>
        <div className="text-sm font-medium text-slate-900">{value}</div>
      </div>
    </div>
  )
}

export default function PropertyDetail({ property, onClose }: PropertyDetailProps) {
  const [phoneRevealed, setPhoneRevealed] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [inlineClient, setInlineClient] = useState<(Client & { matchReasons?: string[]; matchMismatches?: string[] }) | null>(null)
  const [showOwnerPopup, setShowOwnerPopup] = useState(false)
  const [showFloorPlan, setShowFloorPlan] = useState(false)
  const deleteProperty = useDeleteProperty()
  const { openForm } = usePropertyStore()
  const { data: agentSettings } = useAgentSettings()
  const { data: deals = [] } = useDealsByProperty(property.id)
  const navigate = useNavigate()

  const {
    id, article, type, status, price, area, rooms, floor, total_floors,
    complex_name, address, district, description, owner,
    area_sotki, communications, cadastral_number,
    is_active_business, has_wet_points, has_parking, entrance_groups,
    market_type, deal_type, has_mortgage, has_installment,
    has_trade_in, has_maternal_cap, has_military_mort,
    kitchen_area, living_area, room_type, ceiling_height, bathroom_type,
    window_views, renovation, heated_floor, furniture, sale_method,
    extra_features, floor_plan,
  } = property

  const title = (() => {
    if (type === 'apartment' && rooms) return `${rooms}-комн. квартира`
    if (type === 'apartment') return 'Квартира'
    return PROPERTY_TYPE_LABELS[type]
  })()

  const handleEdit = () => {
    onClose()
    setTimeout(() => openForm(id), 150)
  }

  const handleDelete = async () => {
    try {
      await deleteProperty.mutateAsync(id)
      toast.success('Объект удалён')
      onClose()
    } catch {
      toast.error('Ошибка при удалении')
    }
  }

  const handleOwnerClick = () => {
    if (!owner) return
    setShowOwnerPopup(true)
  }

  const handleGoToClient = (id: string) => {
    onClose()
    setTimeout(() => navigate(`/clients?highlight=${id}`), 150)
  }

  return (
    <div className="flex flex-col max-h-[85vh]">
      {/* Header */}
      <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <PropertyTypeIcon type={type} size="lg" />
          <div>
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                {article}
              </span>
              <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', PROPERTY_STATUS_COLORS[status])}>
                {PROPERTY_STATUS_LABELS[status]}
              </span>
              {deal_type === 'rent' && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  🔑 {DEAL_TYPE_LABELS[deal_type]}
                </span>
              )}
              {market_type && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {market_type === 'secondary' ? '🏘' : '🏗'} {MARKET_TYPE_LABELS[market_type]}
                </span>
              )}
              {has_mortgage && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                  🏦 Ипотека
                </span>
              )}
              {has_installment && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  📅 Рассрочка
                </span>
              )}
              {has_trade_in && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                  🔄 Трейд-ин
                </span>
              )}
              {has_maternal_cap && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-pink-100 text-pink-700">
                  👶 Маткапитал
                </span>
              )}
              {has_military_mort && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  🎖 Воен. ипотека
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <PropertyPdfButton property={property} agentSettings={agentSettings ?? {}} />
          <button
            onClick={() => {
              const url = `${window.location.origin}/p/${id}`
              navigator.clipboard.writeText(url).then(() => toast.success('Ссылка скопирована'))
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
            title="Поделиться презентацией"
          >
            <Share2 size={16} />
          </button>
          <button
            onClick={handleEdit}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Редактировать"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Удалить"
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors ml-1"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="mx-6 mt-4 p-4 bg-red-50 rounded-xl border border-red-100">
          <p className="text-sm font-medium text-red-700 mb-3">Удалить этот объект?</p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex-1 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Отмена
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteProperty.isPending}
              className="flex-1 py-1.5 rounded-lg bg-red-600 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
              Удалить
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto space-y-6">
        {/* Photo gallery — full width, no padding */}
        {property.photos && property.photos.length > 0 && (
          <PhotoGallery photos={property.photos} />
        )}

        <div className="px-6 space-y-6">
        {/* Price */}
        <div className="bg-blue-50 rounded-xl px-4 py-3">
          <p className="text-xs text-blue-500 font-medium mb-0.5">
            {deal_type === 'rent' ? 'Аренда в месяц' : 'Цена'}
          </p>
          <p className="text-2xl font-bold text-blue-700">{formatPrice(price)}</p>
        </div>

        {/* Main info */}
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Основная информация
          </h3>
          <div className="space-y-3">
            <InfoRow icon={Maximize2} label="Площадь" value={`${area} м²`} />
            {type === 'apartment' && (
              <>
                {rooms && <InfoRow icon={Layers} label="Комнат" value={rooms} />}
                {floor && total_floors && (
                  <InfoRow icon={Building2} label="Этаж" value={`${floor} из ${total_floors}`} />
                )}
                {kitchen_area && <InfoRow icon={Maximize2} label="Площадь кухни" value={`${kitchen_area} м²`} />}
                {living_area  && <InfoRow icon={Maximize2} label="Жилая площадь"  value={`${living_area} м²`}  />}
                {ceiling_height && <InfoRow icon={Eye} label="Высота потолков" value={`${ceiling_height} м`} />}
                {room_type    && <InfoRow icon={Layers}   label="Тип комнат"       value={room_type}   />}
                {bathroom_type && <InfoRow icon={Hash}    label="Санузел"          value={bathroom_type} />}
                {renovation   && <InfoRow icon={Pencil}   label="Ремонт"           value={renovation}  />}
                {sale_method  && <InfoRow icon={ChevronRight} label="Способ продажи" value={sale_method} />}
                {heated_floor && <InfoRow icon={Eye}      label="Тёплый пол"       value="Есть"        />}
                {(window_views?.length ?? 0) > 0 && (
                  <InfoRow icon={Eye} label="Окна" value={
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {window_views!.map((v) => (
                        <span key={v} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{v}</span>
                      ))}
                    </div>
                  } />
                )}
                {(furniture?.length ?? 0) > 0 && (
                  <InfoRow icon={Layers} label="Мебель" value={
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {furniture!.map((v) => (
                        <span key={v} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">{v}</span>
                      ))}
                    </div>
                  } />
                )}
                {(extra_features?.length ?? 0) > 0 && (
                  <InfoRow icon={Layers} label="Дополнительно" value={
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {extra_features!.map((v) => (
                        <span key={v} className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full">{v}</span>
                      ))}
                    </div>
                  } />
                )}
              </>
            )}
            {type === 'land' && (
              <>
                {area_sotki && <InfoRow icon={Maximize2} label="Площадь" value={`${area_sotki} соток`} />}
                {cadastral_number && (
                  <InfoRow icon={Hash} label="Кадастровый номер" value={cadastral_number} />
                )}
                {communications && communications.length > 0 && (
                  <InfoRow
                    icon={Layers}
                    label="Коммуникации"
                    value={
                      <div className="flex flex-wrap gap-1 mt-1">
                        {communications.map((c) => (
                          <span key={c} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{c}</span>
                        ))}
                      </div>
                    }
                  />
                )}
              </>
            )}
            {type === 'commercial' && (
              <>
                {is_active_business !== undefined && (
                  <InfoRow icon={Building2} label="Действующий бизнес" value={is_active_business ? 'Да' : 'Нет'} />
                )}
                {has_wet_points !== undefined && (
                  <InfoRow icon={Layers} label="Мокрые точки" value={has_wet_points ? 'Есть' : 'Нет'} />
                )}
                {has_parking !== undefined && (
                  <InfoRow icon={Layers} label="Парковка" value={has_parking ? 'Есть' : 'Нет'} />
                )}
                {entrance_groups !== undefined && (
                  <InfoRow icon={ChevronRight} label="Входных групп" value={entrance_groups} />
                )}
                {communications && communications.length > 0 && (
                  <InfoRow
                    icon={Layers}
                    label="Коммуникации"
                    value={
                      <div className="flex flex-wrap gap-1 mt-1">
                        {communications.map((c) => (
                          <span key={c} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{c}</span>
                        ))}
                      </div>
                    }
                  />
                )}
              </>
            )}
          </div>
        </div>

        {/* Floor plan */}
        {floor_plan && (
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Планировка</h3>
            <button
              onClick={() => setShowFloorPlan(true)}
              className="relative w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 hover:border-blue-300 transition-colors group"
            >
              <img
                src={floor_plan}
                alt="Планировка"
                className="w-full max-h-52 object-contain"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-white/90 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-full shadow">
                  <ZoomIn size={12} /> Открыть
                </span>
              </div>
            </button>
          </div>
        )}

        {/* Location */}
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Локация
          </h3>
          <div className="space-y-3">
            {complex_name && (
              <InfoRow
                icon={Building2}
                label="ЖК"
                value={
                  property.complex_id ? (
                    <button
                      onClick={() => { onClose(); setTimeout(() => navigate(`/complexes?open=${property.complex_id}`), 150) }}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      {complex_name}
                      <ExternalLink size={12} />
                    </button>
                  ) : (
                    complex_name
                  )
                }
              />
            )}
            {district && <InfoRow icon={MapPin} label="Район" value={district} />}
            <InfoRow icon={MapPin} label="Адрес" value={address} />
          </div>
        </div>

        {/* Description */}
        {description && (
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Описание
            </h3>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                <FileText size={15} className="text-slate-400" />
              </div>
              <p className="text-sm text-slate-700 leading-relaxed mt-1">{description}</p>
            </div>
          </div>
        )}

        {/* Owner — clickable */}
        {owner && (
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Собственник
            </h3>
            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                  <User size={16} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <button
                    onClick={handleOwnerClick}
                    className="text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors text-left"
                  >
                    {owner.name}
                  </button>
                  <p className="text-xs text-slate-400 font-mono">Клиент #{owner.client_number}</p>
                </div>
                <button
                  onClick={() => handleGoToClient(owner.id)}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                  title="Перейти к клиенту"
                >
                  <ExternalLink size={14} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-slate-400" />
                  <span className="text-sm font-mono text-slate-700">
                    {phoneRevealed ? formatPhone(owner.phone) : maskPhone(owner.phone)}
                  </span>
                </div>
                <button
                  onClick={() => setPhoneRevealed((v) => !v)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  {phoneRevealed ? 'Скрыть' : 'Показать'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Matching clients */}
        <div>
          <MatchingClientsSection property={property} onClientClick={(c) => setInlineClient(c)} />
        </div>

        {/* Tasks */}
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <ClipboardList size={13} />
            Задачи
          </h3>
          <LinkedTasksSection linkedType="property" linkedId={id} />
        </div>

        {/* Timeline */}
        <div>
          <Timeline entityType="property" entityId={id} />
        </div>

        {/* Deals */}
        {deals.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Сделки
            </h3>
            <div className="space-y-2">
              {deals.map((deal) => {
                const statusMeta = DEAL_STATUSES.find((s) => s.value === deal.status)
                return (
                  <button
                    key={deal.id}
                    onClick={() => { onClose(); setTimeout(() => navigate(`/deals?open=${deal.id}`), 150) }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors text-left group"
                  >
                    <HeartHandshake size={15} className="text-emerald-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-emerald-700">
                        #{deal.deal_number} {deal.title || 'Сделка'}
                        {deal.deal_date ? ` · ${deal.deal_date}` : ''}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {statusMeta && (
                          <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded', statusMeta.color)}>
                            {statusMeta.label}
                          </span>
                        )}
                        {deal.commission != null && deal.commission > 0 && (
                          <span className="text-xs text-emerald-600 font-medium">
                            {formatPrice(deal.commission)}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
        </div>{/* /px-6 */}
      </div>

      {/* ── Floor plan lightbox ──────────────────────────────────────────── */}
      {showFloorPlan && floor_plan && (
        <div
          className="fixed inset-0 z-[10200] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setShowFloorPlan(false)}
        >
          <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowFloorPlan(false)}
              className="absolute -top-10 right-0 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <X size={18} />
            </button>
            <img src={floor_plan} alt="Планировка" className="w-full rounded-2xl shadow-2xl bg-white" />
          </div>
        </div>
      )}

      {/* ── Inline owner popup ───────────────────────────────────────────── */}
      {showOwnerPopup && owner && (
        <div
          className="fixed inset-0 z-[10200] bg-black/40 flex items-center justify-center p-4"
          onClick={() => setShowOwnerPopup(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <User size={18} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{owner.name}</p>
                  <p className="text-xs text-slate-400 font-mono">Клиент #{owner.client_number}</p>
                </div>
              </div>
              <button onClick={() => setShowOwnerPopup(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <X size={16} />
              </button>
            </div>
            {owner.phone && (
              <a href={`tel:${owner.phone}`} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-blue-50 transition-colors">
                <Phone size={15} className="text-slate-400" />
                <span className="text-sm font-medium text-slate-800">{owner.phone}</span>
              </a>
            )}
            <button
              onClick={() => { setShowOwnerPopup(false); handleGoToClient(owner.id) }}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <ExternalLink size={14} /> Открыть в разделе клиентов
            </button>
          </div>
        </div>
      )}

      {/* ── Inline matched client popup ──────────────────────────────────── */}
      {inlineClient && (
        <div
          className="fixed inset-0 z-[10200] bg-black/40 flex items-center justify-center p-4"
          onClick={() => setInlineClient(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                  <User size={18} className="text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{inlineClient.name}</p>
                  <p className="text-xs text-slate-400 font-mono">Клиент #{inlineClient.client_number}</p>
                </div>
              </div>
              <button onClick={() => setInlineClient(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-2">
              {inlineClient.phone && (
                <a href={`tel:${inlineClient.phone}`} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl">
                  <Phone size={14} className="text-slate-400 shrink-0" />
                  <span className="text-sm text-slate-700">{inlineClient.phone}</span>
                </a>
              )}
              {inlineClient.budget && (
                <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-xs text-slate-400 shrink-0 pt-0.5">Бюджет</span>
                  <span className="text-sm font-medium text-slate-800">{inlineClient.budget}</span>
                </div>
              )}
              {inlineClient.request && (
                <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-xs text-slate-400 shrink-0 pt-0.5">Запрос</span>
                  <span className="text-sm text-slate-700 line-clamp-3">{inlineClient.request}</span>
                </div>
              )}
              {inlineClient.status && (
                <div className="flex items-center gap-2 px-2.5 py-1.5">
                  <span className="text-xs text-slate-400">Статус:</span>
                  <span className="text-xs font-medium text-slate-700">{inlineClient.status}</span>
                </div>
              )}
              {((inlineClient.matchReasons?.length ?? 0) > 0 || (inlineClient.matchMismatches?.length ?? 0) > 0) && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {inlineClient.matchReasons?.map((r) => (
                    <span key={r} className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-100">✓ {r}</span>
                  ))}
                  {inlineClient.matchMismatches?.map((m) => (
                    <span key={m} className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-600 rounded border border-red-100">✗ {m}</span>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => { setInlineClient(null); handleGoToClient(inlineClient.id) }}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors"
            >
              <ExternalLink size={14} /> Открыть в разделе клиентов
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

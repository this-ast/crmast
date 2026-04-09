import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ExternalLink, Loader2, Phone, Building2 } from 'lucide-react'
import { useCrossPreview, type PreviewEntityType } from '@/store/useCrossPreview'
import { useProperty } from '@/hooks/useProperties'
import { useClient } from '@/hooks/useClients'
import { usePropertiesByOwner } from '@/hooks/useProperties'
import PropertyDetail from '@/components/properties/PropertyDetail'
import ComplexDetail from '@/components/complexes/ComplexDetail'
import { PROPERTY_TYPE_LABELS, PROPERTY_TYPE_ICONS, getClientTypes, isClientActive, CLIENT_TYPE_ICONS, CLIENT_TYPE_COLORS, CLIENT_STATUS_COLORS, DEAL_STATUSES } from '@/types'
import { formatPrice, formatPhone, maskPhone } from '@/utils/format'
import { cn } from '@/utils/cn'
import { useDealsByClient } from '@/hooks/useDeals'

// ─── Client preview inline content ────────────────────────────────────────────

function ClientPreviewContent({
  clientId,
  onCrossNavigate,
}: {
  clientId: string
  onCrossNavigate: (type: PreviewEntityType, id: string) => void
}) {
  const { data: client, isLoading } = useClient(clientId)
  const { data: properties = [] } = usePropertiesByOwner(clientId)
  const { data: deals = [] } = useDealsByClient(clientId)
  const [phoneRevealed, setPhoneRevealed] = useState(false)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 size={24} className="animate-spin text-blue-500" />
      </div>
    )
  }

  if (!client) return <div className="p-6 text-slate-400 text-sm">Клиент не найден</div>

  const today = new Date().toISOString().slice(0, 10)
  const isOverdue =
    client.next_contact &&
    client.next_contact <= today &&
    client.status !== 'Архив' &&
    client.status !== 'Неактивный' &&
    client.seller_status !== 'Неактивный'

  const types = getClientTypes(client)
  const clientIsActive = isClientActive(client)

  return (
    <div className="px-5 pb-6 space-y-4 pt-4">
      {/* Header row */}
      <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
          <span className="text-sm font-bold text-blue-600">#{client.client_number}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-slate-900 mb-1">{client.name}</h2>
          <div className="flex flex-wrap items-center gap-1.5">
            {types.map((t) => (
              <span key={t} className={cn('text-xs font-medium px-2 py-0.5 rounded-md', CLIENT_TYPE_COLORS[t] ?? 'bg-slate-100 text-slate-600')}>
                {CLIENT_TYPE_ICONS[t]} {t}
              </span>
            ))}
            {client.status && CLIENT_STATUS_COLORS[client.status] && (
              <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', CLIENT_STATUS_COLORS[client.status])}>
                {client.status}
              </span>
            )}
            {isOverdue && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">⏰ Контакт</span>
            )}
            <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', clientIsActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
              {clientIsActive ? 'Активный' : 'Неактивный'}
            </span>
          </div>
        </div>
      </div>

      {/* Phone */}
      {client.phone && (
        <div>
          <p className="text-xs text-slate-400 mb-1">Телефон</p>
          <div className="flex items-center gap-2">
            <Phone size={13} className="text-slate-400 shrink-0" />
            <span className="text-sm font-mono text-slate-700">
              {phoneRevealed ? formatPhone(client.phone) : maskPhone(client.phone)}
            </span>
            <button
              onClick={() => setPhoneRevealed(v => !v)}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              {phoneRevealed ? 'Скрыть' : 'Показать'}
            </button>
          </div>
        </div>
      )}

      {/* Contacts */}
      {(client.first_contact || client.last_contact || client.next_contact) && (
        <div className="grid grid-cols-2 gap-3">
          {client.first_contact && (
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Первый контакт</p>
              <p className="text-sm text-slate-700">{client.first_contact}</p>
            </div>
          )}
          {client.last_contact && (
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Последний контакт</p>
              <p className="text-sm text-slate-700">{client.last_contact}</p>
            </div>
          )}
          {client.next_contact && (
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Следующий контакт</p>
              <p className={cn('text-sm font-medium', isOverdue ? 'text-amber-600' : 'text-slate-700')}>
                {isOverdue ? '⏰ ' : ''}{client.next_contact}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Seller net price */}
      {types.includes('Продавец') && client.price_net != null && client.price_net > 0 && (
        <div className="bg-emerald-50 rounded-lg px-3 py-2">
          <p className="text-xs text-emerald-600 font-medium mb-0.5">Цена на руки</p>
          <p className="text-sm font-semibold text-emerald-800">{formatPrice(client.price_net)}</p>
        </div>
      )}

      {/* Request */}
      {client.request && (
        <div>
          <p className="text-xs text-slate-400 mb-1">Запрос</p>
          <p className="text-sm text-slate-700 leading-relaxed">{client.request}</p>
        </div>
      )}

      {/* Budget */}
      {client.budget && (
        <div>
          <p className="text-xs text-slate-400 mb-1">Бюджет</p>
          <p className="text-sm font-medium text-slate-800">{client.budget}</p>
        </div>
      )}

      {/* Next step */}
      {client.next_step && (
        <div className="bg-amber-50 rounded-lg px-3 py-2">
          <p className="text-xs text-amber-600 font-medium mb-0.5">Следующий шаг</p>
          <p className="text-sm text-amber-800">{client.next_step}</p>
        </div>
      )}

      {/* Notes */}
      {client.notes && (
        <div>
          <p className="text-xs text-slate-400 mb-1">Заметки</p>
          <p className="text-sm text-slate-600">{client.notes}</p>
        </div>
      )}

      {/* Properties */}
      {properties.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Building2 size={13} className="text-slate-400" />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Объекты</p>
          </div>
          <div className="space-y-1.5">
            {properties.map((p) => (
              <button
                key={p.id}
                onClick={() => onCrossNavigate('property', p.id)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all text-left group"
              >
                <span className="text-base">{PROPERTY_TYPE_ICONS[p.type]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-800 truncate group-hover:text-blue-700">
                    {PROPERTY_TYPE_LABELS[p.type]}{p.rooms ? ` ${p.rooms}-комн.` : ''}{p.address ? ` · ${p.address}` : ''}
                  </p>
                  <p className="text-xs text-slate-400">{formatPrice(p.price)} · {p.area} м²</p>
                </div>
                <span className="text-xs font-mono text-slate-300">{p.article}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Deals */}
      {deals.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">🤝</span>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Сделки</p>
          </div>
          <div className="space-y-1.5">
            {deals.map((d) => {
              const sm = DEAL_STATUSES.find((s) => s.value === d.status)
              return (
                <button
                  key={d.id}
                  onClick={() => onCrossNavigate('deal', d.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all text-left group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate group-hover:text-emerald-700">
                      #{d.deal_number} {d.title || 'Сделка'}{d.deal_date ? ` · ${d.deal_date}` : ''}
                    </p>
                    {sm && <span className={cn('text-xs font-medium px-1.5 rounded', sm.color)}>{sm.label}</span>}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Property preview content ──────────────────────────────────────────────────

function PropertyPreviewContent({
  propertyId,
  onClose,
  onCrossNavigate,
}: {
  propertyId: string
  onClose: () => void
  onCrossNavigate: (type: PreviewEntityType, id: string) => void
}) {
  const { data: property, isLoading } = useProperty(propertyId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 size={24} className="animate-spin text-blue-500" />
      </div>
    )
  }

  if (!property) return <div className="p-6 text-slate-400 text-sm">Объект не найден</div>

  return (
    <PropertyDetail
      property={property}
      onClose={onClose}
      previewMode
      onCrossNavigate={onCrossNavigate}
    />
  )
}

// ─── Section route helpers ─────────────────────────────────────────────────────

function getSectionRoute(type: PreviewEntityType, id: string): string {
  if (type === 'property') return `/properties?open=${id}`
  if (type === 'client') return `/clients?highlight=${id}`
  if (type === 'complex') return `/complexes?open=${id}`
  if (type === 'deal') return `/deals?open=${id}`
  return '/'
}

function getSectionLabel(type: PreviewEntityType): string {
  if (type === 'property') return 'Объекты'
  if (type === 'client') return 'Клиенты'
  if (type === 'complex') return 'ЖК'
  if (type === 'deal') return 'Сделки'
  return 'Раздел'
}

// ─── Single preview layer ──────────────────────────────────────────────────────

function PreviewLayer({
  type,
  id,
  onBack,
  onClose,
  isTopLayer,
}: {
  type: PreviewEntityType
  id: string
  onBack: () => void
  onClose: () => void
  isTopLayer: boolean
}) {
  const navigate = useNavigate()
  const open = useCrossPreview((s) => s.open)

  const [translateX, setTranslateX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startXRef = useRef(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleGoToSection = () => {
    onClose()
    setTimeout(() => navigate(getSectionRoute(type, id)), 150)
  }

  const onTouchStart = (e: React.TouchEvent) => {
    const target = e.target as Element
    if (target.closest('input, textarea, select, button, a, label, [role="button"]')) return
    if (scrollRef.current && scrollRef.current.scrollTop > 4) return
    startXRef.current = e.touches[0].clientX
    setDragging(true)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging) return
    const dx = e.touches[0].clientX - startXRef.current
    if (dx > 0) setTranslateX(dx * 0.6)
  }

  const onTouchEnd = () => {
    setDragging(false)
    if (translateX > 80) {
      onBack()
    }
    setTranslateX(0)
  }

  const panelStyle: React.CSSProperties = {
    transform: `translateX(${translateX}px)`,
    transition: dragging ? 'none' : 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
    opacity: 1 - Math.min(translateX / 300, 1) * 0.3,
  }

  const onCrossNavigate = (nextType: PreviewEntityType, nextId: string) => {
    open(nextType, nextId)
  }

  return (
    <div
      className="absolute inset-0 flex flex-col bg-white"
      style={isTopLayer ? panelStyle : undefined}
      onTouchStart={isTopLayer ? onTouchStart : undefined}
      onTouchMove={isTopLayer ? onTouchMove : undefined}
      onTouchEnd={isTopLayer ? onTouchEnd : undefined}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white shrink-0 z-10">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
        >
          <ChevronLeft size={18} />
          <span>Назад</span>
        </button>

        <button
          onClick={handleGoToSection}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
        >
          <span>Перейти в «{getSectionLabel(type)}»</span>
          <ExternalLink size={14} />
        </button>
      </div>

      {/* Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {type === 'property' && (
          <PropertyPreviewContent
            propertyId={id}
            onClose={onBack}
            onCrossNavigate={onCrossNavigate}
          />
        )}
        {type === 'client' && (
          <ClientPreviewContent
            clientId={id}
            onCrossNavigate={onCrossNavigate}
          />
        )}
        {type === 'complex' && (
          <ComplexDetail
            complexId={id}
            onClose={onBack}
            previewMode
            onCrossNavigate={onCrossNavigate}
          />
        )}
        {type === 'deal' && (
          <div className="p-6 text-center text-slate-500 text-sm">
            <p className="mb-3">Просмотр сделки</p>
            <button
              onClick={handleGoToSection}
              className="flex items-center gap-2 mx-auto px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <ExternalLink size={14} /> Открыть в разделе сделок
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main CrossSectionPreview ──────────────────────────────────────────────────

export default function CrossSectionPreview() {
  const { stack, back, close } = useCrossPreview()
  const isOpen = stack.length > 0

  // Animate panel in from right
  const [visible, setVisible] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setMounted(true)
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    } else {
      setVisible(false)
      const t = setTimeout(() => setMounted(false), 350)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') back()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, back])

  if (!mounted) return null

  return (
    <div
      className="fixed inset-0 z-[60]"
      style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
        onClick={back}
      />

      {/* Panel — slides in from right */}
      <div
        className="absolute inset-y-0 right-0 w-full sm:max-w-2xl bg-white shadow-2xl flex flex-col overflow-hidden transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ transform: visible ? 'translateX(0)' : 'translateX(100%)' }}
      >
        {/* Render all layers stacked, only top is interactive */}
        <div className="relative flex-1 overflow-hidden">
          {stack.map((entry, i) => (
            <PreviewLayer
              key={`${entry.type}-${entry.id}-${i}`}
              type={entry.type}
              id={entry.id}
              onBack={back}
              onClose={close}
              isTopLayer={i === stack.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

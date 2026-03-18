import { useState } from 'react'
import {
  MapPin, User, Phone, Hash, Maximize2, Layers, Eye, FileText,
  ChevronRight, Building2, X, type LucideIcon
} from 'lucide-react'
import type { PropertyWithOwner } from '@/types'
import {
  PROPERTY_TYPE_LABELS,
  PROPERTY_STATUS_COLORS,
  PROPERTY_STATUS_LABELS,
} from '@/types'
import { formatPrice, formatPhone, maskPhone } from '@/utils/format'
import { cn } from '@/utils/cn'
import PropertyTypeIcon from './PropertyTypeIcon'

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

  const {
    article, type, status, price, area, rooms, floor, total_floors, view,
    complex_name, address, description, owner,
    area_sotki, communications, cadastral_number,
    is_active_business, has_wet_points, has_parking, entrance_groups,
  } = property

  const title = (() => {
    if (type === 'apartment' && rooms) return `${rooms}-комн. квартира`
    if (type === 'apartment') return 'Квартира'
    return PROPERTY_TYPE_LABELS[type]
  })()

  return (
    <div className="flex flex-col max-h-[85vh]">
      {/* Header */}
      <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <PropertyTypeIcon type={type} size="lg" />
          <div>
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                {article}
              </span>
              <span
                className={cn(
                  'text-xs font-medium px-2 py-0.5 rounded-full',
                  PROPERTY_STATUS_COLORS[status]
                )}
              >
                {PROPERTY_STATUS_LABELS[status]}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Price */}
        <div className="bg-blue-50 rounded-xl px-4 py-3">
          <p className="text-xs text-blue-500 font-medium mb-0.5">Цена</p>
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
                {view && <InfoRow icon={Eye} label="Вид из окон" value={view} />}
              </>
            )}
            {/* Land specific */}
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
                          <span key={c} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            {c}
                          </span>
                        ))}
                      </div>
                    }
                  />
                )}
              </>
            )}
            {/* Commercial specific */}
            {type === 'commercial' && (
              <>
                {is_active_business !== undefined && (
                  <InfoRow
                    icon={Building2}
                    label="Действующий бизнес"
                    value={is_active_business ? 'Да' : 'Нет'}
                  />
                )}
                {has_wet_points !== undefined && (
                  <InfoRow
                    icon={Layers}
                    label="Мокрые точки"
                    value={has_wet_points ? 'Есть' : 'Нет'}
                  />
                )}
                {has_parking !== undefined && (
                  <InfoRow
                    icon={Layers}
                    label="Парковка"
                    value={has_parking ? 'Есть' : 'Нет'}
                  />
                )}
                {entrance_groups !== undefined && (
                  <InfoRow
                    icon={ChevronRight}
                    label="Входных групп"
                    value={entrance_groups}
                  />
                )}
                {communications && communications.length > 0 && (
                  <InfoRow
                    icon={Layers}
                    label="Коммуникации"
                    value={
                      <div className="flex flex-wrap gap-1 mt-1">
                        {communications.map((c) => (
                          <span key={c} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            {c}
                          </span>
                        ))}
                      </div>
                    }
                  />
                )}
              </>
            )}
          </div>
        </div>

        {/* Location */}
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Локация
          </h3>
          <div className="space-y-3">
            {complex_name && (
              <InfoRow icon={Building2} label="ЖК" value={complex_name} />
            )}
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

        {/* Owner */}
        {owner && (
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Собственник
            </h3>
            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                  <User size={16} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{owner.name}</p>
                  <p className="text-xs text-slate-400 font-mono">Клиент #{owner.client_number}</p>
                </div>
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
      </div>
    </div>
  )
}

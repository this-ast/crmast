import { MapPin, User, Maximize2 } from 'lucide-react'
import type { PropertyWithOwner } from '@/types'
import {
  PROPERTY_TYPE_LABELS,
  PROPERTY_STATUS_COLORS,
  PROPERTY_STATUS_LABELS,
} from '@/types'
import { formatPriceShort } from '@/utils/format'
import { cn } from '@/utils/cn'
import PropertyTypeIcon from './PropertyTypeIcon'

interface PropertyCardProps {
  property: PropertyWithOwner
  onClick: () => void
}

export default function PropertyCard({ property, onClick }: PropertyCardProps) {
  const { type, status, price, area, rooms, floor, total_floors, complex_name, address, owner, article } =
    property

  // Location display: complex name if exists, else address
  const locationDisplay = complex_name || address

  // Title: "2-комн. квартира" or "Дом" etc.
  const title = (() => {
    if (type === 'apartment' && rooms) return `${rooms}-комн. квартира`
    if (type === 'apartment') return 'Квартира'
    if (type === 'land') return 'Участок'
    if (type === 'house') return 'Дом'
    if (type === 'commercial') return 'Коммерция'
    return PROPERTY_TYPE_LABELS[type]
  })()

  const firstPhoto = property.photos?.[0]

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-100 cursor-pointer hover:shadow-md hover:border-slate-200 transition-all group overflow-hidden"
    >
      {/* Photo preview */}
      {firstPhoto ? (
        <div className="relative w-full h-36 bg-slate-100 overflow-hidden">
          <img
            src={firstPhoto}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          {(property.photos?.length ?? 0) > 1 && (
            <div className="absolute bottom-2 right-2 text-[11px] bg-black/50 text-white px-1.5 py-0.5 rounded-full backdrop-blur-sm">
              {property.photos!.length} фото
            </div>
          )}
          {property.is_realtor_property && (
            <div className="absolute top-2 left-2 text-[11px] bg-purple-600/90 text-white px-2 py-0.5 rounded-full backdrop-blur-sm font-medium">
              🤝 Риэлтор
            </div>
          )}
        </div>
      ) : (
        <div className="relative w-full h-20 bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center">
          <PropertyTypeIcon type={type} size="sm" />
          {property.is_realtor_property && (
            <div className="absolute top-2 left-2 text-[11px] bg-purple-600/90 text-white px-2 py-0.5 rounded-full font-medium">
              🤝 Риэлтор
            </div>
          )}
        </div>
      )}

      <div className="p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {!firstPhoto && <PropertyTypeIcon type={type} size="sm" />}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{title}</p>
            <p className="text-xs text-slate-400 font-mono">{article}</p>
          </div>
        </div>
        <span
          className={cn(
            'shrink-0 text-xs font-medium px-2 py-0.5 rounded-full',
            PROPERTY_STATUS_COLORS[status]
          )}
        >
          {PROPERTY_STATUS_LABELS[status]}
        </span>
      </div>

      {/* Location */}
      <div className="flex items-start gap-1.5 mb-3">
        <MapPin size={13} className="text-slate-400 mt-0.5 shrink-0" />
        <p className="text-xs text-slate-600 line-clamp-1">{locationDisplay}</p>
      </div>

      {/* Details row */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Maximize2 size={12} />
          <span>{type === 'land' && property.area_sotki ? `${property.area_sotki} сот.` : `${area} м²`}</span>
        </div>
        {type === 'apartment' && floor && total_floors && (
          <div className="text-xs text-slate-500">
            {floor}/{total_floors} эт.
          </div>
        )}
      </div>

      {/* Price */}
      <div className="text-base font-bold text-slate-900 mb-3">
        {formatPriceShort(price)}
      </div>

      {/* Owner */}
      {owner && (
        <div className="flex items-center gap-1.5 pt-3 border-t border-slate-50">
          <User size={13} className="text-slate-400 shrink-0" />
          <span className="text-xs text-slate-600">
            {owner.name}{' '}
            <span className="text-slate-400 font-mono">(#{owner.client_number})</span>
          </span>
        </div>
      )}
      </div>
    </div>
  )
}

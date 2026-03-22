import { Building2, CalendarDays, Phone, Layers } from 'lucide-react'
import type { Complex } from '@/types'

interface ComplexCardProps {
  complex: Complex
  propertyCount?: number
  onClick: () => void
  onShowProperties?: (e: React.MouseEvent) => void
}

export default function ComplexCard({ complex, propertyCount = 0, onClick, onShowProperties }: ComplexCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-100 p-4 cursor-pointer hover:shadow-md hover:border-slate-200 transition-all group"
    >
      {/* Photo */}
      {complex.photos[0] ? (
        <div className="w-full h-32 rounded-xl overflow-hidden mb-3 bg-slate-100">
          <img
            src={complex.photos[0]}
            alt={complex.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="w-full h-32 rounded-xl bg-gradient-to-br from-blue-50 to-slate-100 mb-3 flex items-center justify-center">
          <Building2 size={32} className="text-slate-300" />
        </div>
      )}

      {/* Name */}
      <h3 className="font-semibold text-slate-900 text-sm mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">
        {complex.name}
      </h3>

      {/* Developer */}
      {complex.developer && (
        <p className="text-xs text-slate-500 mb-3 line-clamp-1">{complex.developer}</p>
      )}

      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        {complex.completion_date && (
          <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full">
            <CalendarDays size={11} />
            {complex.completion_date}
          </span>
        )}
        {propertyCount > 0 && (
          <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
            <Layers size={11} />
            {propertyCount} {propertyCount === 1 ? 'объект' : propertyCount < 5 ? 'объекта' : 'объектов'}
          </span>
        )}
        {complex.developer_phones.length > 0 && (
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <Phone size={11} />
            {complex.developer_phones[0]}
          </span>
        )}
      </div>

      {propertyCount > 0 && onShowProperties && (
        <button
          type="button"
          onClick={onShowProperties}
          className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-medium transition-colors"
        >
          <Layers size={12} />
          Объекты в этом доме ({propertyCount})
        </button>
      )}
    </div>
  )
}

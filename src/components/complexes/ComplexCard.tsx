import { useState } from 'react'
import { Building2, CalendarDays, Phone, Layers, ClipboardList, ChevronDown, ChevronUp } from 'lucide-react'
import type { Complex } from '@/types'
import { useComplexUnits } from '@/hooks/useComplexes'
import { formatPriceShort } from '@/utils/format'

interface ComplexCardProps {
  complex: Complex
  propertyCount?: number
  onClick: () => void
  onShowProperties?: (e: React.MouseEvent) => void
  taskCount?: number
}

function UnitsDropdown({ complexId, onStop }: { complexId: string; onStop: (e: React.MouseEvent) => void }) {
  const { data: units = [], isLoading } = useComplexUnits(complexId)

  if (isLoading) return (
    <div className="mt-2 pt-2 border-t border-slate-100">
      <p className="text-xs text-slate-400 text-center py-2">Загрузка...</p>
    </div>
  )

  if (units.length === 0) return (
    <div className="mt-2 pt-2 border-t border-slate-100">
      <p className="text-xs text-slate-400 text-center py-1">Нет объектов</p>
    </div>
  )

  return (
    <div className="mt-2 pt-2 border-t border-slate-100 space-y-1" onClick={onStop}>
      {units.map((u) => (
        <div key={u.id} className="flex items-center justify-between px-2 py-1.5 bg-slate-50 rounded-lg">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-700 truncate">
              {u.title || (u.rooms ? `${u.rooms}-комн. кв.` : 'Объект')}
              {u.area ? ` · ${u.area} м²` : ''}
              {u.floor ? ` · ${u.floor} эт.` : ''}
            </p>
            {u.notes && <p className="text-[10px] text-slate-400 truncate">{u.notes}</p>}
          </div>
          {u.price != null && (
            <span className="text-xs font-bold text-emerald-600 shrink-0 ml-2">{formatPriceShort(u.price)}</span>
          )}
        </div>
      ))}
    </div>
  )
}

export default function ComplexCard({ complex, propertyCount = 0, onClick, onShowProperties, taskCount = 0 }: ComplexCardProps) {
  const [showUnits, setShowUnits] = useState(false)

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

      {/* Cash price badge — from pricing_conditions or legacy pricing */}
      {(() => {
        const fromConditions = complex.pricing_conditions?.find(c => c.payment_type === 'cash' && c.price_per_sqm != null)?.price_per_sqm
        const fromLegacy = complex.pricing?.cash?.price_per_sqm
        const cashPrice = fromConditions ?? fromLegacy
        if (!cashPrice) return null
        return (
          <div className="mt-2 flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
              💵 {new Intl.NumberFormat('ru-RU').format(cashPrice)} ₽/м²
            </span>
          </div>
        )
      })()}

      {taskCount > 0 && (
        <div className="mt-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
            <ClipboardList size={11} />
            {taskCount} {taskCount === 1 ? 'задача' : taskCount < 5 ? 'задачи' : 'задач'}
          </span>
        </div>
      )}

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

      {/* Developer units toggle */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setShowUnits((v) => !v) }}
        className="mt-2 w-full flex items-center justify-between gap-1.5 py-1.5 px-2 rounded-lg hover:bg-slate-50 text-slate-500 text-xs font-medium transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Building2 size={12} />
          Объекты от застройщика
        </span>
        {showUnits ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {showUnits && <UnitsDropdown complexId={complex.id} onStop={(e) => e.stopPropagation()} />}
    </div>
  )
}

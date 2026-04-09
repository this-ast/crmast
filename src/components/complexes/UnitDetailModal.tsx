import { useState } from 'react'
import { Building2, Home, Layers, X, ChevronLeft, ChevronRight } from 'lucide-react'
import LinkedTasksSection from '@/components/tasks/LinkedTasksSection'
import type { ComplexUnit } from '@/types'
import { formatPriceShort } from '@/utils/format'

interface UnitDetailModalProps {
  unit: ComplexUnit & { complex_name?: string; complex_photos?: string[] }
  onClose: () => void
}

export default function UnitDetailModal({ unit, onClose }: UnitDetailModalProps) {
  const label = unit.title || (unit.rooms ? `${unit.rooms}-комн. квартира` : 'Объект')
  const photos = unit.photos?.length ? unit.photos : (unit.complex_photos ?? [])
  const [photoIdx, setPhotoIdx] = useState(0)

  return (
    <div className="flex flex-col max-h-[85vh]">
      {/* Photos */}
      {photos.length > 0 && (
        <div className="relative w-full aspect-video bg-slate-900 shrink-0 overflow-hidden">
          <img src={photos[photoIdx]} alt={label} className="w-full h-full object-cover" />
          {photos.length > 1 && (
            <>
              <button
                onClick={() => setPhotoIdx(i => (i - 1 + photos.length) % photos.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPhotoIdx(i => (i + 1) % photos.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white"
              >
                <ChevronRight size={16} />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {photos.slice(0, 7).map((_, i) => (
                  <button key={i} onClick={() => setPhotoIdx(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${i === photoIdx ? 'bg-white' : 'bg-white/40'}`} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
        <div className="min-w-0">
          <p className="text-base font-semibold text-slate-900 truncate">{label}</p>
          {unit.complex_name && (
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <Building2 size={11} /> {unit.complex_name}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0 ml-3"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Details */}
        <div className="grid grid-cols-2 gap-3">
          {unit.area != null && (
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
              <Home size={14} className="text-slate-400 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Площадь</p>
                <p className="text-sm font-semibold text-slate-800">{unit.area} м²</p>
              </div>
            </div>
          )}
          {unit.floor != null && (
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
              <Layers size={14} className="text-slate-400 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">Этаж</p>
                <p className="text-sm font-semibold text-slate-800">
                  {unit.floor}{unit.total_floors ? `/${unit.total_floors}` : ''}
                </p>
              </div>
            </div>
          )}
          {unit.rooms != null && (
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">Комнат</p>
              <p className="text-sm font-semibold text-slate-800">{unit.rooms}</p>
            </div>
          )}
          {unit.price != null && (
            <div className="p-3 bg-emerald-50 rounded-xl">
              <p className="text-[10px] text-emerald-600 uppercase tracking-wide">Цена (наличный)</p>
              <p className="text-sm font-bold text-emerald-700">{formatPriceShort(unit.price)}</p>
            </div>
          )}
        </div>

        {unit.notes && (
          <div className="px-3 py-2.5 bg-amber-50 border border-amber-100 rounded-xl text-xs text-slate-700">
            {unit.notes}
          </div>
        )}

        {/* Tasks */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Задачи</p>
          <LinkedTasksSection linkedType="unit" linkedId={unit.id} />
        </div>
      </div>
    </div>
  )
}

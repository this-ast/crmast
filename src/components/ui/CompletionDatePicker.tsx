import { useState, useRef, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 7 }, (_, i) => CURRENT_YEAR + i)

export default function CompletionDatePicker({
  value,
  onChange,
  placeholder = 'Q4 2025 или Сдан...',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'unready' | null>(null)
  const [selectedQ, setSelectedQ] = useState<number | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const handleReady = () => {
    onChange('Сдан')
    setOpen(false)
    setMode(null)
    setSelectedQ(null)
  }

  const handleYearSelect = (year: number) => {
    if (!selectedQ) return
    onChange(`Q${selectedQ} ${year}`)
    setOpen(false)
    setMode(null)
    setSelectedQ(null)
  }

  return (
    <div ref={ref} className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      />

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-50 w-72">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs font-semibold text-slate-600">Быстрый выбор</p>
            <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
              <X size={13} />
            </button>
          </div>

          {/* Status quick-select */}
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={handleReady}
              className="flex-1 py-2 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              ✅ Сданный объект
            </button>
            <button
              type="button"
              onClick={() => setMode(mode === 'unready' ? null : 'unready')}
              className={cn(
                'flex-1 py-2 text-xs font-semibold border rounded-lg transition-colors',
                mode === 'unready'
                  ? 'bg-orange-100 text-orange-700 border-orange-300'
                  : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
              )}
            >
              🏗 Не сдан (выбрать)
            </button>
          </div>

          {mode === 'unready' && (
            <>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Квартал</p>
              <div className="grid grid-cols-4 gap-1.5 mb-3">
                {[1, 2, 3, 4].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setSelectedQ(selectedQ === q ? null : q)}
                    className={cn(
                      'py-1.5 rounded-lg text-xs font-semibold border transition-colors',
                      selectedQ === q
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'
                    )}
                  >
                    Q{q}
                  </button>
                ))}
              </div>

              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                Год{!selectedQ && <span className="text-orange-400 ml-1 font-normal">(сначала квартал)</span>}
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {YEARS.map((y) => (
                  <button
                    key={y}
                    type="button"
                    disabled={!selectedQ}
                    onClick={() => handleYearSelect(y)}
                    className={cn(
                      'py-1.5 rounded-lg text-xs font-semibold border transition-colors',
                      !selectedQ
                        ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700'
                    )}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

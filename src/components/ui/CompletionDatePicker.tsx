import { useState, useRef, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 8 }, (_, i) => CURRENT_YEAR + i)

export default function CompletionDatePicker({
  value,
  onChange,
  placeholder = 'Сдан / Кв. 4 2027...',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'unready' | null>(null)
  const [selectedQ, setSelectedQ] = useState<number | null>(null)
  const [customYear, setCustomYear] = useState('')
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

  const applyYear = (year: number) => {
    if (selectedQ) {
      onChange(`Кв. ${selectedQ} ${year}`)
    } else {
      onChange(`${year}`)
    }
    setOpen(false)
    setMode(null)
    setSelectedQ(null)
    setCustomYear('')
  }

  const handleCustomYear = () => {
    const y = parseInt(customYear, 10)
    if (y >= 2000 && y <= 2100) applyYear(y)
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
        <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-50 min-w-full w-64">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs font-semibold text-slate-600">Быстрый выбор</p>
            <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
              <X size={13} />
            </button>
          </div>

          {/* Status quick-select — vertical */}
          <div className="flex flex-col gap-1.5 mb-3">
            <button
              type="button"
              onClick={handleReady}
              className="w-full py-2 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors text-left px-3"
            >
              ✅ Сданный объект
            </button>
            <button
              type="button"
              onClick={() => setMode(mode === 'unready' ? null : 'unready')}
              className={cn(
                'w-full py-2 text-xs font-semibold border rounded-lg transition-colors text-left px-3',
                mode === 'unready'
                  ? 'bg-orange-100 text-orange-700 border-orange-300'
                  : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
              )}
            >
              🏗 Не сдан — выбрать дату
            </button>
          </div>

          {mode === 'unready' && (
            <>
              {/* Quarter */}
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                Квартал <span className="text-slate-300 font-normal normal-case">(необязательно)</span>
              </p>
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
                    Кв.{q}
                  </button>
                ))}
              </div>

              {/* Year */}
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Год</p>
              <div className="grid grid-cols-4 gap-1.5 mb-2">
                {YEARS.map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => applyYear(y)}
                    className="py-1.5 rounded-lg text-xs font-semibold border bg-white text-slate-600 border-slate-200 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 transition-colors"
                  >
                    {y}
                  </button>
                ))}
              </div>

              {/* Custom year */}
              <div className="flex gap-1.5">
                <input
                  type="number"
                  value={customYear}
                  onChange={(e) => setCustomYear(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCustomYear()}
                  placeholder="Другой год..."
                  className="flex-1 min-w-0 px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
                <button
                  type="button"
                  onClick={handleCustomYear}
                  className="px-2.5 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  ОК
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { X, Plus, Trash2, RotateCcw, Pencil, Check } from 'lucide-react'
import { OPTION_LISTS, getOptionsWithDeletions, setOptions, resetOptions } from '@/lib/customOptions'
import { cn } from '@/utils/cn'

interface OptionsManagerProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: string  // optional: open on a specific tab key
}

export default function OptionsManager({ isOpen, onClose, initialTab }: OptionsManagerProps) {
  const [activeTab, setActiveTab] = useState(initialTab ?? OPTION_LISTS[0].key)
  const [lists, setLists] = useState<Record<string, string[]>>({})
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const [newValue, setNewValue] = useState('')

  useEffect(() => {
    if (isOpen) {
      const loaded: Record<string, string[]> = {}
      for (const l of OPTION_LISTS) {
        loaded[l.key] = getOptionsWithDeletions(l.key)
      }
      setLists(loaded)
      setActiveTab(initialTab ?? OPTION_LISTS[0].key)
      setEditingIdx(null)
      setNewValue('')
    }
  }, [isOpen, initialTab])

  if (!isOpen) return null

  const currentList = lists[activeTab] ?? []
  const currentDef = OPTION_LISTS.find((l) => l.key === activeTab)!

  const save = (key: string, updated: string[]) => {
    setLists((prev) => ({ ...prev, [key]: updated }))
    setOptions(key, updated)
  }

  const handleDelete = (idx: number) => {
    const updated = currentList.filter((_, i) => i !== idx)
    save(activeTab, updated)
  }

  const handleAdd = () => {
    const val = newValue.trim()
    if (!val || currentList.includes(val)) return
    save(activeTab, [...currentList, val])
    setNewValue('')
  }

  const handleEditSave = (idx: number) => {
    const val = editValue.trim()
    if (!val) return
    const updated = currentList.map((item, i) => (i === idx ? val : item))
    save(activeTab, updated)
    setEditingIdx(null)
  }

  const handleReset = () => {
    resetOptions(activeTab)
    setLists((prev) => ({
      ...prev,
      [activeTab]: getOptionsWithDeletions(activeTab),
    }))
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">⚙️ Настройки справочников</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar tabs */}
          <div className="w-44 shrink-0 border-r border-slate-100 overflow-y-auto py-2">
            {OPTION_LISTS.map((l) => (
              <button
                key={l.key}
                onClick={() => { setActiveTab(l.key); setEditingIdx(null); setNewValue('') }}
                className={cn(
                  'w-full text-left px-3 py-2 text-xs font-medium transition-colors',
                  activeTab === l.key
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50'
                )}
              >
                {l.label}
                <span className="ml-1 text-slate-400 font-normal">({(lists[l.key] ?? []).length})</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{currentDef.label}</p>
              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-orange-500 transition-colors"
                title="Сбросить к defaults"
              >
                <RotateCcw size={11} /> Сбросить
              </button>
            </div>

            {/* List */}
            <div className="space-y-1">
              {currentList.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 group">
                  {editingIdx === idx ? (
                    <>
                      <input
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleEditSave(idx); if (e.key === 'Escape') setEditingIdx(null) }}
                        className="flex-1 px-2 py-1.5 border border-blue-400 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button onClick={() => handleEditSave(idx)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                        <Check size={13} />
                      </button>
                      <button onClick={() => setEditingIdx(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                        <X size={13} />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm text-slate-800 px-2 py-1.5 bg-slate-50 rounded-lg">{item}</span>
                      <button
                        onClick={() => { setEditingIdx(idx); setEditValue(item) }}
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(idx)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              ))}
              {currentList.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">Список пуст</p>
              )}
            </div>

            {/* Add new */}
            <div className="flex gap-2 pt-1 border-t border-slate-100">
              <input
                type="text"
                placeholder="Новый вариант..."
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
                className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAdd}
                disabled={!newValue.trim()}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
              >
                <Plus size={12} /> Добавить
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

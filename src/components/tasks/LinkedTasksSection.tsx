import { useRef, useState } from 'react'
import { CheckCircle2, Circle, Plus, X, Loader2, ClipboardList, Link2, Search } from 'lucide-react'
import { useTasksByLinked, useCreateTask, useUpdateTask } from '@/hooks/useTasks'
import { useClients } from '@/hooks/useClients'
import { useProperties } from '@/hooks/useProperties'
import { useComplexes } from '@/hooks/useComplexes'
import { useDemands } from '@/hooks/useDemands'
import { TASK_PRIORITY_COLORS, TASK_PRIORITY_LABELS, TASK_PRIORITY_DOT } from '@/types'
import type { TaskLinkedType, TaskPriority, TaskAlsoLink } from '@/types'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'

const TODAY = new Date().toISOString().slice(0, 10)

function fmtDate(d: string) {
  const [y, m, day] = d.split('-')
  return `${day}.${m}.${y}`
}

const TYPE_LABELS: Record<TaskLinkedType, string> = {
  client:   'Клиент',
  property: 'Объект',
  deal:     'Сделка',
  complex:  'ЖК',
  demand:   'Спрос',
  unit:     'От застройщика',
}

type PickerTab = 'client' | 'property' | 'complex' | 'demand'

interface EntityOption {
  type: TaskLinkedType
  id: string
  label: string
}

export interface AlsoLinkOption {
  type: TaskLinkedType
  id: string
  label: string
}

function EntityPicker({
  selected,
  onToggle,
  excludeType,
  excludeId,
}: {
  selected: EntityOption[]
  onToggle: (opt: EntityOption) => void
  excludeType?: TaskLinkedType
  excludeId?: string
}) {
  const [tab, setTab] = useState<PickerTab>('client')
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: clients = [] } = useClients()
  const { data: properties = [] } = useProperties()
  const { data: complexes = [] } = useComplexes()
  const { data: demands = [] } = useDemands()

  const q = query.toLowerCase().trim()

  const tabs: { id: PickerTab; label: string }[] = [
    { id: 'client',   label: 'Клиент' },
    { id: 'property', label: 'Объект' },
    { id: 'complex',  label: 'ЖК'     },
    { id: 'demand',   label: 'Спрос'  },
  ]

  const results: EntityOption[] = (() => {
    switch (tab) {
      case 'client':
        return clients
          .filter(c => !(excludeType === 'client' && c.id === excludeId))
          .filter(c => !q || c.name.toLowerCase().includes(q) || String(c.client_number).includes(q))
          .slice(0, 20)
          .map(c => ({ type: 'client', id: c.id, label: `#${c.client_number} ${c.name}` }))
      case 'property':
        return properties
          .filter(p => !(excludeType === 'property' && p.id === excludeId))
          .filter(p => {
            if (!q) return true
            const address = [p.address, p.article].filter(Boolean).join(' ').toLowerCase()
            return address.includes(q)
          })
          .slice(0, 20)
          .map(p => ({ type: 'property', id: p.id, label: p.address || p.article || p.id.slice(0, 8) }))
      case 'complex':
        return complexes
          .filter(c => !(excludeType === 'complex' && c.id === excludeId))
          .filter(c => !q || c.name.toLowerCase().includes(q))
          .slice(0, 20)
          .map(c => ({ type: 'complex', id: c.id, label: c.name }))
      case 'demand':
        return demands
          .filter(d => !(excludeType === 'demand' && d.id === excludeId))
          .filter(d => {
            if (!q) return true
            const text = [d.title, d.demand_number ? String(d.demand_number) : '', d.client?.name].filter(Boolean).join(' ').toLowerCase()
            return text.includes(q)
          })
          .slice(0, 20)
          .map(d => ({
            type: 'demand' as TaskLinkedType,
            id: d.id,
            label: d.title || (d.demand_number ? `Спрос #${d.demand_number}` : d.id.slice(0, 8)),
          }))
      default:
        return []
    }
  })()

  const isSelected = (id: string) => selected.some(s => s.id === id)

  return (
    <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-slate-100">
        {tabs.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => { setTab(t.id); setQuery(''); setTimeout(() => inputRef.current?.focus(), 0) }}
            className={cn(
              'flex-1 py-1.5 text-[11px] font-semibold transition-colors',
              tab === t.id
                ? 'bg-violet-600 text-white'
                : 'text-slate-500 hover:bg-slate-50'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-1.5 px-2.5 py-2 border-b border-slate-100">
        <Search size={12} className="text-slate-400 shrink-0" />
        <input
          ref={inputRef}
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={`Поиск ${TYPE_LABELS[tab].toLowerCase()}а...`}
          className="flex-1 text-xs bg-transparent outline-none text-slate-800 placeholder-slate-400"
        />
        {query && (
          <button type="button" onClick={() => setQuery('')} className="text-slate-300 hover:text-slate-500">
            <X size={11} />
          </button>
        )}
      </div>

      {/* Results */}
      <div className="max-h-40 overflow-y-auto">
        {results.length === 0 ? (
          <p className="text-[11px] text-slate-400 px-3 py-2">Ничего не найдено</p>
        ) : (
          results.map(opt => {
            const sel = isSelected(opt.id)
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onToggle(opt)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors',
                  sel ? 'bg-violet-50 text-violet-700' : 'hover:bg-slate-50 text-slate-700'
                )}
              >
                <div className={cn(
                  'w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0',
                  sel ? 'bg-violet-600 border-violet-600' : 'border-slate-300'
                )}>
                  {sel && <span className="text-white text-[9px] font-bold">✓</span>}
                </div>
                <span className="truncate">{opt.label}</span>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

export default function LinkedTasksSection({
  linkedType,
  linkedId,
  alsoLinkOptions = [],
}: {
  linkedType: TaskLinkedType
  linkedId: string
  /** Extra entities the task can also be linked to (e.g. client from demand) */
  alsoLinkOptions?: AlsoLinkOption[]
}) {
  const { data: tasks = [], isLoading } = useTasksByLinked(linkedType, linkedId)
  const updateTask = useUpdateTask()
  const createTask = useCreateTask()

  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [deadline, setDeadline] = useState('')
  const [alsoLinked, setAlsoLinked] = useState<EntityOption[]>([])
  const [showPicker, setShowPicker] = useState(false)

  // Pre-select suggested options on form open
  const openForm = () => {
    setAlsoLinked(alsoLinkOptions.map(o => ({ type: o.type, id: o.id, label: o.label })))
    setShowForm(true)
  }

  const toggleEntity = (opt: EntityOption) => {
    setAlsoLinked(prev =>
      prev.some(s => s.id === opt.id)
        ? prev.filter(s => s.id !== opt.id)
        : [...prev, opt]
    )
  }

  const handleToggle = async (id: string, currentStatus: string) => {
    try {
      await updateTask.mutateAsync({ id, data: { status: currentStatus === 'done' ? 'pending' : 'done' } })
    } catch {
      toast.error('Ошибка')
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!title.trim()) return
    try {
      const extraLinks: TaskAlsoLink[] = alsoLinked.map(o => ({ type: o.type, id: o.id, label: o.label }))

      await createTask.mutateAsync({
        title: title.trim(),
        priority,
        deadline: deadline || undefined,
        linked_type: linkedType,
        linked_id: linkedId,
        also_linked: extraLinks.length > 0 ? extraLinks : undefined,
      })
      setTitle('')
      setPriority('medium')
      setDeadline('')
      setAlsoLinked([])
      setShowPicker(false)
      setShowForm(false)
      toast.success('Задача создана')
    } catch {
      toast.error('Ошибка создания задачи')
    }
  }

  const resetForm = () => {
    setShowForm(false)
    setTitle('')
    setDeadline('')
    setPriority('medium')
    setAlsoLinked([])
    setShowPicker(false)
  }

  if (isLoading) return null

  const active = tasks.filter(t => t.status !== 'done')
  const done = tasks.filter(t => t.status === 'done')

  return (
    <div className="space-y-1.5">
      {/* Active tasks */}
      {active.map(task => {
        const overdue = task.deadline && task.deadline < TODAY
        const today = task.deadline === TODAY
        return (
          <div
            key={task.id}
            className={cn(
              'flex items-start gap-2 px-3 py-2 rounded-lg border',
              overdue ? 'bg-red-50 border-red-200' :
              today  ? 'bg-amber-50 border-amber-200' :
                       'bg-white border-slate-100'
            )}
          >
            <button
              onClick={(e) => { e.stopPropagation(); handleToggle(task.id, task.status) }}
              className="mt-0.5 shrink-0"
            >
              <Circle size={14} className="text-slate-300 hover:text-blue-400 transition-colors" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-800 truncate">{task.title}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full border', TASK_PRIORITY_COLORS[task.priority])}>
                  {TASK_PRIORITY_LABELS[task.priority]}
                </span>
                {task.deadline && (
                  <span className={cn(
                    'text-[10px]',
                    overdue ? 'text-red-500 font-bold' :
                    today   ? 'text-amber-600 font-medium' :
                              'text-slate-400'
                  )}>
                    {overdue ? '⏰ ' : today ? '📅 ' : ''}{fmtDate(task.deadline)}
                  </span>
                )}
                {/* Also linked badges */}
                {Array.isArray(task.also_linked) && task.also_linked.map((l) => (
                  <span key={l.id} className="flex items-center gap-0.5 text-[10px] text-slate-400">
                    <Link2 size={9} />
                    {TYPE_LABELS[l.type]}: {l.label ?? l.id.slice(0, 6)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )
      })}

      {/* Done tasks (collapsed) */}
      {done.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
          <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
          <span className="text-[11px] text-slate-400">Выполнено: {done.length}</span>
          <div className="flex gap-1 ml-1">
            {done.slice(0, 3).map(t => (
              <div key={t.id} className={cn('w-1.5 h-1.5 rounded-full', TASK_PRIORITY_DOT[t.priority])} title={t.title} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {tasks.length === 0 && !showForm && (
        <div className="flex items-center gap-2">
          <ClipboardList size={13} className="text-slate-300" />
          <span className="text-xs text-slate-400">Задач нет</span>
        </div>
      )}

      {/* Inline quick-create form */}
      {showForm ? (
        <form
          onSubmit={handleCreate}
          onClick={(e) => e.stopPropagation()}
          className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2"
        >
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Что нужно сделать..."
            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <div className="flex gap-2">
            <select
              value={priority}
              onChange={e => setPriority(e.target.value as TaskPriority)}
              className="flex-1 px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="high">🔴 Высокий</option>
              <option value="medium">🟡 Средний</option>
              <option value="low">⚪ Низкий</option>
            </select>
            <input
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              className="flex-1 px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Entity linker */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                <Link2 size={10} /> Также привязать к:
              </p>
              <button
                type="button"
                onClick={() => setShowPicker(v => !v)}
                className={cn(
                  'text-[11px] px-2 py-0.5 rounded-full border font-medium transition-colors',
                  showPicker
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-violet-400'
                )}
              >
                <Search size={10} className="inline mr-1" />
                Найти
              </button>
            </div>

            {/* Selected entity tags */}
            {alsoLinked.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1.5">
                {alsoLinked.map(opt => (
                  <span
                    key={opt.id}
                    className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 border border-violet-200 font-medium"
                  >
                    {TYPE_LABELS[opt.type]}: {opt.label}
                    <button
                      type="button"
                      onClick={() => toggleEntity(opt)}
                      className="text-violet-400 hover:text-violet-700"
                    >
                      <X size={9} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Picker dropdown */}
            {showPicker && (
              <EntityPicker
                selected={alsoLinked}
                onToggle={toggleEntity}
                excludeType={linkedType}
                excludeId={linkedId}
              />
            )}
          </div>

          <div className="flex gap-2 pt-0.5">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); resetForm() }}
              className="flex-1 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-500 hover:bg-slate-100 flex items-center justify-center gap-1"
            >
              <X size={11} /> Отмена
            </button>
            <button
              type="submit"
              disabled={!title.trim() || createTask.isPending}
              className="flex-1 py-1.5 rounded-lg bg-blue-600 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {createTask.isPending ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
              Создать
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); openForm() }}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-dashed border-slate-200 text-xs text-slate-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-colors"
        >
          <Plus size={12} /> Добавить задачу
        </button>
      )}
    </div>
  )
}

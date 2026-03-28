import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import {
  Building2, Users, TrendingUp, Clock, AlertCircle, Loader2,
  Plus, CheckCircle2, Circle, Trash2, Pencil, X, Bell,
  ChevronLeft, ChevronRight, BarChart2, Target, Zap, Star,
  Calendar, Link2, Phone, DollarSign, TrendingDown, Flame,
  ChevronUp, ChevronDown, GripVertical, Settings2,
} from 'lucide-react'
import { useProperties } from '@/hooks/useProperties'
import { useClients } from '@/hooks/useClients'
import { useDeals } from '@/hooks/useDeals'
import { useComplexes } from '@/hooks/useComplexes'
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks'
import { formatPrice } from '@/utils/format'
import { cn } from '@/utils/cn'
import {
  PROPERTY_TYPE_LABELS, PROPERTY_STATUS_LABELS,
  CLIENT_STATUS_COLORS,
  TASK_PRIORITY_LABELS, TASK_PRIORITY_COLORS, TASK_PRIORITY_DOT,
} from '@/types'
import type { Task, TaskFormData, TaskPriority, TaskLinkedType } from '@/types'
import toast from 'react-hot-toast'

const TODAY = new Date().toISOString().slice(0, 10)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  const [y, m, day] = d.split('-')
  return `${day}.${m}.${y}`
}

function isOverdue(deadline?: string) {
  return !!deadline && deadline < TODAY
}

function isToday(deadline?: string) {
  return deadline === TODAY
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, sub, color, href,
}: { icon: React.ElementType; label: string; value: string | number; sub?: string; color: string; href?: string }) {
  const navigate = useNavigate()
  return (
    <div
      onClick={() => href && navigate(href)}
      className={cn(
        'bg-white rounded-2xl border border-slate-100 p-5 transition-all duration-200',
        href && 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]'
      )}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', color)}>
          <Icon size={18} />
        </div>
        <span className="text-xs font-medium text-slate-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  )
}

// ─── Task Form Modal ──────────────────────────────────────────────────────────

function TaskFormModal({
  initial,
  clients,
  properties,
  deals,
  complexes,
  onSave,
  onCancel,
  isSubmitting,
}: {
  initial?: Partial<TaskFormData>
  clients: { id: string; name: string }[]
  properties: { id: string; article: string; address?: string }[]
  deals: { id: string; title?: string; deal_number: number }[]
  complexes: { id: string; name: string }[]
  onSave: (data: TaskFormData) => void
  onCancel: () => void
  isSubmitting: boolean
}) {
  const { register, handleSubmit, watch } = useForm<TaskFormData>({ defaultValues: { priority: 'medium', ...initial } })
  const linkedType = watch('linked_type')

  return (
    <form onSubmit={handleSubmit(onSave)} className="p-5 space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">Название <span className="text-red-500">*</span></label>
        <input
          {...register('title', { required: true })}
          placeholder="Что нужно сделать..."
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Приоритет</label>
          <select {...register('priority')} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="high">🔴 Высокий</option>
            <option value="medium">🟡 Средний</option>
            <option value="low">⚪ Низкий</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Дедлайн</label>
          <input type="date" {...register('deadline')} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">Описание</label>
        <textarea
          {...register('description')}
          rows={2}
          placeholder="Дополнительные детали..."
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Привязать к</label>
          <select {...register('linked_type')} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">— без привязки —</option>
            <option value="client">Клиент</option>
            <option value="property">Объект</option>
            <option value="deal">Сделка</option>
            <option value="complex">ЖК</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            {linkedType === 'client' ? 'Клиент' : linkedType === 'property' ? 'Объект' : linkedType === 'deal' ? 'Сделка' : linkedType === 'complex' ? 'ЖК' : 'Запись'}
          </label>
          {linkedType === 'client' && (
            <select {...register('linked_id')} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— выбрать —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          {linkedType === 'property' && (
            <select {...register('linked_id')} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— выбрать —</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.article}{p.address ? ` · ${p.address}` : ''}</option>)}
            </select>
          )}
          {linkedType === 'deal' && (
            <select {...register('linked_id')} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— выбрать —</option>
              {deals.map(d => <option key={d.id} value={d.id}>#{d.deal_number} {d.title || 'Сделка'}</option>)}
            </select>
          )}
          {linkedType === 'complex' && (
            <select {...register('linked_id')} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— выбрать —</option>
              {complexes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          {!linkedType && (
            <div className="px-3 py-2 border border-slate-100 rounded-lg bg-slate-50 text-xs text-slate-400">не выбрано</div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">Потенциальная прибыль (₽)</label>
        <input
          type="number"
          {...register('profit_potential', { valueAsNumber: true })}
          placeholder="0"
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">
          Отмена
        </button>
        <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2">
          {isSubmitting && <Loader2 size={14} className="animate-spin" />}
          Сохранить
        </button>
      </div>
    </form>
  )
}

// ─── Task Row ─────────────────────────────────────────────────────────────────

function TaskRow({
  task,
  onToggle,
  onEdit,
  onDelete,
  linkedLabel,
  onLinkedClick,
}: {
  task: Task
  onToggle: (t: Task) => void
  onEdit: (t: Task) => void
  onDelete: (id: string) => void
  linkedLabel?: string
  onLinkedClick?: () => void
}) {
  const done = task.status === 'done'
  const overdue = !done && isOverdue(task.deadline)
  const today = !done && isToday(task.deadline)

  return (
    <div className={cn(
      'flex items-start gap-3 px-4 py-3 rounded-xl border transition-all',
      done ? 'bg-slate-50 border-slate-100 opacity-60' :
      overdue ? 'bg-red-50 border-red-200' :
      today ? 'bg-amber-50 border-amber-200' :
      'bg-white border-slate-100 hover:border-blue-200'
    )}>
      <button onClick={() => onToggle(task)} className="mt-0.5 shrink-0">
        {done
          ? <CheckCircle2 size={16} className="text-emerald-500" />
          : <Circle size={16} className="text-slate-300 hover:text-blue-400 transition-colors" />
        }
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn('text-sm font-medium', done ? 'line-through text-slate-400' : 'text-slate-800')}>
            {task.title}
          </span>
          <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full border', TASK_PRIORITY_COLORS[task.priority])}>
            {TASK_PRIORITY_LABELS[task.priority]}
          </span>
          {linkedLabel && (
            <button
              onClick={onLinkedClick}
              className="flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded-full transition-colors"
            >
              <Link2 size={9} /> {linkedLabel}
            </button>
          )}
        </div>
        {task.description && (
          <p className="text-xs text-slate-400 mt-0.5 truncate">{task.description}</p>
        )}
        <div className="flex items-center gap-3 mt-1">
          {task.deadline && (
            <span className={cn(
              'text-[11px] font-medium flex items-center gap-1',
              overdue ? 'text-red-600' : today ? 'text-amber-600' : 'text-slate-400'
            )}>
              <Calendar size={10} />
              {overdue ? '⏰ ' : today ? '📅 сегодня' : ''}{!today ? fmtDate(task.deadline) : ''}
            </span>
          )}
          {task.profit_potential && task.profit_potential > 0 && (
            <span className="text-[11px] text-emerald-600 font-medium">
              +{formatPrice(task.profit_potential)}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button onClick={() => onEdit(task)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
          <Pencil size={13} />
        </button>
        <button onClick={() => onDelete(task.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

// ─── Tasks Widget ─────────────────────────────────────────────────────────────

function TasksWidget({
  tasks,
  clients,
  properties,
  deals,
  complexes,
}: {
  tasks: Task[]
  clients: { id: string; name: string }[]
  properties: { id: string; article: string; address?: string }[]
  deals: { id: string; title?: string; deal_number: number }[]
  complexes: { id: string; name: string }[]
}) {
  const navigate = useNavigate()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()

  const [tab, setTab] = useState<'today' | 'all' | 'done'>('today')
  const [formOpen, setFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  // Auto-tasks (generated, not stored in DB)
  const overdueClients = useMemo(() => {
    return clients.filter((c: any) => c.next_contact && c.next_contact < TODAY && c.status !== 'Архив' && c.status !== 'Сделка')
  }, [clients])

  const autoTasks = useMemo(() => {
    const items: { id: string; title: string; priority: TaskPriority; icon: string }[] = []
    overdueClients.slice(0, 3).forEach((c: any) => {
      items.push({ id: `auto-${c.id}`, title: `Связаться: ${c.name}`, priority: 'high', icon: '📞' })
    })
    if (properties.length < 10) {
      items.push({ id: 'auto-props', title: 'Найти минимум 5 новых объектов', priority: 'medium', icon: '🏠' })
    }
    const activeDeals = (deals as any[]).filter(d => d.status === 'active')
    if (activeDeals.length > 0) {
      items.push({ id: 'auto-deals', title: `Обновить статус активных сделок (${activeDeals.length})`, priority: 'medium', icon: '🤝' })
    }
    return items
  }, [overdueClients, properties, deals])

  // Filter user tasks
  const filteredTasks = useMemo(() => {
    if (tab === 'today') return tasks.filter(t => t.status !== 'done' && (isToday(t.deadline) || isOverdue(t.deadline)))
    if (tab === 'all') return tasks.filter(t => t.status !== 'done')
    return tasks.filter(t => t.status === 'done')
  }, [tasks, tab])

  // TOP-3 urgent: overdue first, then today, then high priority
  const top3 = useMemo(() => {
    return [...tasks]
      .filter(t => t.status !== 'done')
      .sort((a, b) => {
        const scoreA = (isOverdue(a.deadline) ? 100 : isToday(a.deadline) ? 50 : 0) + (a.priority === 'high' ? 30 : a.priority === 'medium' ? 10 : 0)
        const scoreB = (isOverdue(b.deadline) ? 100 : isToday(b.deadline) ? 50 : 0) + (b.priority === 'high' ? 30 : b.priority === 'medium' ? 10 : 0)
        return scoreB - scoreA
      })
      .slice(0, 3)
  }, [tasks])

  const linkedLabel = (task: Task) => {
    if (!task.linked_type || !task.linked_id) return undefined
    if (task.linked_type === 'client') return clients.find(c => c.id === task.linked_id)?.name
    if (task.linked_type === 'property') {
      const p = properties.find(p => p.id === task.linked_id)
      return p ? p.article : undefined
    }
    if (task.linked_type === 'deal') {
      const d = (deals as any[]).find(d => d.id === task.linked_id)
      return d ? `#${d.deal_number}` : undefined
    }
    if (task.linked_type === 'complex') {
      return complexes.find(c => c.id === task.linked_id)?.name
    }
  }

  const linkedNavigate = (task: Task) => {
    if (!task.linked_type || !task.linked_id) return undefined
    if (task.linked_type === 'client') return () => navigate(`/clients?highlight=${task.linked_id}`)
    if (task.linked_type === 'property') return () => navigate(`/properties?open=${task.linked_id}`)
    if (task.linked_type === 'deal') return () => navigate(`/deals?open=${task.linked_id}`)
    if (task.linked_type === 'complex') return () => navigate(`/complexes?open=${task.linked_id}`)
  }

  const handleSave = async (data: TaskFormData) => {
    try {
      if (editingTask) {
        await updateTask.mutateAsync({ id: editingTask.id, data })
        toast.success('Задача обновлена')
      } else {
        await createTask.mutateAsync(data)
        toast.success('Задача добавлена')
      }
      setFormOpen(false)
      setEditingTask(null)
    } catch {
      toast.error('Ошибка при сохранении')
    }
  }

  const handleToggle = async (task: Task) => {
    try {
      await updateTask.mutateAsync({ id: task.id, data: { status: task.status === 'done' ? 'pending' : 'done' } })
    } catch {
      toast.error('Ошибка')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteTask.mutateAsync(id)
      toast.success('Задача удалена')
    } catch {
      toast.error('Ошибка')
    }
  }

  const todayCount = tasks.filter(t => t.status !== 'done' && (isToday(t.deadline) || isOverdue(t.deadline))).length
  const allCount = tasks.filter(t => t.status !== 'done').length
  const doneCount = tasks.filter(t => t.status === 'done').length

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-blue-500" />
          <span className="text-sm font-semibold text-slate-800">Задачи</span>
        </div>
        <button
          onClick={() => { setEditingTask(null); setFormOpen(v => !v) }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={13} />
          Добавить
        </button>
      </div>

      {/* Form */}
      {formOpen && (
        <div className="mb-4 border border-blue-100 rounded-xl bg-blue-50/30">
          <TaskFormModal
            initial={editingTask ?? undefined}
            clients={clients}
            properties={properties}
            deals={deals}
            complexes={complexes}
            onSave={handleSave}
            onCancel={() => { setFormOpen(false); setEditingTask(null) }}
            isSubmitting={createTask.isPending || updateTask.isPending}
          />
        </div>
      )}

      {/* TOP-3 */}
      {top3.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Star size={12} className="text-amber-500" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">ТОП-3 задачи дня</span>
          </div>
          <div className="space-y-1.5">
            {top3.map((task, i) => (
              <div key={task.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100">
                <span className="text-xs font-bold text-amber-600 w-4">{i + 1}</span>
                <div className={cn('w-2 h-2 rounded-full shrink-0', TASK_PRIORITY_DOT[task.priority])} />
                <span className="text-xs font-medium text-slate-800 flex-1 truncate">{task.title}</span>
                {task.deadline && (
                  <span className={cn('text-[10px] shrink-0', isOverdue(task.deadline) ? 'text-red-500 font-bold' : 'text-slate-400')}>
                    {isOverdue(task.deadline) ? '⏰' : ''} {fmtDate(task.deadline)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Auto tasks */}
      {autoTasks.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={12} className="text-violet-500" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Авто-задачи на сегодня</span>
          </div>
          <div className="space-y-1.5">
            {autoTasks.map(t => (
              <div key={t.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-50 border border-violet-100">
                <span>{t.icon}</span>
                <span className="text-xs text-violet-800 flex-1 truncate">{t.title}</span>
                <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full border', TASK_PRIORITY_COLORS[t.priority])}>
                  {TASK_PRIORITY_LABELS[t.priority]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-3">
        {([
          { key: 'today', label: 'Сегодня', count: todayCount },
          { key: 'all', label: 'Все активные', count: allCount },
          { key: 'done', label: 'Выполнено', count: doneCount },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex-1 py-1.5 text-xs font-medium rounded-md transition-all',
              tab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {t.label}
            {t.count > 0 && <span className={cn('ml-1', tab === t.key ? 'text-blue-600' : 'text-slate-400')}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {filteredTasks.length === 0 ? (
          <p className="text-center text-xs text-slate-400 py-6">
            {tab === 'today' ? 'Задач на сегодня нет 🎉' : tab === 'done' ? 'Нет выполненных задач' : 'Нет активных задач'}
          </p>
        ) : (
          filteredTasks.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={handleToggle}
              onEdit={(t) => { setEditingTask(t); setFormOpen(true) }}
              onDelete={handleDelete}
              linkedLabel={linkedLabel(task)}
              onLinkedClick={linkedNavigate(task)}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ─── Mini Calendar ─────────────────────────────────────────────────────────────

function MiniCalendar({ tasks }: { tasks: Task[] }) {
  const now = new Date()
  const [viewDate, setViewDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1))
  const [selected, setSelected] = useState<string | null>(TODAY)

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7 // Mon=0

  const taskDays = useMemo(() => {
    const map: Record<string, { overdue: number; today: number; future: number }> = {}
    for (const t of tasks) {
      if (!t.deadline || t.status === 'done') continue
      const d = t.deadline
      if (!map[d]) map[d] = { overdue: 0, today: 0, future: 0 }
      if (isOverdue(d)) map[d].overdue++
      else if (isToday(d)) map[d].today++
      else map[d].future++
    }
    return map
  }, [tasks])

  const selectedTasks = useMemo(() =>
    selected ? tasks.filter(t => t.deadline === selected && t.status !== 'done') : [],
    [tasks, selected]
  )

  const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Calendar size={15} className="text-blue-500" />
        <span className="text-sm font-semibold text-slate-800 flex-1">Календарь задач</span>
        <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-1 rounded hover:bg-slate-100">
          <ChevronLeft size={14} className="text-slate-500" />
        </button>
        <span className="text-xs font-medium text-slate-600">{monthNames[month]} {year}</span>
        <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-1 rounded hover:bg-slate-100">
          <ChevronRight size={14} className="text-slate-500" />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 mb-1">
        {['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d => (
          <div key={d} className="text-center text-[10px] font-medium text-slate-400 py-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const info = taskDays[dateStr]
          const isT = dateStr === TODAY
          const isSel = dateStr === selected

          return (
            <button
              key={day}
              onClick={() => setSelected(dateStr === selected ? null : dateStr)}
              className={cn(
                'relative aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-medium transition-all',
                isSel ? 'bg-blue-600 text-white' :
                isT ? 'bg-blue-100 text-blue-700 font-bold' :
                'text-slate-700 hover:bg-slate-100'
              )}
            >
              {day}
              {info && (
                <div className="flex gap-0.5 mt-0.5">
                  {info.overdue > 0 && <div className="w-1 h-1 rounded-full bg-red-500" />}
                  {info.today > 0 && <div className="w-1 h-1 rounded-full bg-amber-400" />}
                  {info.future > 0 && <div className="w-1 h-1 rounded-full bg-blue-400" />}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Selected day tasks */}
      {selected && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <p className="text-xs font-semibold text-slate-500 mb-2">{fmtDate(selected)}</p>
          {selectedTasks.length === 0 ? (
            <p className="text-xs text-slate-400">Задач нет</p>
          ) : (
            <div className="space-y-1.5">
              {selectedTasks.map(t => (
                <div key={t.id} className="flex items-center gap-2">
                  <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', TASK_PRIORITY_DOT[t.priority])} />
                  <span className="text-xs text-slate-700 truncate">{t.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Notifications Widget ─────────────────────────────────────────────────────

function NotificationsWidget({
  clients,
  tasks,
}: {
  clients: any[]
  tasks: Task[]
}) {
  const overdueContacts = useMemo(() =>
    clients.filter(c => c.next_contact && c.next_contact < TODAY && c.status !== 'Архив' && c.status !== 'Сделка'),
    [clients]
  )
  const todayContacts = useMemo(() =>
    clients.filter(c => c.next_contact === TODAY && c.status !== 'Архив'),
    [clients]
  )
  const overdueTasks = useMemo(() =>
    tasks.filter(t => t.status !== 'done' && isOverdue(t.deadline)),
    [tasks]
  )
  const todayTasks = useMemo(() =>
    tasks.filter(t => t.status !== 'done' && isToday(t.deadline)),
    [tasks]
  )

  const total = overdueContacts.length + todayContacts.length + overdueTasks.length + todayTasks.length

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="relative">
          <Bell size={15} className="text-amber-500" />
          {total > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] font-bold text-white flex items-center justify-center">
              {total > 9 ? '9+' : total}
            </span>
          )}
        </div>
        <span className="text-sm font-semibold text-slate-800">Уведомления</span>
      </div>

      {total === 0 ? (
        <div className="text-center py-6">
          <CheckCircle2 size={28} className="text-emerald-400 mx-auto mb-2" />
          <p className="text-sm text-slate-500 font-medium">Всё в порядке</p>
          <p className="text-xs text-slate-400 mt-1">Просроченных задач нет</p>
        </div>
      ) : (
        <div className="space-y-3">
          {overdueTasks.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-600 mb-1.5">⏰ Просроченные задачи ({overdueTasks.length})</p>
              <div className="space-y-1">
                {overdueTasks.slice(0, 3).map(t => (
                  <div key={t.id} className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-lg">
                    <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', TASK_PRIORITY_DOT[t.priority])} />
                    <span className="text-xs text-red-800 truncate">{t.title}</span>
                    {t.deadline && <span className="text-[10px] text-red-400 ml-auto shrink-0">{fmtDate(t.deadline)}</span>}
                  </div>
                ))}
                {overdueTasks.length > 3 && <p className="text-xs text-red-400 pl-3">ещё {overdueTasks.length - 3}...</p>}
              </div>
            </div>
          )}

          {todayTasks.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-amber-600 mb-1.5">📅 Задачи на сегодня ({todayTasks.length})</p>
              <div className="space-y-1">
                {todayTasks.slice(0, 3).map(t => (
                  <div key={t.id} className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-lg">
                    <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', TASK_PRIORITY_DOT[t.priority])} />
                    <span className="text-xs text-amber-800 truncate">{t.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {overdueContacts.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-orange-600 mb-1.5">📞 Просроченные контакты ({overdueContacts.length})</p>
              <div className="space-y-1">
                {overdueContacts.slice(0, 3).map((c: any) => (
                  <div key={c.id} className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-lg">
                    <span className="text-xs text-orange-800 truncate">{c.name}</span>
                    <span className="text-[10px] text-orange-400 ml-auto shrink-0">{c.next_contact}</span>
                  </div>
                ))}
                {overdueContacts.length > 3 && <p className="text-xs text-orange-400 pl-3">ещё {overdueContacts.length - 3}...</p>}
              </div>
            </div>
          )}

          {todayContacts.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-blue-600 mb-1.5">👤 Контакты сегодня ({todayContacts.length})</p>
              <div className="space-y-1">
                {todayContacts.slice(0, 2).map((c: any) => (
                  <div key={c.id} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                    <span className="text-xs text-blue-800 truncate">{c.name}</span>
                    {c.next_step && <span className="text-[10px] text-blue-400 ml-auto shrink-0 max-w-20 truncate">{c.next_step}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Analytics Widget ─────────────────────────────────────────────────────────

function AnalyticsWidget({
  tasks,
  clients,
  deals,
}: {
  tasks: Task[]
  clients: any[]
  deals: any[]
}) {
  const thisMonth = TODAY.slice(0, 7) // YYYY-MM
  const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)

  const totalTasks = tasks.length
  const doneTasks = tasks.filter(t => t.status === 'done').length
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  const newClientsMonth = clients.filter(c => c.created_at?.startsWith(thisMonth)).length
  const newClientsWeek = clients.filter(c => c.created_at >= lastWeek).length

  const activeDeals = deals.filter(d => d.status === 'active').length
  const completedDeals = deals.filter(d => d.status === 'completed').length
  const totalCommission = deals
    .filter(d => d.status === 'completed' && d.commission)
    .reduce((s: number, d: any) => s + (d.commission ?? 0), 0)

  const tasksWithDeals = tasks.filter(t => t.status === 'done' && t.linked_type === 'deal').length
  const conversionRate = doneTasks > 0 ? Math.round((tasksWithDeals / doneTasks) * 100) : 0

  const stats = [
    { label: 'Задач выполнено', value: `${doneTasks} / ${totalTasks}`, sub: `${completionRate}% выполнение`, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 },
    { label: 'Новых лидов за месяц', value: newClientsMonth, sub: `${newClientsWeek} за неделю`, color: 'text-blue-600', bg: 'bg-blue-50', icon: Users },
    { label: 'Активных сделок', value: activeDeals, sub: `${completedDeals} завершено`, color: 'text-violet-600', bg: 'bg-violet-50', icon: Target },
    { label: 'Заработано комиссий', value: totalCommission > 0 ? formatPrice(totalCommission) : '—', sub: 'по завершённым сделкам', color: 'text-amber-600', bg: 'bg-amber-50', icon: TrendingUp },
    { label: 'Конверсия задач → сделки', value: `${conversionRate}%`, sub: `${tasksWithDeals} задач привели к сделке`, color: 'text-rose-600', bg: 'bg-rose-50', icon: BarChart2 },
  ]

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart2 size={15} className="text-blue-500" />
        <span className="text-sm font-semibold text-slate-800">Аналитика эффективности</span>
      </div>

      {/* Completion bar */}
      <div className="mb-4 p-3 bg-slate-50 rounded-xl">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-slate-600">Выполнение задач</span>
          <span className={cn('text-xs font-bold', completionRate >= 70 ? 'text-emerald-600' : completionRate >= 40 ? 'text-amber-600' : 'text-red-500')}>
            {completionRate}%
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className={cn('h-2 rounded-full transition-all', completionRate >= 70 ? 'bg-emerald-500' : completionRate >= 40 ? 'bg-amber-400' : 'bg-red-400')}
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {stats.map(({ label, value, sub, color, bg, icon: Icon }) => (
          <div key={label} className={cn('rounded-xl p-3', bg)}>
            <div className="flex items-center gap-1.5 mb-1">
              <Icon size={12} className={color} />
              <span className={cn('text-[10px] font-medium', color)}>{label}</span>
            </div>
            <p className={cn('text-base font-bold', color)}>{value}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Mini CRM ─────────────────────────────────────────────────────────────────

function MiniCRM({ clients }: { clients: any[] }) {
  const navigate = useNavigate()

  const priorityOrder = ['Горячий', 'Тёплый', 'Думает', 'Воздухан', 'Холодный']
  const topClients = useMemo(() => {
    return [...clients]
      .filter(c => c.status !== 'Архив')
      .sort((a, b) => {
        const ai = priorityOrder.indexOf(a.status ?? '')
        const bi = priorityOrder.indexOf(b.status ?? '')
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
      })
      .slice(0, 7)
  }, [clients])

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users size={15} className="text-blue-500" />
          <span className="text-sm font-semibold text-slate-800">Приоритетные клиенты</span>
        </div>
        <button onClick={() => navigate('/clients')} className="text-xs text-blue-600 hover:underline font-medium">
          Все →
        </button>
      </div>

      {topClients.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-4">Клиентов нет</p>
      ) : (
        <div className="space-y-2">
          {topClients.map((c: any) => (
            <button
              key={c.id}
              onClick={() => navigate(`/clients?highlight=${c.id}`)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all text-left group"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-blue-600">#{c.client_number}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-blue-700">{c.name}</p>
                {c.request && <p className="text-[10px] text-slate-400 truncate">{c.request}</p>}
              </div>
              {c.status && (
                <span className={cn(
                  'text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0',
                  CLIENT_STATUS_COLORS[c.status] ?? 'bg-slate-100 text-slate-600'
                )}>
                  {c.status}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Money Block ──────────────────────────────────────────────────────────────

function MoneyBlock({ deals }: { deals: any[] }) {
  const navigate = useNavigate()
  const now = new Date()
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  const activeDeals = deals.filter(d => d.status === 'active')
  const expectedIncome = activeDeals.reduce((s: number, d: any) => s + (d.commission ?? 0), 0)
  const potentialRevenue = activeDeals.reduce((s: number, d: any) => s + (d.deal_price ?? 0), 0)

  const monthDeals = deals.filter(d => d.status === 'completed' && d.deal_date >= monthStart)
  const monthIncome = monthDeals.reduce((s: number, d: any) => s + (d.commission ?? 0), 0)

  const card = (icon: React.ElementType, label: string, value: string, sub: string, color: string, href?: string) => {
    const Icon = icon
    return (
      <div
        onClick={() => href && navigate(href)}
        className={cn('bg-white rounded-2xl border border-slate-100 p-5 transition-all duration-200', href && 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]')}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', color)}>
            <Icon size={16} />
          </div>
          <span className="text-xs font-medium text-slate-500">{label}</span>
        </div>
        <p className="text-xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-400 mt-1">{sub}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {card(DollarSign, 'Ожидаемый доход', formatPrice(expectedIncome), `${activeDeals.length} активных сделок`, 'bg-emerald-50 text-emerald-600', '/deals')}
      {card(TrendingUp, 'Доход за месяц', formatPrice(monthIncome), `${monthDeals.length} закрытых сделок`, 'bg-blue-50 text-blue-600', '/deals')}
      {card(Target, 'Потенциальный оборот', formatPrice(potentialRevenue), 'по активным сделкам', 'bg-violet-50 text-violet-600', '/deals')}
    </div>
  )
}

// ─── Sales Funnel Block ────────────────────────────────────────────────────────

function SalesFunnelBlock({ clients }: { clients: any[] }) {
  const navigate = useNavigate()
  const active = clients.filter(c => c.status !== 'Архив' && c.status !== 'Сделка')
  const leads     = active.filter(c => !c.funnel_stage || c.funnel_stage === 'new' || c.funnel_stage === 'needs').length
  const selection = active.filter(c => c.funnel_stage === 'selection').length
  const showings  = active.filter(c => c.funnel_stage === 'showings').length
  const thinking  = active.filter(c => c.funnel_stage === 'thinking' || c.funnel_stage === 'bargain').length
  const closed    = clients.filter(c => c.funnel_stage === 'deal' || c.status === 'Сделка').length

  const stages = [
    { label: 'Лиды',       count: leads,     color: 'bg-slate-400',   light: 'bg-slate-50 text-slate-600' },
    { label: 'Подбор',     count: selection, color: 'bg-blue-400',    light: 'bg-blue-50 text-blue-600' },
    { label: 'Показы',     count: showings,  color: 'bg-violet-400',  light: 'bg-violet-50 text-violet-600' },
    { label: 'Думает/Торг',count: thinking,  color: 'bg-amber-400',   light: 'bg-amber-50 text-amber-700' },
    { label: 'Сделка',     count: closed,    color: 'bg-emerald-500', light: 'bg-emerald-50 text-emerald-700' },
  ]
  const maxCount = Math.max(...stages.map(s => s.count), 1)

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-800">Воронка продаж</h3>
        <button onClick={() => navigate('/clients')} className="text-xs text-blue-600 hover:underline">Все клиенты →</button>
      </div>
      <div className="space-y-2.5">
        {stages.map((s, i) => {
          const pct = maxCount > 0 ? Math.round((s.count / maxCount) * 100) : 0
          const conv = i > 0 && stages[i-1].count > 0 ? Math.round((s.count / stages[i-1].count) * 100) : null
          return (
            <div key={s.label}>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-xs text-slate-500 w-24 shrink-0">{s.label}</span>
                <div className="flex-1 h-6 bg-slate-100 rounded-lg overflow-hidden">
                  <div
                    className={cn('h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-2', s.color)}
                    style={{ width: `${Math.max(pct, s.count > 0 ? 8 : 0)}%` }}
                  >
                    {s.count > 0 && <span className="text-[11px] font-bold text-white">{s.count}</span>}
                  </div>
                </div>
                {conv !== null && (
                  <span className={cn('text-[11px] font-semibold w-12 text-right shrink-0', conv >= 50 ? 'text-emerald-600' : conv >= 25 ? 'text-amber-600' : 'text-red-500')}>
                    {conv}%
                  </span>
                )}
                {conv === null && <span className="w-12 shrink-0" />}
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-xs text-slate-400 mt-3">Конверсия между этапами</p>
    </div>
  )
}

// ─── Call Now Block ────────────────────────────────────────────────────────────

function CallNowBlock({ clients }: { clients: any[] }) {
  const navigate = useNavigate()
  const todayStr = new Date().toISOString().slice(0, 10)
  const twoDaysAgo = new Date(Date.now() - 2 * 864e5).toISOString().slice(0, 10)

  const hot      = clients.filter(c => c.status === 'Горячий' && c.status !== 'Архив').slice(0, 3)
  const noTouch  = clients.filter(c =>
    c.status !== 'Архив' && c.status !== 'Сделка' &&
    (!c.last_contact || c.last_contact < twoDaysAgo)
  ).sort((a, b) => (a.last_contact ?? '') < (b.last_contact ?? '') ? -1 : 1).slice(0, 3)
  const thinking = clients.filter(c => c.status === 'Думает' || c.funnel_stage === 'thinking').slice(0, 3)

  const daysSince = (d?: string) => {
    if (!d) return null
    return Math.floor((Date.now() - new Date(d).getTime()) / 864e5)
  }

  const ClientRow = ({ c, tag }: { c: any; tag: string }) => (
    <button
      onClick={() => navigate('/clients')}
      className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors text-left"
    >
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-800 truncate">{c.name}</p>
        {c.budget && <p className="text-[11px] text-slate-400 truncate">{c.budget}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-2">
        {c.payment_method && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">{c.payment_method}</span>}
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">{tag}</span>
      </div>
    </button>
  )

  const allEmpty = hot.length === 0 && noTouch.length === 0 && thinking.length === 0

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
          <Phone size={15} className="text-red-500" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800">Кому позвонить сейчас</h3>
      </div>
      {allEmpty ? (
        <p className="text-xs text-slate-400 text-center py-4">Нет срочных контактов</p>
      ) : (
        <div className="space-y-3">
          {hot.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-red-600 mb-1.5 flex items-center gap-1"><Flame size={11} /> Горячие</p>
              <div className="space-y-1">
                {hot.map(c => <ClientRow key={c.id} c={c} tag="🔥 Горячий" />)}
              </div>
            </div>
          )}
          {noTouch.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-amber-600 mb-1.5">⏰ Нет контакта {'>'}2 дней</p>
              <div className="space-y-1">
                {noTouch.map(c => {
                  const d = daysSince(c.last_contact)
                  return <ClientRow key={c.id} c={c} tag={d !== null ? `${d}д без связи` : 'Нет контакта'} />
                })}
              </div>
            </div>
          )}
          {thinking.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-purple-600 mb-1.5">💭 Думает</p>
              <div className="space-y-1">
                {thinking.map(c => <ClientRow key={c.id} c={c} tag="Думает" />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Lost Opportunities Block ──────────────────────────────────────────────────

function LostOpportunitiesBlock({ clients, deals }: { clients: any[]; deals: any[] }) {
  const navigate = useNavigate()
  const cancelled  = deals.filter(d => d.status === 'cancelled')
  const coldLeads  = clients.filter(c => c.status === 'Холодный' || c.status === 'Воздухан' || c.status === 'Воздухан(ка)')
  const noReply    = clients.filter(c => !c.last_contact && c.status !== 'Архив' && c.status !== 'Сделка')

  const totalLost = cancelled.length + coldLeads.length + noReply.length
  if (totalLost === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-red-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
          <TrendingDown size={15} className="text-red-500" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800">Потерянные возможности</h3>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <button onClick={() => navigate('/deals')} className="text-center p-3 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
          <p className="text-2xl font-bold text-red-600">{cancelled.length}</p>
          <p className="text-[11px] text-red-500 mt-0.5">Сорванных сделок</p>
        </button>
        <button onClick={() => navigate('/clients')} className="text-center p-3 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors">
          <p className="text-2xl font-bold text-amber-600">{coldLeads.length}</p>
          <p className="text-[11px] text-amber-500 mt-0.5">Холодных / воздухан</p>
        </button>
        <button onClick={() => navigate('/clients')} className="text-center p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
          <p className="text-2xl font-bold text-slate-600">{noReply.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Без контакта</p>
        </button>
      </div>
    </div>
  )
}

// ─── Layout block wrapper ──────────────────────────────────────────────────────

const DEFAULT_LAYOUT = ['money', 'metrics', 'callnow_funnel', 'notifications', 'tasks', 'analytics', 'lost']

function useLayout() {
  const saved = (() => { try { return JSON.parse(localStorage.getItem('crm_dash_layout') ?? '') } catch { return null } })()
  const [layout, setLayoutState] = useState<string[]>(saved ?? DEFAULT_LAYOUT)
  const setLayout = (l: string[]) => { setLayoutState(l); localStorage.setItem('crm_dash_layout', JSON.stringify(l)) }
  const move = (idx: number, dir: -1 | 1) => {
    const next = [...layout]
    const swap = idx + dir
    if (swap < 0 || swap >= next.length) return
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    setLayout(next)
  }
  return { layout, move, reset: () => setLayout(DEFAULT_LAYOUT) }
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: properties = [], isLoading: propsLoading, error: propsError } = useProperties()
  const { data: clients = [], isLoading: clientsLoading, error: clientsError } = useClients()
  const { data: deals = [], isLoading: dealsLoading } = useDeals()
  const { data: complexes = [] } = useComplexes()
  const { data: tasks = [], isLoading: tasksLoading } = useTasks()
  const [editLayout, setEditLayout] = useState(false)
  const { layout, move, reset } = useLayout()

  const isLoading = propsLoading || clientsLoading || dealsLoading || tasksLoading
  const hasError = propsError || clientsError

  const today = new Date()
  const dateLabel = today.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-blue-500" />
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl text-red-700 text-sm">
          <AlertCircle size={18} />
          Ошибка загрузки данных. Проверьте подключение к Supabase.
        </div>
      </div>
    )
  }

  const activeProps = properties.filter(p => p.status === 'active').length
  const hotClients = clients.filter(c => c.status === 'Горячий' || c.status === 'Тёплый' || c.status === 'Теплый').length
  const pendingTasks = tasks.filter(t => t.status !== 'done').length
  const overdueTasksCount = tasks.filter(t => t.status !== 'done' && isOverdue(t.deadline)).length
  const activeDealsCount = (deals as any[]).filter(d => d.status === 'active').length

  const taskProps = properties.map(p => ({ id: p.id, article: p.article, address: p.address }))
  const taskDeals = (deals as any[]).map(d => ({ id: d.id, title: d.title, deal_number: d.deal_number }))
  const taskClients = clients.map(c => ({ id: c.id, name: c.name }))
  const taskComplexes = (complexes as any[]).map(c => ({ id: c.id, name: c.name }))

  const blocks: Record<string, React.ReactNode> = {
    money: <MoneyBlock deals={deals as any[]} />,
    metrics: (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Building2} label="Активных объектов" value={activeProps} sub={`${properties.length} всего в базе`} color="bg-blue-50 text-blue-600" href="/properties" />
        <StatCard icon={Users} label="Горячих клиентов" value={hotClients} sub={`${clients.length} всего в базе`} color="bg-orange-50 text-orange-600" href="/clients" />
        <StatCard icon={Clock} label="Активных задач" value={pendingTasks} sub={overdueTasksCount > 0 ? `⏰ ${overdueTasksCount} просрочено` : 'Всё в срок'} color="bg-purple-50 text-purple-600" href="/tasks" />
        <StatCard icon={Zap} label="Активных сделок" value={activeDealsCount} sub="в работе" color="bg-emerald-50 text-emerald-600" href="/deals" />
      </div>
    ),
    callnow_funnel: (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CallNowBlock clients={clients} />
        <SalesFunnelBlock clients={clients} />
      </div>
    ),
    notifications: (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <NotificationsWidget clients={clients} tasks={tasks} />
        <div className="lg:col-span-2"><MiniCalendar tasks={tasks} /></div>
      </div>
    ),
    tasks: <TasksWidget tasks={tasks} clients={taskClients} properties={taskProps} deals={taskDeals} complexes={taskComplexes} />,
    analytics: (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AnalyticsWidget tasks={tasks} clients={clients} deals={deals} />
        <MiniCRM clients={clients} />
      </div>
    ),
    lost: <LostOpportunitiesBlock clients={clients} deals={deals as any[]} />,
  }

  const BLOCK_LABELS: Record<string, string> = {
    money: '💰 Деньги',
    metrics: '📊 Метрики',
    callnow_funnel: '📞 Позвонить + воронка',
    notifications: '🔔 Уведомления + календарь',
    tasks: '✅ Задачи',
    analytics: '📈 Аналитика + клиенты',
    lost: '⚠️ Потери',
  }

  return (
    <div className="p-4 sm:p-6 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 capitalize">{dateLabel}</h1>
          <p className="text-sm text-slate-500 mt-0.5">Сводка по работе</p>
        </div>
        <div className="flex items-center gap-2">
          {overdueTasksCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle size={14} className="text-red-500" />
              <span className="text-xs font-semibold text-red-700">Просрочено: {overdueTasksCount}</span>
            </div>
          )}
          <button
            onClick={() => setEditLayout(v => !v)}
            className={cn('flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors', editLayout ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}
          >
            <Settings2 size={14} />
            {editLayout ? 'Готово' : 'Блоки'}
          </button>
        </div>
      </div>

      {/* Blocks */}
      <div className="space-y-5">
        {layout.map((key, idx) => {
          const block = blocks[key]
          if (!block) return null
          return (
            <div key={key} className={cn('relative', editLayout && 'ring-2 ring-blue-200 rounded-2xl p-1')}>
              {editLayout && (
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="flex items-center gap-2">
                    <GripVertical size={14} className="text-slate-400" />
                    <span className="text-xs font-medium text-slate-600">{BLOCK_LABELS[key]}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => move(idx, -1)} disabled={idx === 0} className="p-1 rounded-lg hover:bg-slate-200 disabled:opacity-30 transition-colors"><ChevronUp size={14} /></button>
                    <button onClick={() => move(idx, 1)} disabled={idx === layout.length - 1} className="p-1 rounded-lg hover:bg-slate-200 disabled:opacity-30 transition-colors"><ChevronDown size={14} /></button>
                  </div>
                </div>
              )}
              {block}
            </div>
          )
        })}
      </div>

      {editLayout && (
        <div className="mt-4 flex justify-center">
          <button onClick={reset} className="text-xs text-slate-400 hover:text-red-500 transition-colors">Сбросить порядок</button>
        </div>
      )}
    </div>
  )
}

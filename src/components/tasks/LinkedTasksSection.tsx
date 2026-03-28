import { useState } from 'react'
import { CheckCircle2, Circle, Plus, X, Loader2, ClipboardList } from 'lucide-react'
import { useTasksByLinked, useCreateTask, useUpdateTask } from '@/hooks/useTasks'
import { TASK_PRIORITY_COLORS, TASK_PRIORITY_LABELS, TASK_PRIORITY_DOT } from '@/types'
import type { TaskLinkedType, TaskPriority } from '@/types'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'

const TODAY = new Date().toISOString().slice(0, 10)

function fmtDate(d: string) {
  const [y, m, day] = d.split('-')
  return `${day}.${m}.${y}`
}

export default function LinkedTasksSection({
  linkedType,
  linkedId,
}: {
  linkedType: TaskLinkedType
  linkedId: string
}) {
  const { data: tasks = [], isLoading } = useTasksByLinked(linkedType, linkedId)
  const updateTask = useUpdateTask()
  const createTask = useCreateTask()

  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [deadline, setDeadline] = useState('')

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
      await createTask.mutateAsync({
        title: title.trim(),
        priority,
        deadline: deadline || undefined,
        linked_type: linkedType,
        linked_id: linkedId,
      })
      setTitle('')
      setPriority('medium')
      setDeadline('')
      setShowForm(false)
      toast.success('Задача создана')
    } catch {
      toast.error('Ошибка создания задачи')
    }
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
          <div className="flex gap-2 pt-0.5">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowForm(false); setTitle(''); setDeadline(''); setPriority('medium') }}
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
          onClick={(e) => { e.stopPropagation(); setShowForm(true) }}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-dashed border-slate-200 text-xs text-slate-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-colors"
        >
          <Plus size={12} /> Добавить задачу
        </button>
      )}
    </div>
  )
}

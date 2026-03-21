import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Circle, ExternalLink, ClipboardList } from 'lucide-react'
import { useTasksByLinked, useUpdateTask } from '@/hooks/useTasks'
import { TASK_PRIORITY_COLORS, TASK_PRIORITY_LABELS, TASK_PRIORITY_DOT } from '@/types'
import type { TaskLinkedType } from '@/types'
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
  linkedType: 'client' | 'property' | 'deal'
  linkedId: string
}) {
  const navigate = useNavigate()
  const { data: tasks = [], isLoading } = useTasksByLinked(linkedType as TaskLinkedType, linkedId)
  const updateTask = useUpdateTask()

  const handleToggle = async (id: string, currentStatus: string) => {
    try {
      await updateTask.mutateAsync({ id, data: { status: currentStatus === 'done' ? 'pending' : 'done' } })
    } catch {
      toast.error('Ошибка')
    }
  }

  if (isLoading) return null
  if (tasks.length === 0) return (
    <div className="flex items-center gap-2">
      <ClipboardList size={13} className="text-slate-300" />
      <span className="text-xs text-slate-400">Задач нет</span>
      <button
        onClick={(e) => { e.stopPropagation(); navigate('/dashboard') }}
        className="ml-auto text-[10px] text-blue-500 hover:underline flex items-center gap-1"
      >
        <ExternalLink size={10} /> Добавить в дашборде
      </button>
    </div>
  )

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

            {/* Navigate to dashboard */}
            <button
              onClick={(e) => { e.stopPropagation(); navigate('/dashboard') }}
              className="p-1 rounded text-slate-300 hover:text-blue-500 hover:bg-blue-50 transition-colors shrink-0"
              title="Открыть в дашборде"
            >
              <ExternalLink size={12} />
            </button>
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
    </div>
  )
}

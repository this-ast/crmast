export type TaskPriority = 'high' | 'medium' | 'low'
export type TaskStatus = 'pending' | 'done' | 'cancelled'
export type TaskLinkedType = 'client' | 'property' | 'deal' | 'complex' | 'demand'

export interface TaskAlsoLink {
  type: TaskLinkedType
  id: string
  label?: string
}

export interface Task {
  id: string
  title: string
  description?: string
  priority: TaskPriority
  deadline?: string
  status: TaskStatus
  linked_type?: TaskLinkedType
  linked_id?: string
  also_linked?: TaskAlsoLink[]
  profit_potential?: number
  created_at: string
  updated_at: string
}

export interface TaskFormData {
  title: string
  description?: string
  priority: TaskPriority
  deadline?: string
  linked_type?: TaskLinkedType
  linked_id?: string
  also_linked?: TaskAlsoLink[]
  profit_potential?: number
}

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  high: 'Высокий',
  medium: 'Средний',
  low: 'Низкий',
}

export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  high:   'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low:    'bg-slate-100 text-slate-600 border-slate-200',
}

export const TASK_PRIORITY_DOT: Record<TaskPriority, string> = {
  high:   'bg-red-500',
  medium: 'bg-amber-400',
  low:    'bg-slate-400',
}

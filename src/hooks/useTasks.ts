import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Task, TaskFormData } from '@/types'

const Q = 'tasks'

function clean(data: Partial<TaskFormData>) {
  return Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined && v !== '')
  )
}

export function useTasks() {
  return useQuery({
    queryKey: [Q],
    queryFn: async (): Promise<Task[]> => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) {
        if (error.code === '42P01') return []
        throw new Error(error.message)
      }
      return (data ?? []) as Task[]
    },
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: TaskFormData): Promise<Task> => {
      const { data: created, error } = await supabase
        .from('tasks').insert(clean(data)).select('*').single()
      if (error) throw new Error(error.message)
      return created as Task
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [Q] }),
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TaskFormData> & { status?: string } }): Promise<Task> => {
      const { data: updated, error } = await supabase
        .from('tasks').update(clean(data)).eq('id', id).select('*').single()
      if (error) throw new Error(error.message)
      return updated as Task
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [Q] }),
  })
}

export function useTasksByLinked(linkedType: 'client' | 'property' | 'deal' | 'complex' | 'demand', linkedId: string | undefined) {
  return useQuery({
    queryKey: [Q, 'linked', linkedType, linkedId],
    enabled: !!linkedId,
    queryFn: async (): Promise<Task[]> => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('linked_type', linkedType)
        .eq('linked_id', linkedId!)
        .order('created_at', { ascending: false })
      if (error) {
        if (error.code === '42P01') return []
        throw new Error(error.message)
      }
      return (data ?? []) as Task[]
    },
  })
}

/** Returns a map of entityId → count of active (pending) tasks.
 *  Checks both primary linked_id and also_linked entries. */
export function useActiveTaskCounts(): Record<string, number> {
  const { data: tasks = [] } = useTasks()
  const map: Record<string, number> = {}
  tasks.forEach((t) => {
    if (t.status !== 'pending') return
    if (t.linked_id) {
      map[t.linked_id] = (map[t.linked_id] ?? 0) + 1
    }
    if (Array.isArray(t.also_linked)) {
      t.also_linked.forEach((l) => {
        if (l.id) map[l.id] = (map[l.id] ?? 0) + 1
      })
    }
  })
  return map
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [Q] }),
  })
}

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

export function useTasksByLinked(linkedType: 'client' | 'property' | 'deal', linkedId: string | undefined) {
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

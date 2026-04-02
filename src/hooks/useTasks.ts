import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import type { Task, TaskFormData, TaskAlsoLink, TaskLinkedType } from '@/types'

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
      const payload = clean(data)
      const { data: created, error } = await supabase
        .from('tasks').insert(payload).select('*').single()

      if (error) {
        // Graceful fallback 1: also_linked column doesn't exist — retry without it
        if (payload.also_linked !== undefined && (
          error.message.toLowerCase().includes('also_linked') ||
          error.code === '42703' // column does not exist
        )) {
          const { also_linked: _al, ...rest } = payload
          const { data: c2, error: e2 } = await supabase
            .from('tasks').insert(rest).select('*').single()
          if (e2) throw new Error(e2.message)
          return c2 as Task
        }
        // Graceful fallback 2: linked_type check constraint (e.g. 'unit' not allowed)
        if (
          error.message.toLowerCase().includes('linked_type') ||
          (error.code === '23514') // check constraint violation
        ) {
          const { linked_type: _lt, linked_id: _li, ...rest2 } = payload
          const { data: c3, error: e3 } = await supabase
            .from('tasks').insert(rest2).select('*').single()
          if (e3) throw new Error(e3.message)
          return c3 as Task
        }
        throw new Error(error.message)
      }
      return created as Task
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [Q] }),
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TaskFormData> & { status?: string } }): Promise<Task> => {
      const payload = clean(data)
      const { data: updated, error } = await supabase
        .from('tasks').update(payload).eq('id', id).select('*').single()

      if (error) {
        // Same fallback: also_linked column missing
        if (payload.also_linked !== undefined && (
          error.message.toLowerCase().includes('also_linked') || error.code === '42703'
        )) {
          const { also_linked: _al, ...rest } = payload
          const { data: u2, error: e2 } = await supabase
            .from('tasks').update(rest).eq('id', id).select('*').single()
          if (e2) throw new Error(e2.message)
          return u2 as Task
        }
        throw new Error(error.message)
      }
      return updated as Task
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [Q] }),
  })
}

/**
 * Returns tasks where either:
 *  a) the primary (linked_type, linked_id) matches, OR
 *  b) any entry in also_linked matches.
 *
 * Uses the global useTasks() cache — no extra DB round-trips.
 */
export function useTasksByLinked(linkedType: TaskLinkedType, linkedId: string | undefined) {
  const { data: allTasks = [], isLoading } = useTasks()

  const data = useMemo(() => {
    if (!linkedId) return []
    return allTasks.filter(t => {
      if (t.linked_type === linkedType && t.linked_id === linkedId) return true
      if (Array.isArray(t.also_linked)) {
        return (t.also_linked as TaskAlsoLink[]).some(
          l => l.type === linkedType && l.id === linkedId
        )
      }
      return false
    })
  }, [allTasks, linkedType, linkedId])

  return { data, isLoading }
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

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { TimelineEvent, TimelineEventFormData, TimelineEntityType } from '@/types'

const QUERY_KEY = 'timeline_events'

export function useTimeline(entityType: TimelineEntityType, entityId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, entityType, entityId],
    enabled: !!entityId,
    queryFn: async (): Promise<TimelineEvent[]> => {
      const { data, error } = await supabase
        .from('timeline_events')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId!)
        .order('event_date', { ascending: false })
      if (error) {
        if (error.code === '42P01') return []
        throw new Error(error.message ?? JSON.stringify(error))
      }
      return data ?? []
    },
  })
}

export function useCreateTimelineEvent(entityType: TimelineEntityType, entityId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: TimelineEventFormData): Promise<TimelineEvent> => {
      const { data: created, error } = await supabase
        .from('timeline_events')
        .insert({ ...data, entity_type: entityType, entity_id: entityId })
        .select('*')
        .single()
      if (error) throw new Error(error.message ?? JSON.stringify(error))
      return created
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY, entityType, entityId] }),
  })
}

export function useUpdateTimelineEvent(entityType: TimelineEntityType, entityId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TimelineEventFormData> }): Promise<TimelineEvent> => {
      const { data: updated, error } = await supabase
        .from('timeline_events')
        .update(data)
        .eq('id', id)
        .select('*')
        .single()
      if (error) throw new Error(error.message ?? JSON.stringify(error))
      return updated
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY, entityType, entityId] }),
  })
}

export function useDeleteTimelineEvent(entityType: TimelineEntityType, entityId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('timeline_events').delete().eq('id', id)
      if (error) throw new Error(error.message ?? JSON.stringify(error))
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY, entityType, entityId] }),
  })
}

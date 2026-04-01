import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { cacheEntities, getCachedEntities, enqueue, OFFLINE_MARKER, isOfflineMarker } from '@/lib/db'
import { refreshPendingCount } from '@/store/useNetworkStore'
import type { Demand, DemandFormData } from '@/types'

const QUERY_KEY = 'demands'

export function useDemands() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async (): Promise<Demand[]> => {
      if (!navigator.onLine) {
        return getCachedEntities<Demand>(QUERY_KEY)
      }

      const { data, error } = await supabase
        .from('demands')
        .select('*, client:clients(id, client_number, name, phone)')
        .order('created_at', { ascending: false })

      if (error) {
        if (error.code === '42P01') return []
        const cached = await getCachedEntities<Demand>(QUERY_KEY)
        if (cached.length > 0) return cached
        throw new Error(error.message ?? JSON.stringify(error))
      }

      const result = (data ?? []) as Demand[]
      cacheEntities(QUERY_KEY, result)
      return result
    },
  })
}

export function useDemandsByClient(clientId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, 'client', clientId],
    enabled: !!clientId,
    queryFn: async (): Promise<Demand[]> => {
      const { data, error } = await supabase
        .from('demands')
        .select('*, client:clients(id, client_number, name, phone)')
        .eq('client_id', clientId!)
        .order('created_at', { ascending: false })
      if (error) {
        if (error.code === '42P01') return []
        throw new Error(error.message ?? JSON.stringify(error))
      }
      return (data ?? []) as Demand[]
    },
  })
}

function cleanData(data: DemandFormData): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined && v !== '')
  )
}

export function useCreateDemand() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: DemandFormData) => {
      if (!navigator.onLine) {
        await enqueue({ entity: 'demands', operation: 'create', data: cleanData(data) })
        await refreshPendingCount()
        return OFFLINE_MARKER
      }
      const { data: created, error } = await supabase
        .from('demands').insert(cleanData(data)).select('*, client:clients(id, client_number, name, phone)').single()
      if (error) throw new Error(error.message ?? JSON.stringify(error))
      return created as Demand
    },
    onSuccess: (result) => {
      if (isOfflineMarker(result)) return
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

export function useUpdateDemand() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DemandFormData> }) => {
      if (!navigator.onLine) {
        await enqueue({ entity: 'demands', operation: 'update', data: cleanData(data as DemandFormData), entityId: id })
        await refreshPendingCount()
        return OFFLINE_MARKER
      }
      const { data: updated, error } = await supabase
        .from('demands').update(cleanData(data as DemandFormData)).eq('id', id)
        .select('*, client:clients(id, client_number, name, phone)').single()
      if (error) throw new Error(error.message ?? JSON.stringify(error))
      return updated as Demand
    },
    onSuccess: (result) => {
      if (isOfflineMarker(result)) return
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

export function useDeleteDemand() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      if (!navigator.onLine) {
        await enqueue({ entity: 'demands', operation: 'delete', data: {}, entityId: id })
        await refreshPendingCount()
        return OFFLINE_MARKER
      }
      const { error } = await supabase.from('demands').delete().eq('id', id)
      if (error) throw new Error(error.message ?? JSON.stringify(error))
    },
    onSuccess: (result) => {
      if (isOfflineMarker(result)) return
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

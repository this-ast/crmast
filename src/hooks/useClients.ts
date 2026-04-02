import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { cacheEntities, getCachedEntities, enqueue, OFFLINE_MARKER, isOfflineMarker } from '@/lib/db'
import { refreshPendingCount } from '@/store/useNetworkStore'
import type { Client, ClientFormData } from '@/types'

const QUERY_KEY = 'clients'

export function useClients() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async (): Promise<Client[]> => {
      if (!navigator.onLine) {
        console.log('[Clients] offline → IDB cache')
        return getCachedEntities<Client>(QUERY_KEY)
      }

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('client_number', { ascending: true })

      if (error) {
        console.error('[Clients] fetch error:', error)
        const cached = await getCachedEntities<Client>(QUERY_KEY)
        if (cached.length > 0) return cached
        throw new Error(error.message ?? JSON.stringify(error))
      }

      const result = data ?? []
      cacheEntities(QUERY_KEY, result)
      return result
    },
  })
}

export function useCreateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ClientFormData & { client_number?: number }) => {
      if (!navigator.onLine) {
        const tempId = crypto.randomUUID()
        await enqueue({
          entity: 'clients',
          operation: 'create',
          data: { id: tempId, ...(data as unknown as Record<string, unknown>) },
        })
        await refreshPendingCount()
        // Возвращаем fake-объект с temp ID — компонент может использовать .id
        return {
          id: tempId,
          client_number: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...data,
          phone: data.phone ?? '',
          _offline: true,
        } as unknown as Client
      }

      let clientNumber = data.client_number
      if (!clientNumber) {
        const { data: maxRow } = await supabase
          .from('clients')
          .select('client_number')
          .order('client_number', { ascending: false })
          .limit(1)
          .single()
        clientNumber = (maxRow?.client_number ?? 0) + 1
      }

      // Strip empty strings from date fields — Supabase rejects "" for date columns
      const DATE_FIELDS = ['contact_date', 'last_contact', 'next_contact'] as const
      const cleaned = { ...data } as Record<string, unknown>
      DATE_FIELDS.forEach(f => { if (cleaned[f] === '') cleaned[f] = undefined })

      const { data: created, error } = await supabase
        .from('clients')
        .insert({ ...cleaned, client_number: clientNumber })
        .select()
        .single()

      if (error) throw new Error(error.message ?? JSON.stringify(error))
      return created as Client
    },
    onSuccess: (result) => {
      if ((result as any)?._offline) return
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

export function useUpdateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ClientFormData> }) => {
      if (!navigator.onLine) {
        await enqueue({
          entity: 'clients',
          operation: 'update',
          data: { ...data, updated_at: new Date().toISOString() } as Record<string, unknown>,
          entityId: id,
        })
        await refreshPendingCount()
        return OFFLINE_MARKER
      }

      const DATE_FIELDS = ['contact_date', 'last_contact', 'next_contact'] as const
      const cleaned = { ...data } as Record<string, unknown>
      DATE_FIELDS.forEach(f => { if (cleaned[f] === '') cleaned[f] = null })

      const { data: updated, error } = await supabase
        .from('clients')
        .update({ ...cleaned, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw new Error(error.message ?? JSON.stringify(error))
      if (!updated) throw new Error('Клиент не найден или нет прав на обновление')
      return updated as Client
    },
    onSuccess: (result) => {
      if (isOfflineMarker(result)) return
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

export function useDeleteClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!navigator.onLine) {
        await enqueue({ entity: 'clients', operation: 'delete', data: {}, entityId: id })
        await refreshPendingCount()
        return OFFLINE_MARKER
      }

      const { error } = await supabase.from('clients').delete().eq('id', id)
      if (error) throw new Error(error.message ?? JSON.stringify(error))
    },
    onSuccess: (result) => {
      if (isOfflineMarker(result)) return
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

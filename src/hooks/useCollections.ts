import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { cacheEntities, getCachedEntities, enqueue, OFFLINE_MARKER, isOfflineMarker } from '@/lib/db'
import { refreshPendingCount } from '@/store/useNetworkStore'
import type { Collection, CollectionWithClient, CollectionFormData } from '@/types'

const QUERY_KEY = 'collections'

function generateSlug(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

// Загружает коллекции без PostgREST FK-join (два отдельных запроса)
export function useCollections() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async (): Promise<CollectionWithClient[]> => {
      if (!navigator.onLine) {
        console.log('[Collections] offline → IDB cache')
        return getCachedEntities<CollectionWithClient>(QUERY_KEY)
      }

      const { data: cols, error } = await supabase
        .from('collections')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[useCollections] error:', error)
        if (error.code === '42P01') return []
        const cached = await getCachedEntities<CollectionWithClient>(QUERY_KEY)
        if (cached.length > 0) return cached
        throw new Error(error.message ?? JSON.stringify(error))
      }
      if (!cols || cols.length === 0) return []

      const clientIds = [...new Set(cols.map((c) => c.client_id).filter(Boolean))]
      let clientMap: Record<string, { id: string; client_number: number; name: string; phone: string }> = {}

      if (clientIds.length > 0) {
        const { data: clients } = await supabase
          .from('clients')
          .select('id, client_number, name, phone')
          .in('id', clientIds)
        if (clients) {
          clientMap = Object.fromEntries(clients.map((c) => [c.id, c]))
        }
      }

      const result = cols.map((c) => ({
        ...c,
        client: c.client_id ? (clientMap[c.client_id] ?? null) : null,
      })) as CollectionWithClient[]

      cacheEntities(QUERY_KEY, result)
      return result
    },
  })
}

export function useCollectionBySlug(slug: string) {
  return useQuery({
    queryKey: [QUERY_KEY, 'slug', slug],
    queryFn: async (): Promise<CollectionWithClient | null> => {
      const { data: col, error } = await supabase
        .from('collections')
        .select('*')
        .eq('slug', slug)
        .maybeSingle()

      if (error) throw new Error(error.message)
      if (!col) return null

      let client = null
      if (col.client_id) {
        const { data } = await supabase
          .from('clients')
          .select('id, client_number, name, phone')
          .eq('id', col.client_id)
          .maybeSingle()
        client = data ?? null
      }

      return { ...col, client } as CollectionWithClient
    },
    enabled: !!slug,
  })
}

export function useCreateCollection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (formData: CollectionFormData) => {
      const payload = {
        slug: generateSlug(),
        title: formData.title || 'Подборка',
        client_id: formData.client_id || null,
        comment: formData.comment || null,
        property_ids: formData.property_ids ?? [],
        unit_ids: formData.unit_ids ?? [],
      }

      if (!navigator.onLine) {
        await enqueue({ entity: 'collections', operation: 'create', data: payload as Record<string, unknown> })
        await refreshPendingCount()
        return {
          ...payload,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          _offline: true,
        } as unknown as Collection
      }

      const { data, error } = await supabase
        .from('collections').insert(payload).select().single()
      if (error) {
        console.error('[useCreateCollection] error:', error)
        throw new Error(error.message ?? JSON.stringify(error))
      }
      return data as Collection
    },
    onSuccess: (result) => {
      if ((result as any)?._offline) return
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

export function useUpdateCollection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CollectionFormData> }) => {
      const payload: Record<string, unknown> = {}
      if (data.title !== undefined) payload.title = data.title || 'Подборка'
      if (data.client_id !== undefined) payload.client_id = data.client_id || null
      if (data.comment !== undefined) payload.comment = data.comment || null
      if (data.property_ids !== undefined) payload.property_ids = data.property_ids

      if (!navigator.onLine) {
        await enqueue({ entity: 'collections', operation: 'update', data: payload, entityId: id })
        await refreshPendingCount()
        return OFFLINE_MARKER
      }

      const { data: updated, error } = await supabase
        .from('collections').update(payload).eq('id', id).select().single()
      if (error) throw new Error(error.message)
      return updated as Collection
    },
    onSuccess: (result) => {
      if (isOfflineMarker(result)) return
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
      if ((result as Collection)?.slug) {
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'slug', (result as Collection).slug] })
      }
    },
  })
}

export function useDeleteCollection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      if (!navigator.onLine) {
        await enqueue({ entity: 'collections', operation: 'delete', data: {}, entityId: id })
        await refreshPendingCount()
        return OFFLINE_MARKER
      }
      const { error } = await supabase.from('collections').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: (result) => {
      if (isOfflineMarker(result)) return
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

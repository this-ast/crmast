import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Collection, CollectionWithClient, CollectionFormData } from '@/types'

const QUERY_KEY = 'collections'

function generateSlug(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

// Загружает коллекции без PostgREST FK-join (два отдельных запроса),
// чтобы не зависеть от актуальности schema cache PostgREST.
export function useCollections() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async (): Promise<CollectionWithClient[]> => {
      const { data: cols, error } = await supabase
        .from('collections')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[useCollections] error:', error)
        if (error.code === '42P01') return []
        throw new Error(error.message ?? JSON.stringify(error))
      }
      if (!cols || cols.length === 0) return []

      // Собираем уникальные client_id и подгружаем клиентов одним запросом
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

      return cols.map((c) => ({
        ...c,
        client: c.client_id ? (clientMap[c.client_id] ?? null) : null,
      })) as CollectionWithClient[]
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
    mutationFn: async (formData: CollectionFormData): Promise<Collection> => {
      const payload = {
        slug: generateSlug(),
        title: formData.title || 'Подборка',
        client_id: formData.client_id || null,
        comment: formData.comment || null,
        property_ids: formData.property_ids ?? [],
      }
      const { data, error } = await supabase
        .from('collections')
        .insert(payload)
        .select()
        .single()
      if (error) {
        console.error('[useCreateCollection] error:', error)
        throw new Error(error.message ?? JSON.stringify(error))
      }
      return data as Collection
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
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

      const { data: updated, error } = await supabase
        .from('collections')
        .update(payload)
        .eq('id', id)
        .select()
        .single()
      if (error) throw new Error(error.message)
      return updated as Collection
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
      if (updated?.slug) {
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'slug', updated.slug] })
      }
    },
  })
}

export function useDeleteCollection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('collections').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}

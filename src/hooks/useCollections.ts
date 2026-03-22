import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Collection, CollectionWithClient, CollectionFormData } from '@/types'

const QUERY_KEY = 'collections'

function generateSlug(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

export function useCollections() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async (): Promise<CollectionWithClient[]> => {
      const { data, error } = await supabase
        .from('collections')
        .select(`
          *,
          client:clients(id, client_number, name, phone)
        `)
        .order('created_at', { ascending: false })
      if (error) {
        console.error('[useCollections] error:', error)
        if (error.code === '42P01') return []
        throw new Error(error.message ?? JSON.stringify(error))
      }
      return (data ?? []) as CollectionWithClient[]
    },
  })
}

export function useCollectionBySlug(slug: string) {
  return useQuery({
    queryKey: [QUERY_KEY, 'slug', slug],
    queryFn: async (): Promise<CollectionWithClient | null> => {
      const { data, error } = await supabase
        .from('collections')
        .select(`
          *,
          client:clients(id, client_number, name, phone)
        `)
        .eq('slug', slug)
        .maybeSingle()
      if (error) throw new Error(error.message)
      return data as CollectionWithClient | null
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

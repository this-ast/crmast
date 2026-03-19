import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Property, PropertyWithOwner, PropertyFormData } from '@/types'
import { ARTICLE_PREFIXES } from '@/types'
import { generateArticle } from '@/utils/format'

const QUERY_KEY = 'properties'

export function useProperties() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async (): Promise<PropertyWithOwner[]> => {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          owner:clients(
            id,
            client_number,
            name,
            phone
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message ?? JSON.stringify(error))
      return data ?? []
    },
  })
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: async (): Promise<PropertyWithOwner | null> => {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          owner:clients(
            id,
            client_number,
            name,
            phone
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw new Error(error.message ?? JSON.stringify(error))
      return data
    },
    enabled: !!id,
  })
}

async function getNextArticle(type: Property['type']): Promise<string> {
  const prefix = ARTICLE_PREFIXES[type]
  const { count } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .eq('type', type)

  return generateArticle(prefix, (count ?? 0) + 1)
}

export function useCreateProperty() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: PropertyFormData): Promise<Property> => {
      const article = await getNextArticle(data.type)

      const { data: created, error } = await supabase
        .from('properties')
        .insert({
          ...data,
          article,
          photos: [],
          videos: [],
        })
        .select()
        .single()

      if (error) throw new Error(error.message ?? JSON.stringify(error))
      return created
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

export function useUpdateProperty() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PropertyFormData> }): Promise<Property> => {
      const { data: updated, error } = await supabase
        .from('properties')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw new Error(error.message ?? JSON.stringify(error))
      return updated
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, id] })
    },
  })
}

export function useDeleteProperty() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('properties').delete().eq('id', id)
      if (error) throw new Error(error.message ?? JSON.stringify(error))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

export function usePropertiesByOwner(ownerId: string) {
  return useQuery({
    queryKey: [QUERY_KEY, 'owner', ownerId],
    queryFn: async (): Promise<Property[]> => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message ?? JSON.stringify(error))
      return data ?? []
    },
    enabled: !!ownerId,
  })
}

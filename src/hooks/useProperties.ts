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
      // Strip undefined values so Supabase only updates provided fields
      const payload = Object.fromEntries(
        Object.entries(data).filter(([, v]) => v !== undefined)
      )

      const { data: updated, error } = await supabase
        .from('properties')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

      if (error) throw new Error(error.message ?? JSON.stringify(error))
      if (!updated) throw new Error('Объект не найден или нет прав на обновление')
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

export function useUploadPropertyPhoto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ propertyId, file }: { propertyId: string; file: File }) => {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const path = `${propertyId}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('property-photos')
        .upload(path, file, { upsert: true })
      if (uploadError) throw new Error(uploadError.message)

      const { data: urlData } = supabase.storage.from('property-photos').getPublicUrl(path)
      const url = urlData.publicUrl

      const { data: current } = await supabase
        .from('properties').select('photos').eq('id', propertyId).single()
      const photos = [...(current?.photos ?? []), url]

      const { error } = await supabase
        .from('properties').update({ photos }).eq('id', propertyId)
      if (error) throw new Error(error.message)
      return url
    },
    onSuccess: (_, { propertyId }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, propertyId] })
    },
  })
}

export function useDeletePropertyPhoto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ propertyId, url }: { propertyId: string; url: string }) => {
      // Remove from DB array
      const { data: current } = await supabase
        .from('properties').select('photos').eq('id', propertyId).single()
      const photos = (current?.photos ?? []).filter((p: string) => p !== url)
      const { error } = await supabase
        .from('properties').update({ photos }).eq('id', propertyId)
      if (error) throw new Error(error.message)

      // Best-effort delete from storage
      try {
        const urlObj = new URL(url)
        const pathParts = urlObj.pathname.split('/property-photos/')
        if (pathParts[1]) {
          await supabase.storage.from('property-photos').remove([pathParts[1]])
        }
      } catch { /* ignore storage delete errors */ }
    },
    onSuccess: (_, { propertyId }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, propertyId] })
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

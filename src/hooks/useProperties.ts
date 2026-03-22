import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { cacheEntities, getCachedEntities, enqueue, OFFLINE_MARKER, isOfflineMarker } from '@/lib/db'
import { refreshPendingCount } from '@/store/useNetworkStore'
import type { Property, PropertyWithOwner, PropertyFormData } from '@/types'
import { ARTICLE_PREFIXES } from '@/types'
import { generateArticle } from '@/utils/format'

const QUERY_KEY = 'properties'

export function useProperties() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async (): Promise<PropertyWithOwner[]> => {
      if (!navigator.onLine) {
        console.log('[Properties] offline → IDB cache')
        return getCachedEntities<PropertyWithOwner>(QUERY_KEY)
      }

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

      if (error) {
        console.error('[Properties] fetch error:', error)
        const cached = await getCachedEntities<PropertyWithOwner>(QUERY_KEY)
        if (cached.length > 0) return cached
        throw new Error(error.message ?? JSON.stringify(error))
      }

      const result = data ?? []
      cacheEntities(QUERY_KEY, result)
      return result
    },
  })
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: async (): Promise<PropertyWithOwner | null> => {
      if (!navigator.onLine) {
        const all = await getCachedEntities<PropertyWithOwner>(QUERY_KEY)
        return all.find((p) => p.id === id) ?? null
      }

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
    mutationFn: async (data: PropertyFormData) => {
      if (!navigator.onLine) {
        await enqueue({
          entity: 'properties',
          operation: 'create',
          data: { ...data, photos: [], videos: [] } as Record<string, unknown>,
        })
        await refreshPendingCount()
        return OFFLINE_MARKER
      }

      const article = await getNextArticle(data.type)
      const { data: created, error } = await supabase
        .from('properties')
        .insert({ ...data, article, photos: [], videos: [] })
        .select()
        .single()

      if (error) throw new Error(error.message ?? JSON.stringify(error))
      return created as Property
    },
    onSuccess: (result) => {
      if (isOfflineMarker(result)) return
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

export function useUpdateProperty() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PropertyFormData> }) => {
      const payload = Object.fromEntries(
        Object.entries(data).filter(([, v]) => v !== undefined)
      )

      if (!navigator.onLine) {
        await enqueue({
          entity: 'properties',
          operation: 'update',
          data: payload as Record<string, unknown>,
          entityId: id,
        })
        await refreshPendingCount()
        return OFFLINE_MARKER
      }

      console.log('[useUpdateProperty] payload:', payload)

      const { data: updated, error } = await supabase
        .from('properties')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('[useUpdateProperty] error:', error)
        throw new Error(error.message ?? JSON.stringify(error))
      }
      if (!updated) {
        console.error('[useUpdateProperty] no rows — check RLS/GRANT')
        throw new Error('Объект не найден или нет прав на обновление')
      }
      console.log('[useUpdateProperty] success:', updated.id)
      return updated as Property
    },
    onSuccess: (result, { id }) => {
      if (isOfflineMarker(result)) return
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, id] })
    },
    onError: (error) => {
      console.error('[useUpdateProperty] mutation failed:', error)
    },
  })
}

export function useDeleteProperty() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!navigator.onLine) {
        await enqueue({ entity: 'properties', operation: 'delete', data: {}, entityId: id })
        await refreshPendingCount()
        return OFFLINE_MARKER
      }

      const { error } = await supabase.from('properties').delete().eq('id', id)
      if (error) throw new Error(error.message ?? JSON.stringify(error))
    },
    onSuccess: (result) => {
      if (isOfflineMarker(result)) return
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
      if (!navigator.onLine) {
        const all = await getCachedEntities<PropertyWithOwner>(QUERY_KEY)
        return all.filter((p) => p.owner_id === ownerId)
      }

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

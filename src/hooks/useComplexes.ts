import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Complex, ComplexFormData, ComplexDocument } from '@/types'

const QUERY_KEY = 'complexes'

export function useComplexes() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async (): Promise<Complex[]> => {
      const { data, error } = await supabase
        .from('complexes')
        .select('*')
        .order('name')
      if (error) throw new Error(error.message)
      return (data ?? []).map(normalizeComplex)
    },
  })
}

export function useComplex(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('complexes')
        .select(`
          *,
          properties:properties(
            *,
            owner:clients(id, client_number, name, phone)
          )
        `)
        .eq('id', id)
        .single()
      if (error) throw new Error(error.message)
      return normalizeComplex(data)
    },
    enabled: !!id,
  })
}

export function useCreateComplex() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: ComplexFormData): Promise<Complex> => {
      const { data: created, error } = await supabase
        .from('complexes')
        .insert({
          ...data,
          photos: [],
          documents: [],
          characteristics: data.characteristics ?? {},
        })
        .select()
        .single()
      if (error) throw new Error(error.message)
      return normalizeComplex(created)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}

export function useUpdateComplex() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ComplexFormData> }) => {
      const payload = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined))
      const { data: updated, error } = await supabase
        .from('complexes')
        .update(payload)
        .eq('id', id)
        .select()
        .single()
      if (error) throw new Error(error.message)

      // Sync complex_name on all linked properties
      if (data.name) {
        await supabase.from('properties').update({ complex_name: data.name }).eq('complex_id', id)
      }

      return normalizeComplex(updated)
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, id] })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
    },
  })
}

export function useDeleteComplex() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('complexes').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
    },
  })
}

export function useUploadComplexPhoto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ complexId, file }: { complexId: string; file: File }) => {
      const ext = file.name.split('.').pop()
      const path = `${complexId}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('complex-photos')
        .upload(path, file, { upsert: true })
      if (uploadError) throw new Error(uploadError.message)

      const { data: urlData } = supabase.storage.from('complex-photos').getPublicUrl(path)
      const url = urlData.publicUrl

      // Append to photos array
      const { data: current } = await supabase
        .from('complexes').select('photos').eq('id', complexId).single()
      const photos = [...(current?.photos ?? []), url]

      const { error } = await supabase
        .from('complexes').update({ photos }).eq('id', complexId)
      if (error) throw new Error(error.message)
      return url
    },
    onSuccess: (_, { complexId }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, complexId] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

export function useDeleteComplexPhoto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ complexId, url }: { complexId: string; url: string }) => {
      const { data: current } = await supabase
        .from('complexes').select('photos').eq('id', complexId).single()
      const photos = (current?.photos ?? []).filter((p: string) => p !== url)
      const { error } = await supabase
        .from('complexes').update({ photos }).eq('id', complexId)
      if (error) throw new Error(error.message)
    },
    onSuccess: (_, { complexId }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, complexId] })
    },
  })
}

export function useUploadComplexDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      complexId,
      file,
      docName,
      docType,
    }: {
      complexId: string
      file: File
      docName: string
      docType: ComplexDocument['type']
    }) => {
      const ext = file.name.split('.').pop()
      const path = `${complexId}/${Date.now()}-${docName}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('complex-docs')
        .upload(path, file, { upsert: true })
      if (uploadError) throw new Error(uploadError.message)

      const { data: urlData } = supabase.storage.from('complex-docs').getPublicUrl(path)
      const url = urlData.publicUrl

      const { data: current } = await supabase
        .from('complexes').select('documents').eq('id', complexId).single()
      const documents: ComplexDocument[] = [
        ...((current?.documents as ComplexDocument[]) ?? []),
        { name: docName, url, type: docType },
      ]

      const { error } = await supabase
        .from('complexes').update({ documents }).eq('id', complexId)
      if (error) throw new Error(error.message)
      return { name: docName, url, type: docType }
    },
    onSuccess: (_, { complexId }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, complexId] })
    },
  })
}

export function useDeleteComplexDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ complexId, url }: { complexId: string; url: string }) => {
      const { data: current } = await supabase
        .from('complexes').select('documents').eq('id', complexId).single()
      const documents = ((current?.documents as ComplexDocument[]) ?? []).filter(
        (d) => d.url !== url
      )
      const { error } = await supabase
        .from('complexes').update({ documents }).eq('id', complexId)
      if (error) throw new Error(error.message)
    },
    onSuccess: (_, { complexId }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, complexId] })
    },
  })
}

// Normalize raw Supabase row to Complex type
function normalizeComplex(row: Record<string, unknown>): Complex {
  return {
    ...(row as unknown as Complex),
    characteristics: (row.characteristics as Record<string, string>) ?? {},
    developer_phones: (row.developer_phones as string[]) ?? [],
    manager_names: (row.manager_names as string[]) ?? [],
    manager_phones: (row.manager_phones as string[]) ?? [],
    photos: (row.photos as string[]) ?? [],
    documents: (row.documents as ComplexDocument[]) ?? [],
  }
}

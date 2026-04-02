import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Complex, ComplexFormData, ComplexDocument, ComplexUnit, ComplexUnitFormData, ComplexPricing, PricingCondition } from '@/types'

const QUERY_KEY = 'complexes'

export function useComplexes() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async (): Promise<Complex[]> => {
      const { data, error } = await supabase
        .from('complexes')
        .select('*')
        .order('name')
      if (error) {
        // 42P01 = таблица не существует — вернуть пустой список
        if (error.code === '42P01') return []
        throw new Error(error.message ?? JSON.stringify(error))
      }
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
    mutationFn: async (data: ComplexFormData): Promise<void> => {
      const payload = {
        name: data.name ?? 'Без названия',
        developer: data.developer ?? undefined,
        completion_date: data.completion_date ?? undefined,
        description: data.description ?? undefined,
        purchase_conditions: data.purchase_conditions ?? undefined,
        characteristics: data.characteristics ?? {},
        developer_phones: data.developer_phones ?? [],
        manager_names: data.manager_names ?? [],
        manager_phones: data.manager_phones ?? [],
        photos: [],
        documents: [],
        district: data.district ?? undefined,
        address: data.address ?? undefined,
        pricing: data.pricing ?? undefined,
      }
      console.log('[useCreateComplex] payload →', payload)
      const { error } = await supabase.from('complexes').insert(payload)
      if (error) {
        console.error('[useCreateComplex] Supabase error →', error)
        throw new Error(error.message ?? JSON.stringify(error))
      }
      console.log('[useCreateComplex] успешно создан')
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

export function useUploadComplexLayout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ complexId, file }: { complexId: string; file: File }) => {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${complexId}/layout-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('complex-photos')
        .upload(path, file, { upsert: true })
      if (uploadError) throw new Error(uploadError.message)

      const { data: urlData } = supabase.storage.from('complex-photos').getPublicUrl(path)
      const url = urlData.publicUrl

      const { data: current } = await supabase
        .from('complexes').select('layouts').eq('id', complexId).single()
      const layouts = [...((current?.layouts as string[]) ?? []), url]

      const { error } = await supabase
        .from('complexes').update({ layouts }).eq('id', complexId)
      if (error) throw new Error(error.message)
      return url
    },
    onSuccess: (_, { complexId }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, complexId] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

export function useDeleteComplexLayout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ complexId, url }: { complexId: string; url: string }) => {
      const { data: current } = await supabase
        .from('complexes').select('layouts').eq('id', complexId).single()
      const layouts = ((current?.layouts as string[]) ?? []).filter((l: string) => l !== url)
      const { error } = await supabase
        .from('complexes').update({ layouts }).eq('id', complexId)
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
      const ext = file.name.split('.').pop() ?? 'pdf'
      const safeName = docName.replace(/[^\w\-_.]/g, '_').slice(0, 60)
      const path = `${complexId}/${Date.now()}-${safeName}.${ext}`

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

export function useComplexUnits(complexId: string) {
  return useQuery({
    queryKey: ['complex_units', complexId],
    enabled: !!complexId,
    queryFn: async (): Promise<ComplexUnit[]> => {
      const { data, error } = await supabase
        .from('complex_units')
        .select('*')
        .eq('complex_id', complexId)
        .order('created_at', { ascending: false })
      if (error) {
        if (error.code === '42P01') return []
        throw new Error(error.message)
      }
      return (data ?? []).map((u) => ({ ...u, photos: u.photos ?? [] })) as ComplexUnit[]
    },
  })
}

export function useComplexUnitCounts(): Record<string, number> {
  const { data: allUnits = [] } = useAllComplexUnits()
  return allUnits.reduce((acc, u) => {
    acc[u.complex_id] = (acc[u.complex_id] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)
}

export function useAllComplexUnits() {
  return useQuery({
    queryKey: ['complex_units_all'],
    queryFn: async (): Promise<(ComplexUnit & { complex_name?: string })[]> => {
      const { data, error } = await supabase
        .from('complex_units')
        .select('*, complexes(name)')
        .order('complex_id')
      if (error) {
        if (error.code === '42P01') return []
        throw new Error(error.message)
      }
      return (data ?? []).map((u: any) => ({
        ...u,
        photos: u.photos ?? [],
        complex_name: u.complexes?.name,
      }))
    },
  })
}

export function useCreateComplexUnit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ complexId, data }: { complexId: string; data: ComplexUnitFormData }) => {
      const payload = Object.fromEntries(Object.entries({ ...data, complex_id: complexId }).filter(([, v]) => v !== undefined && v !== '' && !(typeof v === 'number' && isNaN(v))))
      const { data: created, error } = await supabase.from('complex_units').insert(payload).select('*').single()
      if (error) throw new Error(error.message)
      return created as ComplexUnit
    },
    onSuccess: (_, { complexId }) => {
      queryClient.invalidateQueries({ queryKey: ['complex_units', complexId] })
    },
  })
}

export function useUpdateComplexUnit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, complexId, data }: { id: string; complexId: string; data: Partial<ComplexUnitFormData> }) => {
      const payload = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined))
      const { data: updated, error } = await supabase.from('complex_units').update(payload).eq('id', id).select('*').single()
      if (error) throw new Error(error.message)
      return updated as ComplexUnit
    },
    onSuccess: (_, { complexId }) => {
      queryClient.invalidateQueries({ queryKey: ['complex_units', complexId] })
    },
  })
}

export function useDeleteComplexUnit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, complexId }: { id: string; complexId: string }) => {
      const { error } = await supabase.from('complex_units').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: (_, { complexId }) => {
      queryClient.invalidateQueries({ queryKey: ['complex_units', complexId] })
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
    layouts: (row.layouts as string[]) ?? [],
    documents: (row.documents as ComplexDocument[]) ?? [],
    pricing: (row.pricing as ComplexPricing) ?? {},
    pricing_conditions: (row.pricing_conditions as PricingCondition[]) ?? [],
    district: row.district as string | undefined,
    address: row.address as string | undefined,
  }
}

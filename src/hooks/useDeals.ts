import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Deal, DealFormData } from '@/types'

const QUERY_KEY = 'deals'

const WITH_RELATIONS = `
  *,
  buyer:clients!buyer_id(id, client_number, name, phone),
  seller:clients!seller_id(id, client_number, name, phone),
  property:properties!property_id(id, article, type, address, price)
`

export function useDeals() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async (): Promise<Deal[]> => {
      const { data, error } = await supabase
        .from('deals')
        .select(WITH_RELATIONS)
        .order('deal_number', { ascending: false })
      if (error) throw new Error(error.message ?? JSON.stringify(error))
      return (data ?? []) as Deal[]
    },
  })
}

export function useDealsByProperty(propertyId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, 'property', propertyId],
    enabled: !!propertyId,
    queryFn: async (): Promise<Deal[]> => {
      const { data, error } = await supabase
        .from('deals')
        .select(WITH_RELATIONS)
        .eq('property_id', propertyId!)
        .order('deal_number', { ascending: false })
      if (error) throw new Error(error.message ?? JSON.stringify(error))
      return (data ?? []) as Deal[]
    },
  })
}

export function useDealsByClient(clientId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, 'client', clientId],
    enabled: !!clientId,
    queryFn: async (): Promise<Deal[]> => {
      const { data, error } = await supabase
        .from('deals')
        .select(WITH_RELATIONS)
        .or(`buyer_id.eq.${clientId},seller_id.eq.${clientId}`)
        .order('deal_number', { ascending: false })
      if (error) throw new Error(error.message ?? JSON.stringify(error))
      return (data ?? []) as Deal[]
    },
  })
}

function cleanData(data: DealFormData) {
  return Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined && v !== '')
  )
}

export function useCreateDeal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: DealFormData): Promise<Deal> => {
      const { data: created, error } = await supabase
        .from('deals')
        .insert(cleanData(data))
        .select(WITH_RELATIONS)
        .single()
      if (error) throw new Error(error.message ?? JSON.stringify(error))
      return created as Deal
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}

export function useUpdateDeal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DealFormData> }): Promise<Deal> => {
      const { data: updated, error } = await supabase
        .from('deals')
        .update(cleanData(data as DealFormData))
        .eq('id', id)
        .select(WITH_RELATIONS)
        .single()
      if (error) throw new Error(error.message ?? JSON.stringify(error))
      return updated as Deal
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}

export function useDeleteDeal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('deals').delete().eq('id', id)
      if (error) throw new Error(error.message ?? JSON.stringify(error))
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}

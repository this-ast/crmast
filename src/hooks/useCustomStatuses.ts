import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface CustomStatus {
  id: string
  name: string
  color: string
  type: 'hot' | 'warm' | 'thinking' | 'cold' | 'deal' | 'archive'
  hint?: string
  sort_order: number
  created_at: string
}

export type CustomStatusFormData = Omit<CustomStatus, 'id' | 'created_at'>

const Q = 'custom_statuses'

export function useCustomStatuses() {
  return useQuery({
    queryKey: [Q],
    queryFn: async (): Promise<CustomStatus[]> => {
      const { data, error } = await supabase
        .from('custom_statuses')
        .select('*')
        .order('sort_order')
      if (error) {
        if (error.code === '42P01') return []
        throw new Error(error.message)
      }
      return (data ?? []) as CustomStatus[]
    },
  })
}

export function useCreateCustomStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CustomStatusFormData) => {
      const { error } = await supabase.from('custom_statuses').insert(data)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [Q] }),
  })
}

export function useUpdateCustomStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CustomStatusFormData> }) => {
      const { error } = await supabase.from('custom_statuses').update(data).eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [Q] }),
  })
}

export function useDeleteCustomStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('custom_statuses').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [Q] }),
  })
}

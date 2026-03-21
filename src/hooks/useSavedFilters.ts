import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface SavedFilter {
  id: string
  name: string
  entity_type: 'client' | 'property'
  filter_data: Record<string, string>
  sort_order: number
  created_at: string
}

const Q = 'saved_filters'

export function useSavedFilters(entityType: 'client' | 'property') {
  return useQuery({
    queryKey: [Q, entityType],
    queryFn: async (): Promise<SavedFilter[]> => {
      const { data, error } = await supabase
        .from('saved_filters')
        .select('*')
        .eq('entity_type', entityType)
        .order('sort_order')
      if (error) {
        if (error.code === '42P01') return []
        throw new Error(error.message)
      }
      return (data ?? []) as SavedFilter[]
    },
  })
}

export function useCreateSavedFilter() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Omit<SavedFilter, 'id' | 'created_at'>) => {
      const { error } = await supabase.from('saved_filters').insert(data)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [Q] }),
  })
}

export function useDeleteSavedFilter() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('saved_filters').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [Q] }),
  })
}

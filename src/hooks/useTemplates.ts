import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { MessageTemplate, TemplateFormData } from '@/types'

const QUERY_KEY = 'message_templates'

export function useTemplates() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async (): Promise<MessageTemplate[]> => {
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })
      if (error) {
        if (error.code === '42P01') return []
        throw new Error(error.message ?? JSON.stringify(error))
      }
      return data ?? []
    },
  })
}

export function useCreateTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: TemplateFormData): Promise<MessageTemplate> => {
      const { data: created, error } = await supabase
        .from('message_templates')
        .insert(data)
        .select('*')
        .single()
      if (error) throw new Error(error.message ?? JSON.stringify(error))
      return created
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TemplateFormData> }): Promise<MessageTemplate> => {
      const { data: updated, error } = await supabase
        .from('message_templates')
        .update(data)
        .eq('id', id)
        .select('*')
        .single()
      if (error) throw new Error(error.message ?? JSON.stringify(error))
      return updated
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('message_templates').delete().eq('id', id)
      if (error) throw new Error(error.message ?? JSON.stringify(error))
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}

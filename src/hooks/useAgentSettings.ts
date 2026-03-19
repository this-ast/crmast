import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { AgentSettings } from '@/types'

const QUERY_KEY = 'agent_settings'

export function useAgentSettings() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async (): Promise<AgentSettings | null> => {
      const { data, error } = await supabase
        .from('agent_settings')
        .select('*')
        .limit(1)
        .maybeSingle()
      if (error) throw new Error(error.message)
      return data
    },
  })
}

export function useUpsertAgentSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (settings: AgentSettings): Promise<AgentSettings> => {
      const { id, ...rest } = settings
      if (id) {
        // Update existing row
        const { data, error } = await supabase
          .from('agent_settings')
          .update(rest)
          .eq('id', id)
          .select()
          .single()
        if (error) throw new Error(error.message)
        return data
      } else {
        // Insert first row
        const { data, error } = await supabase
          .from('agent_settings')
          .insert(rest)
          .select()
          .single()
        if (error) throw new Error(error.message)
        return data
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}

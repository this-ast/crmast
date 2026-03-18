import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Client } from '@/types'

export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async (): Promise<Client[]> => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('client_number', { ascending: true })

      if (error) throw error
      return data ?? []
    },
  })
}

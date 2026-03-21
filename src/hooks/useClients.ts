import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Client, ClientFormData } from '@/types'

const QUERY_KEY = 'clients'

export function useClients() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async (): Promise<Client[]> => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('client_number', { ascending: true })

      if (error) throw new Error(error.message ?? JSON.stringify(error))
      return data ?? []
    },
  })
}

export function useCreateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ClientFormData & { client_number?: number }): Promise<Client> => {
      // If client_number not supplied, auto-generate from max
      let clientNumber = data.client_number
      if (!clientNumber) {
        const { data: maxRow } = await supabase
          .from('clients')
          .select('client_number')
          .order('client_number', { ascending: false })
          .limit(1)
          .single()
        clientNumber = (maxRow?.client_number ?? 0) + 1
      }

      const { data: created, error } = await supabase
        .from('clients')
        .insert({ ...data, client_number: clientNumber })
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

export function useUpdateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ClientFormData> }): Promise<Client> => {
      const { data: updated, error } = await supabase
        .from('clients')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw new Error(error.message ?? JSON.stringify(error))
      return updated
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

export function useDeleteClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clients').delete().eq('id', id)
      if (error) throw new Error(error.message ?? JSON.stringify(error))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

export interface Client {
  id: string
  client_number: number // Sequential: 1, 2, 3...
  name: string
  phone: string
  email?: string
  notes?: string
  created_at: string
  updated_at: string
}

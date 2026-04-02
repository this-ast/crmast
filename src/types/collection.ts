export interface Collection {
  id: string
  slug: string
  client_id: string | null
  title: string
  comment?: string
  property_ids: string[]
  unit_ids?: string[]
  created_at: string
  updated_at: string
}

export interface CollectionWithClient extends Collection {
  client?: {
    id: string
    client_number: number
    name: string
    phone: string
  }
}

export interface CollectionFormData {
  title: string
  client_id?: string
  comment?: string
  property_ids: string[]
  unit_ids?: string[]
}

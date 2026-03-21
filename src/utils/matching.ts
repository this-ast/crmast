import type { Client, Property } from '@/types'

// Parse budget text to a numeric value in rubles
// Handles: "5 млн", "до 10 млн", "5 500 000", "5.5млн", "550 тыс"
export function parseBudget(budget?: string): number | null {
  if (!budget) return null
  const s = budget.replace(/\s/g, '').toLowerCase()

  const mlnMatch = s.match(/(\d+(?:[.,]\d+)?)\s*млн/)
  if (mlnMatch) return parseFloat(mlnMatch[1].replace(',', '.')) * 1_000_000

  const tysMatch = s.match(/(\d+(?:[.,]\d+)?)\s*тыс/)
  if (tysMatch) return parseFloat(tysMatch[1].replace(',', '.')) * 1_000

  const numMatch = s.match(/(\d{5,})/)
  if (numMatch) return parseInt(numMatch[1])

  return null
}

export interface MatchScore {
  score: number
  reasons: string[]
}

// Score a property against a client's preferences (higher = better match)
export function scorePropertyForClient(property: Property, client: Client): MatchScore {
  let score = 0
  const reasons: string[] = []

  // --- Budget ---
  const budget = parseBudget(client.budget)
  if (budget && budget > 0) {
    if (property.price <= budget) {
      score += 4
      reasons.push('Цена в бюджете')
    } else if (property.price <= budget * 1.1) {
      score += 1
      reasons.push('Цена чуть выше бюджета')
    }
  }

  // --- Client type → deal type ---
  if (client.client_type === 'Покупатель' || client.client_type === 'Подрядчик-перекуп') {
    if (property.deal_type === 'sale') { score += 2; reasons.push('Тип сделки: продажа') }
  } else if (client.client_type === 'Арендатор') {
    if (property.deal_type === 'rent') { score += 2; reasons.push('Тип сделки: аренда') }
  }

  // --- Parse request for room count ---
  const req = (client.request ?? '').toLowerCase()

  if (property.rooms !== undefined) {
    const roomKeywords: [string[], number][] = [
      [['студи', '0к'], 0],
      [['1к', '1-к', 'однокомн', '1 комн'], 1],
      [['2к', '2-к', 'двухкомн', 'двухком', '2 комн'], 2],
      [['3к', '3-к', 'трёхкомн', 'трехком', '3 комн'], 3],
      [['4к', '4-к', '4 комн', 'четырёхкомн'], 4],
    ]
    for (const [keywords, rooms] of roomKeywords) {
      if (keywords.some((kw) => req.includes(kw)) && property.rooms === rooms) {
        score += 3
        reasons.push(`Комнат: ${rooms === 0 ? 'студия' : rooms}`)
        break
      }
    }
  }

  // --- Property type from request ---
  if (req.includes('квартир') && property.type === 'apartment') { score += 1; reasons.push('Тип: квартира') }
  if ((req.includes(' дом') || req.includes('коттедж')) && property.type === 'house') { score += 1; reasons.push('Тип: дом') }
  if (req.includes('участ') && property.type === 'land') { score += 1; reasons.push('Тип: участок') }
  if ((req.includes('коммерц') || req.includes('офис') || req.includes('магазин')) && property.type === 'commercial') { score += 1; reasons.push('Тип: коммерция') }

  return { score, reasons }
}

// Score a client against a property (for "matching clients for property" direction)
export function scoreClientForProperty(client: Client, property: Property): MatchScore {
  return scorePropertyForClient(property, client)
}

// Return properties sorted by match score for a client (score > 0 only)
export function getMatchingProperties(
  client: Client,
  properties: Property[],
  minScore = 1,
): Array<Property & { matchScore: number; matchReasons: string[] }> {
  return properties
    .map((p) => {
      const { score, reasons } = scorePropertyForClient(p, client)
      return { ...p, matchScore: score, matchReasons: reasons }
    })
    .filter((p) => p.matchScore >= minScore)
    .sort((a, b) => b.matchScore - a.matchScore)
}

// Return clients sorted by match score for a property (score > 0 only)
export function getMatchingClients(
  property: Property,
  clients: Client[],
  minScore = 1,
): Array<Client & { matchScore: number; matchReasons: string[] }> {
  return clients
    .map((c) => {
      const { score, reasons } = scorePropertyForClient(property, c)
      return { ...c, matchScore: score, matchReasons: reasons }
    })
    .filter((c) => c.matchScore >= minScore)
    .sort((a, b) => b.matchScore - a.matchScore)
}

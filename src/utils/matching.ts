import type { Client, Property } from '@/types'
import type { Demand } from '@/types/demand'

// ─── Budget parsing ────────────────────────────────────────────────────────────

export function parseBudget(budget?: string): { min: number | null; max: number | null } {
  if (!budget) return { min: null, max: null }
  const s = budget.replace(/\s/g, '').toLowerCase()

  function parseNum(str: string): number | null {
    const mln = str.match(/(\d+(?:[.,]\d+)?)\s*млн/)
    if (mln) return parseFloat(mln[1].replace(',', '.')) * 1_000_000
    const tys = str.match(/(\d+(?:[.,]\d+)?)\s*тыс/)
    if (tys) return parseFloat(tys[1].replace(',', '.')) * 1_000
    const num = str.match(/(\d{5,})/)
    if (num) return parseInt(num[1])
    return null
  }

  // "от X до Y" or "X-Y"
  const range = s.match(/(?:от\s*)?(\d+(?:[.,]\d+)?(?:млн|тыс)?)\s*[-–до]+\s*(\d+(?:[.,]\d+)?(?:млн|тыс)?)/)
  if (range) {
    return { min: parseNum(range[1]), max: parseNum(range[2]) }
  }
  // "до X" or "не более X"
  const toMatch = s.match(/(?:до|не\s*более)\s*(\d.*)/)
  if (toMatch) return { min: null, max: parseNum(toMatch[1]) }
  // "от X"
  const fromMatch = s.match(/от\s*(\d.*)/)
  if (fromMatch) return { min: parseNum(fromMatch[1]), max: null }
  // single value
  const single = parseNum(s)
  return { min: null, max: single }
}

// ─── Criteria parsers ──────────────────────────────────────────────────────────

function parseRooms(text: string): number[] {
  const rooms: number[] = []
  const keywords: [string[], number][] = [
    [['студи', '0к', 'студию'], 0],
    [['1к', '1-к', 'однокомн', '1 комн', 'одну комн', 'одной комн'], 1],
    [['2к', '2-к', 'двухкомн', 'двухком', '2 комн', 'две комн', 'двух комн'], 2],
    [['3к', '3-к', 'трёхкомн', 'трехком', '3 комн', 'три комн', 'трёх комн'], 3],
    [['4к', '4-к', '4 комн', 'четырёхкомн', 'четыре комн'], 4],
    [['5к', '5-к', '5 комн'], 5],
  ]
  for (const [kws, n] of keywords) {
    if (kws.some(kw => text.includes(kw))) rooms.push(n)
  }
  return rooms
}

function parseDistricts(text: string): string[] {
  // Extract mentioned districts / areas from free text
  const districts: string[] = []
  // "в <word> районе" or "район <word>" or just district names
  const patterns = [
    /(?:в|ж?к|р-н|район)\s+([а-яёА-ЯЁ][а-яёА-ЯЁ\-]{3,})/gi,
    /([а-яёА-ЯЁ][а-яёА-ЯЁ\-]{3,})\s*(?:район|р-н)/gi,
  ]
  for (const re of patterns) {
    let m: RegExpExecArray | null
    re.lastIndex = 0
    while ((m = re.exec(text)) !== null) {
      const d = m[1].toLowerCase().trim()
      if (d.length > 3 && !districts.includes(d)) districts.push(d)
    }
  }
  return districts
}

function parseMarketType(text: string): 'secondary' | 'new_build' | null {
  const t = text.toLowerCase()
  if (t.match(/вторичк|вторич|готов|б\/у|бу\b|не\s+новостр/)) return 'secondary'
  if (t.match(/новостр|новое|жк\b|застройщик|первичк/)) return 'new_build'
  return null
}

function parsePaymentPrefs(text: string): string[] {
  const t = text.toLowerCase()
  const prefs: string[] = []
  if (t.match(/ипотек|ипот\b/)) prefs.push('mortgage')
  if (t.match(/рассрочк|рассрочку/)) prefs.push('installment')
  if (t.match(/наличн|наличк|нал\b/)) prefs.push('cash')
  if (t.match(/маткапитал|материнск|мат\.?\s*кап/)) prefs.push('maternal_cap')
  if (t.match(/военн|военная\s+ипотек/)) prefs.push('military_mort')
  if (t.match(/трейд[\s-]?ин|trade[\s-]?in/)) prefs.push('trade_in')
  return prefs
}

function parseFloorPref(text: string): { notFirst?: boolean; notLast?: boolean; min?: number; max?: number } {
  const t = text.toLowerCase()
  const pref: { notFirst?: boolean; notLast?: boolean; min?: number; max?: number } = {}
  if (t.match(/не\s*(?:на\s*)?перв|не\s*1\s*эт/)) pref.notFirst = true
  if (t.match(/не\s*(?:на\s*)?последн|не\s*верхн|не\s*крайн/)) pref.notLast = true
  const range = t.match(/(\d+)\s*[-–]\s*(\d+)\s*эт/)
  if (range) { pref.min = +range[1]; pref.max = +range[2] }
  const fromFloor = t.match(/(?:от|с)\s*(\d+)\s*эт/)
  if (fromFloor) pref.min = +fromFloor[1]
  return pref
}

function parseAreaPref(text: string): { min?: number; max?: number } {
  const t = text.toLowerCase()
  const range = t.match(/(\d+)\s*[-–]\s*(\d+)\s*(?:м²|кв\.?\s*м|m²)/)
  if (range) return { min: +range[1], max: +range[2] }
  const from = t.match(/(?:от|>)\s*(\d+)\s*(?:м²|кв\.?\s*м|m²)/)
  if (from) return { min: +from[1] }
  const to = t.match(/(?:до|<)\s*(\d+)\s*(?:м²|кв\.?\s*м|m²)/)
  if (to) return { max: +to[1] }
  return {}
}

// ─── Core scoring ──────────────────────────────────────────────────────────────

export interface MatchScore {
  score: number
  reasons: string[]
  mismatches: string[]
}

// Max score breakdown:
// Budget          : 4
// Deal type       : 2
// Rooms           : 3
// Property type   : 1
// District        : 3
// Market type     : 2
// Payment method  : 2
// Floor pref      : 2
// Area pref       : 1
// Urgency bonus   : 1  (Горячий/Тёплый client)
// ─────────────────
// TOTAL           : 21

export const MAX_MATCH_SCORE = 21

export function scorePropertyForClient(property: Property, client: Client): MatchScore {
  let score = 0
  const reasons: string[] = []
  const mismatches: string[] = []

  const req    = ((client.request ?? '') + ' ' + (client.notes ?? '')).toLowerCase()
  const budget = parseBudget(client.budget)

  // ── 1. Budget (0-4) ──────────────────────────────────────────────────────────
  const budgetMax = budget.max ?? budget.min
  if (budgetMax && budgetMax > 0) {
    if (property.price <= budgetMax) {
      score += 4; reasons.push('В бюджете')
    } else if (property.price <= budgetMax * 1.08) {
      score += 2; reasons.push('Чуть выше бюджета (+8%)')
    } else if (property.price <= budgetMax * 1.15) {
      score += 1; reasons.push('Выше бюджета (+15%)')
    } else {
      mismatches.push(`Дорого: ${Math.round((property.price / budgetMax - 1) * 100)}% выше бюджета`)
    }
  }

  // ── 2. Deal type (0-2) ───────────────────────────────────────────────────────
  if (client.client_type === 'Покупатель' || client.client_type === 'Подрядчик-перекуп') {
    if (property.deal_type === 'sale') { score += 2; reasons.push('Покупка') }
    else mismatches.push('Хочет купить, объект в аренду')
  } else if (client.client_type === 'Арендатор') {
    if (property.deal_type === 'rent') { score += 2; reasons.push('Аренда') }
    else mismatches.push('Хочет арендовать, объект на продажу')
  }

  // ── 3. Rooms (0-3) ───────────────────────────────────────────────────────────
  if (property.rooms !== undefined) {
    const wantedRooms = parseRooms(req)
    if (wantedRooms.length > 0) {
      if (wantedRooms.includes(property.rooms)) {
        score += 3
        reasons.push(`${property.rooms === 0 ? 'Студия' : property.rooms + '-комн.'}`)
      } else {
        mismatches.push(`Хочет ${wantedRooms.map(r => r === 0 ? 'студию' : r + '-комн.').join('/')}`)
      }
    }
  }

  // ── 4. Property type (0-1) ───────────────────────────────────────────────────
  if (req.includes('квартир') && property.type === 'apartment') { score += 1; reasons.push('Квартира') }
  else if ((req.includes(' дом') || req.includes('коттедж')) && property.type === 'house') { score += 1; reasons.push('Дом') }
  else if (req.includes('участ') && property.type === 'land') { score += 1; reasons.push('Участок') }
  else if ((req.includes('коммерц') || req.includes('офис') || req.includes('магазин')) && property.type === 'commercial') { score += 1; reasons.push('Коммерция') }

  // ── 5. District (0-3) ────────────────────────────────────────────────────────
  const wantedDistricts = parseDistricts(req)
  if (wantedDistricts.length > 0 && property.district) {
    const propDistrict = property.district.toLowerCase()
    const matched = wantedDistricts.some(d =>
      propDistrict.includes(d) || d.includes(propDistrict) ||
      // Fuzzy: first 4 chars match
      (d.length >= 4 && propDistrict.includes(d.slice(0, 4)))
    )
    if (matched) {
      score += 3; reasons.push(`Район: ${property.district}`)
    } else {
      mismatches.push(`Район не совпадает (хочет: ${wantedDistricts.slice(0, 2).join(', ')})`)
    }
  } else if (wantedDistricts.length > 0 && !property.district) {
    // district not filled on property — no penalty, no bonus
  }

  // ── 6. Market type (0-2) ─────────────────────────────────────────────────────
  const wantedMarket = parseMarketType(req)
  if (wantedMarket && property.market_type) {
    if (wantedMarket === property.market_type) {
      score += 2
      reasons.push(wantedMarket === 'new_build' ? 'Новостройка' : 'Вторичка')
    } else {
      mismatches.push(wantedMarket === 'new_build' ? 'Хочет новостройку' : 'Хочет вторичку')
    }
  }

  // ── 7. Payment method (0-2) ──────────────────────────────────────────────────
  const payPrefs = parsePaymentPrefs(req)
  if (payPrefs.length > 0) {
    const payMatch =
      (payPrefs.includes('mortgage')     && property.has_mortgage)     ||
      (payPrefs.includes('installment')  && property.has_installment)  ||
      (payPrefs.includes('maternal_cap') && property.has_maternal_cap) ||
      (payPrefs.includes('military_mort')&& property.has_military_mort)||
      (payPrefs.includes('trade_in')     && property.has_trade_in)     ||
      (payPrefs.includes('cash'))  // cash works for any property

    if (payMatch) {
      const labels: Record<string, string> = {
        mortgage: 'Ипотека', installment: 'Рассрочка', cash: 'Наличные',
        maternal_cap: 'Маткапитал', military_mort: 'Воен. ипотека', trade_in: 'Трейд-ин',
      }
      const matchedLabels = payPrefs.filter(p => p === 'cash' || (p === 'mortgage' && property.has_mortgage) || (p === 'installment' && property.has_installment) || (p === 'maternal_cap' && property.has_maternal_cap) || (p === 'military_mort' && property.has_military_mort) || (p === 'trade_in' && property.has_trade_in)).map(p => labels[p]).filter(Boolean)
      score += 2
      reasons.push(matchedLabels.join(', '))
    } else {
      mismatches.push('Способ оплаты не поддерживается')
    }
  }

  // ── 8. Floor preference (0-2) ────────────────────────────────────────────────
  const floorPref = parseFloorPref(req)
  const hasFloorPref = floorPref.notFirst || floorPref.notLast || floorPref.min !== undefined || floorPref.max !== undefined
  if (hasFloorPref && property.floor !== undefined) {
    let floorOk = true
    const issues: string[] = []
    if (floorPref.notFirst && property.floor === 1) { floorOk = false; issues.push('1-й этаж') }
    if (floorPref.notLast && property.total_floors && property.floor === property.total_floors) { floorOk = false; issues.push('последний этаж') }
    if (floorPref.min !== undefined && property.floor < floorPref.min) { floorOk = false; issues.push(`ниже ${floorPref.min} эт.`) }
    if (floorPref.max !== undefined && property.floor > floorPref.max) { floorOk = false; issues.push(`выше ${floorPref.max} эт.`) }
    if (floorOk) {
      score += 2; reasons.push(`Этаж ${property.floor} подходит`)
    } else {
      mismatches.push(issues.join(', '))
    }
  }

  // ── 9. Area preference (0-1) ─────────────────────────────────────────────────
  const areaPref = parseAreaPref(req)
  if ((areaPref.min !== undefined || areaPref.max !== undefined) && property.area) {
    const areaOk =
      (areaPref.min === undefined || property.area >= areaPref.min) &&
      (areaPref.max === undefined || property.area <= areaPref.max)
    if (areaOk) {
      score += 1; reasons.push(`Площадь ${property.area} м²`)
    } else {
      mismatches.push(`Площадь не в диапазоне`)
    }
  }

  // ── 10. Client urgency bonus (+1) ────────────────────────────────────────────
  if (client.status === 'Горячий' || client.status === 'Тёплый' || client.status === 'Теплый') {
    score += 1
    reasons.push(client.status === 'Горячий' ? '🔥 Горячий' : '⚡ Тёплый')
  }

  return { score, reasons, mismatches }
}

export function scoreClientForProperty(client: Client, property: Property): MatchScore {
  return scorePropertyForClient(property, client)
}

// ─── Demand-based strict scoring ───────────────────────────────────────────────
//
// Max score breakdown (demand-based):
// Budget          : 4
// Rooms (apt)     : 3
// District        : 3
// Market type     : 2
// Payment         : 2
// Floor           : 2
// Complex         : 3
// Area            : 1
// Renovation      : 1
// Urgency bonus   : 1
// ─────────────────
// TOTAL           : 22

export const MAX_DEMAND_MATCH_SCORE = 22

// Maps demand property_type tokens → property type
const APT_TOKENS = new Set(['studio', '1br', '2br', '3br', '4br+'])
const HOUSE_TOKENS = new Set(['house', 'cottage', 'dacha'])
const LAND_TOKENS = new Set(['land'])
const COM_TOKENS = new Set(['commercial'])

// Maps apartment token → room count
const TOKEN_TO_ROOMS: Record<string, number> = {
  studio: 0,
  '1br':  1,
  '2br':  2,
  '3br':  3,
  '4br+': 4,
}

export function scorePropertyForDemand(property: Property, demand: Demand): MatchScore {
  let score = 0
  const reasons: string[] = []
  const mismatches: string[] = []
  const pt = demand.property_types ?? []

  // ── Hard excludes ────────────────────────────────────────────────────────────

  // 1. Property type hard exclude
  if (pt.length > 0) {
    const wantsApt   = pt.some((t) => APT_TOKENS.has(t))
    const wantsHouse = pt.some((t) => HOUSE_TOKENS.has(t))
    const wantsLand  = pt.some((t) => LAND_TOKENS.has(t))
    const wantsCom   = pt.some((t) => COM_TOKENS.has(t))

    const propIsApt   = property.type === 'apartment'
    const propIsHouse = property.type === 'house'
    const propIsLand  = property.type === 'land'
    const propIsCom   = property.type === 'commercial'

    const typeOk =
      (propIsApt   && wantsApt)   ||
      (propIsHouse && wantsHouse) ||
      (propIsLand  && wantsLand)  ||
      (propIsCom   && wantsCom)

    if (!typeOk) {
      const wanted = [
        wantsApt && 'Квартира', wantsHouse && 'Дом',
        wantsLand && 'Участок', wantsCom && 'Коммерция',
      ].filter(Boolean).join('/')
      return { score: 0, reasons: [], mismatches: [`Тип: хочет ${wanted}`] }
    }

    // 2. Room count hard exclude (only for apartments)
    if (propIsApt && wantsApt && property.rooms !== undefined) {
      const wantedRooms = pt.filter((t) => APT_TOKENS.has(t)).map((t) => TOKEN_TO_ROOMS[t])
      if (wantedRooms.length > 0) {
        const propRoomKey = property.rooms >= 4 ? 4 : property.rooms
        if (!wantedRooms.includes(propRoomKey)) {
          const labels = wantedRooms.map((r) => (r === 0 ? 'Студия' : `${r}-комн.`))
          return { score: 0, reasons: [], mismatches: [`Комнаты: хочет ${labels.join('/')}, объект ${property.rooms === 0 ? 'студия' : property.rooms + '-комн.'}`] }
        }
        score += 3
        reasons.push(wantedRooms.map((r) => (r === 0 ? 'Студия' : `${r}-комн.`)).join('/'))
      }
    }
  }

  // 3. Floor max hard exclude
  if (demand.floor_max && property.floor !== undefined && property.floor > demand.floor_max) {
    return { score: 0, reasons: [], mismatches: [`Этаж ${property.floor} > макс. ${demand.floor_max}`] }
  }

  // 4. Budget hard exclude (>15% over budget_max)
  const budgetMax = demand.budget_max
  if (budgetMax && budgetMax > 0 && property.price > budgetMax * 1.15) {
    const over = Math.round((property.price / budgetMax - 1) * 100)
    return { score: 0, reasons: [], mismatches: [`Дорого: +${over}% выше бюджета`] }
  }

  // ── Scoring ──────────────────────────────────────────────────────────────────

  // Budget (0-4)
  if (budgetMax && budgetMax > 0) {
    if (property.price <= budgetMax) {
      score += 4; reasons.push('В бюджете')
    } else if (property.price <= budgetMax * 1.08) {
      score += 2; reasons.push('Чуть выше бюджета (+8%)')
    } else {
      score += 1; reasons.push('Немного выше бюджета')
    }
  } else if (demand.budget_min && property.price >= demand.budget_min) {
    score += 1; reasons.push('Выше минимального бюджета')
  }

  // District (0-3)
  const wantedDistricts = demand.districts ?? []
  if (wantedDistricts.length > 0 && property.district) {
    const propD = property.district.toLowerCase()
    const matched = wantedDistricts.some((d) => {
      const dl = d.toLowerCase()
      return propD.includes(dl) || dl.includes(propD) || (dl.length >= 4 && propD.includes(dl.slice(0, 4)))
    })
    if (matched) {
      score += 3; reasons.push(`Район: ${property.district}`)
    } else {
      mismatches.push(`Район не совпадает (хочет: ${wantedDistricts.slice(0, 2).join(', ')})`)
    }
  }

  // Market type (0-2)
  if (demand.market_type && demand.market_type !== 'any' && property.market_type) {
    const demMkt = demand.market_type === 'primary' ? 'new_build' : 'secondary'
    if (demMkt === property.market_type) {
      score += 2
      reasons.push(demMkt === 'new_build' ? 'Новостройка' : 'Вторичка')
    } else {
      mismatches.push(demMkt === 'new_build' ? 'Хочет новостройку' : 'Хочет вторичку')
    }
  }

  // Payment (0-2)
  const payTypes = demand.payment_types ?? []
  if (payTypes.length > 0) {
    const payOk =
      (payTypes.includes('mortgage')     && property.has_mortgage)     ||
      (payTypes.includes('installment')  && property.has_installment)  ||
      (payTypes.includes('cash'))
    if (payOk) {
      const labels: Record<string, string> = { cash: 'Наличные', mortgage: 'Ипотека', installment: 'Рассрочка' }
      const matched = payTypes.filter((p) => p === 'cash' || (p === 'mortgage' && property.has_mortgage) || (p === 'installment' && property.has_installment))
      score += 2; reasons.push(matched.map((p) => labels[p]).filter(Boolean).join(', '))
    } else {
      mismatches.push('Способ оплаты не поддерживается')
    }
  }

  // Floor min (0-2): only soft score (hard exclude already handled floor_max)
  if (demand.floor_min && property.floor !== undefined) {
    if (property.floor >= demand.floor_min) {
      score += 2; reasons.push(`Этаж ${property.floor} подходит`)
    } else {
      mismatches.push(`Этаж ${property.floor} < мин. ${demand.floor_min}`)
    }
  } else if (!demand.floor_min && !demand.floor_max && property.floor !== undefined) {
    score += 2; reasons.push(`Этаж ${property.floor}`)
  }

  // Complex (0-3)
  const complexIds = demand.complex_ids ?? []
  if (complexIds.length > 0 && property.complex_id) {
    if (complexIds.includes(property.complex_id)) {
      score += 3; reasons.push('ЖК совпадает')
    } else {
      mismatches.push('ЖК не в списке предпочтений')
    }
  }

  // Area (0-1) — for apartments/houses use area; for land use area_sotki
  const demAreaMin = demand.area_min
  const demAreaMax = demand.area_max
  if ((demAreaMin || demAreaMax) && property.area) {
    const areaOk =
      (demAreaMin === undefined || property.area >= demAreaMin) &&
      (demAreaMax === undefined || property.area <= demAreaMax)
    if (areaOk) { score += 1; reasons.push(`Площадь ${property.area} м²`) }
    else { mismatches.push(`Площадь не в диапазоне`) }
  } else {
    const demSotkiMin = demand.area_sotki_min
    const demSotkiMax = demand.area_sotki_max
    if ((demSotkiMin || demSotkiMax) && property.area_sotki) {
      const sotkiOk =
        (demSotkiMin === undefined || property.area_sotki >= demSotkiMin) &&
        (demSotkiMax === undefined || property.area_sotki <= demSotkiMax)
      if (sotkiOk) { score += 1; reasons.push(`Участок ${property.area_sotki} сот.`) }
      else { mismatches.push(`Площадь участка не в диапазоне`) }
    }
  }

  return { score, reasons, mismatches }
}

export function getDemandMatchLevel(score: number): MatchLevel {
  const pct = score / MAX_DEMAND_MATCH_SCORE
  if (pct >= 0.65) return 'high'
  if (pct >= 0.35) return 'medium'
  return 'low'
}

export function getDemandMatchPercent(score: number): number {
  return Math.min(100, Math.round((score / MAX_DEMAND_MATCH_SCORE) * 100))
}

// ─── Batch matchers ────────────────────────────────────────────────────────────

export function getMatchingProperties(
  client: Client,
  properties: Property[],
  minScore = 2,
): Array<Property & { matchScore: number; matchReasons: string[]; matchMismatches: string[] }> {
  return properties
    .map(p => {
      const { score, reasons, mismatches } = scorePropertyForClient(p, client)
      return { ...p, matchScore: score, matchReasons: reasons, matchMismatches: mismatches }
    })
    .filter(p => p.matchScore >= minScore)
    .sort((a, b) => b.matchScore - a.matchScore)
}

export function getMatchingClients(
  property: Property,
  clients: Client[],
  minScore = 2,
): Array<Client & { matchScore: number; matchReasons: string[]; matchMismatches: string[] }> {
  return clients
    .map(c => {
      const { score, reasons, mismatches } = scorePropertyForClient(property, c)
      return { ...c, matchScore: score, matchReasons: reasons, matchMismatches: mismatches }
    })
    .filter(c => c.matchScore >= minScore)
    .sort((a, b) => b.matchScore - a.matchScore)
}

// ─── Level helpers ─────────────────────────────────────────────────────────────

export type MatchLevel = 'high' | 'medium' | 'low'

export function getMatchLevel(score: number): MatchLevel {
  const pct = score / MAX_MATCH_SCORE
  if (pct >= 0.65) return 'high'
  if (pct >= 0.35) return 'medium'
  return 'low'
}

export function getMatchPercent(score: number): number {
  return Math.min(100, Math.round((score / MAX_MATCH_SCORE) * 100))
}

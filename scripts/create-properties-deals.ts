/**
 * Создание объектов недвижимости и сделок из импортированных клиентов
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

interface ParsedProperty {
  type: 'apartment' | 'house' | 'commercial' | 'land'
  rooms: number | null
  area: number | null
  floor: number | null
  totalFloors: number | null
  address: string
  title: string
  price: number
  description: string
}

function parsePrice(budget: string): number {
  if (!budget) return 0
  const cleaned = budget.replace(/на руки/gi, '').replace(/за кв/gi, '').trim()

  const mlnMatch = cleaned.match(/([\d.,]+)\s*млн/i)
  if (mlnMatch) return Math.round(parseFloat(mlnMatch[1].replace(',', '.')) * 1_000_000)

  const tysMatch = cleaned.match(/([\d.,]+)\s*тыс/i)
  if (tysMatch) return Math.round(parseFloat(tysMatch[1].replace(',', '.')) * 1_000)

  const numMatch = cleaned.match(/^до\s*([\d.,]+)$/i) || cleaned.match(/^([\d.,]+)$/)
  if (numMatch) {
    const num = parseFloat(numMatch[1].replace(',', '.'))
    if (num < 100) return Math.round(num * 1_000_000)
    if (num < 10000) return Math.round(num * 1_000)
    return Math.round(num)
  }
  return 0
}

function parsePropertyFromNotes(notes: string): ParsedProperty | null {
  if (!notes) return null
  const firstLine = notes.split('\n')[0]
  if (!firstLine.toLowerCase().includes('продает') && !firstLine.toLowerCase().includes('продаёт')) return null

  const budgetLine = notes.split('\n').find(l => l.startsWith('Бюджет:'))
  const price = budgetLine ? parsePrice(budgetLine.replace('Бюджет:', '').trim()) : 0

  // Detect type
  const lower = firstLine.toLowerCase()
  let type: ParsedProperty['type'] = 'apartment'
  if (lower.includes('уч.') || lower.includes('участ') || lower.includes('сот')) type = 'land'
  else if (lower.includes('дом')) type = 'house'
  else if (lower.includes('помещ') || lower.includes('коммерц') || lower.includes('магазин') || lower.includes('офис')) type = 'commercial'

  // Parse rooms
  let rooms: number | null = null
  const roomMatch = firstLine.match(/(\d)-к\b/)
  if (roomMatch) rooms = parseInt(roomMatch[1])

  // Parse area
  let area: number | null = null
  const areaMatch = firstLine.match(/([\d.,]+)\s*м[²2]/i) || firstLine.match(/([\d.,]+)\s*м2/i)
  if (areaMatch) area = parseFloat(areaMatch[1].replace(',', '.'))

  // Parse area in sotki for land
  if (type === 'land') {
    const sotMatch = firstLine.match(/([\d.,]+)\s*сот/i)
    if (sotMatch) area = parseFloat(sotMatch[1].replace(',', '.')) * 100
  }

  // Parse floor
  let floor: number | null = null
  let totalFloors: number | null = null
  const floorMatch = firstLine.match(/(\d+)\s*\/\s*(\d+)\s*эт/i)
  if (floorMatch) {
    floor = parseInt(floorMatch[1])
    totalFloors = parseInt(floorMatch[2])
  }

  // Parse address
  let address = 'Нальчик'
  const addrPatterns = [
    /ул\.\s*([^|,\n]+)/i,
    /на\s+([А-Яа-яёЁ]+(?:\s+[А-Яа-яёЁ]+)*)/,
    /в\s+ЖК\s+([^|,\n]+)/i,
    /ЖК\s+([^|,\n]+)/i,
    /мкр\.\s*([^|,\n]+)/i,
    /(\d+\s*мкр[^|,\n]*)/i,
  ]
  for (const pattern of addrPatterns) {
    const m = firstLine.match(pattern)
    if (m) {
      address = m[0].trim()
      break
    }
  }

  // Build title
  let title = ''
  if (type === 'land') {
    title = `Участок${area ? ` ${area / 100} сот.` : ''}`
  } else if (type === 'house') {
    title = `Дом${area ? ` ${area}м²` : ''}`
  } else if (type === 'commercial') {
    title = `Коммерческое помещение${area ? ` ${area}м²` : ''}`
  } else {
    title = rooms ? `${rooms}-комн. кв.` : 'Квартира'
    if (area) title += ` ${area}м²`
  }
  if (address !== 'Нальчик') title += `, ${address}`

  return {
    type, rooms, area, floor, totalFloors,
    address, title,
    price: price > 0 ? price : 1,
    description: firstLine.replace(/^Продае?[тё]т?\s*/i, '').trim(),
  }
}

async function main() {
  const { data: sellers, error: sellErr } = await supabase
    .from('clients')
    .select('id, full_name, notes, preferences, status')
    .eq('type', 'seller')

  if (sellErr || !sellers) {
    console.error('Ошибка загрузки продавцов:', sellErr?.message)
    process.exit(1)
  }
  console.log(`Продавцов: ${sellers.length}`)

  const { data: agencies } = await supabase.from('agencies').select('id').limit(1)
  const agencyId = agencies![0].id

  const { data: profiles } = await supabase
    .from('profiles').select('id').eq('agency_id', agencyId).limit(1)
  const realtorId = profiles![0].id

  let propCreated = 0
  let propSkipped = 0
  let dealCreated = 0

  for (const seller of sellers) {
    const parsed = parsePropertyFromNotes(seller.notes || '')
    if (!parsed) {
      propSkipped++
      continue
    }

    const propertyData: Record<string, unknown> = {
      agency_id: agencyId,
      realtor_id: realtorId,
      type: parsed.type,
      status: seller.status === 'deal' ? 'sold' : 'active',
      title: parsed.title,
      description: parsed.description,
      address: parsed.address,
      city: 'Нальчик',
      price: parsed.price,
      area: parsed.area,
      rooms: parsed.rooms,
      floor: parsed.floor,
      total_floors: parsed.totalFloors,
      features: {
        seller_name: seller.full_name,
        seller_client_id: seller.id,
        budget_raw: seller.preferences?.budget || null,
      },
    }

    const { data: prop, error: propErr } = await supabase
      .from('properties')
      .insert(propertyData)
      .select('id')
      .single()

    if (propErr) {
      console.error(`  Ошибка объекта для ${seller.full_name}: ${propErr.message}`)
      propSkipped++
      continue
    }
    propCreated++

    // Create a deal for clients with status "deal" or "negotiation"
    if (seller.status === 'deal' || seller.status === 'negotiation') {
      const dealData = {
        agency_id: agencyId,
        property_id: prop.id,
        client_id: seller.id,
        realtor_id: realtorId,
        type: 'sale' as const,
        status: seller.status === 'deal' ? 'completed' : 'active',
        price: parsed.price,
        commission_percent: 3,
        notes: `Сделка с ${seller.full_name}`,
      }
      const { error: dealErr } = await supabase.from('deals').insert(dealData)
      if (dealErr) {
        console.error(`  Ошибка сделки для ${seller.full_name}: ${dealErr.message}`)
      } else {
        dealCreated++
      }
    }
  }

  // Also create deals for buyers with status "deal"
  const { data: dealBuyers } = await supabase
    .from('clients')
    .select('id, full_name, notes, preferences')
    .eq('type', 'buyer')
    .eq('status', 'deal')

  if (dealBuyers && dealBuyers.length > 0) {
    console.log(`\nПокупателей со статусом "сделка": ${dealBuyers.length}`)
    for (const buyer of dealBuyers) {
      const price = parsePrice(buyer.preferences?.budget || '')
      const propData = {
        agency_id: agencyId,
        realtor_id: realtorId,
        type: 'apartment' as const,
        status: 'sold' as const,
        title: `Объект для ${buyer.full_name}`,
        description: (buyer.notes || '').split('\n')[0] || 'Объект по сделке',
        address: 'Нальчик',
        city: 'Нальчик',
        price: price > 0 ? price : 1000000,
      }
      const { data: prop, error: pErr } = await supabase
        .from('properties').insert(propData).select('id').single()
      if (pErr || !prop) continue

      propCreated++
      const dealData = {
        agency_id: agencyId,
        property_id: prop.id,
        client_id: buyer.id,
        realtor_id: realtorId,
        type: 'sale' as const,
        status: 'completed' as const,
        price: price > 0 ? price : 1000000,
        commission_percent: 3,
        notes: `Сделка с покупателем ${buyer.full_name}`,
      }
      const { error: dErr } = await supabase.from('deals').insert(dealData)
      if (!dErr) dealCreated++
    }
  }

  console.log('\n' + '═'.repeat(50))
  console.log('РЕЗУЛЬТАТ')
  console.log('═'.repeat(50))
  console.log(`Объектов создано:   ${propCreated}`)
  console.log(`Пропущено:          ${propSkipped}`)
  console.log(`Сделок создано:     ${dealCreated}`)
  console.log('Готово!')
}

main()

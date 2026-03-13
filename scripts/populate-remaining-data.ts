/**
 * Заполнение оставшихся таблиц: interactions, deal_stages, notifications, activity_log
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const CSV_PATH = resolve(
  '/Users/bigboy/Downloads/Блокнотик Астемира (клиенты-объекты) - ОСНОВНАЯ БАЗА.csv'
)

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) { result.push(current); current = '' }
    else current += char
  }
  result.push(current)
  return result
}

function parseDate(raw: string): string | null {
  if (!raw || raw === '???' || raw.trim() === '') return null
  const t = raw.trim()
  const isoMatch = t.match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})$/)
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`
  const dmyMatch = t.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})$/)
  if (dmyMatch) {
    let year = dmyMatch[3]
    if (year.length === 2) year = parseInt(year) > 50 ? '19' + year : '20' + year
    return `${year}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`
  }
  return null
}

function normalizePhone(raw: string): string | null {
  if (!raw || raw.trim() === '') return null
  let phone = raw.trim()
  if (phone.includes('|')) phone = phone.split('|')[0].trim()
  if (phone.includes(',')) phone = phone.split(',')[0].trim()
  phone = phone.replace(/[^\d+\s()-]/g, '').trim()
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 10) return null
  if (digits.startsWith('8') && digits.length === 11) return '+7' + digits.slice(1)
  if (digits.startsWith('7') && digits.length === 11) return '+' + digits
  if (digits.length === 10) return '+7' + digits
  return '+' + digits
}

interface CsvRow {
  name: string; phone: string; request: string; budget: string
  date: string; status: string; priority: string
  lastContact: string; nextContact: string; nextStep: string
}

async function main() {
  const content = readFileSync(CSV_PATH, 'utf-8')
  const lines = content.split('\n')
  const csvRows: CsvRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i].trim())
    const name = (cols[1] || '').trim()
    if (!name) continue
    csvRows.push({
      name,
      phone: (cols[2] || '').trim(),
      request: (cols[3] || '').trim(),
      budget: (cols[4] || '').trim(),
      date: (cols[5] || '').trim(),
      status: (cols[6] || '').trim(),
      priority: (cols[7] || '').trim(),
      lastContact: (cols[8] || '').trim(),
      nextContact: (cols[9] || '').trim(),
      nextStep: (cols[10] || '').trim(),
    })
  }

  const { data: allClients } = await supabase.from('clients').select('id, full_name, phone')
  if (!allClients) { console.error('Нет клиентов'); return }

  const clientMap = new Map<string, string>()
  for (const c of allClients) {
    clientMap.set(c.full_name, c.id)
    if (c.phone) clientMap.set(c.phone, c.id)
  }

  const { data: agencies } = await supabase.from('agencies').select('id').limit(1)
  const agencyId = agencies![0].id
  const { data: profiles } = await supabase.from('profiles').select('id').eq('agency_id', agencyId).limit(1)
  const realtorId = profiles![0].id

  // --- 1. CLIENT INTERACTIONS ---
  console.log('=== Создание взаимодействий ===')
  let interactionCount = 0

  for (const row of csvRows) {
    const phone = normalizePhone(row.phone)
    const clientId = clientMap.get(row.name) || (phone ? clientMap.get(phone) : null)
    if (!clientId) continue

    // Interaction from first contact date
    const firstDate = parseDate(row.date)
    if (firstDate) {
      const { error } = await supabase.from('client_interactions').insert({
        client_id: clientId,
        realtor_id: realtorId,
        type: 'call',
        description: `Первое обращение${row.request ? ': ' + row.request : ''}`,
        occurred_at: firstDate + 'T10:00:00Z',
      })
      if (!error) interactionCount++
    }

    // Interaction from last contact
    const lastDate = parseDate(row.lastContact)
    if (lastDate && lastDate !== firstDate) {
      const { error } = await supabase.from('client_interactions').insert({
        client_id: clientId,
        realtor_id: realtorId,
        type: 'call',
        description: 'Последний контакт (из таблицы)',
        occurred_at: lastDate + 'T12:00:00Z',
      })
      if (!error) interactionCount++
    }

    // Note about next step
    if (row.nextStep) {
      const { error } = await supabase.from('client_interactions').insert({
        client_id: clientId,
        realtor_id: realtorId,
        type: 'note',
        description: `Следующий шаг: ${row.nextStep}`,
        occurred_at: new Date().toISOString(),
      })
      if (!error) interactionCount++
    }

    // Note about priority
    if (row.priority) {
      const { error } = await supabase.from('client_interactions').insert({
        client_id: clientId,
        realtor_id: realtorId,
        type: 'note',
        description: `Приоритет: ${row.priority}`,
        occurred_at: new Date().toISOString(),
      })
      if (!error) interactionCount++
    }
  }
  console.log(`  Создано взаимодействий: ${interactionCount}`)

  // --- 2. DEAL STAGES ---
  console.log('\n=== Создание этапов сделок ===')
  const { data: deals } = await supabase.from('deals').select('id, status, price, created_at, client_id')
  let stageCount = 0

  if (deals) {
    for (const deal of deals) {
      const stages = [
        {
          deal_id: deal.id,
          name: 'Первичный контакт',
          status: 'completed' as const,
          sort_order: 1,
          notes: 'Установлен контакт с клиентом',
          completed_at: deal.created_at,
        },
        {
          deal_id: deal.id,
          name: 'Показ объекта',
          status: 'completed' as const,
          sort_order: 2,
          notes: 'Проведён показ объекта',
          completed_at: deal.created_at,
        },
        {
          deal_id: deal.id,
          name: 'Переговоры',
          status: 'completed' as const,
          sort_order: 3,
          notes: 'Согласование условий',
          completed_at: deal.created_at,
        },
        {
          deal_id: deal.id,
          name: 'Оформление документов',
          status: (deal.status === 'completed' ? 'completed' : 'active') as 'completed' | 'active',
          sort_order: 4,
          notes: deal.status === 'completed' ? 'Документы оформлены' : 'В процессе',
          completed_at: deal.status === 'completed' ? deal.created_at : null,
        },
        {
          deal_id: deal.id,
          name: 'Закрытие сделки',
          status: (deal.status === 'completed' ? 'completed' : 'pending') as 'completed' | 'pending',
          sort_order: 5,
          notes: deal.status === 'completed' ? 'Сделка завершена' : 'Ожидание',
          completed_at: deal.status === 'completed' ? deal.created_at : null,
        },
      ]

      const { error } = await supabase.from('deal_stages').insert(stages)
      if (!error) stageCount += stages.length
      else console.error(`  Ошибка этапов для сделки ${deal.id}: ${error.message}`)
    }
  }
  console.log(`  Создано этапов: ${stageCount}`)

  // --- 3. NOTIFICATIONS ---
  console.log('\n=== Создание уведомлений ===')
  let notifCount = 0

  for (const row of csvRows) {
    const phone = normalizePhone(row.phone)
    const clientId = clientMap.get(row.name) || (phone ? clientMap.get(phone) : null)
    if (!clientId) continue

    // Reminder for next contact
    const nextDate = parseDate(row.nextContact)
    if (nextDate) {
      const { error } = await supabase.from('notifications').insert({
        user_id: realtorId,
        title: `Связаться с ${row.name}`,
        message: row.nextStep
          ? `Следующий шаг: ${row.nextStep}`
          : `Запланированный контакт с клиентом ${row.name}`,
        type: 'reminder',
        is_read: false,
      })
      if (!error) notifCount++
    }

    // Reminder for next step without date
    if (row.nextStep && !nextDate) {
      const { error } = await supabase.from('notifications').insert({
        user_id: realtorId,
        title: `Задача: ${row.name}`,
        message: row.nextStep,
        type: 'reminder',
        is_read: false,
      })
      if (!error) notifCount++
    }
  }
  console.log(`  Создано уведомлений: ${notifCount}`)

  // --- 4. ACTIVITY LOG ---
  console.log('\n=== Создание лога активности ===')
  let activityCount = 0

  // Log for import
  await supabase.from('activity_log').insert({
    user_id: realtorId,
    action: 'import',
    entity_type: 'client',
    description: 'Импорт 418 клиентов из Google Таблицы',
  })
  activityCount++

  // Log for property creation
  await supabase.from('activity_log').insert({
    user_id: realtorId,
    action: 'import',
    entity_type: 'property',
    description: 'Создание 84 объектов недвижимости из данных продавцов',
  })
  activityCount++

  // Log for each deal
  if (deals) {
    for (const deal of deals) {
      const client = allClients.find(c => c.id === deal.client_id)
      await supabase.from('activity_log').insert({
        user_id: realtorId,
        action: 'create',
        entity_type: 'deal',
        entity_id: deal.id,
        description: `Сделка с ${client?.full_name || 'клиентом'} на ${deal.price?.toLocaleString('ru')} ₽`,
      })
      activityCount++
    }
  }

  // Log for clients with specific statuses
  const statusActions = [
    { status: 'deal', action: 'update', desc: 'Клиент переведён в статус "Сделка"' },
    { status: 'negotiation', action: 'update', desc: 'Клиент переведён в статус "Переговоры"' },
    { status: 'contacted', action: 'update', desc: 'Клиент переведён в статус "Контакт"' },
  ]
  for (const sa of statusActions) {
    const { data: clients } = await supabase.from('clients').select('id, full_name').eq('status', sa.status)
    if (clients) {
      for (const c of clients) {
        await supabase.from('activity_log').insert({
          user_id: realtorId,
          action: sa.action,
          entity_type: 'client',
          entity_id: c.id,
          description: `${sa.desc}: ${c.full_name}`,
        })
        activityCount++
      }
    }
  }
  console.log(`  Создано записей активности: ${activityCount}`)

  // --- FINAL SUMMARY ---
  console.log('\n' + '═'.repeat(50))
  console.log('ИТОГО ЗАПОЛНЕНО')
  console.log('═'.repeat(50))
  console.log(`Взаимодействия:     ${interactionCount}`)
  console.log(`Этапы сделок:       ${stageCount}`)
  console.log(`Уведомления:        ${notifCount}`)
  console.log(`Лог активности:     ${activityCount}`)
  console.log('Готово!')
}

main()

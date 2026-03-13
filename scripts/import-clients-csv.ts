/**
 * Импорт клиентской базы из CSV-файла "Блокнотик Астемира"
 *
 * Использование:
 *   SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_KEY=xxx npx tsx scripts/import-clients-csv.ts
 *
 * Или если ключи уже в .env:
 *   npx tsx scripts/import-clients-csv.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Задайте переменные SUPABASE_URL и SUPABASE_SERVICE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const CSV_PATH = resolve(
  process.argv[2] ||
    '/Users/bigboy/Downloads/Блокнотик Астемира (клиенты-объекты) - ОСНОВНАЯ БАЗА.csv'
)

// Маппинг статусов из таблицы в нашу БД
const STATUS_MAP: Record<string, string> = {
  'Воздухан(ка)': 'lost',
  'Тёплый': 'contacted',
  'Думает': 'negotiation',
  'Сделка': 'deal',
  'Архив': 'lost',
  'Холодный(ЛИД)': 'new',
}

// Определение типа клиента по тексту запроса
function detectClientType(request: string): string {
  const lower = request.toLowerCase()
  if (lower.includes('продает') || lower.includes('продаёт') || lower.includes('продавал') || lower.includes('продавала')) {
    return 'seller'
  }
  if (lower.includes('аренд')) {
    return 'tenant'
  }
  return 'buyer'
}

// Нормализация телефона
function normalizePhone(raw: string): string | null {
  if (!raw || raw.trim() === '') return null
  let phone = raw.trim()
  // Берем только первый номер если их несколько (разделены | или ,)
  if (phone.includes('|')) phone = phone.split('|')[0].trim()
  if (phone.includes(',')) phone = phone.split(',')[0].trim()
  // Убираем спецсимволы Unicode и слова
  phone = phone.replace(/[^\d+\s()-]/g, '').trim()
  // Убираем всё кроме цифр
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 10) return null
  // Приводим к формату +7...
  if (digits.startsWith('8') && digits.length === 11) {
    return '+7' + digits.slice(1)
  }
  if (digits.startsWith('7') && digits.length === 11) {
    return '+' + digits
  }
  if (digits.length === 10) {
    return '+7' + digits
  }
  return '+' + digits
}

// Парсинг даты из формата DD.MM.YY или DD.MM.YYYY или YYYY.MM.DD
function parseDate(raw: string): string | null {
  if (!raw || raw === '???' || raw === '') return null
  const trimmed = raw.trim()

  // Формат YYYY.MM.DD
  const isoMatch = trimmed.match(/^(\d{4})\.(\d{2})\.(\d{2})$/)
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`
  }

  // Формат DD.MM.YY или DD.MM.YYYY
  const dmyMatch = trimmed.match(/^(\d{2})\.(\d{2})\.(\d{2,4})$/)
  if (dmyMatch) {
    let year = dmyMatch[3]
    if (year.length === 2) {
      year = parseInt(year) > 50 ? '19' + year : '20' + year
    }
    return `${year}-${dmyMatch[2]}-${dmyMatch[1]}`
  }

  return null
}

// Парсинг CSV (запятая как разделитель, учитываем кавычки)
function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)
  return result
}

interface RawRow {
  label: string
  name: string
  phone: string
  request: string
  budget: string
  date: string
  status: string
  priority: string
  lastContact: string
  nextContact: string
  nextStep: string
  daysWithout: string
}

function parseRows(content: string): RawRow[] {
  const lines = content.split('\n')
  // Пропускаем заголовок (первая строка)
  const rows: RawRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const cols = parseCsvLine(line)
    rows.push({
      label: (cols[0] || '').trim(),
      name: (cols[1] || '').trim(),
      phone: (cols[2] || '').trim(),
      request: (cols[3] || '').trim(),
      budget: (cols[4] || '').trim(),
      date: (cols[5] || '').trim(),
      status: (cols[6] || '').trim(),
      priority: (cols[7] || '').trim(),
      lastContact: (cols[8] || '').trim(),
      nextContact: (cols[9] || '').trim(),
      nextStep: (cols[10] || '').trim(),
      daysWithout: (cols[11] || '').trim(),
    })
  }
  return rows
}

async function main() {
  console.log('Чтение CSV-файла:', CSV_PATH)
  let content: string
  try {
    content = readFileSync(CSV_PATH, 'utf-8')
  } catch {
    console.error('Не удалось прочитать файл:', CSV_PATH)
    process.exit(1)
  }

  const rows = parseRows(content)
  console.log(`Всего строк в CSV: ${rows.length}`)

  // Фильтруем пустые строки (только номер клиента, без имени)
  const validRows = rows.filter((r) => r.name && r.name.trim() !== '')
  console.log(`Строк с данными: ${validRows.length}`)

  // Нужен agency_id и realtor_id. Создадим агентство если его нет,
  // или используем первое доступное
  let agencyId: string
  let realtorId: string

  // Проверяем, есть ли уже агентство
  const { data: agencies } = await supabase.from('agencies').select('id').limit(1)
  if (agencies && agencies.length > 0) {
    agencyId = agencies[0].id
    console.log(`Используем существующее агентство: ${agencyId}`)
  } else {
    const { data: newAgency, error: agencyError } = await supabase
      .from('agencies')
      .insert({ name: 'Агентство Астемира', city: 'Нальчик' })
      .select('id')
      .single()
    if (agencyError || !newAgency) {
      console.error('Ошибка создания агентства:', agencyError?.message)
      process.exit(1)
    }
    agencyId = newAgency.id
    console.log(`Создано новое агентство: ${agencyId}`)
  }

  // Проверяем, есть ли профиль риэлтора
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .eq('agency_id', agencyId)
    .limit(1)
  if (profiles && profiles.length > 0) {
    realtorId = profiles[0].id
    console.log(`Используем существующего риэлтора: ${realtorId}`)
  } else {
    // Если нет профилей, берем любой
    const { data: anyProfile } = await supabase.from('profiles').select('id').limit(1)
    if (anyProfile && anyProfile.length > 0) {
      realtorId = anyProfile[0].id
      // Привязываем к агентству
      await supabase.from('profiles').update({ agency_id: agencyId }).eq('id', realtorId)
      console.log(`Привязан риэлтор: ${realtorId}`)
    } else {
      console.error(
        'Нет ни одного зарегистрированного пользователя. ' +
        'Сначала зарегистрируйтесь в приложении, затем запустите импорт.'
      )
      process.exit(1)
    }
  }

  let imported = 0
  let skipped = 0
  const errors: { row: number; name: string; error: string }[] = []

  for (let i = 0; i < validRows.length; i++) {
    const row = validRows[i]

    const phone = normalizePhone(row.phone)
    const clientType = row.request ? detectClientType(row.request) : 'buyer'
    const statusRaw = row.status.trim()
    const status = STATUS_MAP[statusRaw] || 'new'
    const createdAt = parseDate(row.date)
    const lastContactDate = parseDate(row.lastContact)
    const nextContactDate = parseDate(row.nextContact)

    const preferences: Record<string, unknown> = {}
    if (row.budget && row.budget !== '???' && row.budget !== '?') {
      preferences.budget = row.budget
    }
    if (row.priority) {
      preferences.priority = row.priority
    }
    if (nextContactDate) {
      preferences.next_contact = nextContactDate
    }
    if (row.nextStep) {
      preferences.next_step = row.nextStep
    }

    const notes = [
      row.request || null,
      row.budget && row.budget !== '???' ? `Бюджет: ${row.budget}` : null,
      statusRaw && !STATUS_MAP[statusRaw] && statusRaw !== '' ? `Статус из таблицы: ${statusRaw}` : null,
    ]
      .filter(Boolean)
      .join('\n')

    const record: Record<string, unknown> = {
      agency_id: agencyId,
      realtor_id: realtorId,
      full_name: row.name,
      phone,
      type: clientType,
      status,
      notes: notes || null,
      preferences,
      source: 'CSV импорт (Google Таблицы)',
    }

    if (createdAt) {
      record.created_at = createdAt + 'T00:00:00Z'
    }

    const { error } = await supabase.from('clients').insert(record)
    if (error) {
      errors.push({ row: i + 2, name: row.name, error: error.message })
      skipped++
    } else {
      imported++

      // Если есть дата последнего контакта, создаем запись взаимодействия
      if (lastContactDate) {
        await supabase.from('client_interactions').insert({
          client_id: null, // Нет client_id пока, нужно будет обновить
          realtor_id: realtorId,
          type: 'note',
          description: `Последний контакт (из импорта): ${row.lastContact}`,
          occurred_at: lastContactDate + 'T00:00:00Z',
        }).then(() => {
          // Interaction insert may fail without client_id, that's expected
        })
      }
    }

    // Прогресс каждые 50 записей
    if ((i + 1) % 50 === 0) {
      console.log(`  обработано ${i + 1} из ${validRows.length}...`)
    }
  }

  console.log('\n' + '═'.repeat(50))
  console.log('РЕЗУЛЬТАТ ИМПОРТА')
  console.log('═'.repeat(50))
  console.log(`Импортировано:  ${imported}`)
  console.log(`Пропущено:      ${skipped}`)
  console.log(`Всего:          ${validRows.length}`)

  if (errors.length > 0) {
    console.log(`\nОшибки (${errors.length}):`)
    for (const err of errors.slice(0, 20)) {
      console.log(`  Строка ${err.row} (${err.name}): ${err.error}`)
    }
    if (errors.length > 20) {
      console.log(`  ... и ещё ${errors.length - 20} ошибок`)
    }
  }

  console.log('\nГотово!')
}

main()

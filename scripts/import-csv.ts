/**
 * Скрипт импорта данных из CSV в Supabase.
 *
 * Использование:
 *   npx tsx scripts/import-csv.ts --table properties --file data/properties.csv
 *   npx tsx scripts/import-csv.ts --table clients --file data/clients.csv
 *   npx tsx scripts/import-csv.ts --table deals --file data/deals.csv
 *
 * Перед запуском убедитесь что переменные окружения SUPABASE_URL и SUPABASE_SERVICE_KEY
 * установлены (service key, не anon key, для обхода RLS при импорте).
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Не заданы SUPABASE_URL и SUPABASE_SERVICE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

type SupportedTable = 'properties' | 'clients' | 'deals'

// Column mappings: CSV column name -> DB column name
const COLUMN_MAPS: Record<SupportedTable, Record<string, string>> = {
  properties: {
    'Название': 'title',
    'Тип': 'type',
    'Статус': 'status',
    'Адрес': 'address',
    'Город': 'city',
    'Район': 'district',
    'Цена': 'price',
    'Валюта': 'currency',
    'Площадь': 'area',
    'Комнаты': 'rooms',
    'Этаж': 'floor',
    'Этажность': 'total_floors',
    'Описание': 'description',
    'title': 'title',
    'type': 'type',
    'status': 'status',
    'address': 'address',
    'city': 'city',
    'district': 'district',
    'price': 'price',
    'currency': 'currency',
    'area': 'area',
    'rooms': 'rooms',
    'floor': 'floor',
    'total_floors': 'total_floors',
    'description': 'description',
  },
  clients: {
    'Имя': 'full_name',
    'ФИО': 'full_name',
    'Телефон': 'phone',
    'Email': 'email',
    'Тип': 'type',
    'Статус': 'status',
    'Источник': 'source',
    'Заметки': 'notes',
    'full_name': 'full_name',
    'phone': 'phone',
    'email': 'email',
    'type': 'type',
    'status': 'status',
    'source': 'source',
    'notes': 'notes',
  },
  deals: {
    'Тип': 'type',
    'Статус': 'status',
    'Этап': 'stage',
    'Цена': 'price',
    'Комиссия %': 'commission_percent',
    'Заметки': 'notes',
    'type': 'type',
    'status': 'status',
    'stage': 'stage',
    'price': 'price',
    'commission_percent': 'commission_percent',
    'notes': 'notes',
  },
}

const TYPE_TRANSLATIONS: Record<string, Record<string, string>> = {
  property_type: {
    'Квартира': 'apartment',
    'Дом': 'house',
    'Коммерческая': 'commercial',
    'Земля': 'land',
    'Земельный участок': 'land',
  },
  property_status: {
    'Черновик': 'draft',
    'В продаже': 'active',
    'Активный': 'active',
    'Забронирован': 'reserved',
    'Продан': 'sold',
    'Сдан': 'rented',
    'Архив': 'archived',
  },
  client_type: {
    'Покупатель': 'buyer',
    'Продавец': 'seller',
    'Арендатор': 'tenant',
    'Арендодатель': 'landlord',
  },
  client_status: {
    'Новый': 'new',
    'Контакт': 'contacted',
    'Переговоры': 'negotiation',
    'Сделка': 'deal',
    'Потерян': 'lost',
  },
  deal_type: {
    'Продажа': 'sale',
    'Купля-продажа': 'sale',
    'Аренда': 'rent',
  },
  deal_status: {
    'Активная': 'active',
    'Завершена': 'completed',
    'Отменена': 'cancelled',
  },
}

function parseCsv(content: string): Record<string, string>[] {
  const lines = content.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(';').map((h) => h.trim().replace(/^"|"$/g, ''))
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(';').map((v) => v.trim().replace(/^"|"$/g, ''))
    const row: Record<string, string> = {}
    headers.forEach((header, idx) => {
      row[header] = values[idx] || ''
    })
    rows.push(row)
  }

  return rows
}

function translateValue(field: string, value: string): string {
  for (const [, translations] of Object.entries(TYPE_TRANSLATIONS)) {
    if (translations[value]) {
      return translations[value]
    }
  }
  return value
}

function mapRow(
  row: Record<string, string>,
  table: SupportedTable
): Record<string, unknown> | null {
  const colMap = COLUMN_MAPS[table]
  const mapped: Record<string, unknown> = {}
  const errors: string[] = []

  for (const [csvCol, value] of Object.entries(row)) {
    const dbCol = colMap[csvCol]
    if (!dbCol || !value) continue

    if (['type', 'status'].includes(dbCol)) {
      mapped[dbCol] = translateValue(dbCol, value)
    } else if (['price', 'area', 'commission_percent'].includes(dbCol)) {
      const num = parseFloat(value.replace(/\s/g, '').replace(',', '.'))
      if (isNaN(num)) {
        errors.push(`Некорректное число для ${csvCol}: "${value}"`)
      } else {
        mapped[dbCol] = num
      }
    } else if (['rooms', 'floor', 'total_floors'].includes(dbCol)) {
      const num = parseInt(value, 10)
      if (!isNaN(num)) mapped[dbCol] = num
    } else {
      mapped[dbCol] = value
    }
  }

  if (errors.length > 0) {
    console.warn(`  Предупреждения: ${errors.join('; ')}`)
  }

  return Object.keys(mapped).length > 0 ? mapped : null
}

function validateRequired(
  row: Record<string, unknown>,
  table: SupportedTable
): string[] {
  const errors: string[] = []
  const required: Record<SupportedTable, string[]> = {
    properties: ['title', 'type', 'address', 'city', 'price'],
    clients: ['full_name', 'type'],
    deals: ['type', 'price'],
  }

  for (const field of required[table]) {
    if (!row[field]) {
      errors.push(`Отсутствует обязательное поле: ${field}`)
    }
  }

  return errors
}

async function importCsv(table: SupportedTable, filePath: string) {
  console.log(`\nИмпорт в таблицу "${table}" из файла "${filePath}"`)
  console.log('─'.repeat(50))

  const fullPath = resolve(filePath)
  let content: string

  try {
    content = readFileSync(fullPath, 'utf-8')
  } catch {
    console.error(`Ошибка чтения файла: ${fullPath}`)
    process.exit(1)
  }

  const rows = parseCsv(content)
  console.log(`Найдено строк: ${rows.length}`)

  let imported = 0
  let skipped = 0
  const importErrors: { row: number; error: string }[] = []

  for (let i = 0; i < rows.length; i++) {
    const mapped = mapRow(rows[i], table)
    if (!mapped) {
      skipped++
      continue
    }

    const validationErrors = validateRequired(mapped, table)
    if (validationErrors.length > 0) {
      importErrors.push({ row: i + 2, error: validationErrors.join('; ') })
      skipped++
      continue
    }

    const { error } = await supabase.from(table).insert(mapped)
    if (error) {
      importErrors.push({ row: i + 2, error: error.message })
      skipped++
    } else {
      imported++
    }
  }

  console.log(`\nРезультат:`)
  console.log(`  Импортировано: ${imported}`)
  console.log(`  Пропущено:     ${skipped}`)

  if (importErrors.length > 0) {
    console.log(`\nОшибки:`)
    for (const err of importErrors) {
      console.log(`  Строка ${err.row}: ${err.error}`)
    }
  }
}

// CLI
const args = process.argv.slice(2)
const tableIdx = args.indexOf('--table')
const fileIdx = args.indexOf('--file')

if (tableIdx === -1 || fileIdx === -1) {
  console.log('Использование: npx tsx scripts/import-csv.ts --table <table> --file <path>')
  console.log('Поддерживаемые таблицы: properties, clients, deals')
  process.exit(1)
}

const table = args[tableIdx + 1] as SupportedTable
const file = args[fileIdx + 1]

if (!['properties', 'clients', 'deals'].includes(table)) {
  console.error(`Неизвестная таблица: ${table}. Допустимые: properties, clients, deals`)
  process.exit(1)
}

importCsv(table, file)

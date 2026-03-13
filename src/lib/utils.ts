import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatPrice(price: number, currency = 'RUB'): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(price)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateShort(date: string | Date): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return `+${cleaned[0]} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9)}`
  }
  return phone
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function pluralize(count: number, one: string, few: string, many: string): string {
  const abs = Math.abs(count) % 100
  const lastDigit = abs % 10
  if (abs > 10 && abs < 20) return many
  if (lastDigit > 1 && lastDigit < 5) return few
  if (lastDigit === 1) return one
  return many
}

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  apartment: 'Квартира',
  house: 'Дом',
  commercial: 'Коммерческая',
  land: 'Земельный участок',
}

export const PROPERTY_STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  active: 'В продаже',
  reserved: 'Забронирован',
  sold: 'Продан',
  rented: 'Сдан',
  archived: 'В архиве',
}

export const CLIENT_TYPE_LABELS: Record<string, string> = {
  buyer: 'Покупатель',
  seller: 'Продавец',
  tenant: 'Арендатор',
  landlord: 'Арендодатель',
}

export const CLIENT_STATUS_LABELS: Record<string, string> = {
  new: 'Новый',
  contacted: 'Контакт установлен',
  negotiation: 'Переговоры',
  deal: 'Сделка',
  lost: 'Потерян',
}

export const DEAL_TYPE_LABELS: Record<string, string> = {
  sale: 'Купля-продажа',
  rent: 'Аренда',
}

export const DEAL_STATUS_LABELS: Record<string, string> = {
  active: 'Активная',
  completed: 'Завершена',
  cancelled: 'Отменена',
}

export const CLIENT_PRIORITY_LABELS: Record<string, string> = {
  high: 'Высокий',
  medium: 'Средний',
  low: 'Низкий',
}

export const CLIENT_PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
}

export const CLIENT_STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  contacted: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  negotiation: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  deal: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  lost: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

export function timeAgo(date: string | Date): string {
  const now = new Date()
  const d = new Date(date)
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'только что'
  if (diffMin < 60) return `${diffMin} мин. назад`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH} ч. назад`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `${diffD} дн. назад`
  return formatDateShort(date)
}

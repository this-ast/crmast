// Format price: 5500000 -> "5 500 000 ₽"
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

// Format price in millions: 5500000 -> "5.5 млн ₽"
export function formatPriceShort(price: number): string {
  if (price >= 1_000_000) {
    const millions = price / 1_000_000
    const formatted = millions % 1 === 0 ? millions.toString() : millions.toFixed(1)
    return `${formatted} млн ₽`
  }
  if (price >= 1_000) {
    return `${Math.round(price / 1000)} тыс ₽`
  }
  return formatPrice(price)
}

// Mask phone: +79161234567 -> "+7 *** *** ** 67"
export function maskPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length < 2) return phone
  const last2 = cleaned.slice(-2)
  return `+7 *** *** ** ${last2}`
}

// Format phone for display: +79161234567 -> "+7 (916) 123-45-67"
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11 && (cleaned[0] === '7' || cleaned[0] === '8')) {
    const digits = cleaned.slice(1)
    return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`
  }
  return phone
}

// Generate article: type + count -> "APT-001"
export function generateArticle(prefix: string, count: number): string {
  return `${prefix}-${String(count).padStart(3, '0')}`
}

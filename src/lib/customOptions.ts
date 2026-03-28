// All customizable option lists stored in localStorage

export interface OptionList {
  key: string
  label: string  // display name for the settings UI
  defaults: string[]
}

export const OPTION_LISTS: OptionList[] = [
  {
    key: 'crm_districts',
    label: 'Районы',
    defaults: ['Центр', 'Северный', 'Южный', 'Западный', 'Восточный', 'Новый город', 'Старый город', 'Микрорайон', 'ПМР', 'Левый берег', 'Правый берег'],
  },
  {
    key: 'crm_room_types',
    label: 'Типы комнат',
    defaults: ['изолированные', 'смежные', 'смежно-изолированные', 'студия'],
  },
  {
    key: 'crm_bathroom_types',
    label: 'Санузел',
    defaults: ['раздельный', 'совмещённый', '2 санузла', '3+ санузла'],
  },
  {
    key: 'crm_renovation',
    label: 'Ремонт',
    defaults: ['без ремонта', 'черновая отделка', 'чистовая отделка', 'дизайнерский ремонт', 'евроремонт', 'требует ремонта'],
  },
  {
    key: 'crm_sale_methods',
    label: 'Способы продажи',
    defaults: ['свободная продажа', 'ипотека', 'материнский капитал', 'военная ипотека', 'рассрочка', 'трейд-ин'],
  },
  {
    key: 'crm_furniture',
    label: 'Мебель',
    defaults: ['без мебели', 'кухонный гарнитур', 'мебель в комнатах', 'полностью меблированная', 'встроенные шкафы'],
  },
  {
    key: 'crm_window_views',
    label: 'Вид из окна',
    defaults: ['во двор', 'на улицу', 'на парк', 'на горы', 'на море', 'на лес'],
  },
  {
    key: 'crm_pricing_labels',
    label: 'Названия условий сделки (ЖК)',
    defaults: [
      'Наличный расчёт',
      'Семейная ипотека 6%',
      'Эскроу счета',
      'Рассрочка 6 мес',
      'Рассрочка 12 мес',
      'Рассрочка 18 мес',
      'Рассрочка 24 мес',
      'Рассрочка 36 мес',
      'Рассрочка 48 мес',
      'Рассрочка 60 мес',
    ],
  },
]

// Keys for pricing labels that correspond to pricing object keys
export const PRICING_KEYS = ['cash', 'family_mortgage', 'escrow', 'installment_6m', 'installment_12m', 'installment_18m', 'installment_24m', 'installment_36m', 'installment_48m', 'installment_60m']

export function getOptions(key: string): string[] {
  const list = OPTION_LISTS.find((l) => l.key === key)
  if (!list) return []
  try {
    const saved: string[] = JSON.parse(localStorage.getItem(key) ?? '[]')
    // For districts: merge defaults + saved
    // For pricing_labels: use saved if present, else defaults (full replacement)
    if (key === 'crm_pricing_labels') {
      return saved.length > 0 ? saved : [...list.defaults]
    }
    return Array.from(new Set([...list.defaults, ...saved]))
  } catch {
    return [...list.defaults]
  }
}

export function setOptions(key: string, options: string[]) {
  try {
    const list = OPTION_LISTS.find((l) => l.key === key)
    if (!list) return
    if (key === 'crm_pricing_labels') {
      // Store full array for pricing labels
      localStorage.setItem(key, JSON.stringify(options))
    } else {
      // Store only additions beyond defaults
      const extras = options.filter((o) => !list.defaults.includes(o))
      // But also store deletions as a separate key
      const deleted = list.defaults.filter((d) => !options.includes(d))
      localStorage.setItem(key, JSON.stringify(extras))
      localStorage.setItem(key + '_deleted', JSON.stringify(deleted))
    }
  } catch { /* ignore */ }
}

export function getOptionsWithDeletions(key: string): string[] {
  const list = OPTION_LISTS.find((l) => l.key === key)
  if (!list) return []
  try {
    if (key === 'crm_pricing_labels') {
      const saved: string[] = JSON.parse(localStorage.getItem(key) ?? '[]')
      return saved.length > 0 ? saved : [...list.defaults]
    }
    const extras: string[] = JSON.parse(localStorage.getItem(key) ?? '[]')
    const deleted: string[] = JSON.parse(localStorage.getItem(key + '_deleted') ?? '[]')
    const base = list.defaults.filter((d) => !deleted.includes(d))
    return Array.from(new Set([...base, ...extras]))
  } catch {
    return [...list.defaults]
  }
}

export function resetOptions(key: string) {
  localStorage.removeItem(key)
  localStorage.removeItem(key + '_deleted')
}

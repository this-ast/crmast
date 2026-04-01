import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface NavSection {
  id: string
  label: string
  hidden: boolean
}

const DEFAULT_SECTIONS: NavSection[] = [
  { id: 'dashboard',   label: 'Дашборд',   hidden: false },
  { id: 'properties',  label: 'Объекты',   hidden: false },
  { id: 'complexes',   label: 'ЖК',        hidden: false },
  { id: 'clients',     label: 'Клиенты',   hidden: false },
  { id: 'deals',       label: 'Сделки',    hidden: false },
  { id: 'demands',     label: 'Спрос',     hidden: false },
  { id: 'collections', label: 'Подборки',  hidden: false },
  { id: 'templates',   label: 'Шаблоны',   hidden: false },
]

interface UISettingsState {
  sections: NavSection[]
  toggleSection: (id: string) => void
  renameSection: (id: string, label: string) => void
  moveSection: (id: string, dir: 'up' | 'down') => void
  resetSections: () => void
}

export const useUISettings = create<UISettingsState>()(
  persist(
    (set) => ({
      sections: DEFAULT_SECTIONS,


      toggleSection: (id) =>
        set((s) => ({
          sections: s.sections.map((sec) =>
            sec.id === id ? { ...sec, hidden: !sec.hidden } : sec
          ),
        })),

      renameSection: (id, label) =>
        set((s) => ({
          sections: s.sections.map((sec) =>
            sec.id === id ? { ...sec, label } : sec
          ),
        })),

      moveSection: (id, dir) =>
        set((s) => {
          const arr = [...s.sections]
          const idx = arr.findIndex((sec) => sec.id === id)
          if (dir === 'up' && idx > 0) {
            ;[arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]
          } else if (dir === 'down' && idx < arr.length - 1) {
            ;[arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]]
          }
          return { sections: arr }
        }),

      resetSections: () => set({ sections: DEFAULT_SECTIONS }),
    }),
    {
      name: 'crm_ui_settings',
      // При загрузке из localStorage добавляем новые разделы, которых ещё нет в сохранённых
      merge: (persisted: unknown, current: UISettingsState): UISettingsState => {
        const saved = persisted as UISettingsState | undefined
        if (!saved?.sections) return current
        const savedIds = new Set(saved.sections.map((s) => s.id))
        const newSections = DEFAULT_SECTIONS.filter((s) => !savedIds.has(s.id))
        return {
          ...current,
          ...saved,
          sections: [...saved.sections, ...newSections],
        }
      },
    }
  )
)

export { DEFAULT_SECTIONS }

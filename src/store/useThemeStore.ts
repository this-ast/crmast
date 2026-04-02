import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ColorMode   = 'light' | 'dark' | 'auto'
export type PrimaryColor = 'blue' | 'violet' | 'emerald' | 'rose' | 'amber' | 'cyan' | 'indigo'
export type DesignStyle = 'minimal' | 'corporate' | 'dynamic'
export type DensityMode = 'compact' | 'default' | 'comfortable'
export type FontFamily  = 'system' | 'inter' | 'roboto' | 'nunito'
export type FontSize    = 'sm' | 'md' | 'lg'
export type AnimLevel   = 'none' | 'minimal' | 'standard'

export interface ThemePreset {
  id: string
  name: string
  colorMode: ColorMode
  primary: PrimaryColor
  style: DesignStyle
  density: DensityMode
  font: FontFamily
  isBuiltIn?: boolean
}

// ─── Built-in presets ──────────────────────────────────────────────────────────

export const BUILT_IN_PRESETS: ThemePreset[] = [
  { id: 'business',  name: 'Бизнес',        colorMode: 'light', primary: 'blue',    style: 'corporate',  density: 'default',     font: 'inter',  isBuiltIn: true },
  { id: 'dark-pro',  name: 'Тёмный PRO',    colorMode: 'dark',  primary: 'violet',  style: 'dynamic',    density: 'compact',     font: 'inter',  isBuiltIn: true },
  { id: 'minimal',   name: 'Минимализм',    colorMode: 'light', primary: 'indigo',  style: 'minimal',    density: 'comfortable', font: 'system', isBuiltIn: true },
  { id: 'elegant',   name: 'Элегантный',    colorMode: 'dark',  primary: 'emerald', style: 'minimal',    density: 'comfortable', font: 'nunito', isBuiltIn: true },
]

// ─── Color palettes (all override the blue-* scale so all primary usages shift) ─

export const PRIMARY_COLORS: Record<PrimaryColor, {
  label: string
  hex: string
  palette: Record<string, string>
}> = {
  blue:    { label: 'Синий',       hex: '#3b82f6', palette: {} },
  violet:  { label: 'Фиолетовый', hex: '#7c3aed', palette: {
    '--color-blue-50':'#f5f3ff','--color-blue-100':'#ede9fe','--color-blue-200':'#ddd6fe',
    '--color-blue-300':'#c4b5fd','--color-blue-400':'#a78bfa','--color-blue-500':'#8b5cf6',
    '--color-blue-600':'#7c3aed','--color-blue-700':'#6d28d9','--color-blue-800':'#5b21b6',
    '--color-blue-900':'#4c1d95','--color-blue-950':'#2e1065',
  }},
  emerald: { label: 'Изумрудный', hex: '#059669', palette: {
    '--color-blue-50':'#ecfdf5','--color-blue-100':'#d1fae5','--color-blue-200':'#a7f3d0',
    '--color-blue-300':'#6ee7b7','--color-blue-400':'#34d399','--color-blue-500':'#10b981',
    '--color-blue-600':'#059669','--color-blue-700':'#047857','--color-blue-800':'#065f46',
    '--color-blue-900':'#064e3b','--color-blue-950':'#022c22',
  }},
  rose:    { label: 'Розовый',    hex: '#e11d48', palette: {
    '--color-blue-50':'#fff1f2','--color-blue-100':'#ffe4e6','--color-blue-200':'#fecdd3',
    '--color-blue-300':'#fda4af','--color-blue-400':'#fb7185','--color-blue-500':'#f43f5e',
    '--color-blue-600':'#e11d48','--color-blue-700':'#be123c','--color-blue-800':'#9f1239',
    '--color-blue-900':'#881337','--color-blue-950':'#4c0519',
  }},
  amber:   { label: 'Янтарный',   hex: '#d97706', palette: {
    '--color-blue-50':'#fffbeb','--color-blue-100':'#fef3c7','--color-blue-200':'#fde68a',
    '--color-blue-300':'#fcd34d','--color-blue-400':'#fbbf24','--color-blue-500':'#f59e0b',
    '--color-blue-600':'#d97706','--color-blue-700':'#b45309','--color-blue-800':'#92400e',
    '--color-blue-900':'#78350f','--color-blue-950':'#451a03',
  }},
  cyan:    { label: 'Бирюзовый',  hex: '#0891b2', palette: {
    '--color-blue-50':'#ecfeff','--color-blue-100':'#cffafe','--color-blue-200':'#a5f3fc',
    '--color-blue-300':'#67e8f9','--color-blue-400':'#22d3ee','--color-blue-500':'#06b6d4',
    '--color-blue-600':'#0891b2','--color-blue-700':'#0e7490','--color-blue-800':'#155e75',
    '--color-blue-900':'#164e63','--color-blue-950':'#083344',
  }},
  indigo:  { label: 'Индиго',     hex: '#4f46e5', palette: {
    '--color-blue-50':'#eef2ff','--color-blue-100':'#e0e7ff','--color-blue-200':'#c7d2fe',
    '--color-blue-300':'#a5b4fc','--color-blue-400':'#818cf8','--color-blue-500':'#6366f1',
    '--color-blue-600':'#4f46e5','--color-blue-700':'#4338ca','--color-blue-800':'#3730a3',
    '--color-blue-900':'#312e81','--color-blue-950':'#1e1b4b',
  }},
}

// ─── Font options ──────────────────────────────────────────────────────────────

export const FONT_FAMILIES: Record<FontFamily, { label: string; value: string; google?: string }> = {
  system: { label: 'Системный', value: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  inter:  { label: 'Inter',     value: '"Inter", sans-serif',   google: 'Inter:wght@400;500;600;700' },
  roboto: { label: 'Roboto',    value: '"Roboto", sans-serif',  google: 'Roboto:wght@400;500;700' },
  nunito: { label: 'Nunito',    value: '"Nunito", sans-serif',  google: 'Nunito:wght@400;500;600;700' },
}

// ─── Store ─────────────────────────────────────────────────────────────────────

interface ThemeActions {
  setColorMode:  (v: ColorMode)   => void
  setPrimary:    (v: PrimaryColor) => void
  setStyle:      (v: DesignStyle)  => void
  setDensity:    (v: DensityMode)  => void
  setFont:       (v: FontFamily)   => void
  setFontSize:   (v: FontSize)     => void
  setAnimations: (v: AnimLevel)    => void
  setAppleMode:  (v: boolean)      => void
  applyPreset:   (p: ThemePreset)  => void
  savePreset:    (name: string)    => void
  deletePreset:  (id: string)      => void
  reset:         ()                => void
}

export interface ThemeState extends ThemeActions {
  colorMode:     ColorMode
  primary:       PrimaryColor
  style:         DesignStyle
  density:       DensityMode
  font:          FontFamily
  fontSize:      FontSize
  animations:    AnimLevel
  appleMode:     boolean
  customPresets: ThemePreset[]
}

const DEFAULTS: Omit<ThemeState, keyof ThemeActions | 'customPresets'> = {
  colorMode:  'light',
  primary:    'blue',
  style:      'corporate',
  density:    'default',
  font:       'inter',
  fontSize:   'md',
  animations: 'standard',
  appleMode:  false,
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      ...DEFAULTS,
      customPresets: [],

      setColorMode:  (colorMode)  => set({ colorMode }),
      setPrimary:    (primary)    => set({ primary }),
      setStyle:      (style)      => set({ style }),
      setDensity:    (density)    => set({ density }),
      setFont:       (font)       => set({ font }),
      setFontSize:   (fontSize)   => set({ fontSize }),
      setAnimations: (animations) => set({ animations }),
      setAppleMode:  (appleMode)  => set({ appleMode }),

      applyPreset: (p) => set({
        colorMode: p.colorMode, primary: p.primary,
        style: p.style, density: p.density, font: p.font,
      }),

      savePreset: (name) => {
        const { colorMode, primary, style, density, font, customPresets } = get()
        set({ customPresets: [...customPresets, {
          id: `custom-${Date.now()}`, name, colorMode, primary, style, density, font,
        }]})
      },

      deletePreset: (id) => set((s) => ({
        customPresets: s.customPresets.filter((p) => p.id !== id),
      })),

      reset: () => set({ ...DEFAULTS }),
    }),
    { name: 'crm_theme' }
  )
)

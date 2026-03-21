import { useEffect, useState } from 'react'
import { useThemeStore, PRIMARY_COLORS, FONT_FAMILIES } from '@/store/useThemeStore'

// ─── Style overrides per DesignStyle ──────────────────────────────────────────

const STYLE_VARS: Record<string, Record<string, string>> = {
  minimal: {
    '--radius-sm':  '0.125rem',
    '--radius':     '0.25rem',
    '--radius-md':  '0.375rem',
    '--radius-lg':  '0.5rem',
    '--radius-xl':  '0.625rem',
    '--radius-2xl': '0.75rem',
    '--radius-3xl': '1rem',
  },
  corporate: {}, // Tailwind defaults
  dynamic: {
    '--radius-sm':  '0.5rem',
    '--radius':     '0.625rem',
    '--radius-md':  '0.75rem',
    '--radius-lg':  '1rem',
    '--radius-xl':  '1.25rem',
    '--radius-2xl': '1.75rem',
    '--radius-3xl': '2rem',
  },
}

// ─── Dark mode body CSS ────────────────────────────────────────────────────────

const DARK_BODY_CSS = `body{background-color:#0f172a!important;color:#f1f5f9}`
const LIGHT_BODY_CSS = `body{background-color:#f1f5f9;color:#1e293b}`

// ─── ThemeProvider ─────────────────────────────────────────────────────────────

export default function ThemeProvider() {
  const { colorMode, primary, style, density, font, fontSize, animations } = useThemeStore()

  // Track system dark preference for "auto" mode
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const isDark = colorMode === 'dark' || (colorMode === 'auto' && systemDark)

  useEffect(() => {
    const html = document.documentElement

    // ── Data attributes (activate static CSS in index.css) ──────────────────
    html.setAttribute('data-theme',   isDark ? 'dark' : 'light')
    html.setAttribute('data-density', density)
    html.setAttribute('data-style',   style)
    html.setAttribute('data-anim',    animations)

    // ── Build dynamic CSS vars ───────────────────────────────────────────────
    const vars: Record<string, string> = {}

    // Primary color palette override (replaces blue-* scale)
    Object.assign(vars, PRIMARY_COLORS[primary]?.palette ?? {})

    // Font family
    vars['--font-sans'] = FONT_FAMILIES[font].value

    // Border radius per style
    Object.assign(vars, STYLE_VARS[style] ?? {})

    // Density → Tailwind base spacing unit
    if (density === 'compact')     vars['--spacing'] = '0.2rem'
    if (density === 'comfortable') vars['--spacing'] = '0.3rem'

    // ── Assemble CSS string ─────────────────────────────────────────────────
    const cssVars = Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(';')

    const animCSS = animations === 'none'
      ? '*{transition:none!important;animation:none!important}'
      : animations === 'minimal'
      ? '*{transition-duration:0.08s!important}'
      : ''

    const bodyCss = isDark ? DARK_BODY_CSS : LIGHT_BODY_CSS

    const fontSizeCSS = fontSize === 'sm'
      ? 'body{font-size:13px}'
      : fontSize === 'lg'
      ? 'body{font-size:16px}'
      : 'body{font-size:14px}'

    let el = document.getElementById('crm-theme') as HTMLStyleElement | null
    if (!el) {
      el = document.createElement('style')
      el.id = 'crm-theme'
      document.head.appendChild(el)
    }
    el.textContent = `:root{${cssVars}}${bodyCss}${fontSizeCSS}${animCSS}`

    // ── Google Font loader ───────────────────────────────────────────────────
    const googleFont = FONT_FAMILIES[font].google
    if (googleFont) {
      const id = `gfont-${font}`
      if (!document.getElementById(id)) {
        const link = document.createElement('link')
        link.id = id
        link.rel = 'stylesheet'
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(googleFont)}&display=swap`
        document.head.appendChild(link)
      }
    }
  }, [isDark, primary, style, density, font, fontSize, animations])

  return null
}

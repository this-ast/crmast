import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Building2, Users, HeartHandshake,
  Landmark, MessageSquare, Settings, BookMarked,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useUISettings } from '@/store/useUISettings'

const SECTION_ICONS: Record<string, React.ElementType> = {
  dashboard:   LayoutDashboard,
  properties:  Building2,
  complexes:   Landmark,
  clients:     Users,
  deals:       HeartHandshake,
  collections: BookMarked,
  templates:   MessageSquare,
}

const SECTION_ROUTES: Record<string, string> = {
  dashboard:   '/dashboard',
  properties:  '/properties',
  complexes:   '/complexes',
  clients:     '/clients',
  deals:       '/deals',
  collections: '/collections',
  templates:   '/templates',
}

export default function MobileBottomNav() {
  const { sections } = useUISettings()

  // Show max 4 visible sections + settings
  const visible = sections.filter((s) => !s.hidden).slice(0, 4)

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-700 flex items-center safe-area-pb">
      {visible.map(({ id, label }) => {
        const Icon = SECTION_ICONS[id] ?? LayoutDashboard
        const to = SECTION_ROUTES[id] ?? `/${id}`
        return (
          <NavLink
            key={id}
            to={to}
            data-tour={`nav-${id}`}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-center transition-colors min-w-0',
                isActive ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'
              )
            }
          >
            <Icon size={20} />
            <span className="text-[10px] font-medium truncate max-w-full px-1">{label}</span>
          </NavLink>
        )
      })}

      {/* Settings always last */}
      <NavLink
        to="/settings"
        className={({ isActive }) =>
          cn(
            'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-center transition-colors min-w-0',
            isActive ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'
          )
        }
      >
        <Settings size={20} />
        <span className="text-[10px] font-medium">Настройки</span>
      </NavLink>
    </nav>
  )
}

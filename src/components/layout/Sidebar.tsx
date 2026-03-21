import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Building2, Users, HeartHandshake,
  Settings, Landmark, MessageSquare, BookMarked,
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

export default function Sidebar() {
  const { sections } = useUISettings()
  const visibleSections = sections.filter((s) => !s.hidden)

  return (
    <aside className="w-56 bg-slate-900 flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Building2 size={16} className="text-white" />
          </div>
          <span className="text-white font-semibold text-sm">CRM Риэлтора</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {visibleSections.map(({ id, label }) => {
          const Icon = SECTION_ICONS[id] ?? LayoutDashboard
          const to = SECTION_ROUTES[id] ?? `/${id}`
          return (
            <NavLink
              key={id}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          )
        })}
      </nav>

      {/* Settings always visible */}
      <div className="px-2 pb-4">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            )
          }
        >
          <Settings size={18} />
          Настройки
        </NavLink>
      </div>
    </aside>
  )
}

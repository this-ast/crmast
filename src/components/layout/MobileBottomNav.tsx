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
  const visible = sections.filter((s) => !s.hidden)

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-700 safe-area-pb">
      <div
        className="flex overflow-x-auto scrollbar-hide px-1"
        style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}
      >
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
                  'relative flex-shrink-0 flex flex-col items-center justify-center py-3 px-3 gap-1 text-center',
                  'min-w-[64px] transition-all duration-150 ease-out',
                  'active:scale-90 active:opacity-70',
                  isActive
                    ? 'text-blue-400'
                    : 'text-slate-500 hover:text-slate-300'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'transition-transform duration-150',
                      isActive && 'scale-110'
                    )}
                  >
                    <Icon size={22} />
                  </span>
                  <span className="text-[10px] font-medium leading-tight">{label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 w-8 h-0.5 bg-blue-400 rounded-full" />
                  )}
                </>
              )}
            </NavLink>
          )
        })}

        {/* Settings always last */}
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex-shrink-0 flex flex-col items-center justify-center py-3 px-3 gap-1 text-center',
              'min-w-[64px] transition-all duration-150 ease-out',
              'active:scale-90 active:opacity-70',
              isActive
                ? 'text-blue-400'
                : 'text-slate-500 hover:text-slate-300'
            )
          }
        >
          {({ isActive }) => (
            <>
              <span className={cn('transition-transform duration-150', isActive && 'scale-110')}>
                <Settings size={22} />
              </span>
              <span className="text-[10px] font-medium leading-tight">Настройки</span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-blue-400 rounded-full" />
              )}
            </>
          )}
        </NavLink>
      </div>
    </nav>
  )
}

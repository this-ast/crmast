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

function NavItem({ id, label, to }: { id: string; label: string; to: string }) {
  const Icon = SECTION_ICONS[id] ?? LayoutDashboard
  return (
    <NavLink
      to={to}
      data-tour={`nav-${id}`}
      className={({ isActive }) =>
        cn(
          'relative flex-shrink-0 flex flex-col items-center justify-center py-4 px-4 gap-1',
          'min-w-[72px] select-none',
          'transition-all duration-150 ease-out',
          'active:scale-75 active:opacity-60',
          isActive ? 'text-blue-400' : 'text-slate-500'
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={28} strokeWidth={isActive ? 2.2 : 1.8} />
          <span className="text-[11px] font-medium leading-tight">{label}</span>
          {isActive && (
            <span className="absolute bottom-1 w-6 h-0.5 bg-blue-400 rounded-full" />
          )}
        </>
      )}
    </NavLink>
  )
}

export default function MobileBottomNav() {
  const { sections } = useUISettings()
  const visible = sections.filter((s) => !s.hidden)

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-700">
      {/* pb-8 — поднимает кнопки выше iOS home indicator, чтобы не срабатывал system swipe */}
      <div
        className="flex overflow-x-auto scrollbar-hide px-1 pb-8"
        style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        {visible.map(({ id, label }) => (
          <NavItem key={id} id={id} label={label} to={SECTION_ROUTES[id] ?? `/${id}`} />
        ))}

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'relative flex-shrink-0 flex flex-col items-center justify-center py-4 px-4 gap-1',
              'min-w-[72px] select-none',
              'transition-all duration-150 ease-out',
              'active:scale-75 active:opacity-60',
              isActive ? 'text-blue-400' : 'text-slate-500'
            )
          }
        >
          {({ isActive }) => (
            <>
              <Settings size={28} strokeWidth={isActive ? 2.2 : 1.8} />
              <span className="text-[11px] font-medium leading-tight">Настройки</span>
              {isActive && (
                <span className="absolute bottom-1 w-6 h-0.5 bg-blue-400 rounded-full" />
              )}
            </>
          )}
        </NavLink>
      </div>
    </nav>
  )
}

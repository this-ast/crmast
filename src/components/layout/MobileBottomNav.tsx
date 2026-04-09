import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Building2, Users, HeartHandshake,
  Landmark, MessageSquare, Settings, BookMarked,
  Eye, EyeOff, ArrowRight,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useUISettings } from '@/store/useUISettings'
import { useClientMode } from '@/store/useClientMode'

const SECTION_ICONS: Record<string, React.ElementType> = {
  dashboard:   LayoutDashboard,
  properties:  Building2,
  complexes:   Landmark,
  clients:     Users,
  deals:       HeartHandshake,
  demands:     ArrowRight,
  collections: BookMarked,
  templates:   MessageSquare,
}

const SECTION_ROUTES: Record<string, string> = {
  dashboard:   '/dashboard',
  properties:  '/properties',
  complexes:   '/complexes',
  clients:     '/clients',
  deals:       '/deals',
  demands:     '/demands',
  collections: '/collections',
  templates:   '/templates',
}

// ─── Individual nav item ──────────────────────────────────────────────────────

function NavItem({ id, label, to }: { id: string; label: string; to: string }) {
  const Icon = SECTION_ICONS[id] ?? LayoutDashboard
  return (
    <NavLink
      to={to}
      data-tour={`nav-${id}`}
      className="relative flex-shrink-0 flex flex-col items-center justify-center gap-1 px-3.5 py-2.5 select-none transition-all duration-200 ease-out active:scale-75 active:opacity-60 min-w-[64px]"
    >
      {({ isActive }) => (
        <>
          {/* Active glass bubble */}
          {isActive && (
            <span
              className="absolute inset-0 rounded-2xl"
              style={{
                background: 'linear-gradient(145deg, rgba(255,255,255,0.22), rgba(255,255,255,0.08))',
                boxShadow: '0 0 0 0.5px rgba(255,255,255,0.25) inset, 0 2px 8px rgba(0,0,0,0.2)',
              }}
            />
          )}
          <Icon
            size={24}
            strokeWidth={isActive ? 2.2 : 1.6}
            className={cn(
              'relative z-10 transition-all duration-200',
              isActive ? 'text-white drop-shadow-[0_0_8px_rgba(120,180,255,0.8)]' : 'text-white/45'
            )}
          />
          <span
            className={cn(
              'relative z-10 text-[10px] font-medium leading-tight transition-all duration-200',
              isActive ? 'text-white' : 'text-white/40'
            )}
          >
            {label}
          </span>
        </>
      )}
    </NavLink>
  )
}

// ─── Bottom nav ───────────────────────────────────────────────────────────────

export default function MobileBottomNav() {
  const { sections } = useUISettings()
  const visible = sections.filter((s) => !s.hidden)
  const { isClientMode, toggle } = useClientMode()

  return (
    <>
      {/* Floating glass bar */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pointer-events-none"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 10px)' }}
      >
        {/* Client mode chip */}
        {isClientMode && (
          <div
            className="pointer-events-auto mx-auto mb-2 w-fit px-4 py-1 rounded-full text-white text-[11px] font-bold tracking-wide text-center"
            style={{
              background: 'rgba(245, 158, 11, 0.85)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: '0 2px 12px rgba(245,158,11,0.4)',
            } as React.CSSProperties}
          >
            👁 РЕЖИМ КЛИЕНТА
          </div>
        )}

        {/* Main pill */}
        <div
          className="pointer-events-auto rounded-[28px] overflow-hidden"
          style={{
            background: 'rgba(18, 18, 20, 0.72)',
            backdropFilter: 'blur(48px) saturate(200%) brightness(1.1)',
            WebkitBackdropFilter: 'blur(48px) saturate(200%) brightness(1.1)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            boxShadow: [
              '0 0 0 0.5px rgba(255,255,255,0.07) inset',
              '0 -1px 0 rgba(255,255,255,0.12) inset',
              '0 12px 48px rgba(0,0,0,0.55)',
              '0 4px 16px rgba(0,0,0,0.3)',
              '0 1px 4px rgba(0,0,0,0.2)',
            ].join(', '),
          } as React.CSSProperties}
        >
          {/* Specular top-edge shimmer */}
          <div
            className="absolute top-0 left-6 right-6 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)' }}
          />

          <div
            className="flex overflow-x-auto scrollbar-hide px-2 py-1.5"
            style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
          >
            {visible.map(({ id, label }) => (
              <NavItem key={id} id={id} label={label} to={SECTION_ROUTES[id] ?? `/${id}`} />
            ))}

            {/* Settings */}
            <NavLink
              to="/settings"
              className="relative flex-shrink-0 flex flex-col items-center justify-center gap-1 px-3.5 py-2.5 select-none transition-all duration-200 ease-out active:scale-75 active:opacity-60 min-w-[64px]"
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      className="absolute inset-0 rounded-2xl"
                      style={{
                        background: 'linear-gradient(145deg, rgba(255,255,255,0.22), rgba(255,255,255,0.08))',
                        boxShadow: '0 0 0 0.5px rgba(255,255,255,0.25) inset, 0 2px 8px rgba(0,0,0,0.2)',
                      }}
                    />
                  )}
                  <Settings
                    size={24}
                    strokeWidth={isActive ? 2.2 : 1.6}
                    className={cn(
                      'relative z-10 transition-all duration-200',
                      isActive ? 'text-white drop-shadow-[0_0_8px_rgba(120,180,255,0.8)]' : 'text-white/45'
                    )}
                  />
                  <span
                    className={cn(
                      'relative z-10 text-[10px] font-medium leading-tight transition-all duration-200',
                      isActive ? 'text-white' : 'text-white/40'
                    )}
                  >
                    Настройки
                  </span>
                </>
              )}
            </NavLink>
          </div>
        </div>
      </nav>

      {/* Client mode toggle button */}
      <button
        onClick={toggle}
        className={cn(
          'lg:hidden fixed z-50 p-3 rounded-full shadow-lg transition-all duration-200',
          'active:scale-90',
          isClientMode
            ? 'bg-amber-500 text-white shadow-amber-500/40'
            : 'text-white/70 hover:text-white'
        )}
        style={{
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 88px)',
          right: '16px',
          ...(!isClientMode && {
            background: 'rgba(30, 30, 32, 0.7)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }),
        } as React.CSSProperties}
        title={isClientMode ? 'Выйти из режима клиента' : 'Режим клиента'}
      >
        {isClientMode ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </>
  )
}

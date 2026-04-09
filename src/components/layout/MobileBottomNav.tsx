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

// ─── Liquid-glass active chip ─────────────────────────────────────────────────

const activeChipStyle: React.CSSProperties = {
  background: 'linear-gradient(160deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.10) 55%, rgba(255,255,255,0.04) 100%)',
  boxShadow: [
    '0 0 0 0.75px rgba(255,255,255,0.35) inset',
    '0 1.5px 0 rgba(255,255,255,0.45) inset',
    '0 -0.5px 0 rgba(0,0,0,0.25) inset',
    '0 4px 16px rgba(0,0,0,0.35)',
    '0 1px 4px rgba(0,0,0,0.20)',
  ].join(', '),
}

// ─── Nav item ─────────────────────────────────────────────────────────────────

function NavItem({ id, label, to }: { id: string; label: string; to: string }) {
  const Icon = SECTION_ICONS[id] ?? LayoutDashboard
  return (
    <NavLink
      to={to}
      data-tour={`nav-${id}`}
      className="relative flex-shrink-0 flex flex-col items-center justify-center gap-[3px] px-3.5 py-2.5 select-none min-w-[60px] active:scale-[0.72] active:opacity-60"
      style={{ transition: 'transform 0.14s cubic-bezier(0.34,1.56,0.64,1), opacity 0.14s ease' }}
    >
      {({ isActive }) => (
        <>
          {/* Raised glass chip */}
          {isActive && (
            <span className="absolute inset-0 rounded-[18px]" style={activeChipStyle} />
          )}

          {/* Icon */}
          <Icon
            size={22}
            strokeWidth={isActive ? 2.3 : 1.55}
            className="relative z-10 transition-all duration-200"
            style={{
              color: isActive ? '#ffffff' : 'rgba(255,255,255,0.40)',
              filter: isActive
                ? 'drop-shadow(0 0 6px rgba(160,210,255,0.85)) drop-shadow(0 0 12px rgba(100,170,255,0.45))'
                : 'none',
            }}
          />

          {/* Label */}
          <span
            className="relative z-10 text-[9.5px] font-semibold leading-tight tracking-wide transition-all duration-200"
            style={{ color: isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.35)' }}
          >
            {label}
          </span>
        </>
      )}
    </NavLink>
  )
}

// ─── Bottom nav ───────────────────────────────────────────────────────────────

const barStyle: React.CSSProperties = {
  background: 'rgba(22, 22, 26, 0.76)',
  backdropFilter: 'blur(64px) saturate(230%) brightness(1.14)',
  WebkitBackdropFilter: 'blur(64px) saturate(230%) brightness(1.14)',
  border: '1px solid rgba(255,255,255,0.14)',
  boxShadow: [
    // inner top-edge specular highlight (the "liquid glass" glint)
    '0 1px 0 rgba(255,255,255,0.18) inset',
    '0 0 0 0.5px rgba(255,255,255,0.06) inset',
    // outer depth shadows
    '0 20px 72px rgba(0,0,0,0.65)',
    '0 8px 28px rgba(0,0,0,0.40)',
    '0 2px 8px rgba(0,0,0,0.25)',
  ].join(', '),
}

export default function MobileBottomNav() {
  const { sections } = useUISettings()
  const visible = sections.filter((s) => !s.hidden)
  const { isClientMode, toggle } = useClientMode()

  return (
    <>
      {/* ── Floating Liquid Glass bar ── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pointer-events-none"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 10px)' }}
      >
        {/* Client mode indicator */}
        {isClientMode && (
          <div
            className="pointer-events-auto mx-auto mb-2 w-fit px-4 py-1 rounded-full text-white text-[11px] font-bold tracking-wide"
            style={{
              background: 'rgba(245,158,11,0.88)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              boxShadow: '0 2px 14px rgba(245,158,11,0.45)',
            }}
          >
            👁 РЕЖИМ КЛИЕНТА
          </div>
        )}

        {/* Glass pill */}
        <div className="pointer-events-auto rounded-[30px] relative overflow-hidden" style={barStyle}>

          {/* Prismatic top-edge shimmer (refraction effect) */}
          <div
            className="absolute top-0 left-[15%] right-[15%] h-px pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), rgba(210,230,255,0.40), rgba(255,220,255,0.25), rgba(255,255,255,0.55), transparent)',
              opacity: 0.85,
            }}
          />

          {/* Subtle inner glass reflection gradient */}
          <div
            className="absolute top-0 left-0 right-0 pointer-events-none"
            style={{
              height: '45%',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.055) 0%, transparent 100%)',
            }}
          />

          {/* Scrollable row */}
          <div
            className="flex overflow-x-auto scrollbar-hide px-1.5 py-1"
            style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
          >
            {visible.map(({ id, label }) => (
              <NavItem key={id} id={id} label={label} to={SECTION_ROUTES[id] ?? `/${id}`} />
            ))}

            {/* Settings item */}
            <NavLink
              to="/settings"
              className="relative flex-shrink-0 flex flex-col items-center justify-center gap-[3px] px-3.5 py-2.5 select-none min-w-[60px] active:scale-[0.72] active:opacity-60"
              style={{ transition: 'transform 0.14s cubic-bezier(0.34,1.56,0.64,1), opacity 0.14s ease' }}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute inset-0 rounded-[18px]" style={activeChipStyle} />
                  )}
                  <Settings
                    size={22}
                    strokeWidth={isActive ? 2.3 : 1.55}
                    className="relative z-10 transition-all duration-200"
                    style={{
                      color: isActive ? '#ffffff' : 'rgba(255,255,255,0.40)',
                      filter: isActive
                        ? 'drop-shadow(0 0 6px rgba(160,210,255,0.85)) drop-shadow(0 0 12px rgba(100,170,255,0.45))'
                        : 'none',
                    }}
                  />
                  <span
                    className="relative z-10 text-[9.5px] font-semibold leading-tight tracking-wide transition-all duration-200"
                    style={{ color: isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.35)' }}
                  >
                    Настройки
                  </span>
                </>
              )}
            </NavLink>
          </div>
        </div>
      </nav>

      {/* ── Client mode toggle ── */}
      <button
        onClick={toggle}
        className={cn(
          'lg:hidden fixed z-50 p-3 rounded-full shadow-lg',
          'active:scale-90',
          isClientMode ? 'bg-amber-500 text-white shadow-amber-500/40' : 'text-white/70 hover:text-white'
        )}
        style={{
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 90px)',
          right: '16px',
          transition: 'transform 0.14s cubic-bezier(0.34,1.56,0.64,1)',
          ...(!isClientMode && {
            background: 'rgba(26, 26, 30, 0.72)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.13)',
            boxShadow: '0 4px 22px rgba(0,0,0,0.45)',
          }),
        } as React.CSSProperties}
        title={isClientMode ? 'Выйти из режима клиента' : 'Режим клиента'}
      >
        {isClientMode ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </>
  )
}

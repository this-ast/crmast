import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  Users,
  Handshake,
  Calendar,
  FileText,
  BarChart3,
  Settings,
  X,
  Home,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Дашборд', href: '/', icon: LayoutDashboard },
  { name: 'Объекты', href: '/properties', icon: Building2 },
  { name: 'Клиенты', href: '/clients', icon: Users },
  { name: 'Сделки', href: '/deals', icon: Handshake },
  { name: 'Календарь', href: '/calendar', icon: Calendar },
  { name: 'Документы', href: '/documents', icon: FileText },
  { name: 'Отчёты', href: '/reports', icon: BarChart3 },
  { name: 'Настройки', href: '/settings', icon: Settings },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar-bg transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Home className="h-6 w-6 text-primary-400" />
            <span className="text-lg font-bold text-white">CRM Недвижимость</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-sidebar-text hover:bg-sidebar-hover lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navigation.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-active text-white'
                    : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white'
                )
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <p className="text-xs text-sidebar-text/60">CRM v1.0.0</p>
        </div>
      </aside>
    </>
  )
}

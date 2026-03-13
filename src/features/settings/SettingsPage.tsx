import { NavLink, Outlet } from 'react-router-dom'
import { User, Building2, Bell, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { name: 'Профиль', href: '/settings/profile', icon: User },
  { name: 'Агентство', href: '/settings/agency', icon: Building2 },
  { name: 'Уведомления', href: '/settings/notifications', icon: Bell },
  { name: 'Безопасность', href: '/settings/security', icon: Lock },
]

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Настройки</h1>
        <p className="mt-1 text-text-secondary">
          Управление профилем и параметрами приложения
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <nav className="flex gap-1 overflow-x-auto lg:w-56 lg:shrink-0 lg:flex-col">
          {tabs.map((tab) => (
            <NavLink
              key={tab.href}
              to={tab.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300'
                    : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                )
              }
            >
              <tab.icon className="h-4 w-4" />
              {tab.name}
            </NavLink>
          ))}
        </nav>

        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

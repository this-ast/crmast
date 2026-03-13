import { useState, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react'
import {
  Menu as MenuIcon,
  Search,
  Bell,
  Sun,
  Moon,
  User,
  Settings,
  LogOut,
} from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useTheme } from '@/hooks/useTheme'
import { Avatar } from '@/components/ui'
import { cn } from '@/lib/utils'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { profile, signOut } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-text-secondary hover:bg-surface-hover lg:hidden"
        >
          <MenuIcon className="h-5 w-5" />
        </button>

        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Поиск клиентов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                navigate(`/clients?q=${encodeURIComponent(searchQuery.trim())}`)
                setSearchQuery('')
              }
            }}
            className="h-9 w-64 rounded-lg border border-border bg-surface-secondary pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 lg:w-80"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggle}
          className="rounded-lg p-2 text-text-secondary hover:bg-surface-hover transition-colors"
          title={theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}
        >
          {theme === 'light' ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </button>

        <button
          onClick={() => navigate('/settings/notifications')}
          className="relative rounded-lg p-2 text-text-secondary hover:bg-surface-hover transition-colors"
          title="Уведомления"
        >
          <Bell className="h-5 w-5" />
        </button>

        <Menu as="div" className="relative">
          <MenuButton className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-surface-hover transition-colors">
            <Avatar
              src={profile?.avatar_url}
              name={profile?.full_name || 'Пользователь'}
              size="sm"
            />
            <span className="hidden text-sm font-medium text-text-primary md:block">
              {profile?.full_name || 'Пользователь'}
            </span>
          </MenuButton>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <MenuItems className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-surface py-1 shadow-lg focus:outline-none">
              <div className="border-b border-border px-4 py-3">
                <p className="text-sm font-medium text-text-primary">
                  {profile?.full_name}
                </p>
                <p className="text-xs text-text-secondary">{profile?.email}</p>
              </div>

              <MenuItem>
                {({ focus }) => (
                  <button
                    onClick={() => navigate('/settings/profile')}
                    className={cn(
                      'flex w-full items-center gap-2 px-4 py-2 text-sm text-text-primary',
                      focus && 'bg-surface-hover'
                    )}
                  >
                    <User className="h-4 w-4" />
                    Мой профиль
                  </button>
                )}
              </MenuItem>
              <MenuItem>
                {({ focus }) => (
                  <button
                    onClick={() => navigate('/settings')}
                    className={cn(
                      'flex w-full items-center gap-2 px-4 py-2 text-sm text-text-primary',
                      focus && 'bg-surface-hover'
                    )}
                  >
                    <Settings className="h-4 w-4" />
                    Настройки
                  </button>
                )}
              </MenuItem>

              <div className="border-t border-border">
                <MenuItem>
                  {({ focus }) => (
                    <button
                      onClick={handleSignOut}
                      className={cn(
                        'flex w-full items-center gap-2 px-4 py-2 text-sm text-danger-600',
                        focus && 'bg-surface-hover'
                      )}
                    >
                      <LogOut className="h-4 w-4" />
                      Выйти
                    </button>
                  )}
                </MenuItem>
              </div>
            </MenuItems>
          </Transition>
        </Menu>
      </div>
    </header>
  )
}

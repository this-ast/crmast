import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import MobileBottomNav from './MobileBottomNav'
import OnboardingTour from '@/components/onboarding/OnboardingTour'
import NetworkStatusBar from '@/components/ui/NetworkStatusBar'
import { useOnboarding } from '@/store/useOnboarding'
import { useSync } from '@/hooks/useSync'

export default function Layout() {
  const { hasCompleted, start } = useOnboarding()
  useSync() // инициализация сети + авто-синхронизация

  // Auto-start tour for new users
  useEffect(() => {
    if (!hasCompleted) {
      const t = setTimeout(start, 800)
      return () => clearTimeout(t)
    }
  }, []) // eslint-disable-line

  return (
    <div className="flex h-[100dvh] bg-slate-100 overflow-hidden">
      {/* Offline / sync status bar */}
      <NetworkStatusBar />

      {/* Sidebar — desktop only */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
        <Outlet />
      </main>

      {/* Bottom nav — mobile only */}
      <MobileBottomNav />

      {/* Onboarding tour overlay */}
      <OnboardingTour />
    </div>
  )
}

import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Sidebar from './Sidebar'
import MobileBottomNav from './MobileBottomNav'
import OnboardingTour from '@/components/onboarding/OnboardingTour'
import NetworkStatusBar from '@/components/ui/NetworkStatusBar'
import CrossSectionPreview from '@/components/ui/CrossSectionPreview'
import { useOnboarding } from '@/store/useOnboarding'
import { useSync } from '@/hooks/useSync'

const pageVariants = {
  initial:  { opacity: 0, y: 10 },
  animate:  { opacity: 1, y: 0 },
  exit:     { opacity: 0, y: -6 },
}

const pageTransition = { duration: 0.18, ease: [0.4, 0, 0.2, 1] as const }

export default function Layout() {
  const { hasCompleted, start } = useOnboarding()
  const location = useLocation()
  useSync()

  useEffect(() => {
    if (!hasCompleted) {
      const t = setTimeout(start, 800)
      return () => clearTimeout(t)
    }
  }, []) // eslint-disable-line

  return (
    <div className="flex h-[100dvh] bg-slate-100 overflow-hidden">
      <NetworkStatusBar />

      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      <main className="flex-1 overflow-x-hidden overflow-y-auto lg:pb-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
        {/* Spacer so content isn't hidden behind mobile bottom nav + safe area */}
        <div
          className="lg:hidden shrink-0"
          style={{ height: 'calc(env(safe-area-inset-bottom, 0px) + 130px)' }}
          aria-hidden="true"
        />
      </main>

      <MobileBottomNav />
      <OnboardingTour />
      <CrossSectionPreview />
    </div>
  )
}

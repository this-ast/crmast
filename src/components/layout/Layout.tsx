import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import MobileBottomNav from './MobileBottomNav'

export default function Layout() {
  return (
    <div className="flex h-[100dvh] bg-slate-100 overflow-hidden">
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
    </div>
  )
}

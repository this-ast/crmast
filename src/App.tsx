import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import { Loader2 } from 'lucide-react'

const DashboardPage        = lazy(() => import('@/pages/DashboardPage'))
const PropertiesPage       = lazy(() => import('@/pages/PropertiesPage'))
const ClientsPage          = lazy(() => import('@/pages/ClientsPage'))
const ComplexesPage        = lazy(() => import('@/pages/ComplexesPage'))
const DealsPage            = lazy(() => import('@/pages/DealsPage'))
const TemplatesPage        = lazy(() => import('@/pages/TemplatesPage'))
const SettingsPage         = lazy(() => import('@/pages/SettingsPage'))
const CollectionsPage      = lazy(() => import('@/pages/CollectionsPage'))
const DemandsPage          = lazy(() => import('@/pages/DemandsPage'))
const CollectionPublicPage = lazy(() => import('@/pages/CollectionPublicPage'))
const PropertyPublicPage   = lazy(() => import('@/pages/PropertyPublicPage'))
const ComplexPublicPage    = lazy(() => import('@/pages/ComplexPublicPage'))
const UnitPublicPage       = lazy(() => import('@/pages/UnitPublicPage'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-48">
      <Loader2 size={24} className="animate-spin text-blue-500" />
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public pages — no auth, no layout */}
        <Route path="/share/:slug" element={<CollectionPublicPage />} />
        <Route path="/p/:id" element={<PropertyPublicPage />} />
        <Route path="/c/:id" element={<ComplexPublicPage />} />
        <Route path="/u/:id" element={<UnitPublicPage />} />

        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="properties" element={<PropertiesPage />} />
          <Route path="complexes" element={<ComplexesPage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="deals" element={<DealsPage />} />
          <Route path="demands" element={<DemandsPage />} />
          <Route path="collections" element={<CollectionsPage />} />
          <Route path="templates" element={<TemplatesPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

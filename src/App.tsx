import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import DashboardPage from '@/pages/DashboardPage'
import PropertiesPage from '@/pages/PropertiesPage'
import ClientsPage from '@/pages/ClientsPage'
import ComplexesPage from '@/pages/ComplexesPage'
import DealsPage from '@/pages/DealsPage'
import TemplatesPage from '@/pages/TemplatesPage'
import SettingsPage from '@/pages/SettingsPage'
import CollectionsPage from '@/pages/CollectionsPage'
import CollectionPublicPage from '@/pages/CollectionPublicPage'
import PropertyPublicPage from '@/pages/PropertyPublicPage'
import ComplexPublicPage from '@/pages/ComplexPublicPage'

export default function App() {
  return (
    <Routes>
      {/* Public pages — no auth, no layout */}
      <Route path="/share/:slug" element={<CollectionPublicPage />} />
      <Route path="/p/:id" element={<PropertyPublicPage />} />
      <Route path="/c/:id" element={<ComplexPublicPage />} />

      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="properties" element={<PropertiesPage />} />
        <Route path="complexes" element={<ComplexesPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="deals" element={<DealsPage />} />
        <Route path="collections" element={<CollectionsPage />} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}

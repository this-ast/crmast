import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import DashboardPage from '@/pages/DashboardPage'
import PropertiesPage from '@/pages/PropertiesPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="properties" element={<PropertiesPage />} />
      </Route>
    </Routes>
  )
}

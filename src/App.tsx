import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/lib/auth'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'

import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage'

import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { PropertiesPage } from '@/features/properties/PropertiesPage'
import { ClientsPage } from '@/features/clients/ClientsPage'
import { DealsPage } from '@/features/deals/DealsPage'
import { CalendarPage } from '@/features/calendar/CalendarPage'
import { DocumentsPage } from '@/features/documents/DocumentsPage'
import { ReportsPage } from '@/features/reports/ReportsPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { ProfileSettings } from '@/features/settings/ProfileSettings'
import { AgencySettings } from '@/features/settings/AgencySettings'
import { NotificationSettings } from '@/features/settings/NotificationSettings'
import { SecuritySettings } from '@/features/settings/SecuritySettings'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: { borderRadius: '12px', padding: '12px 16px', fontSize: '14px' },
              success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
              error: { iconTheme: { primary: '#dc2626', secondary: '#fff' }, duration: 4000 },
            }}
          />
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Protected routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<DashboardPage />} />
              <Route path="/properties" element={<PropertiesPage />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/deals" element={<DealsPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<SettingsPage />}>
                <Route index element={<Navigate to="/settings/profile" replace />} />
                <Route path="profile" element={<ProfileSettings />} />
                <Route path="agency" element={<AgencySettings />} />
                <Route path="notifications" element={<NotificationSettings />} />
                <Route path="security" element={<SecuritySettings />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

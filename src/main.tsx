import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import ThemeProvider from './components/theme/ThemeProvider'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,    // 5 минут
      gcTime: 1000 * 60 * 30,      // 30 минут — дольше держим кэш
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,    // автоматически рефетчим при reconnect
      networkMode: 'always',       // queryFn сам решает offline/online через IDB
      retry: (failureCount, error) => {
        // Не ретраить если нет сети
        if (!navigator.onLine) return false
        return failureCount < 1
      },
    },
    mutations: {
      networkMode: 'always',       // мутации тоже всегда выполняются (queueing внутри)
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider />
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1e293b',
              color: '#f8fafc',
              borderRadius: '8px',
              fontSize: '14px',
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)

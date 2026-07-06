import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './components/ui/Toast'
import { initPWA } from './utils/pwa'
import App from './App'
import './index.css'

initPWA()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes — don't refetch on every mount
      staleTime: 1000 * 60 * 5,
      // Keep unused data in cache for 10 minutes
      gcTime: 1000 * 60 * 10,
      // Don't refetch just because user switched tabs
      refetchOnWindowFocus: false,
      // Don't refetch just because network reconnected
      refetchOnReconnect: false,
      // Retry failed requests twice with exponential backoff
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
      // Show stale data immediately while fetching fresh
      placeholderData: (prev: any) => prev,
    },
    mutations: {
      retry: 0,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
)
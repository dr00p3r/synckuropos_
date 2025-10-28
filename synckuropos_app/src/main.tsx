import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { DatabaseProvider } from '@/hooks/useDatabase'
import { AuthProvider } from '@/hooks/useAuth'
import { ToastProvider } from '@/shared/components/Toast'
import '@/styles/index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DatabaseProvider>
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </DatabaseProvider>
  </StrictMode>,
)

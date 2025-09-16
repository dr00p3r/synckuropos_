import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { DatabaseProvider } from './hooks/useDatabase.tsx'
import { AuthProvider } from './hooks/useAuth.tsx'
import { ToastProvider } from './components/Toast/ToastProvider.tsx'
import './index.css'
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

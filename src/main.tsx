import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { DatabaseProvider } from './hooks/useDatabase.tsx'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DatabaseProvider>
      <App />
    </DatabaseProvider>
  </StrictMode>,
)

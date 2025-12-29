import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PrimeReactProvider } from 'primereact/api';
import { DatabaseProvider } from './hooks/useDatabase.tsx'
import { AuthProvider } from './hooks/useAuth.tsx'
import { ToastProvider } from './hooks/useToast.tsx' 

// El orden de importación es importante para que los estilos se apliquen correctamente
import "primereact/resources/themes/lara-light-teal/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";

import '@/styles/globals.css' 

import App from './App.tsx'
import { configurePrimeReact } from './lib/primereact';

configurePrimeReact();

const uiConfig = {
    ripple: true,
    inputStyle: 'outlined' as const,
    zIndex: {
        modal: 1100,
        overlay: 1000,  
        menu: 1000,     
        tooltip: 1100   
    }
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DatabaseProvider>
      <PrimeReactProvider value={uiConfig}>
          <ToastProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </ToastProvider>
      </PrimeReactProvider>
    </DatabaseProvider>
  </StrictMode>,
)
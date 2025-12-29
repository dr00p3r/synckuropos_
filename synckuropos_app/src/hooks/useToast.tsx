import React, { createContext, useContext, useRef, type ReactNode } from 'react';
import { Toast } from 'primereact/toast';

// 1. Definimos la interfaz de lo que nuestro hook va a exponer
interface ToastContextType {
    showSuccess: (summary: string, detail?: string) => void;
    showInfo: (summary: string, detail?: string) => void;
    showWarn: (summary: string, detail?: string) => void;
    showError: (summary: string, detail?: string) => void;
    clear: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// 2. El Provider que envolverá tu App
export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Referencia al componente Toast de PrimeReact
    const toastRef = useRef<Toast>(null);

    // Funciones helper para simplificar el uso
    const showSuccess = (summary: string, detail?: string) => {
        toastRef.current?.show({ severity: 'success', summary, detail, life: 3000 });
    };

    const showInfo = (summary: string, detail?: string) => {
        toastRef.current?.show({ severity: 'info', summary, detail, life: 3000 });
    };

    const showWarn = (summary: string, detail?: string) => {
        toastRef.current?.show({ severity: 'warn', summary, detail, life: 4000 });
    };

    const showError = (summary: string, detail?: string) => {
        toastRef.current?.show({ severity: 'error', summary, detail, life: 5000 });
    };

    const clear = () => {
        toastRef.current?.clear();
    };

    return (
        <ToastContext.Provider value={{ showSuccess, showInfo, showWarn, showError, clear }}>
            {/* El componente visual de PrimeReact. 
                position="bottom-right" es ideal para POS para no tapar la vista central.
            */}
            <Toast ref={toastRef} position="bottom-right" />
            {children}
        </ToastContext.Provider>
    );
};

// 3. El Hook personalizado
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast debe ser usado dentro de un ToastProvider');
    }
    return context;
};
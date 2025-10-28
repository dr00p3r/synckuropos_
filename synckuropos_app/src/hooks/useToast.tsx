import { useContext } from 'react';
import { ToastContext } from '@/shared/components/Toast/ToastProvider';
import type { Toast } from '@/shared/components/Toast/ToastProvider';

export const useToast = () => {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error('useToast debe ser usado dentro de un ToastProvider');
  }

  return {
    showSuccess: (message: string, duration?: number) => 
      context.addToast(message, 'success', duration),
    
    showError: (message: string, duration?: number) => 
      context.addToast(message, 'error', duration),
    
    showWarning: (message: string, duration?: number) => 
      context.addToast(message, 'warning', duration),
    
    showInfo: (message: string, duration?: number) => 
      context.addToast(message, 'info', duration),
    
    show: (message: string, type?: Toast['type'], duration?: number) => 
      context.addToast(message, type, duration),
  };
};

import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import { ToastProvider } from '../ToastProvider';
import { useToast } from '@/hooks/useToast';
import React from 'react';

const TestComponent = () => {
  const { showSuccess } = useToast();
  return <button onClick={() => showSuccess('Success message')}>Show</button>;
};

describe('ToastProvider Component', () => {
  // Configuración de timers
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should auto-remove toast after duration', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show'));
    
    expect(screen.getByText('Success message')).toBeInTheDocument();

    // Avanzar el tiempo
    act(() => {
      jest.advanceTimersByTime(3500);
    });

    // Usar waitFor para esperar la actualización del DOM
    await waitFor(() => {
      expect(screen.queryByText('Success message')).not.toBeInTheDocument();
    });
  });

  it('should remove toast on click', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show'));
    const toast = screen.getByText('Success message');
    
    fireEvent.click(toast);

    await waitFor(() => {
        expect(screen.queryByText('Success message')).not.toBeInTheDocument();
    });
  });
});
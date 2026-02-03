import * as React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useToast, ToastProvider } from '../useToast';

// Mock PrimeReact Toast
jest.mock('primereact/toast', () => ({
  Toast: React.forwardRef((_props: unknown, ref: React.Ref<{ show: jest.Mock; clear: jest.Mock }>) => {
    React.useImperativeHandle(ref, () => ({
      show: jest.fn(),
      clear: jest.fn(),
    }));
    return null;
  }),
}));

describe('useToast', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    React.createElement(ToastProvider, null, children)
  );

  it('should throw error when used outside ToastProvider', () => {
    expect(() => {
      renderHook(() => useToast());
    }).toThrow('useToast debe ser usado dentro de un ToastProvider');
  });

  it('should return toast functions when used inside ToastProvider', () => {
    const { result } = renderHook(() => useToast(), { wrapper });

    expect(result.current.showSuccess).toBeDefined();
    expect(result.current.showInfo).toBeDefined();
    expect(result.current.showWarn).toBeDefined();
    expect(result.current.showError).toBeDefined();
    expect(result.current.clear).toBeDefined();
  });

  it('should have showSuccess as a function', () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    expect(typeof result.current.showSuccess).toBe('function');
  });

  it('should have showInfo as a function', () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    expect(typeof result.current.showInfo).toBe('function');
  });

  it('should have showWarn as a function', () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    expect(typeof result.current.showWarn).toBe('function');
  });

  it('should have showError as a function', () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    expect(typeof result.current.showError).toBe('function');
  });

  it('should have clear as a function', () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    expect(typeof result.current.clear).toBe('function');
  });

  it('should call showSuccess without throwing', () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    
    expect(() => {
      act(() => {
        result.current.showSuccess('Test', 'Detail');
      });
    }).not.toThrow();
  });

  it('should call showError without throwing', () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    
    expect(() => {
      act(() => {
        result.current.showError('Error', 'Detail');
      });
    }).not.toThrow();
  });

  it('should call showInfo without throwing', () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    
    expect(() => {
      act(() => {
        result.current.showInfo('Info', 'Detail');
      });
    }).not.toThrow();
  });

  it('should call showWarn without throwing', () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    
    expect(() => {
      act(() => {
        result.current.showWarn('Warning', 'Detail');
      });
    }).not.toThrow();
  });

  it('should call clear without throwing', () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    
    expect(() => {
      act(() => {
        result.current.clear();
      });
    }).not.toThrow();
  });
});

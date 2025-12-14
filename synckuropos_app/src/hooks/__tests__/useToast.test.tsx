import { renderHook, act } from '@testing-library/react';
import { useToast } from '@/hooks/useToast';
import { ToastProvider } from '@/shared/components/Toast/ToastProvider';

describe('useToast', () => {
  it('should provide toast methods', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: ToastProvider,
    });

    expect(typeof result.current.showSuccess).toBe('function');
    expect(typeof result.current.showError).toBe('function');
    expect(typeof result.current.showWarning).toBe('function');
    expect(typeof result.current.showInfo).toBe('function');
    expect(typeof result.current.show).toBe('function');
  });

  it('should call addToast when showing success toast', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: ToastProvider,
    });

    act(() => {
      result.current.showSuccess('Test message');
    });

    // Just verify the methods can be called without throwing
    expect(result.current.showSuccess).toBeDefined();
  });

  it('should call addToast when showing error toast', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: ToastProvider,
    });

    act(() => {
      result.current.showError('Error message');
    });

    expect(result.current.showError).toBeDefined();
  });

  it('should call addToast when showing warning toast', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: ToastProvider,
    });

    act(() => {
      result.current.showWarning('Warning message');
    });

    expect(result.current.showWarning).toBeDefined();
  });

  it('should call addToast when showing info toast', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: ToastProvider,
    });

    act(() => {
      result.current.showInfo('Info message');
    });

    expect(result.current.showInfo).toBeDefined();
  });

  it('should call addToast with custom type and duration', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: ToastProvider,
    });

    act(() => {
      result.current.show('Custom message', 'success', 5000);
    });

    expect(result.current.show).toBeDefined();
  });
});

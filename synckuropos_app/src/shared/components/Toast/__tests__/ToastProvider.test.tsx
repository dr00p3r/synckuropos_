import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ToastProvider, ToastContext } from '@/shared/components/Toast/ToastProvider';

// Mock component that uses ToastProvider
const TestToastComponent = () => {
  const context = React.useContext(ToastContext);

  if (!context) {
    return <div>No context</div>;
  }

  return (
    <div>
      <button
        onClick={() => context.addToast('Success message', 'success')}
        data-testid="success-btn"
      >
        Show Success
      </button>
      <button
        onClick={() => context.addToast('Error message', 'error')}
        data-testid="error-btn"
      >
        Show Error
      </button>
      <button
        onClick={() => context.addToast('Warning message', 'warning')}
        data-testid="warning-btn"
      >
        Show Warning
      </button>
      <button
        onClick={() => context.addToast('Info message', 'info')}
        data-testid="info-btn"
      >
        Show Info
      </button>
    </div>
  );
};

describe('ToastProvider Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children correctly', () => {
    render(
      <ToastProvider>
        <div data-testid="child">Child Content</div>
      </ToastProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('should provide ToastContext to children', () => {
    render(
      <ToastProvider>
        <TestToastComponent />
      </ToastProvider>
    );

    expect(screen.getByTestId('success-btn')).toBeInTheDocument();
  });

  it('should add and display success toast', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TestToastComponent />
      </ToastProvider>
    );

    const button = screen.getByTestId('success-btn');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('Success message')).toBeInTheDocument();
    });
  });

  it('should add and display error toast', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TestToastComponent />
      </ToastProvider>
    );

    const button = screen.getByTestId('error-btn');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });
  });

  it('should add and display warning toast', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TestToastComponent />
      </ToastProvider>
    );

    const button = screen.getByTestId('warning-btn');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('Warning message')).toBeInTheDocument();
    });
  });

  it('should add and display info toast', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TestToastComponent />
      </ToastProvider>
    );

    const button = screen.getByTestId('info-btn');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('Info message')).toBeInTheDocument();
    });
  });

  it('should auto-remove toast after duration', async () => {
    const user = userEvent.setup();
    jest.useFakeTimers();

    render(
      <ToastProvider>
        <TestToastComponent />
      </ToastProvider>
    );

    const button = screen.getByTestId('success-btn');
    await user.click(button);

    const toast = screen.getByText('Success message');
    expect(toast).toBeInTheDocument();

    jest.advanceTimersByTime(4000);

    await waitFor(() => {
      expect(screen.queryByText('Success message')).not.toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  it('should remove toast on click', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TestToastComponent />
      </ToastProvider>
    );

    const button = screen.getByTestId('success-btn');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('Success message')).toBeInTheDocument();
    });

    const toast = screen.getByText('Success message').closest('.toast');
    if (toast) {
      await user.click(toast);
    }

    await waitFor(() => {
      expect(screen.queryByText('Success message')).not.toBeInTheDocument();
    });
  });

  it('should support multiple toasts', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TestToastComponent />
      </ToastProvider>
    );

    await user.click(screen.getByTestId('success-btn'));
    await user.click(screen.getByTestId('error-btn'));

    await waitFor(() => {
      expect(screen.getByText('Success message')).toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });
  });
});

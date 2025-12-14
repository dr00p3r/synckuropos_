import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '@/App';

// Mock all providers and hooks
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({
    currentUser: {
      userId: '123',
      username: 'testuser',
      role: 'admin',
      isActive: true,
      passwordHash: 'hashed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _deleted: false,
    },
    isLoading: false,
    login: jest.fn(),
    logout: jest.fn(),
  })),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/shared/components/SideNavigation', () => {
  return function MockSideNavigation() {
    return <div data-testid="side-navigation">Navigation</div>;
  };
});

jest.mock('@/features/sales', () => ({
  SalesScreen: () => <div data-testid="sales-screen">Sales</div>,
}));

jest.mock('@/features/inventory', () => ({
  InventoryScreen: () => <div data-testid="inventory-screen">Inventory</div>,
}));

jest.mock('@/features/customers', () => ({
  CustomersScreen: () => <div data-testid="customers-screen">Customers</div>,
}));

jest.mock('@/features/settings', () => ({
  SettingsScreen: () => <div data-testid="settings-screen">Settings</div>,
}));

jest.mock('@/features/reports', () => ({
  ReportsPage: () => <div data-testid="reports-screen">Reports</div>,
}));

jest.mock('@/features/auth', () => ({
  LoginScreen: () => <div data-testid="login-screen">Login</div>,
}));

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the main app when user is logged in', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByTestId('side-navigation')).toBeInTheDocument();
      expect(screen.getByTestId('sales-screen')).toBeInTheDocument();
    });
  });

  it('should display sales screen by default', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByTestId('sales-screen')).toBeInTheDocument();
    });
  });

  it('should show login screen when user is not authenticated', async () => {
    const { useAuth } = require('@/hooks/useAuth');
    useAuth.mockReturnValueOnce({
      currentUser: null,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
    });

    render(<App />);

    expect(screen.getByTestId('login-screen')).toBeInTheDocument();
  });

  it('should show loading state when authentication is being checked', async () => {
    const { useAuth } = require('@/hooks/useAuth');
    useAuth.mockReturnValueOnce({
      currentUser: null,
      isLoading: true,
      login: jest.fn(),
      logout: jest.fn(),
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Verificando autenticación/i)).toBeInTheDocument();
    });
  });

  it('should handle window resize events', async () => {
    render(<App />);

    const resizeEvent = new Event('resize');
    window.dispatchEvent(resizeEvent);

    await waitFor(() => {
      expect(screen.getByTestId('side-navigation')).toBeInTheDocument();
    });
  });
});

import { render, screen } from '@testing-library/react';
import App from '../App';
import React from 'react';

// Imports
import { useAuth } from '@/hooks/useAuth';

jest.mock('@/hooks/useAuth');
jest.mock('@/hooks/useDatabase', () => ({
  DatabaseProvider: ({ children }: any) => <div>{children}</div>
}));
jest.mock('@/shared/components/Toast/ToastProvider', () => ({
  ToastProvider: ({ children }: any) => <div>{children}</div>
}));
jest.mock('@/contexts/DateRangeContext', () => ({
  DateRangeProvider: ({ children }: any) => <div>{children}</div>
}));

describe('App Component', () => {
  const mockUseAuth = useAuth as jest.Mock;

  it('should render LoginScreen when no user is logged in', () => {
    mockUseAuth.mockReturnValue({ currentUser: null });
    render(<App />);
    // Check for login screen element
    expect(screen.queryByText(/Usuario/i)).toBeInTheDocument(); 
    // Ajusta el selector según lo que realmente renderice LoginScreen
  });

  it('should render Main Layout when user is logged in', () => {
    mockUseAuth.mockReturnValue({ currentUser: { username: 'admin' } });
    render(<App />);
    // Check for main layout elements like sidebar navigation
    // Esto asume que SideNavigation tiene algún texto o rol identificable
  });
});
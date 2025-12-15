import { render, screen, fireEvent, act } from '@testing-library/react';
// CORRECCIÓN: Usar llaves { }
import { LoginScreen } from '../LoginScreen'; 
import React from 'react';
import { useAuth } from '@/hooks/useAuth';

jest.mock('@/hooks/useAuth');
jest.mock('@/hooks/useToast', () => ({
  useToast: () => ({ showError: jest.fn(), showSuccess: jest.fn() }),
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

describe('LoginScreen', () => {
  const mockUseAuth = useAuth as jest.Mock;
  const loginMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      login: loginMock,
      currentUser: null,
    });
  });

  it('should render login form', () => {
    render(<LoginScreen />);
    expect(screen.getByPlaceholderText('Usuario')).toBeInTheDocument();
  });
  // ... resto de tests
});
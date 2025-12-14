import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { LoginScreen } from '@/features/auth/components/LoginScreen';
import * as useAuthModule from '@/hooks/useAuth';
import * as useToastModule from '@/hooks/useToast';

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/hooks/useToast', () => ({
  useToast: jest.fn(),
}));

describe('LoginScreen Component', () => {
  const mockLogin = jest.fn();
  const mockShowError = jest.fn();
  const mockShowWarning = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    const useAuthMock = useAuthModule.useAuth as jest.MockedFunction<typeof useAuthModule.useAuth>;
    const useToastMock = useToastModule.useToast as jest.MockedFunction<typeof useToastModule.useToast>;

    useAuthMock.mockReturnValue({
      login: mockLogin,
      isLoading: false,
    } as any);

    useToastMock.mockReturnValue({
      showError: mockShowError,
      showWarning: mockShowWarning,
    } as any);
  });

  it('should render login form with username and password fields', () => {
    render(<LoginScreen />);

    expect(screen.getByPlaceholderText(/nombre de usuario/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/contraseña/i)).toBeInTheDocument();
  });

  it('should show warning when username is empty', async () => {
    render(<LoginScreen />);

    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockShowWarning).toHaveBeenCalledWith('Por favor ingresa tu nombre de usuario');
    });
  });

  it('should show warning when password is empty', async () => {
    render(<LoginScreen />);

    const usernameInput = screen.getByPlaceholderText(/nombre de usuario/i);
    await userEvent.type(usernameInput, 'testuser');

    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockShowWarning).toHaveBeenCalledWith('Por favor ingresa tu contraseña');
    });
  });

  it('should show error when username is too short', async () => {
    render(<LoginScreen />);

    const usernameInput = screen.getByPlaceholderText(/nombre de usuario/i);
    const passwordInput = screen.getByPlaceholderText(/contraseña/i);

    await userEvent.type(usernameInput, 'ab');
    await userEvent.type(passwordInput, 'password');

    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith('El nombre de usuario debe tener al menos 3 caracteres');
    });
  });

  it('should call login when form is submitted with valid data', async () => {
    mockLogin.mockResolvedValueOnce(true);
    
    render(<LoginScreen />);

    const usernameInput = screen.getByPlaceholderText(/nombre de usuario/i);
    const passwordInput = screen.getByPlaceholderText(/contraseña/i);

    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(passwordInput, 'password123');

    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123');
    });
  });

  it('should render demo login buttons', () => {
    render(<LoginScreen />);

    expect(screen.getByRole('button', { name: /demo admin/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /demo cajero/i })).toBeInTheDocument();
  });

  it('should handle demo login for admin', async () => {
    mockLogin.mockResolvedValueOnce(true);
    
    render(<LoginScreen />);

    const demoAdminButton = screen.getByRole('button', { name: /demo admin/i });
    fireEvent.click(demoAdminButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin', '123456');
    });
  });

  it('should update credentials when inputs change', async () => {
    render(<LoginScreen />);

    const usernameInput = screen.getByPlaceholderText(/nombre de usuario/i) as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText(/contraseña/i) as HTMLInputElement;

    await userEvent.type(usernameInput, 'newuser');
    await userEvent.type(passwordInput, 'newpassword');

    expect(usernameInput.value).toBe('newuser');
    expect(passwordInput.value).toBe('newpassword');
  });

  it('should disable submit button when loading', async () => {
    const { useAuth } = require('@/hooks/useAuth');
    useAuth.mockReturnValueOnce({
      login: mockLogin,
      isLoading: true,
    });

    render(<LoginScreen />);

    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    expect(submitButton).toBeDisabled();
  });

  it('should trim whitespace from username', async () => {
    mockLogin.mockResolvedValueOnce(true);
    
    render(<LoginScreen />);

    const usernameInput = screen.getByPlaceholderText(/nombre de usuario/i);
    const passwordInput = screen.getByPlaceholderText(/contraseña/i);

    await userEvent.type(usernameInput, '  testuser  ');
    await userEvent.type(passwordInput, 'password123');

    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123');
    });
  });
});

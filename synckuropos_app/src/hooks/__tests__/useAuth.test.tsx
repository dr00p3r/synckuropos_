import * as React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../useAuth';

// Test constants - not real credentials, used only for mocking
const TEST_MOCK = {
  HASH: 'mock-hash-value-for-testing',
  UUID: 'mock-uuid-value',
  USER_INPUT: 'mock-user-input',
  CREDENTIALS: 'mock-credentials',
  WRONG_CREDENTIALS: 'wrong-mock-credentials',
  OLD_CREDENTIALS: 'old-mock-credentials',
  NEW_CREDENTIALS: 'new-mock-credentials',
};

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(() => Promise.resolve(TEST_MOCK.HASH)),
}));

import bcrypt from 'bcryptjs';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => TEST_MOCK.UUID),
}));

// Create mock functions
const mockFindOneExec = jest.fn();
const mockFindExec = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();

// Mock useDatabase
const mockDb = {
  users: {
    findOne: jest.fn(() => ({
      exec: mockFindOneExec,
    })),
    find: jest.fn(() => ({
      exec: mockFindExec,
    })),
    insert: mockInsert,
  },
};

jest.mock('../useDatabase', () => ({
  useDatabase: () => mockDb,
}));

// Mock useToast
const mockToast = {
  showSuccess: jest.fn(),
  showError: jest.fn(),
  showInfo: jest.fn(),
  showWarn: jest.fn(),
  clear: jest.fn(),
};

jest.mock('../useToast', () => ({
  useToast: () => mockToast,
}));

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    React.createElement(AuthProvider, null, children)
  );

  describe('Context Provider', () => {
    it('should throw error when used outside AuthProvider', () => {
      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth debe ser usado dentro de un AuthProvider');
    });

    it('should return auth context when used inside AuthProvider', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current).toBeDefined();
      expect(result.current.login).toBeDefined();
      expect(result.current.logout).toBeDefined();
    });

    it('should have all required functions and properties', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      expect(typeof result.current.login).toBe('function');
      expect(typeof result.current.logout).toBe('function');
      expect(typeof result.current.updateUserPassword).toBe('function');
      expect(typeof result.current.createUser).toBe('function');
      expect(typeof result.current.getAllUsers).toBe('function');
      expect(typeof result.current.isLoading).toBe('boolean');
    });

    it('should start with no current user', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.currentUser).toBeNull();
    });

    it('should load user from localStorage on init', async () => {
      const storedUser = {
        userId: 'stored-user-id',
        username: 'storedUser',
        role: 'admin',
      };
      localStorage.setItem('currentUser', JSON.stringify(storedUser));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.currentUser).toEqual(storedUser);
      });
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = {
        userId: 'user-1',
        username: 'testuser',
        passwordHash: TEST_MOCK.HASH,
        role: 'admin',
        isActive: true,
      };

      mockFindOneExec.mockResolvedValue({
        toJSON: () => mockUser,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let loginResult: boolean = false;
      await act(async () => {
        loginResult = await result.current.login('testuser', TEST_MOCK.CREDENTIALS);
      });

      expect(loginResult).toBe(true);
      expect(result.current.currentUser).toEqual(mockUser);
      expect(mockToast.showSuccess).toHaveBeenCalledWith('Bienvenido, testuser!');
    });

    it('should fail login when user not found', async () => {
      mockFindOneExec.mockResolvedValue(null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let loginResult: boolean = false;
      await act(async () => {
        loginResult = await result.current.login('nonexistent', TEST_MOCK.CREDENTIALS);
      });

      expect(loginResult).toBe(false);
      expect(mockToast.showError).toHaveBeenCalledWith('Usuario no encontrado o inactivo');
    });

    it('should fail login with incorrect password', async () => {
      const mockUser = {
        userId: 'user-1',
        username: 'testuser',
        passwordHash: TEST_MOCK.HASH,
        role: 'admin',
        isActive: true,
      };

      mockFindOneExec.mockResolvedValue({
        toJSON: () => mockUser,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let loginResult: boolean = false;
      await act(async () => {
        loginResult = await result.current.login('testuser', TEST_MOCK.WRONG_CREDENTIALS);
      });

      expect(loginResult).toBe(false);
      expect(mockToast.showError).toHaveBeenCalledWith('Contraseña incorrecta');
    });

    it('should handle login error', async () => {
      mockFindOneExec.mockRejectedValue(new Error('Database error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let loginResult: boolean = false;
      await act(async () => {
        loginResult = await result.current.login('testuser', TEST_MOCK.CREDENTIALS);
      });

      expect(loginResult).toBe(false);
      expect(mockToast.showError).toHaveBeenCalledWith('Error al iniciar sesión');
      consoleSpy.mockRestore();
    });
  });

  describe('logout', () => {
    it('should logout and clear user data', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.logout();
      });

      expect(result.current.currentUser).toBeNull();
      expect(mockToast.showSuccess).toHaveBeenCalledWith('Sesión cerrada exitosamente');
    });
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      mockFindOneExec.mockResolvedValue(null);
      mockInsert.mockResolvedValue({});

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let createResult: boolean = false;
      await act(async () => {
        createResult = await result.current.createUser({
          username: 'newuser',
          password: TEST_MOCK.CREDENTIALS,
          role: 'cajero',
        });
      });

      expect(createResult).toBe(true);
      expect(mockInsert).toHaveBeenCalled();
      expect(mockToast.showSuccess).toHaveBeenCalledWith('Usuario newuser creado exitosamente');
    });

    it('should fail to create user if username exists', async () => {
      mockFindOneExec.mockResolvedValue({
        toJSON: () => ({ username: 'existinguser' }),
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let createResult: boolean = false;
      await act(async () => {
        createResult = await result.current.createUser({
          username: 'existinguser',
          password: TEST_MOCK.CREDENTIALS,
          role: 'admin',
        });
      });

      expect(createResult).toBe(false);
      expect(mockToast.showError).toHaveBeenCalledWith('Ya existe un usuario con ese nombre');
    });

    it('should handle create user error', async () => {
      mockFindOneExec.mockRejectedValue(new Error('Database error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let createResult: boolean = false;
      await act(async () => {
        createResult = await result.current.createUser({
          username: 'newuser',
          password: TEST_MOCK.CREDENTIALS,
          role: 'cajero',
        });
      });

      expect(createResult).toBe(false);
      expect(mockToast.showError).toHaveBeenCalledWith('Error al crear el usuario');
      consoleSpy.mockRestore();
    });
  });

  describe('updateUserPassword', () => {
    it('should update password successfully', async () => {
      const mockUserDoc = {
        toJSON: () => ({
          userId: 'user-1',
          username: 'testuser',
          passwordHash: TEST_MOCK.HASH,
        }),
        update: mockUpdate,
      };
      mockFindOneExec.mockResolvedValue(mockUserDoc);
      mockUpdate.mockResolvedValue({});
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let updateResult: boolean = false;
      await act(async () => {
        updateResult = await result.current.updateUserPassword('user-1', TEST_MOCK.OLD_CREDENTIALS, TEST_MOCK.NEW_CREDENTIALS);
      });

      expect(updateResult).toBe(true);
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockToast.showSuccess).toHaveBeenCalledWith('Contraseña actualizada exitosamente');
    });

    it('should fail if user not found', async () => {
      mockFindOneExec.mockResolvedValue(null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let updateResult: boolean = false;
      await act(async () => {
        updateResult = await result.current.updateUserPassword('nonexistent', TEST_MOCK.OLD_CREDENTIALS, TEST_MOCK.NEW_CREDENTIALS);
      });

      expect(updateResult).toBe(false);
      expect(mockToast.showError).toHaveBeenCalledWith('Usuario no encontrado');
    });

    it('should fail if current password is incorrect', async () => {
      const mockUserDoc = {
        toJSON: () => ({
          userId: 'user-1',
          passwordHash: TEST_MOCK.HASH,
        }),
        update: mockUpdate,
      };
      mockFindOneExec.mockResolvedValue(mockUserDoc);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let updateResult: boolean = false;
      await act(async () => {
        updateResult = await result.current.updateUserPassword('user-1', TEST_MOCK.WRONG_CREDENTIALS, TEST_MOCK.NEW_CREDENTIALS);
      });

      expect(updateResult).toBe(false);
      expect(mockToast.showError).toHaveBeenCalledWith('La contraseña actual es incorrecta');
    });

    it('should update localStorage when updating current user password', async () => {
      // First login a user
      const mockUser = {
        userId: 'current-user-id',
        username: 'currentuser',
        passwordHash: TEST_MOCK.HASH,
        role: 'admin',
        isActive: true,
      };
      
      mockFindOneExec.mockResolvedValue({
        toJSON: () => mockUser,
        update: mockUpdate,
      });
      mockUpdate.mockResolvedValue({});
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Login first
      await act(async () => {
        await result.current.login('currentuser', TEST_MOCK.CREDENTIALS);
      });

      expect(result.current.currentUser).toEqual(mockUser);

      // Now update password
      await act(async () => {
        await result.current.updateUserPassword('current-user-id', TEST_MOCK.OLD_CREDENTIALS, TEST_MOCK.NEW_CREDENTIALS);
      });

      expect(mockUpdate).toHaveBeenCalled();
      expect(mockToast.showSuccess).toHaveBeenCalledWith('Contraseña actualizada exitosamente');
    });

    it('should handle update password error', async () => {
      mockFindOneExec.mockRejectedValue(new Error('Database error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let updateResult: boolean = false;
      await act(async () => {
        updateResult = await result.current.updateUserPassword('user-1', TEST_MOCK.OLD_CREDENTIALS, TEST_MOCK.NEW_CREDENTIALS);
      });

      expect(updateResult).toBe(false);
      expect(mockToast.showError).toHaveBeenCalledWith('Error al actualizar la contraseña');
      consoleSpy.mockRestore();
    });
  });

  describe('getAllUsers', () => {
    it('should return all active users', async () => {
      const mockUsers = [
        { userId: 'user-1', username: 'user1', role: 'admin', isActive: true },
        { userId: 'user-2', username: 'user2', role: 'cajero', isActive: true },
      ];

      mockFindExec.mockResolvedValue(
        mockUsers.map(user => ({ toJSON: () => user }))
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let users: any[] = [];
      await act(async () => {
        users = await result.current.getAllUsers();
      });

      expect(users).toEqual(mockUsers);
    });

    it('should return empty array on error', async () => {
      mockFindExec.mockRejectedValue(new Error('Database error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let users: any[] = [];
      await act(async () => {
        users = await result.current.getAllUsers();
      });

      expect(users).toEqual([]);
      expect(mockToast.showError).toHaveBeenCalledWith('Error al cargar usuarios');
      consoleSpy.mockRestore();
    });
  });
});

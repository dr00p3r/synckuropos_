import { renderHook, act } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';
import { useDatabase } from '@/hooks/useDatabase';
import bcrypt from 'bcryptjs';

jest.mock('@/hooks/useDatabase');
jest.mock('@/hooks/useToast');
jest.mock('bcryptjs');

describe('useAuth', () => {
  const mockUseDatabase = useDatabase as jest.Mock;
  
  // CORRECCIÓN: Añadido 'find' al mock inicial
  const mockUsers = {
    findOne: jest.fn(),
    find: jest.fn(), 
  };

  const mockDbReturn = {
    users: mockUsers,
  };

  const mockUser = {
    userId: '123',
    username: 'testuser',
    passwordHash: 'hashed_password',
    role: 'admin' as const,
    isActive: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDatabase.mockReturnValue(mockDbReturn);
    localStorage.clear();
  });

  // ... (El resto de tus tests "initialization", "login", "logout" y "updateUserPassword" estaban bien, 
  // solo asegúrate de que usan el mockUsers corregido arriba).

  describe('initialization', () => {
    it('should initialize with no user', () => {
      const { result } = renderHook(() => useAuth());
      expect(result.current.currentUser).toBeNull();
    });
    // ... otros tests de initialization
  });

  describe('login', () => {
      // ... tests de login
       it('should successfully login with correct credentials', async () => {
        const execMock = jest.fn().mockResolvedValue({ toJSON: () => mockUser });
        mockUsers.findOne.mockReturnValue({ exec: execMock });
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  
        const { result } = renderHook(() => useAuth());
  
        let loginSuccess = false;
        await act(async () => {
          loginSuccess = await result.current.login('testuser', 'password123');
        });
  
        expect(loginSuccess).toBe(true);
      });
  });

  // ... tests de logout y update

  describe('getAllUsers', () => {
    it('should retrieve all users', async () => {
      const users = [mockUser, { ...mockUser, userId: '456', username: 'user2' }];
      const findMock = jest.fn().mockResolvedValue(users);
      // Aquí el error original ocurría porque 'find' no existía en mockUsers
      mockUsers.find = findMock;

      const { result } = renderHook(() => useAuth());

      let retrievedUsers: any = [];
      await act(async () => {
        retrievedUsers = await result.current.getAllUsers();
      });

      expect(retrievedUsers).toHaveLength(2);
    });
  });
});
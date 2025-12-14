import { renderHook, act } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';
import { useDatabase } from '@/hooks/useDatabase';
import bcrypt from 'bcryptjs';

jest.mock('@/hooks/useDatabase');
jest.mock('@/hooks/useToast');
jest.mock('bcryptjs');

describe('useAuth', () => {
  const mockUseDatabase = useDatabase as jest.Mock;
  const mockUsers = {
    findOne: jest.fn(),
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

  describe('initialization', () => {
    it('should initialize with no user', () => {
      const { result } = renderHook(() => useAuth());
      expect(result.current.currentUser).toBeNull();
    });

    it('should load user from localStorage if available', () => {
      localStorage.setItem('currentUser', JSON.stringify(mockUser));
      const { result } = renderHook(() => useAuth());
      expect(result.current.currentUser).toEqual(mockUser);
    });

    it('should clear invalid localStorage data', () => {
      localStorage.setItem('currentUser', 'invalid json');
      const { result } = renderHook(() => useAuth());
      expect(result.current.currentUser).toBeNull();
      expect(localStorage.getItem('currentUser')).toBeNull();
    });
  });

  describe('login', () => {
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
      expect(result.current.currentUser).toEqual(mockUser);
    });

    it('should fail login with incorrect password', async () => {
      const execMock = jest.fn().mockResolvedValue({ toJSON: () => mockUser });
      mockUsers.findOne.mockReturnValue({ exec: execMock });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const { result } = renderHook(() => useAuth());

      let loginSuccess = false;
      await act(async () => {
        loginSuccess = await result.current.login('testuser', 'wrongpassword');
      });

      expect(loginSuccess).toBe(false);
      expect(result.current.currentUser).toBeNull();
    });

    it('should fail login if user not found', async () => {
      const execMock = jest.fn().mockResolvedValue(null);
      mockUsers.findOne.mockReturnValue({ exec: execMock });

      const { result } = renderHook(() => useAuth());

      let loginSuccess = false;
      await act(async () => {
        loginSuccess = await result.current.login('nonexistent', 'password123');
      });

      expect(loginSuccess).toBe(false);
    });

    it('should store user in localStorage on successful login', async () => {
      const execMock = jest.fn().mockResolvedValue({ toJSON: () => mockUser });
      mockUsers.findOne.mockReturnValue({ exec: execMock });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login('testuser', 'password123');
      });

      const storedUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      expect(storedUser).toEqual(mockUser);
    });
  });

  describe('logout', () => {
    it('should clear user from state and localStorage', () => {
      localStorage.setItem('currentUser', JSON.stringify(mockUser));
      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.logout();
      });

      expect(result.current.currentUser).toBeNull();
      expect(localStorage.getItem('currentUser')).toBeNull();
    });
  });

  describe('updateUserPassword', () => {
    it('should update password with correct current password', async () => {
      const updateMock = jest.fn().mockResolvedValue({});
      const execMock = jest.fn().mockResolvedValue({ 
        toJSON: () => mockUser,
        update: updateMock,
      });
      mockUsers.findOne.mockReturnValue({ exec: execMock });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new_hashed_password');

      const { result } = renderHook(() => useAuth());
      localStorage.setItem('currentUser', JSON.stringify(mockUser));

      let updateSuccess = false;
      await act(async () => {
        updateSuccess = await result.current.updateUserPassword('123', 'oldpassword', 'newpassword');
      });

      expect(updateSuccess).toBe(true);
    });

    it('should fail if current password is incorrect', async () => {
      const execMock = jest.fn().mockResolvedValue({ toJSON: () => mockUser });
      mockUsers.findOne.mockReturnValue({ exec: execMock });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const { result } = renderHook(() => useAuth());

      let updateSuccess = false;
      await act(async () => {
        updateSuccess = await result.current.updateUserPassword('123', 'wrongpassword', 'newpassword');
      });

      expect(updateSuccess).toBe(false);
    });
  });

  describe('getAllUsers', () => {
    it('should retrieve all users', async () => {
      const users = [mockUser, { ...mockUser, userId: '456', username: 'user2' }];
      const findMock = jest.fn().mockResolvedValue(users);
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

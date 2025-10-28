import type { User } from '@/types/types';

// Auth feature types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  createUser: (userData: CreateUserData) => Promise<boolean>;
  updateUserPassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  getAllUsers: () => Promise<User[]>;
}

export interface CreateUserData {
  username: string;
  password: string;
  role: 'admin' | 'cajero';
}

// Re-export for convenience
export type { User };
import type { User } from '@/types/types';

// Settings-specific types
export interface SettingsScreenProps {
  // Add props if needed
}

export interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: (user: User) => void;
}

export interface UserFormData {
  username: string;
  password: string;
  confirmPassword: string;
  role: 'admin' | 'cajero';
}

export interface PasswordChangeForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Re-export for convenience
export type { User };
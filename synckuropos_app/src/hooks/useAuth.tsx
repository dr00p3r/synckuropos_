import { useState, useEffect, useContext, createContext } from 'react';
import bcrypt from 'bcryptjs';
import { useDatabase } from './useDatabase';
import { useToast } from './useToast';
import { useTelemetry } from './useTelemetry';
import { TelemetryEvents } from '../types/telemetryEvents';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema';

import type { FC, ReactNode } from 'react';
import type { User } from '../types/types';

interface AuthContextType {
  currentUser: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUserPassword: (userId: string, currentPassword: string, newPassword: string) => Promise<boolean>;
  createUser: (userData: { username: string; password: string; role: 'admin' | 'cajero' }) => Promise<boolean>;
  getAllUsers: () => Promise<User[]>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const db = useDatabase();
  const { showSuccess, showError } = useToast();
  const { logMetric } = useTelemetry();

  // Verificar si hay un usuario logueado al iniciar la aplicación
  useEffect(() => {
    const checkStoredUser = () => {
      try {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          const user = JSON.parse(storedUser) as User;
          setCurrentUser(user);
        }
      } catch (error) {
        console.error('Error al cargar usuario del localStorage:', error);
        localStorage.removeItem('currentUser');
      } finally {
        setIsLoading(false);
      }
    };

    checkStoredUser();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);

      const userRows = await db.select().from(schema.users)
        .where(eq(schema.users.username, username))
        .limit(1);

      console.log('[DEBUG] userRows:', JSON.stringify(userRows));
      console.log('[DEBUG] userRows[0]:', JSON.stringify(userRows[0]));
      console.log('[DEBUG] userRows.length:', userRows.length);

      const userRow = userRows[0] ?? null;
      if (!userRow || userRow._deleted) {
        showError('Usuario no encontrado o inactivo');
        return false;
      }

      const user = userRow as User;
      console.log('[DEBUG] user object:', JSON.stringify(user));
      console.log('[DEBUG] passwordHash:', user.passwordHash);

      console.log('[DEBUG] all keys on userRow:', Object.keys(userRow));

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

      if (!isPasswordValid) {
        logMetric(TelemetryEvents.AUTH_FAILURE, { attemptId: crypto.randomUUID(), reason: 'invalid_password' });
        showError('Contraseña incorrecta');
        return false;
      }

      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      showSuccess(`Bienvenido, ${user.username}!`);
      return true;

    } catch (error) {
      console.error('Error en login:', error);
      logMetric(TelemetryEvents.AUTH_FAILURE, { attemptId: crypto.randomUUID(), reason: 'error' });
      showError('Error al iniciar sesión');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    showSuccess('Sesión cerrada exitosamente');
  };

  const updateUserPassword = async (
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> => {
    try {
      setIsLoading(true);

      const userRows = await db.select().from(schema.users)
        .where(eq(schema.users.userId, userId))
        .limit(1);

      const userRow = userRows[0] ?? null;
      if (!userRow) {
        showError('Usuario no encontrado');
        return false;
      }

      const user = userRow as User;

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);

      if (!isCurrentPasswordValid) {
        showError('La contraseña actual es incorrecta');
        return false;
      }

      const saltRounds = 10;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
      const now = Date.now();

      await db.update(schema.users)
        .set({ passwordHash: newPasswordHash, updatedAt: now })
        .where(eq(schema.users.userId, userId));

      if (currentUser?.userId === userId) {
        const updatedUser = { ...currentUser, passwordHash: newPasswordHash, updatedAt: now };
        setCurrentUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      }

      showSuccess('Contraseña actualizada exitosamente');
      return true;

    } catch (error) {
      console.error('Error al actualizar contraseña:', error);
      showError('Error al actualizar la contraseña');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const createUser = async (userData: {
    username: string;
    password: string;
    role: 'admin' | 'cajero'
  }): Promise<boolean> => {
    try {
      setIsLoading(true);

      const existingRows = await db.select().from(schema.users)
        .where(eq(schema.users.username, userData.username))
        .limit(1);
      const existing = existingRows[0] ?? null;

      if (existing) {
        showError('Ya existe un usuario con ese nombre');
        return false;
      }

      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(userData.password, saltRounds);
      const now = Date.now();

      const newUser: User = {
        userId: crypto.randomUUID(),
        username: userData.username,
        passwordHash,
        role: userData.role,
        _deleted: false,
        createdAt: now,
        updatedAt: now,
        synced: 0
      };

      await db.insert(schema.users).values(newUser);
      showSuccess(`Usuario ${userData.username} creado exitosamente`);
      return true;

    } catch (error) {
      console.error('Error al crear usuario:', error);
      showError('Error al crear el usuario');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getAllUsers = async (): Promise<User[]> => {
    try {
      const rows = await db.select().from(schema.users);
      return rows.filter(u => !u._deleted) as User[];
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      showError('Error al cargar usuarios');
      return [];
    }
  };

  const contextValue: AuthContextType = {
    currentUser,
    login,
    logout,
    updateUserPassword,
    createUser,
    getAllUsers,
    isLoading
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }

  return context;
};

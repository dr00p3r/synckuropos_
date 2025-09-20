import { useState, useEffect, useContext, createContext } from 'react';
import bcrypt from 'bcryptjs';
import { useDatabase } from './useDatabase';
import { useToast } from './useToast';
import { v4 as uuidv4 } from 'uuid';
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

  // Verificar si hay un usuario logueado al iniciar la aplicación
  useEffect(() => {
    const checkStoredUser = () => {
      try {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          setCurrentUser(JSON.parse(storedUser));
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
      
      // Buscar el usuario por username
      const userDoc = await db.users.findOne({
        selector: {
          username: username,
          isActive: true
        }
      }).exec();

      if (!userDoc) {
        showError('Usuario no encontrado o inactivo');
        return false;
      }

      const user = userDoc.toJSON() as User;
      
      // Verificar la contraseña
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      
      if (!isPasswordValid) {
        showError('Contraseña incorrecta');
        return false;
      }

      // Login exitoso
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      showSuccess(`Bienvenido, ${user.username}!`);
      return true;

    } catch (error) {
      console.error('Error en login:', error);
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
      
      // Buscar el usuario
      const userDoc = await db.users.findOne({
        selector: { userId }
      }).exec();

      if (!userDoc) {
        showError('Usuario no encontrado');
        return false;
      }

      const user = userDoc.toJSON() as User;
      
      // Verificar la contraseña actual
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      
      if (!isCurrentPasswordValid) {
        showError('La contraseña actual es incorrecta');
        return false;
      }

      // Hashear la nueva contraseña
      const saltRounds = 10;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Actualizar el usuario
      await userDoc.update({
        $set: {
          passwordHash: newPasswordHash,
          updatedAt: new Date().toISOString()
        }
      });

      // Si es el usuario actual, actualizar la información en el estado
      if (currentUser && currentUser.userId === userId) {
        const updatedUser = { ...currentUser, passwordHash: newPasswordHash, updatedAt: new Date().toISOString() };
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
      
      // Verificar si el usuario ya existe
      const existingUser = await db.users.findOne({
        selector: { username: userData.username }
      }).exec();

      if (existingUser) {
        showError('Ya existe un usuario con ese nombre');
        return false;
      }

      // Hashear la contraseña
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(userData.password, saltRounds);

      // Crear el nuevo usuario
      const now = new Date().toISOString();
      const newUser: User = {
        userId: uuidv4(),
        username: userData.username,
        passwordHash,
        role: userData.role,
        isActive: true,
        _deleted: false,
        createdAt: now,
        updatedAt: now
      };

      await db.users.insert(newUser);
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
      const userDocs = await db.users.find({
        selector: { isActive: true }
      }).exec();

      return userDocs.map(doc => doc.toJSON() as User);
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
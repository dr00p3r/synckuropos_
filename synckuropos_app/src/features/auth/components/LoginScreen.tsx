import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import type { LoginCredentials } from '../types';
import './LoginScreen.css';

export const LoginScreen: React.FC = () => {
  const { login, isLoading } = useAuth();
  const { showError, showWarning } = useToast();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: 'username' | 'password', value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!credentials.username.trim()) {
      showWarning('Por favor ingresa tu nombre de usuario');
      return;
    }

    if (!credentials.password) {
      showWarning('Por favor ingresa tu contraseña');
      return;
    }

    if (credentials.username.trim().length < 3) {
      showError('El nombre de usuario debe tener al menos 3 caracteres');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(credentials.username.trim(), credentials.password);
    } catch (error) {
      showError('Error inesperado al iniciar sesión');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async (role: 'admin' | 'cajero') => {
    const demoCredentials = {
      admin: { username: 'admin', password: '123456' },
      cajero: { username: 'cajero', password: '123456' }
    };

    const { username, password } = demoCredentials[role];
    setCredentials({ username, password });
    
    setIsSubmitting(true);
    try {
      await login(username, password);
    } catch (error) {
      showError('Error al acceder con credenciales de demostración');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-primary-dark p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-width-md shadow-2xl animate-fadeIn">
        <div className="text-center mb-8">
          <h1 className="text-primary text-4xl font-bold mb-2 leading-tight">🏪 SyncKuroPOS</h1>
          <p className="text-secondary text-base mb-4 leading-normal">Sistema de Punto de Venta Moderno</p>
          <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border-l-4 border-primary">
            <p className="text-primary text-sm italic m-0">
              Bienvenido al sistema de gestión más completo para tu negocio
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mb-8 space-y-6">
          <div className="form-field">
            <label htmlFor="username" className="form-label">
              Usuario
            </label>
            <input
              type="text"
              id="username"
              className="form-input w-full"
              value={credentials.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              placeholder="Ingresa tu nombre de usuario"
              disabled={isLoading || isSubmitting}
              required
              autoComplete="username"
              minLength={3}
              maxLength={50}
            />
          </div>

          <div className="form-field">
            <label htmlFor="password" className="form-label">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              className="form-input w-full"
              value={credentials.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="Ingresa tu contraseña"
              disabled={isLoading || isSubmitting}
              required
              autoComplete="current-password"
              minLength={6}
            />
          </div>

          <button 
            type="submit" 
            className="btn-base btn-primary w-full"
            disabled={isLoading || isSubmitting}
          >
            {(isLoading || isSubmitting) ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-primary text-lg font-semibold mb-2 text-center leading-tight">
            Acceso de Demostración
          </h3>
          <p className="text-secondary text-sm text-center mb-4 leading-normal">
            Usa estas credenciales para probar el sistema:
          </p>
          
          <div className="space-y-2">
            <button
              type="button"
              className="w-full p-3 border-2 border-red-600 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 rounded-lg font-semibold transition-all duration-200 text-left flex flex-col gap-1 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
              onClick={() => handleDemoLogin('admin')}
              disabled={isLoading || isSubmitting}
            >
              <span>👨‍💼 Acceder como Admin</span>
              <small className="text-xs font-normal opacity-80">
                Usuario: admin | Contraseña: 123456
              </small>
            </button>
            
            <button
              type="button"
              className="w-full p-3 border-2 border-green-600 bg-green-50 hover:bg-green-600 hover:text-white text-green-600 rounded-lg font-semibold transition-all duration-200 text-left flex flex-col gap-1 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
              onClick={() => handleDemoLogin('cajero')}
              disabled={isLoading || isSubmitting}
            >
              <span>👨‍💻 Acceder como Cajero</span>
              <small className="text-xs font-normal opacity-80">
                Usuario: cajero | Contraseña: 123456
              </small>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
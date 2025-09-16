import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import './LoginScreen.css';

export const LoginScreen: React.FC = () => {
  const { login, isLoading } = useAuth();
  const { showError, showWarning } = useToast();
  const [credentials, setCredentials] = useState({
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
    <div className="login-screen">
      <div className="login-container">
        <div className="login-header">
          <h1>🏪 SyncKuroPOS</h1>
          <p>Sistema de Punto de Venta Moderno</p>
          <div className="welcome-message">
            <p>Bienvenido al sistema de gestión más completo para tu negocio</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Usuario</label>
            <input
              type="text"
              id="username"
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

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
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
            className="btn-login"
            disabled={isLoading || isSubmitting}
          >
            {(isLoading || isSubmitting) ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="demo-section">
          <h3>Acceso de Demostración</h3>
          <p>Usa estas credenciales para probar el sistema:</p>
          
          <div className="demo-buttons">
            <button
              type="button"
              className="btn-demo admin"
              onClick={() => handleDemoLogin('admin')}
              disabled={isLoading || isSubmitting}
            >
              👨‍💼 Acceder como Admin
              <small>Usuario: admin | Contraseña: 123456</small>
            </button>
            
            <button
              type="button"
              className="btn-demo cajero"
              onClick={() => handleDemoLogin('cajero')}
              disabled={isLoading || isSubmitting}
            >
              👨‍💻 Acceder como Cajero
              <small>Usuario: cajero | Contraseña: 123456</small>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
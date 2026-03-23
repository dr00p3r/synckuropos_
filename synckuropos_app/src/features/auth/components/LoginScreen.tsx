import React, { useState, useRef, useCallback } from 'react';
import { useAuth, useToast } from '@/hooks';
import type { LoginCredentials } from '../types';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Message } from 'primereact/message';

// Configuración del rate limiter
const MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minuto

interface AttemptRecord {
  count: number;
  firstAttemptTime: number;
}

export const LoginScreen: React.FC = () => {
  const { login, isLoading } = useAuth();
  const { showError, showWarn } = useToast();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Rate limiting state
  const attemptRecordRef = useRef<AttemptRecord>({ count: 0, firstAttemptTime: 0 });
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  const checkRateLimit = useCallback((): boolean => {
    const now = Date.now();
    const record = attemptRecordRef.current;

    // Si ha pasado más de 1 minuto desde el primer intento, reiniciar el contador
    if (now - record.firstAttemptTime > RATE_LIMIT_WINDOW_MS) {
      attemptRecordRef.current = { count: 1, firstAttemptTime: now };
      return true;
    }

    // Si aún estamos en la ventana de tiempo
    if (record.count >= MAX_ATTEMPTS) {
      const timeLeft = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - record.firstAttemptTime)) / 1000);
      setRemainingTime(timeLeft);
      setIsRateLimited(true);

      // Programar la desactivación del rate limit
      setTimeout(() => {
        setIsRateLimited(false);
        attemptRecordRef.current = { count: 0, firstAttemptTime: 0 };
      }, timeLeft * 1000);

      return false;
    }

    // Incrementar el contador
    attemptRecordRef.current.count += 1;
    return true;
  }, []);

  const handleInputChange = (field: 'username' | 'password', value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Verificar rate limit
    if (!checkRateLimit()) {
      showError(`Demasiados intentos. Espera ${remainingTime} segundos.`);
      return;
    }

    // Validaciones básicas
    if (!credentials.username.trim()) {
      showWarn('Por favor ingresa tu nombre de usuario');
      return;
    }

    if (!credentials.password) {
      showWarn('Por favor ingresa tu contraseña');
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

  const cardHeader = (
    <div className="text-center pt-4">
      <i className="pi pi-shopping-cart text-6xl text-primary mb-3" style={{ display: 'block' }}></i>
      <h1 className="text-primary text-3xl font-bold m-0">SyncKuro POS</h1>
    </div>
  );

  return (
    <div
      className="min-h-screen flex align-items-center justify-content-center p-3"
      style={{
        background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)'
      }}
    >
      <Card
        header={cardHeader}
        className="w-full shadow-8 border-round-xl"
        style={{ maxWidth: '400px' }}
      >
        <div className="p-fluid">
          {isRateLimited && (
            <Message
              severity="error"
              text={`Demasiados intentos. Espera ${remainingTime} segundos.`}
              className="w-full mb-4"
            />
          )}

          <form onSubmit={handleSubmit}>
            <div className="field mb-4">
              <label htmlFor="username" className="block text-900 font-medium mb-2">
                Usuario
              </label>
              <span className="p-input-icon-left w-full">
                <i className="pi pi-user" style={{ left: '0.75rem' }} />
                <InputText
                  id="username"
                  value={credentials.username}
                  style={{ paddingLeft: '2.5rem' }}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  placeholder="Ingresa tu nombre de usuario"
                  disabled={isLoading || isSubmitting || isRateLimited}
                  autoComplete="username"
                  className="w-full"
                />
              </span>
            </div>

            <div className="field mb-4">
              <label htmlFor="password" className="block text-900 font-medium mb-2">
                Contraseña
              </label>
              <Password
                id="password"
                value={credentials.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Ingresa tu contraseña"
                disabled={isLoading || isSubmitting || isRateLimited}
                autoComplete="current-password"
                toggleMask
                feedback={false}
                className="w-full"
                inputClassName="w-full"
              />
            </div>

            <Button
              type="submit"
              label={isLoading || isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              icon={isLoading || isSubmitting ? 'pi pi-spin pi-spinner' : 'pi pi-sign-in'}
              loading={isLoading || isSubmitting}
              disabled={isLoading || isSubmitting || isRateLimited}
              className="w-full mt-3"
              style={{ background: 'linear-gradient(135deg, #2A423E 0%, #1a2d2a 100%)', border: 'none' }}
            />
          </form>

          <div className="text-center mt-5">
            <p className="text-500 text-sm m-0">
              <i className="pi pi-info-circle mr-1"></i>
              Contacta al administrador si olvidaste tu contraseña
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
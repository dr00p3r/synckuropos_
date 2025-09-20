import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import './CreateUserModal.css';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { createUser } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'cajero' as 'admin' | 'cajero'
  });

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.username.trim()) {
      alert('El nombre de usuario es obligatorio');
      return;
    }

    if (formData.username.length < 3) {
      alert('El nombre de usuario debe tener al menos 3 caracteres');
      return;
    }

    if (!formData.password) {
      alert('La contraseña es obligatoria');
      return;
    }

    if (formData.password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert('La contraseña y la confirmación no coinciden');
      return;
    }

    setIsCreating(true);

    try {
      const success = await createUser({
        username: formData.username.trim(),
        password: formData.password,
        role: formData.role
      });

      if (success) {
        // Limpiar el formulario
        setFormData({
          username: '',
          password: '',
          confirmPassword: '',
          role: 'cajero'
        });
        onSuccess();
      }
    } catch (error) {
      console.error('Error al crear usuario:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    // Limpiar el formulario al cancelar
    setFormData({
      username: '',
      password: '',
      confirmPassword: '',
      role: 'cajero'
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Crear Nuevo Usuario</h2>
          <button 
            className="modal-close-button"
            onClick={handleCancel}
            disabled={isCreating}
            aria-label="Cerrar modal"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="create-user-form">
          <div className="form-group">
            <label htmlFor="newUsername">Nombre de Usuario *</label>
            <input
              type="text"
              id="newUsername"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              placeholder="Ej: juan.perez"
              disabled={isCreating}
              minLength={3}
              maxLength={50}
              required
              autoComplete="off"
            />
            <small className="field-hint">
              Mínimo 3 caracteres, máximo 50. Solo letras, números, puntos y guiones.
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="newUserPassword">Contraseña *</label>
            <input
              type="password"
              id="newUserPassword"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="Mínimo 6 caracteres"
              disabled={isCreating}
              minLength={6}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmNewUserPassword">Confirmar Contraseña *</label>
            <input
              type="password"
              id="confirmNewUserPassword"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              placeholder="Confirma la contraseña"
              disabled={isCreating}
              minLength={6}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="userRole">Rol del Usuario *</label>
            <select
              id="userRole"
              value={formData.role}
              onChange={(e) => handleInputChange('role', e.target.value as 'admin' | 'cajero')}
              disabled={isCreating}
              required
            >
              <option value="cajero">Cajero</option>
              <option value="admin">Administrador</option>
            </select>
            <small className="field-hint">
              <strong>Cajero:</strong> Puede realizar ventas y consultar información básica.<br />
              <strong>Administrador:</strong> Acceso completo al sistema, incluyendo gestión de usuarios.
            </small>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={handleCancel}
              disabled={isCreating}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isCreating}
            >
              {isCreating ? 'Creando...' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
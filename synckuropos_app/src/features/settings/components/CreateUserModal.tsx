import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Dropdown } from 'primereact/dropdown';
import { classNames } from 'primereact/utils';
import { useAuth } from '@/hooks';

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
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validate = () => {
    if (!formData.username.trim()) return false;
    if (formData.username.length < 3) return false;
    if (!formData.password) return false;
    if (formData.password.length < 6) return false;
    if (formData.password !== formData.confirmPassword) return false;
    return true;
  }

  const handleSubmit = async () => {
    setSubmitted(true);

    // Validaciones básicas antes de enviar
    if (!validate()) return;

    setIsCreating(true);

    try {
      const success = await createUser({
        username: formData.username.trim(),
        password: formData.password,
        role: formData.role
      });

      if (success) {
        // Limpiar el formulario y cerrar
        resetForm();
        onSuccess();
      }
    } catch (error) {
      console.error('Error al crear usuario:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      confirmPassword: '',
      role: 'cajero'
    });
    setSubmitted(false);
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  const footer = (
    <div>
      <Button label="Cancelar" icon="pi pi-times" onClick={handleCancel} className="p-button-text" disabled={isCreating} />
      <Button label="Crear Usuario" icon="pi pi-check" onClick={handleSubmit} disabled={isCreating} loading={isCreating} />
    </div>
  );

  const roleOptions = [
    { label: 'Cajero', value: 'cajero' },
    { label: 'Administrador', value: 'admin' }
  ];

  return (
    <Dialog
      header="Crear Nuevo Usuario"
      visible={isOpen}
      style={{ width: '90vw', maxWidth: '450px' }}
      footer={footer}
      onHide={handleCancel}
      modal
      className="p-fluid"
    >
      <div className="field">
        <label htmlFor="username" className="font-semibold">Nombre de Usuario</label>
        <InputText
          id="username"
          value={formData.username}
          onChange={(e) => handleInputChange('username', e.target.value)}
          required
          className={classNames({ 'p-invalid': submitted && (!formData.username || formData.username.length < 3) })}
        />
        {submitted && (!formData.username || formData.username.length < 3) && <small className="p-error">El nombre de usuario es requerido (mín 3 caracteres).</small>}
      </div>

      <div className="field">
        <label htmlFor="password" className="font-semibold">Contraseña</label>
        <Password
          id="password"
          value={formData.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          required
          toggleMask
          feedback={false}
          className={classNames({ 'p-invalid': submitted && (!formData.password || formData.password.length < 6) })}
        />
        {submitted && (!formData.password || formData.password.length < 6) && <small className="p-error">La contraseña es requerida (mín 6 caracteres).</small>}
      </div>

      <div className="field">
        <label htmlFor="confirmPassword" className="font-semibold">Confirmar Contraseña</label>
        <Password
          id="confirmPassword"
          value={formData.confirmPassword}
          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
          required
          toggleMask
          feedback={false}
          className={classNames({ 'p-invalid': submitted && (formData.password !== formData.confirmPassword) })}
        />
        {submitted && (formData.password !== formData.confirmPassword) && <small className="p-error">Las contraseñas no coinciden.</small>}
      </div>

      <div className="field">
        <label htmlFor="role" className="font-semibold">Rol</label>
        <Dropdown
          id="role"
          value={formData.role}
          options={roleOptions}
          onChange={(e) => handleInputChange('role', e.value)}
          placeholder="Seleccione un rol"
        />
        <small className="block mt-1 text-500">
          {formData.role === 'admin'
            ? 'Acceso completo al sistema, incluyendo gestión de usuarios.'
            : 'Puede realizar ventas y consultar información básica.'}
        </small>
      </div>
    </Dialog>
  );
};
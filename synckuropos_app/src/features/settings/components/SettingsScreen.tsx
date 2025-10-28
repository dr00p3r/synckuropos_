import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { CreateUserModal } from './CreateUserModal';
import type { User } from '../types';
import './SettingsScreen.css';

const SettingsScreen: React.FC = () => {
  const { currentUser, updateUserPassword, getAllUsers, logout } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  
  // Estado para el formulario de cambio de contraseña
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Cargar usuarios al montar el componente (solo para admins)
  useEffect(() => {
    if (currentUser?.role === 'admin') {
      loadUsers();
    }
  }, [currentUser]);

  const loadUsers = async () => {
    const allUsers = await getAllUsers();
    setUsers(allUsers);
  };

  const handlePasswordChange = (field: keyof typeof passwordForm, value: string) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) return;

    // Validaciones
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      alert('Todos los campos son obligatorios');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('La nueva contraseña y la confirmación no coinciden');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      alert('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsChangingPassword(true);
    
    const success = await updateUserPassword(
      currentUser.userId, 
      passwordForm.currentPassword, 
      passwordForm.newPassword
    );

    if (success) {
      // Limpiar el formulario
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }

    setIsChangingPassword(false);
  };

  const handleCreateUserSuccess = () => {
    setIsCreateUserModalOpen(false);
    if (currentUser?.role === 'admin') {
      loadUsers(); // Recargar la lista de usuarios
    }
  };

  const getRoleDisplayName = (role: 'admin' | 'cajero') => {
    return role === 'admin' ? 'Administrador' : 'Cajero';
  };

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      logout();
    }
  };

  if (!currentUser) {
    return (
      <div className="settings-screen">
        <div className="settings-error">
          No hay un usuario autenticado
        </div>
      </div>
    );
  }

  return (
    <div className="settings-screen">
      <div className="settings-header">
        <h1>Ajustes</h1>
      </div>

      <div className="settings-content">
        {/* Sección: Cambiar Mi Contraseña */}
        <section className="settings-section password-section">
          <div className="section-header">
            <h2>Cambiar Mi Contraseña</h2>
            <p>Actualiza tu contraseña para mantener tu cuenta segura</p>
          </div>
          
          <form onSubmit={handlePasswordSubmit} className="password-form">
            <div className="form-group">
              <label htmlFor="currentPassword">Contraseña Actual *</label>
              <input
                type="password"
                id="currentPassword"
                value={passwordForm.currentPassword}
                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                placeholder="Ingresa tu contraseña actual"
                disabled={isChangingPassword}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">Nueva Contraseña *</label>
              <input
                type="password"
                id="newPassword"
                value={passwordForm.newPassword}
                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                placeholder="Ingresa la nueva contraseña (mín. 6 caracteres)"
                disabled={isChangingPassword}
                minLength={6}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmar Nueva Contraseña *</label>
              <input
                type="password"
                id="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                placeholder="Confirma la nueva contraseña"
                disabled={isChangingPassword}
                minLength={6}
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn-primary"
              disabled={isChangingPassword}
            >
              {isChangingPassword ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </form>
        </section>

        {/* Sección: Gestión de Usuarios (Solo para Admins) */}
        {currentUser.role === 'admin' && (
          <section className="settings-section users-section">
            <div className="section-header">
              <h2>Gestión de Usuarios</h2>
              <p>Administra los usuarios del sistema</p>
            </div>

            <div className="users-management">
              <div className="users-header">
                <button 
                  className="btn-secondary"
                  onClick={() => setIsCreateUserModalOpen(true)}
                >
                  + Crear Nuevo Usuario
                </button>
              </div>

              <div className="users-list">
                {users.length === 0 ? (
                  <div className="empty-users">
                    <p>No hay usuarios registrados</p>
                  </div>
                ) : (
                  <div className="users-table">
                    <div className="users-table-header">
                      <span>Usuario</span>
                      <span>Rol</span>
                      <span>Fecha de Creación</span>
                      <span>Estado</span>
                    </div>
                    
                    <div className="users-table-body">
                      {users.map(user => (
                        <div key={user.userId} className="users-table-row">
                          <span className="user-username">
                            {user.username}
                            {user.userId === currentUser.userId && (
                              <span className="current-user-badge">(Tú)</span>
                            )}
                          </span>
                          <span className={`user-role role-${user.role}`}>
                            {getRoleDisplayName(user.role)}
                          </span>
                          <span className="user-created">
                            {new Date(user.createdAt).toLocaleDateString('es-ES')}
                          </span>
                          <span className={`user-status ${user.isActive ? 'active' : 'inactive'}`}>
                            {user.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Modal para crear nuevo usuario */}
      {isCreateUserModalOpen && (
        <CreateUserModal
          isOpen={isCreateUserModalOpen}
          onClose={() => setIsCreateUserModalOpen(false)}
          onSuccess={handleCreateUserSuccess}
        />
      )}

      {/* Botón de logout */}
      <button 
        className="logout-button"
        onClick={handleLogout}
        title="Cerrar sesión"
      >
        🚪 Salir
      </button>
    </div>
  );
};

export default SettingsScreen;
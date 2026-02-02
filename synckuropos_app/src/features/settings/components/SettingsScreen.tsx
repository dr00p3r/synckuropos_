import React, { useState, useEffect, useRef } from 'react';
import { useAuth, useDatabase } from '@/hooks';
import { CreateUserModal } from './CreateUserModal';
import type { User } from '../types';
import { generatePerformanceData } from '@/utils/performanceTest';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';

const SettingsScreen: React.FC = () => {
  const { currentUser, updateUserPassword, getAllUsers, logout } = useAuth();
  const db = useDatabase();
  const toast = useRef<Toast>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [isGeneratingData, setIsGeneratingData] = useState(false);

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
      toast.current?.show({ severity: 'warn', summary: 'Atención', detail: 'Todos los campos son obligatorios' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'La nueva contraseña y la confirmación no coinciden' });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.current?.show({ severity: 'warn', summary: 'Atención', detail: 'La nueva contraseña debe tener al menos 6 caracteres' });
      return;
    }

    setIsChangingPassword(true);

    const success = await updateUserPassword(
      currentUser.userId,
      passwordForm.currentPassword,
      passwordForm.newPassword
    );

    if (success) {
      toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Contraseña actualizada correctamente' });
      // Limpiar el formulario
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } else {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar la contraseña. Verifica tu contraseña actual.' });
    }

    setIsChangingPassword(false);
  };

  const handleCreateUserSuccess = () => {
    setIsCreateUserModalOpen(false);
    toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Usuario creado correctamente' });
    if (currentUser?.role === 'admin') {
      loadUsers();
    }
  };

  const handleLogout = () => {
    confirmDialog({
      message: '¿Estás seguro de que quieres cerrar sesión?',
      header: 'Confirmación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, salir',
      rejectLabel: 'Cancelar',
      accept: () => logout(),
    });
  };

  const handleGenerateData = async () => {
    confirmDialog({
      message: '¿Estás seguro de que quieres generar 1000 productos de prueba?',
      header: 'Confirmación',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        setIsGeneratingData(true);
        try {
          const result = await generatePerformanceData(db);
          toast.current?.show({
            severity: 'success',
            summary: 'Operación Completada',
            detail: `Se generaron ${result.count} productos en ${result.duration}ms`
          });
        } catch (error) {
          console.error(error);
          toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error al generar datos' });
        } finally {
          setIsGeneratingData(false);
        }
      }
    });
  };

  const roleBodyTemplate = (user: User) => {
    return <Tag value={user.role === 'admin' ? 'Administrador' : 'Cajero'} severity={user.role === 'admin' ? 'info' : 'warning'} />;
  };

  const statusBodyTemplate = (user: User) => {
    return <Tag value={user.isActive ? 'Activo' : 'Inactivo'} severity={user.isActive ? 'success' : 'danger'} />;
  };

  const dateBodyTemplate = (user: User) => {
    return new Date(user.createdAt).toLocaleDateString('es-ES');
  };

  if (!currentUser) {
    return (
      <div className="flex align-items-center justify-content-center h-screen">
        <div className="text-red-500 font-bold">No hay un usuario autenticado</div>
      </div>
    );
  }

  return (
    <div className="p-3">
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="flex justify-content-between align-items-center mb-4">
        <h1 className="text-3xl font-bold m-0 text-900">Ajustes</h1>
        <Button
          label="Cerrar Sesión"
          icon="pi pi-power-off"
          severity="danger"
          text
          onClick={handleLogout}
        />
      </div>

      <div className="grid">
        {/* Sección: Cambiar Contraseña */}
        <div className="col-12 md:col-6">
          <Card title="Seguridad" subTitle="Actualiza tu contraseña" className="h-full shadow-2">
            <form onSubmit={handlePasswordSubmit} className="flex flex-column gap-3">
              <div className="flex flex-column gap-2">
                <label htmlFor="currentPassword">Contraseña Actual</label>
                <Password
                  id="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                  toggleMask
                  feedback={false}
                  className="w-full"
                  inputClassName="w-full"
                />
              </div>

              <div className="flex flex-column gap-2">
                <label htmlFor="newPassword">Nueva Contraseña</label>
                <Password
                  id="newPassword"
                  value={passwordForm.newPassword}
                  onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                  toggleMask
                  className="w-full"
                  inputClassName="w-full"
                  header={<div className="font-bold mb-2">Sugerencia</div>}
                  footer={<div className="mt-2">Mínimo 6 caracteres</div>}
                />
              </div>

              <div className="flex flex-column gap-2">
                <label htmlFor="confirmPassword">Confirmar Nueva Contraseña</label>
                <Password
                  id="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                  toggleMask
                  feedback={false}
                  className="w-full"
                  inputClassName="w-full"
                />
              </div>

              <Button
                label="Guardar Cambios"
                icon="pi pi-save"
                loading={isChangingPassword}
                type="submit"
                className="mt-2"
              />
            </form>
          </Card>
        </div>

        {/* Sección: Gestión de Usuarios (Solo Admins) */}
        {currentUser.role === 'admin' && (
          <div className="col-12 md:col-6">
            <Card title="Usuarios" subTitle="Gestión de usuarios del sistema" className="h-full shadow-2">
              <div className="mb-3 flex justify-content-end">
                <Button
                  label="Nuevo Usuario"
                  icon="pi pi-user-plus"
                  onClick={() => setIsCreateUserModalOpen(true)}
                  size="small"
                />
              </div>

              <DataTable value={users} paginator rows={5} size="small" emptyMessage="No hay usuarios registrados.">
                <Column field="username" header="Usuario" sortable body={(u) => (
                  <span>
                    {u.username} {u.userId === currentUser.userId && <span className="font-bold text-primary">(Tú)</span>}
                  </span>
                )} />
                <Column field="role" header="Rol" body={roleBodyTemplate} sortable />
                <Column field="createdAt" header="Creado" body={dateBodyTemplate} sortable />
                <Column field="isActive" header="Estado" body={statusBodyTemplate} />
              </DataTable>
            </Card>
          </div>
        )}

        {/* Sección: Herramientas de Desarrollo */}
        {currentUser.role === 'admin' && (
          <div className="col-12 mt-3">
            <Card title="Herramientas de Desarrollo" className="shadow-2 border-left-3 border-orange-500">
              <div className="flex align-items-center justify-content-between flex-wrap gap-3">
                <div>
                  <span className="font-bold block mb-1">Generador de Datos de Prueba</span>
                  <span className="text-600 text-sm">Crea 1000 productos aleatorios para probar el rendimiento del inventario y las búsquedas.</span>
                </div>
                <Button
                  label="Generar 1000 Productos"
                  icon="pi pi-bolt"
                  severity="warning"
                  onClick={handleGenerateData}
                  loading={isGeneratingData}
                />
              </div>
            </Card>
          </div>
        )}
      </div>

      <CreateUserModal
        isOpen={isCreateUserModalOpen}
        onClose={() => setIsCreateUserModalOpen(false)}
        onSuccess={handleCreateUserSuccess}
      />
    </div>
  );
};

export default SettingsScreen;
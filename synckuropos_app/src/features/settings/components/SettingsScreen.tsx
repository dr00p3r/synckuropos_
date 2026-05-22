import React, { useState, useEffect, useRef } from 'react';
import { useAuth, useDatabase } from '@/hooks';
import { CreateUserModal } from './CreateUserModal';
import type { User } from '../types';
import type { TaxRate, BankAccount } from '@/types/types';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { eq, desc } from 'drizzle-orm';
import * as schema from '@/db/schema';

const SettingsScreen: React.FC = () => {
  const { currentUser, updateUserPassword, getAllUsers, logout } = useAuth();
  const db = useDatabase();
  const toast = useRef<Toast>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);

  // Estado de IVA
  const [taxRatesList, setTaxRatesList] = useState<TaxRate[]>([]);
  const [showTaxRateDialog, setShowTaxRateDialog] = useState(false);
  const [newTaxRate, setNewTaxRate] = useState<number>(15);
  const [activeTaxRate, setActiveTaxRate] = useState<TaxRate | null>(null);

  // Estado para el formulario de cambio de contraseña
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Estado de Cuentas Bancarias
  const [bankAccountsList, setBankAccountsList] = useState<BankAccount[]>([]);
  const [showBankAccountDialog, setShowBankAccountDialog] = useState(false);
  const [bankAccountForm, setBankAccountForm] = useState({
    bankName: '',
    accountNumber: '',
    accountHolder: ''
  });

  // Cargar usuarios y tasas de IVA al montar (solo para admins)
  useEffect(() => {
    if (currentUser?.role === 'admin') {
      loadUsers();
    }
    loadTaxRates();
    loadBankAccounts();
  }, [currentUser]);

  const loadUsers = async () => {
    const allUsers = await getAllUsers();
    setUsers(allUsers);
  };

  const loadTaxRates = async () => {
    try {
      const allRates = await db
        .select()
        .from(schema.taxRates)
        .where(eq(schema.taxRates._deleted, false))
        .orderBy(desc(schema.taxRates.effectiveFrom));
      setTaxRatesList(allRates as TaxRate[]);
      // La tasa activa es la más reciente con effectiveFrom <= ahora
      const now = Date.now();
      const active = allRates.find((r: any) => r.effectiveFrom <= now);
      setActiveTaxRate((active as TaxRate) || null);
    } catch (error) {
      console.error('Error loading tax rates:', error);
    }
  };

  const loadBankAccounts = async () => {
    try {
      const accounts = await db
        .select()
        .from(schema.bankAccounts)
        .where(eq(schema.bankAccounts._deleted, false));
      setBankAccountsList(accounts as BankAccount[]);
    } catch (error) {
      console.error('Error loading bank accounts:', error);
    }
  };

  const handleAddBankAccount = async () => {
    try {
      if (!bankAccountForm.bankName.trim() || !bankAccountForm.accountNumber.trim() || !bankAccountForm.accountHolder.trim()) {
        toast.current?.show({ severity: 'warn', summary: 'Atención', detail: 'Todos los campos son obligatorios' });
        return;
      }
      const now = Date.now();
      await db.insert(schema.bankAccounts).values({
        id: crypto.randomUUID(),
        bankName: bankAccountForm.bankName.trim(),
        accountNumber: bankAccountForm.accountNumber.trim(),
        accountHolder: bankAccountForm.accountHolder.trim(),
        _deleted: false,
        createdAt: now,
        updatedAt: now,
        synced: 0,
      });
      toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Cuenta bancaria agregada' });
      setShowBankAccountDialog(false);
      setBankAccountForm({ bankName: '', accountNumber: '', accountHolder: '' });
      loadBankAccounts();
    } catch (error) {
      console.error('Error adding bank account:', error);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo agregar la cuenta' });
    }
  };

  const handleDeleteBankAccount = async (accountId: string) => {
    try {
      await db
        .update(schema.bankAccounts)
        .set({ _deleted: true, updatedAt: Date.now() })
        .where(eq(schema.bankAccounts.id, accountId));
      toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Cuenta eliminada' });
      loadBankAccounts();
    } catch (error) {
      console.error('Error deleting bank account:', error);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la cuenta' });
    }
  };

  const handleAddTaxRate = async () => {
    try {
      const now = Date.now();
      const id = crypto.randomUUID();
      await db.insert(schema.taxRates).values({
        id,
        rate: newTaxRate / 100,
        effectiveFrom: now,
        _deleted: false,
        createdAt: now,
        updatedAt: now,
        synced: 0,
      });
      toast.current?.show({ severity: 'success', summary: 'Éxito', detail: `Tasa de IVA ${newTaxRate}% agregada` });
      setShowTaxRateDialog(false);
      loadTaxRates();
    } catch (error) {
      console.error('Error adding tax rate:', error);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo agregar la tasa' });
    }
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

  const { formatLastSync, isOffline, lastSyncStatus, consecutiveFailures } = useSyncStatus();

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

  const roleBodyTemplate = (user: User) => {
    return <Tag value={user.role === 'admin' ? 'Administrador' : 'Cajero'} severity={user.role === 'admin' ? 'info' : 'warning'} />;
  };

  const statusBodyTemplate = (user: User) => {
    return <Tag value={!user._deleted ? 'Activo' : 'Inactivo'} severity={!user._deleted ? 'success' : 'danger'} />;
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
    <div className="h-full overflow-y-auto overflow-x-hidden pb-6">
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="grid">
        {/* Sección: Cambiar Contraseña */}
        <div className="col-12 md:col-4">
          <Card title="Seguridad" subTitle="Actualiza tu contraseña" className="h-full shadow-1 border-round-xl bg-white">
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
          <div className="col-12 md:col-8">
            <Card className="h-full shadow-1 border-round-xl bg-white">
              <div className="flex justify-content-between align-items-center mb-3">
                <div>
                  <div className="text-xl font-bold text-900">Usuarios</div>
                  <div className="text-sm text-600">Gestión de usuarios del sistema</div>
                </div>
                <Button
                  label="Nuevo Usuario"
                  icon="pi pi-user-plus"
                  onClick={() => setIsCreateUserModalOpen(true)}
                  rounded
                  raised
                />
              </div>

              <DataTable value={users} scrollable scrollHeight="300px" size="small" stripedRows emptyMessage="No hay usuarios registrados.">
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

        {/* Sección: Estado de Sincronización (visible solo si hay fallos o para admins) */}
        {(currentUser.role === 'admin' || isOffline) && (
          <div className="col-12 md:col-6">
            <Card title="Sincronización" className="shadow-1 border-round-xl bg-white">
              <div className="flex flex-column gap-2">
                <div className="flex align-items-center justify-content-between">
                  <span className="font-medium">Última sincronización:</span>
                  <span className={isOffline ? 'text-red-500 font-bold' : 'text-green-500'}>
                    {formatLastSync()}
                  </span>
                </div>
                {isOffline && (
                  <div className="flex align-items-center gap-2 text-red-500">
                    <i className="pi pi-exclamation-circle" />
                    <span>Sin conexión al servidor ({consecutiveFailures} fallos consecutivos)</span>
                  </div>
                )}
                {lastSyncStatus === 'syncing' && (
                  <div className="flex align-items-center gap-2 text-orange-500">
                    <i className="pi pi-spin pi-spinner" />
                    <span>Sincronizando...</span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Sección: Configuración de IVA */}
        {currentUser.role === 'admin' && (
          <div className="col-12 md:col-6">
            <Card title="Configuración de IVA" className="shadow-1 border-round-xl bg-white">
              <div className="flex align-items-center justify-content-between flex-wrap gap-3 mb-3">
                <div>
                  <span className="font-bold block mb-1">Tasa Actual</span>
                  <span className="text-600 text-sm">
                    {activeTaxRate
                      ? (
                          <span suppressHydrationWarning>
                              {`${(activeTaxRate.rate * 100).toFixed(0)}% (desde ${new Date(activeTaxRate.effectiveFrom).toLocaleDateString('es-ES')})`}
                          </span>
                        )
                      : 'No configurada'}
                  </span>
                </div>
                <Button
                  label="Nueva Tasa"
                  icon="pi pi-plus"
                  severity="warning"
                  onClick={() => setShowTaxRateDialog(true)}
                />
              </div>

              <DataTable value={taxRatesList} scrollable scrollHeight="200px" size="small" stripedRows emptyMessage="No hay tasas registradas.">
                <Column
                  field="rate"
                  header="IVA"
                  body={(r: TaxRate) => `${(r.rate * 100).toFixed(0)}%`}
                />
                <Column
                  field="effectiveFrom"
                  header="Vigente desde"
                  body={(r: TaxRate) => <span suppressHydrationWarning>{new Date(r.effectiveFrom).toLocaleDateString('es-ES')}</span>}
                />
              </DataTable>
            </Card>
          </div>
        )}

        {/* Sección: Datos Bancarios */}
        {currentUser.role === 'admin' && (
          <div className="col-12 md:col-6">
            <Card title="Datos Bancarios" className="shadow-1 border-round-xl bg-white">
              <div className="flex align-items-center justify-content-between flex-wrap gap-3 mb-3">
                <div>
                  <span className="font-bold block mb-1">Cuentas para transferencias</span>
                  <span className="text-600 text-sm">
                    {bankAccountsList.length > 0 ? `${bankAccountsList.length} cuenta(s) registrada(s)` : 'No hay cuentas registradas'}
                  </span>
                </div>
                <Button
                  label="Nueva Cuenta"
                  icon="pi pi-plus"
                  severity="info"
                  onClick={() => setShowBankAccountDialog(true)}
                />
              </div>

              <DataTable value={bankAccountsList} size="small" stripedRows emptyMessage="No hay cuentas registradas.">
                <Column field="bankName" header="Banco" />
                <Column field="accountHolder" header="Titular" />
                <Column field="accountNumber" header="Cuenta" />
                <Column
                  body={(account: BankAccount) => (
                    <Button
                      icon="pi pi-trash"
                      rounded
                      text
                      severity="danger"
                      onClick={() => handleDeleteBankAccount(account.id)}
                    />
                  )}
                  style={{ width: '3rem', textAlign: 'center' }}
                />
              </DataTable>
            </Card>
          </div>
        )}

        {/* Diálogo: Nueva Tasa de IVA */}
        <Dialog
          header="Nueva Tasa de IVA"
          visible={showTaxRateDialog}
          style={{ width: '90vw', maxWidth: '400px' }}
          onHide={() => setShowTaxRateDialog(false)}
          footer={
            <div>
              <Button label="Cancelar" icon="pi pi-times" onClick={() => setShowTaxRateDialog(false)} className="p-button-text" />
              <Button label="Guardar" icon="pi pi-check" onClick={handleAddTaxRate} />
            </div>
          }
        >
          <div className="flex flex-column gap-3 mt-2">
            <div className="flex flex-column gap-2">
              <label htmlFor="taxRate" className="font-semibold">Porcentaje de IVA (%)</label>
              <div className="p-inputgroup">
                <InputNumber
                  id="taxRate"
                  value={newTaxRate}
                  onValueChange={(e) => setNewTaxRate(e.value ?? 15)}
                  min={0}
                  max={30}
                  showButtons
                  suffix="%"
                />
              </div>
            </div>
            <span className="text-600 text-sm">
              La nueva tasa entrará en vigor inmediatamente. Las tasas anteriores se conservan como historial.
            </span>
          </div>
        </Dialog>

        {/* Diálogo: Nueva Cuenta Bancaria */}
        <Dialog
          header="Nueva Cuenta Bancaria"
          visible={showBankAccountDialog}
          style={{ width: '90vw', maxWidth: '400px' }}
          onHide={() => setShowBankAccountDialog(false)}
          footer={
            <div>
              <Button label="Cancelar" icon="pi pi-times" onClick={() => setShowBankAccountDialog(false)} className="p-button-text" />
              <Button label="Guardar" icon="pi pi-check" onClick={handleAddBankAccount} />
            </div>
          }
        >
          <div className="flex flex-column gap-3 mt-2">
            <div className="flex flex-column gap-2">
              <label htmlFor="bankName" className="font-semibold">Banco</label>
              <input
                id="bankName"
                type="text"
                value={bankAccountForm.bankName}
                onChange={(e) => setBankAccountForm(prev => ({ ...prev, bankName: e.target.value }))}
                placeholder="Ej. Banco Pichincha"
                className="p-inputtext w-full"
              />
            </div>
            <div className="flex flex-column gap-2">
              <label htmlFor="accountHolder" className="font-semibold">Titular de la cuenta</label>
              <input
                id="accountHolder"
                type="text"
                value={bankAccountForm.accountHolder}
                onChange={(e) => setBankAccountForm(prev => ({ ...prev, accountHolder: e.target.value }))}
                placeholder="Ej. Juan Pérez"
                className="p-inputtext w-full"
              />
            </div>
            <div className="flex flex-column gap-2">
              <label htmlFor="accountNumber" className="font-semibold">Número de cuenta</label>
              <input
                id="accountNumber"
                type="text"
                value={bankAccountForm.accountNumber}
                onChange={(e) => setBankAccountForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                placeholder="Ej. 1234567890"
                className="p-inputtext w-full"
              />
            </div>
          </div>
        </Dialog>
      </div>

      <CreateUserModal
        isOpen={isCreateUserModalOpen}
        onClose={() => setIsCreateUserModalOpen(false)}
        onSuccess={handleCreateUserSuccess}
      />

      <div className="fixed bottom-0 left-0 p-3 z-5">
        <Button
          label="Cerrar Sesión"
          icon="pi pi-sign-out"
          severity="danger"
          onClick={handleLogout}
        />
      </div>
    </div>
  );
};

export default SettingsScreen;
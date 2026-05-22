import React from 'react';
import { Dialog } from 'primereact/dialog';
import { TabView, TabPanel } from 'primereact/tabview';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { Checkbox } from 'primereact/checkbox';
import { Divider } from 'primereact/divider';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Tag } from 'primereact/tag';
import { useCustomerForm } from '../hooks/useCustomerForm';
import { formatCurrency } from '@/utils/formatters';
import { tabHeaderTemplate } from '@/utils/tabUtils';
import type { CustomerWithDebt } from '../services/customerRepository';

interface CustomerFormDialogProps {
    visible: boolean;
    onHide: () => void;
    onSave: () => void;
    customerToEdit?: CustomerWithDebt;
}

export const CustomerFormDialog: React.FC<CustomerFormDialogProps> = ({
    visible,
    onHide,
    onSave,
    customerToEdit
}) => {
    const {
        activeIndex,
        setActiveIndex,
        loading,
        isEditMode,
        form,
        updateField,
        paymentForm,
        setPaymentAmount,
        debtSummary,
        loadingDebt,
        handleSaveInfo,
        handleRegisterPayment,
        canShowPaymentsTab
    } = useCustomerForm({ visible, customerToEdit, onSave, onHide });

    return (
        <Dialog
            header={isEditMode ? `Cliente: ${form.fullname}` : "Nuevo Cliente"}
            visible={visible}
            className="w-full md:w-8 lg:w-6"
            onHide={onHide}
            maximizable
        >
            <div className="pt-2">
                <TabView
                    activeIndex={activeIndex}
                    onTabChange={(e) => setActiveIndex(e.index)}
                    className="p-0"
                >
                    {/* TAB 1: INFORMACIÓN */}
                    <TabPanel
                        header="Información"
                        leftIcon="pi pi-user"
                        headerTemplate={(opts) => tabHeaderTemplate({ ...opts, title: 'Información' })}
                    >
                        <div className="flex flex-column gap-4 pt-3">
                            {/* Nombre */}
                            <div className="flex flex-column gap-2">
                                <label htmlFor="fullname" className="font-semibold">
                                    Nombre Completo <span className="text-red-500">*</span>
                                </label>
                                <InputText
                                    id="fullname"
                                    value={form.fullname}
                                    onChange={(e) => updateField('fullname', e.target.value)}
                                    className="w-full"
                                    placeholder="Nombre del cliente"
                                />
                            </div>

                            {/* Teléfono y Email */}
                            <div className="formgrid grid">
                                <div className="field col-6 flex flex-column gap-2">
                                    <label htmlFor="phone" className="font-semibold">Teléfono</label>
                                    <InputText
                                        id="phone"
                                        value={form.phone}
                                        onChange={(e) => updateField('phone', e.target.value)}
                                        className="w-full"
                                        placeholder="0999999999"
                                        maxLength={10}
                                    />
                                </div>
                                <div className="field col-6 flex flex-column gap-2">
                                    <label htmlFor="email" className="font-semibold">Email</label>
                                    <InputText
                                        id="email"
                                        value={form.email}
                                        onChange={(e) => updateField('email', e.target.value)}
                                        className="w-full"
                                        placeholder="correo@ejemplo.com"
                                        type="email"
                                    />
                                </div>
                            </div>

                            {/* Dirección */}
                            <div className="flex flex-column gap-2">
                                <label htmlFor="address" className="font-semibold">Dirección</label>
                                <InputTextarea
                                    id="address"
                                    value={form.address}
                                    onChange={(e) => updateField('address', e.target.value)}
                                    rows={2}
                                    className="w-full"
                                    placeholder="Dirección del cliente"
                                />
                            </div>

                            <Divider />

                            {/* Configuración de Crédito */}
                            <div className="surface-ground p-3 border-round">
                                <div className="flex align-items-center gap-3 mb-3">
                                    <Checkbox
                                        inputId="allowCredit"
                                        checked={form.allowCredit}
                                        onChange={(e) => updateField('allowCredit', e.checked ?? false)}
                                    />
                                    <label htmlFor="allowCredit" className="font-semibold cursor-pointer">
                                        Permitir Crédito
                                    </label>
                                </div>

                                {form.allowCredit && (
                                    <div className="flex flex-column gap-2 mt-3">
                                        <label htmlFor="creditLimit" className="font-semibold">
                                            Límite de Crédito ($)
                                        </label>
                                        <InputNumber
                                            id="creditLimit"
                                            value={form.creditLimit}
                                            onValueChange={(e) => updateField('creditLimit', e.value ?? null)}
                                            mode="currency"
                                            currency="USD"
                                            locale="es-EC"
                                            min={0}
                                            className="w-full md:w-6"
                                            inputClassName="w-full"
                                            placeholder="$0.00"
                                        />
                                        <small className="text-500">
                                            Monto máximo que el cliente puede deber
                                        </small>
                                    </div>
                                )}
                            </div>

                            {/* Botón Guardar */}
                            <div className="flex justify-content-end pt-2">
                                <Button
                                    label={isEditMode ? "Actualizar" : "Guardar"}
                                    icon="pi pi-check"
                                    onClick={handleSaveInfo}
                                    loading={loading}
                                />
                            </div>
                        </div>
                    </TabPanel>

                    {/* TAB 2: PAGOS (solo si tiene crédito) */}
                    <TabPanel
                        header="Pagos"
                        leftIcon="pi pi-dollar"
                        disabled={!canShowPaymentsTab}
                        headerTemplate={(opts) => tabHeaderTemplate({ ...opts, title: 'Pagos' })}
                    >
                        <div className="flex flex-column gap-4 pt-3">
                            {loadingDebt ? (
                                <div className="flex justify-content-center p-5">
                                    <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                                </div>
                            ) : debtSummary ? (
                                <>
                                    {/* Resumen de Deuda */}
                                    <div className="grid">
                                        <div className="col-12 md:col-6">
                                            <div className="surface-card p-4 border-round shadow-1">
                                                <div className="text-500 mb-2">Deuda Total</div>
                                                <div className={`text-3xl font-bold ${debtSummary.totalDebt > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                    {formatCurrency(debtSummary.totalDebt)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-12 md:col-6">
                                            <div className="surface-card p-4 border-round shadow-1">
                                                <div className="text-500 mb-2">Crédito Disponible</div>
                                                <div className="text-3xl font-bold text-blue-500">
                                                    {formatCurrency(
                                                        Math.max(0, (customerToEdit?.creditLimit ?? 0) - debtSummary.totalDebt)
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {debtSummary.totalDebt > 0 ? (
                                        <>
                                            {/* Lista de Deudas */}
                                            <div className="surface-ground p-3 border-round">
                                                <div className="text-900 font-medium mb-3">
                                                    Deudas Pendientes ({debtSummary.debtsCount})
                                                </div>
                                                <div className="flex flex-column gap-2">
                                                    {debtSummary.debts.map((debt) => (
                                                        <div
                                                            key={debt.debtId}
                                                            className="surface-card p-3 border-round flex justify-content-between align-items-center"
                                                        >
                                                            <div className="flex flex-column">
                                                            <span className="text-sm text-500" suppressHydrationWarning>
                                                                {new Date(debt.createdAt).toLocaleDateString()}
                                                            </span>
                                                                <span className="text-sm">
                                                                    Original: {formatCurrency(debt.amount)} |
                                                                    Pagado: {formatCurrency(debt.totalPaid)}
                                                                </span>
                                                            </div>
                                                            <Tag
                                                                value={formatCurrency(debt.pendingAmount)}
                                                                severity="danger"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <Divider />

                                            {/* Formulario de Pago */}
                                            <div className="surface-card p-4 border-round shadow-1">
                                                <div className="text-900 font-medium mb-3 flex align-items-center gap-2">
                                                    <i className="pi pi-credit-card text-primary"></i>
                                                    Registrar Abono
                                                </div>
                                                <div className="formgrid grid">
                                                    <div className="field col-12 md:col-8 flex flex-column gap-2">
                                                        <label htmlFor="paymentAmount" className="font-semibold">Monto a Abonar ($)</label>
                                                        <InputNumber
                                                            id="paymentAmount"
                                                            value={paymentForm.amount}
                                                            onValueChange={(e) => setPaymentAmount(e.value ?? null)}
                                                            mode="currency"
                                                            currency="USD"
                                                            locale="es-EC"
                                                            min={0}
                                                            max={debtSummary.totalDebt / 100}
                                                            className="w-full"
                                                            inputClassName="w-full text-xl"
                                                            placeholder="$0.00"
                                                        />
                                                        <small className="text-500">
                                                            El pago se aplicará a las deudas más antiguas primero
                                                        </small>
                                                    </div>
                                                    <div className="field col-12 md:col-4 flex align-items-end">
                                                        <Button
                                                            label="Aplicar Pago"
                                                            icon="pi pi-check"
                                                            className="w-full"
                                                            severity="success"
                                                            onClick={handleRegisterPayment}
                                                            loading={loading}
                                                            disabled={!paymentForm.amount || paymentForm.amount <= 0}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-column align-items-center justify-content-center p-5 surface-ground border-round">
                                            <i className="pi pi-check-circle text-green-500 text-5xl mb-3"></i>
                                            <span className="text-xl font-medium text-900">Sin deudas pendientes</span>
                                            <span className="text-500">Este cliente no tiene saldos por pagar</span>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex flex-column align-items-center justify-content-center p-5">
                                    <i className="pi pi-info-circle text-500 text-4xl mb-3"></i>
                                    <span className="text-500">No se pudo cargar la información de deudas</span>
                                </div>
                            )}
                        </div>
                    </TabPanel>
                </TabView>
            </div>
        </Dialog>
    );
};
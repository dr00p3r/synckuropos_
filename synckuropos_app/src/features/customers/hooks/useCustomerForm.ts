import { useState, useEffect, useCallback } from 'react';
import { useDatabase, useToast, useAuth } from '@/hooks';
import { customerRepository, type CustomerWithDebt, type CustomerDebtSummary } from '../services/customerRepository';

interface UseCustomerFormProps {
    visible: boolean;
    customerToEdit?: CustomerWithDebt;
    onSave: () => void;
    onHide: () => void;
}

interface CustomerFormState {
    fullname: string;
    phone: string;
    email: string;
    address: string;
    allowCredit: boolean;
    creditLimit: number | null; // En dólares para el form
}

interface PaymentFormState {
    amount: number | null;
}

const INITIAL_FORM_STATE: CustomerFormState = {
    fullname: '',
    phone: '',
    email: '',
    address: '',
    allowCredit: false,
    creditLimit: null
};

const INITIAL_PAYMENT_STATE: PaymentFormState = {
    amount: null
};

export const useCustomerForm = ({ visible, customerToEdit, onSave, onHide }: UseCustomerFormProps) => {
    const db = useDatabase();
    const toast = useToast();
    const { currentUser } = useAuth();

    // UI State
    const [activeIndex, setActiveIndex] = useState(0);
    const [loading, setLoading] = useState(false);

    // Form State
    const [form, setForm] = useState<CustomerFormState>(INITIAL_FORM_STATE);
    const [paymentForm, setPaymentForm] = useState<PaymentFormState>(INITIAL_PAYMENT_STATE);

    // Debt Summary (para el tab de pagos)
    const [debtSummary, setDebtSummary] = useState<CustomerDebtSummary | null>(null);
    const [loadingDebt, setLoadingDebt] = useState(false);

    // Helpers
    const isEditMode = !!customerToEdit;

    // Actualizar campo del form
    const updateField = useCallback(<K extends keyof CustomerFormState>(
        field: K,
        value: CustomerFormState[K]
    ) => {
        setForm(prev => ({ ...prev, [field]: value }));
    }, []);

    // Reset completo
    const resetForm = useCallback(() => {
        setForm(INITIAL_FORM_STATE);
        setPaymentForm(INITIAL_PAYMENT_STATE);
        setDebtSummary(null);
        setActiveIndex(0);
    }, []);

    // Cargar datos del cliente para edición
    const loadCustomerData = useCallback((customer: CustomerWithDebt) => {
        setForm({
            fullname: customer.fullname,
            phone: customer.phone || '',
            email: customer.email || '',
            address: customer.address || '',
            allowCredit: customer.allowCredit,
            creditLimit: customer.creditLimit / 100 // Convertir de centavos a dólares
        });
    }, []);

    // Cargar resumen de deuda
    const loadDebtSummary = useCallback(async () => {
        if (!db || !customerToEdit) return;

        setLoadingDebt(true);
        try {
            const summary = await customerRepository.getCustomerDebtSummary(db, customerToEdit.customerId);
            setDebtSummary(summary);
        } catch (error) {
            console.error('Error cargando deudas:', error);
            toast.showError('Error al cargar las deudas');
        } finally {
            setLoadingDebt(false);
        }
    }, [db, customerToEdit, toast]);

    // Efecto de apertura
    useEffect(() => {
        if (visible) {
            if (customerToEdit) {
                loadCustomerData(customerToEdit);
                // Si tiene crédito habilitado, cargar las deudas
                if (customerToEdit.allowCredit) {
                    loadDebtSummary();
                }
            } else {
                resetForm();
            }
        }
    }, [visible, customerToEdit, loadCustomerData, resetForm, loadDebtSummary]);

    // Recargar deudas cuando cambia el tab a pagos
    useEffect(() => {
        if (visible && activeIndex === 1 && customerToEdit?.allowCredit) {
            loadDebtSummary();
        }
    }, [visible, activeIndex, customerToEdit, loadDebtSummary]);

    // Guardar información del cliente
    const handleSaveInfo = useCallback(async () => {
        if (!form.fullname.trim()) {
            toast.showError('El nombre es obligatorio');
            return;
        }

        if (!db) return;

        setLoading(true);
        try {
            if (customerToEdit) {
                // Actualizar
                await customerRepository.updateCustomer(db, customerToEdit.customerId, {
                    fullname: form.fullname,
                    phone: form.phone || undefined,
                    email: form.email || undefined,
                    address: form.address || undefined,
                    allowCredit: form.allowCredit,
                    creditLimit: form.creditLimit || 0
                });
                toast.showSuccess('Cliente actualizado');
                onSave();
                onHide();
            } else {
                // Crear
                await customerRepository.createCustomer(db, {
                    fullname: form.fullname,
                    phone: form.phone || undefined,
                    email: form.email || undefined,
                    address: form.address || undefined,
                    allowCredit: form.allowCredit,
                    creditLimit: form.creditLimit || 0
                });
                toast.showSuccess('Cliente creado');
                onSave();
                onHide();
            }
        } catch (error) {
            console.error('Error guardando cliente:', error);
            toast.showError('Error al guardar el cliente');
        } finally {
            setLoading(false);
        }
    }, [form, customerToEdit, db, toast, onSave, onHide]);

    // Registrar pago
    const handleRegisterPayment = useCallback(async () => {
        if (!paymentForm.amount || paymentForm.amount <= 0) {
            toast.showError('Ingrese un monto válido');
            return;
        }

        if (!db || !customerToEdit) return;

        // Validar que no pague más de lo que debe
        if (debtSummary && paymentForm.amount * 100 > debtSummary.totalDebt) {
            toast.showWarn('El monto excede la deuda total');
            return;
        }

        setLoading(true);
        try {
            const result = await customerRepository.registerPayment(
                db,
                customerToEdit.customerId,
                paymentForm.amount,
                currentUser?.userId || 'unknown'
            );

            toast.showSuccess(`Pago aplicado a ${result.paymentsCreated} deuda(s)`);
            setPaymentForm(INITIAL_PAYMENT_STATE);
            
            // Recargar deudas y lista
            await loadDebtSummary();
            onSave();
        } catch (error: any) {
            console.error('Error registrando pago:', error);
            toast.showError(error.message || 'Error al registrar el pago');
        } finally {
            setLoading(false);
        }
    }, [paymentForm, db, customerToEdit, debtSummary, currentUser, toast, loadDebtSummary, onSave]);

    return {
        // Estado UI
        activeIndex,
        setActiveIndex,
        loading,
        isEditMode,

        // Form de información
        form,
        updateField,

        // Form de pagos
        paymentForm,
        setPaymentAmount: (amount: number | null) => setPaymentForm({ amount }),

        // Deudas
        debtSummary,
        loadingDebt,

        // Acciones
        handleSaveInfo,
        handleRegisterPayment,

        // Helpers
        canShowPaymentsTab: isEditMode && customerToEdit?.allowCredit
    };
};
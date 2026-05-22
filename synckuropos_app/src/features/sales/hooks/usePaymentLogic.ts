import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useDatabase } from '../../../hooks/useDatabase';
import { useToast, useAuth } from '@/hooks';
import { salesRepository } from '../services/salesRepository';
import { customerRepository } from '../../customers/services/customerRepository';
import type { Customer, SaleItem, SaleSummary, BankAccount } from '@/types/types';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';

export type PaymentMethod = 'cash' | 'transfer' | 'credit';

interface UsePaymentLogicProps {
    saleItems: SaleItem[];
    summary: SaleSummary;
    onSaleCompleted: () => void;
}

export const usePaymentLogic = ({ saleItems, summary, onSaleCompleted }: UsePaymentLogicProps) => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
    const [receivedAmount, setReceivedAmount] = useState<string>('');
    const [processingPayment, setProcessingPayment] = useState(false);
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [customerDebt, setCustomerDebt] = useState(0);

    const db = useDatabase();
    const toast = useToast();
    const { currentUser } = useAuth();

    const customersLoaded = useRef(false);
    const bankAccountsLoaded = useRef(false);

    // Cargar clientes
    useEffect(() => {
        if (customersLoaded.current) return;
        const loadCustomers = async () => {
            try {
                const allCustomers = await db
                    .select()
                    .from(schema.customers)
                    .where(eq(schema.customers._deleted, false));
                setCustomers(allCustomers as Customer[]);
                customersLoaded.current = true;
            } catch (error) {
                console.error('Error loading customers:', error);
            }
        };
        loadCustomers();
    }, [db]);

    // Cargar cuentas bancarias
    useEffect(() => {
        if (bankAccountsLoaded.current) return;
        const loadBankAccounts = async () => {
            try {
                const accounts = await db
                    .select()
                    .from(schema.bankAccounts)
                    .where(eq(schema.bankAccounts._deleted, false));
                setBankAccounts(accounts as BankAccount[]);
                bankAccountsLoaded.current = true;
            } catch (error) {
                console.error('Error loading bank accounts:', error);
            }
        };
        loadBankAccounts();
    }, [db]);

    const selectedCustomer = customers.find(c => c.customerId === selectedCustomerId);

    // Si el método es crédito y el cliente no tiene crédito habilitado, cambiar a efectivo
    useEffect(() => {
        if (paymentMethod === 'credit' && selectedCustomer && !selectedCustomer.allowCredit) {
            setPaymentMethod('cash');
            setReceivedAmount('');
        }
    }, [selectedCustomer, paymentMethod]);

    // Calcular deuda del cliente seleccionado
    useEffect(() => {
        if (!selectedCustomerId) {
            setCustomerDebt(0);
            return;
        }
        const loadDebt = async () => {
            try {
                const debt = await customerRepository.calculateCustomerDebt(db, selectedCustomerId);
                setCustomerDebt(debt);
            } catch {
                setCustomerDebt(0);
            }
        };
        loadDebt();
    }, [selectedCustomerId, db]);

    const receivedCents = Math.round(parseFloat(receivedAmount || '0') * 100);
    const changeAmount = paymentMethod === 'cash' ? receivedCents - summary.total : 0;

    const creditLimit = selectedCustomer?.creditLimit ?? 0;
    const availableCredit = creditLimit - customerDebt;
    const creditExceeded = paymentMethod === 'credit' && summary.total > availableCredit;

    const isConfirmDisabled = useMemo(() => {
        if (saleItems.length === 0) return true;
        if (paymentMethod === 'cash') return receivedCents < summary.total;
        if (paymentMethod === 'credit') {
            if (!selectedCustomer) return true;
            if (!selectedCustomer.allowCredit) return true;
            return creditExceeded;
        }
        return false;
    }, [saleItems.length, paymentMethod, receivedCents, summary.total, selectedCustomer, creditExceeded]);

    const setQuickAmount = useCallback((amount: number) => {
        setReceivedAmount(amount.toFixed(2));
    }, []);

    const handleConfirmPurchase = async () => {
        if (saleItems.length === 0) return toast.showWarn('Carrito vacío');
        if (!currentUser) return toast.showError('Sesión inválida');

        if (paymentMethod === 'cash' && receivedCents < summary.total) {
            return toast.showError('Monto insuficiente');
        }
        if (paymentMethod === 'credit') {
            if (!selectedCustomer) {
                return toast.showError('Seleccione un cliente para fiar');
            }
            if (!selectedCustomer.allowCredit) {
                return toast.showError('Cliente sin crédito habilitado');
            }
            if (creditExceeded) {
                return toast.showError('La venta supera el crédito disponible del cliente');
            }
        }

        setProcessingPayment(true);

        try {
            await salesRepository.createSaleTransaction(db, {
                userId: currentUser.userId,
                saleItems,
                summary,
                receivedAmount: receivedCents,
                paymentMethod,
                customer: selectedCustomer
            });

            const msg = paymentMethod === 'credit'
                ? `Crédito registrado.`
                : paymentMethod === 'transfer'
                ? `Venta por transferencia registrada.`
                : `Venta exitosa. Cambio: $${(changeAmount / 100).toFixed(2)}`;

            toast.showSuccess(msg);
            onSaleCompleted();
        } catch (error) {
            console.error('Transaction failed:', error);
            toast.showError('Error al guardar la venta');
        } finally {
            setProcessingPayment(false);
        }
    };

    return {
        customers,
        selectedCustomerId,
        setSelectedCustomerId,
        paymentMethod,
        setPaymentMethod,
        receivedAmount,
        setReceivedAmount,
        setQuickAmount,
        processingPayment,
        selectedCustomer,
        changeAmount,
        bankAccounts,
        customerDebt,
        availableCredit,
        creditExceeded,
        isConfirmDisabled,
        handleConfirmPurchase
    };
};

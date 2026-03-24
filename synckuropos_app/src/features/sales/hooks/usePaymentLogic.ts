import { useState, useEffect } from 'react';
import { useDatabase } from '../../../hooks/useDatabase';
import { useToast, useAuth, useCart } from '@/hooks';
import { salesRepository } from '../services/salesRepository';
import { customerRepository } from '@/features/customers/services/customerRepository';
import type { Customer, SaleItem, SaleSummary } from '@/types/types';
import { useTelemetry } from '@/hooks/useTelemetry';
import { TelemetryEvents } from '@/types/telemetryEvents';

interface UsePaymentLogicProps {
    saleItems: SaleItem[];
    summary: SaleSummary;
    onSaleCompleted: () => void;
}

export const usePaymentLogic = ({ saleItems, summary, onSaleCompleted }: UsePaymentLogicProps) => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
    const [receivedAmount, setReceivedAmount] = useState<string>('');
    const [isCredit, setIsCredit] = useState(false);
    const [processingPayment, setProcessingPayment] = useState(false);

    const db = useDatabase();
    const toast = useToast();
    const { currentUser } = useAuth();
    const { logMetric } = useTelemetry();
    const { saleStartTime } = useCart();

    useEffect(() => {
        const loadCustomers = async () => {
            try {
                // Optimización: Solo traer campos necesarios si son muchos clientes
                const allCustomers = await db.customers.find({ selector: { isActive: true } }).exec();
                setCustomers(allCustomers.map((doc: any) => doc.toJSON()));
            } catch (error) {
                console.error('Error loading customers:', error);
            }
        };
        loadCustomers();
    }, [db]);

    const selectedCustomer = customers.find(c => c.customerId === selectedCustomerId);

    const receivedCents = Math.round(parseFloat(receivedAmount || '0') * 100);
    const changeAmount = receivedCents - summary.total;

    const handleConfirmPurchase = async () => {
        if (saleItems.length === 0) return toast.showWarn('Carrito vacío');
        if (!currentUser) return toast.showError('Sesión inválida');

        if (!isCredit && receivedCents < summary.total) {
            logMetric(TelemetryEvents.UX_FORM_BLOCK, { formId: 'payment-form', errorCount: 1, reason: 'insufficient_amount' });
            return toast.showError('Monto insuficiente');
        }
        if (isCredit) {
            if (!selectedCustomer) {
                logMetric(TelemetryEvents.UX_FORM_BLOCK, { formId: 'payment-form', errorCount: 1, reason: 'no_customer_selected' });
                return toast.showError('Seleccione un cliente para fiar');
            }
            if (!selectedCustomer.allowCredit) {
                logMetric(TelemetryEvents.UX_FORM_BLOCK, { formId: 'payment-form', errorCount: 1, reason: 'credit_not_allowed' });
                return toast.showError('Cliente sin crédito habilitado');
            }

            const currentDebt = await customerRepository.calculateCustomerDebt(db, selectedCustomer.customerId);
            const pendingCreditAmount = Math.max(0, summary.total - receivedCents);
            const creditLimit = selectedCustomer.creditLimit || 0;

            if (pendingCreditAmount > 0 && currentDebt + pendingCreditAmount > creditLimit) {
                logMetric(TelemetryEvents.UX_FORM_BLOCK, {
                    formId: 'payment-form',
                    errorCount: 1,
                    reason: 'credit_limit_exceeded'
                });
                return toast.showError('Cupo de crédito insuficiente para esta venta');
            }
        }

        setProcessingPayment(true);
        const startTime = performance.now();

        const integrityTotal = saleItems.reduce((acc, item) => {
            // El precio ya viene con IVA incluido.
            return acc + Math.round(item.totalPrice);
        }, 0);

        const diff = integrityTotal - summary.total;

        logMetric(TelemetryEvents.FINANCIAL_INTEGRITY_CHECK, {
            diff,
            totalRegistered: summary.total,
            totalCalculated: integrityTotal
        });

        if (diff !== 0) {
            console.error('[Financial Integrity] Mismatch detected!', diff);
        }

        try {
            await salesRepository.createSaleTransaction(db, {
                userId: currentUser.userId,
                saleItems,
                summary,
                receivedAmount: receivedCents,
                isCredit,
                customer: selectedCustomer
            });

            const durationMs = performance.now() - startTime;
            logMetric(TelemetryEvents.PERF_WRITE_LATENCY, {
                durationMs,
                itemsCount: saleItems.length
            });

            // Feedback y Limpieza
            const msg = isCredit
                ? `Crédito registrado.`
                : `Venta exitosa. Cambio: $${(changeAmount / 100).toFixed(2)}`;

            toast.showSuccess(msg);

            // Task Duration (Metrics)
            if (saleStartTime) {
                const durationSeconds = (performance.now() - saleStartTime) / 1000;
                logMetric(TelemetryEvents.TASK_DURATION, {
                    taskName: 'SALE_PROCESS',
                    durationSeconds
                });
            }

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
        receivedAmount,
        setReceivedAmount,
        isCredit,
        setIsCredit,
        processingPayment,
        selectedCustomer,
        changeAmount,
        handleConfirmPurchase
    };
};
import { useState, useEffect } from 'react';
import { useDatabase } from '../../../hooks/useDatabase';
import { useToast, useAuth } from '@/hooks';
import { salesRepository } from '../services/salesRepository';
import type { Customer, SaleItem, SaleSummary } from '@/types/types';

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
            return toast.showError('Monto insuficiente');
        }
        if (isCredit) {
            if (!selectedCustomer) return toast.showError('Seleccione un cliente para fiar');
            if (!selectedCustomer.allowCredit) return toast.showError('Cliente sin crédito habilitado');
        }

        setProcessingPayment(true);

        try {
            await salesRepository.createSaleTransaction(db, {
                userId: currentUser.userId,
                saleItems,
                summary,
                receivedAmount: receivedCents,
                isCredit,
                customer: selectedCustomer
            });

            // Feedback y Limpieza
            const msg = isCredit 
                ? `Crédito registrado.` 
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
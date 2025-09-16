import { useState, useEffect } from 'react';
import { useDatabase } from '../../../hooks/useDatabase.tsx';
import { useToast } from '../../../hooks/useToast';
import { v4 as uuidv4 } from 'uuid';

import { useAuth } from '../../../hooks/useAuth.tsx';

import type { Customer, SaleItem, SaleSummary, Sale, SaleDetail, Debt, DebtPayment } from '../../../types/types';

interface UsePaymentLogicProps {
  saleItems: SaleItem[];
  summary: SaleSummary;
  onSaleCompleted: () => void;
}

interface UsePaymentLogicReturn {
  customers: Customer[];
  selectedCustomerId: string;
  setSelectedCustomerId: (id: string) => void;
  receivedAmount: string;
  setReceivedAmount: (amount: string) => void;
  isCredit: boolean;
  setIsCredit: (credit: boolean) => void;
  processingPayment: boolean;
  selectedCustomer: Customer | undefined;
  changeAmount: number;
  handleConfirmPurchase: () => Promise<void>;
}

export const usePaymentLogic = ({ 
  saleItems, 
  summary, 
  onSaleCompleted 
}: UsePaymentLogicProps): UsePaymentLogicReturn => {
  // Payment states
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [receivedAmount, setReceivedAmount] = useState<string>('');
  const [isCredit, setIsCredit] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  
  // Hooks
  const db = useDatabase();
  const toast = useToast();
  const { currentUser } = useAuth();

  // Constants
  const TAX_RATE = 0.15; // 15% IVA

  // Load customers on component mount
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const allCustomers = await db.customers.find({
          selector: { _deleted: false }
        }).exec();
        
        const customersData = allCustomers.map((doc: any) => doc.toJSON());
        setCustomers(customersData);
      } catch (error) {
        console.error('Error loading customers:', error);
      }
    };

    loadCustomers();
  }, [db]);

  // Get selected customer
  const selectedCustomer = customers.find(customer => customer.customerId === selectedCustomerId);

  // Calculate change
  const receivedAmountNum = parseFloat(receivedAmount) || 0;
  const changeAmount = receivedAmountNum - summary.total;

  // Confirm purchase
  const handleConfirmPurchase = async () => {
    if (saleItems.length === 0) {
      toast.showWarning('No hay productos en la venta');
      return;
    }

    const receivedAmountNum = parseFloat(receivedAmount) || 0;

    // Validate payment
    if (!isCredit && receivedAmountNum < summary.total) {
      toast.showError('El monto recibido debe ser mayor o igual al total de la venta');
      return;
    }

    if (isCredit && !selectedCustomer) {
      toast.showError('Debe seleccionar un cliente para venta fiada');
      return;
    }

    if (isCredit && selectedCustomer && !selectedCustomer.allowCredit) {
      toast.showError('El cliente seleccionado no tiene crédito habilitado');
      return;
    }

    setProcessingPayment(true);

    try {
      // Validate user authentication
      if (!currentUser) {
        toast.showError('No hay usuario autenticado');
        return;
      }

      // Create sale
      const sale: Sale = {
        saleId: uuidv4(),
        userId: currentUser.userId,
        customerId: selectedCustomer?.customerId!,
        totalAmount: Math.round(summary.total * 100), // Convert to cents
        _deleted: false,
        isPartOfDebt: isCredit,
        SRIStatus: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.sales.insert(sale);

      // Create sale details
      for (const item of saleItems) {
        const taxAmount = item.totalPrice * TAX_RATE;
        const subtotal = item.totalPrice;
        const lineTotal = subtotal + taxAmount;

        const saleDetail: SaleDetail = {
          saleId: sale.saleId!,
          productId: item.productId!,
          quantity: item.quantity,
          unitPrice: Math.round(item.unitPrice * 100), // Convert to cents
          subtotal: Math.round(subtotal * 100),
          taxAmount: Math.round(taxAmount * 100),
          lineTotal: Math.round(lineTotal * 100),
          _deleted: false
        };

        await db.saleDetails.insert(saleDetail);
      }

      // If it's a credit sale, create debt and payment
      if (isCredit && selectedCustomer) {
        const debtAmount = Math.round((summary.total - receivedAmountNum) * 100); // Convert to cents

        if (debtAmount > 0) {
          const debt: Debt = {
            debtId: uuidv4(),
            customerId: selectedCustomer.customerId!,
            amount: debtAmount,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            _deleted: false
          };

          await db.debts.insert(debt);

          // If there was partial payment, create payment record
          if (receivedAmountNum > 0) {
            const payment: DebtPayment = {
              debtPaymentId: uuidv4(),
              debtId: debt.debtId!,
              userId: currentUser.userId,
              amountPaid: Math.round(receivedAmountNum * 100), // Convert to cents
              paymentDate: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              _deleted: false
            };

            await db.debtPayments.insert(payment);
          }
        }
      }

      // Show success message
      if (isCredit) {
        const paidAmount = receivedAmountNum;
        const debtAmount = summary.total - paidAmount;
        
        if (debtAmount > 0) {
          toast.showSuccess(
            `Venta fiada registrada. Pagado: $${paidAmount.toFixed(2)}, Debe: $${debtAmount.toFixed(2)}`
          );
        } else {
          toast.showSuccess(`Venta completada por $${summary.total.toFixed(2)}`);
        }
      } else {
        toast.showSuccess(`Venta completada. Cambio: $${changeAmount.toFixed(2)}`);
      }

      // Clear the sale
      onSaleCompleted();

    } catch (error) {
      console.error('Error processing sale:', error);
      toast.showError('Error al procesar la venta');
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
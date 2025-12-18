import { useState, useMemo } from 'react';
import { useRxQuery, useRxCollection } from 'rxdb-hooks';
import { useDatabase } from '@/hooks/useDatabase';
import { useToast } from '@/hooks/useToast';
import { v4 as uuidv4 } from 'uuid';
import { toCents, toDollars, calculatePercentage, formatMoney } from '@/utils/money';

import { useAuth } from '@/hooks/useAuth';

import type { Customer, SaleItem, SaleSummary, Sale, SaleDetail, Debt, DebtPayment } from '@/types/types';

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
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [receivedAmount, setReceivedAmount] = useState<string>('');
  const [isCredit, setIsCredit] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Hooks
  const customersCollection = useRxCollection('customers');
  const db = useDatabase();
  const toast = useToast();
  const { currentUser } = useAuth();

  // Constants
  const TAX_RATE = 0.15; // 15% IVA

  // Reactive customer query
  const customersQuery = useMemo(() => {
    if (!customersCollection) return null;
    return customersCollection.find({ selector: { isActive: true } });
  }, [customersCollection]);

  const { result: customers } = useRxQuery(customersQuery);

  // Get selected customer
  const selectedCustomer = customers?.find(customer => customer.customerId === selectedCustomerId);

  // Calculate change (converting summary.total from dollars to cents)
  const receivedAmountCents = toCents(receivedAmount);
  const totalCents = toCents(summary.total);
  const changeAmount = receivedAmountCents - totalCents;

  // Confirm purchase
  const handleConfirmPurchase = async () => {
    if (saleItems.length === 0) {
      toast.showWarning('No hay productos en la venta');
      return;
    }

    const receivedAmountCents = toCents(receivedAmount);
    const totalCents = toCents(summary.total);

    // Validate payment (both in cents)
    if (!isCredit && receivedAmountCents < totalCents) {
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

      // Create sale (totalCents already in cents from summary.total conversion)
      const sale: Sale = {
        saleId: uuidv4(),
        userId: currentUser.userId,
        customerId: selectedCustomer?.customerId!,
        totalAmount: totalCents, // Already in cents
        isActive: true,
        _deleted: false,
        isPartOfDebt: isCredit,
        SRIStatus: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.sales.insert(sale);

      // Create sale details (item prices are already in cents)
      for (const item of saleItems) {
        const taxAmount = calculatePercentage(item.totalPrice, TAX_RATE);
        const subtotal = item.totalPrice; // Already in cents
        const lineTotal = subtotal + taxAmount;

        const saleDetail: SaleDetail = {
          saleId: sale.saleId!,
          productId: item.productId!,
          quantity: item.quantity,
          unitPrice: item.unitPrice, // Already in cents
          subtotal: subtotal, // Already in cents
          taxAmount: taxAmount, // Already in cents
          lineTotal: lineTotal, // Already in cents
          _deleted: false
        };

        await db.saleDetails.insert(saleDetail);
      }

      // If it's a credit sale, create debt and payment
      if (isCredit && selectedCustomer) {
        const debtAmountCents = totalCents - receivedAmountCents; // Both already in cents

        if (debtAmountCents > 0) {
          const debt: Debt = {
            debtId: uuidv4(),
            customerId: selectedCustomer.customerId!,
            amount: debtAmountCents, // Already in cents
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            _deleted: false
          };

          await db.debts.insert(debt);

          // If there was partial payment, create payment record
          if (receivedAmountCents > 0) {
            const payment: DebtPayment = {
              debtPaymentId: uuidv4(),
              debtId: debt.debtId!,
              userId: currentUser.userId,
              amountPaid: receivedAmountCents, // Already in cents
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
        const debtAmountCents = totalCents - receivedAmountCents;

        if (debtAmountCents > 0) {
          toast.showSuccess(
            `Venta fiada registrada. Pagado: ${formatMoney(receivedAmountCents)}, Debe: ${formatMoney(debtAmountCents)}`
          );
        } else {
          toast.showSuccess(`Venta completada por ${formatMoney(totalCents)}`);
        }
      } else {
        toast.showSuccess(`Venta completada. Cambio: ${formatMoney(changeAmount)}`);
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
    customers: customers || [],
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
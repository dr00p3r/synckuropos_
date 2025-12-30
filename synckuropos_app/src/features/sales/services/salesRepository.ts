import { v4 as uuidv4 } from 'uuid';
import type { SaleItem, SaleSummary, Customer, Sale, SaleDetail, Debt, DebtPayment } from '@/types/types';

interface CreateSaleParams {
    userId: string;
    saleItems: SaleItem[];
    summary: SaleSummary;
    receivedAmount: number; // En centavos
    isCredit: boolean;
    customer?: Customer;
}

export const salesRepository = {
    /**
     * Crea una venta completa de forma atómica
     */
    async createSaleTransaction(db: any, params: CreateSaleParams): Promise<void> {
        const { userId, saleItems, summary, receivedAmount, isCredit, customer } = params;
        const TAX_RATE = 0.15; 

        // 1. Crear Cabecera de Venta
        const sale: Sale = {
            saleId: uuidv4(),
            userId: userId,
            customerId: customer?.customerId || 'CONSUMIDOR_FINAL',
            totalAmount: Math.round(summary.total),
            isActive: true,
            _deleted: false,
            isPartOfDebt: isCredit,
            SRIStatus: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await db.sales.insert(sale);

        // 2. Crear Detalles
        const detailsPromises = saleItems.map(item => {
            const taxAmount = item.totalPrice * TAX_RATE;
            
            const saleDetail: SaleDetail = {
                saleId: sale.saleId!,
                productId: item.productId!,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                subtotal: item.totalPrice,
                taxAmount: Math.round(taxAmount),
                lineTotal: Math.round(item.totalPrice + taxAmount),
                _deleted: false
            };
            return db.saleDetails.insert(saleDetail);
        });

        await Promise.all(detailsPromises);

        // 3. Manejo de Créditos y Deudas
        if (isCredit && customer) {
            const totalSaleCents = Math.round(summary.total);
            const debtAmount = totalSaleCents - receivedAmount;

            if (debtAmount > 0) {
                const debt: Debt = {
                    debtId: uuidv4(),
                    customerId: customer.customerId!,
                    amount: debtAmount,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    _deleted: false
                };
                await db.debts.insert(debt);

                // Registrar el pago parcial si existe
                if (receivedAmount > 0) {
                    const payment: DebtPayment = {
                        debtPaymentId: uuidv4(),
                        debtId: debt.debtId!,
                        userId: userId,
                        amountPaid: receivedAmount,
                        paymentDate: new Date().toISOString(),
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        _deleted: false
                    };
                    await db.debtPayments.insert(payment);
                }
            }
        }
    }
};
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
        const TAX_DIVISOR = 1 + TAX_RATE;

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
            const lineTotal = Math.round(item.totalPrice);
            const subtotal = item.isTaxable
                ? Math.round(lineTotal / TAX_DIVISOR)
                : lineTotal;
            const taxAmount = item.isTaxable ? lineTotal - subtotal : 0;
            
            const saleDetail: SaleDetail = {
                saleId: sale.saleId,
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                subtotal,
                taxAmount,
                lineTotal,
                _deleted: false
            };
            return db.saleDetails.insert(saleDetail);
        });

        await Promise.all(detailsPromises);

        // 3. Disminuir stock por cada producto vendido
        const stockUpdatePromises = saleItems.map(async (item) => {
            const productDoc = await db.products.findOne({
                selector: {
                    productId: item.productId,
                    _deleted: false
                }
            }).exec();

            if (!productDoc) {
                throw new Error(`Producto no encontrado para descontar stock: ${item.productId}`);
            }

            const currentStock = Number(productDoc.stock ?? 0);
            if (currentStock < item.quantity) {
                throw new Error(`Stock insuficiente para producto ${item.productId}. Stock: ${currentStock}, solicitado: ${item.quantity}`);
            }

            const newStock = currentStock - item.quantity;
            await productDoc.update({
                $set: {
                    stock: newStock,
                    updatedAt: new Date().toISOString()
                }
            });
        });

        await Promise.all(stockUpdatePromises);

        // 4. Manejo de Créditos y Deudas
        if (isCredit && customer) {
            const totalSaleCents = Math.round(summary.total);
            const debtAmount = totalSaleCents - receivedAmount;

            if (debtAmount > 0) {
                const debt: Debt = {
                    debtId: uuidv4(),
                    customerId: customer.customerId,
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
                        debtId: debt.debtId,
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
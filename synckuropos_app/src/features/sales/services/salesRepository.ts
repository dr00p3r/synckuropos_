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
        const now = new Date().toISOString();

        // Validaciones previas para evitar escrituras parciales.
        const requiredByProduct = saleItems.reduce((acc, item) => {
            acc.set(item.productId, (acc.get(item.productId) || 0) + item.quantity);
            return acc;
        }, new Map<string, number>());

        const productSnapshots = new Map<string, { doc: any; previousStock: number }>();

        for (const [productId, requiredQty] of requiredByProduct.entries()) {
            const productDoc = await db.products.findOne({
                selector: {
                    productId,
                    _deleted: false
                }
            }).exec();

            if (!productDoc) {
                throw new Error(`Producto no encontrado para descontar stock: ${productId}`);
            }

            const currentStock = Number(productDoc.stock ?? 0);
            if (currentStock < requiredQty) {
                throw new Error(`Stock insuficiente para producto ${productId}. Stock: ${currentStock}, solicitado: ${requiredQty}`);
            }

            productSnapshots.set(productId, {
                doc: productDoc,
                previousStock: currentStock
            });
        }

        const totalSaleCents = Math.round(summary.total);
        const normalizedInitialPayment = Math.min(Math.max(receivedAmount, 0), totalSaleCents);
        const pendingCreditAmount = totalSaleCents - normalizedInitialPayment;

        // 1. Crear Cabecera de Venta
        const sale: Sale = {
            saleId: uuidv4(),
            userId: userId,
            customerId: customer?.customerId || 'CONSUMIDOR_FINAL',
            totalAmount: totalSaleCents,
            isActive: true,
            _deleted: false,
            isPartOfDebt: isCredit,
            SRIStatus: 'pending',
            createdAt: now,
            updatedAt: now
        };

        let stockUpdated = false;
        let saleInserted = false;
        let debtCreatedId: string | null = null;
        let debtPaymentCreatedId: string | null = null;

        try {
            // 2. Disminuir stock por cada producto vendido
            for (const [productId, requiredQty] of requiredByProduct.entries()) {
                const snapshot = productSnapshots.get(productId);
                if (!snapshot) {
                    throw new Error(`No se pudo obtener snapshot de stock para ${productId}`);
                }

                const newStock = snapshot.previousStock - requiredQty;
                await snapshot.doc.update({
                    $set: {
                        stock: newStock,
                        updatedAt: now
                    }
                });
            }
            stockUpdated = true;

            // 3. Crear Cabecera de Venta
            await db.sales.insert(sale);
            saleInserted = true;

            // 4. Crear Detalles
            for (const item of saleItems) {
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

                await db.saleDetails.insert(saleDetail);
            }

            // 5. Manejo de Créditos y Deudas
            if (isCredit && customer && pendingCreditAmount > 0) {
                const debt: Debt = {
                    debtId: uuidv4(),
                    customerId: customer.customerId,
                    // Guardar valor total de la venta; los pagos se descuentan aparte.
                    amount: totalSaleCents,
                    createdAt: now,
                    updatedAt: now,
                    _deleted: false
                };
                await db.debts.insert(debt);
                debtCreatedId = debt.debtId;

                // Registrar abono inicial si existe
                if (normalizedInitialPayment > 0) {
                    const payment: DebtPayment = {
                        debtPaymentId: uuidv4(),
                        debtId: debt.debtId,
                        userId: userId,
                        amountPaid: normalizedInitialPayment,
                        paymentDate: now,
                        createdAt: now,
                        updatedAt: now,
                        _deleted: false
                    };
                    await db.debtPayments.insert(payment);
                    debtPaymentCreatedId = payment.debtPaymentId;
                }
            }
        } catch (error) {
            // Rollback compensatorio para reducir riesgo de estados parciales.
            if (debtPaymentCreatedId) {
                const paymentDoc = await db.debtPayments.findOne(debtPaymentCreatedId).exec();
                if (paymentDoc) {
                    await paymentDoc.update({ $set: { _deleted: true, updatedAt: now } });
                }
            }

            if (debtCreatedId) {
                const debtDoc = await db.debts.findOne(debtCreatedId).exec();
                if (debtDoc) {
                    await debtDoc.update({ $set: { _deleted: true, updatedAt: now } });
                }
            }

            if (saleInserted) {
                const saleDetailDocs = await db.saleDetails.find({
                    selector: { saleId: sale.saleId, _deleted: false }
                }).exec();

                for (const doc of saleDetailDocs) {
                    await doc.update({ $set: { _deleted: true } });
                }

                const saleDoc = await db.sales.findOne({ selector: { saleId: sale.saleId } }).exec();
                if (saleDoc) {
                    await saleDoc.update({
                        $set: {
                            _deleted: true,
                            isActive: false,
                            updatedAt: now
                        }
                    });
                }
            }

            if (stockUpdated) {
                for (const snapshot of productSnapshots.values()) {
                    await snapshot.doc.update({
                        $set: {
                            stock: snapshot.previousStock,
                            updatedAt: now
                        }
                    });
                }
            }

            throw error;
        }
    }
};
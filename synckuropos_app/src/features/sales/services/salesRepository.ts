import type { SaleItem, SaleSummary, Customer } from '@/types/types';
import type { AppDatabase } from '@/hooks/useDatabase';
import * as schema from '@/db/schema';

interface CreateSaleParams {
    userId: string;
    saleItems: SaleItem[];
    summary: SaleSummary;
    receivedAmount: number; // En centavos
    paymentMethod: 'cash' | 'transfer' | 'credit';
    customer?: Customer;
}

export const salesRepository = {
    /**
     * Crea una venta completa de forma atómica:
     * 1. Inserta la cabecera de venta
     * 2. Inserta los items de venta
     * 3. Inserta movimientos de stock negativos (deltas)
     * 4. Si es crédito, crea deuda y pago parcial si aplica
     */
    async createSaleTransaction(db: AppDatabase, params: CreateSaleParams): Promise<void> {
        const { userId, saleItems, summary, receivedAmount, paymentMethod, customer } = params;
        const taxRate = summary.taxRate;
        const now = Date.now();

        // 1. Crear Cabecera de Venta
        const saleId = crypto.randomUUID();
        await db.insert(schema.sales).values({
            saleId,
            userId,
            customerId: customer?.customerId ?? '9999999999',
            totalAmount: Math.round(summary.total),
            paymentMethod,
            _deleted: false,
            SRIStatus: 'pending',
            createdAt: now,
            updatedAt: now,
            synced: 0
        });

        // 2. Crear Detalles + Stock Movements
        for (const item of saleItems) {
            const baseAmount = item.isTaxable ? Math.round(item.totalPrice / (1 + taxRate)) : item.totalPrice;
            const taxAmount = item.isTaxable ? (item.totalPrice - baseAmount) : 0;
            const saleItemId = crypto.randomUUID();

            await Promise.all([
                db.insert(schema.saleItems).values({
                    id: saleItemId,
                    saleId,
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    subtotal: baseAmount,
                    taxAmount,
                    lineTotal: item.totalPrice,
                    _deleted: false,
                    createdAt: now,
                    updatedAt: now,
                    synced: 0
                }),
                db.insert(schema.stockMovements).values({
                    id: crypto.randomUUID(),
                    productId: item.productId,
                    delta: -item.quantity,
                    reason: 'Venta',
                    referenceId: saleId,
                    referenceType: 'sale',
                    _deleted: false,
                    createdAt: now,
                    updatedAt: now,
                    synced: 0
                })
            ]);
        }

        // 3. Manejo de Créditos y Deudas
        if (paymentMethod === 'credit' && customer) {
            const totalSaleCents = Math.round(summary.total);
            const debtAmount = totalSaleCents - receivedAmount;

            if (debtAmount > 0) {
                const debtId = crypto.randomUUID();
                await db.insert(schema.debts).values({
                    debtId,
                    customerId: customer.customerId,
                    saleId,
                    amount: debtAmount,
                    _deleted: false,
                    createdAt: now,
                    updatedAt: now,
                    synced: 0
                });

                // Registrar el pago parcial si existe
                if (receivedAmount > 0) {
                    await db.insert(schema.debtPayments).values({
                        debtPaymentId: crypto.randomUUID(),
                        debtId,
                        userId,
                        amountPaid: receivedAmount,
                        paymentDate: now,
                        _deleted: false,
                        createdAt: now,
                        updatedAt: now,
                        synced: 0
                    });
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

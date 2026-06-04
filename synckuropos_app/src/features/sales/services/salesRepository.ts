import type { SaleItem, SaleSummary, Customer } from '@/types/types';
import type { AppDatabase } from '@/hooks/useDatabase';
import { eq } from 'drizzle-orm';
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

        const saleId = crypto.randomUUID();
        const saleItemIds: string[] = [];
        const stockMovementIds: string[] = [];
        let debtId: string | null = null;
        let debtPaymentId: string | null = null;

        try {
            // 1. Crear Cabecera de Venta
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
                const stockMovementId = crypto.randomUUID();
                saleItemIds.push(saleItemId);
                stockMovementIds.push(stockMovementId);

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
                        id: stockMovementId,
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
                    debtId = crypto.randomUUID();
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

                    if (receivedAmount > 0) {
                        debtPaymentId = crypto.randomUUID();
                        await db.insert(schema.debtPayments).values({
                            debtPaymentId,
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
            }
        } catch (error) {
            // Rollback compensatorio: soft-delete en orden inverso
            if (debtPaymentId) {
                await db.update(schema.debtPayments)
                    .set({ _deleted: true, updatedAt: now })
                    .where(eq(schema.debtPayments.debtPaymentId, debtPaymentId));
            }

            if (debtId) {
                await db.update(schema.debts)
                    .set({ _deleted: true, updatedAt: now })
                    .where(eq(schema.debts.debtId, debtId));
            }

            for (const id of stockMovementIds) {
                await db.update(schema.stockMovements)
                    .set({ _deleted: true, updatedAt: now })
                    .where(eq(schema.stockMovements.id, id));
            }

            for (const id of saleItemIds) {
                await db.update(schema.saleItems)
                    .set({ _deleted: true, updatedAt: now })
                    .where(eq(schema.saleItems.id, id));
            }

            await db.update(schema.sales)
                .set({ _deleted: true, updatedAt: now })
                .where(eq(schema.sales.saleId, saleId));

            throw error;
        }
    }
};

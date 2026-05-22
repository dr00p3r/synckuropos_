import { eq, and, between, like, inArray } from 'drizzle-orm';
import type { AppDatabase } from '@/hooks/useDatabase';
import type { InventoryMovement } from '../types';
import * as schema from '@/db/schema';

export const profitRepository = {
    async searchProducts(db: AppDatabase, query: string) {
        if (!query) return [];

        const results = await db
            .select()
            .from(schema.products)
            .where(
                and(
                    eq(schema.products._deleted, false),
                    like(schema.products.name, `%${query}%`)
                )
            )
            .limit(10);

        return results.map((doc) => ({ label: doc.name, value: doc.productId }));
    },

    async getProfitMovements(
        db: AppDatabase,
        startDate: Date,
        endDate: Date,
        productIds: string[] = []
    ): Promise<InventoryMovement[]> {
        const startMs = startDate.getTime();
        const endMs = endDate.getTime();

        // 1. Obtener ventas del rango
        const salesRows = await db
            .select()
            .from(schema.sales)
            .where(
                and(
                    eq(schema.sales._deleted, false),
                    between(schema.sales.createdAt, startMs, endMs)
                )
            );

        const saleIds = salesRows.map((s) => s.saleId);

        // 2. Obtener detalles de esas ventas
        const saleDetailsRows = await db
            .select()
            .from(schema.saleItems)
            .where(inArray(schema.saleItems.saleId, saleIds));

        // 3. Obtener abastecimientos del rango
        const supplyConditions = [
            eq(schema.supplyings._deleted, false),
            between(schema.supplyings.supplyDate, startMs, endMs)
        ];
        if (productIds.length > 0) {
            supplyConditions.push(inArray(schema.supplyings.productId, productIds));
        }

        const suppliesRows = await db
            .select()
            .from(schema.supplyings)
            .where(and(...supplyConditions));

        // 4. Obtener nombres de productos
        const allProductIds = new Set([
            ...saleDetailsRows.map((d) => d.productId),
            ...suppliesRows.map((s) => s.productId)
        ]);

        const productRows = await db
            .select()
            .from(schema.products)
            .where(inArray(schema.products.productId, Array.from(allProductIds)));

        const productMap = new Map<string, string>();
        productRows.forEach((p) => productMap.set(p.productId, p.name));

        // 5. Unificar movimientos
        const movements: InventoryMovement[] = [];

        const saleMap = new Map(salesRows.map(s => [s.saleId, s]));

        for (const d of saleDetailsRows) {
            if (productIds.length > 0 && !productIds.includes(d.productId)) continue;

            const sale = saleMap.get(d.saleId);
            movements.push({
                id: d.id,
                date: d.createdAt || sale?.createdAt || 0,
                type: 'SALE',
                productName: productMap.get(d.productId) || 'Desconocido',
                quantity: d.quantity,
                unitValue: d.unitPrice,
                totalValue: d.lineTotal,
                documentId: d.saleId
            });
        }

        for (const s of suppliesRows) {
            if (productIds.length > 0 && !productIds.includes(s.productId)) continue;

            movements.push({
                id: s.supplyingId,
                date: s.supplyDate,
                type: 'SUPPLY',
                productName: productMap.get(s.productId) || 'Desconocido',
                quantity: s.quantity,
                unitValue: s.unitCost,
                totalValue: s.quantity * s.unitCost,
                documentId: s.supplyingId
            });
        }

        return movements.sort((a, b) => b.date - a.date);
    }
};

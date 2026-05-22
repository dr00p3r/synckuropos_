import { eq, and, sql, inArray } from 'drizzle-orm';
import type { AppDatabase } from '@/hooks/useDatabase';
import * as schema from '../db/schema';

/**
 * Calcula el stock actual de un producto sumando todos sus deltas.
 * Stock = SUM(delta) FROM stock_movements WHERE productId = ? AND _deleted = false
 */
export async function getStockByProduct(
    db: AppDatabase,
    productId: string
): Promise<number> {
    const rows = await db
        .select({ total: sql<number>`COALESCE(SUM(${schema.stockMovements.delta}), 0)` })
        .from(schema.stockMovements)
        .where(
            and(
                eq(schema.stockMovements.productId, productId),
                eq(schema.stockMovements._deleted, false)
            )
        );

    return rows[0]?.total ?? 0;
}

/**
 * Obtiene el stock de múltiples productos en una sola query.
 * Devuelve un Map<productId, stock>
 */
export async function getStockForProducts(
    db: AppDatabase,
    productIds: string[]
): Promise<Map<string, number>> {
    if (productIds.length === 0) return new Map();

    const rows = await db
        .select({
            productId: schema.stockMovements.productId,
            total: sql<number>`COALESCE(SUM(${schema.stockMovements.delta}), 0)`
        })
        .from(schema.stockMovements)
        .where(
            and(
                inArray(schema.stockMovements.productId, productIds),
                eq(schema.stockMovements._deleted, false)
            )
        )
        .groupBy(schema.stockMovements.productId);

    const map = new Map<string, number>();
    for (const row of rows) {
        map.set(row.productId, row.total);
    }
    // Asegurar que todos los productos estén en el map (con 0 si no tienen movimientos)
    for (const id of productIds) {
        if (!map.has(id)) map.set(id, 0);
    }
    return map;
}

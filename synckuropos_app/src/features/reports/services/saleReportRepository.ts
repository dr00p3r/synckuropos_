import { eq, and, between, inArray, desc } from 'drizzle-orm';
import type { Sale, SaleDetail } from '@/types/types';
import type { AppDatabase } from '@/hooks/useDatabase';
import type { SaleWithDetails, UserOption } from '../types';
import * as schema from '@/db/schema';

export const reportRepository = {
    async getUsers(db: AppDatabase): Promise<UserOption[]> {
        const users = await db
            .select()
            .from(schema.users)
            .where(eq(schema.users._deleted, false));

        return users.map((u) => ({
            label: u.username,
            value: u.userId
        }));
    },

    async getSalesWithDetails(
        db: AppDatabase,
        startDate: Date,
        endDate: Date,
        userId?: string
    ): Promise<SaleWithDetails[]> {
        const startMs = startDate.getTime();
        const endMs = endDate.getTime();

        const conditions = [
            eq(schema.sales._deleted, false),
            between(schema.sales.createdAt, startMs, endMs)
        ];
        if (userId) {
            conditions.push(eq(schema.sales.userId, userId));
        }

        const salesRows = await db
            .select()
            .from(schema.sales)
            .where(and(...conditions))
            .orderBy(desc(schema.sales.createdAt));

        const sales = salesRows as Sale[];
        if (sales.length === 0) return [];

        const saleIds = sales.map(s => s.saleId);

        const detailsRows = await db
            .select()
            .from(schema.saleItems)
            .where(inArray(schema.saleItems.saleId, saleIds));

        const allDetails = detailsRows as SaleDetail[];

        const detailsBySale = new Map<string, SaleDetail[]>();
        for (const d of allDetails) {
            const list = detailsBySale.get(d.saleId) ?? [];
            list.push(d);
            detailsBySale.set(d.saleId, list);
        }

        const productIds = [...new Set(allDetails.map(d => d.productId))];
        const productRows = await db
            .select()
            .from(schema.products)
            .where(inArray(schema.products.productId, productIds));

        const productMap = new Map<string, string>();
        productRows.forEach((p) => productMap.set(p.productId, p.name));

        return sales.map(sale => {
            const myDetails = detailsBySale.get(sale.saleId) ?? [];

            const enrichedDetails = myDetails.map(detail => ({
                ...detail,
                productName: productMap.get(detail.productId) || 'Producto Desconocido'
            }));

            return {
                ...sale,
                details: enrichedDetails
            };
        });
    }
};

import { Router, type Request, type Response } from 'express';
import { db } from '../db/client.js';
import * as schema from '../db/schema.js';
import { gt } from 'drizzle-orm';

const router = Router();

// Mapeo de tablas con sus columnas PK
const TABLE_MAP: Record<string, { table: any; pk: any }> = {
    users: { table: schema.users, pk: schema.users.userId },
    products: { table: schema.products, pk: schema.products.productId },
    customers: { table: schema.customers, pk: schema.customers.customerId },
    sales: { table: schema.sales, pk: schema.sales.saleId },
    sale_items: { table: schema.saleItems, pk: schema.saleItems.id },
    combo_products: { table: schema.comboProducts, pk: schema.comboProducts.comboProductId },
    supplyings: { table: schema.supplyings, pk: schema.supplyings.supplyingId },
    stock_movements: { table: schema.stockMovements, pk: schema.stockMovements.id },
    debts: { table: schema.debts, pk: schema.debts.debtId },
    debt_payments: { table: schema.debtPayments, pk: schema.debtPayments.debtPaymentId },
    tax_rates: { table: schema.taxRates, pk: schema.taxRates.id },
    bank_accounts: { table: schema.bankAccounts, pk: schema.bankAccounts.id },
};

// GET /api/sync/pull?since={timestamp}&tables=products,customers,...
router.get('/pull', async (req: Request, res: Response) => {
    try {
        const since = parseInt(req.query.since as string) || 0;
        const tablesParam = (req.query.tables as string) || '';
        const tableNames = tablesParam.split(',').filter(Boolean);

        const result: Record<string, any[]> = {};

        for (const name of tableNames) {
            const entry = TABLE_MAP[name];
            if (!entry) continue;

            const rows = await db
                .select()
                .from(entry.table)
                .where(gt(entry.table.updatedAt, since));

            result[name] = rows;
        }

        res.json(result);
    } catch (error: any) {
        console.error('Sync pull error:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/sync/push
// Body: { users: [...], products: [...], sales: [...], ... }
router.post('/push', async (req: Request, res: Response) => {
    try {
        const body = req.body;

        for (const [tableName, records] of Object.entries(body)) {
            const entry = TABLE_MAP[tableName];
            if (!entry || !Array.isArray(records)) continue;

            for (const record of records as any[]) {
                // last-write-wins: el servidor aplica directamente
                await db.insert(entry.table).values(record).onConflictDoUpdate({
                    target: entry.pk,
                    set: {
                        ...record,
                        synced: 1
                    }
                });
            }
        }

        res.json({ success: true });
    } catch (error: any) {
        console.error('Sync push error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;

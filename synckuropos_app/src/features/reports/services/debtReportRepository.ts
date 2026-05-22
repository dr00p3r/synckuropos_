import { eq, and, inArray } from 'drizzle-orm';
import type { AppDatabase } from '@/hooks/useDatabase';
import type { DebtTransaction, DebtReportEntry, DebtReportData, CustomerOption } from '../types';
import type { SaleDetail, User } from '@/types/types';
import * as schema from '@/db/schema';

async function getUsersByIds(db: AppDatabase, userIds: string[]): Promise<Map<string, string>> {
    if (userIds.length === 0) return new Map();
    const rows = await db
        .select()
        .from(schema.users)
        .where(inArray(schema.users.userId, userIds));
    const map = new Map<string, string>();
    for (const u of rows) map.set((u as User).userId, (u as User).username);
    return map;
}

async function getProductNames(db: AppDatabase, productIds: string[]): Promise<Map<string, string>> {
    if (productIds.length === 0) return new Map();
    const rows = await db
        .select()
        .from(schema.products)
        .where(inArray(schema.products.productId, productIds));
    const map = new Map<string, string>();
    for (const p of rows) map.set(p.productId, p.name);
    return map;
}

export const debtReportRepository = {
    async getCustomersWithActiveDebt(db: AppDatabase): Promise<CustomerOption[]> {
        const allCustomers = await db
            .select()
            .from(schema.customers)
            .where(eq(schema.customers._deleted, false));

        if (allCustomers.length === 0) return [];

        const customerIds = allCustomers.map(c => c.customerId);
        const debts = await db
            .select()
            .from(schema.debts)
            .where(
                and(
                    inArray(schema.debts.customerId, customerIds),
                    eq(schema.debts._deleted, false)
                )
            );

        if (debts.length === 0) return [];

        const debtIds = debts.map(d => d.debtId);
        const payments = await db
            .select()
            .from(schema.debtPayments)
            .where(
                and(
                    inArray(schema.debtPayments.debtId, debtIds),
                    eq(schema.debtPayments._deleted, false)
                )
            );

        const paidByDebt = new Map<string, number>();
        for (const p of payments) {
            paidByDebt.set(p.debtId, (paidByDebt.get(p.debtId) ?? 0) + p.amountPaid);
        }

        const debtByCustomer = new Map<string, number>();
        for (const d of debts) {
            const paid = paidByDebt.get(d.debtId) ?? 0;
            const pending = d.amount - paid;
            if (pending > 0) {
                debtByCustomer.set(d.customerId, (debtByCustomer.get(d.customerId) ?? 0) + pending);
            }
        }

        const result: { label: string; value: string }[] = [];
        for (const c of allCustomers) {
            if ((debtByCustomer.get(c.customerId) ?? 0) > 0) {
                result.push({ label: c.fullname, value: c.customerId });
            }
        }
        return result;
    },

    async getDebtReport(
        db: AppDatabase,
        customerId: string,
        startMs: number,
        endMs: number
    ): Promise<DebtReportData> {
        const customerRow = await db
            .select()
            .from(schema.customers)
            .where(eq(schema.customers.customerId, customerId))
            .limit(1);

        const customerName = customerRow[0]?.fullname ?? 'Desconocido';

        const debts = await db
            .select()
            .from(schema.debts)
            .where(
                and(
                    eq(schema.debts.customerId, customerId),
                    eq(schema.debts._deleted, false)
                )
            );

        if (debts.length === 0) {
            return {
                customerId,
                customerName,
                openingBalance: 0,
                closingBalance: 0,
                totalCredited: 0,
                totalPaid: 0,
                dailyData: []
            };
        }

        const debtIds = debts.map(d => d.debtId);
        const allPayments = await db
            .select()
            .from(schema.debtPayments)
            .where(
                and(
                    inArray(schema.debtPayments.debtId, debtIds),
                    eq(schema.debtPayments._deleted, false)
                )
            );

        const paidByDebt = new Map<string, number>();
        const paymentsByDebt = new Map<string, typeof allPayments>();
        for (const p of allPayments) {
            paidByDebt.set(p.debtId, (paidByDebt.get(p.debtId) ?? 0) + p.amountPaid);
            const list = paymentsByDebt.get(p.debtId) ?? [];
            list.push(p);
            paymentsByDebt.set(p.debtId, list);
        }

        const saleIds: string[] = [];
        for (const d of debts) {
            if (d.saleId && d.createdAt >= startMs && d.createdAt <= endMs) {
                saleIds.push(d.saleId);
            }
        }

        const saleMap = new Map<string, typeof schema.sales.$inferSelect>();
        const saleItemsBySale = new Map<string, (SaleDetail & { productName: string })[]>();

        if (saleIds.length > 0) {
            const sales = await db
                .select()
                .from(schema.sales)
                .where(inArray(schema.sales.saleId, saleIds));

            for (const s of sales) saleMap.set(s.saleId, s);

            const items = await db
                .select()
                .from(schema.saleItems)
                .where(inArray(schema.saleItems.saleId, saleIds));

            const productIds = [...new Set(items.map(i => i.productId))];
            const productMap = await getProductNames(db, productIds);

            for (const item of items) {
                const list = saleItemsBySale.get(item.saleId) ?? [];
                list.push({
                    ...item as SaleDetail,
                    productName: productMap.get(item.productId) ?? 'Desconocido'
                });
                saleItemsBySale.set(item.saleId, list);
            }
        }

        const allUserIds = new Set<string>();
        for (const d of debts) {
            const sale = d.saleId ? saleMap.get(d.saleId) : undefined;
            if (sale) allUserIds.add(sale.userId);
        }
        for (const p of allPayments) allUserIds.add(p.userId);

        const userMap = await getUsersByIds(db, [...allUserIds]);

        const transactions: DebtTransaction[] = [];

        for (const debt of debts) {
            if (debt.createdAt >= startMs && debt.createdAt <= endMs) {
                const sale = debt.saleId ? saleMap.get(debt.saleId) : undefined;
                const userName = sale ? (userMap.get(sale.userId) ?? 'Desconocido') : 'Sistema';
                const userId = sale?.userId ?? '';

                const products = debt.saleId
                    ? (saleItemsBySale.get(debt.saleId) ?? []).map(p => ({
                        name: p.productName,
                        quantity: p.quantity,
                        unitPrice: p.unitPrice,
                        lineTotal: p.lineTotal
                    }))
                    : undefined;

                transactions.push({
                    id: debt.debtId,
                    type: 'SALE',
                    time: new Date(debt.createdAt).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', hour12: false }),
                    userId,
                    userName,
                    amount: debt.amount,
                    products
                });
            }

            const payments = paymentsByDebt.get(debt.debtId) ?? [];
            for (const p of payments) {
                if (p.paymentDate >= startMs && p.paymentDate <= endMs) {
                    transactions.push({
                        id: p.debtPaymentId,
                        type: 'PAYMENT',
                        time: new Date(p.paymentDate).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', hour12: false }),
                        userId: p.userId,
                        userName: userMap.get(p.userId) ?? 'Desconocido',
                        amount: p.amountPaid
                    });
                }
            }
        }

        transactions.sort((a, b) => {
            const aId = a.type === 'SALE' ? debts.find(d => d.debtId === a.id)?.createdAt ?? 0
                : allPayments.find(p => p.debtPaymentId === a.id)?.paymentDate ?? 0;
            const bId = b.type === 'SALE' ? debts.find(d => d.debtId === b.id)?.createdAt ?? 0
                : allPayments.find(p => p.debtPaymentId === b.id)?.paymentDate ?? 0;
            return aId - bId;
        });

        const allEntriesSorted = new Map<number, { credited: number; paid: number }>();

        for (const debt of debts) {
            const dayStart = new Date(debt.createdAt);
            dayStart.setHours(0, 0, 0, 0);
            const dayMs = dayStart.getTime();

            const entry = allEntriesSorted.get(dayMs) ?? { credited: 0, paid: 0 };
            entry.credited += debt.amount;
            allEntriesSorted.set(dayMs, entry);
        }

        for (const p of allPayments) {
            const dayStart = new Date(p.paymentDate);
            dayStart.setHours(0, 0, 0, 0);
            const dayMs = dayStart.getTime();

            const entry = allEntriesSorted.get(dayMs) ?? { credited: 0, paid: 0 };
            entry.paid += p.amountPaid;
            allEntriesSorted.set(dayMs, entry);
        }

        const sortedDays = [...allEntriesSorted.entries()].sort((a, b) => a[0] - b[0]);

        let runningTotal = 0;
        let openingBalance = 0;
        let totalCreditedInRange = 0;
        let totalPaidInRange = 0;

        const dailyData: DebtReportEntry[] = [];

        for (const [dayMs, entry] of sortedDays) {
            runningTotal = runningTotal + entry.credited - entry.paid;

            if (dayMs < startMs) {
                openingBalance = runningTotal;
                continue;
            }

            if (dayMs > endMs) break;

            totalCreditedInRange += entry.credited;
            totalPaidInRange += entry.paid;

            const dayTransactions = transactions.filter(t => {
                const ref = t.type === 'SALE'
                    ? debts.find(d => d.debtId === t.id)
                    : allPayments.find(p => p.debtPaymentId === t.id);
                if (!ref) return false;
                const date: number = t.type === 'SALE' ? ref.createdAt as number : ref.paymentDate as number;
                const dayStart = new Date(date);
                dayStart.setHours(0, 0, 0, 0);
                return dayStart.getTime() === dayMs;
            });

            const date = new Date(dayMs).toLocaleDateString('es-EC');

            dailyData.push({
                date,
                dateMs: dayMs,
                credited: entry.credited,
                paid: entry.paid,
                runningDebt: runningTotal,
                transactions: dayTransactions
            });
        }

        const closingBalance = runningTotal;

        return {
            customerId,
            customerName,
            openingBalance,
            closingBalance,
            totalCredited: totalCreditedInRange,
            totalPaid: totalPaidInRange,
            dailyData
        };
    }
};

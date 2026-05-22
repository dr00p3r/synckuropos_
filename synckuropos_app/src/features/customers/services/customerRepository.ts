import { eq, and, inArray } from 'drizzle-orm';
import type { Customer, Debt, DebtPayment } from '@/types/types';
import type { AppDatabase } from '@/hooks/useDatabase';
import * as schema from '@/db/schema';

export interface CustomerWithDebt extends Customer {
    debtTotal: number;
}

export interface DebtWithPayments extends Debt {
    totalPaid: number;
    pendingAmount: number;
    payments: DebtPayment[];
}

export interface CustomerDebtSummary {
    totalDebt: number;
    debtsCount: number;
    debts: DebtWithPayments[];
}

export interface CreateCustomerData {
    fullname: string;
    phone?: string;
    email?: string;
    address?: string;
    allowCredit: boolean;
    creditLimit: number; // En dólares, se convierte a centavos
}

export interface UpdateCustomerData extends Partial<CreateCustomerData> {}

export interface RegisterPaymentData {
    visaId: string;
    amountPaid: number; // En dólares, se convierte a centavos
    userId: string;
}

export const customerRepository = {
    // ============================================
    // CUSTOMERS CRUD
    // ============================================

    async getCustomersWithDebt(db: AppDatabase): Promise<CustomerWithDebt[]> {
        const customers = await db
            .select()
            .from(schema.customers)
            .where(eq(schema.customers._deleted, false));

        if (customers.length === 0) return [];

        const customerIds = customers.map(c => c.customerId);

        const allDebts = await db
            .select()
            .from(schema.debts)
            .where(
                and(
                    inArray(schema.debts.customerId, customerIds),
                    eq(schema.debts._deleted, false)
                )
            );

        const debtIds = allDebts.map(d => d.debtId);

        let paymentsByDebt = new Map<string, number>();
        if (debtIds.length > 0) {
            const allPayments = await db
                .select()
                .from(schema.debtPayments)
                .where(
                    and(
                        inArray(schema.debtPayments.debtId, debtIds),
                        eq(schema.debtPayments._deleted, false)
                    )
                );

            for (const p of allPayments) {
                const prev = paymentsByDebt.get(p.debtId) ?? 0;
                paymentsByDebt.set(p.debtId, prev + p.amountPaid);
            }
        }

        const debtByCustomer = new Map<string, number>();
        for (const debt of allDebts) {
            const totalPaid = paymentsByDebt.get(debt.debtId) ?? 0;
            const pending = debt.amount - totalPaid;
            if (pending > 0) {
                const prev = debtByCustomer.get(debt.customerId) ?? 0;
                debtByCustomer.set(debt.customerId, prev + pending);
            }
        }

        return customers.map(customer => ({
            ...customer,
            debtTotal: debtByCustomer.get(customer.customerId) ?? 0
        }));
    },

    async getCustomerById(db: AppDatabase, customerId: string): Promise<Customer | null> {
        const rows = await db
            .select()
            .from(schema.customers)
            .where(eq(schema.customers.customerId, customerId))
            .limit(1);
        return (rows[0] as Customer) ?? null;
    },

    async createCustomer(db: AppDatabase, data: CreateCustomerData): Promise<Customer> {
        const now = Date.now();
        const newCustomer: Customer = {
            customerId: crypto.randomUUID(),
            fullname: data.fullname.trim(),
            phone: data.phone?.trim() || null,
            email: data.email?.trim() || null,
            address: data.address?.trim() || null,
            allowCredit: data.allowCredit,
            creditLimit: Math.round(data.creditLimit * 100),
            _deleted: false,
            createdAt: now,
            updatedAt: now,
            synced: 0
        };

        await db.insert(schema.customers).values(newCustomer);
        return newCustomer;
    },

    async updateCustomer(db: AppDatabase, customerId: string, data: UpdateCustomerData): Promise<void> {
        const row = await db
            .select()
            .from(schema.customers)
            .where(eq(schema.customers.customerId, customerId))
            .limit(1);

        if (row.length === 0) {
            throw new Error('Cliente no encontrado');
        }

        const updateData: Partial<Customer> & { updatedAt: number } = {
            updatedAt: Date.now()
        };

        if (data.fullname !== undefined) updateData.fullname = data.fullname.trim();
        if (data.phone !== undefined) updateData.phone = data.phone?.trim() || null;
        if (data.email !== undefined) updateData.email = data.email?.trim() || null;
        if (data.address !== undefined) updateData.address = data.address?.trim() || null;
        if (data.allowCredit !== undefined) updateData.allowCredit = data.allowCredit;
        if (data.creditLimit !== undefined) updateData.creditLimit = Math.round(data.creditLimit * 100);

        await db
            .update(schema.customers)
            .set(updateData)
            .where(eq(schema.customers.customerId, customerId));
    },

    async toggleCustomerStatus(db: AppDatabase, customerId: string): Promise<boolean> {
        const rows = await db
            .select({ _deleted: schema.customers._deleted })
            .from(schema.customers)
            .where(eq(schema.customers.customerId, customerId))
            .limit(1);

        if (rows.length === 0) throw new Error('Cliente no encontrado');

        const newStatus = !rows[0]._deleted;
        await db
            .update(schema.customers)
            .set({ _deleted: newStatus, updatedAt: Date.now() })
            .where(eq(schema.customers.customerId, customerId));

        return newStatus;
    },

    // ============================================
    // DEBT CALCULATIONS
    // ============================================

    async calculateCustomerDebt(db: AppDatabase, customerId: string): Promise<number> {
        const debts = await db
            .select()
            .from(schema.debts)
            .where(
                and(
                    eq(schema.debts.customerId, customerId),
                    eq(schema.debts._deleted, false)
                )
            );

        if (debts.length === 0) return 0;

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
        for (const p of allPayments) {
            paidByDebt.set(p.debtId, (paidByDebt.get(p.debtId) ?? 0) + p.amountPaid);
        }

        let totalDebt = 0;
        for (const debt of debts) {
            const totalPaid = paidByDebt.get(debt.debtId) ?? 0;
            const pendingAmount = debt.amount - totalPaid;
            if (pendingAmount > 0) {
                totalDebt += pendingAmount;
            }
        }

        return totalDebt;
    },

    async getCustomerDebtSummary(db: AppDatabase, customerId: string): Promise<CustomerDebtSummary> {
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
            return { totalDebt: 0, debtsCount: 0, debts: [] };
        }

        const debtIds = debts.map(d => d.debtId);
        const allPaymentRows = await db
            .select()
            .from(schema.debtPayments)
            .where(
                and(
                    inArray(schema.debtPayments.debtId, debtIds),
                    eq(schema.debtPayments._deleted, false)
                )
            );

        const paymentsByDebt = new Map<string, DebtPayment[]>();
        for (const p of allPaymentRows) {
            const list = paymentsByDebt.get(p.debtId) ?? [];
            list.push(p as DebtPayment);
            paymentsByDebt.set(p.debtId, list);
        }

        const debtsWithPayments: DebtWithPayments[] = debts.map(debt => {
            const payments = paymentsByDebt.get(debt.debtId) ?? [];
            const totalPaid = payments.reduce((sum, p) => sum + p.amountPaid, 0);
            const pendingAmount = Math.max(0, debt.amount - totalPaid);
            return { ...debt, totalPaid, pendingAmount, payments };
        });

        const activeDebts = debtsWithPayments.filter(d => d.pendingAmount > 0);
        const totalDebt = activeDebts.reduce((sum, d) => sum + d.pendingAmount, 0);

        return {
            totalDebt,
            debtsCount: activeDebts.length,
            debts: activeDebts
        };
    },

    // ============================================
    // DEBT PAYMENTS
    // ============================================

    async registerPayment(
        db: AppDatabase,
        customerId: string,
        amountInDollars: number,
        userId: string
    ): Promise<{ paymentsCreated: number; totalApplied: number }> {
        const summary = await this.getCustomerDebtSummary(db, customerId);

        if (summary.debts.length === 0) {
            throw new Error('El cliente no tiene deudas pendientes');
        }

        let remainingAmount = Math.round(amountInDollars * 100);
        const now = Date.now();
        let paymentsCreated = 0;
        let totalApplied = 0;

        const sortedDebts = [...summary.debts].sort(
            (a, b) => a.createdAt - b.createdAt
        );

        for (const debt of sortedDebts) {
            if (remainingAmount <= 0) break;

            const amountToApply = Math.min(remainingAmount, debt.pendingAmount);

            if (amountToApply > 0) {
                await db.insert(schema.debtPayments).values({
                    debtPaymentId: crypto.randomUUID(),
                    debtId: debt.debtId,
                    userId,
                    amountPaid: amountToApply,
                    paymentDate: now,
                    _deleted: false,
                    createdAt: now,
                    updatedAt: now,
                    synced: 0
                });

                remainingAmount -= amountToApply;
                totalApplied += amountToApply;
                paymentsCreated++;
            }
        }

        return { paymentsCreated, totalApplied };
    },

    async createDebt(db: AppDatabase, customerId: string, amountInCents: number): Promise<Debt> {
        const now = Date.now();
        const newDebt: Debt = {
            debtId: crypto.randomUUID(),
            customerId,
            amount: amountInCents,
            _deleted: false,
            createdAt: now,
            updatedAt: now,
            synced: 0
        };

        await db.insert(schema.debts).values(newDebt);
        return newDebt;
    },

    async canReceiveCredit(db: AppDatabase, customerId: string, additionalAmount: number): Promise<{
        canReceive: boolean;
        currentDebt: number;
        creditLimit: number;
        availableCredit: number;
    }> {
        const customer = await this.getCustomerById(db, customerId);

        if (!customer) {
            throw new Error('Cliente no encontrado');
        }

        if (!customer.allowCredit) {
            return {
                canReceive: false,
                currentDebt: 0,
                creditLimit: 0,
                availableCredit: 0
            };
        }

        const currentDebt = await this.calculateCustomerDebt(db, customerId);
        const availableCredit = customer.creditLimit - currentDebt;
        const canReceive = availableCredit >= additionalAmount;

        return {
            canReceive,
            currentDebt,
            creditLimit: customer.creditLimit,
            availableCredit
        };
    }
};

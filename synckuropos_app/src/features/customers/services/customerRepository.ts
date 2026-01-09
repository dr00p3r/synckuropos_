import { v4 as uuidv4 } from 'uuid';
import type { Customer, Debt, DebtPayment } from '@/types/types';

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

    /**
     * Obtiene todos los clientes con su deuda calculada
     */
    async getCustomersWithDebt(db: any): Promise<CustomerWithDebt[]> {
        const customers = await db.customers.find({
            selector: { isActive: true }
        }).exec();

        const customersData = customers.map((doc: any) => doc.toJSON());

        // Calcular deuda de cada cliente en paralelo
        const customersWithDebt = await Promise.all(
            customersData.map(async (customer: Customer) => {
                const debtTotal = await this.calculateCustomerDebt(db, customer.customerId);
                return { ...customer, debtTotal };
            })
        );

        return customersWithDebt;
    },

    /**
     * Obtiene un cliente por ID
     */
    async getCustomerById(db: any, customerId: string): Promise<Customer | null> {
        const doc = await db.customers.findOne({
            selector: { customerId }
        }).exec();

        return doc ? doc.toJSON() : null;
    },

    /**
     * Crea un nuevo cliente
     */
    async createCustomer(db: any, data: CreateCustomerData): Promise<Customer> {
        const customerId = uuidv4();
        const now = new Date().toISOString();

        const newCustomer: Customer = {
            customerId,
            fullname: data.fullname.trim(),
            phone: data.phone?.trim() || undefined,
            email: data.email?.trim() || undefined,
            address: data.address?.trim() || undefined,
            allowCredit: data.allowCredit,
            creditLimit: Math.round(data.creditLimit * 100), // Convertir a centavos
            isActive: true,
            _deleted: false,
            createdAt: now,
            updatedAt: now
        };

        await db.customers.insert(newCustomer);
        return newCustomer;
    },

    /**
     * Actualiza un cliente existente
     */
    async updateCustomer(db: any, customerId: string, data: UpdateCustomerData): Promise<void> {
        const doc = await db.customers.findOne({
            selector: { customerId }
        }).exec();

        if (!doc) {
            throw new Error('Cliente no encontrado');
        }

        const updateData: any = {
            updatedAt: new Date().toISOString()
        };

        if (data.fullname !== undefined) {
            updateData.fullname = data.fullname.trim();
        }
        if (data.phone !== undefined) {
            updateData.phone = data.phone?.trim() || undefined;
        }
        if (data.email !== undefined) {
            updateData.email = data.email?.trim() || undefined;
        }
        if (data.address !== undefined) {
            updateData.address = data.address?.trim() || undefined;
        }
        if (data.allowCredit !== undefined) {
            updateData.allowCredit = data.allowCredit;
        }
        if (data.creditLimit !== undefined) {
            updateData.creditLimit = Math.round(data.creditLimit * 100);
        }

        await doc.update({ $set: updateData });
    },

    /**
     * Desactiva/Reactiva un cliente (soft delete)
     */
    async toggleCustomerStatus(db: any, customerId: string): Promise<boolean> {
        const doc = await db.customers.findOne({
            selector: { customerId }
        }).exec();

        if (!doc) {
            throw new Error('Cliente no encontrado');
        }

        const newStatus = !doc.toJSON().isActive;
        await doc.update({
            $set: {
                isActive: newStatus,
                updatedAt: new Date().toISOString()
            }
        });

        return newStatus;
    },

    // ============================================
    // DEBT CALCULATIONS
    // ============================================

    /**
     * Calcula la deuda total de un cliente
     */
    async calculateCustomerDebt(db: any, customerId: string): Promise<number> {
        try {
            const debts = await db.debts.find({
                selector: { customerId, _deleted: false }
            }).exec();

            if (debts.length === 0) return 0;

            let totalDebt = 0;

            for (const debt of debts) {
                const debtData = debt.toJSON();
                
                const payments = await db.debtPayments.find({
                    selector: { debtId: debtData.debtId, _deleted: false }
                }).exec();

                const totalPaid = payments.reduce((sum: number, payment: any) => {
                    return sum + payment.toJSON().amountPaid;
                }, 0);

                const pendingAmount = debtData.amount - totalPaid;
                
                if (pendingAmount > 0) {
                    totalDebt += pendingAmount;
                }
            }

            return totalDebt;
        } catch (error) {
            console.error('Error calculando deuda del cliente:', error);
            return 0;
        }
    },

    /**
     * Obtiene el resumen de deudas de un cliente con detalle de pagos
     */
    async getCustomerDebtSummary(db: any, customerId: string): Promise<CustomerDebtSummary> {
        const debts = await db.debts.find({
            selector: { customerId, _deleted: false }
        }).exec();

        const debtsWithPayments: DebtWithPayments[] = await Promise.all(
            debts.map(async (debtDoc: any) => {
                const debt = debtDoc.toJSON() as Debt;
                
                const paymentDocs = await db.debtPayments.find({
                    selector: { debtId: debt.debtId, _deleted: false }
                }).exec();

                const payments = paymentDocs.map((p: any) => p.toJSON() as DebtPayment);
                const totalPaid = payments.reduce((sum: number, p: DebtPayment) => sum + p.amountPaid, 0);
                const pendingAmount = Math.max(0, debt.amount - totalPaid);

                return {
                    ...debt,
                    totalPaid,
                    pendingAmount,
                    payments
                };
            })
        );

        // Filtrar solo deudas con saldo pendiente
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

    /**
     * Registra un pago a la deuda del cliente
     * Distribuye el pago entre las deudas más antiguas primero (FIFO)
     */
    async registerPayment(
        db: any, 
        customerId: string, 
        amountInDollars: number, 
        userId: string
    ): Promise<{ paymentsCreated: number; totalApplied: number }> {
        const summary = await this.getCustomerDebtSummary(db, customerId);
        
        if (summary.debts.length === 0) {
            throw new Error('El cliente no tiene deudas pendientes');
        }

        let remainingAmount = Math.round(amountInDollars * 100); // Convertir a centavos
        const now = new Date().toISOString();
        let paymentsCreated = 0;
        let totalApplied = 0;

        // Ordenar deudas por fecha de creación (más antiguas primero)
        const sortedDebts = [...summary.debts].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        for (const debt of sortedDebts) {
            if (remainingAmount <= 0) break;

            const amountToApply = Math.min(remainingAmount, debt.pendingAmount);

            if (amountToApply > 0) {
                await db.debtPayments.insert({
                    debtPaymentId: uuidv4(),
                    debtId: debt.debtId,
                    userId,
                    amountPaid: amountToApply,
                    paymentDate: now,
                    _deleted: false,
                    createdAt: now,
                    updatedAt: now
                });

                remainingAmount -= amountToApply;
                totalApplied += amountToApply;
                paymentsCreated++;
            }
        }

        return { paymentsCreated, totalApplied };
    },

    /**
     * Crea una nueva deuda para un cliente (usado cuando se vende a crédito)
     */
    async createDebt(db: any, customerId: string, amountInCents: number): Promise<Debt> {
        const now = new Date().toISOString();
        
        const newDebt: Debt = {
            debtId: uuidv4(),
            customerId,
            amount: amountInCents,
            _deleted: false,
            createdAt: now,
            updatedAt: now
        };

        await db.debts.insert(newDebt);
        return newDebt;
    },

    /**
     * Verifica si un cliente puede recibir más crédito
     */
    async canReceiveCredit(db: any, customerId: string, additionalAmount: number): Promise<{
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
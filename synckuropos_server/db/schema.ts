import { pgTable, text, integer, bigint, real, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
    userId: text('userId').primaryKey(),
    username: text('username').notNull(),
    passwordHash: text('passwordHash').notNull(),
    role: text('role', { enum: ['admin', 'cajero'] }).notNull(),
    _deleted: boolean('_deleted').notNull().default(false),
    createdAt: bigint('createdAt', { mode: 'number' }).notNull(),
    updatedAt: bigint('updatedAt', { mode: 'number' }).notNull(),
    synced: integer('synced').notNull().default(0),
});

export const products = pgTable('products', {
    productId: text('productId').primaryKey(),
    code: text('code'),
    name: text('name').notNull(),
    basePrice: integer('basePrice').notNull(),
    isTaxable: boolean('isTaxable').notNull().default(true),
    allowDecimalQuantity: boolean('allowDecimalQuantity').notNull().default(false),
    _deleted: boolean('_deleted').notNull().default(false),
    createdAt: bigint('createdAt', { mode: 'number' }).notNull(),
    updatedAt: bigint('updatedAt', { mode: 'number' }).notNull(),
    synced: integer('synced').notNull().default(0),
});

export const customers = pgTable('customers', {
    customerId: text('customerId').primaryKey(),
    fullname: text('fullname').notNull(),
    phone: text('phone'),
    email: text('email'),
    address: text('address'),
    allowCredit: boolean('allowCredit').notNull().default(false),
    creditLimit: integer('creditLimit').notNull().default(0),
    _deleted: boolean('_deleted').notNull().default(false),
    createdAt: bigint('createdAt', { mode: 'number' }).notNull(),
    updatedAt: bigint('updatedAt', { mode: 'number' }).notNull(),
    synced: integer('synced').notNull().default(0),
});

export const sales = pgTable('sales', {
    saleId: text('saleId').primaryKey(),
    userId: text('userId').notNull(),
    customerId: text('customerId').notNull(),
    totalAmount: integer('totalAmount').notNull(),
    paymentMethod: text('paymentMethod', { enum: ['cash', 'transfer', 'credit'] }).notNull().default('cash'),
    _deleted: boolean('_deleted').notNull().default(false),
    SRIStatus: text('SRIStatus', { enum: ['pending', 'uploaded', 'rejected', 'accepted'] }).notNull().default('pending'),
    createdAt: bigint('createdAt', { mode: 'number' }).notNull(),
    updatedAt: bigint('updatedAt', { mode: 'number' }).notNull(),
    synced: integer('synced').notNull().default(0),
});

export const saleItems = pgTable('sale_items', {
    id: text('id').primaryKey(),
    saleId: text('saleId').notNull(),
    productId: text('productId').notNull(),
    quantity: real('quantity').notNull(),
    unitPrice: integer('unitPrice').notNull(),
    subtotal: integer('subtotal').notNull(),
    taxAmount: integer('taxAmount').notNull().default(0),
    lineTotal: integer('lineTotal').notNull(),
    _deleted: boolean('_deleted').notNull().default(false),
    createdAt: bigint('createdAt', { mode: 'number' }).notNull(),
    updatedAt: bigint('updatedAt', { mode: 'number' }).notNull(),
    synced: integer('synced').notNull().default(0),
});

export const comboProducts = pgTable('combo_products', {
    comboProductId: text('comboProductId').primaryKey(),
    productId: text('productId').notNull(),
    comboQuantity: real('comboQuantity').notNull(),
    comboPrice: integer('comboPrice').notNull(),
    _deleted: boolean('_deleted').notNull().default(false),
    createdAt: bigint('createdAt', { mode: 'number' }).notNull(),
    updatedAt: bigint('updatedAt', { mode: 'number' }).notNull(),
    synced: integer('synced').notNull().default(0),
});

export const supplyings = pgTable('supplyings', {
    supplyingId: text('supplyingId').primaryKey(),
    userId: text('userId'),
    supplierName: text('supplierName'),
    productId: text('productId').notNull(),
    unitCost: integer('unitCost').notNull(),
    quantity: real('quantity').notNull(),
    reason: text('reason'),
    supplyDate: bigint('supplyDate', { mode: 'number' }).notNull(),
    _deleted: boolean('_deleted').notNull().default(false),
    createdAt: bigint('createdAt', { mode: 'number' }).notNull(),
    updatedAt: bigint('updatedAt', { mode: 'number' }).notNull(),
    synced: integer('synced').notNull().default(0),
});

export const stockMovements = pgTable('stock_movements', {
    id: text('id').primaryKey(),
    productId: text('productId').notNull(),
    delta: real('delta').notNull(),
    reason: text('reason').notNull(),
    referenceId: text('referenceId'),
    referenceType: text('referenceType', { enum: ['sale', 'supplying', 'adjustment'] }),
    _deleted: boolean('_deleted').notNull().default(false),
    createdAt: bigint('createdAt', { mode: 'number' }).notNull(),
    updatedAt: bigint('updatedAt', { mode: 'number' }).notNull(),
    synced: integer('synced').notNull().default(0),
});

export const debts = pgTable('debts', {
    debtId: text('debtId').primaryKey(),
    customerId: text('customerId').notNull(),
    saleId: text('saleId'),
    amount: integer('amount').notNull().default(0),
    _deleted: boolean('_deleted').notNull().default(false),
    createdAt: bigint('createdAt', { mode: 'number' }).notNull(),
    updatedAt: bigint('updatedAt', { mode: 'number' }).notNull(),
    synced: integer('synced').notNull().default(0),
});

export const debtPayments = pgTable('debt_payments', {
    debtPaymentId: text('debtPaymentId').primaryKey(),
    debtId: text('debtId').notNull(),
    userId: text('userId').notNull(),
    amountPaid: integer('amountPaid').notNull(),
    paymentDate: bigint('paymentDate', { mode: 'number' }).notNull(),
    _deleted: boolean('_deleted').notNull().default(false),
    createdAt: bigint('createdAt', { mode: 'number' }).notNull(),
    updatedAt: bigint('updatedAt', { mode: 'number' }).notNull(),
    synced: integer('synced').notNull().default(0),
});

export const taxRates = pgTable('tax_rates', {
    id: text('id').primaryKey(),
    rate: real('rate').notNull(),
    effectiveFrom: bigint('effectiveFrom', { mode: 'number' }).notNull(),
    _deleted: boolean('_deleted').notNull().default(false),
    createdAt: bigint('createdAt', { mode: 'number' }).notNull(),
    updatedAt: bigint('updatedAt', { mode: 'number' }).notNull(),
    synced: integer('synced').notNull().default(0),
});

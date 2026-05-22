import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// ============================================
// USERS
// ============================================
export const users = sqliteTable('users', {
    userId: text('userId').primaryKey(),
    username: text('username').notNull(),
    passwordHash: text('passwordHash').notNull(),
    role: text('role', { enum: ['admin', 'cajero'] }).notNull(),
    _deleted: integer('_deleted', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('createdAt').notNull(),
    updatedAt: integer('updatedAt').notNull(),
    synced: integer('synced').notNull().default(0),
});

// ============================================
// PRODUCTS
// ============================================
export const products = sqliteTable('products', {
    productId: text('productId').primaryKey(),
    code: text('code'),
    name: text('name').notNull(),
    basePrice: integer('basePrice').notNull(),
    isTaxable: integer('isTaxable', { mode: 'boolean' }).notNull().default(true),
    allowDecimalQuantity: integer('allowDecimalQuantity', { mode: 'boolean' }).notNull().default(false),
    _deleted: integer('_deleted', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('createdAt').notNull(),
    updatedAt: integer('updatedAt').notNull(),
    synced: integer('synced').notNull().default(0),
});

// ============================================
// CUSTOMERS
// ============================================
export const customers = sqliteTable('customers', {
    customerId: text('customerId').primaryKey(),
    fullname: text('fullname').notNull(),
    phone: text('phone'),
    email: text('email'),
    address: text('address'),
    allowCredit: integer('allowCredit', { mode: 'boolean' }).notNull().default(false),
    creditLimit: integer('creditLimit').notNull().default(0),
    _deleted: integer('_deleted', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('createdAt').notNull(),
    updatedAt: integer('updatedAt').notNull(),
    synced: integer('synced').notNull().default(0),
});

// ============================================
// SALES
// ============================================
export const sales = sqliteTable('sales', {
    saleId: text('saleId').primaryKey(),
    userId: text('userId').notNull(),
    customerId: text('customerId').notNull(),
    totalAmount: integer('totalAmount').notNull(),
    paymentMethod: text('paymentMethod', { enum: ['cash', 'transfer', 'credit'] }).notNull().default('cash'),
    _deleted: integer('_deleted', { mode: 'boolean' }).notNull().default(false),
    SRIStatus: text('SRIStatus', { enum: ['pending', 'uploaded', 'rejected', 'accepted'] }).notNull().default('pending'),
    createdAt: integer('createdAt').notNull(),
    updatedAt: integer('updatedAt').notNull(),
    synced: integer('synced').notNull().default(0),
});

// ============================================
// SALE ITEMS (antes saleDetails, ahora con id UUID propio)
// ============================================
export const saleItems = sqliteTable('sale_items', {
    id: text('id').primaryKey(),
    saleId: text('saleId').notNull(),
    productId: text('productId').notNull(),
    quantity: real('quantity').notNull(),
    unitPrice: integer('unitPrice').notNull(),
    subtotal: integer('subtotal').notNull(),
    taxAmount: integer('taxAmount').notNull().default(0),
    lineTotal: integer('lineTotal').notNull(),
    _deleted: integer('_deleted', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('createdAt').notNull(),
    updatedAt: integer('updatedAt').notNull(),
    synced: integer('synced').notNull().default(0),
});

// ============================================
// COMBO PRODUCTS
// ============================================
export const comboProducts = sqliteTable('combo_products', {
    comboProductId: text('comboProductId').primaryKey(),
    productId: text('productId').notNull(),
    comboQuantity: real('comboQuantity').notNull(),
    comboPrice: integer('comboPrice').notNull(),
    _deleted: integer('_deleted', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('createdAt').notNull(),
    updatedAt: integer('updatedAt').notNull(),
    synced: integer('synced').notNull().default(0),
});

// ============================================
// SUPPLYINGS (histórico de compras/proveedores)
// ============================================
export const supplyings = sqliteTable('supplyings', {
    supplyingId: text('supplyingId').primaryKey(),
    userId: text('userId'),
    supplierName: text('supplierName'),
    productId: text('productId').notNull(),
    unitCost: integer('unitCost').notNull(),
    quantity: real('quantity').notNull(),
    reason: text('reason'),
    supplyDate: integer('supplyDate').notNull(),
    _deleted: integer('_deleted', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('createdAt').notNull(),
    updatedAt: integer('updatedAt').notNull(),
    synced: integer('synced').notNull().default(0),
});

// ============================================
// STOCK MOVEMENTS (deltas — nunca valores absolutos)
// ============================================
export const stockMovements = sqliteTable('stock_movements', {
    id: text('id').primaryKey(),
    productId: text('productId').notNull(),
    delta: real('delta').notNull(), // positivo = entrada, negativo = salida
    reason: text('reason').notNull(),
    referenceId: text('referenceId'), // saleId o supplyingId opcional
    referenceType: text('referenceType', { enum: ['sale', 'supplying', 'adjustment'] }),
    _deleted: integer('_deleted', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('createdAt').notNull(),
    updatedAt: integer('updatedAt').notNull(),
    synced: integer('synced').notNull().default(0),
});

// ============================================
// DEBTS
// ============================================
export const debts = sqliteTable('debts', {
    debtId: text('debtId').primaryKey(),
    customerId: text('customerId').notNull(),
    saleId: text('saleId'),
    amount: integer('amount').notNull().default(0),
    _deleted: integer('_deleted', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('createdAt').notNull(),
    updatedAt: integer('updatedAt').notNull(),
    synced: integer('synced').notNull().default(0),
});

// ============================================
// DEBT PAYMENTS
// ============================================
export const debtPayments = sqliteTable('debt_payments', {
    debtPaymentId: text('debtPaymentId').primaryKey(),
    debtId: text('debtId').notNull(),
    userId: text('userId').notNull(),
    amountPaid: integer('amountPaid').notNull(),
    paymentDate: integer('paymentDate').notNull(),
    _deleted: integer('_deleted', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('createdAt').notNull(),
    updatedAt: integer('updatedAt').notNull(),
    synced: integer('synced').notNull().default(0),
});

// ============================================
// TAX RATES (histórico de tasas de IVA)
// ============================================
export const taxRates = sqliteTable('tax_rates', {
    id: text('id').primaryKey(),
    rate: real('rate').notNull(),
    effectiveFrom: integer('effectiveFrom').notNull(),
    _deleted: integer('_deleted', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('createdAt').notNull(),
    updatedAt: integer('updatedAt').notNull(),
    synced: integer('synced').notNull().default(0),
});

// ============================================
// BANK ACCOUNTS (datos bancarios para transferencias)
// ============================================
export const bankAccounts = sqliteTable('bank_accounts', {
    id: text('id').primaryKey(),
    bankName: text('bankName').notNull(),
    accountNumber: text('accountNumber').notNull(),
    accountHolder: text('accountHolder').notNull(),
    _deleted: integer('_deleted', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('createdAt').notNull(),
    updatedAt: integer('updatedAt').notNull(),
    synced: integer('synced').notNull().default(0),
});

// Los tipos de fila se definen en src/types/types.ts para mantener compatibilidad con el resto de la app.
// Aqui solo exportamos las definiciones de tablas para Drizzle.

import Database from '@tauri-apps/plugin-sql';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import * as schema from './schema';

export type AppDatabase = ReturnType<typeof drizzle<typeof schema>>;

let dbInstance: AppDatabase | null = null;
let sqlConnection: Database | null = null;

export async function initDb() {
    if (dbInstance) return dbInstance;

    const client = await Database.load('sqlite:synckuropos.db');
    sqlConnection = client;

    dbInstance = drizzle(
        async (sql, params, method) => {
            if (method === 'get') {
                const rows = await client.select(sql, params) as Record<string, unknown>[];
                return { rows: rows.slice(0, 1).map(row => Object.values(row)) };
            }
            if (method === 'all') {
                const rows = await client.select(sql, params) as Record<string, unknown>[];
                return { rows: rows.map(row => Object.values(row)) };
            }
            // run
            await client.execute(sql, params);
            return { rows: [] };
        },
        { schema, logger: import.meta.env.DEV }
    );

    // Crear tablas si no existen (simple migration inicial)
    await runInitialMigrations(client);

    return dbInstance;
}

export function getDb() {
    if (!dbInstance) {
        throw new Error('Database not initialized. Call initDb() first.');
    }
    return dbInstance;
}

async function runInitialMigrations(client: Database) {
    const tables = [
        `CREATE TABLE IF NOT EXISTS users (
            userId TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            passwordHash TEXT NOT NULL,
            role TEXT NOT NULL,
            _deleted INTEGER NOT NULL DEFAULT 0,
            createdAt INTEGER NOT NULL,
            updatedAt INTEGER NOT NULL,
            synced INTEGER NOT NULL DEFAULT 0
        )`,
        `CREATE TABLE IF NOT EXISTS products (
            productId TEXT PRIMARY KEY,
            code TEXT,
            name TEXT NOT NULL,
            basePrice INTEGER NOT NULL,
            isTaxable INTEGER NOT NULL DEFAULT 1,
            allowDecimalQuantity INTEGER NOT NULL DEFAULT 0,
            _deleted INTEGER NOT NULL DEFAULT 0,
            createdAt INTEGER NOT NULL,
            updatedAt INTEGER NOT NULL,
            synced INTEGER NOT NULL DEFAULT 0
        )`,
        `CREATE TABLE IF NOT EXISTS customers (
            customerId TEXT PRIMARY KEY,
            fullname TEXT NOT NULL,
            phone TEXT,
            email TEXT,
            address TEXT,
            allowCredit INTEGER NOT NULL DEFAULT 0,
            creditLimit INTEGER NOT NULL DEFAULT 0,
            _deleted INTEGER NOT NULL DEFAULT 0,
            createdAt INTEGER NOT NULL,
            updatedAt INTEGER NOT NULL,
            synced INTEGER NOT NULL DEFAULT 0
        )`,
        `CREATE TABLE IF NOT EXISTS sales (
            saleId TEXT PRIMARY KEY,
            userId TEXT NOT NULL,
            customerId TEXT NOT NULL,
            totalAmount INTEGER NOT NULL,
            paymentMethod TEXT NOT NULL DEFAULT 'cash',
            _deleted INTEGER NOT NULL DEFAULT 0,
            SRIStatus TEXT NOT NULL DEFAULT 'pending',
            createdAt INTEGER NOT NULL,
            updatedAt INTEGER NOT NULL,
            synced INTEGER NOT NULL DEFAULT 0
        )`,
        `CREATE TABLE IF NOT EXISTS sale_items (
            id TEXT PRIMARY KEY,
            saleId TEXT NOT NULL,
            productId TEXT NOT NULL,
            quantity REAL NOT NULL,
            unitPrice INTEGER NOT NULL,
            subtotal INTEGER NOT NULL,
            taxAmount INTEGER NOT NULL DEFAULT 0,
            lineTotal INTEGER NOT NULL,
            _deleted INTEGER NOT NULL DEFAULT 0,
            createdAt INTEGER NOT NULL,
            updatedAt INTEGER NOT NULL,
            synced INTEGER NOT NULL DEFAULT 0
        )`,
        `CREATE TABLE IF NOT EXISTS combo_products (
            comboProductId TEXT PRIMARY KEY,
            productId TEXT NOT NULL,
            comboQuantity REAL NOT NULL,
            comboPrice INTEGER NOT NULL,
            _deleted INTEGER NOT NULL DEFAULT 0,
            createdAt INTEGER NOT NULL,
            updatedAt INTEGER NOT NULL,
            synced INTEGER NOT NULL DEFAULT 0
        )`,
        `CREATE TABLE IF NOT EXISTS supplyings (
            supplyingId TEXT PRIMARY KEY,
            userId TEXT,
            supplierName TEXT,
            productId TEXT NOT NULL,
            unitCost INTEGER NOT NULL,
            quantity REAL NOT NULL,
            reason TEXT,
            supplyDate INTEGER NOT NULL,
            _deleted INTEGER NOT NULL DEFAULT 0,
            createdAt INTEGER NOT NULL,
            updatedAt INTEGER NOT NULL,
            synced INTEGER NOT NULL DEFAULT 0
        )`,
        `CREATE TABLE IF NOT EXISTS stock_movements (
            id TEXT PRIMARY KEY,
            productId TEXT NOT NULL,
            delta REAL NOT NULL,
            reason TEXT NOT NULL,
            referenceId TEXT,
            referenceType TEXT,
            _deleted INTEGER NOT NULL DEFAULT 0,
            createdAt INTEGER NOT NULL,
            updatedAt INTEGER NOT NULL,
            synced INTEGER NOT NULL DEFAULT 0
        )`,
        `CREATE TABLE IF NOT EXISTS debts (
            debtId TEXT PRIMARY KEY,
            customerId TEXT NOT NULL,
            saleId TEXT,
            amount INTEGER NOT NULL DEFAULT 0,
            _deleted INTEGER NOT NULL DEFAULT 0,
            createdAt INTEGER NOT NULL,
            updatedAt INTEGER NOT NULL,
            synced INTEGER NOT NULL DEFAULT 0
        )`,
        `CREATE TABLE IF NOT EXISTS debt_payments (
            debtPaymentId TEXT PRIMARY KEY,
            debtId TEXT NOT NULL,
            userId TEXT NOT NULL,
            amountPaid INTEGER NOT NULL,
            paymentDate INTEGER NOT NULL,
            _deleted INTEGER NOT NULL DEFAULT 0,
            createdAt INTEGER NOT NULL,
            updatedAt INTEGER NOT NULL,
            synced INTEGER NOT NULL DEFAULT 0
        )`,
        `CREATE TABLE IF NOT EXISTS tax_rates (
            id TEXT PRIMARY KEY,
            rate REAL NOT NULL,
            effectiveFrom INTEGER NOT NULL,
            _deleted INTEGER NOT NULL DEFAULT 0,
            createdAt INTEGER NOT NULL,
            updatedAt INTEGER NOT NULL,
            synced INTEGER NOT NULL DEFAULT 0
        )`,
        `CREATE TABLE IF NOT EXISTS bank_accounts (
            id TEXT PRIMARY KEY,
            bankName TEXT NOT NULL,
            accountNumber TEXT NOT NULL,
            accountHolder TEXT NOT NULL,
            _deleted INTEGER NOT NULL DEFAULT 0,
            createdAt INTEGER NOT NULL,
            updatedAt INTEGER NOT NULL,
            synced INTEGER NOT NULL DEFAULT 0
        )`,
    ];

    const indexes = [
        `CREATE INDEX IF NOT EXISTS idx_sale_items_saleId ON sale_items(saleId)`,
        `CREATE INDEX IF NOT EXISTS idx_sale_items_productId ON sale_items(productId)`,
        `CREATE INDEX IF NOT EXISTS idx_stock_movements_productId ON stock_movements(productId)`,
        `CREATE INDEX IF NOT EXISTS idx_supplyings_productId ON supplyings(productId)`,
        `CREATE INDEX IF NOT EXISTS idx_combo_products_productId ON combo_products(productId)`,
        `CREATE INDEX IF NOT EXISTS idx_debts_customerId ON debts(customerId)`,
        `CREATE INDEX IF NOT EXISTS idx_debt_payments_debtId ON debt_payments(debtId)`,
        `CREATE INDEX IF NOT EXISTS idx_sales_customerId ON sales(customerId)`,
        `CREATE INDEX IF NOT EXISTS idx_sales_userId ON sales(userId)`,
        `CREATE INDEX IF NOT EXISTS idx_debts_saleId ON debts(saleId)`,
    ];

    for (const sql of tables) {
        await client.execute(sql);
    }
    for (const sql of indexes) {
        await client.execute(sql);
    }

    const migrations = [
        `ALTER TABLE debts ADD COLUMN saleId TEXT`,
        `ALTER TABLE sales ADD COLUMN paymentMethod TEXT NOT NULL DEFAULT 'cash'`,
        `CREATE TABLE IF NOT EXISTS bank_accounts (
            id TEXT PRIMARY KEY,
            bankName TEXT NOT NULL,
            accountNumber TEXT NOT NULL,
            accountHolder TEXT NOT NULL,
            _deleted INTEGER NOT NULL DEFAULT 0,
            createdAt INTEGER NOT NULL,
            updatedAt INTEGER NOT NULL,
            synced INTEGER NOT NULL DEFAULT 0
        )`,
    ];
    for (const sql of migrations) {
        try { await client.execute(sql); } catch { /* columna ya existe */ }
    }
}

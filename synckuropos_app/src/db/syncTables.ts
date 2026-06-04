import * as schema from './schema';

/**
 * Lista centralizada de tablas que participan en la sincronización.
 * Cada entrada contiene el nombre (usado en la API REST) y la referencia
 * a la tabla Drizzle (usada en queries locales).
 *
 * Para agregar/quitar tablas del sync, basta con modificar este array.
 */
export const SYNC_TABLES = [
    { name: 'users', table: schema.users },
    { name: 'products', table: schema.products },
    { name: 'customers', table: schema.customers },
    { name: 'sales', table: schema.sales },
    { name: 'sale_items', table: schema.saleItems },
    { name: 'combo_products', table: schema.comboProducts },
    { name: 'supplyings', table: schema.supplyings },
    { name: 'stock_movements', table: schema.stockMovements },
    { name: 'debts', table: schema.debts },
    { name: 'debt_payments', table: schema.debtPayments },
    { name: 'tax_rates', table: schema.taxRates },
    { name: 'bank_accounts', table: schema.bankAccounts },
] as const;

export type SyncTableName = (typeof SYNC_TABLES)[number]['name'];

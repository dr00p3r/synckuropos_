// ============================================
// ENTIDADES DE BASE DE DATOS (SQLite/Drizzle)
// Timestamps: Unix ms (number)
// Soft delete: _deleted (false = activo, true = borrado)
// Campos opcionales: string | null (Drizzle devuelve null, no undefined)
// ============================================

export interface User {
    userId: string;
    username: string;
    passwordHash: string;
    role: 'admin' | 'cajero';
    _deleted: boolean;
    createdAt: number;
    updatedAt: number;
    synced: number;
}

export interface Product {
    productId: string;
    code: string | null;
    name: string;
    basePrice: number;
    isTaxable: boolean;
    allowDecimalQuantity: boolean;
    _deleted: boolean;
    createdAt: number;
    updatedAt: number;
    synced: number;
}

export interface ComboProduct {
    comboProductId: string;
    productId: string;
    comboQuantity: number;
    comboPrice: number;
    _deleted: boolean;
    createdAt: number;
    updatedAt: number;
    synced: number;
}

export interface Supplying {
    supplyingId: string;
    userId: string | null;
    supplierName: string | null;
    productId: string;
    unitCost: number;
    quantity: number;
    reason: string | null;
    supplyDate: number;
    _deleted: boolean;
    createdAt: number;
    updatedAt: number;
    synced: number;
}

export interface Sale {
    saleId: string;
    userId: string;
    customerId: string;
    totalAmount: number;
    paymentMethod: 'cash' | 'transfer' | 'credit';
    _deleted: boolean;
    SRIStatus: 'pending' | 'uploaded' | 'rejected' | 'accepted';
    createdAt: number;
    updatedAt: number;
    synced: number;
}

export interface SaleDetail {
    id: string;
    saleId: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    taxAmount: number;
    lineTotal: number;
    _deleted: boolean;
    createdAt: number;
    updatedAt: number;
    synced: number;
}

export interface Debt {
    debtId: string;
    customerId: string;
    saleId: string | null;
    amount: number;
    _deleted: boolean;
    createdAt: number;
    updatedAt: number;
    synced: number;
}

export interface DebtPayment {
    debtPaymentId: string;
    debtId: string;
    userId: string;
    amountPaid: number;
    paymentDate: number;
    _deleted: boolean;
    createdAt: number;
    updatedAt: number;
    synced: number;
}

export interface Customer {
    customerId: string;
    fullname: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    allowCredit: boolean;
    creditLimit: number; // Valor en centavos
    _deleted: boolean;
    createdAt: number;
    updatedAt: number;
    synced: number;
}

export interface StockMovement {
    id: string;
    productId: string;
    delta: number; // positivo = entrada, negativo = salida
    reason: string;
    referenceId: string | null;
    referenceType: 'sale' | 'supplying' | 'adjustment' | null;
    _deleted: boolean;
    createdAt: number;
    updatedAt: number;
    synced: number;
}

export interface TaxRate {
    id: string;
    rate: number; // 0.15 = 15%
    effectiveFrom: number; // Unix ms
    _deleted: boolean;
    createdAt: number;
    updatedAt: number;
    synced: number;
}

export interface BankAccount {
    id: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    _deleted: boolean;
    createdAt: number;
    updatedAt: number;
    synced: number;
}

// ============================================
// TIPOS DE UI / DOMINIO (no son tablas directas)
// ============================================

export interface SaleItem {
    productId: string;
    code: string | null;
    name: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
    allowDecimalQuantity: boolean;
    isTaxable: boolean;
    combosApplied?: ComboBreakdown[];
}

export interface ComboBreakdown {
    comboQuantity: number;
    comboPrice: number;
    combosUsed: number;
}

export interface SaleSummary {
    subtotal: number;
    tax: number;
    total: number;
    taxRate: number; // 0.15 = 15%
}

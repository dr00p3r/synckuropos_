export interface User {
    userId: string;
    username: string;
    passwordHash: string;
    role: 'admin' | 'cajero';
    isActive: boolean;
    _deleted: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Product {
    productId: string;
    code: string | undefined;
    name: string;
    stock: number;
    basePrice: number;
    isTaxable: boolean;
    allowDecimalQuantity: boolean;
    isActive: boolean;
    _deleted: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ComboProduct {
    comboProductId: string;
    productId: string;
    comboQuantity: number;
    comboPrice: number;
    isActive: boolean;
    _deleted: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Supplying {
    supplyingId: string;
    userId: string;
    supplierName: string;
    productId: string;
    unitCost: number;
    quantity: number;
    reason: string;
    supplyDate: string;
    isActive: boolean;
    _deleted: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Sale {
    saleId: string;
    userId: string;
    customerId: string;
    totalAmount: number;
    isActive: boolean;
    _deleted: boolean;
    isPartOfDebt: boolean;
    SRIStatus: 'pending' | 'uploaded' | 'rejected' | 'accepted';
    createdAt: string;
    updatedAt: string;
}

export interface SaleDetail {
    saleDetailId?: string;
    saleId: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    taxAmount: number;
    lineTotal: number;
    _deleted: boolean;
}

export interface Debt {
    debtId: string;
    customerId: string;
    amount: number;
    _deleted: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface DebtPayment {
    debtPaymentId: string;
    debtId: string;
    userId: string;
    amountPaid: number;
    paymentDate: string;
    _deleted: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Customer {
    customerId: string;
    fullname: string;
    phone: string | undefined;
    email: string | undefined;
    address: string | undefined;
    allowCredit: boolean;
    creditLimit: number; // Valor en centavos
    isActive: boolean;
    _deleted: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Telemetry {
    id: string;
    timestamp: number;
    type: string;
    data: any;
    isSynced: boolean;
}

export interface SystemHealth {
    id: string;
    last_heartbeat: number;
    last_failure_at?: number;
    total_uptime: number;
    total_crashes: number;
    current_status: string;
    integrity_status?: string;
}

// Tipos para el sistema de ventas
export interface SaleItem {
    productId: string;
    code: string | undefined;
    name: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
    allowDecimalQuantity: boolean;
    isTaxable: boolean; // Si el producto grava IVA
    combosApplied?: ComboBreakdown[]; // Información de combos aplicados
}

export interface ComboBreakdown {
    comboQuantity: number;
    comboPrice: number;
    combosUsed: number; // Cuántas veces se aplicó este combo
}

export interface SaleSummary {
    subtotal: number;
    tax: number; // 15% IVA
    total: number;
}
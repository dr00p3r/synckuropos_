export interface User{
    userId: string;
    username: string;
    passwordHash: string;
    role: 'admin' | 'cajero';
    _deleted: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Product{
    productId: string;
    code: string | undefined;
    name: string;
    stock: number;
    basePrice: number;
    isTaxable: boolean;
    allowDecimalQuantity: boolean;
    _deleted: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ComboProduct{
    comboProductId: string;
    productId: string;
    comboQuantity: number;
    comboPrice: number;
    _deleted: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Supplying{  
    supplyingId: string;
    supplierName: string;
    productId: string;
    unitCost: number;
    quantity: number;
    reason: string;
    supplyDate: string;
    _deleted: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Sale{
    saleId: string;
    userId: string;
    customerId: string;
    totalAmount: number;
    _deleted: boolean;
    isPartOfDebt: boolean;
    SRIStatus: 'pending' | 'uploaded' | 'rejected' | 'accepted';
    createdAt: string;
    updatedAt: string;
}

export interface SaleDetail{
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

export interface Debt{
    debtId: string;
    customerId: string;
    amount: number;
    _deleted: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface DebtPayment{
    debtPaymentId: string;
    debtId: string;
    userId: string;
    amountPaid: number;
    paymentDate: string;
    _deleted: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Customer{
    customerId: string;
    fullname: string;
    phone: string | undefined;
    email: string | undefined;
    address: string | undefined;
    allowCredit: boolean;
    creditLimit: number; // Valor en centavos
    _deleted: boolean;
    createdAt: string;
    updatedAt: string;
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
}

export interface SaleSummary {
    subtotal: number;
    tax: number; // 15% IVA
    total: number;
}
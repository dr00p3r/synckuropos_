import type { Sale, SaleDetail, Product } from '@/types/types';

// Extendemos la venta para incluir sus detalles ya "pegados" en memoria
export interface SaleWithDetails extends Sale {
    details: (SaleDetail & { productName: string })[]; // Detalle + Nombre del producto
}

export interface DailySalesSummary {
    date: string;       
    totalAmount: number;
    transactionCount: number;
    sales: SaleWithDetails[];
}

export interface SalesReportData {
    totalRevenue: number;
    totalTransactions: number;
    dailyData: DailySalesSummary[];
    // Datos pre-formateados para el Chart de PrimeReact
    chartData: {
        labels: string[];
        datasets: any[];
    };
}

// Interfaz simple para el combo de usuarios
export interface UserOption {
    label: string;
    value: string;
}

export type MovementType = 'SALE' | 'SUPPLY';

export interface InventoryMovement {
    id: string;             // saleItem.id o supplyingId
    date: number;           // timestamp Unix ms
    type: MovementType;
    productName: string;
    quantity: number;
    unitValue: number;      // unitPrice (Venta) o unitCost (Compra)
    totalValue: number;     // lineTotal (Venta) o Costo Total (Compra)
    documentId: string;     // Para referencia (SaleID o SupplyingID)
}

export interface ProfitReportData {
    totalRevenue: number;   // Total Ventas
    totalInvested: number;  // Total Compras (Supplyings)
    netProfit: number;      // Revenue - Invested
    roi: number;            // Return on Investment %
    movements: InventoryMovement[]; // Lista unificada
    chartData: any;         // Comparativa Ingreso vs Gasto
}

export interface CustomerOption {
    label: string;
    value: string;
}

export interface DebtTransaction {
    id: string;
    type: 'SALE' | 'PAYMENT';
    time: string;
    userId: string;
    userName: string;
    amount: number;
    products?: { name: string; quantity: number; unitPrice: number; lineTotal: number }[];
}

export interface DebtReportEntry {
    date: string;
    dateMs: number;
    credited: number;
    paid: number;
    runningDebt: number;
    transactions: DebtTransaction[];
}

export interface DebtReportData {
    customerId: string;
    customerName: string;
    openingBalance: number;
    closingBalance: number;
    totalCredited: number;
    totalPaid: number;
    dailyData: DebtReportEntry[];
}

export type { Sale, SaleDetail, Product };
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
    id: string;             // saleDetailId o supplyingId
    date: string;           // createdAt o supplyDate
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

export type { Sale, SaleDetail, Product };
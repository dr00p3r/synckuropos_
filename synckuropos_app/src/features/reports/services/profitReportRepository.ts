import { v4 as uuidv4 } from 'uuid';
import type { InventoryMovement, Product } from '../types';

function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const profitRepository = {
    // Buscar productos para el AutoComplete
    async searchProducts(db: any, query: string) {
        if (!query) return [];
        
        const safeQuery = escapeRegExp(query);

        const results = await db.products.find({
            selector: {
                name: { 
                    $regex: safeQuery, 
                    $options: 'i' // 'i' = Case Insensitive
                }
            },
            limit: 10
        }).exec();

        return results.map((doc: any) => ({ label: doc.name, value: doc.productId }));
    },

    async getProfitMovements(
        db: any,
        startDate: Date,
        endDate: Date,
        productIds: string[] = []
    ): Promise<InventoryMovement[]> {
        const startISO = startDate.toISOString();
        const endISO = endDate.toISOString();
        
        // 1. Obtener VENTAS (Ingresos)
        // Nota: Para filtrar por producto exacto en ventas, primero traemos las ventas del rango
        // y luego filtramos sus detalles. Es más rápido que buscar en todos los detalles.
        const salesDocs = await db.sales.find({
            selector: {
                isActive: true,
                createdAt: { $gte: startISO, $lte: endISO }
            }
        }).exec();
        
        const saleIds = salesDocs.map((s: any) => s.saleId);
        
        const saleDetailsDocs = await db.saleDetails.find({
            selector: { saleId: { $in: saleIds } }
        }).exec();

        // 2. Obtener ABASTECIMIENTOS (Gastos/Inversión)
        const supplySelector: any = {
            isActive: true,
            supplyDate: { $gte: startISO, $lte: endISO }
        };

        // Optimización: Si hay filtro de productos, úsalo directo en la query de supplyings
        if (productIds.length > 0) {
            supplySelector.productId = { $in: productIds };
        }

        const suppliesDocs = await db.supplyings.find({
            selector: supplySelector
        }).exec();

        // 3. Obtener Nombres de Productos (Diccionario)
        // Recolectamos todos los productIds involucrados para hacer un solo fetch
        const allProductIds = new Set([
            ...saleDetailsDocs.map((d: any) => d.productId),
            ...suppliesDocs.map((s: any) => s.productId)
        ]);
        
        const productsDocs = await db.products.find({
            selector: { productId: { $in: Array.from(allProductIds) } }
        }).exec();
        
        const productMap = new Map<string, string>();
        productsDocs.forEach((p: any) => productMap.set(p.productId, p.name));

        // 4. Unificar y Transformar a "Movimientos"
        const movements: InventoryMovement[] = [];

        // Procesar Ventas (Solo si el producto está en el filtro o no hay filtro)
        saleDetailsDocs.forEach((d: any) => {
            if (productIds.length > 0 && !productIds.includes(d.productId)) return;

            movements.push({
                id: d.saleDetailId,
                date: d.createdAt || salesDocs.find((s:any) => s.saleId === d.saleId)?.createdAt, // Fallback fecha
                type: 'SALE',
                productName: productMap.get(d.productId) || 'Desconocido',
                quantity: d.quantity,
                unitValue: d.unitPrice,
                totalValue: d.lineTotal,
                documentId: d.saleId
            });
        });

        suppliesDocs.forEach((s: any) => {
             if (productIds.length > 0 && !productIds.includes(s.productId)) return;

             movements.push({
                id: s.supplyingId,
                date: s.supplyDate,
                type: 'SUPPLY',
                productName: productMap.get(s.productId) || 'Desconocido',
                quantity: s.quantity,
                unitValue: s.unitCost,
                totalValue: s.quantity * s.unitCost,
                documentId: s.supplyingId
             });
        });

        // Ordenar por fecha descendente
        return movements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
};
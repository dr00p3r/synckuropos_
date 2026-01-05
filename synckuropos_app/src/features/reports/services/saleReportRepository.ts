import type { 
    Sale, 
    SaleDetail, 
    Product, 
    SaleWithDetails, 
    UserOption 
} from '../types';

export const reportRepository = {
    async getUsers(db: any): Promise<UserOption[]> {
        const users = await db.users.find().exec();
        return users.map((u: any) => ({
            label: u.username,
            value: u.userId
        }));
    },

    async getSalesWithDetails(
        db: any, 
        startDate: Date, 
        endDate: Date, 
        userId?: string
    ): Promise<SaleWithDetails[]> {
        const startISO = startDate.toISOString();
        const endISO = endDate.toISOString();

        const selector: any = {
            isActive: true,
            createdAt: { $gte: startISO, $lte: endISO }
        };
        if (userId) selector.userId = userId;

        const salesDocs = await db.sales.find({ selector }).sort({ createdAt: 'desc' }).exec();
        const sales: Sale[] = salesDocs.map((d: any) => d.toJSON());

        if (sales.length === 0) return [];

        const saleIds = sales.map(s => s.saleId);
        
        const detailsDocs = await db.saleDetails.find({
            selector: {
                saleId: { $in: saleIds }
            }
        }).exec();
        const allDetails: SaleDetail[] = detailsDocs.map((d: any) => d.toJSON());

        const productIds = [...new Set(allDetails.map(d => d.productId))];
        const productsDocs = await db.products.find({
            selector: {
                productId: { $in: productIds }
            }
        }).exec();
        
        const productMap = new Map<string, string>();
        productsDocs.forEach((p: any) => productMap.set(p.productId, p.name));

        return sales.map(sale => {
            // Filtrar detalles de esta venta
            const myDetails = allDetails.filter(d => d.saleId === sale.saleId);
            
            // Enriquecer detalle con nombre de producto
            const enrichedDetails = myDetails.map(detail => ({
                ...detail,
                productName: productMap.get(detail.productId) || 'Producto Desconocido'
            }));

            return {
                ...sale,
                details: enrichedDetails
            };
        });
    }
};
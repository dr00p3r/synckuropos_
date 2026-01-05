import { v4 as uuidv4 } from 'uuid';
import type { Product, StockFormData } from '../types';

export const productRepository = {
    // Obtener todos los productos (RxDB Query)
    getProductsQuery(db: any) {
        return db.products.find().sort({ name: 'asc' });
    },

    // Crear Producto (y movimiento de stock inicial si aplica)
    async createProduct(db: any, productData: Partial<Product>, initialStockData?: StockFormData) {
        const productId = uuidv4();
        
        // 1. Crear el producto
        const newProduct: Product = {
            productId,
            code: productData.code || '',
            name: productData.name!,
            stock: 0,
            basePrice: productData.basePrice || 0,
            isTaxable: productData.isTaxable ?? true,
            allowDecimalQuantity: productData.allowDecimalQuantity ?? false,
            isActive: true,
            _deleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await db.products.insert(newProduct);

        if (initialStockData && parseFloat(initialStockData.quantityToMove) > 0) {
            await this.registerStockMovement(db, newProduct, initialStockData, 'unknown_user');
        }

        return newProduct;
    },

    // Actualizar Producto
    async updateProduct(db: any, product: Product, updates: Partial<Product>) {
        // 1. Buscamos el Documento real en la BD usando el ID
        const productDoc = await db.products.findOne({ 
            selector: { productId: product.productId } 
        }).exec();

        // 2. Si existe, ejecutamos el update sobre el Documento
        if (productDoc) {
            return productDoc.update({
                $set: {
                    ...updates,
                    updatedAt: new Date().toISOString()
                }
            });
        }
        throw new Error("Producto no encontrado para actualizar");
    },

    // Registrar Movimiento de Stock (Supplying + Update Product)
    async registerStockMovement(db: any, product: Product, data: StockFormData, userId: string) {
        const quantity = parseFloat(data.quantityToMove);
        const cost = parseFloat(data.costPerUnit || '0');
        const newPrice = parseFloat(data.newSalePrice || '0');

        // 1. Registro histórico
        await db.supplyings.insert({
            supplyingId: uuidv4(),
            userId,
            productId: product.productId,
            quantity,
            unitCost: Math.round(cost * 100),
            reason: data.reason,
            supplyDate: new Date().toISOString(),
            isActive: true,
            _deleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        // 2. Actualizar producto
        const productDoc = await db.products.findOne({ 
            selector: { productId: product.productId } 
        }).exec();

        const newStock = Math.max(0, product.stock + quantity);
        const updateData: any = { stock: newStock, updatedAt: new Date().toISOString() };
        
        if (newPrice > 0) {
            updateData.basePrice = Math.round(newPrice * 100);
        }

        return productDoc.update({ $set: updateData });
    },

    // Toggle Activo/Inactivo
    async toggleStatus(db: any, product: Product) {
        const productDoc = await db.products.findOne({ 
            selector: { productId: product.productId } 
        }).exec();

        if (productDoc) {
            return productDoc.update({
                $set: { isActive: !product.isActive, updatedAt: new Date().toISOString() }
            });
        }
    }
};
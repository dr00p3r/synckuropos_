import { eq, and, like, desc } from 'drizzle-orm';
import type { StockFormData } from '../types';
import type { Product, ComboProduct } from '@/types/types';
import type { AppDatabase } from '@/hooks/useDatabase';
import * as schema from '@/db/schema';


export const productRepository = {
    // Obtener todos los productos (activos e inactivos) ordenados por nombre
    async getProducts(db: AppDatabase): Promise<Product[]> {
        return db
            .select()
            .from(schema.products)
            .orderBy(schema.products.name);
    },

    // Crear Producto (y movimiento de stock inicial si aplica)
    async createProduct(db: AppDatabase, productData: Partial<Product>, initialStockData?: StockFormData) {
        const productId = crypto.randomUUID();
        const now = Date.now();

        const newProduct: Product = {
            productId,
            code: productData.code || '',
            name: productData.name!,
            basePrice: productData.basePrice || 0,
            isTaxable: productData.isTaxable ?? true,
            allowDecimalQuantity: productData.allowDecimalQuantity ?? false,
            _deleted: false,
            createdAt: now,
            updatedAt: now,
            synced: 0
        };

        await db.insert(schema.products).values(newProduct);

        if (initialStockData && parseFloat(initialStockData.quantityToMove) > 0) {
            await this.registerStockMovement(db, newProduct, initialStockData, 'unknown_user');
        }

        return newProduct;
    },

    // Actualizar Producto
    async updateProduct(db: AppDatabase, productId: string, updates: Partial<Product>) {
        const now = Date.now();
        await db
            .update(schema.products)
            .set({ ...updates, updatedAt: now })
            .where(eq(schema.products.productId, productId));
    },

    // Registrar Movimiento de Stock (Supplying + StockMovement delta)
    async registerStockMovement(db: AppDatabase, product: Product, data: StockFormData, userId: string) {
        const quantity = parseFloat(data.quantityToMove);
        const cost = parseFloat(data.costPerUnit || '0');
        const newPrice = parseFloat(data.newSalePrice || '0');
        const now = Date.now();

        // 1. Registro histórico de abastecimiento
        const supplyingId = crypto.randomUUID();
        await db.insert(schema.supplyings).values({
            supplyingId,
            userId,
            productId: product.productId,
            quantity,
            unitCost: Math.round(cost * 100),
            reason: data.reason,
            supplyDate: now,
            _deleted: false,
            createdAt: now,
            updatedAt: now,
            synced: 0
        });

        // 2. Movimiento de stock (delta positivo)
        await db.insert(schema.stockMovements).values({
            id: crypto.randomUUID(),
            productId: product.productId,
            delta: quantity,
            reason: data.reason || 'Abastecimiento',
            referenceId: supplyingId,
            referenceType: 'supplying',
            _deleted: false,
            createdAt: now,
            updatedAt: now,
            synced: 0
        });

        // 3. Actualizar precio si aplica
        if (newPrice > 0) {
            await db
                .update(schema.products)
                .set({ basePrice: Math.round(newPrice * 100), updatedAt: now })
                .where(eq(schema.products.productId, product.productId));
        }
    },

    // Soft delete producto (toggle _deleted)
    async toggleStatus(db: AppDatabase, productId: string) {
        const rows = await db
            .select({ _deleted: schema.products._deleted })
            .from(schema.products)
            .where(eq(schema.products.productId, productId));

        const current = rows[0];
        if (!current) throw new Error('Producto no encontrado');

        const now = Date.now();
        await db
            .update(schema.products)
            .set({ _deleted: !current._deleted, updatedAt: now })
            .where(eq(schema.products.productId, productId));

        return !current._deleted;
    },

    // Combos
    async getCombosByProduct(db: AppDatabase, productId: string) {
        return db
            .select()
            .from(schema.comboProducts)
            .where(
                and(
                    eq(schema.comboProducts.productId, productId),
                    eq(schema.comboProducts._deleted, false)
                )
            )
            .orderBy(schema.comboProducts.comboQuantity);
    },

    async addCombo(db: AppDatabase, productId: string, quantity: number, price: number) {
        const existing = await db
            .select()
            .from(schema.comboProducts)
            .where(
                and(
                    eq(schema.comboProducts.productId, productId),
                    eq(schema.comboProducts.comboQuantity, quantity),
                    eq(schema.comboProducts._deleted, false)
                )
            );

        if (existing.length > 0) {
            throw new Error(`Ya existe un combo con cantidad ${quantity} para este producto`);
        }

        const now = Date.now();
        await db.insert(schema.comboProducts).values({
            comboProductId: crypto.randomUUID(),
            productId,
            comboQuantity: quantity,
            comboPrice: Math.round(price * 100),
            _deleted: false,
            createdAt: now,
            updatedAt: now,
            synced: 0
        });
    },

    async deleteCombo(db: AppDatabase, comboProductId: string) {
        const now = Date.now();
        await db
            .update(schema.comboProducts)
            .set({ _deleted: true, updatedAt: now })
            .where(eq(schema.comboProducts.comboProductId, comboProductId));
    },

    async getLastSupplyCost(db: AppDatabase, productId: string): Promise<number | null> {
        const rows = await db
            .select()
            .from(schema.supplyings)
            .where(
                and(
                    eq(schema.supplyings.productId, productId),
                    eq(schema.supplyings._deleted, false)
                )
            )
            .orderBy(desc(schema.supplyings.supplyDate))
            .limit(1);

        if (rows.length > 0) {
            return rows[0].unitCost / 100;
        }
        return null;
    },

    async getActiveCombosByProduct(db: AppDatabase, productId: string) {
        return db
            .select()
            .from(schema.comboProducts)
            .where(
                and(
                    eq(schema.comboProducts.productId, productId),
                    eq(schema.comboProducts._deleted, false)
                )
            )
            .orderBy(desc(schema.comboProducts.comboQuantity));
    },

    async getAllActiveCombos(db: AppDatabase): Promise<Map<string, ComboProduct[]>> {
        const rows = await db
            .select()
            .from(schema.comboProducts)
            .where(eq(schema.comboProducts._deleted, false))
            .orderBy(desc(schema.comboProducts.comboQuantity));

        const map = new Map<string, ComboProduct[]>();
        for (const row of rows) {
            const list = map.get(row.productId) ?? [];
            list.push(row as ComboProduct);
            map.set(row.productId, list);
        }
        return map;
    },

    // Búsqueda simple
    async searchProducts(db: AppDatabase, query: string): Promise<Product[]> {
        const q = `%${query}%`;
        return db
            .select()
            .from(schema.products)
            .where(
                and(
                    eq(schema.products._deleted, false),
                    like(schema.products.name, q)
                )
            )
            .limit(10);
    },

    async findByCode(db: AppDatabase, code: string): Promise<Product | null> {
        const rows = await db
            .select()
            .from(schema.products)
            .where(
                and(
                    eq(schema.products._deleted, false),
                    eq(schema.products.code, code)
                )
            )
            .limit(1);
        return rows[0] ?? null;
    }
};

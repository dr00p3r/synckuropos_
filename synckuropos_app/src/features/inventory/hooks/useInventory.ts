import { useState, useEffect } from 'react';
import { useDatabase, useToast } from '@/hooks';
import { productRepository } from '../services/productRepository';
import { getStockForProducts } from '../../../db/stockHelpers';
import type { Product } from '@/types/types';

export interface ProductWithStock extends Product {
    stock: number;
}

export const useInventory = () => {
    const [products, setProducts] = useState<ProductWithStock[]>([]);
    const [loading, setLoading] = useState(true);
    const db = useDatabase();
    const toast = useToast();

    const loadProducts = async () => {
        if (!db) return;
        setLoading(true);
        try {
            const rawProducts = await productRepository.getProducts(db);
            const productIds = rawProducts.map(p => p.productId);
            const stockMap = await getStockForProducts(db, productIds);

            const enriched = rawProducts.map(p => ({
                ...p,
                stock: stockMap.get(p.productId) ?? 0
            }));

            setProducts(enriched);
        } catch (error) {
            console.error(error);
            toast.showError('Error al cargar inventario');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadProducts(); }, [db]);

    const toggleStatus = async (product: ProductWithStock) => {
        try {
            await productRepository.toggleStatus(db, product.productId);
            toast.showSuccess(`Producto ${product._deleted ? 'activado' : 'desactivado'}`);
            setProducts(prev => prev.map(p =>
                p.productId === product.productId ? { ...p, _deleted: !p._deleted } : p
            ));
        } catch (e) {
            toast.showError('Error al actualizar estado');
        }
    };

    return { products, loading, loadProducts, toggleStatus };
};

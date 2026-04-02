import { useState, useEffect } from 'react';
import { useDatabase, useToast } from '@/hooks';
import { productRepository } from '../services/productRepository';
import type { Product } from '@/types/types';

export const useInventory = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const db = useDatabase();
    const toast = useToast();

    // Carga inicial
    const loadProducts = async () => {
        if (!db) return;
        setLoading(true);
        try {
            const query = productRepository.getProductsQuery(db);
            const results = await query.exec();
            setProducts(results.map((doc: any) => doc));
        } catch (error) {
            console.error(error);
            toast.showError('Error al cargar inventario');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadProducts(); }, [db]);

    // Actions
    const toggleStatus = async (product: Product) => {
        try {
            await productRepository.toggleStatus(db, product);
            toast.showSuccess(`Producto ${product.isActive ? 'desactivado' : 'activado'}`);
            loadProducts(); // Recargar para reflejar cambios
        } catch (e) {
            toast.showError('Error al actualizar estado');
        }
    };

    const deleteInactiveProduct = async (product: Product) => {
        try {
            if (product.isActive) {
                toast.showWarn('Solo se pueden eliminar productos inactivos');
                return;
            }

            await productRepository.deleteInactiveProduct(db, product);
            toast.showSuccess('Producto eliminado definitivamente');
            loadProducts();
        } catch (e) {
            toast.showError('Error al eliminar producto');
        }
    };

    return { products, loading, loadProducts, toggleStatus, deleteInactiveProduct };
};
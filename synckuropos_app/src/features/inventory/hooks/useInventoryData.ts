import { useState, useCallback, useMemo } from 'react';
import { useRxQuery, useRxCollection } from 'rxdb-hooks';
import { useToast } from '@/hooks/useToast';
import type { Product, SortField, SortDirection, UseInventoryDataReturn } from '../types';

// Configuración de paginación
const RESULTS_LIMIT = 100; // Límite de resultados para evitar congelar la UI

export const useInventoryData = (): UseInventoryDataReturn => {
  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Hooks
  const collection = useRxCollection('products');
  const toast = useToast();

  // Build selector reactively
  const selector = useMemo(() => {
    const sel: any = {};

    // Filtrar por estado activo/inactivo a nivel de DB
    if (!showInactive) {
      sel.isActive = true;
    }

    // No aplicamos búsqueda aquí - se hará en memoria para case-insensitive

    return sel;
  }, [showInactive]);

  // Build query reactively
  const query = useMemo(() => {
    if (!collection) return undefined;

    let q = collection.find({
      selector: Object.keys(selector).length > 0 ? selector : undefined
    });

    // Aplicar ordenamiento
    if (sortDirection === 'asc') {
      q = q.sort(sortField);
    } else {
      q = q.sort(`-${sortField}`);
    }

    // Aplicar límite de resultados
    q = q.limit(RESULTS_LIMIT);

    return q;
  }, [collection, selector, sortField, sortDirection]);

  // Reactive query - auto-updates!
  const { result: productsRaw, isFetching: loading } = useRxQuery(query);

  // Convert RxDocuments to plain Product objects and apply search filter
  const products = useMemo(() => {
    if (!productsRaw) return [];
    return productsRaw.map(doc => doc.toJSON() as Product);
  }, [productsRaw]);

  // Apply search filter in-memory for case-insensitive search
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    
    const searchLower = searchTerm.toLowerCase().trim();
    return products.filter(product => {
      const code = product.code?.toLowerCase() || '';
      const name = product.name.toLowerCase();
      return code.includes(searchLower) || name.includes(searchLower);
    });
  }, [products, searchTerm]);

  // Manejar cambio de ordenamiento
  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      // Si es el mismo campo, cambiar la dirección
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Si es un campo diferente, cambiar campo y resetear a 'asc'
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField]);

  // Alternar estado activo/inactivo del producto
  const toggleProductStatus = useCallback(async (product: Product) => {
    if (!collection) return;

    try {
      const productDoc = await collection.findOne({
        selector: { productId: { $eq: product.productId } } as any
      }).exec();

      if (productDoc) {
        await productDoc.update({
          $set: {
            isActive: !product.isActive,
            updatedAt: new Date().toISOString()
          }
        });

        toast.showSuccess(
          `Producto ${product.isActive ? 'eliminado' : 'restaurado'} correctamente`
        );

        // No need to manually update state - reactive query will auto-update!
      }
    } catch (error) {
      console.error('Error actualizando estado del producto:', error);
      toast.showError('Error al cambiar el estado del producto');
    }
  }, [collection, toast]);

  return {
    // Estados principales
    products,
    filteredProducts,
    loading,

    // Estados de filtros
    searchTerm,
    showInactive,
    sortField,
    sortDirection,

    // Acciones
    setSearchTerm,
    setShowInactive,
    handleSort,
    loadProducts: async () => {}, // No-op - reactive query handles this
    toggleProductStatus,
  };
};
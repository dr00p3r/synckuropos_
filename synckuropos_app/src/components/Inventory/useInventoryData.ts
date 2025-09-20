import { useState, useEffect, useCallback } from 'react';
import { useDatabase } from '../../hooks/useDatabase.tsx';
import { useToast } from '../../hooks/useToast';
import type { Product } from '../../types/types';

type SortField = 'code' | 'name' | 'basePrice' | 'stock';
type SortDirection = 'asc' | 'desc';

interface UseInventoryDataReturn {
  // Estados principales
  products: Product[];
  filteredProducts: Product[];
  loading: boolean;
  
  // Estados de filtros
  searchTerm: string;
  showInactive: boolean;
  sortField: SortField;
  sortDirection: SortDirection;
  
  // Acciones
  setSearchTerm: (term: string) => void;
  setShowInactive: (show: boolean) => void;
  handleSort: (field: SortField) => void;
  loadProducts: () => Promise<void>;
  toggleProductStatus: (product: Product) => Promise<void>;
}

export const useInventoryData = (): UseInventoryDataReturn => {
  // Estados principales
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Hooks
  const db = useDatabase();
  const toast = useToast();

  // Cargar productos desde la base de datos
  const loadProducts = useCallback(async () => {
    if (!db) return;
    
    try {
      setLoading(true);
      let query = db.products.find();
      
      // Aplicar ordenamiento
      if (sortDirection === 'asc') {
        query = query.sort(sortField);
      } else {
        query = query.sort(`-${sortField}`);
      }
      
      const allProducts = await query.exec();
      const productsData = allProducts.map((doc: any) => doc.toJSON());
      setProducts(productsData);
    } catch (error) {
      console.error('Error cargando productos:', error);
      toast.showError('Error al cargar los productos');
    } finally {
      setLoading(false);
    }
  }, [db, sortField, sortDirection]);

  // Cargar productos al montar el componente y cuando cambien los criterios de ordenamiento
  useEffect(() => {
    if (db) {
      loadProducts();
    }
  }, [db, loadProducts]);

  // Filtrar productos cuando cambian los criterios de búsqueda
  useEffect(() => {
    let filtered = products;

    // Filtrar por estado activo/inactivo
    if (!showInactive) {
      filtered = filtered.filter(product => product.isActive);
    }

    // Filtrar por término de búsqueda
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(product => 
        (product.code?.toLowerCase().includes(search)) ||
        product.name.toLowerCase().includes(search)
      );
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, showInactive]);

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
    if (!db) return;
    
    try {
      const productDoc = await db.products.findOne({
        selector: { productId: product.productId }
      }).exec();
      
      if (productDoc) {
        await productDoc.update({
          $set: {
            isActive: !product.isActive,
            updatedAt: new Date().toISOString()
          }
        });
        
        toast.showSuccess(
          `Producto ${product.isActive ? 'restaurado' : 'eliminado'} correctamente`
        );
        
        // Actualizar el estado local directamente en lugar de recargar todo
        setProducts(prevProducts => 
          prevProducts.map(p => 
            p.productId === product.productId 
              ? { ...p, isActive: !p.isActive, updatedAt: new Date().toISOString() }
              : p
          )
        );
      }
    } catch (error) {
      console.error('Error actualizando estado del producto:', error);
      toast.showError('Error al cambiar el estado del producto');
    }
  }, [db]);

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
    loadProducts,
    toggleProductStatus,
  };
};
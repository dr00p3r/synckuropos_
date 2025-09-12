import React, { useState, useEffect, useCallback } from 'react';
import { useDatabase } from '../../hooks/useDatabase.tsx';
import { useToast } from '../../hooks/useToast';
import { ProductModal } from './ProductModal';
import type { Product } from '../../types/types';
import './InventoryScreen.css';

type SortField = 'code' | 'name' | 'basePrice' | 'stock';
type SortDirection = 'asc' | 'desc';

const InventoryScreen: React.FC = () => {
  // Estados principales
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Estados del modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  
  // Estados de ordenamiento
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Hooks
  const db = useDatabase();
  const toast = useToast();

  // Cargar productos desde la base de datos
  const loadProducts = useCallback(async () => {
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
  }, [db, sortField, sortDirection]); // Removido 'toast' de las dependencias

  // Cargar productos al montar el componente y cuando cambien los criterios de ordenamiento
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

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
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Obtener icono de ordenamiento
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  // Abrir modal para crear producto
  const handleCreateProduct = () => {
    setSelectedProduct(null);
    setModalMode('create');
    setModalVisible(true);
  };

  // Abrir modal para editar producto
  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setModalMode('edit');
    setModalVisible(true);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedProduct(null);
  };

  // Manejar cuando se guarda un producto
  const handleProductSaved = () => {
    loadProducts();
  };

  // Alternar estado activo/inactivo del producto
  const toggleProductStatus = async (product: Product) => {
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
          `Producto ${product.isActive ? 'desactivado' : 'activado'} correctamente`
        );
        
        loadProducts();
      }
    } catch (error) {
      console.error('Error actualizando estado del producto:', error);
      toast.showError('Error al cambiar el estado del producto');
    }
  };

  // Formatear precio
  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="inventory-loading">
        <div className="loading-spinner">🔄</div>
        <p>Cargando inventario...</p>
      </div>
    );
  }

  return (
    <div className="inventory-screen">
      {/* Header */}
      <div className="inventory-header">
        <h1>Inventario</h1>
      </div>

      {/* Controles de búsqueda y filtros */}
      <div className="inventory-controls">
        <div className="search-container">
          <input
            type="text"
            placeholder="Buscar por código o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <svg className="search-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <button 
            className="add-product-btn search-add-btn"
            onClick={handleCreateProduct}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            Agregar Producto
          </button>
        </div>
        
        <div className="filter-controls">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="toggle-checkbox"
            />
            <span className="toggle-slider"></span>
            Mostrar productos inactivos
          </label>
          
          <div className="results-count">
            {filteredProducts.length} de {products.length} productos
          </div>
        </div>
      </div>

      {/* Tabla de productos */}
      <div className="products-table-container">
        {filteredProducts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>No se encontraron productos</h3>
            <p>
              {searchTerm 
                ? 'Intenta con diferentes términos de búsqueda'
                : 'Comienza agregando tu primer producto'
              }
            </p>
            {!searchTerm && (
              <button 
                className="add-product-btn"
                onClick={handleCreateProduct}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                Agregar Primer Producto
              </button>
            )}
          </div>
        ) : (
          <div className="products-table-wrapper">
            <table className="products-table">
              <thead>
                <tr>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('code')}
                  >
                    Código {getSortIcon('code')}
                  </th>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('name')}
                  >
                    Nombre {getSortIcon('name')}
                  </th>
                  <th 
                    className="sortable-header actions-header"
                    onClick={() => handleSort('basePrice')}
                  >
                    Precio {getSortIcon('basePrice')}
                  </th>
                  <th 
                    className="sortable-header actions-header"
                    onClick={() => handleSort('stock')}
                  >
                    Cantidad {getSortIcon('stock')}
                  </th>
                  <th className="actions-header">Editar</th>
                  <th className="actions-header">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr 
                    key={product.productId}
                    className={`product-row ${product.stock === 0 ? 'out-of-stock' : ''} ${!product.isActive ? 'inactive' : ''}`}
                  >
                    <td className="product-code">
                      {product.code || '—'}
                    </td>
                    <td className="product-name">
                      {product.name}
                      {!product.isActive && <span className="inactive-badge">Inactivo</span>}
                    </td>
                    <td className="product-price">
                      {formatPrice(product.basePrice)}
                    </td>
                    <td className="product-stock">
                      <span className={`stock-badge ${product.stock === 0 ? 'zero-stock' : product.stock < 10 ? 'low-stock' : 'normal-stock'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="product-actions">
                      <button
                        className="edit-btn"
                        onClick={() => handleEditProduct(product)}
                        title="Editar producto"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                        </svg>
                      </button>
                    </td>
                    <td className="product-status">
                      <label className="status-toggle">
                        <input
                          type="checkbox"
                          checked={product.isActive}
                          onChange={() => toggleProductStatus(product)}
                          className="status-checkbox"
                        />
                        <span className="status-slider"></span>
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de gestión de productos */}
      {modalVisible && (
        <ProductModal
          isOpen={modalVisible}
          mode={modalMode}
          product={selectedProduct || undefined}
          onClose={handleCloseModal}
          onSave={handleProductSaved}
        />
      )}
    </div>
  );
};

export default InventoryScreen;

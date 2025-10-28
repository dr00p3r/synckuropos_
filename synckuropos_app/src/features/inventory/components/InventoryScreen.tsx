import React, { useState } from 'react';
import SearchControls from './SearchControls';
import ProductsTable from './ProductsTable';
import { ProductModal } from './ProductModal';
import { useInventoryData } from '../hooks/useInventoryData';
import type { Product } from '../types';
import './InventoryScreen.css';

const InventoryScreen: React.FC = () => {
  // Estados del modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  // Custom hook para manejar datos del inventario
  const {
    products,
    filteredProducts,
    loading,
    searchTerm,
    showInactive,
    sortField,
    sortDirection,
    setSearchTerm,
    setShowInactive,
    handleSort,
    loadProducts,
    toggleProductStatus,
  } = useInventoryData();

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
      <SearchControls
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showInactive={showInactive}
        onShowInactiveChange={setShowInactive}
        totalProducts={products.length}
        filteredProducts={filteredProducts.length}
        onCreateProduct={handleCreateProduct}
      />

      {/* Tabla de productos */}
      <ProductsTable
        products={filteredProducts}
        searchTerm={searchTerm}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        onEditProduct={handleEditProduct}
        onToggleProductStatus={toggleProductStatus}
        onCreateProduct={handleCreateProduct}
      />

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

import React from 'react';
import './EmptyState.css';

interface EmptyStateProps {
  searchTerm: string;
  onCreateProduct: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ searchTerm, onCreateProduct }) => {
  return (
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
          onClick={onCreateProduct}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
          Agregar Primer Producto
        </button>
      )}
    </div>
  );
};

export default EmptyState;
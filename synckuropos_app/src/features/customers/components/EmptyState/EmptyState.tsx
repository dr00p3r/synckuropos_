import React from 'react';
import './EmptyState.css';

interface EmptyStateProps {
  searchTerm: string;
  showOnlyWithDebt: boolean;
  onAddCustomer: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  searchTerm,
  showOnlyWithDebt,
  onAddCustomer
}) => {
  const hasFilters = searchTerm || showOnlyWithDebt;

  return (
    <div className="empty-state">
      <div className="empty-icon">👥</div>
      <h3>No se encontraron clientes</h3>
      <p>
        {hasFilters
          ? 'Intenta con diferentes términos de búsqueda o filtros'
          : 'Comienza agregando tu primer cliente'
        }
      </p>
      {!hasFilters && (
        <button 
          className="add-customer-btn"
          onClick={onAddCustomer}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
          Agregar Primer Cliente
        </button>
      )}
    </div>
  );
};

export default EmptyState;
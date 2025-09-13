import React from 'react';
import './SearchControls.css';

interface SearchControlsProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  showOnlyWithDebt: boolean;
  onDebtFilterChange: (value: boolean) => void;
  totalCustomers: number;
  filteredCount: number;
  onAddCustomer: () => void;
}

const SearchControls: React.FC<SearchControlsProps> = ({
  searchTerm,
  onSearchChange,
  showOnlyWithDebt,
  onDebtFilterChange,
  totalCustomers,
  filteredCount,
  onAddCustomer
}) => {
  return (
    <div className="search-controls">
      <div className="search-container">
        <input
          type="text"
          placeholder="Buscar por nombre o teléfono..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />
        <svg className="search-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
        <button 
          className="add-customer-btn search-add-btn"
          onClick={onAddCustomer}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
          Agregar Nuevo Cliente
        </button>
      </div>
      
      <div className="filter-controls">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={showOnlyWithDebt}
            onChange={(e) => onDebtFilterChange(e.target.checked)}
            className="toggle-checkbox"
          />
          <span className="toggle-slider"></span>
          Mostrar solo clientes con deuda
        </label>
        
        <div className="results-count">
          {filteredCount} de {totalCustomers} clientes
        </div>
      </div>
    </div>
  );
};

export default SearchControls;
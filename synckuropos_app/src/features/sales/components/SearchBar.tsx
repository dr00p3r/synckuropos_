import React from 'react';
import { useProductSearch } from '../hooks/useProductSearch';
import { SearchResults } from './SearchResults';
import type { Product } from '../../../types/types';
import './SearchBar.css';

interface SearchBarProps {
  onProductSelect: (product: Product) => void;
  onClearSale?: () => void;
  hasSaleItems: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  onProductSelect, 
  onClearSale, 
  hasSaleItems 
}) => {
  const {
    searchTerm,
    setSearchTerm,
    searchResults,
    isSearching,
    selectedResultIndex,
    showResults,
    inputHasFocus,
    searchInputRef,
    searchResultsRef,
    handleKeyDown,
    handleInputFocus,
    handleInputBlur,
  } = useProductSearch({ onProductSelect });

  return (
    <div className="search-section">
      <div className="search-input-container">
        <input
          ref={searchInputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder="Buscar producto por código o nombre..."
          className="search-input"
        />
        {isSearching && <div className="search-loading">🔍</div>}
        {hasSaleItems && onClearSale && (
          <button
            onClick={onClearSale}
            className="clear-sale-button"
            title="Vaciar venta"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Vaciar
          </button>
        )}
      </div>

      <SearchResults
        results={searchResults}
        showResults={showResults && inputHasFocus}
        selectedIndex={selectedResultIndex}
        onProductSelect={onProductSelect}
        ref={searchResultsRef}
      />
    </div>
  );
};
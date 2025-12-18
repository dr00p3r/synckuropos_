import React from 'react';
import { Search, Trash2 } from 'lucide-react';
import { useProductSearch } from '../hooks/useProductSearch';
import { SearchResults } from './SearchResults';
import type { Product } from '../../../types/types';
import './SearchBar.css';

interface SearchBarProps {
  onProductSelect: (product: Product) => void;
  onClearSale?: () => void;
  hasSaleItems: boolean;
  searchInputRef: React.RefObject<HTMLInputElement>;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onProductSelect,
  onClearSale,
  hasSaleItems,
  searchInputRef
}) => {
  const {
    searchTerm,
    setSearchTerm,
    searchResults,
    isSearching,
    selectedResultIndex,
    showResults,
    inputHasFocus,
    searchInputRef: _searchInputRef,
    searchResultsRef,
    handleKeyDown,
    handleInputFocus,
    handleInputBlur,
  } = useProductSearch({ onProductSelect, searchInputRef });

  return (
    <div className="search-section">
      <SearchResults
        results={searchResults}
        showResults={showResults}
        selectedIndex={selectedResultIndex}
        onProductSelect={onProductSelect}
        ref={searchResultsRef}
      />
      
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
        {isSearching ? (
          <div className="search-loading">
            <Search size={20} className="search-icon-loading" />
          </div>
        ) : (
          <Search size={20} className="search-icon" />
        )}
        {hasSaleItems && onClearSale && (
          <button
            onClick={onClearSale}
            className="clear-sale-button"
            title="Vaciar venta"
          >
            <Trash2 size={16} />
            Vaciar
          </button>
        )}
      </div>
    </div>
  );
};
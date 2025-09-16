import { forwardRef } from 'react';
import type { Product } from '../../../types/types';
import './SearchResults.css';

interface SearchResultsProps {
  results: Product[];
  showResults: boolean;
  selectedIndex: number;
  onProductSelect: (product: Product) => void;
}

export const SearchResults = forwardRef<HTMLDivElement, SearchResultsProps>(
  ({ results, showResults, selectedIndex, onProductSelect }, ref) => {
    if (!showResults || results.length === 0) {
      return null;
    }

    return (
      <div className="search-results" ref={ref}>
        {results.map((product, index) => (
          <div
            key={product.productId}
            className={`search-result-item ${index === selectedIndex ? 'selected' : ''}`}
            onClick={() => onProductSelect(product)}
          >
            <div className="product-code">{product.code}</div>
            <div className="product-name">{product.name}</div>
            <div className="product-price">${(product.basePrice / 100).toFixed(2)}</div>
          </div>
        ))}
      </div>
    );
  }
);

SearchResults.displayName = 'SearchResults';
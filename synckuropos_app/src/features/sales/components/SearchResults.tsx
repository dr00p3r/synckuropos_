import { forwardRef, useEffect, useRef } from 'react';
import { Package, Tag, DollarSign } from 'lucide-react';
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
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
    
    // Auto-scroll to selected item
    useEffect(() => {
      if (selectedIndex >= 0 && itemRefs.current[selectedIndex]) {
        itemRefs.current[selectedIndex]?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    }, [selectedIndex]);
    
    if (!showResults || results.length === 0) {
      return null;
    }

    return (
      <div className="search-results" ref={ref}>
        {results.map((product, index) => (
          <div
            key={product.productId}
            ref={(el) => (itemRefs.current[index] = el)}
            className={`search-result-item ${index === selectedIndex ? 'selected' : ''}`}
            onClick={() => onProductSelect(product)}
          >
            <div className="product-icon">
              <Package size={18} strokeWidth={1.5} />
            </div>
            <div className="product-info">
              <div className="product-header">
                <span className="product-name">{product.name}</span>
                {product.code && (
                  <span className="product-code">
                    <Tag size={14} />
                    {product.code}
                  </span>
                )}
              </div>
              <div className="product-footer">
                <span className="product-price">
                  <DollarSign size={14} />
                  {(product.basePrice / 100).toFixed(2)}
                </span>
                <span className="product-stock">Stock: {product.stock}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
);

SearchResults.displayName = 'SearchResults';
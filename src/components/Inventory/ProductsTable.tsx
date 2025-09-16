import React from 'react';
import TableHeader from './TableHeader';
import ProductRow from './ProductRow';
import EmptyState from './EmptyState';
import type { Product } from '../../types/types';
import './ProductsTable.css';

type SortField = 'code' | 'name' | 'basePrice' | 'stock';
type SortDirection = 'asc' | 'desc';

interface ProductsTableProps {
  products: Product[];
  searchTerm: string;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  onEditProduct: (product: Product) => void;
  onToggleProductStatus: (product: Product) => void;
  onCreateProduct: () => void;
}

const ProductsTable: React.FC<ProductsTableProps> = ({
  products,
  searchTerm,
  sortField,
  sortDirection,
  onSort,
  onEditProduct,
  onToggleProductStatus,
  onCreateProduct
}) => {
  if (products.length === 0) {
    return (
      <div className="products-table-container">
        <EmptyState 
          searchTerm={searchTerm}
          onCreateProduct={onCreateProduct}
        />
      </div>
    );
  }

  return (
    <div className="products-table-container">
      <div className="products-table-wrapper">
        <table className="products-table">
          <TableHeader
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={onSort}
          />
          <tbody>
            {products.map((product) => (
              <ProductRow
                key={product.productId}
                product={product}
                onEdit={onEditProduct}
                onToggleStatus={onToggleProductStatus}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductsTable;
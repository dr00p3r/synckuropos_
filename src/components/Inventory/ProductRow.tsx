import React from 'react';
import type { Product } from '../../types/types';
import './ProductRow.css';

interface ProductRowProps {
  product: Product;
  onEdit: (product: Product) => void;
  onToggleStatus: (product: Product) => void;
}

const ProductRow: React.FC<ProductRowProps> = ({
  product,
  onEdit,
  onToggleStatus
}) => {
  // Formatear precio
  const formatPrice = (price: number) => {
    price = price / 100; // Convertir de centavos a dólares
    return `$${price.toFixed(2)}`;
  };

  return (
    <tr 
      className={`product-row ${product.stock === 0 ? 'out-of-stock' : ''} ${product._deleted ? 'inactive' : ''}`}
    >
      <td className="product-code">
        {product.code || '—'}
      </td>
      <td className="product-name">
        {product.name}
        {product._deleted && <span className="inactive-badge">Inactivo</span>}
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
          onClick={() => onEdit(product)}
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
            checked={!product._deleted}
            onChange={() => onToggleStatus(product)}
            className="status-checkbox"
          />
          <span className="status-slider"></span>
        </label>
      </td>
    </tr>
  );
};

export default ProductRow;
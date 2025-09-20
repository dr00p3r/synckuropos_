import React from 'react';
import { useSaleItemsLogic } from '../hooks/useSaleItemsLogic';
import type { SaleItem } from '../../../types/types';
import './SaleItemsTable.css';

interface SaleItemsTableProps {
  saleItems: SaleItem[];
  setSaleItems: React.Dispatch<React.SetStateAction<SaleItem[]>>;
}

export const SaleItemsTable: React.FC<SaleItemsTableProps> = ({ 
  saleItems, 
  setSaleItems 
}) => {
  const {
    editingQuantity,
    editingTotalPrice,
    removeItem,
    handleQuantityChange,
    handleQuantityBlur,
    handleQuantityFocus,
    handleTotalPriceChange,
    handleTotalPriceBlur,
    handleTotalPriceFocus
  } = useSaleItemsLogic({ saleItems, setSaleItems });

  if (saleItems.length === 0) {
    return (
      <div className="sale-items-section">
        <div className="empty-sale">
          <p>No hay productos en la venta actual</p>
          <p className="empty-sale-hint">Busca y agrega productos usando la barra de arriba</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sale-items-section">
      <div className="sale-items-table">
        <div className="table-header">
          <div>Código</div>
          <div>Nombre</div>
          <div>P. Unitario</div>
          <div>Cantidad</div>
          <div>P. Total</div>
          <div>Acción</div>
        </div>
        
        <div className="table-body">
          {saleItems.map((item) => (
            <div key={item.productId} className="table-row">
              <div className="item-code">{item.code}</div>
              <div className="item-name">{item.name}</div>
              <div className="item-unit-price">${(item.unitPrice / 100).toFixed(2)}</div>
              <div className="item-quantity">
                <input
                  type="number"
                  value={editingQuantity[item.productId!] ?? item.quantity}
                  onChange={(e) => handleQuantityChange(item.productId!, e.target.value)}
                  onFocus={() => handleQuantityFocus(item.productId!, item.quantity)}
                  onBlur={(e) => handleQuantityBlur(item.productId!, e.target.value)}
                  min="0.01"
                  step={item.allowDecimalQuantity ? "0.01" : "1"}
                  className="quantity-input"
                />
              </div>
              <div className="item-total-price">
                <input
                  type="number"
                  value={editingTotalPrice[item.productId!] ?? (item.totalPrice / 100).toFixed(2)}
                  onChange={(e) => handleTotalPriceChange(item.productId!, e.target.value)}
                  onFocus={() => handleTotalPriceFocus(item.productId!, item.totalPrice)}
                  onBlur={(e) => handleTotalPriceBlur(item.productId!, e.target.value)}
                  min="0.01"
                  step="0.01"
                  className="total-price-input"
                />
              </div>
              <div className="item-actions">
                <button
                  onClick={() => removeItem(item.productId!)}
                  className="remove-button"
                  aria-label="Eliminar producto"
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
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
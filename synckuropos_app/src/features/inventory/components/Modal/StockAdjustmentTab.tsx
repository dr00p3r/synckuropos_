import React from 'react';
import type { StockAdjustmentTabProps } from './ProductModalTypes';
import { safeParseNumber, isValidNumber, formatMoney } from '@/utils/money';
import './StockAdjustmentTab.css';

export const StockAdjustmentTab: React.FC<StockAdjustmentTabProps> = ({
  currentProduct,
  stockData,
  onStockChange,
  onStockMovement,
  loading
}) => {
  const isValidMovement = isValidNumber(stockData.quantityToMove) &&
                         safeParseNumber(stockData.quantityToMove) !== 0;

  return (
    <div className="stock-form">
      <div className="current-stock-info">
        <div className="stock-info-left">
          <h3>Stock Actual</h3>
          <div className="stock-value">{currentProduct.stock}</div>
          <p>unidades</p>
        </div>
        <div className="stock-info-right">
          <h3>Precio Actual</h3>
          <div className="price-value">{formatMoney(currentProduct.basePrice)}</div>
          <p>por unidad</p>
        </div>
      </div>

      <div className="form-field">
        <label>Cantidad a Mover (+ entrada, - salida) *</label>
        <input
          type="number"
          value={stockData.quantityToMove}
          onChange={e => onStockChange('quantityToMove', e.target.value)}
          placeholder="Ej: 50 (entrada) o -10 (salida)"
          step={currentProduct.allowDecimalQuantity ? "0.01" : "1"}
        />
      </div>

      <div className="form-row">
        <div className="form-field">
          <label>Costo por Unidad</label>
          <input
            type="number"
            value={stockData.costPerUnit}
            onChange={e => onStockChange('costPerUnit', e.target.value)}
            min="0"
            step="0.01"
            placeholder="0.00"
          />
        </div>

        <div className="form-field">
          <label>Nuevo Precio de Venta (Opcional)</label>
          <input
            type="number"
            value={stockData.newSalePrice}
            onChange={e => onStockChange('newSalePrice', e.target.value)}
            min="0"
            step="0.01"
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="form-field">
        <label>Razón del Movimiento</label>
        <select
          value={stockData.reason}
          onChange={e => onStockChange('reason', e.target.value)}
        >
          <option value="Reabastecimiento">Reabastecimiento</option>
          <option value="Venta Manual">Venta Manual</option>
          <option value="Ajuste por Pérdida">Ajuste por Pérdida</option>
          <option value="Devolución">Devolución</option>
          <option value="Inventario Inicial">Inventario Inicial</option>
        </select>
      </div>

      <div className="form-field">
        <button
          className="save-btn"
          onClick={onStockMovement}
          disabled={loading || !isValidMovement}
        >
          {loading ? 'Procesando...' : 'Confirmar Movimiento'}
        </button>
      </div>
    </div>
  );
};
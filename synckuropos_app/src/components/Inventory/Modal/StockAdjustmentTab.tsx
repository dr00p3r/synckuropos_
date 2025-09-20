import React from 'react';
import type { StockAdjustmentTabProps } from './ProductModalTypes';
import './StockAdjustmentTab.css';

export const StockAdjustmentTab: React.FC<StockAdjustmentTabProps> = ({
  currentProduct,
  stockData,
  onStockChange,
  onStockMovement,
  loading
}) => {
  // Función para convertir string a número, manejando valores vacíos
  const parseNumber = (value: string): number => {
    if (value === '' || value === undefined || value === null) return 0;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Función para validar que un campo numérico tenga un valor válido
  const isValidNumber = (value: string): boolean => {
    if (value === '') return false;
    const parsed = parseFloat(value);
    return !isNaN(parsed);
  };

  const isValidMovement = isValidNumber(stockData.quantityToMove) && 
                         parseNumber(stockData.quantityToMove) !== 0;

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
          <div className="price-value">${(currentProduct.basePrice / 100).toFixed(2)}</div>
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
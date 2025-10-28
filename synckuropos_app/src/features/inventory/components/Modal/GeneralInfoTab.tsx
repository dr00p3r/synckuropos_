import React from 'react';
import type { GeneralInfoTabProps } from './ProductModalTypes';
import './GeneralInfoTab.css';

export const GeneralInfoTab: React.FC<GeneralInfoTabProps> = ({
  formData,
  onInputChange,
  onCodeChange,
  onSave,
  loading,
  currentProduct
}) => {
  return (
    <div className="general-form">
      <div className="form-field">
        <label>Código de Barras (Opcional)</label>
        <input
          type="text"
          value={formData.code}
          onChange={e => onCodeChange(e.target.value)}
          placeholder="Ej: PROD001 o código de barras"
        />
      </div>

      <div className="form-field">
        <label>Nombre del Producto *</label>
        <input
          type="text"
          value={formData.name}
          onChange={e => onInputChange('name', e.target.value)}
          placeholder="Ingrese el nombre del producto"
          required
        />
      </div>

      <div className="form-field">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={formData.allowDecimalQuantity}
            onChange={e => onInputChange('allowDecimalQuantity', e.target.checked)}
          />
          <span className="checkbox-text">Permitir Cantidad Decimal</span>
        </label>
      </div>

      <div className="form-field">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={formData.isTaxable}
            onChange={e => onInputChange('isTaxable', e.target.checked)}
          />
          <span className="checkbox-text">Aplica Impuestos</span>
        </label>
      </div>

      <div className="form-field">
        <button
          className="save-btn"
          onClick={onSave}
          disabled={loading || !formData.name.trim()}
        >
          {loading ? 'Guardando...' : currentProduct ? 'Actualizar Información' : 'Crear y Continuar'}
        </button>
      </div>
    </div>
  );
};
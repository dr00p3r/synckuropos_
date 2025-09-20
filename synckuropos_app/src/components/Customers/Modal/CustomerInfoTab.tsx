import React from 'react';
import './CustomerInfoTab.css';

interface CustomerFormData {
  fullname: string;
  phone: string;
  email: string;
  address: string;
  allowCredit: boolean;
  creditLimit: string;
}

interface CustomerInfoTabProps {
  formData: CustomerFormData;
  onInputChange: (field: string, value: any) => void;
  onSave: () => void;
  onCancel: () => void;
  loading: boolean;
}

export const CustomerInfoTab: React.FC<CustomerInfoTabProps> = ({
  formData,
  onInputChange,
  onSave,
  onCancel,
  loading
}) => {
  return (
    <div className="customer-info-tab">
      <h3>Información Personal</h3>
      
      <div className="customer-form-row">
        <div className="customer-form-group">
          <label htmlFor="fullname">
            Nombre Completo <span className="required">*</span>
          </label>
          <input
            type="text"
            id="fullname"
            value={formData.fullname}
            onChange={(e) => onInputChange('fullname', e.target.value)}
            placeholder="Ingrese el nombre completo"
            required
          />
        </div>
      </div>

      <div className="customer-form-row">
        <div className="customer-form-group">
          <label htmlFor="phone">Teléfono</label>
          <input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={(e) => onInputChange('phone', e.target.value)}
            placeholder="Ej: 0999123456"
          />
        </div>
        <div className="customer-form-group">
          <label htmlFor="email">Correo Electrónico</label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => onInputChange('email', e.target.value)}
            placeholder="Ej: cliente@email.com"
          />
        </div>
      </div>

      <div className="customer-form-row">
        <div className="customer-form-group">
          <label htmlFor="address">Dirección</label>
          <textarea
            id="address"
            value={formData.address}
            onChange={(e) => onInputChange('address', e.target.value)}
            placeholder="Dirección completa del cliente"
            rows={3}
          />
        </div>
      </div>

      <h3>Configuración de Crédito</h3>
      
      <div className="customer-form-row">
        <div className="customer-form-group">
          <label className="customer-checkbox-label">
            <input
              type="checkbox"
              checked={formData.allowCredit}
              onChange={(e) => onInputChange('allowCredit', e.target.checked)}
            />
            <span className="customer-checkbox-custom"></span>
            Permitir crédito a este cliente
          </label>
        </div>
      </div>

      {formData.allowCredit && (
        <div className="customer-form-row">
          <div className="customer-form-group">
            <label htmlFor="creditLimit">
              Límite de Crédito <span className="required">*</span>
            </label>
            <div className="customer-currency-input">
              <span className="currency-symbol">$</span>
              <input
                type="number"
                id="creditLimit"
                value={formData.creditLimit}
                onChange={(e) => onInputChange('creditLimit', e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                required={formData.allowCredit}
              />
            </div>
          </div>
        </div>
      )}

      <div className="customer-form-actions">
        <button
          type="button"
          className="customer-btn customer-btn-secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="button"
          className="customer-btn customer-btn-primary"
          onClick={onSave}
          disabled={loading}
        >
          {loading ? '⏳ Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </div>
  );
};

export default CustomerInfoTab;
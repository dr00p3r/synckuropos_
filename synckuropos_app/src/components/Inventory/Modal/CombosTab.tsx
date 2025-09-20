import React from 'react';
import type { CombosTabProps } from './ProductModalTypes';
import './CombosTab.css';

export const CombosTab: React.FC<CombosTabProps> = ({
  currentProduct,
  combos,
  newCombo,
  editingCombo,
  editComboData,
  onNewComboChange,
  onEditComboChange,
  onAddCombo,
  onEditCombo,
  onSaveEditCombo,
  onCancelEditCombo,
  onDeleteCombo
}) => {
  // Función para convertir string a número, manejando valores vacíos
  const parseNumber = (value: string): number => {
    if (value === '' || value === undefined || value === null) return 0;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  const canAddCombo = parseNumber(newCombo.quantity) > 0 && parseNumber(newCombo.price) > 0;
  const canSaveEdit = parseNumber(editComboData.quantity) > 0 && parseNumber(editComboData.price) > 0;

  return (
    <div className="combos-form">
      <div className="combos-list">
        <h3>Combos Configurados</h3>
        {combos.length === 0 ? (
          <div className="no-combos">
            No hay combos configurados para este producto
          </div>
        ) : (
          <div className="combos-table-container">
            <table className="combos-table">
              <thead>
                <tr>
                  <th>Cantidad</th>
                  <th>Precio Combo</th>
                  <th>Precio Normal</th>
                  <th>Ahorro</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {combos.map((combo) => (
                  <tr 
                    key={combo.id}
                    onDoubleClick={() => onEditCombo(combo)}
                    className="combo-row"
                  >
                    <td>
                      {editingCombo === combo.id ? (
                        <input
                          type="number"
                          value={editComboData.quantity}
                          onChange={e => onEditComboChange('quantity', e.target.value)}
                          min="1"
                          step="1"
                          className="edit-input"
                        />
                      ) : (
                        combo.quantity
                      )}
                    </td>
                    <td>
                      {editingCombo === combo.id ? (
                        <input
                          type="number"
                          value={editComboData.price}
                          onChange={e => onEditComboChange('price', e.target.value)}
                          min="0"
                          step="0.01"
                          className="edit-input"
                        />
                      ) : (
                        `$${combo.price.toFixed(2)}`
                      )}
                    </td>
                    <td>${(currentProduct.basePrice / 100 * combo.quantity).toFixed(2)}</td>
                    <td className="savings">
                      ${((currentProduct.basePrice / 100 * combo.quantity) - combo.price).toFixed(2)}
                    </td>
                    <td className="combo-actions">
                      {editingCombo === combo.id ? (
                        <div className="edit-actions">
                          <button
                            className="save-edit-btn"
                            onClick={onSaveEditCombo}
                            disabled={!canSaveEdit}
                          >
                            ✓
                          </button>
                          <button
                            className="cancel-edit-btn"
                            onClick={onCancelEditCombo}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          className="delete-combo-btn"
                          onClick={() => onDeleteCombo(combo.id)}
                          title="Eliminar combo"
                        >
                          🗑️
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="new-combo-form">
        <h3>Agregar Nuevo Combo</h3>
        <div className="form-row">
          <div className="form-field">
            <label>Cantidad</label>
            <input
              type="number"
              value={newCombo.quantity}
              onChange={e => onNewComboChange('quantity', e.target.value)}
              min="1"
              placeholder="Cantidad del combo"
            />
          </div>
          <div className="form-field">
            <label>Precio del Combo</label>
            <input
              type="number"
              value={newCombo.price}
              onChange={e => onNewComboChange('price', e.target.value)}
              min="0"
              step="0.01"
              placeholder="Precio especial"
            />
          </div>
        </div>
        <button
          className="create-combo-btn"
          onClick={onAddCombo}
          disabled={!canAddCombo}
        >
          Agregar Combo
        </button>
      </div>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import type { Product } from '../../types/types';
import { useDatabase } from '../../hooks/useDatabase.tsx';
import { useToast } from '../../hooks/useToast';
import { v4 as uuidv4 } from 'uuid';
import './ProductModal.css';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  product?: Product;
  mode: 'create' | 'edit';
}

type TabType = 'general' | 'stock' | 'combos';

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  product,
  mode
}) => {
  const db = useDatabase();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);

  // Estados del formulario - Información General
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    allowDecimalQuantity: false,
    isTaxable: true,
    isActive: true
  });

  // Estados del formulario - Ajuste de Stock
  const [stockData, setStockData] = useState({
    quantityToMove: '',
    costPerUnit: '',
    newSalePrice: '',
    reason: 'Reabastecimiento'
  });

  // Estados del formulario - Combos
  const [combos, setCombos] = useState<Array<{id: string, quantity: number, price: number}>>([]);
  const [newCombo, setNewCombo] = useState({
    quantity: '',
    price: ''
  });
  const [editingCombo, setEditingCombo] = useState<string | null>(null);
  const [editComboData, setEditComboData] = useState({
    quantity: '',
    price: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && product) {
        setCurrentProduct(product);
        setFormData({
          code: product.code || '',
          name: product.name,
          allowDecimalQuantity: product.allowDecimalQuantity,
          isTaxable: product.isTaxable,
          isActive: product.isActive
        });
        setActiveTab('stock'); // En edición se abre por defecto en Stock
        loadCombos(product.productId);
      } else {
        setCurrentProduct(null);
        resetForm();
        setActiveTab('general'); // En creación se abre en General
      }
    }
  }, [isOpen, product, mode]);

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      allowDecimalQuantity: false,
      isTaxable: true,
      isActive: true
    });
    setStockData({
      quantityToMove: '',
      costPerUnit: '',
      newSalePrice: '',
      reason: 'Reabastecimiento'
    });
    setCombos([]);
    setNewCombo({ quantity: '', price: '' });
    setEditingCombo(null);
    setEditComboData({ quantity: '', price: '' });
  };

  const loadCombos = async (productId: string) => {
    try {
      const comboData = await db.comboProducts.find({
        selector: { productId }
      }).exec();
      
      const combosFormatted = comboData.map((doc: any) => ({
        id: doc.comboProductId,
        quantity: doc.comboQuantity,
        price: doc.comboPrice / 100 // Convertir de centavos a dólares
      }));
      
      setCombos(combosFormatted);
    } catch (error) {
      console.error('Error loading combos:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStockChange = (field: string, value: any) => {
    setStockData(prev => ({
      ...prev,
      [field]: value
    }));
  };

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

  // Verificar si el código ya existe
  const checkExistingCode = async (code: string) => {
    if (!code.trim()) return null;
    
    try {
      const existingProduct = await db.products.findOne({
        selector: { code: code.trim() }
      }).exec();
      
      return existingProduct ? existingProduct.toJSON() : null;
    } catch (error) {
      console.error('Error checking existing code:', error);
      return null;
    }
  };

  const handleCodeChange = async (newCode: string) => {
    handleInputChange('code', newCode);
    
    if (mode === 'create' && newCode.trim()) {
      const existingProduct = await checkExistingCode(newCode);
      if (existingProduct) {
        setCurrentProduct(existingProduct);
        setFormData({
          code: existingProduct.code || '',
          name: existingProduct.name,
          allowDecimalQuantity: existingProduct.allowDecimalQuantity,
          isTaxable: existingProduct.isTaxable,
          isActive: existingProduct.isActive
        });
        setActiveTab('stock');
        await loadCombos(existingProduct.productId);
        toast.showInfo('Producto existente encontrado. Cambiando a modo edición.');
      }
    }
  };

  const handleSaveGeneral = async () => {
    if (!db) return;
    
    if (!formData.name.trim()) {
      toast.showError('El nombre del producto es requerido');
      return;
    }

    setLoading(true);
    
    try {
      const newProduct: Product = {
        productId: uuidv4(),
        code: formData.code || undefined,
        name: formData.name,
        stock: 0,
        basePrice: 0,
        isTaxable: formData.isTaxable,
        allowDecimalQuantity: formData.allowDecimalQuantity,
        isActive: formData.isActive,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.products.insert(newProduct);
      setCurrentProduct(newProduct);
      toast.showSuccess('Producto creado exitosamente');
      
      // Cambiar a la pestaña de ajuste de stock
      setActiveTab('stock');
    } catch (error) {
      console.error('Error saving product:', error);
      toast.showError('Error al guardar el producto');
    } finally {
      setLoading(false);
    }
  };

  const handleStockMovement = async () => {
    if (!currentProduct || !db) return;
    
    const quantityToMove = parseNumber(stockData.quantityToMove);
    const costPerUnit = parseNumber(stockData.costPerUnit);
    const newSalePrice = parseNumber(stockData.newSalePrice);
    
    if (quantityToMove === 0) {
      toast.showError('La cantidad a mover debe ser diferente de 0');
      return;
    }

    setLoading(true);
    
    try {
      // 1. Crear registro en supplying
      const supplyingRecord = {
        supplyingId: uuidv4(),
        supplierName: '', // Campo opcional
        productId: currentProduct.productId,
        quantity: quantityToMove,
        unitCost: Math.round(costPerUnit * 100), // Convertir a centavos
        reason: stockData.reason,
        supplyDate: new Date().toISOString(),
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.supplyings.insert(supplyingRecord);

      // 2. Actualizar stock del producto
      const productDoc = await db.products.findOne({
        selector: { productId: currentProduct.productId }
      }).exec();

      if (productDoc) {
        const newStock = Math.max(0, currentProduct.stock + quantityToMove);
        const updateData: any = {
          stock: newStock,
          updatedAt: new Date().toISOString()
        };

        // 3. Actualizar precio si se especificó uno nuevo
        if (newSalePrice > 0) {
          updateData.basePrice = newSalePrice;
        }

        await productDoc.update({ $set: updateData });
        
        toast.showSuccess(
          `Movimiento registrado exitosamente. ${quantityToMove > 0 ? 'Entrada' : 'Salida'}: ${Math.abs(quantityToMove)} unidades`
        );
        
        // Notificar que se guardó y cerrar modal
        if (onSave) {
          onSave();
        }
        onClose();
      }
    } catch (error) {
      console.error('Error processing stock movement:', error);
      toast.showError('Error al procesar el movimiento de stock');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCombo = async () => {
    if (!currentProduct || !db) return;
    
    const quantity = parseNumber(newCombo.quantity);
    const price = parseNumber(newCombo.price);
    
    if (quantity <= 0 || price <= 0) {
      toast.showError('La cantidad y el precio deben ser mayores a 0');
      return;
    }

    try {
      const comboRecord = {
        comboProductId: uuidv4(),
        productId: currentProduct.productId,
        comboQuantity: quantity,
        comboPrice: Math.round(price * 100), // Convertir a centavos
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.comboProducts.insert(comboRecord);
      
      setCombos(prev => [...prev, {
        id: comboRecord.comboProductId,
        quantity: comboRecord.comboQuantity,
        price: comboRecord.comboPrice / 100 // Convertir de vuelta a dólares para mostrar
      }]);
      
      setNewCombo({ quantity: '', price: '' });
      toast.showSuccess('Combo agregado exitosamente');
    } catch (error) {
      console.error('Error adding combo:', error);
      toast.showError('Error al agregar el combo');
    }
  };

  const handleDeleteCombo = async (comboId: string) => {
    if (!db) return;
    
    try {
      const comboDoc = await db.comboProducts.findOne({
        selector: { comboProductId: comboId }
      }).exec();
      
      if (comboDoc) {
        await comboDoc.remove();
        setCombos(prev => prev.filter(combo => combo.id !== comboId));
        toast.showSuccess('Combo eliminado exitosamente');
      }
    } catch (error) {
      console.error('Error deleting combo:', error);
      toast.showError('Error al eliminar el combo');
    }
  };

  const handleEditCombo = (combo: {id: string, quantity: number, price: number}) => {
    setEditingCombo(combo.id);
    setEditComboData({
      quantity: combo.quantity.toString(),
      price: combo.price.toString()
    });
  };

  const handleSaveEditCombo = async () => {
    if (!db || !editingCombo) return;
    
    const quantity = parseNumber(editComboData.quantity);
    const price = parseNumber(editComboData.price);
    
    if (quantity <= 0 || price <= 0) {
      toast.showError('La cantidad y el precio deben ser mayores a 0');
      return;
    }

    try {
      const comboDoc = await db.comboProducts.findOne({
        selector: { comboProductId: editingCombo }
      }).exec();
      
      if (comboDoc) {
        await comboDoc.update({
          $set: {
            comboQuantity: quantity,
            comboPrice: Math.round(price * 100),
            updatedAt: new Date().toISOString()
          }
        });
        
        setCombos(prev => prev.map(combo => 
          combo.id === editingCombo 
            ? { ...combo, quantity: quantity, price: price }
            : combo
        ));
        
        setEditingCombo(null);
        setEditComboData({ quantity: '', price: '' });
        toast.showSuccess('Combo actualizado exitosamente');
      }
    } catch (error) {
      console.error('Error updating combo:', error);
      toast.showError('Error al actualizar el combo');
    }
  };

  const handleCancelEditCombo = () => {
    setEditingCombo(null);
    setEditComboData({ quantity: '', price: '' });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {mode === 'create' && !currentProduct ? 'Crear Producto' : 'Gestionar Producto'}
            {currentProduct && activeTab !== 'general' && (
              <span className="product-subtitle">
                {currentProduct.name} {currentProduct.code && `(${currentProduct.code})`}
              </span>
            )}
          </h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Tabs Navigation */}
        <div className="modal-tabs">
          <button 
            className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            Información General
          </button>
          <button 
            className={`tab-btn ${activeTab === 'stock' ? 'active' : ''}`}
            onClick={() => setActiveTab('stock')}
            disabled={!currentProduct}
          >
            Ajuste de Stock
          </button>
          <button 
            className={`tab-btn ${activeTab === 'combos' ? 'active' : ''}`}
            onClick={() => setActiveTab('combos')}
            disabled={!currentProduct}
          >
            Combos del Producto
          </button>
        </div>

        <div className="modal-body">
          {/* Pestaña: Información General */}
          {activeTab === 'general' && (
            <div className="general-form">
              <div className="form-field">
                <label>Código de Barras (Opcional)</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={e => handleCodeChange(e.target.value)}
                  placeholder="Ej: PROD001 o código de barras"
                />
              </div>

              <div className="form-field">
                <label>Nombre del Producto *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => handleInputChange('name', e.target.value)}
                  placeholder="Ingrese el nombre del producto"
                  required
                />
              </div>

              <div className="form-field">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.allowDecimalQuantity}
                    onChange={e => handleInputChange('allowDecimalQuantity', e.target.checked)}
                  />
                  <span className="checkbox-text">Permitir Cantidad Decimal</span>
                </label>
              </div>

              <div className="form-field">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isTaxable}
                    onChange={e => handleInputChange('isTaxable', e.target.checked)}
                  />
                  <span className="checkbox-text">Aplica Impuestos</span>
                </label>
              </div>

              <div className="form-field">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={e => handleInputChange('isActive', e.target.checked)}
                  />
                  <span className="checkbox-text">Producto Activo</span>
                </label>
              </div>
            </div>
          )}

          {/* Pestaña: Ajuste de Stock */}
          {activeTab === 'stock' && currentProduct && (
            <div className="stock-form">
              <div className="current-stock-info">
                <div className="stock-info-left">
                  <h3>Stock Actual</h3>
                  <div className="stock-value">{currentProduct.stock}</div>
                  <p>unidades</p>
                </div>
                <div className="stock-info-right">
                  <h3>Precio Actual</h3>
                  <div className="price-value">${currentProduct.basePrice.toFixed(2)}</div>
                  <p>por unidad</p>
                </div>
              </div>

              <div className="form-field">
                <label>Cantidad a Mover (+ entrada, - salida) *</label>
                <input
                  type="number"
                  value={stockData.quantityToMove}
                  onChange={e => handleStockChange('quantityToMove', e.target.value)}
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
                    onChange={e => handleStockChange('costPerUnit', e.target.value)}
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
                    onChange={e => handleStockChange('newSalePrice', e.target.value)}
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
                  onChange={e => handleStockChange('reason', e.target.value)}
                >
                  <option value="Reabastecimiento">Reabastecimiento</option>
                  <option value="Venta Manual">Venta Manual</option>
                  <option value="Ajuste por Pérdida">Ajuste por Pérdida</option>
                  <option value="Devolución">Devolución</option>
                  <option value="Inventario Inicial">Inventario Inicial</option>
                </select>
              </div>
            </div>
          )}

          {/* Pestaña: Combos del Producto */}
          {activeTab === 'combos' && currentProduct && (
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
                            onDoubleClick={() => handleEditCombo(combo)}
                            className="combo-row"
                          >
                            <td>
                              {editingCombo === combo.id ? (
                                <input
                                  type="number"
                                  value={editComboData.quantity}
                                  onChange={e => setEditComboData(prev => ({ ...prev, quantity: e.target.value }))}
                                  min="1"
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
                                  onChange={e => setEditComboData(prev => ({ ...prev, price: e.target.value }))}
                                  min="0"
                                  step="0.01"
                                  className="edit-input"
                                />
                              ) : (
                                `$${combo.price.toFixed(2)}`
                              )}
                            </td>
                            <td>${(currentProduct.basePrice * combo.quantity).toFixed(2)}</td>
                            <td className="savings">
                              ${((currentProduct.basePrice * combo.quantity) - combo.price).toFixed(2)}
                            </td>
                            <td className="combo-actions">
                              {editingCombo === combo.id ? (
                                <div className="edit-actions">
                                  <button
                                    className="save-edit-btn"
                                    onClick={handleSaveEditCombo}
                                    disabled={parseNumber(editComboData.quantity) <= 0 || parseNumber(editComboData.price) <= 0}
                                  >
                                    ✓
                                  </button>
                                  <button
                                    className="cancel-edit-btn"
                                    onClick={handleCancelEditCombo}
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <button
                                  className="delete-combo-btn"
                                  onClick={() => handleDeleteCombo(combo.id)}
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
                      onChange={e => setNewCombo(prev => ({ ...prev, quantity: e.target.value }))}
                      min="1"
                      placeholder="Cantidad del combo"
                    />
                  </div>
                  <div className="form-field">
                    <label>Precio del Combo</label>
                    <input
                      type="number"
                      value={newCombo.price}
                      onChange={e => setNewCombo(prev => ({ ...prev, price: e.target.value }))}
                      min="0"
                      step="0.01"
                      placeholder="Precio especial"
                    />
                  </div>
                </div>
                <button
                  className="create-combo-btn"
                  onClick={handleAddCombo}
                  disabled={parseNumber(newCombo.quantity) <= 0 || parseNumber(newCombo.price) <= 0}
                >
                  Agregar Combo
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>
            Cancelar
          </button>
          
          {activeTab === 'general' && (
            <button
              className="save-btn"
              onClick={handleSaveGeneral}
              disabled={loading || !formData.name.trim()}
            >
              {loading ? 'Guardando...' : currentProduct ? 'Actualizar Información' : 'Crear y Continuar'}
            </button>
          )}

          {activeTab === 'stock' && currentProduct && (
            <button
              className="save-btn"
              onClick={handleStockMovement}
              disabled={loading || !isValidNumber(stockData.quantityToMove) || parseNumber(stockData.quantityToMove) === 0}
            >
              {loading ? 'Procesando...' : 'Confirmar Movimiento'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

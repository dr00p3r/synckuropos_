import React, { useState, useEffect } from 'react';
import type { Product } from '../../types/types';
import { useDatabase } from '../../hooks/useDatabase.tsx';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth.tsx';
import { v4 as uuidv4 } from 'uuid';
import './ProductModal.css';

// Componentes refactorizados
import { TabNavigation } from './Modal/TabNavigation';
import { GeneralInfoTab } from './Modal/GeneralInfoTab';
import { StockAdjustmentTab } from './Modal/StockAdjustmentTab';
import { CombosTab } from './Modal/CombosTab';

// Tipos refactorizados
import type { 
  ProductModalProps,
  TabType,
  GeneralFormData,
  StockFormData,
  ComboData,
  NewComboForm,
  EditComboForm
} from './Modal/ProductModalTypes';

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  product,
  mode
}) => {
  // Hooks y estados
  const { currentUser } = useAuth();
  const db = useDatabase();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);



  // Estados del formulario - Información General
  const [formData, setFormData] = useState<GeneralFormData>({
    code: '',
    name: '',
    allowDecimalQuantity: false,
    isTaxable: true,
  });

  // Estados del formulario - Ajuste de Stock
  const [stockData, setStockData] = useState<StockFormData>({
    quantityToMove: '',
    costPerUnit: '',
    newSalePrice: '',
    reason: 'Reabastecimiento'
  });

  // Estados del formulario - Combos
  const [combos, setCombos] = useState<ComboData[]>([]);
  const [newCombo, setNewCombo] = useState<NewComboForm>({
    quantity: '',
    price: ''
  });
  const [editingCombo, setEditingCombo] = useState<string | null>(null);
  const [editComboData, setEditComboData] = useState<EditComboForm>({
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
        price: doc.comboPrice / 100
      }));
      
      setCombos(combosFormatted);
    } catch (error) {
      console.error('Error loading combos:', error);
    }
  };

  // Handlers para GeneralInfoTab
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handlers para StockAdjustmentTab
  const handleStockChange = (field: string, value: any) => {
    setStockData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handlers para CombosTab
  const handleNewComboChange = (field: string, value: string) => {
    setNewCombo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditComboChange = (field: string, value: string) => {
    setEditComboData(prev => ({
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
        isActive: true,
        _deleted: false,
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
        userId: currentUser?.userId || 'unknown',
        productId: currentProduct.productId,
        quantity: quantityToMove,
        unitCost: Math.round(costPerUnit * 100), // Convertir a centavos
        reason: stockData.reason,
        supplyDate: new Date().toISOString(),
        isActive: true,
        _deleted: false,
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
          updateData.basePrice = Math.round(newSalePrice * 100);
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
        _deleted: false,
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

  const handleEditCombo = (combo: ComboData) => {
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
        <TabNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          hasProduct={!!currentProduct}
        />

        <div className="modal-body">
          {/* Pestaña: Información General */}
          {activeTab === 'general' && (
            <GeneralInfoTab
              formData={formData}
              onInputChange={handleInputChange}
              onCodeChange={handleCodeChange}
              onSave={handleSaveGeneral}
              loading={loading}
              currentProduct={currentProduct}
            />
          )}

          {/* Pestaña: Ajuste de Stock */}
          {activeTab === 'stock' && currentProduct && (
            <StockAdjustmentTab
              currentProduct={currentProduct}
              stockData={stockData}
              onStockChange={handleStockChange}
              onStockMovement={handleStockMovement}
              loading={loading}
            />
          )}

          {/* Pestaña: Combos del Producto */}
          {activeTab === 'combos' && currentProduct && (
            <CombosTab
              currentProduct={currentProduct}
              combos={combos}
              newCombo={newCombo}
              editingCombo={editingCombo}
              editComboData={editComboData}
              onNewComboChange={handleNewComboChange}
              onEditComboChange={handleEditComboChange}
              onAddCombo={handleAddCombo}
              onEditCombo={handleEditCombo}
              onSaveEditCombo={handleSaveEditCombo}
              onCancelEditCombo={handleCancelEditCombo}
              onDeleteCombo={handleDeleteCombo}
            />
          )}
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

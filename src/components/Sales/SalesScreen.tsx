import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDatabase } from '../../hooks/useDatabase.tsx';
import { useToast } from '../../hooks/useToast';
import type { Product, SaleItem, SaleSummary } from '../../types/types';
import './SalesScreen.css';

const SalesScreen: React.FC = () => {
  // Estados principales
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Refs y hooks
  const searchInputRef = useRef<HTMLInputElement>(null);
  const lastKeystrokeTimeRef = useRef<number>(0);
  const keystrokeTimesRef = useRef<number[]>([]);
  const db = useDatabase();
  const toast = useToast();

  // Constants
  const TAX_RATE = 0.15; // 15% IVA
  const BARCODE_KEYSTROKE_THRESHOLD = 50; // milisegundos
  const BARCODE_MIN_KEYSTROKES = 3;

  // Auto-focus en el input al cargar el componente
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Función para buscar productos
  const searchProducts = useCallback(async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await db.collections.products
        .find({
          selector: {
            $and: [
              { isActive: true },
              {
                $or: [
                  { code: { $regex: term, $options: 'i' } },
                  { name: { $regex: term, $options: 'i' } }
                ]
              }
            ]
          },
          limit: 10
        })
        .exec();

      setSearchResults(results);
    } catch (error) {
      console.error('Error buscando productos:', error);
      toast.showError('Error al buscar productos');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [db, toast]);

  // Debounce para la búsqueda
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchProducts(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchProducts]);

  // Detectar entrada de código de barras
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const currentTime = Date.now();
    
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddFirstProduct();
      return;
    }

    // Registro de tiempos de tecleo para detectar barcode scanner
    keystrokeTimesRef.current.push(currentTime);
    
    // Mantener solo los últimos keystrokes relevantes
    if (keystrokeTimesRef.current.length > 20) {
      keystrokeTimesRef.current.shift();
    }

    lastKeystrokeTimeRef.current = currentTime;
  };

  // Detectar pausa después de entrada rápida (barcode scanner)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const keystrokeTimes = keystrokeTimesRef.current;
      
      if (keystrokeTimes.length >= BARCODE_MIN_KEYSTROKES) {
        // Calcular intervalos entre keystrokes
        const intervals = [];
        for (let i = 1; i < keystrokeTimes.length; i++) {
          intervals.push(keystrokeTimes[i] - keystrokeTimes[i - 1]);
        }
        
        // Verificar si la mayoría de intervalos son muy cortos (barcode scanner)
        const fastIntervals = intervals.filter(interval => interval < BARCODE_KEYSTROKE_THRESHOLD);
        const fastRatio = fastIntervals.length / intervals.length;
        
        if (fastRatio > 0.7 && searchTerm.trim()) {
          // Detectado input de barcode scanner
          handleAddFirstProduct();
        }
      }
      
      // Limpiar registro de keystrokes
      keystrokeTimesRef.current = [];
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Agregar el primer producto de la lista de resultados
  const handleAddFirstProduct = () => {
    if (searchResults.length > 0) {
      addProductToSale(searchResults[0]);
    } else if (searchTerm.trim()) {
      toast.showWarning('No se encontró ningún producto con ese código');
    }
  };

  // Agregar producto a la venta
  const addProductToSale = (product: Product) => {
    setSaleItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item.productId === product.productId);
      
      if (existingItemIndex >= 0) {
        // Producto ya existe, incrementar cantidad
        const updatedItems = [...prevItems];
        const existingItem = updatedItems[existingItemIndex];
        const newQuantity = existingItem.quantity + 1;
        
        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity,
          totalPrice: newQuantity * existingItem.unitPrice
        };
        
        return updatedItems;
      } else {
        // Nuevo producto
        const newItem: SaleItem = {
          productId: product.productId,
          code: product.code || '',
          name: product.name,
          unitPrice: product.basePrice,
          quantity: 1,
          totalPrice: product.basePrice,
          allowDecimalQuantity: product.allowDecimalQuantity
        };
        
        return [...prevItems, newItem];
      }
    });

    // Limpiar y re-enfocar el campo de búsqueda
    setSearchTerm('');
    setSearchResults([]);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
    
    toast.showSuccess(`Producto "${product.name}" agregado a la venta`);
  };

  // Actualizar cantidad de un item
  const updateItemQuantity = (productId: string, newQuantity: number) => {
    setSaleItems(prevItems => {
      return prevItems.map(item => {
        if (item.productId === productId) {
          let finalQuantity = newQuantity;
          
          // Validar cantidad decimal
          if (!item.allowDecimalQuantity && newQuantity % 1 !== 0) {
            finalQuantity = Math.floor(newQuantity);
            toast.showWarning('Este producto no permite cantidades decimales');
          }
          
          if (finalQuantity <= 0) {
            return item; // No permitir cantidades negativas o cero
          }
          
          return {
            ...item,
            quantity: finalQuantity,
            totalPrice: finalQuantity * item.unitPrice
          };
        }
        return item;
      });
    });
  };

  // Actualizar precio total de un item
  const updateItemTotalPrice = (productId: string, newTotalPrice: number) => {
    setSaleItems(prevItems => {
      return prevItems.map(item => {
        if (item.productId === productId) {
          if (newTotalPrice <= 0) {
            return item; // No permitir precios negativos o cero
          }
          
          let newQuantity = newTotalPrice / item.unitPrice;
          
          // Validar cantidad decimal
          if (!item.allowDecimalQuantity && newQuantity % 1 !== 0) {
            newQuantity = Math.floor(newQuantity);
            toast.showWarning('Este producto no permite cantidades decimales');
          }
          
          return {
            ...item,
            quantity: newQuantity,
            totalPrice: newQuantity * item.unitPrice
          };
        }
        return item;
      });
    });
  };

  // Eliminar item de la venta
  const removeItem = (productId: string) => {
    setSaleItems(prevItems => prevItems.filter(item => item.productId !== productId));
    toast.showInfo('Producto eliminado de la venta');
  };

  // Calcular resumen de la venta
  const calculateSummary = (): SaleSummary => {
    const subtotal = saleItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;
    
    return { subtotal, tax, total };
  };

  const summary = calculateSummary();

  // Manejar completar pago
  const handleCompleteSale = () => {
    if (saleItems.length === 0) {
      toast.showWarning('No hay productos en la venta');
      return;
    }
    
    // Aquí iría la lógica para procesar el pago
    // Por ahora solo mostramos un mensaje
    toast.showSuccess(`Venta completada por $${summary.total.toFixed(2)}`);
    
    // Limpiar la venta
    setSaleItems([]);
    setSearchTerm('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  return (
    <div className="sales-screen">
      {/* Header */}
      <div className="sales-header">
        <h1>Venta</h1>
      </div>

      {/* Barra de búsqueda */}
      <div className="search-section">
        <div className="search-input-container">
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar producto por código o nombre..."
            className="search-input"
          />
          {isSearching && <div className="search-loading">🔍</div>}
        </div>

        {/* Resultados de búsqueda */}
        {searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.map((product, index) => (
              <div
                key={product.productId}
                className={`search-result-item ${index === 0 ? 'first-result' : ''}`}
                onClick={() => addProductToSale(product)}
              >
                <div className="product-code">{product.code}</div>
                <div className="product-name">{product.name}</div>
                <div className="product-price">${product.basePrice.toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lista de items en la venta */}
      <div className="sale-items-section">
        {saleItems.length === 0 ? (
          <div className="empty-sale">
            <p>No hay productos en la venta actual</p>
            <p className="empty-sale-hint">Busca y agrega productos usando la barra de arriba</p>
          </div>
        ) : (
          <div className="sale-items-table">
            <div className="table-header">
              <div>Código</div>
              <div>Nombre</div>
              <div>P. Unitario</div>
              <div>Cantidad</div>
              <div>P. Total</div>
              <div>Acción</div>
            </div>
            
            {saleItems.map((item) => (
              <div key={item.productId} className="table-row">
                <div className="item-code">{item.code}</div>
                <div className="item-name">{item.name}</div>
                <div className="item-unit-price">${item.unitPrice.toFixed(2)}</div>
                <div className="item-quantity">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItemQuantity(item.productId, parseFloat(e.target.value) || 0)}
                    min="0.01"
                    step={item.allowDecimalQuantity ? "0.01" : "1"}
                    className="quantity-input"
                  />
                </div>
                <div className="item-total-price">
                  <input
                    type="number"
                    value={item.totalPrice.toFixed(2)}
                    onChange={(e) => updateItemTotalPrice(item.productId, parseFloat(e.target.value) || 0)}
                    min="0.01"
                    step="0.01"
                    className="total-price-input"
                  />
                </div>
                <div className="item-actions">
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="remove-button"
                    aria-label="Eliminar producto"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resumen y total */}
      {saleItems.length > 0 && (
        <div className="sale-summary">
          <div className="summary-row">
            <span>Subtotal:</span>
            <span>${summary.subtotal.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>IVA (15%):</span>
            <span>${summary.tax.toFixed(2)}</span>
          </div>
          <div className="summary-row total-row">
            <span>TOTAL:</span>
            <span>${summary.total.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Botón de pago */}
      {saleItems.length > 0 && (
        <button 
          className="complete-sale-button"
          onClick={handleCompleteSale}
        >
          <div className="button-top">Completar Pago</div>
          <div className="button-bottom">${summary.total.toFixed(2)}</div>
        </button>
      )}
    </div>
  );
};

export default SalesScreen;

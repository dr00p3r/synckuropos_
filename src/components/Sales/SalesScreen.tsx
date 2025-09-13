import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDatabase } from '../../hooks/useDatabase.tsx';
import { useToast } from '../../hooks/useToast';
import { v4 as uuidv4 } from 'uuid';
import type { Product, SaleItem, SaleSummary, Customer, Sale, SaleDetail, Debt, DebtPayment } from '../../types/types';
import './SalesScreen.css';

interface SalesScreenProps {
  saleItems: SaleItem[];
  setSaleItems: React.Dispatch<React.SetStateAction<SaleItem[]>>;
  onClearSale: () => void;
}

const SalesScreen: React.FC<SalesScreenProps> = ({ saleItems, setSaleItems, onClearSale }) => {
  // Estados principales
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);
  const [lastSearchTerm, setLastSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [inputHasFocus, setInputHasFocus] = useState(false);
  
  // Estados temporales para edición de inputs
  const [editingQuantity, setEditingQuantity] = useState<{[key: string]: string}>({});
  const [editingTotalPrice, setEditingTotalPrice] = useState<{[key: string]: string}>({});
  
  // Estados para el proceso de pago
  const [showPaymentView, setShowPaymentView] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [receivedAmount, setReceivedAmount] = useState<string>('');
  const [isCredit, setIsCredit] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  
  // Refs y hooks
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const lastKeystrokeTimeRef = useRef<number>(0);
  const keystrokeTimesRef = useRef<number[]>([]);
  const isShowingDecimalWarningRef = useRef<boolean>(false);
  const isBarcodeScanning = useRef<boolean>(false);
  const db = useDatabase();
  const toast = useToast();

  // Constants
  const TAX_RATE = 0.15; // 15% IVA
  const BARCODE_KEYSTROKE_THRESHOLD = 50; // milisegundos
  const BARCODE_MIN_KEYSTROKES = 3;
  const DECIMAL_WARNING_COOLDOWN = 1000; // 1 segundo de cooldown para warnings de decimales
  const BARCODE_BLOCK_DURATION = 500; // 500ms para bloquear Enter después de detectar barcode

  // Función helper para mostrar warning de decimales con cooldown
  const showDecimalWarning = () => {
    if (!isShowingDecimalWarningRef.current) {
      isShowingDecimalWarningRef.current = true;
      toast.showWarning('Este producto no permite cantidades decimales');
      
      // Resetear la bandera después de un breve período
      setTimeout(() => {
        isShowingDecimalWarningRef.current = false;
      }, DECIMAL_WARNING_COOLDOWN);
    }
  };

  // Auto-focus en el input al cargar el componente
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
      setInputHasFocus(true);
    }
  }, []);

  // Manejar clicks fuera del área de búsqueda
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Verificar si el click fue fuera del input de búsqueda y de los resultados
      if (
        searchInputRef.current && 
        !searchInputRef.current.contains(target) &&
        searchResultsRef.current && 
        !searchResultsRef.current.contains(target)
      ) {
        setShowResults(false);
        setInputHasFocus(false);
      }
    };

    // Agregar event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Función para buscar productos
  const searchProducts = useCallback(async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      setSelectedResultIndex(0);
      setLastSearchTerm('');
      setShowResults(false);
      return;
    }

    // Resetear índice si el término de búsqueda cambió
    if (term !== lastSearchTerm) {
      setSelectedResultIndex(0);
      setLastSearchTerm(term);
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
      // Siempre mostrar resultados cuando se encuentren, el control se hace en el render
      setShowResults(true);
    } catch (error) {
      console.error('Error buscando productos:', error);
      toast.showError('Error al buscar productos');
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setIsSearching(false);
    }
  }, [db, toast, lastSearchTerm]);

  // Debounce para la búsqueda
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchProducts(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchProducts]);

  // Cargar clientes al montar el componente
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const allCustomers = await db.customers.find({
          selector: { isActive: true }
        }).exec();
        
        const customersData = allCustomers.map((doc: any) => doc.toJSON());
        setCustomers(customersData);
      } catch (error) {
        console.error('Error cargando clientes:', error);
      }
    };

    loadCustomers();
  }, [db]);

  // Manejar focus del input
  const handleInputFocus = () => {
    setInputHasFocus(true);
    if (searchResults.length > 0 && searchTerm.trim()) {
      setShowResults(true);
    }
  };

  // Manejar blur del input
  const handleInputBlur = () => {
    // No cambiar inputHasFocus aquí porque el click outside lo maneja
  };

  // Detectar entrada de código de barras
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const currentTime = Date.now();
    
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // Si estamos en proceso de escaneo de código de barras, ignorar el Enter
      if (isBarcodeScanning.current) {
        console.log('Enter bloqueado - detectado barcode scanning');
        return;
      }
      
      // Verificación adicional: si el último keystroke fue muy reciente (posible barcode scanner)
      const timeSinceLastKeystroke = currentTime - lastKeystrokeTimeRef.current;
      if (timeSinceLastKeystroke < 100 && searchTerm.length > 3) {
        console.log('Enter bloqueado - keystroke muy reciente, posible barcode scanner');
        // Marcar como escaneando temporalmente
        isBarcodeScanning.current = true;
        setTimeout(() => {
          isBarcodeScanning.current = false;
        }, BARCODE_BLOCK_DURATION);
        return;
      }
      
      handleAddSelectedProduct();
      return;
    }

    // Navegación con flechas
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (searchResults.length > 0) {
        setSelectedResultIndex(prev => Math.min(prev + 1, searchResults.length - 1));
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (searchResults.length > 0) {
        setSelectedResultIndex(prev => Math.max(prev - 1, 0));
      }
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
          // Detectado input de barcode scanner - marcar como escaneando
          isBarcodeScanning.current = true;
          
          // Buscar y agregar producto directamente
          handleBarcodeScanned(searchTerm.trim());
          
          // Limpiar la bandera después de un período más largo para asegurar que se bloquee el Enter
          setTimeout(() => {
            isBarcodeScanning.current = false;
          }, BARCODE_BLOCK_DURATION);
        }
      }
      
      // Limpiar registro de keystrokes
      keystrokeTimesRef.current = [];
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Manejar código de barras escaneado - buscar y agregar producto directamente
  const handleBarcodeScanned = async (barcode: string) => {
    try {
      // Realizar búsqueda directa con el código escaneado
      const results = await db.collections.products
        .find({
          selector: {
            $and: [
              { isActive: true },
              {
                $or: [
                  { code: { $regex: `^${barcode}$`, $options: 'i' } }, // Búsqueda exacta primero
                  { code: { $regex: barcode, $options: 'i' } },
                  { name: { $regex: barcode, $options: 'i' } }
                ]
              }
            ]
          },
          limit: 10
        })
        .exec();

      if (results.length > 0) {
        // Agregar el primer producto encontrado
        addProductToSale(results[0]);
      } else {
        toast.showWarning('No se encontró ningún producto con ese código');
      }
    } catch (error) {
      console.error('Error buscando producto por código de barras:', error);
      toast.showError('Error al buscar producto');
    }
  };

  // Agregar el producto seleccionado de la lista de resultados
  const handleAddSelectedProduct = () => {
    if (searchResults.length > 0 && selectedResultIndex >= 0 && selectedResultIndex < searchResults.length) {
      addProductToSale(searchResults[selectedResultIndex]);
    } else if (searchResults.length > 0) {
      // Fallback: agregar el primer producto si el índice está fuera de rango
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
    setShowResults(false);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
      setInputHasFocus(true);
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
            showDecimalWarning();
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

  // Manejar cambio en input de cantidad (solo actualizar estado temporal)
  const handleQuantityChange = (productId: string, value: string) => {
    setEditingQuantity(prev => ({
      ...prev,
      [productId]: value
    }));
  };

  // Manejar validación al salir del input de cantidad
  const handleQuantityBlur = (productId: string, value: string) => {
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue) && numericValue > 0) {
      updateItemQuantity(productId, numericValue);
    }
    // Limpiar estado temporal
    setEditingQuantity(prev => {
      const newState = { ...prev };
      delete newState[productId];
      return newState;
    });
  };

  // Manejar focus en input de cantidad
  const handleQuantityFocus = (productId: string, currentQuantity: number) => {
    setEditingQuantity(prev => ({
      ...prev,
      [productId]: currentQuantity.toString()
    }));
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
            showDecimalWarning();
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

  // Manejar cambio en input de precio total (solo actualizar estado temporal)
  const handleTotalPriceChange = (productId: string, value: string) => {
    setEditingTotalPrice(prev => ({
      ...prev,
      [productId]: value
    }));
  };

  // Manejar validación al salir del input de precio total
  const handleTotalPriceBlur = (productId: string, value: string) => {
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue) && numericValue > 0) {
      updateItemTotalPrice(productId, numericValue);
    }
    // Limpiar estado temporal
    setEditingTotalPrice(prev => {
      const newState = { ...prev };
      delete newState[productId];
      return newState;
    });
  };

  // Manejar focus en input de precio total
  const handleTotalPriceFocus = (productId: string, currentTotalPrice: number) => {
    setEditingTotalPrice(prev => ({
      ...prev,
      [productId]: currentTotalPrice.toFixed(2)
    }));
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

  // Obtener cliente seleccionado
  const selectedCustomer = customers.find(customer => customer.customerId === selectedCustomerId);

  // Calcular cambio
  const receivedAmountNum = parseFloat(receivedAmount) || 0;
  const changeAmount = receivedAmountNum - summary.total;

  // Manejar completar pago (abrir vista de pago)
  const handleCompleteSale = () => {
    if (saleItems.length === 0) {
      toast.showWarning('No hay productos en la venta');
      return;
    }
    
    setShowPaymentView(true);
    // Resetear estados de pago
    setSelectedCustomerId('');
    setReceivedAmount('');
    setIsCredit(false);
  };

  // Volver a la vista de compra
  const handleBackToSale = () => {
    setShowPaymentView(false);
    setSelectedCustomerId('');
    setReceivedAmount('');
    setIsCredit(false);
  };

  // Confirmar compra
  const handleConfirmPurchase = async () => {
    if (saleItems.length === 0) {
      toast.showWarning('No hay productos en la venta');
      return;
    }

    const receivedAmountNum = parseFloat(receivedAmount) || 0;

    // Validar pago
    if (!isCredit && receivedAmountNum < summary.total) {
      toast.showError('El monto recibido debe ser mayor o igual al total de la venta');
      return;
    }

    if (isCredit && !selectedCustomer) {
      toast.showError('Debe seleccionar un cliente para venta fiada');
      return;
    }

    if (isCredit && selectedCustomer && !selectedCustomer.allowCredit) {
      toast.showError('El cliente seleccionado no tiene crédito habilitado');
      return;
    }

    setProcessingPayment(true);

    try {
      // Crear la venta
      const currentUserId = 'MAJITO-LINDA'; // TODO Placeholder reemplazar con usuario actual

      const sale: Sale = {
        saleId: uuidv4(),
        userId: currentUserId,
        customerId: selectedCustomer?.customerId!,
        totalAmount: Math.round(summary.total * 100), // Convertir a centavos
        isActive: true,
        isPartOfDebt: isCredit,
        SRIStatus: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.sales.insert(sale);

      // Crear los detalles de venta
      for (const item of saleItems) {
        const taxAmount = item.totalPrice * TAX_RATE;
        const subtotal = item.totalPrice;
        const lineTotal = subtotal + taxAmount;

        const saleDetail: SaleDetail = {
          saleId: sale.saleId!,
          productId: item.productId!,
          quantity: item.quantity,
          unitPrice: Math.round(item.unitPrice * 100), // Convertir a centavos
          subtotal: Math.round(subtotal * 100),
          taxAmount: Math.round(taxAmount * 100),
          lineTotal: Math.round(lineTotal * 100)
        };

        await db.saleDetails.insert(saleDetail);
      }

      // Si es venta fiada, crear deuda y pago
      if (isCredit && selectedCustomer) {
        const debtAmount = Math.round((summary.total - receivedAmountNum) * 100); // Convertir a centavos

        if (debtAmount > 0) {
          const debt: Debt = {
            debtId: uuidv4(),
            customerId: selectedCustomer.customerId!,
            amount: debtAmount,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          await db.debts.insert(debt);

          // Si hubo pago parcial, crear registro de pago
          if (receivedAmountNum > 0) {
            const payment: DebtPayment = {
              debtPaymentId: uuidv4(),
              debtId: debt.debtId!,
              userId: currentUserId,
              amountPaid: Math.round(receivedAmountNum * 100), // Convertir a centavos
              paymentDate: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            await db.debtPayments.insert(payment);
          }
        }
      }

      // Mostrar mensaje de éxito
      if (isCredit) {
        const paidAmount = receivedAmountNum;
        const debtAmount = summary.total - paidAmount;
        
        if (debtAmount > 0) {
          toast.showSuccess(
            `Venta fiada registrada. Pagado: $${paidAmount.toFixed(2)}, Debe: $${debtAmount.toFixed(2)}`
          );
        } else {
          toast.showSuccess(`Venta completada por $${summary.total.toFixed(2)}`);
        }
      } else {
        toast.showSuccess(`Venta completada. Cambio: $${changeAmount.toFixed(2)}`);
      }

      // Limpiar la venta
      onClearSale();
      setShowPaymentView(false);
      setSelectedCustomerId('');
      setReceivedAmount('');
      setIsCredit(false);
      setSearchTerm('');
      
      if (searchInputRef.current) {
        searchInputRef.current.focus();
        setInputHasFocus(true);
      }

    } catch (error) {
      console.error('Error procesando venta:', error);
      toast.showError('Error al procesar la venta');
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <div className="sales-screen">
      {/* Header */}
      <div className="sales-header">
        <h1>Venta</h1>
      </div>

      {/* Vista de compra normal */}
      <div className={`sale-view ${showPaymentView ? 'hidden' : 'visible'}`}>
        {/* Barra de búsqueda */}
        <div className="search-section">
          <div className="search-input-container">
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder="Buscar producto por código o nombre..."
              className="search-input"
            />
            {isSearching && <div className="search-loading">🔍</div>}
            {saleItems.length > 0 && (
              <button
                onClick={onClearSale}
                className="clear-sale-button"
                title="Vaciar venta"
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
                Vaciar
              </button>
            )}
          </div>

          {/* Resultados de búsqueda */}
          {searchResults.length > 0 && showResults && inputHasFocus && (
            <div className="search-results" ref={searchResultsRef}>
              {searchResults.map((product, index) => (
                <div
                  key={product.productId}
                  className={`search-result-item ${index === selectedResultIndex ? 'selected' : ''}`}
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
              
              <div className="table-body">
                {saleItems.map((item) => (
                  <div key={item.productId} className="table-row">
                    <div className="item-code">{item.code}</div>
                    <div className="item-name">{item.name}</div>
                    <div className="item-unit-price">${item.unitPrice.toFixed(2)}</div>
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
                        value={editingTotalPrice[item.productId!] ?? item.totalPrice.toFixed(2)}
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
          )}
        </div>
      </div>

      {/* Botón de volver cuando está en vista de pago */}
      {showPaymentView && (
        <button 
          className="back-to-sale-button"
          onClick={handleBackToSale}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="currentColor"/>
          </svg>
          Volver a la Compra
        </button>
      )}

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

      {/* Botón de completar pago - Después del resumen */}
      {saleItems.length > 0 && !showPaymentView && (
        <button 
          className="complete-sale-button"
          onClick={handleCompleteSale}
        >
          <div className="button-top">Completar Pago</div>
          <div className="button-bottom">${summary.total.toFixed(2)}</div>
        </button>
      )}

      {/* Vista de pago */}
      {showPaymentView && saleItems.length > 0 && (
        <div className="payment-view">
          <div className="payment-sections">
            {/* Sección de cambio */}
            <div className="payment-section">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.48 2 12 2ZM13.5 6C15.99 6 18 8.01 18 10.5S15.99 15 13.5 15H12V13H13.5C14.88 13 16 11.88 16 10.5S14.88 8 13.5 8H12V6H13.5ZM11 8H9.5C8.12 8 7 9.12 7 10.5S8.12 13 9.5 13H11V15H9.5C7.01 15 5 12.99 5 10.5S7.01 6 9.5 6H11V8Z" fill="currentColor"/>
              </svg>
              Monto Recibido
            </h3>
            <div className="payment-input-container">
              <span className="currency-symbol">$</span>
              <input
                type="number"
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="payment-input"
              />
            </div>
            {receivedAmount && (
              <div className={`change-indicator ${changeAmount >= 0 ? 'positive' : 'negative'}`}>
                {changeAmount >= 0 ? (
                  <>Cambio: <strong>${changeAmount.toFixed(2)}</strong></>
                ) : (
                  <>Falta: <strong>${Math.abs(changeAmount).toFixed(2)}</strong></>
                )}
              </div>
            )}
          </div>

          {/* Sección de cliente */}
          <div className="payment-section">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/>
              </svg>
              Cliente
            </h3>
            <select
              value={selectedCustomerId}
              onChange={(e) => {
                setSelectedCustomerId(e.target.value);
                setIsCredit(false); // Resetear crédito al cambiar cliente
              }}
              className="customer-select"
            >
              <option value="">Seleccionar cliente (opcional)</option>
              {customers.map((customer) => (
                <option key={customer.customerId} value={customer.customerId}>
                  {customer.fullname}
                </option>
              ))}
            </select>

            {selectedCustomer && selectedCustomer.allowCredit && (
              <label className="credit-checkbox-label">
                <input
                  type="checkbox"
                  checked={isCredit}
                  onChange={(e) => setIsCredit(e.target.checked)}
                  className="credit-checkbox"
                />
                <span className="credit-checkbox-custom"></span>
                Venta Fiada
              </label>
            )}
          </div>
          </div>

          {/* Botón de confirmar compra */}
          <button
            className="confirm-purchase-button"
            onClick={handleConfirmPurchase}
            disabled={processingPayment || (!isCredit && receivedAmountNum < summary.total)}
          >
            {processingPayment ? (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z" fill="currentColor">
                    <animateTransform attributeName="transform" attributeType="XML" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
                  </path>
                </svg>
                Procesando...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/>
                </svg>
                Confirmar Compra
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default SalesScreen;

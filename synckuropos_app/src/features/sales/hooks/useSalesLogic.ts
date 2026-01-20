// useSalesLogic.ts
import { useState } from 'react';
import { useToast, useDatabase } from '@/hooks';
import { productRepository } from '@/features/inventory/services/productRepository';
import type { Product, SaleItem, SaleSummary, ComboProduct, ComboBreakdown } from '../../../types/types';

interface UseSalesLogicProps {
  saleItems: SaleItem[];
  setSaleItems: React.Dispatch<React.SetStateAction<SaleItem[]>>;
  onClearSale: () => void;
}

interface UseSalesLogicReturn {
  showPaymentView: boolean;
  setShowPaymentView: (show: boolean) => void;
  taxRate: number;
  addProductToSale: (product: Product) => void;
  calculateSummary: () => SaleSummary;
  handleCompleteSale: () => void;
  handleBackToSale: () => void;
  handleSaleCompleted: () => void;
}

/**
 * Calcula el precio total óptimo usando combos de mayor a menor cantidad
 */
const calculatePriceWithCombos = (
  quantity: number, 
  basePrice: number, 
  combos: ComboProduct[]
): { totalPrice: number; combosApplied: ComboBreakdown[] } => {
  let remainingQty = quantity;
  let totalPrice = 0;
  const combosApplied: ComboBreakdown[] = [];

  // Ordenar combos de mayor a menor cantidad (ya deberían venir así)
  const sortedCombos = [...combos].sort((a, b) => b.comboQuantity - a.comboQuantity);

  // Aplicar combos desde el más grande
  for (const combo of sortedCombos) {
    if (remainingQty >= combo.comboQuantity) {
      const combosUsed = Math.floor(remainingQty / combo.comboQuantity);
      totalPrice += combosUsed * combo.comboPrice;
      remainingQty -= combosUsed * combo.comboQuantity;
      
      combosApplied.push({
        comboQuantity: combo.comboQuantity,
        comboPrice: combo.comboPrice,
        combosUsed
      });
    }
  }

  // Agregar unidades restantes al precio base
  if (remainingQty > 0) {
    totalPrice += remainingQty * basePrice;
  }

  return { totalPrice, combosApplied };
};

export const useSalesLogic = ({ 
  saleItems, 
  setSaleItems, 
  onClearSale 
}: UseSalesLogicProps): UseSalesLogicReturn => {
  // States
  const [showPaymentView, setShowPaymentView] = useState(false);
  
  // Constants
  const TAX_RATE = 0.15; // 15% IVA
  
  const toast = useToast();
  const db = useDatabase();

  // Add product to sale
  const addProductToSale = async (product: Product) => {
    try {
      // Obtener combos del producto
      const combos = await productRepository.getActiveCombosByProduct(db, product.productId);

      setSaleItems(prevItems => {
        const existingItemIndex = prevItems.findIndex(item => item.productId === product.productId);
        
        if (existingItemIndex >= 0) {
          // Product already exists, increment quantity and recalculate
          const updatedItems = [...prevItems];
          const existingItem = updatedItems[existingItemIndex];
          const newQuantity = existingItem.quantity + 1;
          
          // Recalcular precio con combos
          const { totalPrice, combosApplied } = calculatePriceWithCombos(
            newQuantity,
            product.basePrice,
            combos
          );
          
          updatedItems[existingItemIndex] = {
            ...existingItem,
            quantity: newQuantity,
            totalPrice,
            combosApplied
          };
          
          return updatedItems;
        } else {
          // New product
          const { totalPrice, combosApplied } = calculatePriceWithCombos(
            1,
            product.basePrice,
            combos
          );

          const newItem: SaleItem = {
            productId: product.productId,
            code: product.code || '',
            name: product.name,
            unitPrice: product.basePrice,
            quantity: 1,
            totalPrice,
            allowDecimalQuantity: product.allowDecimalQuantity,
            isTaxable: product.isTaxable,
            combosApplied
          };
          
          return [...prevItems, newItem];
        }
      });
      
      toast.showSuccess(`Producto "${product.name}" agregado a la venta`);
    } catch (error) {
      console.error('Error adding product:', error);
      toast.showError('Error al agregar producto');
    }
  };

  // Calculate sale summary
  const calculateSummary = (): SaleSummary => {
    const subtotal = saleItems.reduce((sum, item) => sum + item.totalPrice, 0);
    
    // Calcular impuesto solo sobre productos gravables
    const taxableAmount = saleItems
      .filter(item => item.isTaxable)
      .reduce((sum, item) => sum + item.totalPrice, 0);
    
    const tax = taxableAmount * TAX_RATE;
    const total = subtotal + tax;
    
    return { subtotal, tax, total };
  };

  // Handle complete sale (open payment view)
  const handleCompleteSale = () => {
    if (saleItems.length === 0) {
      toast.showWarn('No hay productos en la venta');
      return;
    }
    
    setShowPaymentView(true);
  };

  // Go back to sale view
  const handleBackToSale = () => {
    setShowPaymentView(false);
  };

  // Handle sale completed
  const handleSaleCompleted = () => {
    onClearSale();
    setShowPaymentView(false);
  };

  return {
    showPaymentView,
    setShowPaymentView,
    taxRate: TAX_RATE,
    addProductToSale,
    calculateSummary,
    handleCompleteSale,
    handleBackToSale,
    handleSaleCompleted
  };
};
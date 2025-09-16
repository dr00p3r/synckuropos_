import { useState } from 'react';
import { useToast } from '../../../hooks/useToast';
import type { Product, SaleItem, SaleSummary } from '../../../types/types';

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

  // Add product to sale
  const addProductToSale = (product: Product) => {
    setSaleItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item.productId === product.productId);
      
      if (existingItemIndex >= 0) {
        // Product already exists, increment quantity
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
        // New product
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
    
    toast.showSuccess(`Producto "${product.name}" agregado a la venta`);
  };

  // Calculate sale summary
  const calculateSummary = (): SaleSummary => {
    const subtotal = saleItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;
    
    return { subtotal, tax, total };
  };

  // Handle complete sale (open payment view)
  const handleCompleteSale = () => {
    if (saleItems.length === 0) {
      toast.showWarning('No hay productos en la venta');
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
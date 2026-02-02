import { useState } from 'react';
import { useToast, useCart } from '@/hooks';
import type { Product, SaleSummary } from '../../../types/types';

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

export const useSalesLogic = (): UseSalesLogicReturn => {
  // States
  const [showPaymentView, setShowPaymentView] = useState(false);

  // Constants
  const TAX_RATE = 0.15; // 15% IVA

  const toast = useToast();
  const { saleItems, addToCart, clearCart, calculateSummary } = useCart();

  // Add product to sale
  const addProductToSale = (product: Product) => {
    addToCart(product);
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
    clearCart();
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
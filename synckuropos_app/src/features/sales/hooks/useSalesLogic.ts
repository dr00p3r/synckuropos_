import { useState } from 'react';
import { useToast, useCart } from '@/hooks';
import type { Product, SaleSummary } from '../../../types/types';

interface UseSalesLogicReturn {
  showPaymentView: boolean;
  setShowPaymentView: (show: boolean) => void;
  addProductToSale: (product: Product) => void;
  calculateSummary: () => SaleSummary;
  handleCompleteSale: () => void;
  handleBackToSale: () => void;
  handleSaleCompleted: () => void;
}

export const useSalesLogic = (): UseSalesLogicReturn => {
  const [showPaymentView, setShowPaymentView] = useState(false);

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
    addProductToSale,
    calculateSummary,
    handleCompleteSale,
    handleBackToSale,
    handleSaleCompleted
  };
};
import { useState, useRef } from 'react';
import { useToast } from '../../../hooks/useToast';
import { toCents, toDollars, safeParseNumber } from '@/utils/money';
import type { SaleItem } from '../../../types/types';

interface UseSaleItemsLogicProps {
  saleItems: SaleItem[];
  setSaleItems: React.Dispatch<React.SetStateAction<SaleItem[]>>;
}

interface UseSaleItemsLogicReturn {
  editingQuantity: { [key: string]: string };
  editingTotalPrice: { [key: string]: string };
  updateItemQuantity: (productId: string, newQuantity: number) => void;
  updateItemTotalPrice: (productId: string, newTotalPrice: number) => void;
  removeItem: (productId: string) => void;
  handleQuantityChange: (productId: string, value: string) => void;
  handleQuantityBlur: (productId: string, value: string) => void;
  handleQuantityFocus: (productId: string, currentQuantity: number) => void;
  handleTotalPriceChange: (productId: string, value: string) => void;
  handleTotalPriceBlur: (productId: string, value: string) => void;
  handleTotalPriceFocus: (productId: string, currentTotalPrice: number) => void;
}

const DECIMAL_WARNING_COOLDOWN = 1000; // 1 second cooldown for decimal warnings

export const useSaleItemsLogic = ({
  setSaleItems 
}: UseSaleItemsLogicProps): UseSaleItemsLogicReturn => {
  // Temporary states for input editing
  const [editingQuantity, setEditingQuantity] = useState<{[key: string]: string}>({});
  const [editingTotalPrice, setEditingTotalPrice] = useState<{[key: string]: string}>({});
  
  // Ref for decimal warning cooldown
  const isShowingDecimalWarningRef = useRef<boolean>(false);
  
  const toast = useToast();

  // Helper function to show decimal warning with cooldown
  const showDecimalWarning = () => {
    if (!isShowingDecimalWarningRef.current) {
      isShowingDecimalWarningRef.current = true;
      toast.showWarning('Este producto no permite cantidades decimales');
      
      // Reset flag after a brief period
      setTimeout(() => {
        isShowingDecimalWarningRef.current = false;
      }, DECIMAL_WARNING_COOLDOWN);
    }
  };

  // Update item quantity
  const updateItemQuantity = (productId: string, newQuantity: number) => {
    setSaleItems(prevItems => {
      return prevItems.map(item => {
        if (item.productId === productId) {
          let finalQuantity = newQuantity;
          
          // Validate decimal quantity
          if (!item.allowDecimalQuantity && newQuantity % 1 !== 0) {
            finalQuantity = Math.floor(newQuantity);
            showDecimalWarning();
          }
          
          if (finalQuantity <= 0) {
            return item; // Don't allow negative or zero quantities
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

  // Update item total price
  const updateItemTotalPrice = (productId: string, newTotalPrice: number) => {
    setSaleItems(prevItems => {
      return prevItems.map(item => {
        if (item.productId === productId) {
          if (newTotalPrice <= 0) {
            return item; // Don't allow negative or zero prices
          }
          
          let newQuantity = newTotalPrice / item.unitPrice;
          
          // Validate decimal quantity
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

  // Remove item from sale
  const removeItem = (productId: string) => {
    setSaleItems(prevItems => prevItems.filter(item => item.productId !== productId));
    toast.showInfo('Producto eliminado de la venta');
  };

  // Handle quantity input change (only update temporary state)
  const handleQuantityChange = (productId: string, value: string) => {
    setEditingQuantity(prev => ({
      ...prev,
      [productId]: value
    }));
  };

  // Handle quantity input blur validation
  const handleQuantityBlur = (productId: string, value: string) => {
    const numericValue = safeParseNumber(value);
    if (numericValue > 0) {
      updateItemQuantity(productId, numericValue);
    }
    // Clear temporary state
    setEditingQuantity(prev => {
      const newState = { ...prev };
      delete newState[productId];
      return newState;
    });
  };

  // Handle quantity input focus
  const handleQuantityFocus = (productId: string, currentQuantity: number) => {
    setEditingQuantity(prev => ({
      ...prev,
      [productId]: currentQuantity.toString()
    }));
  };

  // Handle total price input change (only update temporary state)
  const handleTotalPriceChange = (productId: string, value: string) => {
    setEditingTotalPrice(prev => ({
      ...prev,
      [productId]: value
    }));
  };

  // Handle total price input blur validation
  // User input is in dollars, need to convert to cents for updateItemTotalPrice
  const handleTotalPriceBlur = (productId: string, value: string) => {
    const dollarValue = safeParseNumber(value);
    if (dollarValue > 0) {
      const centsValue = toCents(dollarValue);
      updateItemTotalPrice(productId, centsValue);
    }
    // Clear temporary state
    setEditingTotalPrice(prev => {
      const newState = { ...prev };
      delete newState[productId];
      return newState;
    });
  };

  // Handle total price input focus
  // currentTotalPrice is in cents, need to convert to dollars for display
  const handleTotalPriceFocus = (productId: string, currentTotalPriceCents: number) => {
    setEditingTotalPrice(prev => ({
      ...prev,
      [productId]: toDollars(currentTotalPriceCents).toFixed(2)
    }));
  };

  return {
    editingQuantity,
    editingTotalPrice,
    updateItemQuantity,
    updateItemTotalPrice,
    removeItem,
    handleQuantityChange,
    handleQuantityBlur,
    handleQuantityFocus,
    handleTotalPriceChange,
    handleTotalPriceBlur,
    handleTotalPriceFocus
  };
};
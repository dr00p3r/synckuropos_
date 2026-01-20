import { useToast, useDatabase } from '@/hooks';
import { productRepository } from '@/features/inventory/services/productRepository';
import type { SaleItem, ComboProduct, ComboBreakdown } from '../../../types/types';

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

interface UseSaleItemsLogicProps {
    saleItems: SaleItem[];
    setSaleItems: React.Dispatch<React.SetStateAction<SaleItem[]>>;
}

export const useSaleItemsLogic = ({ setSaleItems }: UseSaleItemsLogicProps) => {
    const toast = useToast();
    const db = useDatabase();

    const updateItemQuantity = async (productId: string, newQuantity: number) => {
        if (newQuantity <= 0) return;

        try {
            // Obtener combos del producto
            const combos = await productRepository.getActiveCombosByProduct(db, productId);

            setSaleItems(prevItems => {
                return prevItems.map(item => {
                    if (item.productId === productId) {
                        let finalQuantity = newQuantity;
                        if (!item.allowDecimalQuantity && newQuantity % 1 !== 0) {
                            finalQuantity = Math.floor(newQuantity);
                        }

                        // Recalcular precio con combos
                        const { totalPrice, combosApplied } = calculatePriceWithCombos(
                            finalQuantity,
                            item.unitPrice,
                            combos
                        );

                        return {
                            ...item,
                            quantity: finalQuantity,
                            totalPrice,
                            combosApplied
                        };
                    }
                    return item;
                });
            });
        } catch (error) {
            console.error('Error updating quantity:', error);
            toast.showError('Error al actualizar cantidad');
        }
    };

    const removeItem = (productId: string) => {
        setSaleItems(prevItems => prevItems.filter(item => item.productId !== productId));
    };

    return {
        updateItemQuantity,
        removeItem
    };
};
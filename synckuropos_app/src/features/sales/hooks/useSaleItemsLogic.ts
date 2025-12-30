import { useToast } from '@/hooks';
import type { SaleItem } from '../../../types/types';

interface UseSaleItemsLogicProps {
    saleItems: SaleItem[];
    setSaleItems: React.Dispatch<React.SetStateAction<SaleItem[]>>;
}

export const useSaleItemsLogic = ({ setSaleItems }: UseSaleItemsLogicProps) => {
    const toast = useToast();

    const updateItemQuantity = (productId: string, newQuantity: number) => {
        setSaleItems(prevItems => {
            return prevItems.map(item => {
                if (item.productId === productId) {
                    
                    if (newQuantity <= 0) return item; 
                    
                    let finalQuantity = newQuantity;
                    if (!item.allowDecimalQuantity && newQuantity % 1 !== 0) {
                        finalQuantity = Math.floor(newQuantity);
                        // Opcional: toast warning si quieres ser estricto
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

    const removeItem = (productId: string) => {
        setSaleItems(prevItems => prevItems.filter(item => item.productId !== productId));
    };

    return {
        updateItemQuantity,
        removeItem
    };
};
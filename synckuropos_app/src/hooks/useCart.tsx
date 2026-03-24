import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { useDatabase } from './useDatabase';
import { useToast } from './useToast';
import { productRepository } from '@/features/inventory/services/productRepository';
import type { SaleItem, Product, ComboProduct, ComboBreakdown, SaleSummary } from '@/types/types';

interface CartContextType {
    saleItems: SaleItem[];
    saleStartTime: number | null;
    addToCart: (product: Product) => Promise<void>;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => Promise<void>;
    clearCart: () => void;
    calculateSummary: () => SaleSummary;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

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

    // Ordenar combos de mayor a menor cantidad
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

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
    const [saleStartTime, setSaleStartTime] = useState<number | null>(null);
    const db = useDatabase();
    const toast = useToast();
    const TAX_RATE = 0.15;

    const addToCart = async (product: Product) => {
        try {
            const existingItem = saleItems.find(item => item.productId === product.productId);
            const nextQuantity = (existingItem?.quantity || 0) + 1;

            if (nextQuantity > product.stock) {
                toast.showWarn(`Stock insuficiente para "${product.name}"`);
                return;
            }

            if (saleItems.length === 0) {
                setSaleStartTime(performance.now());
            }

            const combos = await productRepository.getActiveCombosByProduct(db, product.productId);

            setSaleItems(prevItems => {
                const existingItemIndex = prevItems.findIndex(item => item.productId === product.productId);

                if (existingItemIndex >= 0) {
                    const updatedItems = [...prevItems];
                    const existingItem = updatedItems[existingItemIndex];
                    const newQuantity = existingItem.quantity + 1;

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
                    // Add new
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
            toast.showSuccess(`Producto "${product.name}" agregado`);
        } catch (error) {
            console.error('Error adding to cart:', error);
            toast.showError('Error al agregar producto al carrito');
        }
    };

    const updateQuantity = async (productId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }

        try {
            const productDoc = await db.products.findOne({
                selector: { productId, _deleted: false }
            }).exec();

            if (!productDoc) {
                toast.showError('Producto no encontrado');
                return;
            }

            const product = productDoc.toJSON() as Product;
            const combos = await productRepository.getActiveCombosByProduct(db, productId);

            setSaleItems(prevItems => {
                const index = prevItems.findIndex(item => item.productId === productId);
                if (index === -1) return prevItems;

                const updatedItems = [...prevItems];
                const item = updatedItems[index];

                let finalQuantity = quantity;

                if (!item.allowDecimalQuantity && finalQuantity % 1 !== 0) {
                    finalQuantity = Math.floor(finalQuantity);
                }

                if (finalQuantity > product.stock) {
                    toast.showWarn(`Stock insuficiente para "${item.name}"`);
                    return prevItems;
                }

                if (finalQuantity <= 0) {
                    return prevItems;
                }

                const { totalPrice, combosApplied } = calculatePriceWithCombos(
                    finalQuantity,
                    item.unitPrice,
                    combos
                );

                updatedItems[index] = {
                    ...item,
                    quantity: finalQuantity,
                    totalPrice,
                    combosApplied
                };

                return updatedItems;
            });
        } catch (error) {
            console.error('Error updating quantity:', error);
        }
    };

    const removeFromCart = (productId: string) => {
        setSaleItems(prev => {
            const next = prev.filter(item => item.productId !== productId);
            if (next.length === 0) {
                setSaleStartTime(null);
            }
            return next;
        });
    };

    const clearCart = () => {
        setSaleItems([]);
        setSaleStartTime(null);
    };

    const calculateSummary = (): SaleSummary => {
        const TAX_DIVISOR = 1 + TAX_RATE;

        const { subtotal, tax, total } = saleItems.reduce(
            (acc, item) => {
                const lineTotal = Math.round(item.totalPrice);

                if (!item.isTaxable) {
                    acc.subtotal += lineTotal;
                    acc.total += lineTotal;
                    return acc;
                }

                // El precio de venta ya incluye IVA, aquí solo lo descomponemos.
                const lineSubtotal = Math.round(lineTotal / TAX_DIVISOR);
                const lineTax = lineTotal - lineSubtotal;

                acc.subtotal += lineSubtotal;
                acc.tax += lineTax;
                acc.total += lineTotal;

                return acc;
            },
            { subtotal: 0, tax: 0, total: 0 }
        );

        return { subtotal, tax, total };
    };

    return (
        <CartContext.Provider value={{
            saleItems,
            saleStartTime,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            calculateSummary
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

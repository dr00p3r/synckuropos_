import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo, type ReactNode } from 'react';
import { useDatabase } from './useDatabase';
import { useToast } from './useToast';
import { productRepository } from '@/features/inventory/services/productRepository';
import type { SaleItem, Product, ComboProduct, ComboBreakdown, SaleSummary, TaxRate } from '@/types/types';
import { and, eq, lte, desc } from 'drizzle-orm';
import * as schema from '@/db/schema';

interface CartContextType {
    saleItems: SaleItem[];
    saleStartTime: number | null;
    addToCart: (product: Product) => Promise<void>;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => Promise<void>;
    clearCart: () => void;
    calculateSummary: () => SaleSummary;
    refreshTaxRate: () => Promise<void>;
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
    const [taxRate, setTaxRate] = useState<number>(0.15);
    const combosCache = useRef<Map<string, ComboProduct[]>>(new Map());
    const db = useDatabase();
    const toast = useToast();

    const loadCombos = useCallback(async () => {
        if (!db) return;
        try {
            combosCache.current = await productRepository.getAllActiveCombos(db);
        } catch (error) {
            console.error('Error loading combos:', error);
        }
    }, [db]);

    const getCombos = useCallback((productId: string): ComboProduct[] => {
        return combosCache.current.get(productId) ?? [];
    }, []);

    const refreshTaxRate = useCallback(async () => {
        try {
            const rows = await db.select().from(schema.taxRates)
                .where(and(eq(schema.taxRates._deleted, false), lte(schema.taxRates.effectiveFrom, Date.now())))
                .orderBy(desc(schema.taxRates.effectiveFrom))
                .limit(1);
            if (rows.length > 0) {
                setTaxRate((rows[0] as TaxRate).rate);
            }
        } catch (error) {
            console.error('Error loading tax rate:', error);
        }
    }, [db]);

    useEffect(() => {
        if (db) {
            refreshTaxRate();
            loadCombos();
        }
    }, [db, refreshTaxRate, loadCombos]);

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
                await refreshTaxRate();
            }

            const combos = getCombos(product.productId);

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

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }

        try {
            const combos = getCombos(productId);

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

    const summary = useMemo((): SaleSummary => {
        let subtotal = 0;
        for (const item of saleItems) {
            if (item.isTaxable) {
                subtotal += Math.round(item.totalPrice / (1 + taxRate));
            } else {
                subtotal += item.totalPrice;
            }
        }
        const total = saleItems.reduce((sum, item) => sum + item.totalPrice, 0);
        const tax = total - subtotal;

        return { subtotal, tax, total, taxRate };
    }, [saleItems, taxRate]);

    const calculateSummary = useCallback((): SaleSummary => {
        return summary;
    }, [summary]);

    return (
        <CartContext.Provider value={{
            saleItems,
            saleStartTime,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            calculateSummary,
            refreshTaxRate
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

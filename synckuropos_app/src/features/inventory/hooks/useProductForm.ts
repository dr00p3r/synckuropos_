import { useState, useEffect, useCallback, useRef } from 'react';
import { useDatabase, useToast, useAuth } from '@/hooks';
import { confirmDialog } from 'primereact/confirmdialog';
import { productRepository } from '../services/productRepository';
import type { Product } from '@/types/types';

interface UseProductFormProps {
    visible: boolean;
    productToEdit?: Product;
    onSave: () => void;
    onHide: () => void;
    onDuplicateCode?: (product: Product) => void;
}

interface StockFormState {
    qtyMove: number | null;
    cost: number | null;
    reason: string;
}

const INITIAL_STOCK_STATE: StockFormState = {
    qtyMove: null,
    cost: null,
    reason: 'Reabastecimiento'
};

export const useProductForm = ({ visible, productToEdit, onSave, onHide, onDuplicateCode }: UseProductFormProps) => {
    const db = useDatabase();
    const toast = useToast();
    const { currentUser } = useAuth();

    const [createdProductData, setCreatedProductData] = useState<Product | null>(null);
    const activeProduct = productToEdit || createdProductData;
    const isEditMode = !!activeProduct;
    const originalCodeRef = useRef('');

    const [activeIndex, setActiveIndex] = useState(0);
    const [loading, setLoading] = useState(false);

    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [price, setPrice] = useState<number | null>(null);
    const [isTaxable, setIsTaxable] = useState(true);
    const [allowDecimal, setAllowDecimal] = useState(false);
    const [stockForm, setStockForm] = useState<StockFormState>(INITIAL_STOCK_STATE);

    const updateStockField = useCallback(<K extends keyof StockFormState>(
        field: K,
        value: StockFormState[K]
    ) => {
        setStockForm(prev => ({ ...prev, [field]: value }));
    }, []);

    const resetForm = useCallback(() => {
        setName('');
        setCode('');
        setPrice(null);
        setIsTaxable(true);
        setAllowDecimal(false);
        setStockForm(INITIAL_STOCK_STATE);
        setCreatedProductData(null);
        setActiveIndex(0);
        originalCodeRef.current = '';
    }, []);

    const loadProductData = useCallback((product: Product) => {
        setName(product.name);
        setCode(product.code || '');
        originalCodeRef.current = product.code || '';
        setPrice(product.basePrice / 100);
        setIsTaxable(product.isTaxable);
        setAllowDecimal(product.allowDecimalQuantity);
        setCreatedProductData(null);
        setStockForm(INITIAL_STOCK_STATE);
        setActiveIndex(1);
    }, []);

    useEffect(() => {
        if (visible) {
            if (productToEdit) {
                loadProductData(productToEdit);
            } else {
                resetForm();
            }
        }
    }, [visible, productToEdit, loadProductData, resetForm]);

    useEffect(() => {
        const fetchLastCost = async () => {
            if (!activeProduct?.productId || !db) return;
            try {
                const lastCost = await productRepository.getLastSupplyCost(db, activeProduct.productId);
                if (lastCost !== null) {
                    setStockForm(prev => ({ ...prev, cost: lastCost }));
                }
            } catch (error) {
                console.error('Error fetching last cost:', error);
            }
        };

        if (visible && activeIndex === 1 && stockForm.cost === null) {
            fetchLastCost();
        }
    }, [visible, activeProduct?.productId, db, activeIndex, stockForm.cost]);

    const handleSaveGeneral = useCallback(async () => {
        if (!name.trim()) {
            toast.showError('El nombre es obligatorio');
            return;
        }
        if (!price || price <= 0) {
            toast.showError('El precio debe ser mayor a 0');
            return;
        }
        if (!db) return;

        const trimmedCode = code.trim();
        const codeChanged = trimmedCode !== originalCodeRef.current;

        if (trimmedCode && codeChanged) {
            const existing = await productRepository.findByCode(db, trimmedCode);
            if (existing) {
                if (!activeProduct) {
                    // Modo creación: redirigir a edición del producto existente
                    toast.showInfo('El código ya existe. Abriendo producto para edición.');
                    onDuplicateCode?.(existing);
                    return;
                } else if (existing.productId !== activeProduct.productId) {
                    // Modo edición: el código ya está en uso por otro producto
                    toast.showError('El código ya está en uso por otro producto.');
                    return;
                }
            }
        }

        setLoading(true);
        try {
            if (activeProduct) {
                await productRepository.updateProduct(db, activeProduct.productId, {
                    name,
                    code: trimmedCode,
                    basePrice: Math.round((price || 0) * 100),
                    isTaxable,
                    allowDecimalQuantity: allowDecimal
                });

                setCreatedProductData(prev => prev ? {
                    ...prev,
                    name,
                    code: trimmedCode,
                    basePrice: Math.round((price || 0) * 100),
                    isTaxable,
                    allowDecimalQuantity: allowDecimal,
                    updatedAt: Date.now()
                } : prev);

                toast.showSuccess('Información actualizada');
                if (productToEdit) {
                    onSave();
                    onHide();
                }
            } else {
                const newProd = await productRepository.createProduct(db, {
                    name,
                    code: trimmedCode,
                    basePrice: Math.round((price || 0) * 100),
                    isTaxable,
                    allowDecimalQuantity: allowDecimal
                });
                toast.showSuccess('Producto creado. Configure el stock.');
                setCreatedProductData(newProd);
                setActiveIndex(1);
                onSave();
            }
        } catch (error) {
            console.error(error);
            toast.showError('Error al guardar');
        } finally {
            setLoading(false);
        }
    }, [name, code, price, isTaxable, allowDecimal, activeProduct, productToEdit, db, toast, onSave, onHide, onDuplicateCode]);

    const executeStockSave = useCallback(async () => {
        if (!activeProduct || !db) return;
        setLoading(true);
        try {
            await productRepository.registerStockMovement(db, activeProduct, {
                quantityToMove: stockForm.qtyMove?.toString() || '0',
                costPerUnit: stockForm.cost?.toString() || '0',
                reason: stockForm.reason,
                newSalePrice: ''
            }, currentUser?.userId || 'unknown');

            toast.showSuccess('Stock actualizado');
            setStockForm(INITIAL_STOCK_STATE);
            onSave();
            onHide();
        } catch (e) {
            toast.showError('Error al mover stock');
        } finally {
            setLoading(false);
        }
    }, [activeProduct, db, stockForm, currentUser, toast, onSave, onHide]);

    const handleSaveStock = useCallback(async () => {
        if (!activeProduct || !db) return;
        if (!stockForm.qtyMove || stockForm.qtyMove === 0) {
            toast.showInfo('Ingrese una cantidad válida');
            return;
        }
        if (!stockForm.cost || stockForm.cost === 0) {
            confirmDialog({
                message: 'El costo registrado es 0. ¿Es un producto bonificado o gratuito? Esto afectará el cálculo de márgenes.',
                header: 'Confirmación de Costo Cero',
                icon: 'pi pi-exclamation-triangle',
                acceptLabel: 'Sí, es correcto',
                rejectLabel: 'Corregir',
                accept: () => executeStockSave()
            });
            return;
        }
        await executeStockSave();
    }, [activeProduct, db, stockForm.qtyMove, stockForm.cost, executeStockSave]);

    return {
        activeProduct,
        isEditMode,
        activeIndex,
        loading,
        name,
        setName,
        code,
        setCode,
        price,
        setPrice,
        isTaxable,
        setIsTaxable,
        allowDecimal,
        setAllowDecimal,
        stockForm,
        updateStockField,
        setActiveIndex,
        handleSaveGeneral,
        handleSaveStock
    };
};

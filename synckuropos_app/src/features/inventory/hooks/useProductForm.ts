import { useState, useEffect, useCallback } from 'react';
import { useDatabase, useToast, useAuth } from '@/hooks';
import { productRepository } from '../services/productRepository';
import type { Product } from '@/types/types';
import { useTelemetry } from '@/hooks/useTelemetry';
import { TelemetryEvents } from '@/types/telemetryEvents';

interface UseProductFormProps {
    visible: boolean;
    productToEdit?: Product;
    onSave: () => void;
    onHide: () => void;
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

export const useProductForm = ({ visible, productToEdit, onSave, onHide }: UseProductFormProps) => {
    const db = useDatabase();
    const toast = useToast();
    const { currentUser } = useAuth();
    const { logMetric } = useTelemetry();

    // Estado del producto creado en el flujo de creación
    const [createdProductData, setCreatedProductData] = useState<Product | null>(null);

    // Producto activo (editando o recién creado)
    const activeProduct = productToEdit || createdProductData;
    const isEditMode = !!activeProduct;

    // UI State
    const [activeIndex, setActiveIndex] = useState(0);
    const [loading, setLoading] = useState(false);

    // Form General
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [price, setPrice] = useState<number | null>(null);
    const [isTaxable, setIsTaxable] = useState(true);
    const [allowDecimal, setAllowDecimal] = useState(false);

    // Form Stock
    const [stockForm, setStockForm] = useState<StockFormState>(INITIAL_STOCK_STATE);

    // Helper para actualizar campos del stock form
    const updateStockField = useCallback(<K extends keyof StockFormState>(
        field: K,
        value: StockFormState[K]
    ) => {
        setStockForm(prev => ({ ...prev, [field]: value }));
    }, []);

    // Reset completo del formulario
    const resetForm = useCallback(() => {
        setName('');
        setCode('');
        setPrice(null);
        setIsTaxable(true);
        setAllowDecimal(false);
        setStockForm(INITIAL_STOCK_STATE);
        setCreatedProductData(null);
        setActiveIndex(0);
    }, []);

    // Cargar datos del producto para edición
    const loadProductData = useCallback((product: Product) => {
        setName(product.name);
        setCode(product.code || '');
        setPrice(product.basePrice / 100);
        setIsTaxable(product.isTaxable);
        setAllowDecimal(product.allowDecimalQuantity);
        setCreatedProductData(null);
        // Reset stock form cuando cambia el producto
        setStockForm(INITIAL_STOCK_STATE);
        setActiveIndex(1); // Abrir en tab de stock
    }, []);

    // Efecto de apertura del diálogo
    useEffect(() => {
        if (visible) {
            if (productToEdit) {
                loadProductData(productToEdit);
                logMetric(TelemetryEvents.TASK_INIT, { taskName: 'INVENTORY_UPDATE' });
            } else {
                resetForm();
                logMetric(TelemetryEvents.TASK_INIT, { taskName: 'INVENTORY_CREATE' });
            }
        }
    }, [visible, productToEdit, loadProductData, resetForm]);

    // Efecto para cargar el último costo cuando se abre el tab de stock
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

        // Solo cargar si:
        // 1. El diálogo está visible
        // 2. Estamos en el tab de stock (index 1)
        // 3. El costo actual es null (no se ha cargado aún para este producto)
        if (visible && activeIndex === 1 && stockForm.cost === null) {
            fetchLastCost();
        }
    }, [visible, activeProduct?.productId, db, activeIndex, stockForm.cost]);

    // Guardar información general
    const handleSaveGeneral = useCallback(async () => {
        if (!name.trim()) {
            toast.showError('El nombre es obligatorio');
            return;
        }
        if (!db) return;

        setLoading(true);
        try {
            if (activeProduct) {
                // Actualizar producto existente
                await productRepository.updateProduct(db, activeProduct, {
                    name,
                    code,
                    basePrice: Math.round((price || 0) * 100),
                    isTaxable,
                    allowDecimalQuantity: allowDecimal
                });
                toast.showSuccess('Información actualizada');

                // Si estamos editando uno existente desde el inicio, cerramos
                if (productToEdit) {
                    logMetric(TelemetryEvents.TASK_COMPLETION, { taskName: 'INVENTORY_UPDATE' });
                    onSave();
                    onHide();
                }
            } else {
                // Crear nuevo producto
                const newProd = await productRepository.createProduct(db, {
                    name,
                    code,
                    basePrice: Math.round((price || 0) * 100),
                    isTaxable,
                    allowDecimalQuantity: allowDecimal
                });

                toast.showSuccess('Producto creado. Configure el stock.');
                logMetric(TelemetryEvents.TASK_COMPLETION, { taskName: 'INVENTORY_CREATE' });
                setCreatedProductData(newProd);
                setActiveIndex(1); // Mover al tab de Stock
                onSave(); // Refrescar lista de fondo
            }
        } catch (error) {
            console.error(error);
            logMetric(TelemetryEvents.UX_FORM_BLOCK, { formId: 'product-form', errorCount: 1, reason: 'save_error' });
            toast.showError('Error al guardar');
        } finally {
            setLoading(false);
        }
    }, [name, code, price, isTaxable, allowDecimal, activeProduct, productToEdit, db, toast, onSave, onHide]);

    // Guardar movimiento de stock
    const handleSaveStock = useCallback(async () => {
        if (!activeProduct || !db) return;

        if (!stockForm.qtyMove || stockForm.qtyMove === 0) {
            toast.showInfo('Ingrese una cantidad válida');
            return;
        }

        setLoading(true);
        try {
            await productRepository.registerStockMovement(db, activeProduct, {
                quantityToMove: stockForm.qtyMove.toString(),
                costPerUnit: stockForm.cost?.toString() || '0',
                reason: stockForm.reason,
                newSalePrice: ''
            }, currentUser?.userId || 'unknown');

            toast.showSuccess('Stock actualizado');
            setStockForm(INITIAL_STOCK_STATE);
            onSave(); // Refrescar lista
        } catch (e) {
            toast.showError('Error al mover stock');
        } finally {
            setLoading(false);
        }
    }, [activeProduct, stockForm, db, currentUser, toast, onSave]);

    return {
        // Estado
        activeProduct,
        isEditMode,
        activeIndex,
        loading,

        // Form General
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

        // Form Stock
        stockForm,
        updateStockField,

        // Actions
        setActiveIndex,
        handleSaveGeneral,
        handleSaveStock
    };
};
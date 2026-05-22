import { useState, useEffect, useCallback } from 'react';
import { useDatabase, useToast } from '@/hooks';
import { productRepository } from '../services/productRepository';

interface UseComboManagerProps {
    productId: string;
}

interface Combo {
    comboProductId: string;
    productId: string;
    comboQuantity: number;
    comboPrice: number;
    _deleted: boolean;
}

export const useComboManager = ({ productId }: UseComboManagerProps) => {
    const db = useDatabase();
    const toast = useToast();
    
    const [combos, setCombos] = useState<Combo[]>([]);
    const [qty, setQty] = useState<number | null>(null);
    const [price, setPrice] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    const loadCombos = useCallback(async () => {
        if (!db || !productId) {
            setCombos([]);
            return;
        }
        try {
            const rows = await productRepository.getCombosByProduct(db, productId);
            setCombos(rows as Combo[]);
        } catch (error) {
            console.error('Error loading combos:', error);
            setCombos([]);
        }
    }, [db, productId]);

    useEffect(() => {
        loadCombos();
    }, [loadCombos]);

    const handleAdd = useCallback(async () => {
        if (!qty || !price || !db || !productId) return;

        setLoading(true);
        try {
            await productRepository.addCombo(db, productId, qty, price);
            setQty(null);
            setPrice(null);
            toast.showSuccess('Combo agregado');
            await loadCombos();
        } catch (e: any) {
            console.error('Error al agregar combo:', e);
            if (e.message?.includes('Ya existe un combo')) {
                toast.showError(e.message);
            } else {
                toast.showError('Error al agregar combo');
            }
        } finally {
            setLoading(false);
        }
    }, [qty, price, db, productId, toast, loadCombos]);

    const handleDelete = useCallback(async (comboId: string) => {
        if (!db) return;

        try {
            await productRepository.deleteCombo(db, comboId);
            toast.showSuccess('Combo eliminado');
            await loadCombos();
        } catch (e) {
            console.error('Error al eliminar combo:', e);
            toast.showError('Error al eliminar');
        }
    }, [db, toast, loadCombos]);

    const resetForm = useCallback(() => {
        setQty(null);
        setPrice(null);
    }, []);

    return {
        combos,
        qty,
        setQty,
        price,
        setPrice,
        loading,
        handleAdd,
        handleDelete,
        resetForm,
        canAdd: !!qty && !!price && !!db
    };
};

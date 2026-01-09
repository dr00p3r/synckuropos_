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
    isActive: boolean;
}

export const useComboManager = ({ productId }: UseComboManagerProps) => {
    const db = useDatabase();
    const toast = useToast();
    
    const [combos, setCombos] = useState<Combo[]>([]);
    const [qty, setQty] = useState<number | null>(null);
    const [price, setPrice] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    // Cargar combos con suscripción
    useEffect(() => {
        // Validación temprana - no hacer nada si no hay db o productId
        if (!db || !productId) {
            setCombos([]);
            return;
        }

        let subscription: any = null;

        try {
            const query = productRepository.getCombosByProduct(db, productId);
            
            // Verificar que la query es válida antes de suscribirse
            if (query && query.$) {
                subscription = query.$.subscribe({
                    next: (docs: any[]) => {
                        setCombos(docs.map((d: any) => d.toJSON()));
                    },
                    error: (err: Error) => {
                        console.error('Error en suscripción de combos:', err);
                        setCombos([]);
                    }
                });
            }
        } catch (error) {
            console.error('Error al configurar suscripción de combos:', error);
            setCombos([]);
        }

        return () => {
            if (subscription) {
                subscription.unsubscribe();
            }
        };
    }, [db, productId]);

    // Agregar combo
    const handleAdd = useCallback(async () => {
        if (!qty || !price || !db || !productId) return;

        setLoading(true);
        try {
            await productRepository.addCombo(db, productId, qty, price);
            setQty(null);
            setPrice(null);
            toast.showSuccess('Combo agregado');
        } catch (e) {
            console.error('Error al agregar combo:', e);
            toast.showError('Error al agregar combo');
        } finally {
            setLoading(false);
        }
    }, [qty, price, db, productId, toast]);

    // Eliminar combo
    const handleDelete = useCallback(async (comboId: string) => {
        if (!db) return;

        try {
            await productRepository.deleteCombo(db, comboId);
            toast.showSuccess('Combo eliminado');
        } catch (e) {
            console.error('Error al eliminar combo:', e);
            toast.showError('Error al eliminar');
        }
    }, [db, toast]);

    // Reset form
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
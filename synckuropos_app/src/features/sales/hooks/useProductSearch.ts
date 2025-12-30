import { useState, useRef } from 'react';
import { useDatabase } from '../../../hooks/useDatabase';
import { useToast } from '../../../hooks/useToast';
import type { Product } from '../types';
import type { AutoCompleteCompleteEvent } from 'primereact/autocomplete';

export const useProductSearch = () => {
    const [suggestions, setSuggestions] = useState<Product[]>([]);
    const db = useDatabase();
    const toast = useToast();

    const searchProducts = async (event: AutoCompleteCompleteEvent) => {
        const query = event.query.trim();

        if (!query) {
            setSuggestions([]);
            return;
        }

        try {
            // regex para buscar por nombre O código
            const results = await db.collections.products.find({
                selector: {
                    $and: [
                        { _deleted: false },
                        { isActive: true },
                        {
                            $or: [
                                { code: { $regex: query, $options: 'i' } },
                                { name: { $regex: query, $options: 'i' } }
                            ]
                        }
                    ]
                },
                limit: 10
            }).exec();

            setSuggestions(results);
        } catch (error) {
            console.error('Error searching products:', error);
            toast.showError('Error al buscar productos');
            setSuggestions([]);
        }
    };

    const findExactByCode = async (code: string): Promise<Product | null> => {
        try {
            const results = await db.collections.products.find({
                selector: {
                    $and: [
                        { _deleted: false },
                        { code: { $eq: code } } // Búsqueda exacta para escáner
                    ]
                }
            }).exec();
            return results.length > 0 ? results[0] : null;
        } catch (error) {
            return null;
        }
    };

    return { suggestions, searchProducts, setSuggestions, findExactByCode };
};
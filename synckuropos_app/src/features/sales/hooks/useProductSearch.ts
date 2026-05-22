import { useState } from 'react';
import { useDatabase } from '../../../hooks/useDatabase';
import { useToast } from '../../../hooks/useToast';
import type { Product } from '../types';
import type { AutoCompleteCompleteEvent } from 'primereact/autocomplete';
import { eq, and, like } from 'drizzle-orm';
import * as schema from '@/db/schema';

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
            const results = await db
                .select()
                .from(schema.products)
                .where(
                    and(
                        eq(schema.products._deleted, false),
                        like(schema.products.name, `%${query}%`)
                    )
                )
                .limit(10);

            setSuggestions(results as Product[]);
        } catch (error) {
            console.error('Error searching products:', error);
            toast.showError('Error al buscar productos');
            setSuggestions([]);
        }
    };

    const findExactByCode = async (code: string): Promise<Product | null> => {
        try {
            const results = await db
                .select()
                .from(schema.products)
                .where(
                    and(
                        eq(schema.products._deleted, false),
                        eq(schema.products.code, code)
                    )
                )
                .limit(1);
            return (results[0] as Product) ?? null;
        } catch (error) {
            return null;
        }
    };

    return { suggestions, searchProducts, setSuggestions, findExactByCode };
};

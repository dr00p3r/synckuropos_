import { useState } from 'react';
import { useDatabase } from '../../../hooks/useDatabase';
import { useToast } from '../../../hooks/useToast';
import type { Product } from '../types';
import type { AutoCompleteCompleteEvent } from 'primereact/autocomplete';
import { useTelemetry } from '@/hooks/useTelemetry';
import { TelemetryEvents } from '@/types/telemetryEvents';

export const useProductSearch = () => {
    const [suggestions, setSuggestions] = useState<Product[]>([]);
    const db = useDatabase();
    const toast = useToast();
    const { logMetric } = useTelemetry();

    const searchProducts = async (event: AutoCompleteCompleteEvent) => {
        const query = event.query.trim();
        const startTime = performance.now();

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

            const durationMs = performance.now() - startTime;
            
            logMetric(TelemetryEvents.PERF_SEARCH_LATENCY, {
                durationMs,
                resultCount: results.length
            });

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
                        { isActive: true },
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
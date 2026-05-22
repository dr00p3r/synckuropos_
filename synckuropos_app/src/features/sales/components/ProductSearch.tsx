import React, { useState, useRef } from 'react';
import { AutoComplete, type AutoCompleteSelectEvent } from 'primereact/autocomplete';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { useProductSearch } from '../hooks/useProductSearch';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import { formatCurrency } from '../../../utils/formatters';

import type { Product } from '../types';

interface ProductSearchProps {
    onProductSelect: (product: Product) => void;
    onClearSale?: () => void;
    hasSaleItems?: boolean;
}

export const ProductSearch: React.FC<ProductSearchProps> = ({ 
    onProductSelect, 
    onClearSale,
    hasSaleItems 
}) => {
    const [query, setQuery] = useState<string>('');
    const { suggestions, searchProducts, findExactByCode, setSuggestions } = useProductSearch();
    const autoCompleteRef = useRef<AutoComplete>(null);

    useBarcodeScanner({
        onScanned: async (code) => {
            const product = await findExactByCode(code);
            if (product) {
                onProductSelect(product);
                setQuery('');
            } else {
                console.warn('Producto escaneado no encontrado');
            }
        }
    });

    const handleSelect = (e: AutoCompleteSelectEvent) => {
        onProductSelect(e.value);
        setQuery('');
        setSuggestions([]);
    };

    const handleChange = (e: { value: string | Product }) => {
        if (typeof e.value === 'string') {
            setQuery(e.value);
        }
    };

    const itemTemplate = (item: Product) => {
        return (
            <div className="flex align-items-center justify-content-between gap-3 p-1">
                <div className="flex flex-column">
                    <span className="font-bold text-900">{item.name}</span>
                    <span className="text-sm text-500">{item.code}</span>
                </div>
                <div className="flex align-items-center gap-2">
                     <Tag severity="success" value={formatCurrency(item.basePrice)} />
                </div>
            </div>
        );
    };

    return (
        <div className="w-full flex align-items-center gap-2"> 
            <div className="p-inputgroup flex-1">
                <span className="p-inputgroup-addon surface-100">
                    <i className="pi pi-search text-500" />
                </span>

                <AutoComplete
                    ref={autoCompleteRef}
                    value={query}
                    suggestions={suggestions}
                    completeMethod={searchProducts}
                    field="name"
                    itemTemplate={itemTemplate}
                    onSelect={handleSelect}
                    onChange={handleChange}
                    placeholder="Escanear o buscar producto..."
                    className="w-full"
                    inputClassName="w-full p-3 font-medium"
                    delay={300}
                    emptyMessage="No se encontraron productos"
                />
            </div>

            {hasSaleItems && onClearSale && (
                <Button 
                    label="Vaciar"
                    icon="pi pi-trash" 
                    severity="danger" 
                    outlined 
                    onClick={onClearSale}
                    tooltip="Vaciar Carrito"
                    tooltipOptions={{ position: 'bottom' }}
                    // Para que no se encoja el botón
                    className="flex-shrink-0" 
                />
            )}
        </div>
    );
};
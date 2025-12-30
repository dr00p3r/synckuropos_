import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputNumber, type InputNumberValueChangeEvent } from 'primereact/inputnumber';
import { useSaleItemsLogic } from '../hooks/useSaleItemsLogic';
import type { SaleItem } from '../../../types/types';
import { formatCurrency } from '../../../utils/formatters';

interface SaleItemsTableProps {
    items: SaleItem[];
    setSaleItems: React.Dispatch<React.SetStateAction<SaleItem[]>>;
}

export const SaleItemsTable: React.FC<SaleItemsTableProps> = ({ items, setSaleItems }) => {
    const { updateItemQuantity, removeItem } = useSaleItemsLogic({ saleItems: items, setSaleItems });
    const priceBodyTemplate = (item: SaleItem) => {
        return formatCurrency(item.unitPrice);
    };

    const totalBodyTemplate = (item: SaleItem) => {
        return formatCurrency(item.totalPrice);
    };

    // Template para editar cantidad (InputNumber directo en la celda)
    const quantityBodyTemplate = (item: SaleItem) => {
        return (
            <InputNumber 
                value={item.quantity} 
                onValueChange={(e: InputNumberValueChangeEvent) => {
                    if (e.value && e.value > 0) {
                        updateItemQuantity(item.productId!, parseFloat(e.value.toString()));
                    }
                }}
                showButtons 
                buttonLayout="horizontal" 
                step={1}
                min={0.01} // Si permites decimales
                inputClassName="w-4rem text-center" 
                decrementButtonClassName="p-button-secondary p-button-text" 
                incrementButtonClassName="p-button-secondary p-button-text"
            />
        );
    };

    // Botón de eliminar
    const actionBodyTemplate = (item: SaleItem) => {
        return (
            <Button 
                icon="pi pi-trash" 
                rounded 
                text 
                severity="danger" 
                aria-label="Eliminar" 
                onClick={() => removeItem(item.productId!)} 
            />
        );
    };

    return (
        <div className="card shadow-1 border-round-xl overflow-hidden h-full bg-white">
            <DataTable 
                value={items} 
                scrollable 
                scrollHeight="flex" 
                emptyMessage="Escanea un producto para comenzar..."
                className="p-datatable-sm"
                stripedRows
            >
                <Column field="name" header="Producto" style={{ minWidth: '200px' }}></Column>
                <Column field="unitPrice" header="Precio" body={priceBodyTemplate} style={{ width: '100px' }}></Column>
                <Column field="quantity" header="Cant." body={quantityBodyTemplate} style={{ width: '160px' }}></Column>
                <Column field="totalPrice" header="Total" body={totalBodyTemplate} style={{ width: '100px', fontWeight: 'bold' }}></Column>
                <Column body={actionBodyTemplate} style={{ width: '50px' }}></Column>
            </DataTable>
        </div>
    );
};
import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputNumber, type InputNumberValueChangeEvent } from 'primereact/inputnumber';
import { Tag } from 'primereact/tag';
import type { SaleItem } from '../../../types/types';
import { formatCurrency } from '../../../utils/formatters';
interface SaleItemsTableProps {
    items: SaleItem[];
    onUpdateQuantity: (productId: string, quantity: number) => void;
    onRemoveItem: (productId: string) => void;
}

export const SaleItemsTable: React.FC<SaleItemsTableProps> = ({ items, onUpdateQuantity, onRemoveItem }) => {

    // Template para mostrar nombre del producto con indicador de combos
    const nameBodyTemplate = (item: SaleItem) => {
        const hasCombos = item.combosApplied && item.combosApplied.length > 0;

        return (
            <div className="flex flex-column gap-1">
                <span>{item.name}</span>
                {hasCombos && (
                    <div className="flex gap-1 flex-wrap">
                        {item.combosApplied!.map((combo, idx) => (
                            <Tag
                                key={idx}
                                icon="pi pi-box"
                                severity="success"
                                value={`${combo.combosUsed}×${combo.comboQuantity} = ${formatCurrency(combo.comboPrice * combo.combosUsed)}`}
                                style={{ fontSize: '0.7rem' }}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    };

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
                        onUpdateQuantity(item.productId, parseFloat(e.value.toString()));
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
                onClick={() => onRemoveItem(item.productId)}
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
                <Column field="name" header="Producto" body={nameBodyTemplate} style={{ minWidth: '200px' }}></Column>
                <Column field="unitPrice" header="Precio" body={priceBodyTemplate} style={{ width: '100px' }}></Column>
                <Column field="quantity" header="Cant." body={quantityBodyTemplate} style={{ width: '160px' }}></Column>
                <Column field="totalPrice" header="Total" body={totalBodyTemplate} style={{ width: '100px', fontWeight: 'bold' }}></Column>
                <Column body={actionBodyTemplate} style={{ width: '50px' }}></Column>
            </DataTable>
        </div>
    );
};
import React, { useState, useMemo } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputSwitch } from 'primereact/inputswitch';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import type { Product } from '@/types/types';
import { formatCurrency } from '../../../utils/formatters';

interface InventoryTableProps {
    products: Product[];
    loading: boolean;
    onEdit: (product: Product) => void;
    onToggleStatus: (product: Product) => void;
    onCreate: () => void;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({ 
    products, loading, onEdit, onToggleStatus, onCreate 
}) => {
    const [globalFilter, setGlobalFilter] = useState('');
    const [showInactive, setShowInactive] = useState(false);

    // --- LOGICA DE FILTRO ---
    const visibleProducts = useMemo(() => {
        let filtered = products;
        if (!showInactive) {
            filtered = filtered.filter(p => p.isActive);
        }
        return filtered;
    }, [products, showInactive]);

    // --- ESTILOS DE FILA (Feedback Visual) ---
    const rowClassName = (data: Product) => {
        return !data.isActive ? 'surface-100 text-500 font-italic' : '';
    };

    // --- TEMPLATES ---
    const nameTemplate = (rowData: Product) => {
        return (
            <div className="flex align-items-center gap-2">
                {!rowData.isActive && <i className="pi pi-ban text-xs" title="Inactivo"></i>}
                <span className="font-medium">{rowData.name}</span>
            </div>
        );
    };

    const priceTemplate = (rowData: Product) => {
        return formatCurrency(rowData.basePrice);
    };

    const stockTemplate = (rowData: Product) => {
        if (!rowData.isActive) return <span>{rowData.stock}</span>;

        let textColor = 'text-900';
        if (rowData.stock <= 5) textColor = 'text-red-500 font-bold';
        else if (rowData.stock <= 20) textColor = 'text-orange-500 font-medium';

        return <span className={textColor}>{rowData.stock}</span>;
    };

    const actionTemplate = (rowData: Product) => (
        <div className="flex gap-2 justify-content-end">
            <Button 
                icon="pi pi-pencil" 
                rounded 
                text 
                severity="info" 
                onClick={() => onEdit(rowData)} 
                tooltip="Editar" 
            />
            <Button 
                icon={rowData.isActive ? "pi pi-eye-slash" : "pi pi-check-circle"} 
                rounded 
                text 
                severity={rowData.isActive ? "danger" : "success"} 
                onClick={() => onToggleStatus(rowData)} 
                tooltip={rowData.isActive ? "Desactivar" : "Reactivar"}
            />
        </div>
    );

    // --- HEADER ---
    const header = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-3">
            <div className="flex align-items-center gap-3 flex-grow-1">
                
                <IconField iconPosition="left">
                    <InputIcon className="pi pi-search" />
                    <InputText 
                        type="search" 
                        onInput={(e) => setGlobalFilter((e.target as HTMLInputElement).value)} 
                        placeholder="Buscar producto..." 
                        className="w-full md:w-20rem pl-5" 
                    />
                </IconField>

                <div className="flex align-items-center gap-2 ml-2">
                    <InputSwitch 
                        inputId="showInactive" 
                        checked={showInactive} 
                        onChange={(e) => setShowInactive(e.value)} 
                    />
                    <label htmlFor="showInactive" className="cursor-pointer select-none text-sm text-600">
                        Mostrar Inactivos
                    </label>
                </div>
            </div>

            <Button label="Nuevo" icon="pi pi-plus" onClick={onCreate} />
        </div>
    );

    return (
        <div className="card shadow-1 p-3 bg-white border-round-xl h-full flex flex-column">
            <DataTable 
                value={visibleProducts} 
                paginator 
                rows={10} 
                rowsPerPageOptions={[5, 10, 25, 50]}
                dataKey="productId"
                filters={{ global: { value: globalFilter, matchMode: 'contains' } }}
                globalFilterFields={['name', 'code']}
                header={header}
                loading={loading}
                emptyMessage="No se encontraron productos."
                className="p-datatable-sm flex-grow-1"
                stripedRows
                rowClassName={rowClassName}
                scrollable
                scrollHeight="flex"
            >
                <Column field="code" header="Código" sortable style={{ minWidth: '100px' }} />
                <Column field="name" header="Nombre" body={nameTemplate} sortable style={{ minWidth: '250px' }} />
                <Column field="basePrice" header="Precio" body={priceTemplate} sortable style={{ minWidth: '100px' }} />
                <Column field="stock" header="Stock" body={stockTemplate} sortable style={{ minWidth: '80px' }} />
                <Column body={actionTemplate} exportable={false} style={{ minWidth: '8rem', textAlign: 'right' }} />
            </DataTable>
        </div>
    );
};
import React, { useState, useMemo } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { InputSwitch } from 'primereact/inputswitch';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { Button } from 'primereact/button';
import type { ProductWithStock } from '../hooks/useInventory';
import { formatCurrency } from '../../../utils/formatters';
import { StatusAction } from '@/components/common/StatusAction';
import { getRowClassName } from '@/utils/tableUtils';
import { PageCard } from '@/components/common/PageCard';

interface InventoryTableProps {
    products: ProductWithStock[];
    loading: boolean;
    onEdit: (product: ProductWithStock) => void;
    onToggleStatus: (product: ProductWithStock) => void;
    onCreate: () => void;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({ 
    products, loading, onEdit, onToggleStatus, onCreate 
}) => {
    const [globalFilter, setGlobalFilter] = useState('');
    const [showInactive, setShowInactive] = useState(false);

    const visibleProducts = useMemo(() => {
        let filtered = products;
        if (!showInactive) {
            filtered = filtered.filter(p => !p._deleted);
        }
        return filtered;
    }, [products, showInactive]);

    const nameTemplate = (rowData: ProductWithStock) => {
        return (
            <div className="flex align-items-center gap-2">
                {rowData._deleted && <i className="pi pi-ban text-xs" title="Inactivo"></i>}
                <span className="font-medium">{rowData.name}</span>
            </div>
        );
    };

    const priceTemplate = (rowData: ProductWithStock) => {
        return formatCurrency(rowData.basePrice);
    };

    const stockTemplate = (rowData: ProductWithStock) => {
        if (rowData._deleted) return <span>{rowData.stock}</span>;

        let textColor = 'text-900';
        if (rowData.stock <= 5) textColor = 'text-red-500 font-bold';
        else if (rowData.stock <= 20) textColor = 'text-orange-500 font-medium';

        return <span className={textColor}>{rowData.stock}</span>;
    };

    const actionTemplate = (rowData: ProductWithStock) => (
        <StatusAction
            onEdit={() => onEdit(rowData)}
            onToggleStatus={() => onToggleStatus(rowData)}
            isActive={!rowData._deleted}
        />
    );

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

            <Button label="Nuevo Producto" icon="pi pi-plus" rounded onClick={onCreate} />
        </div>
    );

    return (
        <PageCard shadow="1" variant="white" padding="1" className="h-full flex flex-column">
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
                className="flex-grow-1"
                size="small"
                stripedRows
                rowClassName={getRowClassName}
                scrollable
                scrollHeight="flex"
            >
                <Column field="code" header="Código" sortable style={{ minWidth: '100px' }} />
                <Column field="name" header="Nombre" body={nameTemplate} sortable style={{ minWidth: '250px' }} />
                <Column field="basePrice" header="Precio" body={priceTemplate} sortable style={{ minWidth: '100px' }} />
                <Column field="stock" header="Stock" body={stockTemplate} sortable style={{ minWidth: '80px' }} />
                <Column body={actionTemplate} exportable={false} style={{ minWidth: '8rem', textAlign: 'right' }} />
            </DataTable>
        </PageCard>
    );
};
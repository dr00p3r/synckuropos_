import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputSwitch } from 'primereact/inputswitch';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { Tag } from 'primereact/tag';
import { formatCurrency } from '@/utils/formatters';
import type { CustomerWithDebt } from '../services/customerRepository';

interface CustomersTableProps {
    customers: CustomerWithDebt[];
    loading: boolean;
    searchTerm: string;
    showOnlyWithDebt: boolean;
    showInactive: boolean;
    onSearchChange: (value: string) => void;
    onShowOnlyWithDebtChange: (value: boolean) => void;
    onShowInactiveChange: (value: boolean) => void;
    onEdit: (customer: CustomerWithDebt) => void;
    onToggleStatus: (customer: CustomerWithDebt) => void;
    onCreate: () => void;
}

export const CustomersTable: React.FC<CustomersTableProps> = ({
    customers,
    loading,
    searchTerm,
    showOnlyWithDebt,
    showInactive,
    onSearchChange,
    onShowOnlyWithDebtChange,
    onShowInactiveChange,
    onEdit,
    onToggleStatus,
    onCreate
}) => {
    // Estilos de fila para inactivos
    const rowClassName = (data: CustomerWithDebt) => {
        return !data.isActive ? 'surface-100 text-500 font-italic' : '';
    };

    // Templates
    const nameTemplate = (rowData: CustomerWithDebt) => (
        <div className="flex align-items-center gap-2">
            {!rowData.isActive && <i className="pi pi-ban text-xs" title="Inactivo"></i>}
            <div className="flex flex-column">
                <span className="font-medium">{rowData.fullname}</span>
                {rowData.email && (
                    <span className="text-xs text-500">{rowData.email}</span>
                )}
            </div>
        </div>
    );

    const phoneTemplate = (rowData: CustomerWithDebt) => (
        <span>{rowData.phone || '-'}</span>
    );

    const creditTemplate = (rowData: CustomerWithDebt) => {
        if (!rowData.allowCredit) {
            return <Tag value="Sin crédito" severity="secondary" />;
        }
        return (
            <div className="flex flex-column">
                <span className="text-sm">Límite: {formatCurrency(rowData.creditLimit)}</span>
            </div>
        );
    };

    const debtTemplate = (rowData: CustomerWithDebt) => {
        if (!rowData.allowCredit) return <span className="text-500">-</span>;
        
        if (rowData.debtTotal === 0) {
            return <Tag value="Sin deuda" severity="success" />;
        }

        // Calcular porcentaje de uso del crédito
        const usagePercent = rowData.creditLimit > 0 
            ? (rowData.debtTotal / rowData.creditLimit) * 100 
            : 0;

        let severity: 'success' | 'warning' | 'danger' = 'success';
        if (usagePercent >= 90) severity = 'danger';
        else if (usagePercent >= 70) severity = 'warning';

        return (
            <div className="flex flex-column gap-1">
                <span className={`font-bold text-${severity === 'danger' ? 'red' : severity === 'warning' ? 'orange' : 'green'}-500`}>
                    {formatCurrency(rowData.debtTotal)}
                </span>
                <span className="text-xs text-500">{usagePercent.toFixed(0)}% usado</span>
            </div>
        );
    };

    const actionTemplate = (rowData: CustomerWithDebt) => (
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

    // Header
    const header = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-3">
            <div className="flex align-items-center gap-3 flex-grow-1 flex-wrap">
                <IconField iconPosition="left">
                    <InputIcon className="pi pi-search" />
                    <InputText
                        type="search"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Buscar cliente..."
                        className="w-full md:w-20rem pl-5"
                    />
                </IconField>

                <div className="flex align-items-center gap-2">
                    <InputSwitch
                        inputId="showDebt"
                        checked={showOnlyWithDebt}
                        onChange={(e) => onShowOnlyWithDebtChange(e.value)}
                    />
                    <label htmlFor="showDebt" className="cursor-pointer select-none text-sm text-600">
                        Con deuda
                    </label>
                </div>

                <div className="flex align-items-center gap-2">
                    <InputSwitch
                        inputId="showInactive"
                        checked={showInactive}
                        onChange={(e) => onShowInactiveChange(e.value)}
                    />
                    <label htmlFor="showInactive" className="cursor-pointer select-none text-sm text-600">
                        Inactivos
                    </label>
                </div>
            </div>

            <Button label="Nuevo Cliente" icon="pi pi-plus" onClick={onCreate} />
        </div>
    );

    return (
        <div className="card shadow-1 p-3 bg-white border-round-xl h-full flex flex-column">
            <DataTable
                value={customers}
                paginator
                rows={10}
                rowsPerPageOptions={[5, 10, 25, 50]}
                dataKey="customerId"
                header={header}
                loading={loading}
                emptyMessage="No se encontraron clientes."
                className="p-datatable-sm flex-grow-1"
                stripedRows
                rowClassName={rowClassName}
                scrollable
                scrollHeight="flex"
            >
                <Column 
                    field="fullname" 
                    header="Cliente" 
                    body={nameTemplate} 
                    sortable 
                    style={{ minWidth: '200px' }} 
                />
                <Column 
                    field="phone" 
                    header="Teléfono" 
                    body={phoneTemplate} 
                    sortable 
                    style={{ minWidth: '120px' }} 
                />
                <Column 
                    header="Crédito" 
                    body={creditTemplate} 
                    style={{ minWidth: '130px' }} 
                />
                <Column 
                    field="debtTotal" 
                    header="Deuda" 
                    body={debtTemplate} 
                    sortable 
                    style={{ minWidth: '120px' }} 
                />
                <Column 
                    body={actionTemplate} 
                    exportable={false} 
                    style={{ minWidth: '8rem', textAlign: 'right' }} 
                />
            </DataTable>
        </div>
    );
};
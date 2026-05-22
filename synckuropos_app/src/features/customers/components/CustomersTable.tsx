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
import { StatusAction } from '@/components/common/StatusAction';
import { getRowClassName } from '@/utils/tableUtils';
import { PageCard } from '@/components/common/PageCard';
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

const DEBT_COLOR_CLASS: Record<string, string> = {
    danger: 'text-red-500',
    warning: 'text-orange-500',
    success: 'text-green-500',
};

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
    const nameTemplate = (rowData: CustomerWithDebt) => (
        <div className="flex align-items-center gap-2">
            {rowData._deleted && <i className="pi pi-ban text-xs" title="Inactivo"></i>}
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

        const usagePercent = rowData.creditLimit > 0 
            ? (rowData.debtTotal / rowData.creditLimit) * 100 
            : 0;

        let severity: 'success' | 'warning' | 'danger' = 'success';
        if (usagePercent >= 90) severity = 'danger';
        else if (usagePercent >= 70) severity = 'warning';

        return (
            <div className="flex flex-column gap-1">
                <span className={`font-bold ${DEBT_COLOR_CLASS[severity]}`}>
                    {formatCurrency(rowData.debtTotal)}
                </span>
                <span className="text-xs text-500">{usagePercent.toFixed(0)}% usado</span>
            </div>
        );
    };

    const actionTemplate = (rowData: CustomerWithDebt) => (
        <StatusAction
            onEdit={() => onEdit(rowData)}
            onToggleStatus={() => onToggleStatus(rowData)}
            isActive={!rowData._deleted}
        />
    );

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

            <Button label="Nuevo Cliente" icon="pi pi-user-plus" rounded onClick={onCreate} />
        </div>
    );

    return (
        <PageCard shadow="1" variant="white" padding="1" className="h-full flex flex-column">
            <DataTable
                value={customers}
                paginator
                rows={10}
                rowsPerPageOptions={[5, 10, 25, 50]}
                dataKey="customerId"
                header={header}
                loading={loading}
                emptyMessage="No se encontraron clientes."
                className="flex-grow-1"
                size="small"
                stripedRows
                rowClassName={getRowClassName}
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
        </PageCard>
    );
};
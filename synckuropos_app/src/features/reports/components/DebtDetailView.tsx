import React, { useState, useMemo } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Calendar } from 'primereact/calendar';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Skeleton } from 'primereact/skeleton';
import { useDebtReport } from '../hooks/useDebtReport';
import { DateRangeFooter } from './DateRangeFooter';
import type { DebtTransaction } from '../types';
import { formatCurrency } from '@/utils/formatters';
import { EmptyState } from '@/components/common/EmptyState';

interface KPICardsProps {
    loading: boolean;
    reportData: any;
}

const KPICards: React.FC<KPICardsProps> = ({ loading, reportData }) => {
    if (loading || !reportData) {
        return (
            <div className="grid">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="col-6 p-1">
                        <Card className="h-full"><Skeleton height="4rem" /></Card>
                    </div>
                ))}
            </div>
        );
    }

    const kpis = [
        { label: 'Saldo Inicial', value: reportData.openingBalance, color: '#6366F1', icon: 'pi pi-calendar-minus' },
        { label: 'Total Fiado', value: reportData.totalCredited, color: 'var(--color-warning)', icon: 'pi pi-arrow-up' },
        { label: 'Total Abonado', value: reportData.totalPaid, color: 'var(--color-success)', icon: 'pi pi-arrow-down' },
        { label: 'Saldo Final', value: reportData.closingBalance, color: reportData.closingBalance > 0 ? 'var(--color-danger)' : 'var(--color-success)', icon: 'pi pi-wallet' },
    ];

    return (
        <div className="grid">
            {kpis.map((kpi) => (
                <div key={kpi.label} className="col-6 p-1">
                    <Card className="h-full border-round-xl shadow-1" pt={{ body: { className: 'p-3' } }}>
                        <div className="flex align-items-center justify-content-between mb-2">
                            <span className="text-sm font-medium text-500">{kpi.label}</span>
                            <i className={kpi.icon} style={{ color: kpi.color }} />
                        </div>
                        <span className="text-xl font-bold" style={{ color: kpi.color }}>
                            {formatCurrency(kpi.value)}
                        </span>
                    </Card>
                </div>
            ))}
        </div>
    );
};

export const DebtDetailView: React.FC = () => {
    const {
        loading,
        reportData,
        customerOptions,
        selectedCustomerId,
        setSelectedCustomerId,
        dateRange,
        setDateRange
    } = useDebtReport();

    const [expandedRows, setExpandedRows] = useState<Record<string, boolean> | null>(null);

    const flattenedEntries = useMemo(() => {
        if (!reportData) return [];
        return reportData.dailyData.flatMap((day) =>
            day.transactions.map((t) => ({
                ...t,
                dateGroup: day.date,
                dayCredited: day.credited,
                dayPaid: day.paid,
                runningDebt: day.runningDebt
            }))
        );
    }, [reportData]);

    const rowExpansionTemplate = (data: DebtTransaction & { dateGroup: string; dayCredited: number; dayPaid: number; runningDebt: number }) => {
        if (data.type === 'SALE' && data.products && data.products.length > 0) {
            return (
                <div className="p-3 surface-50 border-round-lg">
                    <div className="flex align-items-center gap-3 mb-3">
                        <i className="pi pi-clock text-500" />
                        <span className="text-lg font-semibold text-700">{data.time}</span>
                        <Tag value={data.userName} severity="info" />
                    </div>
                    <h5 className="mt-0 mb-2 text-700 font-semibold">Productos de la venta a crédito</h5>
                    <DataTable value={data.products} size="small" className="p-datatable-sm">
                        <Column field="name" header="Producto" style={{ width: '40%' }} />
                        <Column field="quantity" header="Cant." className="text-right" />
                        <Column
                            field="unitPrice"
                            header="P. Unit"
                            body={(d: { unitPrice: number }) => formatCurrency(d.unitPrice)}
                            className="text-right"
                        />
                        <Column
                            field="lineTotal"
                            header="Subtotal"
                            body={(d: { lineTotal: number }) => (
                                <span className="font-semibold text-900">{formatCurrency(d.lineTotal)}</span>
                            )}
                            className="text-right"
                        />
                    </DataTable>
                </div>
            );
        }

        return (
            <div className="p-3 surface-50 border-round-lg">
                <div className="flex align-items-center gap-3">
                    <i className="pi pi-money-bill text-green-500 text-xl" />
                    <div>
                        <span className="text-lg font-semibold text-700">{data.time}</span>
                        <span className="mx-2 text-400">|</span>
                        <Tag value={data.userName} severity="success" />
                    </div>
                    <span className="ml-auto font-bold text-green-600 text-lg">
                        {formatCurrency(data.amount)}
                    </span>
                </div>
            </div>
        );
    };

    const headerTemplate = (data: DebtTransaction & { dateGroup: string; dayCredited: number; dayPaid: number; runningDebt: number }) => (
        <div className="flex align-items-center justify-content-between py-2 px-3 surface-100 border-round-lg">
            <span className="font-semibold text-900">{data.dateGroup}</span>
            <div className="flex align-items-center gap-3 text-sm">
                <span className="text-orange-600 font-medium">
                    <i className="pi pi-arrow-up mr-1" />Fiado: {formatCurrency(data.dayCredited)}
                </span>
                <span className="text-green-600 font-medium">
                    <i className="pi pi-arrow-down mr-1" />Abonado: {formatCurrency(data.dayPaid)}
                </span>
                <span
                    className="font-bold px-2 py-1 border-round"
                    style={{
                        backgroundColor: data.runningDebt > 0 ? 'var(--color-danger-light)' : 'var(--color-success-light)',
                        color: data.runningDebt > 0 ? 'var(--color-danger)' : 'var(--color-success)'
                    }}
                >
                    Saldo: {formatCurrency(data.runningDebt)}
                </span>
            </div>
        </div>
    );

    const typeBodyTemplate = (row: DebtTransaction) => {
        if (row.type === 'SALE') {
            return <Tag value="Fiado" severity="warning" />;
        }
        return <Tag value="Abono" severity="success" />;
    };

    const amountBodyTemplate = (row: DebtTransaction) => {
        const color = row.type === 'SALE' ? 'text-orange-600' : 'text-green-600';
        const prefix = row.type === 'SALE' ? '' : '-';
        return <span className={`font-semibold ${color}`}>{prefix}{formatCurrency(row.amount)}</span>;
    };

    return (
        <div className="grid h-full m-0 overflow-hidden">
            <div className="col-12 md:col-4 h-full p-3 flex flex-column gap-3">
                <KPICards loading={loading} reportData={reportData} />

                <Card className="shadow-1 border-round-xl" pt={{ body: { className: 'p-3' } }}>
                    <div className="flex flex-column gap-3">
                                <div className="flex flex-column gap-1">
                                    <label htmlFor="debtCustomer" className="text-sm font-semibold text-700">Cliente</label>
                                    <Dropdown
                                        id="debtCustomer"
                                        value={selectedCustomerId}
                                        onChange={(e) => setSelectedCustomerId(e.value as string)}
                                        options={customerOptions}
                                        placeholder="Seleccionar cliente con deuda"
                                        showClear
                                        filter
                                        filterPlaceholder="Buscar cliente..."
                                        className="w-full text-sm"
                                        emptyMessage="No hay clientes con deudas activas"
                                    />
                                </div>
                                <div className="flex flex-column gap-1">
                                    <label htmlFor="debtDateRange" className="text-sm font-semibold text-700">Rango de Fechas</label>
                                    <Calendar
                                        id="debtDateRange"
                                        value={dateRange}
                                        onChange={(e) => setDateRange(e.value as [Date, Date])}
                                        selectionMode="range"
                                        readOnlyInput
                                        showIcon
                                        dateFormat="dd/mm/yy"
                                        placeholder="Seleccionar rango"
                                        footerTemplate={() => (
                                            <DateRangeFooter
                                                onRangeChange={(newRange: React.SetStateAction<[Date, Date]>) => setDateRange(newRange)}
                                            />
                                        )}
                                        className="w-full"
                                        inputClassName="text-sm"
                                    />
                                </div>
                    </div>
                </Card>
            </div>

            <div className="col-12 md:col-8 h-full p-3 pl-0 md:pl-0">
                <div className="surface-card shadow-1 border-round-xl h-full flex flex-column overflow-hidden">
                    <div className="p-3 border-bottom-1 surface-border flex justify-content-between align-items-center flex-none">
                        <div>
                            <h3 className="m-0 font-semibold text-xl text-900">
                                {reportData ? `Historial de ${reportData.customerName}` : 'Historial de Fiado'}
                            </h3>
                            <p className="m-0 mt-1 text-sm text-600">
                                {flattenedEntries.length} {flattenedEntries.length === 1 ? 'movimiento' : 'movimientos'}
                            </p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
                        {!selectedCustomerId && !loading ? (
                            <EmptyState icon="pi pi-user-plus" title="Selecciona un cliente" description="Elige un cliente con deudas activas para ver su historial" />
                        ) : flattenedEntries.length === 0 && !loading ? (
                            <EmptyState icon="pi pi-inbox" title="Sin movimientos" description="No hay fiados ni abonos en el rango seleccionado" />
                        ) : (
                            <DataTable
                                value={flattenedEntries}
                                expandedRows={expandedRows as any}
                                onRowToggle={(e: any) => setExpandedRows(e.data)}
                                rowExpansionTemplate={rowExpansionTemplate}
                                dataKey="id"
                                rowGroupMode="subheader"
                                groupRowsBy="dateGroup"
                                rowGroupHeaderTemplate={headerTemplate}
                                scrollable
                                scrollHeight="100%"
                                className="h-full"
                                loading={loading}
                                stripedRows
                            >
                                <Column expander style={{ width: '3rem' }} />
                                <Column
                                    field="time"
                                    header="Hora"
                                    style={{ width: '90px' }}
                                />
                                <Column field="userName" header="Registrado por" />
                                <Column
                                    field="type"
                                    header="Tipo"
                                    body={typeBodyTemplate}
                                    style={{ width: '100px' }}
                                />
                                <Column
                                    field="amount"
                                    header="Monto"
                                    body={amountBodyTemplate}
                                    className="text-right"
                                    style={{ width: '140px' }}
                                />
                            </DataTable>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
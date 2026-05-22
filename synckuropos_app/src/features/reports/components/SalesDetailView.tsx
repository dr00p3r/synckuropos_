import React, { useState, useMemo } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Calendar } from 'primereact/calendar';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { Chart } from 'primereact/chart';
import { Skeleton } from 'primereact/skeleton';
import { Button } from 'primereact/button';
import { useSalesReport } from '../hooks/useSalesReport';
import { DateRangeFooter } from './DateRangeFooter';
import type { SaleWithDetails } from '../types';
import { formatCurrency } from '@/utils/formatters';
import { createChartOptions } from '../utils/chartConfig';
import { EmptyState } from '@/components/common/EmptyState';

interface KPICardProps {
    loading: boolean;
    totalRevenue: number;
    totalTransactions: number;
}

const KPICard: React.FC<KPICardProps> = ({ loading, totalRevenue, totalTransactions }) => {
    if (loading) {
        return (
            <Card className="shadow-1 border-round-xl bg-primary h-full">
                <Skeleton height="2rem" className="mb-2" />
                <Skeleton height="3rem" className="mb-2" />
                <Skeleton width="6rem" height="1rem" />
            </Card>
        );
    }

    return (
        <Card className="shadow-1 border-round-xl bg-primary h-full">
            <div className="flex flex-column gap-2">
                <span className="text-primary-50 text-base font-medium">Ingresos Totales</span>
                <span className="text-primary-50 text-5xl font-bold">
                    {formatCurrency(totalRevenue)}
                </span>
                <div className="flex align-items-center gap-2 mt-1">
                    <i className="pi pi-receipt text-primary-100 text-base"></i>
                    <span className="text-primary-100 text-base font-medium">
                        {totalTransactions} transacciones
                    </span>
                </div>
            </div>
        </Card>
    );
};

export const SalesDetailView: React.FC = () => {
    const { 
        loading, reportData, dateRange, setDateRange, 
        selectedUserId, setSelectedUserId, userOptions 
    } = useSalesReport();

    const [expandedRows, setExpandedRows] = useState<any>(null);

    const flattenedSales = useMemo(() => {
        return reportData.dailyData.flatMap((day: { sales: any[]; date: any; totalAmount: any; }) => 
            day.sales.map(sale => ({ ...sale, dateGroup: day.date, dayTotal: day.totalAmount }))
        );
    }, [reportData]);

    const rowExpansionTemplate = (data: SaleWithDetails) => {
        return (
            <div className="p-3 surface-50 border-round-lg">
                <h5 className="mt-0 mb-3 text-700 font-semibold">Detalle de Productos</h5>
                <DataTable value={data.details} size="small" className="p-datatable-sm">
                    <Column field="productName" header="Producto" style={{ width: '40%' }}></Column>
                    <Column field="quantity" header="Cant." className="text-right"></Column>
                    <Column 
                        field="unitPrice" 
                        header="P. Unit" 
                        body={(d) => formatCurrency(d.unitPrice)} 
                        className="text-right"
                    ></Column>
                    <Column 
                        field="taxAmount" 
                        header="Impuesto" 
                        body={(d) => formatCurrency(d.taxAmount)} 
                        className="text-right"
                    ></Column>
                    <Column 
                        field="lineTotal" 
                        header="Subtotal" 
                        body={(d) => <span className="font-semibold text-900">{formatCurrency(d.lineTotal)}</span>} 
                        className="text-right"
                    ></Column>
                </DataTable>
            </div>
        );
    };

    const headerTemplate = (data: any) => (
        <div className="flex align-items-center justify-content-between py-2 px-3 surface-100 border-round-lg">
            <span className="font-semibold text-900">{data.dateGroup}</span>
            <span className="font-semibold text-primary">Total: {formatCurrency(data.dayTotal)}</span>
        </div>
    );

    const chartOptions = createChartOptions({
        plugins: {
            tooltip: {
                callbacks: {
                    label: (context: any) => `Ventas: ${formatCurrency(context.parsed.y)}`
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { 
                    callback: (value: number) => `$${(value / 1000).toFixed(0)}k`
                }
            }
        }
    });

    return (
        <div className="grid h-full m-0 overflow-hidden">
            
            {/* PANEL IZQUIERDO */}
            <div className="col-12 md:col-5 lg:col-6 h-full p-3 flex flex-column gap-3">
                
                {/* SECCIÓN SUPERIOR: KPI y Filtros */}
                <div className="grid formgrid m-0 flex-none">
                    
                    {/* KPI */}
                    <div className="col-12 sm:col-5 p-0 pr-0 sm:pr-2 mb-2 sm:mb-0">
                        <KPICard loading={loading} totalRevenue={reportData.totalRevenue} totalTransactions={reportData.totalTransactions} />
                    </div>

                    {/* Filtros */}
                    <div className="col-12 sm:col-7 p-0">
                        <Card className="shadow-1 border-round-xl h-full" pt={{ body: { className: 'p-3' } }}>
                            <div className="flex flex-column gap-3">
                                <div className="flex flex-column gap-1">
                                    <label htmlFor="dateRange" className="text-sm font-semibold text-700">Rango de Fechas</label>
                                    <Calendar 
                                        id="dateRange"
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
                                <div className="flex flex-column gap-1">
                                    <label htmlFor="cashier" className="text-sm font-semibold text-700">Cajero</label>
                                    <Dropdown 
                                        id="cashier"
                                        value={selectedUserId}
                                        onChange={(e) => setSelectedUserId(e.value)} 
                                        options={userOptions} 
                                        placeholder="Todos los cajeros"
                                        showClear
                                        className="w-full text-sm"
                                    />
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* SECCIÓN INFERIOR: Gráfico */}
                <div 
                    className="surface-card shadow-1 border-round-xl flex-1 overflow-hidden flex-scroll-container" 
                >
                    <div className="px-3 pt-3 pb-2 border-bottom-1 surface-border flex-shrink-0">
                        <h3 className="m-0 text-900 font-semibold text-lg">Tendencia Diaria</h3>
                        <p className="m-0 mt-1 text-600 text-sm">Evolución de ventas por día</p>
                    </div>
                    
                    <div className="flex-1 p-3 flex-scroll-container">
                        {loading ? (
                            <Skeleton height="100%" />
                        ) : reportData.dailyData.length > 0 ? (
                            <div style={{ flex: 1, minHeight: 0 }}>
                                <Chart 
                                    type="bar" 
                                    data={reportData.chartData} 
                                    options={chartOptions} 
                                    height="100%"
                                />
                            </div>
                        ) : (
                            <EmptyState icon="pi pi-chart-bar" iconSize="sm" title="No hay datos para mostrar" description="Ajusta los filtros para ver resultados" />
                        )}
                    </div>
                </div>
            </div>

            {/* PANEL DERECHO */}
            <div className="col-12 md:col-7 lg:col-6 h-full p-3 pl-0 md:pl-0">
                
                <div className="surface-card shadow-1 border-round-xl h-full flex flex-column overflow-hidden">
                    
                    {/* Header */}
                    <div className="p-3 border-bottom-1 surface-border flex justify-content-between align-items-center flex-none">
                        <div>
                            <h3 className="m-0 font-semibold text-xl text-900">Detalle de Transacciones</h3>
                            <p className="m-0 mt-1 text-sm text-600">
                                {flattenedSales.length} {flattenedSales.length === 1 ? 'registro' : 'registros'}
                            </p>
                        </div>
                        {flattenedSales.length > 0 && (
                            <Button label="Exportar" icon="pi pi-download" text size="small" className="text-primary p-button-sm" />
                        )}
                    </div>

                    {/* Tabla con estado vacío */}
                    <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
                        {flattenedSales.length === 0 && !loading ? (
                            <EmptyState icon="pi pi-inbox" title="No hay transacciones" description="Prueba ajustando los filtros o seleccionando otro rango de fechas" />
                        ) : (
                            <DataTable 
                                value={flattenedSales}
                                expandedRows={expandedRows}
                                onRowToggle={(e) => setExpandedRows(e.data)}
                                rowExpansionTemplate={rowExpansionTemplate}
                                dataKey="saleId"
                                
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
                                    field="createdAt" 
                                    header="Hora" 
                                    body={(d) => (
                                        <span suppressHydrationWarning>
                                            {new Date(d.createdAt).toLocaleTimeString('es-EC', { 
                                                hour: '2-digit', 
                                                minute: '2-digit',
                                                hour12: false
                                            })}
                                        </span>
                                    )}
                                    style={{ width: '100px' }}
                                />
                                <Column field="userId" header="Vendido Por" />
                                <Column 
                                    field="totalAmount" 
                                    header="Total"
                                    body={(d) => <span className="font-semibold">{formatCurrency(d.totalAmount)}</span>} 
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
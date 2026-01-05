import React, { useState, useMemo } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Calendar } from 'primereact/calendar';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { Chart } from 'primereact/chart';
import { Skeleton } from 'primereact/skeleton';
import { useSalesReport } from '../hooks/useSalesReport';
import { DateRangeFooter } from './DateRangeFooter';
import type { SaleWithDetails } from '../types';
import { formatCurrency } from '@/utils/formatters';

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
            <div className="p-3 surface-50 border-round-lg"
            >
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

    const chartOptions = {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
            legend: { 
                labels: { 
                    color: '#64748b',
                    font: { size: 12, weight: '500' }
                } 
            },
            tooltip: {
                callbacks: {
                    label: (context: any) => `Ventas: ${formatCurrency(context.parsed.y)}`
                }
            }
        },
        scales: {
            x: { 
                ticks: { color: '#64748b', font: { size: 11 } }, 
                grid: { color: '#e2e8f0', drawBorder: false } 
            },
            y: { 
                ticks: { 
                    color: '#64748b',
                    font: { size: 11 },
                    callback: (value: number) => `$${(value / 1000).toFixed(0)}k`
                }, 
                grid: { color: '#e2e8f0', drawBorder: false } 
            }
        }
    };

    // KPI Card Component
    const KPICard = () => {
        if (loading) {
            return (
                <Card className="shadow-2 border-round-xl bg-primary h-full">
                    <Skeleton height="2rem" className="mb-2" />
                    <Skeleton height="3rem" className="mb-2" />
                    <Skeleton width="6rem" height="1rem" />
                </Card>
            );
        }

        return (
            <Card className="shadow-2 border-round-xl bg-primary h-full">
                <div className="flex flex-column gap-2">
                    <span className="text-primary-50 text-base font-medium">Ingresos Totales</span>
                    <span className="text-primary-50 text-5xl font-bold">
                        {formatCurrency(reportData.totalRevenue)}
                    </span>
                    <div className="flex align-items-center gap-2 mt-1">
                        <i className="pi pi-receipt text-primary-100 text-base"></i>
                        <span className="text-primary-100 text-base font-medium">
                            {reportData.totalTransactions} transacciones
                        </span>
                    </div>
                </div>
            </Card>
        );
    };

    return (
        <div className="grid h-full m-0">
            
            {/* PANEL IZQUIERDO */}
            <div className="col-12 md:col-5 lg:col-6 h-full p-3 flex flex-column gap-3">
                
                {/* SECCIÓN SUPERIOR: KPI y Filtros */}
                <div className="grid formgrid m-0 flex-none">
                    
                    {/* KPI */}
                    <div className="col-12 sm:col-5 p-0 pr-0 sm:pr-2 mb-2 sm:mb-0">
                        <KPICard />
                    </div>

                    {/* Filtros */}
                    <div className="col-12 sm:col-7 p-0">
                        <Card className="shadow-1 border-round-xl h-full" pt={{ body: { className: 'p-3' } }}>
                            <div className="flex flex-column gap-3">
                                <div className="flex flex-column gap-1">
                                    <label className="text-sm font-semibold text-700">Rango de Fechas</label>
                                    <Calendar 
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
                                    <label className="text-sm font-semibold text-700">Cajero</label>
                                    <Dropdown 
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

                {/* SECCIÓN INFERIOR: Gráfico - OCUPA TODO EL ESPACIO RESTANTE */}
                <div 
                    className="surface-card shadow-1 border-round-xl flex-1 overflow-hidden" 
                    style={{ minHeight: 0, display: 'flex', flexDirection: 'column' }}
                >
                    <div className="px-3 pt-3 pb-2 border-bottom-1 surface-border flex-shrink-0">
                        <h3 className="m-0 text-900 font-semibold text-lg">Tendencia Diaria</h3>
                        <p className="m-0 mt-1 text-600 text-sm">Evolución de ventas por día</p>
                    </div>
                    
                    <div className="flex-1 p-3" style={{ minHeight: 0, display: 'flex', flexDirection: 'column' }}>
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
                            <div className="flex flex-column align-items-center justify-content-center h-full gap-3">
                                <i className="pi pi-chart-bar text-400" style={{ fontSize: '3rem' }}></i>
                                <div className="text-center">
                                    <div className="text-600 text-base font-medium mb-1">No hay datos para mostrar</div>
                                    <div className="text-500 text-sm">Ajusta los filtros para ver resultados</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* PANEL DERECHO */}
            <div className="col-12 md:col-7 lg:col-6 h-full p-3 pl-0 md:pl-0">
                
                <div className="surface-card shadow-2 border-round-xl h-full flex flex-column overflow-hidden">
                    
                    {/* Header */}
                    <div className="p-3 border-bottom-1 surface-border flex justify-content-between align-items-center flex-none">
                        <div>
                            <h3 className="m-0 font-semibold text-xl text-900">Detalle de Transacciones</h3>
                            <p className="m-0 mt-1 text-sm text-600">
                                {flattenedSales.length} {flattenedSales.length === 1 ? 'registro' : 'registros'}
                            </p>
                        </div>
                        {flattenedSales.length > 0 && (
                            <button className="p-button p-button-text p-button-sm text-primary">
                                <i className="pi pi-download mr-2"></i>
                                Exportar
                            </button>
                        )}
                    </div>

                    {/* Tabla con estado vacío que llena el contenedor */}
                    <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
                        {flattenedSales.length === 0 && !loading ? (
                            <div className="flex flex-column align-items-center justify-content-center h-full gap-3 px-4">
                                <i className="pi pi-inbox text-400" style={{ fontSize: '4rem' }}></i>
                                <div className="text-center">
                                    <div className="text-700 text-lg font-semibold mb-2">No hay transacciones</div>
                                    <div className="text-600 text-sm">Prueba ajustando los filtros o seleccionando otro rango de fechas</div>
                                </div>
                            </div>
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
                                    body={(d) => new Date(d.createdAt).toLocaleTimeString('es-EC', { 
                                        hour: '2-digit', 
                                        minute: '2-digit',
                                        hour12: false
                                    })}
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
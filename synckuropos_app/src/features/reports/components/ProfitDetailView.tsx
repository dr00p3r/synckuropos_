import React, { useState, useMemo } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Calendar } from 'primereact/calendar';
import { Card } from 'primereact/card';
import { AutoComplete } from 'primereact/autocomplete';
import { Chart } from 'primereact/chart';
import { Skeleton } from 'primereact/skeleton';
import { DateRangeFooter } from './DateRangeFooter';
import { Tag } from 'primereact/tag';
import { useProfitReport } from '../hooks/useProfitReport';
import { formatCurrency } from '@/utils/formatters';

export const ProfitDetailView: React.FC = () => {
    const { 
        loading, reportData, dateRange, setDateRange, 
        selectedProducts, setSelectedProducts, searchProducts 
    } = useProfitReport();

    const [filteredProducts, setFilteredProducts] = useState<any[]>([]);

    // --- AGRUPAR MOVIMIENTOS POR FECHA ---
    const groupedMovements = useMemo(() => {
        const groups: Record<string, any[]> = {};
        reportData.movements.forEach((mov: any) => {
            const dateKey = new Date(mov.date).toLocaleDateString('es-EC', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit' 
            });
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(mov);
        });
        return groups;
    }, [reportData.movements]);

    const flattenedMovements = useMemo(() => {
        return Object.entries(groupedMovements).flatMap(([date, movements]) => {
            const dayTotal = movements.reduce((sum: number, m: any) => 
                sum + (m.type === 'SALE' ? m.totalValue : -m.totalValue), 0
            );
            return movements.map(mov => ({ ...mov, dateGroup: date, dayTotal }));
        });
    }, [groupedMovements]);

    // --- MANEJO DE AUTOCOMPLETE ---
    const handleSearch = async (event: { query: string }) => {
        const results = await searchProducts(event.query);
        setFilteredProducts(results);
    };

    // --- TEMPLATES TABLA ---
    const typeBody = (d: any) => (
        <Tag 
            value={d.type === 'SALE' ? 'Venta' : 'Compra'} 
            severity={d.type === 'SALE' ? 'success' : 'danger'} 
            icon={d.type === 'SALE' ? 'pi pi-arrow-up-right' : 'pi pi-arrow-down-left'}
        />
    );

    const headerTemplate = (data: any) => {
        const profitColor = data.dayTotal >= 0 ? 'text-green-600' : 'text-red-600';
        return (
            <div className="flex align-items-center justify-content-between py-2 px-3 surface-100 border-round-lg">
                <span className="font-semibold text-900">{data.dateGroup}</span>
                <span className={`font-semibold ${profitColor}`}>
                    Balance: {formatCurrency(data.dayTotal)}
                </span>
            </div>
        );
    };

    // --- OPCIONES GRÁFICO ---
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
                    label: (context: any) => `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`
                }
            }
        },
        scales: {
            x: { 
                stacked: false,
                ticks: { color: '#64748b', font: { size: 11 } }, 
                grid: { color: '#e2e8f0', drawBorder: false } 
            },
            y: { 
                beginAtZero: true,
                ticks: { 
                    color: '#64748b',
                    font: { size: 11 },
                    callback: (value: number) => `$${(value / 1000).toFixed(0)}k`
                }, 
                grid: { color: '#e2e8f0', drawBorder: false } 
            }
        }
    };

    // --- KPI CARD COMPONENT ---
    const ROICard = () => {
        if (loading) {
            return (
                <Card className="shadow-2 border-round-xl bg-gray-900 h-full">
                    <Skeleton height="2rem" className="mb-2" />
                    <Skeleton height="3rem" className="mb-3" />
                    <Skeleton height="1rem" className="mb-2" />
                    <Skeleton height="1rem" />
                </Card>
            );
        }

        return (
            <Card className="shadow-2 border-round-xl bg-gray-900 h-full">
                <div className="flex flex-column gap-3">
                    <div className="flex justify-content-between align-items-start">
                        <div>
                            <span className="text-gray-400 text-sm font-medium">Ganancia Neta</span>
                            <div className={`text-5xl font-bold mt-1 ${reportData.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {formatCurrency(reportData.netProfit)}
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-gray-400 text-sm font-medium">ROI</span>
                            <div className={`text-3xl font-bold mt-1 ${reportData.roi >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
                                {reportData.roi.toFixed(1)}%
                            </div>
                        </div>
                    </div>
                    
                    {/* Mini barra visual de proporción */}
                    <div className="flex gap-1 h-1rem w-full border-round overflow-hidden surface-800">
                        <div 
                            style={{ flex: reportData.totalRevenue || 1 }} 
                            className="bg-green-500 h-full" 
                            title={`Ventas: ${formatCurrency(reportData.totalRevenue)}`}
                        />
                        <div 
                            style={{ flex: reportData.totalInvested || 1 }} 
                            className="bg-red-500 h-full"
                            title={`Inversión: ${formatCurrency(reportData.totalInvested)}`}
                        />
                    </div>
                    <div className="flex justify-content-between text-xs text-gray-300">
                        <span>Vendido: {formatCurrency(reportData.totalRevenue)}</span>
                        <span>Invertido: {formatCurrency(reportData.totalInvested)}</span>
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
                        <ROICard />
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
                                    <label className="text-sm font-semibold text-700">Productos</label>
                                    <AutoComplete 
                                        value={selectedProducts} 
                                        suggestions={filteredProducts} 
                                        completeMethod={handleSearch} 
                                        field="label" 
                                        multiple
                                        onChange={(e) => setSelectedProducts(e.value)}
                                        placeholder="Buscar productos..."
                                        className="w-full"
                                        inputClassName="text-sm"
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
                        <h3 className="m-0 text-900 font-semibold text-lg">Flujo de Caja</h3>
                        <p className="m-0 mt-1 text-600 text-sm">Comparativa de ingresos vs gastos</p>
                    </div>
                    
                    <div className="flex-1 p-3" style={{ minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                        {loading ? (
                            <Skeleton height="100%" />
                        ) : reportData.movements.length > 0 ? (
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
                                <i className="pi pi-chart-line text-400" style={{ fontSize: '3rem' }}></i>
                                <div className="text-center">
                                    <div className="text-600 text-base font-medium mb-1">No hay movimientos</div>
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
                            <h3 className="m-0 font-semibold text-xl text-900">Movimientos de Inventario</h3>
                            <p className="m-0 mt-1 text-sm text-600">
                                {flattenedMovements.length} {flattenedMovements.length === 1 ? 'operación' : 'operaciones'}
                            </p>
                        </div>
                        {flattenedMovements.length > 0 && (
                            <button className="p-button p-button-text p-button-sm text-primary">
                                <i className="pi pi-download mr-2"></i>
                                Exportar
                            </button>
                        )}
                    </div>

                    {/* Tabla con agrupamiento por fecha */}
                    <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
                        {flattenedMovements.length === 0 && !loading ? (
                            <div className="flex flex-column align-items-center justify-content-center h-full gap-3 px-4">
                                <i className="pi pi-inbox text-400" style={{ fontSize: '4rem' }}></i>
                                <div className="text-center">
                                    <div className="text-700 text-lg font-semibold mb-2">No hay movimientos</div>
                                    <div className="text-600 text-sm">Prueba ajustando los filtros o seleccionando otro rango de fechas</div>
                                </div>
                            </div>
                        ) : (
                            <DataTable 
                                value={flattenedMovements}
                                dataKey="id"
                                
                                rowGroupMode="subheader" 
                                groupRowsBy="dateGroup" 
                                rowGroupHeaderTemplate={headerTemplate}
                                
                                scrollable 
                                scrollHeight="100%"
                                className="h-full"
                                
                                loading={loading}
                                stripedRows
                                size="small"
                                sortField="date"
                                sortOrder={-1}
                            >
                                <Column 
                                    field="date" 
                                    header="Hora" 
                                    body={(d) => new Date(d.date).toLocaleTimeString('es-EC', { 
                                        hour: '2-digit', 
                                        minute: '2-digit',
                                        hour12: false
                                    })}
                                    style={{ width: '100px' }} 
                                />
                                <Column 
                                    field="productName" 
                                    header="Producto" 
                                />
                                <Column 
                                    header="Tipo" 
                                    body={typeBody} 
                                    style={{ width: '120px' }} 
                                />
                                <Column 
                                    field="quantity" 
                                    header="Cant." 
                                    className="text-right" 
                                    style={{ width: '80px' }} 
                                />
                                <Column 
                                    field="totalValue" 
                                    header="Total" 
                                    body={(d) => <span className="font-semibold">{formatCurrency(d.totalValue)}</span>} 
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
import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { SalesDetailView } from './SalesDetailView';
import { ProfitDetailView } from './ProfitDetailView';
import { DebtDetailView } from './DebtDetailView';

// Actualizamos los tipos para incluir PROFIT
type ReportType = 'SALES' | 'PROFIT' | 'DEBT' | null;

export const ReportsScreen: React.FC = () => {
    const [activeReport, setActiveReport] = useState<ReportType>(null);

    // Función auxiliar para el título del Header
    const renderDashboard = () => (
        <div className="grid">
            {/* KPI 1: Ventas */}
            <div className="col-12 md:col-6 lg:col-3">
                <Card 
                    className="kpi-card shadow-1 h-full"
                    style={{ borderLeft: '3px solid var(--color-info)' }}
                    onClick={() => setActiveReport('SALES')}
                >
                    <div className="flex justify-content-between mb-3">
                        <div>
                            <span className="block text-500 font-medium mb-3">Ventas</span>
                            <div className="text-900 font-medium text-xl">Reporte Diario</div>
                        </div>
                        <div className="flex align-items-center justify-content-center bg-blue-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                            <i className="pi pi-shopping-cart text-blue-500 text-xl" />
                        </div>
                    </div>
                    <span className="text-blue-500 font-medium text-sm">Click para ver detalle</span>
                </Card>
            </div>

            {/* KPI 2: Ganancias y Flujo */}
            <div className="col-12 md:col-6 lg:col-3">
                <Card 
                    className="kpi-card shadow-1 h-full"
                    style={{ borderLeft: '3px solid var(--color-success)' }}
                    onClick={() => setActiveReport('PROFIT')}
                >
                    <div className="flex justify-content-between mb-3">
                        <div>
                            <span className="block text-500 font-medium mb-3">Ganancias & Flujo</span>
                            <div className="text-900 font-medium text-xl">ROI y Kardex</div>
                        </div>
                        <div className="flex align-items-center justify-content-center bg-green-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                            <i className="pi pi-chart-line text-green-500 text-xl" />
                        </div>
                    </div>
                    <span className="text-green-500 font-medium text-sm">Click para analizar</span>
                </Card>
            </div>

            {/* KPI 3: Fiado / Deuda */}
            <div className="col-12 md:col-6 lg:col-3">
                <Card 
                    className="kpi-card shadow-1 h-full"
                    style={{ borderLeft: '3px solid var(--color-warning)' }}
                    onClick={() => setActiveReport('DEBT')}
                >
                    <div className="flex justify-content-between mb-3">
                        <div>
                            <span className="block text-500 font-medium mb-3">Fiado / Deuda</span>
                            <div className="text-900 font-medium text-xl">Cuentas por Cobrar</div>
                        </div>
                        <div className="flex align-items-center justify-content-center bg-orange-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                            <i className="pi pi-wallet text-orange-500 text-xl" />
                        </div>
                    </div>
                    <span className="text-orange-500 font-medium text-sm">Click para ver detalle</span>
                </Card>
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-column overflow-hidden surface-ground">

            {/* Contenido Flexible (ocupa el resto de la altura) */}
            <div className="flex-grow-1 overflow-hidden overflow-x-hidden relative flex flex-column">
                
                {/* DASHBOARD PRINCIPAL */}
                {!activeReport && (
                    <div className="h-full overflow-y-auto overflow-x-hidden">
                        {renderDashboard()}
                    </div>
                )}
                
                {/* VISTAS DE DETALLE (Se montan condicionalmente) */}
                {/* Usamos un contenedor h-full w-full para asegurar que ocupen el flex-grow */}
                
                {activeReport === 'SALES' && (
                    <div className="h-full w-full overflow-x-hidden">
                        <SalesDetailView />
                    </div>
                )}

                {activeReport === 'PROFIT' && (
                    <div className="h-full w-full overflow-x-hidden">
                        <ProfitDetailView />
                    </div>
                )}

                {activeReport === 'DEBT' && (
                    <div className="h-full w-full overflow-x-hidden">
                        <DebtDetailView />
                    </div>
                )}
            </div>
        </div>
    );
};

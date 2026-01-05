import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { SalesDetailView } from './SalesDetailView';
import { ProfitDetailView } from './ProfitDetailView'; // <--- Importamos tu nueva vista

// Actualizamos los tipos para incluir PROFIT
type ReportType = 'SALES' | 'PROFIT' | 'DEBT' | null;

export const ReportsScreen: React.FC = () => {
    const [activeReport, setActiveReport] = useState<ReportType>(null);

    // Función auxiliar para el título del Header
    const getHeaderTitle = () => {
        switch (activeReport) {
            case 'SALES': return 'Reporte de Ventas';
            case 'PROFIT': return 'Ganancias y Flujo de Caja';
            default: return 'Panel de Reportes';
        }
    };

    const renderDashboard = () => (
        <div className="grid">
            {/* KPI 1: Ventas */}
            <div className="col-12 md:col-6 lg:col-3">
                <Card 
                    className="cursor-pointer hover:surface-100 transition-duration-200 border-left-3 border-blue-500 shadow-2 h-full"
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

            {/* KPI 2: Ganancias y Flujo (YA NO ES PLACEHOLDER) */}
            <div className="col-12 md:col-6 lg:col-3">
                <Card 
                    className="cursor-pointer hover:surface-100 transition-duration-200 border-left-3 border-green-500 shadow-2 h-full"
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

            {/* KPI 3: Cuentas por Cobrar (Placeholder para futuro) */}
            <div className="col-12 md:col-6 lg:col-3">
                <Card className="border-left-3 border-orange-500 shadow-2 opacity-60 h-full">
                    <div className="flex justify-content-between mb-3">
                        <div>
                            <span className="block text-500 font-medium mb-3">Fiado / Deuda</span>
                            <div className="text-900 font-medium text-xl">Próximamente</div>
                        </div>
                        <div className="flex align-items-center justify-content-center bg-orange-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                            <i className="pi pi-users text-orange-500 text-xl" />
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-column overflow-hidden surface-ground">
            
            {/* Header Fijo */}
            <div className="p-3 shadow-1 z-1 surface-section flex align-items-center gap-3 flex-none">
                {activeReport && (
                    <Button 
                        icon="pi pi-arrow-left" 
                        text 
                        rounded 
                        onClick={() => setActiveReport(null)} 
                        tooltip="Volver al Dashboard"
                    />
                )}
                <h2 className="m-0 text-900 text-xl font-bold">
                    {getHeaderTitle()}
                </h2>
            </div>

            {/* Contenido Flexible (ocupa el resto de la altura) */}
            <div className="flex-grow-1 overflow-hidden relative p-3 flex flex-column">
                
                {/* DASHBOARD PRINCIPAL */}
                {!activeReport && (
                    <div className="h-full overflow-y-auto">
                        {renderDashboard()}
                    </div>
                )}
                
                {/* VISTAS DE DETALLE (Se montan condicionalmente) */}
                {/* Usamos un contenedor h-full w-full para asegurar que ocupen el flex-grow */}
                
                {activeReport === 'SALES' && (
                    <div className="h-full w-full">
                        <SalesDetailView />
                    </div>
                )}

                {activeReport === 'PROFIT' && (
                    <div className="h-full w-full">
                        <ProfitDetailView />
                    </div>
                )}
            </div>
        </div>
    );
};
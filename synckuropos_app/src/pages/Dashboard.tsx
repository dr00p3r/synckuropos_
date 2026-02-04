
import React, { useState, useEffect } from 'react';
import { telemetryService } from '../services/telemetryService';
import { qualityService } from '../services/qualityService';
import { calculateMetrics } from '../utils/metricsCalculator';
import { MetricCard } from '../components/MetricCard';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Sidebar } from 'primereact/sidebar';

export const Dashboard: React.FC = () => {
    const [metricsData, setMetricsData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const toast = React.useRef<Toast>(null);

    const refreshMetrics = async () => {
        setLoading(true);
        try {
            // 0. Initial State (All dashes)
            // Initialize with empty logs/sonar/lighthouse to show structure with placeholders
            setMetricsData(calculateMetrics([], null, null));

            // 1. Fetch Logs (Fastest usually)
            // We start all promises but handle them sequentially in UI updates
            const logsPromise = telemetryService.getAllLogs();
            const sonarPromise = qualityService.getSonarMetrics();
            const lighthousePromise = qualityService.runLighthouseAudit();

            const logs = await logsPromise;
            // Update UI with Logs only
            setMetricsData(calculateMetrics(logs, null, null));
            toast.current?.show({ severity: 'info', summary: 'Info', detail: 'Logs cargados', life: 2000 });

            // 2. Wait for Sonar (Medium speed)
            const sonar = await sonarPromise;
            setMetricsData(calculateMetrics(logs, sonar, null));
            toast.current?.show({ severity: 'info', summary: 'Info', detail: 'SonarQube cargado', life: 2000 });

            // 3. Wait for Lighthouse (Slowest)
            const lighthouse = await lighthousePromise;
            setMetricsData(calculateMetrics(logs, sonar, lighthouse));

            toast.current?.show({ severity: 'success', summary: 'Completado', detail: 'Todas las métricas actualizadas' });
        } catch (error) {
            console.error(error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Fallo al obtener métricas completas' });
        } finally {
            setLoading(false);
        }
    };

    const saveSnapshot = () => {
        const snapshot = {
            id: Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            data: JSON.parse(JSON.stringify(metricsData))
        };
        setHistory([snapshot, ...history]);
        toast.current?.show({ severity: 'info', summary: 'Snapshot Guardado', detail: 'Estado actual guardado en historial' });
    };

    const restoreSnapshot = (snapshotData: any) => {
        setMetricsData(snapshotData);
        setShowHistory(false);
        toast.current?.show({ severity: 'warn', summary: 'Restaurado', detail: 'Visualizando datos históricos' });
    };

    // Initial load
    useEffect(() => {
        refreshMetrics();
    }, []);

    return (
        <div className="surface-ground min-h-screen p-4">
            <Toast ref={toast} />

            <div className="flex justify-content-between align-items-center mb-5">
                <div>
                    <h1 className="text-4xl font-bold text-900 m-0">Dashboard de Calidad de Software</h1>
                    <p className="text-600 mt-2">Monitoreo de KPIs, Telemetría y Performance</p>
                </div>
                <div className="flex gap-2">
                    <Button label="Refrescar Métricas" icon="pi pi-refresh" loading={loading} onClick={refreshMetrics} />
                    <Button label="Guardar Snapshot" icon="pi pi-save" severity="secondary" onClick={saveSnapshot} />
                    <Button label="Historial" icon="pi pi-history" severity="help" onClick={() => setShowHistory(true)} />
                </div>
            </div>


            <div className="masonry-layout">
                <style>{`
                    .masonry-layout {
                        column-count: 1;
                        column-gap: 1rem;
                    }
                    @media (min-width: 768px) {
                        .masonry-layout {
                            column-count: 3;
                        }
                    }
                    @media (min-width: 1400px) {
                        .masonry-layout {
                            column-count: 5;
                        }
                    }
                    .masonry-item {
                        break-inside: avoid;
                        margin-bottom: 1rem;
                    }
                `}</style>
                {metricsData.flatMap(factor =>
                    factor.criterios.map((criterio: any) => ({ ...criterio, factorName: factor.factor }))
                ).map((criterio: any, cIdx: number) => (
                    <div key={cIdx} className="masonry-item">
                        <div className="surface-card shadow-2 border-round p-3 h-full">
                            <div className="flex justify-content-between align-items-center mb-2">
                                <span className="text-xs font-bold text-500 uppercase tracking-wider">{criterio.factorName}</span>
                            </div>
                            <h4 className="text-base font-bold text-900 mb-3 border-bottom-1 border-200 pb-2">{criterio.nombre}</h4>
                            <div className="flex flex-column gap-2">
                                {criterio.metricas.map((metrica: any, mIdx: number) => (
                                    <MetricCard key={mIdx} metric={metrica} />
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <Sidebar visible={showHistory} position="right" onHide={() => setShowHistory(false)} className="w-30rem">
                <h2>Historial de Snapshots</h2>
                <div className="flex flex-column gap-3">
                    {history.map((snap) => (
                        <div key={snap.id} className="surface-card p-3 shadow-2 border-round cursor-pointer hover:surface-100" onClick={() => restoreSnapshot(snap.data)}>
                            <div className="flex justify-content-between">
                                <span className="font-bold">Snapshot #{snap.id.toString().slice(-4)}</span>
                                <span className="text-500">{snap.timestamp}</span>
                            </div>
                        </div>
                    ))}
                    {history.length === 0 && <p className="text-center text-500">No hay snapshots guardados.</p>}
                </div>
            </Sidebar>
        </div>
    );
};

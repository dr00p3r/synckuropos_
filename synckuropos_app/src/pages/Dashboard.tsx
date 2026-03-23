
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { telemetryService } from '../services/telemetryService';
import { qualityService } from '../services/qualityService';
import { calculateMetrics } from '../utils/metricsCalculator';
import { MetricCard } from '../components/MetricCard';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Sidebar } from 'primereact/sidebar';
import { Dialog } from 'primereact/dialog';
import { loadThresholds, updateThreshold, type ThresholdsMap } from '../services/thresholdService';
import { getGeminiVerdict } from '../services/geminiService';

// Colores para distinguir visualmente cada factor
const FACTOR_COLORS: Record<string, { border: string; bg: string; text: string; icon: string }> = {
    'Funcionalidad':             { border: '#6366F1', bg: '#EEF2FF', text: '#4338CA', icon: 'pi pi-check-circle' },
    'Fiabilidad':                { border: '#0EA5E9', bg: '#F0F9FF', text: '#0369A1', icon: 'pi pi-shield' },
    'Eficiencia de Desempeño':   { border: '#F59E0B', bg: '#FFFBEB', text: '#B45309', icon: 'pi pi-bolt' },
    'Seguridad':                 { border: '#EF4444', bg: '#FEF2F2', text: '#B91C1C', icon: 'pi pi-lock' },
    'Mantenibilidad':            { border: '#8B5CF6', bg: '#F5F3FF', text: '#6D28D9', icon: 'pi pi-cog' },
    'Usabilidad':                { border: '#10B981', bg: '#ECFDF5', text: '#047857', icon: 'pi pi-user' },
    'Efectividad':               { border: '#F97316', bg: '#FFF7ED', text: '#C2410C', icon: 'pi pi-chart-bar' },
    'Eficiencia':                { border: '#06B6D4', bg: '#ECFEFF', text: '#0E7490', icon: 'pi pi-clock' },
};

export const Dashboard: React.FC = () => {
    const [metricsData, setMetricsData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [customThresholds, setCustomThresholds] = useState<ThresholdsMap>({});
    // Cache de datos crudos para recalcular sin re-fetch
    const [cachedLogs, setCachedLogs] = useState<any[] | null>(null);
    const [cachedSonar, setCachedSonar] = useState<any>(null);
    const [cachedLighthouse, setCachedLighthouse] = useState<any>(null);
    const [aiVerdict, setAiVerdict] = useState<string>('');
    const [showAiDialog, setShowAiDialog] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const toast = React.useRef<Toast>(null);
    const hasFetched = useRef(false);

    // Load saved thresholds on mount
    useEffect(() => {
        setCustomThresholds(loadThresholds());
    }, []);

    // Recalcular métricas localmente cuando cambian los umbrales (sin re-fetch)
    useEffect(() => {
        if (cachedLogs !== null) {
            setMetricsData(calculateMetrics(cachedLogs, cachedSonar, cachedLighthouse, customThresholds));
        }
    }, [customThresholds, cachedLogs, cachedSonar, cachedLighthouse]);

    const refreshMetrics = async () => {
        setLoading(true);
        try {
            // 0. Initial State (All dashes)
            setMetricsData(calculateMetrics([], null, null, customThresholds));

            // 1. Fetch Logs (Fastest usually)
            const logsPromise = telemetryService.getAllLogs();
            const sonarPromise = qualityService.getSonarMetrics();
            const lighthousePromise = qualityService.runLighthouseAudit();

            const logs = await logsPromise;
            setCachedLogs(logs);
            setMetricsData(calculateMetrics(logs, null, null, customThresholds));
            toast.current?.show({ severity: 'info', summary: 'Info', detail: 'Logs cargados', life: 2000 });

            // 2. Wait for Sonar (Medium speed)
            const sonar = await sonarPromise;
            setCachedSonar(sonar);
            setMetricsData(calculateMetrics(logs, sonar, null, customThresholds));
            toast.current?.show({ severity: 'info', summary: 'Info', detail: 'SonarQube cargado', life: 2000 });

            // 3. Wait for Lighthouse (Slowest)
            const lighthouse = await lighthousePromise;
            setCachedLighthouse(lighthouse);
            setMetricsData(calculateMetrics(logs, sonar, lighthouse, customThresholds));

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

    // Initial load (solo una vez, con guard para StrictMode)
    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;
        refreshMetrics();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const requestAiVerdict = async () => {
        if (metricsData.length === 0) {
            toast.current?.show({ severity: 'warn', summary: 'Sin datos', detail: 'Carga las métricas primero' });
            return;
        }
        setAiLoading(true);
        setShowAiDialog(true);
        setAiVerdict('');
        try {
            const verdict = await getGeminiVerdict(metricsData);
            setAiVerdict(verdict);
        } catch (error: any) {
            setAiVerdict(`❌ Error al consultar Gemini: ${error.message}`);
            toast.current?.show({ severity: 'error', summary: 'Error IA', detail: error.message });
        } finally {
            setAiLoading(false);
        }
    };

    // Handler for updating metric thresholds
    const handleMetricUpdate = useCallback((updatedMetric: any) => {
        // Persist to localStorage
        const newThresholds = updateThreshold(
            updatedMetric.id,
            updatedMetric.umbralAceptacion,
            updatedMetric.umbralOptimo,
            updatedMetric.operador
        );
        setCustomThresholds(newThresholds);
        toast.current?.show({
            severity: 'success',
            summary: 'Umbral Actualizado',
            detail: `${updatedMetric.nombre} guardado`
        });
    }, []);

    return (
        <div className="surface-ground" style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Toast ref={toast} />

            {/* Header fijo */}
            <div className="flex justify-content-between align-items-center px-4 pt-3 pb-2" style={{ flexShrink: 0 }}>
                <div>
                    <h1 className="text-3xl font-bold text-900 m-0">Dashboard de Calidad</h1>
                    <p className="text-600 mt-1 mb-0 text-sm">Monitoreo de KPIs, Telemetría y Performance</p>
                </div>
                <div className="flex gap-2">
                    <Button label="Refrescar" icon="pi pi-refresh" loading={loading} onClick={refreshMetrics} size="small" />
                    <Button label="Veredicto IA" icon="pi pi-sparkles" severity="warning" loading={aiLoading} onClick={requestAiVerdict} size="small" tooltip="Consultar Gemini AI" />
                    <Button icon="pi pi-save" severity="secondary" onClick={saveSnapshot} size="small" tooltip="Guardar Snapshot" />
                    <Button icon="pi pi-history" severity="help" onClick={() => setShowHistory(true)} size="small" tooltip="Historial" />
                </div>
            </div>

            {/* Área scrollable con grid de factores */}
            <div className="px-4 pb-3" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                    {metricsData.map((factor, fIdx) => {
                        const colors = FACTOR_COLORS[factor.factor] || { border: '#9CA3AF', bg: '#F9FAFB', text: '#4B5563', icon: 'pi pi-th-large' };
                        return (
                            <div key={fIdx} className="border-round-lg overflow-hidden shadow-1" style={{ borderLeft: `4px solid ${colors.border}` }}>
                                {/* Factor Header compacto */}
                                <div className="flex align-items-center gap-2 px-3 py-2" style={{ backgroundColor: colors.bg }}>
                                    <i className={colors.icon} style={{ color: colors.text, fontSize: '0.95rem' }} />
                                    <span className="font-bold text-sm" style={{ color: colors.text }}>{factor.factor}</span>
                                    <span className="text-xs font-medium border-round px-2 py-1 ml-auto" style={{ backgroundColor: colors.border, color: '#fff' }}>
                                        {factor.criterios.reduce((acc: number, c: any) => acc + c.metricas.length, 0)}
                                    </span>
                                </div>
                                {/* Criterios en fila horizontal con scroll */}
                                <div className="surface-card p-2" style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
                                    {factor.criterios.map((criterio: any, cIdx: number) => (
                                        <div key={cIdx} className="surface-50 border-round p-2 border-1 border-200" style={{ minWidth: '220px', flex: '1 0 auto' }}>
                                            <div className="text-xs font-bold text-700 mb-2 pb-1 border-bottom-1 border-200 white-space-nowrap">{criterio.nombre}</div>
                                            <div className="flex flex-column gap-1">
                                                {criterio.metricas.map((metrica: any, mIdx: number) => (
                                                    <MetricCard key={`${factor.factor}-${cIdx}-${mIdx}`} metric={metrica} onUpdate={handleMetricUpdate} />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
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

            <Dialog
                header={
                    <div className="flex align-items-center gap-2">
                        <i className="pi pi-sparkles" style={{ color: '#F59E0B', fontSize: '1.25rem' }} />
                        <span>Veredicto IA — Gemini</span>
                    </div>
                }
                visible={showAiDialog}
                onHide={() => setShowAiDialog(false)}
                style={{ width: '70vw', maxHeight: '80vh' }}
                maximizable
                dismissableMask
            >
                {aiLoading ? (
                    <div className="flex flex-column align-items-center justify-content-center py-6 gap-3">
                        <i className="pi pi-spin pi-spinner" style={{ fontSize: '2.5rem', color: '#F59E0B' }} />
                        <p className="text-600">Consultando a Gemini AI...</p>
                    </div>
                ) : (
                    <div
                        className="markdown-content line-height-3 text-800"
                        style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(aiVerdict) }}
                    />
                )}
            </Dialog>
        </div>
    );
};

/** Minimal markdown-to-HTML renderer for Gemini responses */
function renderMarkdown(md: string): string {
    if (!md) return '';
    return md
        // Headers
        .replace(/^### (.+)$/gm, '<h4 style="margin:0.8rem 0 0.3rem">$1</h4>')
        .replace(/^## (.+)$/gm, '<h3 style="margin:1rem 0 0.4rem">$1</h3>')
        .replace(/^# (.+)$/gm, '<h2 style="margin:1rem 0 0.5rem">$1</h2>')
        // Bold & italic
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        // Inline code
        .replace(/`([^`]+)`/g, '<code style="background:#f1f5f9;padding:0.1rem 0.3rem;border-radius:3px;font-size:0.85em">$1</code>')
        // Unordered lists
        .replace(/^[\-\*] (.+)$/gm, '<li style="margin-left:1.2rem">$1</li>')
        // Ordered lists
        .replace(/^\d+\. (.+)$/gm, '<li style="margin-left:1.2rem;list-style-type:decimal">$1</li>')
        // Horizontal rule
        .replace(/^---$/gm, '<hr style="margin:0.8rem 0;border-color:#e2e8f0"/>')
        // Paragraphs (double newlines)
        .replace(/\n\n/g, '<br/><br/>')
        // Single newlines
        .replace(/\n/g, '<br/>');
}

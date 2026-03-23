
import React, { useState, useEffect } from 'react';
import { ProgressBar } from 'primereact/progressbar';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';

interface MetricProps {
    metric: {
        id: string;
        nombre: string;
        valor: number | string;
        unidad: string;
        umbralAceptacion: number;
        umbralOptimo: number;
        operador: string;
        fuente: string;
    };
    onUpdate?: (updatedMetric: any) => void;
}

export const MetricCard: React.FC<MetricProps> = ({ metric, onUpdate }) => {
    const [showDialog, setShowDialog] = useState(false);
    const [localMetric, setLocalMetric] = useState(metric);

    // Sincronizar localMetric cuando la prop cambia (nuevas métricas o umbrales aplicados)
    useEffect(() => {
        setLocalMetric(metric);
    }, [metric.id, metric.umbralAceptacion, metric.umbralOptimo, metric.operador, metric.valor]);

    // Color Logic
    const getColor = (val: number | string, accept: number, optimal: number, op: string) => {
        if (typeof val !== 'number') return 'text-600'; // Default gray for non-numbers

        const isBetter = (a: number, b: number) => {
            if (op === '>' || op === '>=') return a >= b;
            return a <= b;
        };

        if (isBetter(val, optimal)) return 'success'; // Green
        if (isBetter(val, accept)) return 'warning'; // Yellow
        return 'danger'; // Red
    };

    const status = getColor(metric.valor, metric.umbralAceptacion, metric.umbralOptimo, metric.operador);
    const percentage = 100; // Fixed full bar, color indicates status



    const handleSave = () => {
        if (onUpdate) onUpdate(localMetric);
        setShowDialog(false);
    };

    return (
        <>
            <div
                className="surface-card border-round cursor-pointer hover:surface-100 transition-duration-150"
                style={{ padding: '0.4rem 0.6rem' }}
                onClick={() => setShowDialog(true)}
            >
                <div className="flex justify-content-between align-items-center gap-2">
                    <div className="flex flex-column" style={{ minWidth: 0, flex: 1 }}>
                        <span className="text-xs font-semibold text-800 white-space-nowrap overflow-hidden text-overflow-ellipsis" title={metric.nombre}>{metric.nombre}</span>
                        <span style={{ fontSize: '0.65rem' }} className="text-400 mt-1">{metric.operador} {metric.umbralAceptacion} {metric.unidad}</span>
                    </div>
                    <span className={`text-base font-bold white-space-nowrap ${status === 'success' ? 'text-green-600' : status === 'warning' ? 'text-yellow-600' : 'text-red-600'}`}>
                        {typeof metric.valor === 'number' ? metric.valor.toFixed(2) : metric.valor}
                        <span style={{ fontSize: '0.6rem' }} className="ml-1 text-400">{metric.unidad}</span>
                    </span>
                </div>
                <ProgressBar
                    value={percentage}
                    showValue={false}
                    color={status === 'success' ? '#22C55E' : status === 'warning' ? '#EAB308' : status === 'danger' ? '#EF4444' : '#6B7280'}
                    style={{ height: '3px', marginTop: '0.25rem' }}
                />
            </div>

            <Dialog header={`Editar Umbrales: ${metric.nombre}`} visible={showDialog} style={{ width: '400px' }} onHide={() => setShowDialog(false)}>
                <div className="flex flex-column gap-4">
                    <div className="field">
                        <label className="block mb-2">Operador</label>
                        <Dropdown value={localMetric.operador} options={[{ label: 'Mayor que (>)', value: '>' }, { label: 'Menor que (<)', value: '<' }]} onChange={(e) => setLocalMetric({ ...localMetric, operador: e.value })} className="w-full" />
                    </div>
                    <div className="field">
                        <label className="block mb-2">Umbral Aceptable</label>
                        <InputNumber value={localMetric.umbralAceptacion} onValueChange={(e) => setLocalMetric({ ...localMetric, umbralAceptacion: e.value || 0 })} minFractionDigits={2} className="w-full" />
                    </div>
                    <div className="field">
                        <label className="block mb-2">Umbral Óptimo</label>
                        <InputNumber value={localMetric.umbralOptimo} onValueChange={(e) => setLocalMetric({ ...localMetric, umbralOptimo: e.value || 0 })} minFractionDigits={2} className="w-full" />
                    </div>
                    <Button label="Guardar Cambios" icon="pi pi-check" onClick={handleSave} />
                </div>
            </Dialog>
        </>
    );
};


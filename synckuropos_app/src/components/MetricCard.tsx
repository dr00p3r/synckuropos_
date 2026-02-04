
import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { ProgressBar } from 'primereact/progressbar';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';

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
            <div className="h-full p-1">
                <Card
                    className="shadow-1 cursor-pointer hover:surface-100 transition-duration-200 surface-50"
                    pt={{ body: { className: 'p-2' }, content: { className: 'p-0' } }}
                    onClick={() => setShowDialog(true)}
                >
                    <div className="flex justify-content-between align-items-center">
                        <div className="flex flex-column" style={{ maxWidth: '65%' }}>
                            <span className="text-sm font-semibold text-800 white-space-nowrap overflow-hidden text-overflow-ellipsis" title={metric.nombre}>{metric.nombre}</span>
                            <span className="text-xs text-500 mt-1">{metric.operador} {metric.umbralAceptacion} {metric.unidad}</span>
                        </div>
                        <div className="flex flex-column align-items-end" style={{ minWidth: '35%' }}>
                            <span className={`text-xl font-bold ${status === 'success' ? 'text-green-600' : status === 'warning' ? 'text-yellow-600' : 'text-red-600'}`}>
                                {typeof metric.valor === 'number' ? metric.valor.toFixed(2) : metric.valor}
                                <span className="text-xs ml-1 text-500">{metric.unidad}</span>
                            </span>
                        </div>
                    </div>
                    <ProgressBar
                        value={percentage}
                        showValue={false}
                        color={status === 'success' ? '#22C55E' : status === 'warning' ? '#EAB308' : status === 'danger' ? '#EF4444' : '#6B7280'}
                        style={{ height: '4px', marginTop: '0.5rem' }}
                    />
                </Card>
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


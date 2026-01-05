import React from 'react';
import { Button } from 'primereact/button';

interface DateRangeFooterProps {
    /**
     * Callback que devuelve el nuevo rango de fechas [Inicio, Fin]
     */
    onRangeChange: (range: [Date, Date]) => void;
}

export const DateRangeFooter: React.FC<DateRangeFooterProps> = ({ onRangeChange }) => {
    
    // Helper para establecer últimos X días
    const setLastDays = (days: number) => {
        const end = new Date();
        const start = new Date();
        
        // Si es 0 (Hoy), inicio y fin son hoy. Si es 7, restamos 7 días al inicio.
        if (days > 0) {
            start.setDate(end.getDate() - days);
        } else {
            start.setHours(0,0,0,0);
        }
        
        onRangeChange([start, end]);
    };

    // Helper para este mes
    const setThisMonth = () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Último día del mes
        onRangeChange([start, end]);
    };

    // Helper para mes anterior (Opcional, muy útil)
    const setLastMonth = () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        onRangeChange([start, end]);
    };

    return (
        <div className="flex flex-wrap justify-content-center gap-2 p-2 border-top-1 surface-border">
            <Button 
                label="Hoy" 
                size="small" 
                text 
                severity="secondary"
                onClick={() => setLastDays(0)} 
            />
            <Button 
                label="7 Días" 
                size="small" 
                text 
                severity="secondary"
                onClick={() => setLastDays(7)} 
            />
            <Button 
                label="Este Mes" 
                size="small" 
                text 
                severity="secondary"
                onClick={setThisMonth} 
            />
             <Button 
                label="Mes Ant." 
                size="small" 
                text 
                severity="secondary"
                onClick={setLastMonth} 
            />
        </div>
    );
};
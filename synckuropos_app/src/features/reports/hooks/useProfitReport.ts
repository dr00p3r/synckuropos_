import { useState, useEffect } from 'react';
import { useDatabase } from '@/hooks';
import { profitRepository } from '../services/profitReportRepository';
import type { ProfitReportData, InventoryMovement } from '../types';

export const useProfitReport = () => {
    const db = useDatabase();
    const [loading, setLoading] = useState(false);
    
    // Filtros
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayEnd = new Date(); todayEnd.setHours(23,59,59,999);
    const [dateRange, setDateRange] = useState<[Date, Date]>([todayStart, todayEnd]);
    
    // Filtro Productos (Array de IDs)
    const [selectedProducts, setSelectedProducts] = useState<any[]>([]); // Objetos {label, value}

    const [reportData, setReportData] = useState<ProfitReportData>({
        totalRevenue: 0,
        totalInvested: 0,
        netProfit: 0,
        roi: 0,
        movements: [],
        chartData: {}
    });

    // Función para el AutoComplete
    const searchProducts = async (query: string) => {
        if(!db) return [];
        return await profitRepository.searchProducts(db, query);
    };

    const loadReport = async () => {
        if (!db) return;
        setLoading(true);
        try {
            const [start, end] = dateRange;
            if(end) end.setHours(23,59,59,999);
            
            const productIds = selectedProducts.map(p => p.value);

            const movements = await profitRepository.getProfitMovements(db, start, end, productIds);

            // Cálculos KPI
            let revenue = 0;
            let invested = 0;

            movements.forEach(m => {
                if (m.type === 'SALE') revenue += m.totalValue;
                else invested += m.totalValue;
            });

            const netProfit = revenue - invested;
            // Evitar división por cero en ROI
            const roi = invested > 0 ? ((netProfit) / invested) * 100 : 0;

            // Preparar Gráfico (Agrupar Ingresos vs Gastos por día)
            // Lógica simplificada de agrupación...
            const chartData = prepareChartData(movements);

            setReportData({
                totalRevenue: revenue,
                totalInvested: invested,
                netProfit,
                roi,
                movements,
                chartData
            });

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadReport(); }, [db, dateRange, selectedProducts]);

    return {
        loading,
        reportData,
        dateRange, setDateRange,
        selectedProducts, setSelectedProducts,
        searchProducts,
        refresh: loadReport
    };
};

// Helper para gráfico (fuera del hook para limpieza)
function prepareChartData(movements: InventoryMovement[]) {
    // Agrupar por fecha DD/MM
    const groups: Record<string, { income: number, expense: number }> = {};
    
    // Invertir para procesar cronológicamente (antiguo a nuevo)
    [...movements].reverse().forEach(m => {
        const dateKey = new Date(m.date).toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit' });
        if (!groups[dateKey]) groups[dateKey] = { income: 0, expense: 0 };
        
        if (m.type === 'SALE') groups[dateKey].income += m.totalValue;
        else groups[dateKey].expense += m.totalValue;
    });

    const labels = Object.keys(groups);
    return {
        labels,
        datasets: [
            {
                label: 'Ventas',
                data: labels.map(l => groups[l].income / 100),
                // green-500
                backgroundColor: '#22c55e',
                borderRadius: 4
            },
            {
                label: 'Inversión',
                data: labels.map(l => groups[l].expense / 100),
                // red-500
                backgroundColor: '#ef4444',
                borderRadius: 4
            }
        ]
    };
}
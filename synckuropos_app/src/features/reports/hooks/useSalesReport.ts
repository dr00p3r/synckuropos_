import { useState, useEffect } from 'react';
import { useDatabase } from '@/hooks';
import { reportRepository } from '../services/saleReportRepository';
import type { SalesReportData, DailySalesSummary, UserOption } from '../types';

export const useSalesReport = () => {
    const db = useDatabase();
    const [loading, setLoading] = useState(false);
    
    // Filtros
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayEnd = new Date(); todayEnd.setHours(23,59,59,999);
    const [dateRange, setDateRange] = useState<[Date, Date]>([todayStart, todayEnd]);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    
    // Lista de usuarios para el dropdown
    const [userOptions, setUserOptions] = useState<UserOption[]>([]);

    const [reportData, setReportData] = useState<SalesReportData>({
        totalRevenue: 0,
        totalTransactions: 0,
        dailyData: [],
        chartData: { labels: [], datasets: [] }
    });

    // Cargar Usuarios al inicio
    useEffect(() => {
        if(db) {
            reportRepository.getUsers(db).then(users => setUserOptions(users));
        }
    }, [db]);

    const loadReport = async () => {
        if (!db) return;
        setLoading(true);
        try {
            const [start, end] = dateRange;
            if(end) end.setHours(23,59,59,999);

            // Usamos la nueva función con detalles
            const salesWithDetails = await reportRepository.getSalesWithDetails(db, start, end, selectedUserId || undefined);

            // --- PROCESAMIENTO ---
            let grandTotal = 0;
            const groupedMap = new Map<string, DailySalesSummary>();

            // Agrupar por fecha
            salesWithDetails.forEach(sale => {
                const dateKey = new Date(sale.createdAt).toLocaleDateString('es-EC');
                grandTotal += sale.totalAmount;

                if (!groupedMap.has(dateKey)) {
                    groupedMap.set(dateKey, {
                        date: dateKey,
                        totalAmount: 0,
                        transactionCount: 0,
                        sales: []
                    });
                }
                const group = groupedMap.get(dateKey)!;
                group.totalAmount += sale.totalAmount;
                group.transactionCount += 1;
                group.sales.push(sale);
            });

            // Ordenar datos
            const dailyData = Array.from(groupedMap.values()).sort((a, b) => 
                 // Ordenar por fecha string (puedes mejorar esto parseando la fecha si es necesario)
                 new Date(b.sales[0].createdAt).getTime() - new Date(a.sales[0].createdAt).getTime()
            );

            // --- PREPARAR CHART ---
            // Invertimos el orden para el gráfico (Cronológico: Izq a Der)
            const chartLabels = [...dailyData].reverse().map(d => d.date.split('/').slice(0, 2).join('/')); // DD/MM
            const chartValues = [...dailyData].reverse().map(d => Number((d.totalAmount / 100).toFixed(2)));

            const chartData = {
                labels: chartLabels,
                datasets: [
                    {
                        label: 'Ventas ($)',
                        data: chartValues,
                        backgroundColor: 'rgba(59, 130, 246, 0.5)', // blue-500 con opacidad
                        borderColor: 'rgb(59, 130, 246)',
                        borderWidth: 1,
                        tension: 0.4
                    }
                ]
            };

            setReportData({
                totalRevenue: grandTotal,
                totalTransactions: salesWithDetails.length,
                dailyData,
                chartData
            });

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadReport(); }, [db, dateRange, selectedUserId]);

    return {
        loading,
        reportData,
        dateRange,
        setDateRange,
        selectedUserId,
        setSelectedUserId,
        userOptions,
        refresh: loadReport
    };
};
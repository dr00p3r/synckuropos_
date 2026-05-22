import { useState, useEffect, useCallback, useRef } from 'react';
import { useDatabase, useToast } from '@/hooks';
import { debtReportRepository } from '../services/debtReportRepository';
import type { DebtReportData, CustomerOption } from '../types';

export const useDebtReport = () => {
    const db = useDatabase();
    const toast = useToast();

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

    const [customerOptions, setCustomerOptions] = useState<CustomerOption[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<[Date, Date]>([todayStart, todayEnd]);
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState<DebtReportData | null>(null);
    const customersLoaded = useRef(false);

    const loadCustomers = useCallback(async () => {
        if (!db || customersLoaded.current) return;
        try {
            const options = await debtReportRepository.getCustomersWithActiveDebt(db);
            setCustomerOptions(options);
            customersLoaded.current = true;
        } catch (error) {
            console.error('Error loading customers with debt:', error);
        }
    }, [db]);

    useEffect(() => {
        if (db) { void loadCustomers(); }
    }, [db, loadCustomers]);

    const loadReport = useCallback(async () => {
        if (!db || !selectedCustomerId) {
            setReportData(null);
            return;
        }

        setLoading(true);
        try {
            const [start, end] = dateRange;
            const data = await debtReportRepository.getDebtReport(
                db,
                selectedCustomerId,
                start.getTime(),
                end.getTime()
            );
            setReportData(data);
        } catch (error) {
            console.error('Error loading debt report:', error);
            toast.showError('Error al cargar el reporte de deuda');
        } finally {
            setLoading(false);
        }
    }, [db, selectedCustomerId, dateRange, toast]);

    useEffect(() => {
        void loadReport();
    }, [loadReport]);

    return {
        loading,
        reportData,
        customerOptions,
        selectedCustomerId,
        setSelectedCustomerId,
        dateRange,
        setDateRange
    };
};

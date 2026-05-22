import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDatabase, useToast } from '@/hooks';
import { customerRepository, type CustomerWithDebt } from '../services/customerRepository';

export type SortField = 'fullname' | 'phone' | 'debtTotal' | 'creditLimit';
export type SortDirection = 'asc' | 'desc';

export const useCustomers = () => {
    const db = useDatabase();
    const toast = useToast();

    const [customers, setCustomers] = useState<CustomerWithDebt[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');
    const [showOnlyWithDebt, setShowOnlyWithDebt] = useState(false);
    const [showInactive, setShowInactive] = useState(false);

    const [sortField, setSortField] = useState<SortField>('fullname');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    const loadCustomers = useCallback(async () => {
        if (!db) return;

        try {
            setLoading(true);
            const data = await customerRepository.getCustomersWithDebt(db);
            setCustomers(data);
        } catch (error) {
            console.error('Error cargando clientes:', error);
            toast.showError('Error al cargar los clientes');
        } finally {
            setLoading(false);
        }
    }, [db, toast]);

    useEffect(() => {
        if (db) {
            loadCustomers();
        }
    }, [db, loadCustomers]);

    const toggleStatus = useCallback(async (customer: CustomerWithDebt) => {
        if (!db) return;

        try {
            const newStatus = await customerRepository.toggleCustomerStatus(db, customer.customerId);
            toast.showSuccess(newStatus ? 'Cliente desactivado' : 'Cliente reactivado');
            await loadCustomers();
        } catch (error) {
            console.error('Error cambiando estado:', error);
            toast.showError('Error al cambiar el estado del cliente');
        }
    }, [db, toast, loadCustomers]);

    const handleSort = useCallback((field: SortField) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    }, [sortField]);

    const filteredCustomers = useMemo(() => {
        let result = [...customers];

        if (!showInactive) {
            result = result.filter(c => !c._deleted);
        }

        if (showOnlyWithDebt) {
            result = result.filter(c => c.debtTotal > 0);
        }

        if (searchTerm.trim()) {
            const search = searchTerm.toLowerCase();
            result = result.filter(c =>
                c.fullname.toLowerCase().includes(search) ||
                (c.phone?.toLowerCase().includes(search)) ||
                (c.email?.toLowerCase().includes(search))
            );
        }

        result.sort((a, b) => {
            let aValue: any;
            let bValue: any;

            switch (sortField) {
                case 'fullname':
                    aValue = a.fullname.toLowerCase();
                    bValue = b.fullname.toLowerCase();
                    break;
                case 'phone':
                    aValue = a.phone || '';
                    bValue = b.phone || '';
                    break;
                case 'debtTotal':
                    aValue = a.debtTotal;
                    bValue = b.debtTotal;
                    break;
                case 'creditLimit':
                    aValue = a.creditLimit;
                    bValue = b.creditLimit;
                    break;
                default:
                    aValue = a.fullname.toLowerCase();
                    bValue = b.fullname.toLowerCase();
            }

            if (sortDirection === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            }
        });

        return result;
    }, [customers, searchTerm, showOnlyWithDebt, showInactive, sortField, sortDirection]);

    return {
        customers: filteredCustomers,
        allCustomers: customers,
        loading,

        searchTerm,
        setSearchTerm,
        showOnlyWithDebt,
        setShowOnlyWithDebt,
        showInactive,
        setShowInactive,

        sortField,
        sortDirection,
        handleSort,

        loadCustomers,
        toggleStatus
    };
};

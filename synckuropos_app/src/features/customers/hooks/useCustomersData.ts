import { useState, useEffect, useCallback } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import { useToast } from '@/hooks/useToast';
import type { CustomerWithDebt, SortField, SortDirection, UseCustomersDataReturn } from '../types';

export const useCustomersData = (): UseCustomersDataReturn => {
  // Estados principales
  const [customers, setCustomers] = useState<CustomerWithDebt[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerWithDebt[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyWithDebt, setShowOnlyWithDebt] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Estados de ordenamiento
  const [sortField, setSortField] = useState<SortField>('fullname');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Hooks
  const db = useDatabase();
  const toast = useToast();

  // Función para calcular la deuda total de un cliente
  const calculateCustomerDebt = useCallback(async (customerId: string): Promise<number> => {
    if (!db) return 0;
    
    try {
      // Obtener todas las deudas del cliente
      const debts = await db.debts.find({
        selector: { customerId }
      }).exec();

      if (debts.length === 0) return 0;

      let totalDebt = 0;

      // Para cada deuda, calcular el saldo pendiente
      for (const debt of debts) {
        const debtData = debt.toJSON();
        
        // Obtener todos los pagos de esta deuda
        const payments = await db.debtPayments.find({
          selector: { debtId: debtData.debtId }
        }).exec();

        const totalPaid = payments.reduce((sum, payment) => {
          return sum + payment.toJSON().amountPaid;
        }, 0);

        // El saldo pendiente es la deuda original menos lo pagado
        const pendingAmount = debtData.amount - totalPaid;
        
        // Solo agregar si hay saldo pendiente
        if (pendingAmount > 0) {
          totalDebt += pendingAmount;
        }
      }

      return totalDebt;
    } catch (error) {
      console.error('Error calculando deuda del cliente:', error);
      return 0;
    }
  }, [db]);

  // Cargar clientes desde la base de datos
  const loadCustomers = useCallback(async () => {
    if (!db) return;
    
    try {
      setLoading(true);
      
      // Obtener todos los clientes activos
      const allCustomers = await db.customers.find({
        selector: { isActive: true }
      }).exec();

      const customersData = allCustomers.map((doc: any) => doc.toJSON());

      // Calcular la deuda de cada cliente
      const customersWithDebt: CustomerWithDebt[] = await Promise.all(
        customersData.map(async (customer) => {
          const debtTotal = await calculateCustomerDebt(customer.customerId);
          return {
            ...customer,
            debtTotal
          };
        })
      );

      setCustomers(customersWithDebt);
    } catch (error) {
      console.error('Error cargando clientes:', error);
      toast.showError('Error al cargar los clientes');
    } finally {
      setLoading(false);
    }
  }, [db, calculateCustomerDebt]);

  // Cargar clientes al montar el componente
  useEffect(() => {
    if (db) {
      loadCustomers();
    }
  }, [db, loadCustomers]);

  // Aplicar ordenamiento cuando cambien los criterios
  useEffect(() => {
    setCustomers(prevCustomers => {
      if (prevCustomers.length === 0) return prevCustomers;
      
      const sortedCustomers = [...prevCustomers].sort((a, b) => {
        let aValue: any, bValue: any;
        
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

      return sortedCustomers;
    });
  }, [sortField, sortDirection]);

  // Filtrar clientes cuando cambian los criterios de búsqueda
  useEffect(() => {
    let filtered = customers;

    // Filtrar por clientes con deuda
    if (showOnlyWithDebt) {
      filtered = filtered.filter(customer => customer.debtTotal > 0);
    }

    // Filtrar por término de búsqueda
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(customer => 
        customer.fullname.toLowerCase().includes(search) ||
        (customer.phone && customer.phone.toLowerCase().includes(search))
      );
    }

    setFilteredCustomers(filtered);
  }, [customers, searchTerm, showOnlyWithDebt]);

  // Manejar cambio de ordenamiento
  const handleSort = useCallback((field: SortField) => {
    setSortField(prevField => {
      if (prevField === field) {
        setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        return prevField;
      } else {
        setSortDirection('asc');
        return field;
      }
    });
  }, []);

  // Formatear moneda
  const formatCurrency = useCallback((amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  }, []);

  return {
    // Estados principales
    customers,
    filteredCustomers,
    loading,
    
    // Estados de filtros
    searchTerm,
    showOnlyWithDebt,
    
    // Estados de ordenamiento
    sortField,
    sortDirection,
    
    // Funciones
    setSearchTerm,
    setShowOnlyWithDebt,
    handleSort,
    loadCustomers,
    refreshCustomers: loadCustomers, // Alias for consistency
    formatCurrency,
  };
};
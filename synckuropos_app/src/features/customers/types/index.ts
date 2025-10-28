import type { Customer } from '@/types/types';

// Customers-specific types
export type SortField = 'fullname' | 'email' | 'phone' | 'debtTotal' | 'creditLimit';
export type SortDirection = 'asc' | 'desc';

export interface CustomerWithDebt extends Customer {
  debtTotal: number;
}

export interface UseCustomersDataReturn {
  // Estados principales
  customers: CustomerWithDebt[];
  filteredCustomers: CustomerWithDebt[];
  loading: boolean;
  
  // Estados de filtros
  searchTerm: string;
  showOnlyWithDebt: boolean;
  sortField: SortField;
  sortDirection: SortDirection;
  
  // Acciones
  setSearchTerm: (term: string) => void;
  setShowOnlyWithDebt: (show: boolean) => void;
  handleSort: (field: SortField) => void;
  loadCustomers: () => Promise<void>;
  refreshCustomers: () => Promise<void>;
  formatCurrency: (amount: number) => string;
}

// Component props interfaces
export interface CustomersScreenProps {
  // Add props if needed
}

export interface SearchControlsProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  showOnlyWithDebt: boolean;
  onShowOnlyWithDebtChange: (value: boolean) => void;
  totalCustomers: number;
  filteredCustomers: number;
  onCreateCustomer: () => void;
}

export interface CustomersTableProps {
  customers: CustomerWithDebt[];
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  onManageCustomer: (customer: CustomerWithDebt) => void;
  formatCurrency: (amount: number) => string;
}

export interface CustomerTableHeaderProps {
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}

export interface CustomerTableRowProps {
  customer: CustomerWithDebt;
  onManageCustomer: (customer: CustomerWithDebt) => void;
  formatCurrency: (amount: number) => string;
}

// Modal types
export interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Customer) => void;
  customer?: Customer | null;
  mode: 'create' | 'edit' | 'view';
}

export interface DebtSummary {
  totalDebt: number;
  totalPaid: number;
  remainingBalance: number;
  totalDebts: number;
}

export interface DebtDetail {
  debtId: string;
  amount: number;
  remainingBalance: number;
  createdAt: string;
  description?: string;
}

// Re-export for convenience
export type { Customer };
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CustomersScreen from '@/features/customers/components/CustomersScreen';

jest.mock('@/features/customers/hooks/useCustomersData', () => ({
  useCustomersData: jest.fn(() => ({
    customers: [
      {
        customerId: '1',
        fullname: 'John Doe',
        email: 'john@example.com',
        phoneNumber: '1234567890',
        city: 'Quito',
        address: 'Street 1',
        isActive: true,
        debtTotal: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _deleted: false,
      },
    ],
    filteredCustomers: [
      {
        customerId: '1',
        fullname: 'John Doe',
        email: 'john@example.com',
        phoneNumber: '1234567890',
        city: 'Quito',
        address: 'Street 1',
        isActive: true,
        debtTotal: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _deleted: false,
      },
    ],
    loading: false,
    searchTerm: '',
    showOnlyWithDebt: false,
    sortField: 'fullname',
    sortDirection: 'asc',
    setSearchTerm: jest.fn(),
    setShowOnlyWithDebt: jest.fn(),
    handleSort: jest.fn(),
    loadCustomers: jest.fn(),
    formatCurrency: jest.fn((amount) => `$${amount}`),
  })),
}));

jest.mock('@/features/customers/components/CustomerModal/CustomerModal', () => ({
  CustomerModal: () => <div data-testid="customer-modal">Customer Modal</div>,
}));

jest.mock('@/features/customers/components/SearchControls/SearchControls', () => {
  return function MockSearchControls() {
    return <div data-testid="search-controls">Search Controls</div>;
  };
});

jest.mock('@/features/customers/components/CustomersTable/CustomersTable', () => {
  return function MockCustomersTable() {
    return <div data-testid="customers-table">Customers Table</div>;
  };
});

jest.mock('@/features/customers/components/EmptyState/EmptyState', () => {
  return function MockEmptyState() {
    return <div data-testid="empty-state">Empty State</div>;
  };
});

jest.mock('@/features/customers/components/LoadingState/LoadingState', () => {
  return function MockLoadingState() {
    return <div data-testid="loading-state">Loading State</div>;
  };
});

describe('CustomersScreen Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render customers header', () => {
    render(<CustomersScreen />);
    expect(screen.getByText('Clientes')).toBeInTheDocument();
  });

  it('should render search controls', () => {
    render(<CustomersScreen />);
    expect(screen.getByTestId('search-controls')).toBeInTheDocument();
  });

  it('should render customers table when there are customers', () => {
    render(<CustomersScreen />);
    expect(screen.getByTestId('customers-table')).toBeInTheDocument();
  });

  it('should render empty state when no customers', () => {
    const mockUseCustomersData = require('@/features/customers/hooks/useCustomersData').useCustomersData;
    mockUseCustomersData.mockReturnValueOnce({
      customers: [],
      filteredCustomers: [],
      loading: false,
      searchTerm: '',
      showOnlyWithDebt: false,
      sortField: 'fullname',
      sortDirection: 'asc',
      setSearchTerm: jest.fn(),
      setShowOnlyWithDebt: jest.fn(),
      handleSort: jest.fn(),
      loadCustomers: jest.fn(),
      formatCurrency: jest.fn(),
    });

    render(<CustomersScreen />);
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('should render loading state when loading', () => {
    const mockUseCustomersData = require('@/features/customers/hooks/useCustomersData').useCustomersData;
    mockUseCustomersData.mockReturnValueOnce({
      customers: [],
      filteredCustomers: [],
      loading: true,
      searchTerm: '',
      showOnlyWithDebt: false,
      sortField: 'fullname',
      sortDirection: 'asc',
      setSearchTerm: jest.fn(),
      setShowOnlyWithDebt: jest.fn(),
      handleSort: jest.fn(),
      loadCustomers: jest.fn(),
      formatCurrency: jest.fn(),
    });

    render(<CustomersScreen />);
    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
  });

  it('should not show customer modal initially', () => {
    render(<CustomersScreen />);
    const modal = screen.queryByTestId('customer-modal');
    expect(modal).not.toBeInTheDocument();
  });
});

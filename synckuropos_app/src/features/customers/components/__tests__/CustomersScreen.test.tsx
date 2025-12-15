import { render, screen, fireEvent } from '@testing-library/react';
// CORRECCIÓN: Quitar llaves { } para importar por defecto
import CustomersScreen from '../CustomersScreen';
import React from 'react';
import { useCustomersData } from '@/features/customers/hooks/useCustomersData';

jest.mock('@/features/customers/hooks/useCustomersData');
jest.mock('@/hooks/useToast', () => ({
  useToast: () => ({ showError: jest.fn(), showSuccess: jest.fn() }),
}));

// Mocks simples para hijos
jest.mock('../CustomersTable/CustomersTable', () => ({ CustomersTable: () => <div>Table</div> }));
jest.mock('../CustomerModal/CustomerModal', () => ({ CustomerModal: () => <div>Modal</div> }));
jest.mock('../SearchControls/SearchControls', () => ({ SearchControls: () => <div>Controls</div> }));

describe('CustomersScreen', () => {
  const mockUseCustomersData = useCustomersData as jest.Mock;
  
  beforeEach(() => {
      mockUseCustomersData.mockReturnValue({
          customers: [], loading: false, loadCustomers: jest.fn(), 
          filteredCustomers: [], searchTerm: '', sortField: 'fullname',
          setSearchTerm: jest.fn(), formatCurrency: jest.fn(),
      });
  });

  it('should render main content', () => {
    render(<CustomersScreen />);
    expect(screen.getByText(/Clientes/i)).toBeInTheDocument();
  });
});
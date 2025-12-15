import { render, screen, fireEvent } from '@testing-library/react';
// CORRECCIÓN: Quitar llaves { }
import InventoryScreen from '../InventoryScreen';
import React from 'react';
import { useInventoryData } from '@/features/inventory/hooks/useInventoryData';

jest.mock('@/features/inventory/hooks/useInventoryData');
jest.mock('@/hooks/useToast', () => ({
  useToast: () => ({ showError: jest.fn(), showSuccess: jest.fn() }),
}));

jest.mock('../ProductsTable', () => ({ ProductsTable: () => <div>Table</div> }));
jest.mock('../ProductModal', () => ({ ProductModal: () => <div>Modal</div> }));
jest.mock('../SearchControls', () => ({ SearchControls: () => <div>Controls</div> }));

describe('InventoryScreen', () => {
  const mockUseInventoryData = useInventoryData as jest.Mock;

  beforeEach(() => {
      mockUseInventoryData.mockReturnValue({
          products: [], loading: false, loadProducts: jest.fn(),
          filteredProducts: [], searchTerm: '', 
          setSearchTerm: jest.fn(), handleSort: jest.fn()
      });
  });

  it('should render main content', () => {
    render(<InventoryScreen />);
    expect(screen.getByText(/Inventario/i)).toBeInTheDocument();
  });
});
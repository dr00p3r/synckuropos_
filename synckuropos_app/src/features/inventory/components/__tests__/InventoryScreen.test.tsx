import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import InventoryScreen from '@/features/inventory/components/InventoryScreen';

jest.mock('@/features/inventory/hooks/useInventoryData', () => ({
  useInventoryData: jest.fn(() => ({
    products: [
      {
        productId: '1',
        name: 'Product 1',
        description: 'Description 1',
        basePrice: 1000,
        cost: 500,
        stock: 10,
        isActive: true,
        category: 'Electronics',
        sku: 'SKU001',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _deleted: false,
      },
    ],
    filteredProducts: [
      {
        productId: '1',
        name: 'Product 1',
        description: 'Description 1',
        basePrice: 1000,
        cost: 500,
        stock: 10,
        isActive: true,
        category: 'Electronics',
        sku: 'SKU001',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _deleted: false,
      },
    ],
    loading: false,
    searchTerm: '',
    showInactive: false,
    sortField: 'name',
    sortDirection: 'asc',
    setSearchTerm: jest.fn(),
    setShowInactive: jest.fn(),
    handleSort: jest.fn(),
    loadProducts: jest.fn(),
    toggleProductStatus: jest.fn(),
  })),
}));

jest.mock('@/features/inventory/components/SearchControls', () => {
  return function MockSearchControls() {
    return <div data-testid="search-controls">Search Controls</div>;
  };
});

jest.mock('@/features/inventory/components/ProductsTable', () => {
  return function MockProductsTable() {
    return <div data-testid="products-table">Products Table</div>;
  };
});

jest.mock('@/features/inventory/components/ProductModal', () => ({
  ProductModal: () => <div data-testid="product-modal">Product Modal</div>,
}));

describe('InventoryScreen Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render inventory header', () => {
    render(<InventoryScreen />);
    expect(screen.getByText('Inventario')).toBeInTheDocument();
  });

  it('should render search controls', () => {
    render(<InventoryScreen />);
    expect(screen.getByTestId('search-controls')).toBeInTheDocument();
  });

  it('should render products table', () => {
    render(<InventoryScreen />);
    expect(screen.getByTestId('products-table')).toBeInTheDocument();
  });

  it('should render loading state when loading is true', () => {
    const mockUseInventoryData = require('@/features/inventory/hooks/useInventoryData').useInventoryData;
    mockUseInventoryData.mockReturnValueOnce({
      loading: true,
      products: [],
      filteredProducts: [],
    });

    render(<InventoryScreen />);
    expect(screen.getByText(/Cargando inventario/i)).toBeInTheDocument();
  });

  it('should initialize modal visibility state', () => {
    render(<InventoryScreen />);
    const modal = screen.queryByTestId('product-modal');
    expect(modal).not.toBeInTheDocument();
  });
});

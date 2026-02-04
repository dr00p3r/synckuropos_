import * as React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { useDatabase, DatabaseProvider } from '../useDatabase';

// Mock the database module
jest.mock('../../db', () => ({
  getDb: jest.fn(() => Promise.resolve({
    products: {},
    customers: {},
    supplyings: {},
    comboProducts: {},
    debts: {},
    debtPayments: {},
    sales: {},
    saleDetails: {},
    users: {},
  })),
}));

// Mock sample data initialization
jest.mock('../../utils/sampleData', () => ({
  initializeSampleData: jest.fn(() => Promise.resolve()),
}));

// Mock replication
jest.mock('../../db/replication', () => ({
  startReplications: jest.fn(() => Promise.resolve()),
}));

describe('useDatabase', () => {
  it('should throw error when used outside DatabaseProvider', () => {
    expect(() => {
      renderHook(() => useDatabase());
    }).toThrow('useDatabase debe ser usado dentro de un DatabaseProvider');
  });

  it('should return database when used inside DatabaseProvider', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      React.createElement(DatabaseProvider, null, children)
    );

    const { result } = renderHook(() => useDatabase(), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });
  });

  it('should have products collection', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      React.createElement(DatabaseProvider, null, children)
    );

    const { result } = renderHook(() => useDatabase(), { wrapper });

    await waitFor(() => {
      expect(result.current.products).toBeDefined();
    });
  });

  it('should have customers collection', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      React.createElement(DatabaseProvider, null, children)
    );

    const { result } = renderHook(() => useDatabase(), { wrapper });

    await waitFor(() => {
      expect(result.current.customers).toBeDefined();
    });
  });

  it('should have users collection', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      React.createElement(DatabaseProvider, null, children)
    );

    const { result } = renderHook(() => useDatabase(), { wrapper });

    await waitFor(() => {
      expect(result.current.users).toBeDefined();
    });
  });

  it('should have sales collection', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      React.createElement(DatabaseProvider, null, children)
    );

    const { result } = renderHook(() => useDatabase(), { wrapper });

    await waitFor(() => {
      expect(result.current.sales).toBeDefined();
    });
  });

  it('should have saleDetails collection', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      React.createElement(DatabaseProvider, null, children)
    );

    const { result } = renderHook(() => useDatabase(), { wrapper });

    await waitFor(() => {
      expect(result.current.saleDetails).toBeDefined();
    });
  });

  it('should have debts collection', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      React.createElement(DatabaseProvider, null, children)
    );

    const { result } = renderHook(() => useDatabase(), { wrapper });

    await waitFor(() => {
      expect(result.current.debts).toBeDefined();
    });
  });

  it('should have comboProducts collection', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      React.createElement(DatabaseProvider, null, children)
    );

    const { result } = renderHook(() => useDatabase(), { wrapper });

    await waitFor(() => {
      expect(result.current.comboProducts).toBeDefined();
    });
  });
});

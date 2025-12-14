import { renderHook, act } from '@testing-library/react';
import { DatabaseProvider, useDatabase } from '@/hooks/useDatabase';
import React from 'react';

jest.mock('@/db', () => ({
  getDb: jest.fn(),
}));

jest.mock('@/helpers/replication', () => ({
  startReplications: jest.fn(),
}));

jest.mock('@/utils/sampleData', () => ({
  initializeSampleData: jest.fn(),
}));

describe('useDatabase Hook', () => {
  const mockDb = {
    collections: {
      products: {},
      customers: {},
      users: {},
      sales: {},
      saleDetails: {},
      debts: {},
      debtPayments: {},
      supplyings: {},
      comboProducts: {},
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    const { getDb } = require('@/db');
    getDb.mockResolvedValue(mockDb);
  });

  it('should provide database instance to consumers', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <DatabaseProvider>{children}</DatabaseProvider>
    );

    const { result } = renderHook(() => useDatabase(), { wrapper });

    expect(result.current).toBeDefined();
  });

  it('should throw error when used outside DatabaseProvider', () => {
    // Suppress console.error for this test
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useDatabase());
    }).toThrow();

    consoleError.mockRestore();
  });

  it('should initialize database on mount', async () => {
    const { getDb } = require('@/db');

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <DatabaseProvider>{children}</DatabaseProvider>
    );

    const { result } = renderHook(() => useDatabase(), { wrapper });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(getDb).toHaveBeenCalled();
  });

  it('should provide access to all collections', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <DatabaseProvider>{children}</DatabaseProvider>
    );

    const { result } = renderHook(() => useDatabase(), { wrapper });

    expect(result.current).toHaveProperty('collections');
    expect(result.current.collections).toHaveProperty('products');
    expect(result.current.collections).toHaveProperty('customers');
    expect(result.current.collections).toHaveProperty('users');
  });

  it('should initialize sample data on database setup', async () => {
    const { initializeSampleData } = require('@/utils/sampleData');

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <DatabaseProvider>{children}</DatabaseProvider>
    );

    renderHook(() => useDatabase(), { wrapper });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(initializeSampleData).toHaveBeenCalledWith(mockDb);
  });

  it('should start replications after database initialization', async () => {
    const { startReplications } = require('@/helpers/replication');

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <DatabaseProvider>{children}</DatabaseProvider>
    );

    renderHook(() => useDatabase(), { wrapper });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(startReplications).toHaveBeenCalledWith(mockDb);
  });

  it('should handle database initialization errors gracefully', async () => {
    const { getDb } = require('@/db');
    getDb.mockRejectedValueOnce(new Error('Database initialization failed'));

    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <DatabaseProvider>{children}</DatabaseProvider>
    );

    renderHook(() => useDatabase(), { wrapper });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    consoleError.mockRestore();
  });
});

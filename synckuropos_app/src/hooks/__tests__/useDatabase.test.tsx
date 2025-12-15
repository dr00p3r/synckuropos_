import { renderHook, act } from '@testing-library/react';
import { DatabaseProvider, useDatabase } from '@/hooks/useDatabase';
import React from 'react';

// Importamos directamente en lugar de usar require dentro de los tests
import { getDb } from '@/db';
import { startReplications } from '@/helpers/replication';
import { initializeSampleData } from '@/utils/sampleData';

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
    (getDb as jest.Mock).mockResolvedValue(mockDb);
  });

  // ... El resto de tus tests igual, pero eliminando las líneas "const { getDb } = require..."
  // Ejemplo:

  it('should initialize database on mount', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <DatabaseProvider>{children}</DatabaseProvider>
    );

    renderHook(() => useDatabase(), { wrapper });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(getDb).toHaveBeenCalled();
  });
  
  // ... resto de tests
});
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCustomersData } from '@/features/customers/hooks/useCustomersData';
import { useDatabase } from '@/hooks/useDatabase';

jest.mock('@/hooks/useDatabase');
jest.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    showError: jest.fn(),
    showSuccess: jest.fn(),
  }),
}));

describe('useCustomersData', () => {
  const mockUseDatabase = useDatabase as jest.Mock;

  const mockCustomers = {
    find: jest.fn(),
  };
  
  const mockDebts = {
    find: jest.fn(),
  };
  
  const mockDebtPayments = {
    find: jest.fn(),
  };

  const mockDbReturn = {
    customers: mockCustomers,
    debts: mockDebts,
    debtPayments: mockDebtPayments,
  };

  const mockCustomer = {
    customerId: 'cust-123',
    fullname: 'John Doe',
    email: 'john@example.com',
    phone: '0987654321',
    address: '123 Main St',
    city: 'Quito',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDatabase.mockReturnValue(mockDbReturn);
  });

  describe('loadCustomers', () => {
    it('should retrieve and set customers on mount', async () => {
      // Mock de clientes
      mockCustomers.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([{ toJSON: () => mockCustomer }]),
      });
      
      // Mock de deudas (array vacío para simplificar)
      mockDebts.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      const { result } = renderHook(() => useCustomersData());

      // Esperar a que loading sea falso
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.customers).toHaveLength(1);
      expect(result.current.customers[0].fullname).toBe('John Doe');
    });
  });

  describe('Filtering and Sorting', () => {
    it('should filter customers by search term', async () => {
       mockCustomers.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([{ toJSON: () => mockCustomer }]),
      });
      mockDebts.find.mockReturnValue({ exec: jest.fn().mockResolvedValue([]) });

      const { result } = renderHook(() => useCustomersData());
      
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => {
        result.current.setSearchTerm('John');
      });

      expect(result.current.filteredCustomers).toHaveLength(1);

      act(() => {
        result.current.setSearchTerm('XYZ');
      });

      expect(result.current.filteredCustomers).toHaveLength(0);
    });

    it('should sort customers', async () => {
        const customerB = { ...mockCustomer, customerId: '2', fullname: 'Zack' };
        mockCustomers.find.mockReturnValue({
            exec: jest.fn().mockResolvedValue([
                { toJSON: () => mockCustomer }, // John
                { toJSON: () => customerB }     // Zack
            ]),
        });
        mockDebts.find.mockReturnValue({ exec: jest.fn().mockResolvedValue([]) });

        const { result } = renderHook(() => useCustomersData());
        await waitFor(() => expect(result.current.loading).toBe(false));

        // Por defecto ordena por nombre ASC
        expect(result.current.customers[0].fullname).toBe('John Doe');
        expect(result.current.customers[1].fullname).toBe('Zack');

        // Cambiar a DESC
        act(() => {
            result.current.handleSort('fullname');
        });

        expect(result.current.customers[0].fullname).toBe('Zack');
        expect(result.current.customers[1].fullname).toBe('John Doe');
    });
  });
});
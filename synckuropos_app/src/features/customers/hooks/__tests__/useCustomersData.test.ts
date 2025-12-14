import { renderHook, act } from '@testing-library/react';
import { useCustomersData } from '@/features/customers/hooks/useCustomersData';
import { useDatabase } from '@/hooks/useDatabase';

jest.mock('@/hooks/useDatabase');
jest.mock('@/hooks/useToast');

describe('useCustomersData', () => {
  const mockUseDatabase = useDatabase as jest.Mock;

  const mockCustomers = {
    find: jest.fn(),
    findOne: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
  };

  const mockDebts = {
    find: jest.fn(),
  };

  const mockDbReturn = {
    customers: mockCustomers,
    debts: mockDebts,
  };

  const mockCustomer = {
    customerId: 'cust-123',
    name: 'John Doe',
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

  describe('getAllCustomers', () => {
    it('should retrieve all customers', async () => {
      mockCustomers.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([{ toJSON: () => mockCustomer }]),
      });

      const { result } = renderHook(() => useCustomersData());

      let customers: any[] = [];
      await act(async () => {
        customers = await result.current.getAllCustomers();
      });

      expect(customers).toHaveLength(1);
      expect(customers[0].name).toBe('John Doe');
    });

    it('should retrieve only active customers when requested', async () => {
      mockCustomers.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([{ toJSON: () => mockCustomer }]),
      });

      const { result } = renderHook(() => useCustomersData());

      let customers: any[] = [];
      await act(async () => {
        customers = await result.current.getAllCustomers(true);
      });

      expect(customers).toHaveLength(1);
    });
  });

  describe('createCustomer', () => {
    it('should create a new customer', async () => {
      mockCustomers.insert.mockResolvedValue({
        toJSON: () => mockCustomer,
      });

      const { result } = renderHook(() => useCustomersData());

      let created: any = null;
      await act(async () => {
        created = await result.current.createCustomer(mockCustomer);
      });

      expect(mockCustomers.insert).toHaveBeenCalled();
    });
  });

  describe('updateCustomer', () => {
    it('should update an existing customer', async () => {
      const updatedCustomer = { ...mockCustomer, name: 'Jane Doe' };
      mockCustomers.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          toJSON: () => mockCustomer,
          update: jest.fn().mockResolvedValue({}),
        }),
      });

      const { result } = renderHook(() => useCustomersData());

      let updated = false;
      await act(async () => {
        updated = await result.current.updateCustomer(updatedCustomer);
      });

      expect(updated).toBe(true);
    });
  });

  describe('searchCustomers', () => {
    it('should search customers by name or email', async () => {
      mockCustomers.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([{ toJSON: () => mockCustomer }]),
      });

      const { result } = renderHook(() => useCustomersData());

      let results: any[] = [];
      await act(async () => {
        results = await result.current.searchCustomers('John');
      });

      expect(results).toHaveLength(1);
    });
  });

  describe('getCustomerDebts', () => {
    it('should retrieve customer debts', async () => {
      const mockDebt = {
        debtId: 'debt-123',
        customerId: 'cust-123',
        amount: 5000,
        status: 'pending',
      };

      mockDebts.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([{ toJSON: () => mockDebt }]),
      });

      const { result } = renderHook(() => useCustomersData());

      let debts: any[] = [];
      await act(async () => {
        debts = await result.current.getCustomerDebts('cust-123');
      });

      expect(debts).toBeDefined();
    });
  });
});

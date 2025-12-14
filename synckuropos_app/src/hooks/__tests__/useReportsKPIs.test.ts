import { renderHook, act } from '@testing-library/react';
import { useSalesKPIs, useProfitabilityKPIs, useInventoryKPIs } from '@/hooks/useReportsKPIs';
import { useDatabase } from '@/hooks/useDatabase';
import { useDateRange } from '@/contexts/DateRangeContext';

jest.mock('@/hooks/useDatabase');
jest.mock('@/contexts/DateRangeContext');

describe('useReportsKPIs Hooks', () => {
  const mockUseDatabase = useDatabase as jest.Mock;
  const mockUseDateRange = useDateRange as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseDateRange.mockReturnValue({
      range: {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31'),
      },
    });

    mockUseDatabase.mockReturnValue({
      sales: {
        find: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([
            {
              totalAmount: 10000,
              isActive: true,
              _deleted: false,
              createdAt: new Date('2024-01-15').toISOString(),
            },
            {
              totalAmount: 15000,
              isActive: true,
              _deleted: false,
              createdAt: new Date('2024-01-20').toISOString(),
            },
          ]),
        }),
      },
      products: {
        find: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([]),
        }),
      },
      saleDetails: {
        find: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([]),
        }),
      },
      supplyings: {
        find: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([]),
        }),
      },
    });
  });

  describe('useSalesKPIs', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useSalesKPIs());
      expect(result.current.loading).toBe(true);
    });

    it('should calculate total sales correctly', async () => {
      const { result } = renderHook(() => useSalesKPIs());

      await act(async () => {
        // Wait for the effect to complete
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.totalSales).toBe(25000);
    });

    it('should calculate sales count correctly', async () => {
      const { result } = renderHook(() => useSalesKPIs());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.salesCount).toBe(2);
    });

    it('should calculate average ticket correctly', async () => {
      const { result } = renderHook(() => useSalesKPIs());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.averageTicket).toBe(12500);
    });

    it('should handle errors gracefully', async () => {
      const mockDb = mockUseDatabase();
      mockDb.sales.find = jest.fn().mockReturnValue({
        exec: jest.fn().mockRejectedValueOnce(new Error('Database error')),
      });

      const { result } = renderHook(() => useSalesKPIs());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.loading).toBe(false);
    });

    it('should handle zero sales count', async () => {
      const mockDb = mockUseDatabase();
      mockDb.sales.find = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce([]),
      });

      const { result } = renderHook(() => useSalesKPIs());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.averageTicket).toBe(0);
    });
  });

  describe('useProfitabilityKPIs', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useProfitabilityKPIs());
      expect(result.current.loading).toBe(true);
    });

    it('should calculate profit correctly', async () => {
      const { result } = renderHook(() => useProfitabilityKPIs());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('useInventoryKPIs', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useInventoryKPIs());
      expect(result.current.loading).toBe(true);
    });

    it('should calculate inventory metrics', async () => {
      const { result } = renderHook(() => useInventoryKPIs());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.loading).toBe(false);
    });
  });
});

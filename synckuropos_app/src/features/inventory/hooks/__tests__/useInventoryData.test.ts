import { renderHook, act, waitFor } from '@testing-library/react';
import { useInventoryData } from '@/features/inventory/hooks/useInventoryData';
import { useDatabase } from '@/hooks/useDatabase';

jest.mock('@/hooks/useDatabase');
jest.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    showError: jest.fn(),
    showSuccess: jest.fn(),
  }),
}));

describe('useInventoryData', () => {
  const mockUseDatabase = useDatabase as jest.Mock;

  const mockProducts = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockDbReturn = {
    products: mockProducts,
  };

  // Mock completo que cumple con la interfaz Product
  const mockProduct = {
    productId: 'prod-123',
    code: 'CODE123',
    name: 'Test Product',
    stock: 100,
    basePrice: 5000,
    isActive: true,
    isTaxable: true,
    allowDecimalQuantity: false,
    _deleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    toJSON: function() { return this; }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDatabase.mockReturnValue(mockDbReturn);
    mockProducts.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([ { toJSON: () => mockProduct } ])
        })
    });
  });

  describe('initialization', () => {
    it('should load products on mount', async () => {
      const { result } = renderHook(() => useInventoryData());

      await waitFor(() => {
          expect(result.current.loading).toBe(false);
      });

      expect(result.current.products).toHaveLength(1);
    });
  });

  describe('toggleProductStatus', () => {
    it('should toggle product active status', async () => {
      const updateMock = jest.fn().mockResolvedValue({});
      mockProducts.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          update: updateMock,
        }),
      });

      const { result } = renderHook(() => useInventoryData());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.toggleProductStatus(mockProduct);
      });

      expect(mockProducts.findOne).toHaveBeenCalledWith({
          selector: { productId: mockProduct.productId }
      });
      expect(updateMock).toHaveBeenCalled();
    });
  });
});
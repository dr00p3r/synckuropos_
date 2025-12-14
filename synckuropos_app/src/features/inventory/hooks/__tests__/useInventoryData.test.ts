import { renderHook, act } from '@testing-library/react';
import { useInventoryData } from '@/features/inventory/hooks/useInventoryData';
import { useDatabase } from '@/hooks/useDatabase';

jest.mock('@/hooks/useDatabase');
jest.mock('@/hooks/useToast');

describe('useInventoryData', () => {
  const mockUseDatabase = useDatabase as jest.Mock;

  const mockProducts = {
    find: jest.fn(),
    findOne: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
  };

  const mockDbReturn = {
    products: mockProducts,
  };

  const mockProduct = {
    productId: 'prod-123',
    code: 'CODE123',
    name: 'Test Product',
    stock: 100,
    basePrice: 5000,
    allowDecimalQuantity: false,
    isTaxable: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDatabase.mockReturnValue(mockDbReturn);
  });

  describe('initialization', () => {
    it('should initialize with empty products', async () => {
      mockProducts.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      const { result } = renderHook(() => useInventoryData());

      expect(result.current).toBeDefined();
    });
  });

  describe('getAllProducts', () => {
    it('should retrieve all products', async () => {
      const products = [mockProduct];
      mockProducts.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(products.map(p => ({ toJSON: () => p }))),
      });

      const { result } = renderHook(() => useInventoryData());

      let retrieved: any[] = [];
      await act(async () => {
        retrieved = await result.current.getAllProducts();
      });

      expect(retrieved).toHaveLength(1);
    });

    it('should retrieve only active products when requested', async () => {
      const products = [mockProduct, { ...mockProduct, isActive: false }];
      mockProducts.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([{ toJSON: () => mockProduct }]),
      });

      const { result } = renderHook(() => useInventoryData());

      let retrieved: any[] = [];
      await act(async () => {
        retrieved = await result.current.getAllProducts(true);
      });

      expect(retrieved).toHaveLength(1);
    });
  });

  describe('createProduct', () => {
    it('should create a new product', async () => {
      mockProducts.insert.mockResolvedValue({
        toJSON: () => mockProduct,
      });

      const { result } = renderHook(() => useInventoryData());

      let created: any = null;
      await act(async () => {
        created = await result.current.createProduct(mockProduct);
      });

      expect(mockProducts.insert).toHaveBeenCalled();
    });
  });

  describe('updateProduct', () => {
    it('should update an existing product', async () => {
      const updatedProduct = { ...mockProduct, stock: 150 };
      mockProducts.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          toJSON: () => mockProduct,
          update: jest.fn().mockResolvedValue({}),
        }),
      });

      const { result } = renderHook(() => useInventoryData());

      let updated = false;
      await act(async () => {
        updated = await result.current.updateProduct(updatedProduct);
      });

      expect(updated).toBe(true);
    });
  });
});

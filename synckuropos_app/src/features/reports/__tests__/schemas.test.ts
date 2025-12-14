import { productSchema } from '@schemas/product.schema';
import { customerSchema } from '@schemas/customer.schema';
import { userSchema } from '@schemas/user.schema';
import { saleSchema } from '@schemas/sale.schema';

describe('Database Schemas', () => {
  describe('productSchema', () => {
    it('should have required fields', () => {
      expect(productSchema.required).toBeDefined();
      expect(productSchema.required).toContain('productId');
      expect(productSchema.required).toContain('name');
    });

    it('should define productId as primary key', () => {
      expect(productSchema.primaryKey).toBe('productId');
    });

    it('should have type object', () => {
      expect(productSchema.type).toBe('object');
    });

    it('should have product properties', () => {
      expect(productSchema.properties.productId).toBeDefined();
      expect(productSchema.properties.name).toBeDefined();
      expect(productSchema.properties.stock).toBeDefined();
      expect(productSchema.properties.basePrice).toBeDefined();
    });

    it('should allow decimal quantities optionally', () => {
      expect(productSchema.properties.allowDecimalQuantity.type).toBe('boolean');
      expect(productSchema.properties.allowDecimalQuantity.default).toBe(false);
    });

    it('should track active status', () => {
      expect(productSchema.properties.isActive).toBeDefined();
      expect(productSchema.properties.isActive.default).toBe(true);
    });

    it('should track timestamps', () => {
      expect(productSchema.properties.createdAt).toBeDefined();
      expect(productSchema.properties.updatedAt).toBeDefined();
    });
  });

  describe('customerSchema', () => {
    it('should have required fields', () => {
      expect(customerSchema.required).toBeDefined();
    });

    it('should define customerId as primary key', () => {
      expect(customerSchema.primaryKey).toBe('customerId');
    });

    it('should have customer contact properties', () => {
      expect(customerSchema.properties.fullname).toBeDefined();
      expect(customerSchema.properties.email).toBeDefined();
      expect(customerSchema.properties.phone).toBeDefined();
      expect(customerSchema.properties.address).toBeDefined();
    });

    it('should track active status', () => {
      expect(customerSchema.properties.isActive).toBeDefined();
    });
  });

  describe('userSchema', () => {
    it('should have required fields', () => {
      expect(userSchema.required).toBeDefined();
    });

    it('should define userId as primary key', () => {
      expect(userSchema.primaryKey).toBe('userId');
    });

    it('should have user authentication properties', () => {
      expect(userSchema.properties.username).toBeDefined();
      expect(userSchema.properties.passwordHash).toBeDefined();
    });

    it('should have user role property', () => {
      expect(userSchema.properties.role).toBeDefined();
    });

    it('should track active status', () => {
      expect(userSchema.properties.isActive).toBeDefined();
    });
  });

  describe('saleSchema', () => {
    it('should have required fields', () => {
      expect(saleSchema.required).toBeDefined();
    });

    it('should define saleId as primary key', () => {
      expect(saleSchema.primaryKey).toBe('saleId');
    });

    it('should have sale transaction properties', () => {
      expect(saleSchema.properties.saleId).toBeDefined();
      expect(saleSchema.properties.totalAmount).toBeDefined();
    });

    it('should track sale timestamp', () => {
      expect(saleSchema.properties.createdAt).toBeDefined();
    });
  });
});

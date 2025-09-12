import type { AppDatabase } from '../hooks/useDatabase.tsx';
import type { Product } from '../types/types';

// Datos de productos de ejemplo para pruebas
const sampleProducts: Omit<Product, 'createdAt' | 'updatedAt'>[] = [
  {
    productId: '1',
    code: '7501234567890',
    name: 'Coca Cola 600ml',
    stock: 100,
    basePrice: 25.50,
    isTaxable: true,
    allowDecimalQuantity: false,
    isActive: true
  },
  {
    productId: '2', 
    code: '7501234567891',
    name: 'Pepsi 600ml',
    stock: 80,
    basePrice: 24.00,
    isTaxable: true,
    allowDecimalQuantity: false,
    isActive: true
  },
  {
    productId: '3',
    code: '7501234567892', 
    name: 'Agua Natural 1L',
    stock: 150,
    basePrice: 12.00,
    isTaxable: true,
    allowDecimalQuantity: false,
    isActive: true
  },
  {
    productId: '4',
    code: '7501234567893',
    name: 'Leche Entera 1L',
    stock: 50,
    basePrice: 28.50,
    isTaxable: false,
    allowDecimalQuantity: false,
    isActive: true
  },
  {
    productId: '5',
    code: '7501234567894',
    name: 'Pan Blanco Rebanado',
    stock: 30,
    basePrice: 32.00,
    isTaxable: false,
    allowDecimalQuantity: false,
    isActive: true
  },
  {
    productId: '6',
    code: '7501234567895',
    name: 'Queso Fresco por Kg',
    stock: 25,
    basePrice: 85.00,
    isTaxable: false,
    allowDecimalQuantity: true, // Permite decimales para peso
    isActive: true
  },
  {
    productId: '7',
    code: '7501234567896',
    name: 'Jabón Liquido 500ml',
    stock: 40,
    basePrice: 45.00,
    isTaxable: true,
    allowDecimalQuantity: false,
    isActive: true
  },
  {
    productId: '8',
    code: '7501234567897',
    name: 'Papel Higiénico 4 rollos',
    stock: 60,
    basePrice: 38.50,
    isTaxable: true,
    allowDecimalQuantity: false,
    isActive: true
  },
  {
    productId: '9',
    code: '7501234567898',
    name: 'Carne Molida por Kg',
    stock: 20,
    basePrice: 120.00,
    isTaxable: false,
    allowDecimalQuantity: true, // Permite decimales para peso
    isActive: true
  },
  {
    productId: '10',
    code: '7501234567899',
    name: 'Cereal Corn Flakes 500g',
    stock: 35,
    basePrice: 68.00,
    isTaxable: true,
    allowDecimalQuantity: false,
    isActive: true
  }
];

export const initializeSampleData = async (db: AppDatabase) => {
  try {
    // Verificar si ya existen productos
    const existingProducts = await db.collections.products.find().limit(1).exec();
    
    if (existingProducts.length > 0) {
      console.log('Los productos de ejemplo ya existen en la base de datos');
      return;
    }

    // Insertar productos de ejemplo
    const currentTime = new Date().toISOString();
    const productsToInsert = sampleProducts.map(product => ({
      ...product,
      createdAt: currentTime,
      updatedAt: currentTime
    }));

    await db.collections.products.bulkInsert(productsToInsert);
    
    console.log('✅ Productos de ejemplo insertados correctamente:', productsToInsert.length);
    
    return productsToInsert;
  } catch (error) {
    console.error('❌ Error insertando productos de ejemplo:', error);
    throw error;
  }
};

// Función para limpiar datos de prueba (útil para desarrollo)
export const clearSampleData = async (db: AppDatabase) => {
  try {
    const sampleProductIds = sampleProducts.map(p => p.productId);
    
    const productsToDelete = await db.collections.products
      .find({
        selector: {
          productId: { $in: sampleProductIds }
        }
      })
      .exec();

    for (const product of productsToDelete) {
      await product.remove();
    }
    
    console.log('🗑️ Productos de ejemplo eliminados:', productsToDelete.length);
  } catch (error) {
    console.error('❌ Error eliminando productos de ejemplo:', error);
    throw error;
  }
};

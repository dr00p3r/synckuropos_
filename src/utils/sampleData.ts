import bcrypt from 'bcryptjs';
import type { AppDatabase } from '../hooks/useDatabase.tsx';
import type { Product, User } from '../types/types';

// Datos de productos de ejemplo para pruebas
const sampleProducts: Omit<Product, 'createdAt' | 'updatedAt'>[] = [
  {
    productId: '1',
    code: '7501234567890',
    name: 'Coca Cola 600ml',
    stock: 100,
    basePrice: 255,
    isTaxable: true,
    allowDecimalQuantity: false,
    _deleted: false
  },
  {
    productId: '2', 
    code: '7501234567891',
    name: 'Pepsi 600ml',
    stock: 80,
    basePrice: 240,
    isTaxable: true,
    allowDecimalQuantity: false,
    _deleted: false
  },
  {
    productId: '3',
    code: '7501234567892', 
    name: 'Agua Natural 1L',
    stock: 150,
    basePrice: 120,
    isTaxable: true,
    allowDecimalQuantity: false,
    _deleted: false
  },
  {
    productId: '4',
    code: '7501234567893',
    name: 'Leche Entera 1L',
    stock: 50,
    basePrice: 285,
    isTaxable: false,
    allowDecimalQuantity: false,
    _deleted: false
  },
  {
    productId: '5',
    code: '7501234567894',
    name: 'Pan Blanco Rebanado',
    stock: 30,
    basePrice: 320,
    isTaxable: false,
    allowDecimalQuantity: false,
    _deleted: false
  },
  {
    productId: '6',
    code: '7501234567895',
    name: 'Queso Fresco por Kg',
    stock: 25,
    basePrice: 850,
    isTaxable: false,
    allowDecimalQuantity: true, // Permite decimales para peso
    _deleted: false
  },
  {
    productId: '7',
    code: '7501234567896',
    name: 'Jabón Liquido 500ml',
    stock: 40,
    basePrice: 450,
    isTaxable: true,
    allowDecimalQuantity: false,
    _deleted: false
  },
  {
    productId: '8',
    code: '7501234567897',
    name: 'Papel Higiénico 4 rollos',
    stock: 60,
    basePrice: 385,
    isTaxable: true,
    allowDecimalQuantity: false,
    _deleted: false
  },
  {
    productId: '9',
    code: '7501234567898',
    name: 'Carne Molida por Kg',
    stock: 20,
    basePrice: 1200,
    isTaxable: false,
    allowDecimalQuantity: true, // Permite decimales para peso
    _deleted: false
  },
  {
    productId: '10',
    code: '7501234567899',
    name: 'Cereal Corn Flakes 500g',
    stock: 35,
    basePrice: 680,
    isTaxable: true,
    allowDecimalQuantity: false,
    _deleted: false
  }
];

// Datos de usuarios de ejemplo para pruebas
const sampleUsers: Omit<User, 'createdAt' | 'updatedAt' | 'passwordHash'>[] = [
  {
    userId: 'admin-001',
    username: 'admin',
    role: 'admin',
    _deleted: false
  },
  {
    userId: 'cajero-001', 
    username: 'cajero',
    role: 'cajero',
    _deleted: false
  }
];

export const initializeSampleData = async (db: AppDatabase) => {
  try {
    const currentTime = new Date().toISOString();

    // Verificar si ya existen productos
    const existingProducts = await db.collections.products.find().limit(1).exec();
    
    if (existingProducts.length === 0) {
      // Insertar productos de ejemplo
      const productsToInsert = sampleProducts.map(product => ({
        ...product,
        createdAt: currentTime,
        updatedAt: currentTime
      }));

      await db.collections.products.bulkInsert(productsToInsert);
      console.log('✅ Productos de ejemplo insertados correctamente:', productsToInsert.length);
    } else {
      console.log('Los productos de ejemplo ya existen en la base de datos');
    }

    // Verificar si ya existen usuarios
    const existingUsers = await db.collections.users.find().limit(1).exec();
    
    if (existingUsers.length === 0) {
      // Insertar usuarios de ejemplo con contraseñas hasheadas
      const saltRounds = 10;
      const defaultPassword = '123456'; // Contraseña por defecto para pruebas
      const passwordHash = await bcrypt.hash(defaultPassword, saltRounds);

      const usersToInsert = sampleUsers.map(user => ({
        ...user,
        passwordHash,
        createdAt: currentTime,
        updatedAt: currentTime
      }));

      await db.collections.users.bulkInsert(usersToInsert);
      console.log('✅ Usuarios de ejemplo insertados correctamente:', usersToInsert.length);
      console.log('🔑 Credenciales por defecto:');
      console.log('   👨‍💼 Admin - Usuario: admin, Contraseña: 123456');
      console.log('   👨‍💻 Cajero - Usuario: cajero, Contraseña: 123456');
    } else {
      console.log('Los usuarios de ejemplo ya existen en la base de datos');
    }
    
  } catch (error) {
    console.error('❌ Error insertando datos de ejemplo:', error);
    throw error;
  }
};

// Función para limpiar datos de prueba (útil para desarrollo)
export const clearSampleData = async (db: AppDatabase) => {
  try {
    const sampleProductIds = sampleProducts.map(p => p.productId);
    const sampleUserIds = sampleUsers.map(u => u.userId);
    
    // Eliminar productos de ejemplo
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

    // Eliminar usuarios de ejemplo
    const usersToDelete = await db.collections.users
      .find({
        selector: {
          userId: { $in: sampleUserIds }
        }
      })
      .exec();

    for (const user of usersToDelete) {
      await user.remove();
    }
    
    console.log('🗑️ Productos de ejemplo eliminados:', productsToDelete.length);
    console.log('🗑️ Usuarios de ejemplo eliminados:', usersToDelete.length);
  } catch (error) {
    console.error('❌ Error eliminando datos de ejemplo:', error);
    throw error;
  }
};

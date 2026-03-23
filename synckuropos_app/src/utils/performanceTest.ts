import type { AppDatabase } from '@/hooks';
import type { Product } from '../types/types';

const ADJECTIVES = ['Nuevo', 'Gran', 'Pequeño', 'Rojo', 'Azul', 'Verde', 'Premium', 'Eco', 'Super', 'Mega'];
const NOUNS = ['Caja', 'Botella', 'Paquete', 'Bolsa', 'Lata', 'Frasco', 'Kilo', 'Litro', 'Pieza', 'Juego'];
const CATEGORIES = ['Bebidas', 'Alimentos', 'Limpieza', 'Hogar', 'Cuidado Personal', 'Mascotas', 'Electrónica', 'Juguetes'];

const getRandomElement = <T>(array: T[]): T => {
    return array[Math.floor(Math.random() * array.length)];
};

const getRandomInt = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const generateRandomProduct = (index: number): Omit<Product, 'createdAt' | 'updatedAt'> => {
    const timestamp = Date.now();
    const randomAdjective = getRandomElement(ADJECTIVES);
    const randomNoun = getRandomElement(NOUNS);
    const randomCategory = getRandomElement(CATEGORIES);

    return {
        productId: `perf_test_${timestamp}_${index}`,
        code: `${1000000000000 + index}`,
        name: `${randomNoun} ${randomAdjective} - ${randomCategory} ${index}`,
        stock: getRandomInt(0, 500),
        basePrice: getRandomInt(50, 5000), // 0.50 to 50.00
        isTaxable: Math.random() > 0.3,
        allowDecimalQuantity: Math.random() > 0.8,
        isActive: true,
        _deleted: false,
    };
};

export const generatePerformanceData = async (db: AppDatabase, count: number = 1000) => {
    try {
        const startTime = performance.now();
        const productsToInsert: any[] = [];
        const currentTime = new Date().toISOString();

        for (let i = 0; i < count; i++) {
            productsToInsert.push({
                ...generateRandomProduct(i),
                createdAt: currentTime,
                updatedAt: currentTime
            });
        }

        // Bulk insert for better performance
        // RxDB bulkInsert typically returns an object with success and error results
        const result = await db.collections.products.bulkInsert(productsToInsert);

        const endTime = performance.now();
        const duration = (endTime - startTime).toFixed(2);

        if (result.error.length > 0) {
            console.warn(`⚠️ Failed to insert ${result.error.length} products`);
            console.error(result.error);
        }

        return {
            success: true,
            count: result.success.length,
            errors: result.error.length,
            duration
        };

    } catch (error) {
        console.error('❌ Error generating performance data:', error);
        throw error;
    }
};

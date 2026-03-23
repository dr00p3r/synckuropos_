import type { AppDatabase } from '@/hooks';
import type { Customer } from '../types/types';

const FinalConsumerClient: Customer = {
  customerId: '9999999999',
  fullname: 'Consumidor Final',
  phone: undefined,
  email: undefined,
  address: undefined,
  allowCredit: false,
  creditLimit: 0,
  isActive: true,
  _deleted: false,
  createdAt: '',
  updatedAt: ''
}

export const initializeSampleData = async (db: AppDatabase) => {
  try {
    const currentTime = new Date().toISOString();

    await db.customers.upsert({
      ...FinalConsumerClient,
      createdAt: currentTime,
      updatedAt: currentTime
    });
    
    console.log('Cliente Consumidor Final inicializado.');
  } catch (error) {
    console.error('Error insertando datos de ejemplo (Consumidor Final):', error);
    throw error;
  }
};

export const clearSampleData = async (_db: AppDatabase) => {
  // Empty implementation since we only keep the final consumer and it shouldn't be generally cleared.
};

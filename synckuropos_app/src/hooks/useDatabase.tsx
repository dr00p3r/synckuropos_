import { 
  useState, 
  useEffect, 
  useContext, 
  createContext,
} from 'react';

import { getDb } from '../db';
import { startReplications } from '../helpers/replication';

import type { FC, ReactNode } from 'react';
import type { RxDatabase, RxCollection } from 'rxdb';
import type { 
  Product, 
  Customer,
  Supplying,
  ComboProduct,
  Debt,
  DebtPayment,
  Sale,
  SaleDetail,
  User
} from '../types/types';

// Definición del tipo de la base de datos
export type AppDatabaseCollections = {
  products: RxCollection<Product>;
  customers: RxCollection<Customer>;
  supplyings: RxCollection<Supplying>;
  comboProducts: RxCollection<ComboProduct>;
  debts: RxCollection<Debt>;
  debtPayments: RxCollection<DebtPayment>;
  sales: RxCollection<Sale>;
  saleDetails: RxCollection<SaleDetail>;
  users: RxCollection<User>;
};

export type AppDatabase = RxDatabase<AppDatabaseCollections>;

// Contexto con el tipo de la base de datos
const DbContext = createContext<AppDatabase | null>(null);

interface DatabaseProviderProps {
  children: ReactNode;
}

export const DatabaseProvider: FC<DatabaseProviderProps> = ({ children }) => {
  const [db, setDb] = useState<AppDatabase | null>(null);

  useEffect(() => {
    const initDb = async () => {
      try {
        const dbInstance = await getDb();
        setDb(dbInstance);
        
        // Init sample data
        //const { initializeSampleData } = await import('../utils/sampleData');
        //await initializeSampleData(dbInstance);
        console.log('✅ Base de datos inicializada correctamente');

        // Init replications
        await startReplications(dbInstance);
        console.log('✅ Replicaciones iniciadas correctamente');

      } catch (error) {
        console.error('❌ Error inicializando la base de datos:', error);
      }
    };

    initDb();
  }, []);

  if (!db) {
    return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '18px',
          color: '#2A423E'
        }}>
          🔄 Cargando base de datos...
        </div>
    );
  }

  return <DbContext.Provider value={db}>{children}</DbContext.Provider>;
};

export const useDatabase = (): AppDatabase => {
  const db = useContext(DbContext);
  
  if (!db) {
    throw new Error('useDatabase debe ser usado dentro de un DatabaseProvider');
  }
  
  return db;
};

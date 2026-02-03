import {
  useState,
  useEffect,
  useContext,
  createContext,
} from 'react';

import { startReplications } from '../db/replication';
import { getDb } from '../db';
import { useTelemetry } from './useTelemetry';
import { TelemetryEvents } from '../types/telemetryEvents';

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
  User,
  Telemetry,
  SystemHealth
} from '../types/types';

// Definición del tipo de la base de datos
export interface AppDatabaseCollections {
  products: RxCollection<Product>;
  customers: RxCollection<Customer>;
  supplyings: RxCollection<Supplying>;
  comboProducts: RxCollection<ComboProduct>;
  debts: RxCollection<Debt>;
  debtPayments: RxCollection<DebtPayment>;
  sales: RxCollection<Sale>;
  saleDetails: RxCollection<SaleDetail>;
  users: RxCollection<User>;
  telemetry: RxCollection<Telemetry>;
  system_health: RxCollection<SystemHealth>;
}

export type AppDatabase = RxDatabase<AppDatabaseCollections>;

const DbContext = createContext<AppDatabase | null>(null);

interface DatabaseProviderProps {
  children: ReactNode;
}

export const DatabaseProvider: FC<DatabaseProviderProps> = ({ children }) => {
  const [db, setDb] = useState<AppDatabase | null>(null);
  const { logMetric } = useTelemetry();

  useEffect(() => {
    const initDb = async () => {
      try {
        const dbInstance = await getDb();
        setDb(dbInstance);

        // Init sample data
        const { initializeSampleData } = await import('../utils/sampleData');
        await initializeSampleData(dbInstance);
        console.log('✅ Base de datos inicializada correctamente');

        // Log Encryption Status
        // Checking storage parameters or assuming based on configuration
        // Since we wrap with keyCompression only, not encryption yet:    
        logMetric(TelemetryEvents.DB_ENCRYPTION_STATUS, { isEncrypted: false });

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

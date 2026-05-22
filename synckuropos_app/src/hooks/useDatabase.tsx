import { useState, useEffect, useContext, createContext, useRef, type FC, type ReactNode } from 'react';
import { initDb, getDb } from '../db/client';
import { seedInitialData } from '../db/seed';
import { SyncEngine } from '../db/syncEngine';

export type AppDatabase = ReturnType<typeof getDb>;

const DbContext = createContext<AppDatabase | null>(null);

interface DatabaseProviderProps {
  children: ReactNode;
}

export const DatabaseProvider: FC<DatabaseProviderProps> = ({ children }) => {
  const [db, setDb] = useState<AppDatabase | null>(null);
  const engineRef = useRef<SyncEngine | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const dbInstance = await initDb();

        await seedInitialData();

        const engine = new SyncEngine(dbInstance);
        engine.start();
        engineRef.current = engine;

        setDb(dbInstance);
        console.log('Base de datos SQLite inicializada correctamente');
      } catch (error) {
        console.error('Error inicializando la base de datos:', error);
      }
    };

    init();

    return () => {
      engineRef.current?.stop();
    };
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

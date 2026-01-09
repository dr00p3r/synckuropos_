import { useState } from 'react';
import { LoginScreen } from '@/features/auth';
import { SalesScreen } from '@/features/sales';
import { InventoryScreen } from '@/features/inventory';
import { CustomersScreen } from '@/features/customers';
import { ReportsScreen } from '@/features/reports';

import { useAuth } from './hooks/useAuth';
import { MainLayout } from '@/layouts/MainLayout';
import { ProgressSpinner } from 'primereact/progressspinner';
import type { SaleItem } from '@/types/types';

function App() {
  const { currentUser, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState('venta');
  
  // Estado del carrito (Persistencia temporal al navegar)
  // TODO: Mover esto a un Contexto (CartContext) en la siguiente fase
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);

  // 1. PANTALLA DE CARGA (Usando PrimeReact)
  if (isLoading) {
    return (
      <div className="flex flex-column align-items-center justify-content-center h-screen surface-ground">
        <ProgressSpinner strokeWidth="4" />
        <span className="text-700 font-medium mt-3">Iniciando sistema...</span>
      </div>
    );
  }

  // 2. PANTALLA DE LOGIN (Sin Layout)
  if (!currentUser) {
    return <LoginScreen />;
  }

  // 3. LÓGICA DE RUTEO SIMPLE
  const renderView = () => {
    switch (currentView) {
      case 'venta':
        return (
          <SalesScreen 
            saleItems={saleItems}
            setSaleItems={setSaleItems}
            onClearSale={() => setSaleItems([])}
          />
        );
      case 'inventario':
        return <InventoryScreen />;
      case 'clientes':
        return <CustomersScreen />;
      case 'reportes':
        return <ReportsScreen />
      case 'ajustes':
        //return <SettingsScreen />;
        return (
            <div className="p-5 text-center">
                <h2>Página no encontrada</h2>
            </div>
        );
      default:
        return (
            <div className="p-5 text-center">
                <h2>Página no encontrada</h2>
            </div>
        );
    }
  };

  // 4. APP PRINCIPAL
  return (
    <MainLayout
      activeView={currentView}
      userRole={currentUser.role || 'cajero'}
      onNavigate={setCurrentView}
    >
      {renderView()}
    </MainLayout>
  );
}

export default App;
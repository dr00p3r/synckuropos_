import { useState, useEffect } from 'react'
import SideNavigation from '@/shared/components/SideNavigation'
import { SalesScreen } from '@/features/sales'
import { InventoryScreen } from '@/features/inventory'
import { CustomersScreen } from '@/features/customers'
import { SettingsScreen } from '@/features/settings'
import { ReportsPage } from '@/features/reports'
import { LoginScreen } from '@/features/auth'

import { useAuth } from '@/hooks/useAuth'
import type { SaleItem } from '@/types/types'
import '@/styles/App.css'

function App() {
  const { currentUser, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState('venta')
  const [sidebarWidth, setSidebarWidth] = useState(280) // Ancho por defecto
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768)
  
  // Estado persistente de la venta
  const [saleItems, setSaleItems] = useState<SaleItem[]>([])

  // Detectar cambios en el tamaño de la ventana (HOOK MOVIDO AQUÍ)
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth > 768)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Si no hay usuario autenticado, mostrar login
  if (!currentUser && !isLoading) {
    return <LoginScreen />;
  }

  // Mostrar cargando mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#2A423E'
      }}>
        🔄 Verificando autenticación...
      </div>
    );
  }

  const handleNavigation = (view: string) => {
    setCurrentView(view)
  }

  const handleSidebarWidthChange = (width: number) => {
    setSidebarWidth(width)
  }

  // const toggleUserRole = () => {
  //   // Esta función ya no es necesaria porque el rol se maneja por autenticación
  //   // Podrías implementar un cambio de usuario aquí si lo deseas
  //   console.log('Cambio de rol a través de logout y nuevo login');
  //   logout();
  // };

  // Función para limpiar la venta
  const clearSale = () => {
    setSaleItems([])
  }

  const renderContent = () => {
    switch (currentView) {
      case 'venta':
        return (
          <SalesScreen 
            saleItems={saleItems}
            setSaleItems={setSaleItems}
            onClearSale={clearSale}
          />
        )
      case 'inventario':
        return <InventoryScreen />
      case 'clientes':
        return <CustomersScreen />
      case 'reportes':
        return <ReportsPage />
      case 'ajustes':
        return <SettingsScreen />;
      default:
        return <div><h2>Bienvenido a SyncKuroPOS</h2><p>Selecciona una opción del menú.</p></div>
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Contenido principal */}
      <main style={{ 
        flex: 1, 
        padding: (currentView === 'venta' || currentView === 'inventario' || currentView === 'clientes') ? '0' : '2rem',
        marginRight: isDesktop ? `${sidebarWidth}px` : '0',
        backgroundColor: (currentView === 'venta' || currentView === 'inventario' || currentView === 'clientes' || currentView === 'ajustes') ? '#f8fafc' : '#f5f5f5',
        transition: 'margin-right 0.3s ease'
      }}>
        {/* Contenido dinámico basado en la vista seleccionada */}
        {(currentView === 'venta' || currentView === 'inventario' || currentView === 'clientes' || currentView === 'ajustes') ? (
          renderContent()
        ) : (
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            {renderContent()}
          </div>
        )}
      </main>

      {/* Componente de navegación lateral */}
      <SideNavigation 
        userRole={currentUser?.role || 'cajero'}
        activeView={currentView}
        onNavigate={handleNavigation}
        onSidebarWidthChange={handleSidebarWidthChange}
      />
    </div>
  )
}

export default App

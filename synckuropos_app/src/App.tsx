import { useState, useEffect } from 'react'
import SideNavigation from './components/SideNavigation'
import SalesScreen from './components/Sales/SalesScreen'
import InventoryScreen from './components/Inventory/InventoryScreen'
import CustomersScreen from './components/Customers/Screen/CustomersScreen'
import SettingsScreen from './components/Settings/SettingsScreen'
import { LoginScreen } from './components/Auth'

import { useAuth } from './hooks/useAuth'
import type { SaleItem } from './types/types'
import './App.css'

function App() {
  const { currentUser, logout, isLoading } = useAuth();
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

  const toggleUserRole = () => {
    // Esta función ya no es necesaria porque el rol se maneja por autenticación
    // Podrías implementar un cambio de usuario aquí si lo deseas
    console.log('Cambio de rol a través de logout y nuevo login');
    logout();
  };

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
        return <div><h2>📈 Módulo de Reportes</h2><p>Visualización de reportes y estadísticas.</p></div>
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
        {(currentView !== 'venta' && currentView !== 'inventario' && currentView !== 'clientes' && currentView !== 'ajustes') && (
          <div style={{ marginBottom: '2rem' }}>
            <h1>SyncKuroPOS - Sistema de Punto de Venta</h1>
            <div style={{ marginBottom: '1rem' }}>
              <button 
                onClick={toggleUserRole}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#2A423E',
                  color: '#F0EFE7',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cerrar Sesión
              </button>
              <span style={{ marginLeft: '1rem', fontWeight: 'bold' }}>
                Usuario: {currentUser?.username} | Rol: {currentUser?.role === 'admin' ? 'Administrador' : 'Cajero'}
              </span>
            </div>
          </div>
        )}
        
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

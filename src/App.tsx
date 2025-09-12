import { useState } from 'react'
import SideNavigation from './components/SideNavigation'
import SalesScreen from './components/Sales/SalesScreen'
import InventoryScreen from './components/Inventory/InventoryScreen'
import { ToastProvider } from './components/Toast/ToastProvider'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState('venta')
  const [userRole, setUserRole] = useState<'admin' | 'cajero'>('admin')

  const handleNavigation = (view: string) => {
    setCurrentView(view)
  }

  const toggleUserRole = () => {
    setUserRole(userRole === 'admin' ? 'cajero' : 'admin')
  }

  const renderContent = () => {
    switch (currentView) {
      case 'venta':
        return <SalesScreen />
      case 'inventario':
        return <InventoryScreen />
      case 'clientes':
        return <div><h2>👥 Módulo de Clientes</h2><p>Administración de clientes.</p></div>
      case 'reportes':
        return <div><h2>📈 Módulo de Reportes</h2><p>Visualización de reportes y estadísticas.</p></div>
      case 'ajustes':
        return <div><h2>⚙️ Módulo de Ajustes</h2><p>Configuración del sistema.</p></div>
      default:
        return <div><h2>Bienvenido a SyncKuroPOS</h2><p>Selecciona una opción del menú.</p></div>
    }
  }

  return (
    <ToastProvider>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {/* Contenido principal */}
        <main style={{ 
          flex: 1, 
          padding: (currentView === 'venta' || currentView === 'inventario') ? '0' : '2rem',
          marginRight: window.innerWidth > 768 ? '30%' : '0',
          backgroundColor: (currentView === 'venta' || currentView === 'inventario') ? '#f8fafc' : '#f5f5f5'
        }}>
          {(currentView !== 'venta' && currentView !== 'inventario') && (
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
                  Cambiar a {userRole === 'admin' ? 'Cajero' : 'Administrador'}
                </button>
                <span style={{ marginLeft: '1rem', fontWeight: 'bold' }}>
                  Rol actual: {userRole === 'admin' ? 'Administrador' : 'Cajero'}
                </span>
              </div>
            </div>
          )}
          
          {/* Contenido dinámico basado en la vista seleccionada */}
          {(currentView === 'venta' || currentView === 'inventario') ? (
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
          userRole={userRole}
          activeView={currentView}
          onNavigate={handleNavigation}
        />
      </div>
    </ToastProvider>
  )
}

export default App

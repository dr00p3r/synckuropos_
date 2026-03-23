import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginScreen } from '@/features/auth';

// Lazy loading de las pantallas principales
// Nota: Como son exportaciones nombradas, usamos .then(module => ({ default: module.Componente }))
const SalesScreen = lazy(() => import('@/features/sales').then(module => ({ default: module.SalesScreen })));
const InventoryScreen = lazy(() => import('@/features/inventory').then(module => ({ default: module.InventoryScreen })));
const CustomersScreen = lazy(() => import('@/features/customers').then(module => ({ default: module.CustomersScreen })));
const ReportsScreen = lazy(() => import('@/features/reports').then(module => ({ default: module.ReportsScreen })));
const SettingsScreen = lazy(() => import('@/features/settings').then(module => ({ default: module.SettingsScreen })));

import { useAuth } from './hooks/useAuth';
import { Dashboard } from './pages/Dashboard';
import { LoadingFallback } from '@/components/common/LoadingFallback';

import { useTelemetry } from './hooks/useTelemetry';
import { MainLayout } from '@/layouts/MainLayout';

function App() {
  const { currentUser, isLoading } = useAuth();
  const { setAuth, logMetric } = useTelemetry(); // Start telemetry worker (singleton)

  // Bridge Auth -> Telemetry
  useEffect(() => {
    setAuth(currentUser?.userId || null);
  }, [currentUser, setAuth]);

  useEffect(() => {
    // Log App Start
    //logMetric(TelemetryEvents.APP_START, {
    //  timestamp: Date.now(),
    //  userAgent: navigator.userAgent
    //});
  }, [logMetric]);

  // 1. PANTALLA DE CARGA (Usando Componente Reutilizable)
  if (isLoading) {
    return <LoadingFallback message="Iniciando sistema..." />;
  }

  // 2. PANTALLA DE LOGIN (Sin Layout)
  if (!currentUser) {
    return <LoginScreen />;
  }

  // 3. LÓGICA DE RUTEO SIMPLE

  // 4. APP PRINCIPAL
  return (
    <MainLayout
      userRole={currentUser.role || 'cajero'}
    >
      <Suspense fallback={<LoadingFallback fullScreen={false} />}>
        <Routes>
          <Route path="/" element={<SalesScreen />} />
          <Route path="/inventory" element={<InventoryScreen />} />
          <Route path="/customers" element={<CustomersScreen />} />
          <Route path="/reports" element={<ReportsScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Fallback para rutas no encontradas */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </MainLayout>
  );
}

export default App;
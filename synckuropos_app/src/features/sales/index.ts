// 1. Pantalla Principal (Punto de entrada para el Router/App)
export { SalesScreen } from './components/SalesScreen';

// 2. Componentes Reutilizables 
// (Útiles si quieres mostrar una tabla de venta en "Historial" o "Reportes")
export { PaymentModal } from './components/PaymentModal';
export { ProductSearch } from './components/ProductSearch'; // Reemplaza a SearchBar y SearchResults
export { SaleItemsTable } from './components/SaleItemsTable';
export { SalesSummary } from './components/SaleSummary';

// 3. Hooks 
// (Útiles para testing o si necesitas la lógica fuera de la vista)
export { usePaymentLogic } from './hooks/usePaymentLogic';
export { useProductSearch } from './hooks/useProductSearch';
export { useSaleItemsLogic } from './hooks/useSaleItemsLogic';
export { useSalesLogic } from './hooks/useSalesLogic';

// 4. Tipos
export * from './types';
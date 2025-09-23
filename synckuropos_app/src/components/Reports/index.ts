// Exportaciones principales del módulo de Reportes
export { ReportsPage } from './ReportsPage';
export { DateRangePicker } from './DateRangePicker';
export { KPICard } from './KPICard';
export { SalesKPICard, ProfitabilityKPICard, InventoryKPICard } from './KPICards';

// Exportar tipos
export type { KPIData } from './KPICard';

// Exportar contexto y hooks
export { DateRangeProvider, useDateRange } from '../../contexts/DateRangeContext';
export type { DateRange, PresetKey, DateRangeContextType } from '../../contexts/DateRangeContext';

// Exportar hooks de KPIs
export { 
  useSalesKPIs, 
  useProfitabilityKPIs, 
  useInventoryKPIs 
} from '../../hooks/useReportsKPIs';

export type { 
  SalesKPIs, 
  ProfitabilityKPIs, 
  InventoryKPIs 
} from '../../hooks/useReportsKPIs';

// Exportar utilidades
export { 
  formatCurrency, 
  formatDate, 
  formatDateShort, 
  formatDateTime, 
  formatQty, 
  formatPercentage, 
  formatDateRange 
} from '../../utils/formatters';
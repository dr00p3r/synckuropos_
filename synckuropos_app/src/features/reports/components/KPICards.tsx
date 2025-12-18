import React, { useState } from 'react';
import { KPICard } from './KPICard';
import { useSalesKPIs, useProfitabilityKPIs, useInventoryKPIs } from '@/hooks/useReportsKPIs';
import type { KPIData } from './KPICard';

// Iconos SVG
const SalesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="8" cy="21" r="1"/>
    <circle cx="19" cy="21" r="1"/>
    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
  </svg>
);

const ProfitabilityIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);

const InventoryIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);

// Tarjeta de Ventas
export const SalesKPICard: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    totalSales,
    salesCount,
    averageTicket,
    totalSalesChange,
    salesCountChange,
    averageTicketChange,
    loading,
    error
  } = useSalesKPIs();

  const data: KPIData[] = [
    {
      label: 'Total vendido',
      value: totalSales,
      type: 'currency',
      trend: totalSalesChange && totalSalesChange > 0 ? 'up' : totalSalesChange && totalSalesChange < 0 ? 'down' : 'neutral',
      trendValue: totalSalesChange ? `${totalSalesChange > 0 ? '+' : ''}${totalSalesChange.toFixed(1)}% vs período anterior` : undefined
    },
    {
      label: 'Número de ventas',
      value: salesCount,
      type: 'count',
      trend: salesCountChange && salesCountChange > 0 ? 'up' : salesCountChange && salesCountChange < 0 ? 'down' : 'neutral',
      trendValue: salesCountChange ? `${salesCountChange > 0 ? '+' : ''}${salesCountChange.toFixed(1)}%` : undefined
    },
    {
      label: 'Ticket promedio',
      value: averageTicket,
      type: 'currency',
      trend: averageTicketChange && averageTicketChange > 0 ? 'up' : averageTicketChange && averageTicketChange < 0 ? 'down' : 'neutral',
      trendValue: averageTicketChange ? `${averageTicketChange > 0 ? '+' : ''}${averageTicketChange.toFixed(1)}%` : undefined
    }
  ];

  return (
    <KPICard
      title="Ventas"
      icon={<SalesIcon />}
      data={data}
      loading={loading}
      error={error}
      isExpanded={isExpanded}
      onToggleDetails={() => setIsExpanded(!isExpanded)}
    >
      {/* Contenido detallado - se implementará en futuros prompts */}
      {isExpanded && (
        <div className="placeholder-content">
          Detalles de ventas se implementarán próximamente
        </div>
      )}
    </KPICard>
  );
};

// Tarjeta de Rentabilidad
export const ProfitabilityKPICard: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    totalRevenue,
    totalCost,
    grossProfit,
    profitMargin,
    revenueChange,
    profitChange,
    marginChange,
    loading,
    error
  } = useProfitabilityKPIs();

  const data: KPIData[] = [
    {
      label: 'Ingresos totales',
      value: totalRevenue,
      type: 'currency',
      trend: revenueChange && revenueChange > 0 ? 'up' : revenueChange && revenueChange < 0 ? 'down' : 'neutral',
      trendValue: revenueChange ? `${revenueChange > 0 ? '+' : ''}${revenueChange.toFixed(1)}% vs período anterior` : undefined
    },
    {
      label: 'Costos totales',
      value: totalCost,
      type: 'currency'
    },
    {
      label: 'Ganancia bruta',
      value: grossProfit,
      type: 'currency',
      trend: profitChange && profitChange > 0 ? 'up' : profitChange && profitChange < 0 ? 'down' : 'neutral',
      trendValue: profitChange ? `${profitChange > 0 ? '+' : ''}${profitChange.toFixed(1)}%` : undefined
    },
    {
      label: 'Margen de ganancia',
      value: profitMargin,
      type: 'percentage',
      trend: marginChange && marginChange > 0 ? 'up' : marginChange && marginChange < 0 ? 'down' : 'neutral',
      trendValue: marginChange ? `${marginChange > 0 ? '+' : ''}${marginChange.toFixed(1)}%` : undefined
    }
  ];

  return (
    <KPICard
      title="Rentabilidad"
      icon={<ProfitabilityIcon />}
      data={data}
      loading={loading}
      error={error}
      isExpanded={isExpanded}
      onToggleDetails={() => setIsExpanded(!isExpanded)}
    >
      {/* Contenido detallado - se implementará en futuros prompts */}
      {isExpanded && (
        <div className="placeholder-content">
          Análisis detallado de rentabilidad se implementará próximamente
        </div>
      )}
    </KPICard>
  );
};

// Tarjeta de Inventario
export const InventoryKPICard: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    totalInflows,
    totalOutflows,
    netMovement,
    netMovementChange,
    loading,
    error
  } = useInventoryKPIs();

  const data: KPIData[] = [
    {
      label: 'Entradas totales',
      value: totalInflows,
      type: 'quantity',
      trend: 'up'
    },
    {
      label: 'Salidas totales',
      value: totalOutflows,
      type: 'quantity',
      trend: 'down'
    },
    {
      label: 'Movimiento neto',
      value: netMovement,
      type: 'quantity',
      trend: netMovementChange && netMovementChange > 0 ? 'up' : netMovementChange && netMovementChange < 0 ? 'down' : 'neutral',
      trendValue: netMovementChange ? `${netMovementChange > 0 ? '+' : ''}${netMovementChange.toFixed(1)}% vs período anterior` : undefined
    }
  ];

  return (
    <KPICard
      title="Inventario"
      icon={<InventoryIcon />}
      data={data}
      loading={loading}
      error={error}
      isExpanded={isExpanded}
      onToggleDetails={() => setIsExpanded(!isExpanded)}
    >
      {/* Contenido detallado - se implementará en futuros prompts */}
      {isExpanded && (
        <div className="placeholder-content">
          Reportes detallados de inventario se implementarán próximamente
        </div>
      )}
    </KPICard>
  );
};
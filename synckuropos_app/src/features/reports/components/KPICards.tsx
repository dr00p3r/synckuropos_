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
  const { totalSales, salesCount, averageTicket, loading, error } = useSalesKPIs();

  const data: KPIData[] = [
    {
      label: 'Total vendido',
      value: totalSales,
      type: 'currency'
    },
    {
      label: 'Número de ventas',
      value: salesCount,
      type: 'count'
    },
    {
      label: 'Ticket promedio',
      value: averageTicket,
      type: 'currency'
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
  const { totalRevenue, totalCost, grossProfit, profitMargin, loading, error } = useProfitabilityKPIs();

  const data: KPIData[] = [
    {
      label: 'Ingresos totales',
      value: totalRevenue,
      type: 'currency'
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
      trend: grossProfit > 0 ? 'up' : grossProfit < 0 ? 'down' : 'neutral'
    },
    {
      label: 'Margen de ganancia',
      value: profitMargin,
      type: 'percentage'
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
  const { totalInflows, totalOutflows, netMovement, loading, error } = useInventoryKPIs();

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
      trend: netMovement > 0 ? 'up' : netMovement < 0 ? 'down' : 'neutral'
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
import React from 'react';
import { formatCurrency, formatQty, formatPercentage } from '../../utils/formatters';
import './KPICard.css';

// Iconos SVG
const TrendUpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);

const TrendDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
    <polyline points="17 18 23 18 23 12"/>
  </svg>
);

const TrendNeutralIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const ExpandIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const ViewIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const WarningIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
    <path d="M12 9v4"/>
    <path d="m12 17 .01 0"/>
  </svg>
);

interface KPICardProps {
  title: string;
  icon: React.ReactNode;
  data: KPIData[];
  loading: boolean;
  error: string | null;
  onToggleDetails: () => void;
  isExpanded: boolean;
  children?: React.ReactNode; // Para el contenido detallado futuro
}

export interface KPIData {
  label: string;
  value: number | string;
  type: 'currency' | 'quantity' | 'percentage' | 'count' | 'text';
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  icon,
  data,
  loading,
  error,
  onToggleDetails,
  isExpanded,
  children
}) => {
  const formatValue = (item: KPIData) => {
    if (typeof item.value === 'string') return item.value;
    
    switch (item.type) {
      case 'currency':
        return formatCurrency(item.value);
      case 'quantity':
        return formatQty(item.value);
      case 'percentage':
        return formatPercentage(item.value);
      case 'count':
        return formatQty(item.value, { maximumFractionDigits: 0 });
      default:
        return item.value.toString();
    }
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <TrendUpIcon />;
      case 'down':
        return <TrendDownIcon />;
      case 'neutral':
        return <TrendNeutralIcon />;
      default:
        return null;
    }
  };

  return (
    <div className={`kpi-card ${isExpanded ? 'kpi-card--expanded' : ''}`}>
      <div className="kpi-card__header" onClick={onToggleDetails}>
        <div className="kpi-card__title-section">
          <span className="kpi-card__icon" aria-hidden="true">{icon}</span>
          <h3 className="kpi-card__title">{title}</h3>
        </div>
        
        <button
          className="kpi-card__toggle"
          aria-label={isExpanded ? `Contraer ${title}` : `Expandir ${title}`}
          aria-expanded={isExpanded ? 'true' : 'false'}
        >
          {isExpanded ? <ExpandIcon /> : <ViewIcon />}
        </button>
      </div>

      <div className="kpi-card__content">
        {loading && (
          <div className="kpi-card__loading">
            <div className="loading-spinner" aria-label="Cargando datos..."></div>
            <span>Cargando...</span>
          </div>
        )}

        {error && (
          <div className="kpi-card__error" role="alert">
            <WarningIcon />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && (
          <div className="kpi-card__metrics">
            {data.map((item, index) => (
              <div key={index} className="kpi-metric">
                <div className="kpi-metric__label">{item.label}</div>
                <div className="kpi-metric__value-container">
                  <span className="kpi-metric__value">
                    {formatValue(item)}
                  </span>
                  {item.trend && (
                    <span className="kpi-metric__trend" title={item.trendValue || 'Tendencia'}>
                      {getTrendIcon(item.trend)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && (
          <div className="kpi-card__actions">
            <button
              className="kpi-card__detail-button"
              onClick={onToggleDetails}
              aria-label={`Ver detalles de ${title}`}
            >
              Ver detalle
            </button>
          </div>
        )}
      </div>

      {/* Contenido expandido para futuras implementaciones */}
      {isExpanded && children && (
        <div className="kpi-card__expanded-content">
          {children}
        </div>
      )}
    </div>
  );
};
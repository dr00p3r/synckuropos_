import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useReportTimeseries } from '../../hooks/useReportTimeseries';
import { formatCurrency, formatDate } from '../../utils/formatters';
import './ReportGlobalChart.css';

interface ChartDataPoint {
  date: string;
  dateLabel: string;
  invested: number;
  sold: number;
  investedDisplay: number; // en dólares para mostrar
  soldDisplay: number; // en dólares para mostrar
}

export const ReportGlobalChart: React.FC = () => {
  const { series, totals, loading, error } = useReportTimeseries();

  if (loading) {
    return (
      <div className="report-global-chart loading">
        <div className="chart-header">
          <h3>Inversión vs Ventas</h3>
        </div>
        <div className="chart-loading">
          <div className="loading-spinner"></div>
          <p>Cargando datos del gráfico...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="report-global-chart error">
        <div className="chart-header">
          <h3>Inversión vs Ventas</h3>
        </div>
        <div className="chart-error">
          <svg viewBox="0 0 24 24" className="error-icon">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Preparar datos para el gráfico
  const chartData: ChartDataPoint[] = series.map(point => ({
    date: point.date,
    dateLabel: formatDate(new Date(point.date)),
    invested: point.invested,
    sold: point.sold,
    investedDisplay: point.invested / 100, // convertir a dólares
    soldDisplay: point.sold / 100 // convertir a dólares
  }));

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const invested = payload[0]?.value || 0;
      const sold = payload[1]?.value || 0;
      const profit = sold - invested;
      const profitPercent = invested > 0 ? ((profit / invested) * 100) : 0;

      return (
        <div className="chart-tooltip">
          <p className="tooltip-label">{label}</p>
          <div className="tooltip-content">
            <div className="tooltip-line invested">
              <span className="tooltip-color"></span>
              <span>Invertido: {formatCurrency(invested * 100)}</span>
            </div>
            <div className="tooltip-line sold">
              <span className="tooltip-color"></span>
              <span>Vendido: {formatCurrency(sold * 100)}</span>
            </div>
            <div className="tooltip-line profit">
              <span>Ganancia: {formatCurrency(profit * 100)}</span>
              <span className={`profit-percent ${profit >= 0 ? 'positive' : 'negative'}`}>
                ({profitPercent > 0 ? '+' : ''}{profitPercent.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="report-global-chart">
      <div className="chart-header">
        <h3>Inversión vs Ventas</h3>
        <div className="chart-totals">
          <div className="total-item invested">
            <span className="total-label">Total Invertido:</span>
            <span className="total-value">{formatCurrency(totals.invested)}</span>
          </div>
          <div className="total-item sold">
            <span className="total-label">Total Vendido:</span>
            <span className="total-value">{formatCurrency(totals.sold)}</span>
          </div>
          <div className="total-item profit">
            <span className="total-label">Ganancia Neta:</span>
            <span className={`total-value ${totals.diff >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(totals.diff)}
            </span>
          </div>
          <div className="total-item ratio">
            <span className="total-label">ROI:</span>
            <span className={`total-value ${totals.ratio >= 1 ? 'positive' : 'negative'}`}>
              {((totals.ratio - 1) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
      
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="dateLabel" 
              stroke="#6b7280"
              fontSize={12}
              interval="preserveStartEnd"
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="investedDisplay" 
              stroke="#2A423E" 
              strokeWidth={2}
              dot={{ fill: '#2A423E', strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, stroke: '#2A423E', strokeWidth: 2, fill: 'white' }}
              name="Invertido"
            />
            <Line 
              type="monotone" 
              dataKey="soldDisplay" 
              stroke="#059669" 
              strokeWidth={2}
              dot={{ fill: '#059669', strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, stroke: '#059669', strokeWidth: 2, fill: 'white' }}
              name="Vendido"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
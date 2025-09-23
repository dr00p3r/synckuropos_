import React, { useState } from 'react';
import { useDateRange } from '../../contexts/DateRangeContext';
import { formatDateRange } from '../../utils/formatters';
import type { PresetKey } from '../../contexts/DateRangeContext';
import './DateRangePicker.css';

// Iconos SVG
const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

// Configuración de presets con etiquetas en español
const PRESET_CONFIG: Record<PresetKey, { label: string; description: string }> = {
  today: {
    label: 'Hoy',
    description: 'Solo hoy'
  },
  lastWeek: {
    label: 'Última semana',
    description: 'Últimos 7 días'
  },
  lastMonth: {
    label: 'Último mes',
    description: 'Últimos 30 días'
  },
  lastQuarter: {
    label: 'Último trimestre',
    description: 'Últimos 90 días'
  },
  lastYear: {
    label: 'Último año',
    description: 'Últimos 365 días'
  }
};

interface DateRangePickerProps {
  className?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ className }) => {
  const { range, currentPreset, setRange, setPreset } = useDateRange();
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const handlePresetClick = (presetKey: PresetKey) => {
    setPreset(presetKey);
    setShowCustomPicker(false);
  };

  const handleCustomClick = () => {
    // Inicializar con el rango actual
    const startStr = range.start.toISOString().split('T')[0];
    const endStr = range.end.toISOString().split('T')[0];
    setCustomStart(startStr);
    setCustomEnd(endStr);
    setShowCustomPicker(true);
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      const start = new Date(customStart);
      const end = new Date(customEnd + 'T23:59:59.999Z'); // Fin del día
      
      if (start <= end) {
        setRange({ start, end });
        setShowCustomPicker(false);
      }
    }
  };

  const handleCustomCancel = () => {
    setShowCustomPicker(false);
    setCustomStart('');
    setCustomEnd('');
  };

  return (
    <div className={`date-range-picker ${className || ''}`}>
      {/* Rango actual */}
      <div className="current-range">
        <div className="range-display">
          <CalendarIcon />
          <span className="range-text">
            {formatDateRange(range.start, range.end)}
          </span>
          {currentPreset !== 'custom' && (
            <span className="range-preset">
              ({PRESET_CONFIG[currentPreset as PresetKey]?.label})
            </span>
          )}
        </div>
      </div>

      {/* Botones de presets */}
      <div className="preset-buttons" role="group" aria-label="Seleccionar rango de fechas">
        {(Object.keys(PRESET_CONFIG) as PresetKey[]).map((presetKey) => {
          const config = PRESET_CONFIG[presetKey];
          const isActive = currentPreset === presetKey;
          
          return (
            <button
              key={presetKey}
              type="button"
              className={`preset-button ${isActive ? 'preset-button--active' : ''}`}
              onClick={() => handlePresetClick(presetKey)}
              aria-pressed={isActive}
              title={config.description}
            >
              {config.label}
            </button>
          );
        })}
        
        {/* Botón personalizado */}
        <button
          type="button"
          className={`preset-button ${currentPreset === 'custom' ? 'preset-button--active' : ''}`}
          onClick={handleCustomClick}
          aria-pressed={currentPreset === 'custom'}
          title="Seleccionar rango personalizado"
        >
          Personalizado
        </button>
      </div>

      {/* Selector personalizado */}
      {showCustomPicker && (
        <div className="custom-picker" role="dialog" aria-label="Selector de rango personalizado">
          <div className="custom-picker__header">
            <h4>Seleccionar rango personalizado</h4>
          </div>
          
          <div className="custom-picker__inputs">
            <div className="date-input-group">
              <label htmlFor="custom-start-date">Fecha inicio:</label>
              <input
                id="custom-start-date"
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="date-input"
              />
            </div>
            
            <div className="date-input-group">
              <label htmlFor="custom-end-date">Fecha fin:</label>
              <input
                id="custom-end-date"
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="date-input"
                min={customStart}
              />
            </div>
          </div>
          
          <div className="custom-picker__actions">
            <button
              type="button"
              className="custom-button custom-button--secondary"
              onClick={handleCustomCancel}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="custom-button custom-button--primary"
              onClick={handleCustomApply}
              disabled={!customStart || !customEnd}
            >
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
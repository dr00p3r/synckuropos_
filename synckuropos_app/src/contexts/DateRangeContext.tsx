import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

// Tipos para el contexto de rangos de fechas
export type PresetKey = 'today' | 'lastWeek' | 'lastMonth' | 'lastQuarter' | 'lastYear';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface DateRangeContextType {
  range: DateRange;
  currentPreset: PresetKey | 'custom';
  setRange: (range: DateRange) => void;
  setPreset: (presetKey: PresetKey) => void;
}

// Crear el contexto
const DateRangeContext = createContext<DateRangeContextType | null>(null);

// Utilidades para calcular rangos de fechas
const getDateRangeForPreset = (preset: PresetKey): DateRange => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (preset) {
    case 'today':
      return {
        start: today,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1) // Fin del día
      };
      
    case 'lastWeek': {
      const lastWeek = new Date(today);
      lastWeek.setDate(today.getDate() - 7);
      return {
        start: lastWeek,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
      };
    }
    
    case 'lastMonth': {
      const lastMonth = new Date(today);
      lastMonth.setMonth(today.getMonth() - 1);
      return {
        start: lastMonth,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
      };
    }
    
    case 'lastQuarter': {
      const lastQuarter = new Date(today);
      lastQuarter.setMonth(today.getMonth() - 3);
      return {
        start: lastQuarter,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
      };
    }
    
    case 'lastYear': {
      const lastYear = new Date(today);
      lastYear.setFullYear(today.getFullYear() - 1);
      return {
        start: lastYear,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
      };
    }
    
    default:
      return {
        start: today,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
      };
  }
};

// Claves para localStorage
const STORAGE_KEYS = {
  RANGE: 'reports_date_range',
  PRESET: 'reports_current_preset'
} as const;

// Funciones para persistencia
const saveRangeToStorage = (range: DateRange) => {
  try {
    localStorage.setItem(STORAGE_KEYS.RANGE, JSON.stringify({
      start: range.start.toISOString(),
      end: range.end.toISOString()
    }));
  } catch (error) {
    console.warn('No se pudo guardar el rango de fechas en localStorage:', error);
  }
};

const savePresetToStorage = (preset: PresetKey | 'custom') => {
  try {
    localStorage.setItem(STORAGE_KEYS.PRESET, preset);
  } catch (error) {
    console.warn('No se pudo guardar el preset en localStorage:', error);
  }
};

const loadRangeFromStorage = (): DateRange | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.RANGE);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        start: new Date(parsed.start),
        end: new Date(parsed.end)
      };
    }
  } catch (error) {
    console.warn('No se pudo cargar el rango de fechas desde localStorage:', error);
  }
  return null;
};

const loadPresetFromStorage = (): PresetKey | 'custom' => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PRESET);
    if (stored && ['today', 'lastWeek', 'lastMonth', 'lastQuarter', 'lastYear', 'custom'].includes(stored)) {
      return stored as PresetKey | 'custom';
    }
  } catch (error) {
    console.warn('No se pudo cargar el preset desde localStorage:', error);
  }
  return 'today';
};

interface DateRangeProviderProps {
  children: ReactNode;
}

export const DateRangeProvider: React.FC<DateRangeProviderProps> = ({ children }) => {
  // Inicializar estado con valores por defecto o desde localStorage
  const [currentPreset, setCurrentPreset] = useState<PresetKey | 'custom'>(() => {
    return loadPresetFromStorage();
  });
  
  const [range, setRangeState] = useState<DateRange>(() => {
    const storedRange = loadRangeFromStorage();
    const storedPreset = loadPresetFromStorage();
    
    // Si hay un preset guardado, usar su rango calculado
    if (storedPreset !== 'custom' && ['today', 'lastWeek', 'lastMonth', 'lastQuarter', 'lastYear'].includes(storedPreset)) {
      return getDateRangeForPreset(storedPreset as PresetKey);
    }
    
    // Si hay un rango personalizado guardado, usarlo
    if (storedRange) {
      return storedRange;
    }
    
    // Por defecto, usar "today"
    return getDateRangeForPreset('today');
  });

  // Función para cambiar el rango manualmente
  const setRange = (newRange: DateRange) => {
    setRangeState(newRange);
    setCurrentPreset('custom');
    saveRangeToStorage(newRange);
    savePresetToStorage('custom');
  };

  // Función para establecer un preset
  const setPreset = (presetKey: PresetKey) => {
    const newRange = getDateRangeForPreset(presetKey);
    setRangeState(newRange);
    setCurrentPreset(presetKey);
    saveRangeToStorage(newRange);
    savePresetToStorage(presetKey);
  };

  // Actualizar rango cuando cambie el preset (para presets dinámicos como "today")
  useEffect(() => {
    if (currentPreset !== 'custom') {
      const newRange = getDateRangeForPreset(currentPreset as PresetKey);
      setRangeState(newRange);
      saveRangeToStorage(newRange);
    }
  }, [currentPreset]);

  const contextValue: DateRangeContextType = {
    range,
    currentPreset,
    setRange,
    setPreset
  };

  return (
    <DateRangeContext.Provider value={contextValue}>
      {children}
    </DateRangeContext.Provider>
  );
};

// Hook para usar el contexto
export const useDateRange = (): DateRangeContextType => {
  const context = useContext(DateRangeContext);
  
  if (!context) {
    throw new Error('useDateRange debe ser usado dentro de un DateRangeProvider');
  }
  
  return context;
};
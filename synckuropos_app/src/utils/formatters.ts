/**
 * Utilidades de formato para el POS
 * Configurado para Ecuador (es-EC) con USD
 */

const CURRENCY_FORMATTER = new Intl.NumberFormat('es-EC', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const DATE_FORMATTER = new Intl.DateTimeFormat('es-EC', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

const QTY_FORMATTER = new Intl.NumberFormat('es-EC', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const PERCENT_FORMATTER = new Intl.NumberFormat('es-EC', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function getPercentFormatter(decimals: number) {
  return new Intl.NumberFormat('es-EC', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Formatea un número como moneda USD para Ecuador
 * @param amount Cantidad en centavos
 * @returns String formateado como moneda
 */
export const formatCurrency = (amount: number): string => {
  // Convertir de centavos a dólares
  const dollars = amount / 100;
  return CURRENCY_FORMATTER.format(dollars);
};

/**
 * Formatea una fecha según la configuración local de Ecuador
 * @param date Fecha a formatear
 * @param options Opciones de formato adicionales
 * @returns String de fecha formateada
 */
export const formatDate = (
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {}
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (Object.keys(options).length === 0) {
    return DATE_FORMATTER.format(dateObj);
  }

  return new Intl.DateTimeFormat('es-EC', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  }).format(dateObj);
};

/**
 * Formatea una fecha en formato corto (DD/MM/YYYY)
 * @param date Fecha a formatear
 * @returns String de fecha en formato corto
 */
export const formatDateShort = (date: Date | string): string => {
  return formatDate(date, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

/**
 * Formatea una fecha con hora
 * @param date Fecha a formatear
 * @returns String de fecha con hora
 */
export const formatDateTime = (date: Date | string): string => {
  return formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Formatea una cantidad numérica con configuración local
 * @param quantity Cantidad a formatear
 * @param options Opciones de formato
 * @returns String de cantidad formateada
 */
export const formatQty = (
  quantity: number,
  options: Intl.NumberFormatOptions = {}
): string => {
  if (Object.keys(options).length === 0) {
    return QTY_FORMATTER.format(quantity);
  }

  return new Intl.NumberFormat('es-EC', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options
  }).format(quantity);
};

/**
 * Formatea un porcentaje
 * @param value Valor decimal (ej: 0.15 para 15%)
 * @param decimals Número de decimales a mostrar
 * @returns String de porcentaje formateado
 */
export const formatPercentage = (value: number, decimals = 1): string => {
  if (decimals === 1) {
    return PERCENT_FORMATTER.format(value);
  }
  return getPercentFormatter(decimals).format(value);
};

/**
 * Formatea un rango de fechas para mostrar en UI
 * @param start Fecha de inicio
 * @param end Fecha de fin
 * @returns String del rango formateado
 */
export const formatDateRange = (start: Date, end: Date): string => {
  const startStr = formatDateShort(start);
  const endStr = formatDateShort(end);

  // Si es el mismo día, mostrar solo una fecha
  if (startStr === endStr) {
    return startStr;
  }

  return `${startStr} - ${endStr}`;
};
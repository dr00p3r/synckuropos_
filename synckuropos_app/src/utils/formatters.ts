/**
 * Utilidades de formato para el POS
 * Configurado para Ecuador (es-EC) con USD
 */

/**
 * Formatea un número como moneda USD para Ecuador
 * @param amount Cantidad en centavos
 * @returns String formateado como moneda
 */
export const formatCurrency = (amount: number): string => {
  // Convertir de centavos a dólares
  const dollars = amount / 100;
  
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);
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
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };
  
  return new Intl.DateTimeFormat('es-EC', defaultOptions).format(dateObj);
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
  const defaultOptions: Intl.NumberFormatOptions = {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options
  };
  
  return new Intl.NumberFormat('es-EC', defaultOptions).format(quantity);
};

/**
 * Formatea un porcentaje
 * @param value Valor decimal (ej: 0.15 para 15%)
 * @param decimals Número de decimales a mostrar
 * @returns String de porcentaje formateado
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return new Intl.NumberFormat('es-EC', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
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
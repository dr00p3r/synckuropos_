/**
 * Money Utility
 * Handles all financial calculations with precision
 * All monetary values are stored as INTEGERS in CENTS to avoid floating-point errors
 *
 * Example:
 * - $12.50 is stored as 1250 cents
 * - $0.99 is stored as 99 cents
 */

/**
 * Converts a string or number to cents (integer)
 * Safely handles empty strings, null, undefined, and invalid inputs
 *
 * @param value - Dollar amount as string or number (e.g., "12.50", 12.5)
 * @returns Integer amount in cents (e.g., 1250)
 */
export const toCents = (value: string | number | null | undefined): number => {
  // Handle empty or invalid inputs
  if (value === '' || value === null || value === undefined) {
    return 0;
  }

  // Convert to string for parsing
  const stringValue = typeof value === 'number' ? value.toString() : value.trim();

  // Handle empty string after trim
  if (stringValue === '') {
    return 0;
  }

  // Parse the float value
  const floatValue = parseFloat(stringValue);

  // Check if parsing resulted in NaN
  if (isNaN(floatValue)) {
    return 0;
  }

  // Convert to cents and round to avoid floating-point errors
  // Math.round handles cases like 12.505 -> 1251 cents correctly
  return Math.round(floatValue * 100);
};

/**
 * Converts cents (integer) to dollars (number)
 *
 * @param cents - Amount in cents (e.g., 1250)
 * @returns Dollar amount (e.g., 12.50)
 */
export const toDollars = (cents: number): number => {
  if (isNaN(cents) || cents === null || cents === undefined) {
    return 0;
  }
  return cents / 100;
};

/**
 * Formats cents to a currency string
 *
 * @param cents - Amount in cents
 * @param locale - Locale for formatting (default: 'es-EC' for Ecuador)
 * @param currency - Currency code (default: 'USD')
 * @returns Formatted currency string (e.g., "$12.50")
 */
export const formatMoney = (
  cents: number,
  locale: string = 'es-EC',
  currency: string = 'USD'
): string => {
  const dollars = toDollars(cents);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);
};

/**
 * Safely parses a number from string, returns 0 for invalid inputs
 * Use this for quantities, not money (use toCents for money)
 *
 * @param value - String to parse
 * @returns Parsed number or 0 if invalid
 */
export const safeParseNumber = (value: string | number | null | undefined): number => {
  if (value === '' || value === null || value === undefined) {
    return 0;
  }

  const parsed = typeof value === 'number' ? value : parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Validates if a string represents a valid positive number
 *
 * @param value - String to validate
 * @returns true if valid positive number, false otherwise
 */
export const isValidPositiveNumber = (value: string): boolean => {
  if (!value || value.trim() === '') {
    return false;
  }
  const parsed = parseFloat(value);
  return !isNaN(parsed) && parsed > 0;
};

/**
 * Validates if a string represents a valid number (can be negative)
 *
 * @param value - String to validate
 * @returns true if valid number, false otherwise
 */
export const isValidNumber = (value: string): boolean => {
  if (!value || value.trim() === '') {
    return false;
  }
  const parsed = parseFloat(value);
  return !isNaN(parsed);
};

/**
 * Adds two monetary amounts in cents
 *
 * @param cents1 - First amount in cents
 * @param cents2 - Second amount in cents
 * @returns Sum in cents
 */
export const addMoney = (cents1: number, cents2: number): number => {
  return cents1 + cents2;
};

/**
 * Subtracts two monetary amounts in cents
 *
 * @param cents1 - First amount in cents
 * @param cents2 - Second amount in cents
 * @returns Difference in cents
 */
export const subtractMoney = (cents1: number, cents2: number): number => {
  return cents1 - cents2;
};

/**
 * Multiplies a monetary amount by a quantity
 *
 * @param cents - Amount in cents
 * @param quantity - Quantity to multiply by
 * @returns Product in cents, rounded
 */
export const multiplyMoney = (cents: number, quantity: number): number => {
  return Math.round(cents * quantity);
};

/**
 * Calculates percentage of a monetary amount
 *
 * @param cents - Amount in cents
 * @param percentage - Percentage as decimal (e.g., 0.15 for 15%)
 * @returns Percentage amount in cents, rounded
 */
export const calculatePercentage = (cents: number, percentage: number): number => {
  return Math.round(cents * percentage);
};

/**
 * Input formatter for currency fields
 * Restricts input to valid currency format: digits and one decimal point
 *
 * @param value - Current input value
 * @returns Sanitized value
 */
export const formatCurrencyInput = (value: string): string => {
  // Remove all non-digit and non-decimal characters
  let sanitized = value.replace(/[^\d.]/g, '');

  // Ensure only one decimal point
  const parts = sanitized.split('.');
  if (parts.length > 2) {
    sanitized = parts[0] + '.' + parts.slice(1).join('');
  }

  // Limit to 2 decimal places
  if (parts.length === 2 && parts[1].length > 2) {
    sanitized = parts[0] + '.' + parts[1].substring(0, 2);
  }

  return sanitized;
};

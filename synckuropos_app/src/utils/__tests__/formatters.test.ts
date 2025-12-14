import {
  formatCurrency,
  formatDate,
  formatDateShort,
  formatDateTime,
  formatQty,
  formatPercentage,
} from '@/utils/formatters';

describe('Formatters', () => {
  describe('formatCurrency', () => {
    it('should format currency correctly for Ecuador (cents to dollars)', () => {
      expect(formatCurrency(1000)).toBe('$10,00');
      expect(formatCurrency(15099)).toBe('$150,99');
      expect(formatCurrency(1)).toBe('$0,01');
    });

    it('should format zero as zero dollars', () => {
      expect(formatCurrency(0)).toBe('$0,00');
    });

    it('should format large amounts correctly', () => {
      expect(formatCurrency(999999)).toBe('$9.999,99');
    });

    it('should handle decimal amounts', () => {
      expect(formatCurrency(1234)).toBe('$12,34');
    });

    it('should handle negative amounts', () => {
      const result = formatCurrency(-1000);
      expect(result).toContain('-');
      expect(result).toContain('10,00');
    });
  });

  describe('formatDate', () => {
    it('should format a date object in es-EC locale', () => {
      // Use explicit UTC time to avoid timezone issues
      const date = new Date('2024-01-15T00:00:00Z');
      const result = formatDate(date);
      expect(result).toContain('2024');
      expect(result).toMatch(/\d{1,2}/); // Contains at least a day number
    });

    it('should format a date string', () => {
      const result = formatDate('2024-01-15');
      expect(result).toContain('2024');
      expect(result).toMatch(/\d{1,2}/); // Contains numbers
    });

    it('should accept custom format options', () => {
      const date = new Date('2024-01-15');
      const result = formatDate(date, { year: '2-digit', month: 'numeric', day: 'numeric' });
      expect(result).toBeDefined();
    });
  });

  describe('formatDateShort', () => {
    it('should format date in DD/MM/YYYY format', () => {
      const date = new Date('2024-01-15T00:00:00Z');
      const result = formatDateShort(date);
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
      expect(result).toContain('2024');
    });

    it('should handle string dates', () => {
      const result = formatDateShort('2024-12-25');
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });
  });

  describe('formatDateTime', () => {
    it('should format date and time', () => {
      const date = new Date('2024-01-15T14:30:00Z');
      const result = formatDateTime(date);
      expect(result).toContain('2024');
      expect(result).toContain('30');
      expect(result).toMatch(/\d{1,2}/); // Contains day or hour numbers
    });

    it('should handle string dates', () => {
      const result = formatDateTime('2024-01-15T14:30:00');
      expect(result).toBeDefined();
    });
  });

  describe('formatQty', () => {
    it('should format quantity as a whole number', () => {
      expect(formatQty(5)).toBe('5');
    });

    it('should format quantity with decimal places', () => {
      const result = formatQty(5.75, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      expect(result).toContain('5');
    });

    it('should use es-EC locale by default', () => {
      const result = formatQty(1000);
      expect(result).toBeDefined();
    });

    it('should handle zero quantity', () => {
      expect(formatQty(0)).toBe('0');
    });

    it('should handle large quantities', () => {
      expect(formatQty(1000000)).toContain('1');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentage correctly', () => {
      const result = formatPercentage(0.15);
      expect(result).toContain('15');
      expect(result).toContain('%');
    });

    it('should handle default decimals', () => {
      const result = formatPercentage(0.333);
      expect(result).toContain('%');
    });

    it('should handle custom decimals', () => {
      const result = formatPercentage(0.3333, 2);
      expect(result).toContain('%');
    });

    it('should handle zero percentage', () => {
      const result = formatPercentage(0);
      expect(result).toContain('0');
      expect(result).toContain('%');
    });

    it('should handle 100 percent', () => {
      const result = formatPercentage(1);
      expect(result).toContain('100');
      expect(result).toContain('%');
    });
  });
});

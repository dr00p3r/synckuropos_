import React from 'react';
import type { SaleItem, SaleSummary as SaleSummaryType } from '../../../types/types';
import './SaleSummary.css';

interface SaleSummaryProps {
  saleItems: SaleItem[];
  taxRate: number;
  onCompleteSale: () => void;
}

export const SaleSummary: React.FC<SaleSummaryProps> = ({ 
  saleItems, 
  taxRate, 
  onCompleteSale 
}) => {
  // Calculate sale summary
  const calculateSummary = (): SaleSummaryType => {
    const subtotal = saleItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = subtotal * taxRate;
    const total = subtotal + tax;
    
    return { subtotal, tax, total };
  };

  const summary = calculateSummary();

  if (saleItems.length === 0) {
    return null;
  }

  return (
    <>
      <div className="sale-summary">
        <div className="summary-row">
          <span>Subtotal:</span>
          <span>${summary.subtotal.toFixed(2)}</span>
        </div>
        <div className="summary-row">
          <span>IVA ({(taxRate * 100).toFixed(0)}%):</span>
          <span>${summary.tax.toFixed(2)}</span>
        </div>
        <div className="summary-row total-row">
          <span>TOTAL:</span>
          <span>${summary.total.toFixed(2)}</span>
        </div>
      </div>

      <button 
        className="complete-sale-button"
        onClick={onCompleteSale}
      >
        <div className="button-top">Completar Pago</div>
        <div className="button-bottom">${summary.total.toFixed(2)}</div>
      </button>
    </>
  );
};
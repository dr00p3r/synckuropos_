import React from 'react';
import './DebtSummaryCards.css';

interface DebtSummary {
  totalDebt: number;
  creditLimit: number;
  availableCredit: number;
}

interface DebtSummaryCardsProps {
  debtSummary: DebtSummary;
  formatCurrency: (amount: number) => string;
}

export const DebtSummaryCards: React.FC<DebtSummaryCardsProps> = ({
  debtSummary,
  formatCurrency
}) => {
  return (
    <div className="debt-summary-cards">
      <div className="debt-summary-card debt-total">
        <div className="card-icon">💳</div>
        <div className="card-content">
          <span className="card-label">Deuda Total</span>
          <span className="card-value">{formatCurrency(debtSummary.totalDebt)}</span>
        </div>
      </div>
      
      <div className="debt-summary-card credit-limit">
        <div className="card-icon">🏦</div>
        <div className="card-content">
          <span className="card-label">Límite de Crédito</span>
          <span className="card-value">{formatCurrency(debtSummary.creditLimit)}</span>
        </div>
      </div>
      
      <div className="debt-summary-card available-credit">
        <div className="card-icon">✅</div>
        <div className="card-content">
          <span className="card-label">Crédito Disponible</span>
          <span className="card-value">{formatCurrency(debtSummary.availableCredit)}</span>
        </div>
      </div>
    </div>
  );
};

export default DebtSummaryCards;
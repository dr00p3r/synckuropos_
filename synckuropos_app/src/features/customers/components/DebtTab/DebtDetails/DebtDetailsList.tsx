import React from 'react';
import type { Debt, DebtPayment } from '../../../../../types/types';
import './DebtDetailsList.css';

interface DebtDetail extends Debt {
  totalPaid: number;
  pendingAmount: number;
  payments: DebtPayment[];
}

interface DebtDetailsListProps {
  debtDetails: DebtDetail[];
  formatCurrency: (amount: number) => string;
}

export const DebtDetailsList: React.FC<DebtDetailsListProps> = ({
  debtDetails,
  formatCurrency
}) => {
  return (
    <div className="debt-details">
      {debtDetails.map((debt) => (
        <div key={debt.debtId} className="debt-detail-card">
          <div className="debt-detail-header">
            <span className="debt-date">
              {new Date(debt.createdAt).toLocaleDateString()}
            </span>
            <span className="debt-amount">
              {formatCurrency(debt.pendingAmount)}
            </span>
          </div>
          <div className="debt-detail-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ 
                  width: `${(debt.totalPaid / debt.amount) * 100}%` 
                }}
              />
            </div>
            <span className="progress-text">
              Pagado: {formatCurrency(debt.totalPaid)} de {formatCurrency(debt.amount)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DebtDetailsList;
import React from 'react';
import type { Debt, DebtPayment } from '../../../../types/types';
import DebtSummaryCards from './DebtSummaryCards/DebtSummaryCards';
import PaymentForm from './PaymentForm/PaymentForm';
import DebtDetailsList from './DebtDetails/DebtDetailsList';
import './DebtTab.css';

interface DebtSummary {
  totalDebt: number;
  creditLimit: number;
  availableCredit: number;
}

interface DebtDetail extends Debt {
  totalPaid: number;
  pendingAmount: number;
  payments: DebtPayment[];
}

interface DebtTabProps {
  debtSummary: DebtSummary;
  debtDetails: DebtDetail[];
  paymentAmount: string;
  setPaymentAmount: (amount: string) => void;
  onRegisterPayment: () => void;
  processingPayment: boolean;
  formatCurrency: (amount: number) => string;
}

export const DebtTab: React.FC<DebtTabProps> = ({
  debtSummary,
  debtDetails,
  paymentAmount,
  setPaymentAmount,
  onRegisterPayment,
  processingPayment,
  formatCurrency
}) => {
  return (
    <div className="customer-debt-tab">
      <h3>Resumen de Cuenta</h3>
      
      <DebtSummaryCards 
        debtSummary={debtSummary}
        formatCurrency={formatCurrency}
      />

      {debtSummary.totalDebt > 0 && (
        <>
          <h3>Registrar Abono</h3>
          
          <PaymentForm
            paymentAmount={paymentAmount}
            setPaymentAmount={setPaymentAmount}
            onRegisterPayment={onRegisterPayment}
            processingPayment={processingPayment}
            maxAmount={debtSummary.totalDebt}
          />

          <h3>Detalle de Deudas</h3>
          
          <DebtDetailsList
            debtDetails={debtDetails}
            formatCurrency={formatCurrency}
          />
        </>
      )}

      {debtSummary.totalDebt === 0 && (
        <div className="no-debt-message">
          <div className="no-debt-icon">🎉</div>
          <h3>¡Sin Deudas Pendientes!</h3>
          <p>Este cliente no tiene deudas pendientes por el momento.</p>
        </div>
      )}
    </div>
  );
};

export default DebtTab;
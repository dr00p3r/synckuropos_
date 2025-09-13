import React from 'react';
import './PaymentForm.css';

interface PaymentFormProps {
  paymentAmount: string;
  setPaymentAmount: (amount: string) => void;
  onRegisterPayment: () => void;
  processingPayment: boolean;
  maxAmount: number;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  paymentAmount,
  setPaymentAmount,
  onRegisterPayment,
  processingPayment,
  maxAmount
}) => {
  return (
    <div className="payment-form">
      <div className="customer-form-row">
        <div className="customer-form-group">
          <label htmlFor="paymentAmount">
            Monto a Abonar <span className="required">*</span>
          </label>
          <div className="customer-currency-input">
            <span className="currency-symbol">$</span>
            <input
              type="number"
              id="paymentAmount"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="0.00"
              min="0.01"
              max={(maxAmount / 100).toString()}
              step="0.01"
              disabled={processingPayment}
            />
          </div>
        </div>
        <div className="payment-button-container">
          <button
            type="button"
            className="customer-btn customer-btn-success"
            onClick={onRegisterPayment}
            disabled={processingPayment || !paymentAmount || parseFloat(paymentAmount) <= 0}
          >
            {processingPayment ? '⏳ Procesando...' : '💰 Registrar Abono'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentForm;
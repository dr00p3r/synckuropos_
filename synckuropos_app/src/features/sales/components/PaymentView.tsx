import React from 'react';
import { ArrowLeft, DollarSign, User, CheckCircle, Loader2 } from 'lucide-react';
import { usePaymentLogic } from '../hooks/usePaymentLogic';
import { safeParseNumber } from '@/utils/money';
import type { SaleItem, SaleSummary } from '../../../types/types';
import './PaymentView.css';

interface PaymentViewProps {
  saleItems: SaleItem[];
  summary: SaleSummary;
  onBackToSale: () => void;
  onSaleCompleted: () => void;
  paymentAmountRef: React.RefObject<HTMLInputElement>;
}

export const PaymentView: React.FC<PaymentViewProps> = ({
  saleItems,
  summary,
  onBackToSale,
  onSaleCompleted,
  paymentAmountRef
}) => {
  const {
    customers,
    selectedCustomerId,
    setSelectedCustomerId,
    receivedAmount,
    setReceivedAmount,
    isCredit,
    setIsCredit,
    processingPayment,
    selectedCustomer,
    changeAmount,
    handleConfirmPurchase
  } = usePaymentLogic({ saleItems, summary, onSaleCompleted });

  const receivedAmountNum = safeParseNumber(receivedAmount);

  // Handle Enter key to confirm purchase
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !processingPayment) {
      e.preventDefault();
      handleConfirmPurchase();
    }
  };

  return (
    <>
      {/* Back button */}
      <button
        className="back-to-sale-button"
        onClick={onBackToSale}
        title="Volver a la venta (Escape)"
      >
        <ArrowLeft size={16} />
        Volver a la Compra
      </button>

      {/* Payment view */}
      <div className="payment-view">
        <div className="payment-sections">
          {/* Received amount section */}
          <div className="payment-section">
            <h3>
              <DollarSign size={20} />
              Monto Recibido
            </h3>
            <div className="payment-input-container">
              <span className="currency-symbol">$</span>
              <input
                ref={paymentAmountRef}
                type="number"
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="payment-input"
              />
            </div>
            {receivedAmount && (
              <div className={`change-indicator ${changeAmount >= 0 ? 'positive' : 'negative'}`}>
                {changeAmount >= 0 ? (
                  <>Cambio: <strong>${(changeAmount / 100).toFixed(2)}</strong></>
                ) : (
                  <>Falta: <strong>${(Math.abs(changeAmount) / 100).toFixed(2)}</strong></>
                )}
              </div>
            )}
          </div>

          {/* Customer section */}
          <div className="payment-section">
            <h3>
              <User size={20} />
              Cliente
            </h3>
            <select
              value={selectedCustomerId}
              onChange={(e) => {
                setSelectedCustomerId(e.target.value);
                setIsCredit(false); // Reset credit when changing customer
              }}
              className="customer-select"
            >
              <option value="">Seleccionar cliente (opcional)</option>
              {customers.map((customer) => (
                <option key={customer.customerId} value={customer.customerId}>
                  {customer.fullname}
                </option>
              ))}
            </select>

            {selectedCustomer && selectedCustomer.allowCredit && (
              <label className="credit-checkbox-label">
                <input
                  type="checkbox"
                  checked={isCredit}
                  onChange={(e) => setIsCredit(e.target.checked)}
                  className="credit-checkbox"
                />
                <span className="credit-checkbox-custom"></span>
                Venta Fiada
              </label>
            )}
          </div>
        </div>

        {/* Confirm purchase button */}
        <button
          className="confirm-purchase-button"
          onClick={handleConfirmPurchase}
          disabled={processingPayment || (!isCredit && receivedAmountNum < summary.total)}
          title="Confirmar pago (Enter)"
        >
          {processingPayment ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <CheckCircle size={20} />
              Confirmar Compra
            </>
          )}
        </button>
      </div>
    </>
  );
};
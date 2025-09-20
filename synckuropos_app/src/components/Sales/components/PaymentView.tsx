import React from 'react';
import { usePaymentLogic } from '../hooks/usePaymentLogic';
import type { SaleItem, SaleSummary } from '../../../types/types';
import './PaymentView.css';

interface PaymentViewProps {
  saleItems: SaleItem[];
  summary: SaleSummary;
  onBackToSale: () => void;
  onSaleCompleted: () => void;
}

export const PaymentView: React.FC<PaymentViewProps> = ({ 
  saleItems, 
  summary, 
  onBackToSale,
  onSaleCompleted 
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

  const receivedAmountNum = parseFloat(receivedAmount) || 0;

  return (
    <>
      {/* Back button */}
      <button 
        className="back-to-sale-button"
        onClick={onBackToSale}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="currentColor"/>
        </svg>
        Volver a la Compra
      </button>

      {/* Payment view */}
      <div className="payment-view">
        <div className="payment-sections">
          {/* Received amount section */}
          <div className="payment-section">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.48 2 12 2ZM13.5 6C15.99 6 18 8.01 18 10.5S15.99 15 13.5 15H12V13H13.5C14.88 13 16 11.88 16 10.5S14.88 8 13.5 8H12V6H13.5ZM11 8H9.5C8.12 8 7 9.12 7 10.5S8.12 13 9.5 13H11V15H9.5C7.01 15 5 12.99 5 10.5S7.01 6 9.5 6H11V8Z" fill="currentColor"/>
              </svg>
              Monto Recibido
            </h3>
            <div className="payment-input-container">
              <span className="currency-symbol">$</span>
              <input
                type="number"
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(e.target.value)}
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/>
              </svg>
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
        >
          {processingPayment ? (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z" fill="currentColor">
                  <animateTransform attributeName="transform" attributeType="XML" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
                </path>
              </svg>
              Procesando...
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/>
              </svg>
              Confirmar Compra
            </>
          )}
        </button>
      </div>
    </>
  );
};
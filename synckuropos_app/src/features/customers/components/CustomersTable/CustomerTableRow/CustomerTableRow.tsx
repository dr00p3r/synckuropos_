import React from 'react';
import type { CustomerTableRowProps } from '../../../types';
import './CustomerTableRow.css';

const CustomerTableRow: React.FC<CustomerTableRowProps> = React.memo(({
  customer,
  onManageCustomer,
  formatCurrency
}) => {
  return (
    <tr 
      className={`customer-row ${customer.debtTotal > 0 ? 'has-debt' : ''}`}
    >
      <td className="customer-name">
        {customer.fullname}
        {customer.debtTotal > 0 && <span className="debt-badge">Con deuda</span>}
      </td>
      <td className="customer-phone">
        {customer.phone || '—'}
      </td>
      <td className="customer-debt">
        {customer.debtTotal > 0 ? (
          <span className="debt-amount">
            {formatCurrency(customer.debtTotal)}
          </span>
        ) : (
          <span className="no-debt">—</span>
        )}
      </td>
      <td className="customer-credit-limit">
        {customer.allowCredit ? (
          <span className="credit-limit">
            {formatCurrency(customer.creditLimit)}
          </span>
        ) : (
          <span className="no-credit">Sin crédito</span>
        )}
      </td>
      <td className="customer-actions">
        <button
          className="manage-btn"
          onClick={() => onManageCustomer(customer)}
          title="Gestionar cliente"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          Gestionar
        </button>
      </td>
    </tr>
  );
});

CustomerTableRow.displayName = 'CustomerTableRow';

export default CustomerTableRow;

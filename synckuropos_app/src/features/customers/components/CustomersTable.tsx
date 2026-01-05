import React from 'react';
import CustomerTableHeader from './CustomerTableHeader/CustomerTableHeader';
import CustomerTableRow from './CustomerTableRow/CustomerTableRow';
import type { CustomersTableProps } from '../../types';
import './CustomersTable.css';

const CustomersTable: React.FC<CustomersTableProps> = ({
  customers,
  sortField,
  sortDirection,
  onSort,
  onManageCustomer,
  formatCurrency
}) => {
  return (
    <div className="customers-table-wrapper">
      <table className="customers-table">
        <CustomerTableHeader 
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={onSort}
        />
        <tbody>
          {customers.map((customer) => (
            <CustomerTableRow
              key={customer.customerId}
              customer={customer}
              onManageCustomer={onManageCustomer}
              formatCurrency={formatCurrency}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CustomersTable;
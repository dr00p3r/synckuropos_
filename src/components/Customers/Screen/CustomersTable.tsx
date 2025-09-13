import React from 'react';
import CustomerTableHeader, { type SortField, type SortDirection } from './CustomerTableHeader';
import CustomerTableRow from './CustomerTableRow';
import type { Customer } from '../../../types/types';
import './CustomersTable.css';

interface CustomerWithDebt extends Customer {
  debtTotal: number;
}

interface CustomersTableProps {
  customers: CustomerWithDebt[];
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  onManageCustomer: (customer: CustomerWithDebt) => void;
  formatCurrency: (amount: number) => string;
}

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
import React from 'react';
import './CustomerTableHeader.css';

export type SortField = 'fullname' | 'phone' | 'debtTotal' | 'creditLimit';
export type SortDirection = 'asc' | 'desc';

interface CustomerTableHeaderProps {
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}

const CustomerTableHeader: React.FC<CustomerTableHeaderProps> = ({
  sortField,
  sortDirection,
  onSort
}) => {
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <thead>
      <tr>
        <th 
          className="sortable-header"
          onClick={() => onSort('fullname')}
        >
          Nombre Completo {getSortIcon('fullname')}
        </th>
        <th 
          className="sortable-header"
          onClick={() => onSort('phone')}
        >
          Teléfono {getSortIcon('phone')}
        </th>
        <th 
          className="sortable-header"
          onClick={() => onSort('debtTotal')}
        >
          Deuda Total {getSortIcon('debtTotal')}
        </th>
        <th 
          className="sortable-header"
          onClick={() => onSort('creditLimit')}
        >
          Límite de Crédito {getSortIcon('creditLimit')}
        </th>
        <th className="actions-header">Acciones</th>
      </tr>
    </thead>
  );
};

export default CustomerTableHeader;
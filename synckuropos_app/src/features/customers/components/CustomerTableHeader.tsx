import React from 'react';
import type { CustomerTableHeaderProps, SortField } from '../../../types';
import './CustomerTableHeader.css';

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
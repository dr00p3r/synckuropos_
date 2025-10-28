import React from 'react';
import type { SortField, SortDirection } from '../types';
import './TableHeader.css';

interface TableHeaderProps {
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}

const TableHeader: React.FC<TableHeaderProps> = ({
  sortField,
  sortDirection,
  onSort
}) => {
  // Obtener icono de ordenamiento
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <thead>
      <tr>
        <th 
          className="sortable-header"
          onClick={() => onSort('code')}
        >
          Código {getSortIcon('code')}
        </th>
        <th 
          className="sortable-header"
          onClick={() => onSort('name')}
        >
          Nombre {getSortIcon('name')}
        </th>
        <th 
          className="sortable-header actions-header"
          onClick={() => onSort('basePrice')}
        >
          Precio {getSortIcon('basePrice')}
        </th>
        <th 
          className="sortable-header actions-header"
          onClick={() => onSort('stock')}
        >
          Cantidad {getSortIcon('stock')}
        </th>
        <th className="actions-header">Editar</th>
        <th className="actions-header">Estado</th>
      </tr>
    </thead>
  );
};

export default TableHeader;
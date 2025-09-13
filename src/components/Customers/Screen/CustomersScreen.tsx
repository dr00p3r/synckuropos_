import React, { useState } from 'react';
import CustomerModal from "../Modal/CustomerModal.tsx";
import SearchControls from './SearchControls';
import CustomersTable from './CustomersTable';
import EmptyState from './EmptyState';
import LoadingState from './LoadingState';
import { useCustomersData, type CustomerWithDebt } from './useCustomersData';
import type { Customer } from '../../../types/types.ts';
import './CustomersScreen.css';

const CustomersScreen: React.FC = () => {
  // Estados del modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [openDebtTab, setOpenDebtTab] = useState(false);

  // Custom hook para manejo de datos
  const {
    customers,
    filteredCustomers,
    loading,
    searchTerm,
    showOnlyWithDebt,
    sortField,
    sortDirection,
    setSearchTerm,
    setShowOnlyWithDebt,
    handleSort,
    loadCustomers,
    formatCurrency,
  } = useCustomersData();

  // Abrir modal para crear cliente
  const handleCreateCustomer = () => {
    setSelectedCustomer(null);
    setModalMode('create');
    setOpenDebtTab(false);
    setModalVisible(true);
  };

  // Abrir modal para gestionar cliente
  const handleManageCustomer = (customer: CustomerWithDebt) => {
    setSelectedCustomer(customer);
    setModalMode('edit');
    // Si el cliente tiene deuda, abrir directamente en la pestaña de deuda
    setOpenDebtTab(customer.debtTotal > 0);
    setModalVisible(true);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedCustomer(null);
    setOpenDebtTab(false);
  };

  // Manejar cuando se guarda un cliente
  const handleCustomerSaved = () => {
    loadCustomers();
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="customers-screen">
      {/* Header */}
      <div className="customers-header">
        <h1>Clientes</h1>
      </div>

      {/* Controles de búsqueda y filtros */}
      <SearchControls
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showOnlyWithDebt={showOnlyWithDebt}
        onDebtFilterChange={setShowOnlyWithDebt}
        totalCustomers={customers.length}
        filteredCount={filteredCustomers.length}
        onAddCustomer={handleCreateCustomer}
      />

      {/* Contenido principal - Tabla o Estado vacío */}
      <div className="customers-table-container">
        {filteredCustomers.length === 0 ? (
          <EmptyState
            searchTerm={searchTerm}
            showOnlyWithDebt={showOnlyWithDebt}
            onAddCustomer={handleCreateCustomer}
          />
        ) : (
          <CustomersTable
            customers={filteredCustomers}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            onManageCustomer={handleManageCustomer}
            formatCurrency={formatCurrency}
          />
        )}
      </div>

      {/* Modal de gestión de clientes */}
      {modalVisible && (
        <CustomerModal
          isOpen={modalVisible}
          mode={modalMode}
          customer={selectedCustomer || undefined}
          openDebtTab={openDebtTab}
          onClose={handleCloseModal}
          onSave={handleCustomerSaved}
        />
      )}
    </div>
  );
};

export default CustomersScreen;
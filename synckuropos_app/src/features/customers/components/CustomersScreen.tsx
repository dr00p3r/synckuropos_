import React, { useState } from 'react';
import { CustomerModal } from './CustomerModal/CustomerModal';
import SearchControls from './SearchControls/SearchControls';
import CustomersTable from './CustomersTable/CustomersTable';
import EmptyState from './EmptyState/EmptyState';
import LoadingState from './LoadingState/LoadingState';
import { useCustomersData } from '../hooks/useCustomersData';
import type { Customer, CustomerWithDebt } from '../types';
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
        onShowOnlyWithDebtChange={setShowOnlyWithDebt}
        totalCustomers={customers.length}
        filteredCustomers={filteredCustomers.length}
        onCreateCustomer={handleCreateCustomer}
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
import React, { useState } from 'react';
import { CustomersTable } from './CustomersTable';
import { CustomerFormDialog } from './CustomerFormDialog';
import { useCustomers } from '../hooks/useCustomers';
import type { CustomerWithDebt } from '../services/customerRepository';

export const CustomersScreen: React.FC = () => {
    const {
        customers,
        loading,
        searchTerm,
        setSearchTerm,
        showOnlyWithDebt,
        setShowOnlyWithDebt,
        showInactive,
        setShowInactive,
        loadCustomers,
        toggleStatus
    } = useCustomers();

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithDebt | undefined>(undefined);

    const openCreate = () => {
        setSelectedCustomer(undefined);
        setModalVisible(true);
    };

    const openEdit = (customer: CustomerWithDebt) => {
        setSelectedCustomer(customer);
        setModalVisible(true);
    };

    return (
        <div className="h-full">
            <CustomersTable
                customers={customers}
                loading={loading}
                searchTerm={searchTerm}
                showOnlyWithDebt={showOnlyWithDebt}
                showInactive={showInactive}
                onSearchChange={setSearchTerm}
                onShowOnlyWithDebtChange={setShowOnlyWithDebt}
                onShowInactiveChange={setShowInactive}
                onEdit={openEdit}
                onToggleStatus={toggleStatus}
                onCreate={openCreate}
            />

            <CustomerFormDialog
                visible={modalVisible}
                onHide={() => setModalVisible(false)}
                onSave={loadCustomers}
                customerToEdit={selectedCustomer}
            />
        </div>
    );
};
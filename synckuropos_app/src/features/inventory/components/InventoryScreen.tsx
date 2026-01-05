import React, { useState } from 'react';
import { InventoryTable } from './InventoryTable';
import { ProductFormDialog } from './ProductFormDialog';
import { useInventory } from '../hooks/useInventory';
import type { Product } from '@/types/types';

export const InventoryScreen: React.FC = () => {
    const { products, loading, loadProducts, toggleStatus } = useInventory();
    
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);

    const openCreate = () => {
        setSelectedProduct(undefined);
        setModalVisible(true);
    };

    const openEdit = (product: Product) => {
        setSelectedProduct(product);
        setModalVisible(true);
    };

    return (
        <div className="h-full flex flex-column gap-3">
            <InventoryTable 
                products={products}
                loading={loading}
                onEdit={openEdit}
                onToggleStatus={toggleStatus}
                onCreate={openCreate}
            />

            <ProductFormDialog 
                visible={modalVisible}
                onHide={() => setModalVisible(false)}
                onSave={loadProducts}
                productToEdit={selectedProduct}
            />
        </div>
    );
};
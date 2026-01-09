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
        // h-full + min-h-0 es clave para que flex-grow funcione con scroll interno
        <div className="h-full min-h-0 flex flex-column">
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
import React, { useState, useEffect } from 'react';
import { useSalesLogic } from '../hooks/useSalesLogic';
import { ProductSearch } from './ProductSearch';
import { SaleItemsTable } from './SaleItemsTable';
import { SalesSummary } from './SaleSummary';
import { PaymentModal } from './PaymentModal';
import type { SaleItem } from '../types';

interface SalesScreenProps {
    saleItems: SaleItem[];
    setSaleItems: React.Dispatch<React.SetStateAction<SaleItem[]>>;
    onClearSale: () => void;
}

export const SalesScreen: React.FC<SalesScreenProps> = ({ saleItems, setSaleItems, onClearSale }) => {
    
    // Usamos el hook de lógica general
    const { 
        showPaymentView, 
        setShowPaymentView, 
        addProductToSale, 
        calculateSummary, 
        handleSaleCompleted 
    } = useSalesLogic({ saleItems, setSaleItems, onClearSale });

    const summary = calculateSummary();

    // Atajo de teclado global para cobrar (F9)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F9' && saleItems.length > 0) {
                e.preventDefault();
                setShowPaymentView(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [saleItems, setShowPaymentView]);

    return (
      <div className="grid h-full m-0">
          
          {/* 1. COLUMNA IZQUIERDA (Resumen) */}
          <div className="col-12 md:col-4 h-full pb-3 md:pb-0">
              <SalesSummary 
                  summary={summary} 
                  itemCount={saleItems.length}
                  onPaymentClick={() => setShowPaymentView(true)} 
              />
          </div>

          {/* 2. COLUMNA DERECHA (Tabla y Búsqueda) */}
          <div className="col-12 md:col-8 flex flex-column gap-3 h-full">
              
              {/* Barra de Búsqueda */}
              <div className="card shadow-1 bg-white border-round-xl p-3">
                  <ProductSearch 
                      onProductSelect={addProductToSale} 
                      hasSaleItems={saleItems.length > 0}
                      onClearSale={onClearSale}
                  />
              </div>

              {/* Tabla de Items */}
              <div className="flex-grow-1 overflow-hidden">
                  <SaleItemsTable 
                      items={saleItems} 
                      setSaleItems={setSaleItems} 
                  />
              </div>
          </div>

          <PaymentModal 
              visible={showPaymentView} 
              onHide={() => setShowPaymentView(false)} 
              saleItems={saleItems}
              summary={summary}
              onSaleCompleted={handleSaleCompleted}
          />
      </div>
  );
};
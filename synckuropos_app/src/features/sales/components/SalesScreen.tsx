import React from 'react';
import { useSalesLogic } from '../hooks/useSalesLogic';
import { SearchBar } from './SearchBar';
import { SaleItemsTable } from './SaleItemsTable';
import { SaleSummary } from './SaleSummary';
import { PaymentView } from './PaymentView';
import type { SalesScreenProps } from '../types';
import './SalesScreen.css';

const SalesScreen: React.FC<SalesScreenProps> = ({ saleItems, setSaleItems, onClearSale }) => {
  const {
    showPaymentView,
    taxRate,
    addProductToSale,
    calculateSummary,
    handleCompleteSale,
    handleBackToSale,
    handleSaleCompleted
  } = useSalesLogic({ saleItems, setSaleItems, onClearSale });

  const summary = calculateSummary();

  return (
    <div className="sales-screen">
      {/* Header */}
      <div className="sales-header">
        <h1>Venta</h1>
      </div>

      {showPaymentView ? (
        <PaymentView
          saleItems={saleItems}
          summary={summary}
          onBackToSale={handleBackToSale}
          onSaleCompleted={handleSaleCompleted}
        />
      ) : (
        <>
          {/* Sale view */}
          <div className="sale-view visible">
            <SearchBar
              onProductSelect={addProductToSale}
              onClearSale={onClearSale}
              hasSaleItems={saleItems.length > 0}
            />

            <SaleItemsTable
              saleItems={saleItems}
              setSaleItems={setSaleItems}
            />
          </div>

          <SaleSummary
            saleItems={saleItems}
            taxRate={taxRate}
            onCompleteSale={handleCompleteSale}
          />
        </>
      )}
    </div>
  );
};

export default SalesScreen;

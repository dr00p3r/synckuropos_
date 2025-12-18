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
    handleSaleCompleted,
    searchInputRef,
    paymentAmountRef,
  } = useSalesLogic({ saleItems, setSaleItems, onClearSale });

  const summary = calculateSummary();

  return (
    <div className="sales-screen">
      {/* Header */}
      <div className="sales-header">
        <h1>Venta</h1>
      </div>

      {/* Split View Container */}
      <div className="split-view-container">
        {/* LEFT PANEL: Always visible items list */}
        <div className="items-panel">
          <SaleItemsTable
            saleItems={saleItems}
            setSaleItems={setSaleItems}
          />

          <SaleSummary
            saleItems={saleItems}
            taxRate={taxRate}
            onCompleteSale={handleCompleteSale}
          />
        </div>

        {/* RIGHT PANEL: Dynamic content (Search or Payment) */}
        <div className="action-panel">
          {showPaymentView ? (
            <PaymentView
              saleItems={saleItems}
              summary={summary}
              onBackToSale={handleBackToSale}
              onSaleCompleted={handleSaleCompleted}
              paymentAmountRef={paymentAmountRef}
            />
          ) : (
            <SearchBar
              onProductSelect={addProductToSale}
              onClearSale={onClearSale}
              hasSaleItems={saleItems.length > 0}
              searchInputRef={searchInputRef}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesScreen;

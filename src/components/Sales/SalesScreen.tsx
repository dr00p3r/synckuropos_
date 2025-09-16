import React from 'react';
import { useSalesLogic } from './hooks/useSalesLogic';
import { SearchBar } from './components/SearchBar';
import { SaleItemsTable } from './components/SaleItemsTable';
import { SaleSummary } from './components/SaleSummary';
import { PaymentView } from './components/PaymentView';
import type { SaleItem } from '../../types/types';
import './SalesScreen.css';

interface SalesScreenProps {
  saleItems: SaleItem[];
  setSaleItems: React.Dispatch<React.SetStateAction<SaleItem[]>>;
  onClearSale: () => void;
}

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

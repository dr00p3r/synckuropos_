import React from 'react';
import type { TabNavigationProps } from './ProductModalTypes';
import './TabNavigation.css';

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
  hasProduct
}) => {
  return (
    <div className="modal-tabs">
      <button 
        className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
        onClick={() => onTabChange('general')}
      >
        Información General
      </button>
      <button 
        className={`tab-btn ${activeTab === 'stock' ? 'active' : ''}`}
        onClick={() => onTabChange('stock')}
        disabled={!hasProduct}
      >
        Ajuste de Stock
      </button>
      <button 
        className={`tab-btn ${activeTab === 'combos' ? 'active' : ''}`}
        onClick={() => onTabChange('combos')}
        disabled={!hasProduct}
      >
        Combos del Producto
      </button>
    </div>
  );
};
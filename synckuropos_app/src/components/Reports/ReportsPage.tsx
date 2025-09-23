import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DateRangeProvider } from '../../contexts/DateRangeContext';
import { DateRangePicker } from './DateRangePicker';
import { SalesKPICard, ProfitabilityKPICard, InventoryKPICard } from './KPICards';
import { ReportGlobalChart } from './ReportGlobalChart';
import './ReportsPage.css';

export type KPICardType = 'sales' | 'profitability' | 'inventory';

interface KPICardProps {
  cardType: KPICardType;
  isExpanded: boolean;
  onExpand: (cardId: KPICardType) => void;
}

const KPICardWrapper: React.FC<KPICardProps> = ({ cardType, isExpanded, onExpand }) => {
  const handleClick = () => {
    onExpand(cardType);
  };

  const cardVariants = {
    collapsed: {
      scale: 1,
      z: 1
    },
    expanded: {
      scale: 1.02,
      z: 10
    }
  };

  return (
    <motion.div
      className={`kpi-card-wrapper ${isExpanded ? 'expanded' : ''}`}
      variants={cardVariants}
      animate={isExpanded ? 'expanded' : 'collapsed'}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={`${isExpanded ? 'Contraer' : 'Expandir'} tarjeta de ${cardType}`}
    >
      {cardType === 'sales' && <SalesKPICard />}
      {cardType === 'profitability' && <ProfitabilityKPICard />}
      {cardType === 'inventory' && <InventoryKPICard />}
    </motion.div>
  );
};

const ReportsPageContent: React.FC = () => {
  const [expandedCard, setExpandedCard] = useState<KPICardType | null>(null);

  const handleCardExpand = (cardId: KPICardType) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  return (
    <div className="reports-page">
      {/* Header - Solo visible en móvil */}
      <header className="reports-header">
        <h1 className="reports-title">Reportes</h1>
        <DateRangePicker />
      </header>

      {/* Dashboard Container */}
      <div className="dashboard-container">
        <AnimatePresence mode="wait">
          {expandedCard ? (
            // Vista expandida de una sola tarjeta
            <motion.div
              key="expanded-view"
              className="expanded-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <div className="expanded-header">
                <button
                  className="back-button"
                  onClick={() => setExpandedCard(null)}
                  aria-label="Volver al dashboard"
                >
                  <svg viewBox="0 0 24 24" className="back-icon">
                    <path d="M19 11H7.83l4.88-4.88c.39-.39.39-1.02 0-1.41-.39-.39-1.02-.39-1.41 0l-6.59 6.59c-.39.39-.39 1.02 0 1.41l6.59 6.59c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L7.83 13H19c.55 0 1-.45 1-1s-.45-1-1-1z"/>
                  </svg>
                  Volver al Dashboard
                </button>
                <div className="expanded-date-picker">
                  <DateRangePicker />
                </div>
              </div>
              
              <div className="expanded-content">
                <KPICardWrapper
                  cardType={expandedCard}
                  isExpanded={true}
                  onExpand={handleCardExpand}
                />
              </div>
            </motion.div>
          ) : (
            // Vista dashboard normal
            <motion.div
              key="dashboard-view"
              className="dashboard-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Date Range Picker - Solo visible en desktop */}
              <div className="desktop-date-picker">
                <DateRangePicker />
              </div>

              {/* KPI Grid */}
              <div className="kpi-dashboard-grid">
                <KPICardWrapper
                  cardType="sales"
                  isExpanded={false}
                  onExpand={handleCardExpand}
                />
                <KPICardWrapper
                  cardType="profitability"
                  isExpanded={false}
                  onExpand={handleCardExpand}
                />
                <KPICardWrapper
                  cardType="inventory"
                  isExpanded={false}
                  onExpand={handleCardExpand}
                />
              </div>

              {/* Global Chart */}
              <div className="global-chart-container">
                <ReportGlobalChart />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Componente principal con provider
export const ReportsPage: React.FC = () => {
  return (
    <DateRangeProvider>
      <ReportsPageContent />
    </DateRangeProvider>
  );
};
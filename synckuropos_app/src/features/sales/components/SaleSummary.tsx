import React from 'react';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';
import type { SaleSummary } from '../../../types/types';
import { formatCurrency } from '../../../utils/formatters';
import { PageCard } from '@/components/common/PageCard';

interface SalesSummaryProps {
    summary: SaleSummary;
    onPaymentClick: () => void;
    itemCount: number;
}

export const SalesSummary: React.FC<SalesSummaryProps> = ({ summary, onPaymentClick, itemCount }) => {

    return (
        <PageCard shadow="1" variant="white" padding="4" className="h-full flex flex-column justify-content-between">
            <div>
                <h2 className="text-xl font-bold m-0 mb-3 text-900">Resumen</h2>
                
                <div className="flex justify-content-between mb-2">
                    <span className="text-600">Items</span>
                    <span className="font-medium text-900">{itemCount}</span>
                </div>
                
                <div className="flex justify-content-between mb-2">
                    <span className="text-600">Subtotal</span>
                    <span className="font-medium text-900">{formatCurrency(summary.subtotal)}</span>
                </div>
                
                <div className="flex justify-content-between mb-2">
                    <span className="text-600">IVA ({(summary.taxRate * 100).toFixed(0)}%)</span>
                    <span className="font-medium text-900">{formatCurrency(summary.tax)}</span>
                </div>

                <Divider />

                <div className="flex justify-content-between align-items-center">
                    <span className="text-xl font-bold text-900">TOTAL</span>
                    <span className="text-3xl font-bold text-primary">{formatCurrency(summary.total)}</span>
                </div>
            </div>

            <Button 
                label="COBRAR (F9)" 
                icon="pi pi-wallet" 
                className="w-full mt-4 p-button-lg py-3 font-bold text-xl" 
                onClick={onPaymentClick}
                disabled={itemCount === 0}
            />
        </PageCard>
    );
};
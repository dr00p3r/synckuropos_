import React, { useEffect } from 'react';
import { useSalesLogic } from '../hooks/useSalesLogic';
import { ProductSearch } from './ProductSearch';
import { SaleItemsTable } from './SaleItemsTable';
import { SalesSummary } from './SaleSummary';
import { PaymentModal } from './PaymentModal';
import { useTelemetry } from '@/hooks/useTelemetry';
import { TelemetryEvents } from '@/types/telemetryEvents';
import { useRef } from 'react';


import { useCart } from '@/hooks';

export const SalesScreen: React.FC = () => {
    const { saleItems, clearCart, updateQuantity, removeFromCart } = useCart();
    const { logMetric } = useTelemetry();

    // Telemetry Counters
    const clickCount = useRef(0);
    const keyCount = useRef(0);

    useEffect(() => {
        const handleClick = () => { clickCount.current++; };
        const handleKey = () => { keyCount.current++; };

        window.addEventListener('click', handleClick);
        window.addEventListener('keydown', handleKey);

        return () => {
            window.removeEventListener('click', handleClick);
            window.removeEventListener('keydown', handleKey);
        };
    }, []);

    const onSaleEnd = () => {
        logMetric(TelemetryEvents.UX_INTERACTION_METRICS, {
            mouseClicks: clickCount.current,
            keyPresses: keyCount.current,
            saleId: 'transaction_completed'
        });
        clickCount.current = 0;
        keyCount.current = 0;
        handleSaleCompleted();
    };

    // Usamos el hook de lógica general
    const {
        showPaymentView,
        setShowPaymentView,
        addProductToSale,
        calculateSummary,
        handleSaleCompleted
    } = useSalesLogic();

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
                        onClearSale={clearCart}
                    />
                </div>

                {/* Tabla de Items */}
                <div className="flex-grow-1 overflow-hidden">
                    <SaleItemsTable
                        items={saleItems}
                        onUpdateQuantity={(id, qty) => updateQuantity(id, qty)}
                        onRemoveItem={(id) => removeFromCart(id)}
                    />
                </div>
            </div>

            <PaymentModal
                visible={showPaymentView}
                onHide={() => setShowPaymentView(false)}
                saleItems={saleItems}
                summary={summary}
                onSaleCompleted={onSaleEnd}
            />
        </div>
    );
};
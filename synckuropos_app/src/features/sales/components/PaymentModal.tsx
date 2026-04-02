import React from 'react';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { usePaymentLogic } from '../hooks/usePaymentLogic';
import type { SaleItem, SaleSummary } from '../../../types/types';

interface PaymentModalProps {
    visible: boolean;
    onHide: () => void;
    saleItems: SaleItem[];
    summary: SaleSummary;
    onSaleCompleted: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ 
    visible, onHide, saleItems, summary, onSaleCompleted 
}) => {
    const {
        customers,
        selectedCustomerId,
        setSelectedCustomerId,
        receivedAmount,
        setReceivedAmount,
        isCredit,
        setIsCredit,
        handleConfirmPurchase,
        changeAmount,
        processingPayment
    } = usePaymentLogic({ saleItems, summary, onSaleCompleted });

    const receivedValue = receivedAmount ? parseFloat(receivedAmount) : 0;

    // Footer del modal con botones de acción
    const footer = (
        <div>
            <Button label="Cancelar" icon="pi pi-times" onClick={onHide} className="p-button-text" />
            <Button 
                label="Confirmar Venta" 
                icon="pi pi-check" 
                onClick={handleConfirmPurchase} 
                loading={processingPayment}
                autoFocus 
            />
        </div>
    );

    return (
        <Dialog 
            header="Procesar Pago" 
            visible={visible} 
            style={{ width: '90vw', maxWidth: '500px' }} 
            onHide={onHide}
            footer={footer}
            dismissableMask={false}
        >
            <div className="flex flex-column gap-4 mt-2">
                {/* Total Grande */}
                <div className="text-center surface-100 p-3 border-round">
                    <span className="text-600 block mb-1">Total a Pagar</span>
                    <span className="text-4xl font-bold text-900">
                        ${(summary.total / 100).toFixed(2)}
                    </span>
                </div>

                {/* Selección de Cliente */}
                <div className="flex flex-column gap-2">
                    <label htmlFor="customer" className="font-bold">Cliente</label>
                    <Dropdown 
                        id="customer"
                        value={selectedCustomerId} 
                        options={customers} 
                        onChange={(e) => setSelectedCustomerId(e.value)} 
                        optionLabel="fullname" 
                        optionValue="customerId"
                        placeholder="Consumidor Final" 
                        filter 
                        showClear
                        className="w-full"
                    />
                </div>

                {/* Checkbox Crédito */}
                <div className="flex align-items-center gap-2">
                    <Checkbox inputId="credit" checked={isCredit} onChange={e => setIsCredit(e.checked || false)} />
                    <label htmlFor="credit" className="cursor-pointer select-none">Venta a Crédito (Fiado)</label>
                </div>

                {/* Input Dinero Recibido */}
                <div className="flex flex-column gap-2">
                    <label htmlFor="received" className="font-bold">Monto Recibido</label>
                    <div className="p-inputgroup">
                        <span className="p-inputgroup-addon">$</span>
                        <InputNumber 
                            id="received" 
                            value={receivedAmount ? parseFloat(receivedAmount) : null} 
                            onValueChange={(e) => setReceivedAmount(e.value?.toString() || '')}
                            min={0} 
                            maxFractionDigits={2} 
                            useGrouping={false}
                            placeholder="0.00"
                            className={receivedValue < (summary.total / 100) && !isCredit ? 'p-invalid' : ''}
                        />
                    </div>
                </div>

                {/* Cambio */}
                <div className="flex justify-content-between align-items-center p-3 border-1 border-gray-200 border-round">
                    <span className="text-lg font-medium">Cambio:</span>
                    <span className={`text-xl font-bold ${changeAmount < 0 ? 'text-red-500' : 'text-green-500'}`}>
                        ${(changeAmount / 100).toFixed(2)}
                    </span>
                </div>
            </div>
        </Dialog>
    );
};
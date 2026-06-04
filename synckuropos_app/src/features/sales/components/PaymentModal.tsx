import React, { useRef, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { usePaymentLogic, type PaymentMethod } from '../hooks/usePaymentLogic';
import type { SaleItem, SaleSummary } from '../../../types/types';
import { formatCurrency } from '../../../utils/formatters';

interface PaymentModalProps {
    visible: boolean;
    onHide: () => void;
    saleItems: SaleItem[];
    summary: SaleSummary;
    onSaleCompleted: () => void;
}

const BILLS = [1, 5, 10, 20];

const PAYMENT_INPUT_STYLE = `
.payment-input-group {
    display: flex;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    overflow: hidden;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.payment-input-group:focus-within {
    border-color: var(--primary-color, #06b6d4);
    box-shadow: 0 0 0 0.2rem var(--primary-color-alpha, rgba(6, 182, 212, 0.25));
}
.payment-input-group .p-inputgroup-addon {
    border: none;
    background: #f3f4f6;
    color: #6b7280;
    font-weight: 600;
    min-width: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
}
.payment-input-group:focus-within .p-inputgroup-addon {
    background: #e5e7eb;
    color: var(--primary-color, #06b6d4);
}
.payment-input-group input {
    border: none;
    outline: none;
    box-shadow: none;
    flex: 1;
    padding: 0.5rem 0.75rem;
    font-size: 1rem;
    font-family: inherit;
    background: transparent;
}
`;

export const PaymentModal: React.FC<PaymentModalProps> = ({
    visible, onHide, saleItems, summary, onSaleCompleted
}) => {
    const {
        customers,
        selectedCustomerId,
        setSelectedCustomerId,
        paymentMethod,
        setPaymentMethod,
        receivedAmount,
        setReceivedAmount,
        setQuickAmount,
        processingPayment,
        selectedCustomer,
        changeAmount,
        bankAccounts,
        customerDebt,
        availableCredit,
        creditExceeded,
        isConfirmDisabled,
        handleConfirmPurchase
    } = usePaymentLogic({ saleItems, summary, onSaleCompleted });

    const totalDollars = summary.total / 100;
    const creditLimit = selectedCustomer?.creditLimit ?? 0;
    const cashInputRef = useRef<HTMLInputElement>(null);

    // Auto-focus the cash input when switching to cash method
    useEffect(() => {
        if (paymentMethod === 'cash') {
            const timeoutId = setTimeout(() => cashInputRef.current?.focus(), 100);
            return () => clearTimeout(timeoutId);
        }
    }, [paymentMethod]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
            setReceivedAmount(value);
        }
    };

    const handleMethodChange = (method: PaymentMethod) => {
        setPaymentMethod(method);
        if (method === 'cash') {
            setReceivedAmount('');
        } else if (method === 'credit') {
            setReceivedAmount('0');
        } else {
            setReceivedAmount(totalDollars.toFixed(2));
        }
    };

    const showCreditOption = selectedCustomer?.allowCredit ?? false;

    const methodButtonClass = (method: PaymentMethod) => {
        const isActive = paymentMethod === method;
        if (isActive) {
            if (method === 'credit') {
                return 'bg-surface-100 border-primary text-primary';
            }
            return 'bg-surface-100 border-primary text-primary';
        }
        return 'bg-white border-200 text-600 hover:surface-100';
    };

    const confirmLabel = paymentMethod === 'credit' ? 'Registrar Fiado' : 'Confirmar Venta';

    const footer = (
        <div className="flex justify-content-between align-items-center w-full">
            <Button
                label="Cancelar"
                onClick={onHide}
                className="p-button-text text-600"
            />
            <Button
                label={confirmLabel}
                icon="pi pi-check"
                severity={isConfirmDisabled ? 'secondary' : undefined}
                onClick={handleConfirmPurchase}
                loading={processingPayment}
                disabled={isConfirmDisabled}
            />
        </div>
    );

    const hasEnteredAmount = receivedAmount && receivedAmount !== '' && receivedAmount !== '0' && receivedAmount !== '0.00';
    const isExact = hasEnteredAmount && changeAmount === 0;
    const isShortage = hasEnteredAmount && changeAmount < 0;
    const isChange = hasEnteredAmount && changeAmount > 0;

    return (
        <Dialog
            header="Procesar Pago"
            visible={visible}
            style={{ width: '90vw', maxWidth: '500px' }}
            onHide={onHide}
            footer={footer}
            dismissableMask={false}
        >
            <style>{PAYMENT_INPUT_STYLE}</style>
            <div className="flex flex-column gap-3 mt-2">
                {/* Total a Pagar */}
                <div className="flex justify-content-between align-items-center surface-100 p-3 border-round">
                    <span className="text-lg font-semibold text-900">Total a Pagar</span>
                    <span className="text-3xl font-bold text-primary">
                        {formatCurrency(summary.total)}
                    </span>
                </div>

                {/* Selección de Cliente */}
                <div className="flex flex-column gap-2">
                    <label htmlFor="customer" className="font-semibold">Cliente</label>
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

                {/* Métodos de Pago Toggle */}
                <div className="flex flex-column gap-3">
                    <label className="font-semibold">Método de Pago</label>
                    <div className="grid w-full">
                        <div className={showCreditOption ? 'col-4' : 'col-6'}>
                            <button
                                type="button"
                                onClick={() => handleMethodChange('cash')}
                                className={`w-full flex flex-column align-items-center justify-content-center gap-2 py-3 border-1 border-round-lg cursor-pointer transition-all transition-duration-200 ${methodButtonClass('cash')}`}
                            >
                                <i className="pi pi-money-bill text-lg" />
                                <span className="font-medium text-sm">Efectivo</span>
                            </button>
                        </div>
                        <div className={showCreditOption ? 'col-4' : 'col-6'}>
                            <button
                                type="button"
                                onClick={() => handleMethodChange('transfer')}
                                className={`w-full flex flex-column align-items-center justify-content-center gap-2 py-3 border-1 border-round-lg cursor-pointer transition-all transition-duration-200 ${methodButtonClass('transfer')}`}
                            >
                                <i className="pi pi-send text-lg" />
                                <span className="font-medium text-sm">Transferencia</span>
                            </button>
                        </div>
                        {showCreditOption && (
                            <div className="col-4">
                                <button
                                    type="button"
                                    onClick={() => handleMethodChange('credit')}
                                    className={`w-full flex flex-column align-items-center justify-content-center gap-2 py-3 border-1 border-round-lg cursor-pointer transition-all transition-duration-200 ${methodButtonClass('credit')}`}
                                >
                                    <i className="pi pi-wallet text-lg" />
                                    <span className="font-medium text-sm">Fiado</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sección Efectivo */}
                {paymentMethod === 'cash' && (
                    <div className="flex flex-column gap-3">
                        <div className="flex flex-column gap-2">
                            <label htmlFor="received" className="font-semibold">Monto Recibido</label>
                            <div className="payment-input-group">
                                <span className="p-inputgroup-addon">$</span>
                                <input
                                    ref={cashInputRef}
                                    id="received"
                                    type="text"
                                    inputMode="decimal"
                                    value={receivedAmount}
                                    onChange={handleInputChange}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        {/* Botones de billetes rápidos */}
                        <div className="flex flex-wrap gap-2">
                            {BILLS.map(bill => (
                                <Button
                                    key={bill}
                                    label={`$${bill}`}
                                    severity="secondary"
                                    size="small"
                                    onClick={() => setQuickAmount(bill)}
                                    className="flex-1 border-none"
                                />
                            ))}
                            <Button
                                label="Exacto"
                                severity="secondary"
                                size="small"
                                onClick={() => setQuickAmount(totalDollars)}
                                className="flex-1 border-none"
                            />
                        </div>

                        {/* Vuelto / Falta */}
                        {isExact && (
                            <div className="flex align-items-center gap-2 p-3 border-round bg-surface-100">
                                <span className="text-sm font-medium text-600">Monto exacto</span>
                            </div>
                        )}
                        {isShortage && (
                            <div className="flex align-items-center gap-2 p-3 border-round bg-[#FFEAEA]">
                                <span className="text-sm font-medium text-[#C0392B]">Falta:</span>
                                <span className="text-lg font-bold text-[#C0392B]">
                                    {formatCurrency(Math.abs(changeAmount))}
                                </span>
                            </div>
                        )}
                        {isChange && (
                            <div className="flex align-items-center gap-2 p-3 border-round bg-[#E1F5EE]">
                                <span className="text-sm font-medium text-[#0F6E56]">Vuelto:</span>
                                <span className="text-lg font-bold text-[#0F6E56]">
                                    {formatCurrency(Math.abs(changeAmount))}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Sección Transferencia */}
                {paymentMethod === 'transfer' && (
                    <div className="flex flex-column gap-3">
                        {bankAccounts.length > 0 ? (
                            <div className="flex flex-column gap-2">
                                {bankAccounts.map(account => (
                                    <div key={account.id} className="p-3 surface-100 border-round">
                                        <div className="flex flex-column gap-1">
                                            <span className="font-semibold text-900">{account.bankName}</span>
                                            <span className="text-sm text-600">Titular: {account.accountHolder}</span>
                                            <span className="text-sm font-medium text-primary">Cuenta: {account.accountNumber}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-3 surface-100 border-round text-center">
                                <i className="pi pi-info-circle text-500 text-2xl mb-2 block" />
                                <span className="text-600">No hay datos bancarios configurados.</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Sección Fiado */}
                {paymentMethod === 'credit' && selectedCustomer && (
                    <div className="flex flex-column gap-3">
                        <div className="p-3 surface-100 border-round">
                            <div className="flex flex-column gap-2">
                                <div className="flex justify-content-between">
                                    <span className="text-sm text-600">Límite de crédito:</span>
                                    <span className="font-medium">{formatCurrency(creditLimit)}</span>
                                </div>
                                <div className="flex justify-content-between">
                                    <span className="text-sm text-600">Monto usado:</span>
                                    <span className="font-medium">{formatCurrency(customerDebt)}</span>
                                </div>
                                <div className="flex justify-content-between">
                                    <span className="text-sm text-600">Disponible:</span>
                                    <span className={`font-bold ${creditExceeded ? 'text-red-500' : 'text-green-500'}`}>
                                        {formatCurrency(availableCredit)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {creditExceeded && (
                            <div className="p-3 bg-red-50 border-1 border-red-200 border-round">
                                <div className="flex align-items-center gap-2 text-red-600">
                                    <i className="pi pi-exclamation-triangle" />
                                    <span className="font-medium text-sm">
                                        Esta venta supera el crédito disponible del cliente.
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Dialog>
    );
};

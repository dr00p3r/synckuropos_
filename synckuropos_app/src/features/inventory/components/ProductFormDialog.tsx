import React, { useState, useRef, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { TabView, TabPanel } from 'primereact/tabview';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Checkbox } from 'primereact/checkbox';
import { InputTextarea } from 'primereact/inputtextarea';
import { useProductForm } from '../hooks/useProductForm';
import { tabHeaderTemplate } from '@/utils/tabUtils';
import { ComboManager } from './ComboManager';
import type { Product } from '@/types/types';
import { getStockByProduct } from '../../../db/stockHelpers';
import { useDatabase } from '@/hooks/useDatabase';

const evaluateExpression = (expr: string): number | null => {
    try {
        const cleaned = expr.replace(/\s/g, '');
        if (!/^[0-9+\-*/.()]+$/.test(cleaned)) return null;
        const result = Function(`'use strict'; return (${cleaned})`)();
        if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
            return result;
        }
        return null;
    } catch (error) {
        return null;
    }
};

interface ProductFormDialogProps {
    visible: boolean;
    onHide: () => void;
    onSave: () => void;
    productToEdit?: Product;
    onDuplicateCode?: (product: Product) => void;
}

export const ProductFormDialog: React.FC<ProductFormDialogProps> = ({
    visible,
    onHide,
    onSave,
    productToEdit,
    onDuplicateCode
}) => {
    const {
        activeProduct,
        isEditMode,
        activeIndex,
        loading,
        name,
        setName,
        code,
        setCode,
        price,
        setPrice,
        isTaxable,
        setIsTaxable,
        allowDecimal,
        setAllowDecimal,
        stockForm,
        updateStockField,
        setActiveIndex,
        handleSaveGeneral,
        handleSaveStock
    } = useProductForm({ visible, productToEdit, onSave, onHide, onDuplicateCode });

    const db = useDatabase();
    const [currentStock, setCurrentStock] = useState<number | null>(null);
    const [quantityInput, setQuantityInput] = useState<string>('');
    const quantityInputRef = useRef<HTMLInputElement>(null);
    const [costInput, setCostInput] = useState<string>('');
    const costInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (stockForm.qtyMove !== null) {
            setQuantityInput(stockForm.qtyMove.toString());
        } else {
            setQuantityInput('');
        }
    }, [stockForm.qtyMove]);

    useEffect(() => {
        if (stockForm.cost !== null) {
            setCostInput(stockForm.cost.toString());
        } else {
            setCostInput('');
        }
    }, [stockForm.cost]);

    useEffect(() => {
        const loadStock = async () => {
            if (activeProduct?.productId && db && visible && activeIndex === 1) {
                const stock = await getStockByProduct(db, activeProduct.productId);
                setCurrentStock(stock);
            }
        };
        loadStock();
    }, [activeProduct?.productId, db, visible, activeIndex]);

    const handleQuantityBlur = () => {
        if (!quantityInput.trim()) {
            updateStockField('qtyMove', null);
            return;
        }
        const result = evaluateExpression(quantityInput);
        if (result !== null) {
            const finalValue = allowDecimal ? Math.round(result * 100) / 100 : Math.round(result);
            updateStockField('qtyMove', finalValue);
            setQuantityInput(finalValue.toString());
        } else {
            if (stockForm.qtyMove !== null) {
                setQuantityInput(stockForm.qtyMove.toString());
            } else {
                setQuantityInput('');
            }
        }
    };

    const handleCostBlur = () => {
        if (!costInput.trim()) {
            updateStockField('cost', null);
            return;
        }
        const result = evaluateExpression(costInput);
        if (result !== null) {
            const finalValue = Math.round(result * 100) / 100;
            updateStockField('cost', finalValue);
            setCostInput(finalValue.toString());
        } else {
            if (stockForm.cost !== null) {
                setCostInput(stockForm.cost.toString());
            } else {
                setCostInput('');
            }
        }
    };

    const handleQuantityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleQuantityBlur();
            e.currentTarget.blur();
        }
    };

    const handleCostKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleCostBlur();
            e.currentTarget.blur();
        }
    };

    return (
        <Dialog
            header={activeProduct ? `Editando: ${name}` : "Nuevo Producto"}
            visible={visible}
            className="w-full md:w-8 lg:w-5"
            onHide={onHide}
            maximizable
        >
            <ConfirmDialog />
            <div className="pt-2">
                <TabView
                    activeIndex={activeIndex}
                    onTabChange={(e) => setActiveIndex(e.index)}
                    className="p-0"
                >
                    <TabPanel
                        header="General"
                        leftIcon="pi pi-id-card"
                        headerTemplate={(opts) => tabHeaderTemplate({ ...opts, title: 'General' })}
                    >
                        <div className="flex flex-column gap-4 pt-3">
                            <div className="flex flex-column gap-2">
                                <label htmlFor="name" className="font-semibold">Nombre del Producto</label>
                                <InputText
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full"
                                />
                            </div>

                            <div className="formgrid grid">
                                <div className="field col-6 flex flex-column gap-2">
                                    <label htmlFor="code" className="font-semibold">Código (Opcional)</label>
                                    <InputText
                                        id="code"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        className="w-full"
                                    />
                                </div>
                                <div className="field col-6 flex flex-column gap-2">
                                    <label htmlFor="price" className="font-semibold">Precio Venta ($)</label>
                                    <InputNumber
                                        id="price"
                                        value={price}
                                        onValueChange={(e) => setPrice(e.value ?? null)}
                                        mode="currency"
                                            currency="USD"
                                            locale="es-EC"
                                        className="w-full"
                                        inputClassName="w-full"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-5 surface-ground p-3 border-round">
                                <div className="flex align-items-center">
                                    <Checkbox
                                        inputId="tax"
                                        checked={isTaxable}
                                        onChange={(e) => setIsTaxable(e.checked || false)}
                                    />
                                    <label htmlFor="tax" className="ml-2 cursor-pointer">Grava IVA</label>
                                </div>
                                <div className="flex align-items-center">
                                    <Checkbox
                                        inputId="decimal"
                                        checked={allowDecimal}
                                        onChange={(e) => setAllowDecimal(e.checked || false)}
                                    />
                                    <label htmlFor="decimal" className="ml-2 cursor-pointer">Permite Decimales</label>
                                </div>
                            </div>

                            <div className="flex justify-content-end pt-2">
                                <Button
                                    label={activeProduct ? "Actualizar Datos" : "Guardar y Continuar"}
                                    icon="pi pi-check"
                                    onClick={handleSaveGeneral}
                                    loading={loading}
                                />
                            </div>
                        </div>
                    </TabPanel>

                    <TabPanel
                        header="Inventario"
                        leftIcon="pi pi-box"
                        disabled={!isEditMode}
                        headerTemplate={(opts) => tabHeaderTemplate({ ...opts, title: 'Inventario' })}
                    >
                        <div className="flex flex-column gap-4 pt-3">
                            {activeProduct && currentStock !== null && (
                                <div className="flex justify-content-between align-items-center surface-card p-3 border-round shadow-1">
                                    <span className="text-xl font-medium">Stock Actual:</span>
                                    <span className={`text-2xl font-bold ${currentStock <= 5 ? 'text-red-500' : 'text-green-500'}`}>
                                        {currentStock}
                                    </span>
                                </div>
                            )}

                            <div className="formgrid grid">
                                <div className="field col-6 flex flex-column gap-2">
                                    <label htmlFor="stockQty" className="font-semibold">
                                        Cantidad a {activeProduct ? 'Mover' : 'Agregar'}
                                    </label>
                                    <InputText
                                        id="stockQty"
                                        ref={quantityInputRef}
                                        value={quantityInput}
                                        onChange={(e) => setQuantityInput(e.target.value)}
                                        onBlur={handleQuantityBlur}
                                        onKeyDown={handleQuantityKeyDown}
                                        placeholder="0"
                                        className="w-full"
                                    />
                                </div>

                                <div className="field col-6 flex flex-column gap-2">
                                    <label htmlFor="stockCost" className="font-semibold">Costo Unitario ($)</label>
                                    <InputText
                                        id="stockCost"
                                        ref={costInputRef}
                                        value={costInput}
                                        onChange={(e) => setCostInput(e.target.value)}
                                        onBlur={handleCostBlur}
                                        onKeyDown={handleCostKeyDown}
                                        placeholder="0.00"
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-column gap-2">
                                <label htmlFor="stockReason" className="font-semibold">Motivo</label>
                                <InputTextarea
                                    id="stockReason"
                                    rows={2}
                                    value={stockForm.reason}
                                    onChange={(e) => updateStockField('reason', e.target.value)}
                                    className="w-full"
                                />
                            </div>

                            <div className="flex justify-content-end pt-2">
                                <Button
                                    label="Aplicar Movimiento"
                                    icon="pi pi-refresh"
                                    severity="warning"
                                    onClick={handleSaveStock}
                                    loading={loading}
                                />
                            </div>
                        </div>
                    </TabPanel>

                    <TabPanel
                        header="Combos"
                        leftIcon="pi pi-tags"
                        disabled={!isEditMode}
                        headerTemplate={(opts) => tabHeaderTemplate({ ...opts, title: 'Combos' })}
                    >
                        <div className="pt-3">
                            {activeProduct && (
                                <ComboManager
                                    productId={activeProduct.productId}
                                    allowDecimals={allowDecimal}
                                />
                            )}
                        </div>
                    </TabPanel>
                </TabView>
            </div>
        </Dialog>
    );
};

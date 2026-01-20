import React, { useState, useRef, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { TabView, TabPanel } from 'primereact/tabview';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Checkbox } from 'primereact/checkbox';
import { InputTextarea } from 'primereact/inputtextarea';
import { useProductForm } from '../hooks/useProductForm';
import { ComboManager } from './ComboManager';
import type { Product } from '@/types/types';

/**
 * Evalúa expresiones matemáticas simples de forma segura
 * Soporta: +, -, *, /, paréntesis
 */
const evaluateExpression = (expr: string): number | null => {
    try {
        // Limpiar espacios
        const cleaned = expr.replace(/\s/g, '');
        
        // Validar que solo contenga números, operadores y paréntesis permitidos
        if (!/^[0-9+\-*/.()]+$/.test(cleaned)) {
            return null;
        }
        
        // Evaluar usando Function (más seguro que eval)
        const result = Function(`'use strict'; return (${cleaned})`)();
        
        // Validar que el resultado sea un número válido
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
}

export const ProductFormDialog: React.FC<ProductFormDialogProps> = ({
    visible,
    onHide,
    onSave,
    productToEdit
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
    } = useProductForm({ visible, productToEdit, onSave, onHide });

    // Estado local para el input de cantidad (permite expresiones)
    const [quantityInput, setQuantityInput] = useState<string>('');
    const quantityInputRef = useRef<HTMLInputElement>(null);

    // Sincronizar el input con el valor del formulario
    useEffect(() => {
        if (stockForm.qtyMove !== null) {
            setQuantityInput(stockForm.qtyMove.toString());
        } else {
            setQuantityInput('');
        }
    }, [stockForm.qtyMove]);

    // Procesar expresión matemática
    const handleQuantityBlur = () => {
        if (!quantityInput.trim()) {
            updateStockField('qtyMove', null);
            return;
        }

        const result = evaluateExpression(quantityInput);
        
        if (result !== null) {
            // Redondear según si permite decimales
            const finalValue = allowDecimal ? Math.round(result * 100) / 100 : Math.round(result);
            updateStockField('qtyMove', finalValue);
            setQuantityInput(finalValue.toString());
        } else {
            // Si no es válido, mantener el valor anterior
            if (stockForm.qtyMove !== null) {
                setQuantityInput(stockForm.qtyMove.toString());
            } else {
                setQuantityInput('');
            }
        }
    };

    // Procesar al presionar Enter
    const handleQuantityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleQuantityBlur();
            e.currentTarget.blur(); // Quitar foco después de calcular
        }
    };

    // Template para headers de tabs
    const tabHeaderTemplate = (options: any) => (
        <div className="flex align-items-center gap-2 p-3 cursor-pointer" onClick={options.onClick}>
            <i className={options.leftIcon} />
            <span className="font-bold">{options.title}</span>
        </div>
    );

    return (
        <Dialog
            header={activeProduct ? `Editando: ${name}` : "Nuevo Producto"}
            visible={visible}
            className="w-full md:w-8 lg:w-5"
            onHide={onHide}
            maximizable
        >
            <div className="pt-2">
                <TabView 
                    activeIndex={activeIndex} 
                    onTabChange={(e) => setActiveIndex(e.index)} 
                    className="p-0"
                >
                    {/* TAB 1: GENERAL */}
                    <TabPanel
                        header="General"
                        leftIcon="pi pi-id-card"
                        headerTemplate={(opts) => tabHeaderTemplate({ ...opts, title: 'General' })}
                    >
                        <div className="flex flex-column gap-4 pt-3">
                            <div className="flex flex-column gap-2">
                                <label htmlFor="name" className="font-bold">Nombre del Producto</label>
                                <InputText
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    autoFocus
                                    className="w-full"
                                />
                            </div>
                            
                            <div className="formgrid grid">
                                <div className="field col-6 flex flex-column gap-2">
                                    <label htmlFor="code" className="font-bold">Código (Opcional)</label>
                                    <InputText
                                        id="code"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        className="w-full"
                                    />
                                </div>
                                <div className="field col-6 flex flex-column gap-2">
                                    <label htmlFor="price" className="font-bold">Precio Venta ($)</label>
                                    <InputNumber
                                        id="price"
                                        value={price}
                                        onValueChange={(e) => setPrice(e.value ?? null)}
                                        mode="currency"
                                        currency="USD"
                                        locale="en-US"
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

                    {/* TAB 2: STOCK */}
                    <TabPanel
                        header="Inventario"
                        leftIcon="pi pi-box"
                        disabled={!isEditMode}
                        headerTemplate={(opts) => tabHeaderTemplate({ ...opts, title: 'Inventario' })}
                    >
                        <div className="flex flex-column gap-4 pt-3">
                            {activeProduct && (
                                <div className="flex justify-content-between align-items-center surface-card p-3 border-round shadow-1">
                                    <span className="text-xl font-medium">Stock Actual:</span>
                                    <span className={`text-2xl font-bold ${activeProduct.stock <= 5 ? 'text-red-500' : 'text-green-500'}`}>
                                        {activeProduct.stock}
                                    </span>
                                </div>
                            )}

                            <div className="formgrid grid">
                                <div className="field col-6 flex flex-column gap-2">
                                    <label className="font-bold">
                                        Cantidad a {activeProduct ? 'Mover' : 'Agregar'}
                                    </label>
                                    <InputText
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
                                    <label className="font-bold">Costo Unitario ($)</label>
                                    <InputNumber
                                        value={stockForm.cost}
                                        onValueChange={(e) => updateStockField('cost', e.value ?? null)}
                                        mode="currency"
                                        currency="USD"
                                        locale="en-US"
                                        className="w-full"
                                        inputClassName="w-full"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-column gap-2">
                                <label className="font-bold">Motivo</label>
                                <InputTextarea
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

                    {/* TAB 3: COMBOS */}
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
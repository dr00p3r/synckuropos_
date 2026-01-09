import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { useComboManager } from '../hooks/useComboManager';
import { formatCurrency } from '@/utils/formatters';

interface ComboManagerProps {
    productId: string;
    allowDecimals: boolean;
}

export const ComboManager: React.FC<ComboManagerProps> = ({ productId, allowDecimals }) => {
    const {
        combos,
        qty,
        setQty,
        price,
        setPrice,
        loading,
        handleAdd,
        handleDelete,
        canAdd
    } = useComboManager({ productId });

    return (
        <div className="flex flex-column gap-4">
            {/* TABLA */}
            <div className="surface-card p-3 shadow-1 border-round">
                <div className="text-900 font-medium mb-3">Combos Actuales</div>
                <DataTable value={combos} size="small" emptyMessage="No hay combos definidos.">
                    <Column field="comboQuantity" header="Cantidad" style={{ width: '30%' }} />
                    <Column 
                        field="comboPrice" 
                        header="Precio Total" 
                        body={(d) => formatCurrency(d.comboPrice)} 
                        style={{ width: '50%' }} 
                    />
                    <Column 
                        body={(rowData) => (
                            <Button
                                icon="pi pi-trash"
                                severity="danger"
                                text
                                rounded
                                size="small"
                                onClick={() => handleDelete(rowData.comboProductId)}
                            />
                        )} 
                        style={{ width: '20%', textAlign: 'center' }} 
                    />
                </DataTable>
            </div>

            {/* FORMULARIO LIMPIO */}
            <div className="surface-card p-3 shadow-1 border-round">
                <div className="text-900 font-medium mb-3 flex align-items-center gap-2">
                    <i className="pi pi-plus-circle text-primary"></i>
                    Nuevo Combo
                </div>
                <div className="formgrid grid">
                    <div className="field col-5">
                        <label className="text-sm font-bold ml-1">Cantidad</label>
                        <InputNumber
                            value={qty}
                            onValueChange={(e) => setQty(e.value ?? null)}
                            minFractionDigits={allowDecimals ? 2 : 0}
                            maxFractionDigits={allowDecimals ? 2 : 0}
                            min={0}
                            showButtons
                            buttonLayout="horizontal"
                            step={1}
                            decrementButtonClassName="p-button-secondary p-button-text text-gray-500"
                            incrementButtonClassName="p-button-secondary p-button-text text-gray-500"
                            inputClassName="text-center w-full border-1 border-noround-x"
                            className="w-full"
                            placeholder="0"
                        />
                    </div>
                    <div className="field col-5">
                        <label className="text-sm font-bold ml-1">Precio ($)</label>
                        <InputNumber
                            value={price}
                            onValueChange={(e) => setPrice(e.value ?? null)}
                            mode="currency"
                            currency="USD"
                            locale="en-US"
                            placeholder="$0.00"
                            className="w-full"
                            inputClassName="w-full"
                        />
                    </div>
                    <div className="field col-2 flex align-items-end">
                        <Button
                            icon="pi pi-check"
                            onClick={handleAdd}
                            disabled={!canAdd}
                            loading={loading}
                            className="w-full"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { TabView, TabPanel } from 'primereact/tabview';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Checkbox } from 'primereact/checkbox';
import { InputTextarea } from 'primereact/inputtextarea';
import { useDatabase, useToast, useAuth } from '@/hooks';
import { productRepository } from '../services/productRepository';
import type { Product } from '@/types/types';

// Opcional: Extraer la pestaña de combos a otro componente si es muy grande
// import { ComboManager } from './ComboManager'; 

interface ProductFormDialogProps {
    visible: boolean;
    onHide: () => void;
    onSave: () => void;
    productToEdit?: Product;
}

export const ProductFormDialog: React.FC<ProductFormDialogProps> = ({ 
    visible, onHide, onSave, productToEdit 
}) => {
    // --- ESTADOS ---
    const isEdit = !!productToEdit;
    const [activeIndex, setActiveIndex] = useState(0); // 0: General, 1: Stock, 2: Combos
    const [loading, setLoading] = useState(false);
    
    // Formulario General
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [price, setPrice] = useState<number | null>(null);
    const [isTaxable, setIsTaxable] = useState(true);
    const [allowDecimal, setAllowDecimal] = useState(false);

    // Formulario Stock (Solo para movimientos o inicial)
    const [qtyMove, setQtyMove] = useState<number | null>(null);
    const [cost, setCost] = useState<number | null>(null);
    const [reason, setReason] = useState('Reabastecimiento');

    const db = useDatabase();
    const toast = useToast();
    const { currentUser } = useAuth();

    // --- EFECTOS ---
    useEffect(() => {
        if (visible) {
            // Resetear o Cargar datos
            if (productToEdit) {
                setName(productToEdit.name);
                setCode(productToEdit.code || '');
                setPrice(productToEdit.basePrice / 100);
                setIsTaxable(productToEdit.isTaxable);
                setAllowDecimal(productToEdit.allowDecimalQuantity);
                setActiveIndex(0); 
            } else {
                // Reset form
                setName(''); setCode(''); setPrice(null); 
                setIsTaxable(true); setAllowDecimal(false);
                setQtyMove(null); setCost(null); setReason('Reabastecimiento');
                setActiveIndex(0);
            }
        }
    }, [visible, productToEdit]);

    // --- HANDLERS ---
    const handleSave = async () => {
        if (!name.trim()) return toast.showError('El nombre es obligatorio');
        if (!db) return;

        setLoading(true);
        try {
            if (isEdit && productToEdit) {
                await productRepository.updateProduct(db, productToEdit, {
                    name,
                    code,
                    basePrice: Math.round((price || 0) * 100),
                    isTaxable,
                    allowDecimalQuantity: allowDecimal
                });

                if (qtyMove && qtyMove !== 0) {
                     await productRepository.registerStockMovement(db, productToEdit, {
                        quantityToMove: qtyMove.toString(),
                        costPerUnit: cost?.toString() || '0',
                        reason,
                        newSalePrice: '' // Ya se actualizó arriba
                     }, currentUser?.userId || 'unknown');
                }

                toast.showSuccess('Producto actualizado');

            } else {
                // CREAR
                await productRepository.createProduct(db, {
                    name,
                    code,
                    basePrice: Math.round((price || 0) * 100),
                    isTaxable,
                    allowDecimalQuantity: allowDecimal
                }, {
                    // Datos de stock inicial
                    quantityToMove: qtyMove?.toString() || '0',
                    costPerUnit: cost?.toString() || '0',
                    reason: 'Inventario Inicial',
                    newSalePrice: ''
                });
                toast.showSuccess('Producto creado');
            }
            onSave(); // Recargar tabla
            onHide(); // Cerrar modal
        } catch (error) {
            console.error(error);
            toast.showError('Error al guardar');
        } finally {
            setLoading(false);
        }
    };

    // --- RENDER ---
    const footer = (
        <div>
            <Button label="Cancelar" icon="pi pi-times" onClick={onHide} className="p-button-text" />
            <Button label="Guardar" icon="pi pi-check" onClick={handleSave} loading={loading} autoFocus />
        </div>
    );

    return (
        <Dialog 
            header={isEdit ? "Editar Producto" : "Nuevo Producto"} 
            visible={visible} 
            style={{ width: '50vw', minWidth: '350px' }} 
            footer={footer} 
            onHide={onHide}
            maximizable
        >
            <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
                
                {/* TAB 1: GENERAL */}
                <TabPanel header="General" leftIcon="pi pi-id-card">
                    <div className="flex flex-column gap-3 pt-2">
                        <div className="flex flex-column gap-2">
                            <label htmlFor="name" className="font-bold">Nombre</label>
                            <InputText id="name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
                        </div>
                        
                        <div className="formgrid grid">
                            <div className="field col-6">
                                <label htmlFor="code" className="font-bold">Código</label>
                                <InputText id="code" value={code} onChange={(e) => setCode(e.target.value)} />
                            </div>
                            <div className="field col-6">
                                <label htmlFor="price" className="font-bold">Precio Venta ($)</label>
                                <InputNumber id="price" value={price} onValueChange={(e) => setPrice(e.value ?? null)} mode="currency" currency="USD" locale="en-US" />
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex align-items-center">
                                <Checkbox inputId="tax" checked={isTaxable} onChange={e => setIsTaxable(e.checked || false)} />
                                <label htmlFor="tax" className="ml-2">Grava IVA</label>
                            </div>
                            <div className="flex align-items-center">
                                <Checkbox inputId="decimal" checked={allowDecimal} onChange={e => setAllowDecimal(e.checked || false)} />
                                <label htmlFor="decimal" className="ml-2">Permite Decimales</label>
                            </div>
                        </div>
                    </div>
                </TabPanel>

                {/* TAB 2: STOCK */}
                <TabPanel header={isEdit ? "Ajuste Stock" : "Stock Inicial"} leftIcon="pi pi-box">
                    <div className="flex flex-column gap-3 pt-2">
                        <div className="p-message p-message-info mb-2" style={{borderRadius: '6px'}}>
                             <div className="p-message-text">
                                {isEdit 
                                    ? "Ingrese un valor positivo para agregar o negativo para quitar stock."
                                    : "Configure el inventario inicial de este producto."
                                }
                             </div>
                        </div>

                        <div className="formgrid grid">
                            <div className="field col-6">
                                <label className="font-bold">Cantidad a {isEdit ? 'Mover' : 'Agregar'}</label>
                                <InputNumber value={qtyMove} onValueChange={(e) => setQtyMove(e.value ?? null)} showButtons />
                            </div>
                            <div className="field col-6">
                                <label className="font-bold">Costo Unitario ($)</label>
                                <InputNumber value={cost} onValueChange={(e) => setCost(e.value ?? null)} mode="currency" currency="USD" locale="en-US" />
                            </div>
                        </div>

                        <div className="flex flex-column gap-2">
                            <label className="font-bold">Motivo</label>
                            <InputTextarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
                        </div>
                    </div>
                </TabPanel>

                {/* TAB 3: COMBOS (Solo visible si estás editando, o lo habilitas siempre) */}
                {isEdit && (
                    <TabPanel header="Combos" leftIcon="pi pi-sitemap">
                        <div className="text-center py-4">
                            <i className="pi pi-info-circle mr-2"></i>
                            Funcionalidad de combos (Aquí iría tu sub-componente ComboManager)
                        </div>
                    </TabPanel>
                )}
            </TabView>
        </Dialog>
    );
};
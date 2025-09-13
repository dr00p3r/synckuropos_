import React, { useState, useEffect } from 'react';
import type { Customer, Debt, DebtPayment } from '../../../types/types.ts';
import { useDatabase } from '../../../hooks/useDatabase.tsx';
import { useToast } from '../../../hooks/useToast.tsx';
import { v4 as uuidv4 } from 'uuid';
import CustomerInfoTab from './CustomerInfoTab';
import DebtTab from './DebtTab';
import './CustomerModal.css';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  customer?: Customer;
  mode: 'create' | 'edit';
  openDebtTab?: boolean; // Nueva prop para controlar qué pestaña abrir
}

type TabType = 'info' | 'debt';

// Interfaz para el formulario de datos del cliente
interface CustomerFormData {
  fullname: string;
  phone: string;
  email: string;
  address: string;
  allowCredit: boolean;
  creditLimit: string;
  isActive: boolean;
}

// Interfaz para el resumen de deuda
interface DebtSummary {
  totalDebt: number;
  creditLimit: number;
  availableCredit: number;
}

// Interfaz para detalles de deuda
interface DebtDetail extends Debt {
  totalPaid: number;
  pendingAmount: number;
  payments: DebtPayment[];
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  customer,
  mode,
  openDebtTab = false
}) => {
  const db = useDatabase();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('info');
  
  // Estados del formulario - Información del Cliente
  const [formData, setFormData] = useState<CustomerFormData>({
    fullname: '',
    phone: '',
    email: '',
    address: '',
    allowCredit: false,
    creditLimit: '',
    isActive: true
  });

  // Estados para gestión de deuda
  const [debtSummary, setDebtSummary] = useState<DebtSummary>({
    totalDebt: 0,
    creditLimit: 0,
    availableCredit: 0
  });
  
  const [debtDetails, setDebtDetails] = useState<DebtDetail[]>([]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  // Efecto para inicializar el modal
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && customer) {
        setFormData({
          fullname: customer.fullname,
          phone: customer.phone || '',
          email: customer.email || '',
          address: customer.address || '',
          allowCredit: customer.allowCredit,
          creditLimit: (customer.creditLimit / 100).toString(), // Convertir centavos a dólares
          isActive: customer.isActive
        });
        
        // Decidir qué pestaña abrir
        setActiveTab(openDebtTab ? 'debt' : 'info');
        
        // Cargar información de deuda si estamos editando
        loadDebtInformation(customer.customerId!);
      } else {
        resetForm();
        setActiveTab('info'); // En creación siempre abrir en info
      }
    }
  }, [isOpen, customer, mode, openDebtTab]);

  const resetForm = () => {
    setFormData({
      fullname: '',
      phone: '',
      email: '',
      address: '',
      allowCredit: false,
      creditLimit: '',
      isActive: true
    });
    setDebtSummary({
      totalDebt: 0,
      creditLimit: 0,
      availableCredit: 0
    });
    setDebtDetails([]);
    setPaymentAmount('');
  };

  // Cargar información de deuda del cliente
  const loadDebtInformation = async (customerId: string) => {
    try {
      // Obtener todas las deudas del cliente
      const debts = await db.debts.find({
        selector: { customerId }
      }).exec();

      const debtDetailsArray: DebtDetail[] = [];
      let totalDebt = 0;

      // Para cada deuda, calcular el saldo pendiente
      for (const debt of debts) {
        const debtData = debt.toJSON();
        
        // Obtener todos los pagos de esta deuda
        const payments = await db.debtPayments.find({
          selector: { debtId: debtData.debtId }
        }).exec();

        const paymentsData = payments.map(payment => payment.toJSON());
        const totalPaid = paymentsData.reduce((sum, payment) => sum + payment.amountPaid, 0);
        const pendingAmount = debtData.amount - totalPaid;

        if (pendingAmount > 0) {
          debtDetailsArray.push({
            ...debtData,
            totalPaid,
            pendingAmount,
            payments: paymentsData
          });
          totalDebt += pendingAmount;
        }
      }

      setDebtDetails(debtDetailsArray);
      
      // Actualizar resumen
      const creditLimit = customer ? customer.creditLimit : 0;
      setDebtSummary({
        totalDebt,
        creditLimit,
        availableCredit: Math.max(0, creditLimit - totalDebt)
      });
    } catch (error) {
      console.error('Error cargando información de deuda:', error);
      toast.showError('Error al cargar la información de deuda');
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Función para validar el formulario
  const validateForm = () => {
    if (!formData.fullname.trim()) {
      toast.showError('El nombre completo es requerido');
      return false;
    }

    if (formData.allowCredit) {
      const creditLimit = parseFloat(formData.creditLimit);
      if (isNaN(creditLimit) || creditLimit < 0) {
        toast.showError('El límite de crédito debe ser un número válido mayor o igual a 0');
        return false;
      }
    }

    return true;
  };

  // Guardar información del cliente
  const handleSaveCustomer = async () => {
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      const customerData: Customer = {
        customerId: customer?.customerId || uuidv4(),
        fullname: formData.fullname.trim(),
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
        allowCredit: formData.allowCredit,
        creditLimit: formData.allowCredit ? Math.round(parseFloat(formData.creditLimit) * 100) : 0, // Convertir a centavos
        isActive: formData.isActive,
        createdAt: customer?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (mode === 'create') {
        await db.customers.insert(customerData);
        toast.showSuccess('Cliente creado exitosamente');
      } else {
        const customerDoc = await db.customers.findOne({
          selector: { customerId: customerData.customerId }
        }).exec();
        
        if (customerDoc) {
          await customerDoc.update({
            $set: {
              fullname: customerData.fullname,
              phone: customerData.phone,
              email: customerData.email,
              address: customerData.address,
              allowCredit: customerData.allowCredit,
              creditLimit: customerData.creditLimit,
              isActive: customerData.isActive,
              updatedAt: customerData.updatedAt
            }
          });
          toast.showSuccess('Cliente actualizado exitosamente');
        }
      }

      if (onSave) onSave();
      onClose();
    } catch (error) {
      console.error('Error guardando cliente:', error);
      toast.showError('Error al guardar el cliente');
    } finally {
      setLoading(false);
    }
  };

  // Registrar abono
  const handleRegisterPayment = async () => {
    if (!customer) {
      toast.showError('No se puede registrar un pago sin un cliente seleccionado');
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.showError('El monto debe ser un número válido mayor a 0');
      return;
    }

    const amountInCents = Math.round(amount * 100); // Convertir a centavos

    if (amountInCents > debtSummary.totalDebt) {
      toast.showError('El monto no puede ser mayor a la deuda total');
      return;
    }

    setProcessingPayment(true);

    try {
      // Aplicar el pago a las deudas más antiguas primero
      let remainingAmount = amountInCents;
      const sortedDebts = debtDetails.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      for (const debt of sortedDebts) {
        if (remainingAmount <= 0) break;

        const amountToApply = Math.min(remainingAmount, debt.pendingAmount);
        
        // Crear el registro de pago
        const payment: DebtPayment = {
          debtPaymentId: uuidv4(),
          debtId: debt.debtId!,
          userId: 'system', // TODO Por ahora usamos 'system', en una implementación real sería el usuario actual
          amountPaid: amountToApply,
          paymentDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await db.debtPayments.insert(payment);
        remainingAmount -= amountToApply;
      }

      toast.showSuccess(`Abono de $${amount.toFixed(2)} registrado exitosamente`);
      setPaymentAmount('');
      
      // Recargar información de deuda
      await loadDebtInformation(customer.customerId!);
      
      if (onSave) onSave();
    } catch (error) {
      console.error('Error registrando abono:', error);
      toast.showError('Error al registrar el abono');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  if (!isOpen) return null;

  return (
    <div className="customer-modal-overlay" onClick={onClose}>
      <div className="customer-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header del modal */}
        <div className="customer-modal-header">
          <h2>
            {mode === 'create' ? 'Nuevo Cliente' : `Gestionar Cliente: ${customer?.fullname}`}
          </h2>
          <button className="customer-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Navegación de pestañas */}
        <div className="customer-modal-tabs">
          <button
            className={`customer-tab ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            📝 Información del Cliente
          </button>
          {mode === 'edit' && customer && (
            <button
              className={`customer-tab ${activeTab === 'debt' ? 'active' : ''}`}
              onClick={() => setActiveTab('debt')}
            >
              💰 Deuda y Abonos
            </button>
          )}
        </div>

        {/* Contenido de las pestañas */}
        <div className="customer-modal-body">
          {activeTab === 'info' && (
            <CustomerInfoTab
              formData={formData}
              onInputChange={handleInputChange}
              onSave={handleSaveCustomer}
              onCancel={onClose}
              loading={loading}
            />
          )}

          {activeTab === 'debt' && mode === 'edit' && customer && (
            <DebtTab
              debtSummary={debtSummary}
              debtDetails={debtDetails}
              paymentAmount={paymentAmount}
              setPaymentAmount={setPaymentAmount}
              onRegisterPayment={handleRegisterPayment}
              processingPayment={processingPayment}
              formatCurrency={formatCurrency}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerModal;
import type { Product, Customer, SaleItem } from '@/types/types';

// Sales-specific types
export interface SalesScreenProps {
  saleItems: SaleItem[];
  setSaleItems: React.Dispatch<React.SetStateAction<SaleItem[]>>;
  onClearSale: () => void;
}

export interface PaymentViewProps {
  saleItems: SaleItem[];
  onClose: () => void;
  onSaleComplete: () => void;
}

export interface SaleItemsTableProps {
  saleItems: SaleItem[];
  onUpdateQuantity: (productId: string, newQuantity: number) => void;
  onRemoveItem: (productId: string) => void;
}

export interface SaleSummaryProps {
  saleItems: SaleItem[];
  isPaymentView?: boolean;
}

export interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  placeholder?: string;
}

export interface SearchResultsProps {
  searchTerm: string;
  onAddProduct: (product: Product) => void;
}

// Payment logic types
export interface PaymentSummary {
  subtotal: number;
  tax: number;
  total: number;
}

export interface UsePaymentLogicReturn {
  customers: Customer[];
  selectedCustomerId: string;
  receivedAmount: string;
  summary: PaymentSummary;
  setSelectedCustomerId: (id: string) => void;
  setReceivedAmount: (amount: string) => void;
  handleConfirmPurchase: () => Promise<void>;
}

// Product search types
export interface UseProductSearchReturn {
  products: Product[];
  filteredProducts: Product[];
  searchTerm: string;
  loading: boolean;
  setSearchTerm: (term: string) => void;
}

// Sale items logic types
export interface UseSaleItemsLogicReturn {
  addProduct: (product: Product) => void;
  updateQuantity: (productId: string, newQuantity: number) => void;
  removeItem: (productId: string) => void;
  clearSale: () => void;
}

// Sales logic types
export interface UseSalesLogicReturn {
  showPaymentView: boolean;
  setShowPaymentView: (show: boolean) => void;
  handleSaleComplete: () => void;
}

// Re-export for convenience
export type { Product, Customer, SaleItem };
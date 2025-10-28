import type { Product } from '@/types/types';

// Inventory-specific types
export type SortField = 'code' | 'name' | 'basePrice' | 'stock';
export type SortDirection = 'asc' | 'desc';

export interface UseInventoryDataReturn {
  // Estados principales
  products: Product[];
  filteredProducts: Product[];
  loading: boolean;
  
  // Estados de filtros
  searchTerm: string;
  showInactive: boolean;
  sortField: SortField;
  sortDirection: SortDirection;
  
  // Acciones
  setSearchTerm: (term: string) => void;
  setShowInactive: (show: boolean) => void;
  handleSort: (field: SortField) => void;
  loadProducts: () => Promise<void>;
  toggleProductStatus: (product: Product) => Promise<void>;
}

// Product Modal Types
export type ProductModalMode = 'create' | 'edit' | 'view';
export type TabType = 'general' | 'stock' | 'combos';

export interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  product?: Product | null;
  mode: 'create' | 'edit'; // Simplified for compatibility
}

export interface GeneralFormData {
  code: string;
  name: string;
  allowDecimalQuantity: boolean;
  isTaxable: boolean;
}

export interface StockFormData {
  quantityToMove: string;
  costPerUnit: string;
  newSalePrice: string;
  reason: string;
}

export interface ComboData {
  id: string;
  quantity: number;
  price: number;
  productName?: string;
}

export interface NewComboForm {
  quantity: string;
  price: string;
}

export interface EditComboForm {
  quantity: string;
  price: string;
}

// Re-export for convenience
export type { Product };
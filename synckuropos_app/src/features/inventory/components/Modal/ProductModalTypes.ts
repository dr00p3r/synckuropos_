import type {
  Product,
  TabType,
  GeneralFormData,
  StockFormData,
  ComboData,
  NewComboForm,
  EditComboForm
} from '../../types';

// Tab-specific component props
export interface GeneralInfoTabProps {
  formData: GeneralFormData;
  onInputChange: (field: string, value: any) => void;
  onCodeChange: (code: string) => Promise<void>;
  onSave: () => Promise<void>;
  loading: boolean;
  currentProduct: Product | null;
}

export interface StockAdjustmentTabProps {
  currentProduct: Product;
  stockData: StockFormData;
  onStockChange: (field: string, value: any) => void;
  onStockMovement: () => Promise<void>;
  loading: boolean;
}

export interface CombosTabProps {
  currentProduct: Product;
  combos: ComboData[];
  newCombo: NewComboForm;
  editingCombo: string | null;
  editComboData: EditComboForm;
  onNewComboChange: (field: string, value: string) => void;
  onEditComboChange: (field: string, value: string) => void;
  onAddCombo: () => Promise<void>;
  onEditCombo: (combo: ComboData) => void;
  onSaveEditCombo: () => Promise<void>;
  onCancelEditCombo: () => void;
  onDeleteCombo: (comboId: string) => Promise<void>;
}

export interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  hasProduct: boolean;
}
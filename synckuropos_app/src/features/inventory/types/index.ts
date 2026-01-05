import type { Product } from '@/types/types';

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

export type { Product };